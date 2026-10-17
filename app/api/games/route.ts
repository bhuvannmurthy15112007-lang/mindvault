import { NextResponse } from 'next/server';
import { query } from '@/lib/mysql/db';

export async function GET() {
  try {
    const games = await query(
      'SELECT game_id, game_code, game_name, description, min_players, max_players, is_active FROM games WHERE is_active = TRUE ORDER BY game_id ASC'
    );
    return NextResponse.json({ games });
  } catch (err: any) {
    return NextResponse.json({ error: 'Database connection failed: ' + err.message }, { status: 500 });
  }
}
