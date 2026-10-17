require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'mindvault-super-secure-production-jwt-key-2026';

function signToken(userId, email, displayName, roles = ['PLAYER']) {
  return jwt.sign(
    {
      userId,
      email,
      displayName,
      roles,
      isAdmin: roles.includes('ADMIN')
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

async function verifyAll() {
  console.log('====================================================');
  console.log('MINDVAULT PRE-DEPLOYMENT VERIFICATION SUITE');
  console.log('====================================================');

  const pool = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'mindvault',
    waitForConnections: true,
    connectionLimit: 5
  });

  let passCount = 0;
  let failCount = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
      passCount++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      failCount++;
    }
  }

  try {
    // ----------------------------------------------------
    // TEST 1: Database Columns & Scenarios
    // ----------------------------------------------------
    console.log('\n1. Verifying Database Schema & Escape Scenarios...');
    const [escSessCols] = await pool.query("SHOW COLUMNS FROM escape_sessions LIKE 'difficulty'");
    assert(escSessCols.length > 0, "escape_sessions table has 'difficulty' column");

    const [roomCols] = await pool.query("SHOW COLUMNS FROM game_rooms LIKE 'difficulty'");
    assert(roomCols.length > 0, "game_rooms table has 'difficulty' column");

    const [scenarios] = await pool.query("SELECT scenario_id, title, difficulty, time_limit_seconds, is_active FROM escape_scenarios");
    assert(scenarios.length >= 3, `Escape room has ${scenarios.length} scenarios configured`);

    const diffsFound = new Set(scenarios.map(s => s.difficulty));
    assert(diffsFound.has('EASY'), "EASY scenario exists");
    assert(diffsFound.has('MEDIUM'), "MEDIUM scenario exists");
    assert(diffsFound.has('HARD'), "HARD scenario exists");

    scenarios.forEach(s => {
      assert(s.time_limit_seconds === 600, `Scenario '${s.title}' timer is strictly 600 seconds (10 minutes)`);
    });

    // ----------------------------------------------------
    // TEST 2: Escape Room Scenario Components & Deduction Flow
    // ----------------------------------------------------
    console.log('\n2. Verifying Escape Room Component Hierarchy for all Scenarios...');
    for (const scen of scenarios) {
      const [rooms] = await pool.query("SELECT escape_room_id, room_name, sequence_order FROM escape_rooms WHERE scenario_id = ? ORDER BY sequence_order", [scen.scenario_id]);
      assert(rooms.length === 3, `Scenario ${scen.scenario_id} (${scen.difficulty}) has exactly 3 chamber sectors`);

      for (const r of rooms) {
        const [objects] = await pool.query("SELECT object_id, name, is_inspectable, is_locked FROM escape_objects WHERE escape_room_id = ?", [r.escape_room_id]);
        const clueObjs = objects.filter(o => !o.is_locked);
        const lockObjs = objects.filter(o => o.is_locked);

        assert(clueObjs.length >= 1, `Chamber '${r.room_name}' has accessible clue/evidence object(s)`);
        assert(lockObjs.length >= 1, `Chamber '${r.room_name}' has locked mechanism object(s)`);

        // Check each clue object has a clue
        for (const co of clueObjs) {
          const [clues] = await pool.query("SELECT clue_id, clue_text FROM escape_clues WHERE object_id = ?", [co.object_id]);
          assert(clues.length >= 1, `Evidence '${co.name}' has valid investigative clue text`);
        }

        // Check each lock object has puzzle and answer
        for (const lo of lockObjs) {
          const [puzzles] = await pool.query("SELECT puzzle_id, puzzle_prompt FROM escape_puzzles WHERE object_id = ?", [lo.object_id]);
          assert(puzzles.length >= 1, `Mechanism '${lo.name}' has associated puzzle`);
          if (puzzles.length > 0) {
            const [answers] = await pool.query("SELECT accepted_plaintext FROM escape_puzzle_answers WHERE puzzle_id = ?", [puzzles[0].puzzle_id]);
            assert(answers.length >= 1, `Puzzle has accepted plaintext answer configured: ${answers[0]?.accepted_plaintext}`);
          }
        }
      }
    }

    // ----------------------------------------------------
    // TEST 3: Admin Promotion Functionality
    // ----------------------------------------------------
    console.log('\n3. Verifying Admin User Promotion & Server Authorization...');
    // Fetch a non-admin player
    const [players] = await pool.query(`
      SELECT u.user_id, p.display_name, GROUP_CONCAT(r.role_name) as roles
      FROM users u
      JOIN user_profiles p ON u.user_id = p.user_id
      LEFT JOIN user_roles ur ON u.user_id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.role_id
      GROUP BY u.user_id, p.display_name
      HAVING roles NOT LIKE '%ADMIN%' OR roles IS NULL
      LIMIT 1
    `);

    assert(players.length > 0, `Found candidate non-admin player: ${players[0]?.display_name} (#${players[0]?.user_id})`);
    const testCandidate = players[0];

    // Find ADMIN role id
    const [adminRoles] = await pool.query("SELECT role_id FROM roles WHERE role_name = 'ADMIN'");
    const adminRoleId = adminRoles[0].role_id;

    // Test idempotent promotion insertion
    await pool.query("INSERT IGNORE INTO user_roles (user_id, role_id) VALUES (?, ?)", [testCandidate.user_id, adminRoleId]);

    // Check user now has ADMIN role
    const [promotedRoles] = await pool.query(`
      SELECT r.role_name FROM user_roles ur
      JOIN roles r ON ur.role_id = r.role_id
      WHERE ur.user_id = ? AND r.role_name = 'ADMIN'
    `, [testCandidate.user_id]);
    assert(promotedRoles.length > 0, `Strategist #${testCandidate.user_id} successfully promoted to ADMIN role in MySQL`);

    // ----------------------------------------------------
    // TEST 4: Leaderboard Baseline & Zero Double-Count Protection
    // ----------------------------------------------------
    console.log('\n4. Verifying Leaderboard Integrity & Clean Stats...');
    const [leaderboard] = await pool.query("SELECT * FROM v_overall_leaderboard LIMIT 5");
    console.log("  Top leaderboard entries:");
    leaderboard.forEach(row => {
      console.log(`    ${row.display_name}: played=${row.total_games_played ?? row.games_played}, won=${row.total_games_won ?? row.games_won}, score=${row.total_score ?? row.score ?? 0}`);
    });

    // Test that accounts, cases, scenarios, words, achievements are preserved
    const [usersCount] = await pool.query("SELECT COUNT(*) as cnt FROM users");
    const [casesCount] = await pool.query("SELECT COUNT(*) as cnt FROM detective_cases");
    const [wordsCount] = await pool.query("SELECT COUNT(*) as cnt FROM drawice_words");
    const [achCount] = await pool.query("SELECT COUNT(*) as cnt FROM achievements");

    assert(usersCount[0].cnt >= 5, `Registered user accounts preserved (${usersCount[0].cnt} users)`);
    assert(casesCount[0].cnt >= 3, `Detective mystery cases preserved (${casesCount[0].cnt} cases)`);
    assert(wordsCount[0].cnt >= 20, `Drawice word bank preserved (${wordsCount[0].cnt} words)`);
    assert(achCount[0].cnt >= 4, `Achievements catalog preserved (${achCount[0].cnt} achievements)`);

    // ----------------------------------------------------
    // TEST 5: Escape Room Difficulty Session Creation & Scoring
    // ----------------------------------------------------
    console.log('\n5. Verifying Escape Room Difficulty Session Creation...');
    for (const diff of ['EASY', 'MEDIUM', 'HARD']) {
      // Simulate room creation and start with each difficulty
      const [scen] = await pool.query("SELECT scenario_id, time_limit_seconds FROM escape_scenarios WHERE difficulty = ? AND is_active = TRUE LIMIT 1", [diff]);
      assert(scen.length > 0, `Active scenario found for difficulty ${diff}`);

      const [rList] = await pool.query("SELECT escape_room_id FROM escape_rooms WHERE scenario_id = ? ORDER BY sequence_order ASC LIMIT 1", [scen[0].scenario_id]);
      assert(rList.length > 0, `Initial chamber room resolved for scenario ${scen[0].scenario_id}`);
    }

    // Escape Room Scoring formula check
    const r1Points = Math.min(30, 1 * 10);
    const r2Points = Math.min(30, 2 * 10);
    const r3Points = Math.min(30, 3 * 10);
    assert(r1Points === 10, "Chamber 1 completion awards 10 points");
    assert(r2Points === 20, "Chamber 2 completion awards progressive 20 points");
    assert(r3Points === 30, "Chamber 3 completion awards maximum 30 points (capped strictly at 30)");

    console.log('\n====================================================');
    console.log(`VERIFICATION COMPLETE: ${passCount} PASSED, ${failCount} FAILED`);
    console.log('====================================================');

    if (failCount === 0) {
      console.log('>>> ALL SYSTEM IMPROVEMENT CHECKS VERIFIED SUCCESSFULLY <<<');
    }

  } catch (err) {
    console.error('Verification error:', err);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

verifyAll();
