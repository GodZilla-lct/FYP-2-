const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function runOtpMigration() {
  let connection;

  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'campus_connect',
      multipleStatements: true,
    });

    console.log('Connected to database');
    const migrationPath = path.join(__dirname, 'migrations', 'add_password_reset_otp.sql');
    const migrationSQL = await fs.readFile(migrationPath, 'utf8');
    
    console.log('Running OTP migration...');
    await connection.query(migrationSQL);
    console.log('Migration SQL executed');

    const [columns] = await connection.query(
      `SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users'
         AND COLUMN_NAME IN ('reset_otp', 'reset_otp_expires')
       ORDER BY COLUMN_NAME`,
      [process.env.DB_NAME || 'campus_connect']
    );

    console.log('\nMigration add_password_reset_otp.sql applied.');
    console.log('OTP columns in users table:');
    if (columns.length === 0) {
      console.log('  ⚠️  No OTP columns found!');
    } else {
      columns.forEach((c) => {
        console.log(`  ✓ ${c.COLUMN_NAME}: ${c.DATA_TYPE}${c.CHARACTER_MAXIMUM_LENGTH ? `(${c.CHARACTER_MAXIMUM_LENGTH})` : ''} nullable=${c.IS_NULLABLE}`);
      });
    }
    
    if (columns.length < 2) {
      console.log('\n⚠️  Warning: Expected 2 columns (reset_otp, reset_otp_expires) but found', columns.length);
    } else {
      console.log('\n✓ All OTP columns present');
    }
  } catch (err) {
    console.error('OTP migration failed:', err.message);
    process.exitCode = 1;
  } finally {
    if (connection) await connection.end();
  }
}

runOtpMigration();
