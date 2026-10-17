import { query, withTransaction } from '@/lib/mysql/db';

export function normalizeGuess(text: string): string {
  return (text || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, '');
}

export class DrawiceEngine {
  // Start a new round with fair round-robin artist rotation and 3 random words
  public static async startRound(sessionId: number, roundNumber: number) {
    return await withTransaction(async (conn) => {
      const [players]: any = await conn.execute(
        `SELECT sp.user_id, p.display_name, p.avatar_url 
         FROM session_players sp 
         JOIN users u ON sp.user_id = u.user_id
         JOIN user_profiles p ON u.user_id = p.user_id
         WHERE sp.session_id = ? 
         ORDER BY sp.session_player_id ASC`,
        [sessionId]
      );
      if (!players || players.length === 0) throw new Error('NO_PLAYERS_FOUND');

      const artistIndex = (roundNumber - 1) % players.length;
      const artist = players[artistIndex];

      const [words]: any = await conn.execute(
        'SELECT word_id, word, category, difficulty FROM drawice_words WHERE is_active = TRUE ORDER BY RAND() LIMIT 3'
      );
      if (!words || words.length === 0) throw new Error('NOT_ENOUGH_WORDS');

      const wordOptions = words.map((w: any) => ({
        id: w.word_id,
        word: w.word,
        category: w.category,
        difficulty: w.difficulty
      }));

      const [insertRes]: any = await conn.execute(
        `INSERT INTO drawice_rounds 
         (session_id, round_number, artist_user_id, word_options_json, status, time_limit_seconds, started_at) 
         VALUES (?, ?, ?, ?, 'CHOOSING', 60, CURRENT_TIMESTAMP)`,
        [sessionId, roundNumber, artist.user_id, JSON.stringify(wordOptions)]
      );

      return {
        roundId: insertRes.insertId,
        roundNumber,
        artistUserId: artist.user_id,
        artistName: artist.display_name,
        wordOptions
      };
    });
  }

  // Select secret word for artist
  public static async selectWord(sessionId: number, roundNumber: number, artistUserId: number, wordId: number) {
    return await withTransaction(async (conn) => {
      const [rounds]: any = await conn.execute(
        'SELECT * FROM drawice_rounds WHERE session_id = ? AND round_number = ? FOR UPDATE',
        [sessionId, roundNumber]
      );
      if (!rounds || rounds.length === 0) throw new Error('ROUND_NOT_FOUND');
      const round = rounds[0];

      if (round.artist_user_id !== artistUserId) {
        throw new Error('NOT_THE_ARTIST');
      }

      if (round.status !== 'CHOOSING') {
        return { success: true, chosenWord: round.chosen_word, wordLength: round.chosen_word?.length || 0 };
      }

      const [wordRows]: any = await conn.execute('SELECT word FROM drawice_words WHERE word_id = ?', [wordId]);
      if (!wordRows || wordRows.length === 0) throw new Error('WORD_NOT_FOUND');
      const chosenWord = wordRows[0].word;

      await conn.execute(
        `UPDATE drawice_rounds 
         SET chosen_word_id = ?, chosen_word = ?, status = 'DRAWING', started_at = CURRENT_TIMESTAMP 
         WHERE round_id = ?`,
        [wordId, chosenWord, round.round_id]
      );

      return {
        success: true,
        chosenWord,
        wordLength: chosenWord.length
      };
    });
  }

