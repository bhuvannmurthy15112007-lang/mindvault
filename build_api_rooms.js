const fs = require('fs');
const path = require('path');

// 1. /api/rooms
const roomsRoute = `import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/serverAuth';
import { query, withTransaction } from '@/lib/mysql/db';

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function GET() {
  try {
    const rooms = await query<any[]>(
      \`SELECT r.room_id, r.room_code, r.game_id, r.host_user_id, r.status, r.max_players, r.created_at,
              g.game_code, g.game_name, g.min_players,
              p.display_name AS host_name,
              COUNT(rp.user_id) AS current_players
       FROM game_rooms r
       JOIN games g ON r.game_id = g.game_id
       JOIN users u ON r.host_user_id = u.user_id
       JOIN user_profiles p ON u.user_id = p.user_id
       LEFT JOIN room_players rp ON r.room_id = rp.room_id AND rp.status = 'JOINED'
       WHERE r.status = 'WAITING'
       GROUP BY r.room_id, g.game_id, p.display_name
       ORDER BY r.created_at DESC
       LIMIT 50\`
    );
    return NextResponse.json({ rooms });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to retrieve rooms: ' + err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authUser = await verifyAuth(req);
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { gameCode, maxPlayers, rounds } = body;

  if (!gameCode) {
    return NextResponse.json({ error: 'gameCode is required' }, { status: 400 });
  }

  try {
    const gameRows = await query<any[]>('SELECT * FROM games WHERE game_code = ? AND is_active = TRUE', [gameCode]);
    if (!gameRows || gameRows.length === 0) {
      return NextResponse.json({ error: 'Invalid or inactive game' }, { status: 400 });
    }

    const game = gameRows[0];
    const roomMax = maxPlayers ? Math.min(Math.max(maxPlayers, game.min_players), game.max_players) : game.max_players;

    const result = await withTransaction(async (conn) => {
      let code = '';
      let isUnique = false;
      let attempts = 0;

      while (!isUnique && attempts < 10) {
        code = generateRoomCode();
        const [existing]: any = await conn.execute('SELECT room_id FROM game_rooms WHERE room_code = ?', [code]);
        if (!existing || existing.length === 0) {
          isUnique = true;
        }
        attempts++;
      }

      if (!isUnique) {
        throw new Error('Unable to generate unique room code');
      }

      const [roomRes]: any = await conn.execute(
        'INSERT INTO game_rooms (room_code, game_id, host_user_id, status, max_players) VALUES (?, ?, ?, "WAITING", ?)',
        [code, game.game_id, authUser.userId, roomMax]
      );
      const roomId = roomRes.insertId;

      await conn.execute(
        'INSERT INTO room_players (room_id, user_id, status, is_ready) VALUES (?, ?, "JOINED", TRUE)',
        [roomId, authUser.userId]
      );

      return { roomId, roomCode: code };
    });

    return NextResponse.json({ success: true, roomCode: result.roomCode, roomId: result.roomId });
  } catch (err: any) {
    return NextResponse.json({ error: 'Room creation failed: ' + err.message }, { status: 500 });
  }
}
`;
fs.writeFileSync(path.join(__dirname, 'app', 'api', 'rooms', 'route.ts'), roomsRoute);

// 2. /api/rooms/[roomCode]
const roomCodeDir = path.join(__dirname, 'app', 'api', 'rooms', '[roomCode]');
if (!fs.existsSync(roomCodeDir)) fs.mkdirSync(roomCodeDir, { recursive: true });

