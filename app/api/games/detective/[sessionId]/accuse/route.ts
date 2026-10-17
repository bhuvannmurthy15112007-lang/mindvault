import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/serverAuth';
import { query } from '@/lib/mysql/db';
import { DetectiveEngine } from '@/server/games/detective/DetectiveEngine';

export async function POST(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  const authUser = await verifyAuth(req);
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sessionId = parseInt(params.sessionId, 10);
  const body = await req.json().catch(() => ({}));
  const { suspectId, motive, evidenceId, reasoning } = body;

  if (!suspectId || !motive || !evidenceId || !reasoning) {
    return NextResponse.json(
      { error: 'All accusation fields are required: suspectId, motive, evidenceId, and reasoning' },
      { status: 400 }
    );
  }

  try {
    const detSess = await query<any[]>(
      'SELECT detective_session_id FROM detective_sessions WHERE session_id = ?',
      [sessionId]
    );
    if (!detSess || detSess.length === 0) {
      return NextResponse.json({ error: 'Detective session not found' }, { status: 404 });
    }

    const result = await DetectiveEngine.submitAccusation(
      detSess[0].detective_session_id,
      authUser.userId,
      parseInt(suspectId, 10),
      motive,
      parseInt(evidenceId, 10),
      reasoning
    );

    const io = (global as any).io;
    if (io) {
      io.to('session:' + sessionId).emit('detective:player_accused', {
        userId: authUser.userId,
        displayName: authUser.displayName,
        isCorrect: result.isCorrect,
        finalScore: result.finalScore
      });
    }

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
