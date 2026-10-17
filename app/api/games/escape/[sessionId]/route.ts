import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/serverAuth';
import { query } from '@/lib/mysql/db';

export async function GET(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  const authUser = await verifyAuth(req);
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sessionId = parseInt(params.sessionId, 10);

  try {
    const escSessions = await query<any[]>(
      `SELECT es.*, sc.title, sc.theme_description, sc.time_limit_seconds, sc.difficulty,
              er.room_name, er.description as room_description, er.ambient_theme
       FROM escape_sessions es
       JOIN escape_scenarios sc ON es.scenario_id = sc.scenario_id
       JOIN escape_rooms er ON es.current_room_id = er.escape_room_id
       WHERE es.session_id = ?`,
      [sessionId]
    );

    if (!escSessions || escSessions.length === 0) {
      return NextResponse.json({ error: 'Escape room session not found' }, { status: 404 });
    }
    const sess = escSessions[0];

    // Authoritative Server-side Time Calculation
    const timeLimit = sess.time_limit_seconds || 600;
    const startTime = new Date(sess.started_at).getTime();
    const now = Date.now();
    const elapsedSeconds = Math.max(0, Math.floor((now - startTime) / 1000));
    let remainingSeconds = Math.max(0, timeLimit - elapsedSeconds);

    if (sess.status === 'ACTIVE') {
      if (remainingSeconds <= 0) {
        const compRows = await query<any[]>(
          'SELECT COUNT(DISTINCT escape_room_id) as cnt FROM escape_room_completions WHERE escape_session_id = ?',
          [sess.escape_session_id]
        );
        const roomsCompleted = compRows[0]?.cnt || 0;
        const timeoutScore = Math.min(30, roomsCompleted * 10);

        // Authoritatively expire the session
        await query(
          'UPDATE escape_sessions SET status = "TIMEOUT", completed_at = CURRENT_TIMESTAMP, time_remaining_seconds = 0 WHERE escape_session_id = ?',
          [sess.escape_session_id]
        );
        await query(
          'UPDATE game_sessions SET status = "COMPLETED", completed_at = CURRENT_TIMESTAMP WHERE session_id = ?',
          [sess.session_id]
        );
        await query(
          `INSERT INTO escape_results (escape_session_id, is_escaped, time_taken_seconds, hints_used, final_team_score)
           VALUES (?, FALSE, ?, ?, ?)
           ON DUPLICATE KEY UPDATE is_escaped = VALUES(is_escaped), time_taken_seconds = VALUES(time_taken_seconds), final_team_score = VALUES(final_team_score)`,
          [sess.escape_session_id, timeLimit, 2 - sess.hints_remaining, timeoutScore]
        );
        sess.status = 'TIMEOUT';
        sess.time_remaining_seconds = 0;
      } else {
        // Keep DB remaining seconds fresh
        await query(
          'UPDATE escape_sessions SET time_remaining_seconds = ? WHERE escape_session_id = ?',
          [remainingSeconds, sess.escape_session_id]
        );
        sess.time_remaining_seconds = remainingSeconds;
      }
    }

    // Objects in current room
    const objects = await query<any[]>(
      'SELECT object_id, name, description, is_inspectable, is_locked, icon_name FROM escape_objects WHERE escape_room_id = ?',
      [sess.current_room_id]
    );

    // Puzzles for objects in current room (WITHOUT answers)
    const puzzles = await query<any[]>(
      `SELECT ep.puzzle_id, ep.object_id, ep.puzzle_prompt, ep.puzzle_type, ep.hint_text, ep.difficulty_points
       FROM escape_puzzles ep
       JOIN escape_objects eo ON ep.object_id = eo.object_id
       WHERE eo.escape_room_id = ?`,
      [sess.current_room_id]
    );

    // Completed puzzles in session
    const completedPuzzles = await query<any[]>(
      'SELECT puzzle_id, solved_by_user_id, solved_at FROM escape_completed_puzzles WHERE escape_session_id = ?',
      [sess.escape_session_id]
    );

    // Locks in current room
    const locks = await query<any[]>(
      'SELECT lock_id, lock_name, lock_type, is_exit_door FROM escape_locks WHERE escape_room_id = ?',
      [sess.current_room_id]
    );

    // Clues discovered from objects in current room
    const clues = await query<any[]>(
      `SELECT ec.clue_id, ec.object_id, ec.clue_text, ec.image_url
       FROM escape_clues ec
       JOIN escape_objects eo ON ec.object_id = eo.object_id
       WHERE eo.escape_room_id = ?`,
      [sess.current_room_id]
    );

    // Recent attempts in this session
    const attempts = await query<any[]>(
      `SELECT attempt_id, puzzle_id, submitted_answer_preview, is_successful, attempt_time
       FROM escape_puzzle_attempts
       WHERE escape_session_id = ?
       ORDER BY attempt_time DESC LIMIT 10`,
      [sess.escape_session_id]
    );

    // Result summary if game finished
    let result = null;
    if (sess.status === 'ESCAPED' || sess.status === 'TIMEOUT') {
      const results = await query<any[]>(
        'SELECT * FROM escape_results WHERE escape_session_id = ?',
        [sess.escape_session_id]
      );
      if (results && results.length > 0) {
        result = results[0];
      }
    }

    // Query completed rooms for this escape session
    const completedRooms = await query<any[]>(
      'SELECT escape_room_id, completed_at FROM escape_room_completions WHERE escape_session_id = ?',
      [sess.escape_session_id]
    );
    const currentScore = Math.min(30, (completedRooms?.length || 0) * 10);

    const sessionPlayers = await query<any[]>(
      `SELECT sp.*, p.display_name, p.avatar_url
       FROM session_players sp
       JOIN users u ON sp.user_id = u.user_id
       JOIN user_profiles p ON u.user_id = p.user_id
       WHERE sp.session_id = ?
       ORDER BY sp.session_player_id ASC`,
      [sess.session_id]
    );

    return NextResponse.json({
      escapeSession: sess,
      objects,
      puzzles,
      clues,
      attempts,
      completedPuzzles,
      completedRooms: completedRooms || [],
      currentScore,
      locks,
      sessionPlayers: sessionPlayers || [],
      result
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
