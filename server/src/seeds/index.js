const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const mongoose = require('mongoose');
const { connectDB } = require('../config/database');

// Phase 1 Models
const Permission = require('../models/Permission');
const Role = require('../models/Role');
const User = require('../models/User');
const Company = require('../models/Company');
const Settings = require('../models/Settings');
const AuditLog = require('../models/AuditLog');

// Phase 2 Models
const Client = require('../models/Client');
const Fournisseur = require('../models/Fournisseur');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Warehouse = require('../models/Warehouse');
const Stock = require('../models/Stock');
const StockMovement = require('../models/StockMovement');

// Phase 3 Models
const Devis = require('../models/Devis');
const Commande = require('../models/Commande');
const BonLivraison = require('../models/BonLivraison');
const Facture = require('../models/Facture');

// Phase 4 Models
const CompteComptable = require('../models/CompteComptable');
const ExerciceComptable = require('../models/ExerciceComptable');
const EcritureComptable = require('../models/EcritureComptable');
const BankAccount = require('../models/BankAccount');
const Payment = require('../models/Payment');

// Phase 1 Seed data generators
const generatePermissions = require('./permissions.seed');
const getRolesData = require('./roles.seed');
const getUsersData = require('./users.seed');
const getCompanyData = require('./company.seed');
const getSettingsData = require('./settings.seed');

// Phase 2 Seed data generators
const getClientsData = require('./clients.seed');
const getFournisseursData = require('./fournisseurs.seed');
const { getCategoriesData, getProductsData } = require('./products.seed');
const { getWarehousesData, getStocksData } = require('./stocks.seed');

// Phase 4 Seed data generators
const getPlanComptableData = require('./planComptable.seed');
const { getExerciceData, getBankAccountsData } = require('./comptabilite.seed');

// Phase 3+4 Transactional data
const { seedTransactions } = require('./transactions.seed');

