require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');
const crypto = require('crypto');

async function applyImprovements() {
  console.log('Connecting to MySQL database...');
  const pool = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'mindvault',
    waitForConnections: true,
    connectionLimit: 5
  });

  try {
    console.log('1. Applying additive column migrations...');
    try {
      await pool.query("ALTER TABLE escape_sessions ADD COLUMN difficulty ENUM('EASY', 'MEDIUM', 'HARD') NOT NULL DEFAULT 'MEDIUM' AFTER scenario_id");
      console.log('  Added difficulty column to escape_sessions');
    } catch (e) {
      console.log('  difficulty column already exists in escape_sessions');
    }

    try {
      await pool.query("ALTER TABLE game_rooms ADD COLUMN difficulty VARCHAR(20) NULL AFTER case_id");
      console.log('  Added difficulty column to game_rooms');
    } catch (e) {
      console.log('  difficulty column already exists in game_rooms');
    }

    // 2. Seed EASY and HARD Escape Room Scenarios
    console.log('2. Seeding Easy and Hard Escape Room Scenarios...');
    const [scenarios] = await pool.query('SELECT scenario_id, difficulty, title FROM escape_scenarios');
    const existingDiffs = new Set(scenarios.map(s => s.difficulty));

    // Ensure Scenario 1 is explicitly marked MEDIUM
    await pool.query("UPDATE escape_scenarios SET difficulty = 'MEDIUM' WHERE scenario_id = 1");

    // ==========================================
    // SEED EASY SCENARIO
    // ==========================================
    if (!existingDiffs.has('EASY')) {
      console.log('  Seeding EASY scenario: Cyber Vault Protocol 9 [EASY]...');
      const [scenRes] = await pool.query(
        `INSERT INTO escape_scenarios (title, theme_description, time_limit_seconds, difficulty, is_active)
         VALUES (?, ?, 600, 'EASY', 1)`,
        [
          'Cyber Vault Protocol 9 [EASY]',
          'Automated sub-level security bunker on Recruit clearance. More direct clues and simplified chamber overrides guide your team to safety before atmospheric purge.'
        ]
      );
      const scenId = scenRes.insertId;

      // Rooms
      const [r1] = await pool.query(
        `INSERT INTO escape_rooms (scenario_id, room_name, description, sequence_order, ambient_theme)
         VALUES (?, 'Decontamination Airlock', 'A stainless steel chamber illuminated by flashing amber strobe lights. The airlock doors are magnetically sealed.', 1, 'VAULT_AMBER')`,
        [scenId]
      );
      const [r2] = await pool.query(
        `INSERT INTO escape_rooms (scenario_id, room_name, description, sequence_order, ambient_theme)
         VALUES (?, 'Reactor Core Control', 'Massive glass cylinders hum with ionized coolant. A computerized terminal monitors reactor frequency.', 2, 'VAULT_CYAN')`,
        [scenId]
      );
      const [r3] = await pool.query(
        `INSERT INTO escape_rooms (scenario_id, room_name, description, sequence_order, ambient_theme)
         VALUES (?, 'Central Command Vault', 'The master blast door exit is flanked by dual biometric consoles and a heavy titanium deadbolt.', 3, 'VAULT_DARK')`,
        [scenId]
      );

      // Objects
      const [o1] = await pool.query(
        `INSERT INTO escape_objects (escape_room_id, name, description, is_inspectable, is_locked, icon_name)
         VALUES (?, 'Emergency Breaker Box', 'A heavy metal box secured with a 4-digit mechanical dial lock. Overriding this breaker will disengage the airlock blast hatch.', 1, 1, 'dial')`,
        [r1.insertId]
      );
      const [o2] = await pool.query(
        `INSERT INTO escape_objects (escape_room_id, name, description, is_inspectable, is_locked, icon_name)
         VALUES (?, 'Hazard Warning Placard', 'A yellow warning placard with direct technician instructions: Active emergency decontamination valves 2, 4, 7, 9.', 1, 0, 'file-text')`,
        [r1.insertId]
      );
      const [o3] = await pool.query(
        `INSERT INTO escape_objects (escape_room_id, name, description, is_inspectable, is_locked, icon_name)
         VALUES (?, 'Coolant Balance Console', 'A digital keypad requiring a reactor frequency override code.', 1, 1, 'cpu')`,
        [r2.insertId]
      );
      const [o4] = await pool.query(
        `INSERT INTO escape_objects (escape_room_id, name, description, is_inspectable, is_locked, icon_name)
         VALUES (?, 'Chief Engineer Journal', 'A technician notebook open to a page titled "Core Stability": Harmonic resonance locked at frequency 5389.', 1, 0, 'book')`,
        [r2.insertId]
      );
      const [o5] = await pool.query(
        `INSERT INTO escape_objects (escape_room_id, name, description, is_inspectable, is_locked, icon_name)
         VALUES (?, 'Master Blast Door Interlock', 'A titanium wheel lock connected to the bunker primary atmospheric exhaust.', 1, 1, 'shield')`,
        [r3.insertId]
      );
      const [o6] = await pool.query(
        `INSERT INTO escape_objects (escape_room_id, name, description, is_inspectable, is_locked, icon_name)
         VALUES (?, 'Command Operations Terminal', 'Emergency evacuation directive terminal displaying clearance authorization word: OMEGA.', 1, 0, 'terminal')`,
        [r3.insertId]
      );

      // Clues
      await pool.query(
        `INSERT INTO escape_clues (object_id, clue_text, image_url) VALUES 
         (?, 'SAFETY PROTOCOL DIRECTIVE: In event of airlock quarantine, set emergency purge sequence to active chambers: 2, 4, 7, 9.', '/escape-room/clues/hazard_placard.svg'),
         (?, 'ENGINEER LOG: Core frequency stabilization established at harmonic 5389.', '/escape-room/clues/engineer_journal.svg'),
         (?, 'TERMINAL OVERRIDE: Emergency master blast door evacuation clearance code: OMEGA.', '/escape-room/clues/operations_terminal.svg')`,
        [o2.insertId, o4.insertId, o6.insertId]
      );

      // Puzzles & Answers
      const [pz1] = await pool.query(
        `INSERT INTO escape_puzzles (object_id, puzzle_prompt, puzzle_type, hint_text, difficulty_points)
         VALUES (?, 'Enter the 4-digit emergency chamber calibration sequence indicated on the hazard placard.', 'KEYPAD', 'Input the active chamber numbers in sequential order: 2, 4, 7, 9.', 50)`,
        [o1.insertId]
      );
      const h1 = crypto.createHash('sha256').update('2479').digest('hex');
      await pool.query(
        `INSERT INTO escape_puzzle_answers (puzzle_id, answer_hash, accepted_plaintext) VALUES (?, ?, '2479')`,
        [pz1.insertId, h1]
      );

      const [pz2] = await pool.query(
        `INSERT INTO escape_puzzles (object_id, puzzle_prompt, puzzle_type, hint_text, difficulty_points)
         VALUES (?, 'Enter the 4-digit reactor harmonic modulation frequency from the engineer log.', 'KEYPAD', 'Input the core stability frequency: 5389.', 75)`,
        [o3.insertId]
      );
      const h2 = crypto.createHash('sha256').update('5389').digest('hex');
      await pool.query(
        `INSERT INTO escape_puzzle_answers (puzzle_id, answer_hash, accepted_plaintext) VALUES (?, ?, '5389')`,
        [pz2.insertId, h2]
      );

      const [pz3] = await pool.query(
        `INSERT INTO escape_puzzles (object_id, puzzle_prompt, puzzle_type, hint_text, difficulty_points)
         VALUES (?, 'Input the 5-letter clearance override word displayed on the operations terminal.', 'CIPHER', 'Enter the word OMEGA.', 100)`,
        [o5.insertId]
      );
      const h3 = crypto.createHash('sha256').update('OMEGA').digest('hex');
      await pool.query(
        `INSERT INTO escape_puzzle_answers (puzzle_id, answer_hash, accepted_plaintext) VALUES (?, ?, 'OMEGA')`,
        [pz3.insertId, h3]
      );

      // Locks & Conditions
      const [l1] = await pool.query(
        `INSERT INTO escape_locks (escape_room_id, lock_name, lock_type, target_room_id, is_exit_door)
         VALUES (?, 'Airlock Blast Hatch', 'DOOR', ?, 0)`,
        [r1.insertId, r2.insertId]
      );
      await pool.query(
        `INSERT INTO escape_unlock_conditions (lock_id, required_puzzle_id, required_object_id) VALUES (?, ?, ?)`,
        [l1.insertId, pz1.insertId, o1.insertId]
      );

      const [l2] = await pool.query(
        `INSERT INTO escape_locks (escape_room_id, lock_name, lock_type, target_room_id, is_exit_door)
         VALUES (?, 'Core Security Gate', 'DOOR', ?, 0)`,
        [r2.insertId, r3.insertId]
      );
      await pool.query(
        `INSERT INTO escape_unlock_conditions (lock_id, required_puzzle_id, required_object_id) VALUES (?, ?, ?)`,
        [l2.insertId, pz2.insertId, o3.insertId]
      );

      const [l3] = await pool.query(
        `INSERT INTO escape_locks (escape_room_id, lock_name, lock_type, target_room_id, is_exit_door)
         VALUES (?, 'Main Bunker Exit Hatch', 'DOOR', NULL, 1)`,
        [r3.insertId]
      );
      await pool.query(
        `INSERT INTO escape_unlock_conditions (lock_id, required_puzzle_id, required_object_id) VALUES (?, ?, ?)`,
        [l3.insertId, pz3.insertId, o5.insertId]
      );

      // Hints
      await pool.query(
        `INSERT INTO escape_hints (scenario_id, room_id, hint_number, hint_text) VALUES
         (?, ?, 1, 'Inspect the Hazard Warning Placard to find the 4 active chamber numbers.'),
         (?, ?, 2, 'The 4-digit code is 2479.'),
         (?, ?, 1, 'Check the Chief Engineer Journal for the harmonic frequency.'),
         (?, ?, 2, 'The frequency code is 5389.'),
         (?, ?, 1, 'Read the Operations Terminal screen for the authorization word.'),
         (?, ?, 2, 'The clearance code is OMEGA.')`,
        [scenId, r1.insertId, scenId, r1.insertId, scenId, r2.insertId, scenId, r2.insertId, scenId, r3.insertId, scenId, r3.insertId]
      );
    }

    // ==========================================
    // SEED HARD SCENARIO
    // ==========================================
    if (!existingDiffs.has('HARD')) {
      console.log('  Seeding HARD scenario: Cyber Vault Protocol 9 [HARD]...');
      const [scenRes] = await pool.query(
        `INSERT INTO escape_scenarios (title, theme_description, time_limit_seconds, difficulty, is_active)
         VALUES (?, ?, 600, 'HARD', 1)`,
        [
          'Cyber Vault Protocol 9 [HARD]',
          'Automated sub-level security bunker on Black-Ops clearance. Heavily obfuscated telemetry, inverted parity ciphers, and multi-step deduction challenge elite operatives.'
        ]
      );
      const scenId = scenRes.insertId;

      // Rooms
      const [r1] = await pool.query(
        `INSERT INTO escape_rooms (scenario_id, room_name, description, sequence_order, ambient_theme)
         VALUES (?, 'Decontamination Airlock', 'A stainless steel chamber illuminated by flashing amber strobe lights. The airlock doors are magnetically sealed.', 1, 'VAULT_AMBER')`,
        [scenId]
      );
      const [r2] = await pool.query(
        `INSERT INTO escape_rooms (scenario_id, room_name, description, sequence_order, ambient_theme)
         VALUES (?, 'Reactor Core Control', 'Massive glass cylinders hum with ionized coolant. A computerized terminal monitors reactor frequency.', 2, 'VAULT_CYAN')`,
        [scenId]
      );
      const [r3] = await pool.query(
        `INSERT INTO escape_rooms (scenario_id, room_name, description, sequence_order, ambient_theme)
         VALUES (?, 'Central Command Vault', 'The master blast door exit is flanked by dual biometric consoles and a heavy titanium deadbolt.', 3, 'VAULT_DARK')`,
        [scenId]
      );

      // Objects
      const [o1] = await pool.query(
        `INSERT INTO escape_objects (escape_room_id, name, description, is_inspectable, is_locked, icon_name)
         VALUES (?, 'Emergency Breaker Box', 'A heavy metal box secured with an inverted parity dial lock.', 1, 1, 'dial')`,
        [r1.insertId]
      );
      const [o2] = await pool.query(
        `INSERT INTO escape_objects (escape_room_id, name, description, is_inspectable, is_locked, icon_name)
         VALUES (?, 'Hazard Warning Placard', 'A weathered industrial plate with gas line atomic isotope indices and purge priority routing.', 1, 0, 'file-text')`,
        [r1.insertId]
      );
      const [o3] = await pool.query(
        `INSERT INTO escape_objects (escape_room_id, name, description, is_inspectable, is_locked, icon_name)
         VALUES (?, 'Coolant Balance Console', 'A digital keypad requiring a reactor frequency override code.', 1, 1, 'cpu')`,
        [r2.insertId]
      );
      const [o4] = await pool.query(
        `INSERT INTO escape_objects (escape_room_id, name, description, is_inspectable, is_locked, icon_name)
         VALUES (?, 'Chief Engineer Journal', 'A scorched notebook with waveform peak diagrams and ground-faulted channel B routing.', 1, 0, 'book')`,
        [r2.insertId]
      );
      const [o5] = await pool.query(
        `INSERT INTO escape_objects (escape_room_id, name, description, is_inspectable, is_locked, icon_name)
         VALUES (?, 'Master Blast Door Interlock', 'A titanium wheel lock connected to the bunker primary atmospheric exhaust.', 1, 1, 'shield')`,
        [r3.insertId]
      );
      const [o6] = await pool.query(
        `INSERT INTO escape_objects (escape_room_id, name, description, is_inspectable, is_locked, icon_name)
         VALUES (?, 'Command Operations Terminal', 'Sub-level terminal screen displaying a memory buffer matrix and automated sector routing coordinates.', 1, 0, 'terminal')`,
        [r3.insertId]
      );

      // Clues
      await pool.query(
        `INSERT INTO escape_clues (object_id, clue_text, image_url) VALUES 
         (?, 'A weathered industrial hazard placard. Active chamber isotopes are indexed by atomic number (He=2, Be=4, N=7, F=9). Order by chamber priority sequence.', '/escape-room/clues/hazard_placard.svg'),
         (?, 'Chief Engineer log notes: Channel B is grounded and excluded. Trace the patch sequence A -> D -> C -> E across the waveform peaks.', '/escape-room/clues/engineer_journal.svg'),
         (?, 'Sub-level memory coordinate matrix: Query coordinates (1,3), (3,4), (4,2), (3,3), (4,1) to synthesize the clearance code.', '/escape-room/clues/operations_terminal.svg')`,
        [o2.insertId, o4.insertId, o6.insertId]
      );

      // Puzzles & Answers
      const [pz1] = await pool.query(
        `INSERT INTO escape_puzzles (object_id, puzzle_prompt, puzzle_type, hint_text, difficulty_points)
         VALUES (?, 'Calculate the 4-digit emergency chamber calibration sequence from active chamber atomic numbers.', 'KEYPAD', 'Match the active chamber isotopes: He(2), Be(4), N(7), F(9).', 150)`,
        [o1.insertId]
      );
      const h1 = crypto.createHash('sha256').update('2479').digest('hex');
      await pool.query(
        `INSERT INTO escape_puzzle_answers (puzzle_id, answer_hash, accepted_plaintext) VALUES (?, ?, '2479')`,
        [pz1.insertId, h1]
      );

      const [pz2] = await pool.query(
        `INSERT INTO escape_puzzles (object_id, puzzle_prompt, puzzle_type, hint_text, difficulty_points)
         VALUES (?, 'Enter the 4-digit reactor harmonic modulation frequency following the patch sequence [A -> D -> C -> E].', 'KEYPAD', 'Read the peak amplitudes for A(5), D(3), C(8), E(9).', 200)`,
        [o3.insertId]
      );
      const h2 = crypto.createHash('sha256').update('5389').digest('hex');
      await pool.query(
        `INSERT INTO escape_puzzle_answers (puzzle_id, answer_hash, accepted_plaintext) VALUES (?, ?, '5389')`,
        [pz2.insertId, h2]
      );

      const [pz3] = await pool.query(
        `INSERT INTO escape_puzzles (object_id, puzzle_prompt, puzzle_type, hint_text, difficulty_points)
         VALUES (?, 'Reconstruct the 5-letter clearance word by querying the matrix rows and columns in order.', 'CIPHER', 'Query coordinates: Row 1 Col 3 (O), Row 3 Col 4 (M), Row 4 Col 2 (E), Row 3 Col 3 (G), Row 4 Col 1 (A).', 250)`,
        [o5.insertId]
      );
      const h3 = crypto.createHash('sha256').update('OMEGA').digest('hex');
      await pool.query(
        `INSERT INTO escape_puzzle_answers (puzzle_id, answer_hash, accepted_plaintext) VALUES (?, ?, 'OMEGA')`,
        [pz3.insertId, h3]
      );

      // Locks & Conditions
      const [l1] = await pool.query(
        `INSERT INTO escape_locks (escape_room_id, lock_name, lock_type, target_room_id, is_exit_door)
         VALUES (?, 'Airlock Blast Hatch', 'DOOR', ?, 0)`,
        [r1.insertId, r2.insertId]
      );
      await pool.query(
        `INSERT INTO escape_unlock_conditions (lock_id, required_puzzle_id, required_object_id) VALUES (?, ?, ?)`,
        [l1.insertId, pz1.insertId, o1.insertId]
      );

      const [l2] = await pool.query(
        `INSERT INTO escape_locks (escape_room_id, lock_name, lock_type, target_room_id, is_exit_door)
         VALUES (?, 'Core Security Gate', 'DOOR', ?, 0)`,
        [r2.insertId, r3.insertId]
      );
      await pool.query(
        `INSERT INTO escape_unlock_conditions (lock_id, required_puzzle_id, required_object_id) VALUES (?, ?, ?)`,
        [l2.insertId, pz2.insertId, o3.insertId]
      );

      const [l3] = await pool.query(
        `INSERT INTO escape_locks (escape_room_id, lock_name, lock_type, target_room_id, is_exit_door)
         VALUES (?, 'Main Bunker Exit Hatch', 'DOOR', NULL, 1)`,
        [r3.insertId]
      );
      await pool.query(
        `INSERT INTO escape_unlock_conditions (lock_id, required_puzzle_id, required_object_id) VALUES (?, ?, ?)`,
        [l3.insertId, pz3.insertId, o5.insertId]
      );

      // Hints
      await pool.query(
        `INSERT INTO escape_hints (scenario_id, room_id, hint_number, hint_text) VALUES
         (?, ?, 1, 'Atomic coefficients on the placard correspond to Helium, Beryllium, Nitrogen, and Fluorine.'),
         (?, ?, 2, 'Atomic numbers are 2, 4, 7, 9.'),
         (?, ?, 1, 'Trace the cable route while excluding grounded channel B.'),
         (?, ?, 2, 'Follow A -> D -> C -> E: 5389.'),
         (?, ?, 1, 'Intersect the row and column coordinates on the operations terminal screen.'),
         (?, ?, 2, 'The 5-letter clearance word is OMEGA.')`,
        [scenId, r1.insertId, scenId, r1.insertId, scenId, r2.insertId, scenId, r2.insertId, scenId, r3.insertId, scenId, r3.insertId]
      );
    }

    // 3. Reset test scores cleanly
    console.log('3. Safely resetting test scores to zero (preserving all accounts, profiles, roles, game configs)...');
    // Clear test sessions and player stats
    await pool.query('DELETE FROM player_game_statistics');
    await pool.query('DELETE FROM user_achievements');
    await pool.query('DELETE FROM game_rooms');

    console.log('  Cleaned test game sessions and reset player_game_statistics to 0.');
    const [leaderboardRows] = await pool.query('SELECT * FROM v_overall_leaderboard');
    console.log('  Verified Leaderboard after reset:');
    console.table(leaderboardRows.map(r => ({ user_id: r.user_id, name: r.display_name, score: r.aggregate_score, rank: r.global_rank })));

    console.log('\nAll migrations, scenarios seeding, and score resets completed successfully!');
    await pool.end();
  } catch (err) {
    console.error('Migration error:', err);
    await pool.end();
    process.exit(1);
  }
}

applyImprovements();
