module.exports = {
  // Fiscalite Senegal
  TVA_RATE: 18,
  TVA_RATES: [0, 18],
  CURRENCY: 'XOF',
  CURRENCY_SYMBOL: 'FCFA',
  COUNTRY: 'Senegal',
  COUNTRY_CODE: 'SN',

  // Norme comptable
  ACCOUNTING_STANDARD: 'SYSCOHADA',
  LEGAL_FRAMEWORK: 'OHADA',

  // Exercice fiscal par defaut (1er janvier - 31 decembre)
  DEFAULT_FISCAL_YEAR_START_MONTH: 1,
  DEFAULT_FISCAL_YEAR_START_DAY: 1,

  // Formats de numerotation par defaut
  NUMBERING_FORMATS: {
    INVOICE: 'FA{YYYY}-{NNNNN}',
    QUOTE: 'DE{YYYY}-{NNNNN}',
    ORDER: 'CM{YYYY}-{NNNNN}',
    PURCHASE_ORDER: 'BC{YYYY}-{NNNNN}',
    DELIVERY_NOTE: 'BL{YYYY}-{NNNNN}',
    CREDIT_NOTE: 'AV{YYYY}-{NNNNN}',
    PAYMENT: 'PA{YYYY}-{NNNNN}',
  },

  // Roles par defaut
  ROLES: {
    ADMIN: 'admin',
    MANAGER: 'manager',
    ACCOUNTANT: 'comptable',
    COMMERCIAL: 'commercial',
    SALES: 'vendeur',
    CASHIER: 'caissier',
    STOCK: 'gestionnaire_stock',
  },

  // Modules de l'application
  MODULES: [
    'users',
    'company',
    'settings',
    'clients',
    'fournisseurs',
    'produits',
    'categories',
    'stocks',
    'depots',
    'inventaires',
    'devis',
    'commandes',
    'bons_livraison',
    'factures',
    'commandes_fournisseurs',
    'receptions',
    'factures_fournisseurs',
    'paiements',
    'comptes_bancaires',
    'comptabilite',
    'ecritures',
    'rapports',
    'dashboard',
    'audit',
  ],

  // Actions CRUD
  ACTIONS: ['create', 'read', 'update', 'delete', 'export', 'validate'],

  // Pagination par defaut
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 25,
  MAX_LIMIT: 100,

  // Statuts documents
  DOCUMENT_STATUS: {
    DRAFT: 'brouillon',
    VALIDATED: 'validee',
    SENT: 'envoyee',
    PARTIALLY_PAID: 'partiellement_payee',
    PAID: 'payee',
    CANCELLED: 'annulee',
    OVERDUE: 'en_retard',
  },

  // Statuts devis
  QUOTE_STATUS: {
    DRAFT: 'brouillon',
    SENT: 'envoye',
    ACCEPTED: 'accepte',
    REFUSED: 'refuse',
    EXPIRED: 'expire',
    CONVERTED: 'converti',
  },

  // Statuts commande
  ORDER_STATUS: {
    DRAFT: 'brouillon',
    CONFIRMED: 'confirmee',
    IN_PROGRESS: 'en_cours',
    DELIVERED: 'livree',
    PARTIALLY_DELIVERED: 'partiellement_livree',
    CANCELLED: 'annulee',
  },

  // Modes de paiement
  PAYMENT_METHODS: [
    'especes',
    'cheque',
    'virement',
    'orange_money',
    'wave',
    'carte_bancaire',
  ],

  // Types de paiement
  PAYMENT_TYPES: {
    CLIENT: 'client',
    SUPPLIER: 'fournisseur',
  },

  // Statuts paiement
  PAYMENT_STATUS: {
    DRAFT: 'brouillon',
    VALIDATED: 'valide',
    CANCELLED: 'annule',
  },

  // Statuts exercice comptable
  EXERCISE_STATUS: {
    OPEN: 'ouvert',
    CLOSED: 'cloture',
  },

  // Statuts ecriture comptable
  ECRITURE_STATUS: {
    DRAFT: 'brouillon',
    VALIDATED: 'validee',
  },

  // Types de compte comptable
  ACCOUNT_TYPES: {
    DEBIT: 'debit',
    CREDIT: 'credit',
  },

  // Types de compte bancaire
  BANK_ACCOUNT_TYPES: {
    CURRENT: 'courant',
    SAVINGS: 'epargne',
    MOBILE_MONEY: 'mobile_money',
  },

  // Types de mouvement stock
  STOCK_MOVEMENT_TYPES: {
    IN: 'entree',
    OUT: 'sortie',
    TRANSFER: 'transfert',
    ADJUSTMENT: 'ajustement',
    RETURN: 'retour',
  },

  // Journaux comptables
  ACCOUNTING_JOURNALS: {
    SALES: 'VE',
    PURCHASES: 'AC',
    BANK: 'BQ',
    CASH: 'CA',
    MISC: 'OD',
  },

  // Classes du plan comptable SYSCOHADA
  ACCOUNT_CLASSES: {
    1: 'Ressources durables',
    2: 'Actif immobilise',
    3: 'Stocks',
    4: 'Tiers',
    5: 'Tresorerie',
    6: 'Charges',
    7: 'Produits',
    8: 'Comptes des autres charges et produits',
  },

  // Segmentation clients ABC
  CLIENT_SEGMENTS: {
    A: 'A', // Top 20% du CA
    B: 'B', // 30% suivants
    C: 'C', // 50% restants
  },

  // Securite
  MAX_LOGIN_ATTEMPTS: 5,
  LOCK_TIME: 30 * 60 * 1000, // 30 minutes
  PASSWORD_RESET_EXPIRE: 30 * 60 * 1000, // 30 minutes
};
