const mysql = require('mysql2/promise');
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

async function listUsers() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'campus_connect'
    });

    console.log('Connected to database\n');

    // Get all users
    const [users] = await connection.execute(
      'SELECT id, name, email, role FROM users ORDER BY role, name'
    );

    if (users.length === 0) {
      console.log('No users found in database');
      return;
    }

    console.log(`Found ${users.length} users:\n`);
    console.log('ID\tRole\t\t\tName\t\t\tEmail');
    console.log('='.repeat(100));
    
    users.forEach(user => {
      console.log(`${user.id}\t${user.role.padEnd(20)}\t${(user.name || 'N/A').padEnd(20)}\t${user.email}`);
    });

  } catch (error) {
    console.error('❌ Error listing users:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

listUsers()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
