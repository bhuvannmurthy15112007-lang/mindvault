import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/serverAuth';
import { query } from '@/lib/mysql/db';

export async function GET(req: NextRequest) {
  const authUser = await verifyAuth(req);
  if (!authUser || !authUser.isAdmin) {
    return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  const achievements = await query<any[]>('SELECT * FROM achievements ORDER BY achievement_id ASC');
  return NextResponse.json({ achievements });
}

export async function POST(req: NextRequest) {
  const authUser = await verifyAuth(req);
  if (!authUser || !authUser.isAdmin) {
    return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const { name, description, iconUrl, requirementType, requirementValue, gameId } = body;

  await query(
    'INSERT INTO achievements (name, description, icon_url, requirement_type, requirement_value, game_id) VALUES (?, ?, ?, ?, ?, ?)',
    [name, description, iconUrl || '/icons/default.svg', requirementType, requirementValue || 1, gameId || null]
  );

  return NextResponse.json({ success: true, message: 'Achievement created.' });
}
