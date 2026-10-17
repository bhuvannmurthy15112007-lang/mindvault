export type GameCode = 'PREDICTION_ARENA' | 'DETECTIVE' | 'ESCAPE_ROOM' | 'DRAWICE';
export type RoomStatus = 'WAITING' | 'STARTED' | 'COMPLETED' | 'CANCELLED';
export type PlayerStatus = 'JOINED' | 'LEFT' | 'KICKED';
export type SessionStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED';
export type AccountStatus = 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED';
export type RoleName = 'PLAYER' | 'ADMIN';

export interface User {
  user_id: number;
  firebase_uid: string;
  email: string;
  account_status: AccountStatus;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  profile_id: number;
  user_id: number;
  display_name: string;
  phone_number?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuthenticatedUser {
  userId: number;
  firebaseUid: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  roles: RoleName[];
  isAdmin: boolean;
}

export interface Game {
  game_id: number;
  game_code: GameCode;
  game_name: string;
  description: string;
  min_players: number;
  max_players: number;
  is_active: boolean;
}

export interface GameRoom {
  room_id: number;
  room_code: string;
  game_id: number;
  game_code: GameCode;
  game_name: string;
  host_user_id: number;
  host_name?: string;
  status: RoomStatus;
  max_players: number;
  min_players: number;
  created_at: string;
  players?: RoomPlayer[];
}

export interface RoomPlayer {
  room_player_id: number;
  room_id: number;
  user_id: number;
  display_name: string;
  avatar_url: string | null;
  status: PlayerStatus;
  is_ready: boolean;
  is_host: boolean;
  joined_at: string;
}

export interface GameSession {
  session_id: number;
  room_id: number;
  game_id: number;
  game_code: GameCode;
  total_rounds: number;
  current_round: number;
  status: SessionStatus;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

export interface SessionPlayer {
  session_player_id: number;
  session_id: number;
  user_id: number;
  display_name: string;
  avatar_url: string | null;
  final_score: number;
  final_rank: number | null;
  is_winner: boolean;
}

// Prediction Arena Types
export interface PredictionRound {
  round_id: number;
  session_id: number;
  round_number: number;
  total_sum: number;
  player_count: number;
  average_value: number;
  target_value: number;
  status: 'SUBMITTING' | 'REVEALED' | 'COMPLETED';
  unlocked_rule?: {
    rule_number: number;
    rule_name: string;
    explanation: string;
    example: string;
  } | null;
}

export interface PredictionSubmission {
  submission_id: number;
  round_id: number;
  user_id: number;
  display_name: string;
  avatar_url: string | null;
  chosen_number: number;
  is_duplicate: boolean;
  is_exact_target: boolean;
  is_zero_one_hundred_win: boolean;
  round_rank: number | null;
  points_awarded: number;
  penalty_points: number;
}

// Detective Types
export interface DetectiveCase {
  case_id: number;
  title: string;
  synopsis: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  investigation_budget: number;
}

export interface DetectiveSuspect {
  suspect_id: number;
  case_id: number;
  name: string;
  occupation: string;
  background: string;
  alibi: string;
  avatar_url: string | null;
  interrogation_cost: number;
}

export interface DetectiveLocation {
  location_id: number;
  case_id: number;
  name: string;
  description: string;
  action_cost: number;
}

export interface DetectiveEvidence {
  evidence_id: number;
  case_id: number;
  title: string;
  description: string;
  analysis_cost: number;
}

export interface DetectiveClue {
  clue_id: number;
  case_id: number;
  clue_text: string;
  action_cost: number;
}

export interface DetectiveTimelineEvent {
  event_id: number;
  case_id: number;
  timestamp_label: string;
  event_description: string;
}

// Escape Room Types
export interface EscapeScenario {
  scenario_id: number;
  title: string;
  theme_description: string;
  time_limit_seconds: number;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
}

export interface EscapeRoomData {
  escape_room_id: number;
  scenario_id: number;
  room_name: string;
  description: string;
  sequence_order: number;
  ambient_theme: string;
}

export interface EscapeObjectData {
  object_id: number;
  escape_room_id: number;
  name: string;
  description: string;
  is_inspectable: boolean;
  is_locked: boolean;
  icon_name: string;
}

export interface EscapePuzzleData {
  puzzle_id: number;
  object_id: number;
  puzzle_prompt: string;
  puzzle_type: 'CIPHER' | 'DIAL' | 'RIDDLE' | 'SEQUENCE' | 'KEYPAD';
  hint_text: string;
}

// Drawice Types
export interface DrawiceWord {
  word_id: number;
  word: string;
  category: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
}

export interface DrawiceRoundData {
  round_id: number;
  session_id: number;
  round_number: number;
  artist_user_id: number;
  artist_name: string;
  word_choices?: string[];
  chosen_word?: string | null;
  time_limit_seconds: number;
  status: 'CHOOSING' | 'DRAWING' | 'ROUND_REVEAL' | 'FINISHED';
  artist_score: number;
}

export interface DrawiceGuess {
  guess_id: number;
  user_id: number;
  display_name: string;
  guess_text: string;
  is_correct: boolean;
  submission_sequence: number;
  points_awarded: number;
  submitted_at: string;
}

// Stats & Leaderboard
export interface OverallLeaderboardEntry {
  user_id: number;
  display_name: string;
  avatar_url: string | null;
  total_games_played: number;
  total_games_won: number;
  aggregate_score: number;
  peak_score: number;
  win_rate_percentage: number;
  global_rank: number;
}

export interface GameLeaderboardEntry {
  game_code: GameCode;
  game_name: string;
  user_id: number;
  display_name: string;
  avatar_url: string | null;
  games_played: number;
  games_won: number;
  total_score: number;
  highest_score: number;
  win_rate_percentage: number;
  game_rank: number;
}
