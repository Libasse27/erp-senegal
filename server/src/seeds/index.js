const dotenv = require('dotenv');
dotenv.config({ path: '../../.env' });

const mongoose = require('mongoose');
const connectDB = require('../config/database');

// Models
const Permission = require('../models/Permission');
const Role = require('../models/Role');
const User = require('../models/User');
const Company = require('../models/Company');
const Settings = require('../models/Settings');

// Seed data generators
const generatePermissions = require('./permissions.seed');
const getRolesData = require('./roles.seed');
const getUsersData = require('./users.seed');
const getCompanyData = require('./company.seed');

const seed = async () => {
  try {
    // Connexion a la DB
    await connectDB();

    console.log('=== Debut du seeding ===\n');

    // 1. Nettoyer les collections existantes
    console.log('Nettoyage des collections...');
    await Promise.all([
      Permission.deleteMany({}),
      Role.deleteMany({}),
      User.deleteMany({}),
      Company.deleteMany({}),
      Settings.deleteMany({}),
    ]);
    console.log('Collections nettoyees.\n');

    // 2. Creer les permissions
    console.log('Creation des permissions...');
    const permissionsData = generatePermissions();
    const permissions = await Permission.insertMany(permissionsData);
    console.log(`${permissions.length} permissions creees.`);

    // Creer une map code -> id
    const permMap = new Map();
    permissions.forEach((p) => permMap.set(p.code, p._id));

    // 3. Creer les roles
    console.log('\nCreation des roles...');
    const rolesData = getRolesData(permMap);
    const roles = await Role.insertMany(rolesData);
    console.log(`${roles.length} roles crees.`);

    // Creer une map name -> id
    const roleMap = new Map();
    roles.forEach((r) => roleMap.set(r.name, r._id));

    // 4. Creer les utilisateurs
    console.log('\nCreation des utilisateurs...');
    const usersData = getUsersData(roleMap);
    const users = [];
    for (const userData of usersData) {
      const user = await User.create(userData);
      users.push(user);
    }
    console.log(`${users.length} utilisateurs crees.`);

    // 5. Creer l'entreprise demo
    console.log('\nCreation de l\'entreprise demo...');
    const companyData = getCompanyData();
    await Company.create(companyData);
    console.log('Entreprise demo creee.');

    // 6. Creer les parametres par defaut
    console.log('\nCreation des parametres par defaut...');
    await Settings.create({});
    console.log('Parametres par defaut crees.');

    // Resume
    console.log('\n=== Seeding termine avec succes ===');
    console.log(`\nResume:`);
    console.log(`  - ${permissions.length} permissions`);
    console.log(`  - ${roles.length} roles`);
    console.log(`  - ${users.length} utilisateurs`);
    console.log(`  - 1 entreprise`);
    console.log(`  - 1 configuration\n`);

    console.log('Comptes de test:');
    console.log('  admin@erp-senegal.com / Admin@2026 (Administrateur)');
    console.log('  manager@erp-senegal.com / Manager@2026 (Manager)');
    console.log('  comptable@erp-senegal.com / Comptable@2026 (Comptable)');
    console.log('  commercial@erp-senegal.com / Commercial@2026 (Commercial)');
    console.log('  vendeur@erp-senegal.com / Vendeur@2026 (Vendeur)');
    console.log('  caissier@erp-senegal.com / Caissier@2026 (Caissier)');
    console.log('  stock@erp-senegal.com / Stock@2026 (Gestionnaire Stock)');

    process.exit(0);
  } catch (error) {
    console.error('Erreur lors du seeding:', error.message);
    console.error(error);
    process.exit(1);
  }
};

seed();
