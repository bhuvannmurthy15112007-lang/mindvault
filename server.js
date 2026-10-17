const { createServer } = require('http');
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
    console.log(`> [MINDVAULT] Ready on http://localhost:${port}`);
    console.log(`> [MINDVAULT] Persistent Socket.IO & Next.js Server active in ${dev ? 'development' : 'production'} mode`);
  });
}).catch(err => {
  console.error('[MINDVAULT] Server boot failure:', err);
  process.exit(1);
});
