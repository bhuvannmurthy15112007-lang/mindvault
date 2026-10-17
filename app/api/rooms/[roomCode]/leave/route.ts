import { NextRequest, NextResponse } from 'next/server';
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
