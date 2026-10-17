const fs = require('fs');
const path = require('path');

// 1. Prediction Session API
const predSessionDir = path.join(__dirname, 'app', 'api', 'games', 'prediction', '[sessionId]');
if (!fs.existsSync(predSessionDir)) fs.mkdirSync(predSessionDir, { recursive: true });

const predSessionRoute = `import { NextRequest, NextResponse } from 'next/server';
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
    const sessions = await query<any[]>(
      'SELECT * FROM game_sessions WHERE session_id = ?',
      [sessionId]
    );
    if (!sessions || sessions.length === 0) return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    const session = sessions[0];

    const currentRound = await query<any[]>(
      'SELECT * FROM prediction_rounds WHERE session_id = ? ORDER BY round_number DESC LIMIT 1',
      [sessionId]
    );

    let mySubmission = null;
    let roundSubmissions: any[] = [];
    if (currentRound && currentRound.length > 0) {
      const cr = currentRound[0];
      const subs = await query<any[]>(
        \`SELECT ps.*, p.display_name, p.avatar_url
         FROM prediction_submissions ps
         JOIN users u ON ps.user_id = u.user_id
         JOIN user_profiles p ON u.user_id = p.user_id
         WHERE ps.round_id = ?\`,
        [cr.round_id]
      );

      mySubmission = subs.find(s => s.user_id === authUser.userId) || null;

      // Only reveal other submissions if status is REVEALED or COMPLETED
      if (cr.status === 'REVEALED' || cr.status === 'COMPLETED') {
        roundSubmissions = subs;
      } else {
        // Obfuscate others
        roundSubmissions = subs.map(s => ({
          submission_id: s.submission_id,
          user_id: s.user_id,
          display_name: s.display_name,
          avatar_url: s.avatar_url,
          hasSubmitted: true
        }));
      }
    }

    const players = await query<any[]>(
      \`SELECT sp.*, p.display_name, p.avatar_url
       FROM session_players sp
       JOIN users u ON sp.user_id = u.user_id
       JOIN user_profiles p ON u.user_id = p.user_id
       WHERE sp.session_id = ?
       ORDER BY sp.final_score DESC\`,
      [sessionId]
    );

    return NextResponse.json({
      session,
      currentRound: currentRound[0] || null,
      mySubmission,
      roundSubmissions,
      players
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed: ' + err.message }, { status: 500 });
  }
}
`;
fs.writeFileSync(path.join(predSessionDir, 'route.ts'), predSessionRoute);

// Prediction Submit API
const predSubmitRoute = `import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/serverAuth';
import { query, withTransaction } from '@/lib/mysql/db';
import { PredictionEngine } from '@/server/games/prediction/PredictionEngine';

export async function POST(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  const authUser = await verifyAuth(req);
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sessionId = parseInt(params.sessionId, 10);
  const body = await req.json().catch(() => ({}));
  const chosenNumber = parseInt(body.chosenNumber, 10);

  if (isNaN(chosenNumber) || chosenNumber < 0 || chosenNumber > 100) {
    return NextResponse.json({ error: 'Must choose an integer between 0 and 100' }, { status: 400 });
  }

  try {
    const outcome = await withTransaction(async (conn) => {
      const [rounds]: any = await conn.execute(
        'SELECT * FROM prediction_rounds WHERE session_id = ? AND status = "SUBMITTING" ORDER BY round_number DESC LIMIT 1 FOR UPDATE',
        [sessionId]
      );
      if (!rounds || rounds.length === 0) throw new Error('NO_ACTIVE_SUBMISSION_PHASE');
      const round = rounds[0];

      // Insert or update submission
      await conn.execute(
        \`INSERT INTO prediction_submissions (round_id, user_id, chosen_number)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE chosen_number = VALUES(chosen_number), submitted_at = CURRENT_TIMESTAMP\`,
        [round.round_id, authUser.userId, chosenNumber]
      );

      // Check if all players in session have submitted
      const [totalPlayers]: any = await conn.execute(
        'SELECT COUNT(*) as cnt FROM session_players WHERE session_id = ?',
        [sessionId]
      );
      const [subsCount]: any = await conn.execute(
        'SELECT COUNT(*) as cnt FROM prediction_submissions WHERE round_id = ?',
        [round.round_id]
      );

      let isAllSubmitted = subsCount[0].cnt >= totalPlayers[0].cnt;
      return { roundNumber: round.round_number, isAllSubmitted };
    });

    if (outcome.isAllSubmitted) {
      await PredictionEngine.resolveRound(sessionId, outcome.roundNumber);
    }

    return NextResponse.json({ success: true, message: 'Prediction recorded.' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
`;
fs.writeFileSync(path.join(__dirname, 'app', 'api', 'games', 'prediction', '[sessionId]', 'submit', 'route.ts'), predSubmitRoute);

