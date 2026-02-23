const { createClient } = require('redis');
const logger = require('./logger');

let redisClient = null;
let isConnected = false;

const connectRedis = async () => {
  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    logger.info('REDIS_URL non definie, cache Redis desactive');
    return null;
  }

  try {
    redisClient = createClient({ url: redisUrl });

    redisClient.on('error', (err) => {
      logger.error(`Erreur Redis: ${err.message}`);
      isConnected = false;
    });

    redisClient.on('connect', () => {
      logger.info('Connexion Redis etablie');
      isConnected = true;
    });

    redisClient.on('reconnecting', () => {
      logger.info('Reconnexion Redis en cours...');
    });

    await redisClient.connect();
    return redisClient;
  } catch (err) {
    logger.error(`Impossible de se connecter a Redis: ${err.message}`);
    redisClient = null;
    isConnected = false;
    return null;
  }
};

const getRedisClient = () => redisClient;
const isRedisConnected = () => isConnected && redisClient !== null;

const disconnectRedis = async () => {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    isConnected = false;
  }
};

module.exports = {
  connectRedis,
  getRedisClient,
  isRedisConnected,
  disconnectRedis,
};
