const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function runProfileMigration() {
  let connection;
  
  try {
    // Create database connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'campus_connect',
      multipleStatements: true
    });

    console.log('🔌 Connected to database\n');
    console.log('=' .repeat(70));
    console.log('MODULE 1: THE SECURE PROFILE SYSTEM - DATABASE MIGRATION');
    console.log('=' .repeat(70));
    console.log('\n');

    // Read migration SQL file
    const migrationPath = path.join(__dirname, 'migrations', 'add_profile_picture.sql');
    const migrationSQL = await fs.readFile(migrationPath, 'utf8');

    console.log('📋 Running migration: add_profile_picture.sql\n');

    // Execute migration
    await connection.query(migrationSQL);

    console.log('✅ Migration completed successfully!\n');

    // Verify the column exists
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = 'profile_picture'
    `, [process.env.DB_NAME || 'campus_connect']);

    if (columns.length > 0) {
      console.log('✅ Verification: profile_picture column exists');
      console.log('   Type:', columns[0].DATA_TYPE);
      console.log('   Max Length:', columns[0].CHARACTER_MAXIMUM_LENGTH);
      console.log('   Nullable:', columns[0].IS_NULLABLE);
      console.log('\n');
    } else {
      console.log('⚠️  Warning: profile_picture column not found after migration\n');
    }

    console.log('=' .repeat(70));
    console.log('✅ PROFILE SYSTEM DATABASE MIGRATION COMPLETE');
    console.log('=' .repeat(70));
    console.log('\n📌 NEXT STEPS:');
    console.log('   1. Ensure /uploads/avatars/ directory exists');
    console.log('   2. Start backend server: npm start');
    console.log('   3. Test avatar upload functionality');
    console.log('   4. Test profile update (name only)');
    console.log('   5. Test secure password change\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('Stack:', error.stack);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed\n');
    }
  }
}

// Run migration
runProfileMigration()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Migration failed:', error.message);
    process.exit(1);
  });
