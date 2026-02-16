/**
 * Route configuration for the ERP application
 * Centralized route paths to avoid hardcoded strings
 */

const ROUTES = {
  // Auth
  LOGIN: '/login',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password/:token',

  // Dashboard
  DASHBOARD: '/',
  DASHBOARD_COMMERCIAL: '/dashboard/commercial',
  DASHBOARD_COMPTABLE: '/dashboard/comptable',
  DASHBOARD_STOCKS: '/dashboard/stocks',

  // Clients
  CLIENTS: '/clients',
  CLIENT_NEW: '/clients/new',
  CLIENT_DETAIL: '/clients/:id',
  CLIENT_EDIT: '/clients/:id/edit',

  // Fournisseurs
  FOURNISSEURS: '/fournisseurs',
  FOURNISSEUR_NEW: '/fournisseurs/new',
  FOURNISSEUR_DETAIL: '/fournisseurs/:id',
  FOURNISSEUR_EDIT: '/fournisseurs/:id/edit',

  // Produits
  PRODUCTS: '/produits',
  PRODUCT_NEW: '/produits/new',
  PRODUCT_DETAIL: '/produits/:id',
  PRODUCT_EDIT: '/produits/:id/edit',
  CATEGORIES: '/categories',

  // Stocks
  STOCKS: '/stocks',
  STOCK_MOVEMENTS: '/stocks/mouvements',
  STOCK_ALERTS: '/stocks/alertes',
  WAREHOUSES: '/stocks/depots',
  INVENTAIRES: '/stocks/inventaires',
  INVENTAIRE_NEW: '/stocks/inventaires/new',

  // Ventes
  DEVIS: '/ventes/devis',
  DEVIS_NEW: '/ventes/devis/new',
  DEVIS_DETAIL: '/ventes/devis/:id',
  DEVIS_EDIT: '/ventes/devis/:id/edit',

  COMMANDES: '/ventes/commandes',
  COMMANDE_NEW: '/ventes/commandes/new',
  COMMANDE_DETAIL: '/ventes/commandes/:id',

  BONS_LIVRAISON: '/ventes/bons-livraison',
  BON_LIVRAISON_DETAIL: '/ventes/bons-livraison/:id',

  FACTURES: '/ventes/factures',
  FACTURE_NEW: '/ventes/factures/new',
  FACTURE_DETAIL: '/ventes/factures/:id',
  FACTURE_EDIT: '/ventes/factures/:id/edit',

  // Achats
  PURCHASE_ORDERS: '/achats/commandes',
  PURCHASE_ORDER_NEW: '/achats/commandes/new',
  PURCHASE_ORDER_DETAIL: '/achats/commandes/:id',

  PURCHASE_RECEIPTS: '/achats/receptions',
  PURCHASE_RECEIPT_NEW: '/achats/receptions/new',

  PURCHASE_INVOICES: '/achats/factures',
  PURCHASE_INVOICE_NEW: '/achats/factures/new',
  PURCHASE_INVOICE_DETAIL: '/achats/factures/:id',

  // Paiements
  PAYMENTS: '/paiements',
  PAYMENT_NEW: '/paiements/new',
  PAYMENT_DETAIL: '/paiements/:id',
  BANK_ACCOUNTS: '/paiements/comptes-bancaires',
  TRESORERIE: '/paiements/tresorerie',

  // Comptabilite
  PLAN_COMPTABLE: '/comptabilite/plan',
  ECRITURES: '/comptabilite/ecritures',
  ECRITURE_NEW: '/comptabilite/ecritures/new',
  GRAND_LIVRE: '/comptabilite/grand-livre',
  BALANCE: '/comptabilite/balance',
  BILAN: '/comptabilite/bilan',
  COMPTE_RESULTAT: '/comptabilite/resultat',
  EXERCICES: '/comptabilite/exercices',
  DECLARATION_TVA: '/comptabilite/tva',
  EXPORT_FEC: '/comptabilite/fec',

  // Rapports
  REPORTS: '/rapports',
  REPORT_SALES: '/rapports/ventes',
  REPORT_PURCHASES: '/rapports/achats',
  REPORT_STOCKS: '/rapports/stocks',
  REPORT_FINANCIAL: '/rapports/financier',
  REPORT_ABC: '/rapports/abc',

  // Administration
  ADMIN: '/admin',
  ADMIN_USERS: '/admin/utilisateurs',
  ADMIN_USER_NEW: '/admin/utilisateurs/new',
  ADMIN_USER_EDIT: '/admin/utilisateurs/:id/edit',
  ADMIN_ROLES: '/admin/roles',
  ADMIN_SETTINGS: '/admin/parametres',
  ADMIN_COMPANY: '/admin/entreprise',
  ADMIN_AUDIT: '/admin/audit',
  ADMIN_BACKUP: '/admin/sauvegardes',

  // 404
  NOT_FOUND: '*',
};

export default ROUTES;
