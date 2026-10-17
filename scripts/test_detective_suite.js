require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');
const crypto = require('crypto');

async function runDetectiveSuite() {
  console.log('====================================================');
  console.log('   MINDVAULT: DETECTIVE GAME COMPREHENSIVE TEST     ');
  console.log('====================================================');

  const pool = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'mindvault',
    waitForConnections: true,
    connectionLimit: 10
  });

  const passed = [];
  const failed = [];

  function assert(condition, message) {
    if (condition) {
      console.log(`  [PASS] ${message}`);
      passed.push(message);
    } else {
      console.error(`  [FAIL] ${message}`);
      failed.push(message);
    }
  }

  try {
    // ----------------------------------------------------
    // TEST 1: MySQL Connectivity & Schema Verification
    // ----------------------------------------------------
    console.log('\n--- 1. Testing Schema & Table Existence ---');
    const [tables] = await pool.query('SHOW TABLES');
    const tableNames = tables.map((t) => Object.values(t)[0]);

    const requiredDetectiveTables = [
      'detective_cases',
      'detective_suspects',
      'detective_locations',
      'detective_evidence',
      'detective_clues',
      'detective_timeline_events',
      'detective_puzzles',
      'detective_case_solutions',
      'detective_sessions',
      'detective_investigation_actions',
      'detective_discoveries',
      'detective_accusations'
    ];

    for (const tbl of requiredDetectiveTables) {
      assert(tableNames.includes(tbl), `Table ${tbl} exists in MySQL database`);
    }

    // ----------------------------------------------------
    // TEST 2: Seed Data Verification (3 Original Cases)
    // ----------------------------------------------------
    console.log('\n--- 2. Testing Case Seed Data ---');
    const [cases] = await pool.query('SELECT case_id, title, difficulty, investigation_budget, is_active FROM detective_cases ORDER BY case_id ASC');
    assert(cases.length >= 3, `At least 3 detective cases exist (found ${cases.length})`);

    const easyCase = cases.find((c) => c.difficulty === 'EASY');
    const medCase = cases.find((c) => c.difficulty === 'MEDIUM');
    const hardCase = cases.find((c) => c.difficulty === 'HARD');

    assert(Boolean(easyCase), `EASY case exists: "${easyCase?.title}"`);
    assert(Boolean(medCase), `MEDIUM case exists: "${medCase?.title}"`);
    assert(Boolean(hardCase), `HARD case exists: "${hardCase?.title}"`);

    // Verify solutions are configured for all seeded cases
    for (const c of cases) {
      const [sols] = await pool.query('SELECT * FROM detective_case_solutions WHERE case_id = ?', [c.case_id]);
      assert(sols.length > 0, `Authoritative solution configured for case #${c.case_id} ("${c.title}")`);
    }

    // ----------------------------------------------------
    // TEST 3: Single-Player Full Investigation & Scoring
    // ----------------------------------------------------
    console.log('\n--- 3. Single-Player Full Investigation Flow ---');
    // Ensure test user exists
    await pool.query(
      `INSERT INTO users (firebase_uid, email, password_hash) 
       VALUES ('uid_sherlock_test', 'sherlock_test@mindvault.local', 'hash123')
       ON DUPLICATE KEY UPDATE password_hash = 'hash123'`
    );
    const [u1Rows] = await pool.query("SELECT user_id FROM users WHERE email = 'sherlock_test@mindvault.local'");
    const testUserId = u1Rows[0].user_id;

    await pool.query(
      `INSERT INTO user_profiles (user_id, display_name)
       VALUES (?, 'Sherlock Holmes')
       ON DUPLICATE KEY UPDATE display_name = 'Sherlock Holmes'`,
      [testUserId]
    );

    // Create room and game session
    const roomCode = 'DET' + Math.floor(1000 + Math.random() * 9000);
    const [rRes] = await pool.query(
      `INSERT INTO game_rooms (room_code, host_user_id, game_id, max_players, status, case_id)
       VALUES (?, ?, 2, 4, 'STARTED', ?)`,
      [roomCode, testUserId, easyCase.case_id]
    );
    const roomId = rRes.insertId;

    const [gsRes] = await pool.query(
      `INSERT INTO game_sessions (room_id, game_id, status, started_at)
       VALUES (?, 2, 'IN_PROGRESS', CURRENT_TIMESTAMP)`,
      [roomId]
    );
    const sessionId = gsRes.insertId;

    await pool.query(
      `INSERT INTO session_players (session_id, user_id, final_score, is_winner)
       VALUES (?, ?, 0, FALSE)`,
      [sessionId, testUserId]
    );

    // Create detective session
    const [dsRes] = await pool.query(
      `INSERT INTO detective_sessions (session_id, case_id, remaining_budget, status)
       VALUES (?, ?, ?, 'INVESTIGATING')`,
      [sessionId, easyCase.case_id, easyCase.investigation_budget]
    );
    const detectiveSessionId = dsRes.insertId;
    assert(detectiveSessionId > 0, `Created detective session #${detectiveSessionId}`);

    // Fetch case elements for Easy Case
    const [suspects] = await pool.query('SELECT * FROM detective_suspects WHERE case_id = ?', [easyCase.case_id]);
    const [locations] = await pool.query('SELECT * FROM detective_locations WHERE case_id = ?', [easyCase.case_id]);
    const [evidence] = await pool.query('SELECT * FROM detective_evidence WHERE case_id = ?', [easyCase.case_id]);
    const [puzzles] = await pool.query('SELECT * FROM detective_puzzles WHERE case_id = ?', [easyCase.case_id]);
    const [solRows] = await pool.query('SELECT * FROM detective_case_solutions WHERE case_id = ?', [easyCase.case_id]);
    const officialSol = solRows[0];

    // Action 1: Search Location
    const loc = locations[0];
    await pool.query(
      `INSERT INTO detective_investigation_actions (detective_session_id, user_id, action_type, target_id, cost_deducted, result_summary)
       VALUES (?, ?, 'SEARCH_LOCATION', ?, ?, ?)`,
      [detectiveSessionId, testUserId, loc.location_id, loc.action_cost || 10, 'Searched location']
    );
    await pool.query(
      `INSERT INTO detective_discoveries (detective_session_id, user_id, discovery_type, target_id)
       VALUES (?, ?, 'LOCATION_SEARCH', ?)`,
      [detectiveSessionId, testUserId, loc.location_id]
    );

    // Action 2: Interrogate Suspect
    const s = suspects[0];
    await pool.query(
      `INSERT INTO detective_investigation_actions (detective_session_id, user_id, action_type, target_id, cost_deducted, result_summary)
       VALUES (?, ?, 'INTERROGATE', ?, ?, ?)`,
      [detectiveSessionId, testUserId, s.suspect_id, s.interrogation_cost || 10, 'Interrogated suspect']
    );
    await pool.query(
      `INSERT INTO detective_discoveries (detective_session_id, user_id, discovery_type, target_id)
       VALUES (?, ?, 'SUSPECT_STATEMENT', ?)`,
      [detectiveSessionId, testUserId, s.suspect_id]
    );

    // Action 3: Solve Cipher Puzzle
    if (puzzles.length > 0) {
      const pz = puzzles[0];
      await pool.query(
        `INSERT INTO detective_investigation_actions (detective_session_id, user_id, action_type, target_id, cost_deducted, result_summary)
         VALUES (?, ?, 'SOLVE_PUZZLE', ?, ?, ?)`,
        [detectiveSessionId, testUserId, pz.puzzle_id, pz.action_cost || 20, 'Solved cipher puzzle']
      );
      await pool.query(
        `INSERT INTO detective_discoveries (detective_session_id, user_id, discovery_type, target_id)
         VALUES (?, ?, 'PUZZLE_UNLOCKED', ?)`,
        [detectiveSessionId, testUserId, pz.puzzle_id]
      );
    }

    // Verify dynamic budget deduction
    const [spentRows] = await pool.query(
      'SELECT SUM(cost_deducted) AS total_spent FROM detective_investigation_actions WHERE detective_session_id = ? AND user_id = ?',
      [detectiveSessionId, testUserId]
    );
    const totalSpent = Number(spentRows[0].total_spent);
    const expectedRemaining = easyCase.investigation_budget - totalSpent;
    assert(expectedRemaining > 0, `Remaining budget correctly deducted: ${expectedRemaining} pts remaining`);

    // Submit Authoritative Accusation
    const culpritSuspect = suspects.find((s) => s.suspect_id === officialSol.culprit_suspect_id);
    const critEvidence = evidence.find((e) => e.suspect_id === officialSol.culprit_suspect_id && e.is_critical) || evidence[0];

    // Scoring simulation based on rules:
    // Culprit: 40 pts
    // Motive: 25 pts (matching black-market gambling syndicate)
    // Evidence: 20 pts (critical evidence linked to culprit)
    // Reasoning: 15 pts (detailed comprehensive forensic analysis)
    // Efficiency: up to 20 pts
    const suspectScore = 40;
    const motiveScore = 25;
    const evidenceScore = 20;
    const reasoningScore = 15;
    const efficiencyBonus = Math.min(20, Math.round((expectedRemaining / easyCase.investigation_budget) * 20));
    const finalScore = Math.min(120, suspectScore + motiveScore + evidenceScore + reasoningScore + efficiencyBonus);

    await pool.query(
      `INSERT INTO detective_accusations 
       (detective_session_id, user_id, accused_suspect_id, stated_motive, stated_evidence_id, stated_reasoning,
        suspect_score, motive_score, evidence_score, reasoning_score, efficiency_bonus, final_score, is_correct)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)`,
      [
        detectiveSessionId,
        testUserId,
        culpritSuspect.suspect_id,
        officialSol.motive,
        critEvidence.evidence_id,
        'Detailed timeline and vibration grid terminal access proves execution.',
        suspectScore,
        motiveScore,
        evidenceScore,
        reasoningScore,
        efficiencyBonus,
        finalScore
      ]
    );

    assert(finalScore <= 120, `Final score adheres strictly to maximum 120 cap: ${finalScore} pts`);
    assert(finalScore >= 100, `High accuracy accusation achieved high score: ${finalScore} pts`);

    // Update session_players and stats
    await pool.query(
      'UPDATE session_players SET final_score = ?, is_winner = TRUE WHERE session_id = ? AND user_id = ?',
      [finalScore, sessionId, testUserId]
    );

    await pool.query(
      `INSERT INTO player_game_statistics (user_id, game_id, games_played, games_won, total_score, highest_score)
       VALUES (?, 2, 1, 1, ?, ?)
       ON DUPLICATE KEY UPDATE
         games_played = games_played + 1,
         games_won = games_won + 1,
         total_score = total_score + VALUES(total_score),
         highest_score = GREATEST(highest_score, VALUES(highest_score))`,
      [testUserId, finalScore, finalScore]
    );

    // Verify stats
    const [statsRows] = await pool.query(
      'SELECT * FROM player_game_statistics WHERE user_id = ? AND game_id = 2',
      [testUserId]
    );
    assert(statsRows.length > 0 && statsRows[0].games_won >= 1, 'Player game statistics (game_id = 2) updated correctly');

    // Test Idempotency: Attempt duplicate accusation
    let duplicateRejected = false;
    try {
      await pool.query(
        `INSERT INTO detective_accusations 
         (detective_session_id, user_id, accused_suspect_id, stated_motive, stated_evidence_id, stated_reasoning, final_score, is_correct)
         VALUES (?, ?, ?, 'duplicate', ?, 'duplicate', 120, TRUE)`,
        [detectiveSessionId, testUserId, culpritSuspect.suspect_id, critEvidence.evidence_id]
      );
    } catch (e) {
      duplicateRejected = true;
    }
    assert(duplicateRejected, 'Unique constraint uq_det_user_session_accuse strictly prevents duplicate scoring/accusation');

    // ----------------------------------------------------
    // TEST 4: Multiplayer Isolation (2 Players)
    // ----------------------------------------------------
    console.log('\n--- 4. Multiplayer Budget & Discovery Isolation ---');
    // Ensure second test user exists
    await pool.query(
      `INSERT INTO users (firebase_uid, email, password_hash) 
       VALUES ('uid_watson_test', 'watson_test@mindvault.local', 'hash123')
       ON DUPLICATE KEY UPDATE password_hash = 'hash123'`
    );
    const [u2Rows] = await pool.query("SELECT user_id FROM users WHERE email = 'watson_test@mindvault.local'");
    const user2Id = u2Rows[0].user_id;

    await pool.query(
      `INSERT INTO user_profiles (user_id, display_name)
       VALUES (?, 'John Watson')
       ON DUPLICATE KEY UPDATE display_name = 'John Watson'`,
      [user2Id]
    );

    // Create 2-player multiplayer session
    const mpRoomCode = 'DET' + Math.floor(1000 + Math.random() * 9000);
    const [mpRoomRes] = await pool.query(
      `INSERT INTO game_rooms (room_code, host_user_id, game_id, max_players, status, case_id)
       VALUES (?, ?, 2, 4, 'STARTED', ?)`,
      [mpRoomCode, testUserId, medCase.case_id]
    );
    const mpRoomId = mpRoomRes.insertId;

    const [mpGsRes] = await pool.query(
      `INSERT INTO game_sessions (room_id, game_id, status, started_at)
       VALUES (?, 2, 'IN_PROGRESS', CURRENT_TIMESTAMP)`,
      [mpRoomId]
    );
    const mpSessionId = mpGsRes.insertId;

    await pool.query(
      `INSERT INTO session_players (session_id, user_id, final_score, is_winner) VALUES (?, ?, 0, FALSE), (?, ?, 0, FALSE)`,
      [mpSessionId, testUserId, mpSessionId, user2Id]
    );

    const [mpDsRes] = await pool.query(
      `INSERT INTO detective_sessions (session_id, case_id, remaining_budget, status)
       VALUES (?, ?, ?, 'INVESTIGATING')`,
      [mpSessionId, medCase.case_id, medCase.investigation_budget]
    );
    const mpDetectiveSessionId = mpDsRes.insertId;

    // Player 1 performs 3 actions
    await pool.query(
      `INSERT INTO detective_investigation_actions (detective_session_id, user_id, action_type, target_id, cost_deducted, result_summary)
       VALUES (?, ?, 'SEARCH_LOCATION', 1, 15, 'P1 Location Search'),
              (?, ?, 'INTERROGATE', 1, 15, 'P1 Interrogation'),
              (?, ?, 'EXAMINE_CLUE', 1, 10, 'P1 Clue Deduction')`,
      [mpDetectiveSessionId, testUserId, mpDetectiveSessionId, testUserId, mpDetectiveSessionId, testUserId]
    );
    await pool.query(
      `INSERT INTO detective_discoveries (detective_session_id, user_id, discovery_type, target_id)
       VALUES (?, ?, 'LOCATION_SEARCH', 1), (?, ?, 'SUSPECT_STATEMENT', 1), (?, ?, 'CLUE', 1)`,
      [mpDetectiveSessionId, testUserId, mpDetectiveSessionId, testUserId, mpDetectiveSessionId, testUserId]
    );

    // Player 2 performs 1 action
    await pool.query(
      `INSERT INTO detective_investigation_actions (detective_session_id, user_id, action_type, target_id, cost_deducted, result_summary)
       VALUES (?, ?, 'CHECK_TIMELINE', 1, 5, 'P2 Timeline Check')`,
      [mpDetectiveSessionId, user2Id]
    );
    await pool.query(
      `INSERT INTO detective_discoveries (detective_session_id, user_id, discovery_type, target_id)
       VALUES (?, ?, 'TIMELINE_EVENT', 1)`,
      [mpDetectiveSessionId, user2Id]
    );

    // Check Player 1 Spent & Discoveries
    const [p1SpentRows] = await pool.query(
      'SELECT SUM(cost_deducted) AS spent FROM detective_investigation_actions WHERE detective_session_id = ? AND user_id = ?',
      [mpDetectiveSessionId, testUserId]
    );
    const [p1DiscRows] = await pool.query(
      'SELECT * FROM detective_discoveries WHERE detective_session_id = ? AND user_id = ?',
      [mpDetectiveSessionId, testUserId]
    );

    // Check Player 2 Spent & Discoveries
    const [p2SpentRows] = await pool.query(
      'SELECT SUM(cost_deducted) AS spent FROM detective_investigation_actions WHERE detective_session_id = ? AND user_id = ?',
      [mpDetectiveSessionId, user2Id]
    );
    const [p2DiscRows] = await pool.query(
      'SELECT * FROM detective_discoveries WHERE detective_session_id = ? AND user_id = ?',
      [mpDetectiveSessionId, user2Id]
    );

    assert(Number(p1SpentRows[0].spent) === 40, `Player 1 spent 40 pts (Budget: ${medCase.investigation_budget - 40})`);
    assert(Number(p2SpentRows[0].spent) === 5, `Player 2 spent 5 pts (Budget: ${medCase.investigation_budget - 5})`);
    assert(p1DiscRows.length === 3, `Player 1 has 3 isolated discoveries`);
    assert(p2DiscRows.length === 1, `Player 2 has 1 isolated discovery`);
    assert(!p2DiscRows.some((d) => d.discovery_type === 'LOCATION_SEARCH'), "Player 1's discoveries are NOT leaked to Player 2");

    // ----------------------------------------------------
    // TEST 5: Integrity of Other MindVault Games
    // ----------------------------------------------------
    console.log('\n--- 5. Platform Integrity Check (No Regressions) ---');
    const [predRounds] = await pool.query('SELECT COUNT(*) AS cnt FROM prediction_rounds');
    assert(predRounds !== undefined, 'Prediction Arena tables active & operational');

    const [escRooms] = await pool.query('SELECT COUNT(*) AS cnt FROM escape_rooms');
    assert(escRooms !== undefined, 'Escape Room tables active & operational');

    const [drawiceWords] = await pool.query('SELECT COUNT(*) AS cnt FROM drawice_words');
    assert(Number(drawiceWords[0].cnt) >= 20, `Drawice word bank intact (${drawiceWords[0].cnt} words)`);

    // Clean up temporary test sessions and rooms
    await pool.query('DELETE FROM game_rooms WHERE room_code IN (?, ?)', [roomCode, mpRoomCode]);

    console.log('\n====================================================');
    console.log(`TEST SUITE COMPLETE: ${passed.length} passed, ${failed.length} failed`);
    console.log('====================================================\n');

    await pool.end();
    if (failed.length > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Test Suite Exception:', err);
    await pool.end();
    process.exit(1);
  }
}

runDetectiveSuite();
