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

// Initialiser le service de notification
const { initNotificationService } = require('./src/services/notificationService');
initNotificationService(io);

// Middleware d'authentification Socket.io
const jwt = require('jsonwebtoken');
const jwtConfig = require('./src/config/jwt');

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) {
    return next(new Error('Authentification requise'));
  }
  try {
    const decoded = jwt.verify(token, jwtConfig.accessToken.secret);
    socket.userId = decoded.id;
    socket.userRole = decoded.role;
    next();
  } catch (err) {
    return next(new Error('Token invalide'));
  }
});

io.on('connection', (socket) => {
  logger.info(`Socket connecte: ${socket.id} (user: ${socket.userId})`);

  // Auto-join user room based on authenticated identity
  if (socket.userId) {
    socket.join(`user:${socket.userId}`);
    logger.info(`Socket ${socket.id} rejoint room user:${socket.userId}`);
  }

  // Join user-specific room and role room
  socket.on('join', ({ userId, role }) => {
    if (userId && userId === socket.userId) {
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
// Redis (optionnel)
const { connectRedis, disconnectRedis } = require('./src/config/redis');

const startServer = async () => {
  try {
    // Connexion a MongoDB
    await connectDB();

    // Connexion a Redis (optionnel, pour le cache)
    await connectRedis();

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
    await disconnectRedis();
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
