/**
 * Forfaits SaaS — Standard, Professionnel, Complet
 * Tarifs en FCFA, contexte Sénégal
 */
const getForfaitsData = () => [
  {
    code: 'STANDARD',
    nom: 'Standard',
    description: 'Idéal pour les TPE et petits commerces. Gestion commerciale, facturation et stock.',
    prixMensuel: 15000,
    prixAnnuel: 150000,   // 2 mois offerts
    modulesInclus: ['GESCOM', 'FACTURATION', 'STOCK'],
    limites: {
      maxUtilisateurs: 3,
      maxFacturesMois: 100,
      stockageMo: 1024,
      supportPrioritaire: false,
    },
    actif: true,
    ordre: 1,
  },
  {
    code: 'PROFESSIONNEL',
    nom: 'Professionnel',
    description: 'Pour les PME en croissance. Inclut la comptabilité SYSCOHADA et les reportings.',
    prixMensuel: 35000,
    prixAnnuel: 350000,   // 2 mois offerts
    modulesInclus: ['GESCOM', 'FACTURATION', 'STOCK', 'COMPTABILITE', 'REPORTING'],
    limites: {
      maxUtilisateurs: 10,
      maxFacturesMois: 1000,
      stockageMo: 5120,
      supportPrioritaire: false,
    },
    actif: true,
    ordre: 2,
  },
  {
    code: 'COMPLET',
    nom: 'Complet',
    description: 'Solution tout-en-un pour les entreprises établies. Utilisateurs illimités, support prioritaire, accès API.',
    prixMensuel: 75000,
    prixAnnuel: 750000,   // 2 mois offerts
    modulesInclus: ['GESCOM', 'FACTURATION', 'STOCK', 'COMPTABILITE', 'REPORTING', 'PAIE', 'API'],
    limites: {
      maxUtilisateurs: -1,       // illimité
      maxFacturesMois: -1,       // illimité
      stockageMo: 20480,
      supportPrioritaire: true,
    },
    actif: true,
    ordre: 3,
  },
];

module.exports = getForfaitsData;
