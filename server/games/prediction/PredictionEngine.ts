import { query, withTransaction } from '@/lib/mysql/db';

export interface PredictionRuleUnlock {
  rule_number: number;
  rule_name: string;
  explanation: string;
  example: string;
}

export class PredictionEngine {
  // Scoring tables specified in requirements
  // NOTE: Player counts 2, 3, and 4 are supported by the platform (2–10 players).
  // [PENDING FINAL SCORING CONFIGURATION FOR 2–4 PLAYERS]:
  // Bespoke point allocation tables for 2, 3, and 4 players are pending final scoring configuration.
  // We do NOT invent or assume scoring values for 2–4 players here.
  private static SCORING_TABLES: Record<number, number[]> = {
    // 2: /* PENDING FINAL SCORING CONFIGURATION FOR 2 PLAYERS */,
    // 3: /* PENDING FINAL SCORING CONFIGURATION FOR 3 PLAYERS */,
    // 4: /* PENDING FINAL SCORING CONFIGURATION FOR 4 PLAYERS */,
    5: [10, 6, 4, 2, 1],
    6: [10, 8, 6, 4, 2, 1],
    7: [10, 8, 6, 5, 4, 2, 1],
    8: [10, 9, 8, 7, 6, 5, 4, 3],
    9: [10, 9, 8, 7, 6, 5, 4, 3, 2],
    10: [10, 9, 8, 7, 6, 5, 4, 3, 2, 1]
  };

  // Rule unlock schedules: checks if transition from (round - 1) to round unlocks a rule
  public static checkRuleUnlock(totalRounds: number, fromRound: number, toRound: number): PredictionRuleUnlock | null {
    const key = `${fromRound}->${toRound}`;
    
    // Schedules defined in requirements
    const schedules: Record<number, Record<string, number>> = {
      2: { '1->2': 1 },
      3: { '1->2': 1, '2->3': 2 },
      4: { '1->2': 1, '2->3': 2, '3->4': 3 },
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

      // If already resolved, do not double-resolve
      if (round.status === 'REVEALED' || round.status === 'COMPLETED') {
        return null;
      }

      const [submissions]: any = await conn.execute(
        'SELECT * FROM prediction_submissions WHERE round_id = ?',
        [round.round_id]
      );

      const playerCount = submissions.length;
      if (playerCount === 0) {
        await conn.execute(
          `UPDATE prediction_rounds 
           SET total_sum = 0, player_count = 0, average_value = 0.0000, target_value = 0.0000, status = 'REVEALED', resolved_at = CURRENT_TIMESTAMP 
           WHERE round_id = ?`,
          [round.round_id]
        );
        return {
          roundId: round.round_id,
          sum: 0,
          playerCount: 0,
          average: 0,
          target: 0,
          submissions: []
        };
      }

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
      // NOTE: 2–4 player games are fully enabled (2–10 players).
      // [PENDING FINAL SCORING CONFIGURATION FOR 2–4 PLAYERS]:
      // Check if a dedicated scoring schedule is defined for this player count; otherwise fallback safely
      // to the existing 5-player distribution base so 2, 3, and 4-player games can actually start and play
      // without crashing or silently inventing arbitrary point tiers.
      const scoringTable = this.SCORING_TABLES[playerCount] || this.SCORING_TABLES[5];

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
        const others = scoredList.filter(s => !s.isDuplicate && s.userId !== exactWinnerUserId);
        others.sort((a, b) => a.diff - b.diff);
        for (let i = 0; i < others.length; i++) {
          others[i].rank = i + 2;
          const pointIdx = others[i].rank - 1;
          others[i].points = scoringTable[pointIdx] || 0;
        }
      } 
      // If 0 -> 100 rule triggered
      else if (zeroHundredWinnerUserId) {
        const winner = scoredList.find(s => s.userId === zeroHundredWinnerUserId);
        if (winner) {
          winner.points = scoringTable[0];
          winner.rank = 1;
        }
        const others = scoredList.filter(s => !s.isDuplicate && s.userId !== zeroHundredWinnerUserId);
        others.sort((a, b) => a.diff - b.diff);
        for (let i = 0; i < others.length; i++) {
          others[i].rank = i + 2;
          const pointIdx = others[i].rank - 1;
          others[i].points = scoringTable[pointIdx] || 0;
        }
      } 
      // Normal Win: Sort non-duplicates by distance to target
      else {
        const eligible = scoredList.filter(s => !s.isDuplicate);
        eligible.sort((a, b) => a.diff - b.diff);

        // Competition Ranking for ties: e.g. 1st, 1st, 3rd
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
          `UPDATE prediction_submissions 
           SET is_duplicate = ?, is_exact_target = ?, is_zero_one_hundred_win = ?,
               round_rank = ?, points_awarded = ?, penalty_points = ?
           WHERE submission_id = ?`,
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
        `UPDATE prediction_rounds 
         SET total_sum = ?, player_count = ?, average_value = ?, target_value = ?, status = 'REVEALED', resolved_at = CURRENT_TIMESTAMP 
         WHERE round_id = ?`,
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
