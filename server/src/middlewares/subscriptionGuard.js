const Company = require('../models/Company');
const { AppError } = require('./errorHandler');

/**
 * Garde d'abonnement SaaS.
 *
 * Vérifie que l'entreprise a un abonnement ACTIF et non expiré.
 * Si un moduleCode est fourni, vérifie aussi que le module est dans le forfait.
 *
 * @param {string|null} moduleCode - Code du module à vérifier (ex: 'COMPTABILITE'). null = vérif abonnement seule.
 * @returns middleware Express
 */
const subscriptionGuard = (moduleCode = null) => {
  return async (req, _res, next) => {
    try {
      // Le super_admin de plateforme et les routes sans tenant bypasse
      if (req.scope === 'PLATFORM') return next();

      const companyId = req.companyId;
      if (!companyId) {
        return next(new AppError('Entreprise non identifiee.', 403));
      }

      // Charger l'entreprise avec son abonnement actif et son forfait
      const company = await Company.findById(companyId).populate({
        path: 'abonnementActifId',
        populate: { path: 'forfaitId' },
      });

      if (!company) {
        return next(new AppError('Entreprise introuvable.', 404));
      }

      // Entreprise suspendue manuellement par le super_admin
      if (company.status === 'suspended') {
        return next(
          new AppError(
            'Votre entreprise est suspendue. Veuillez contacter le support.',
            403
          )
        );
      }

      // Pas d'abonnement actif du tout
      const abonnement = company.abonnementActifId;
      if (!abonnement) {
        return next(
          new AppError(
            'Aucun abonnement actif. Souscrivez a un forfait pour acceder a cette fonctionnalite.',
            403
          )
        );
      }

      // Abonnement expiré (statut ou date)
      const maintenant = new Date();
      if (abonnement.statut !== 'ACTIF' || abonnement.dateFin < maintenant) {
        // Synchroniser le statut si nécessaire (sans bloquer la requête pour ça)
        if (abonnement.statut === 'ACTIF') {
          abonnement.statut = 'EXPIRE';
          abonnement.save().catch(() => {});
          company.status = 'expired';
          company.save({ validateBeforeSave: false }).catch(() => {});
        }

        return next(
          new AppError(
            'Votre abonnement est expire ou inactif. Renouvelez votre abonnement pour continuer.',
            403
          )
        );
      }

      // Vérification du module si demandé
      if (moduleCode) {
        const forfait = abonnement.forfaitId;
        const modulesInclus = forfait?.modulesInclus || [];

        if (!modulesInclus.includes(moduleCode)) {
          return next(
            new AppError(
              `Le module "${moduleCode}" n'est pas inclus dans votre forfait "${forfait?.nom || 'actuel'}". Passez a un forfait superieur.`,
              403
            )
          );
        }
      }

      // Attacher pour usage dans les controllers
      req.abonnement = abonnement;
      req.forfait = abonnement.forfaitId;

      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = subscriptionGuard;
