/**
 * Generic Request Validation Middleware
 * Phase 2: The Bouncer
 * 
 * Intercepts requests and validates them against Zod schemas
 * Returns 400 Bad Request with field errors if validation fails
 */

const { ZodError } = require('zod');
const logger = require('../config/logger');

/**
 * Validate request against a Zod schema
 * 
 * @param {ZodSchema} schema - Zod validation schema
 * @returns {Function} Express middleware function
 * 
 * Usage:
 * router.post('/login', validate(loginSchema), authController.login);
 */
function validate(schema) {
  return async (req, res, next) => {
    try {
      // Validate the request against the schema
      const validated = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      // Replace request data with validated data
      req.body = validated.body || req.body;
      req.query = validated.query || req.query;
      req.params = validated.params || req.params;

      // Log successful validation in debug mode
      logger.debug('Request validation passed', {
        method: req.method,
        path: req.path,
        userId: req.user?.id,
      });

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Format Zod errors into user-friendly messages
        // Guard: error.errors may be undefined in some Zod versions
        const rawErrors = Array.isArray(error.errors) ? error.errors : (error.issues || []);
        const errors = rawErrors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
          received: err.received,
        }));

        // Log validation failure
        logger.warn('Request validation failed', {
          method: req.method,
          path: req.path,
          userId: req.user?.id || 'anonymous',
          errors: errors,
          body: JSON.stringify(req.body).substring(0, 200),
        });

        // Return 400 Bad Request with detailed errors
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          message: 'One or more fields contain invalid data',
          code: 'VALIDATION_ERROR',
          details: errors,
          timestamp: new Date().toISOString(),
        });
      }

      // If it's not a Zod error, pass to global error handler
      next(error);
    }
  };
}

/**
 * Validate request body only
 * Shorthand for validating just the body
 * 
 * @param {ZodSchema} bodySchema - Zod schema for body
 * @returns {Function} Express middleware function
 */
function validateBody(bodySchema) {
  return validate(bodySchema.shape({ body: bodySchema }));
}

/**
 * Validate request params only
 * Shorthand for validating just the params
 * 
 * @param {ZodSchema} paramsSchema - Zod schema for params
 * @returns {Function} Express middleware function
 */
function validateParams(paramsSchema) {
  return validate(paramsSchema.shape({ params: paramsSchema }));
}

/**
 * Validate request query only
 * Shorthand for validating just the query
 * 
 * @param {ZodSchema} querySchema - Zod schema for query
 * @returns {Function} Express middleware function
 */
function validateQuery(querySchema) {
  return validate(querySchema.shape({ query: querySchema }));
}

/**
 * Sanitize request data
 * Removes potentially dangerous characters
 * 
 * @returns {Function} Express middleware function
 */
function sanitizeRequest() {
  return (req, res, next) => {
    // Sanitize body
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeObject(req.body);
    }

    // Sanitize query
    if (req.query && typeof req.query === 'object') {
      req.query = sanitizeObject(req.query);
    }

    next();
  };
}

/**
 * Recursively sanitize an object
 * Removes null bytes and trims strings
 * 
 * @param {Object} obj - Object to sanitize
 * @returns {Object} Sanitized object
 */
function sanitizeObject(obj) {
  const sanitized = {};

  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined) {
      sanitized[key] = value;
    } else if (typeof value === 'string') {
      // Remove null bytes and trim
      sanitized[key] = value.replace(/\0/g, '').trim();
    } else if (typeof value === 'object' && !Array.isArray(value)) {
      sanitized[key] = sanitizeObject(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map((item) =>
        typeof item === 'object' ? sanitizeObject(item) : item
      );
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

module.exports = {
  validate,
  validateBody,
  validateParams,
  validateQuery,
  sanitizeRequest,
};
