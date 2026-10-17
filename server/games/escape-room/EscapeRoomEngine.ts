import { query, withTransaction } from '@/lib/mysql/db';

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
      if (sess.status !== 'ACTIVE') {
        if (sess.status === 'TIMEOUT') throw new Error('SESSION_TIMEOUT');
        if (sess.status === 'ESCAPED') throw new Error('SESSION_ALREADY_ESCAPED');
        throw new Error('SESSION_NOT_ACTIVE');
      }

      // Authoritative time limit check
      const [scenarios]: any = await conn.execute(
        'SELECT time_limit_seconds FROM escape_scenarios WHERE scenario_id = ?',
        [sess.scenario_id]
      );
      const timeLimit = scenarios[0]?.time_limit_seconds || 600;
      const startTime = new Date(sess.started_at).getTime();
      const elapsedSeconds = Math.max(0, Math.floor((Date.now() - startTime) / 1000));
      const remainingSeconds = Math.max(0, timeLimit - elapsedSeconds);

      if (remainingSeconds <= 0) {
        const [compRows]: any = await conn.execute(
          'SELECT COUNT(DISTINCT escape_room_id) as cnt FROM escape_room_completions WHERE escape_session_id = ?',
          [escapeSessionId]
        );
        const roomsCompleted = compRows[0]?.cnt || 0;
        const timeoutScore = Math.min(30, roomsCompleted * 10);

        await conn.execute(
          'UPDATE escape_sessions SET status = "TIMEOUT", completed_at = CURRENT_TIMESTAMP, time_remaining_seconds = 0 WHERE escape_session_id = ?',
          [escapeSessionId]
        );
        await conn.execute(
          'UPDATE game_sessions SET status = "COMPLETED", completed_at = CURRENT_TIMESTAMP WHERE session_id = ?',
          [sess.session_id]
        );
        await conn.execute(
          `INSERT INTO escape_results (escape_session_id, is_escaped, time_taken_seconds, hints_used, final_team_score)
           VALUES (?, FALSE, ?, ?, ?)
           ON DUPLICATE KEY UPDATE is_escaped = VALUES(is_escaped), time_taken_seconds = VALUES(time_taken_seconds), final_team_score = VALUES(final_team_score)`,
          [escapeSessionId, timeLimit, 2 - sess.hints_remaining, timeoutScore]
        );
        throw new Error('SESSION_TIMEOUT');
      }

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
        `SELECT l.* 
         FROM escape_locks l
         JOIN escape_unlock_conditions c ON l.lock_id = c.lock_id
         WHERE c.required_puzzle_id = ?`,
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

        // Record room completion idempotently (Room 1: 10 pts, Room 2: 10 pts, Room 3: 10 pts, max 30 pts)
        const completedRoomId = targetLock.escape_room_id;
        const [existingCompletions]: any = await conn.execute(
          'SELECT id FROM escape_room_completions WHERE escape_session_id = ? AND escape_room_id = ? FOR UPDATE',
          [escapeSessionId, completedRoomId]
        );

        if (!existingCompletions || existingCompletions.length === 0) {
          await conn.execute(
            'INSERT INTO escape_room_completions (escape_session_id, escape_room_id, completed_at) VALUES (?, ?, CURRENT_TIMESTAMP)',
            [escapeSessionId, completedRoomId]
          );
        }

        // Count distinct completed rooms for this session
        const [compCountRows]: any = await conn.execute(
          'SELECT COUNT(DISTINCT escape_room_id) as cnt FROM escape_room_completions WHERE escape_session_id = ?',
          [escapeSessionId]
        );
        const roomsCompletedCount = compCountRows[0]?.cnt || 1;
        // 10 pts per completed room, capped strictly at 30 points
        const currentPoints = Math.min(30, roomsCompletedCount * 10);

        // Collect all participating user IDs from escape_session_players, session_players, and current user
        const [espRows]: any = await conn.execute(
          'SELECT user_id FROM escape_session_players WHERE escape_session_id = ?',
          [escapeSessionId]
        );
        const [spRows]: any = await conn.execute(
          'SELECT user_id FROM session_players WHERE session_id = ?',
          [sess.session_id]
        );

        const participantUserIds = new Set<number>();
        if (userId) participantUserIds.add(userId);
        espRows?.forEach((r: any) => participantUserIds.add(r.user_id));
        spRows?.forEach((r: any) => participantUserIds.add(r.user_id));

        if (targetLock.is_exit_door) {
          // Team Escaped all rooms!
          isGameComplete = true;
          const timeTakenSeconds = elapsedSeconds;
          const finalRemainingSeconds = Math.max(0, timeLimit - timeTakenSeconds);

          await conn.execute(
            'UPDATE escape_sessions SET status = "ESCAPED", completed_at = CURRENT_TIMESTAMP, time_remaining_seconds = ? WHERE escape_session_id = ?',
            [finalRemainingSeconds, escapeSessionId]
          );

          // Maximum total for completing all three rooms: 30 points per player
          const finalScore = currentPoints; // 30 points
          const hintsUsed = Math.max(0, 2 - sess.hints_remaining);

          await conn.execute(
            `INSERT INTO escape_results (escape_session_id, is_escaped, time_taken_seconds, hints_used, final_team_score)
             VALUES (?, TRUE, ?, ?, ?)
             ON DUPLICATE KEY UPDATE is_escaped = TRUE, time_taken_seconds = VALUES(time_taken_seconds), final_team_score = VALUES(final_team_score)`,
            [escapeSessionId, timeTakenSeconds, hintsUsed, finalScore]
          );

          // Update game_sessions to COMPLETED
          await conn.execute(
            'UPDATE game_sessions SET status = "COMPLETED", completed_at = CURRENT_TIMESTAMP WHERE session_id = ?',
            [sess.session_id]
          );

          for (const pUserId of participantUserIds) {
            // Update session_players with 30 points
            await conn.execute(
              `INSERT INTO session_players (session_id, user_id, final_score, is_winner)
               VALUES (?, ?, ?, TRUE)
               ON DUPLICATE KEY UPDATE final_score = VALUES(final_score), is_winner = TRUE`,
              [sess.session_id, pUserId, finalScore]
            );

            // Update player_game_statistics for game_id = 3 (ESCAPE_ROOM)
            await conn.execute(
              `INSERT INTO player_game_statistics (user_id, game_id, games_played, games_won, total_score, highest_score)
               VALUES (?, 3, 1, 1, ?, ?)
               ON DUPLICATE KEY UPDATE
                 games_played = games_played + 1,
                 games_won = games_won + 1,
                 total_score = total_score + VALUES(total_score),
                 highest_score = GREATEST(highest_score, VALUES(highest_score))`,
              [pUserId, finalScore, finalScore]
            );

            // Award eligible achievements
            try {
              const [userStats]: any = await conn.execute(
                'SELECT SUM(games_won) as total_wins, SUM(total_score) as total_pts FROM player_game_statistics WHERE user_id = ?',
                [pUserId]
              );
              const totalWins = userStats[0]?.total_wins || 1;
              const totalPts = userStats[0]?.total_pts || finalScore;

              const [achRows]: any = await conn.execute('SELECT achievement_id, name, requirement_type, requirement_value FROM achievements WHERE is_active = TRUE');
              for (const ach of achRows || []) {
                let eligible = false;
                if (ach.requirement_type === 'GAMES_WON_TOTAL' && totalWins >= ach.requirement_value) {
                  eligible = true;
                } else if (ach.requirement_type === 'TOTAL_SCORE_OVERALL' && totalPts >= ach.requirement_value) {
                  eligible = true;
                } else if (ach.requirement_type === 'ESCAPE_ZERO_HINTS' && hintsUsed === 0) {
                  eligible = true;
                } else if (ach.requirement_type === 'ESCAPE_SPEED_RUN' && timeTakenSeconds <= ach.requirement_value) {
                  eligible = true;
                }

                if (eligible) {
                  await conn.execute(
                    'INSERT IGNORE INTO user_achievements (user_id, achievement_id, earned_at) VALUES (?, ?, CURRENT_TIMESTAMP)',
                    [pUserId, ach.achievement_id]
                  );
                }
              }
            } catch (achErr) {
              // Silently ignore if table not accessible
            }
          }
        } else if (targetLock.target_room_id) {
          nextRoomId = targetLock.target_room_id;
          await conn.execute(
            'UPDATE escape_sessions SET current_room_id = ? WHERE escape_session_id = ?',
            [nextRoomId, escapeSessionId]
          );

          // Update session_players with current progressive points (10 after Room 1, 20 after Room 2)
          for (const pUserId of participantUserIds) {
            await conn.execute(
              `INSERT INTO session_players (session_id, user_id, final_score, is_winner)
               VALUES (?, ?, ?, FALSE)
               ON DUPLICATE KEY UPDATE final_score = VALUES(final_score)`,
              [sess.session_id, pUserId, currentPoints]
            );
          }
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
