import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/serverAuth';
import { query, withTransaction } from '@/lib/mysql/db';
import { PredictionEngine } from '@/server/games/prediction/PredictionEngine';

export async function POST(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  const authUser = await verifyAuth(req);
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sessionId = parseInt(params.sessionId, 10);
  const body = await req.json().catch(() => ({}));
  const chosenNumber = parseInt(body.chosenNumber, 10);

  if (isNaN(chosenNumber) || chosenNumber < 0 || chosenNumber > 100) {
    return NextResponse.json({ error: 'Must choose an integer between 0 and 100' }, { status: 400 });
  }

  try {
    const outcome = await withTransaction(async (conn) => {
      const [rounds]: any = await conn.execute(
        'SELECT * FROM prediction_rounds WHERE session_id = ? AND status = "SUBMITTING" ORDER BY round_number DESC LIMIT 1 FOR UPDATE',
        [sessionId]
      );
      if (!rounds || rounds.length === 0) throw new Error('NO_ACTIVE_SUBMISSION_PHASE');
      const round = rounds[0];

      // Insert or update submission
      await conn.execute(
        `INSERT INTO prediction_submissions (round_id, user_id, chosen_number)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE chosen_number = VALUES(chosen_number), submitted_at = CURRENT_TIMESTAMP`,
        [round.round_id, authUser.userId, chosenNumber]
      );

      // Check if all players in session have submitted
      const [totalPlayers]: any = await conn.execute(
        'SELECT COUNT(*) as cnt FROM session_players WHERE session_id = ?',
        [sessionId]
      );
      const [subsCount]: any = await conn.execute(
        'SELECT COUNT(*) as cnt FROM prediction_submissions WHERE round_id = ?',
        [round.round_id]
      );

      let isAllSubmitted = subsCount[0].cnt >= totalPlayers[0].cnt;
      return { roundNumber: round.round_number, isAllSubmitted };
    });

    if (outcome.isAllSubmitted) {
      await PredictionEngine.resolveRound(sessionId, outcome.roundNumber);
      (global as any).io?.to('session:' + sessionId).emit('prediction:round_reveal');
    }

    return NextResponse.json({ success: true, message: 'Prediction recorded.' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
