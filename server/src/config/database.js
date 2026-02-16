const mongoose = require('mongoose');
const logger = require('./logger');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      autoIndex: true,
    });

    logger.info(`MongoDB connecte: ${conn.connection.host}:${conn.connection.port}/${conn.connection.name}`);

    mongoose.connection.on('error', (err) => {
      logger.error(`Erreur MongoDB: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB deconnecte. Tentative de reconnexion...');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnecte avec succes');
    });

    return conn;
  } catch (error) {
    logger.error(`Erreur de connexion MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
