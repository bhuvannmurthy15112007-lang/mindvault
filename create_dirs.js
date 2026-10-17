const fs = require('fs');
const path = require('path');

const dirs = [
  'app/login',
  'app/register',
  'app/dashboard',
  'app/profile',
  'app/games/prediction',
  'app/games/detective',
  'app/games/escape-room',
  'app/games/drawice',
  'app/rooms/create',
  'app/rooms/join',
  'app/rooms/[roomCode]',
  'app/history',
  'app/leaderboard',
  'app/achievements',
  'app/admin',
  'app/api/auth/sync',
  'app/api/profile',
  'app/api/games',
  'app/api/rooms/[roomCode]/join',
  'app/api/rooms/[roomCode]/leave',
  'app/api/rooms/[roomCode]/kick',
  'app/api/rooms/[roomCode]/start',
  'app/api/sessions/[sessionId]',
  'app/api/games/prediction/[sessionId]/submit',
  'app/api/games/detective/[sessionId]/action',
  'app/api/games/detective/[sessionId]/accuse',
  'app/api/games/escape/[sessionId]/puzzle',
  'app/api/games/escape/[sessionId]/hint',
  'app/api/games/drawice/[sessionId]/word-choices',
  'app/api/games/drawice/[sessionId]/select-word',
  'app/api/games/drawice/[sessionId]/guess',
  'app/api/statistics',
  'app/api/leaderboard',
  'app/api/achievements',
  'app/api/admin/users',
  'app/api/admin/detective/cases',
  'app/api/admin/escape/scenarios',
  'app/api/admin/drawice/words',
  'app/api/admin/achievements',
  'app/api/db-health',
  'components/ui',
  'components/layout',
  'components/games/prediction',
  'components/games/detective',
  'components/games/escape-room',
  'components/games/drawice',
  'components/rooms',
  'components/profile',
  'lib/mysql',
  'lib/firebase',
  'lib/auth',
  'lib/socket',
  'lib/utils',
  'server/games/prediction',
  'server/games/detective',
  'server/games/escape-room',
  'server/games/drawice',
  'server/rooms',
  'server/sessions',
  'server/scoring',
  'server/achievements',
  'server/socket',
  'types',
  'database',
  'public'
];

dirs.forEach(d => {
  const fullPath = path.join(__dirname, d);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
});

console.log('All directories created successfully.');
