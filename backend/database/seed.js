require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'campus_connect',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

/**
 * Generate acronym from society name
 * Example: "Hayatian Blood Society" -> "hbs"
 */
function generateAcronym(societyName) {
  // Remove content in parentheses if exists
  const cleanName = societyName.replace(/\([^)]*\)/g, '').trim();
  
  // Split by spaces and take first letter of each word
  const words = cleanName.split(' ').filter(word => word.length > 0);
  const acronym = words.map(word => word[0].toLowerCase()).join('');
  
  return acronym;
}

/**
 * Parse CSV file and return array of societies
 */
function parseCSV(filePath) {
  return new Promise((resolve, reject) => {
    const societies = [];
    
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        societies.push({
          name: row['Society Name'],
          president: row['President'],
          purpose: row['Purpose']
        });
      })
      .on('end', () => {
        resolve(societies);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}

async function seedDatabase() {
  const connection = await pool.getConnection();

  try {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║   Campus Connect v4.0 - CSV-Based Database Seeding        ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log('');

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    await connection.query('TRUNCATE TABLE approval_history');
    await connection.query('TRUNCATE TABLE proposal_attachments');
    await connection.query('TRUNCATE TABLE proposals');
    await connection.query('TRUNCATE TABLE society_roles');
    await connection.query('TRUNCATE TABLE societies');
    await connection.query('TRUNCATE TABLE users');
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('✓ Database cleared');
    console.log('');

    // Hash password once for all users
    const hashedPassword = await bcrypt.hash('password123', 10);

    // ===== STEP 1: CREATE ADMIN ACCOUNTS =====
    console.log('👑 Creating Admin Accounts...');
    
    const adminAccounts = [
      { name: 'Vice Chancellor', email: 'vc@uog.edu.pk', roll_number: 'ADMIN-VC', role: 'VC' },
      { name: 'Registrar', email: 'registrar@uog.edu.pk', roll_number: 'ADMIN-REG', role: 'REGISTRAR' },
      { name: 'Director SSC', email: 'director.ssc@uog.edu.pk', roll_number: 'ADMIN-DIR', role: 'DIRECTOR_SSC' },
      { name: 'Finance Secretary', email: 'finance@uog.edu.pk', roll_number: 'ADMIN-FIN', role: 'FINANCE_SECRETARY' },
      { name: 'Assistant Director', email: 'asst.director@uog.edu.pk', roll_number: 'ADMIN-ASST', role: 'ASST_DIRECTOR' },
    ];

    const userIds = {};
    for (const admin of adminAccounts) {
      const [result] = await connection.query(
        'INSERT INTO users (name, email, password_hash, roll_number, role, is_active) VALUES (?, ?, ?, ?, ?, TRUE)',
        [admin.name, admin.email, hashedPassword, admin.roll_number, admin.role]
      );
      userIds[admin.email] = result.insertId;
      console.log(`   ✓ ${admin.role}: ${admin.email}`);
    }
    console.log('');

    // ===== STEP 2: PARSE CSV FILE =====
    console.log('📄 Reading UOG_Societies.csv...');
    const csvPath = path.join(__dirname, 'UOG_Societies.csv');
    const csvSocieties = await parseCSV(csvPath);
    console.log(`   ✓ Found ${csvSocieties.length} societies in CSV`);
    console.log('');

    // ===== STEP 3: CREATE SOCIETIES AND PRESIDENTS =====
    console.log('🏛️  Creating Societies and President Accounts...');
    
    const societyIds = {};
    let presidentCount = 0;

    for (const csvSociety of csvSocieties) {
      const societyName = csvSociety.name;
      const presidentName = csvSociety.president;
      const acronym = generateAcronym(societyName);

      // Create society (no coordinator for now)
      const [societyResult] = await connection.query(
        'INSERT INTO societies (name, coordinator_id) VALUES (?, NULL)',
        [societyName]
      );
      const societyId = societyResult.insertId;
      societyIds[societyName] = societyId;

      // Create president account ONLY (ignore VP and GS)
      if (presidentName && presidentName.trim() !== '' && presidentName !== '—') {
        const presidentEmail = `president.${acronym}@uog.edu.pk`;
        const presidentRoll = `PRES-${acronym.toUpperCase()}`;

        // Create president user
        const [userResult] = await connection.query(
          'INSERT INTO users (name, email, password_hash, roll_number, role, is_active) VALUES (?, ?, ?, ?, ?, TRUE)',
          [presidentName, presidentEmail, hashedPassword, presidentRoll, 'STUDENT']
        );
        const presidentUserId = userResult.insertId;

        // Create society role for president
        await connection.query(
          'INSERT INTO society_roles (society_id, user_id, role_name, is_core_leader) VALUES (?, ?, ?, TRUE)',
          [societyId, presidentUserId, 'PRESIDENT']
        );

        presidentCount++;
        console.log(`   ✓ ${societyName}`);
        console.log(`      President: ${presidentName} (${presidentEmail})`);
      } else {
        console.log(`   ✓ ${societyName} (No president in CSV)`);
      }
    }
    console.log('');
    console.log(`   Total: ${csvSocieties.length} societies, ${presidentCount} presidents created`);
    console.log('');

    // ===== STEP 4: CREATE SAMPLE PROPOSALS =====
    console.log('📝 Creating Sample Proposals...');
    
    // Get first 3 presidents for sample proposals
    const [presidents] = await connection.query(`
      SELECT u.id, u.name, u.email, s.id as society_id, s.name as society_name
      FROM users u
      JOIN society_roles sr ON u.id = sr.user_id
      JOIN societies s ON sr.society_id = s.id
      WHERE sr.role_name = 'PRESIDENT'
      LIMIT 3
    `);

    const sampleProposals = [
      {
        title: 'Annual Blood Donation Drive 2026',
        description: 'Organizing a campus-wide blood donation campaign to support local hospitals and save lives.',
        event_date: '2026-05-15',
        budget: 15000
      },
      {
        title: 'Inter-University Debate Championship',
        description: 'Hosting a prestigious debate competition with participation from 10+ universities.',
        event_date: '2026-06-20',
        budget: 25000
      },
      {
        title: 'Cultural Festival 2026',
        description: 'A three-day cultural extravaganza showcasing music, art, and traditional performances.',
        event_date: '2026-07-10',
        budget: 50000
      }
    ];

    for (let i = 0; i < Math.min(presidents.length, sampleProposals.length); i++) {
      const president = presidents[i];
      const proposal = sampleProposals[i];

      await connection.query(
        `INSERT INTO proposals (society_id, user_id, title, description, event_date, budget_requested, current_status) 
         VALUES (?, ?, ?, ?, ?, ?, 'PENDING_DIRECTOR_SSC')`,
        [president.society_id, president.id, proposal.title, proposal.description, proposal.event_date, proposal.budget]
      );

      console.log(`   ✓ "${proposal.title}" by ${president.society_name}`);
    }
    console.log('');

    // ===== SEEDING COMPLETE =====
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║              ✅ SEEDING COMPLETED SUCCESSFULLY              ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log('');
    console.log('📋 LOGIN CREDENTIALS (All passwords: password123)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('👑 ADMIN ACCOUNTS:');
    adminAccounts.forEach(admin => {
      console.log(`   ${admin.role.padEnd(25)} ${admin.email}`);
    });
    console.log('');
    console.log('🎓 PRESIDENT ACCOUNTS (Sample):');
    for (let i = 0; i < Math.min(5, csvSocieties.length); i++) {
      const society = csvSocieties[i];
      const acronym = generateAcronym(society.name);
      console.log(`   ${society.name.padEnd(35)} president.${acronym}@uog.edu.pk`);
    }
    if (csvSocieties.length > 5) {
      console.log(`   ... and ${csvSocieties.length - 5} more presidents`);
    }
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('📊 SUMMARY:');
    console.log(`   • Admin Accounts: ${adminAccounts.length}`);
    console.log(`   • Societies: ${csvSocieties.length}`);
    console.log(`   • Presidents: ${presidentCount}`);
    console.log(`   • Sample Proposals: ${Math.min(presidents.length, sampleProposals.length)}`);
    console.log('');
    console.log('🚀 Ready to start the application!');
    console.log('');

  } catch (error) {
    console.error('');
    console.error('❌ ERROR DURING SEEDING:');
    console.error(error);
    console.error('');
    throw error;
  } finally {
    await connection.release();
    await pool.end();
  }
}

// Run seeder
seedDatabase().catch((error) => {
  console.error('Seeding failed:', error);
  process.exit(1);
});
