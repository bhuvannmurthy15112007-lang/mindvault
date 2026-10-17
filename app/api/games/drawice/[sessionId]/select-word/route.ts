import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/serverAuth';
import { query } from '@/lib/mysql/db';
import { DrawiceEngine } from '@/server/games/drawice/DrawiceEngine';

export async function POST(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  const authUser = await verifyAuth(req);
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sessionId = parseInt(params.sessionId, 10);
  const body = await req.json().catch(() => ({}));
  const { wordId } = body;

  if (!wordId) {
    return NextResponse.json({ error: 'wordId is required' }, { status: 400 });
  }

  try {
    const rounds = await query<any[]>(
      'SELECT round_number, artist_user_id, status FROM drawice_rounds WHERE session_id = ? ORDER BY round_number DESC LIMIT 1',
      [sessionId]
    );
    if (!rounds || rounds.length === 0) return NextResponse.json({ error: 'Round not found' }, { status: 404 });
    const round = rounds[0];

    if (round.artist_user_id !== authUser.userId) {
      return NextResponse.json({ error: 'Only the artist can choose the word' }, { status: 403 });
    }

    const result = await DrawiceEngine.selectWord(
      sessionId,
      round.round_number,
      authUser.userId,
      wordId
    );

    const io = (global as any).io;
    if (io) {
      io.to('session:' + sessionId).emit('drawice:word_chosen', {
        wordLength: result.wordLength
      });
    }

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
