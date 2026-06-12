/**
 * Jest Test Setup
 * Runs before all tests
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_key_for_testing_only';
process.env.DB_NAME = process.env.DB_NAME || 'campus_connect';
process.env.PORT = '5002'; // Different port for testing

// Increase timeout for database operations
jest.setTimeout(30000);

// Ensure session_version column exists for auth/session tests
beforeAll(async () => {
  const pool = require('../backend/config/database');
  const connection = await pool.getConnection();
  try {
    await connection.query(
      'ALTER TABLE users ADD COLUMN session_version INT NOT NULL DEFAULT 0'
    );
  } catch (error) {
    if (error.code !== 'ER_DUP_FIELDNAME') {
      throw error;
    }
  } finally {
    connection.release();
  }
});

// Global test utilities
global.testUtils = {
  /**
   * Wait for a specified time
   */
  wait: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
  
  /**
   * Generate random email
   */
  randomEmail: () => `test_${Date.now()}_${Math.random().toString(36).substring(7)}@test.com`,
  
  /**
   * Generate random roll number
   */
  randomRollNumber: () => `TEST${Date.now()}${Math.floor(Math.random() * 1000)}`,
};

// Suppress console logs during tests (optional)
if (process.env.SILENT_TESTS === 'true') {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
}
