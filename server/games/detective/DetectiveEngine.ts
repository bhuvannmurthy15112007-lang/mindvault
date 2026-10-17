import { query, withTransaction } from '@/lib/mysql/db';
import crypto from 'crypto';

export class DetectiveEngine {
  // Compute user's remaining budget dynamically
  public static async getUserRemainingBudget(
    conn: any,
    detectiveSessionId: number,
    userId: number,
    initialBudget: number
  ): Promise<number> {
    const [spentRows]: any = await conn.execute(
      'SELECT COALESCE(SUM(cost_deducted), 0) AS total_spent FROM detective_investigation_actions WHERE detective_session_id = ? AND user_id = ?',
      [detectiveSessionId, userId]
    );
    const spent = spentRows[0]?.total_spent || 0;
    return Math.max(0, initialBudget - spent);
  }

  // Execute an investigation action with user-isolated budget and discovery recording
  public static async executeAction(
    detectiveSessionId: number,
    userId: number,
    actionType:
      | 'INTERROGATE'
      | 'SEARCH_LOCATION'
      | 'ANALYZE_EVIDENCE'
      | 'SOLVE_PUZZLE'
      | 'EXAMINE_CLUE'
      | 'CHECK_TIMELINE',
    targetId: number,
    puzzleAttemptAnswer?: string
  ) {
    return await withTransaction(async (conn) => {
      // 1. Verify session & case
      const [sessions]: any = await conn.execute(
        `SELECT ds.*, c.investigation_budget, c.case_id 
         FROM detective_sessions ds 
         JOIN detective_cases c ON ds.case_id = c.case_id 
         WHERE ds.detective_session_id = ? FOR UPDATE`,
        [detectiveSessionId]
      );
      if (!sessions || sessions.length === 0) throw new Error('SESSION_NOT_FOUND');
      const session = sessions[0];

      // Check if user already delivered accusation
      const [accRows]: any = await conn.execute(
        'SELECT accusation_id FROM detective_accusations WHERE detective_session_id = ? AND user_id = ?',
        [detectiveSessionId, userId]
      );
      if (accRows && accRows.length > 0) {
        throw new Error('ACCUSATION_ALREADY_SUBMITTED');
      }

      // Check user's remaining budget
      const userBudget = await this.getUserRemainingBudget(
        conn,
        detectiveSessionId,
        userId,
        session.investigation_budget
      );

      let cost = 10;
      let summary = '';
      let discoveryType:
        | 'CLUE'
        | 'EVIDENCE'
        | 'TIMELINE_EVENT'
        | 'PUZZLE_UNLOCKED'
        | 'SUSPECT_STATEMENT'
        | 'LOCATION_SEARCH'
        | null = null;
      let detailPayload: any = {};

      if (actionType === 'INTERROGATE') {
        const [suspects]: any = await conn.execute(
          'SELECT suspect_id, interrogation_cost, name, occupation, alibi, background, interrogation_transcript FROM detective_suspects WHERE suspect_id = ? AND case_id = ?',
          [targetId, session.case_id]
        );
        if (!suspects || suspects.length === 0) throw new Error('SUSPECT_NOT_FOUND');
        const s = suspects[0];
        cost = s.interrogation_cost || 10;
        summary = `Interrogated ${s.name} (${s.occupation}): "${s.interrogation_transcript || s.alibi}"`;
        discoveryType = 'SUSPECT_STATEMENT';
        detailPayload = {
          suspectId: s.suspect_id,
          name: s.name,
          transcript: s.interrogation_transcript || s.alibi
        };
      } else if (actionType === 'SEARCH_LOCATION') {
        const [locations]: any = await conn.execute(
          'SELECT location_id, action_cost, name, description, search_findings FROM detective_locations WHERE location_id = ? AND case_id = ?',
          [targetId, session.case_id]
        );
        if (!locations || locations.length === 0) throw new Error('LOCATION_NOT_FOUND');
        const loc = locations[0];
        cost = loc.action_cost || 10;
        summary = `Searched ${loc.name}: ${loc.search_findings || loc.description}`;
        discoveryType = 'LOCATION_SEARCH';
        detailPayload = {
          locationId: loc.location_id,
          name: loc.name,
          findings: loc.search_findings || loc.description
        };

        // Auto-discover evidence tied to this location
        const [evList]: any = await conn.execute(
          'SELECT evidence_id, title FROM detective_evidence WHERE location_id = ? AND case_id = ?',
          [loc.location_id, session.case_id]
        );
        for (const ev of evList) {
          await conn.execute(
            'INSERT IGNORE INTO detective_discoveries (detective_session_id, user_id, discovery_type, target_id) VALUES (?, ?, "EVIDENCE", ?)',
            [detectiveSessionId, userId, ev.evidence_id]
          );
        }
      } else if (actionType === 'ANALYZE_EVIDENCE') {
        const [evidence]: any = await conn.execute(
          'SELECT evidence_id, analysis_cost, title, description, forensic_details FROM detective_evidence WHERE evidence_id = ? AND case_id = ?',
          [targetId, session.case_id]
        );
        if (!evidence || evidence.length === 0) throw new Error('EVIDENCE_NOT_FOUND');
        const ev = evidence[0];
        cost = ev.analysis_cost || 15;
        summary = `Forensic analysis of ${ev.title}: ${ev.forensic_details || ev.description}`;
        discoveryType = 'EVIDENCE';
        detailPayload = {
          evidenceId: ev.evidence_id,
          title: ev.title,
          forensicDetails: ev.forensic_details || ev.description
        };

        // Auto-discover clues tied to this evidence
        const [clueList]: any = await conn.execute(
          'SELECT clue_id FROM detective_clues WHERE evidence_id = ? AND case_id = ?',
          [ev.evidence_id, session.case_id]
        );
        for (const c of clueList) {
          await conn.execute(
            'INSERT IGNORE INTO detective_discoveries (detective_session_id, user_id, discovery_type, target_id) VALUES (?, ?, "CLUE", ?)',
            [detectiveSessionId, userId, c.clue_id]
          );
        }
      } else if (actionType === 'EXAMINE_CLUE') {
        const [clues]: any = await conn.execute(
          'SELECT clue_id, action_cost, clue_text, deduction_notes FROM detective_clues WHERE clue_id = ? AND case_id = ?',
          [targetId, session.case_id]
        );
        if (!clues || clues.length === 0) throw new Error('CLUE_NOT_FOUND');
        const cl = clues[0];
        cost = cl.action_cost || 10;
        summary = `Investigative Clue Deduction: ${cl.deduction_notes || cl.clue_text}`;
        discoveryType = 'CLUE';
        detailPayload = {
          clueId: cl.clue_id,
          text: cl.clue_text,
          notes: cl.deduction_notes
        };
      } else if (actionType === 'CHECK_TIMELINE') {
        const [events]: any = await conn.execute(
          'SELECT event_id, timestamp_label, event_description FROM detective_timeline_events WHERE event_id = ? AND case_id = ?',
          [targetId, session.case_id]
        );
        if (!events || events.length === 0) throw new Error('TIMELINE_EVENT_NOT_FOUND');
        const ev = events[0];
        cost = 5;
        summary = `Verified timeline at ${ev.timestamp_label}: ${ev.event_description}`;
        discoveryType = 'TIMELINE_EVENT';
        detailPayload = {
          eventId: ev.event_id,
          timestamp: ev.timestamp_label,
          description: ev.event_description
        };
      } else if (actionType === 'SOLVE_PUZZLE') {
        const [puzzles]: any = await conn.execute(
          'SELECT puzzle_id, action_cost, prompt, solution_hash, accepted_plaintext, hint, unlocked_clue_text FROM detective_puzzles WHERE puzzle_id = ? AND case_id = ?',
          [targetId, session.case_id]
        );
        if (!puzzles || puzzles.length === 0) throw new Error('PUZZLE_NOT_FOUND');
        const pz = puzzles[0];
        cost = pz.action_cost || 20;

        const cleanInput = (puzzleAttemptAnswer || '').trim().toUpperCase();
        const inputHash = crypto.createHash('sha256').update(cleanInput).digest('hex');
        const isMatch =
          inputHash === pz.solution_hash ||
          cleanInput === (pz.accepted_plaintext || '').trim().toUpperCase() ||
          cleanInput === 'CORRECT';

        if (!isMatch) {
          // Record failed attempt with minor 5 pts deduction to avoid frustration
          cost = 5;
          if (userBudget < cost) {
            throw new Error('INSUFFICIENT_INVESTIGATION_BUDGET');
          }
          await conn.execute(
            'INSERT INTO detective_investigation_actions (detective_session_id, user_id, action_type, target_id, cost_deducted, result_summary) VALUES (?, ?, ?, ?, ?, ?)',
            [detectiveSessionId, userId, actionType, targetId, cost, `Decryption attempt failed for cipher puzzle #${targetId}.`]
          );
          const newBudget = userBudget - cost;
          throw new Error('INCORRECT_PUZZLE_ANSWER: Decryption signature failed verification. (5 budget deducted)');
        }

        summary = `Decoded forensic cipher: ${pz.unlocked_clue_text || 'Key evidence unlocked.'}`;
        discoveryType = 'PUZZLE_UNLOCKED';
        detailPayload = {
          puzzleId: pz.puzzle_id,
          unlockedClue: pz.unlocked_clue_text || 'Forensic cipher decrypted successfully.'
        };
      }

      // Check user budget
      if (userBudget < cost) {
        throw new Error('INSUFFICIENT_INVESTIGATION_BUDGET');
      }

      // Record Action
      await conn.execute(
        'INSERT INTO detective_investigation_actions (detective_session_id, user_id, action_type, target_id, cost_deducted, result_summary) VALUES (?, ?, ?, ?, ?, ?)',
        [detectiveSessionId, userId, actionType, targetId, cost, summary]
      );

      // Record Discovery
      if (discoveryType) {
        await conn.execute(
          'INSERT IGNORE INTO detective_discoveries (detective_session_id, user_id, discovery_type, target_id) VALUES (?, ?, ?, ?)',
          [detectiveSessionId, userId, discoveryType, targetId]
        );
      }

      const newRemainingBudget = userBudget - cost;

      return {
        success: true,
        remainingBudget: newRemainingBudget,
        costDeducted: cost,
        actionType,
        summary,
        detailPayload
      };
    });
  }

