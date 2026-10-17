const fs = require('fs');
const path = require('path');
const p = path.join(__dirname, 'database', 'mindvault.sql');

const ddl = `
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
`;

fs.appendFileSync(p, ddl);
console.log('Core tables appended.');
