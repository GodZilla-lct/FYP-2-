const pool = require('../config/database');

/**
 * Log user activity
 */
async function logActivity(req, res, next) {
  // Skip logging for GET requests and health checks
  if (req.method === 'GET' || req.path === '/health') {
    return next();
  }

  // Store original res.json
  const originalJson = res.json.bind(res);

  // Override res.json to log after successful response
  res.json = async (data) => {
    // Only log successful operations
    if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
      try {
        const connection = await pool.getConnection();
        
        const action = `${req.method} ${req.path}`;
        const entityType = extractEntityType(req.path);
        const entityId = extractEntityId(req.params, data);
        const details = {
          method: req.method,
          path: req.path,
          body: sanitizeBody(req.body),
          statusCode: res.statusCode,
        };

        await connection.query(
          'INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [
            req.user.id,
            action,
            entityType,
            entityId,
            JSON.stringify(details),
            req.ip || req.connection.remoteAddress,
            req.get('user-agent') || 'Unknown',
          ]
        );

        connection.release();
      } catch (error) {
        console.error('Activity logging error:', error);
        // Don't fail the request if logging fails
      }
    }

    // Send response
    return originalJson(data);
  };

  next();
}

/**
 * Extract entity type from path
 */
function extractEntityType(path) {
  if (path.includes('/proposals')) return 'PROPOSAL';
  if (path.includes('/societies')) return 'SOCIETY';
  if (path.includes('/users')) return 'USER';
  if (path.includes('/comments')) return 'COMMENT';
  if (path.includes('/budget')) return 'BUDGET';
  if (path.includes('/calendar')) return 'CALENDAR';
  return 'OTHER';
}

/**
 * Extract entity ID from params or response
 */
function extractEntityId(params, data) {
  if (params.id) return parseInt(params.id);
  if (params.proposalId) return parseInt(params.proposalId);
  if (params.societyId) return parseInt(params.societyId);
  if (data && data.proposalId) return data.proposalId;
  if (data && data.societyId) return data.societyId;
  if (data && data.userId) return data.userId;
  return null;
}

/**
 * Sanitize request body (remove sensitive data)
 */
function sanitizeBody(body) {
  if (!body) return {};
  
  const sanitized = { ...body };
  
  // Remove sensitive fields
  delete sanitized.password;
  delete sanitized.password_hash;
  delete sanitized.token;
  delete sanitized.refreshToken;
  
  return sanitized;
}

/**
 * Get activity logs (Admin only)
 * GET /activity-logs
 */
async function getActivityLogs(req, res) {
  const connection = await pool.getConnection();

  try {
    const { userId, entityType, startDate, endDate, limit = 100 } = req.query;

    let query = `
      SELECT al.*, u.name as user_name, u.email as user_email, u.role as user_role
      FROM activity_logs al
      JOIN users u ON al.user_id = u.id
      WHERE 1=1
    `;

    const params = [];

    if (userId) {
      query += ' AND al.user_id = ?';
      params.push(userId);
    }

    if (entityType) {
      query += ' AND al.entity_type = ?';
      params.push(entityType);
    }

    if (startDate) {
      query += ' AND al.created_at >= ?';
      params.push(startDate);
    }

    if (endDate) {
      query += ' AND al.created_at <= ?';
      params.push(endDate);
    }

    query += ' ORDER BY al.created_at DESC LIMIT ?';
    params.push(parseInt(limit));

    const [logs] = await connection.query(query, params);

    res.json({
      success: true,
      logs,
    });

  } catch (error) {
    console.error('Get activity logs error:', error);
    res.status(500).json({ error: 'Failed to fetch activity logs' });
  } finally {
    connection.release();
  }
}

module.exports = {
  logActivity,
  getActivityLogs,
};
