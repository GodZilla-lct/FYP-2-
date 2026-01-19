require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'campus_connect',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

async function seedDatabase() {
  const connection = await pool.getConnection();

  try {
    console.log('Starting Campus Connect v3.0 database seeding...');

    // Clear existing data
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    await connection.query('TRUNCATE TABLE approval_history');
    await connection.query('TRUNCATE TABLE proposal_attachments');
    await connection.query('TRUNCATE TABLE proposals');
    await connection.query('TRUNCATE TABLE society_roles');
    await connection.query('TRUNCATE TABLE societies');
    await connection.query('TRUNCATE TABLE users');
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');

    const hashedPassword = await bcrypt.hash('password123', 10);

    // ===== SEED ADMIN USERS =====
    console.log('Seeding admin users...');
    
    const adminUsers = [
      { name: 'Director SSC', email: 'director.ssc@uog.edu.pk', roll_number: 'ADMIN001', role: 'DIRECTOR_SSC' },
      { name: 'Tariq Ejaz', email: 'tariq.ejaz@uog.edu.pk', roll_number: 'ADMIN002', role: 'ASST_DIRECTOR' },
      { name: 'Bilal Ashraf', email: 'bilal.ashraf@uog.edu.pk', roll_number: 'ADMIN003', role: 'ASST_DIRECTOR' },
      { name: 'Mian Khurrum Arshad', email: 'mian.khurrum@uog.edu.pk', roll_number: 'ADMIN004', role: 'ASST_DIRECTOR' },
      { name: 'Finance Secretary', email: 'finance.secretary@uog.edu.pk', roll_number: 'ADMIN005', role: 'FINANCE_SECRETARY' },
      { name: 'Registrar', email: 'registrar@uog.edu.pk', roll_number: 'ADMIN006', role: 'REGISTRAR' },
      { name: 'Vice Chancellor', email: 'vc@uog.edu.pk', roll_number: 'ADMIN007', role: 'VC' },
    ];

    const userIds = {};
    for (const user of adminUsers) {
      const [result] = await connection.query(
        'INSERT INTO users (name, email, password_hash, roll_number, role) VALUES (?, ?, ?, ?, ?)',
        [user.name, user.email, hashedPassword, user.roll_number, user.role]
      );
      userIds[user.email] = result.insertId;
    }

    // ===== SEED COORDINATORS =====
    console.log('Seeding coordinators...');
    
    const coordinators = [
      { name: 'Dr. Ahmad Hassan', email: 'ahmad.hassan@uog.edu.pk', roll_number: 'COORD001' },
      { name: 'Prof. Sarah Khan', email: 'sarah.khan@uog.edu.pk', roll_number: 'COORD002' },
      { name: 'Dr. Muhammad Ali', email: 'muhammad.ali@uog.edu.pk', roll_number: 'COORD003' },
      { name: 'Ms. Fatima Sheikh', email: 'fatima.sheikh@uog.edu.pk', roll_number: 'COORD004' },
      { name: 'Dr. Imran Malik', email: 'imran.malik@uog.edu.pk', roll_number: 'COORD005' },
    ];

    for (const coord of coordinators) {
      const [result] = await connection.query(
        'INSERT INTO users (name, email, password_hash, roll_number, role) VALUES (?, ?, ?, ?, ?)',
        [coord.name, coord.email, hashedPassword, coord.roll_number, 'COORDINATOR']
      );
      userIds[coord.email] = result.insertId;
    }

    // ===== SEED THE 12 REAL SOCIETIES =====
    console.log('Seeding the 12 real UOG societies...');
    
    const societies = [
      { name: 'Hayatian Blood Society', coordinator: 'ahmad.hassan@uog.edu.pk' },
      { name: 'UOG Debating Society', coordinator: 'sarah.khan@uog.edu.pk' },
      { name: 'Qalamkar Creative Writing Forum', coordinator: null }, // No coordinator
      { name: 'Hayatian Quiz Society', coordinator: 'muhammad.ali@uog.edu.pk' },
      { name: 'Hayatian Islamic Forum', coordinator: 'fatima.sheikh@uog.edu.pk' },
      { name: 'Character Building Society', coordinator: 'imran.malik@uog.edu.pk' },
      { name: 'Hayatian Science Society & Clubs', coordinator: null }, // No coordinator
      { name: 'Hayatian Law Moot Society', coordinator: 'ahmad.hassan@uog.edu.pk' },
      { name: 'Readers\' Club UOG', coordinator: 'sarah.khan@uog.edu.pk' },
      { name: 'Scholar Bridge Society', coordinator: null }, // No coordinator
      { name: 'UOG Urdu Society', coordinator: 'muhammad.ali@uog.edu.pk' },
      { name: 'UOG Music Society', coordinator: 'fatima.sheikh@uog.edu.pk' },
    ];

    const societyIds = {};
    for (const society of societies) {
      const coordinatorId = society.coordinator ? userIds[society.coordinator] : null;
      
      const [result] = await connection.query(
        'INSERT INTO societies (name, coordinator_id) VALUES (?, ?)',
        [society.name, coordinatorId]
      );
      societyIds[society.name] = result.insertId;
    }

    // ===== SEED SOCIETY LEADERS =====
    console.log('Seeding society leaders...');
    
    const societyLeaders = [
      // Hayatian Blood Society
      { society: 'Hayatian Blood Society', name: 'Ahmed Khan', roll: 'BS-CS-001', role: 'PRESIDENT', core: true },
      { society: 'Hayatian Blood Society', name: 'Fatima Ali', roll: 'BS-CS-002', role: 'VICE_PRESIDENT', core: true },
      { society: 'Hayatian Blood Society', name: 'Hassan Malik', roll: 'BS-CS-003', role: 'GENERAL_SECRETARY', core: true },
      { society: 'Hayatian Blood Society', name: 'Zainab Hussain', roll: 'BS-CS-004', role: 'MEDIA_HEAD', core: false },
      
      // UOG Debating Society
      { society: 'UOG Debating Society', name: 'Ali Raza', roll: 'BS-ENG-001', role: 'PRESIDENT', core: true },
      { society: 'UOG Debating Society', name: 'Sara Ahmed', roll: 'BS-ENG-002', role: 'VICE_PRESIDENT', core: true },
      { society: 'UOG Debating Society', name: 'Muhammad Usman', roll: 'BS-ENG-003', role: 'GENERAL_SECRETARY', core: true },
      
      // Qalamkar Creative Writing Forum (No coordinator)
      { society: 'Qalamkar Creative Writing Forum', name: 'Hira Khan', roll: 'BS-URDU-001', role: 'PRESIDENT', core: true },
      { society: 'Qalamkar Creative Writing Forum', name: 'Imran Malik', roll: 'BS-URDU-002', role: 'VICE_PRESIDENT', core: true },
      
      // Add more leaders for other societies...
      { society: 'Hayatian Quiz Society', name: 'Nida Farooq', roll: 'BS-MATH-001', role: 'PRESIDENT', core: true },
      { society: 'Hayatian Islamic Forum', name: 'Karim Hassan', roll: 'BS-ISL-001', role: 'PRESIDENT', core: true },
      { society: 'Character Building Society', name: 'Amina Siddiqui', roll: 'BS-PSY-001', role: 'PRESIDENT', core: true },
      { society: 'Hayatian Science Society & Clubs', name: 'Rashid Ahmed', roll: 'BS-PHY-001', role: 'PRESIDENT', core: true },
      { society: 'Hayatian Law Moot Society', name: 'Layla Khan', roll: 'LLB-001', role: 'PRESIDENT', core: true },
      { society: 'Readers\' Club UOG', name: 'Omar Sheikh', roll: 'BS-LIT-001', role: 'PRESIDENT', core: true },
      { society: 'Scholar Bridge Society', name: 'Ayesha Malik', roll: 'BS-EDU-001', role: 'PRESIDENT', core: true },
      { society: 'UOG Urdu Society', name: 'Bilal Hussain', roll: 'MA-URDU-001', role: 'PRESIDENT', core: true },
      { society: 'UOG Music Society', name: 'Sana Ahmed', roll: 'BS-MUS-001', role: 'PRESIDENT', core: true },
    ];

    for (const leader of societyLeaders) {
      // Create user
      const email = `${leader.roll.toLowerCase()}@uog.edu.pk`;
      const [userResult] = await connection.query(
        'INSERT INTO users (name, email, password_hash, roll_number, role) VALUES (?, ?, ?, ?, ?)',
        [leader.name, email, hashedPassword, leader.roll, 'STUDENT']
      );
      
      // Create society role
      await connection.query(
        'INSERT INTO society_roles (society_id, user_id, role_name, is_core_leader) VALUES (?, ?, ?, ?)',
        [societyIds[leader.society], userResult.insertId, leader.role, leader.core]
      );
    }

    // ===== SEED SAMPLE PROPOSALS =====
    console.log('Seeding sample proposals...');
    
    const sampleProposals = [
      {
        society: 'Hayatian Blood Society',
        user_roll: 'BS-CS-001',
        title: 'Blood Donation Drive 2026',
        description: 'Annual blood donation campaign to help local hospitals',
        event_date: '2026-03-15',
        budget: 15000
      },
      {
        society: 'UOG Debating Society',
        user_roll: 'BS-ENG-001',
        title: 'Inter-University Debate Championship',
        description: 'Hosting debate competition with 8 universities',
        event_date: '2026-04-20',
        budget: 25000
      },
      {
        society: 'UOG Music Society',
        user_roll: 'BS-MUS-001',
        title: 'Cultural Music Festival',
        description: 'Showcasing traditional and modern music',
        event_date: '2026-05-10',
        budget: 30000
      }
    ];

    for (const proposal of sampleProposals) {
      // Get user ID by roll number
      const [users] = await connection.query('SELECT id FROM users WHERE roll_number = ?', [proposal.user_roll]);
      if (users.length > 0) {
        const societyId = societyIds[proposal.society];
        const hasCoordinator = societies.find(s => s.name === proposal.society).coordinator !== null;
        const initialStatus = hasCoordinator ? 'PENDING_COORDINATOR' : 'PENDING_DIRECTOR_SSC';
        
        await connection.query(
          'INSERT INTO proposals (society_id, user_id, title, description, event_date, budget_requested, current_status) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [societyId, users[0].id, proposal.title, proposal.description, proposal.event_date, proposal.budget, initialStatus]
        );
      }
    }

    console.log('✓ Campus Connect v3.0 database seeding completed successfully!');
    console.log('');
    console.log('=== LOGIN CREDENTIALS ===');
    console.log('Admin: director.ssc@uog.edu.pk / password123');
    console.log('President: bs-cs-001@uog.edu.pk / password123');
    console.log('');
    console.log('=== SOCIETIES SEEDED ===');
    societies.forEach((s, i) => {
      console.log(`${i + 1}. ${s.name} ${s.coordinator ? '(Has Coordinator)' : '(No Coordinator)'}`);
    });

  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  } finally {
    await connection.release();
    await pool.end();
  }
}

seedDatabase().catch((error) => {
  console.error('Seeding failed:', error);
  process.exit(1);
});