import { NextRequest, NextResponse } from 'next/server';
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
        `INSERT INTO room_players (room_id, user_id, status, is_ready)
         VALUES (?, ?, "JOINED", FALSE)
         ON DUPLICATE KEY UPDATE status = "JOINED", is_ready = FALSE, updated_at = CURRENT_TIMESTAMP`,
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
