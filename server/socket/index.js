const { Server } = require('socket.io');

function initializeSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log('[Socket] Client connected:', socket.id);

    // Room join/leave
    socket.on('room:join', ({ roomCode, user }) => {
      socket.join(roomCode);
      socket.to(roomCode).emit('room:player_joined', { user });
      console.log(`[Socket] User ${user?.displayName || socket.id} joined room ${roomCode}`);
    });

    socket.on('room:leave', ({ roomCode, user }) => {
      socket.leave(roomCode);
      socket.to(roomCode).emit('room:player_left', { user });
    });

    socket.on('room:ready', ({ roomCode, userId, isReady }) => {
      io.to(roomCode).emit('room:player_ready', { userId, isReady });
    });

    socket.on('room:start', ({ roomCode, sessionId, gameCode }) => {
      io.to(roomCode).emit('room:game_started', { sessionId, gameCode });
    });

    socket.on('room:chat', ({ roomCode, message, user }) => {
      io.to(roomCode).emit('room:chat_message', {
        id: Date.now() + Math.random().toString(36).substring(2, 5),
        user,
        message,
        timestamp: new Date().toLocaleTimeString()
      });
    });

    // Prediction Arena Events
    socket.on('prediction:submitted', ({ sessionId, userId, displayName }) => {
      io.to('session:' + sessionId).emit('prediction:player_submitted', { userId, displayName });
    });

    socket.on('prediction:reveal', ({ sessionId, result }) => {
      io.to('session:' + sessionId).emit('prediction:round_reveal', result);
    });

    socket.on('prediction:rule_unlocked', ({ sessionId, rule }) => {
      io.to('session:' + sessionId).emit('prediction:new_rule', rule);
    });

    socket.on('prediction:next_round', ({ sessionId, roundNumber }) => {
      io.to('session:' + sessionId).emit('prediction:new_round_started', { roundNumber });
    });

    socket.on('prediction:game_completed', ({ sessionId }) => {
      io.to('session:' + sessionId).emit('prediction:game_completed', { isComplete: true });
    });

    // Detective Events
    socket.on('detective:action_taken', ({ sessionId, actionSummary, remainingBudget, userId }) => {
      io.to('session:' + sessionId).emit('detective:broadcast_action', { actionSummary, remainingBudget, userId });
    });

    socket.on('detective:solved', ({ sessionId, culprit, score }) => {
      io.to('session:' + sessionId).emit('detective:case_closed', { culprit, score });
    });

    // Escape Room Events
    socket.on('escape:puzzle_solved', ({ sessionId, puzzleId, doorUnlocked, nextRoomId, isGameComplete, solvedBy }) => {
      io.to('session:' + sessionId).emit('escape:shared_progress', {
        puzzleId,
        doorUnlocked,
        nextRoomId,
        isGameComplete,
        solvedBy
      });
    });

    socket.on('escape:hint_used', ({ sessionId, hintsRemaining, hintText }) => {
      io.to('session:' + sessionId).emit('escape:broadcast_hint', { hintsRemaining, hintText });
    });

    // Drawice Canvas Stroke Cache
    const drawiceCanvases = global.drawiceCanvases || {};
    global.drawiceCanvases = drawiceCanvases;

    // Drawice Events
    socket.on('drawice:stroke', ({ sessionId, strokeData }) => {
      if (!drawiceCanvases[sessionId]) drawiceCanvases[sessionId] = [];
      drawiceCanvases[sessionId].push(strokeData);
      socket.to('session:' + sessionId).emit('drawice:stroke', strokeData);
    });

    socket.on('drawice:request_sync', ({ sessionId }) => {
      if (drawiceCanvases[sessionId] && drawiceCanvases[sessionId].length > 0) {
        socket.emit('drawice:sync_canvas', drawiceCanvases[sessionId]);
      }
    });

    socket.on('drawice:clear', ({ sessionId }) => {
      drawiceCanvases[sessionId] = [];
      socket.to('session:' + sessionId).emit('drawice:clear');
    });

    socket.on('drawice:undo', ({ sessionId }) => {
      if (drawiceCanvases[sessionId] && drawiceCanvases[sessionId].length > 0) {
        const last = drawiceCanvases[sessionId][drawiceCanvases[sessionId].length - 1];
        const strokeId = last?.strokeId;
        if (strokeId) {
          drawiceCanvases[sessionId] = drawiceCanvases[sessionId].filter((s) => s.strokeId !== strokeId);
        } else {
          drawiceCanvases[sessionId].pop();
        }
        io.to('session:' + sessionId).emit('drawice:sync_canvas', drawiceCanvases[sessionId]);
      }
    });

    socket.on('drawice:word_chosen', ({ sessionId, wordLength }) => {
      io.to('session:' + sessionId).emit('drawice:word_chosen', { wordLength });
    });

    socket.on('drawice:guess_submitted', ({ sessionId, guessResult, guesserName, userId }) => {
      io.to('session:' + sessionId).emit('drawice:guess_alert', {
        isCorrect: guessResult.isCorrect,
        guesserName: guessResult.isCorrect ? guesserName : null,
        userId,
        sequence: guessResult.sequence
      });
    });

    socket.on('drawice:reveal', ({ sessionId, revealData }) => {
      io.to('session:' + sessionId).emit('drawice:round_reveal', revealData);
    });

    socket.on('drawice:next_round', ({ sessionId, nextRoundNumber, artistUserId, artistName }) => {
      drawiceCanvases[sessionId] = [];
      io.to('session:' + sessionId).emit('drawice:next_round', { nextRoundNumber, artistUserId, artistName });
    });

    socket.on('drawice:game_completed', ({ sessionId, rankings }) => {
      io.to('session:' + sessionId).emit('drawice:game_completed', { isComplete: true, rankings });
    });

    // Generic Session room subscription
    socket.on('session:join', ({ sessionId, user }) => {
      socket.join('session:' + sessionId);
      console.log(`[Socket] User ${user?.displayName || socket.id} joined session:${sessionId}`);
      // Auto send canvas state if active
      if (drawiceCanvases[sessionId] && drawiceCanvases[sessionId].length > 0) {
        socket.emit('drawice:sync_canvas', drawiceCanvases[sessionId]);
      }
    });

    socket.on('disconnect', () => {
      console.log('[Socket] Client disconnected:', socket.id);
    });
  });

  return io;
}

module.exports = { initializeSocket };
