const pool = require('../config/database');
const bcrypt = require('bcryptjs');
const { generateAccessToken, generateRefreshToken, generatePasswordResetToken, generateEmailVerificationToken, verifyToken } = require('../config/jwt');
const { sendEmail } = require('../utils/emailService');

/**
 * Register new user
 * POST /auth/register
 */
async function register(req, res) {
  const connection = await pool.getConnection();

  try {
    const { name, email, password, rollNumber } = req.body;

    // Check if user already exists
    const [existingUsers] = await connection.query(
      'SELECT id FROM users WHERE email = ? OR roll_number = ?',
      [email, rollNumber]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ 
        error: 'User already exists',
        message: 'Email or roll number is already registered'
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const [result] = await connection.query(
      'INSERT INTO users (name, email, password_hash, roll_number, role, is_active, email_verified) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, email, passwordHash, rollNumber, 'STUDENT', false, false]
    );

    const userId = result.insertId;

    // Generate email verification token
    const verificationToken = generateEmailVerificationToken(userId);
    const verificationLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;

    // Send verification email
    await sendEmail({
      to: email,
      subject: 'Verify Your Email - Campus Connect',
      html: `
        <h2>Welcome to Campus Connect!</h2>
        <p>Hi ${name},</p>
        <p>Please verify your email address by clicking the link below:</p>
        <a href="${verificationLink}">${verificationLink}</a>
        <p>This link will expire in 24 hours.</p>
        <p>If you didn't create this account, please ignore this email.</p>
      `
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please check your email to verify your account.',
      userId,
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed', details: error.message });
  } finally {
    connection.release();
  }
}

/**
 * Login user
 * POST /auth/login
 */
async function login(req, res) {
  let connection;
  
  try {
    connection = await pool.getConnection();
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Validation error',
        message: 'Email and password are required'
      });
    }

    // Find user
    const [users] = await connection.query(
      'SELECT id, name, email, password_hash, role, is_active, roll_number FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ 
        error: 'Invalid credentials',
        message: 'Email or password is incorrect'
      });
    }

    const user = users[0];

    // Check if account is active
    if (!user.is_active) {
      return res.status(403).json({ 
        error: 'Account deactivated',
        message: 'Your account has been deactivated. Please contact administration.'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({ 
        error: 'Invalid credentials',
        message: 'Email or password is incorrect'
      });
    }

    // Get society info if user is a society leader
    let societyInfo = null;
    const [societyRoles] = await connection.query(
      `SELECT s.id, s.name, sr.role_name, sr.is_core_leader
       FROM society_roles sr
       JOIN societies s ON sr.society_id = s.id
       WHERE sr.user_id = ? AND sr.is_core_leader = TRUE
       LIMIT 1`,
      [user.id]
    );

    if (societyRoles.length > 0) {
      societyInfo = societyRoles[0];
    }

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Try to store refresh token (skip if table doesn't exist - v3 compatibility)
    try {
      await connection.query(
        'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 30 DAY))',
        [user.id, refreshToken]
      );
    } catch (tokenError) {
      // Silently skip if refresh_tokens table doesn't exist (v3 schema)
    }

    // Update last login (skip if column doesn't exist)
    try {
      await connection.query(
        'UPDATE users SET last_login = NOW() WHERE id = ?',
        [user.id]
      );
    } catch (updateError) {
      // Silently skip if last_login column doesn't exist
    }

    // Return successful login response
    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token: accessToken,
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        rollNumber: user.roll_number,
        society: societyInfo,
        canAccessSocietyDashboard: societyInfo !== null || ['DIRECTOR_SSC', 'ASST_DIRECTOR', 'FINANCE_SECRETARY', 'REGISTRAR', 'VC', 'COORDINATOR'].includes(user.role),
      },
    });

  } catch (error) {
    console.error('Login error:', error.message);
    
    // Always return a response in catch block
    return res.status(500).json({ 
      error: 'Login failed', 
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
    
  } finally {
    // Release connection if it was acquired
    if (connection) {
      connection.release();
    }
  }
}

/**
 * Refresh access token
 * POST /auth/refresh
 */
async function refreshAccessToken(req, res) {
  const connection = await pool.getConnection();

  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    // Verify refresh token
    const decoded = verifyToken(refreshToken);
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    // Check if refresh token exists in database
    const [tokens] = await connection.query(
      'SELECT id, user_id FROM refresh_tokens WHERE token = ? AND expires_at > NOW() AND revoked = FALSE',
      [refreshToken]
    );

    if (tokens.length === 0) {
      return res.status(401).json({ error: 'Refresh token not found or expired' });
    }

    // Get user
    const [users] = await connection.query(
      'SELECT id, name, email, role FROM users WHERE id = ? AND is_active = TRUE',
      [tokens[0].user_id]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'User not found or inactive' });
    }

    const user = users[0];

    // Generate new access token
    const newAccessToken = generateAccessToken(user);

    res.json({
      success: true,
      accessToken: newAccessToken,
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({ error: 'Token refresh failed' });
  } finally {
    connection.release();
  }
}

