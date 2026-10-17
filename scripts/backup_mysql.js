const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

async function createBackup() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'mindvault',
    waitForConnections: true,
    connectionLimit: 2,
    dateStrings: true
  });

  const outputFile = path.join(__dirname, '..', 'database', 'mindvault_full_backup.sql');
  const stream = fs.createWriteStream(outputFile, { encoding: 'utf8' });

  stream.write(`-- ========================================================\n`);
  stream.write(`-- MINDVAULT AUTHORITATIVE FULL DATABASE BACKUP\n`);
  stream.write(`-- Generated: ${new Date().toISOString()}\n`);
  stream.write(`-- ========================================================\n\n`);
  stream.write(`SET FOREIGN_KEY_CHECKS = 0;\n\n`);

  const [tables] = await pool.query('SHOW FULL TABLES WHERE Table_type = "BASE TABLE"');
  const tableNames = tables.map(t => Object.values(t)[0]);
  console.log(`[Backup] Found ${tableNames.length} base tables to backup...`);

  for (const table of tableNames) {
    // 1. Get CREATE TABLE
    const [[createRes]] = await pool.query(`SHOW CREATE TABLE \`${table}\``);
    const createSql = createRes['Create Table'];

    stream.write(`-- --------------------------------------------------------\n`);
    stream.write(`-- Table structure for \`${table}\`\n`);
    stream.write(`-- --------------------------------------------------------\n`);
    stream.write(`DROP TABLE IF EXISTS \`${table}\`;\n`);
    stream.write(`${createSql};\n\n`);

    // 2. Get Data
    const [rows] = await pool.query(`SELECT * FROM \`${table}\``);
    if (rows.length > 0) {
      stream.write(`-- Dumping data for \`${table}\` (${rows.length} rows)\n`);
      for (const row of rows) {
        const columns = Object.keys(row).map(c => `\`${c}\``).join(', ');
        const values = Object.values(row).map(val => {
          if (val === null || val === undefined) return 'NULL';
          if (typeof val === 'number') return val;
          if (typeof val === 'boolean') return val ? 1 : 0;
          return pool.escape(val);
        }).join(', ');
        stream.write(`INSERT INTO \`${table}\` (${columns}) VALUES (${values});\n`);
      }
      stream.write(`\n`);
    }
  }

  stream.write(`SET FOREIGN_KEY_CHECKS = 1;\n`);
  stream.write(`-- Backup completed successfully\n`);
  stream.end();

  await pool.end();
  console.log(`[Backup] Completed! Saved to: ${outputFile}`);
}

createBackup().catch(err => {
  console.error('[Backup Error]:', err);
  process.exit(1);
});
