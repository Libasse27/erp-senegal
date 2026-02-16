const logger = require('../config/logger');

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

const errorHandler = (err, _req, res, _next) => {
  let error = { ...err };
  error.message = err.message;

  logger.error(`${err.message}`, { stack: err.stack });

  // Mongoose: ID invalide
  if (err.name === 'CastError') {
    error = new AppError('Ressource non trouvee. Identifiant invalide.', 404);
  }

  // Mongoose: Champ unique duplique
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    error = new AppError(
      `La valeur "${value}" existe deja pour le champ "${field}". Veuillez utiliser une autre valeur.`,
      400
    );
  }

  // Mongoose: Erreur de validation
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((val) => val.message);
    error = new AppError(`Erreur de validation: ${messages.join('. ')}`, 400);
  }

  // JWT: Token invalide
  if (err.name === 'JsonWebTokenError') {
    error = new AppError('Token invalide. Veuillez vous reconnecter.', 401);
  }

  // JWT: Token expire
  if (err.name === 'TokenExpiredError') {
    error = new AppError('Token expire. Veuillez vous reconnecter.', 401);
  }

  // Multer: Fichier trop volumineux
  if (err.code === 'LIMIT_FILE_SIZE') {
    error = new AppError('Le fichier est trop volumineux. Taille maximale: 5 Mo.', 400);
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.statusCode ? error.message : 'Erreur interne du serveur',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = { AppError, errorHandler };
