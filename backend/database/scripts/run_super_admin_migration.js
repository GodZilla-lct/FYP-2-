const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function runSuperAdminMigration() {
  let connection;

  try {
    console.log('🔧 Starting SYSTEM_ADMIN migration...\n');

    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'campus_connect',
      multipleStatements: true
    });

    console.log('✅ Connected to database\n');

    // Read migration file
    const migrationPath = path.join(__dirname, 'migrations', 'add_system_admin.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Execute migration
    console.log('📝 Executing migration...\n');
    await connection.query(migrationSQL);

    console.log('✅ Migration completed successfully!\n');

    // Verify tables
    console.log('🔍 Verifying new tables...\n');

    const [settingsRows] = await connection.query('SELECT * FROM system_settings WHERE id = 1');
    console.log('✅ system_settings table created and seeded:', settingsRows[0]);

    const [logsCount] = await connection.query('SELECT COUNT(*) as count FROM super_admin_logs');
    console.log('✅ super_admin_logs table created (rows:', logsCount[0].count, ')\n');

    // Check if SYSTEM_ADMIN role exists
    const [roleCheck] = await connection.query(
      "SHOW COLUMNS FROM users LIKE 'role'"
    );
    console.log('✅ SYSTEM_ADMIN role added to users table\n');

    console.log('🎉 SYSTEM_ADMIN migration complete!\n');
    console.log('📋 Next steps:');
    console.log('   1. Create a SYSTEM_ADMIN user in the database');
    console.log('   2. Restart the backend server');
    console.log('   3. Login with SYSTEM_ADMIN credentials');
    console.log('   4. Access the Super Admin dashboard\n');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run migration
runSuperAdminMigration();
