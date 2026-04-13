const pool = require('./config/database');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

async function promoteToSystemAdmin() {
  let connection;
  
  try {
    // Get a connection from the pool
    connection = await pool.getConnection();
    
    console.log('🔌 Connected to database...\n');

    // Check if user exists first
    const [users] = await connection.execute(
      'SELECT id, name, email, role FROM users WHERE email = ?',
      ['director.ssc@uog.edu.pk']
    );

    if (users.length === 0) {
      console.log('❌ ERROR: User with email director.ssc@uog.edu.pk not found in database!');
      console.log('💡 Please verify the email address or create the user first.\n');
      return;
    }

    console.log('📋 Current user details:');
    console.log(`   ID: ${users[0].id}`);
    console.log(`   Name: ${users[0].name}`);
    console.log(`   Email: ${users[0].email}`);
    console.log(`   Current Role: ${users[0].role}\n`);

    // Update the user role to SYSTEM_ADMIN
    const [result] = await connection.execute(
      'UPDATE users SET role = ? WHERE email = ?',
      ['SYSTEM_ADMIN', 'director.ssc@uog.edu.pk']
    );

    if (result.affectedRows > 0) {
      console.log('✅ SUCCESS: director.ssc@uog.edu.pk is now the SYSTEM_ADMIN!\n');
      
      // Verify the update
      const [updatedUsers] = await connection.execute(
        'SELECT id, name, email, role FROM users WHERE email = ?',
        ['director.ssc@uog.edu.pk']
      );
      
      console.log('📋 Updated user details:');
      console.log(`   ID: ${updatedUsers[0].id}`);
      console.log(`   Name: ${updatedUsers[0].name}`);
      console.log(`   Email: ${updatedUsers[0].email}`);
      console.log(`   New Role: ${updatedUsers[0].role}\n`);
    } else {
      console.log('⚠️  WARNING: No rows were updated. User may already be SYSTEM_ADMIN.\n');
    }

  } catch (error) {
    console.error('❌ ERROR:', error.message);
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

// Execute the promotion
promoteToSystemAdmin()
  .then(() => {
    console.log('🎉 Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });
