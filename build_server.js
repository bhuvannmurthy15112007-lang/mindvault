const fs = require('fs');
const path = require('path');

// 1. server/socket/index.js
const socketIndex = `const { Server } = require('socket.io');

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
      console.log(\`[Socket] User \${user?.displayName || socket.id} joined room \${roomCode}\`);
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

    // Drawice Events
    socket.on('drawice:stroke', ({ sessionId, strokeData }) => {
      // Broadcast drawing stroke to all other players in session
      socket.to('session:' + sessionId).emit('drawice:stroke', strokeData);
    });

    socket.on('drawice:clear', ({ sessionId }) => {
      socket.to('session:' + sessionId).emit('drawice:clear');
    });

    socket.on('drawice:guess_submitted', ({ sessionId, guessResult, guesserName }) => {
      io.to('session:' + sessionId).emit('drawice:guess_alert', {
        isCorrect: guessResult.isCorrect,
        guesserName: guessResult.isCorrect ? guesserName : null
      });
    });

    socket.on('drawice:reveal', ({ sessionId, revealData }) => {
      io.to('session:' + sessionId).emit('drawice:round_reveal', revealData);
    });

    // Generic Session room subscription
    socket.on('session:join', ({ sessionId, user }) => {
      socket.join('session:' + sessionId);
      console.log(\`[Socket] User \${user?.displayName || socket.id} joined session:\${sessionId}\`);
    });

    socket.on('disconnect', () => {
      console.log('[Socket] Client disconnected:', socket.id);
    });
  });

  return io;
}

module.exports = { initializeSocket };
`;
fs.writeFileSync(path.join(__dirname, 'server', 'socket', 'index.js'), socketIndex);

// 2. server.js
const serverJs = `const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
require('dotenv').config();

const dev = process.env.NODE_ENV !== 'production';
const port = parseInt(process.env.PORT || '3000', 10);
const app = next({ dev });
const handle = app.getRequestHandler();

const { initializeSocket } = require('./server/socket');

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  // Attach persistent Socket.IO instance
  const io = initializeSocket(server);
  global.io = io;

  server.listen(port, () => {
    console.log(\`> [MINDVAULT] Ready on http://localhost:\${port}\`);
    console.log(\`> [MINDVAULT] Persistent Socket.IO & Next.js Server active in \${dev ? 'development' : 'production'} mode\`);
  });
}).catch(err => {
  console.error('[MINDVAULT] Server boot failure:', err);
  process.exit(1);
});
`;
fs.writeFileSync(path.join(__dirname, 'server.js'), serverJs);

console.log('server.js and server/socket/index.js generated successfully.');
