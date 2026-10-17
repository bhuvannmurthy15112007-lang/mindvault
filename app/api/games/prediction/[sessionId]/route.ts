import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/serverAuth';
import { query } from '@/lib/mysql/db';
import { PredictionEngine } from '@/server/games/prediction/PredictionEngine';

export async function GET(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  const authUser = await verifyAuth(req);
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sessionId = parseInt(params.sessionId, 10);

  try {
    const sessions = await query<any[]>(
      'SELECT * FROM game_sessions WHERE session_id = ?',
      [sessionId]
    );
    if (!sessions || sessions.length === 0) return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    const session = sessions[0];

    const currentRounds = await query<any[]>(
      'SELECT * FROM prediction_rounds WHERE session_id = ? ORDER BY round_number DESC LIMIT 1',
      [sessionId]
    );

    let cr = currentRounds && currentRounds.length > 0 ? currentRounds[0] : null;
    let secondsRemaining = 0;

    if (cr) {
      if (cr.status === 'SUBMITTING') {
        const startTime = new Date(cr.created_at).getTime();
        const now = Date.now();
        const elapsedSeconds = Math.max(0, Math.floor((now - startTime) / 1000));
        secondsRemaining = Math.max(0, 30 - elapsedSeconds);

        // If 30 seconds have passed, resolve the round automatically
        if (elapsedSeconds >= 30) {
          await PredictionEngine.resolveRound(sessionId, cr.round_number);
          (global as any).io?.to('session:' + sessionId).emit('prediction:round_reveal');

          const updatedRounds = await query<any[]>(
            'SELECT * FROM prediction_rounds WHERE round_id = ?',
            [cr.round_id]
          );
          if (updatedRounds && updatedRounds.length > 0) {
            cr = updatedRounds[0];
          }
          secondsRemaining = 0;
        }
      } else {
        secondsRemaining = 0;
      }
    }

    let mySubmission = null;
    let roundSubmissions: any[] = [];
    if (cr) {
      const subs = await query<any[]>(
        `SELECT 
            sp.user_id,
            sp.final_score as cumulative_score,
            p.display_name,
            p.avatar_url,
            ps.submission_id,
            ps.chosen_number,
            ps.is_duplicate,
            ps.is_exact_target,
            ps.is_zero_one_hundred_win,
            ps.round_rank,
            ps.points_awarded,
            ps.penalty_points,
            (ps.submission_id IS NOT NULL) as has_submitted
         FROM session_players sp
         JOIN users u ON sp.user_id = u.user_id
         JOIN user_profiles p ON u.user_id = p.user_id
         LEFT JOIN prediction_submissions ps ON (ps.round_id = ? AND ps.user_id = sp.user_id)
         WHERE sp.session_id = ?
         ORDER BY 
           CASE WHEN ps.round_rank IS NOT NULL THEN ps.round_rank ELSE 999 END ASC,
           sp.final_score DESC`,
        [cr.round_id, sessionId]
      );

      mySubmission = subs.find(s => s.user_id === authUser.userId && s.has_submitted) || null;

      // Only reveal full choices if status is REVEALED or COMPLETED
      if (cr.status === 'REVEALED' || cr.status === 'COMPLETED') {
        roundSubmissions = subs;
      } else {
        // Obfuscate others during SUBMITTING
        roundSubmissions = subs.map(s => ({
          user_id: s.user_id,
          display_name: s.display_name,
          avatar_url: s.avatar_url,
          hasSubmitted: !!s.has_submitted
        }));
      }
    }

    const players = await query<any[]>(
      `SELECT sp.*, p.display_name, p.avatar_url
       FROM session_players sp
       JOIN users u ON sp.user_id = u.user_id
       JOIN user_profiles p ON u.user_id = p.user_id
       WHERE sp.session_id = ?
       ORDER BY sp.final_score DESC`,
      [sessionId]
    );

    return NextResponse.json({
      session,
      currentRound: cr,
      secondsRemaining,
      mySubmission,
      roundSubmissions,
      players
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed: ' + err.message }, { status: 500 });
  }
}
