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
  const { actionType, targetId, answer } = body;

  if (!actionType || !targetId) {
    return NextResponse.json({ error: 'actionType and targetId are required' }, { status: 400 });
  }

  try {
    const detSess = await query<any[]>(
      'SELECT detective_session_id FROM detective_sessions WHERE session_id = ?',
      [sessionId]
    );
    if (!detSess || detSess.length === 0) {
      return NextResponse.json({ error: 'Detective session not found' }, { status: 404 });
    }

    const result = await DetectiveEngine.executeAction(
      detSess[0].detective_session_id,
      authUser.userId,
      actionType,
      targetId,
      answer
    );

    // Notify session room that an investigation action was conducted
    const io = (global as any).io;
    if (io) {
      io.to('session:' + sessionId).emit('detective:action_taken', {
        userId: authUser.userId,
        displayName: authUser.displayName,
        actionType,
        remainingBudget: result.remainingBudget
      });
    }

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
