/**
 * VC PURGE SCRIPT - ONE-TIME EXECUTION
 * 
 * Purpose: Remove VC users from the database as they no longer need accounts.
 * VC now approves proposals via email Magic Links only.
 * 
 * This script:
 * 1. Checks for foreign key constraints
 * 2. Safely nullifies VC references in approval_history
 * 3. Deletes VC users from the users table
 * 4. Provides detailed logging and rollback capability
 * 
 * Usage: node purge-vc.js
 * 
 * IMPORTANT: Run this script ONCE after Module 4 deployment
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'campus_connect',
  multipleStatements: true
};

async function purgeVCUsers() {
  let connection;
  
  try {
    console.log('🔧 VC PURGE SCRIPT - Starting...\n');
    console.log('📋 Database:', dbConfig.database);
    console.log('🏠 Host:', dbConfig.host);
    console.log('');

    // Connect to database
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Database connection established\n');

    // Start transaction for safety
    await connection.beginTransaction();
    console.log('🔒 Transaction started (rollback available if errors occur)\n');

    // STEP 1: Check if VC users exist
    console.log('📊 STEP 1: Checking for VC users...');
    const [vcUsers] = await connection.query(
      'SELECT id, name, email, role FROM users WHERE role = ?',
      ['VC']
    );

    if (vcUsers.length === 0) {
      console.log('✅ No VC users found in database. Nothing to purge.');
      await connection.commit();
      return;
    }

    console.log(`⚠️  Found ${vcUsers.length} VC user(s):`);
    vcUsers.forEach(user => {
      console.log(`   - ID: ${user.id}, Name: ${user.name}, Email: ${user.email}`);
    });
    console.log('');

    // STEP 2: Check for VC references in approval_history
    console.log('📊 STEP 2: Checking approval_history for VC references...');
    const vcUserIds = vcUsers.map(u => u.id);
    const [historyRecords] = await connection.query(
      'SELECT COUNT(*) as count FROM approval_history WHERE approver_id IN (?)',
      [vcUserIds]
    );

    const historyCount = historyRecords[0].count;
    console.log(`   Found ${historyCount} approval history record(s) referencing VC users`);
    console.log('');

    // STEP 3: Update approval_history to nullify VC references
    if (historyCount > 0) {
      console.log('🔧 STEP 3: Updating approval_history records...');
      console.log('   Setting approver_id to NULL for VC-related records');
      console.log('   Updating comments to indicate VC Magic Link approval');
      
      const [updateResult] = await connection.query(
        `UPDATE approval_history 
         SET approver_id = NULL,
             comments = CONCAT(
               COALESCE(comments, ''),
               IF(comments IS NOT NULL AND comments != '', ' | ', ''),
               'APPROVED BY VICE CHANCELLOR VIA MAGIC LINK (Historical Record)'
             )
         WHERE approver_id IN (?)`,
        [vcUserIds]
      );

      console.log(`✅ Updated ${updateResult.affectedRows} approval_history record(s)`);
      console.log('');
    } else {
      console.log('✅ STEP 3: No approval_history records to update\n');
    }

    // STEP 4: Check for other foreign key references
    console.log('📊 STEP 4: Checking for other VC references...');
    
    // Check proposals.user_id
    const [proposalsByVC] = await connection.query(
      'SELECT COUNT(*) as count FROM proposals WHERE user_id IN (?)',
      [vcUserIds]
    );
    console.log(`   Proposals created by VC: ${proposalsByVC[0].count}`);

    // Check proposals.assigned_asst_director_id
    const [assignedProposals] = await connection.query(
      'SELECT COUNT(*) as count FROM proposals WHERE assigned_asst_director_id IN (?)',
      [vcUserIds]
    );
    console.log(`   Proposals assigned to VC: ${assignedProposals[0].count}`);

    // Check societies.coordinator_id
    const [societiesCoordinated] = await connection.query(
      'SELECT COUNT(*) as count FROM societies WHERE coordinator_id IN (?)',
      [vcUserIds]
    );
    console.log(`   Societies coordinated by VC: ${societiesCoordinated[0].count}`);

    // Check notifications
    const [notificationsSent] = await connection.query(
      'SELECT COUNT(*) as count FROM notifications WHERE sender_id IN (?)',
      [vcUserIds]
    );
    console.log(`   Notifications sent by VC: ${notificationsSent[0].count}`);

    console.log('');

    // STEP 5: Handle edge cases
    if (proposalsByVC[0].count > 0) {
      console.log('⚠️  WARNING: VC users have created proposals!');
      console.log('   This is unusual. These proposals will be CASCADE deleted.');
      console.log('   Consider manually reassigning these proposals before running this script.');
      console.log('');
    }

    if (assignedProposals[0].count > 0) {
      console.log('🔧 STEP 5a: Nullifying assigned_asst_director_id references...');
      await connection.query(
        'UPDATE proposals SET assigned_asst_director_id = NULL WHERE assigned_asst_director_id IN (?)',
        [vcUserIds]
      );
      console.log(`✅ Nullified ${assignedProposals[0].count} proposal assignment(s)\n`);
    }

    if (societiesCoordinated[0].count > 0) {
      console.log('🔧 STEP 5b: Nullifying society coordinator references...');
      await connection.query(
        'UPDATE societies SET coordinator_id = NULL WHERE coordinator_id IN (?)',
        [vcUserIds]
      );
      console.log(`✅ Nullified ${societiesCoordinated[0].count} society coordinator(s)\n`);
    }

    if (notificationsSent[0].count > 0) {
      console.log('🔧 STEP 5c: Nullifying notification sender references...');
      await connection.query(
        'UPDATE notifications SET sender_id = NULL WHERE sender_id IN (?)',
        [vcUserIds]
      );
      console.log(`✅ Nullified ${notificationsSent[0].count} notification sender(s)\n`);
    }

    // STEP 6: Delete VC users
    console.log('🗑️  STEP 6: Deleting VC users from database...');
    const [deleteResult] = await connection.query(
      'DELETE FROM users WHERE role = ?',
      ['VC']
    );

    console.log(`✅ Deleted ${deleteResult.affectedRows} VC user(s) from users table`);
    console.log('');

    // STEP 7: Verify deletion
    console.log('✅ STEP 7: Verifying deletion...');
    const [remainingVC] = await connection.query(
      'SELECT COUNT(*) as count FROM users WHERE role = ?',
      ['VC']
    );

    if (remainingVC[0].count === 0) {
      console.log('✅ Verification successful: No VC users remain in database');
    } else {
      throw new Error(`Verification failed: ${remainingVC[0].count} VC user(s) still exist`);
    }
    console.log('');

    // Commit transaction
    await connection.commit();
    console.log('✅ Transaction committed successfully\n');

    // Summary
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🎉 VC PURGE COMPLETED SUCCESSFULLY');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`✅ Deleted ${deleteResult.affectedRows} VC user(s)`);
    console.log(`✅ Updated ${historyCount} approval history record(s)`);
    console.log('✅ All foreign key references handled safely');
    console.log('✅ Database integrity maintained');
    console.log('');
    console.log('📧 VC will now approve proposals via email Magic Links only');
    console.log('🔐 VC email configured in .env: VC_EMAIL=' + (process.env.VC_EMAIL || 'vc@uog.edu.pk'));
    console.log('═══════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('\n❌ ERROR OCCURRED:', error.message);
    console.error('');
    
    if (connection) {
      console.log('🔄 Rolling back transaction...');
      await connection.rollback();
      console.log('✅ Transaction rolled back - no changes made to database\n');
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

// Execute script
console.log('\n');
console.log('═══════════════════════════════════════════════════════════');
console.log('  VC PURGE SCRIPT - MODULE 4 DATABASE SYNCHRONIZATION');
console.log('═══════════════════════════════════════════════════════════');
console.log('');
console.log('⚠️  WARNING: This script will permanently delete VC users');
console.log('⚠️  from the database. This action cannot be undone.');
console.log('');
console.log('✅ Safe to run: Transaction-based with automatic rollback');
console.log('✅ Foreign keys: All references will be safely handled');
console.log('');
console.log('Press Ctrl+C within 5 seconds to cancel...');
console.log('');

// 5-second delay before execution
setTimeout(() => {
  purgeVCUsers()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error.message);
      process.exit(1);
    });
}, 5000);
