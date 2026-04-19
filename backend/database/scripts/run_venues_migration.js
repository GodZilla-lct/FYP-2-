const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });

async function runVenuesMigration() {
  let connection;

  try {
    console.log('🔧 Starting Venues Migration...\n');

    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'campus_connect',
      multipleStatements: true
    });

    console.log('✅ Connected to database\n');

    // Read migration file
    const migrationPath = path.join(__dirname, '../migrations/create_venues.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Executing venues migration...\n');

    // Execute migration
    await connection.query(migrationSQL);

    console.log('✅ Venues table created successfully');
    console.log('✅ Initial venues seeded:');
    console.log('   - Main Auditorium');
    console.log('   - Hafiz Hayat Hall');
    console.log('   - SSC Ground');
    console.log('   - Departmental Grounds');
    console.log('   - Departmental Conference Halls');
    console.log('✅ venue_id column added to proposals table\n');

    // Verify venues
    const [venues] = await connection.query('SELECT * FROM venues ORDER BY name');
    console.log(`\n📊 Total venues in database: ${venues.length}\n`);

    console.log('🎉 Venues migration completed successfully!\n');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run migration
runVenuesMigration();
