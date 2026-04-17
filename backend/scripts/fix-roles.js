const pool = require('./config/database');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

async function fixRoles() {
  let connection;
  
  try {
    connection = await pool.getConnection();
    
    console.log('🔌 Connected to database...\n');
    console.log('=' .repeat(70));
    console.log('MODULE 2: THE CONTROL CENTRE - DATABASE FIX');
    console.log('=' .repeat(70));
    console.log('\n');

    // ===== ACTION 1: REVERT DIRECTOR SSC =====
    console.log('📋 ACTION 1: Reverting Director SSC Role');
    console.log('-'.repeat(70));

    const [directorCheck] = await connection.execute(
      'SELECT id, name, email, role FROM users WHERE email = ?',
      ['director.ssc@uog.edu.pk']
    );

    if (directorCheck.length === 0) {
      console.log('⚠️  WARNING: Director SSC account not found (director.ssc@uog.edu.pk)');
      console.log('   This account may need to be created separately.\n');
    } else {
      const director = directorCheck[0];
      console.log(`   Found: ${director.name} (${director.email})`);
      console.log(`   Current Role: ${director.role}`);

      if (director.role === 'SYSTEM_ADMIN') {
        await connection.execute(
          'UPDATE users SET role = ? WHERE email = ?',
          ['DIRECTOR_SSC', 'director.ssc@uog.edu.pk']
        );
        console.log('   ✅ Role reverted: SYSTEM_ADMIN → DIRECTOR_SSC\n');
      } else if (director.role === 'DIRECTOR_SSC') {
        console.log('   ✅ Already correct: DIRECTOR_SSC (no change needed)\n');
      } else {
        await connection.execute(
          'UPDATE users SET role = ? WHERE email = ?',
          ['DIRECTOR_SSC', 'director.ssc@uog.edu.pk']
        );
        console.log(`   ✅ Role updated: ${director.role} → DIRECTOR_SSC\n`);
      }
    }

    // ===== ACTION 2: CREATE SYSTEM ADMIN =====
    console.log('📋 ACTION 2: Creating System Admin (Middle Man)');
    console.log('-'.repeat(70));

    const [adminCheck] = await connection.execute(
      'SELECT id, name, email, role FROM users WHERE email = ?',
      ['super.admin@uog.edu.pk']
    );

    if (adminCheck.length > 0) {
      const admin = adminCheck[0];
      console.log(`   ⚠️  System Admin already exists:`);
      console.log(`   ID: ${admin.id}`);
      console.log(`   Name: ${admin.name}`);
      console.log(`   Email: ${admin.email}`);
      console.log(`   Role: ${admin.role}`);

      // Ensure role is correct
      if (admin.role !== 'SYSTEM_ADMIN') {
        await connection.execute(
          'UPDATE users SET role = ?, name = ? WHERE email = ?',
          ['SYSTEM_ADMIN', 'System Admin', 'super.admin@uog.edu.pk']
        );
        console.log(`   ✅ Role corrected: ${admin.role} → SYSTEM_ADMIN\n`);
      } else {
        console.log('   ✅ Role already correct: SYSTEM_ADMIN\n');
      }
    } else {
      console.log('   Creating new System Admin account...');
      
      // Hash password
      const hashedPassword = await bcrypt.hash('password123', 10);
      console.log('   🔐 Password hashed');

      // Insert new user
      const [insertResult] = await connection.execute(
        `INSERT INTO users (name, email, password_hash, role, is_active, created_at) 
         VALUES (?, ?, ?, ?, TRUE, NOW())`,
        ['System Admin', 'super.admin@uog.edu.pk', hashedPassword, 'SYSTEM_ADMIN']
      );

      console.log('   ✅ System Admin created successfully!');
      console.log(`   ID: ${insertResult.insertId}`);
      console.log(`   Name: System Admin`);
      console.log(`   Email: super.admin@uog.edu.pk`);
      console.log(`   Password: password123`);
      console.log(`   Role: SYSTEM_ADMIN\n`);
    }

    // ===== VERIFICATION =====
    console.log('=' .repeat(70));
    console.log('VERIFICATION: Current Account Status');
    console.log('=' .repeat(70));

    const [finalCheck] = await connection.execute(
      `SELECT id, name, email, role 
       FROM users 
       WHERE email IN ('director.ssc@uog.edu.pk', 'super.admin@uog.edu.pk')
       ORDER BY 
         CASE role
           WHEN 'SYSTEM_ADMIN' THEN 1
           WHEN 'DIRECTOR_SSC' THEN 2
           ELSE 3
         END`
    );

    if (finalCheck.length === 0) {
      console.log('\n⚠️  No accounts found. Please check database connection.\n');
    } else {
      console.log('\n');
      console.log('ID'.padEnd(6) + 'ROLE'.padEnd(22) + 'EMAIL'.padEnd(32) + 'NAME');
      console.log('-'.repeat(70));
      finalCheck.forEach(user => {
        console.log(
          String(user.id).padEnd(6) +
          user.role.padEnd(22) +
          user.email.padEnd(32) +
          user.name
        );
      });
      console.log('\n');
    }

    console.log('=' .repeat(70));
    console.log('✅ DATABASE FIX COMPLETED SUCCESSFULLY');
    console.log('=' .repeat(70));
    console.log('\n📌 IMPORTANT NOTES:');
    console.log('   1. Director SSC role has been set to DIRECTOR_SSC');
    console.log('   2. System Admin (Middle Man) is ready at: super.admin@uog.edu.pk');
    console.log('   3. Default password: password123');
    console.log('   4. ⚠️  CHANGE THE PASSWORD IMMEDIATELY AFTER FIRST LOGIN!');
    console.log('   5. System Admin has full control via /api/super/* endpoints\n');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('Stack:', error.stack);
    throw error;
  } finally {
    if (connection) {
      connection.release();
      console.log('🔌 Database connection closed\n');
    }
    await pool.end();
  }
}

// Execute the fix
fixRoles()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 FIX FAILED:', error.message);
    process.exit(1);
  });
