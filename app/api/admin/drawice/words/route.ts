import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/serverAuth';
import { query } from '@/lib/mysql/db';

export async function GET(req: NextRequest) {
  const authUser = await verifyAuth(req);
  if (!authUser || !authUser.isAdmin) {
    return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  const words = await query<any[]>('SELECT * FROM drawice_words ORDER BY word_id DESC');
  return NextResponse.json({ words });
}

export async function POST(req: NextRequest) {
  const authUser = await verifyAuth(req);
  if (!authUser || !authUser.isAdmin) {
    return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const { word, category, difficulty } = body;

  if (!word) return NextResponse.json({ error: 'Word is required' }, { status: 400 });

  await query(
    'INSERT INTO drawice_words (word, category, difficulty) VALUES (?, ?, ?)',
    [word.trim(), category || 'General', difficulty || 'MEDIUM']
  );

  return NextResponse.json({ success: true, message: 'Word added.' });
}
