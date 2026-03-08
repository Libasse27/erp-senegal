/**
 * Codes de permission — doivent correspondre EXACTEMENT aux codes
 * générés par le backend (server/src/config/constants.js MODULES + ACTIONS).
 *
 * Format : "<module>:<action>"
 * Modules (noms backend) : users, company, settings, clients, fournisseurs,
 *   produits, categories, stocks, depots, inventaires, devis, commandes,
 *   bons_livraison, factures, commandes_fournisseurs, receptions,
 *   factures_fournisseurs, paiements, comptes_bancaires, comptabilite,
 *   ecritures, rapports, dashboard, audit
 * Actions : create, read, update, delete, export, validate
 */

export const PERM = {
  // ── Utilisateurs & Système ─────────────────────────────────────────────
  USERS_READ:           'users:read',
  USERS_CREATE:         'users:create',
  USERS_UPDATE:         'users:update',
  USERS_DELETE:         'users:delete',

  SETTINGS_READ:        'settings:read',
  SETTINGS_UPDATE:      'settings:update',

  COMPANY_READ:         'company:read',
  COMPANY_UPDATE:       'company:update',

  AUDIT_READ:           'audit:read',

  // ── Clients & Fournisseurs ─────────────────────────────────────────────
  CLIENTS_READ:         'clients:read',
  CLIENTS_CREATE:       'clients:create',
  CLIENTS_UPDATE:       'clients:update',
  CLIENTS_DELETE:       'clients:delete',
  CLIENTS_EXPORT:       'clients:export',

  FOURNISSEURS_READ:    'fournisseurs:read',
  FOURNISSEURS_CREATE:  'fournisseurs:create',
  FOURNISSEURS_UPDATE:  'fournisseurs:update',
  FOURNISSEURS_DELETE:  'fournisseurs:delete',

  // ── Produits & Stocks ──────────────────────────────────────────────────
  PRODUITS_READ:        'produits:read',
  PRODUITS_CREATE:      'produits:create',
  PRODUITS_UPDATE:      'produits:update',
  PRODUITS_DELETE:      'produits:delete',

  CATEGORIES_READ:      'categories:read',
  CATEGORIES_CREATE:    'categories:create',

  STOCKS_READ:          'stocks:read',
  STOCKS_UPDATE:        'stocks:update',

  DEPOTS_READ:          'depots:read',
  DEPOTS_CREATE:        'depots:create',

  // ── Ventes ────────────────────────────────────────────────────────────
  DEVIS_READ:           'devis:read',
  DEVIS_CREATE:         'devis:create',
  DEVIS_UPDATE:         'devis:update',
  DEVIS_DELETE:         'devis:delete',
  DEVIS_VALIDATE:       'devis:validate',

  COMMANDES_READ:       'commandes:read',
  COMMANDES_CREATE:     'commandes:create',
  COMMANDES_UPDATE:     'commandes:update',
  COMMANDES_VALIDATE:   'commandes:validate',

  BONS_LIVRAISON_READ:  'bons_livraison:read',
  BONS_LIVRAISON_CREATE:'bons_livraison:create',
  BONS_LIVRAISON_VALIDATE: 'bons_livraison:validate',

  FACTURES_READ:        'factures:read',
  FACTURES_CREATE:      'factures:create',
  FACTURES_UPDATE:      'factures:update',
  FACTURES_DELETE:      'factures:delete',
  FACTURES_VALIDATE:    'factures:validate',
  FACTURES_EXPORT:      'factures:export',

  // ── Achats ────────────────────────────────────────────────────────────
  CMD_FOURNISSEURS_READ:   'commandes_fournisseurs:read',
  CMD_FOURNISSEURS_CREATE: 'commandes_fournisseurs:create',

  RECEPTIONS_READ:      'receptions:read',
  RECEPTIONS_CREATE:    'receptions:create',

  FACTURES_FOURN_READ:  'factures_fournisseurs:read',
  FACTURES_FOURN_CREATE:'factures_fournisseurs:create',

  // ── Finance ───────────────────────────────────────────────────────────
  PAIEMENTS_READ:       'paiements:read',
  PAIEMENTS_CREATE:     'paiements:create',
  PAIEMENTS_UPDATE:     'paiements:update',
  PAIEMENTS_VALIDATE:   'paiements:validate',

  COMPTES_BANCAIRES_READ:   'comptes_bancaires:read',
  COMPTES_BANCAIRES_CREATE: 'comptes_bancaires:create',

  // ── Comptabilité ──────────────────────────────────────────────────────
  COMPTABILITE_READ:    'comptabilite:read',
  COMPTABILITE_CREATE:  'comptabilite:create',

  ECRITURES_READ:       'ecritures:read',
  ECRITURES_CREATE:     'ecritures:create',
  ECRITURES_UPDATE:     'ecritures:update',
  ECRITURES_VALIDATE:   'ecritures:validate',

  // ── Rapports & Dashboard ──────────────────────────────────────────────
  RAPPORTS_READ:        'rapports:read',
  RAPPORTS_EXPORT:      'rapports:export',

  DASHBOARD_READ:       'dashboard:read',
};
