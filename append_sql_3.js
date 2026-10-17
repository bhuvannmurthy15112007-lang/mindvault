const fs = require('fs');
const path = require('path');
const p = path.join(__dirname, 'database', 'mindvault.sql');

const ddl = `
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
    time_limit_seconds INT UNSIGNED NOT NULL DEFAULT 1800,
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
    time_remaining_seconds INT NOT NULL DEFAULT 1800,
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
`;

fs.appendFileSync(p, ddl);
console.log('Escape, Drawice & Views appended.');