  // Submit private guess with deterministic submission_sequence and exact scoring
  public static async submitGuess(sessionId: number, roundNumber: number, userId: number, guessText: string) {
    return await withTransaction(async (conn) => {
      const [rounds]: any = await conn.execute(
        `SELECT dr.*, dw.word AS secret_word 
         FROM drawice_rounds dr 
         LEFT JOIN drawice_words dw ON dr.chosen_word_id = dw.word_id 
         WHERE dr.session_id = ? AND dr.round_number = ? FOR UPDATE`,
        [sessionId, roundNumber]
      );
      if (!rounds || rounds.length === 0) throw new Error('ROUND_NOT_FOUND');
      const round = rounds[0];

      if (round.status !== 'DRAWING') {
        throw new Error('GUESSING_CLOSED');
      }

      if (round.artist_user_id === userId) {
        throw new Error('ARTIST_CANNOT_GUESS');
      }

      // Check if user has already guessed correctly in this round
      const [priorSelf]: any = await conn.execute(
        'SELECT guess_id, points_awarded, submission_sequence FROM drawice_guesses WHERE round_id = ? AND user_id = ? AND is_correct = TRUE',
        [round.round_id, userId]
      );
      if (priorSelf && priorSelf.length > 0) {
        return {
          alreadyGuessedCorrect: true,
          pointsAwarded: priorSelf[0].points_awarded,
          sequence: priorSelf[0].submission_sequence,
          isCorrect: true,
          allGuessersFinished: false
        };
      }

      // Check correctness
      const rawGuess = (guessText || '').trim();
      const secret = (round.chosen_word || round.secret_word || '').trim();
      const cleanGuess = normalizeGuess(rawGuess);
      const cleanSecret = normalizeGuess(secret);
      const isCorrect = cleanGuess === cleanSecret && cleanSecret.length > 0;

      let pointsAwarded = 0;
      let nextSequence = 0;

      if (isCorrect) {
        const [priorCorrect]: any = await conn.execute(
          'SELECT COUNT(DISTINCT user_id) AS cnt FROM drawice_guesses WHERE round_id = ? AND is_correct = TRUE',
          [round.round_id]
        );
        const correctRank = (priorCorrect[0]?.cnt || 0) + 1;
        nextSequence = correctRank;

        // Guesser Points: 1st = 10, 2nd = 9, 3rd = 8, 4th = 7... Math.max(1, 10 - (order - 1))
        pointsAwarded = Math.max(1, 10 - (correctRank - 1));

        await conn.execute(
          `INSERT INTO drawice_guesses 
           (round_id, user_id, guess_text, is_correct, submission_sequence, points_awarded) 
           VALUES (?, ?, ?, TRUE, ?, ?)`,
          [round.round_id, userId, rawGuess, nextSequence, pointsAwarded]
        );

        // Update player's cumulative score
        await conn.execute(
          'UPDATE session_players SET final_score = final_score + ? WHERE session_id = ? AND user_id = ?',
          [pointsAwarded, sessionId, userId]
        );

        // Check if all guessers have completed
        const [guesserCountRows]: any = await conn.execute(
          'SELECT COUNT(*) as cnt FROM session_players WHERE session_id = ? AND user_id != ?',
          [sessionId, round.artist_user_id]
        );
        const totalGuessers = guesserCountRows[0]?.cnt || 1;
        const allFinished = correctRank >= totalGuessers;

        return {
          isCorrect: true,
          sequence: nextSequence,
          pointsAwarded,
          allGuessersFinished: allFinished
        };
      } else {
        await conn.execute(
          `INSERT INTO drawice_guesses 
           (round_id, user_id, guess_text, is_correct, submission_sequence, points_awarded) 
           VALUES (?, ?, ?, FALSE, 0, 0)`,
          [round.round_id, userId, rawGuess]
        );

        return {
          isCorrect: false,
          sequence: 0,
          pointsAwarded: 0,
          allGuessersFinished: false
        };
      }
    });
  }

  // End round, calculate exact artist points, and set status to ROUND_REVEAL
  public static async endRoundAndScoreArtist(sessionId: number, roundNumber: number, drawingData?: string) {
    return await withTransaction(async (conn) => {
      const [rounds]: any = await conn.execute(
        `SELECT dr.*, dw.word 
         FROM drawice_rounds dr 
         LEFT JOIN drawice_words dw ON dr.chosen_word_id = dw.word_id 
         WHERE dr.session_id = ? AND dr.round_number = ? FOR UPDATE`,
        [sessionId, roundNumber]
      );
      if (!rounds || rounds.length === 0) return null;
      const round = rounds[0];

      if (round.status === 'ROUND_REVEAL' || round.status === 'FINISHED') {
        const [guesses]: any = await conn.execute(
          `SELECT dg.*, p.display_name, p.avatar_url
           FROM drawice_guesses dg
           JOIN users u ON dg.user_id = u.user_id
           JOIN user_profiles p ON u.user_id = p.user_id
           WHERE dg.round_id = ?
           ORDER BY dg.is_correct DESC, dg.submission_sequence ASC, dg.submitted_at ASC`,
          [round.round_id]
        );
        return {
          roundId: round.round_id,
          revealedWord: round.chosen_word || round.word,
          artistScore: round.artist_score,
          drawingData: round.drawing_data,
          guesses
        };
      }

      // Count distinct correct guessers
      const [correctRows]: any = await conn.execute(
        'SELECT COUNT(DISTINCT user_id) AS correct_count FROM drawice_guesses WHERE round_id = ? AND is_correct = TRUE',
        [round.round_id]
      );
      const correctCount = correctRows[0]?.correct_count || 0;

      // Artist scoring formula:
      // if 0 correct: 0
      // if >= 1: 10 + ((correct_count - 1) * 5)
      let artistScore = 0;
      if (correctCount >= 1) {
        artistScore = 10 + ((correctCount - 1) * 5);
      }

      const revealedWord = round.chosen_word || round.word;

      await conn.execute(
        `UPDATE drawice_rounds 
         SET artist_score = ?, status = 'ROUND_REVEAL', drawing_data = COALESCE(?, drawing_data), ended_at = CURRENT_TIMESTAMP 
         WHERE round_id = ?`,
        [artistScore, drawingData || null, round.round_id]
      );

      if (artistScore > 0) {
        await conn.execute(
          'UPDATE session_players SET final_score = final_score + ? WHERE session_id = ? AND user_id = ?',
          [artistScore, sessionId, round.artist_user_id]
        );
      }

      const [guesses]: any = await conn.execute(
        `SELECT dg.*, p.display_name, p.avatar_url
         FROM drawice_guesses dg
         JOIN users u ON dg.user_id = u.user_id
         JOIN user_profiles p ON u.user_id = p.user_id
         WHERE dg.round_id = ?
         ORDER BY dg.is_correct DESC, dg.submission_sequence ASC, dg.submitted_at ASC`,
        [round.round_id]
      );

      return {
        roundId: round.round_id,
        revealedWord,
        artistScore,
        correctCount,
        drawingData: drawingData || round.drawing_data,
        guesses
      };
    });
  }

