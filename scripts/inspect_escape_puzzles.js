const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

async function inspectScenario() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'mindvault',
    waitForConnections: true,
    connectionLimit: 2
  });

  const [puzzles] = await pool.query(`
    SELECT ep.puzzle_id, ep.puzzle_prompt, ep.puzzle_type, ep.hint_text, eo.object_id, eo.name as object_name, eo.escape_room_id, er.room_name, er.sequence_order
    FROM escape_puzzles ep
    JOIN escape_objects eo ON ep.object_id = eo.object_id
    JOIN escape_rooms er ON eo.escape_room_id = er.escape_room_id
    ORDER BY er.sequence_order, ep.puzzle_id
  `);
  console.log('Puzzles by Room:');
  console.table(puzzles);

  const [locks] = await pool.query(`
    SELECT el.lock_id, el.lock_name, el.escape_room_id, el.target_room_id, el.is_exit_door, euc.required_puzzle_id
    FROM escape_locks el
    LEFT JOIN escape_unlock_conditions euc ON el.lock_id = euc.lock_id
  `);
  console.log('Locks and Conditions:');
  console.table(locks);

  await pool.end();
}

inspectScenario().catch(console.error);