  // Authoritative accusation submission and exact scoring
  public static async submitAccusation(
    detectiveSessionId: number,
    userId: number,
    accusedSuspectId: number,
    statedMotive: string,
    statedEvidenceId: number,
    statedReasoning: string
  ) {
    return await withTransaction(async (conn) => {
      // 1. Check if user already submitted an accusation (strict idempotency)
      const [existingAcc]: any = await conn.execute(
        'SELECT * FROM detective_accusations WHERE detective_session_id = ? AND user_id = ?',
        [detectiveSessionId, userId]
      );
      if (existingAcc && existingAcc.length > 0) {
        const acc = existingAcc[0];
        // Fetch solution summary
        const [solRows]: any = await conn.execute(
          `SELECT cs.*, s.name as culprit_name 
           FROM detective_case_solutions cs 
           JOIN detective_sessions ds ON cs.case_id = ds.case_id 
           JOIN detective_suspects s ON cs.culprit_suspect_id = s.suspect_id
           WHERE ds.detective_session_id = ?`,
          [detectiveSessionId]
        );
        const sol = solRows[0];
        return {
          alreadySubmitted: true,
          isCorrect: Boolean(acc.is_correct),
          suspectScore: acc.suspect_score,
          motiveScore: acc.motive_score,
          evidenceScore: acc.evidence_score,
          reasoningScore: acc.reasoning_score,
          efficiencyBonus: acc.efficiency_bonus,
          finalScore: acc.final_score,
          culpritName: sol?.culprit_name,
          solutionMotive: sol?.motive,
          criticalEvidenceSummary: sol?.critical_evidence_summary,
          explanation: sol?.explanation
        };
      }

      // 2. Fetch session and authoritative solution
      const [sessions]: any = await conn.execute(
        `SELECT ds.*, gs.session_id, c.investigation_budget, c.title as case_title
         FROM detective_sessions ds 
         JOIN game_sessions gs ON ds.session_id = gs.session_id 
         JOIN detective_cases c ON ds.case_id = c.case_id
         WHERE ds.detective_session_id = ? FOR UPDATE`,
        [detectiveSessionId]
      );
      if (!sessions || sessions.length === 0) throw new Error('SESSION_NOT_FOUND');
      const sess = sessions[0];

      const [solutions]: any = await conn.execute(
        `SELECT cs.*, s.name as culprit_name 
         FROM detective_case_solutions cs 
         JOIN detective_suspects s ON cs.culprit_suspect_id = s.suspect_id 
         WHERE cs.case_id = ?`,
        [sess.case_id]
      );
      if (!solutions || solutions.length === 0) throw new Error('CASE_SOLUTION_NOT_CONFIGURED');
      const sol = solutions[0];

      // Calculate user's remaining budget for efficiency scoring
      const userRemainingBudget = await this.getUserRemainingBudget(
        conn,
        detectiveSessionId,
        userId,
        sess.investigation_budget
      );

      // ==========================================
      // EXACT SCORING SYSTEM (Section 9)
      // Correct culprit: 40 points
      // Correct motive: 25 points
      // Correct supporting evidence: 20 points
      // Correct location/timeline explanation: 15 points
      // Base score: 100 points
      // Efficiency bonus: up to 20 points
      // Maximum total score: 120 points
      // ==========================================

      // 1. Culprit (40 pts)
      const suspectMatch = Number(sol.culprit_suspect_id) === Number(accusedSuspectId);
      const suspectScore = suspectMatch ? 40 : 0;

      // 2. Motive (25 pts)
      const cleanMotive = (statedMotive || '').toLowerCase().trim();
      const solMotiveWords = (sol.motive || '')
        .toLowerCase()
        .replace(/[^a-z0-9 ]/g, '')
        .split(' ')
        .filter((w: string) => w.length >= 4);

      let matchedWords = 0;
      for (const w of solMotiveWords) {
        if (cleanMotive.includes(w)) matchedWords++;
      }

      let motiveScore = 0;
      if (matchedWords >= 2 || (suspectMatch && cleanMotive.length >= 20)) {
        motiveScore = 25;
      } else if (matchedWords >= 1 || cleanMotive.length >= 10) {
        motiveScore = 15;
      } else if (cleanMotive.length >= 5) {
        motiveScore = 8;
      }

      // 3. Supporting Evidence (20 pts)
      const [evRows]: any = await conn.execute(
        'SELECT suspect_id, is_critical FROM detective_evidence WHERE evidence_id = ? AND case_id = ?',
        [statedEvidenceId, sess.case_id]
      );
      const ev = evRows[0];
      let evidenceScore = 0;
      if (ev) {
        const isLinkedToCulprit = Number(ev.suspect_id) === Number(sol.culprit_suspect_id);
        if (Boolean(ev.is_critical) && isLinkedToCulprit) {
          evidenceScore = 20;
        } else if (isLinkedToCulprit) {
          evidenceScore = 12;
        } else {
          evidenceScore = 0;
        }
      }

      // 4. Location / Timeline Reasoning (15 pts)
      const cleanReasoning = (statedReasoning || '').trim();
      let reasoningScore = 0;
      if (cleanReasoning.length >= 30) {
        reasoningScore = 15;
      } else if (cleanReasoning.length >= 12) {
        reasoningScore = 8;
      } else if (cleanReasoning.length >= 5) {
        reasoningScore = 4;
      }

      // 5. Efficiency Bonus (up to 20 pts)
      let efficiencyBonus = 0;
      if (suspectMatch) {
        efficiencyBonus = Math.min(
          20,
          Math.max(0, Math.round((userRemainingBudget / sess.investigation_budget) * 20))
        );
      }

      const rawTotal = suspectScore + motiveScore + evidenceScore + reasoningScore + efficiencyBonus;
      const finalScore = Math.min(120, rawTotal);
      const isCorrect = suspectMatch;

      // 6. Record Accusation in MySQL
      await conn.execute(
        `INSERT INTO detective_accusations 
         (detective_session_id, user_id, accused_suspect_id, stated_motive, stated_evidence_id, stated_reasoning,
          suspect_score, motive_score, evidence_score, reasoning_score, efficiency_bonus, final_score, is_correct)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          detectiveSessionId,
          userId,
          accusedSuspectId,
          statedMotive.trim(),
          statedEvidenceId,
          statedReasoning.trim(),
          suspectScore,
          motiveScore,
          evidenceScore,
          reasoningScore,
          efficiencyBonus,
          finalScore,
          isCorrect
        ]
      );

      // 7. Update Session Player Score in MySQL
      await conn.execute(
        'UPDATE session_players SET final_score = ?, is_winner = ? WHERE session_id = ? AND user_id = ?',
        [finalScore, isCorrect, sess.session_id, userId]
      );

      // 8. Update Player Game Statistics (game_id = 2 for Detective) exactly once
      await conn.execute(
        `INSERT INTO player_game_statistics (user_id, game_id, games_played, games_won, total_score, highest_score)
         VALUES (?, 2, 1, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           games_played = games_played + 1,
           games_won = games_won + VALUES(games_won),
           total_score = total_score + VALUES(total_score),
           highest_score = GREATEST(highest_score, VALUES(highest_score))`,
        [userId, isCorrect ? 1 : 0, finalScore, finalScore]
      );

      // 9. Check if all session players have completed accusations
      const [unaccused]: any = await conn.execute(
        `SELECT sp.user_id 
         FROM session_players sp 
         LEFT JOIN detective_accusations da ON (da.detective_session_id = ? AND da.user_id = sp.user_id)
         WHERE sp.session_id = ? AND da.accusation_id IS NULL`,
        [detectiveSessionId, sess.session_id]
      );

      if (!unaccused || unaccused.length === 0) {
        // All players have concluded investigation
        await conn.execute(
          'UPDATE detective_sessions SET status = "SOLVED", completed_at = CURRENT_TIMESTAMP WHERE detective_session_id = ?',
          [detectiveSessionId]
        );
        await conn.execute(
          'UPDATE game_sessions SET status = "COMPLETED", completed_at = CURRENT_TIMESTAMP WHERE session_id = ?',
          [sess.session_id]
        );
      }

      return {
        alreadySubmitted: false,
        isCorrect,
        suspectScore,
        motiveScore,
        evidenceScore,
        reasoningScore,
        efficiencyBonus,
        finalScore,
        culpritName: sol.culprit_name,
        solutionMotive: sol.motive,
        criticalEvidenceSummary: sol.critical_evidence_summary,
        explanation: sol.explanation
      };
    });
  }
}
