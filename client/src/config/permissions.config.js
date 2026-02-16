/**
 * Permissions configuration for RBAC
 * Maps roles to their allowed modules and actions
 */

// All available modules
export const MODULES = {
  USERS: 'users',
  COMPANY: 'company',
  SETTINGS: 'settings',
  CLIENTS: 'clients',
  FOURNISSEURS: 'fournisseurs',
  PRODUCTS: 'produits',
  CATEGORIES: 'categories',
  STOCKS: 'stocks',
  WAREHOUSES: 'depots',
  INVENTAIRES: 'inventaires',
  DEVIS: 'devis',
  COMMANDES: 'commandes',
  BONS_LIVRAISON: 'bons_livraison',
  FACTURES: 'factures',
  PURCHASE_ORDERS: 'commandes_fournisseurs',
  PURCHASE_RECEIPTS: 'receptions',
  PURCHASE_INVOICES: 'factures_fournisseurs',
  PAYMENTS: 'paiements',
  BANK_ACCOUNTS: 'comptes_bancaires',
  COMPTABILITE: 'comptabilite',
  ECRITURES: 'ecritures',
  REPORTS: 'rapports',
  DASHBOARD: 'dashboard',
  AUDIT: 'audit',
};

// CRUD actions
export const ACTIONS = {
  CREATE: 'create',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete',
  EXPORT: 'export',
  VALIDATE: 'validate',
};

// Role-based permissions matrix
export const ROLE_PERMISSIONS = {
  admin: ['*'],

  manager: [
    'clients.*',
    'fournisseurs.*',
    'produits.*',
    'categories.*',
    'stocks.*',
    'depots.*',
    'inventaires.*',
    'devis.*',
    'commandes.*',
    'bons_livraison.*',
    'factures.*',
    'commandes_fournisseurs.*',
    'receptions.*',
    'factures_fournisseurs.*',
    'paiements.*',
    'comptes_bancaires.read',
    'rapports.*',
    'dashboard.*',
  ],

  comptable: [
    'comptabilite.*',
    'ecritures.*',
    'paiements.*',
    'comptes_bancaires.*',
    'rapports.financier.*',
    'rapports.export',
    'factures.read',
    'factures_fournisseurs.read',
    'clients.read',
    'fournisseurs.read',
    'stocks.read',
    'dashboard.financier',
  ],

  commercial: [
    'clients.*',
    'devis.*',
    'commandes.*',
    'bons_livraison.read',
    'factures.read',
    'factures.create',
    'produits.read',
    'stocks.read',
    'paiements.read',
    'rapports.commercial.*',
    'dashboard.commercial',
  ],

  vendeur: [
    'clients.read',
    'clients.create',
    'produits.read',
    'stocks.read',
    'devis.create',
    'devis.read',
    'commandes.create',
    'commandes.read',
    'factures.create',
    'factures.read',
    'paiements.create',
    'paiements.read',
    'dashboard.commercial',
  ],

  caissier: [
    'clients.read',
    'produits.read',
    'factures.create',
    'factures.read',
    'paiements.create',
    'paiements.read',
    'dashboard.commercial',
  ],

  gestionnaire_stock: [
    'stocks.*',
    'depots.*',
    'inventaires.*',
    'receptions.*',
    'produits.read',
    'produits.update',
    'commandes.read',
    'commandes_fournisseurs.read',
    'bons_livraison.*',
    'dashboard.stocks',
    'rapports.stocks.*',
  ],
};

/**
 * Check if a role has a specific permission
 * @param {string} role - Role name
 * @param {string} permission - Permission string (e.g., "clients.create")
 * @returns {boolean}
 */
export const hasPermission = (role, permission) => {
  const rolePerms = ROLE_PERMISSIONS[role];
  if (!rolePerms) return false;

  // Admin has all permissions
  if (rolePerms.includes('*')) return true;

  const [module, action] = permission.split('.');

  return rolePerms.some((perm) => {
    if (perm === '*') return true;
    if (perm === permission) return true;

    const [permModule, permAction] = perm.split('.');
    if (permModule === module && permAction === '*') return true;

    return false;
  });
};

/**
 * Get all modules accessible by a role
 * @param {string} role - Role name
 * @returns {string[]} List of accessible module names
 */
export const getAccessibleModules = (role) => {
  const rolePerms = ROLE_PERMISSIONS[role];
  if (!rolePerms) return [];

  if (rolePerms.includes('*')) return Object.values(MODULES);

  const modules = new Set();
  rolePerms.forEach((perm) => {
    const [module] = perm.split('.');
    modules.add(module);
  });

  return Array.from(modules);
};