// 2. Detective API
const detSessionDir = path.join(__dirname, 'app', 'api', 'games', 'detective', '[sessionId]');
if (!fs.existsSync(detSessionDir)) fs.mkdirSync(detSessionDir, { recursive: true });

const detSessionRoute = `import { NextRequest, NextResponse } from 'next/server';
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
    const detSessions = await query<any[]>(
      \`SELECT ds.*, c.title, c.synopsis, c.difficulty
       FROM detective_sessions ds
       JOIN detective_cases c ON ds.case_id = c.case_id
       WHERE ds.session_id = ?\`,
      [sessionId]
    );

    if (!detSessions || detSessions.length === 0) {
      return NextResponse.json({ error: 'Detective session not found' }, { status: 404 });
    }
    const detSession = detSessions[0];

    // Suspects without is_culprit flag (never sent to client)
    const suspects = await query<any[]>(
      'SELECT suspect_id, name, occupation, background, alibi, avatar_url, interrogation_cost FROM detective_suspects WHERE case_id = ?',
      [detSession.case_id]
    );

    const locations = await query<any[]>(
      'SELECT location_id, name, description, action_cost, image_url FROM detective_locations WHERE case_id = ?',
      [detSession.case_id]
    );

    const evidence = await query<any[]>(
      'SELECT evidence_id, location_id, suspect_id, title, description, analysis_cost FROM detective_evidence WHERE case_id = ?',
      [detSession.case_id]
    );

    const timeline = await query<any[]>(
      'SELECT event_id, timestamp_label, event_description FROM detective_timeline_events WHERE case_id = ? ORDER BY event_id ASC',
      [detSession.case_id]
    );

    const puzzles = await query<any[]>(
      'SELECT puzzle_id, prompt, puzzle_type, hint, action_cost FROM detective_puzzles WHERE case_id = ?',
      [detSession.case_id]
    );

    const myDiscoveries = await query<any[]>(
      'SELECT discovery_type, target_id, discovered_at FROM detective_discoveries WHERE detective_session_id = ? AND user_id = ?',
      [detSession.detective_session_id, authUser.userId]
    );

    const myAccusation = await query<any[]>(
      'SELECT * FROM detective_accusations WHERE detective_session_id = ? AND user_id = ?',
      [detSession.detective_session_id, authUser.userId]
    );

    return NextResponse.json({
      detectiveSession: detSession,
      suspects,
      locations,
      evidence,
      timeline,
      puzzles,
      myDiscoveries,
      myAccusation: myAccusation[0] || null
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
`;
fs.writeFileSync(path.join(detSessionDir, 'route.ts'), detSessionRoute);

