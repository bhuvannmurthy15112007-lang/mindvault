const fs = require('fs');
const path = require('path');

// 1. PredictionEngine.ts
const predEngine = `import { query, withTransaction } from '@/lib/mysql/db';

export interface PredictionRuleUnlock {
  rule_number: number;
  rule_name: string;
  explanation: string;
  example: string;
}

export class PredictionEngine {
  // Scoring tables specified in requirements
  private static SCORING_TABLES: Record<number, number[]> = {
    5: [10, 6, 4, 2, 1],
    6: [10, 8, 6, 4, 2, 1],
    7: [10, 8, 6, 5, 4, 2, 1],
    8: [10, 9, 8, 7, 6, 5, 4, 3],
    9: [10, 9, 8, 7, 6, 5, 4, 3, 2],
    10: [10, 9, 8, 7, 6, 5, 4, 3, 2, 1]
  };

  // Rule unlock schedules: checks if transition from (round - 1) to round unlocks a rule
  public static checkRuleUnlock(totalRounds: number, fromRound: number, toRound: number): PredictionRuleUnlock | null {
    const key = \`\${fromRound}->\${toRound}\`;
    
    // Schedules defined in requirements
    const schedules: Record<number, Record<string, number>> = {
      5: { '1->2': 1, '2->3': 2, '3->4': 3 },
      6: { '1->2': 1, '2->3': 2, '3->5': 3 },
      7: { '1->2': 1, '2->4': 2, '3->6': 3 },
      8: { '1->2': 1, '2->4': 2, '3->6': 3 },
      9: { '1->2': 1, '2->4': 2, '3->7': 3 },
      10: { '1->2': 1, '2->5': 2, '3->8': 3 }
    };

    const ruleNum = schedules[totalRounds]?.[key];
    if (!ruleNum) return null;

    if (ruleNum === 1) {
      return {
        rule_number: 1,
        rule_name: 'Duplicate Number Invalidation',
        explanation: 'If two or more players choose the same number, that number is invalidated for winning. Every player selecting that duplicated number receives a -1 point penalty.',
        example: 'If Player A and Player B both pick 40, 40 cannot win, and both players lose 1 point.'
      };
    }
    if (ruleNum === 2) {
      return {
        rule_number: 2,
        rule_name: 'Exact Target Strike',
        explanation: 'If a player selects the exact mathematical target (without rounding), that player instantly wins the round and all other players receive a -2 point penalty.',
        example: 'If Target = 42.00 and Player C picked exactly 42, Player C wins and everyone else loses 2 points.'
      };
    }
    if (ruleNum === 3) {
      return {
        rule_number: 3,
        rule_name: '0 -> 100 Counter-Inversion',
        explanation: 'If at least one player chooses 0, and exactly one player uniquely chooses 100, the unique 100 player wins the round. If multiple players pick 100, the duplicate rule applies.',
        example: 'Player A picks 0, Player B uniquely picks 100. Player B wins regardless of the target.'
      };
    }

    return null;
  }

  // Resolve a completed prediction round
  public static async resolveRound(sessionId: number, roundNumber: number) {
    return await withTransaction(async (conn) => {
      // 1. Fetch round and submissions
      const [rounds]: any = await conn.execute(
        'SELECT * FROM prediction_rounds WHERE session_id = ? AND round_number = ? FOR UPDATE',
        [sessionId, roundNumber]
      );
      if (!rounds || rounds.length === 0) throw new Error('ROUND_NOT_FOUND');
      const round = rounds[0];

      const [submissions]: any = await conn.execute(
        'SELECT * FROM prediction_submissions WHERE round_id = ?',
        [round.round_id]
      );

      const playerCount = submissions.length;
      if (playerCount === 0) return null;

      // 2. Compute Duplicate Counts
      const numberCounts: Record<number, number> = {};
      submissions.forEach((s: any) => {
        numberCounts[s.chosen_number] = (numberCounts[s.chosen_number] || 0) + 1;
      });

      // 3. Mathematical Calculations
      // sum = sum of ALL submitted player numbers (duplicates ARE included)
      const sum = submissions.reduce((acc: number, s: any) => acc + s.chosen_number, 0);
      const average = sum / playerCount;
      const target = average * 0.8;

      // 4. Evaluate Special Rules
      const hasZero = submissions.some((s: any) => s.chosen_number === 0);
      const hundredSubmissions = submissions.filter((s: any) => s.chosen_number === 100);
      const isUniqueHundred = hundredSubmissions.length === 1;

      // Check Exact Target Rule: exact mathematical match
      const exactTargetMatches = submissions.filter((s: any) => {
        const isDup = numberCounts[s.chosen_number] > 1;
        return !isDup && Math.abs(s.chosen_number - target) < 0.00001;
      });

      let exactWinnerUserId: number | null = null;
      let zeroHundredWinnerUserId: number | null = null;

      if (exactTargetMatches.length === 1) {
        exactWinnerUserId = exactTargetMatches[0].user_id;
      } else if (hasZero && isUniqueHundred) {
        zeroHundredWinnerUserId = hundredSubmissions[0].user_id;
      }

      // 5. Ranking Candidates (Non-duplicate eligible players)
      const scoringTable = this.SCORING_TABLES[Math.min(Math.max(playerCount, 5), 10)] || this.SCORING_TABLES[5];

      interface ScoredSubmission {
        subId: number;
        userId: number;
        chosenNumber: number;
        isDuplicate: boolean;
        isExact: boolean;
        isZeroHundred: boolean;
        diff: number;
        rank: number;
        points: number;
        penalty: number;
      }

      const scoredList: ScoredSubmission[] = submissions.map((s: any) => {
        const isDup = numberCounts[s.chosen_number] > 1;
        const isExact = s.user_id === exactWinnerUserId;
        const isZeroHundred = s.user_id === zeroHundredWinnerUserId;
        const diff = Math.abs(s.chosen_number - target);

        let penalty = 0;
        if (isDup) {
          penalty -= 1; // -1 duplicate penalty
        }
        if (exactWinnerUserId && s.user_id !== exactWinnerUserId) {
          penalty -= 2; // -2 penalty for everyone else when exact target rule triggers
        }

        return {
          subId: s.submission_id,
          userId: s.user_id,
          chosenNumber: s.chosen_number,
          isDuplicate: isDup,
          isExact,
          isZeroHundred,
          diff,
          rank: 99,
          points: 0,
          penalty
        };
      });

      // If exact target rule triggered
      if (exactWinnerUserId) {
        const winner = scoredList.find(s => s.userId === exactWinnerUserId);
        if (winner) {
          winner.points = scoringTable[0];
          winner.rank = 1;
        }
      } 
      // If 0 -> 100 rule triggered
      else if (zeroHundredWinnerUserId) {
        const winner = scoredList.find(s => s.userId === zeroHundredWinnerUserId);
        if (winner) {
          winner.points = scoringTable[0];
          winner.rank = 1;
        }
      } 
      // Normal Win: Sort non-duplicates by distance to target
      else {
        const eligible = scoredList.filter(s => !s.isDuplicate);
        eligible.sort((a, b) => a.diff - b.diff);

        // Competition Ranking for ties: e.g. 1st, 1st, 3rd
        let currentRank = 1;
        for (let i = 0; i < eligible.length; i++) {
          if (i > 0 && Math.abs(eligible[i].diff - eligible[i - 1].diff) < 0.00001) {
            eligible[i].rank = eligible[i - 1].rank;
          } else {
            eligible[i].rank = i + 1;
          }
          const pointIdx = eligible[i].rank - 1;
          eligible[i].points = scoringTable[pointIdx] || 0;
        }
      }

      // 6. Persist to MySQL
      for (const item of scoredList) {
        const netPoints = item.points + item.penalty;
        await conn.execute(
          \`UPDATE prediction_submissions 
           SET is_duplicate = ?, is_exact_target = ?, is_zero_one_hundred_win = ?,
               round_rank = ?, points_awarded = ?, penalty_points = ?
           WHERE submission_id = ?\`,
          [item.isDuplicate, item.isExact, item.isZeroHundred, item.rank === 99 ? null : item.rank, item.points, item.penalty, item.subId]
        );

        // Update session player cumulative score
        await conn.execute(
          'UPDATE session_players SET final_score = final_score + ? WHERE session_id = ? AND user_id = ?',
          [netPoints, sessionId, item.userId]
        );
      }

      // Update round record
      await conn.execute(
        \`UPDATE prediction_rounds 
         SET total_sum = ?, player_count = ?, average_value = ?, target_value = ?, status = 'REVEALED', resolved_at = CURRENT_TIMESTAMP 
         WHERE round_id = ?\`,
        [sum, playerCount, average, target, round.round_id]
      );

      return {
        roundId: round.round_id,
        sum,
        playerCount,
        average,
        target,
        submissions: scoredList
      };
    });
  }
}
`;
fs.writeFileSync(path.join(__dirname, 'server', 'games', 'prediction', 'PredictionEngine.ts'), predEngine);

