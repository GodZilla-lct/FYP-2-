const multer = require('multer');

/**
 * 404 handler for undefined routes (mount after all routes)
 */
function notFoundHandler(req, res) {
  console.warn(`[404] ${req.method} ${req.path} from ${req.ip}`);
  res.status(404).json({
    success: false,
    error: 'Not found',
    message: `Route ${req.method} ${req.path} not found`,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Global Express error handler — consistent JSON; no stack in production
 */
function errorHandler(err, req, res, next) {
  console.error('[ERROR]', {
    timestamp: new Date().toISOString(),
    ip: req.ip,
    method: req.method,
    path: req.path,
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });

  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File too large',
        message: 'Maximum file size is 10MB',
        code: 'FILE_TOO_LARGE',
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        error: 'Too many files',
        message: 'Maximum 5 files allowed',
        code: 'TOO_MANY_FILES',
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        error: 'Unexpected file field',
        message: 'Invalid file field name',
        code: 'INVALID_FILE_FIELD',
      });
    }
    return res.status(400).json({
      success: false,
      error: 'File upload error',
      message: err.message,
      code: 'UPLOAD_ERROR',
    });
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Validation error',
      message: err.message,
      code: 'VALIDATION_ERROR',
    });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: 'Invalid token',
      message: 'Authentication token is invalid',
      code: 'INVALID_TOKEN',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: 'Token expired',
      message: 'Please login again',
      code: 'TOKEN_EXPIRED',
    });
  }

  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      error: 'Invalid JSON',
      message: 'Request body contains invalid JSON',
      code: 'INVALID_JSON',
    });
  }

  if (err.code && err.code.startsWith('ER_')) {
    console.error('[DATABASE ERROR]', err);
    return res.status(500).json({
      success: false,
      error: 'Database error',
      message: 'An error occurred while processing your request',
      code: 'DATABASE_ERROR',
    });
  }

  const statusCode = err.status || err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    error: err.message || 'Internal server error',
    message: statusCode === 500 ? 'An unexpected error occurred' : err.message,
    code: err.code || 'INTERNAL_ERROR',
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      details: err.details,
    }),
  });
}

module.exports = {
  notFoundHandler,
  errorHandler,
};
