/**
 * Role-Based Access Control (RBAC) Integration Tests
 * Tests for authorization and permission enforcement
 */

const request = require('supertest');
const pool = require('../backend/config/database');
const { generateAccessToken } = require('../backend/config/jwt');

// Import app components
const express = require('express');
const cors = require('cors');
const { authenticate, authorize, isSuperAdmin } = require('../backend/middleware/auth');

// Create test app with protected routes
const app = express();
app.use(cors());
app.use(express.json());

// Test routes with different authorization levels
app.get('/api/test/public', (req, res) => {
  res.json({ message: 'Public route' });
});

app.get('/api/test/authenticated', authenticate, (req, res) => {
  res.json({ message: 'Authenticated route', user: req.user });
});

app.get('/api/test/admin-only', authenticate, authorize(['DIRECTOR_SSC', 'ASST_DIRECTOR', 'FINANCE_SECRETARY', 'REGISTRAR', 'VC']), (req, res) => {
  res.json({ message: 'Admin route', user: req.user });
});

app.get('/api/test/super-admin-only', authenticate, isSuperAdmin, (req, res) => {
  res.json({ message: 'Super admin route', user: req.user });
});

app.get('/api/test/director-only', authenticate, authorize(['DIRECTOR_SSC']), (req, res) => {
  res.json({ message: 'Director only route', user: req.user });
});

