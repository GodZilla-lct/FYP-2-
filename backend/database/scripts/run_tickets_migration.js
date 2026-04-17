const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function runTicketsMigration() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'campus_connect',
      multipleStatements: true
    });

    console.log('🔌 Connected to database\n');
    console.log('=' .repeat(70));
    console.log('MODULE 3: FEEDBACK & ISSUE REPORTING - DATABASE MIGRATION');
    console.log('=' .repeat(70));
    console.log('\n');

    // Read migration SQL file
    const migrationPath = path.join(__dirname, 'migrations', 'create_support_tickets.sql');
    const migrationSQL = await fs.readFile(migrationPath, 'utf8');

    console.log('📋 Running migration: create_support_tickets.sql\n');

    // Execute migration
    await connection.query(migrationSQL);

    console.log('✅ Migration completed successfully!\n');

    // Verify the table exists
    const [tables] = await connection.query(`
      SELECT TABLE_NAME, TABLE_COMMENT
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'support_tickets'
    `, [process.env.DB_NAME || 'campus_connect']);

    if (tables.length > 0) {
      console.log('✅ Verification: support_tickets table exists');
      console.log('   Comment:', tables[0].TABLE_COMMENT);
      
      // Show columns
      const [columns] = await connection.query(`
        SELECT COLUMN_NAME, DATA_TYPE, COLUMN_KEY, EXTRA
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'support_tickets'
        ORDER BY ORDINAL_POSITION
      `, [process.env.DB_NAME || 'campus_connect']);
      
      console.log('\n   Columns:');
      columns.forEach(col => {
        console.log(`   - ${col.COLUMN_NAME} (${col.DATA_TYPE}) ${col.COLUMN_KEY ? `[${col.COLUMN_KEY}]` : ''} ${col.EXTRA}`);
      });
      console.log('\n');
    } else {
      console.log('⚠️  Warning: support_tickets table not found after migration\n');
    }

    console.log('=' .repeat(70));
    console.log('✅ SUPPORT TICKETS DATABASE MIGRATION COMPLETE');
    console.log('=' .repeat(70));
    console.log('\n📌 NEXT STEPS:');
    console.log('   1. Start backend server: npm start');
    console.log('   2. Test ticket submission (POST /api/tickets)');
    console.log('   3. Test Super Admin view (GET /api/super/tickets)');
    console.log('   4. Test ticket resolution (PUT /api/super/tickets/:id/resolve)\n');

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
runTicketsMigration()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Migration failed:', error.message);
    process.exit(1);
  });
