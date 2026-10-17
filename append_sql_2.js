const fs = require('fs');
const path = require('path');
const p = path.join(__dirname, 'database', 'mindvault.sql');

const ddl = `
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
`;

fs.appendFileSync(p, ddl);
console.log('Prediction & Detective tables appended.');
