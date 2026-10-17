import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/serverAuth';
import { query } from '@/lib/mysql/db';
import { DetectiveEngine } from '@/server/games/detective/DetectiveEngine';

export async function GET(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  const authUser = await verifyAuth(req);
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sessionId = parseInt(params.sessionId, 10);

  try {
    const detSessions = await query<any[]>(
      `SELECT ds.*, c.title, c.synopsis, c.difficulty, c.investigation_budget, c.incident_location, c.incident_time
       FROM detective_sessions ds
       JOIN detective_cases c ON ds.case_id = c.case_id
       WHERE ds.session_id = ?`,
      [sessionId]
    );

    if (!detSessions || detSessions.length === 0) {
      return NextResponse.json({ error: 'Detective session not found' }, { status: 404 });
    }
    const detSession = detSessions[0];

    // Compute user-isolated remaining budget
    const [spentRows]: any = await query(
      'SELECT COALESCE(SUM(cost_deducted), 0) AS total_spent FROM detective_investigation_actions WHERE detective_session_id = ? AND user_id = ?',
      [detSession.detective_session_id, authUser.userId]
    );
    const userSpent = spentRows[0]?.total_spent || 0;
    const userRemainingBudget = Math.max(0, detSession.investigation_budget - userSpent);

    // Suspects without is_culprit flag (never leaked to frontend)
    const suspects = await query<any[]>(
      'SELECT suspect_id, name, occupation, background, alibi, avatar_url, interrogation_cost FROM detective_suspects WHERE case_id = ? ORDER BY suspect_id ASC',
      [detSession.case_id]
    );

    // Locations
    const locations = await query<any[]>(
      'SELECT location_id, name, description, action_cost, image_url FROM detective_locations WHERE case_id = ? ORDER BY location_id ASC',
      [detSession.case_id]
    );

    // Evidence without is_critical flag
    const evidence = await query<any[]>(
      'SELECT evidence_id, location_id, suspect_id, title, description, analysis_cost, image_url FROM detective_evidence WHERE case_id = ? ORDER BY evidence_id ASC',
      [detSession.case_id]
    );

    // Timeline events
    const timeline = await query<any[]>(
      'SELECT event_id, timestamp_label, event_description, is_verified FROM detective_timeline_events WHERE case_id = ? ORDER BY event_id ASC',
      [detSession.case_id]
    );

    // Puzzles without solution hashes or plaintext answers
    const puzzles = await query<any[]>(
      'SELECT puzzle_id, prompt, puzzle_type, hint, action_cost FROM detective_puzzles WHERE case_id = ? ORDER BY puzzle_id ASC',
      [detSession.case_id]
    );

    // Clues discovered by this user
    const discoveredClueRows = await query<any[]>(
      `SELECT c.clue_id, c.clue_text, c.deduction_notes, c.evidence_id, d.discovered_at 
       FROM detective_discoveries d 
       JOIN detective_clues c ON d.target_id = c.clue_id 
       WHERE d.detective_session_id = ? AND d.user_id = ? AND d.discovery_type = 'CLUE'`,
      [detSession.detective_session_id, authUser.userId]
    );

    // All discoveries for this user
    const myDiscoveries = await query<any[]>(
      'SELECT discovery_type, target_id, discovered_at FROM detective_discoveries WHERE detective_session_id = ? AND user_id = ? ORDER BY discovered_at DESC',
      [detSession.detective_session_id, authUser.userId]
    );

    // Investigation actions taken by this user
    const myActions = await query<any[]>(
      'SELECT action_id, action_type, target_id, cost_deducted, result_summary, created_at FROM detective_investigation_actions WHERE detective_session_id = ? AND user_id = ? ORDER BY action_id DESC',
      [detSession.detective_session_id, authUser.userId]
    );

    // Check if user submitted an accusation
    const myAccusationRows = await query<any[]>(
      'SELECT * FROM detective_accusations WHERE detective_session_id = ? AND user_id = ?',
      [detSession.detective_session_id, authUser.userId]
    );
    const myAccusation = myAccusationRows[0] || null;

    let solutionRevelation: any = null;
    if (myAccusation) {
      const solRows = await query<any[]>(
        `SELECT cs.*, s.name as culprit_name 
         FROM detective_case_solutions cs 
         JOIN detective_suspects s ON cs.culprit_suspect_id = s.suspect_id 
         WHERE cs.case_id = ?`,
        [detSession.case_id]
      );
      if (solRows && solRows.length > 0) {
        solutionRevelation = {
          culpritName: solRows[0].culprit_name,
          culpritSuspectId: solRows[0].culprit_suspect_id,
          motive: solRows[0].motive,
          criticalEvidenceSummary: solRows[0].critical_evidence_summary,
          explanation: solRows[0].explanation
        };
      }
    }

    // Session players list & accusation status
    const players = await query<any[]>(
      `SELECT sp.user_id, sp.final_score, sp.is_winner, p.display_name, p.avatar_url,
              (da.accusation_id IS NOT NULL) AS has_accused
       FROM session_players sp
       JOIN users u ON sp.user_id = u.user_id
       JOIN user_profiles p ON u.user_id = p.user_id
       LEFT JOIN detective_accusations da ON (da.detective_session_id = ? AND da.user_id = sp.user_id)
       WHERE sp.session_id = ?
       ORDER BY sp.final_score DESC, sp.session_player_id ASC`,
      [detSession.detective_session_id, sessionId]
    );

    return NextResponse.json({
      detectiveSession: {
        ...detSession,
        userRemainingBudget
      },
      suspects,
      locations,
      evidence,
      timeline,
      puzzles,
      discoveredClues: discoveredClueRows,
      myDiscoveries,
      myActions,
      myAccusation,
      solutionRevelation,
      players
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed: ' + err.message }, { status: 500 });
  }
}