const roomDetailRoute = `import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/mysql/db';

export async function GET(
  req: NextRequest,
  { params }: { params: { roomCode: string } }
) {
  const { roomCode } = params;

  try {
    const rooms = await query<any[]>(
      \`SELECT r.*, g.game_code, g.game_name, g.min_players, g.description AS game_description,
              p.display_name AS host_name
       FROM game_rooms r
       JOIN games g ON r.game_id = g.game_id
       JOIN users u ON r.host_user_id = u.user_id
       JOIN user_profiles p ON u.user_id = p.user_id
       WHERE r.room_code = ?\`,
      [roomCode.toUpperCase()]
    );

    if (!rooms || rooms.length === 0) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    const room = rooms[0];

    const players = await query<any[]>(
      \`SELECT rp.room_player_id, rp.room_id, rp.user_id, rp.status, rp.is_ready, rp.joined_at,
              p.display_name, p.avatar_url,
              (rp.user_id = ?) AS is_host
       FROM room_players rp
       JOIN users u ON rp.user_id = u.user_id
       JOIN user_profiles p ON u.user_id = p.user_id
       WHERE rp.room_id = ? AND rp.status = 'JOINED'
       ORDER BY rp.joined_at ASC\`,
      [room.host_user_id, room.room_id]
    );

    // Also check if there is an active session
    const sessions = await query<any[]>(
      'SELECT session_id, status, current_round, total_rounds FROM game_sessions WHERE room_id = ?',
      [room.room_id]
    );

    return NextResponse.json({
      room: {
        ...room,
        players,
        session: sessions[0] || null
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to retrieve room details: ' + err.message }, { status: 500 });
  }
}
`;
fs.writeFileSync(path.join(roomCodeDir, 'route.ts'), roomDetailRoute);

// 3. /api/rooms/[roomCode]/join
const joinRoute = `import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/serverAuth';
import { query, withTransaction } from '@/lib/mysql/db';

export async function POST(
  req: NextRequest,
  { params }: { params: { roomCode: string } }
) {
  const authUser = await verifyAuth(req);
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { roomCode } = params;

  try {
    const result = await withTransaction(async (conn) => {
      const [rooms]: any = await conn.execute(
        'SELECT r.*, g.min_players, g.max_players as game_max FROM game_rooms r JOIN games g ON r.game_id = g.game_id WHERE r.room_code = ? FOR UPDATE',
        [roomCode.toUpperCase()]
      );

      if (!rooms || rooms.length === 0) {
        throw new Error('ROOM_NOT_FOUND');
      }

      const room = rooms[0];
      if (room.status !== 'WAITING') {
        throw new Error('GAME_ALREADY_STARTED');
      }

      const [players]: any = await conn.execute(
        'SELECT user_id, status FROM room_players WHERE room_id = ? AND status = "JOINED"',
        [room.room_id]
      );

      const alreadyJoined = players.some((p: any) => p.user_id === authUser.userId);
      if (!alreadyJoined && players.length >= room.max_players) {
        throw new Error('ROOM_FULL');
      }

      await conn.execute(
        \`INSERT INTO room_players (room_id, user_id, status, is_ready)
         VALUES (?, ?, "JOINED", FALSE)
         ON DUPLICATE KEY UPDATE status = "JOINED", is_ready = FALSE, updated_at = CURRENT_TIMESTAMP\`,
        [room.room_id, authUser.userId]
      );

      return { roomId: room.room_id, roomCode: room.room_code };
    });

    return NextResponse.json({ success: true, ...result });
  } catch (err: any) {
    if (err.message === 'ROOM_NOT_FOUND') {
      return NextResponse.json({ error: 'Room not found with that code.' }, { status: 404 });
    }
    if (err.message === 'GAME_ALREADY_STARTED') {
      return NextResponse.json({ error: 'Game has already started in this room.' }, { status: 400 });
    }
    if (err.message === 'ROOM_FULL') {
      return NextResponse.json({ error: 'This game room is already full.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to join room: ' + err.message }, { status: 500 });
  }
}
`;
fs.writeFileSync(path.join(__dirname, 'app', 'api', 'rooms', '[roomCode]', 'join', 'route.ts'), joinRoute);

// 4. /api/rooms/[roomCode]/leave
const leaveRoute = `import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/serverAuth';
import { withTransaction } from '@/lib/mysql/db';

export async function POST(
  req: NextRequest,
  { params }: { params: { roomCode: string } }
) {
  const authUser = await verifyAuth(req);
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { roomCode } = params;

  try {
    await withTransaction(async (conn) => {
      const [rooms]: any = await conn.execute(
        'SELECT room_id, host_user_id, status FROM game_rooms WHERE room_code = ? FOR UPDATE',
        [roomCode.toUpperCase()]
      );

      if (!rooms || rooms.length === 0) return;
      const room = rooms[0];

      await conn.execute(
        'UPDATE room_players SET status = "LEFT" WHERE room_id = ? AND user_id = ?',
        [room.room_id, authUser.userId]
      );

      // Check remaining players
      const [remaining]: any = await conn.execute(
        'SELECT user_id FROM room_players WHERE room_id = ? AND status = "JOINED" ORDER BY joined_at ASC',
        [room.room_id]
      );

      if (!remaining || remaining.length === 0) {
        await conn.execute('UPDATE game_rooms SET status = "CANCELLED" WHERE room_id = ?', [room.room_id]);
      } else if (room.host_user_id === authUser.userId) {
        // Reassign host to oldest remaining player
        await conn.execute(
          'UPDATE game_rooms SET host_user_id = ? WHERE room_id = ?',
          [remaining[0].user_id, room.room_id]
        );
      }
    });

    return NextResponse.json({ success: true, message: 'Left room successfully.' });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to leave room: ' + err.message }, { status: 500 });
  }
}
`;
fs.writeFileSync(path.join(__dirname, 'app', 'api', 'rooms', '[roomCode]', 'leave', 'route.ts'), leaveRoute);

