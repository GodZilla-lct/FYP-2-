/**
 * Migration Runner: Allow NULL approver_id in approval_history
 * 
 * Purpose: Modify approval_history table to support VC Magic Link approvals
 * where VC has no user account in the database.
 * 
 * This migration:
 * 1. Drops existing foreign key constraint
 * 2. Modifies approver_id to allow NULL
 * 3. Re-adds foreign key with ON DELETE SET NULL
 * 4. Adds performance index
 * 
 * Usage: node backend/database/run_approval_history_migration.js
 */

const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'campus_connect',
  multipleStatements: true
};

async function runMigration() {
  let connection;

  try {
    console.log('🔧 APPROVAL HISTORY MIGRATION - Starting...\n');
    console.log('📋 Database:', dbConfig.database);
    console.log('🏠 Host:', dbConfig.host);
    console.log('');

    // Connect to database
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Database connection established\n');

    // Read migration file
    const migrationPath = path.join(__dirname, 'migrations', 'allow_null_approver_id.sql');
    console.log('📄 Reading migration file:', migrationPath);
    const migrationSQL = await fs.readFile(migrationPath, 'utf8');
    console.log('✅ Migration file loaded\n');

    // Start transaction
    await connection.beginTransaction();
    console.log('🔒 Transaction started\n');

    // Check current state
    console.log('📊 Checking current approval_history structure...');
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME, IS_NULLABLE, COLUMN_TYPE, COLUMN_KEY
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? 
        AND TABLE_NAME = 'approval_history' 
        AND COLUMN_NAME = 'approver_id'
    `, [dbConfig.database]);

    if (columns.length === 0) {
      throw new Error('approval_history table or approver_id column not found');
    }

    const currentState = columns[0];
    console.log('   Current state:');
    console.log('   - Column:', currentState.COLUMN_NAME);
    console.log('   - Type:', currentState.COLUMN_TYPE);
    console.log('   - Nullable:', currentState.IS_NULLABLE);
    console.log('   - Key:', currentState.COLUMN_KEY || 'None');
    console.log('');

    if (currentState.IS_NULLABLE === 'YES') {
      console.log('✅ Migration already applied: approver_id already allows NULL');
      console.log('   No changes needed.\n');
      await connection.commit();
      return;
    }

    // Execute migration
    console.log('🔧 Executing migration...');
    console.log('   Step 1: Dropping foreign key constraint...');
    await connection.query('ALTER TABLE approval_history DROP FOREIGN KEY approval_history_ibfk_2');
    console.log('   ✅ Foreign key dropped');

    console.log('   Step 2: Modifying approver_id to allow NULL...');
    await connection.query('ALTER TABLE approval_history MODIFY COLUMN approver_id INT NULL');
    console.log('   ✅ Column modified');

    console.log('   Step 3: Re-adding foreign key with ON DELETE SET NULL...');
    await connection.query(`
      ALTER TABLE approval_history 
      ADD CONSTRAINT approval_history_ibfk_2 
      FOREIGN KEY (approver_id) REFERENCES users(id) 
      ON DELETE SET NULL
    `);
    console.log('   ✅ Foreign key re-added');

    console.log('   Step 4: Adding performance index...');
    try {
      await connection.query('CREATE INDEX idx_approver_id ON approval_history(approver_id)');
      console.log('   ✅ Index created');
    } catch (indexError) {
      if (indexError.code === 'ER_DUP_KEYNAME') {
        console.log('   ℹ️  Index already exists, skipping');
      } else {
        throw indexError;
      }
    }
    console.log('');

    // Verify migration
    console.log('✅ Verifying migration...');
    const [newColumns] = await connection.query(`
      SELECT COLUMN_NAME, IS_NULLABLE, COLUMN_TYPE
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? 
        AND TABLE_NAME = 'approval_history' 
        AND COLUMN_NAME = 'approver_id'
    `, [dbConfig.database]);

    const newState = newColumns[0];
    console.log('   New state:');
    console.log('   - Column:', newState.COLUMN_NAME);
    console.log('   - Type:', newState.COLUMN_TYPE);
    console.log('   - Nullable:', newState.IS_NULLABLE);
    console.log('');

    if (newState.IS_NULLABLE !== 'YES') {
      throw new Error('Migration verification failed: approver_id still does not allow NULL');
    }

    console.log('✅ Migration verification successful\n');

    // Commit transaction
    await connection.commit();
    console.log('✅ Transaction committed\n');

    // Summary
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🎉 MIGRATION COMPLETED SUCCESSFULLY');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ approval_history.approver_id now allows NULL');
    console.log('✅ Foreign key constraint updated (ON DELETE SET NULL)');
    console.log('✅ Performance index added');
    console.log('✅ VC Magic Link approvals can now be logged');
    console.log('═══════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('\n❌ ERROR OCCURRED:', error.message);
    console.error('');

    if (connection) {
      console.log('🔄 Rolling back transaction...');
      await connection.rollback();
      console.log('✅ Transaction rolled back - no changes made\n');
    }

    console.error('Stack trace:', error.stack);
    process.exit(1);

  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Execute migration
console.log('\n');
console.log('═══════════════════════════════════════════════════════════');
console.log('  APPROVAL HISTORY MIGRATION - MODULE 4');
console.log('═══════════════════════════════════════════════════════════');
console.log('');
console.log('This migration will:');
console.log('✅ Allow NULL values in approval_history.approver_id');
console.log('✅ Update foreign key constraint to ON DELETE SET NULL');
console.log('✅ Add performance index');
console.log('');
console.log('This is required for VC Magic Link approvals.');
console.log('');

runMigration()
  .then(() => {
    console.log('✅ Migration script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration script failed:', error.message);
    process.exit(1);
  });
