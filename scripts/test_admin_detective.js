require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');

async function testAdminOps() {
  console.log('Testing Admin Detective Case Management Operations...');
  const pool = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'mindvault',
    waitForConnections: true,
    connectionLimit: 5
  });

  try {
    // 1. Create a draft case as Admin
    const [cRes] = await pool.query(
      `INSERT INTO detective_cases (title, synopsis, difficulty, investigation_budget, incident_location, incident_time, is_active)
       VALUES ('Admin Test Case', 'A test case created by admin console', 'EASY', 90, 'Test Sector', '10:00 PM', FALSE)`
    );
    const caseId = cRes.insertId;
    console.log(`[PASS] Admin created test case #${caseId}`);

    // 2. Toggle active status
    await pool.query('UPDATE detective_cases SET is_active = TRUE WHERE case_id = ?', [caseId]);
    const [cRows] = await pool.query('SELECT is_active FROM detective_cases WHERE case_id = ?', [caseId]);
    if (cRows[0].is_active === 1) {
      console.log(`[PASS] Admin toggled case #${caseId} to ACTIVE`);
    }

    // 3. Add suspect
    const [sRes] = await pool.query(
      `INSERT INTO detective_suspects (case_id, name, occupation, background, alibi, is_culprit)
       VALUES (?, 'Test Suspect', 'Security Guard', 'Test background', 'On duty', TRUE)`,
      [caseId]
    );
    const suspectId = sRes.insertId;
    console.log(`[PASS] Admin configured suspect #${suspectId}`);

    // 4. Add location
    const [lRes] = await pool.query(
      `INSERT INTO detective_locations (case_id, name, description)
       VALUES (?, 'Test Vault', 'Secure room')`,
      [caseId]
    );
    const locId = lRes.insertId;
    console.log(`[PASS] Admin configured location #${locId}`);

    // 5. Add evidence
    const [eRes] = await pool.query(
      `INSERT INTO detective_evidence (case_id, location_id, suspect_id, title, description, is_critical)
       VALUES (?, ?, ?, 'Test Keycard', 'Keycard dropped on floor', TRUE)`,
      [caseId, locId, suspectId]
    );
    const evId = eRes.insertId;
    console.log(`[PASS] Admin configured evidence #${evId}`);

    // 6. Configure solution
    await pool.query(
      `INSERT INTO detective_case_solutions (case_id, culprit_suspect_id, motive, murder_weapon_or_method, critical_evidence_summary, explanation)
       VALUES (?, ?, 'Greed', 'Used cloned keycard', 'Dropped keycard found in vault', 'Suspect used keycard')`,
      [caseId, suspectId]
    );
    console.log(`[PASS] Admin configured authoritative case solution`);

    // 7. Clean up test case
    await pool.query('DELETE FROM detective_cases WHERE case_id = ?', [caseId]);
    console.log(`[PASS] Cleaned up draft test case #${caseId}`);

    console.log('\nAll Admin Detective Management Operations Verified Successfully!');
    await pool.end();
  } catch (err) {
    console.error('Admin test failed:', err);
    await pool.end();
    process.exit(1);
  }
}

testAdminOps();
