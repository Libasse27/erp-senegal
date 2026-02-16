const { ROLES } = require('../config/constants');

/**
 * Definir les roles avec leurs permissions
 * @param {Map} permMap - Map code -> permissionId
 */
const getRolesData = (permMap) => {
  // Helper pour recuperer les IDs de permissions par patterns
  const getPerms = (patterns) => {
    const ids = [];
    for (const [code, id] of permMap) {
      if (
        patterns.some((pattern) => {
          if (pattern.endsWith(':*')) {
            return code.startsWith(pattern.replace(':*', ':'));
          }
          return code === pattern;
        })
      ) {
        ids.push(id);
      }
    }
    return ids;
  };

  return [
    {
      name: ROLES.ADMIN,
      displayName: 'Administrateur',
      description: 'Acces complet a toutes les fonctionnalites',
      permissions: [...permMap.values()],
      isSystem: true,
    },
    {
      name: ROLES.MANAGER,
      displayName: 'Directeur / Manager',
      description: 'Supervision globale avec acces etendu',
      permissions: getPerms([
        'users:read',
        'users:create',
        'users:update',
        'company:*',
        'settings:read',
        'clients:*',
        'fournisseurs:*',
        'produits:*',
        'categories:*',
        'stocks:*',
        'depots:*',
        'inventaires:*',
        'devis:*',
        'commandes:*',
        'bons_livraison:*',
        'factures:*',
        'commandes_fournisseurs:*',
        'receptions:*',
        'factures_fournisseurs:*',
        'paiements:*',
        'comptes_bancaires:read',
        'rapports:*',
        'dashboard:*',
      ]),
      isSystem: true,
    },
    {
      name: ROLES.ACCOUNTANT,
      displayName: 'Comptable',
      description: 'Gestion comptable et financiere',
      permissions: getPerms([
        'comptabilite:*',
        'ecritures:*',
        'paiements:*',
        'comptes_bancaires:*',
        'rapports:*',
        'factures:read',
        'factures_fournisseurs:read',
        'clients:read',
        'fournisseurs:read',
        'produits:read',
        'stocks:read',
        'dashboard:read',
        'company:read',
        'settings:read',
      ]),
      isSystem: true,
    },
    {
      name: ROLES.COMMERCIAL,
      displayName: 'Commercial',
      description: 'Gestion commerciale et relation clients',
      permissions: getPerms([
        'clients:*',
        'devis:*',
        'commandes:*',
        'bons_livraison:read',
        'factures:read',
        'factures:create',
        'produits:read',
        'stocks:read',
        'paiements:read',
        'rapports:read',
        'dashboard:read',
      ]),
      isSystem: true,
    },
    {
      name: ROLES.SALES,
      displayName: 'Vendeur',
      description: 'Vente et encaissement',
      permissions: getPerms([
        'clients:read',
        'clients:create',
        'produits:read',
        'stocks:read',
        'devis:create',
        'devis:read',
        'commandes:create',
        'commandes:read',
        'factures:create',
        'factures:read',
        'paiements:create',
        'paiements:read',
        'dashboard:read',
      ]),
      isSystem: true,
    },
    {
      name: ROLES.CASHIER,
      displayName: 'Caissier',
      description: 'Encaissements et vente au comptoir',
      permissions: getPerms([
        'clients:read',
        'produits:read',
        'factures:create',
        'factures:read',
        'paiements:create',
        'paiements:read',
        'dashboard:read',
      ]),
      isSystem: true,
    },
    {
      name: ROLES.STOCK,
      displayName: 'Gestionnaire de Stock',
      description: 'Gestion des stocks, depots et inventaires',
      permissions: getPerms([
        'stocks:*',
        'depots:*',
        'inventaires:*',
        'receptions:*',
        'produits:read',
        'produits:update',
        'categories:read',
        'commandes:read',
        'commandes_fournisseurs:read',
        'bons_livraison:*',
        'dashboard:read',
        'rapports:read',
      ]),
      isSystem: true,
    },
  ];
};

module.exports = getRolesData;