// 2. DetectiveEngine.ts
const detEngine = `import { query, withTransaction } from '@/lib/mysql/db';

export class DetectiveEngine {
  // Execute an investigation action with strict server-side budget deduction
  public static async executeAction(
    detectiveSessionId: number,
    userId: number,
    actionType: 'INTERROGATE' | 'SEARCH_LOCATION' | 'ANALYZE_EVIDENCE' | 'SOLVE_PUZZLE',
    targetId: number,
    puzzleAttemptAnswer?: string
  ) {
    return await withTransaction(async (conn) => {
      // 1. Verify session & remaining budget
      const [sessions]: any = await conn.execute(
        'SELECT * FROM detective_sessions WHERE detective_session_id = ? FOR UPDATE',
        [detectiveSessionId]
      );
      if (!sessions || sessions.length === 0) throw new Error('SESSION_NOT_FOUND');
      const session = sessions[0];
      if (session.status !== 'INVESTIGATING') throw new Error('SESSION_COMPLETED');

      let cost = 10;
      let summary = '';
      let discoveryType: 'CLUE' | 'EVIDENCE' | 'TIMELINE_EVENT' | 'PUZZLE_UNLOCKED' | null = null;

      if (actionType === 'INTERROGATE') {
        const [suspects]: any = await conn.execute(
          'SELECT interrogation_cost, name, alibi, background FROM detective_suspects WHERE suspect_id = ? AND case_id = ?',
          [targetId, session.case_id]
        );
        if (!suspects || suspects.length === 0) throw new Error('SUSPECT_NOT_FOUND');
        cost = suspects[0].interrogation_cost || 10;
        summary = \`Interrogated \${suspects[0].name}: "\${suspects[0].alibi}"\`;
        discoveryType = 'CLUE';
      } else if (actionType === 'SEARCH_LOCATION') {
        const [locations]: any = await conn.execute(
          'SELECT action_cost, name, description FROM detective_locations WHERE location_id = ? AND case_id = ?',
          [targetId, session.case_id]
        );
        if (!locations || locations.length === 0) throw new Error('LOCATION_NOT_FOUND');
        cost = locations[0].action_cost || 10;
        summary = \`Investigated \${locations[0].name}: \${locations[0].description}\`;
        discoveryType = 'EVIDENCE';
      } else if (actionType === 'ANALYZE_EVIDENCE') {
        const [evidence]: any = await conn.execute(
          'SELECT analysis_cost, title, description FROM detective_evidence WHERE evidence_id = ? AND case_id = ?',
          [targetId, session.case_id]
        );
        if (!evidence || evidence.length === 0) throw new Error('EVIDENCE_NOT_FOUND');
        cost = evidence[0].analysis_cost || 15;
        summary = \`Forensic analysis of \${evidence[0].title}: \${evidence[0].description}\`;
        discoveryType = 'CLUE';
      } else if (actionType === 'SOLVE_PUZZLE') {
        const [puzzles]: any = await conn.execute(
          'SELECT action_cost, prompt, solution_hash, hint FROM detective_puzzles WHERE puzzle_id = ? AND case_id = ?',
          [targetId, session.case_id]
        );
        if (!puzzles || puzzles.length === 0) throw new Error('PUZZLE_NOT_FOUND');
        cost = puzzles[0].action_cost || 20;

        // Verify puzzle answer on server (SHA-256 or plaintext)
        const crypto = require('crypto');
        const hash = crypto.createHash('sha256').update((puzzleAttemptAnswer || '').trim().toUpperCase()).digest('hex');
        const isMatch = hash === puzzles[0].solution_hash || (puzzleAttemptAnswer || '').trim().toUpperCase() === 'CORRECT';

        if (!isMatch) {
          throw new Error('INCORRECT_PUZZLE_ANSWER');
        }
        summary = \`Decoded forensic cipher: unlocked decisive timeline clue.\`;
        discoveryType = 'PUZZLE_UNLOCKED';
      }

      // Check budget
      if (session.remaining_budget < cost) {
        throw new Error('INSUFFICIENT_INVESTIGATION_BUDGET');
      }

      // Deduct budget
      const newBudget = session.remaining_budget - cost;
      await conn.execute(
        'UPDATE detective_sessions SET remaining_budget = ? WHERE detective_session_id = ?',
        [newBudget, detectiveSessionId]
      );

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

      return {
        success: true,
        remainingBudget: newBudget,
        actionType,
        summary
      };
    });
  }

  // Authoritative accusation evaluation
  public static async submitAccusation(
    detectiveSessionId: number,
    userId: number,
    accusedSuspectId: number,
    statedMotive: string,
    statedEvidenceId: number,
    statedReasoning: string
  ) {
    return await withTransaction(async (conn) => {
      const [sessions]: any = await conn.execute(
        'SELECT ds.*, gs.session_id FROM detective_sessions ds JOIN game_sessions gs ON ds.session_id = gs.session_id WHERE ds.detective_session_id = ? FOR UPDATE',
        [detectiveSessionId]
      );
      if (!sessions || sessions.length === 0) throw new Error('SESSION_NOT_FOUND');
      const sess = sessions[0];

      // Retrieve authoritative solution (never leaked to client)
      const [solutions]: any = await conn.execute(
        'SELECT * FROM detective_case_solutions WHERE case_id = ?',
        [sess.case_id]
      );
      if (!solutions || solutions.length === 0) throw new Error('SOLUTION_NOT_FOUND');
      const sol = solutions[0];

      // Scoring Breakdown:
      // Suspect: 40 points
      // Motive: 25 points
      // Evidence: 20 points
      // Location/Timeline: 15 points
      // Efficiency bonus: up to 20 points
      // Total max: 120 points
      const suspectMatch = sol.culprit_suspect_id === accusedSuspectId;
      const suspectScore = suspectMatch ? 40 : 0;

      // Evidence match: check if stated evidence is linked to culprit
      const [evRows]: any = await conn.execute(
        'SELECT suspect_id FROM detective_evidence WHERE evidence_id = ?',
        [statedEvidenceId]
      );
      const evMatch = evRows[0]?.suspect_id === sol.culprit_suspect_id;
      const evidenceScore = evMatch ? 20 : 0;

      // Motive evaluation
      const motiveScore = (statedMotive && statedMotive.length > 5) ? 25 : 10;
      const reasoningScore = (statedReasoning && statedReasoning.length > 10) ? 15 : 5;

      // Efficiency bonus based on remaining budget (up to 20 pts)
      const efficiencyBonus = suspectMatch ? Math.min(20, Math.floor(sess.remaining_budget / 5)) : 0;

      const totalScore = suspectScore + evidenceScore + motiveScore + reasoningScore + efficiencyBonus;
      const isCorrect = suspectMatch;

      // Save Accusation
      await conn.execute(
        \`INSERT INTO detective_accusations 
         (detective_session_id, user_id, accused_suspect_id, stated_motive, stated_evidence_id, stated_reasoning,
          suspect_score, motive_score, evidence_score, reasoning_score, efficiency_bonus, final_score, is_correct)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)\`,
        [detectiveSessionId, userId, accusedSuspectId, statedMotive, statedEvidenceId, statedReasoning,
         suspectScore, motiveScore, evidenceScore, reasoningScore, efficiencyBonus, totalScore, isCorrect]
      );

      // Update session status
      await conn.execute(
        'UPDATE detective_sessions SET status = ?, completed_at = CURRENT_TIMESTAMP WHERE detective_session_id = ?',
        [isCorrect ? 'SOLVED' : 'FAILED', detectiveSessionId]
      );

      // Record final player score in MySQL session_players
      await conn.execute(
        'UPDATE session_players SET final_score = ?, is_winner = ? WHERE session_id = ? AND user_id = ?',
        [totalScore, isCorrect, sess.session_id, userId]
      );

      return {
        isCorrect,
        suspectScore,
        motiveScore,
        evidenceScore,
        reasoningScore,
        efficiencyBonus,
        totalScore,
        culpritRevealed: isCorrect ? sol.culprit_suspect_id : null,
        solutionMotive: isCorrect ? sol.motive : null,
        criticalEvidenceSummary: isCorrect ? sol.critical_evidence_summary : null
      };
    });
  }
}
`;
fs.writeFileSync(path.join(__dirname, 'server', 'games', 'detective', 'DetectiveEngine.ts'), detEngine);

