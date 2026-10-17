const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

async function inspectRoomCompletions() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'mindvault',
    waitForConnections: true,
    connectionLimit: 2
  });

  const [cols] = await pool.query("DESCRIBE escape_room_completions");
  console.log('escape_room_completions columns:', cols);

  const [data] = await pool.query("SELECT * FROM escape_room_completions");
  console.log('escape_room_completions data:', data);

  const [spCols] = await pool.query("DESCRIBE session_players");
  console.log('session_players columns:', spCols);

  await pool.end();
}

inspectRoomCompletions().catch(console.error);
