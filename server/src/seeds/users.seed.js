const { ROLES } = require('../config/constants');

/**
 * Données des utilisateurs par défaut
 * @param {Map}    roleMap   - Map name -> roleId
 * @param {string} companyId - ID de l'entreprise demo (null pour super_admin)
 */
const getUsersData = (roleMap, companyId = null) => {
  return [
    // ── Plateforme (scope PLATFORM, aucune entreprise) ────────────────────
    {
      firstName: 'Super',
      lastName: 'Admin',
      email: 'superadmin@erp-senegal.com',
      password: 'SuperAdmin@2026!',
      phone: '+221 77 000 0000',
      role: roleMap.get(ROLES.SUPER_ADMIN),
      scope: 'PLATFORM',
      companyId: null,
    },

    // ── Entreprise demo (scope ENTREPRISE) ────────────────────────────────
    {
      firstName: 'Admin',
      lastName: 'Principal',
      email: 'admin@erp-senegal.com',
      password: 'Admin@2026',
      phone: '+221 77 000 0001',
      role: roleMap.get(ROLES.ADMIN),
      scope: 'ENTREPRISE',
      companyId,
    },
    {
      firstName: 'Mamadou',
      lastName: 'Diallo',
      email: 'manager@erp-senegal.com',
      password: 'Manager@2026',
      phone: '+221 77 000 0002',
      role: roleMap.get(ROLES.MANAGER),
      scope: 'ENTREPRISE',
      companyId,
    },
    {
      firstName: 'Fatou',
      lastName: 'Ndiaye',
      email: 'comptable@erp-senegal.com',
      password: 'Comptable@2026',
      phone: '+221 77 000 0003',
      role: roleMap.get(ROLES.ACCOUNTANT),
      scope: 'ENTREPRISE',
      companyId,
    },
    {
      firstName: 'Awa',
      lastName: 'Diop',
      email: 'commercial@erp-senegal.com',
      password: 'Commercial@2026',
      phone: '+221 77 000 0004',
      role: roleMap.get(ROLES.COMMERCIAL),
      scope: 'ENTREPRISE',
      companyId,
    },
    {
      firstName: 'Ousmane',
      lastName: 'Fall',
      email: 'vendeur@erp-senegal.com',
      password: 'Vendeur@2026',
      phone: '+221 77 000 0005',
      role: roleMap.get(ROLES.SALES),
      scope: 'ENTREPRISE',
      companyId,
    },
    {
      firstName: 'Aissatou',
      lastName: 'Sy',
      email: 'caissier@erp-senegal.com',
      password: 'Caissier@2026',
      phone: '+221 77 000 0006',
      role: roleMap.get(ROLES.CASHIER),
      scope: 'ENTREPRISE',
      companyId,
    },
    {
      firstName: 'Ibrahima',
      lastName: 'Ba',
      email: 'stock@erp-senegal.com',
      password: 'Stock@2026',
      phone: '+221 77 000 0007',
      role: roleMap.get(ROLES.STOCK),
      scope: 'ENTREPRISE',
      companyId,
    },
  ];
};

module.exports = getUsersData;
