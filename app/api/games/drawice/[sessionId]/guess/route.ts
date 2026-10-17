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
  const { guessText } = body;

  if (!guessText || !guessText.trim()) {
    return NextResponse.json({ error: 'Guess cannot be empty' }, { status: 400 });
  }

  try {
    const rounds = await query<any[]>(
      'SELECT round_id, round_number, artist_user_id, status FROM drawice_rounds WHERE session_id = ? ORDER BY round_number DESC LIMIT 1',
      [sessionId]
    );
    if (!rounds || rounds.length === 0) return NextResponse.json({ error: 'Round not found' }, { status: 404 });
    const round = rounds[0];

    if (round.status !== 'DRAWING') {
      return NextResponse.json({ error: 'Guessing is not open for this round' }, { status: 400 });
    }

    if (round.artist_user_id === authUser.userId) {
      return NextResponse.json({ error: 'The artist cannot submit guesses' }, { status: 403 });
    }

    const result = await DrawiceEngine.submitGuess(
      sessionId,
      round.round_number,
      authUser.userId,
      guessText
    );

    const io = (global as any).io;
    if (io) {
      io.to('session:' + sessionId).emit('drawice:guess_submitted', {
        sessionId,
        userId: authUser.userId,
        guesserName: authUser.displayName,
        isCorrect: result.isCorrect,
        sequence: result.sequence
      });

      // If all guessers finished, automatically resolve round
      if (result.allGuessersFinished) {
        await DrawiceEngine.endRoundAndScoreArtist(sessionId, round.round_number);
        io.to('session:' + sessionId).emit('drawice:round_reveal');
      }
    }

    return NextResponse.json({
      success: true,
      ...result
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
