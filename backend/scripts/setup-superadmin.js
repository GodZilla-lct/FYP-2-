const pool = require('./config/database');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

async function setupSuperAdmin() {
  let connection;
  
  try {
    // Get a connection from the pool
    connection = await pool.getConnection();
    
    console.log('🔌 Connected to database...\n');
    console.log('=' .repeat(60));
    console.log('STEP 1: REVERTING DIRECTOR SSC ROLE');
    console.log('=' .repeat(60));

    // Check if Director exists
    const [directorCheck] = await connection.execute(
      'SELECT id, name, email, role FROM users WHERE email = ?',
      ['director.ssc@uog.edu.pk']
    );

    if (directorCheck.length === 0) {
      console.log('⚠️  WARNING: Director SSC account not found in database');
      console.log('   Email: director.ssc@uog.edu.pk\n');
    } else {
      console.log('📋 Current Director details:');
      console.log(`   ID: ${directorCheck[0].id}`);
      console.log(`   Name: ${directorCheck[0].name}`);
      console.log(`   Email: ${directorCheck[0].email}`);
      console.log(`   Current Role: ${directorCheck[0].role}\n`);

      // Revert Director role back to DIRECTOR_SSC
      const [directorUpdate] = await connection.execute(
        'UPDATE users SET role = ? WHERE email = ?',
        ['DIRECTOR_SSC', 'director.ssc@uog.edu.pk']
      );

      if (directorUpdate.affectedRows > 0) {
        console.log('✅ SUCCESS: Director role reverted to DIRECTOR_SSC');
        
        // Verify the revert
        const [verifyDirector] = await connection.execute(
          'SELECT role FROM users WHERE email = ?',
          ['director.ssc@uog.edu.pk']
        );
        console.log(`   New Role: ${verifyDirector[0].role}\n`);
      } else {
        console.log('ℹ️  INFO: Director role was already DIRECTOR_SSC (no update needed)\n');
      }
    }

    console.log('=' .repeat(60));
    console.log('STEP 2: CREATING DEDICATED SYSTEM ADMIN ACCOUNT');
    console.log('=' .repeat(60));

    // Check if System Admin already exists
    const [adminCheck] = await connection.execute(
      'SELECT id, name, email, role FROM users WHERE email = ?',
      ['super.admin@uog.edu.pk']
    );

    if (adminCheck.length > 0) {
      console.log('⚠️  System Admin account already exists:');
      console.log(`   ID: ${adminCheck[0].id}`);
      console.log(`   Name: ${adminCheck[0].name}`);
      console.log(`   Email: ${adminCheck[0].email}`);
      console.log(`   Role: ${adminCheck[0].role}\n`);
      
      // Update existing account to ensure it has SYSTEM_ADMIN role
      const [updateExisting] = await connection.execute(
        'UPDATE users SET role = ?, name = ? WHERE email = ?',
        ['SYSTEM_ADMIN', 'System Administrator', 'super.admin@uog.edu.pk']
      );
      
      if (updateExisting.affectedRows > 0) {
        console.log('✅ Updated existing account to ensure SYSTEM_ADMIN role\n');
      }
    } else {
      console.log('🔐 Hashing password...');
      
      // Hash the password using bcrypt
      const hashedPassword = await bcrypt.hash('password123', 10);
      console.log('✅ Password hashed successfully\n');

      console.log('📝 Creating new System Admin account...');
      
      // Insert the new System Admin user
      const [insertResult] = await connection.execute(
        `INSERT INTO users (name, email, password_hash, role, is_active, created_at) 
         VALUES (?, ?, ?, ?, TRUE, NOW())`,
        ['System Administrator', 'super.admin@uog.edu.pk', hashedPassword, 'SYSTEM_ADMIN']
      );

      console.log('✅ SUCCESS: System Admin account created!');
      console.log(`   New User ID: ${insertResult.insertId}`);
      console.log(`   Name: System Administrator`);
      console.log(`   Email: super.admin@uog.edu.pk`);
      console.log(`   Password: password123`);
      console.log(`   Role: SYSTEM_ADMIN\n`);
    }

    console.log('=' .repeat(60));
    console.log('FINAL VERIFICATION');
    console.log('=' .repeat(60));

    // Verify both accounts
    const [finalCheck] = await connection.execute(
      `SELECT id, name, email, role 
       FROM users 
       WHERE email IN ('director.ssc@uog.edu.pk', 'super.admin@uog.edu.pk')
       ORDER BY role DESC`
    );

    console.log('\n📊 Current Account Status:\n');
    finalCheck.forEach(user => {
      console.log(`   ${user.role.padEnd(20)} | ${user.email.padEnd(30)} | ${user.name}`);
    });
    console.log('');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('Stack:', error.stack);
    throw error;
  } finally {
    // Release the connection back to the pool
    if (connection) {
      connection.release();
      console.log('🔌 Database connection released');
    }
    // Close the pool
    await pool.end();
    console.log('✅ Database pool closed\n');
  }
}

// Execute the setup
setupSuperAdmin()
  .then(() => {
    console.log('🎉 SETUP COMPLETED SUCCESSFULLY!');
    console.log('\n📌 IMPORTANT NOTES:');
    console.log('   1. Director SSC has been reverted to DIRECTOR_SSC role');
    console.log('   2. System Admin account is ready at: super.admin@uog.edu.pk');
    console.log('   3. Default password: password123 (CHANGE THIS IMMEDIATELY!)');
    console.log('   4. The System Admin is your dedicated IT "Middle Man" account\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 SETUP FAILED:', error.message);
    process.exit(1);
  });