// Detective Action Route
const detActionRoute = `import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/serverAuth';
import { query } from '@/lib/mysql/db';
import { DetectiveEngine } from '@/server/games/detective/DetectiveEngine';

export async function POST(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  const authUser = await verifyAuth(req);
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sessionId = parseInt(params.sessionId, 10);
  const body = await req.json().catch(() => ({}));
  const { actionType, targetId, answer } = body;

  try {
    const detSess = await query<any[]>(
      'SELECT detective_session_id FROM detective_sessions WHERE session_id = ?',
      [sessionId]
    );
    if (!detSess || detSess.length === 0) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

    const result = await DetectiveEngine.executeAction(
      detSess[0].detective_session_id,
      authUser.userId,
      actionType,
      targetId,
      answer
    );

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
`;
fs.writeFileSync(path.join(__dirname, 'app', 'api', 'games', 'detective', '[sessionId]', 'action', 'route.ts'), detActionRoute);

// Detective Accuse Route
const detAccuseRoute = `import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/serverAuth';
import { query } from '@/lib/mysql/db';
import { DetectiveEngine } from '@/server/games/detective/DetectiveEngine';

export async function POST(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  const authUser = await verifyAuth(req);
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sessionId = parseInt(params.sessionId, 10);
  const body = await req.json().catch(() => ({}));
  const { suspectId, motive, evidenceId, reasoning } = body;

  try {
    const detSess = await query<any[]>(
      'SELECT detective_session_id FROM detective_sessions WHERE session_id = ?',
      [sessionId]
    );
    if (!detSess || detSess.length === 0) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

    const result = await DetectiveEngine.submitAccusation(
      detSess[0].detective_session_id,
      authUser.userId,
      suspectId,
      motive,
      evidenceId,
      reasoning
    );

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
`;
fs.writeFileSync(path.join(__dirname, 'app', 'api', 'games', 'detective', '[sessionId]', 'accuse', 'route.ts'), detAccuseRoute);

// 3. Escape Room API
const escSessionDir = path.join(__dirname, 'app', 'api', 'games', 'escape', '[sessionId]');
if (!fs.existsSync(escSessionDir)) fs.mkdirSync(escSessionDir, { recursive: true });

const escSessionRoute = `import { NextRequest, NextResponse } from 'next/server';
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
      \`SELECT es.*, sc.title, sc.theme_description, sc.time_limit_seconds, sc.difficulty,
              er.room_name, er.description as room_description, er.ambient_theme
       FROM escape_sessions es
       JOIN escape_scenarios sc ON es.scenario_id = sc.scenario_id
       JOIN escape_rooms er ON es.current_room_id = er.escape_room_id
       WHERE es.session_id = ?\`,
      [sessionId]
    );

    if (!escSessions || escSessions.length === 0) {
      return NextResponse.json({ error: 'Escape room session not found' }, { status: 404 });
    }
    const sess = escSessions[0];

    // Objects in current room
    const objects = await query<any[]>(
      'SELECT object_id, name, description, is_inspectable, is_locked, icon_name FROM escape_objects WHERE escape_room_id = ?',
      [sess.current_room_id]
    );

    // Puzzles for objects in current room (WITHOUT answers)
    const puzzles = await query<any[]>(
      \`SELECT ep.puzzle_id, ep.object_id, ep.puzzle_prompt, ep.puzzle_type, ep.hint_text, ep.difficulty_points
       FROM escape_puzzles ep
       JOIN escape_objects eo ON ep.object_id = eo.object_id
       WHERE eo.escape_room_id = ?\`,
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

    return NextResponse.json({
      escapeSession: sess,
      objects,
      puzzles,
      completedPuzzles,
      locks
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
`;
fs.writeFileSync(path.join(escSessionDir, 'route.ts'), escSessionRoute);

// Escape Puzzle Attempt Route
const escPuzzleRoute = `import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/serverAuth';
import { query } from '@/lib/mysql/db';
import { EscapeRoomEngine } from '@/server/games/escape-room/EscapeRoomEngine';

export async function POST(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  const authUser = await verifyAuth(req);
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sessionId = parseInt(params.sessionId, 10);
  const body = await req.json().catch(() => ({}));
  const { puzzleId, answer } = body;

  try {
    const escSess = await query<any[]>(
      'SELECT escape_session_id FROM escape_sessions WHERE session_id = ?',
      [sessionId]
    );
    if (!escSess || escSess.length === 0) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

    const result = await EscapeRoomEngine.submitPuzzleAttempt(
      escSess[0].escape_session_id,
      authUser.userId,
      puzzleId,
      answer
    );

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
`;
fs.writeFileSync(path.join(__dirname, 'app', 'api', 'games', 'escape', '[sessionId]', 'puzzle', 'route.ts'), escPuzzleRoute);

