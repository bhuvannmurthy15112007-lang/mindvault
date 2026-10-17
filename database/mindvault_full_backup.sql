-- ========================================================
-- MINDVAULT AUTHORITATIVE FULL DATABASE BACKUP
-- Generated: 2026-10-17T17:37:06.416Z
-- ========================================================

SET FOREIGN_KEY_CHECKS = 0;

-- --------------------------------------------------------
-- Table structure for `achievements`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `achievements`;
CREATE TABLE `achievements` (
  `achievement_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `game_id` bigint unsigned DEFAULT NULL,
  `name` varchar(100) NOT NULL,
  `description` text NOT NULL,
  `icon_url` varchar(500) NOT NULL,
  `requirement_type` varchar(50) NOT NULL,
  `requirement_value` int unsigned NOT NULL DEFAULT '1',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`achievement_id`),
  UNIQUE KEY `name` (`name`),
  KEY `fk_achievements_game` (`game_id`),
  CONSTRAINT `fk_achievements_game` FOREIGN KEY (`game_id`) REFERENCES `games` (`game_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=197 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for `achievements` (4 rows)
INSERT INTO `achievements` (`achievement_id`, `game_id`, `name`, `description`, `icon_url`, `requirement_type`, `requirement_value`, `is_active`, `created_at`) VALUES (1, NULL, 'First Blood', 'Win your very first game on the MindVault platform', '/icons/achievements/first-blood.svg', 'GAMES_WON_TOTAL', 1, 1, '2026-10-07 14:10:42');
INSERT INTO `achievements` (`achievement_id`, `game_id`, `name`, `description`, `icon_url`, `requirement_type`, `requirement_value`, `is_active`, `created_at`) VALUES (2, NULL, 'Century Club', 'Accumulate over 100 total score points across all vault arenas', '/icons/achievements/century.svg', 'TOTAL_SCORE_OVERALL', 100, 1, '2026-10-07 14:10:42');
INSERT INTO `achievements` (`achievement_id`, `game_id`, `name`, `description`, `icon_url`, `requirement_type`, `requirement_value`, `is_active`, `created_at`) VALUES (3, 3, 'Vault Breaker', 'Escape any scenario with zero hints used', '/icons/achievements/no-hint-escape.svg', 'ESCAPE_ZERO_HINTS', 1, 1, '2026-10-07 14:10:42');
INSERT INTO `achievements` (`achievement_id`, `game_id`, `name`, `description`, `icon_url`, `requirement_type`, `requirement_value`, `is_active`, `created_at`) VALUES (4, 3, 'Speed Demon', 'Escape any vault scenario in under 10 minutes', '/icons/achievements/speed-escape.svg', 'ESCAPE_SPEED_RUN', 600, 1, '2026-10-07 14:10:42');

-- --------------------------------------------------------
-- Table structure for `detective_accusations`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `detective_accusations`;
CREATE TABLE `detective_accusations` (
  `accusation_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `detective_session_id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `accused_suspect_id` bigint unsigned NOT NULL,
  `stated_motive` varchar(255) NOT NULL,
  `stated_evidence_id` bigint unsigned NOT NULL,
  `stated_reasoning` text NOT NULL,
  `suspect_score` int NOT NULL DEFAULT '0',
  `motive_score` int NOT NULL DEFAULT '0',
  `evidence_score` int NOT NULL DEFAULT '0',
  `reasoning_score` int NOT NULL DEFAULT '0',
  `efficiency_bonus` int NOT NULL DEFAULT '0',
  `final_score` int NOT NULL DEFAULT '0',
  `is_correct` tinyint(1) NOT NULL DEFAULT '0',
  `accused_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`accusation_id`),
  UNIQUE KEY `uq_det_user_session_accuse` (`detective_session_id`,`user_id`),
  KEY `fk_det_acc_user` (`user_id`),
  KEY `fk_det_acc_suspect` (`accused_suspect_id`),
  KEY `fk_det_acc_ev` (`stated_evidence_id`),
  CONSTRAINT `fk_det_acc_ev` FOREIGN KEY (`stated_evidence_id`) REFERENCES `detective_evidence` (`evidence_id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_det_acc_session` FOREIGN KEY (`detective_session_id`) REFERENCES `detective_sessions` (`detective_session_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_det_acc_suspect` FOREIGN KEY (`accused_suspect_id`) REFERENCES `detective_suspects` (`suspect_id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_det_acc_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------
-- Table structure for `detective_case_solutions`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `detective_case_solutions`;
CREATE TABLE `detective_case_solutions` (
  `solution_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `case_id` bigint unsigned NOT NULL,
  `culprit_suspect_id` bigint unsigned NOT NULL,
  `motive` varchar(255) NOT NULL,
  `murder_weapon_or_method` varchar(255) NOT NULL,
  `critical_evidence_summary` text NOT NULL,
  `explanation` text NOT NULL,
  PRIMARY KEY (`solution_id`),
  UNIQUE KEY `case_id` (`case_id`),
  KEY `fk_det_sol_suspect` (`culprit_suspect_id`),
  CONSTRAINT `fk_det_sol_case` FOREIGN KEY (`case_id`) REFERENCES `detective_cases` (`case_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_det_sol_suspect` FOREIGN KEY (`culprit_suspect_id`) REFERENCES `detective_suspects` (`suspect_id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for `detective_case_solutions` (3 rows)
INSERT INTO `detective_case_solutions` (`solution_id`, `case_id`, `culprit_suspect_id`, `motive`, `murder_weapon_or_method`, `critical_evidence_summary`, `explanation`) VALUES (1, 1, 2, 'Black-market debt liquidation to illegal tech syndicates', 'Disabled acoustic vibration grid via maintenance terminal override and replaced holocube with counterfeit', 'Overridden Sensor Relay Shunt and Counterfeit Holocube Transmitter bearing Maya Lin toolkit marks', 'Maya Lin used her administrative technician credentials to silence the vibration grid at 11:43 PM from the maintenance booth, swapping the real Elysium holocube for a cheap hologram before patrons noticed.');
INSERT INTO `detective_case_solutions` (`solution_id`, `case_id`, `culprit_suspect_id`, `motive`, `murder_weapon_or_method`, `critical_evidence_summary`, `explanation`) VALUES (2, 2, 5, 'Offshore liquidation for cryptographic windfall and black-market sale', 'Administered sleeping sedative in coffee and bypassed retinal sensors with custom dongle', 'Decoded Biometric Bypass Dongle formatted with Elena personal encryption key', 'Elena Rostova drugged Dr. Vane and used her forged biometric dongle at 02:11 AM to remotely suppress acoustic sensors and steal the Midnight Sapphire.');
INSERT INTO `detective_case_solutions` (`solution_id`, `case_id`, `culprit_suspect_id`, `motive`, `murder_weapon_or_method`, `critical_evidence_summary`, `explanation`) VALUES (3, 3, 8, 'Prevent Thorne from filing a whistleblower report regarding illegal patent transfers', 'Synthesized aconitine aerosol dispersed through HVAC manifold with proprietary polymer stabilizer', 'Modified Aerosol Canister containing Vivienne proprietary stabilizer and requisition #8812 records', 'Dr. Vivienne Cross fitted a pressurized aerosol canister containing aconitine and her patented stabilizer to the HVAC manifold at 03:22 AM, poisoning Dr. Thorne to prevent him from exposing her corporate espionage.');

-- --------------------------------------------------------
-- Table structure for `detective_cases`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `detective_cases`;
CREATE TABLE `detective_cases` (
  `case_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `title` varchar(150) NOT NULL,
  `synopsis` text NOT NULL,
  `difficulty` enum('EASY','MEDIUM','HARD') NOT NULL DEFAULT 'MEDIUM',
  `investigation_budget` int unsigned NOT NULL DEFAULT '100',
  `incident_location` varchar(200) DEFAULT NULL,
  `incident_time` varchar(100) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`case_id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for `detective_cases` (3 rows)
INSERT INTO `detective_cases` (`case_id`, `title`, `synopsis`, `difficulty`, `investigation_budget`, `incident_location`, `incident_time`, `is_active`, `created_at`) VALUES (1, 'The Gallery Mirage', 'At 11:45 PM during the midnight gala at Valois Modern Art Gallery, the prized digital holocube \"Elysium\" was substituted with a counterfeit hologram. The acoustic vibration grid was silently suppressed from the maintenance booth.', 'EASY', 100, 'Valois Modern Art Gallery, Sector 4', '11:45 PM', 1, '2026-10-16 02:56:01');
INSERT INTO `detective_cases` (`case_id`, `title`, `synopsis`, `difficulty`, `investigation_budget`, `incident_location`, `incident_time`, `is_active`, `created_at`) VALUES (2, 'The Obsidian Heist', 'At 02:14 AM, the ultra-secure Blackwood Vault was breached. The legendary Midnight Sapphire vanished without tripping the acoustic grid. Chief Architect Dr. Vane was found drugged inside the mainframe chamber.', 'MEDIUM', 100, 'Blackwood High-Security Vault, Sub-Level 4', '02:14 AM', 1, '2026-10-16 02:56:01');
INSERT INTO `detective_cases` (`case_id`, `title`, `synopsis`, `difficulty`, `investigation_budget`, `incident_location`, `incident_time`, `is_active`, `created_at`) VALUES (3, 'The Alchemist\'s Poison', 'Lead biochemist Dr. Aris Thorne was found fatally poisoned inside the hermetic synthesis cleanroom during the classified synthesis of Project Chimera. The room was sealed with dual-keycard biometric interlocks.', 'HARD', 120, 'NeuroGen Research Facility, Sub-Level 3', '03:30 AM', 1, '2026-10-16 02:56:01');

-- --------------------------------------------------------
-- Table structure for `detective_clues`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `detective_clues`;
CREATE TABLE `detective_clues` (
  `clue_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `case_id` bigint unsigned NOT NULL,
  `evidence_id` bigint unsigned DEFAULT NULL,
  `clue_text` text NOT NULL,
  `action_cost` int unsigned NOT NULL DEFAULT '15',
  `deduction_notes` text,
  PRIMARY KEY (`clue_id`),
  KEY `fk_det_clue_case` (`case_id`),
  KEY `fk_det_clue_ev` (`evidence_id`),
  CONSTRAINT `fk_det_clue_case` FOREIGN KEY (`case_id`) REFERENCES `detective_cases` (`case_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_det_clue_ev` FOREIGN KEY (`evidence_id`) REFERENCES `detective_evidence` (`evidence_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for `detective_clues` (9 rows)
INSERT INTO `detective_clues` (`clue_id`, `case_id`, `evidence_id`, `clue_text`, `action_cost`, `deduction_notes`) VALUES (1, 1, 2, 'Terminal audit confirms badge #4421 (Maya Lin) bypassed the gallery grid at 11:43 PM.', 15, 'Points directly to technician override.');
INSERT INTO `detective_clues` (`clue_id`, `case_id`, `evidence_id`, `clue_text`, `action_cost`, `deduction_notes`) VALUES (2, 1, NULL, 'Satellite phone records confirm Victor Vance was connected to a Geneva number from 11:41 to 11:49 PM.', 10, 'Corroborates Vance alibi.');
INSERT INTO `detective_clues` (`clue_id`, `case_id`, `evidence_id`, `clue_text`, `action_cost`, `deduction_notes`) VALUES (3, 1, NULL, 'Curator Pierre Dubois personal bank account has zero irregular transfers or overseas liens.', 10, 'Clears curator of financial motive.');
INSERT INTO `detective_clues` (`clue_id`, `case_id`, `evidence_id`, `clue_text`, `action_cost`, `deduction_notes`) VALUES (4, 2, 4, 'The bypass dongle timestamp proves it was inserted at 02:11 AM from Terminal 4.', 15, 'Confirms exact execution time.');
INSERT INTO `detective_clues` (`clue_id`, `case_id`, `evidence_id`, `clue_text`, `action_cost`, `deduction_notes`) VALUES (5, 2, 5, 'The acoustic relay was bypassed remotely via network packet, not physical wire splicing.', 15, 'Eliminates technician Marcus Kane.');
INSERT INTO `detective_clues` (`clue_id`, `case_id`, `evidence_id`, `clue_text`, `action_cost`, `deduction_notes`) VALUES (6, 2, 6, 'Offshore wallet address in draft packet matches Elena personal cryptographic ledger.', 15, 'Establishes direct financial motive.');
INSERT INTO `detective_clues` (`clue_id`, `case_id`, `evidence_id`, `clue_text`, `action_cost`, `deduction_notes`) VALUES (7, 3, 7, 'Mass spectrometry confirms the aconitine aerosol was stabilized with Dr. Cross patented fluoropolymer.', 15, 'Direct physical link to Vivienne Cross.');
INSERT INTO `detective_clues` (`clue_id`, `case_id`, `evidence_id`, `clue_text`, `action_cost`, `deduction_notes`) VALUES (8, 3, NULL, 'Facility HVAC logs show fan speed was spiked 40% at 03:22 AM to rapidly disperse the neurotoxin.', 15, 'Establishes precise delivery mechanism.');
INSERT INTO `detective_clues` (`clue_id`, `case_id`, `evidence_id`, `clue_text`, `action_cost`, `deduction_notes`) VALUES (9, 3, NULL, 'Centrifuge telemetry verifies Nadia Chen was actively operating the Level 2 machine without pause.', 10, 'Completely clears Nadia Chen.');

-- --------------------------------------------------------
-- Table structure for `detective_discoveries`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `detective_discoveries`;
CREATE TABLE `detective_discoveries` (
  `discovery_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `detective_session_id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `discovery_type` enum('CLUE','EVIDENCE','TIMELINE_EVENT','PUZZLE_UNLOCKED','SUSPECT_STATEMENT','LOCATION_SEARCH') NOT NULL,
  `target_id` bigint unsigned NOT NULL,
  `discovered_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`discovery_id`),
  UNIQUE KEY `uq_det_discovery` (`detective_session_id`,`user_id`,`discovery_type`,`target_id`),
  KEY `fk_det_disc_user` (`user_id`),
  CONSTRAINT `fk_det_disc_session` FOREIGN KEY (`detective_session_id`) REFERENCES `detective_sessions` (`detective_session_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_det_disc_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------
-- Table structure for `detective_evidence`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `detective_evidence`;
CREATE TABLE `detective_evidence` (
  `evidence_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `case_id` bigint unsigned NOT NULL,
  `location_id` bigint unsigned DEFAULT NULL,
  `suspect_id` bigint unsigned DEFAULT NULL,
  `title` varchar(150) NOT NULL,
  `description` text NOT NULL,
  `image_url` varchar(500) DEFAULT NULL,
  `analysis_cost` int unsigned NOT NULL DEFAULT '15',
  `forensic_details` text,
  `is_critical` tinyint(1) NOT NULL DEFAULT '0',
  `is_red_herring` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`evidence_id`),
  KEY `fk_det_ev_case` (`case_id`),
  KEY `fk_det_ev_loc` (`location_id`),
  KEY `fk_det_ev_suspect` (`suspect_id`),
  CONSTRAINT `fk_det_ev_case` FOREIGN KEY (`case_id`) REFERENCES `detective_cases` (`case_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_det_ev_loc` FOREIGN KEY (`location_id`) REFERENCES `detective_locations` (`location_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_det_ev_suspect` FOREIGN KEY (`suspect_id`) REFERENCES `detective_suspects` (`suspect_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for `detective_evidence` (9 rows)
INSERT INTO `detective_evidence` (`evidence_id`, `case_id`, `location_id`, `suspect_id`, `title`, `description`, `image_url`, `analysis_cost`, `forensic_details`, `is_critical`, `is_red_herring`) VALUES (1, 1, 1, 2, 'Counterfeit Holocube Transmitter', 'A portable projector displaying a static loop of \"Elysium\". Found left on the pedestal.', NULL, 15, 'Fingerprints on the battery latch match Maya Lin. Serial numbers trace to a known black-market synthesizer kit.', 1, 0);
INSERT INTO `detective_evidence` (`evidence_id`, `case_id`, `location_id`, `suspect_id`, `title`, `description`, `image_url`, `analysis_cost`, `forensic_details`, `is_critical`, `is_red_herring`) VALUES (2, 1, 2, 2, 'Overridden Sensor Relay Shunt', 'The primary vibration sensor circuit board was physically bypassed with a technician jumper wire.', NULL, 15, 'The bypass shunt bears the laser-etched inventory code of Maya Lin technician toolkit.', 1, 0);
INSERT INTO `detective_evidence` (`evidence_id`, `case_id`, `location_id`, `suspect_id`, `title`, `description`, `image_url`, `analysis_cost`, `forensic_details`, `is_critical`, `is_red_herring`) VALUES (3, 1, 3, 1, 'VIP Bar Timestamped Receipt', 'Itemized beverage tab stamped 11:42 PM under Pierre Dubois member account.', NULL, 10, 'Timestamp verified by POS server logs. Confirms Pierre presence in the lounge during the theft.', 0, 1);
INSERT INTO `detective_evidence` (`evidence_id`, `case_id`, `location_id`, `suspect_id`, `title`, `description`, `image_url`, `analysis_cost`, `forensic_details`, `is_critical`, `is_red_herring`) VALUES (4, 2, 4, 5, 'Decoded Biometric Bypass Dongle', 'A custom flash drive containing forged retinal signatures of Dr. Vane, formatted with Elena private encryption key.', NULL, 15, 'Hardware fingerprint matches Elena private laptop workstation. Timestamped 02:11 AM.', 1, 0);
INSERT INTO `detective_evidence` (`evidence_id`, `case_id`, `location_id`, `suspect_id`, `title`, `description`, `image_url`, `analysis_cost`, `forensic_details`, `is_critical`, `is_red_herring`) VALUES (5, 2, 5, 4, 'Burned Resistor Wire', 'Surgically spliced sensor wire creating a 90-second blind spot in Sector C.', NULL, 15, 'Placed intentionally days earlier to distract investigators from the network-based bypass.', 0, 1);
INSERT INTO `detective_evidence` (`evidence_id`, `case_id`, `location_id`, `suspect_id`, `title`, `description`, `image_url`, `analysis_cost`, `forensic_details`, `is_critical`, `is_red_herring`) VALUES (6, 2, 6, 5, 'Unsent Encrypted Transmission', 'Draft outbound packet to an offshore broker offering the Midnight Sapphire.', NULL, 15, 'Cryptographic ledger matches Elena private crypto wallet.', 1, 0);
INSERT INTO `detective_evidence` (`evidence_id`, `case_id`, `location_id`, `suspect_id`, `title`, `description`, `image_url`, `analysis_cost`, `forensic_details`, `is_critical`, `is_red_herring`) VALUES (7, 3, 8, 8, 'Modified Aerosol Canister', 'Custom delivery nozzle fitted directly to the cleanroom HVAC manifold.', NULL, 15, 'Residue contains Vivienne proprietary hydrophobic fluoropolymer stabilizer, only synthesized in her personal lab.', 1, 0);
INSERT INTO `detective_evidence` (`evidence_id`, `case_id`, `location_id`, `suspect_id`, `title`, `description`, `image_url`, `analysis_cost`, `forensic_details`, `is_critical`, `is_red_herring`) VALUES (8, 3, 9, 8, 'Empty Aconitine Precursor Vial', 'A discarded pharmaceutical vial found in the cold storage disposal chute.', NULL, 15, 'Requisition order #8812 was signed with Dr. Cross biometric key prior to her claiming the card was cloned.', 1, 0);
INSERT INTO `detective_evidence` (`evidence_id`, `case_id`, `location_id`, `suspect_id`, `title`, `description`, `image_url`, `analysis_cost`, `forensic_details`, `is_critical`, `is_red_herring`) VALUES (9, 3, 7, 7, 'Thorne Personal Dictaphone', 'An encrypted voice recorder found on Dr. Thorne laboratory bench.', NULL, 15, 'Thorne notes: \"Discovered unauthorized chemical formula leaks today. Filing a formal disclosure with the board tomorrow.\"', 0, 1);

-- --------------------------------------------------------
-- Table structure for `detective_investigation_actions`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `detective_investigation_actions`;
CREATE TABLE `detective_investigation_actions` (
  `action_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `detective_session_id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `action_type` enum('INTERROGATE','SEARCH_LOCATION','ANALYZE_EVIDENCE','SOLVE_PUZZLE','EXAMINE_CLUE','CHECK_TIMELINE') NOT NULL,
  `target_id` bigint unsigned NOT NULL,
  `cost_deducted` int unsigned NOT NULL,
  `result_summary` text NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`action_id`),
  KEY `fk_det_act_session` (`detective_session_id`),
  KEY `fk_det_act_user` (`user_id`),
  CONSTRAINT `fk_det_act_session` FOREIGN KEY (`detective_session_id`) REFERENCES `detective_sessions` (`detective_session_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_det_act_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------
-- Table structure for `detective_locations`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `detective_locations`;
CREATE TABLE `detective_locations` (
  `location_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `case_id` bigint unsigned NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text NOT NULL,
  `action_cost` int unsigned NOT NULL DEFAULT '10',
  `image_url` varchar(500) DEFAULT NULL,
  `search_findings` text,
  PRIMARY KEY (`location_id`),
  KEY `fk_det_loc_case` (`case_id`),
  CONSTRAINT `fk_det_loc_case` FOREIGN KEY (`case_id`) REFERENCES `detective_cases` (`case_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for `detective_locations` (9 rows)
INSERT INTO `detective_locations` (`location_id`, `case_id`, `name`, `description`, `action_cost`, `image_url`, `search_findings`) VALUES (1, 1, 'Main Exhibition Pedestal', 'The illuminated glass pedestal where \"Elysium\" was displayed before being swapped.', 10, NULL, 'Micro-scratches on the pedestal acrylic and residual optical distortion from a low-grade holographic projector.');
INSERT INTO `detective_locations` (`location_id`, `case_id`, `name`, `description`, `action_cost`, `image_url`, `search_findings`) VALUES (2, 1, 'Maintenance Control Booth', 'A cramped terminal room housing the security relays and terminal overrides.', 10, NULL, 'A terminal session was left open with admin badge #4421 logged in. The vibration grid was deliberately toggled off at 11:43 PM.');
INSERT INTO `detective_locations` (`location_id`, `case_id`, `name`, `description`, `action_cost`, `image_url`, `search_findings`) VALUES (3, 1, 'East Terrace', 'An outdoor viewing balcony overlooking the city skyline.', 10, NULL, 'Discarded cigarette butts matching Victor Vance brand and strong cellular reception.');
INSERT INTO `detective_locations` (`location_id`, `case_id`, `name`, `description`, `action_cost`, `image_url`, `search_findings`) VALUES (4, 2, 'Mainframe Chamber', 'The heart of the facility. Dr. Vane was discovered slumped across Terminal 4.', 10, NULL, 'A half-empty coffee mug with sedative residue. The vault biometric console was bypassed via USB dongle.');
INSERT INTO `detective_locations` (`location_id`, `case_id`, `name`, `description`, `action_cost`, `image_url`, `search_findings`) VALUES (5, 2, 'Acoustic Grid Relay', 'Junction box controlling high-frequency vibration sensors in the vault corridor.', 10, NULL, 'The relay was bypassed via remote network packet rather than physical cut.');
INSERT INTO `detective_locations` (`location_id`, `case_id`, `name`, `description`, `action_cost`, `image_url`, `search_findings`) VALUES (6, 2, 'Archivist Terminal', 'Elena Rostova private workstation in the upper gallery overlooking the vault.', 10, NULL, 'A draft outbound encrypted transmission to an offshore broker offering the Midnight Sapphire.');
INSERT INTO `detective_locations` (`location_id`, `case_id`, `name`, `description`, `action_cost`, `image_url`, `search_findings`) VALUES (7, 3, 'Hermetic Cleanroom', 'Sealed synthesis chamber with negative-pressure airlocks where Dr. Thorne collapsed.', 10, NULL, 'Chemical air sensors show lethal aconitine concentration delivered through the ceiling air supply.');
INSERT INTO `detective_locations` (`location_id`, `case_id`, `name`, `description`, `action_cost`, `image_url`, `search_findings`) VALUES (8, 3, 'HVAC Ventilation Hub', 'The atmospheric supply plant providing filtered air to the cleanroom.', 10, NULL, 'A modified pressurized canister attached directly to the cleanroom primary air duct.');
INSERT INTO `detective_locations` (`location_id`, `case_id`, `name`, `description`, `action_cost`, `image_url`, `search_findings`) VALUES (9, 3, 'Cold Storage Vault', 'Ultra-low temperature storage containing toxic precursors and enzyme reagents.', 10, NULL, 'A vial of concentrated aconitine base was removed from tray #9 using falsified requisition #8812.');

-- --------------------------------------------------------
-- Table structure for `detective_puzzles`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `detective_puzzles`;
CREATE TABLE `detective_puzzles` (
  `puzzle_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `case_id` bigint unsigned NOT NULL,
  `prompt` text NOT NULL,
  `puzzle_type` varchar(50) NOT NULL,
  `solution_hash` varchar(255) NOT NULL,
  `accepted_plaintext` varchar(100) NOT NULL,
  `hint` text NOT NULL,
  `unlocked_clue_text` text,
  `action_cost` int unsigned NOT NULL DEFAULT '20',
  PRIMARY KEY (`puzzle_id`),
  KEY `fk_det_puzzle_case` (`case_id`),
  CONSTRAINT `fk_det_puzzle_case` FOREIGN KEY (`case_id`) REFERENCES `detective_cases` (`case_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for `detective_puzzles` (3 rows)
INSERT INTO `detective_puzzles` (`puzzle_id`, `case_id`, `prompt`, `puzzle_type`, `solution_hash`, `accepted_plaintext`, `hint`, `unlocked_clue_text`, `action_cost`) VALUES (1, 1, 'Decrypt the terminal bypass username: \"SHIFT-1 CIPHER: NBYB\"', 'CIPHER', '4644cd59b2f51b77cc734227ba0a5215e6c704c6e3e6fab877b1932a2edb87d4', 'MAYA', 'Shift each letter backward by 1 position (N->M, B->A, Y->X/Y).', 'Terminal audit confirms Maya Lin authorized the silent alarm override.', 15);
INSERT INTO `detective_puzzles` (`puzzle_id`, `case_id`, `prompt`, `puzzle_type`, `solution_hash`, `accepted_plaintext`, `hint`, `unlocked_clue_text`, `action_cost`) VALUES (2, 2, 'Decrypt the root terminal bypass code: \"SHIFT-3 CIPHER: FRUUFSW\"', 'CIPHER', 'd7e99a28fad6620624b55e723178f25e8d4492ab49bf17c20d583a66172b2c1a', 'CORRECT', 'Shift each letter backward by 3 positions.', 'Terminal 4 system log confirms root packet originated from Elena archivist terminal IP.', 20);
INSERT INTO `detective_puzzles` (`puzzle_id`, `case_id`, `prompt`, `puzzle_type`, `solution_hash`, `accepted_plaintext`, `hint`, `unlocked_clue_text`, `action_cost`) VALUES (3, 3, 'Decipher the forensic reagent hazard rating: \"Hg-Au-Pt -> Synthesized neurotoxin potency code\"', 'CIPHER', 'ef3782b42e368618b854bf58b054478a62b973ef7ec5029872355105f9ebd29f', 'LETHAL', 'Identify the deadly nature of the synthesized aconitine aerosol (6 letters: LETHAL).', 'Forensic audit proves the aconitine formulation was tailored specifically to bypass cleanroom HEPA filters.', 20);

-- --------------------------------------------------------
-- Table structure for `detective_sessions`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `detective_sessions`;
CREATE TABLE `detective_sessions` (
  `detective_session_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `session_id` bigint unsigned NOT NULL,
  `case_id` bigint unsigned NOT NULL,
  `remaining_budget` int NOT NULL DEFAULT '100',
  `status` enum('INVESTIGATING','ACCUSED','SOLVED','FAILED') NOT NULL DEFAULT 'INVESTIGATING',
  `started_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `completed_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`detective_session_id`),
  UNIQUE KEY `session_id` (`session_id`),
  KEY `fk_det_sess_case` (`case_id`),
  CONSTRAINT `fk_det_sess_case` FOREIGN KEY (`case_id`) REFERENCES `detective_cases` (`case_id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_det_sess_session` FOREIGN KEY (`session_id`) REFERENCES `game_sessions` (`session_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for `detective_sessions` (1 rows)
INSERT INTO `detective_sessions` (`detective_session_id`, `session_id`, `case_id`, `remaining_budget`, `status`, `started_at`, `completed_at`) VALUES (4, 40, 1, 100, 'INVESTIGATING', '2026-10-16 13:35:16', NULL);

-- --------------------------------------------------------
-- Table structure for `detective_suspects`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `detective_suspects`;
CREATE TABLE `detective_suspects` (
  `suspect_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `case_id` bigint unsigned NOT NULL,
  `name` varchar(100) NOT NULL,
  `occupation` varchar(100) NOT NULL,
  `background` text NOT NULL,
  `alibi` text NOT NULL,
  `avatar_url` varchar(500) DEFAULT NULL,
  `is_culprit` tinyint(1) NOT NULL DEFAULT '0',
  `interrogation_cost` int unsigned NOT NULL DEFAULT '10',
  `interrogation_transcript` text,
  `motive_description` text,
  PRIMARY KEY (`suspect_id`),
  KEY `fk_det_suspect_case` (`case_id`),
  CONSTRAINT `fk_det_suspect_case` FOREIGN KEY (`case_id`) REFERENCES `detective_cases` (`case_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for `detective_suspects` (10 rows)
INSERT INTO `detective_suspects` (`suspect_id`, `case_id`, `name`, `occupation`, `background`, `alibi`, `avatar_url`, `is_culprit`, `interrogation_cost`, `interrogation_transcript`, `motive_description`) VALUES (1, 1, 'Pierre Dubois', 'Gallery Curator', 'Oversees the collection and curates private auctions. Deeply proud of the gallery international reputation.', 'Claims he was in the VIP lounge greeting patrons and ordering champagne from 11:35 PM to 11:55 PM.', NULL, 0, 10, 'I was by the champagne bar discussing post-modern sculptures with patrons. Check the bar register if you doubt me.', 'Protecting gallery prestige; had zero financial incentive to steal his own centerpiece.');
INSERT INTO `detective_suspects` (`suspect_id`, `case_id`, `name`, `occupation`, `background`, `alibi`, `avatar_url`, `is_culprit`, `interrogation_cost`, `interrogation_transcript`, `motive_description`) VALUES (2, 1, 'Maya Lin', 'Security Technician', 'Former hardware designer who configured the gallery biometric terminals and vibration grid. Under heavy gambling debts.', 'Claims she was running diagnostic tests on the exterior floodlights from the maintenance booth.', NULL, 1, 10, 'I only accessed the maintenance terminal to check camera calibration. If the vibration grid went down, it must have been a voltage surge!', 'Under severe pressure from black-market syndicates to deliver high-value holographic tech.');
INSERT INTO `detective_suspects` (`suspect_id`, `case_id`, `name`, `occupation`, `background`, `alibi`, `avatar_url`, `is_culprit`, `interrogation_cost`, `interrogation_transcript`, `motive_description`) VALUES (3, 1, 'Victor Vance', 'Antiquities Dealer', 'Shrewd dealer known for aggressive acquisitions. Arrived at the gala uninvited.', 'Claims he stepped out onto the east terrace to take a satellite call between 11:40 and 11:50 PM.', NULL, 0, 10, 'I was on the terrace taking a satellite call with Geneva. It was cold, but my business deals do not wait for art galas.', 'Interested in acquiring the piece legally through private auction, not crude theft.');
INSERT INTO `detective_suspects` (`suspect_id`, `case_id`, `name`, `occupation`, `background`, `alibi`, `avatar_url`, `is_culprit`, `interrogation_cost`, `interrogation_transcript`, `motive_description`) VALUES (4, 2, 'Julian Vance', 'Security Overseer', 'Former naval cryptographer who designed the acoustic perimeter.', 'Claims he was recalibrating sensors in Sector C from 01:45 to 02:30 AM.', NULL, 0, 10, 'My diagnostic terminal was hooked to Sector C all night. Look at the ping logs if you think I abandoned my post.', 'Professional rivalry with Dr. Vane, but no financial motive.');
INSERT INTO `detective_suspects` (`suspect_id`, `case_id`, `name`, `occupation`, `background`, `alibi`, `avatar_url`, `is_culprit`, `interrogation_cost`, `interrogation_transcript`, `motive_description`) VALUES (5, 2, 'Elena Rostova', 'Systems Archivist', 'Brilliant hacker recruited by Blackwood to oversee biometric records.', 'States she was logged into the digital registry until power flickered at 02:10 AM.', NULL, 1, 10, 'The power drop kicked me off the terminal at 02:10. When the lights came back on, Dr. Vane was already unconscious.', 'Offshore crypto debts and lucrative black-market gem contact.');
INSERT INTO `detective_suspects` (`suspect_id`, `case_id`, `name`, `occupation`, `background`, `alibi`, `avatar_url`, `is_culprit`, `interrogation_cost`, `interrogation_transcript`, `motive_description`) VALUES (6, 2, 'Marcus Kane', 'Vault Technician', 'Senior mechanic with unrestricted physical bypass tools.', 'Claims he was in the lower boiler room repairing steam pressure lines.', NULL, 0, 10, 'I spent two hours knee-deep in boiler steam. You can check the steam valve telemetry.', 'Frustrated by Blackwood corporate management, but loyal to his team.');
INSERT INTO `detective_suspects` (`suspect_id`, `case_id`, `name`, `occupation`, `background`, `alibi`, `avatar_url`, `is_culprit`, `interrogation_cost`, `interrogation_transcript`, `motive_description`) VALUES (7, 3, 'Dr. Simon Hale', 'Senior Chemist', 'Rival researcher passed over for promotion to lead Chimera. Bitter toward Thorne.', 'Claims he was asleep in the staff night dormitory from 01:00 AM to 04:00 AM.', NULL, 0, 10, 'I wanted the Chimera lead, but I am not an assassin. The dormitory keycard log will show I never opened my door.', 'Professional envy, but lacked access to the HVAC filtration manifold.');
INSERT INTO `detective_suspects` (`suspect_id`, `case_id`, `name`, `occupation`, `background`, `alibi`, `avatar_url`, `is_culprit`, `interrogation_cost`, `interrogation_transcript`, `motive_description`) VALUES (8, 3, 'Dr. Vivienne Cross', 'Lead Pharmacologist', 'Brilliant toxicologist who developed Chimera delivery solvent. Quietly under investigation for patent transfers.', 'Claims her lab keycard was cloned two days prior and that she was calibrating spectrometers in Sector B.', NULL, 1, 10, 'My keycard was reported cloned on Tuesday. Anyone could have used my credentials to access cold storage.', 'Thorne discovered her unauthorized patent sales to a foreign biopharma conglomerate.');
INSERT INTO `detective_suspects` (`suspect_id`, `case_id`, `name`, `occupation`, `background`, `alibi`, `avatar_url`, `is_culprit`, `interrogation_cost`, `interrogation_transcript`, `motive_description`) VALUES (9, 3, 'Thomas Briggs', 'Facility Operations Director', 'Oversees HVAC systems and cleanroom pressurization controls.', 'Claims he was troubleshooting coolant pressure in the lower auxiliary pump room.', NULL, 0, 10, 'The HVAC alerts pinged my phone at 03:22, but I was already down in the sub-pump room fixing coolant line 3.', 'Bureaucratic overseer with no motive to jeopardize the project funding.');
INSERT INTO `detective_suspects` (`suspect_id`, `case_id`, `name`, `occupation`, `background`, `alibi`, `avatar_url`, `is_culprit`, `interrogation_cost`, `interrogation_transcript`, `motive_description`) VALUES (10, 3, 'Nadia Chen', 'Research Fellow', 'Young assistant who discovered Dr. Thorne body and triggered the facility alarm.', 'Alibi confirms she was conducting continuous centrifuge runs on Level 2 until 03:40 AM.', NULL, 0, 10, 'I was running the blood centrifuge on Level 2. The telemetry log proves I did not leave the centrifuge bench.', 'Devoted mentee of Dr. Thorne with zero motive.');

-- --------------------------------------------------------
-- Table structure for `detective_timeline_events`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `detective_timeline_events`;
CREATE TABLE `detective_timeline_events` (
  `event_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `case_id` bigint unsigned NOT NULL,
  `timestamp_label` varchar(50) NOT NULL,
  `event_description` text NOT NULL,
  `suspect_id` bigint unsigned DEFAULT NULL,
  `is_verified` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`event_id`),
  KEY `fk_det_timeline_case` (`case_id`),
  KEY `fk_det_timeline_suspect` (`suspect_id`),
  CONSTRAINT `fk_det_timeline_case` FOREIGN KEY (`case_id`) REFERENCES `detective_cases` (`case_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_det_timeline_suspect` FOREIGN KEY (`suspect_id`) REFERENCES `detective_suspects` (`suspect_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for `detective_timeline_events` (14 rows)
INSERT INTO `detective_timeline_events` (`event_id`, `case_id`, `timestamp_label`, `event_description`, `suspect_id`, `is_verified`) VALUES (1, 1, '11:30 PM', 'Gala guests assemble in the main hall around the central pedestal.', NULL, 1);
INSERT INTO `detective_timeline_events` (`event_id`, `case_id`, `timestamp_label`, `event_description`, `suspect_id`, `is_verified`) VALUES (2, 1, '11:40 PM', 'Pierre Dubois orders champagne at the VIP bar.', 1, 1);
INSERT INTO `detective_timeline_events` (`event_id`, `case_id`, `timestamp_label`, `event_description`, `suspect_id`, `is_verified`) VALUES (3, 1, '11:43 PM', 'Vibration sensor relay suppressed via technician badge #4421 in maintenance booth.', 2, 1);
INSERT INTO `detective_timeline_events` (`event_id`, `case_id`, `timestamp_label`, `event_description`, `suspect_id`, `is_verified`) VALUES (4, 1, '11:45 PM', 'Real holocube removed; counterfeit projector activated on pedestal.', 2, 1);
INSERT INTO `detective_timeline_events` (`event_id`, `case_id`, `timestamp_label`, `event_description`, `suspect_id`, `is_verified`) VALUES (5, 1, '11:50 PM', 'Victor Vance concludes his call on the east terrace.', 3, 1);
INSERT INTO `detective_timeline_events` (`event_id`, `case_id`, `timestamp_label`, `event_description`, `suspect_id`, `is_verified`) VALUES (6, 2, '01:50 AM', 'Marcus Kane clocks in at the boiler station; steam telemetry confirms continuous manual operation.', 6, 1);
INSERT INTO `detective_timeline_events` (`event_id`, `case_id`, `timestamp_label`, `event_description`, `suspect_id`, `is_verified`) VALUES (7, 2, '02:08 AM', 'Dr. Vane accepts a coffee delivery at the Mainframe door.', NULL, 1);
INSERT INTO `detective_timeline_events` (`event_id`, `case_id`, `timestamp_label`, `event_description`, `suspect_id`, `is_verified`) VALUES (8, 2, '02:11 AM', 'Terminal 4 registers forced root bypass using Elena cryptographic dongle.', 5, 1);
INSERT INTO `detective_timeline_events` (`event_id`, `case_id`, `timestamp_label`, `event_description`, `suspect_id`, `is_verified`) VALUES (9, 2, '02:14 AM', 'Vault pressure seal opens; Midnight Sapphire removed from pedestal.', 5, 1);
INSERT INTO `detective_timeline_events` (`event_id`, `case_id`, `timestamp_label`, `event_description`, `suspect_id`, `is_verified`) VALUES (10, 3, '02:30 AM', 'Dr. Thorne enters the cleanroom and locks the hermetic biometric airlocks.', NULL, 1);
INSERT INTO `detective_timeline_events` (`event_id`, `case_id`, `timestamp_label`, `event_description`, `suspect_id`, `is_verified`) VALUES (11, 3, '03:15 AM', 'Cold storage accessed; aconitine precursor vial checked out under requisition #8812.', 8, 1);
INSERT INTO `detective_timeline_events` (`event_id`, `case_id`, `timestamp_label`, `event_description`, `suspect_id`, `is_verified`) VALUES (12, 3, '03:22 AM', 'Aerosol canister attached to HVAC manifold; atmospheric fan speed increased by 40%.', 8, 1);
INSERT INTO `detective_timeline_events` (`event_id`, `case_id`, `timestamp_label`, `event_description`, `suspect_id`, `is_verified`) VALUES (13, 3, '03:30 AM', 'Chemical sensors trigger neurotoxin alert; Dr. Thorne collapses inside cleanroom.', 8, 1);
INSERT INTO `detective_timeline_events` (`event_id`, `case_id`, `timestamp_label`, `event_description`, `suspect_id`, `is_verified`) VALUES (14, 3, '03:45 AM', 'Emergency alarm triggered by Nadia Chen upon observing Thorne through observation window.', 10, 1);

-- --------------------------------------------------------
-- Table structure for `drawice_guesses`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `drawice_guesses`;
CREATE TABLE `drawice_guesses` (
  `guess_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `round_id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `guess_text` varchar(150) NOT NULL,
  `is_correct` tinyint(1) NOT NULL DEFAULT '0',
  `submission_sequence` int unsigned NOT NULL,
  `points_awarded` int NOT NULL DEFAULT '0',
  `submitted_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`guess_id`),
  KEY `fk_dg_user` (`user_id`),
  KEY `idx_dg_sequence` (`round_id`,`submission_sequence`),
  CONSTRAINT `fk_dg_round` FOREIGN KEY (`round_id`) REFERENCES `drawice_rounds` (`round_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_dg_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------
-- Table structure for `drawice_rounds`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `drawice_rounds`;
CREATE TABLE `drawice_rounds` (
  `round_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `session_id` bigint unsigned NOT NULL,
  `round_number` int unsigned NOT NULL,
  `artist_user_id` bigint unsigned NOT NULL,
  `word_options_json` json NOT NULL,
  `chosen_word_id` bigint unsigned DEFAULT NULL,
  `chosen_word` varchar(100) DEFAULT NULL,
  `time_limit_seconds` int unsigned NOT NULL DEFAULT '60',
  `status` enum('CHOOSING','DRAWING','ROUND_REVEAL','FINISHED') NOT NULL DEFAULT 'CHOOSING',
  `artist_score` int NOT NULL DEFAULT '0',
  `drawing_data` mediumtext,
  `started_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `ended_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`round_id`),
  UNIQUE KEY `uq_drawice_session_round` (`session_id`,`round_number`),
  KEY `fk_dr_artist` (`artist_user_id`),
  KEY `fk_dr_word` (`chosen_word_id`),
  CONSTRAINT `fk_dr_artist` FOREIGN KEY (`artist_user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_dr_sess` FOREIGN KEY (`session_id`) REFERENCES `game_sessions` (`session_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_dr_word` FOREIGN KEY (`chosen_word_id`) REFERENCES `drawice_words` (`word_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------
-- Table structure for `drawice_words`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `drawice_words`;
CREATE TABLE `drawice_words` (
  `word_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `word` varchar(100) NOT NULL,
  `category` varchar(100) NOT NULL DEFAULT 'General',
  `difficulty` enum('EASY','MEDIUM','HARD') NOT NULL DEFAULT 'MEDIUM',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`word_id`),
  UNIQUE KEY `word` (`word`)
) ENGINE=InnoDB AUTO_INCREMENT=1240 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for `drawice_words` (39 rows)
INSERT INTO `drawice_words` (`word_id`, `word`, `category`, `difficulty`, `is_active`) VALUES (1, 'Microscope', 'Science', 'EASY', 1);
INSERT INTO `drawice_words` (`word_id`, `word`, `category`, `difficulty`, `is_active`) VALUES (2, 'Black Hole', 'Space', 'MEDIUM', 1);
INSERT INTO `drawice_words` (`word_id`, `word`, `category`, `difficulty`, `is_active`) VALUES (3, 'Submarine', 'Vehicles', 'EASY', 1);
INSERT INTO `drawice_words` (`word_id`, `word`, `category`, `difficulty`, `is_active`) VALUES (4, 'Hourglass', 'Objects', 'EASY', 1);
INSERT INTO `drawice_words` (`word_id`, `word`, `category`, `difficulty`, `is_active`) VALUES (5, 'Cyberpunk', 'Concepts', 'HARD', 1);
INSERT INTO `drawice_words` (`word_id`, `word`, `category`, `difficulty`, `is_active`) VALUES (6, 'Constellation', 'Space', 'MEDIUM', 1);
INSERT INTO `drawice_words` (`word_id`, `word`, `category`, `difficulty`, `is_active`) VALUES (7, 'Lighthouse', 'Architecture', 'EASY', 1);
INSERT INTO `drawice_words` (`word_id`, `word`, `category`, `difficulty`, `is_active`) VALUES (8, 'Telescope', 'Science', 'EASY', 1);
INSERT INTO `drawice_words` (`word_id`, `word`, `category`, `difficulty`, `is_active`) VALUES (9, 'DNA Helix', 'Biology', 'MEDIUM', 1);
INSERT INTO `drawice_words` (`word_id`, `word`, `category`, `difficulty`, `is_active`) VALUES (10, 'Quantum Computer', 'Technology', 'HARD', 1);
INSERT INTO `drawice_words` (`word_id`, `word`, `category`, `difficulty`, `is_active`) VALUES (11, 'Pyramids', 'Monuments', 'EASY', 1);
INSERT INTO `drawice_words` (`word_id`, `word`, `category`, `difficulty`, `is_active`) VALUES (12, 'Satellite', 'Space', 'EASY', 1);
INSERT INTO `drawice_words` (`word_id`, `word`, `category`, `difficulty`, `is_active`) VALUES (13, 'Volcano', 'Nature', 'EASY', 1);
INSERT INTO `drawice_words` (`word_id`, `word`, `category`, `difficulty`, `is_active`) VALUES (14, 'Compass', 'Tools', 'EASY', 1);
INSERT INTO `drawice_words` (`word_id`, `word`, `category`, `difficulty`, `is_active`) VALUES (15, 'Chameleon', 'Animals', 'MEDIUM', 1);
INSERT INTO `drawice_words` (`word_id`, `word`, `category`, `difficulty`, `is_active`) VALUES (16, 'Matrix', 'Concepts', 'HARD', 1);
INSERT INTO `drawice_words` (`word_id`, `word`, `category`, `difficulty`, `is_active`) VALUES (17, 'Metronome', 'Music', 'MEDIUM', 1);
INSERT INTO `drawice_words` (`word_id`, `word`, `category`, `difficulty`, `is_active`) VALUES (18, 'Hoverboard', 'Technology', 'EASY', 1);
INSERT INTO `drawice_words` (`word_id`, `word`, `category`, `difficulty`, `is_active`) VALUES (19, 'Steampunk Goggles', 'Fashion', 'HARD', 1);
INSERT INTO `drawice_words` (`word_id`, `word`, `category`, `difficulty`, `is_active`) VALUES (20, 'Supernova', 'Space', 'MEDIUM', 1);
INSERT INTO `drawice_words` (`word_id`, `word`, `category`, `difficulty`, `is_active`) VALUES (21, 'Spaceship', 'Vehicles', 'EASY', 1);
INSERT INTO `drawice_words` (`word_id`, `word`, `category`, `difficulty`, `is_active`) VALUES (22, 'Robot', 'Technology', 'EASY', 1);
INSERT INTO `drawice_words` (`word_id`, `word`, `category`, `difficulty`, `is_active`) VALUES (23, 'Pizza', 'Food', 'EASY', 1);
INSERT INTO `drawice_words` (`word_id`, `word`, `category`, `difficulty`, `is_active`) VALUES (24, 'Guitar', 'Music', 'EASY', 1);
INSERT INTO `drawice_words` (`word_id`, `word`, `category`, `difficulty`, `is_active`) VALUES (25, 'Sunflower', 'Nature', 'EASY', 1);
INSERT INTO `drawice_words` (`word_id`, `word`, `category`, `difficulty`, `is_active`) VALUES (26, 'Dinosaur', 'Animals', 'EASY', 1);
INSERT INTO `drawice_words` (`word_id`, `word`, `category`, `difficulty`, `is_active`) VALUES (27, 'Airplane', 'Vehicles', 'EASY', 1);
INSERT INTO `drawice_words` (`word_id`, `word`, `category`, `difficulty`, `is_active`) VALUES (28, 'Castle', 'Architecture', 'EASY', 1);
INSERT INTO `drawice_words` (`word_id`, `word`, `category`, `difficulty`, `is_active`) VALUES (29, 'Waterfall', 'Nature', 'EASY', 1);
INSERT INTO `drawice_words` (`word_id`, `word`, `category`, `difficulty`, `is_active`) VALUES (30, 'Diamond', 'Objects', 'EASY', 1);
INSERT INTO `drawice_words` (`word_id`, `word`, `category`, `difficulty`, `is_active`) VALUES (31, 'Bicycle', 'Vehicles', 'EASY', 1);
INSERT INTO `drawice_words` (`word_id`, `word`, `category`, `difficulty`, `is_active`) VALUES (32, 'Penguin', 'Animals', 'EASY', 1);
INSERT INTO `drawice_words` (`word_id`, `word`, `category`, `difficulty`, `is_active`) VALUES (33, 'Lightning', 'Nature', 'EASY', 1);
INSERT INTO `drawice_words` (`word_id`, `word`, `category`, `difficulty`, `is_active`) VALUES (34, 'Dragon', 'Fantasy', 'MEDIUM', 1);
INSERT INTO `drawice_words` (`word_id`, `word`, `category`, `difficulty`, `is_active`) VALUES (35, 'Anchor', 'Objects', 'EASY', 1);
INSERT INTO `drawice_words` (`word_id`, `word`, `category`, `difficulty`, `is_active`) VALUES (36, 'Tornado', 'Nature', 'MEDIUM', 1);
INSERT INTO `drawice_words` (`word_id`, `word`, `category`, `difficulty`, `is_active`) VALUES (37, 'Helicopter', 'Vehicles', 'MEDIUM', 1);
INSERT INTO `drawice_words` (`word_id`, `word`, `category`, `difficulty`, `is_active`) VALUES (38, 'Parachute', 'Objects', 'MEDIUM', 1);
INSERT INTO `drawice_words` (`word_id`, `word`, `category`, `difficulty`, `is_active`) VALUES (39, 'Campfire', 'Nature', 'EASY', 1);

-- --------------------------------------------------------
-- Table structure for `escape_clues`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `escape_clues`;
CREATE TABLE `escape_clues` (
  `clue_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `object_id` bigint unsigned NOT NULL,
  `clue_text` text NOT NULL,
  `image_url` varchar(500) DEFAULT NULL,
  PRIMARY KEY (`clue_id`),
  KEY `fk_esc_clue_obj` (`object_id`),
  CONSTRAINT `fk_esc_clue_obj` FOREIGN KEY (`object_id`) REFERENCES `escape_objects` (`object_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for `escape_clues` (9 rows)
INSERT INTO `escape_clues` (`clue_id`, `object_id`, `clue_text`, `image_url`) VALUES (1, 2, 'A weathered industrial hazard placard bolted above the decontamination line. It outlines chamber gas lines and atomic designations with directional purge routing.', '/escape-room/clues/hazard_placard.svg');
INSERT INTO `escape_clues` (`clue_id`, `object_id`, `clue_text`, `image_url`) VALUES (2, 4, 'A scorched page from the Chief Engineer\'s maintenance log containing waveform frequency graphs and a cable routing diagram. Channel B is struck out with a grounding fault.', '/escape-room/clues/engineer_journal.svg');
INSERT INTO `escape_clues` (`clue_id`, `object_id`, `clue_text`, `image_url`) VALUES (3, 6, 'An emergency sub-level terminal screen displaying a memory buffer matrix and automated sector routing coordinates.', '/escape-room/clues/operations_terminal.svg');
INSERT INTO `escape_clues` (`clue_id`, `object_id`, `clue_text`, `image_url`) VALUES (4, 8, 'SAFETY PROTOCOL DIRECTIVE: In event of airlock quarantine, set emergency purge sequence to active chambers: 2, 4, 7, 9.', '/escape-room/clues/hazard_placard.svg');
INSERT INTO `escape_clues` (`clue_id`, `object_id`, `clue_text`, `image_url`) VALUES (5, 10, 'ENGINEER LOG: Core frequency stabilization established at harmonic 5389.', '/escape-room/clues/engineer_journal.svg');
INSERT INTO `escape_clues` (`clue_id`, `object_id`, `clue_text`, `image_url`) VALUES (6, 12, 'TERMINAL OVERRIDE: Emergency master blast door evacuation clearance code: OMEGA.', '/escape-room/clues/operations_terminal.svg');
INSERT INTO `escape_clues` (`clue_id`, `object_id`, `clue_text`, `image_url`) VALUES (7, 14, 'A weathered industrial hazard placard. Active chamber isotopes are indexed by atomic number (He=2, Be=4, N=7, F=9). Order by chamber priority sequence.', '/escape-room/clues/hazard_placard.svg');
INSERT INTO `escape_clues` (`clue_id`, `object_id`, `clue_text`, `image_url`) VALUES (8, 16, 'Chief Engineer log notes: Channel B is grounded and excluded. Trace the patch sequence A -> D -> C -> E across the waveform peaks.', '/escape-room/clues/engineer_journal.svg');
INSERT INTO `escape_clues` (`clue_id`, `object_id`, `clue_text`, `image_url`) VALUES (9, 18, 'Sub-level memory coordinate matrix: Query coordinates (1,3), (3,4), (4,2), (3,3), (4,1) to synthesize the clearance code.', '/escape-room/clues/operations_terminal.svg');

-- --------------------------------------------------------
-- Table structure for `escape_completed_puzzles`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `escape_completed_puzzles`;
CREATE TABLE `escape_completed_puzzles` (
  `completion_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `escape_session_id` bigint unsigned NOT NULL,
  `puzzle_id` bigint unsigned NOT NULL,
  `solved_by_user_id` bigint unsigned NOT NULL,
  `solved_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`completion_id`),
  UNIQUE KEY `uq_esc_solved_puz` (`escape_session_id`,`puzzle_id`),
  KEY `fk_ecp_puz` (`puzzle_id`),
  KEY `fk_ecp_user` (`solved_by_user_id`),
  CONSTRAINT `fk_ecp_puz` FOREIGN KEY (`puzzle_id`) REFERENCES `escape_puzzles` (`puzzle_id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_ecp_sess` FOREIGN KEY (`escape_session_id`) REFERENCES `escape_sessions` (`escape_session_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ecp_user` FOREIGN KEY (`solved_by_user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------
-- Table structure for `escape_hint_usage`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `escape_hint_usage`;
CREATE TABLE `escape_hint_usage` (
  `usage_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `escape_session_id` bigint unsigned NOT NULL,
  `hint_id` bigint unsigned NOT NULL,
  `requested_by_user_id` bigint unsigned NOT NULL,
  `requested_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`usage_id`),
  KEY `fk_ehu_sess` (`escape_session_id`),
  KEY `fk_ehu_hint` (`hint_id`),
  KEY `fk_ehu_user` (`requested_by_user_id`),
  CONSTRAINT `fk_ehu_hint` FOREIGN KEY (`hint_id`) REFERENCES `escape_hints` (`hint_id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_ehu_sess` FOREIGN KEY (`escape_session_id`) REFERENCES `escape_sessions` (`escape_session_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ehu_user` FOREIGN KEY (`requested_by_user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------
-- Table structure for `escape_hints`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `escape_hints`;
CREATE TABLE `escape_hints` (
  `hint_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `scenario_id` bigint unsigned NOT NULL,
  `room_id` bigint unsigned NOT NULL,
  `hint_number` int unsigned NOT NULL,
  `hint_text` text NOT NULL,
  PRIMARY KEY (`hint_id`),
  KEY `fk_eh_scen` (`scenario_id`),
  KEY `fk_eh_room` (`room_id`),
  CONSTRAINT `fk_eh_room` FOREIGN KEY (`room_id`) REFERENCES `escape_rooms` (`escape_room_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_eh_scen` FOREIGN KEY (`scenario_id`) REFERENCES `escape_scenarios` (`scenario_id`) ON DELETE CASCADE,
  CONSTRAINT `chk_hint_num` CHECK ((`hint_number` in (1,2)))
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for `escape_hints` (18 rows)
INSERT INTO `escape_hints` (`hint_id`, `scenario_id`, `room_id`, `hint_number`, `hint_text`) VALUES (1, 1, 1, 1, 'Examine the active evacuation lines indicated on the warning placard. One chamber is flagged as offline.');
INSERT INTO `escape_hints` (`hint_id`, `scenario_id`, `room_id`, `hint_number`, `hint_text`) VALUES (2, 1, 1, 2, 'Track the roman numeral sequence of active chambers (I → II → III → V) and note their atomic numbers.');
INSERT INTO `escape_hints` (`hint_id`, `scenario_id`, `room_id`, `hint_number`, `hint_text`) VALUES (3, 1, 2, 1, 'Inspect the patch cable schematic at the base of the engineer log. Channel B is crossed out as faulty.');
INSERT INTO `escape_hints` (`hint_id`, `scenario_id`, `room_id`, `hint_number`, `hint_text`) VALUES (4, 1, 2, 2, 'Follow the connection sequence [CH-A] → [CH-D] → [CH-C] → [CH-E] and enter the peak amplitudes.');
INSERT INTO `escape_hints` (`hint_id`, `scenario_id`, `room_id`, `hint_number`, `hint_text`) VALUES (5, 1, 3, 1, 'Look at the terminal memory matrix. The diagnostic query references 5 coordinate pairs (Row, Column).');
INSERT INTO `escape_hints` (`hint_id`, `scenario_id`, `room_id`, `hint_number`, `hint_text`) VALUES (6, 1, 3, 2, 'Read the letters at coordinates (1,3), (3,4), (4,2), (3,3), and (4,1) to form the 5-letter clearance word.');
INSERT INTO `escape_hints` (`hint_id`, `scenario_id`, `room_id`, `hint_number`, `hint_text`) VALUES (7, 2, 4, 1, 'Inspect the Hazard Warning Placard to find the 4 active chamber numbers.');
INSERT INTO `escape_hints` (`hint_id`, `scenario_id`, `room_id`, `hint_number`, `hint_text`) VALUES (8, 2, 4, 2, 'The 4-digit code is 2479.');
INSERT INTO `escape_hints` (`hint_id`, `scenario_id`, `room_id`, `hint_number`, `hint_text`) VALUES (9, 2, 5, 1, 'Check the Chief Engineer Journal for the harmonic frequency.');
INSERT INTO `escape_hints` (`hint_id`, `scenario_id`, `room_id`, `hint_number`, `hint_text`) VALUES (10, 2, 5, 2, 'The frequency code is 5389.');
INSERT INTO `escape_hints` (`hint_id`, `scenario_id`, `room_id`, `hint_number`, `hint_text`) VALUES (11, 2, 6, 1, 'Read the Operations Terminal screen for the authorization word.');
INSERT INTO `escape_hints` (`hint_id`, `scenario_id`, `room_id`, `hint_number`, `hint_text`) VALUES (12, 2, 6, 2, 'The clearance code is OMEGA.');
INSERT INTO `escape_hints` (`hint_id`, `scenario_id`, `room_id`, `hint_number`, `hint_text`) VALUES (13, 3, 7, 1, 'Atomic coefficients on the placard correspond to Helium, Beryllium, Nitrogen, and Fluorine.');
INSERT INTO `escape_hints` (`hint_id`, `scenario_id`, `room_id`, `hint_number`, `hint_text`) VALUES (14, 3, 7, 2, 'Atomic numbers are 2, 4, 7, 9.');
INSERT INTO `escape_hints` (`hint_id`, `scenario_id`, `room_id`, `hint_number`, `hint_text`) VALUES (15, 3, 8, 1, 'Trace the cable route while excluding grounded channel B.');
INSERT INTO `escape_hints` (`hint_id`, `scenario_id`, `room_id`, `hint_number`, `hint_text`) VALUES (16, 3, 8, 2, 'Follow A -> D -> C -> E: 5389.');
INSERT INTO `escape_hints` (`hint_id`, `scenario_id`, `room_id`, `hint_number`, `hint_text`) VALUES (17, 3, 9, 1, 'Intersect the row and column coordinates on the operations terminal screen.');
INSERT INTO `escape_hints` (`hint_id`, `scenario_id`, `room_id`, `hint_number`, `hint_text`) VALUES (18, 3, 9, 2, 'The 5-letter clearance word is OMEGA.');

-- --------------------------------------------------------
-- Table structure for `escape_locks`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `escape_locks`;
CREATE TABLE `escape_locks` (
  `lock_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `escape_room_id` bigint unsigned NOT NULL,
  `lock_name` varchar(100) NOT NULL,
  `lock_type` enum('DOOR','SAFE','CHEST','DRAWER') NOT NULL DEFAULT 'DOOR',
  `target_room_id` bigint unsigned DEFAULT NULL,
  `is_exit_door` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`lock_id`),
  KEY `fk_esc_lock_room` (`escape_room_id`),
  KEY `fk_esc_lock_target` (`target_room_id`),
  CONSTRAINT `fk_esc_lock_room` FOREIGN KEY (`escape_room_id`) REFERENCES `escape_rooms` (`escape_room_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_esc_lock_target` FOREIGN KEY (`target_room_id`) REFERENCES `escape_rooms` (`escape_room_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for `escape_locks` (9 rows)
INSERT INTO `escape_locks` (`lock_id`, `escape_room_id`, `lock_name`, `lock_type`, `target_room_id`, `is_exit_door`) VALUES (1, 1, 'Airlock Blast Hatch', 'DOOR', 2, 0);
INSERT INTO `escape_locks` (`lock_id`, `escape_room_id`, `lock_name`, `lock_type`, `target_room_id`, `is_exit_door`) VALUES (2, 2, 'Core Security Gate', 'DOOR', 3, 0);
INSERT INTO `escape_locks` (`lock_id`, `escape_room_id`, `lock_name`, `lock_type`, `target_room_id`, `is_exit_door`) VALUES (3, 3, 'Main Bunker Exit Hatch', 'DOOR', NULL, 1);
INSERT INTO `escape_locks` (`lock_id`, `escape_room_id`, `lock_name`, `lock_type`, `target_room_id`, `is_exit_door`) VALUES (4, 4, 'Airlock Blast Hatch', 'DOOR', 5, 0);
INSERT INTO `escape_locks` (`lock_id`, `escape_room_id`, `lock_name`, `lock_type`, `target_room_id`, `is_exit_door`) VALUES (5, 5, 'Core Security Gate', 'DOOR', 6, 0);
INSERT INTO `escape_locks` (`lock_id`, `escape_room_id`, `lock_name`, `lock_type`, `target_room_id`, `is_exit_door`) VALUES (6, 6, 'Main Bunker Exit Hatch', 'DOOR', NULL, 1);
INSERT INTO `escape_locks` (`lock_id`, `escape_room_id`, `lock_name`, `lock_type`, `target_room_id`, `is_exit_door`) VALUES (7, 7, 'Airlock Blast Hatch', 'DOOR', 8, 0);
INSERT INTO `escape_locks` (`lock_id`, `escape_room_id`, `lock_name`, `lock_type`, `target_room_id`, `is_exit_door`) VALUES (8, 8, 'Core Security Gate', 'DOOR', 9, 0);
INSERT INTO `escape_locks` (`lock_id`, `escape_room_id`, `lock_name`, `lock_type`, `target_room_id`, `is_exit_door`) VALUES (9, 9, 'Main Bunker Exit Hatch', 'DOOR', NULL, 1);

-- --------------------------------------------------------
-- Table structure for `escape_objects`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `escape_objects`;
CREATE TABLE `escape_objects` (
  `object_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `escape_room_id` bigint unsigned NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text NOT NULL,
  `is_inspectable` tinyint(1) NOT NULL DEFAULT '1',
  `is_locked` tinyint(1) NOT NULL DEFAULT '0',
  `icon_name` varchar(50) DEFAULT 'key',
  PRIMARY KEY (`object_id`),
  KEY `fk_esc_obj_room` (`escape_room_id`),
  CONSTRAINT `fk_esc_obj_room` FOREIGN KEY (`escape_room_id`) REFERENCES `escape_rooms` (`escape_room_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for `escape_objects` (18 rows)
INSERT INTO `escape_objects` (`object_id`, `escape_room_id`, `name`, `description`, `is_inspectable`, `is_locked`, `icon_name`) VALUES (1, 1, 'Emergency Breaker Box', 'A heavy metal box secured with a 4-digit mechanical dial lock. Overriding this breaker will disengage the airlock blast hatch.', 1, 1, 'dial');
INSERT INTO `escape_objects` (`object_id`, `escape_room_id`, `name`, `description`, `is_inspectable`, `is_locked`, `icon_name`) VALUES (2, 1, 'Hazard Warning Placard', 'A scratched yellow warning plate bolted to the wall. It displays atomic isotope numbers and a technician safety formula.', 1, 0, 'file-text');
INSERT INTO `escape_objects` (`object_id`, `escape_room_id`, `name`, `description`, `is_inspectable`, `is_locked`, `icon_name`) VALUES (3, 2, 'Coolant Balance Console', 'A digital keypad requiring a reactor frequency override code.', 1, 1, 'cpu');
INSERT INTO `escape_objects` (`object_id`, `escape_room_id`, `name`, `description`, `is_inspectable`, `is_locked`, `icon_name`) VALUES (4, 2, 'Chief Engineer Journal', 'A scorched notebook open to a page titled \"Harmonic Equilibrium\".', 1, 0, 'book');
INSERT INTO `escape_objects` (`object_id`, `escape_room_id`, `name`, `description`, `is_inspectable`, `is_locked`, `icon_name`) VALUES (5, 3, 'Master Blast Door Interlock', 'A titanium wheel lock connected to the bunker primary atmospheric exhaust.', 1, 1, 'shield');
INSERT INTO `escape_objects` (`object_id`, `escape_room_id`, `name`, `description`, `is_inspectable`, `is_locked`, `icon_name`) VALUES (6, 3, 'Command Operations Terminal', 'A glowing amber terminal displaying vault system directives, atmospheric telemetry, and emergency evacuation protocol designations.', 1, 0, 'terminal');
INSERT INTO `escape_objects` (`object_id`, `escape_room_id`, `name`, `description`, `is_inspectable`, `is_locked`, `icon_name`) VALUES (7, 4, 'Emergency Breaker Box', 'A heavy metal box secured with a 4-digit mechanical dial lock. Overriding this breaker will disengage the airlock blast hatch.', 1, 1, 'dial');
INSERT INTO `escape_objects` (`object_id`, `escape_room_id`, `name`, `description`, `is_inspectable`, `is_locked`, `icon_name`) VALUES (8, 4, 'Hazard Warning Placard', 'A yellow warning placard with direct technician instructions: Active emergency decontamination valves 2, 4, 7, 9.', 1, 0, 'file-text');
INSERT INTO `escape_objects` (`object_id`, `escape_room_id`, `name`, `description`, `is_inspectable`, `is_locked`, `icon_name`) VALUES (9, 5, 'Coolant Balance Console', 'A digital keypad requiring a reactor frequency override code.', 1, 1, 'cpu');
INSERT INTO `escape_objects` (`object_id`, `escape_room_id`, `name`, `description`, `is_inspectable`, `is_locked`, `icon_name`) VALUES (10, 5, 'Chief Engineer Journal', 'A technician notebook open to a page titled \"Core Stability\": Harmonic resonance locked at frequency 5389.', 1, 0, 'book');
INSERT INTO `escape_objects` (`object_id`, `escape_room_id`, `name`, `description`, `is_inspectable`, `is_locked`, `icon_name`) VALUES (11, 6, 'Master Blast Door Interlock', 'A titanium wheel lock connected to the bunker primary atmospheric exhaust.', 1, 1, 'shield');
INSERT INTO `escape_objects` (`object_id`, `escape_room_id`, `name`, `description`, `is_inspectable`, `is_locked`, `icon_name`) VALUES (12, 6, 'Command Operations Terminal', 'Emergency evacuation directive terminal displaying clearance authorization word: OMEGA.', 1, 0, 'terminal');
INSERT INTO `escape_objects` (`object_id`, `escape_room_id`, `name`, `description`, `is_inspectable`, `is_locked`, `icon_name`) VALUES (13, 7, 'Emergency Breaker Box', 'A heavy metal box secured with an inverted parity dial lock.', 1, 1, 'dial');
INSERT INTO `escape_objects` (`object_id`, `escape_room_id`, `name`, `description`, `is_inspectable`, `is_locked`, `icon_name`) VALUES (14, 7, 'Hazard Warning Placard', 'A weathered industrial plate with gas line atomic isotope indices and purge priority routing.', 1, 0, 'file-text');
INSERT INTO `escape_objects` (`object_id`, `escape_room_id`, `name`, `description`, `is_inspectable`, `is_locked`, `icon_name`) VALUES (15, 8, 'Coolant Balance Console', 'A digital keypad requiring a reactor frequency override code.', 1, 1, 'cpu');
INSERT INTO `escape_objects` (`object_id`, `escape_room_id`, `name`, `description`, `is_inspectable`, `is_locked`, `icon_name`) VALUES (16, 8, 'Chief Engineer Journal', 'A scorched notebook with waveform peak diagrams and ground-faulted channel B routing.', 1, 0, 'book');
INSERT INTO `escape_objects` (`object_id`, `escape_room_id`, `name`, `description`, `is_inspectable`, `is_locked`, `icon_name`) VALUES (17, 9, 'Master Blast Door Interlock', 'A titanium wheel lock connected to the bunker primary atmospheric exhaust.', 1, 1, 'shield');
INSERT INTO `escape_objects` (`object_id`, `escape_room_id`, `name`, `description`, `is_inspectable`, `is_locked`, `icon_name`) VALUES (18, 9, 'Command Operations Terminal', 'Sub-level terminal screen displaying a memory buffer matrix and automated sector routing coordinates.', 1, 0, 'terminal');

-- --------------------------------------------------------
-- Table structure for `escape_puzzle_answers`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `escape_puzzle_answers`;
CREATE TABLE `escape_puzzle_answers` (
  `answer_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `puzzle_id` bigint unsigned NOT NULL,
  `answer_hash` varchar(255) NOT NULL,
  `accepted_plaintext` varchar(100) NOT NULL,
  PRIMARY KEY (`answer_id`),
  KEY `fk_esc_ans_puz` (`puzzle_id`),
  CONSTRAINT `fk_esc_ans_puz` FOREIGN KEY (`puzzle_id`) REFERENCES `escape_puzzles` (`puzzle_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for `escape_puzzle_answers` (9 rows)
INSERT INTO `escape_puzzle_answers` (`answer_id`, `puzzle_id`, `answer_hash`, `accepted_plaintext`) VALUES (1, 1, 'cc0f20917ee075671c8e77c3123759f52300c666d7f490f066dfbe7222a9bfe4', '2479');
INSERT INTO `escape_puzzle_answers` (`answer_id`, `puzzle_id`, `answer_hash`, `accepted_plaintext`) VALUES (2, 2, 'a165b612de1a4c89acb9949f8fef894c2e22517222e341f6823e153e773ff1f1', '5389');
INSERT INTO `escape_puzzle_answers` (`answer_id`, `puzzle_id`, `answer_hash`, `accepted_plaintext`) VALUES (3, 3, 'f77ebc83d4ee51886072e270fbdcac1df96aac78cdcd2ad96a833a9e9f599fe2', 'OMEGA');
INSERT INTO `escape_puzzle_answers` (`answer_id`, `puzzle_id`, `answer_hash`, `accepted_plaintext`) VALUES (4, 4, 'cc0f20917ee075671c8e77c3123759f52300c666d7f490f066dfbe7222a9bfe4', '2479');
INSERT INTO `escape_puzzle_answers` (`answer_id`, `puzzle_id`, `answer_hash`, `accepted_plaintext`) VALUES (5, 5, 'a165b612de1a4c89acb9949f8fef894c2e22517222e341f6823e153e773ff1f1', '5389');
INSERT INTO `escape_puzzle_answers` (`answer_id`, `puzzle_id`, `answer_hash`, `accepted_plaintext`) VALUES (6, 6, 'f77ebc83d4ee51886072e270fbdcac1df96aac78cdcd2ad96a833a9e9f599fe2', 'OMEGA');
INSERT INTO `escape_puzzle_answers` (`answer_id`, `puzzle_id`, `answer_hash`, `accepted_plaintext`) VALUES (7, 7, 'cc0f20917ee075671c8e77c3123759f52300c666d7f490f066dfbe7222a9bfe4', '2479');
INSERT INTO `escape_puzzle_answers` (`answer_id`, `puzzle_id`, `answer_hash`, `accepted_plaintext`) VALUES (8, 8, 'a165b612de1a4c89acb9949f8fef894c2e22517222e341f6823e153e773ff1f1', '5389');
INSERT INTO `escape_puzzle_answers` (`answer_id`, `puzzle_id`, `answer_hash`, `accepted_plaintext`) VALUES (9, 9, 'f77ebc83d4ee51886072e270fbdcac1df96aac78cdcd2ad96a833a9e9f599fe2', 'OMEGA');

-- --------------------------------------------------------
-- Table structure for `escape_puzzle_attempts`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `escape_puzzle_attempts`;
CREATE TABLE `escape_puzzle_attempts` (
  `attempt_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `escape_session_id` bigint unsigned NOT NULL,
  `puzzle_id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `submitted_answer_preview` varchar(100) NOT NULL,
  `is_successful` tinyint(1) NOT NULL DEFAULT '0',
  `attempt_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`attempt_id`),
  KEY `fk_epa_sess` (`escape_session_id`),
  KEY `fk_epa_puz` (`puzzle_id`),
  KEY `fk_epa_user` (`user_id`),
  CONSTRAINT `fk_epa_puz` FOREIGN KEY (`puzzle_id`) REFERENCES `escape_puzzles` (`puzzle_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_epa_sess` FOREIGN KEY (`escape_session_id`) REFERENCES `escape_sessions` (`escape_session_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_epa_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=42 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------
-- Table structure for `escape_puzzles`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `escape_puzzles`;
CREATE TABLE `escape_puzzles` (
  `puzzle_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `object_id` bigint unsigned NOT NULL,
  `puzzle_prompt` text NOT NULL,
  `puzzle_type` enum('CIPHER','DIAL','RIDDLE','SEQUENCE','KEYPAD') NOT NULL,
  `hint_text` text NOT NULL,
  `difficulty_points` int unsigned NOT NULL DEFAULT '100',
  PRIMARY KEY (`puzzle_id`),
  KEY `fk_esc_puz_obj` (`object_id`),
  CONSTRAINT `fk_esc_puz_obj` FOREIGN KEY (`object_id`) REFERENCES `escape_objects` (`object_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for `escape_puzzles` (9 rows)
INSERT INTO `escape_puzzles` (`puzzle_id`, `object_id`, `puzzle_prompt`, `puzzle_type`, `hint_text`, `difficulty_points`) VALUES (1, 1, 'Enter the 4-digit sequence to calibrate emergency purge valves according to active decontamination line specifications.', 'KEYPAD', 'Track the roman numeral sequence of active chambers on the placard and read their atomic numbers.', 100);
INSERT INTO `escape_puzzles` (`puzzle_id`, `object_id`, `puzzle_prompt`, `puzzle_type`, `hint_text`, `difficulty_points`) VALUES (2, 3, 'Enter the 4-digit reactor harmonic modulation frequency deduced from the engineering log patch sequence.', 'KEYPAD', 'Follow the patch connection sequence A → D → C → E and read the corresponding waveform peak values.', 150);
INSERT INTO `escape_puzzles` (`puzzle_id`, `object_id`, `puzzle_prompt`, `puzzle_type`, `hint_text`, `difficulty_points`) VALUES (3, 5, 'Input the alphanumeric override authorization code deduced from the terminal coordinate matrix.', 'CIPHER', 'Reconstruct the 5-letter clearance word by querying the matrix rows and columns in order.', 200);
INSERT INTO `escape_puzzles` (`puzzle_id`, `object_id`, `puzzle_prompt`, `puzzle_type`, `hint_text`, `difficulty_points`) VALUES (4, 7, 'Enter the 4-digit emergency chamber calibration sequence indicated on the hazard placard.', 'KEYPAD', 'Input the active chamber numbers in sequential order: 2, 4, 7, 9.', 50);
INSERT INTO `escape_puzzles` (`puzzle_id`, `object_id`, `puzzle_prompt`, `puzzle_type`, `hint_text`, `difficulty_points`) VALUES (5, 9, 'Enter the 4-digit reactor harmonic modulation frequency from the engineer log.', 'KEYPAD', 'Input the core stability frequency: 5389.', 75);
INSERT INTO `escape_puzzles` (`puzzle_id`, `object_id`, `puzzle_prompt`, `puzzle_type`, `hint_text`, `difficulty_points`) VALUES (6, 11, 'Input the 5-letter clearance override word displayed on the operations terminal.', 'CIPHER', 'Enter the word OMEGA.', 100);
INSERT INTO `escape_puzzles` (`puzzle_id`, `object_id`, `puzzle_prompt`, `puzzle_type`, `hint_text`, `difficulty_points`) VALUES (7, 13, 'Calculate the 4-digit emergency chamber calibration sequence from active chamber atomic numbers.', 'KEYPAD', 'Match the active chamber isotopes: He(2), Be(4), N(7), F(9).', 150);
INSERT INTO `escape_puzzles` (`puzzle_id`, `object_id`, `puzzle_prompt`, `puzzle_type`, `hint_text`, `difficulty_points`) VALUES (8, 15, 'Enter the 4-digit reactor harmonic modulation frequency following the patch sequence [A -> D -> C -> E].', 'KEYPAD', 'Read the peak amplitudes for A(5), D(3), C(8), E(9).', 200);
INSERT INTO `escape_puzzles` (`puzzle_id`, `object_id`, `puzzle_prompt`, `puzzle_type`, `hint_text`, `difficulty_points`) VALUES (9, 17, 'Reconstruct the 5-letter clearance word by querying the matrix rows and columns in order.', 'CIPHER', 'Query coordinates: Row 1 Col 3 (O), Row 3 Col 4 (M), Row 4 Col 2 (E), Row 3 Col 3 (G), Row 4 Col 1 (A).', 250);

-- --------------------------------------------------------
-- Table structure for `escape_results`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `escape_results`;
CREATE TABLE `escape_results` (
  `result_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `escape_session_id` bigint unsigned NOT NULL,
  `is_escaped` tinyint(1) NOT NULL DEFAULT '0',
  `time_taken_seconds` int unsigned NOT NULL,
  `hints_used` int unsigned NOT NULL DEFAULT '0',
  `final_team_score` int NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`result_id`),
  UNIQUE KEY `escape_session_id` (`escape_session_id`),
  CONSTRAINT `fk_er_sess` FOREIGN KEY (`escape_session_id`) REFERENCES `escape_sessions` (`escape_session_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for `escape_results` (1 rows)
INSERT INTO `escape_results` (`result_id`, `escape_session_id`, `is_escaped`, `time_taken_seconds`, `hints_used`, `final_team_score`, `created_at`) VALUES (9, 22, 0, 600, 0, 0, '2026-10-16 12:36:16');

-- --------------------------------------------------------
-- Table structure for `escape_room_completions`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `escape_room_completions`;
CREATE TABLE `escape_room_completions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `escape_session_id` bigint unsigned NOT NULL,
  `escape_room_id` bigint unsigned NOT NULL,
  `completed_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_erc_sess` (`escape_session_id`),
  KEY `fk_erc_room` (`escape_room_id`),
  CONSTRAINT `fk_erc_room` FOREIGN KEY (`escape_room_id`) REFERENCES `escape_rooms` (`escape_room_id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_erc_sess` FOREIGN KEY (`escape_session_id`) REFERENCES `escape_sessions` (`escape_session_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------
-- Table structure for `escape_rooms`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `escape_rooms`;
CREATE TABLE `escape_rooms` (
  `escape_room_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `scenario_id` bigint unsigned NOT NULL,
  `room_name` varchar(100) NOT NULL,
  `description` text NOT NULL,
  `sequence_order` int unsigned NOT NULL,
  `ambient_theme` varchar(50) DEFAULT 'VAULT_DARK',
  PRIMARY KEY (`escape_room_id`),
  KEY `fk_esc_room_scen` (`scenario_id`),
  CONSTRAINT `fk_esc_room_scen` FOREIGN KEY (`scenario_id`) REFERENCES `escape_scenarios` (`scenario_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for `escape_rooms` (9 rows)
INSERT INTO `escape_rooms` (`escape_room_id`, `scenario_id`, `room_name`, `description`, `sequence_order`, `ambient_theme`) VALUES (1, 1, 'Decontamination Airlock', 'A stainless steel chamber illuminated by flashing amber strobe lights. The airlock doors are magnetically sealed.', 1, 'VAULT_AMBER');
INSERT INTO `escape_rooms` (`escape_room_id`, `scenario_id`, `room_name`, `description`, `sequence_order`, `ambient_theme`) VALUES (2, 1, 'Reactor Core Control', 'Massive glass cylinders hum with ionized coolant. A computerized terminal monitors reactor frequency.', 2, 'VAULT_CYAN');
INSERT INTO `escape_rooms` (`escape_room_id`, `scenario_id`, `room_name`, `description`, `sequence_order`, `ambient_theme`) VALUES (3, 1, 'Central Command Vault', 'The master blast door exit is flanked by dual biometric consoles and a heavy titanium deadbolt.', 3, 'VAULT_DARK');
INSERT INTO `escape_rooms` (`escape_room_id`, `scenario_id`, `room_name`, `description`, `sequence_order`, `ambient_theme`) VALUES (4, 2, 'Decontamination Airlock', 'A stainless steel chamber illuminated by flashing amber strobe lights. The airlock doors are magnetically sealed.', 1, 'VAULT_AMBER');
INSERT INTO `escape_rooms` (`escape_room_id`, `scenario_id`, `room_name`, `description`, `sequence_order`, `ambient_theme`) VALUES (5, 2, 'Reactor Core Control', 'Massive glass cylinders hum with ionized coolant. A computerized terminal monitors reactor frequency.', 2, 'VAULT_CYAN');
INSERT INTO `escape_rooms` (`escape_room_id`, `scenario_id`, `room_name`, `description`, `sequence_order`, `ambient_theme`) VALUES (6, 2, 'Central Command Vault', 'The master blast door exit is flanked by dual biometric consoles and a heavy titanium deadbolt.', 3, 'VAULT_DARK');
INSERT INTO `escape_rooms` (`escape_room_id`, `scenario_id`, `room_name`, `description`, `sequence_order`, `ambient_theme`) VALUES (7, 3, 'Decontamination Airlock', 'A stainless steel chamber illuminated by flashing amber strobe lights. The airlock doors are magnetically sealed.', 1, 'VAULT_AMBER');
INSERT INTO `escape_rooms` (`escape_room_id`, `scenario_id`, `room_name`, `description`, `sequence_order`, `ambient_theme`) VALUES (8, 3, 'Reactor Core Control', 'Massive glass cylinders hum with ionized coolant. A computerized terminal monitors reactor frequency.', 2, 'VAULT_CYAN');
INSERT INTO `escape_rooms` (`escape_room_id`, `scenario_id`, `room_name`, `description`, `sequence_order`, `ambient_theme`) VALUES (9, 3, 'Central Command Vault', 'The master blast door exit is flanked by dual biometric consoles and a heavy titanium deadbolt.', 3, 'VAULT_DARK');

-- --------------------------------------------------------
-- Table structure for `escape_scenarios`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `escape_scenarios`;
CREATE TABLE `escape_scenarios` (
  `scenario_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `title` varchar(150) NOT NULL,
  `theme_description` text NOT NULL,
  `time_limit_seconds` int unsigned NOT NULL DEFAULT '600',
  `difficulty` enum('EASY','MEDIUM','HARD') NOT NULL DEFAULT 'MEDIUM',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`scenario_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for `escape_scenarios` (3 rows)
INSERT INTO `escape_scenarios` (`scenario_id`, `title`, `theme_description`, `time_limit_seconds`, `difficulty`, `is_active`, `created_at`) VALUES (1, 'Cyber Vault Protocol 9', 'You and your specialist infiltration squad are trapped inside an automated sub-level security bunker. The atmospheric purge activates in 10 minutes. Solve the sequential locks and override the central blast door to escape.', 600, 'MEDIUM', 1, '2026-10-06 16:06:17');
INSERT INTO `escape_scenarios` (`scenario_id`, `title`, `theme_description`, `time_limit_seconds`, `difficulty`, `is_active`, `created_at`) VALUES (2, 'Cyber Vault Protocol 9 [EASY]', 'Automated sub-level security bunker on Recruit clearance. More direct clues and simplified chamber overrides guide your team to safety before atmospheric purge.', 600, 'EASY', 1, '2026-10-16 11:30:59');
INSERT INTO `escape_scenarios` (`scenario_id`, `title`, `theme_description`, `time_limit_seconds`, `difficulty`, `is_active`, `created_at`) VALUES (3, 'Cyber Vault Protocol 9 [HARD]', 'Automated sub-level security bunker on Black-Ops clearance. Heavily obfuscated telemetry, inverted parity ciphers, and multi-step deduction challenge elite operatives.', 600, 'HARD', 1, '2026-10-16 11:30:59');

-- --------------------------------------------------------
-- Table structure for `escape_session_players`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `escape_session_players`;
CREATE TABLE `escape_session_players` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `escape_session_id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `joined_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_esc_sess_player` (`escape_session_id`,`user_id`),
  KEY `fk_esp_user` (`user_id`),
  CONSTRAINT `fk_esp_sess` FOREIGN KEY (`escape_session_id`) REFERENCES `escape_sessions` (`escape_session_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_esp_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for `escape_session_players` (2 rows)
INSERT INTO `escape_session_players` (`id`, `escape_session_id`, `user_id`, `joined_at`) VALUES (19, 21, 1, '2026-10-16 12:10:33');
INSERT INTO `escape_session_players` (`id`, `escape_session_id`, `user_id`, `joined_at`) VALUES (20, 22, 1, '2026-10-16 12:26:14');

-- --------------------------------------------------------
-- Table structure for `escape_session_progress`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `escape_session_progress`;
CREATE TABLE `escape_session_progress` (
  `progress_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `escape_session_id` bigint unsigned NOT NULL,
  `event_type` enum('INSPECT_OBJECT','ENTER_ROOM','UNLOCK_LOCK') NOT NULL,
  `target_id` bigint unsigned NOT NULL,
  `unlocked_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`progress_id`),
  KEY `fk_esprog_sess` (`escape_session_id`),
  CONSTRAINT `fk_esprog_sess` FOREIGN KEY (`escape_session_id`) REFERENCES `escape_sessions` (`escape_session_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------
-- Table structure for `escape_sessions`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `escape_sessions`;
CREATE TABLE `escape_sessions` (
  `escape_session_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `session_id` bigint unsigned NOT NULL,
  `scenario_id` bigint unsigned NOT NULL,
  `difficulty` enum('EASY','MEDIUM','HARD') NOT NULL DEFAULT 'MEDIUM',
  `current_room_id` bigint unsigned NOT NULL,
  `hints_remaining` int NOT NULL DEFAULT '2',
  `time_remaining_seconds` int NOT NULL DEFAULT '600',
  `status` enum('ACTIVE','ESCAPED','TIMEOUT','ABANDONED') NOT NULL DEFAULT 'ACTIVE',
  `started_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `completed_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`escape_session_id`),
  UNIQUE KEY `session_id` (`session_id`),
  KEY `fk_esc_sess_scen` (`scenario_id`),
  KEY `fk_esc_sess_croom` (`current_room_id`),
  CONSTRAINT `fk_esc_sess_croom` FOREIGN KEY (`current_room_id`) REFERENCES `escape_rooms` (`escape_room_id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_esc_sess_scen` FOREIGN KEY (`scenario_id`) REFERENCES `escape_scenarios` (`scenario_id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_esc_sess_session` FOREIGN KEY (`session_id`) REFERENCES `game_sessions` (`session_id`) ON DELETE CASCADE,
  CONSTRAINT `chk_hints_remaining` CHECK (((`hints_remaining` >= 0) and (`hints_remaining` <= 2)))
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for `escape_sessions` (2 rows)
INSERT INTO `escape_sessions` (`escape_session_id`, `session_id`, `scenario_id`, `difficulty`, `current_room_id`, `hints_remaining`, `time_remaining_seconds`, `status`, `started_at`, `completed_at`) VALUES (21, 38, 3, 'HARD', 7, 2, 407, 'ACTIVE', '2026-10-16 12:10:33', NULL);
INSERT INTO `escape_sessions` (`escape_session_id`, `session_id`, `scenario_id`, `difficulty`, `current_room_id`, `hints_remaining`, `time_remaining_seconds`, `status`, `started_at`, `completed_at`) VALUES (22, 39, 2, 'EASY', 4, 2, 0, 'TIMEOUT', '2026-10-16 12:26:14', '2026-10-16 12:36:16');

-- --------------------------------------------------------
-- Table structure for `escape_unlock_conditions`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `escape_unlock_conditions`;
CREATE TABLE `escape_unlock_conditions` (
  `condition_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `lock_id` bigint unsigned NOT NULL,
  `required_puzzle_id` bigint unsigned DEFAULT NULL,
  `required_object_id` bigint unsigned DEFAULT NULL,
  PRIMARY KEY (`condition_id`),
  KEY `fk_esc_cond_lock` (`lock_id`),
  KEY `fk_esc_cond_puz` (`required_puzzle_id`),
  KEY `fk_esc_cond_obj` (`required_object_id`),
  CONSTRAINT `fk_esc_cond_lock` FOREIGN KEY (`lock_id`) REFERENCES `escape_locks` (`lock_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_esc_cond_obj` FOREIGN KEY (`required_object_id`) REFERENCES `escape_objects` (`object_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_esc_cond_puz` FOREIGN KEY (`required_puzzle_id`) REFERENCES `escape_puzzles` (`puzzle_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for `escape_unlock_conditions` (9 rows)
INSERT INTO `escape_unlock_conditions` (`condition_id`, `lock_id`, `required_puzzle_id`, `required_object_id`) VALUES (1, 1, 1, 1);
INSERT INTO `escape_unlock_conditions` (`condition_id`, `lock_id`, `required_puzzle_id`, `required_object_id`) VALUES (2, 2, 2, 3);
INSERT INTO `escape_unlock_conditions` (`condition_id`, `lock_id`, `required_puzzle_id`, `required_object_id`) VALUES (3, 3, 3, 5);
INSERT INTO `escape_unlock_conditions` (`condition_id`, `lock_id`, `required_puzzle_id`, `required_object_id`) VALUES (4, 4, 4, 7);
INSERT INTO `escape_unlock_conditions` (`condition_id`, `lock_id`, `required_puzzle_id`, `required_object_id`) VALUES (5, 5, 5, 9);
INSERT INTO `escape_unlock_conditions` (`condition_id`, `lock_id`, `required_puzzle_id`, `required_object_id`) VALUES (6, 6, 6, 11);
INSERT INTO `escape_unlock_conditions` (`condition_id`, `lock_id`, `required_puzzle_id`, `required_object_id`) VALUES (7, 7, 7, 13);
INSERT INTO `escape_unlock_conditions` (`condition_id`, `lock_id`, `required_puzzle_id`, `required_object_id`) VALUES (8, 8, 8, 15);
INSERT INTO `escape_unlock_conditions` (`condition_id`, `lock_id`, `required_puzzle_id`, `required_object_id`) VALUES (9, 9, 9, 17);

-- --------------------------------------------------------
-- Table structure for `game_rooms`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `game_rooms`;
CREATE TABLE `game_rooms` (
  `room_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `room_code` varchar(10) NOT NULL,
  `game_id` bigint unsigned NOT NULL,
  `case_id` bigint unsigned DEFAULT NULL,
  `difficulty` varchar(20) DEFAULT NULL,
  `host_user_id` bigint unsigned NOT NULL,
  `status` enum('WAITING','STARTED','COMPLETED','CANCELLED') NOT NULL DEFAULT 'WAITING',
  `max_players` int unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`room_id`),
  UNIQUE KEY `room_code` (`room_code`),
  KEY `fk_rooms_game` (`game_id`),
  KEY `fk_rooms_host` (`host_user_id`),
  KEY `idx_rooms_code` (`room_code`),
  KEY `idx_rooms_status` (`status`),
  CONSTRAINT `fk_rooms_game` FOREIGN KEY (`game_id`) REFERENCES `games` (`game_id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_rooms_host` FOREIGN KEY (`host_user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=49 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for `game_rooms` (3 rows)
INSERT INTO `game_rooms` (`room_id`, `room_code`, `game_id`, `case_id`, `difficulty`, `host_user_id`, `status`, `max_players`, `created_at`, `updated_at`) VALUES (46, 'XF7RUL', 3, NULL, 'HARD', 1, 'STARTED', 1, '2026-10-16 12:09:38', '2026-10-16 12:10:33');
INSERT INTO `game_rooms` (`room_id`, `room_code`, `game_id`, `case_id`, `difficulty`, `host_user_id`, `status`, `max_players`, `created_at`, `updated_at`) VALUES (47, '8J6BY5', 3, NULL, 'EASY', 1, 'STARTED', 1, '2026-10-16 12:25:18', '2026-10-16 12:26:14');
INSERT INTO `game_rooms` (`room_id`, `room_code`, `game_id`, `case_id`, `difficulty`, `host_user_id`, `status`, `max_players`, `created_at`, `updated_at`) VALUES (48, 'QNWKYU', 2, 1, NULL, 1, 'STARTED', 1, '2026-10-16 13:34:38', '2026-10-16 13:35:16');

-- --------------------------------------------------------
-- Table structure for `game_sessions`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `game_sessions`;
CREATE TABLE `game_sessions` (
  `session_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `room_id` bigint unsigned NOT NULL,
  `game_id` bigint unsigned NOT NULL,
  `total_rounds` int unsigned NOT NULL DEFAULT '5',
  `current_round` int unsigned NOT NULL DEFAULT '1',
  `status` enum('NOT_STARTED','IN_PROGRESS','COMPLETED','ABANDONED') NOT NULL DEFAULT 'NOT_STARTED',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `started_at` timestamp NULL DEFAULT NULL,
  `completed_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`session_id`),
  UNIQUE KEY `room_id` (`room_id`),
  KEY `fk_sessions_game` (`game_id`),
  KEY `idx_sessions_status` (`status`),
  CONSTRAINT `fk_sessions_game` FOREIGN KEY (`game_id`) REFERENCES `games` (`game_id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_sessions_room` FOREIGN KEY (`room_id`) REFERENCES `game_rooms` (`room_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=41 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for `game_sessions` (3 rows)
INSERT INTO `game_sessions` (`session_id`, `room_id`, `game_id`, `total_rounds`, `current_round`, `status`, `created_at`, `started_at`, `completed_at`) VALUES (38, 46, 3, 1, 1, 'IN_PROGRESS', '2026-10-16 12:10:33', '2026-10-16 12:10:33', NULL);
INSERT INTO `game_sessions` (`session_id`, `room_id`, `game_id`, `total_rounds`, `current_round`, `status`, `created_at`, `started_at`, `completed_at`) VALUES (39, 47, 3, 1, 1, 'COMPLETED', '2026-10-16 12:26:14', '2026-10-16 12:26:14', '2026-10-16 12:36:16');
INSERT INTO `game_sessions` (`session_id`, `room_id`, `game_id`, `total_rounds`, `current_round`, `status`, `created_at`, `started_at`, `completed_at`) VALUES (40, 48, 2, 1, 1, 'IN_PROGRESS', '2026-10-16 13:35:16', '2026-10-16 13:35:16', NULL);

-- --------------------------------------------------------
-- Table structure for `games`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `games`;
CREATE TABLE `games` (
  `game_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `game_code` enum('PREDICTION_ARENA','DETECTIVE','ESCAPE_ROOM','DRAWICE') NOT NULL,
  `game_name` varchar(100) NOT NULL,
  `description` text NOT NULL,
  `min_players` int unsigned NOT NULL,
  `max_players` int unsigned NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`game_id`),
  UNIQUE KEY `game_code` (`game_code`),
  KEY `idx_games_code` (`game_code`)
) ENGINE=InnoDB AUTO_INCREMENT=214 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for `games` (4 rows)
INSERT INTO `games` (`game_id`, `game_code`, `game_name`, `description`, `min_players`, `max_players`, `is_active`, `created_at`, `updated_at`) VALUES (1, 'PREDICTION_ARENA', 'Prediction Arena', 'Multiplayer mathematical game where players submit values from 0 to 100 to target 80% of the average.', 2, 10, 1, '2026-10-06 15:12:41', '2026-10-08 05:10:46');
INSERT INTO `games` (`game_id`, `game_code`, `game_name`, `description`, `min_players`, `max_players`, `is_active`, `created_at`, `updated_at`) VALUES (2, 'DETECTIVE', 'Detective', 'Multiplayer deduction investigation where players manage energy to inspect crime scenes, interrogate suspects, and identify culprits.', 1, 10, 1, '2026-10-06 15:12:41', '2026-10-06 15:12:41');
INSERT INTO `games` (`game_id`, `game_code`, `game_name`, `description`, `min_players`, `max_players`, `is_active`, `created_at`, `updated_at`) VALUES (3, 'ESCAPE_ROOM', 'Escape Room', 'Cooperative puzzle experience requiring code deciphering, item combinations, and collaborative problem-solving.', 1, 5, 1, '2026-10-06 15:12:41', '2026-10-06 15:12:41');
INSERT INTO `games` (`game_id`, `game_code`, `game_name`, `description`, `min_players`, `max_players`, `is_active`, `created_at`, `updated_at`) VALUES (4, 'DRAWICE', 'Drawice', 'Collaborative and competitive canvas sketching game featuring real-time drawing sync, keyword prompts, and guess validation.', 2, 10, 1, '2026-10-06 15:12:41', '2026-10-06 15:12:41');

-- --------------------------------------------------------
-- Table structure for `player_game_statistics`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `player_game_statistics`;
CREATE TABLE `player_game_statistics` (
  `user_id` bigint unsigned NOT NULL,
  `game_id` bigint unsigned NOT NULL,
  `games_played` int unsigned NOT NULL DEFAULT '0',
  `games_won` int unsigned NOT NULL DEFAULT '0',
  `total_score` decimal(14,2) NOT NULL DEFAULT '0.00',
  `highest_score` decimal(12,2) NOT NULL DEFAULT '0.00',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`,`game_id`),
  KEY `fk_stats_game` (`game_id`),
  CONSTRAINT `fk_stats_game` FOREIGN KEY (`game_id`) REFERENCES `games` (`game_id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_stats_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------
-- Table structure for `prediction_rounds`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `prediction_rounds`;
CREATE TABLE `prediction_rounds` (
  `round_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `session_id` bigint unsigned NOT NULL,
  `round_number` int unsigned NOT NULL,
  `total_sum` int DEFAULT '0',
  `player_count` int unsigned NOT NULL DEFAULT '0',
  `average_value` decimal(8,4) DEFAULT '0.0000',
  `target_value` decimal(8,4) DEFAULT '0.0000',
  `active_rules` json DEFAULT NULL,
  `status` enum('SUBMITTING','REVEALED','COMPLETED') NOT NULL DEFAULT 'SUBMITTING',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `resolved_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`round_id`),
  UNIQUE KEY `uq_pred_session_round` (`session_id`,`round_number`),
  CONSTRAINT `fk_pred_round_session` FOREIGN KEY (`session_id`) REFERENCES `game_sessions` (`session_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------
-- Table structure for `prediction_submissions`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `prediction_submissions`;
CREATE TABLE `prediction_submissions` (
  `submission_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `round_id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `chosen_number` int NOT NULL,
  `is_duplicate` tinyint(1) NOT NULL DEFAULT '0',
  `is_exact_target` tinyint(1) NOT NULL DEFAULT '0',
  `is_zero_one_hundred_win` tinyint(1) NOT NULL DEFAULT '0',
  `round_rank` int unsigned DEFAULT NULL,
  `points_awarded` int NOT NULL DEFAULT '0',
  `penalty_points` int NOT NULL DEFAULT '0',
  `submitted_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`submission_id`),
  UNIQUE KEY `uq_pred_user_round` (`round_id`,`user_id`),
  KEY `fk_pred_sub_user` (`user_id`),
  CONSTRAINT `fk_pred_sub_round` FOREIGN KEY (`round_id`) REFERENCES `prediction_rounds` (`round_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_pred_sub_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `chk_pred_number` CHECK (((`chosen_number` >= 0) and (`chosen_number` <= 100)))
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------
-- Table structure for `roles`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `roles`;
CREATE TABLE `roles` (
  `role_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `role_name` enum('PLAYER','ADMIN') NOT NULL,
  `description` varchar(255) NOT NULL,
  PRIMARY KEY (`role_id`),
  UNIQUE KEY `role_name` (`role_name`)
) ENGINE=InnoDB AUTO_INCREMENT=112 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for `roles` (2 rows)
INSERT INTO `roles` (`role_id`, `role_name`, `description`) VALUES (1, 'PLAYER', 'Standard competitor in MindVault games');
INSERT INTO `roles` (`role_id`, `role_name`, `description`) VALUES (2, 'ADMIN', 'Platform game master and administrator');

-- --------------------------------------------------------
-- Table structure for `room_players`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `room_players`;
CREATE TABLE `room_players` (
  `room_player_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `room_id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `status` enum('JOINED','LEFT','KICKED') NOT NULL DEFAULT 'JOINED',
  `is_ready` tinyint(1) NOT NULL DEFAULT '0',
  `joined_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`room_player_id`),
  UNIQUE KEY `uq_room_player` (`room_id`,`user_id`),
  KEY `fk_rp_user` (`user_id`),
  KEY `idx_rp_room_status` (`room_id`,`status`),
  CONSTRAINT `fk_rp_room` FOREIGN KEY (`room_id`) REFERENCES `game_rooms` (`room_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_rp_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=52 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for `room_players` (3 rows)
INSERT INTO `room_players` (`room_player_id`, `room_id`, `user_id`, `status`, `is_ready`, `joined_at`, `updated_at`) VALUES (49, 46, 1, 'JOINED', 1, '2026-10-16 12:09:38', '2026-10-16 12:09:38');
INSERT INTO `room_players` (`room_player_id`, `room_id`, `user_id`, `status`, `is_ready`, `joined_at`, `updated_at`) VALUES (50, 47, 1, 'JOINED', 1, '2026-10-16 12:25:18', '2026-10-16 12:25:18');
INSERT INTO `room_players` (`room_player_id`, `room_id`, `user_id`, `status`, `is_ready`, `joined_at`, `updated_at`) VALUES (51, 48, 1, 'JOINED', 1, '2026-10-16 13:34:38', '2026-10-16 13:34:38');

-- --------------------------------------------------------
-- Table structure for `session_players`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `session_players`;
CREATE TABLE `session_players` (
  `session_player_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `session_id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `final_score` decimal(12,2) NOT NULL DEFAULT '0.00',
  `final_rank` int unsigned DEFAULT NULL,
  `is_winner` tinyint(1) NOT NULL DEFAULT '0',
  `joined_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`session_player_id`),
  UNIQUE KEY `uq_session_player` (`session_id`,`user_id`),
  KEY `fk_sp_user` (`user_id`),
  KEY `idx_sp_rank` (`session_id`,`final_rank`),
  CONSTRAINT `fk_sp_session` FOREIGN KEY (`session_id`) REFERENCES `game_sessions` (`session_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_sp_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=63 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for `session_players` (3 rows)
INSERT INTO `session_players` (`session_player_id`, `session_id`, `user_id`, `final_score`, `final_rank`, `is_winner`, `joined_at`) VALUES (60, 38, 1, '0.00', NULL, 0, '2026-10-16 12:10:33');
INSERT INTO `session_players` (`session_player_id`, `session_id`, `user_id`, `final_score`, `final_rank`, `is_winner`, `joined_at`) VALUES (61, 39, 1, '0.00', NULL, 0, '2026-10-16 12:26:14');
INSERT INTO `session_players` (`session_player_id`, `session_id`, `user_id`, `final_score`, `final_rank`, `is_winner`, `joined_at`) VALUES (62, 40, 1, '0.00', NULL, 0, '2026-10-16 13:35:16');

-- --------------------------------------------------------
-- Table structure for `user_achievements`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `user_achievements`;
CREATE TABLE `user_achievements` (
  `user_id` bigint unsigned NOT NULL,
  `achievement_id` bigint unsigned NOT NULL,
  `earned_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`,`achievement_id`),
  KEY `fk_ua_achievement` (`achievement_id`),
  CONSTRAINT `fk_ua_achievement` FOREIGN KEY (`achievement_id`) REFERENCES `achievements` (`achievement_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ua_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------
-- Table structure for `user_profiles`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `user_profiles`;
CREATE TABLE `user_profiles` (
  `profile_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `display_name` varchar(100) NOT NULL,
  `phone_number` varchar(20) DEFAULT NULL,
  `avatar_url` varchar(500) DEFAULT NULL,
  `bio` varchar(255) DEFAULT 'Strategist in the Vault',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`profile_id`),
  UNIQUE KEY `user_id` (`user_id`),
  KEY `idx_profiles_display_name` (`display_name`),
  CONSTRAINT `fk_profiles_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for `user_profiles` (6 rows)
INSERT INTO `user_profiles` (`profile_id`, `user_id`, `display_name`, `phone_number`, `avatar_url`, `bio`, `created_at`, `updated_at`) VALUES (1, 1, 'demo1', NULL, NULL, 'Strategist in the Vault', '2026-10-06 15:12:43', '2026-10-06 15:12:43');
INSERT INTO `user_profiles` (`profile_id`, `user_id`, `display_name`, `phone_number`, `avatar_url`, `bio`, `created_at`, `updated_at`) VALUES (2, 2, 'CipherMaster', NULL, NULL, 'Strategist in the Vault', '2026-10-06 16:12:23', '2026-10-06 16:12:23');
INSERT INTO `user_profiles` (`profile_id`, `user_id`, `display_name`, `phone_number`, `avatar_url`, `bio`, `created_at`, `updated_at`) VALUES (3, 3, 'demo2', NULL, NULL, 'Strategist in the Vault', '2026-10-08 05:32:26', '2026-10-08 05:32:26');
INSERT INTO `user_profiles` (`profile_id`, `user_id`, `display_name`, `phone_number`, `avatar_url`, `bio`, `created_at`, `updated_at`) VALUES (4, 4, 'Sherlock Holmes', NULL, NULL, 'Strategist in the Vault', '2026-10-16 02:57:49', '2026-10-16 02:57:49');
INSERT INTO `user_profiles` (`profile_id`, `user_id`, `display_name`, `phone_number`, `avatar_url`, `bio`, `created_at`, `updated_at`) VALUES (7, 7, 'John Watson', NULL, NULL, 'Strategist in the Vault', '2026-10-16 03:00:05', '2026-10-16 03:00:05');
INSERT INTO `user_profiles` (`profile_id`, `user_id`, `display_name`, `phone_number`, `avatar_url`, `bio`, `created_at`, `updated_at`) VALUES (8, 8, 'Bhuvan N', NULL, NULL, 'Strategist in the Vault', '2026-10-17 01:31:58', '2026-10-17 01:31:58');

-- --------------------------------------------------------
-- Table structure for `user_roles`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `user_roles`;
CREATE TABLE `user_roles` (
  `user_role_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `role_id` bigint unsigned NOT NULL,
  `assigned_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_role_id`),
  UNIQUE KEY `uq_user_role` (`user_id`,`role_id`),
  KEY `fk_user_roles_role` (`role_id`),
  CONSTRAINT `fk_user_roles_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`role_id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_user_roles_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for `user_roles` (8 rows)
INSERT INTO `user_roles` (`user_role_id`, `user_id`, `role_id`, `assigned_at`) VALUES (1, 1, 1, '2026-10-06 15:12:43');
INSERT INTO `user_roles` (`user_role_id`, `user_id`, `role_id`, `assigned_at`) VALUES (2, 1, 2, '2026-10-06 15:12:43');
INSERT INTO `user_roles` (`user_role_id`, `user_id`, `role_id`, `assigned_at`) VALUES (3, 2, 1, '2026-10-06 16:12:24');
INSERT INTO `user_roles` (`user_role_id`, `user_id`, `role_id`, `assigned_at`) VALUES (4, 3, 1, '2026-10-08 05:32:26');
INSERT INTO `user_roles` (`user_role_id`, `user_id`, `role_id`, `assigned_at`) VALUES (5, 2, 2, '2026-10-16 11:58:32');
INSERT INTO `user_roles` (`user_role_id`, `user_id`, `role_id`, `assigned_at`) VALUES (6, 3, 2, '2026-10-16 12:00:20');
INSERT INTO `user_roles` (`user_role_id`, `user_id`, `role_id`, `assigned_at`) VALUES (7, 8, 1, '2026-10-17 01:31:58');
INSERT INTO `user_roles` (`user_role_id`, `user_id`, `role_id`, `assigned_at`) VALUES (8, 8, 2, '2026-10-17 01:34:27');

-- --------------------------------------------------------
-- Table structure for `users`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `user_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `firebase_uid` varchar(128) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) DEFAULT NULL,
  `account_status` enum('ACTIVE','SUSPENDED','DEACTIVATED') NOT NULL DEFAULT 'ACTIVE',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `firebase_uid` (`firebase_uid`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_users_firebase_uid` (`firebase_uid`),
  KEY `idx_users_email` (`email`),
  KEY `idx_users_status` (`account_status`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for `users` (6 rows)
INSERT INTO `users` (`user_id`, `firebase_uid`, `email`, `password_hash`, `account_status`, `created_at`, `updated_at`) VALUES (1, 'usr_c7aac6f6-9251-47cc-a962-b400ab9b231a', 'demo1@gmail.com', '68109b37ca51d51e3f7370c35e6e445e:b5d1c30af3597cc21a41a453b8e82cca9444d16d26d0a09c2771693abeac1d2bbe0daa250cf4c3e5d4b62d992ea9793883cd79e35e8c8e61b21f26b8e85dab53', 'ACTIVE', '2026-10-06 15:12:43', '2026-10-06 15:12:43');
INSERT INTO `users` (`user_id`, `firebase_uid`, `email`, `password_hash`, `account_status`, `created_at`, `updated_at`) VALUES (2, 'usr_4bc19322-26f6-4424-9015-46e967fbf48b', 'cipher@mindvault.io', '5f4989f11c12842d25c9566074e84ee4:db47054835f22eff85463ccd64f6c4f14a83c625dc14aa503b83c300ccb461cf3232841bc95ff7aa39ad68a4e9bded02ef233e69c6c992b72205f9fa55935ae8', 'SUSPENDED', '2026-10-06 16:12:23', '2026-10-16 12:07:36');
INSERT INTO `users` (`user_id`, `firebase_uid`, `email`, `password_hash`, `account_status`, `created_at`, `updated_at`) VALUES (3, 'usr_932520cb-13e5-435c-842b-5e3b66612c2b', 'demo2@gmail.com', '85145b21ad6271aa3611364d97e71062:4c6a3d758e1489001ae3c79391f8b7541f8b03b360b92eaf87dbdf92f5249bdd55729420fb581a33c25e1ab7ce27fa91df5ba5c45a2aa435934f583288059d9c', 'ACTIVE', '2026-10-08 05:32:26', '2026-10-16 12:07:28');
INSERT INTO `users` (`user_id`, `firebase_uid`, `email`, `password_hash`, `account_status`, `created_at`, `updated_at`) VALUES (4, 'uid_sherlock_test', 'sherlock_test@mindvault.local', 'hash123', 'SUSPENDED', '2026-10-16 02:57:49', '2026-10-16 12:07:05');
INSERT INTO `users` (`user_id`, `firebase_uid`, `email`, `password_hash`, `account_status`, `created_at`, `updated_at`) VALUES (7, 'uid_watson_test', 'watson_test@mindvault.local', 'hash123', 'SUSPENDED', '2026-10-16 03:00:05', '2026-10-16 12:07:13');
INSERT INTO `users` (`user_id`, `firebase_uid`, `email`, `password_hash`, `account_status`, `created_at`, `updated_at`) VALUES (8, 'usr_28bfa100-8c79-4fb6-82dc-e8c4eadb5648', 'bhuvannmurthy15112007@gmail.com', 'b92444b554e80426a675300761e4478a:153fbf646fc0c0d89eef52075b7a925e87834dd24cafb714f96fdf6a7a53703e7db8868dfd261e2299fc310d6d5d486edbf25bc30bf8ee43d1e71dec0027a379', 'ACTIVE', '2026-10-17 01:31:58', '2026-10-17 01:31:58');

SET FOREIGN_KEY_CHECKS = 1;
-- Backup completed successfully
