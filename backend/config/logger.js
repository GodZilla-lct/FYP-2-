/**
 * Structured Logging Configuration
 * Phase 2: The Trail
 * 
 * Uses Winston for structured logging with:
 * - Different log levels (error, warn, info, debug)
 * - File-based logging (errors.log, combined.log)
 * - Console logging with colors
 * - JSON formatting for production
 * - Request context tracking
 */

const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Console format with colors for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    
    // Add metadata if present
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta, null, 2)}`;
    }
    
    return msg;
  })
);

// Create the logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  format: logFormat,
  defaultMeta: {
    service: 'campus-connect-api',
    environment: process.env.NODE_ENV || 'development',
  },
  transports: [
    // Write all logs with level 'error' and below to errors.log
    new winston.transports.File({
      filename: path.join(logsDir, 'errors.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    
    // Write all logs with level 'info' and below to combined.log
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
  
  // Handle exceptions and rejections
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'exceptions.log'),
    }),
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'rejections.log'),
    }),
  ],
});

// Add console transport in non-production environments
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: consoleFormat,
    })
  );
}

// Create a stream object for Morgan HTTP logger
logger.stream = {
  write: (message) => {
    logger.info(message.trim());
  },
};

/**
 * Log HTTP request
 */
logger.logRequest = (req, statusCode, responseTime) => {
  const logData = {
    method: req.method,
    path: req.path,
    statusCode,
    responseTime: `${responseTime}ms`,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    userId: req.user?.id || 'anonymous',
  };

  if (statusCode >= 500) {
    logger.error('HTTP Request Failed', logData);
  } else if (statusCode >= 400) {
    logger.warn('HTTP Request Error', logData);
  } else {
    logger.info('HTTP Request', logData);
  }
};

/**
 * Log authentication events
 */
logger.logAuth = (event, userId, email, success, details = {}) => {
  const logData = {
    event,
    userId,
    email,
    success,
    ...details,
  };

  if (success) {
    logger.info(`Auth: ${event}`, logData);
  } else {
    logger.warn(`Auth Failed: ${event}`, logData);
  }
};

/**
 * Log database operations
 */
logger.logDatabase = (operation, table, success, details = {}) => {
  const logData = {
    operation,
    table,
    success,
    ...details,
  };

  if (success) {
    logger.debug(`Database: ${operation}`, logData);
  } else {
    logger.error(`Database Error: ${operation}`, logData);
  }
};

/**
 * Log security events
 */
logger.logSecurity = (event, severity, details = {}) => {
  const logData = {
    event,
    severity,
    ...details,
  };

  if (severity === 'critical' || severity === 'high') {
    logger.error(`Security: ${event}`, logData);
  } else if (severity === 'medium') {
    logger.warn(`Security: ${event}`, logData);
  } else {
    logger.info(`Security: ${event}`, logData);
  }
};

module.exports = logger;
