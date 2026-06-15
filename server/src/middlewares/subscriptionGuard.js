const Company = require('../models/Company');
const { AppError } = require('./errorHandler');

/**
 * Garde d'abonnement SaaS.
 *
 * Vérifie que l'entreprise a un abonnement actif et non expiré.
 * Si un moduleCode est fourni, vérifie que le module est dans planSnapshot.modules
 * (grandfathering : on lit le snapshot figé, pas le Plan vivant).
 *
 * @param {string|null} moduleCode  Code du module requis (ex: 'COMPTABILITE'). null = vérif abonnement seule.
 */
const subscriptionGuard = (moduleCode = null) => {
  return async (req, _res, next) => {
    try {
      // Le super_admin de plateforme bypasse toujours
      if (req.scope === 'PLATFORM') return next();

      const companyId = req.companyId;
      if (!companyId) {
        return next(new AppError('Entreprise non identifiée.', 403));
      }

      // Charger l'entreprise avec son abonnement actif (populate planId pour le nom)
      const company = await Company.findById(companyId).populate({
        path: 'abonnementActifId',
        populate: { path: 'planId', select: 'nom code modules limites' },
      });

      if (!company) {
        return next(new AppError('Entreprise introuvable.', 404));
      }

      // Entreprise suspendue manuellement
      if (company.status === 'SUSPENDUE') {
        return next(
          new AppError('Votre entreprise est suspendue. Contactez le support.', 403)
        );
      }

      // Pas d'abonnement du tout
      const abonnement = company.abonnementActifId;
      if (!abonnement) {
        return next(
          new AppError(
            'Aucun abonnement actif. Souscrivez à un plan pour accéder à cette fonctionnalité.',
            403
          )
        );
      }

      // ── Vérification du statut et de la date ──────────────────────────────
      const maintenant = new Date();
      const statutsActifs = ['ACTIF', 'ESSAI', 'EN_PERIODE_GRACE'];

      if (!statutsActifs.includes(abonnement.statut) || abonnement.dateFin < maintenant) {
        // Synchroniser si nécessaire (non bloquant)
        if (abonnement.statut === 'ACTIF' && abonnement.dateFin < maintenant) {
          abonnement.statut = 'EXPIRE';
          abonnement.save().catch(() => {});
          company.status = 'EXPIREE';
          company.save({ validateBeforeSave: false }).catch(() => {});
        }

        return next(
          new AppError(
            'Votre abonnement est expiré ou inactif. Renouvelez votre abonnement pour continuer.',
            403
          )
        );
      }

      // ── Vérification du module via planSnapshot (grandfathering) ─────────
      if (moduleCode) {
        // Priorité : planSnapshot (conditions figées à l'achat)
        const modules = abonnement.planSnapshot?.modules || abonnement.planId?.modules || [];

        if (!modules.includes(moduleCode)) {
          const planNom = abonnement.planSnapshot?.nom || abonnement.planId?.nom || 'actuel';
          return next(
            new AppError(
              `Le module "${moduleCode}" n'est pas inclus dans votre plan "${planNom}". Passez à un plan supérieur.`,
              403
            )
          );
        }
      }

      // Attacher pour usage dans les contrôleurs
      req.abonnement = abonnement;
      req.plan       = abonnement.planSnapshot || abonnement.planId;

      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = subscriptionGuard;
