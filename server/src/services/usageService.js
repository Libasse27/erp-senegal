/**
 * Service de métriques d'utilisation par entreprise.
 * Vérifie la consommation par rapport aux limites du plan (lues depuis planSnapshot — grandfathering).
 */
const Facture = require('../models/Facture');
const User    = require('../models/User');
const Company = require('../models/Company');

const compterFacturesDuMois = async (companyId) => {
  const debut = new Date();
  debut.setDate(1);
  debut.setHours(0, 0, 0, 0);

  return Facture.countDocuments({
    companyId,
    type:      'facture',
    createdAt: { $gte: debut },
  });
};

const compterUtilisateursActifs = async (companyId) => {
  return User.countDocuments({ companyId, isActive: true });
};

/**
 * Retourne l'usage courant d'une entreprise et son état par rapport aux limites du plan.
 * Lit planSnapshot en priorité (grandfathering), puis planId pour les abonnements anciens.
 */
const getUsage = async (companyId) => {
  const company = await Company.findById(companyId).populate({
    path: 'abonnementActifId',
    populate: { path: 'planId', select: 'limites modules nom code' },
  });

  if (!company) throw new Error(`Entreprise ${companyId} introuvable`);

  const abonnement = company.abonnementActifId;
  // Grandfathering : planSnapshot prime sur le plan vivant
  const plan = abonnement?.planSnapshot || abonnement?.planId;
  const limites = plan?.limites || { maxFacturesMois: -1, maxUtilisateurs: -1, maxStockageMo: -1 };

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
    plan: plan ? { nom: plan.nom, code: plan.code, modules: plan.modules } : null,
    alertes,
  };
};

/**
 * Vérifie si une entreprise a atteint la limite mensuelle de factures.
 */
const limiteFacturesAtteinte = async (companyId) => {
  const company = await Company.findById(companyId).populate({
    path: 'abonnementActifId',
    populate: { path: 'planId', select: 'limites' },
  });

  const abonnement = company?.abonnementActifId;
  const limites = abonnement?.planSnapshot?.limites || abonnement?.planId?.limites;
  const limite = limites?.maxFacturesMois;

  if (!limite || limite === -1) return false;

  const count = await compterFacturesDuMois(companyId);
  return count >= limite;
};

module.exports = { getUsage, limiteFacturesAtteinte, compterFacturesDuMois, compterUtilisateursActifs };
