-- MINDVAULT DATABASE SCHEMA
CREATE DATABASE IF NOT EXISTS mindvault CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE mindvault;
SET FOREIGN_KEY_CHECKS = 0;

-- 1. USERS & ROLES
DROP TABLE IF EXISTS user_roles;
DROP TABLE IF EXISTS roles;
DROP TABLE IF EXISTS user_profiles;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    user_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    firebase_uid VARCHAR(128) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    account_status ENUM('ACTIVE', 'SUSPENDED', 'DEACTIVATED') NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_users_firebase_uid (firebase_uid),
    INDEX idx_users_email (email),
    INDEX idx_users_status (account_status)
) ENGINE=InnoDB;

CREATE TABLE user_profiles (
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
) ENGINE=InnoDB;

CREATE TABLE roles (
    role_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    role_name ENUM('PLAYER', 'ADMIN') NOT NULL UNIQUE,
    description VARCHAR(255) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE user_roles (
    user_role_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    role_id BIGINT UNSIGNED NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_user_role (user_id, role_id),
    CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_user_roles_role FOREIGN KEY (role_id) REFERENCES roles(role_id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- 2. GAMES, ROOMS & SESSIONS
DROP TABLE IF EXISTS user_achievements;
DROP TABLE IF EXISTS achievements;
DROP TABLE IF EXISTS player_game_statistics;
DROP TABLE IF EXISTS session_players;
DROP TABLE IF EXISTS game_sessions;
DROP TABLE IF EXISTS room_players;
DROP TABLE IF EXISTS game_rooms;
DROP TABLE IF EXISTS games;

CREATE TABLE games (
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
) ENGINE=InnoDB;

CREATE TABLE game_rooms (
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
) ENGINE=InnoDB;

CREATE TABLE room_players (
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
) ENGINE=InnoDB;

CREATE TABLE game_sessions (
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
) ENGINE=InnoDB;

CREATE TABLE session_players (
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
) ENGINE=InnoDB;

CREATE TABLE player_game_statistics (
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
) ENGINE=InnoDB;

CREATE TABLE achievements (
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
) ENGINE=InnoDB;

CREATE TABLE user_achievements (
    user_id BIGINT UNSIGNED NOT NULL,
    achievement_id BIGINT UNSIGNED NOT NULL,
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, achievement_id),
    CONSTRAINT fk_ua_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_ua_achievement FOREIGN KEY (achievement_id) REFERENCES achievements(achievement_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 3. PREDICTION ARENA
DROP TABLE IF EXISTS prediction_submissions;
DROP TABLE IF EXISTS prediction_rounds;

CREATE TABLE prediction_rounds (
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
) ENGINE=InnoDB;

CREATE TABLE prediction_submissions (
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
) ENGINE=InnoDB;

-- 4. DETECTIVE SYSTEM (CORRECTION 6)
DROP TABLE IF EXISTS detective_accusations;
DROP TABLE IF EXISTS detective_discoveries;
DROP TABLE IF EXISTS detective_investigation_actions;
DROP TABLE IF EXISTS detective_sessions;
DROP TABLE IF EXISTS detective_case_solutions;
DROP TABLE IF EXISTS detective_puzzles;
DROP TABLE IF EXISTS detective_timeline_events;
DROP TABLE IF EXISTS detective_clues;
DROP TABLE IF EXISTS detective_evidence;
DROP TABLE IF EXISTS detective_locations;
DROP TABLE IF EXISTS detective_suspects;
DROP TABLE IF EXISTS detective_cases;

CREATE TABLE detective_cases (
    case_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    synopsis TEXT NOT NULL,
    difficulty ENUM('EASY', 'MEDIUM', 'HARD') NOT NULL DEFAULT 'MEDIUM',
    investigation_budget INT UNSIGNED NOT NULL DEFAULT 100,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE detective_suspects (
    suspect_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    case_id BIGINT UNSIGNED NOT NULL,
    name VARCHAR(100) NOT NULL,
    occupation VARCHAR(100) NOT NULL,
    background TEXT NOT NULL,
    alibi TEXT NOT NULL,
    avatar_url VARCHAR(500) NULL,
    is_culprit BOOLEAN NOT NULL DEFAULT FALSE,
    interrogation_cost INT UNSIGNED NOT NULL DEFAULT 10,
    CONSTRAINT fk_det_suspect_case FOREIGN KEY (case_id) REFERENCES detective_cases(case_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE detective_locations (
    location_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    case_id BIGINT UNSIGNED NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    action_cost INT UNSIGNED NOT NULL DEFAULT 10,
    image_url VARCHAR(500) NULL,
    CONSTRAINT fk_det_loc_case FOREIGN KEY (case_id) REFERENCES detective_cases(case_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE detective_evidence (
    evidence_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    case_id BIGINT UNSIGNED NOT NULL,
    location_id BIGINT UNSIGNED NULL,
    suspect_id BIGINT UNSIGNED NULL,
    title VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    image_url VARCHAR(500) NULL,
    analysis_cost INT UNSIGNED NOT NULL DEFAULT 15,
    CONSTRAINT fk_det_ev_case FOREIGN KEY (case_id) REFERENCES detective_cases(case_id) ON DELETE CASCADE,
    CONSTRAINT fk_det_ev_loc FOREIGN KEY (location_id) REFERENCES detective_locations(location_id) ON DELETE SET NULL,
    CONSTRAINT fk_det_ev_suspect FOREIGN KEY (suspect_id) REFERENCES detective_suspects(suspect_id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE detective_clues (
    clue_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    case_id BIGINT UNSIGNED NOT NULL,
    evidence_id BIGINT UNSIGNED NULL,
    clue_text TEXT NOT NULL,
    action_cost INT UNSIGNED NOT NULL DEFAULT 15,
    CONSTRAINT fk_det_clue_case FOREIGN KEY (case_id) REFERENCES detective_cases(case_id) ON DELETE CASCADE,
    CONSTRAINT fk_det_clue_ev FOREIGN KEY (evidence_id) REFERENCES detective_evidence(evidence_id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE detective_timeline_events (
    event_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    case_id BIGINT UNSIGNED NOT NULL,
    timestamp_label VARCHAR(50) NOT NULL,
    event_description TEXT NOT NULL,
    suspect_id BIGINT UNSIGNED NULL,
    CONSTRAINT fk_det_timeline_case FOREIGN KEY (case_id) REFERENCES detective_cases(case_id) ON DELETE CASCADE,
    CONSTRAINT fk_det_timeline_suspect FOREIGN KEY (suspect_id) REFERENCES detective_suspects(suspect_id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE detective_puzzles (
    puzzle_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    case_id BIGINT UNSIGNED NOT NULL,
    prompt TEXT NOT NULL,
    puzzle_type VARCHAR(50) NOT NULL,
    solution_hash VARCHAR(255) NOT NULL,
    hint TEXT NOT NULL,
    action_cost INT UNSIGNED NOT NULL DEFAULT 20,
    CONSTRAINT fk_det_puzzle_case FOREIGN KEY (case_id) REFERENCES detective_cases(case_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE detective_case_solutions (
    solution_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    case_id BIGINT UNSIGNED NOT NULL UNIQUE,
    culprit_suspect_id BIGINT UNSIGNED NOT NULL,
    motive VARCHAR(255) NOT NULL,
    murder_weapon_or_method VARCHAR(255) NOT NULL,
    critical_evidence_summary TEXT NOT NULL,
    CONSTRAINT fk_det_sol_case FOREIGN KEY (case_id) REFERENCES detective_cases(case_id) ON DELETE CASCADE,
    CONSTRAINT fk_det_sol_suspect FOREIGN KEY (culprit_suspect_id) REFERENCES detective_suspects(suspect_id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE detective_sessions (
    detective_session_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    session_id BIGINT UNSIGNED NOT NULL UNIQUE,
    case_id BIGINT UNSIGNED NOT NULL,
    remaining_budget INT NOT NULL DEFAULT 100,
    status ENUM('INVESTIGATING', 'ACCUSED', 'SOLVED', 'FAILED') NOT NULL DEFAULT 'INVESTIGATING',
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL DEFAULT NULL,
    CONSTRAINT fk_det_sess_session FOREIGN KEY (session_id) REFERENCES game_sessions(session_id) ON DELETE CASCADE,
    CONSTRAINT fk_det_sess_case FOREIGN KEY (case_id) REFERENCES detective_cases(case_id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE detective_investigation_actions (
    action_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    detective_session_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    action_type ENUM('INTERROGATE', 'SEARCH_LOCATION', 'ANALYZE_EVIDENCE', 'SOLVE_PUZZLE') NOT NULL,
    target_id BIGINT UNSIGNED NOT NULL,
    cost_deducted INT UNSIGNED NOT NULL,
    result_summary TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_det_act_session FOREIGN KEY (detective_session_id) REFERENCES detective_sessions(detective_session_id) ON DELETE CASCADE,
    CONSTRAINT fk_det_act_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE detective_discoveries (
    discovery_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    detective_session_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    discovery_type ENUM('CLUE', 'EVIDENCE', 'TIMELINE_EVENT', 'PUZZLE_UNLOCKED') NOT NULL,
    target_id BIGINT UNSIGNED NOT NULL,
    discovered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_det_discovery (detective_session_id, user_id, discovery_type, target_id),
    CONSTRAINT fk_det_disc_session FOREIGN KEY (detective_session_id) REFERENCES detective_sessions(detective_session_id) ON DELETE CASCADE,
    CONSTRAINT fk_det_disc_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE detective_accusations (
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
    CONSTRAINT fk_det_acc_session FOREIGN KEY (detective_session_id) REFERENCES detective_sessions(detective_session_id) ON DELETE CASCADE,
    CONSTRAINT fk_det_acc_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_det_acc_suspect FOREIGN KEY (accused_suspect_id) REFERENCES detective_suspects(suspect_id) ON DELETE RESTRICT,
    CONSTRAINT fk_det_acc_ev FOREIGN KEY (stated_evidence_id) REFERENCES detective_evidence(evidence_id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- 5. ESCAPE ROOM SYSTEM (CORRECTION 7)
DROP TABLE IF EXISTS escape_results;
DROP TABLE IF EXISTS escape_room_completions;
DROP TABLE IF EXISTS escape_hint_usage;
DROP TABLE IF EXISTS escape_hints;
DROP TABLE IF EXISTS escape_puzzle_attempts;
DROP TABLE IF EXISTS escape_completed_puzzles;
DROP TABLE IF EXISTS escape_session_progress;
DROP TABLE IF EXISTS escape_session_players;
DROP TABLE IF EXISTS escape_sessions;
DROP TABLE IF EXISTS escape_unlock_conditions;
DROP TABLE IF EXISTS escape_locks;
DROP TABLE IF EXISTS escape_puzzle_answers;
DROP TABLE IF EXISTS escape_puzzles;
DROP TABLE IF EXISTS escape_clues;
DROP TABLE IF EXISTS escape_objects;
DROP TABLE IF EXISTS escape_rooms;
DROP TABLE IF EXISTS escape_scenarios;

CREATE TABLE escape_scenarios (
    scenario_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    theme_description TEXT NOT NULL,
    time_limit_seconds INT UNSIGNED NOT NULL DEFAULT 600,
    difficulty ENUM('EASY', 'MEDIUM', 'HARD') NOT NULL DEFAULT 'MEDIUM',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE escape_rooms (
    escape_room_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    scenario_id BIGINT UNSIGNED NOT NULL,
    room_name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    sequence_order INT UNSIGNED NOT NULL,
    ambient_theme VARCHAR(50) DEFAULT 'VAULT_DARK',
    CONSTRAINT fk_esc_room_scen FOREIGN KEY (scenario_id) REFERENCES escape_scenarios(scenario_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE escape_objects (
    object_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    escape_room_id BIGINT UNSIGNED NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    is_inspectable BOOLEAN NOT NULL DEFAULT TRUE,
    is_locked BOOLEAN NOT NULL DEFAULT FALSE,
    icon_name VARCHAR(50) DEFAULT 'key',
    CONSTRAINT fk_esc_obj_room FOREIGN KEY (escape_room_id) REFERENCES escape_rooms(escape_room_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE escape_clues (
    clue_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    object_id BIGINT UNSIGNED NOT NULL,
    clue_text TEXT NOT NULL,
    image_url VARCHAR(500) NULL,
    CONSTRAINT fk_esc_clue_obj FOREIGN KEY (object_id) REFERENCES escape_objects(object_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE escape_puzzles (
    puzzle_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    object_id BIGINT UNSIGNED NOT NULL,
    puzzle_prompt TEXT NOT NULL,
    puzzle_type ENUM('CIPHER', 'DIAL', 'RIDDLE', 'SEQUENCE', 'KEYPAD') NOT NULL,
    hint_text TEXT NOT NULL,
    difficulty_points INT UNSIGNED NOT NULL DEFAULT 100,
    CONSTRAINT fk_esc_puz_obj FOREIGN KEY (object_id) REFERENCES escape_objects(object_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE escape_puzzle_answers (
    answer_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    puzzle_id BIGINT UNSIGNED NOT NULL,
    answer_hash VARCHAR(255) NOT NULL,
    accepted_plaintext VARCHAR(100) NOT NULL,
    CONSTRAINT fk_esc_ans_puz FOREIGN KEY (puzzle_id) REFERENCES escape_puzzles(puzzle_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE escape_locks (
    lock_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    escape_room_id BIGINT UNSIGNED NOT NULL,
    lock_name VARCHAR(100) NOT NULL,
    lock_type ENUM('DOOR', 'SAFE', 'CHEST', 'DRAWER') NOT NULL DEFAULT 'DOOR',
    target_room_id BIGINT UNSIGNED NULL,
    is_exit_door BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_esc_lock_room FOREIGN KEY (escape_room_id) REFERENCES escape_rooms(escape_room_id) ON DELETE CASCADE,
    CONSTRAINT fk_esc_lock_target FOREIGN KEY (target_room_id) REFERENCES escape_rooms(escape_room_id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE escape_unlock_conditions (
    condition_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    lock_id BIGINT UNSIGNED NOT NULL,
    required_puzzle_id BIGINT UNSIGNED NULL,
    required_object_id BIGINT UNSIGNED NULL,
    CONSTRAINT fk_esc_cond_lock FOREIGN KEY (lock_id) REFERENCES escape_locks(lock_id) ON DELETE CASCADE,
    CONSTRAINT fk_esc_cond_puz FOREIGN KEY (required_puzzle_id) REFERENCES escape_puzzles(puzzle_id) ON DELETE SET NULL,
    CONSTRAINT fk_esc_cond_obj FOREIGN KEY (required_object_id) REFERENCES escape_objects(object_id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE escape_sessions (
    escape_session_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    session_id BIGINT UNSIGNED NOT NULL UNIQUE,
    scenario_id BIGINT UNSIGNED NOT NULL,
    current_room_id BIGINT UNSIGNED NOT NULL,
    hints_remaining INT NOT NULL DEFAULT 2,
    time_remaining_seconds INT NOT NULL DEFAULT 600,
    status ENUM('ACTIVE', 'ESCAPED', 'TIMEOUT', 'ABANDONED') NOT NULL DEFAULT 'ACTIVE',
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL DEFAULT NULL,
    CONSTRAINT fk_esc_sess_session FOREIGN KEY (session_id) REFERENCES game_sessions(session_id) ON DELETE CASCADE,
    CONSTRAINT fk_esc_sess_scen FOREIGN KEY (scenario_id) REFERENCES escape_scenarios(scenario_id) ON DELETE RESTRICT,
    CONSTRAINT fk_esc_sess_croom FOREIGN KEY (current_room_id) REFERENCES escape_rooms(escape_room_id) ON DELETE RESTRICT,
    CONSTRAINT chk_hints_remaining CHECK (hints_remaining >= 0 AND hints_remaining <= 2)
) ENGINE=InnoDB;

CREATE TABLE escape_session_players (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    escape_session_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_esc_sess_player (escape_session_id, user_id),
    CONSTRAINT fk_esp_sess FOREIGN KEY (escape_session_id) REFERENCES escape_sessions(escape_session_id) ON DELETE CASCADE,
    CONSTRAINT fk_esp_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE escape_session_progress (
    progress_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    escape_session_id BIGINT UNSIGNED NOT NULL,
    event_type ENUM('INSPECT_OBJECT', 'ENTER_ROOM', 'UNLOCK_LOCK') NOT NULL,
    target_id BIGINT UNSIGNED NOT NULL,
    unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_esprog_sess FOREIGN KEY (escape_session_id) REFERENCES escape_sessions(escape_session_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE escape_completed_puzzles (
    completion_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    escape_session_id BIGINT UNSIGNED NOT NULL,
    puzzle_id BIGINT UNSIGNED NOT NULL,
    solved_by_user_id BIGINT UNSIGNED NOT NULL,
    solved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_esc_solved_puz (escape_session_id, puzzle_id),
    CONSTRAINT fk_ecp_sess FOREIGN KEY (escape_session_id) REFERENCES escape_sessions(escape_session_id) ON DELETE CASCADE,
    CONSTRAINT fk_ecp_puz FOREIGN KEY (puzzle_id) REFERENCES escape_puzzles(puzzle_id) ON DELETE RESTRICT,
    CONSTRAINT fk_ecp_user FOREIGN KEY (solved_by_user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE escape_puzzle_attempts (
    attempt_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    escape_session_id BIGINT UNSIGNED NOT NULL,
    puzzle_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    submitted_answer_preview VARCHAR(100) NOT NULL,
    is_successful BOOLEAN NOT NULL DEFAULT FALSE,
    attempt_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_epa_sess FOREIGN KEY (escape_session_id) REFERENCES escape_sessions(escape_session_id) ON DELETE CASCADE,
    CONSTRAINT fk_epa_puz FOREIGN KEY (puzzle_id) REFERENCES escape_puzzles(puzzle_id) ON DELETE CASCADE,
    CONSTRAINT fk_epa_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE escape_hints (
    hint_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    scenario_id BIGINT UNSIGNED NOT NULL,
    room_id BIGINT UNSIGNED NOT NULL,
    hint_number INT UNSIGNED NOT NULL,
    hint_text TEXT NOT NULL,
    CONSTRAINT fk_eh_scen FOREIGN KEY (scenario_id) REFERENCES escape_scenarios(scenario_id) ON DELETE CASCADE,
    CONSTRAINT fk_eh_room FOREIGN KEY (room_id) REFERENCES escape_rooms(escape_room_id) ON DELETE CASCADE,
    CONSTRAINT chk_hint_num CHECK (hint_number IN (1, 2))
) ENGINE=InnoDB;

CREATE TABLE escape_hint_usage (
    usage_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    escape_session_id BIGINT UNSIGNED NOT NULL,
    hint_id BIGINT UNSIGNED NOT NULL,
    requested_by_user_id BIGINT UNSIGNED NOT NULL,
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ehu_sess FOREIGN KEY (escape_session_id) REFERENCES escape_sessions(escape_session_id) ON DELETE CASCADE,
    CONSTRAINT fk_ehu_hint FOREIGN KEY (hint_id) REFERENCES escape_hints(hint_id) ON DELETE RESTRICT,
    CONSTRAINT fk_ehu_user FOREIGN KEY (requested_by_user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE escape_room_completions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    escape_session_id BIGINT UNSIGNED NOT NULL,
    escape_room_id BIGINT UNSIGNED NOT NULL,
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_erc_sess FOREIGN KEY (escape_session_id) REFERENCES escape_sessions(escape_session_id) ON DELETE CASCADE,
    CONSTRAINT fk_erc_room FOREIGN KEY (escape_room_id) REFERENCES escape_rooms(escape_room_id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE escape_results (
    result_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    escape_session_id BIGINT UNSIGNED NOT NULL UNIQUE,
    is_escaped BOOLEAN NOT NULL DEFAULT FALSE,
    time_taken_seconds INT UNSIGNED NOT NULL,
    hints_used INT UNSIGNED NOT NULL DEFAULT 0,
    final_team_score INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_er_sess FOREIGN KEY (escape_session_id) REFERENCES escape_sessions(escape_session_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 6. DRAWICE SYSTEM (CORRECTION 8)
DROP TABLE IF EXISTS drawice_guesses;
DROP TABLE IF EXISTS drawice_rounds;
DROP TABLE IF EXISTS drawice_words;

CREATE TABLE drawice_words (
    word_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    word VARCHAR(100) NOT NULL UNIQUE,
    category VARCHAR(100) NOT NULL DEFAULT 'General',
    difficulty ENUM('EASY', 'MEDIUM', 'HARD') NOT NULL DEFAULT 'MEDIUM',
    is_active BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE=InnoDB;

CREATE TABLE drawice_rounds (
    round_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    session_id BIGINT UNSIGNED NOT NULL,
    round_number INT UNSIGNED NOT NULL,
    artist_user_id BIGINT UNSIGNED NOT NULL,
    word_options_json JSON NOT NULL,
    chosen_word_id BIGINT UNSIGNED NULL,
    time_limit_seconds INT UNSIGNED NOT NULL DEFAULT 60,
    status ENUM('CHOOSING', 'DRAWING', 'ROUND_REVEAL', 'FINISHED') NOT NULL DEFAULT 'CHOOSING',
    artist_score INT NOT NULL DEFAULT 0,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP NULL DEFAULT NULL,
    UNIQUE KEY uq_drawice_session_round (session_id, round_number),
    CONSTRAINT fk_dr_sess FOREIGN KEY (session_id) REFERENCES game_sessions(session_id) ON DELETE CASCADE,
    CONSTRAINT fk_dr_artist FOREIGN KEY (artist_user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_dr_word FOREIGN KEY (chosen_word_id) REFERENCES drawice_words(word_id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE drawice_guesses (
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
) ENGINE=InnoDB;

-- 7. LEADERBOARD VIEWS
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
GROUP BY u.user_id, p.display_name, p.avatar_url;

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
WHERE u.account_status = 'ACTIVE' AND g.is_active = TRUE;

-- 8. INITIAL SEED DATA
INSERT INTO roles (role_name, description) VALUES
('PLAYER', 'Standard player account with lobby, matchmaking, and leaderboard access'),
('ADMIN', 'Platform administrator with content, game, and user management authority')
ON DUPLICATE KEY UPDATE description = VALUES(description);

INSERT INTO games (game_code, game_name, description, min_players, max_players, is_active) VALUES
('PREDICTION_ARENA', 'Prediction Arena', 'Mathematical multiplayer strategy. Predict the hidden target value (average x 0.8) while navigating duplicate penalties and shifting rule unlocks.', 2, 10, TRUE),
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
(1, 'Cyber Vault Protocol 9', 'You and your specialist infiltration squad are trapped inside an automated sub-level security bunker. The atmospheric purge activates in 10 minutes. Solve the sequential locks and override the central blast door to escape.', 600, 'MEDIUM')
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
