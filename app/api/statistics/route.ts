import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/serverAuth';
import { query } from '@/lib/mysql/db';

export async function GET(req: NextRequest) {
  try {
    const authUser = await verifyAuth(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const gameCode = searchParams.get('game');

    // 1. Overall stats for user
    const stats = await query<any[]>(
      `SELECT pgs.*, g.game_code, g.game_name
       FROM player_game_statistics pgs
       JOIN games g ON pgs.game_id = g.game_id
       WHERE pgs.user_id = ? ${gameCode ? 'AND g.game_code = ?' : ''}`,
      gameCode ? [authUser.userId, gameCode] : [authUser.userId]
    );

    // 2. Recent match history
    const history = await query<any[]>(
      `SELECT sp.final_score, sp.final_rank, sp.is_winner, sp.joined_at,
              gs.session_id, gs.status, gs.started_at, gs.completed_at,
              g.game_code, g.game_name,
              gr.room_code
       FROM session_players sp
       JOIN game_sessions gs ON sp.session_id = gs.session_id
       JOIN games g ON gs.game_id = g.game_id
       LEFT JOIN game_rooms gr ON gs.room_id = gr.room_id
       WHERE sp.user_id = ?
       ORDER BY gs.completed_at DESC, sp.joined_at DESC
       LIMIT 20`,
      [authUser.userId]
    );

    return NextResponse.json({ stats, history });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
