import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/mysql/db';
import { ensureCoreTables } from '@/lib/mysql/ensureTables';

export async function GET(req: NextRequest) {
  try {
    await ensureCoreTables();
    const { searchParams } = new URL(req.url);
    const gameCode = searchParams.get('game');

    if (gameCode) {
      const rows = await query(
        'SELECT * FROM v_game_leaderboards WHERE game_code = ? ORDER BY game_rank ASC LIMIT 100',
        [gameCode]
      );
      return NextResponse.json({ leaderboard: rows });
    }

    const rows = await query('SELECT * FROM v_overall_leaderboard ORDER BY global_rank ASC LIMIT 100');
    return NextResponse.json({ leaderboard: rows });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to query leaderboard: ' + err.message }, { status: 500 });
  }
}
