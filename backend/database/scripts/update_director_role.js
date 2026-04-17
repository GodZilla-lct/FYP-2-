const mysql = require('mysql2/promise');
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

async function updateDirectorRole() {
  let connection;
  
  try {
    // Create database connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'campus_connect'
    });

    console.log('Connected to database');

    // Check if user exists
    const [users] = await connection.execute(
      'SELECT id, email, role FROM users WHERE email = ?',
      ['director@uog.edu.pk']
    );

    if (users.length === 0) {
      console.log('❌ User with email director@uog.edu.pk not found');
      return;
    }

    console.log('Current user details:', users[0]);

    // Update user role to SYSTEM_ADMIN
    const [result] = await connection.execute(
      'UPDATE users SET role = ? WHERE email = ?',
      ['SYSTEM_ADMIN', 'director@uog.edu.pk']
    );

    console.log('✅ Update successful!');
    console.log(`Rows affected: ${result.affectedRows}`);

    // Verify the update
    const [updatedUsers] = await connection.execute(
      'SELECT id, email, role FROM users WHERE email = ?',
      ['director@uog.edu.pk']
    );

    console.log('Updated user details:', updatedUsers[0]);

  } catch (error) {
    console.error('❌ Error updating director role:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed');
    }
  }
}

// Run the update
updateDirectorRole()
  .then(() => {
    console.log('\n✅ Director role update completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Director role update failed:', error);
    process.exit(1);
  });
