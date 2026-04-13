const redis = require('redis');

let redisClient;

/**
 * Initialize Redis client
 */
async function initializeRedis() {
  try {
    const isDev = process.env.NODE_ENV !== 'production';

    // Skip Redis in development if not configured
    if (!process.env.REDIS_URL && isDev) {
      console.log('⚠️  Redis not configured - caching disabled (development mode)');
      return null;
    }

    redisClient = redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        connectTimeout: isDev ? 2500 : 10000,
        reconnectStrategy: (retries) => {
          if (isDev && retries > 2) {
            return new Error('Redis unavailable (development)');
          }
          if (retries > 10) {
            console.error('Redis connection failed after 10 retries');
            return new Error('Redis connection failed');
          }
          return Math.min(retries * 100, 3000);
        },
      },
    });

    redisClient.on('error', (err) => {
      console.error('Redis error:', err);
    });

    redisClient.on('connect', () => {
      console.log('✓ Redis connected successfully');
    });

    await redisClient.connect();
    return redisClient;

  } catch (error) {
    console.error('Redis initialization error:', error);
    console.log('⚠️  Continuing without Redis caching');
    return null;
  }
}

/**
 * Get Redis client
 */
function getRedisClient() {
  return redisClient;
}

/**
 * Cache data with expiry
 */
async function cacheSet(key, value, expirySeconds = 3600) {
  if (!redisClient) return false;
  
  try {
    await redisClient.setEx(key, expirySeconds, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error('Redis set error:', error);
    return false;
  }
}

/**
 * Get cached data
 */
async function cacheGet(key) {
  if (!redisClient) return null;
  
  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Redis get error:', error);
    return null;
  }
}

/**
 * Delete cached data
 */
async function cacheDelete(key) {
  if (!redisClient) return false;
  
  try {
    await redisClient.del(key);
    return true;
  } catch (error) {
    console.error('Redis delete error:', error);
    return false;
  }
}

/**
 * Delete cached data by pattern
 */
async function cacheDeletePattern(pattern) {
  if (!redisClient) return false;
  
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
    return true;
  } catch (error) {
    console.error('Redis delete pattern error:', error);
    return false;
  }
}

/**
 * Close Redis connection
 */
async function closeRedis() {
  if (redisClient) {
    await redisClient.quit();
  }
}

module.exports = {
  initializeRedis,
  getRedisClient,
  cacheSet,
  cacheGet,
  cacheDelete,
  cacheDeletePattern,
  closeRedis,
};
