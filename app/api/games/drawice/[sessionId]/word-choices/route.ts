import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/serverAuth';
import { query } from '@/lib/mysql/db';

export async function GET(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  const authUser = await verifyAuth(req);
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sessionId = parseInt(params.sessionId, 10);

  try {
    const rounds = await query<any[]>(
      'SELECT artist_user_id, word_options_json, status FROM drawice_rounds WHERE session_id = ? ORDER BY round_number DESC LIMIT 1',
      [sessionId]
    );
    if (!rounds || rounds.length === 0) return NextResponse.json({ error: 'Round not found' }, { status: 404 });
    const round = rounds[0];

    if (round.artist_user_id !== authUser.userId) {
      return NextResponse.json({ error: 'Only artist can view word choices' }, { status: 403 });
    }

    let choices = [];
    if (round.word_options_json) {
      choices = typeof round.word_options_json === 'string'
        ? JSON.parse(round.word_options_json)
        : round.word_options_json;
    }

    return NextResponse.json({ choices });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
