require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');

async function main() {
  const p = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'mindvault'
  });

  const [tables] = await p.query("SHOW TABLES LIKE 'escape_%'");
  for (const t of tables) {
    const name = Object.values(t)[0];
    const [cols] = await p.query('DESCRIBE ' + name);
    console.log(name + ':');
    console.log(cols.map(c => `  ${c.Field} ${c.Type} ${c.Null === 'YES' ? 'NULL' : 'NOT NULL'}`).join('\n'));
  }

  // Also inspect existing escape_scenarios
  const [scenarios] = await p.query('SELECT * FROM escape_scenarios');
  console.log('\nExisting Scenarios:', scenarios);

  // Inspect existing escape_rooms
  const [rooms] = await p.query('SELECT * FROM escape_rooms');
  console.log('\nExisting Rooms:', rooms);

  // Inspect existing escape_puzzles and answers
  const [puzzles] = await p.query(`
    SELECT ep.puzzle_id, ep.object_id, ep.puzzle_prompt, ep.puzzle_type, ep.hint_text, ep.difficulty_points,
           pa.accepted_plaintext
    FROM escape_puzzles ep
    LEFT JOIN escape_puzzle_answers pa ON ep.puzzle_id = pa.puzzle_id
  `);
  console.log('\nExisting Puzzles & Answers:', puzzles);

  // Inspect existing escape_clues
  const [clues] = await p.query('SELECT * FROM escape_clues');
  console.log('\nExisting Clues:', clues);

  await p.end();
}

main().catch(console.error);
