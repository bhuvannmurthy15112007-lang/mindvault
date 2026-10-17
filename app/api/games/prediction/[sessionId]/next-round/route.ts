import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/serverAuth';
import { withTransaction } from '@/lib/mysql/db';
import { PredictionEngine } from '@/server/games/prediction/PredictionEngine';

export async function POST(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  const authUser = await verifyAuth(req);
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sessionId = parseInt(params.sessionId, 10);

  try {
    const result = await withTransaction(async (conn) => {
      // 1. Fetch session and lock
      const [sessions]: any = await conn.execute(
        'SELECT * FROM game_sessions WHERE session_id = ? FOR UPDATE',
        [sessionId]
      );
      if (!sessions || sessions.length === 0) throw new Error('SESSION_NOT_FOUND');
      const session = sessions[0];

      if (session.status === 'COMPLETED') {
        return { isComplete: true, message: 'Game already completed.' };
      }

      // Check user is a player in the session or room host
      const [players]: any = await conn.execute(
        'SELECT * FROM session_players WHERE session_id = ? AND user_id = ?',
        [sessionId, authUser.userId]
      );
      if (!players || players.length === 0) {
        // Check if room host
        const [rooms]: any = await conn.execute(
          'SELECT * FROM game_rooms WHERE room_id = ? AND host_user_id = ?',
          [session.room_id, authUser.userId]
        );
        if (!rooms || rooms.length === 0) throw new Error('NOT_AUTHORIZED_FOR_SESSION');
      }

      // 2. Fetch latest round
      const [rounds]: any = await conn.execute(
        'SELECT * FROM prediction_rounds WHERE session_id = ? ORDER BY round_number DESC LIMIT 1 FOR UPDATE',
        [sessionId]
      );
      if (!rounds || rounds.length === 0) throw new Error('ROUND_NOT_FOUND');
      const currentRound = rounds[0];

      // If round is still SUBMITTING, check if 30 seconds elapsed
      if (currentRound.status === 'SUBMITTING') {
        const startTime = new Date(currentRound.created_at).getTime();
        const elapsed = (Date.now() - startTime) / 1000;
        if (elapsed < 30) {
          throw new Error('ROUND_IN_PROGRESS');
        }
        // Force resolve
        await PredictionEngine.resolveRound(sessionId, currentRound.round_number);
      }

      // Check if this was the final round
      if (currentRound.round_number >= session.total_rounds) {
        // Complete current round
        await conn.execute(
          'UPDATE prediction_rounds SET status = "COMPLETED" WHERE round_id = ?',
          [currentRound.round_id]
        );

        // Fetch all session players and calculate ranks
        const [sessionPlayers]: any = await conn.execute(
          'SELECT user_id, final_score FROM session_players WHERE session_id = ? ORDER BY final_score DESC',
          [sessionId]
        );

        // Compute competition ranking (1st, 1st, 3rd)
        let maxScore = sessionPlayers.length > 0 ? sessionPlayers[0].final_score : 0;
        for (let i = 0; i < sessionPlayers.length; i++) {
          let rank = i + 1;
          if (i > 0 && Math.abs(sessionPlayers[i].final_score - sessionPlayers[i - 1].final_score) < 0.00001) {
            rank = sessionPlayers[i - 1].rank;
          }
          sessionPlayers[i].rank = rank;
          const isWinner = sessionPlayers[i].final_score === maxScore && maxScore > 0;

          await conn.execute(
            'UPDATE session_players SET final_rank = ?, is_winner = ? WHERE session_id = ? AND user_id = ?',
            [rank, isWinner, sessionId, sessionPlayers[i].user_id]
          );

          // Update player_game_statistics
          await conn.execute(
            `INSERT INTO player_game_statistics (user_id, game_id, games_played, games_won, total_score, highest_score)
             VALUES (?, ?, 1, ?, ?, ?)
             ON DUPLICATE KEY UPDATE 
               games_played = games_played + 1,
               games_won = games_won + VALUES(games_won),
               total_score = total_score + VALUES(total_score),
               highest_score = GREATEST(highest_score, VALUES(highest_score))`,
            [
              sessionPlayers[i].user_id,
              session.game_id,
              isWinner ? 1 : 0,
              sessionPlayers[i].final_score,
              sessionPlayers[i].final_score
            ]
          );
        }

        // Complete session and room
        await conn.execute(
          'UPDATE game_sessions SET status = "COMPLETED", completed_at = CURRENT_TIMESTAMP WHERE session_id = ?',
          [sessionId]
        );
        await conn.execute(
          'UPDATE game_rooms SET status = "COMPLETED" WHERE room_id = ?',
          [session.room_id]
        );

        return {
          isComplete: true,
          roundNumber: currentRound.round_number
        };
      } else {
        // Next round
        const nextRoundNumber = currentRound.round_number + 1;

        await conn.execute(
          'UPDATE prediction_rounds SET status = "COMPLETED" WHERE round_id = ?',
          [currentRound.round_id]
        );

        await conn.execute(
          'INSERT INTO prediction_rounds (session_id, round_number, status, created_at) VALUES (?, ?, "SUBMITTING", CURRENT_TIMESTAMP)',
          [sessionId, nextRoundNumber]
        );

        await conn.execute(
          'UPDATE game_sessions SET current_round = ? WHERE session_id = ?',
          [nextRoundNumber, sessionId]
        );

        const unlockedRule = PredictionEngine.checkRuleUnlock(session.total_rounds, currentRound.round_number, nextRoundNumber);

        return {
          isComplete: false,
          roundNumber: nextRoundNumber,
          unlockedRule
        };
      }
    });

    if (result.isComplete) {
      (global as any).io?.to('session:' + sessionId).emit('prediction:game_completed', { isComplete: true });
    } else {
      (global as any).io?.to('session:' + sessionId).emit('prediction:new_round_started', { roundNumber: result.roundNumber });
      if (result.unlockedRule) {
        (global as any).io?.to('session:' + sessionId).emit('prediction:new_rule', result.unlockedRule);
      }
    }

    return NextResponse.json({ success: true, ...result });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
