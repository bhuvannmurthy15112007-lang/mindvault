import { NextRequest, NextResponse } from 'next/server';
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
      `SELECT r.room_id, r.room_code, r.game_id, r.case_id, r.difficulty, r.host_user_id, r.status, r.max_players, r.created_at,
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
       LIMIT 50`
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
  const { gameCode, maxPlayers, rounds, caseId, difficulty } = body;

  if (!gameCode) {
    return NextResponse.json({ error: 'gameCode is required' }, { status: 400 });
  }

  try {
    const gameRows = await query<any[]>('SELECT * FROM games WHERE game_code = ? AND is_active = TRUE', [gameCode]);
    if (!gameRows || gameRows.length === 0) {
      return NextResponse.json({ error: 'Invalid or inactive game' }, { status: 400 });
    }

    const game = gameRows[0];
    const effectiveMin = game.game_code === 'PREDICTION_ARENA' ? 2 : game.min_players;
    const roomMax = maxPlayers ? Math.min(Math.max(maxPlayers, effectiveMin), game.max_players) : game.max_players;

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
        'INSERT INTO game_rooms (room_code, game_id, case_id, difficulty, host_user_id, status, max_players) VALUES (?, ?, ?, ?, ?, "WAITING", ?)',
        [code, game.game_id, caseId || null, difficulty || (game.game_code === 'ESCAPE_ROOM' ? 'MEDIUM' : null), authUser.userId, roomMax]
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