// Escape Hint Route
const escHintRoute = `import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/serverAuth';
import { query } from '@/lib/mysql/db';
import { EscapeRoomEngine } from '@/server/games/escape-room/EscapeRoomEngine';

export async function POST(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  const authUser = await verifyAuth(req);
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sessionId = parseInt(params.sessionId, 10);

  try {
    const escSess = await query<any[]>(
      'SELECT escape_session_id, current_room_id FROM escape_sessions WHERE session_id = ?',
      [sessionId]
    );
    if (!escSess || escSess.length === 0) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

    const result = await EscapeRoomEngine.requestHint(
      escSess[0].escape_session_id,
      authUser.userId,
      escSess[0].current_room_id
    );

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
`;
fs.writeFileSync(path.join(__dirname, 'app', 'api', 'games', 'escape', '[sessionId]', 'hint', 'route.ts'), escHintRoute);

// 4. Drawice API
const drawiceSessionDir = path.join(__dirname, 'app', 'api', 'games', 'drawice', '[sessionId]');
if (!fs.existsSync(drawiceSessionDir)) fs.mkdirSync(drawiceSessionDir, { recursive: true });

const drawiceSessionRoute = `import { NextRequest, NextResponse } from 'next/server';
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
    const rounds = await query<any[]>(
      \`SELECT dr.*, p.display_name AS artist_name, p.avatar_url AS artist_avatar
       FROM drawice_rounds dr
       JOIN users u ON dr.artist_user_id = u.user_id
       JOIN user_profiles p ON u.user_id = p.user_id
       WHERE dr.session_id = ?
       ORDER BY dr.round_number DESC LIMIT 1\`,
      [sessionId]
    );

    if (!rounds || rounds.length === 0) return NextResponse.json({ error: 'No rounds found' }, { status: 404 });
    const round = rounds[0];

    const isArtist = round.artist_user_id === authUser.userId;

    let secretWord = null;
    let wordChoices = null;

    if (isArtist) {
      if (round.chosen_word_id) {
        const [w]: any = await query('SELECT word FROM drawice_words WHERE word_id = ?', [round.chosen_word_id]);
        secretWord = w?.word;
      }
      wordChoices = round.word_options_json ? JSON.parse(round.word_options_json) : [];
    } else if (round.status === 'ROUND_REVEAL' || round.status === 'FINISHED') {
      if (round.chosen_word_id) {
        const [w]: any = await query('SELECT word FROM drawice_words WHERE word_id = ?', [round.chosen_word_id]);
        secretWord = w?.word;
      }
    }

    // Guesses: reveal only if round ended OR only show user's own guesses during drawing
    let guesses: any[] = [];
    if (round.status === 'ROUND_REVEAL' || round.status === 'FINISHED') {
      guesses = await query<any[]>(
        \`SELECT dg.*, p.display_name, p.avatar_url
         FROM drawice_guesses dg
         JOIN users u ON dg.user_id = u.user_id
         JOIN user_profiles p ON u.user_id = p.user_id
         WHERE dg.round_id = ?
         ORDER BY dg.submission_sequence ASC\`,
        [round.round_id]
      );
    } else {
      guesses = await query<any[]>(
        \`SELECT dg.guess_id, dg.user_id, dg.guess_text, dg.is_correct, dg.submission_sequence,
                p.display_name, p.avatar_url
         FROM drawice_guesses dg
         JOIN users u ON dg.user_id = u.user_id
         JOIN user_profiles p ON u.user_id = p.user_id
         WHERE dg.round_id = ? AND dg.user_id = ?\`,
        [round.round_id, authUser.userId]
      );
    }

    const players = await query<any[]>(
      \`SELECT sp.*, p.display_name, p.avatar_url
       FROM session_players sp
       JOIN users u ON sp.user_id = u.user_id
       JOIN user_profiles p ON u.user_id = p.user_id
       WHERE sp.session_id = ?
       ORDER BY sp.final_score DESC\`,
      [sessionId]
    );

    return NextResponse.json({
      round: {
        ...round,
        isArtist,
        secretWord,
        wordChoices
      },
      guesses,
      players
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
`;
fs.writeFileSync(path.join(drawiceSessionDir, 'route.ts'), drawiceSessionRoute);

