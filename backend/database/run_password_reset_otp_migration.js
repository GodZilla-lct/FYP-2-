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
    await connection.query(migrationSQL);

    const [columns] = await connection.query(
      `SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users'
         AND COLUMN_NAME IN ('reset_otp', 'reset_otp_expires')`,
      [process.env.DB_NAME || 'campus_connect']
    );

    console.log('Migration add_password_reset_otp.sql applied.');
    columns.forEach((c) => {
      console.log(`  - ${c.COLUMN_NAME}: ${c.DATA_TYPE} nullable=${c.IS_NULLABLE}`);
    });
  } catch (err) {
    console.error('OTP migration failed:', err.message);
    process.exitCode = 1;
  } finally {
    if (connection) await connection.end();
  }
}

runOtpMigration();
