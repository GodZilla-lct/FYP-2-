const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// SECURITY: Crash immediately if JWT_SECRET is not set — never use the fallback in production
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('[FATAL] JWT_SECRET is not set in .env — server cannot start securely');
  process.exit(1);
}

// Separate secret for refresh tokens — compromise of access secret doesn't affect refresh tokens
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || JWT_SECRET;

// Access token: 20 minutes (inactivity sliding window applied in auth middleware)
const ACCESS_TOKEN_EXPIRY = '20m';
const REFRESH_TOKEN_EXPIRY = '7d';

/**
 * Generate access token — 20-minute TTL.
 * Sliding inactivity: auth middleware re-issues a fresh token on every
 * authenticated request via the X-New-Access-Token header.
 */
function generateAccessToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      type: 'access',
      sv: user.session_version ?? 0,
      jti: crypto.randomUUID(),
    },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
}

/**
 * Generate refresh token — 7-day TTL, signed with separate secret.
 */
function generateRefreshToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      type: 'refresh',
      jti: crypto.randomUUID(),
    },
    REFRESH_TOKEN_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );
}

/**
 * Verify access token
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

/**
 * Verify refresh token (uses separate secret)
 */
function verifyRefreshToken(token) {
  try {
    return jwt.verify(token, REFRESH_TOKEN_SECRET);
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
  verifyRefreshToken,
  generateEmailVerificationToken,
  JWT_SECRET,
  REFRESH_TOKEN_SECRET,
  ACCESS_TOKEN_EXPIRY,
  REFRESH_TOKEN_EXPIRY,
};
