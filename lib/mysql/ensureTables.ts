import { query } from './db';
import { seedDetectiveCases } from './seedDetectiveCases';

let tablesEnsured = false;

export async function ensureCoreTables(): Promise<void> {
  if (tablesEnsured) return;

  try {
    // 1. Users table
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        user_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        firebase_uid VARCHAR(128) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) DEFAULT NULL,
        account_status ENUM('ACTIVE', 'SUSPENDED', 'DEACTIVATED') NOT NULL DEFAULT 'ACTIVE',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_users_firebase_uid (firebase_uid),
        INDEX idx_users_email (email),
        INDEX idx_users_status (account_status)
      ) ENGINE=InnoDB
    `);

    // Ensure password_hash column exists if table was pre-existing without it
    try {
      await query(`
        ALTER TABLE users ADD COLUMN password_hash VARCHAR(255) DEFAULT NULL AFTER email
      `);
    } catch (e: any) {
      // Column already exists, safe to ignore
    }

    // 2. User Profiles
    await query(`
      CREATE TABLE IF NOT EXISTS user_profiles (
        profile_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        user_id BIGINT UNSIGNED NOT NULL UNIQUE,
        display_name VARCHAR(100) NOT NULL,
        phone_number VARCHAR(20) DEFAULT NULL,
        avatar_url VARCHAR(500) DEFAULT NULL,
        bio VARCHAR(255) DEFAULT 'Strategist in the Vault',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_profiles_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
        INDEX idx_profiles_display_name (display_name)
      ) ENGINE=InnoDB
    `);

    // 3. Roles
    await query(`
      CREATE TABLE IF NOT EXISTS roles (
        role_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        role_name ENUM('PLAYER', 'ADMIN') NOT NULL UNIQUE,
        description VARCHAR(255) NOT NULL
      ) ENGINE=InnoDB
    `);

    await query(`
      INSERT IGNORE INTO roles (role_name, description) VALUES
      ('PLAYER', 'Standard competitor in MindVault games'),
      ('ADMIN', 'Platform game master and administrator')
    `);

    // 4. User Roles
    await query(`
      CREATE TABLE IF NOT EXISTS user_roles (
        user_role_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        user_id BIGINT UNSIGNED NOT NULL,
        role_id BIGINT UNSIGNED NOT NULL,
        assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_user_role (user_id, role_id),
        CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
        CONSTRAINT fk_user_roles_role FOREIGN KEY (role_id) REFERENCES roles(role_id) ON DELETE RESTRICT
      ) ENGINE=InnoDB
    `);

    // 5. Games
    await query(`
      CREATE TABLE IF NOT EXISTS games (
        game_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        game_code ENUM('PREDICTION_ARENA', 'DETECTIVE', 'ESCAPE_ROOM', 'DRAWICE') NOT NULL UNIQUE,
        game_name VARCHAR(100) NOT NULL,
        description TEXT NOT NULL,
        min_players INT UNSIGNED NOT NULL,
        max_players INT UNSIGNED NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_games_code (game_code)
      ) ENGINE=InnoDB
    `);

    await query(`
      INSERT IGNORE INTO games (game_code, game_name, description, min_players, max_players, is_active) VALUES
      ('PREDICTION_ARENA', 'Prediction Arena', 'Multiplayer mathematical game where players submit values from 0 to 100 to target 80% of the average.', 2, 10, TRUE),
      ('DETECTIVE', 'Detective', 'Multiplayer deduction investigation where players manage energy to inspect crime scenes, interrogate suspects, and identify culprits.', 1, 10, TRUE),
      ('ESCAPE_ROOM', 'Escape Room', 'Cooperative puzzle experience requiring code deciphering, item combinations, and collaborative problem-solving.', 1, 5, TRUE),
      ('DRAWICE', 'Drawice', 'Collaborative and competitive canvas sketching game featuring real-time drawing sync, keyword prompts, and guess validation.', 2, 10, TRUE)
    `);

    // 6. Game Rooms
    await query(`
      CREATE TABLE IF NOT EXISTS game_rooms (
        room_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        room_code VARCHAR(10) NOT NULL UNIQUE,
        game_id BIGINT UNSIGNED NOT NULL,
        host_user_id BIGINT UNSIGNED NOT NULL,
        status ENUM('WAITING', 'STARTED', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'WAITING',
        max_players INT UNSIGNED NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_rooms_game FOREIGN KEY (game_id) REFERENCES games(game_id) ON DELETE RESTRICT,
        CONSTRAINT fk_rooms_host FOREIGN KEY (host_user_id) REFERENCES users(user_id) ON DELETE CASCADE,
        INDEX idx_rooms_code (room_code),
        INDEX idx_rooms_status (status)
      ) ENGINE=InnoDB
    `);

    try {
      await query(`ALTER TABLE game_rooms ADD COLUMN case_id BIGINT UNSIGNED NULL AFTER game_id`);
    } catch (e: any) {}

    // 7. Room Players
    await query(`
      CREATE TABLE IF NOT EXISTS room_players (
        room_player_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        room_id BIGINT UNSIGNED NOT NULL,
        user_id BIGINT UNSIGNED NOT NULL,
        status ENUM('JOINED', 'LEFT', 'KICKED') NOT NULL DEFAULT 'JOINED',
        is_ready BOOLEAN NOT NULL DEFAULT FALSE,
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_room_player (room_id, user_id),
        CONSTRAINT fk_rp_room FOREIGN KEY (room_id) REFERENCES game_rooms(room_id) ON DELETE CASCADE,
        CONSTRAINT fk_rp_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
        INDEX idx_rp_room_status (room_id, status)
      ) ENGINE=InnoDB
    `);

    // 8. Game Sessions
    await query(`
      CREATE TABLE IF NOT EXISTS game_sessions (
        session_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        room_id BIGINT UNSIGNED NOT NULL UNIQUE,
        game_id BIGINT UNSIGNED NOT NULL,
        total_rounds INT UNSIGNED NOT NULL DEFAULT 5,
        current_round INT UNSIGNED NOT NULL DEFAULT 1,
        status ENUM('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'ABANDONED') NOT NULL DEFAULT 'NOT_STARTED',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        started_at TIMESTAMP NULL DEFAULT NULL,
        completed_at TIMESTAMP NULL DEFAULT NULL,
        CONSTRAINT fk_sessions_room FOREIGN KEY (room_id) REFERENCES game_rooms(room_id) ON DELETE CASCADE,
        CONSTRAINT fk_sessions_game FOREIGN KEY (game_id) REFERENCES games(game_id) ON DELETE RESTRICT,
        INDEX idx_sessions_status (status)
      ) ENGINE=InnoDB
    `);

    // 9. Session Players
    await query(`
      CREATE TABLE IF NOT EXISTS session_players (
        session_player_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        session_id BIGINT UNSIGNED NOT NULL,
        user_id BIGINT UNSIGNED NOT NULL,
        final_score DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        final_rank INT UNSIGNED DEFAULT NULL,
        is_winner BOOLEAN NOT NULL DEFAULT FALSE,
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_session_player (session_id, user_id),
        CONSTRAINT fk_sp_session FOREIGN KEY (session_id) REFERENCES game_sessions(session_id) ON DELETE CASCADE,
        CONSTRAINT fk_sp_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
        INDEX idx_sp_rank (session_id, final_rank)
      ) ENGINE=InnoDB
    `);

    // 9b. Prediction Arena
    await query(`
      CREATE TABLE IF NOT EXISTS prediction_rounds (
        round_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        session_id BIGINT UNSIGNED NOT NULL,
        round_number INT UNSIGNED NOT NULL,
        total_sum INT DEFAULT 0,
        player_count INT UNSIGNED NOT NULL DEFAULT 0,
        average_value DECIMAL(8,4) DEFAULT 0.0000,
        target_value DECIMAL(8,4) DEFAULT 0.0000,
        active_rules JSON NULL,
        status ENUM('SUBMITTING', 'REVEALED', 'COMPLETED') NOT NULL DEFAULT 'SUBMITTING',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        resolved_at TIMESTAMP NULL DEFAULT NULL,
        UNIQUE KEY uq_pred_session_round (session_id, round_number),
        CONSTRAINT fk_pred_round_session FOREIGN KEY (session_id) REFERENCES game_sessions(session_id) ON DELETE CASCADE
      ) ENGINE=InnoDB
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS prediction_submissions (
        submission_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        round_id BIGINT UNSIGNED NOT NULL,
        user_id BIGINT UNSIGNED NOT NULL,
        chosen_number INT NOT NULL,
        is_duplicate BOOLEAN NOT NULL DEFAULT FALSE,
        is_exact_target BOOLEAN NOT NULL DEFAULT FALSE,
        is_zero_one_hundred_win BOOLEAN NOT NULL DEFAULT FALSE,
        round_rank INT UNSIGNED DEFAULT NULL,
        points_awarded INT NOT NULL DEFAULT 0,
        penalty_points INT NOT NULL DEFAULT 0,
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_pred_user_round (round_id, user_id),
        CONSTRAINT fk_pred_sub_round FOREIGN KEY (round_id) REFERENCES prediction_rounds(round_id) ON DELETE CASCADE,
        CONSTRAINT fk_pred_sub_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
        CONSTRAINT chk_pred_number CHECK (chosen_number >= 0 AND chosen_number <= 100)
      ) ENGINE=InnoDB
    `);

    // 9c. Drawice
    await query(`
      CREATE TABLE IF NOT EXISTS drawice_words (
        word_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        word VARCHAR(100) NOT NULL UNIQUE,
        category VARCHAR(100) NOT NULL DEFAULT 'General',
        difficulty ENUM('EASY', 'MEDIUM', 'HARD') NOT NULL DEFAULT 'MEDIUM',
        is_active BOOLEAN NOT NULL DEFAULT TRUE
      ) ENGINE=InnoDB
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS drawice_rounds (
        round_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        session_id BIGINT UNSIGNED NOT NULL,
        round_number INT UNSIGNED NOT NULL,
        artist_user_id BIGINT UNSIGNED NOT NULL,
        word_options_json JSON NOT NULL,
        chosen_word_id BIGINT UNSIGNED NULL,
        chosen_word VARCHAR(100) NULL,
        time_limit_seconds INT UNSIGNED NOT NULL DEFAULT 60,
        status ENUM('CHOOSING', 'DRAWING', 'ROUND_REVEAL', 'FINISHED') NOT NULL DEFAULT 'CHOOSING',
        artist_score INT NOT NULL DEFAULT 0,
        drawing_data MEDIUMTEXT NULL,
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ended_at TIMESTAMP NULL DEFAULT NULL,
        UNIQUE KEY uq_drawice_session_round (session_id, round_number),
        CONSTRAINT fk_dr_sess FOREIGN KEY (session_id) REFERENCES game_sessions(session_id) ON DELETE CASCADE,
        CONSTRAINT fk_dr_artist FOREIGN KEY (artist_user_id) REFERENCES users(user_id) ON DELETE CASCADE,
        CONSTRAINT fk_dr_word FOREIGN KEY (chosen_word_id) REFERENCES drawice_words(word_id) ON DELETE SET NULL
      ) ENGINE=InnoDB
    `);

    try {
      await query(`ALTER TABLE drawice_rounds ADD COLUMN chosen_word VARCHAR(100) NULL AFTER chosen_word_id`);
    } catch (e: any) {}

    try {
      await query(`ALTER TABLE drawice_rounds ADD COLUMN drawing_data MEDIUMTEXT NULL AFTER artist_score`);
    } catch (e: any) {}

    await query(`
      CREATE TABLE IF NOT EXISTS drawice_guesses (
        guess_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        round_id BIGINT UNSIGNED NOT NULL,
        user_id BIGINT UNSIGNED NOT NULL,
        guess_text VARCHAR(150) NOT NULL,
        is_correct BOOLEAN NOT NULL DEFAULT FALSE,
        submission_sequence INT UNSIGNED NOT NULL,
        points_awarded INT NOT NULL DEFAULT 0,
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_dg_round FOREIGN KEY (round_id) REFERENCES drawice_rounds(round_id) ON DELETE CASCADE,
        CONSTRAINT fk_dg_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
        INDEX idx_dg_sequence (round_id, submission_sequence)
      ) ENGINE=InnoDB
    `);

    await query(`
      INSERT IGNORE INTO drawice_words (word, category, difficulty) VALUES
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
      ('Supernova', 'Space', 'MEDIUM'),
      ('Spaceship', 'Vehicles', 'EASY'),
      ('Robot', 'Technology', 'EASY'),
      ('Pizza', 'Food', 'EASY'),
      ('Guitar', 'Music', 'EASY'),
      ('Sunflower', 'Nature', 'EASY'),
      ('Dinosaur', 'Animals', 'EASY'),
      ('Airplane', 'Vehicles', 'EASY'),
      ('Castle', 'Architecture', 'EASY'),
      ('Waterfall', 'Nature', 'EASY'),
      ('Diamond', 'Objects', 'EASY'),
      ('Bicycle', 'Vehicles', 'EASY'),
      ('Penguin', 'Animals', 'EASY'),
      ('Lightning', 'Nature', 'EASY'),
      ('Dragon', 'Fantasy', 'MEDIUM'),
      ('Anchor', 'Objects', 'EASY'),
      ('Tornado', 'Nature', 'MEDIUM'),
      ('Helicopter', 'Vehicles', 'MEDIUM'),
      ('Parachute', 'Objects', 'MEDIUM'),
      ('Campfire', 'Nature', 'EASY')
    `);

    // 9d. Detective System
    await query(`
      CREATE TABLE IF NOT EXISTS detective_cases (
        case_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(150) NOT NULL,
        synopsis TEXT NOT NULL,
        difficulty ENUM('EASY', 'MEDIUM', 'HARD') NOT NULL DEFAULT 'MEDIUM',
        investigation_budget INT UNSIGNED NOT NULL DEFAULT 100,
        incident_location VARCHAR(200) NULL,
        incident_time VARCHAR(100) NULL,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS detective_suspects (
        suspect_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        case_id BIGINT UNSIGNED NOT NULL,
        name VARCHAR(100) NOT NULL,
        occupation VARCHAR(100) NOT NULL,
        background TEXT NOT NULL,
        alibi TEXT NOT NULL,
        avatar_url VARCHAR(500) NULL,
        is_culprit BOOLEAN NOT NULL DEFAULT FALSE,
        interrogation_cost INT UNSIGNED NOT NULL DEFAULT 10,
        interrogation_transcript TEXT NULL,
        motive_description TEXT NULL,
        CONSTRAINT fk_det_suspect_case FOREIGN KEY (case_id) REFERENCES detective_cases(case_id) ON DELETE CASCADE
      ) ENGINE=InnoDB
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS detective_locations (
        location_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        case_id BIGINT UNSIGNED NOT NULL,
        name VARCHAR(100) NOT NULL,
        description TEXT NOT NULL,
        action_cost INT UNSIGNED NOT NULL DEFAULT 10,
        image_url VARCHAR(500) NULL,
        search_findings TEXT NULL,
        CONSTRAINT fk_det_loc_case FOREIGN KEY (case_id) REFERENCES detective_cases(case_id) ON DELETE CASCADE
      ) ENGINE=InnoDB
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS detective_evidence (
        evidence_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        case_id BIGINT UNSIGNED NOT NULL,
        location_id BIGINT UNSIGNED NULL,
        suspect_id BIGINT UNSIGNED NULL,
        title VARCHAR(150) NOT NULL,
        description TEXT NOT NULL,
        image_url VARCHAR(500) NULL,
        analysis_cost INT UNSIGNED NOT NULL DEFAULT 15,
        forensic_details TEXT NULL,
        is_critical BOOLEAN NOT NULL DEFAULT FALSE,
        is_red_herring BOOLEAN NOT NULL DEFAULT FALSE,
        CONSTRAINT fk_det_ev_case FOREIGN KEY (case_id) REFERENCES detective_cases(case_id) ON DELETE CASCADE,
        CONSTRAINT fk_det_ev_loc FOREIGN KEY (location_id) REFERENCES detective_locations(location_id) ON DELETE SET NULL,
        CONSTRAINT fk_det_ev_suspect FOREIGN KEY (suspect_id) REFERENCES detective_suspects(suspect_id) ON DELETE SET NULL
      ) ENGINE=InnoDB
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS detective_clues (
        clue_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        case_id BIGINT UNSIGNED NOT NULL,
        evidence_id BIGINT UNSIGNED NULL,
        clue_text TEXT NOT NULL,
        action_cost INT UNSIGNED NOT NULL DEFAULT 15,
        deduction_notes TEXT NULL,
        CONSTRAINT fk_det_clue_case FOREIGN KEY (case_id) REFERENCES detective_cases(case_id) ON DELETE CASCADE,
        CONSTRAINT fk_det_clue_ev FOREIGN KEY (evidence_id) REFERENCES detective_evidence(evidence_id) ON DELETE SET NULL
      ) ENGINE=InnoDB
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS detective_timeline_events (
        event_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        case_id BIGINT UNSIGNED NOT NULL,
        timestamp_label VARCHAR(50) NOT NULL,
        event_description TEXT NOT NULL,
        suspect_id BIGINT UNSIGNED NULL,
        is_verified BOOLEAN NOT NULL DEFAULT TRUE,
        CONSTRAINT fk_det_timeline_case FOREIGN KEY (case_id) REFERENCES detective_cases(case_id) ON DELETE CASCADE,
        CONSTRAINT fk_det_timeline_suspect FOREIGN KEY (suspect_id) REFERENCES detective_suspects(suspect_id) ON DELETE SET NULL
      ) ENGINE=InnoDB
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS detective_puzzles (
        puzzle_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        case_id BIGINT UNSIGNED NOT NULL,
        prompt TEXT NOT NULL,
        puzzle_type VARCHAR(50) NOT NULL,
        solution_hash VARCHAR(255) NOT NULL,
        accepted_plaintext VARCHAR(100) NOT NULL,
        hint TEXT NOT NULL,
        unlocked_clue_text TEXT NULL,
        action_cost INT UNSIGNED NOT NULL DEFAULT 20,
        CONSTRAINT fk_det_puzzle_case FOREIGN KEY (case_id) REFERENCES detective_cases(case_id) ON DELETE CASCADE
      ) ENGINE=InnoDB
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS detective_case_solutions (
        solution_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        case_id BIGINT UNSIGNED NOT NULL UNIQUE,
        culprit_suspect_id BIGINT UNSIGNED NOT NULL,
        motive VARCHAR(255) NOT NULL,
        murder_weapon_or_method VARCHAR(255) NOT NULL,
        critical_evidence_summary TEXT NOT NULL,
        explanation TEXT NOT NULL,
        CONSTRAINT fk_det_sol_case FOREIGN KEY (case_id) REFERENCES detective_cases(case_id) ON DELETE CASCADE,
        CONSTRAINT fk_det_sol_suspect FOREIGN KEY (culprit_suspect_id) REFERENCES detective_suspects(suspect_id) ON DELETE RESTRICT
      ) ENGINE=InnoDB
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS detective_sessions (
        detective_session_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        session_id BIGINT UNSIGNED NOT NULL UNIQUE,
        case_id BIGINT UNSIGNED NOT NULL,
        remaining_budget INT NOT NULL DEFAULT 100,
        status ENUM('INVESTIGATING', 'ACCUSED', 'SOLVED', 'FAILED') NOT NULL DEFAULT 'INVESTIGATING',
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP NULL DEFAULT NULL,
        CONSTRAINT fk_det_sess_session FOREIGN KEY (session_id) REFERENCES game_sessions(session_id) ON DELETE CASCADE,
        CONSTRAINT fk_det_sess_case FOREIGN KEY (case_id) REFERENCES detective_cases(case_id) ON DELETE RESTRICT
      ) ENGINE=InnoDB
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS detective_investigation_actions (
        action_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        detective_session_id BIGINT UNSIGNED NOT NULL,
        user_id BIGINT UNSIGNED NOT NULL,
        action_type ENUM('INTERROGATE', 'SEARCH_LOCATION', 'ANALYZE_EVIDENCE', 'SOLVE_PUZZLE', 'EXAMINE_CLUE', 'CHECK_TIMELINE') NOT NULL,
        target_id BIGINT UNSIGNED NOT NULL,
        cost_deducted INT UNSIGNED NOT NULL,
        result_summary TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_det_act_session FOREIGN KEY (detective_session_id) REFERENCES detective_sessions(detective_session_id) ON DELETE CASCADE,
        CONSTRAINT fk_det_act_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
      ) ENGINE=InnoDB
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS detective_discoveries (
        discovery_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        detective_session_id BIGINT UNSIGNED NOT NULL,
        user_id BIGINT UNSIGNED NOT NULL,
        discovery_type ENUM('CLUE', 'EVIDENCE', 'TIMELINE_EVENT', 'PUZZLE_UNLOCKED', 'SUSPECT_STATEMENT', 'LOCATION_SEARCH') NOT NULL,
        target_id BIGINT UNSIGNED NOT NULL,
        discovered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_det_discovery (detective_session_id, user_id, discovery_type, target_id),
        CONSTRAINT fk_det_disc_session FOREIGN KEY (detective_session_id) REFERENCES detective_sessions(detective_session_id) ON DELETE CASCADE,
        CONSTRAINT fk_det_disc_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
      ) ENGINE=InnoDB
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS detective_accusations (
        accusation_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        detective_session_id BIGINT UNSIGNED NOT NULL,
        user_id BIGINT UNSIGNED NOT NULL,
        accused_suspect_id BIGINT UNSIGNED NOT NULL,
        stated_motive VARCHAR(255) NOT NULL,
        stated_evidence_id BIGINT UNSIGNED NOT NULL,
        stated_reasoning TEXT NOT NULL,
        suspect_score INT NOT NULL DEFAULT 0,
        motive_score INT NOT NULL DEFAULT 0,
        evidence_score INT NOT NULL DEFAULT 0,
        reasoning_score INT NOT NULL DEFAULT 0,
        efficiency_bonus INT NOT NULL DEFAULT 0,
        final_score INT NOT NULL DEFAULT 0,
        is_correct BOOLEAN NOT NULL DEFAULT FALSE,
        accused_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_det_user_session_accuse (detective_session_id, user_id),
        CONSTRAINT fk_det_acc_session FOREIGN KEY (detective_session_id) REFERENCES detective_sessions(detective_session_id) ON DELETE CASCADE,
        CONSTRAINT fk_det_acc_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
        CONSTRAINT fk_det_acc_suspect FOREIGN KEY (accused_suspect_id) REFERENCES detective_suspects(suspect_id) ON DELETE RESTRICT,
        CONSTRAINT fk_det_acc_ev FOREIGN KEY (stated_evidence_id) REFERENCES detective_evidence(evidence_id) ON DELETE RESTRICT
      ) ENGINE=InnoDB
    `);

    // 10. Statistics
    await query(`
      CREATE TABLE IF NOT EXISTS player_game_statistics (
        user_id BIGINT UNSIGNED NOT NULL,
        game_id BIGINT UNSIGNED NOT NULL,
        games_played INT UNSIGNED NOT NULL DEFAULT 0,
        games_won INT UNSIGNED NOT NULL DEFAULT 0,
        total_score DECIMAL(14,2) NOT NULL DEFAULT 0.00,
        highest_score DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, game_id),
        CONSTRAINT fk_stats_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
        CONSTRAINT fk_stats_game FOREIGN KEY (game_id) REFERENCES games(game_id) ON DELETE RESTRICT
      ) ENGINE=InnoDB
    `);

    // 11. Achievements
    await query(`
      CREATE TABLE IF NOT EXISTS achievements (
        achievement_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        game_id BIGINT UNSIGNED NULL,
        name VARCHAR(100) NOT NULL UNIQUE,
        description TEXT NOT NULL,
        icon_url VARCHAR(500) NOT NULL,
        requirement_type VARCHAR(50) NOT NULL,
        requirement_value INT UNSIGNED NOT NULL DEFAULT 1,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_achievements_game FOREIGN KEY (game_id) REFERENCES games(game_id) ON DELETE SET NULL
      ) ENGINE=InnoDB
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS user_achievements (
        user_id BIGINT UNSIGNED NOT NULL,
        achievement_id BIGINT UNSIGNED NOT NULL,
        earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, achievement_id),
        CONSTRAINT fk_ua_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
        CONSTRAINT fk_ua_achievement FOREIGN KEY (achievement_id) REFERENCES achievements(achievement_id) ON DELETE CASCADE
      ) ENGINE=InnoDB
    `);

    await query(`
      INSERT IGNORE INTO achievements (game_id, name, description, icon_url, requirement_type, requirement_value) VALUES
      (NULL, 'First Blood', 'Win your very first game on the MindVault platform', '/icons/achievements/first-blood.svg', 'GAMES_WON_TOTAL', 1),
      (NULL, 'Century Club', 'Accumulate over 100 total score points across all vault arenas', '/icons/achievements/century.svg', 'TOTAL_SCORE_OVERALL', 100),
      (3, 'Vault Breaker', 'Escape any scenario with zero hints used', '/icons/achievements/no-hint-escape.svg', 'ESCAPE_ZERO_HINTS', 1),
      (3, 'Speed Demon', 'Escape any vault scenario in under 10 minutes', '/icons/achievements/speed-escape.svg', 'ESCAPE_SPEED_RUN', 600)
    `);

    // 12. Dynamic Leaderboard Views
    await query(`
      CREATE OR REPLACE VIEW v_overall_leaderboard AS
      SELECT 
          u.user_id,
          p.display_name,
          p.avatar_url,
          COALESCE(SUM(pgs.games_played), 0) AS total_games_played,
          COALESCE(SUM(pgs.games_won), 0) AS total_games_won,
          COALESCE(SUM(pgs.total_score), 0.00) AS aggregate_score,
          COALESCE(MAX(pgs.highest_score), 0.00) AS peak_score,
          CASE 
              WHEN SUM(pgs.games_played) > 0 
              THEN ROUND((SUM(pgs.games_won) / SUM(pgs.games_played)) * 100, 1) 
              ELSE 0.0 
          END AS win_rate_percentage,
          RANK() OVER (ORDER BY SUM(pgs.total_score) DESC, SUM(pgs.games_won) DESC) AS global_rank
      FROM users u
      JOIN user_profiles p ON u.user_id = p.user_id
      LEFT JOIN player_game_statistics pgs ON u.user_id = pgs.user_id
      WHERE u.account_status = 'ACTIVE'
      GROUP BY u.user_id, p.display_name, p.avatar_url
    `);

    await query(`
      CREATE OR REPLACE VIEW v_game_leaderboards AS
      SELECT 
          g.game_code,
          g.game_name,
          u.user_id,
          p.display_name,
          p.avatar_url,
          pgs.games_played,
          pgs.games_won,
          pgs.total_score,
          pgs.highest_score,
          CASE 
              WHEN pgs.games_played > 0 
              THEN ROUND((pgs.games_won / pgs.games_played) * 100, 1) 
              ELSE 0.0 
          END AS win_rate_percentage,
          RANK() OVER (PARTITION BY g.game_id ORDER BY pgs.total_score DESC, pgs.games_won DESC) AS game_rank
      FROM games g
      JOIN player_game_statistics pgs ON g.game_id = pgs.game_id
      JOIN users u ON pgs.user_id = u.user_id
      JOIN user_profiles p ON u.user_id = p.user_id
      WHERE u.account_status = 'ACTIVE' AND g.is_active = TRUE
    `);

    // Seed Detective Cases
    await seedDetectiveCases();

    tablesEnsured = true;
  } catch (err: any) {
    console.error('[ensureCoreTables] Schema check error:', err.message);
  }
}
