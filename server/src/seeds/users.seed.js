const { ROLES } = require('../config/constants');

/**
 * Donnees des utilisateurs par defaut
 * @param {Map} roleMap - Map name -> roleId
 */
const getUsersData = (roleMap) => {
  return [
    {
      firstName: 'Admin',
      lastName: 'Principal',
      email: 'admin@erp-senegal.com',
      password: 'Admin@2026',
      phone: '+221 77 000 0001',
      role: roleMap.get(ROLES.ADMIN),
    },
    {
      firstName: 'Mamadou',
      lastName: 'Diallo',
      email: 'manager@erp-senegal.com',
      password: 'Manager@2026',
      phone: '+221 77 000 0002',
      role: roleMap.get(ROLES.MANAGER),
    },
    {
      firstName: 'Fatou',
      lastName: 'Ndiaye',
      email: 'comptable@erp-senegal.com',
      password: 'Comptable@2026',
      phone: '+221 77 000 0003',
      role: roleMap.get(ROLES.ACCOUNTANT),
    },
    {
      firstName: 'Awa',
      lastName: 'Diop',
      email: 'commercial@erp-senegal.com',
      password: 'Commercial@2026',
      phone: '+221 77 000 0004',
      role: roleMap.get(ROLES.COMMERCIAL),
    },
    {
      firstName: 'Ousmane',
      lastName: 'Fall',
      email: 'vendeur@erp-senegal.com',
      password: 'Vendeur@2026',
      phone: '+221 77 000 0005',
      role: roleMap.get(ROLES.SALES),
    },
    {
      firstName: 'Aissatou',
      lastName: 'Sy',
      email: 'caissier@erp-senegal.com',
      password: 'Caissier@2026',
      phone: '+221 77 000 0006',
      role: roleMap.get(ROLES.CASHIER),
    },
    {
      firstName: 'Ibrahima',
      lastName: 'Ba',
      email: 'stock@erp-senegal.com',
      password: 'Stock@2026',
      phone: '+221 77 000 0007',
      role: roleMap.get(ROLES.STOCK),
    },
  ];
};

module.exports = getUsersData;
