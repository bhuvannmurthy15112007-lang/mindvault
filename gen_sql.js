const fs = require('fs');
const path = require('path');
const p = path.join(__dirname, 'database', 'mindvault.sql');
fs.writeFileSync(p, '-- MINDVAULT DATABASE SCHEMA\nCREATE DATABASE IF NOT EXISTS mindvault CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;\nUSE mindvault;\nSET FOREIGN_KEY_CHECKS = 0;\n');
console.log('SQL init created');
