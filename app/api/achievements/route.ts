import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/serverAuth';
import { query } from '@/lib/mysql/db';
import { ensureCoreTables } from '@/lib/mysql/ensureTables';

export async function GET(req: NextRequest) {
  try {
    await ensureCoreTables();
    const authUser = await verifyAuth(req);

    const allAchievements = await query<any[]>(
      `SELECT a.*, g.game_name, g.game_code 
       FROM achievements a 
       LEFT JOIN games g ON a.game_id = g.game_id 
       WHERE a.is_active = TRUE 
       ORDER BY a.achievement_id ASC`
    );

    let userUnlockedIds: number[] = [];
    if (authUser) {
      const unlocked = await query<any[]>(
        'SELECT achievement_id, earned_at FROM user_achievements WHERE user_id = ?',
        [authUser.userId]
      );
      userUnlockedIds = unlocked.map(u => u.achievement_id);
    }

    const achievementsWithStatus = allAchievements.map(a => ({
      ...a,
      isUnlocked: userUnlockedIds.includes(a.achievement_id)
    }));

    return NextResponse.json({ achievements: achievementsWithStatus });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to retrieve achievements: ' + err.message }, { status: 500 });
  }
}
