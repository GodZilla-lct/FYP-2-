require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');

async function runSchema() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'campus_connect',
    multipleStatements: true
  });

  try {
    console.log('Running Campus Connect v3.0 schema...');
    
    // Read and execute schema
    const schema = fs.readFileSync('./backend/database/schema.sql', 'utf8');
    await connection.query(schema);
    
    console.log('✓ Schema executed successfully!');
  } catch (error) {
    console.error('Error running schema:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

runSchema().catch((error) => {
  console.error('Schema execution failed:', error);
  process.exit(1);
});