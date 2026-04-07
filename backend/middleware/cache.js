const { cacheGet, cacheSet } = require('../config/redis');

/**
 * Cache middleware for GET requests
 * @param {number} expirySeconds - Cache expiry time in seconds
 */
function cacheMiddleware(expirySeconds = 300) {
  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Generate cache key from URL and query params
    const cacheKey = `cache:${req.originalUrl}`;

    try {
      // Try to get from cache
      const cachedData = await cacheGet(cacheKey);

      if (cachedData) {
        console.log(`Cache HIT: ${cacheKey}`);
        return res.json(cachedData);
      }

      console.log(`Cache MISS: ${cacheKey}`);

      // Store original res.json
      const originalJson = res.json.bind(res);

      // Override res.json to cache the response
      res.json = (data) => {
        // Cache the response
        cacheSet(cacheKey, data, expirySeconds).catch(err => {
          console.error('Cache set error:', err);
        });

        // Send response
        return originalJson(data);
      };

      next();

    } catch (error) {
      console.error('Cache middleware error:', error);
      next();
    }
  };
}

/**
 * Invalidate cache by pattern
 */
async function invalidateCache(pattern) {
  const { cacheDeletePattern } = require('../config/redis');
  try {
    await cacheDeletePattern(pattern);
    console.log(`Cache invalidated: ${pattern}`);
  } catch (error) {
    console.error('Cache invalidation error:', error);
  }
}

module.exports = {
  cacheMiddleware,
  invalidateCache,
};
