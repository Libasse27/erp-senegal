/**
 * Plans SaaS — Standard, Professionnel, Complet
 * Tarifs en XOF (FCFA), marché Sénégal / Afrique de l'Ouest.
 *
 * Ces données sont le SEED INITIAL uniquement — elles sont modifiables ensuite
 * via le dashboard Super Admin (CRUD /api/super-admin/plans) sans redéploiement.
 * Aucune valeur n'est codée en dur dans la logique applicative.
 */
const getPlansData = () => [
  {
    code: 'STANDARD',
    nom: 'Standard',
    description: 'Idéal pour les TPE et petits commerces. Gestion commerciale, facturation et stock.',
    tarifs: {
      mensuel: 15000,
      annuel:  150000,  // 2 mois offerts
      devise:  'XOF',
    },
    limites: {
      maxUtilisateurs: 3,
      maxStockageMo:   1024,
      maxFacturesMois: 100,
    },
    modules: ['GESCOM', 'FACTURATION', 'STOCK'],
    features: {
      supportPrioritaire: false,
      apiAccess:          false,
      multiEtablissement: false,
    },
    essaiGratuitJours: 14,
    visible:        true,
    actif:          true,
    ordreAffichage: 1,
    version:        1,
  },
  {
    code: 'PROFESSIONNEL',
    nom: 'Professionnel',
    description: 'Pour les PME en croissance. Inclut la comptabilité SYSCOHADA et les reportings.',
    tarifs: {
      mensuel: 35000,
      annuel:  350000,  // 2 mois offerts
      devise:  'XOF',
    },
    limites: {
      maxUtilisateurs: 10,
      maxStockageMo:   5120,
      maxFacturesMois: 1000,
    },
    modules: ['GESCOM', 'FACTURATION', 'STOCK', 'COMPTABILITE', 'REPORTING'],
    features: {
      supportPrioritaire: false,
      apiAccess:          false,
      multiEtablissement: false,
    },
    essaiGratuitJours: 14,
    visible:        true,
    actif:          true,
    ordreAffichage: 2,
    version:        1,
  },
  {
    code: 'COMPLET',
    nom: 'Complet',
    description: 'Solution tout-en-un. Utilisateurs illimités, paie, support prioritaire, accès API.',
    tarifs: {
      mensuel: 75000,
      annuel:  750000,  // 2 mois offerts
      devise:  'XOF',
    },
    limites: {
      maxUtilisateurs: -1,      // illimité
      maxStockageMo:   20480,
      maxFacturesMois: -1,      // illimité
    },
    modules: ['GESCOM', 'FACTURATION', 'STOCK', 'COMPTABILITE', 'REPORTING', 'PAIE', 'API'],
    features: {
      supportPrioritaire: true,
      apiAccess:          true,
      multiEtablissement: false,
    },
    essaiGratuitJours: 14,
    visible:        true,
    actif:          true,
    ordreAffichage: 3,
    version:        1,
  },
];

module.exports = getPlansData;
