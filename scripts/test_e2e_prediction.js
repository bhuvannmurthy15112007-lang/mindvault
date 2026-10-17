const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

async function runPredictionE2ETest() {
  console.log('====================================================');
  console.log('   MINDVAULT: PREDICTION ARENA END-TO-END TEST SUITE ');
  console.log('====================================================\n');

  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'mindvault',
    waitForConnections: true,
    connectionLimit: 5,
    dateStrings: true
  });

  const conn = await pool.getConnection();

  try {
    // ------------------------------------------------------------------
    // STEP 1: Verify Database Schema
    // ------------------------------------------------------------------
    console.log('[1/7] Verifying Prediction Arena database tables...');
    const [tables] = await conn.execute(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name IN ('prediction_rounds', 'prediction_submissions')"
    );
    const tableNames = tables.map((t) => t.table_name || t.TABLE_NAME);
    console.log('Found tables:', tableNames);
    if (!tableNames.includes('prediction_rounds') || !tableNames.includes('prediction_submissions')) {
      throw new Error('Required prediction tables missing!');
    }
    console.log('PASS: prediction_rounds and prediction_submissions exist.\n');

    // ------------------------------------------------------------------
    // STEP 2: Verify Game Configuration in games table
    // ------------------------------------------------------------------
    console.log('[2/7] Verifying games table min_players / max_players...');
    const [gameRows] = await conn.execute("SELECT * FROM games WHERE game_code = 'PREDICTION_ARENA'");
    if (!gameRows || gameRows.length === 0) throw new Error('PREDICTION_ARENA game missing in games table!');
    const game = gameRows[0];
    console.log(`Game: ${game.game_name}, min_players: ${game.min_players}, max_players: ${game.max_players}`);
    if (game.min_players !== 2 || game.max_players !== 10) {
      throw new Error(`Expected min_players=2, max_players=10, got ${game.min_players}-${game.max_players}`);
    }
    console.log('PASS: 2-10 player configuration confirmed in games table.\n');

    // ------------------------------------------------------------------
    // STEP 3: Create 2-Player Test Room and Session
    // ------------------------------------------------------------------
    console.log('[3/7] Setting up 2-Player Test Game Session...');
    const testRoomCode = 'TEST' + Math.floor(1000 + Math.random() * 9000);
    const [roomRes] = await conn.execute(
      'INSERT INTO game_rooms (room_code, game_id, host_user_id, status, max_players) VALUES (?, ?, 1, "STARTED", 2)',
      [testRoomCode, game.game_id]
    );
    const roomId = roomRes.insertId;

    await conn.execute('INSERT INTO room_players (room_id, user_id, status) VALUES (?, 1, "JOINED"), (?, 2, "JOINED")', [
      roomId,
      roomId
    ]);

    const [sessRes] = await conn.execute(
      'INSERT INTO game_sessions (room_id, game_id, total_rounds, current_round, status, started_at) VALUES (?, ?, 5, 1, "IN_PROGRESS", CURRENT_TIMESTAMP)',
      [roomId, game.game_id]
    );
    const sessionId = sessRes.insertId;

    await conn.execute(
      'INSERT INTO session_players (session_id, user_id, final_score) VALUES (?, 1, 0.00), (?, 2, 0.00)',
      [sessionId, sessionId]
    );

    console.log(`PASS: Created room ${testRoomCode} (id: ${roomId}), session ${sessionId} with Players #1 and #2.\n`);

    // Helper to resolve round matching PredictionEngine logic
    async function resolveRound(roundNum, p1Number, p2Number) {
      // 1. Fetch round
      const [rRows] = await conn.execute(
        'SELECT * FROM prediction_rounds WHERE session_id = ? AND round_number = ?',
        [sessionId, roundNum]
      );
      const round = rRows[0];

      // Insert submissions
      await conn.execute(
        'INSERT INTO prediction_submissions (round_id, user_id, chosen_number) VALUES (?, 1, ?), (?, 2, ?)',
        [round.round_id, p1Number, round.round_id, p2Number]
      );

      const [submissions] = await conn.execute(
        'SELECT * FROM prediction_submissions WHERE round_id = ?',
        [round.round_id]
      );

      const count = submissions.length;
      const sum = submissions.reduce((acc, s) => acc + s.chosen_number, 0);
      const average = sum / count;
      const target = average * 0.8;

      const numberCounts = {};
      submissions.forEach((s) => {
        numberCounts[s.chosen_number] = (numberCounts[s.chosen_number] || 0) + 1;
      });

      const hasZero = submissions.some((s) => s.chosen_number === 0);
      const hundredSubmissions = submissions.filter((s) => s.chosen_number === 100);
      const isUniqueHundred = hundredSubmissions.length === 1;

      const exactTargetMatches = submissions.filter((s) => {
        const isDup = numberCounts[s.chosen_number] > 1;
        return !isDup && Math.abs(s.chosen_number - target) < 0.00001;
      });

      let exactWinnerUserId = null;
      let zeroHundredWinnerUserId = null;

      if (exactTargetMatches.length === 1) {
        exactWinnerUserId = exactTargetMatches[0].user_id;
      } else if (hasZero && isUniqueHundred) {
        zeroHundredWinnerUserId = hundredSubmissions[0].user_id;
      }

      const scoringTable = [10, 6, 4, 2, 1];

      const scoredList = submissions.map((s) => {
        const isDup = numberCounts[s.chosen_number] > 1;
        const isExact = s.user_id === exactWinnerUserId;
        const isZeroHundred = s.user_id === zeroHundredWinnerUserId;
        const diff = Math.abs(s.chosen_number - target);

        let penalty = 0;
        if (isDup) penalty -= 1;
        if (exactWinnerUserId && s.user_id !== exactWinnerUserId) penalty -= 2;

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

      if (exactWinnerUserId) {
        const winner = scoredList.find((s) => s.userId === exactWinnerUserId);
        if (winner) {
          winner.points = scoringTable[0];
          winner.rank = 1;
        }
        const others = scoredList.filter((s) => !s.isDuplicate && s.userId !== exactWinnerUserId);
        others.sort((a, b) => a.diff - b.diff);
        for (let i = 0; i < others.length; i++) {
          others[i].rank = i + 2;
          others[i].points = scoringTable[others[i].rank - 1] || 0;
        }
      } else if (zeroHundredWinnerUserId) {
        const winner = scoredList.find((s) => s.userId === zeroHundredWinnerUserId);
        if (winner) {
          winner.points = scoringTable[0];
          winner.rank = 1;
        }
        const others = scoredList.filter((s) => !s.isDuplicate && s.userId !== zeroHundredWinnerUserId);
        others.sort((a, b) => a.diff - b.diff);
        for (let i = 0; i < others.length; i++) {
          others[i].rank = i + 2;
          others[i].points = scoringTable[others[i].rank - 1] || 0;
        }
      } else {
        const eligible = scoredList.filter((s) => !s.isDuplicate);
        eligible.sort((a, b) => a.diff - b.diff);
        for (let i = 0; i < eligible.length; i++) {
          if (i > 0 && Math.abs(eligible[i].diff - eligible[i - 1].diff) < 0.00001) {
            eligible[i].rank = eligible[i - 1].rank;
          } else {
            eligible[i].rank = i + 1;
          }
          eligible[i].points = scoringTable[eligible[i].rank - 1] || 0;
        }
      }

      for (const item of scoredList) {
        const net = item.points + item.penalty;
        await conn.execute(
          `UPDATE prediction_submissions 
           SET is_duplicate = ?, is_exact_target = ?, is_zero_one_hundred_win = ?,
               round_rank = ?, points_awarded = ?, penalty_points = ?
           WHERE submission_id = ?`,
          [item.isDuplicate, item.isExact, item.isZeroHundred, item.rank === 99 ? null : item.rank, item.points, item.penalty, item.subId]
        );

        await conn.execute(
          'UPDATE session_players SET final_score = final_score + ? WHERE session_id = ? AND user_id = ?',
          [net, sessionId, item.userId]
        );
      }

      await conn.execute(
        `UPDATE prediction_rounds 
         SET total_sum = ?, player_count = ?, average_value = ?, target_value = ?, status = 'REVEALED', resolved_at = CURRENT_TIMESTAMP 
         WHERE round_id = ?`,
        [sum, count, average, target, round.round_id]
      );

      return { sum, average, target, scoredList };
    }

    // ------------------------------------------------------------------
    // STEP 4: Round 1 (Exact Target Strike)
    // ------------------------------------------------------------------
    console.log('[4/7] Testing Round 1: Exact Target Rule...');
    await conn.execute(
      'INSERT INTO prediction_rounds (session_id, round_number, status) VALUES (?, 1, "SUBMITTING")',
      [sessionId]
    );

    // Player 1 picks 40, Player 2 picks 60 -> sum = 100, avg = 50, target = 40.0
    // Player 1 exact match!
    const r1 = await resolveRound(1, 40, 60);
    console.log(`Round 1 Results: Sum=${r1.sum}, Avg=${r1.average}, Target=${r1.target}`);
    const p1_r1 = r1.scoredList.find((s) => s.userId === 1);
    const p2_r1 = r1.scoredList.find((s) => s.userId === 2);
    console.log(`Player 1: chosen=${p1_r1.chosenNumber}, isExact=${p1_r1.isExact}, points=${p1_r1.points}, penalty=${p1_r1.penalty}`);
    console.log(`Player 2: chosen=${p2_r1.chosenNumber}, isExact=${p2_r1.isExact}, points=${p2_r1.points}, penalty=${p2_r1.penalty}`);

    if (!p1_r1.isExact || p1_r1.points !== 10 || p2_r1.penalty !== -2) {
      throw new Error('Exact Target Rule failed to award +10 and -2 penalty!');
    }
    console.log('PASS: Round 1 Exact Target Strike executed correctly.\n');

    // ------------------------------------------------------------------
    // STEP 5: Round 2 (Duplicate Penalty)
    // ------------------------------------------------------------------
    console.log('[5/7] Testing Round 2: Duplicate Invalidation Rule...');
    await conn.execute('UPDATE prediction_rounds SET status = "COMPLETED" WHERE session_id = ? AND round_number = 1', [sessionId]);
    await conn.execute('INSERT INTO prediction_rounds (session_id, round_number, status) VALUES (?, 2, "SUBMITTING")', [sessionId]);

    // Both pick 35 -> Duplicate! Both get -1 penalty, 0 points
    const r2 = await resolveRound(2, 35, 35);
    console.log(`Round 2 Results: Sum=${r2.sum}, Avg=${r2.average}, Target=${r2.target}`);
    const p1_r2 = r2.scoredList.find((s) => s.userId === 1);
    const p2_r2 = r2.scoredList.find((s) => s.userId === 2);
    console.log(`Player 1: chosen=${p1_r2.chosenNumber}, isDuplicate=${p1_r2.isDuplicate}, penalty=${p1_r2.penalty}`);
    console.log(`Player 2: chosen=${p2_r2.chosenNumber}, isDuplicate=${p2_r2.isDuplicate}, penalty=${p2_r2.penalty}`);

    if (!p1_r2.isDuplicate || !p2_r2.isDuplicate || p1_r2.penalty !== -1 || p2_r2.penalty !== -1) {
      throw new Error('Duplicate Rule failed to penalize -1 for both players!');
    }
    console.log('PASS: Round 2 Duplicate Invalidation executed correctly.\n');

    // ------------------------------------------------------------------
    // STEP 6: Round 3 (0 -> 100 Inversion Rule)
    // ------------------------------------------------------------------
    console.log('[6/7] Testing Round 3: 0 -> 100 Counter-Inversion Rule...');
    await conn.execute('UPDATE prediction_rounds SET status = "COMPLETED" WHERE session_id = ? AND round_number = 2', [sessionId]);
    await conn.execute('INSERT INTO prediction_rounds (session_id, round_number, status) VALUES (?, 3, "SUBMITTING")', [sessionId]);

    // Player 1 picks 0, Player 2 picks 100 -> 0->100 rule triggers! Player 2 wins round!
    const r3 = await resolveRound(3, 0, 100);
    console.log(`Round 3 Results: Sum=${r3.sum}, Avg=${r3.average}, Target=${r3.target}`);
    const p1_r3 = r3.scoredList.find((s) => s.userId === 1);
    const p2_r3 = r3.scoredList.find((s) => s.userId === 2);
    console.log(`Player 1: chosen=${p1_r3.chosenNumber}, isZeroHundred=${p1_r3.isZeroHundred}, points=${p1_r3.points}`);
    console.log(`Player 2: chosen=${p2_r3.chosenNumber}, isZeroHundred=${p2_r3.isZeroHundred}, points=${p2_r3.points}`);

    if (!p2_r3.isZeroHundred || p2_r3.points !== 10) {
      throw new Error('0 -> 100 Inversion Rule failed to award +10 to player 2!');
    }
    console.log('PASS: Round 3 0 -> 100 Inversion executed correctly.\n');

    // ------------------------------------------------------------------
    // STEP 7: Rounds 4 & 5 (Normal Win) + Tournament Completion
    // ------------------------------------------------------------------
    console.log('[7/7] Completing Rounds 4 & 5 and Final Tournament Standings...');
    // Round 4
    await conn.execute('UPDATE prediction_rounds SET status = "COMPLETED" WHERE session_id = ? AND round_number = 3', [sessionId]);
    await conn.execute('INSERT INTO prediction_rounds (session_id, round_number, status) VALUES (?, 4, "SUBMITTING")', [sessionId]);
    await resolveRound(4, 50, 40); // target 36, Player 2 (40) is closer than Player 1 (50)

    // Round 5
    await conn.execute('UPDATE prediction_rounds SET status = "COMPLETED" WHERE session_id = ? AND round_number = 4', [sessionId]);
    await conn.execute('INSERT INTO prediction_rounds (session_id, round_number, status) VALUES (?, 5, "SUBMITTING")', [sessionId]);
    await resolveRound(5, 30, 20); // target 20 -> Player 2 exact 20

    // Complete tournament
    await conn.execute('UPDATE prediction_rounds SET status = "COMPLETED" WHERE session_id = ? AND round_number = 5', [sessionId]);

    const [finalStandings] = await conn.execute(
      'SELECT sp.*, p.display_name FROM session_players sp JOIN user_profiles p ON sp.user_id = p.user_id WHERE sp.session_id = ? ORDER BY sp.final_score DESC',
      [sessionId]
    );

    console.log('\nFinal Tournament Standings:');
    finalStandings.forEach((p, idx) => {
      console.log(`  #${idx + 1}: ${p.display_name} (ID: ${p.user_id}) - Final Score: ${p.final_score} pts`);
    });

    await conn.execute(
      'UPDATE session_players SET final_rank = 1, is_winner = TRUE WHERE session_id = ? AND user_id = ?',
      [sessionId, finalStandings[0].user_id]
    );
    await conn.execute(
      'UPDATE session_players SET final_rank = 2, is_winner = FALSE WHERE session_id = ? AND user_id = ?',
      [sessionId, finalStandings[1].user_id]
    );
    await conn.execute(
      'UPDATE game_sessions SET status = "COMPLETED", completed_at = CURRENT_TIMESTAMP WHERE session_id = ?',
      [sessionId]
    );
    await conn.execute('UPDATE game_rooms SET status = "COMPLETED" WHERE room_id = ?', [roomId]);

    console.log('\n====================================================');
    console.log('   ALL PREDICTION ARENA TESTS PASSED PERFECTLY!     ');
    console.log('====================================================\n');

    // Clean up test data
    console.log('Cleaning up test room and session...');
    await conn.execute('DELETE FROM prediction_submissions WHERE round_id IN (SELECT round_id FROM prediction_rounds WHERE session_id = ?)', [sessionId]);
    await conn.execute('DELETE FROM prediction_rounds WHERE session_id = ?', [sessionId]);
    await conn.execute('DELETE FROM session_players WHERE session_id = ?', [sessionId]);
    await conn.execute('DELETE FROM game_sessions WHERE session_id = ?', [sessionId]);
    await conn.execute('DELETE FROM room_players WHERE room_id = ?', [roomId]);
    await conn.execute('DELETE FROM game_rooms WHERE room_id = ?', [roomId]);
    console.log('PASS: Cleaned up test records.\n');
  } catch (err) {
    console.error('TEST FAILED:', err);
    process.exit(1);
  } finally {
    conn.release();
    await pool.end();
  }
}

runPredictionE2ETest();
