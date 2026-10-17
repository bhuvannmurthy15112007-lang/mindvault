import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/serverAuth';
import { withTransaction } from '@/lib/mysql/db';
import { ensureCoreTables } from '@/lib/mysql/ensureTables';

export async function POST(
  req: NextRequest,
  { params }: { params: { roomCode: string } }
) {
  const authUser = await verifyAuth(req);
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await ensureCoreTables();

  const { roomCode } = params;
  const body = await req.json().catch(() => ({}));
  const requestedRounds = body.rounds ? parseInt(body.rounds, 10) : 5;

  try {
    const sessionInfo = await withTransaction(async (conn) => {
      const [rooms]: any = await conn.execute(
        `SELECT r.*, g.game_code, g.min_players, g.max_players
         FROM game_rooms r
         JOIN games g ON r.game_id = g.game_id
         WHERE r.room_code = ? FOR UPDATE`,
        [roomCode.toUpperCase()]
      );

      if (!rooms || rooms.length === 0) {
        throw new Error('ROOM_NOT_FOUND');
      }

      const room = rooms[0];

      if (room.host_user_id !== authUser.userId) {
        throw new Error('ONLY_HOST_CAN_START');
      }

      if (room.status !== 'WAITING') {
        throw new Error('GAME_ALREADY_STARTED');
      }

      const [players]: any = await conn.execute(
        'SELECT user_id FROM room_players WHERE room_id = ? AND status = "JOINED"',
        [room.room_id]
      );

      const minRequired = room.game_code === 'PREDICTION_ARENA' ? 2 : room.min_players;
      if (!players || players.length < minRequired) {
        throw new Error('NOT_ENOUGH_PLAYERS');
      }

      // Prediction Arena: 2-10
      // Drawice: 2-10, host chooses 5 or more rounds
      // Detective: 1-10
      // Escape Room: 1-5
      const totalRounds = room.game_code === 'DRAWICE' ? Math.max(5, requestedRounds) : (room.game_code === 'PREDICTION_ARENA' ? Math.min(Math.max(5, requestedRounds), 10) : 1);

      // 1. Create Game Session
      const [sessRes]: any = await conn.execute(
        'INSERT INTO game_sessions (room_id, game_id, total_rounds, current_round, status, started_at) VALUES (?, ?, ?, 1, "IN_PROGRESS", CURRENT_TIMESTAMP)',
        [room.room_id, room.game_id, totalRounds]
      );
      const sessionId = sessRes.insertId;

      // 2. Set Room Status STARTED
      await conn.execute('UPDATE game_rooms SET status = "STARTED" WHERE room_id = ?', [room.room_id]);

      // 3. Register Session Players
      for (const p of players) {
        await conn.execute(
          'INSERT INTO session_players (session_id, user_id, final_score, is_winner) VALUES (?, ?, 0.00, FALSE)',
          [sessionId, p.user_id]
        );
      }

      // 4. Initialize Game Specific Sub-Engine in Database
      if (room.game_code === 'PREDICTION_ARENA') {
        await conn.execute(
          'INSERT INTO prediction_rounds (session_id, round_number, status) VALUES (?, 1, "SUBMITTING")',
          [sessionId]
        );
      } else if (room.game_code === 'DETECTIVE') {
        const targetCaseId = body.caseId ? parseInt(body.caseId, 10) : (room.case_id || null);
        let caseId = targetCaseId;
        let budget = 100;
        if (targetCaseId) {
          const [found]: any = await conn.execute(
            'SELECT case_id, investigation_budget FROM detective_cases WHERE case_id = ? AND is_active = TRUE',
            [targetCaseId]
          );
          if (found && found.length > 0) {
            caseId = found[0].case_id;
            budget = found[0].investigation_budget;
          }
        }
        if (!caseId) {
          const [cases]: any = await conn.execute(
            'SELECT case_id, investigation_budget FROM detective_cases WHERE is_active = TRUE ORDER BY case_id ASC LIMIT 1'
          );
          caseId = cases[0]?.case_id || 1;
          budget = cases[0]?.investigation_budget || 100;
        }
        await conn.execute(
          'INSERT INTO detective_sessions (session_id, case_id, remaining_budget, status) VALUES (?, ?, ?, "INVESTIGATING")',
          [sessionId, caseId, budget]
        );
      } else if (room.game_code === 'ESCAPE_ROOM') {
        const targetDifficulty = (body.difficulty || room.difficulty || 'MEDIUM').toUpperCase();
        const [scenarios]: any = await conn.execute(
          'SELECT scenario_id, time_limit_seconds, difficulty FROM escape_scenarios WHERE difficulty = ? AND is_active = TRUE ORDER BY scenario_id ASC LIMIT 1',
          [targetDifficulty]
        );
        let activeScen = scenarios && scenarios.length > 0 ? scenarios[0] : null;
        if (!activeScen) {
          const [fallbackScen]: any = await conn.execute(
            'SELECT scenario_id, time_limit_seconds, difficulty FROM escape_scenarios WHERE is_active = TRUE ORDER BY scenario_id ASC LIMIT 1'
          );
          activeScen = fallbackScen && fallbackScen.length > 0 ? fallbackScen[0] : { scenario_id: 1, time_limit_seconds: 600, difficulty: 'MEDIUM' };
        }
        const scenId = activeScen.scenario_id;
        const timeLimit = activeScen.time_limit_seconds || 600;
        const finalDifficulty = activeScen.difficulty || targetDifficulty;

        const [roomsList]: any = await conn.execute(
          'SELECT escape_room_id FROM escape_rooms WHERE scenario_id = ? ORDER BY sequence_order ASC LIMIT 1',
          [scenId]
        );
        const initialRoomId = roomsList[0]?.escape_room_id || 1;

        const [escSessRes]: any = await conn.execute(
          'INSERT INTO escape_sessions (session_id, scenario_id, difficulty, current_room_id, hints_remaining, time_remaining_seconds, status) VALUES (?, ?, ?, ?, 2, ?, "ACTIVE")',
          [sessionId, scenId, finalDifficulty, initialRoomId, timeLimit]
        );
        for (const p of players) {
          await conn.execute(
            'INSERT INTO escape_session_players (escape_session_id, user_id) VALUES (?, ?)',
            [escSessRes.insertId, p.user_id]
          );
        }
      } else if (room.game_code === 'DRAWICE') {
        // Pick 3 random words for first round artist
        const [words]: any = await conn.execute(
          'SELECT word_id, word, category, difficulty FROM drawice_words WHERE is_active = TRUE ORDER BY RAND() LIMIT 3'
        );
        const artistId = players[0].user_id; // First player is first artist in rotation
        const wordOptions = words.map((w: any) => ({
          id: w.word_id,
          word: w.word,
          category: w.category,
          difficulty: w.difficulty
        }));

        await conn.execute(
          'INSERT INTO drawice_rounds (session_id, round_number, artist_user_id, word_options_json, status, time_limit_seconds, started_at) VALUES (?, 1, ?, ?, "CHOOSING", 60, CURRENT_TIMESTAMP)',
          [sessionId, artistId, JSON.stringify(wordOptions)]
        );
      }

      return {
        sessionId,
        gameCode: room.game_code,
        roomCode: room.room_code
      };
    });

    return NextResponse.json({ success: true, ...sessionInfo });
  } catch (err: any) {
    if (err.message === 'ONLY_HOST_CAN_START') {
      return NextResponse.json({ error: 'Only the room host can launch the game.' }, { status: 403 });
    }
    if (err.message === 'NOT_ENOUGH_PLAYERS') {
      return NextResponse.json({ error: 'Not enough players have joined to start this game.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to start game: ' + err.message }, { status: 500 });
  }
}