  // Advance to next round or complete the game session and record leaderboard statistics
  public static async nextRoundOrComplete(sessionId: number) {
    return await withTransaction(async (conn) => {
      const [sessions]: any = await conn.execute(
        'SELECT * FROM game_sessions WHERE session_id = ? FOR UPDATE',
        [sessionId]
      );
      if (!sessions || sessions.length === 0) throw new Error('SESSION_NOT_FOUND');
      const session = sessions[0];

      if (session.status === 'COMPLETED') {
        const [players]: any = await conn.execute(
          `SELECT sp.*, p.display_name, p.avatar_url 
           FROM session_players sp 
           JOIN users u ON sp.user_id = u.user_id
           JOIN user_profiles p ON u.user_id = p.user_id
           WHERE sp.session_id = ? 
           ORDER BY sp.final_rank ASC, sp.final_score DESC`,
          [sessionId]
        );
        return { isComplete: true, rankings: players };
      }

      if (session.current_round < session.total_rounds) {
        const nextRoundNumber = session.current_round + 1;

        const [players]: any = await conn.execute(
          `SELECT sp.user_id, p.display_name, p.avatar_url 
           FROM session_players sp 
           JOIN users u ON sp.user_id = u.user_id
           JOIN user_profiles p ON u.user_id = p.user_id
           WHERE sp.session_id = ? 
           ORDER BY sp.session_player_id ASC`,
          [sessionId]
        );

        const artistIndex = (nextRoundNumber - 1) % players.length;
        const artist = players[artistIndex];

        const [words]: any = await conn.execute(
          'SELECT word_id, word, category, difficulty FROM drawice_words WHERE is_active = TRUE ORDER BY RAND() LIMIT 3'
        );

        const wordOptions = words.map((w: any) => ({
          id: w.word_id,
          word: w.word,
          category: w.category,
          difficulty: w.difficulty
        }));

        await conn.execute(
          `INSERT INTO drawice_rounds 
           (session_id, round_number, artist_user_id, word_options_json, status, time_limit_seconds, started_at) 
           VALUES (?, ?, ?, ?, 'CHOOSING', 60, CURRENT_TIMESTAMP)`,
          [sessionId, nextRoundNumber, artist.user_id, JSON.stringify(wordOptions)]
        );

        await conn.execute(
          'UPDATE game_sessions SET current_round = ? WHERE session_id = ?',
          [nextRoundNumber, sessionId]
        );

        return {
          isComplete: false,
          nextRoundNumber,
          artistUserId: artist.user_id,
          artistName: artist.display_name
        };
      } else {
        // Tournament Finished: Complete session and persist statistics
        await conn.execute(
          'UPDATE game_sessions SET status = "COMPLETED", completed_at = CURRENT_TIMESTAMP WHERE session_id = ?',
          [sessionId]
        );

        await conn.execute(
          'UPDATE drawice_rounds SET status = "FINISHED" WHERE session_id = ? AND round_number = ?',
          [sessionId, session.current_round]
        );

        const [rankedPlayers]: any = await conn.execute(
          `SELECT sp.*, p.display_name, p.avatar_url 
           FROM session_players sp 
           JOIN users u ON sp.user_id = u.user_id
           JOIN user_profiles p ON u.user_id = p.user_id
           WHERE sp.session_id = ? 
           ORDER BY sp.final_score DESC, sp.session_player_id ASC`,
          [sessionId]
        );

        let currentRank = 1;
        for (let i = 0; i < rankedPlayers.length; i++) {
          if (i > 0 && Number(rankedPlayers[i].final_score) < Number(rankedPlayers[i - 1].final_score)) {
            currentRank = i + 1;
          }
          const isWinner = currentRank === 1;
          rankedPlayers[i].final_rank = currentRank;
          rankedPlayers[i].is_winner = isWinner;

          await conn.execute(
            'UPDATE session_players SET final_rank = ?, is_winner = ? WHERE session_player_id = ?',
            [currentRank, isWinner, rankedPlayers[i].session_player_id]
          );

          // Persist Drawice statistics (game_id = 4)
          await conn.execute(
            `INSERT INTO player_game_statistics (user_id, game_id, games_played, games_won, total_score, highest_score)
             VALUES (?, 4, 1, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
               games_played = games_played + 1,
               games_won = games_won + VALUES(games_won),
               total_score = total_score + VALUES(total_score),
               highest_score = GREATEST(highest_score, VALUES(highest_score))`,
            [
              rankedPlayers[i].user_id,
              isWinner ? 1 : 0,
              rankedPlayers[i].final_score,
              rankedPlayers[i].final_score
            ]
          );
        }

        return {
          isComplete: true,
          rankings: rankedPlayers
        };
      }
    });
  }
}