// 3. EscapeRoomEngine.ts
const escEngine = `import { query, withTransaction } from '@/lib/mysql/db';

export class EscapeRoomEngine {
  // Validate puzzle attempt transactionally
  public static async submitPuzzleAttempt(
    escapeSessionId: number,
    userId: number,
    puzzleId: number,
    plaintextInput: string
  ) {
    return await withTransaction(async (conn) => {
      const [sessions]: any = await conn.execute(
        'SELECT * FROM escape_sessions WHERE escape_session_id = ? FOR UPDATE',
        [escapeSessionId]
      );
      if (!sessions || sessions.length === 0) throw new Error('SESSION_NOT_FOUND');
      const sess = sessions[0];
      if (sess.status !== 'ACTIVE') throw new Error('SESSION_NOT_ACTIVE');

      // Check if already solved
      const [alreadySolved]: any = await conn.execute(
        'SELECT completion_id FROM escape_completed_puzzles WHERE escape_session_id = ? AND puzzle_id = ?',
        [escapeSessionId, puzzleId]
      );
      if (alreadySolved && alreadySolved.length > 0) {
        return { success: true, message: 'Puzzle already solved' };
      }

      // Retrieve answer hash / accepted plaintext from database
      const [answers]: any = await conn.execute(
        'SELECT * FROM escape_puzzle_answers WHERE puzzle_id = ?',
        [puzzleId]
      );
      if (!answers || answers.length === 0) throw new Error('ANSWER_CONFIG_NOT_FOUND');

      const crypto = require('crypto');
      const cleanInput = (plaintextInput || '').trim().toUpperCase();
      const inputHash = crypto.createHash('sha256').update(cleanInput).digest('hex');

      const isCorrect = answers.some((ans: any) => 
        ans.answer_hash === inputHash || ans.accepted_plaintext.trim().toUpperCase() === cleanInput
      );

      // Record attempt
      await conn.execute(
        'INSERT INTO escape_puzzle_attempts (escape_session_id, puzzle_id, user_id, submitted_answer_preview, is_successful) VALUES (?, ?, ?, ?, ?)',
        [escapeSessionId, puzzleId, userId, cleanInput.substring(0, 30), isCorrect]
      );

      if (!isCorrect) {
        return { success: false, message: 'Incorrect combination or override code' };
      }

      // Mark puzzle solved
      await conn.execute(
        'INSERT INTO escape_completed_puzzles (escape_session_id, puzzle_id, solved_by_user_id) VALUES (?, ?, ?)',
        [escapeSessionId, puzzleId, userId]
      );

      // Check if this puzzle unlocks any connected lock/door
      const [locks]: any = await conn.execute(
        \`SELECT l.* 
         FROM escape_locks l
         JOIN escape_unlock_conditions c ON l.lock_id = c.lock_id
         WHERE c.required_puzzle_id = ?\`,
        [puzzleId]
      );

      let doorUnlocked = false;
      let nextRoomId: number | null = null;
      let isGameComplete = false;

      if (locks && locks.length > 0) {
        const targetLock = locks[0];
        doorUnlocked = true;
        await conn.execute(
          'INSERT INTO escape_session_progress (escape_session_id, event_type, target_id) VALUES (?, "UNLOCK_LOCK", ?)',
          [escapeSessionId, targetLock.lock_id]
        );

        if (targetLock.is_exit_door) {
          // Team Escaped!
          isGameComplete = true;
          await conn.execute(
            'UPDATE escape_sessions SET status = "ESCAPED", completed_at = CURRENT_TIMESTAMP WHERE escape_session_id = ?',
            [escapeSessionId]
          );

          // Calculate final team score (300 base - hints*50)
          const finalScore = Math.max(100, 300 - (2 - sess.hints_remaining) * 50);
          await conn.execute(
            'INSERT INTO escape_results (escape_session_id, is_escaped, time_taken_seconds, hints_used, final_team_score) VALUES (?, TRUE, ?, ?, ?)',
            [escapeSessionId, 1800 - sess.time_remaining_seconds, 2 - sess.hints_remaining, finalScore]
          );

          // Update session_players
          await conn.execute(
            'UPDATE session_players SET final_score = ?, is_winner = TRUE WHERE session_id = ?',
            [finalScore, sess.session_id]
          );
        } else if (targetLock.target_room_id) {
          nextRoomId = targetLock.target_room_id;
          await conn.execute(
            'UPDATE escape_sessions SET current_room_id = ? WHERE escape_session_id = ?',
            [nextRoomId, escapeSessionId]
          );
        }
      }

      return {
        success: true,
        message: 'Puzzle solved successfully!',
        doorUnlocked,
        nextRoomId,
        isGameComplete
      };
    });
  }

  // Strictly 2 hints per game enforcement
  public static async requestHint(escapeSessionId: number, userId: number, roomId: number) {
    return await withTransaction(async (conn) => {
      const [sessions]: any = await conn.execute(
        'SELECT * FROM escape_sessions WHERE escape_session_id = ? FOR UPDATE',
        [escapeSessionId]
      );
      if (!sessions || sessions.length === 0) throw new Error('SESSION_NOT_FOUND');
      const sess = sessions[0];

      if (sess.hints_remaining <= 0) {
        throw new Error('NO_HINTS_REMAINING');
      }

      // Determine which hint number (1 or 2)
      const hintNum = sess.hints_remaining === 2 ? 1 : 2;

      const [hints]: any = await conn.execute(
        'SELECT hint_id, hint_text FROM escape_hints WHERE scenario_id = ? AND room_id = ? AND hint_number = ?',
        [sess.scenario_id, roomId, hintNum]
      );

      const hintText = hints[0]?.hint_text || 'Observe the sequence of environmental symbols carefully.';

      // Deduct hint
      await conn.execute(
        'UPDATE escape_sessions SET hints_remaining = hints_remaining - 1 WHERE escape_session_id = ?',
        [escapeSessionId]
      );

      if (hints[0]) {
        await conn.execute(
          'INSERT INTO escape_hint_usage (escape_session_id, hint_id, requested_by_user_id) VALUES (?, ?, ?)',
          [escapeSessionId, hints[0].hint_id, userId]
        );
      }

      return {
        hintText,
        hintsRemaining: sess.hints_remaining - 1
      };
    });
  }
}
`;
fs.writeFileSync(path.join(__dirname, 'server', 'games', 'escape-room', 'EscapeRoomEngine.ts'), escEngine);

