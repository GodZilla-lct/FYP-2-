/**
 * Reset all user passwords to password123
 * Run: node reset-passwords.js
 */
require('dotenv').config({ override: true });
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function resetAll() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  const hash = await bcrypt.hash('password123', 10);

  // Reset ALL users
  const [result] = await conn.query(
    'UPDATE users SET password_hash = ?',
    [hash]
  );

  console.log(`✅ Reset ${result.affectedRows} user passwords to: password123`);

  // Verify a few
  const [users] = await conn.query(
    'SELECT email, role FROM users ORDER BY role, email LIMIT 10'
  );
  console.log('\nSample accounts (all use password123):');
  users.forEach(u => console.log(`  ${u.role.padEnd(20)} ${u.email}`));

  await conn.end();
}

resetAll().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
