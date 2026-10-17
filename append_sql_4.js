const fs = require('fs');
const path = require('path');
const p = path.join(__dirname, 'database', 'mindvault.sql');

const ddl = `
-- 8. INITIAL SEED DATA
INSERT INTO roles (role_name, description) VALUES
('PLAYER', 'Standard player account with lobby, matchmaking, and leaderboard access'),
('ADMIN', 'Platform administrator with content, game, and user management authority')
ON DUPLICATE KEY UPDATE description = VALUES(description);

INSERT INTO games (game_code, game_name, description, min_players, max_players, is_active) VALUES
('PREDICTION_ARENA', 'Prediction Arena', 'Mathematical multiplayer strategy. Predict the hidden target value (average x 0.8) while navigating duplicate penalties and shifting rule unlocks.', 5, 10, TRUE),
('DETECTIVE', 'Detective', 'Forensic investigation noir. Analyze crime scenes, cross-examine suspects with tight action budgets, unlock encrypted puzzles, and deliver authoritative accusations.', 1, 10, TRUE),
('ESCAPE_ROOM', 'Escape Room', 'Cooperative vault breakout. Team up to solve interconnected ciphers, mechanical locks, and tactile puzzles with strictly two precious hints per mission.', 1, 5, TRUE),
('DRAWICE', 'Drawice', 'Fast-paced multiplayer drawing studio. Fair artist rotation, secret word selections, real-time socket canvas strokes, and lightning-fast guessing speed scoring.', 2, 10, TRUE)
ON DUPLICATE KEY UPDATE 
    game_name = VALUES(game_name),
    description = VALUES(description),
    min_players = VALUES(min_players),
    max_players = VALUES(max_players);

INSERT INTO achievements (game_id, name, description, icon_url, requirement_type, requirement_value) VALUES
(NULL, 'First Blood', 'Win your very first game on the MindVault platform', '/icons/achievements/first-blood.svg', 'GAMES_WON_TOTAL', 1),
(NULL, 'Century Club', 'Accumulate over 100 total score points across all vault arenas', '/icons/achievements/century.svg', 'TOTAL_SCORE_OVERALL', 100),
(1, 'Target Zero', 'Select the exact mathematical target in Prediction Arena', '/icons/achievements/exact-target.svg', 'PREDICTION_EXACT_TARGET', 1),
(1, 'Mind Reader', 'Successfully win a round using the 0 to 100 inversion rule', '/icons/achievements/zero-hundred.svg', 'PREDICTION_ZERO_HUNDRED', 1),
(2, 'Master Sleuth', 'Correctly identify the culprit, motive, and evidence on hard difficulty', '/icons/achievements/sleuth.svg', 'DETECTIVE_HARD_SOLVE', 1),
(2, 'Budget Master', 'Solve a mystery case with more than 40% investigation budget remaining', '/icons/achievements/budget.svg', 'DETECTIVE_BUDGET_SAVER', 1),
(3, 'Vault Breaker', 'Escape any scenario with zero hints used', '/icons/achievements/no-hint-escape.svg', 'ESCAPE_ZERO_HINTS', 1),
(3, 'Speed Demon', 'Escape any vault scenario in under 10 minutes', '/icons/achievements/speed-escape.svg', 'ESCAPE_SPEED_RUN', 600),
(4, 'Picasso Precision', 'Score maximum artist points with all guessers identifying your drawing', '/icons/achievements/artist-ace.svg', 'DRAWICE_PERFECT_ARTIST', 1),
(4, 'Lightning Guess', 'Be the first correct guesser within 5 seconds of round start', '/icons/achievements/lightning-guess.svg', 'DRAWICE_FAST_GUESS', 1)
ON DUPLICATE KEY UPDATE description = VALUES(description);

INSERT INTO drawice_words (word, category, difficulty) VALUES
('Microscope', 'Science', 'EASY'),
('Black Hole', 'Space', 'MEDIUM'),
('Submarine', 'Vehicles', 'EASY'),
('Hourglass', 'Objects', 'EASY'),
('Cyberpunk', 'Concepts', 'HARD'),
('Constellation', 'Space', 'MEDIUM'),
('Lighthouse', 'Architecture', 'EASY'),
('Telescope', 'Science', 'EASY'),
('DNA Helix', 'Biology', 'MEDIUM'),
('Quantum Computer', 'Technology', 'HARD'),
('Pyramids', 'Monuments', 'EASY'),
('Satellite', 'Space', 'EASY'),
('Volcano', 'Nature', 'EASY'),
('Compass', 'Tools', 'EASY'),
('Chameleon', 'Animals', 'MEDIUM'),
('Matrix', 'Concepts', 'HARD'),
('Metronome', 'Music', 'MEDIUM'),
('Hoverboard', 'Technology', 'EASY'),
('Steampunk Goggles', 'Fashion', 'HARD'),
('Supernova', 'Space', 'MEDIUM')
ON DUPLICATE KEY UPDATE category = VALUES(category);

-- Realistic Detective Case: "The Obsidian Heist"
INSERT INTO detective_cases (case_id, title, synopsis, difficulty, investigation_budget) VALUES
(1, 'The Obsidian Heist', 'At 02:14 AM, the ultra-secure Blackwood Vault was breached. The legendary Midnight Sapphire vanished without tripping the acoustic grid. Chief Architect Dr. Vane was found drugged inside the mainframe chamber.', 'MEDIUM', 100)
ON DUPLICATE KEY UPDATE title = VALUES(title);

INSERT INTO detective_suspects (suspect_id, case_id, name, occupation, background, alibi, is_culprit, interrogation_cost) VALUES
(1, 1, 'Julian Vance', 'Security Overseer', 'Former naval cryptographer who designed the acoustic perimeter.', 'Claims he was recalibrating sensors in Sector C from 01:45 to 02:30 AM.', FALSE, 10),
(2, 1, 'Elena Rostova', 'Systems Archivist', 'Brilliant hacker recruited by Blackwood to oversee biometric records.', 'States she was logged into the digital registry until power flickered at 02:10 AM.', TRUE, 10),
(3, 1, 'Marcus Kane', 'Vault Technician', 'Senior mechanic with unrestricted physical bypass tools.', 'Claims he was in the lower boiler room repairing steam pressure lines.', FALSE, 10)
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO detective_locations (location_id, case_id, name, description, action_cost) VALUES
(1, 1, 'Mainframe Chamber', 'The heart of the facility. Dr. Vane was discovered slumped across Terminal 4.', 10),
(2, 1, 'Acoustic Grid Relay', 'Junction box controlling high-frequency vibration sensors in the vault corridor.', 10),
(3, 1, 'Archivist Terminal', 'Elena Rostova private workstation in the upper gallery overlooking the vault.', 10)
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO detective_evidence (evidence_id, case_id, location_id, suspect_id, title, description, analysis_cost) VALUES
(1, 1, 1, 2, 'Decoded Biometric Bypass Dongle', 'A custom flash drive containing forged retinal signatures of Dr. Vane, formatted with Elena private encryption key.', 15),
(2, 1, 2, 1, 'Burned Resistor Wire', 'Surgically spliced sensor wire creating a 90-second blind spot in Sector C.', 15),
(3, 1, 3, 2, 'Unsent Encrypted Transmission', 'Draft outbound packet to an offshore broker offering the Midnight Sapphire.', 15)
ON DUPLICATE KEY UPDATE title = VALUES(title);

INSERT INTO detective_clues (clue_id, case_id, evidence_id, clue_text, action_cost) VALUES
(1, 1, 1, 'The bypass dongle timestamp proves it was inserted at 02:11 AM from Elena console.', 15),
(2, 1, 2, 'The acoustic relay was bypassed remotely via network packet, not physical tampering.', 15),
(3, 1, 3, 'Offshore wallet address in draft packet matches Elena personal cryptographic ledger.', 15)
ON DUPLICATE KEY UPDATE clue_text = VALUES(clue_text);

INSERT INTO detective_timeline_events (event_id, case_id, timestamp_label, event_description, suspect_id) VALUES
(1, 1, '01:50 AM', 'Marcus Kane clocks in at the boiler station; steam telemetry confirms continuous manual operation.', 3),
(2, 1, '02:08 AM', 'Dr. Vane accepts a coffee delivery at the Mainframe door.', NULL),
(3, 1, '02:11 AM', 'Terminal 4 registers forced root bypass using Elena cryptographic dongle.', 2),
(4, 1, '02:14 AM', 'Vault pressure seal opens; Sapphire removed from pedestal.', 2)
ON DUPLICATE KEY UPDATE timestamp_label = VALUES(timestamp_label);

INSERT INTO detective_puzzles (puzzle_id, case_id, prompt, puzzle_type, solution_hash, hint, action_cost) VALUES
(1, 1, 'Decrypt the root terminal bypass code: "SHIFT-3 CIPHER: FRUUFSW"', 'CIPHER', 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', 'Shift each letter backward by 3 positions.', 20)
ON DUPLICATE KEY UPDATE prompt = VALUES(prompt);

INSERT INTO detective_case_solutions (solution_id, case_id, culprit_suspect_id, motive, murder_weapon_or_method, critical_evidence_summary) VALUES
(1, 1, 2, 'Financial extortion and sale to offshore syndicate', 'Drugged coffee and encrypted biometric bypass dongle', 'Elena used her terminal to inject the bypass dongle at 02:11 AM and staged offshore sale packet.')
ON DUPLICATE KEY UPDATE motive = VALUES(motive);

-- Realistic Escape Room Scenario: "Cyber Vault Protocol 9"
INSERT INTO escape_scenarios (scenario_id, title, theme_description, time_limit_seconds, difficulty) VALUES
(1, 'Cyber Vault Protocol 9', 'You and your specialist infiltration squad are trapped inside an automated sub-level security bunker. The atmospheric purge activates in 30 minutes. Solve the sequential locks and override the central blast door to escape.', 1800, 'MEDIUM')
ON DUPLICATE KEY UPDATE title = VALUES(title);

INSERT INTO escape_rooms (escape_room_id, scenario_id, room_name, description, sequence_order, ambient_theme) VALUES
(1, 1, 'Decontamination Airlock', 'A stainless steel chamber illuminated by flashing amber strobe lights. The airlock doors are magnetically sealed.', 1, 'VAULT_AMBER'),
(2, 1, 'Reactor Core Control', 'Massive glass cylinders hum with ionized coolant. A computerized terminal monitors reactor frequency.', 2, 'VAULT_CYAN'),
(3, 1, 'Central Command Vault', 'The master blast door exit is flanked by dual biometric consoles and a heavy titanium deadbolt.', 3, 'VAULT_DARK')
ON DUPLICATE KEY UPDATE room_name = VALUES(room_name);

INSERT INTO escape_objects (object_id, escape_room_id, name, description, is_inspectable, is_locked, icon_name) VALUES
(1, 1, 'Emergency Breaker Box', 'A heavy metal box secured with a 4-digit mechanical dial lock.', TRUE, TRUE, 'dial'),
(2, 1, 'Hazard Warning Placard', 'A scratched yellow warning plate with a cryptic sequence of chemical isotopes.', TRUE, FALSE, 'file-text'),
(3, 2, 'Coolant Balance Console', 'A digital keypad requiring a reactor frequency override code.', TRUE, TRUE, 'cpu'),
(4, 2, 'Chief Engineer Journal', 'A scorched notebook open to a page titled "Harmonic Equilibrium".', TRUE, FALSE, 'book'),
(5, 3, 'Master Blast Door Interlock', 'A titanium wheel lock connected to the bunker primary atmospheric exhaust.', TRUE, TRUE, 'shield')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO escape_clues (clue_id, object_id, clue_text) VALUES
(1, 2, 'The placard highlights atomic numbers for: Carbon (6), Oxygen (8), Neon (10), Magnesium (12). Formula: Sum the even digits.'),
(2, 4, 'Journal note: "To prevent thermal cascade, invert the sequence of prime squares: 4, 9, 25, 49 -> Read backward as 7532."')
ON DUPLICATE KEY UPDATE clue_text = VALUES(clue_text);

INSERT INTO escape_puzzles (puzzle_id, object_id, puzzle_prompt, puzzle_type, hint_text, difficulty_points) VALUES
(1, 1, 'Enter the 4-digit code deduced from the Hazard Warning Placard isotopes: Sum 6, 8, 10, 12 = 36; multiplied by 100 plus 24.', 'KEYPAD', 'Calculate (36 * 100) + 24.', 100),
(2, 3, 'Enter the 4-digit reactor frequency code from the Chief Engineer Journal.', 'KEYPAD', 'Read the prime root sequence in reverse as instructed in the journal.', 150),
(3, 5, 'Input the master blast door terminal override sequence: "VAULT9"', 'CIPHER', 'Type the scenario protocol designation in capital letters.', 200)
ON DUPLICATE KEY UPDATE puzzle_prompt = VALUES(puzzle_prompt);

INSERT INTO escape_puzzle_answers (answer_id, puzzle_id, answer_hash, accepted_plaintext) VALUES
(1, 1, '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', '3624'),
(2, 2, '4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a', '7532'),
(3, 3, '6c2ef50ee63c9b2f6ef534a6ef5309322319efb0451a6652c79b69b2d3d9fe21', 'VAULT9')
ON DUPLICATE KEY UPDATE accepted_plaintext = VALUES(accepted_plaintext);

INSERT INTO escape_locks (lock_id, escape_room_id, lock_name, lock_type, target_room_id, is_exit_door) VALUES
(1, 1, 'Airlock Blast Hatch', 'DOOR', 2, FALSE),
(2, 2, 'Core Security Gate', 'DOOR', 3, FALSE),
(3, 3, 'Main Bunker Exit Hatch', 'DOOR', NULL, TRUE)
ON DUPLICATE KEY UPDATE lock_name = VALUES(lock_name);

INSERT INTO escape_unlock_conditions (condition_id, lock_id, required_puzzle_id, required_object_id) VALUES
(1, 1, 1, 1),
(2, 2, 2, 3),
(3, 3, 3, 5)
ON DUPLICATE KEY UPDATE condition_id = VALUES(condition_id);

INSERT INTO escape_hints (hint_id, scenario_id, room_id, hint_number, hint_text) VALUES
(1, 1, 1, 1, 'In the Airlock, inspect the Hazard Warning Placard. Sum the atomic numbers and follow the mathematical formula exactly.'),
(2, 1, 2, 2, 'In the Reactor Core, the journal indicates prime squares (2^2, 3^2, 5^2, 7^2). The reverse roots give the 4-digit keypad combination.')
ON DUPLICATE KEY UPDATE hint_text = VALUES(hint_text);

SET FOREIGN_KEY_CHECKS = 1;
`;

fs.appendFileSync(p, ddl);
console.log('Seed data and constraints finalized.');
