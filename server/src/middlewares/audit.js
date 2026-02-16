const AuditLog = require('../models/AuditLog');
const logger = require('../config/logger');

/**
 * Middleware de tracage automatique des operations CRUD
 * @param {string} module - Nom du module (ex: 'users', 'invoices')
 * @param {string} action - Type d'action (ex: 'create', 'update', 'delete')
 */
const audit = (module, action) => {
  return (req, res, next) => {
    // Sauvegarder la methode originale de res.json
    const originalJson = res.json.bind(res);

    res.json = function (data) {
      // Logger seulement si la requete a reussi
      if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
        const logEntry = {
          user: req.user._id,
          action,
          module,
          ipAddress: req.ip || req.connection?.remoteAddress,
          userAgent: req.headers['user-agent'],
        };

        // Ajouter l'ID du document si disponible
        if (data?.data?._id) {
          logEntry.documentId = data.data._id;
          logEntry.documentModel = module;
        } else if (req.params?.id) {
          logEntry.documentId = req.params.id;
          logEntry.documentModel = module;
        }

        // Description automatique
        logEntry.description = `${req.user.fullName || req.user.email} a effectue ${action} sur ${module}`;

        // Sauvegarder les anciennes donnees pour update/delete
        if (req._previousData) {
          logEntry.previousData = req._previousData;
        }

        // Sauvegarder les nouvelles donnees pour create/update
        if (['create', 'update'].includes(action) && req.body) {
          const sanitizedBody = { ...req.body };
          delete sanitizedBody.password;
          logEntry.newData = sanitizedBody;
        }

        // Creer le log de maniere asynchrone (ne pas bloquer la reponse)
        AuditLog.create(logEntry).catch((err) => {
          logger.error(`Erreur lors de la creation du log d'audit: ${err.message}`);
        });
      }

      return originalJson(data);
    };

    next();
  };
};

module.exports = audit;
