import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/serverAuth';
import { query } from '@/lib/mysql/db';

export async function GET(req: NextRequest) {
  const authUser = await verifyAuth(req);
  if (!authUser || !authUser.isAdmin) {
    return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  const scenarios = await query<any[]>('SELECT * FROM escape_scenarios ORDER BY scenario_id ASC');
  return NextResponse.json({ scenarios });
}

export async function POST(req: NextRequest) {
  const authUser = await verifyAuth(req);
  if (!authUser || !authUser.isAdmin) {
    return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const { title, themeDescription, timeLimitSeconds, difficulty } = body;

  const result: any = await query(
    'INSERT INTO escape_scenarios (title, theme_description, time_limit_seconds, difficulty) VALUES (?, ?, ?, ?)',
    [title, themeDescription, timeLimitSeconds || 600, difficulty || 'MEDIUM']
  );

  return NextResponse.json({ success: true, scenarioId: result.insertId });
}
