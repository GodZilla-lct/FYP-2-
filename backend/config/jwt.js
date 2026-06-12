const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_change_in_production';
const ACCESS_TOKEN_EXPIRY = process.env.JWT_EXPIRY || '15m'; // Use env var, default 15 minutes
const REFRESH_TOKEN_EXPIRY = '7d';

/**
 * Generate access token (15-minute expiry)
 * Short-lived for security - use refresh token to get new access tokens
 */
function generateAccessToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      type: 'access', // Token type identifier
    },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
}

/**
 * Generate refresh token (7-day expiry)
 * Used to obtain new access tokens without re-authentication
 */
function generateRefreshToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      type: 'refresh', // Token type identifier
    },
    JWT_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );
}

/**
 * Verify token
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

/**
 * Generate email verification token
 */
function generateEmailVerificationToken(userId) {
  return jwt.sign(
    { userId, type: 'email_verification' },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  generateEmailVerificationToken,
  JWT_SECRET,
  ACCESS_TOKEN_EXPIRY,
  REFRESH_TOKEN_EXPIRY,
};