const seed = async () => {
  try {
    // Connexion a la DB
    await connectDB();

    console.log('=== Debut du seeding ===\n');

    // 1. Nettoyer toutes les collections
    console.log('Nettoyage des collections...');
    await Promise.all([
      Permission.deleteMany({}),
      Role.deleteMany({}),
      User.deleteMany({}),
      Company.deleteMany({}),
      Settings.deleteMany({}),
      AuditLog.deleteMany({}),
      Client.deleteMany({}),
      Fournisseur.deleteMany({}),
      Category.deleteMany({}),
      Product.deleteMany({}),
      Warehouse.deleteMany({}),
      Stock.deleteMany({}),
      StockMovement.deleteMany({}),
      Devis.deleteMany({}),
      Commande.deleteMany({}),
      BonLivraison.deleteMany({}),
      Facture.deleteMany({}),
      CompteComptable.deleteMany({}),
      ExerciceComptable.deleteMany({}),
      EcritureComptable.deleteMany({}),
      BankAccount.deleteMany({}),
      Payment.deleteMany({}),
    ]);
    console.log('Collections nettoyees.\n');

    // ========================================
    // PHASE 1 — Fondations
    // ========================================

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

    const adminUser = users[0]; // First user is admin

    // 5. Creer l'entreprise demo
    console.log('\nCreation de l\'entreprise demo...');
    const companyData = getCompanyData();
    await Company.create({ ...companyData, createdBy: adminUser._id });
    console.log('Entreprise demo creee.');

    // 6. Creer les parametres par defaut
    console.log('\nCreation des parametres par defaut...');
    const settingsData = getSettingsData();
    await Settings.create({ ...settingsData, createdBy: adminUser._id });
    console.log('Parametres par defaut crees.');

    // ========================================
    // PHASE 2 — Modules Commerciaux
    // ========================================
    console.log('\n--- Phase 2: Modules Commerciaux ---\n');

    // 7. Creer les clients
    console.log('Creation des clients...');
    const clientsData = getClientsData(adminUser._id);
    const clients = [];
    for (const clientData of clientsData) {
      const client = await Client.create(clientData);
      clients.push(client);
    }
    console.log(`${clients.length} clients crees.`);

    // 8. Creer les fournisseurs
    console.log('\nCreation des fournisseurs...');
    const fournisseursData = getFournisseursData(adminUser._id);
    const fournisseurs = [];
    for (const fournisseurData of fournisseursData) {
      const fournisseur = await Fournisseur.create(fournisseurData);
      fournisseurs.push(fournisseur);
    }
    console.log(`${fournisseurs.length} fournisseurs crees.`);

    // 9. Creer les categories
    console.log('\nCreation des categories...');
    const categoriesData = getCategoriesData(adminUser._id);
    const categories = [];
    for (const catData of categoriesData) {
      const category = await Category.create(catData);
      categories.push(category);
    }
    console.log(`${categories.length} categories creees.`);

    // Creer une map name -> id pour les categories
    const categoryMap = new Map();
    categories.forEach((c) => categoryMap.set(c.name, c._id));

    // 10. Creer les produits
    console.log('\nCreation des produits...');
    const productsData = getProductsData(categoryMap, adminUser._id);
    const products = [];
    for (const prodData of productsData) {
      const product = await Product.create(prodData);
      products.push(product);
    }
    console.log(`${products.length} produits crees.`);

    // 11. Creer les depots
    console.log('\nCreation des depots...');
    const warehousesData = getWarehousesData(adminUser._id);
    const warehouses = [];
    for (const whData of warehousesData) {
      const warehouse = await Warehouse.create(whData);
      warehouses.push(warehouse);
    }
    console.log(`${warehouses.length} depots crees.`);

    const mainWarehouse = warehouses[0]; // First warehouse is the default

    // 12. Creer les stocks initiaux
    console.log('\nCreation des stocks initiaux...');
    const stocksData = getStocksData(products, mainWarehouse, adminUser._id);
    const stocks = await Stock.insertMany(stocksData);
    console.log(`${stocks.length} lignes de stock creees.`);

    // Calculate total stock value
    const totalStockValue = stocks.reduce((sum, s) => sum + s.valeurStock, 0);

    // ========================================
    // PHASE 4 — Paiements & Comptabilite
    // ========================================
    console.log('\n--- Phase 4: Paiements & Comptabilite ---\n');

    // 13. Creer le plan comptable SYSCOHADA
    console.log('Creation du plan comptable SYSCOHADA...');
    const planComptableData = getPlanComptableData(adminUser._id);
    const comptes = [];
    for (const compteData of planComptableData) {
      const compte = await CompteComptable.create(compteData);
      comptes.push(compte);
    }
    console.log(`${comptes.length} comptes comptables crees.`);

    // Count by class
    const classCounts = {};
    comptes.forEach((c) => {
      classCounts[c.classe] = (classCounts[c.classe] || 0) + 1;
    });

    // 14. Creer l'exercice comptable 2026
    console.log('\nCreation de l\'exercice comptable 2026...');
    const exerciceData = getExerciceData(adminUser._id);
    const exercice = await ExerciceComptable.create(exerciceData);
    console.log(`Exercice ${exercice.code} cree (${exercice.libelle}).`);

    // 15. Creer les comptes bancaires
    console.log('\nCreation des comptes bancaires...');
    const bankAccountsData = getBankAccountsData(adminUser._id);
    const bankAccounts = [];
    for (const baData of bankAccountsData) {
      // Link to CompteComptable by numero
      if (baData.compteComptableNumero) {
        const cc = comptes.find((c) => c.numero === baData.compteComptableNumero);
        if (cc) baData.compteComptable = cc._id;
      }
      const ba = await BankAccount.create(baData);
      bankAccounts.push(ba);
    }
    console.log(`${bankAccounts.length} comptes bancaires crees.`);

    const totalBanque = bankAccounts.reduce((s, a) => s + a.soldeActuel, 0);

    // ========================================
    // PHASE 3+4 — Donnees Transactionnelles
    // ========================================
    console.log('\n--- Donnees transactionnelles ---\n');

    const txResult = await seedTransactions(
      adminUser,
      users,
      clients,
      products,
      warehouses,
      exercice,
      comptes,
      bankAccounts
    );

    // ========================================
    // RESUME
    // ========================================
    console.log('\n=== Seeding termine avec succes ===');
    console.log(`\nResume:`);
    console.log(`  Phase 1:`);
    console.log(`    - ${permissions.length} permissions`);
    console.log(`    - ${roles.length} roles`);
    console.log(`    - ${users.length} utilisateurs`);
    console.log(`    - 1 entreprise`);
    console.log(`    - 1 configuration`);
    console.log(`  Phase 2:`);
    console.log(`    - ${clients.length} clients (A: 10, B: 15, C: 25)`);
    console.log(`    - ${fournisseurs.length} fournisseurs`);
    console.log(`    - ${categories.length} categories`);
    console.log(`    - ${products.length} produits`);
    console.log(`    - ${warehouses.length} depots`);
    console.log(`    - ${stocks.length} lignes de stock`);
    console.log(`    - Valeur totale stock: ${new Intl.NumberFormat('fr-FR').format(totalStockValue)} FCFA`);
    console.log(`  Phase 3+4 (Transactions):`);
    console.log(`    - ${txResult.devis} devis`);
    console.log(`    - ${txResult.commandes} commandes`);
    console.log(`    - ${txResult.bonsLivraison} bons de livraison`);
    console.log(`    - ${txResult.factures} factures`);
    console.log(`    - ${txResult.payments} paiements`);
    console.log(`    - ${txResult.ecritures} ecritures comptables`);
    console.log(`  Comptabilite:`);
    console.log(`    - ${comptes.length} comptes comptables SYSCOHADA`);
    for (let cl = 1; cl <= 8; cl++) {
      if (classCounts[cl]) console.log(`      Classe ${cl}: ${classCounts[cl]} comptes`);
    }
    console.log(`    - 1 exercice comptable (${exercice.code})`);
    console.log(`    - ${bankAccounts.length} comptes bancaires`);
    console.log(`    - Tresorerie totale: ${new Intl.NumberFormat('fr-FR').format(totalBanque)} FCFA\n`);

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
