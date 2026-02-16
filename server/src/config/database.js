const mongoose = require('mongoose');
const logger = require('./logger');

const MAX_RETRIES = 5;
const RETRY_INTERVAL_MS = 5000;

/**
 * Connect to MongoDB with automatic retry and reconnection handling
 * @param {number} retryCount - Current retry attempt number
 * @returns {Object} Mongoose connection
 */
const connectDB = async (retryCount = 0) => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      autoIndex: process.env.NODE_ENV !== 'production',
      maxPoolSize: 10,
      minPoolSize: 2,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 10000,
      heartbeatFrequencyMS: 10000,
    });

    logger.info(
      `MongoDB connecte: ${conn.connection.host}:${conn.connection.port}/${conn.connection.name}`
    );

    // Connection event handlers
    mongoose.connection.on('error', (err) => {
      logger.error(`Erreur MongoDB: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB deconnecte. Mongoose tentera de se reconnecter automatiquement.');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnecte avec succes');
    });

    return conn;
  } catch (error) {
    logger.error(`Erreur de connexion MongoDB (tentative ${retryCount + 1}/${MAX_RETRIES}): ${error.message}`);

    if (retryCount < MAX_RETRIES - 1) {
      const delay = RETRY_INTERVAL_MS * Math.pow(2, retryCount);
      logger.info(`Nouvelle tentative dans ${delay / 1000} secondes...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return connectDB(retryCount + 1);
    }

    logger.error('Nombre maximum de tentatives de connexion atteint. Arret du serveur.');
    process.exit(1);
  }
};

/**
 * Graceful shutdown — close MongoDB connection properly
 */
const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    logger.info('MongoDB deconnecte proprement');
  } catch (error) {
    logger.error(`Erreur lors de la deconnexion MongoDB: ${error.message}`);
  }
};

module.exports = { connectDB, disconnectDB };
