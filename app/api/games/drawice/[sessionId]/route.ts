import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/serverAuth';
import { query } from '@/lib/mysql/db';
import { DrawiceEngine } from '@/server/games/drawice/DrawiceEngine';

export async function GET(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  const authUser = await verifyAuth(req);
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sessionId = parseInt(params.sessionId, 10);

  try {
    const sessions = await query<any[]>(
      'SELECT session_id, room_id, game_id, total_rounds, current_round, status FROM game_sessions WHERE session_id = ?',
      [sessionId]
    );
    if (!sessions || sessions.length === 0) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
    const session = sessions[0];

    const rounds = await query<any[]>(
      `SELECT dr.*, p.display_name AS artist_name, p.avatar_url AS artist_avatar
       FROM drawice_rounds dr
       JOIN users u ON dr.artist_user_id = u.user_id
       JOIN user_profiles p ON u.user_id = p.user_id
       WHERE dr.session_id = ?
       ORDER BY dr.round_number DESC LIMIT 1`,
      [sessionId]
    );

    if (!rounds || rounds.length === 0) {
      return NextResponse.json({ error: 'No rounds found for this session' }, { status: 404 });
    }

    let round = rounds[0];
    let secondsRemaining = 0;

    // 60-second Authoritative Server Timer
    if (round.status === 'DRAWING') {
      const startTime = new Date(round.started_at).getTime();
      const now = Date.now();
      const elapsedSeconds = Math.max(0, Math.floor((now - startTime) / 1000));
      secondsRemaining = Math.max(0, 60 - elapsedSeconds);

      // Auto-resolve round if 60 seconds elapsed
      if (secondsRemaining <= 0) {
        await DrawiceEngine.endRoundAndScoreArtist(sessionId, round.round_number);
        (global as any).io?.to('session:' + sessionId).emit('drawice:round_reveal');

        const updatedRounds = await query<any[]>(
          `SELECT dr.*, p.display_name AS artist_name, p.avatar_url AS artist_avatar
           FROM drawice_rounds dr
           JOIN users u ON dr.artist_user_id = u.user_id
           JOIN user_profiles p ON u.user_id = p.user_id
           WHERE dr.round_id = ?`,
          [round.round_id]
        );
        if (updatedRounds && updatedRounds.length > 0) {
          round = updatedRounds[0];
        }
        secondsRemaining = 0;
      }
    }

    const isArtist = round.artist_user_id === authUser.userId;
    let actualWord = round.chosen_word;
    if (!actualWord && round.chosen_word_id) {
      const [w]: any = await query('SELECT word FROM drawice_words WHERE word_id = ?', [round.chosen_word_id]);
      actualWord = w?.word || null;
    }

    let secretWord: string | null = null;
    let wordChoices: any[] | null = null;
    let maskedWord: string | null = null;
    let wordLength = actualWord ? actualWord.length : 0;

    if (isArtist) {
      secretWord = actualWord;
      maskedWord = actualWord;
      if (round.status === 'CHOOSING' && round.word_options_json) {
        try {
          wordChoices = typeof round.word_options_json === 'string'
            ? JSON.parse(round.word_options_json)
            : round.word_options_json;
        } catch (e) {
          wordChoices = [];
        }
      }
    } else if (round.status === 'ROUND_REVEAL' || round.status === 'FINISHED') {
      secretWord = actualWord;
      maskedWord = actualWord;
    } else if (round.status === 'DRAWING') {
      // Mask word for guessers: e.g. "Telescope" -> "_ _ _ _ _ _ _ _ _"
      secretWord = null;
      wordChoices = null;
      if (actualWord) {
        maskedWord = actualWord
          .split('')
          .map((c: string) => (/[a-zA-Z0-9]/.test(c) ? '_' : c))
          .join(' ');
      }
    } else {
      // CHOOSING
      secretWord = null;
      wordChoices = null;
      maskedWord = null;
    }

    // Guesses sanitization
    let guesses: any[] = [];
    if (round.status === 'ROUND_REVEAL' || round.status === 'FINISHED') {
      guesses = await query<any[]>(
        `SELECT dg.*, p.display_name, p.avatar_url
         FROM drawice_guesses dg
         JOIN users u ON dg.user_id = u.user_id
         JOIN user_profiles p ON u.user_id = p.user_id
         WHERE dg.round_id = ?
         ORDER BY dg.is_correct DESC, dg.submission_sequence ASC, dg.submitted_at ASC`,
        [round.round_id]
      );
    } else {
      // User's own guesses
      const myGuesses = await query<any[]>(
        `SELECT dg.guess_id, dg.user_id, dg.guess_text, dg.is_correct, dg.submission_sequence, dg.points_awarded, dg.submitted_at,
                p.display_name, p.avatar_url
         FROM drawice_guesses dg
         JOIN users u ON dg.user_id = u.user_id
         JOIN user_profiles p ON u.user_id = p.user_id
         WHERE dg.round_id = ? AND dg.user_id = ?
         ORDER BY dg.submitted_at ASC`,
        [round.round_id, authUser.userId]
      );

      // Public notices that other players got it right (without revealing their guess text)
      const otherCorrect = await query<any[]>(
        `SELECT dg.guess_id, dg.user_id, dg.is_correct, dg.submission_sequence, dg.points_awarded, dg.submitted_at,
                p.display_name, p.avatar_url
         FROM drawice_guesses dg
         JOIN users u ON dg.user_id = u.user_id
         JOIN user_profiles p ON u.user_id = p.user_id
         WHERE dg.round_id = ? AND dg.user_id != ? AND dg.is_correct = TRUE
         ORDER BY dg.submission_sequence ASC`,
        [round.round_id, authUser.userId]
      );

      const otherAlerts = otherCorrect.map(c => ({
        ...c,
        guess_text: 'Guessed the word!'
      }));

      guesses = [...myGuesses, ...otherAlerts].sort(
        (a, b) => new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime()
      );
    }

    // Check my guess status
    const [myCorrectRows]: any = await query(
      'SELECT guess_id, points_awarded, submission_sequence FROM drawice_guesses WHERE round_id = ? AND user_id = ? AND is_correct = TRUE',
      [round.round_id, authUser.userId]
    );
    const myGuessStatus = myCorrectRows && myCorrectRows.length > 0 ? {
      hasGuessedCorrect: true,
      pointsAwarded: myCorrectRows[0].points_awarded,
      sequence: myCorrectRows[0].submission_sequence
    } : {
      hasGuessedCorrect: false,
      pointsAwarded: 0,
      sequence: 0
    };

    // Correct guessers set for player list
    const correctGuesserRows = await query<any[]>(
      'SELECT DISTINCT user_id FROM drawice_guesses WHERE round_id = ? AND is_correct = TRUE',
      [round.round_id]
    );
    const correctUserIds = new Set(correctGuesserRows.map(r => r.user_id));

    // Session players with cumulative score
    const players = await query<any[]>(
      `SELECT sp.*, p.display_name, p.avatar_url
       FROM session_players sp
       JOIN users u ON sp.user_id = u.user_id
       JOIN user_profiles p ON u.user_id = p.user_id
       WHERE sp.session_id = ?
       ORDER BY sp.final_score DESC, sp.session_player_id ASC`,
      [sessionId]
    );

    const enrichedPlayers = players.map(p => ({
      ...p,
      hasGuessedCorrect: correctUserIds.has(p.user_id),
      isArtist: p.user_id === round.artist_user_id
    }));

    return NextResponse.json({
      session,
      round: {
        ...round,
        isArtist,
        secretWord,
        wordChoices,
        maskedWord,
        wordLength
      },
      secondsRemaining,
      guesses,
      players: enrichedPlayers,
      myGuessStatus
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed: ' + err.message }, { status: 500 });
  }
}
