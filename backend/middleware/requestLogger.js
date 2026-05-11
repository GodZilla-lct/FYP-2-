/**
 * HTTP Request Logging Middleware
 * Phase 2: The Trail
 * 
 * Uses Morgan for HTTP request logging
 * Logs all incoming API requests with method, route, status, and time
 */

const morgan = require('morgan');
const logger = require('../config/logger');

/**
 * Custom Morgan token for user ID
 */
morgan.token('user-id', (req) => {
  return req.user?.id || 'anonymous';
});

/**
 * Custom Morgan token for user email
 */
morgan.token('user-email', (req) => {
  return req.user?.email || 'N/A';
});

/**
 * Custom Morgan token for user role
 */
morgan.token('user-role', (req) => {
  return req.user?.role || 'N/A';
});

/**
 * Custom Morgan token for request ID (if available)
 */
morgan.token('request-id', (req) => {
  return req.id || 'N/A';
});

/**
 * Development format - detailed with colors
 */
const developmentFormat = morgan(
  ':method :url :status :response-time ms - :res[content-length] - User: :user-id (:user-role)',
  {
    stream: {
      write: (message) => {
        logger.info(message.trim());
      },
    },
  }
);

/**
 * Production format - JSON structured logging
 */
const productionFormat = morgan(
  (tokens, req, res) => {
    return JSON.stringify({
      method: tokens.method(req, res),
      url: tokens.url(req, res),
      status: tokens.status(req, res),
      responseTime: `${tokens['response-time'](req, res)}ms`,
      contentLength: tokens.res(req, res, 'content-length'),
      userAgent: tokens['user-agent'](req, res),
      ip: tokens['remote-addr'](req, res),
      userId: tokens['user-id'](req, res),
      userEmail: tokens['user-email'](req, res),
      userRole: tokens['user-role'](req, res),
      timestamp: new Date().toISOString(),
    });
  },
  {
    stream: {
      write: (message) => {
        const log = JSON.parse(message);
        const status = parseInt(log.status);

        if (status >= 500) {
          logger.error('HTTP Request', log);
        } else if (status >= 400) {
          logger.warn('HTTP Request', log);
        } else {
          logger.info('HTTP Request', log);
        }
      },
    },
  }
);

/**
 * Skip logging for health check and static assets
 */
const skipPaths = ['/health', '/favicon.ico', '/uploads'];

const shouldSkip = (req) => {
  return skipPaths.some((path) => req.path.startsWith(path));
};

/**
 * Get appropriate Morgan middleware based on environment
 */
function getRequestLogger() {
  // developmentFormat and productionFormat are already compiled Morgan middlewares.
  // Return them directly — do NOT wrap in morgan() again.
  if (process.env.NODE_ENV === 'production') {
    return productionFormat;
  }
  return developmentFormat;
}

/**
 * Request ID middleware
 * Adds a unique ID to each request for tracking
 */
function addRequestId(req, res, next) {
  req.id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  res.setHeader('X-Request-ID', req.id);
  next();
}

/**
 * Response time middleware
 * Tracks how long each request takes
 */
function trackResponseTime(req, res, next) {
  const startTime = Date.now();

  // Listen for response finish event
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;

    // Log slow requests (> 1 second)
    if (responseTime > 1000) {
      logger.warn('Slow Request Detected', {
        method: req.method,
        path: req.path,
        responseTime: `${responseTime}ms`,
        userId: req.user?.id || 'anonymous',
        statusCode: res.statusCode,
      });
    }
  });

  next();
}

/**
 * Security headers middleware
 * Adds security-related headers to responses
 */
function addSecurityHeaders(req, res, next) {
  // Add request timestamp
  res.setHeader('X-Request-Time', new Date().toISOString());

  // Add rate limit info if available
  if (req.rateLimit) {
    res.setHeader('X-RateLimit-Limit', req.rateLimit.limit);
    res.setHeader('X-RateLimit-Remaining', req.rateLimit.remaining);
    res.setHeader('X-RateLimit-Reset', new Date(req.rateLimit.resetTime).toISOString());
  }

  next();
}

module.exports = {
  getRequestLogger,
  addRequestId,
  trackResponseTime,
  addSecurityHeaders,
  developmentFormat,
  productionFormat,
};
