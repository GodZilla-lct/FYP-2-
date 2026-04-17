const { generateAccessToken, generateRefreshToken, generateEmailVerificationToken, verifyToken } = require('../config/jwt');
const { sendEmail, sendPasswordResetOtpEmail } = require('../utils/emailService');
const { generateSixDigitOtp, otpMatchesStored } = require('../services/passwordResetService');
const authService = require('../services/authService');

/**
 * Register new user
 * POST /auth/register
 */
async function register(req, res) {
  try {
    const { name, email, password, rollNumber } = req.body;

    // Check if user already exists
    const exists = await authService.userExists(email, rollNumber);
    if (exists) {
      return res.status(400).json({ 
        error: 'User already exists',
        message: 'Email or roll number is already registered'
      });
    }

    // Create user
    const userId = await authService.createUser({
      name,
      email,
      password,
      rollNumber,
      role: 'STUDENT'
    });

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
    console.error('[AUTH CONTROLLER] Registration error:', error);
    res.status(500).json({ error: 'Registration failed', details: error.message });
  }
}

/**
 * Login user
 * POST /auth/login
 */
async function login(req, res) {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Validation error',
        message: 'Email and password are required'
      });
    }

    // Find user
    const user = await authService.findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ 
        error: 'Invalid credentials',
        message: 'Email or password is incorrect'
      });
    }

    // Check if account is active
    if (!user.is_active) {
      return res.status(403).json({ 
        error: 'Account deactivated',
        message: 'Your account has been deactivated. Please contact administration.'
      });
    }

    // Verify password
    const isPasswordValid = await authService.verifyPassword(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        error: 'Invalid credentials',
        message: 'Email or password is incorrect'
      });
    }

    // Get society info if user is a society leader
    const societyInfo = await authService.getUserSocietyInfo(user.id);

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Store refresh token
    await authService.storeRefreshToken(user.id, refreshToken);

    // Update last login
    await authService.updateLastLogin(user.id);

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
    console.error('[AUTH CONTROLLER] Login error:', error.message);
    
    return res.status(500).json({ 
      error: 'Login failed', 
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

/**
 * Refresh access token
 * POST /auth/refresh
 */
async function refreshAccessToken(req, res) {
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
    const tokenData = await authService.findValidRefreshToken(refreshToken);
    if (!tokenData) {
      return res.status(401).json({ error: 'Refresh token not found or expired' });
    }

    // Get user
    const user = await authService.findUserById(tokenData.user_id);
    if (!user || !user.is_active) {
      return res.status(401).json({ error: 'User not found or inactive' });
    }

    // Generate new access token
    const newAccessToken = generateAccessToken(user);

    res.json({
      success: true,
      accessToken: newAccessToken,
    });

  } catch (error) {
    console.error('[AUTH CONTROLLER] Token refresh error:', error);
    res.status(500).json({ error: 'Token refresh failed' });
  }
}

/**
 * Logout user (revoke refresh token)
 * POST /auth/logout
 */
async function logout(req, res) {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      await authService.revokeRefreshToken(refreshToken);
    }

    res.json({
      success: true,
      message: 'Logged out successfully',
    });

  } catch (error) {
    console.error('[AUTH CONTROLLER] Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
}

/**
 * Request password reset (send OTP)
 * POST /auth/forgot-password
 */
async function forgotPassword(req, res) {
  try {
    const { email } = req.body;

    // Find user
    const user = await authService.findUserByEmail(email);

    // Always return success to prevent email enumeration
    if (!user) {
      return res.json({
        success: true,
        message: 'If an account exists with this email, a 6-digit verification code has been sent.',
      });
    }

    // Generate 6-digit OTP
    const otp = generateSixDigitOtp();

    // Store OTP in database
    await authService.storePasswordResetOtp(user.id, otp);

    // Send OTP email
    await sendPasswordResetOtpEmail({
      to: user.email,
      name: user.name,
      otp,
    });

    res.json({
      success: true,
      message: 'If an account exists with this email, a 6-digit verification code has been sent.',
    });

  } catch (error) {
    console.error('[AUTH CONTROLLER] Forgot password error:', error);
    if (error.code === 'ER_BAD_FIELD_ERROR') {
      return res.status(503).json({
        error: 'Database not ready',
        message: 'Run migration: node backend/database/run_password_reset_otp_migration.js',
      });
    }
    res.status(500).json({ error: 'Password reset request failed' });
  }
}

/**
 * Verify OTP (optional endpoint for frontend validation)
 * POST /auth/verify-otp
 */
async function verifyOtp(req, res) {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Email and OTP are required'
      });
    }

    // Find user with valid OTP
    const user = await authService.findUserWithValidOtp(email);

    if (!user || !otpMatchesStored(otp, user.reset_otp)) {
      return res.status(400).json({
        error: 'Invalid or expired code',
        message: 'The code is incorrect or has expired.'
      });
    }

    res.json({
      success: true,
      message: 'OTP verified successfully',
    });

  } catch (error) {
    console.error('[AUTH CONTROLLER] Verify OTP error:', error);
    res.status(500).json({ error: 'OTP verification failed' });
  }
}

