/**
 * Smart Database Migration Script: V3 to V4
 * 
 * This script intelligently migrates the database by:
 * 1. Checking if columns/tables exist before adding them
 * 2. Handling duplicate column errors gracefully
 * 3. Using INFORMATION_SCHEMA queries instead of DELIMITER/stored procedures
 * 
 * Usage: node backend/database/run_migration_smart.js
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(80));
  log(title, 'bright');
  console.log('='.repeat(80));
}

async function columnExists(connection, tableName, columnName, dbName) {
  const [rows] = await connection.query(`
    SELECT COUNT(*) as count
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = ?
      AND TABLE_NAME = ?
      AND COLUMN_NAME = ?
  `, [dbName, tableName, columnName]);
  return rows[0].count > 0;
}

async function tableExists(connection, tableName, dbName) {
  const [rows] = await connection.query(`
    SELECT COUNT(*) as count
    FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_SCHEMA = ?
      AND TABLE_NAME = ?
  `, [dbName, tableName]);
  return rows[0].count > 0;
}

async function addColumnIfNotExists(connection, tableName, columnName, columnDef, dbName) {
  const exists = await columnExists(connection, tableName, columnName, dbName);
  if (exists) {
    log(`  ⏭️  ${tableName}.${columnName} already exists, skipping`, 'yellow');
    return false;
  }
  
  try {
    await connection.query(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDef}`);
    log(`  ✅ Added ${tableName}.${columnName}`, 'green');
    return true;
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      log(`  ⏭️  ${tableName}.${columnName} already exists (race condition), skipping`, 'yellow');
      return false;
    }
    throw error;
  }
}

async function createTableIfNotExists(connection, tableName, createSQL, dbName) {
  const exists = await tableExists(connection, tableName, dbName);
  if (exists) {
    log(`  ⏭️  Table ${tableName} already exists, skipping`, 'yellow');
    return false;
  }
  
  await connection.query(createSQL);
  log(`  ✅ Created table ${tableName}`, 'green');
  return true;
}

async function runMigration() {
  let connection;

  try {
    logSection('Campus Connect Database Migration: V3 to V4 (Smart)');
    
    const dbName = process.env.DB_NAME || 'campus_connect';
    
    // Step 1: Connect to database
    log('\n📡 Connecting to database...', 'cyan');
    log(`  Host: ${process.env.DB_HOST || 'localhost'}`, 'blue');
    log(`  Database: ${dbName}`, 'blue');
    log(`  User: ${process.env.DB_USER || 'root'}`, 'blue');
    
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD,
      database: dbName
    });
    log('✅ Connected successfully', 'green');

    // Step 2: Add new columns to users table
    logSection('Step 1: Updating users table');
    
    await addColumnIfNotExists(connection, 'users', 'email_verified', 
      'BOOLEAN DEFAULT FALSE', dbName);
    
    await addColumnIfNotExists(connection, 'users', 'profile_picture', 
      'VARCHAR(500)', dbName);
    
    await addColumnIfNotExists(connection, 'users', 'bio', 
      'TEXT', dbName);
    
    await addColumnIfNotExists(connection, 'users', 'phone', 
      'VARCHAR(20)', dbName);
    
    await addColumnIfNotExists(connection, 'users', 'last_login', 
      'TIMESTAMP NULL', dbName);
    
    await addColumnIfNotExists(connection, 'users', 'updated_at', 
      'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP', dbName);

    // Step 3: Create new tables
    logSection('Step 2: Creating new tables');
    
    // refresh_tokens table
    await createTableIfNotExists(connection, 'refresh_tokens', `
      CREATE TABLE refresh_tokens (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        token VARCHAR(500) NOT NULL UNIQUE,
        expires_at TIMESTAMP NOT NULL,
        revoked BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_token (token),
        INDEX idx_user_id (user_id),
        INDEX idx_expires_at (expires_at)
      )
    `, dbName);
    
    // password_reset_tokens table
    await createTableIfNotExists(connection, 'password_reset_tokens', `
      CREATE TABLE password_reset_tokens (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        token VARCHAR(500) NOT NULL UNIQUE,
        expires_at TIMESTAMP NOT NULL,
        used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_token (token),
        INDEX idx_user_id (user_id)
      )
    `, dbName);
    
    // notifications table
    await createTableIfNotExists(connection, 'notifications', `
      CREATE TABLE notifications (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        type ENUM('PROPOSAL_STATUS', 'COMMENT', 'ASSIGNMENT', 'SYSTEM') NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        related_id INT,
        sender_id INT,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_user_id (user_id),
        INDEX idx_is_read (is_read),
        INDEX idx_created_at (created_at)
      )
    `, dbName);
    
    // notification_preferences table
    await createTableIfNotExists(connection, 'notification_preferences', `
      CREATE TABLE notification_preferences (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL UNIQUE,
        email_notifications BOOLEAN DEFAULT TRUE,
        push_notifications BOOLEAN DEFAULT TRUE,
        proposal_status_change BOOLEAN DEFAULT TRUE,
        new_comment BOOLEAN DEFAULT TRUE,
        assignment_notification BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `, dbName);
    
    // proposal_comments table
    await createTableIfNotExists(connection, 'proposal_comments', `
      CREATE TABLE proposal_comments (
        id INT PRIMARY KEY AUTO_INCREMENT,
        proposal_id INT NOT NULL,
        user_id INT NOT NULL,
        comment TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (proposal_id) REFERENCES proposals(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_proposal_id (proposal_id),
        INDEX idx_user_id (user_id)
      )
    `, dbName);
    
    // draft_proposals table
    await createTableIfNotExists(connection, 'draft_proposals', `
      CREATE TABLE draft_proposals (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        society_id INT NOT NULL,
        title VARCHAR(255),
        description TEXT,
        event_date DATE,
        budget_requested DECIMAL(10, 2),
        draft_data JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (society_id) REFERENCES societies(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_society_id (society_id)
      )
    `, dbName);
    
    // budget_allocations table
    await createTableIfNotExists(connection, 'budget_allocations', `
      CREATE TABLE budget_allocations (
        id INT PRIMARY KEY AUTO_INCREMENT,
        society_id INT NOT NULL,
        financial_year INT NOT NULL,
        allocated_amount DECIMAL(12, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (society_id) REFERENCES societies(id) ON DELETE CASCADE,
        UNIQUE KEY unique_society_year (society_id, financial_year),
        INDEX idx_financial_year (financial_year)
      )
    `, dbName);
    
    // saved_search_filters table
    await createTableIfNotExists(connection, 'saved_search_filters', `
      CREATE TABLE saved_search_filters (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        filters JSON NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id)
      )
    `, dbName);
    
    // calendar_events table
    await createTableIfNotExists(connection, 'calendar_events', `
      CREATE TABLE calendar_events (
        id INT PRIMARY KEY AUTO_INCREMENT,
        proposal_id INT NOT NULL UNIQUE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        event_date DATE NOT NULL,
        start_time TIME,
        end_time TIME,
        location VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (proposal_id) REFERENCES proposals(id) ON DELETE CASCADE,
        INDEX idx_event_date (event_date)
      )
    `, dbName);
    
    // activity_logs table
    await createTableIfNotExists(connection, 'activity_logs', `
      CREATE TABLE activity_logs (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        action VARCHAR(100) NOT NULL,
        entity_type VARCHAR(50) NOT NULL,
        entity_id INT,
        details JSON,
        ip_address VARCHAR(45),
        user_agent VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_entity (entity_type, entity_id),
        INDEX idx_created_at (created_at)
      )
    `, dbName);

    // Step 4: Verify migration
    logSection('Step 3: Verifying Migration');
    
    // Check new columns in users table
    log('\n🔍 Checking users table columns...', 'cyan');
    const expectedColumns = ['email_verified', 'profile_picture', 'bio', 'phone', 'last_login', 'updated_at'];
    
    let allColumnsFound = true;
    for (const col of expectedColumns) {
      const exists = await columnExists(connection, 'users', col, dbName);
      if (exists) {
        log(`  ✅ ${col}`, 'green');
      } else {
        log(`  ❌ ${col} - MISSING`, 'red');
        allColumnsFound = false;
      }
    }

    // Check new tables
    log('\n🔍 Checking new tables...', 'cyan');
    const expectedTables = [
      'refresh_tokens',
      'password_reset_tokens',
      'notifications',
      'notification_preferences',
      'proposal_comments',
      'draft_proposals',
      'budget_allocations',
      'saved_search_filters',
      'calendar_events',
      'activity_logs'
    ];

    let allTablesFound = true;
    for (const table of expectedTables) {
      const exists = await tableExists(connection, table, dbName);
      if (exists) {
        log(`  ✅ ${table}`, 'green');
      } else {
        log(`  ❌ ${table} - MISSING`, 'red');
        allTablesFound = false;
      }
    }

    // Check database statistics
    log('\n📊 Database statistics:', 'cyan');
    const [userCount] = await connection.query('SELECT COUNT(*) as count FROM users');
    log(`  Users: ${userCount[0].count}`, 'blue');

    const [proposalCount] = await connection.query('SELECT COUNT(*) as count FROM proposals');
    log(`  Proposals: ${proposalCount[0].count}`, 'blue');

    const [societyCount] = await connection.query('SELECT COUNT(*) as count FROM societies');
    log(`  Societies: ${societyCount[0].count}`, 'blue');

    // Step 5: Success message
    if (allColumnsFound && allTablesFound) {
      logSection('Migration Complete! 🎉');
      log('\n✅ Database successfully upgraded from V3 to V4', 'green');
      log('\nNew features enabled:', 'cyan');
      log('  • Email verification', 'blue');
      log('  • Password reset', 'blue');
      log('  • Refresh tokens', 'blue');
      log('  • In-app notifications', 'blue');
      log('  • Proposal comments', 'blue');
      log('  • Draft proposals', 'blue');
      log('  • Budget allocations', 'blue');
      log('  • Calendar events', 'blue');
      log('  • Activity logging', 'blue');

      log('\n⚠️  Important notes:', 'yellow');
      log('  • All existing users have email_verified = FALSE', 'yellow');
      log('  • Users can now use forgot password feature', 'yellow');
      log('  • Restart your server to apply changes', 'yellow');
      
      process.exit(0);
    } else {
      logSection('Migration Incomplete ⚠️');
      log('\nSome tables or columns are missing. Please check the errors above.', 'yellow');
      process.exit(1);
    }

  } catch (error) {
    logSection('Migration Failed ❌');
    log('\nError details:', 'red');
    console.error(error);
    
    log('\n💡 Troubleshooting tips:', 'yellow');
    log('  1. Check your database credentials in .env file', 'yellow');
    log('  2. Ensure MySQL server is running', 'yellow');
    log('  3. Verify you have sufficient database permissions', 'yellow');
    log('  4. Check if database "campus_connect" exists', 'yellow');
    log('  5. Review the error message above for specific issues', 'yellow');
    
    if (error.code === 'ECONNREFUSED') {
      log('\n❌ Cannot connect to MySQL server', 'red');
      log('   Make sure MySQL is running on ' + (process.env.DB_HOST || 'localhost'), 'yellow');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      log('\n❌ Access denied - check your credentials', 'red');
      log('   User: ' + (process.env.DB_USER || 'root'), 'yellow');
      log('   Database: ' + (process.env.DB_NAME || 'campus_connect'), 'yellow');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      log('\n❌ Database does not exist', 'red');
      log('   Create it with: CREATE DATABASE campus_connect;', 'yellow');
    }
    
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      log('\n📡 Database connection closed', 'cyan');
    }
  }
}

// Run migration
log('Starting smart migration...', 'cyan');
runMigration().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
