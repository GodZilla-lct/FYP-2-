/**
 * Enhanced Centralized Error Handling Middleware
 * Phase 2: The Safety Net
 * 
 * This middleware provides:
 * - Consistent JSON error responses
 * - Detailed logging with user context
 * - Environment-aware stack traces
 * - Specific error type handling
 */

const logger = require('../config/logger');
const multer = require('multer');

/**
 * Custom Application Error Class
 * Use this in controllers/services to throw structured errors
 */
class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true; // Distinguishes operational errors from programming errors
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 404 Handler for undefined routes
 * Mount this AFTER all route definitions
 */
function notFoundHandler(req, res) {
  logger.warn(`[404] ${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
    userId: req.user?.id,
  });

  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} does not exist`,
    code: 'ROUTE_NOT_FOUND',
    timestamp: new Date().toISOString(),
  });
}

/**
 * Global Express Error Handler
 * This catches ALL errors passed via next(err)
 * 
 * @param {Error} err - The error object
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 * @param {Function} next - Express next function
 */
function globalErrorHandler(err, req, res, next) {
  // Default values
  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || 'Internal server error';
  let code = err.code || 'INTERNAL_ERROR';
  let details = err.details || null;

  // Log the error with context
  const errorContext = {
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    ip: req.ip,
    userId: req.user?.id || 'anonymous',
    userEmail: req.user?.email || 'N/A',
    userRole: req.user?.role || 'N/A',
    body: req.body ? JSON.stringify(req.body).substring(0, 200) : 'N/A',
    query: req.query ? JSON.stringify(req.query) : 'N/A',
    statusCode,
    errorCode: code,
    errorMessage: message,
  };

  // Log based on severity
  if (statusCode >= 500) {
    logger.error('Server Error', {
      ...errorContext,
      stack: err.stack,
    });
  } else if (statusCode >= 400) {
    logger.warn('Client Error', errorContext);
  }

  // Handle specific error types
  
  // 1. Multer file upload errors
  if (err instanceof multer.MulterError) {
    statusCode = 400;
    code = 'FILE_UPLOAD_ERROR';
    
    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        message = 'File size exceeds the maximum limit of 10MB';
        code = 'FILE_TOO_LARGE';
        break;
      case 'LIMIT_FILE_COUNT':
        message = 'Too many files uploaded. Maximum 5 files allowed';
        code = 'TOO_MANY_FILES';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = 'Unexpected file field. Please check the field name';
        code = 'INVALID_FILE_FIELD';
        break;
      default:
        message = `File upload error: ${err.message}`;
    }
  }

  // 2. Validation errors (from express-validator or custom)
  else if (err.name === 'ValidationError' || code === 'VALIDATION_ERROR') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = 'Validation failed';
    
    // If details are provided, use them
    if (err.errors && Array.isArray(err.errors)) {
      details = err.errors;
    }
  }

  // 3. JWT errors
  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    code = 'INVALID_TOKEN';
    message = 'Authentication token is invalid or malformed';
  }
  else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    code = 'TOKEN_EXPIRED';
    message = 'Authentication token has expired. Please login again';
  }

  // 4. JSON parsing errors
  else if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    statusCode = 400;
    code = 'INVALID_JSON';
    message = 'Request body contains invalid JSON';
  }

  // 5. Database errors
  else if (err.code && typeof err.code === 'string' && err.code.startsWith('ER_')) {
    statusCode = 500;
    code = 'DATABASE_ERROR';
    
    // Provide user-friendly messages for common DB errors
    switch (err.code) {
      case 'ER_DUP_ENTRY':
        statusCode = 409;
        code = 'DUPLICATE_ENTRY';
        message = 'A record with this information already exists';
        break;
      case 'ER_NO_REFERENCED_ROW':
      case 'ER_NO_REFERENCED_ROW_2':
        statusCode = 400;
        code = 'INVALID_REFERENCE';
        message = 'Referenced record does not exist';
        break;
      case 'ER_ROW_IS_REFERENCED':
      case 'ER_ROW_IS_REFERENCED_2':
        statusCode = 409;
        code = 'RECORD_IN_USE';
        message = 'Cannot delete record as it is being used elsewhere';
        break;
      case 'ER_BAD_FIELD_ERROR':
        statusCode = 500;
        code = 'DATABASE_SCHEMA_ERROR';
        message = 'Database schema mismatch. Please run migrations';
        break;
      case 'ER_ACCESS_DENIED_ERROR':
        statusCode = 500;
        code = 'DATABASE_ACCESS_DENIED';
        message = 'Database access denied. Check credentials';
        break;
      case 'ECONNREFUSED':
        statusCode = 503;
        code = 'DATABASE_UNAVAILABLE';
        message = 'Database server is unavailable';
        break;
      default:
        message = 'A database error occurred while processing your request';
        
        // In development, provide more details
        if (process.env.NODE_ENV === 'development') {
          details = {
            sqlMessage: err.sqlMessage,
            sqlState: err.sqlState,
            errno: err.errno,
          };
        }
    }
  }

  // 6. Zod validation errors (from Step 2)
  else if (err.name === 'ZodError') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = 'Input validation failed';
    details = err.errors.map(e => ({
      field: e.path.join('.'),
      message: e.message,
      code: e.code,
    }));
  }

  // Build response object
  const errorResponse = {
    success: false,
    error: message,
    message: message, // Duplicate for backward compatibility
    code: code,
    timestamp: new Date().toISOString(),
  };

  // Add details if available
  if (details) {
    errorResponse.details = details;
  }

  // Add stack trace in development
  if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'dev') {
    errorResponse.stack = err.stack;
    errorResponse.raw = {
      name: err.name,
      message: err.message,
    };
  }

  // Send response
  res.status(statusCode).json(errorResponse);
}

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors and pass to error handler
 * 
 * Usage:
 * router.get('/route', asyncHandler(async (req, res) => {
 *   // Your async code here
 * }));
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Create a custom error
 * Helper function to throw structured errors
 * 
 * Usage:
 * throw createError('User not found', 404, 'USER_NOT_FOUND');
 */
function createError(message, statusCode = 500, code = 'INTERNAL_ERROR', details = null) {
  return new AppError(message, statusCode, code, details);
}

module.exports = {
  AppError,
  notFoundHandler,
  globalErrorHandler,
  asyncHandler,
  createError,
  
  // Backward compatibility
  errorHandler: globalErrorHandler,
};
