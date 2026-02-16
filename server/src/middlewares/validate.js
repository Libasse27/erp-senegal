const { AppError } = require('./errorHandler');

/**
 * Middleware de validation Joi generique
 * @param {Object} schema - Schema Joi a valider
 * @param {string} source - Source des donnees ('body', 'params', 'query')
 */
const validate = (schema, source = 'body') => {
  return (req, _res, next) => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false,
      stripUnknown: true,
      errors: {
        wrap: { label: '' },
      },
    });

    if (error) {
      const messages = error.details.map((detail) => detail.message).join('. ');
      return next(new AppError(`Erreur de validation: ${messages}`, 400));
    }

    // Remplacer les donnees par les donnees validees/nettoyees
    req[source] = value;
    next();
  };
};

module.exports = validate;
