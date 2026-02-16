const http = require('http');
const dotenv = require('dotenv');

// Charger les variables d'environnement
dotenv.config({ path: '../.env' });

const app = require('./app');
const { connectDB, disconnectDB } = require('./src/config/database');
const logger = require('./src/config/logger');

// Creer le serveur HTTP
const server = http.createServer(app);

// Socket.io
const { Server } = require('socket.io');
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Rendre io accessible dans les routes
app.set('io', io);

io.on('connection', (socket) => {
  logger.info(`Socket connecte: ${socket.id}`);

  // Join user-specific room
  socket.on('join', ({ userId, role }) => {
    if (userId) {
      socket.join(`user:${userId}`);
      logger.info(`Socket ${socket.id} rejoint room user:${userId}`);
    }
    if (role) {
      socket.join(`role:${role}`);
      logger.info(`Socket ${socket.id} rejoint room role:${role}`);
    }
  });

  // Leave rooms on disconnect
  socket.on('disconnect', () => {
    logger.info(`Socket deconnecte: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5000;

// Demarrer le serveur
const startServer = async () => {
  try {
    // Connexion a MongoDB
    await connectDB();

    server.listen(PORT, () => {
      logger.info(`Serveur demarre sur le port ${PORT} en mode ${process.env.NODE_ENV}`);
      logger.info(`API disponible sur http://localhost:${PORT}/api`);
    });
  } catch (error) {
    logger.error(`Erreur au demarrage: ${error.message}`);
    process.exit(1);
  }
};

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  logger.info(`Signal ${signal} recu. Arret gracieux...`);
  server.close(async () => {
    await disconnectDB();
    process.exit(0);
  });
  // Force exit after 10 seconds
  setTimeout(() => process.exit(1), 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Gestion des erreurs non capturees
process.on('unhandledRejection', (err) => {
  logger.error(`Erreur non geree: ${err.message}`);
  server.close(() => process.exit(1));
});

process.on('uncaughtException', (err) => {
  logger.error(`Exception non capturee: ${err.message}`);
  server.close(() => process.exit(1));
});

startServer();
