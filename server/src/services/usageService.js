/**
 * Service de métriques d'utilisation par entreprise.
 * Vérifie la consommation par rapport aux limites du forfait.
 */
const Facture    = require('../models/Facture');
const User       = require('../models/User');
const Abonnement = require('../models/Abonnement');
const Company    = require('../models/Company');
const logger     = require('../config/logger');

/**
 * Compte les factures émises dans le mois courant pour une entreprise.
 * @param {string} companyId
 * @returns {Promise<number>}
 */
const compterFacturesDuMois = async (companyId) => {
  const debut = new Date();
  debut.setDate(1);
  debut.setHours(0, 0, 0, 0);

  return Facture.countDocuments({
    companyId,
    type:      'FACTURE',
    createdAt: { $gte: debut },
  });
};

/**
 * Compte les utilisateurs actifs d'une entreprise.
 * @param {string} companyId
 * @returns {Promise<number>}
 */
const compterUtilisateursActifs = async (companyId) => {
  return User.countDocuments({ companyId, isActive: true });
};

/**
 * Retourne l'usage courant d'une entreprise et son état par rapport aux limites du forfait.
 *
 * @param {string} companyId
 * @returns {Promise<{
 *   facturesMois: number,
 *   utilisateurs: number,
 *   limites: { maxFacturesMois: number, maxUtilisateurs: number },
 *   alertes: string[],
 * }>}
 */
const getUsage = async (companyId) => {
  const company = await Company.findById(companyId).populate({
    path: 'abonnementActifId',
    populate: { path: 'forfaitId', select: 'limites modulesInclus nom' },
  });

  if (!company) throw new Error(`Entreprise ${companyId} introuvable`);

  const forfait = company.abonnementActifId?.forfaitId;
  const limites = forfait?.limites || { maxFacturesMois: -1, maxUtilisateurs: -1 };

  const [facturesMois, utilisateurs] = await Promise.all([
    compterFacturesDuMois(companyId),
    compterUtilisateursActifs(companyId),
  ]);

  const alertes = [];

  if (limites.maxFacturesMois !== -1) {
    const pct = (facturesMois / limites.maxFacturesMois) * 100;
    if (pct >= 100) {
      alertes.push(`Quota de factures atteint (${facturesMois}/${limites.maxFacturesMois})`);
    } else if (pct >= 80) {
      alertes.push(`Quota de factures à ${Math.round(pct)}% (${facturesMois}/${limites.maxFacturesMois})`);
    }
  }

  if (limites.maxUtilisateurs !== -1 && utilisateurs >= limites.maxUtilisateurs) {
    alertes.push(`Quota d'utilisateurs atteint (${utilisateurs}/${limites.maxUtilisateurs})`);
  }

  return {
    facturesMois,
    utilisateurs,
    limites,
    forfait: forfait ? { nom: forfait.nom, modulesInclus: forfait.modulesInclus } : null,
    alertes,
  };
};

/**
 * Vérifie si une entreprise a atteint la limite mensuelle de factures.
 * Utilisé par subscriptionGuard ou les controllers avant création de facture.
 *
 * @param {string} companyId
 * @returns {Promise<boolean>} true si la limite est atteinte
 */
const limiteFacturesAtteinte = async (companyId) => {
  const company = await Company.findById(companyId).populate({
    path: 'abonnementActifId',
    populate: { path: 'forfaitId', select: 'limites' },
  });

  const limite = company?.abonnementActifId?.forfaitId?.limites?.maxFacturesMois;
  if (!limite || limite === -1) return false; // illimité

  const count = await compterFacturesDuMois(companyId);
  return count >= limite;
};

module.exports = { getUsage, limiteFacturesAtteinte, compterFacturesDuMois, compterUtilisateursActifs };