// 5. /api/rooms/[roomCode]/start
const startRoute = `import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/serverAuth';
import { withTransaction } from '@/lib/mysql/db';

export async function POST(
  req: NextRequest,
  { params }: { params: { roomCode: string } }
) {
  const authUser = await verifyAuth(req);
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { roomCode } = params;
  const body = await req.json().catch(() => ({}));
  const requestedRounds = body.rounds ? parseInt(body.rounds, 10) : 5;

  try {
    const sessionInfo = await withTransaction(async (conn) => {
      const [rooms]: any = await conn.execute(
        \`SELECT r.*, g.game_code, g.min_players, g.max_players
         FROM game_rooms r
         JOIN games g ON r.game_id = g.game_id
         WHERE r.room_code = ? FOR UPDATE\`,
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

      if (!players || players.length < room.min_players) {
        throw new Error('NOT_ENOUGH_PLAYERS');
      }

      // Prediction Arena: 5-10
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
        // Find default medium case
        const [cases]: any = await conn.execute('SELECT case_id, investigation_budget FROM detective_cases WHERE is_active = TRUE ORDER BY case_id ASC LIMIT 1');
        const caseId = cases[0]?.case_id || 1;
        const budget = cases[0]?.investigation_budget || 100;
        await conn.execute(
          'INSERT INTO detective_sessions (session_id, case_id, remaining_budget, status) VALUES (?, ?, ?, "INVESTIGATING")',
          [sessionId, caseId, budget]
        );
      } else if (room.game_code === 'ESCAPE_ROOM') {
        const [scenarios]: any = await conn.execute('SELECT scenario_id FROM escape_scenarios WHERE is_active = TRUE ORDER BY scenario_id ASC LIMIT 1');
        const scenId = scenarios[0]?.scenario_id || 1;
        const [roomsList]: any = await conn.execute('SELECT escape_room_id FROM escape_rooms WHERE scenario_id = ? ORDER BY sequence_order ASC LIMIT 1', [scenId]);
        const initialRoomId = roomsList[0]?.escape_room_id || 1;

        const [escSessRes]: any = await conn.execute(
          'INSERT INTO escape_sessions (session_id, scenario_id, current_room_id, hints_remaining, time_remaining_seconds, status) VALUES (?, ?, ?, 2, 1800, "ACTIVE")',
          [sessionId, scenId, initialRoomId]
        );
        for (const p of players) {
          await conn.execute(
            'INSERT INTO escape_session_players (escape_session_id, user_id) VALUES (?, ?)',
            [escSessRes.insertId, p.user_id]
          );
        }
      } else if (room.game_code === 'DRAWICE') {
        // Pick 3 random words for first round artist
        const [words]: any = await conn.execute('SELECT word_id, word FROM drawice_words WHERE is_active = TRUE ORDER BY RAND() LIMIT 3');
        const artistId = players[0].user_id; // First player is first artist in rotation
        const wordOptions = words.map((w: any) => ({ id: w.word_id, word: w.word }));

        await conn.execute(
          'INSERT INTO drawice_rounds (session_id, round_number, artist_user_id, word_options_json, status) VALUES (?, 1, ?, ?, "CHOOSING")',
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
`;
fs.writeFileSync(path.join(__dirname, 'app', 'api', 'rooms', '[roomCode]', 'start', 'route.ts'), startRoute);

console.log('Room & Session APIs generated successfully.');