/**
 * Logout user (revoke refresh token)
 * POST /auth/logout
 */
async function logout(req, res) {
  const connection = await pool.getConnection();

  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      await connection.query(
        'UPDATE refresh_tokens SET revoked = TRUE WHERE token = ?',
        [refreshToken]
      );
    }

    res.json({
      success: true,
      message: 'Logged out successfully',
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  } finally {
    connection.release();
  }
}

/**
 * Request password reset
 * POST /auth/forgot-password
 */
async function forgotPassword(req, res) {
  const connection = await pool.getConnection();

  try {
    const { email } = req.body;

    // Find user
    const [users] = await connection.query(
      'SELECT id, name, email FROM users WHERE email = ?',
      [email]
    );

    // Always return success to prevent email enumeration
    if (users.length === 0) {
      return res.json({
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent.',
      });
    }

    const user = users[0];

    // Generate reset token
    const resetToken = generatePasswordResetToken(user.id);
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

    // Store reset token in database
    await connection.query(
      'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 1 HOUR))',
      [user.id, resetToken]
    );

    // Send reset email
    await sendEmail({
      to: user.email,
      subject: 'Password Reset Request - Campus Connect',
      html: `
        <h2>Password Reset Request</h2>
        <p>Hi ${user.name},</p>
        <p>You requested to reset your password. Click the link below to proceed:</p>
        <a href="${resetLink}">${resetLink}</a>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `
    });

    res.json({
      success: true,
      message: 'If an account exists with this email, a password reset link has been sent.',
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Password reset request failed' });
  } finally {
    connection.release();
  }
}

/**
 * Reset password with token
 * POST /auth/reset-password
 */
async function resetPassword(req, res) {
  const connection = await pool.getConnection();

  try {
    const { token, newPassword } = req.body;

    // Verify token
    const decoded = verifyToken(token);
    if (!decoded || decoded.type !== 'password_reset') {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    // Check if token exists in database and is not used
    const [tokens] = await connection.query(
      'SELECT id, user_id FROM password_reset_tokens WHERE token = ? AND expires_at > NOW() AND used = FALSE',
      [token]
    );

    if (tokens.length === 0) {
      return res.status(400).json({ error: 'Reset token not found or already used' });
    }

    const userId = tokens[0].user_id;

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update password
    await connection.query(
      'UPDATE users SET password_hash = ? WHERE id = ?',
      [passwordHash, userId]
    );

    // Mark token as used
    await connection.query(
      'UPDATE password_reset_tokens SET used = TRUE WHERE id = ?',
      [tokens[0].id]
    );

    // Revoke all refresh tokens for this user (force re-login)
    await connection.query(
      'UPDATE refresh_tokens SET revoked = TRUE WHERE user_id = ?',
      [userId]
    );

    res.json({
      success: true,
      message: 'Password reset successful. Please login with your new password.',
    });

  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ error: 'Password reset failed' });
  } finally {
    connection.release();
  }
}

/**
 * Verify email with token
 * POST /auth/verify-email
 */
async function verifyEmail(req, res) {
  const connection = await pool.getConnection();

  try {
    const { token } = req.body;

    // Verify token
    const decoded = verifyToken(token);
    if (!decoded || decoded.type !== 'email_verification') {
      return res.status(400).json({ error: 'Invalid or expired verification token' });
    }

    // Update user
    await connection.query(
      'UPDATE users SET email_verified = TRUE, is_active = TRUE WHERE id = ?',
      [decoded.userId]
    );

    res.json({
      success: true,
      message: 'Email verified successfully. You can now login.',
    });

  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ error: 'Email verification failed' });
  } finally {
    connection.release();
  }
}

/**
 * Change password (authenticated user)
 * POST /auth/change-password
 */
async function changePassword(req, res) {
  const connection = await pool.getConnection();

  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    // Get user
    const [users] = await connection.query(
      'SELECT password_hash FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, users[0].password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update password
    await connection.query(
      'UPDATE users SET password_hash = ? WHERE id = ?',
      [passwordHash, userId]
    );

    res.json({
      success: true,
      message: 'Password changed successfully',
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Password change failed' });
  } finally {
    connection.release();
  }
}

/**
 * Get current user profile
 * GET /auth/me
 */
async function getCurrentUser(req, res) {
  const connection = await pool.getConnection();

  try {
    const userId = req.user.id;

    const [users] = await connection.query(
      'SELECT id, name, email, role, roll_number, email_verified, created_at, last_login FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users[0];

    // Get society info
    const [societyRoles] = await connection.query(
      `SELECT s.id, s.name, sr.role_name, sr.is_core_leader
       FROM society_roles sr
       JOIN societies s ON sr.society_id = s.id
       WHERE sr.user_id = ?`,
      [userId]
    );

    res.json({
      success: true,
      user: {
        ...user,
        societies: societyRoles,
      },
    });

  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  } finally {
    connection.release();
  }
}

module.exports = {
  register,
  login,
  refreshAccessToken,
  logout,
  forgotPassword,
  resetPassword,
  verifyEmail,
  changePassword,
  getCurrentUser,
};
