const { verifyToken, generateAccessToken } = require('../config/jwt');
const pool = require('../config/database');

/**
 * Authenticate user via JWT token.
 * Sliding inactivity: every authenticated request issues a fresh 20-minute
 * access token via the X-New-Access-Token response header.
 */
async function authenticate(req, res, next) {
  try {
    const publicPaths = [
      '/auth/login',
      '/auth/register',
      '/auth/refresh',
      '/auth/forgot-password',
      '/auth/reset-password',
      '/auth/verify-email',
      '/health',
      '/proposals/vc-action',
      '/system/settings',
    ];
    if (publicPaths.includes(req.path)) {
      return next();
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required', message: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded || decoded.type !== 'access') {
      return res.status(401).json({ error: 'Authentication failed', message: 'Invalid or expired token' });
    }

    const connection = await pool.getConnection();
    try {
      const [users] = await connection.query(
        'SELECT id, name, email, role, is_active, COALESCE(session_version, 0) AS session_version FROM users WHERE id = ?',
        [decoded.id]
      );

      if (users.length === 0) {
        return res.status(401).json({ error: 'Authentication failed', message: 'User not found' });
      }

      const user = users[0];

      if (!user.is_active) {
        return res.status(403).json({ error: 'Account deactivated', message: 'Your account has been deactivated' });
      }

      const tokenSessionVersion = decoded.sv ?? 0;
      if (tokenSessionVersion !== user.session_version) {
        return res.status(401).json({
          error: 'Session expired',
          message: 'Your session is no longer valid. Please login again.',
        });
      }

      req.user = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      };

      // Sliding session: every authenticated request resets the 20-minute window
      res.setHeader('X-New-Access-Token', generateAccessToken(user));

      next();
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({ error: 'Authentication error' });
  }
}

/**
 * Authorize user based on roles
 */
function authorize(roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        message: `This action requires one of the following roles: ${roles.join(', ')}`
      });
    }
    
    next();
  };
}

/**
 * Optional authentication (doesn't fail if no token)
 */
async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (decoded) {
      const connection = await pool.getConnection();
      try {
        const [users] = await connection.query(
          'SELECT id, name, email, role FROM users WHERE id = ? AND is_active = TRUE',
          [decoded.id]
        );

        if (users.length > 0) {
          req.user = users[0];
        }
      } finally {
        connection.release();
      }
    }

    next();
  } catch (error) {
    console.error('Optional auth error:', error);
    next();
  }
}

/**
 * Super Admin Only Middleware
 * Ensures only SYSTEM_ADMIN role can access
 */
function isSuperAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (req.user.role !== 'SYSTEM_ADMIN') {
    return res.status(403).json({ 
      error: 'Access denied',
      message: 'This endpoint requires SYSTEM_ADMIN privileges'
    });
  }

  next();
}

module.exports = { authenticate, authorize, optionalAuth, isSuperAdmin };
