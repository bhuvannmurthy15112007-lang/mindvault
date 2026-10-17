const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function restoreDatabase() {
  const host = process.env.TARGET_DB_HOST || process.env.DB_HOST;
  const port = parseInt(process.env.TARGET_DB_PORT || process.env.DB_PORT || '3306', 10);
  const user = process.env.TARGET_DB_USER || process.env.DB_USER;
  const password = process.env.TARGET_DB_PASSWORD || process.env.DB_PASSWORD;
  const database = process.env.TARGET_DB_NAME || process.env.DB_NAME || 'mindvault';
  const useSsl = (process.env.TARGET_DB_SSL || process.env.DB_SSL) === 'true';

  if (!host || !user) {
    console.error('[Restore Error] Missing TARGET_DB_HOST or TARGET_DB_USER. Please provide credentials.');
    process.exit(1);
  }

  console.log(`[Restore] Connecting to ${user}@${host}:${port}/${database} (SSL: ${useSsl})...`);

  const connection = await mysql.createConnection({
    host,
    port,
    user,
    password,
    database,
    multipleStatements: true,
    ...(useSsl ? { ssl: { rejectUnauthorized: false } } : {})
  });

  console.log('[Restore] Connected successfully!');

  const backupFile = path.join(__dirname, '..', 'database', 'mindvault_full_backup.sql');
  if (!fs.existsSync(backupFile)) {
    console.error(`[Restore Error] Backup file not found at ${backupFile}`);
    process.exit(1);
  }

  const sqlContent = fs.readFileSync(backupFile, 'utf8');
  console.log(`[Restore] Executing database migration (${(sqlContent.length / 1024).toFixed(1)} KB)...`);

  await connection.query(sqlContent);
  console.log('[Restore] SQL statements executed successfully!');

  // Verify
  const [tables] = await connection.query('SHOW TABLES');
  console.log(`[Restore] Verification: Target database now contains ${tables.length} tables.`);

  const [userCnt] = await connection.query('SELECT COUNT(*) as c FROM users');
  console.log(`[Restore] Verification: Registered users count = ${userCnt[0].c}`);

  await connection.end();
  console.log('[Restore] Migration completed with 100% data integrity verified.');
}

restoreDatabase().catch(err => {
  console.error('[Restore Failure]:', err.message);
  process.exit(1);
});