// Drawice Word Choices API (Artist Only)
const drawiceChoicesRoute = `import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/serverAuth';
import { query } from '@/lib/mysql/db';

export async function GET(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  const authUser = await verifyAuth(req);
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sessionId = parseInt(params.sessionId, 10);

  const rounds = await query<any[]>(
    'SELECT * FROM drawice_rounds WHERE session_id = ? ORDER BY round_number DESC LIMIT 1',
    [sessionId]
  );
  if (!rounds || rounds.length === 0) return NextResponse.json({ error: 'Round not found' }, { status: 404 });
  const round = rounds[0];

  if (round.artist_user_id !== authUser.userId) {
    return NextResponse.json({ error: 'Only the artist can request word choices' }, { status: 403 });
  }

  const choices = round.word_options_json ? (typeof round.word_options_json === 'string' ? JSON.parse(round.word_options_json) : round.word_options_json) : [];
  return NextResponse.json({ choices });
}
`;
fs.writeFileSync(path.join(__dirname, 'app', 'api', 'games', 'drawice', '[sessionId]', 'word-choices', 'route.ts'), drawiceChoicesRoute);

// Drawice Select Word API
const drawiceSelectWordRoute = `import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/serverAuth';
import { query } from '@/lib/mysql/db';
import { DrawiceEngine } from '@/server/games/drawice/DrawiceEngine';

export async function POST(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  const authUser = await verifyAuth(req);
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sessionId = parseInt(params.sessionId, 10);
  const body = await req.json().catch(() => ({}));
  const { wordId } = body;

  try {
    const rounds = await query<any[]>(
      'SELECT round_number FROM drawice_rounds WHERE session_id = ? ORDER BY round_number DESC LIMIT 1',
      [sessionId]
    );
    if (!rounds || rounds.length === 0) return NextResponse.json({ error: 'Round not found' }, { status: 404 });

    const result = await DrawiceEngine.selectWord(
      sessionId,
      rounds[0].round_number,
      authUser.userId,
      wordId
    );

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
`;
fs.writeFileSync(path.join(__dirname, 'app', 'api', 'games', 'drawice', '[sessionId]', 'select-word', 'route.ts'), drawiceSelectWordRoute);

// Drawice Guess API
const drawiceGuessRoute = `import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/serverAuth';
import { query } from '@/lib/mysql/db';
import { DrawiceEngine } from '@/server/games/drawice/DrawiceEngine';

export async function POST(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  const authUser = await verifyAuth(req);
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sessionId = parseInt(params.sessionId, 10);
  const body = await req.json().catch(() => ({}));
  const { guessText } = body;

  try {
    const rounds = await query<any[]>(
      'SELECT round_number FROM drawice_rounds WHERE session_id = ? ORDER BY round_number DESC LIMIT 1',
      [sessionId]
    );
    if (!rounds || rounds.length === 0) return NextResponse.json({ error: 'Round not found' }, { status: 404 });

    const result = await DrawiceEngine.submitGuess(
      sessionId,
      rounds[0].round_number,
      authUser.userId,
      guessText
    );

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
`;
fs.writeFileSync(path.join(__dirname, 'app', 'api', 'games', 'drawice', '[sessionId]', 'guess', 'route.ts'), drawiceGuessRoute);

console.log('Game REST APIs generated successfully.');