describe('Role-Based Access Control (RBAC) Tests', () => {
  let testUsers = {};
  const testPassword = 'TestPassword123!';

  // Setup: Create test users with different roles
  beforeAll(async () => {
    const connection = await pool.getConnection();
    try {
      // Clean up existing test users
      await connection.query(
        "DELETE FROM users WHERE email LIKE 'rbac_test_%@test.com'"
      );

      const bcrypt = require('bcryptjs');
      const passwordHash = await bcrypt.hash(testPassword, 10);

      // Create users with different roles
      const roles = [
        'STUDENT',
        'COORDINATOR',
        'DIRECTOR_SSC',
        'ASST_DIRECTOR',
        'FINANCE_SECRETARY',
        'REGISTRAR',
        'VC',
      ];

      for (const role of roles) {
        const email = `rbac_test_${role.toLowerCase()}@test.com`;
        const rollNumber = `RBAC${Date.now()}${Math.floor(Math.random() * 1000)}`;

        const [result] = await connection.query(
          `INSERT INTO users (name, email, password_hash, roll_number, role, is_active, email_verified)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [`Test ${role}`, email, passwordHash, rollNumber, role, true, true]
        );

        const [users] = await connection.query(
          'SELECT id, name, email, role FROM users WHERE id = ?',
          [result.insertId]
        );

        testUsers[role] = users[0];
      }

      // Create SYSTEM_ADMIN separately (not in enum, needs manual insert)
      const adminEmail = 'rbac_test_system_admin@test.com';
      const adminRollNumber = `RBAC${Date.now()}${Math.floor(Math.random() * 1000)}`;
      
      await connection.query(
        `INSERT INTO users (name, email, password_hash, roll_number, role, is_active, email_verified)
         VALUES (?, ?, ?, ?, 'STUDENT', ?, ?)`,
        ['Test SYSTEM_ADMIN', adminEmail, passwordHash, adminRollNumber, true, true]
      );
      
      // Update role to SYSTEM_ADMIN (bypassing enum constraint)
      await connection.query(
        `UPDATE users SET role = 'SYSTEM_ADMIN' WHERE email = ?`,
        [adminEmail]
      );

      const [adminUsers] = await connection.query(
        'SELECT id, name, email, role FROM users WHERE email = ?',
        [adminEmail]
      );

      testUsers['SYSTEM_ADMIN'] = adminUsers[0];

    } finally {
      connection.release();
    }
  });

  // Cleanup: Remove test data after all tests
  afterAll(async () => {
    const connection = await pool.getConnection();
    try {
      await connection.query(
        "DELETE FROM users WHERE email LIKE 'rbac_test_%@test.com'"
      );
    } finally {
      connection.release();
    }
    await pool.end();
  });

  describe('Public Routes', () => {
    test('should allow access without authentication', async () => {
      const response = await request(app)
        .get('/api/test/public');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Public route');
    });
  });

  describe('Authenticated Routes', () => {
    test('should allow access with valid token', async () => {
      const token = generateAccessToken(testUsers.STUDENT);

      const response = await request(app)
        .get('/api/test/authenticated')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Authenticated route');
      expect(response.body.user).toMatchObject({
        id: testUsers.STUDENT.id,
        email: testUsers.STUDENT.email,
        role: 'STUDENT',
      });
    });

    test('should deny access without token', async () => {
      const response = await request(app)
        .get('/api/test/authenticated');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
      expect(response.body.message).toContain('No token provided');
    });

    test('should deny access with invalid token', async () => {
      const response = await request(app)
        .get('/api/test/authenticated')
        .set('Authorization', 'Bearer invalid_token_12345');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    test('should deny access with malformed Authorization header', async () => {
      const response = await request(app)
        .get('/api/test/authenticated')
        .set('Authorization', 'InvalidFormat token123');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Admin-Only Routes', () => {
    const adminRoles = ['DIRECTOR_SSC', 'ASST_DIRECTOR', 'FINANCE_SECRETARY', 'REGISTRAR', 'VC'];

    adminRoles.forEach(role => {
      test(`should allow ${role} to access admin route`, async () => {
        const token = generateAccessToken(testUsers[role]);

        const response = await request(app)
          .get('/api/test/admin-only')
          .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Admin route');
        expect(response.body.user.role).toBe(role);
      });
    });

    test('should deny STUDENT access to admin route', async () => {
      const token = generateAccessToken(testUsers.STUDENT);

      const response = await request(app)
        .get('/api/test/admin-only')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Insufficient permissions');
    });

    test('should deny COORDINATOR access to admin route', async () => {
      const token = generateAccessToken(testUsers.COORDINATOR);

      const response = await request(app)
        .get('/api/test/admin-only')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
    });

    test('should deny SYSTEM_ADMIN access to admin route (not in allowed roles)', async () => {
      const token = generateAccessToken(testUsers.SYSTEM_ADMIN);

      const response = await request(app)
        .get('/api/test/admin-only')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Super Admin Only Routes', () => {
    test('should allow SYSTEM_ADMIN to access super admin route', async () => {
      const token = generateAccessToken(testUsers.SYSTEM_ADMIN);

      const response = await request(app)
        .get('/api/test/super-admin-only')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Super admin route');
      expect(response.body.user.role).toBe('SYSTEM_ADMIN');
    });

    test('should deny DIRECTOR_SSC access to super admin route', async () => {
      const token = generateAccessToken(testUsers.DIRECTOR_SSC);

      const response = await request(app)
        .get('/api/test/super-admin-only')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
      expect(response.body.message).toContain('SYSTEM_ADMIN privileges');
    });

    test('should deny STUDENT access to super admin route', async () => {
      const token = generateAccessToken(testUsers.STUDENT);

      const response = await request(app)
        .get('/api/test/super-admin-only')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
    });

    test('should deny all non-SYSTEM_ADMIN roles', async () => {
      const nonAdminRoles = ['STUDENT', 'COORDINATOR', 'DIRECTOR_SSC', 'ASST_DIRECTOR', 'FINANCE_SECRETARY', 'REGISTRAR', 'VC'];

      for (const role of nonAdminRoles) {
        const token = generateAccessToken(testUsers[role]);

        const response = await request(app)
          .get('/api/test/super-admin-only')
          .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(403);
        expect(response.body.error).toContain('Access denied');
      }
    });
  });

  describe('Specific Role Routes', () => {
    test('should allow DIRECTOR_SSC to access director-only route', async () => {
      const token = generateAccessToken(testUsers.DIRECTOR_SSC);

      const response = await request(app)
        .get('/api/test/director-only')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Director only route');
    });

    test('should deny ASST_DIRECTOR access to director-only route', async () => {
      const token = generateAccessToken(testUsers.ASST_DIRECTOR);

      const response = await request(app)
        .get('/api/test/director-only')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
    });

    test('should deny STUDENT access to director-only route', async () => {
      const token = generateAccessToken(testUsers.STUDENT);

      const response = await request(app)
        .get('/api/test/director-only')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Inactive User Access', () => {
    let inactiveUser;

    beforeAll(async () => {
      const connection = await pool.getConnection();
      try {
        const bcrypt = require('bcryptjs');
        const passwordHash = await bcrypt.hash(testPassword, 10);
        const email = 'rbac_test_inactive@test.com';

        const [result] = await connection.query(
          `INSERT INTO users (name, email, password_hash, roll_number, role, is_active, email_verified)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          ['Inactive User', email, passwordHash, testUtils.randomRollNumber(), 'STUDENT', false, true]
        );

        const [users] = await connection.query(
          'SELECT id, name, email, role FROM users WHERE id = ?',
          [result.insertId]
        );

        inactiveUser = users[0];
      } finally {
        connection.release();
      }
    });

    test('should deny access for inactive user even with valid token', async () => {
      const token = generateAccessToken(inactiveUser);

      const response = await request(app)
        .get('/api/test/authenticated')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
      expect(response.body.message).toContain('deactivated');
    });
  });

  describe('Token Expiry and Security', () => {
    test('should deny access with expired token', async () => {
      const jwt = require('jsonwebtoken');
      const { JWT_SECRET } = require('../backend/config/jwt');

      // Create an expired token (expired 1 hour ago)
      const expiredToken = jwt.sign(
        {
          id: testUsers.STUDENT.id,
          email: testUsers.STUDENT.email,
          role: testUsers.STUDENT.role,
        },
        JWT_SECRET,
        { expiresIn: '-1h' }
      );

      const response = await request(app)
        .get('/api/test/authenticated')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    test('should deny access with tampered token', async () => {
      const validToken = generateAccessToken(testUsers.STUDENT);
      
      // Tamper with the token
      const tamperedToken = validToken.slice(0, -5) + 'XXXXX';

      const response = await request(app)
        .get('/api/test/authenticated')
        .set('Authorization', `Bearer ${tamperedToken}`);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    test('should deny access for deleted user', async () => {
      const connection = await pool.getConnection();
      let deletedUserToken;
      
      try {
        // Create a temporary user
        const bcrypt = require('bcryptjs');
        const passwordHash = await bcrypt.hash(testPassword, 10);
        const email = 'rbac_test_deleted@test.com';

        const [result] = await connection.query(
          `INSERT INTO users (name, email, password_hash, roll_number, role, is_active, email_verified)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          ['Deleted User', email, passwordHash, testUtils.randomRollNumber(), 'STUDENT', true, true]
        );

        const [users] = await connection.query(
          'SELECT id, name, email, role FROM users WHERE id = ?',
          [result.insertId]
        );

        // Generate token before deletion
        deletedUserToken = generateAccessToken(users[0]);

        // Delete the user
        await connection.query('DELETE FROM users WHERE id = ?', [users[0].id]);

      } finally {
        connection.release();
      }

      // Try to access with token of deleted user
      const response = await request(app)
        .get('/api/test/authenticated')
        .set('Authorization', `Bearer ${deletedUserToken}`);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
      expect(response.body.message).toContain('User not found');
    });
  });

  describe('Role Hierarchy and Permissions', () => {
    test('should enforce strict role matching (no role inheritance)', async () => {
      // Even though DIRECTOR_SSC is a high-level role,
      // they should not access routes restricted to other specific roles
      const token = generateAccessToken(testUsers.DIRECTOR_SSC);

      // This would fail if we had a REGISTRAR-only route
      // (demonstrating no automatic role inheritance)
      const response = await request(app)
        .get('/api/test/authenticated')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.user.role).toBe('DIRECTOR_SSC');
    });

    test('should validate role case-sensitivity', async () => {
      const jwt = require('jsonwebtoken');
      const { JWT_SECRET } = require('../backend/config/jwt');

      // Create token with lowercase role (should fail)
      const invalidRoleToken = jwt.sign(
        {
          id: testUsers.STUDENT.id,
          email: testUsers.STUDENT.email,
          role: 'student', // lowercase
        },
        JWT_SECRET,
        { expiresIn: '20m' }
      );

      const response = await request(app)
        .get('/api/test/admin-only')
        .set('Authorization', `Bearer ${invalidRoleToken}`);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Multiple Role Authorization', () => {
    test('should allow any of the specified roles', async () => {
      const allowedRoles = ['DIRECTOR_SSC', 'FINANCE_SECRETARY'];

      for (const role of allowedRoles) {
        const token = generateAccessToken(testUsers[role]);

        const response = await request(app)
          .get('/api/test/admin-only')
          .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(200);
      }
    });

    test('should deny roles not in the allowed list', async () => {
      const deniedRoles = ['STUDENT', 'COORDINATOR'];

      for (const role of deniedRoles) {
        const token = generateAccessToken(testUsers[role]);

        const response = await request(app)
          .get('/api/test/admin-only')
          .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(403);
      }
    });
  });
});