/**
 * Reset password with OTP
 * POST /auth/reset-password
 */
async function resetPassword(req, res) {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Email, OTP, and new password are required'
      });
    }

    // Find user with valid OTP
    const user = await authService.findUserWithValidOtp(email);

    if (!user || !otpMatchesStored(otp, user.reset_otp)) {
      return res.status(400).json({
        error: 'Invalid or expired code',
        message: 'The code is incorrect or has expired. Request a new code from Forgot password.',
      });
    }

    // Reset password and clear OTP
    await authService.resetPasswordWithOtp(user.id, newPassword);

    res.json({
      success: true,
      message: 'Password reset successful. Please login with your new password.',
    });

  } catch (error) {
    console.error('[AUTH CONTROLLER] Password reset error:', error);
    if (error.code === 'ER_BAD_FIELD_ERROR') {
      return res.status(503).json({
        error: 'Database not ready',
        message: 'Run migration: node backend/database/run_password_reset_otp_migration.js',
      });
    }
    res.status(500).json({ error: 'Password reset failed' });
  }
}

/**
 * Verify email with token
 * POST /auth/verify-email
 */
async function verifyEmail(req, res) {
  try {
    const { token } = req.body;

    // Verify token
    const decoded = verifyToken(token);
    if (!decoded || decoded.type !== 'email_verification') {
      return res.status(400).json({ error: 'Invalid or expired verification token' });
    }

    // Update user
    await authService.verifyUserEmail(decoded.userId);

    res.json({
      success: true,
      message: 'Email verified successfully. You can now login.',
    });

  } catch (error) {
    console.error('[AUTH CONTROLLER] Email verification error:', error);
    res.status(500).json({ error: 'Email verification failed' });
  }
}

/**
 * Change password (authenticated user)
 * POST /auth/change-password
 */
async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    // Get user
    const user = await authService.findUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user with password hash
    const userWithPassword = await authService.findUserByEmail(user.email);

    // Verify current password
    const isValid = await authService.verifyPassword(currentPassword, userWithPassword.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Update password
    await authService.updateUserPassword(userId, newPassword);

    res.json({
      success: true,
      message: 'Password changed successfully',
    });

  } catch (error) {
    console.error('[AUTH CONTROLLER] Change password error:', error);
    res.status(500).json({ error: 'Password change failed' });
  }
}

/**
 * Get current user profile
 * GET /auth/me
 */
async function getCurrentUser(req, res) {
  try {
    const userId = req.user.id;

    const user = await authService.findUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get society info
    const societies = await authService.getUserSocieties(userId);

    res.json({
      success: true,
      user: {
        ...user,
        societies,
      },
    });

  } catch (error) {
    console.error('[AUTH CONTROLLER] Get current user error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
}

module.exports = {
  register,
  login,
  refreshAccessToken,
  logout,
  forgotPassword,
  verifyOtp,
  resetPassword,
  verifyEmail,
  changePassword,
  getCurrentUser,
};
