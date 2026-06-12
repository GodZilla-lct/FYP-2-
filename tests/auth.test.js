/**
 * Authentication API Integration Tests
 * Tests for OTP generation, verification, and JWT authentication
 */

const request = require('supertest');
const pool = require('../backend/config/database');
const { generateAccessToken, generateRefreshToken } = require('../backend/config/jwt');

// Import app components
const express = require('express');
const cors = require('cors');
const publicRoutes = require('../backend/routes/public.routes');
const authRoutes = require('../backend/routes/auth.session.routes');
const { authenticate } = require('../backend/middleware/auth');

// Create test app
const app = express();
app.use(cors());
app.use(express.json());
app.use('/api', publicRoutes); // Public routes (login, refresh, etc.)
app.use('/api', authenticate, authRoutes); // Protected auth routes (logout, change-password, etc.)

describe('Authentication API Tests', () => {
  let testUser;
  let testUserPassword = 'TestPassword123!';
  
  // Setup: Create a test user before all tests
  beforeAll(async () => {
    const connection = await pool.getConnection();
    try {
      // Clean up any existing test users
      await connection.query(
        "DELETE FROM users WHERE email LIKE 'test_%@test.com'"
      );
      
      // Create test user
      const bcrypt = require('bcryptjs');
      const passwordHash = await bcrypt.hash(testUserPassword, 10);
      
      const [result] = await connection.query(
        `INSERT INTO users (name, email, password_hash, roll_number, role, is_active, email_verified)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        ['Test User', testUtils.randomEmail(), passwordHash, testUtils.randomRollNumber(), 'STUDENT', true, true]
      );
      
      const [users] = await connection.query(
        'SELECT id, name, email, role FROM users WHERE id = ?',
        [result.insertId]
      );
      
      testUser = users[0];
    } finally {
      connection.release();
    }
  });
  
  // Cleanup: Remove test data after all tests
  afterAll(async () => {
    const connection = await pool.getConnection();
    try {
      await connection.query(
        "DELETE FROM users WHERE email LIKE 'test_%@test.com'"
      );
      await connection.query(
        "DELETE FROM refresh_tokens WHERE user_id NOT IN (SELECT id FROM users)"
      );
    } finally {
      connection.release();
    }
    await pool.end();
  });

  describe('POST /api/auth/login', () => {
    test('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUserPassword,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body).toHaveProperty('token'); // Legacy support
      expect(response.body.user).toMatchObject({
        id: testUser.id,
        email: testUser.email,
        role: testUser.role,
      });
    });

    test('should fail with invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: testUserPassword,
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    test('should fail with invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword123!',
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    test('should fail with missing credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    test('should fail for inactive user', async () => {
      const connection = await pool.getConnection();
      try {
        // Create inactive user
        const bcrypt = require('bcryptjs');
        const passwordHash = await bcrypt.hash('Test123!', 10);
        const email = testUtils.randomEmail();
        
        await connection.query(
          `INSERT INTO users (name, email, password_hash, roll_number, role, is_active, email_verified)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          ['Inactive User', email, passwordHash, testUtils.randomRollNumber(), 'STUDENT', false, true]
        );

        const response = await request(app)
          .post('/api/auth/login')
          .send({
            email: email,
            password: 'Test123!',
          });

        expect(response.status).toBe(403);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toContain('deactivated');
      } finally {
        connection.release();
      }
    });
  });

  describe('POST /api/auth/refresh', () => {
    let validRefreshToken;
    let validAccessToken;

    beforeAll(async () => {
      // Generate valid tokens
      validAccessToken = generateAccessToken(testUser);
      validRefreshToken = generateRefreshToken(testUser);
      
      // Store refresh token in database
      const connection = await pool.getConnection();
      try {
        await connection.query(
          'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))',
          [testUser.id, validRefreshToken]
        );
      } finally {
        connection.release();
      }
    });

    test('should refresh access token with valid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken: validRefreshToken,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body.accessToken).not.toBe(validAccessToken);
    });

    test('should fail with missing refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    test('should fail with invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken: 'invalid_token_12345',
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    test('should fail with revoked refresh token', async () => {
      const connection = await pool.getConnection();
      try {
        // Create and immediately revoke a token
        const revokedToken = generateRefreshToken(testUser);
        await connection.query('DELETE FROM refresh_tokens WHERE token = ?', [revokedToken]);
        await connection.query(
          'INSERT INTO refresh_tokens (user_id, token, expires_at, revoked) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY), TRUE)',
          [testUser.id, revokedToken]
        );

        const response = await request(app)
          .post('/api/auth/refresh')
          .send({
            refreshToken: revokedToken,
          });

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('error');
      } finally {
        connection.release();
      }
    });
  });

  describe('POST /api/auth/forgot-password (OTP Generation)', () => {
    test('should generate and store OTP for valid email', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({
          email: testUser.email,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.message).toContain('verification code');

      // Verify OTP was stored in database
      const connection = await pool.getConnection();
      try {
        const [users] = await connection.query(
          'SELECT reset_otp, reset_otp_expires FROM users WHERE id = ?',
          [testUser.id]
        );

        expect(users[0].reset_otp).toBeTruthy();
        expect(users[0].reset_otp).toMatch(/^\d{6}$/); // 6-digit OTP
        expect(users[0].reset_otp_expires).toBeTruthy();
        expect(new Date(users[0].reset_otp_expires)).toBeInstanceOf(Date);
      } finally {
        connection.release();
      }
    });

    test('should return success even for non-existent email (security)', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({
          email: 'nonexistent@test.com',
        });

      // Should return success to prevent email enumeration
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
    });

    test('should fail with missing email', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({});

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/auth/verify-otp (OTP Verification)', () => {
    let validOtp;

    beforeEach(async () => {
      // Generate fresh OTP for each test
      const connection = await pool.getConnection();
      try {
        validOtp = '123456'; // Test OTP
        await connection.query(
          `UPDATE users
           SET reset_otp = ?, reset_otp_expires = DATE_ADD(NOW(), INTERVAL 10 MINUTE)
           WHERE id = ?`,
          [validOtp, testUser.id]
        );
      } finally {
        connection.release();
      }
    });

    test('should verify valid OTP successfully', async () => {
      const response = await request(app)
        .post('/api/auth/verify-otp')
        .send({
          email: testUser.email,
          otp: validOtp,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.message).toContain('verified');
    });

    test('should fail with invalid OTP', async () => {
      const response = await request(app)
        .post('/api/auth/verify-otp')
        .send({
          email: testUser.email,
          otp: '999999',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.message).toContain('incorrect');
    });

    test('should fail with expired OTP', async () => {
      const connection = await pool.getConnection();
      try {
        // Set OTP as expired
        await connection.query(
          `UPDATE users
           SET reset_otp_expires = DATE_SUB(NOW(), INTERVAL 1 HOUR)
           WHERE id = ?`,
          [testUser.id]
        );

        const response = await request(app)
          .post('/api/auth/verify-otp')
          .send({
            email: testUser.email,
            otp: validOtp,
          });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
        expect(response.body.message).toContain('expired');
      } finally {
        connection.release();
      }
    });

    test('should fail with missing parameters', async () => {
      const response = await request(app)
        .post('/api/auth/verify-otp')
        .send({
          email: testUser.email,
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/auth/reset-password (Password Reset with OTP)', () => {
    let validOtp;

    beforeEach(async () => {
      const connection = await pool.getConnection();
      try {
        validOtp = '654321';
        await connection.query(
          `UPDATE users
           SET reset_otp = ?, reset_otp_expires = DATE_ADD(NOW(), INTERVAL 10 MINUTE)
           WHERE id = ?`,
          [validOtp, testUser.id]
        );
      } finally {
        connection.release();
      }
    });

    test('should reset password with valid OTP', async () => {
      const newPassword = 'NewPassword123!';
      
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          email: testUser.email,
          otp: validOtp,
          newPassword: newPassword,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.message).toContain('successful');

      // Verify OTP was cleared
      const connection = await pool.getConnection();
      try {
        const [users] = await connection.query(
          'SELECT reset_otp, reset_otp_expires FROM users WHERE id = ?',
          [testUser.id]
        );

        expect(users[0].reset_otp).toBeNull();
        expect(users[0].reset_otp_expires).toBeNull();
      } finally {
        connection.release();
      }

      // Verify can login with new password
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: newPassword,
        });

      expect(loginResponse.status).toBe(200);
      
      // Reset password back for other tests
      testUserPassword = newPassword;
    });

    test('should fail with invalid OTP', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          email: testUser.email,
          otp: '000000',
          newPassword: 'NewPassword123!',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    test('should fail with missing parameters', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          email: testUser.email,
          otp: validOtp,
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/auth/logout', () => {
    beforeEach(async () => {
      const [users] = await pool.query(
        'SELECT COALESCE(session_version, 0) AS session_version FROM users WHERE id = ?',
        [testUser.id]
      );
      testUser.session_version = users[0].session_version;
    });

    test('should logout and revoke refresh token', async () => {
      const accessToken = generateAccessToken(testUser);
      const refreshToken = generateRefreshToken(testUser);
      const connection = await pool.getConnection();
      try {
        await connection.query('DELETE FROM refresh_tokens WHERE token = ?', [refreshToken]);
        await connection.query(
          'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))',
          [testUser.id, refreshToken]
        );
      } finally {
        connection.release();
      }

      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          refreshToken: refreshToken,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);

      // Verify token was revoked
      const connection2 = await pool.getConnection();
      try {
        const [tokens] = await connection2.query(
          'SELECT revoked FROM refresh_tokens WHERE token = ?',
          [refreshToken]
        );

        expect(tokens[0].revoked).toBe(1); // TRUE
      } finally {
        connection2.release();
      }
    });

    test('should invalidate access token after logout', async () => {
      const connection = await pool.getConnection();
      try {
        await connection.query(
          'UPDATE users SET session_version = 0 WHERE id = ?',
          [testUser.id]
        );
      } finally {
        connection.release();
      }

      const [users] = await pool.query(
        'SELECT COALESCE(session_version, 0) AS session_version FROM users WHERE id = ?',
        [testUser.id]
      );
      testUser.session_version = users[0].session_version;

      const accessToken = generateAccessToken(testUser);
      const refreshToken = generateRefreshToken(testUser);

      await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ refreshToken });

      const protectedResponse = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(protectedResponse.status).toBe(401);
    });

    test('should succeed even without refresh token when authenticated', async () => {
      const accessToken = generateAccessToken(testUser);

      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({});

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
    });
  });

  describe('Sliding session', () => {
    beforeEach(async () => {
      const [users] = await pool.query(
        'SELECT COALESCE(session_version, 0) AS session_version FROM users WHERE id = ?',
        [testUser.id]
      );
      testUser.session_version = users[0].session_version;
    });

    test('authenticated request should return a fresh access token header', async () => {
      const accessToken = generateAccessToken(testUser);

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.headers['x-new-access-token']).toBeTruthy();
      expect(response.headers['x-new-access-token']).not.toBe(accessToken);
    });
  });

  describe('JWT Token Expiry', () => {
    test('access token should have 20-minute expiry', () => {
      const jwt = require('jsonwebtoken');
      const token = generateAccessToken(testUser);
      const decoded = jwt.decode(token);
      
      const expiryTime = decoded.exp - decoded.iat;
      expect(expiryTime).toBe(20 * 60); // 20 minutes in seconds
    });

    test('refresh token should have 7-day expiry', () => {
      const jwt = require('jsonwebtoken');
      const token = generateRefreshToken(testUser);
      const decoded = jwt.decode(token);
      
      const expiryTime = decoded.exp - decoded.iat;
      expect(expiryTime).toBe(7 * 24 * 60 * 60); // 7 days in seconds
    });

    test('access token should contain type identifier', () => {
      const jwt = require('jsonwebtoken');
      const token = generateAccessToken(testUser);
      const decoded = jwt.decode(token);
      
      expect(decoded.type).toBe('access');
    });

    test('access token should include session version', () => {
      const jwt = require('jsonwebtoken');
      const token = generateAccessToken({ ...testUser, session_version: 3 });
      const decoded = jwt.decode(token);

      expect(decoded.sv).toBe(3);
    });

    test('refresh token should contain type identifier', () => {
      const jwt = require('jsonwebtoken');
      const token = generateRefreshToken(testUser);
      const decoded = jwt.decode(token);
      
      expect(decoded.type).toBe('refresh');
    });
  });
});