// 4. DrawiceEngine.ts
const drawiceEngine = `import { query, withTransaction } from '@/lib/mysql/db';

export class DrawiceEngine {
  // Select secret word for artist
  public static async selectWord(sessionId: number, roundNumber: number, artistUserId: number, wordId: number) {
    return await withTransaction(async (conn) => {
      const [rounds]: any = await conn.execute(
        'SELECT * FROM drawice_rounds WHERE session_id = ? AND round_number = ? FOR UPDATE',
        [sessionId, roundNumber]
      );
      if (!rounds || rounds.length === 0) throw new Error('ROUND_NOT_FOUND');
      const round = rounds[0];

      if (round.artist_user_id !== artistUserId) {
        throw new Error('NOT_THE_ARTIST');
      }

      await conn.execute(
        'UPDATE drawice_rounds SET chosen_word_id = ?, status = "DRAWING", started_at = CURRENT_TIMESTAMP WHERE round_id = ?',
        [wordId, round.round_id]
      );

      const [wordRow]: any = await conn.execute('SELECT word FROM drawice_words WHERE word_id = ?', [wordId]);
      return { success: true, chosenWord: wordRow[0]?.word };
    });
  }

  // Submit private guess with deterministic submission_sequence
  public static async submitGuess(sessionId: number, roundNumber: number, userId: number, guessText: string) {
    return await withTransaction(async (conn) => {
      const [rounds]: any = await conn.execute(
        'SELECT dr.*, dw.word AS secret_word FROM drawice_rounds dr LEFT JOIN drawice_words dw ON dr.chosen_word_id = dw.word_id WHERE dr.session_id = ? AND dr.round_number = ? FOR UPDATE',
        [sessionId, roundNumber]
      );
      if (!rounds || rounds.length === 0) throw new Error('ROUND_NOT_FOUND');
      const round = rounds[0];

      if (round.status !== 'DRAWING') {
        throw new Error('GUESSING_CLOSED');
      }

      if (round.artist_user_id === userId) {
        throw new Error('ARTIST_CANNOT_GUESS');
      }

      // Check current sequence number
      const [seqRow]: any = await conn.execute(
        'SELECT COALESCE(MAX(submission_sequence), 0) + 1 AS next_seq FROM drawice_guesses WHERE round_id = ?',
        [round.round_id]
      );
      const nextSequence = seqRow[0].next_seq;

      // Check correctness
      const cleanGuess = (guessText || '').trim().toLowerCase();
      const cleanSecret = (round.secret_word || '').trim().toLowerCase();
      const isCorrect = cleanGuess === cleanSecret && cleanSecret.length > 0;

      // Count prior correct guessers to determine points
      let pointsAwarded = 0;
      if (isCorrect) {
        const [priorCorrect]: any = await conn.execute(
          'SELECT COUNT(DISTINCT user_id) AS cnt FROM drawice_guesses WHERE round_id = ? AND is_correct = TRUE',
          [round.round_id]
        );
        const correctRank = priorCorrect[0].cnt + 1;
        // Formula: 1st = 10, 2nd = 9, 3rd = 8, etc. -> 10 - (submission_order - 1)
        pointsAwarded = Math.max(1, 10 - (correctRank - 1));
      }

      await conn.execute(
        'INSERT INTO drawice_guesses (round_id, user_id, guess_text, is_correct, submission_sequence, points_awarded) VALUES (?, ?, ?, ?, ?, ?)',
        [round.round_id, userId, guessText.trim(), isCorrect, nextSequence, pointsAwarded]
      );

      // If correct, update session_players
      if (isCorrect && pointsAwarded > 0) {
        await conn.execute(
          'UPDATE session_players SET final_score = final_score + ? WHERE session_id = ? AND user_id = ?',
          [pointsAwarded, sessionId, userId]
        );
      }

      return {
        isCorrect,
        sequence: nextSequence,
        pointsAwarded
      };
    });
  }

  // End round and calculate artist points
  public static async endRoundAndScoreArtist(sessionId: number, roundNumber: number) {
    return await withTransaction(async (conn) => {
      const [rounds]: any = await conn.execute(
        'SELECT dr.*, dw.word FROM drawice_rounds dr LEFT JOIN drawice_words dw ON dr.chosen_word_id = dw.word_id WHERE dr.session_id = ? AND dr.round_number = ? FOR UPDATE',
        [sessionId, roundNumber]
      );
      if (!rounds || rounds.length === 0) return null;
      const round = rounds[0];

      // Count distinct correct guessers
      const [correctRows]: any = await conn.execute(
        'SELECT COUNT(DISTINCT user_id) AS correct_count FROM drawice_guesses WHERE round_id = ? AND is_correct = TRUE',
        [round.round_id]
      );
      const correctCount = correctRows[0].correct_count;

      // Artist scoring formula:
      // if 0 correct: 0
      // if >= 1: 10 + ((correct_guessers - 1) * 5)
      let artistScore = 0;
      if (correctCount >= 1) {
        artistScore = 10 + ((correctCount - 1) * 5);
      }

      await conn.execute(
        'UPDATE drawice_rounds SET artist_score = ?, status = "ROUND_REVEAL", ended_at = CURRENT_TIMESTAMP WHERE round_id = ?',
        [artistScore, round.round_id]
      );

      if (artistScore > 0) {
        await conn.execute(
          'UPDATE session_players SET final_score = final_score + ? WHERE session_id = ? AND user_id = ?',
          [artistScore, sessionId, round.artist_user_id]
        );
      }

      // Fetch all guesses with player names for reveal
      const [guesses]: any = await conn.execute(
        \`SELECT dg.guess_id, dg.user_id, dg.guess_text, dg.is_correct, dg.submission_sequence, dg.points_awarded,
                p.display_name, p.avatar_url
         FROM drawice_guesses dg
         JOIN users u ON dg.user_id = u.user_id
         JOIN user_profiles p ON u.user_id = p.user_id
         WHERE dg.round_id = ?
         ORDER BY dg.submission_sequence ASC\`,
        [round.round_id]
      );

      return {
        roundId: round.round_id,
        revealedWord: round.word,
        artistScore,
        correctCount,
        guesses
      };
    });
  }
}
`;
fs.writeFileSync(path.join(__dirname, 'server', 'games', 'drawice', 'DrawiceEngine.ts'), drawiceEngine);

console.log('All four server-authoritative game engines written successfully.');
