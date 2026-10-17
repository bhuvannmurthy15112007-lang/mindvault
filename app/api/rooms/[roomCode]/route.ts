import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/mysql/db';

export async function GET(
  req: NextRequest,
  { params }: { params: { roomCode: string } }
) {
  const { roomCode } = params;

  try {
    const rooms = await query<any[]>(
      `SELECT r.*, g.game_code, g.game_name, g.min_players, g.description AS game_description,
              p.display_name AS host_name
       FROM game_rooms r
       JOIN games g ON r.game_id = g.game_id
       JOIN users u ON r.host_user_id = u.user_id
       JOIN user_profiles p ON u.user_id = p.user_id
       WHERE r.room_code = ?`,
      [roomCode.toUpperCase()]
    );

    if (!rooms || rooms.length === 0) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    const room = rooms[0];

    const players = await query<any[]>(
      `SELECT rp.room_player_id, rp.room_id, rp.user_id, rp.status, rp.is_ready, rp.joined_at,
              p.display_name, p.avatar_url,
              (rp.user_id = ?) AS is_host
       FROM room_players rp
       JOIN users u ON rp.user_id = u.user_id
       JOIN user_profiles p ON u.user_id = p.user_id
       WHERE rp.room_id = ? AND rp.status = 'JOINED'
       ORDER BY rp.joined_at ASC`,
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
