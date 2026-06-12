/**
 * Authentication Service Layer
 * Handles all authentication-related database operations and business logic
 * 
 * This service layer separates database queries from controllers,
 * making the code more maintainable and testable.
 */

const pool = require('../config/database');
const bcrypt = require('bcryptjs');

/**
 * Find user by email
 * @param {string} email - User email
 * @returns {Promise<Object|null>} User object or null
 */
async function findUserByEmail(email) {
  const connection = await pool.getConnection();
  try {
    const [users] = await connection.query(
      'SELECT id, name, email, password_hash, role, is_active, roll_number, email_verified, COALESCE(session_version, 0) AS session_version FROM users WHERE email = ?',
      [email]
    );
    return users.length > 0 ? users[0] : null;
  } finally {
    connection.release();
  }
}

/**
 * Find user by ID
 * @param {number} userId - User ID
 * @returns {Promise<Object|null>} User object or null
 */
async function findUserById(userId) {
  const connection = await pool.getConnection();
  try {
    const [users] = await connection.query(
      'SELECT id, name, email, role, roll_number, email_verified, is_active, created_at, last_login, COALESCE(session_version, 0) AS session_version FROM users WHERE id = ?',
      [userId]
    );
    return users.length > 0 ? users[0] : null;
  } finally {
    connection.release();
  }
}

/**
 * Check if user exists by email or roll number
 * @param {string} email - User email
 * @param {string} rollNumber - User roll number
 * @returns {Promise<boolean>} True if user exists
 */
async function userExists(email, rollNumber) {
  const connection = await pool.getConnection();
  try {
    const [users] = await connection.query(
      'SELECT id FROM users WHERE email = ? OR roll_number = ?',
      [email, rollNumber]
    );
    return users.length > 0;
  } finally {
    connection.release();
  }
}

/**
 * Create new user
 * @param {Object} userData - User data
 * @param {string} userData.name - User name
 * @param {string} userData.email - User email
 * @param {string} userData.password - Plain text password (will be hashed)
 * @param {string} userData.rollNumber - User roll number
 * @param {string} userData.role - User role (default: STUDENT)
 * @returns {Promise<number>} New user ID
 */
async function createUser(userData) {
  const connection = await pool.getConnection();
  try {
    const { name, email, password, rollNumber, role = 'STUDENT' } = userData;
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    
    const [result] = await connection.query(
      'INSERT INTO users (name, email, password_hash, roll_number, role, is_active, email_verified) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, email, passwordHash, rollNumber, role, false, false]
    );
    
    return result.insertId;
  } finally {
    connection.release();
  }
}

/**
 * Verify user password
 * @param {string} plainPassword - Plain text password
 * @param {string} hashedPassword - Hashed password from database
 * @returns {Promise<boolean>} True if password matches
 */
async function verifyPassword(plainPassword, hashedPassword) {
  return await bcrypt.compare(plainPassword, hashedPassword);
}

/**
 * Update user's last login timestamp
 * @param {number} userId - User ID
 * @returns {Promise<void>}
 */
async function updateLastLogin(userId) {
  const connection = await pool.getConnection();
  try {
    await connection.query(
      'UPDATE users SET last_login = NOW() WHERE id = ?',
      [userId]
    );
  } catch (error) {
    // Silently skip if last_login column doesn't exist (v3 compatibility)
    console.warn('[AUTH SERVICE] Could not update last_login:', error.message);
  } finally {
    connection.release();
  }
}

/**
 * Get user's society information
 * @param {number} userId - User ID
 * @returns {Promise<Object|null>} Society info or null
 */
async function getUserSocietyInfo(userId) {
  const connection = await pool.getConnection();
  try {
    const [societyRoles] = await connection.query(
      `SELECT s.id, s.name, sr.role_name, sr.is_core_leader
       FROM society_roles sr
       JOIN societies s ON sr.society_id = s.id
       WHERE sr.user_id = ? AND sr.is_core_leader = TRUE
       LIMIT 1`,
      [userId]
    );
    
    return societyRoles.length > 0 ? societyRoles[0] : null;
  } finally {
    connection.release();
  }
}

/**
 * Get all user's societies
 * @param {number} userId - User ID
 * @returns {Promise<Array>} Array of society objects
 */
async function getUserSocieties(userId) {
  const connection = await pool.getConnection();
  try {
    const [societyRoles] = await connection.query(
      `SELECT s.id, s.name, sr.role_name, sr.is_core_leader
       FROM society_roles sr
       JOIN societies s ON sr.society_id = s.id
       WHERE sr.user_id = ?`,
      [userId]
    );
    
    return societyRoles;
  } finally {
    connection.release();
  }
}

/**
 * Store refresh token
 * @param {number} userId - User ID
 * @param {string} token - Refresh token
 * @returns {Promise<void>}
 */
async function storeRefreshToken(userId, token) {
  const connection = await pool.getConnection();
  try {
    await connection.query(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))',
      [userId, token]
    );
  } catch (error) {
    // Silently skip if refresh_tokens table doesn't exist (v3 compatibility)
    console.warn('[AUTH SERVICE] Could not store refresh token:', error.message);
  } finally {
    connection.release();
  }
}

/**
 * Find valid refresh token
 * @param {string} token - Refresh token
 * @returns {Promise<Object|null>} Token object or null
 */
async function findValidRefreshToken(token) {
  const connection = await pool.getConnection();
  try {
    const [tokens] = await connection.query(
      'SELECT id, user_id FROM refresh_tokens WHERE token = ? AND expires_at > NOW() AND revoked = FALSE',
      [token]
    );
    
    return tokens.length > 0 ? tokens[0] : null;
  } finally {
    connection.release();
  }
}

