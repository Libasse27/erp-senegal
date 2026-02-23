const { getRedisClient, isRedisConnected } = require('../config/redis');
const logger = require('../config/logger');

/**
 * Cache middleware for GET requests using Redis
 * @param {number} ttl - Time to live in seconds (default: 300 = 5min)
 * @returns {Function} Express middleware
 */
const cache = (ttl = 300) => {
  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') return next();

    // Skip cache if Redis is not connected
    if (!isRedisConnected()) return next();

    const client = getRedisClient();
    const key = `cache:${req.originalUrl}`;

    try {
      const cached = await client.get(key);
      if (cached) {
        const data = JSON.parse(cached);
        return res.json(data);
      }
    } catch (err) {
      logger.error(`Erreur lecture cache Redis: ${err.message}`);
    }

    // Store original json method to intercept response
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      // Cache successful responses only
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          client.setEx(key, ttl, JSON.stringify(body)).catch((err) => {
            logger.error(`Erreur ecriture cache Redis: ${err.message}`);
          });
        } catch (err) {
          logger.error(`Erreur serialisation cache: ${err.message}`);
        }
      }
      return originalJson(body);
    };

    next();
  };
};

/**
 * Invalidate cache for a given URL pattern
 * @param {string} pattern - URL pattern to invalidate (e.g., '/api/settings*')
 * @returns {Function} Express middleware
 */
const invalidateCache = (pattern) => {
  return async (req, res, next) => {
    if (!isRedisConnected()) return next();

    const client = getRedisClient();

    // Store original json method to invalidate after successful mutation
    const originalJson = res.json.bind(res);
    res.json = async (body) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          const keys = [];
          for await (const key of client.scanIterator({ MATCH: `cache:${pattern}`, COUNT: 100 })) {
            keys.push(key);
          }
          if (keys.length > 0) {
            await client.del(keys);
          }
        } catch (err) {
          logger.error(`Erreur invalidation cache: ${err.message}`);
        }
      }
      return originalJson(body);
    };

    next();
  };
};

module.exports = { cache, invalidateCache };
