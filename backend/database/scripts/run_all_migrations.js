/**
 * Run All Migrations
 * Single script to ensure all required tables and columns exist.
 * Safe to run multiple times — uses IF NOT EXISTS / try-catch.
 *
 * Usage: node backend/database/scripts/run_all_migrations.js
 */
require('dotenv').config();
const mysql = require('mysql2/promise');

async function runMigrations() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  console.log('🔧 Running all migrations...\n');

  // 1. system_settings
  await conn.query(`
    CREATE TABLE IF NOT EXISTS system_settings (
      id INT PRIMARY KEY DEFAULT 1,
      global_freeze BOOLEAN DEFAULT FALSE,
      announcement_text TEXT,
      announcement_color VARCHAR(50) DEFAULT 'bg-blue-500',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
  await conn.query('INSERT IGNORE INTO system_settings (id, global_freeze) VALUES (1, FALSE)');
  console.log('✅ system_settings');

  // 2. super_admin_logs
  await conn.query(`
    CREATE TABLE IF NOT EXISTS super_admin_logs (
      id INT PRIMARY KEY AUTO_INCREMENT,
      admin_id INT NOT NULL,
      action_type VARCHAR(100) NOT NULL,
      description TEXT NOT NULL,
      target_user_id INT,
      target_proposal_id INT,
      metadata JSON,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_admin_id (admin_id),
      INDEX idx_timestamp (timestamp)
    )
  `);
  console.log('✅ super_admin_logs');

  // 3. support_tickets
  await conn.query(`
    CREATE TABLE IF NOT EXISTS support_tickets (
      id INT PRIMARY KEY AUTO_INCREMENT,
      user_id INT NOT NULL,
      subject VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      status ENUM('PENDING','RESOLVED') NOT NULL DEFAULT 'PENDING',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      resolved_at TIMESTAMP NULL,
      resolved_by INT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_status (status)
    )
  `);
  console.log('✅ support_tickets');

  // 4. venues
  await conn.query(`
    CREATE TABLE IF NOT EXISTS venues (
      id INT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(255) NOT NULL UNIQUE,
      capacity INT NOT NULL DEFAULT 0,
      is_available BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
  const [vcount] = await conn.query('SELECT COUNT(*) as c FROM venues');
  if (vcount[0].c === 0) {
    await conn.query(`
      INSERT INTO venues (name, capacity, is_available) VALUES
      ('Main Auditorium', 500, TRUE),
      ('Hafiz Hayat Hall', 300, TRUE),
      ('SSC Ground', 1000, TRUE),
      ('Departmental Grounds', 800, TRUE),
      ('Departmental Conference Halls', 150, TRUE)
    `);
    console.log('✅ venues (seeded 5 halls)');
  } else {
    console.log('✅ venues');
  }

  // 5. proposals.venue_id
  try {
    await conn.query('ALTER TABLE proposals ADD COLUMN venue_id INT AFTER event_date');
    await conn.query('ALTER TABLE proposals ADD CONSTRAINT fk_proposals_venue FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE SET NULL');
    console.log('✅ proposals.venue_id');
  } catch (e) { console.log('ℹ️  proposals.venue_id already exists'); }

  // 6. proposals.is_archived
  try {
    await conn.query('ALTER TABLE proposals ADD COLUMN is_archived BOOLEAN DEFAULT FALSE');
    console.log('✅ proposals.is_archived');
  } catch (e) { console.log('ℹ️  proposals.is_archived already exists'); }

  // 7. users OTP columns
  try {
    await conn.query('ALTER TABLE users ADD COLUMN reset_otp VARCHAR(6) AFTER phone');
    console.log('✅ users.reset_otp');
  } catch (e) { console.log('ℹ️  users.reset_otp already exists'); }
  try {
    await conn.query('ALTER TABLE users ADD COLUMN reset_otp_expires DATETIME AFTER reset_otp');
    console.log('✅ users.reset_otp_expires');
  } catch (e) { console.log('ℹ️  users.reset_otp_expires already exists'); }

  // 8. SYSTEM_ADMIN role enum
  try {
    await conn.query(`
      ALTER TABLE users MODIFY COLUMN role
      ENUM('STUDENT','COORDINATOR','DIRECTOR_SSC','ASST_DIRECTOR','FINANCE_SECRETARY','REGISTRAR','VC','SYSTEM_ADMIN')
      NOT NULL DEFAULT 'STUDENT'
    `);
    console.log('✅ users.role enum (SYSTEM_ADMIN added)');
  } catch (e) { console.log('ℹ️  users.role enum already up to date'); }

  // 9. Session version for access-token invalidation on logout/password change
  try {
    await conn.query('ALTER TABLE users ADD COLUMN session_version INT NOT NULL DEFAULT 0');
    console.log('✅ users.session_version');
  } catch (e) { console.log('ℹ️  users.session_version already exists'); }

  await conn.end();
  console.log('\n✅ All migrations complete.');
}

runMigrations().catch(e => {
  console.error('❌ Migration error:', e.message);
  process.exit(1);
});