/**
 * Revoke refresh token
 * @param {string} token - Refresh token
 * @returns {Promise<void>}
 */
async function revokeRefreshToken(token) {
  const connection = await pool.getConnection();
  try {
    await connection.query(
      'UPDATE refresh_tokens SET revoked = TRUE WHERE token = ?',
      [token]
    );
  } catch (error) {
    console.warn('[AUTH SERVICE] Could not revoke refresh token:', error.message);
  } finally {
    connection.release();
  }
}

/**
 * Revoke all user's refresh tokens
 * @param {number} userId - User ID
 * @returns {Promise<void>}
 */
async function revokeAllUserTokens(userId) {
  const connection = await pool.getConnection();
  try {
    await connection.query(
      'UPDATE refresh_tokens SET revoked = TRUE WHERE user_id = ?',
      [userId]
    );
  } catch (error) {
    console.warn('[AUTH SERVICE] Could not revoke user tokens:', error.message);
  } finally {
    connection.release();
  }
}

/**
 * Invalidate all active access tokens by bumping the user's session version.
 * @param {number} userId - User ID
 * @returns {Promise<number>} New session version
 */
async function invalidateUserSessions(userId) {
  const connection = await pool.getConnection();
  try {
    await connection.query(
      'UPDATE users SET session_version = COALESCE(session_version, 0) + 1 WHERE id = ?',
      [userId]
    );

    const [users] = await connection.query(
      'SELECT COALESCE(session_version, 0) AS session_version FROM users WHERE id = ?',
      [userId]
    );

    return users.length > 0 ? users[0].session_version : 0;
  } catch (error) {
    console.warn('[AUTH SERVICE] Could not invalidate user sessions:', error.message);
    return 0;
  } finally {
    connection.release();
  }
}

/**
 * Update user's email verification status
 * @param {number} userId - User ID
 * @returns {Promise<void>}
 */
async function verifyUserEmail(userId) {
  const connection = await pool.getConnection();
  try {
    await connection.query(
      'UPDATE users SET email_verified = TRUE, is_active = TRUE WHERE id = ?',
      [userId]
    );
  } finally {
    connection.release();
  }
}

/**
 * Update user's password
 * @param {number} userId - User ID
 * @param {string} newPassword - New plain text password (will be hashed)
 * @returns {Promise<void>}
 */
async function updateUserPassword(userId, newPassword) {
  const connection = await pool.getConnection();
  try {
    const passwordHash = await bcrypt.hash(newPassword, 10);
    
    await connection.query(
      'UPDATE users SET password_hash = ? WHERE id = ?',
      [passwordHash, userId]
    );
  } finally {
    connection.release();
  }
}

/**
 * Store OTP for password reset
 * @param {number} userId - User ID
 * @param {string} otp - 6-digit OTP
 * @returns {Promise<void>}
 */
async function storePasswordResetOtp(userId, otp) {
  const connection = await pool.getConnection();
  try {
    await connection.query(
      `UPDATE users
       SET reset_otp = ?, reset_otp_expires = DATE_ADD(NOW(), INTERVAL 10 MINUTE)
       WHERE id = ?`,
      [otp, userId]
    );
  } finally {
    connection.release();
  }
}

/**
 * Find user by email with valid OTP
 * @param {string} email - User email
 * @returns {Promise<Object|null>} User object with OTP or null
 */
async function findUserWithValidOtp(email) {
  const connection = await pool.getConnection();
  try {
    const [users] = await connection.query(
      `SELECT id, reset_otp, reset_otp_expires
       FROM users
       WHERE email = ?
         AND reset_otp IS NOT NULL
         AND reset_otp_expires IS NOT NULL
         AND reset_otp_expires > NOW()
         AND is_active = TRUE`,
      [email]
    );
    
    return users.length > 0 ? users[0] : null;
  } finally {
    connection.release();
  }
}

/**
 * Clear user's password reset OTP
 * @param {number} userId - User ID
 * @returns {Promise<void>}
 */
async function clearPasswordResetOtp(userId) {
  const connection = await pool.getConnection();
  try {
    await connection.query(
      `UPDATE users
       SET reset_otp = NULL, reset_otp_expires = NULL
       WHERE id = ?`,
      [userId]
    );
  } finally {
    connection.release();
  }
}

/**
 * Reset user password with OTP
 * @param {number} userId - User ID
 * @param {string} newPassword - New plain text password
 * @returns {Promise<void>}
 */
async function resetPasswordWithOtp(userId, newPassword) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);
    
    // Update password and clear OTP
    await connection.query(
      `UPDATE users
       SET password_hash = ?,
           reset_otp = NULL,
           reset_otp_expires = NULL
       WHERE id = ?`,
      [passwordHash, userId]
    );
    
    // Revoke all refresh tokens and invalidate active access tokens
    try {
      await connection.query(
        'UPDATE refresh_tokens SET revoked = TRUE WHERE user_id = ?',
        [userId]
      );
      await connection.query(
        'UPDATE users SET session_version = COALESCE(session_version, 0) + 1 WHERE id = ?',
        [userId]
      );
    } catch (error) {
      // v3 schema may not have refresh_tokens table
      console.warn('[AUTH SERVICE] Could not revoke tokens:', error.message);
    }
    
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = {
  findUserByEmail,
  findUserById,
  userExists,
  createUser,
  verifyPassword,
  updateLastLogin,
  getUserSocietyInfo,
  getUserSocieties,
  storeRefreshToken,
  findValidRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens,
  invalidateUserSessions,
  verifyUserEmail,
  updateUserPassword,
  storePasswordResetOtp,
  findUserWithValidOtp,
  clearPasswordResetOtp,
  resetPasswordWithOtp,
};
