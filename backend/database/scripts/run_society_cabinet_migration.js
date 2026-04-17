/**
 * Society Cabinet Migration Script
 * Creates the society_cabinet table for historical cabinet member records
 * 
 * This table is isolated from the users table and does not grant portal access
 */

require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'campus_connect',
  multipleStatements: true
};

async function runMigration() {
  let connection;
  
  try {
    console.log('========================================');
    console.log('  Society Cabinet Migration');
    console.log('========================================');
    console.log('');
    
    // Connect to database
    console.log('Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✓ Connected to database');
    console.log('');
    
    // Check if societies table exists
    console.log('Checking prerequisites...');
    const [societiesCheck] = await connection.query(
      "SHOW TABLES LIKE 'societies'"
    );
    
    if (societiesCheck.length === 0) {
      throw new Error('societies table does not exist. Please run schema.sql first.');
    }
    console.log('✓ societies table exists');
    
    // Check if users table exists
    const [usersCheck] = await connection.query(
      "SHOW TABLES LIKE 'users'"
    );
    
    if (usersCheck.length === 0) {
      throw new Error('users table does not exist. Please run schema.sql first.');
    }
    console.log('✓ users table exists');
    console.log('');
    
    // Check if society_cabinet table already exists
    console.log('Checking if society_cabinet table exists...');
    const [tableCheck] = await connection.query(
      "SHOW TABLES LIKE 'society_cabinet'"
    );
    
    if (tableCheck.length > 0) {
      console.log('⚠ society_cabinet table already exists');
      console.log('');
      
      // Show table structure
      const [columns] = await connection.query(
        "DESCRIBE society_cabinet"
      );
      console.log('Current table structure:');
      console.table(columns.map(col => ({
        Field: col.Field,
        Type: col.Type,
        Null: col.Null,
        Key: col.Key,
        Default: col.Default
      })));
      
      console.log('');
      console.log('Migration already applied. Skipping...');
      return;
    }
    
    // Read migration SQL file
    console.log('Reading migration file...');
    const migrationPath = path.join(__dirname, 'migrations', 'create_society_cabinet.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    console.log('✓ Migration file loaded');
    console.log('');
    
    // Execute migration
    console.log('Executing migration...');
    await connection.query(migrationSQL);
    console.log('✓ society_cabinet table created successfully');
    console.log('');
    
    // Verify table creation
    console.log('Verifying table structure...');
    const [columns] = await connection.query(
      "DESCRIBE society_cabinet"
    );
    
    console.log('Table structure:');
    console.table(columns.map(col => ({
      Field: col.Field,
      Type: col.Type,
      Null: col.Null,
      Key: col.Key,
      Default: col.Default
    })));
    
    console.log('');
    
    // Verify foreign keys
    console.log('Verifying foreign key constraints...');
    const [foreignKeys] = await connection.query(`
      SELECT 
        CONSTRAINT_NAME,
        COLUMN_NAME,
        REFERENCED_TABLE_NAME,
        REFERENCED_COLUMN_NAME
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = ? 
        AND TABLE_NAME = 'society_cabinet'
        AND REFERENCED_TABLE_NAME IS NOT NULL
    `, [dbConfig.database]);
    
    console.log('Foreign key constraints:');
    console.table(foreignKeys);
    
    console.log('');
    console.log('========================================');
    console.log('  Migration Completed Successfully!');
    console.log('========================================');
    console.log('');
    console.log('Next steps:');
    console.log('  1. Restart your backend server');
    console.log('  2. Implement API endpoints for cabinet management');
    console.log('  3. Create frontend UI for cabinet member management');
    console.log('');
    
  } catch (error) {
    console.error('');
    console.error('========================================');
    console.error('  Migration Failed!');
    console.error('========================================');
    console.error('');
    console.error('Error:', error.message);
    console.error('');
    
    if (error.code === 'ER_NO_SUCH_TABLE') {
      console.error('Hint: Make sure the societies and users tables exist.');
      console.error('Run: node backend/scripts/run_schema.js');
    } else if (error.code === 'ER_CANT_CREATE_TABLE') {
      console.error('Hint: Check database permissions and table constraints.');
    }
    
    console.error('');
    process.exit(1);
    
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed.');
    }
  }
}

// Run migration
runMigration();
