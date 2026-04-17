require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  let connection;

  try {
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      multipleStatements: true
    });

    console.log('✓ Connected to database');

    // Read migration file
    const migrationPath = path.join(__dirname, 'migrations', 'add_force_status_action.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('Running migration: add_force_status_action.sql');

    // Execute migration
    await connection.query(migrationSQL);

    console.log('✓ Migration completed successfully');
    console.log('✓ approval_history.action now supports: APPROVED, REJECTED, RESUBMITTED, FORCE_STATUS_CHANGE');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('✓ Database connection closed');
    }
  }
}

runMigration();
