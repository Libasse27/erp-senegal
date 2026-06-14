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

// SaaS Models
const Forfait = require('../models/Forfait');
const Abonnement = require('../models/Abonnement');

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

// Seed data generators
const generatePermissions = require('./permissions.seed');
const getRolesData = require('./roles.seed');
const getUsersData = require('./users.seed');
const getCompanyData = require('./company.seed');
const getSettingsData = require('./settings.seed');
const getForfaitsData = require('./forfaits.seed');
const getClientsData = require('./clients.seed');
const getFournisseursData = require('./fournisseurs.seed');
const { getCategoriesData, getProductsData } = require('./products.seed');
const { getWarehousesData, getStocksData } = require('./stocks.seed');
const getPlanComptableData = require('./planComptable.seed');
const { getExerciceData, getBankAccountsData } = require('./comptabilite.seed');
const { seedTransactions } = require('./transactions.seed');

// Injecte companyId dans chaque objet d'un tableau
const withCompany = (arr, companyId) => arr.map((d) => ({ ...d, companyId }));

const seed = async () => {
  try {
    await connectDB();
    console.log('=== Debut du seeding multi-tenant ===\n');

    // 1. Nettoyer toutes les collections
    console.log('Nettoyage des collections...');
    await Promise.all([
      Permission.deleteMany({}),
      Role.deleteMany({}),
      User.deleteMany({}),
      Company.deleteMany({}),
      Settings.deleteMany({}),
      AuditLog.deleteMany({}),
      Forfait.deleteMany({}),
      Abonnement.deleteMany({}),
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

    // ════════════════════════════════════════════
    // SAAS — Forfaits (avant tout le reste)
    // ════════════════════════════════════════════
    console.log('Creation des forfaits SaaS...');
    const forfaitsData = getForfaitsData();
    const forfaits = await Forfait.insertMany(forfaitsData);
    console.log(`${forfaits.length} forfaits crees (Standard / Professionnel / Complet).`);

    const forfaitMap = new Map();
    forfaits.forEach((f) => forfaitMap.set(f.code, f));

    // ════════════════════════════════════════════
    // PHASE 1 — Fondations
    // ════════════════════════════════════════════

    // 2. Permissions
    console.log('\nCreation des permissions...');
    const permissionsData = generatePermissions();
    const permissions = await Permission.insertMany(permissionsData);
    console.log(`${permissions.length} permissions creees.`);
    const permMap = new Map();
    permissions.forEach((p) => permMap.set(p.code, p._id));

    // 3. Roles
    console.log('\nCreation des roles...');
    const rolesData = getRolesData(permMap);
    const roles = await Role.insertMany(rolesData);
    console.log(`${roles.length} roles crees.`);
    const roleMap = new Map();
    roles.forEach((r) => roleMap.set(r.name, r._id));

    // 4. Entreprise demo — creer AVANT les utilisateurs pour avoir l'ID
    console.log('\nCreation de l\'entreprise demo...');
    const forfaitPro = forfaitMap.get('PROFESSIONNEL');
    const companyData = getCompanyData();
    const company = await Company.create({
      ...companyData,
      status: 'active',
      plan: 'PROFESSIONNEL',
      forfaitId: forfaitPro._id,
      subscriptionStartDate: new Date('2026-01-01'),
      subscriptionEndDate: new Date('2027-01-01'),
    });
    console.log(`Entreprise demo creee : ${company.name} (ID: ${company._id})`);

    // 5. Utilisateurs (super_admin sans companyId, les autres lies a l'entreprise)
    console.log('\nCreation des utilisateurs...');
    const usersData = getUsersData(roleMap, company._id);
    const users = [];
    for (const userData of usersData) {
      const user = await User.create(userData);
      users.push(user);
    }
    console.log(`${users.length} utilisateurs crees.`);

    // users[0] = super_admin (PLATFORM), users[1] = admin entreprise
    const superAdminUser = users[0];
    const adminUser = users[1];

    // Lier l'admin a l'entreprise et marquer la createdBy
    company.adminUser = adminUser._id;
    company.createdBy = superAdminUser._id;
    await company.save();

    // 6. Abonnement actif pour l'entreprise demo
    console.log('\nCreation de l\'abonnement demo...');
    const abonnement = await Abonnement.create({
      entrepriseId: company._id,
      forfaitId: forfaitPro._id,
      periodicite: 'ANNUEL',
      dateDebut: new Date('2026-01-01'),
      dateFin: new Date('2027-01-01'),
      montant: forfaitPro.prixAnnuel,
      statut: 'ACTIF',
      renouvellementAuto: true,
      createdBy: superAdminUser._id,
    });
    // Lier l'abonnement actif a l'entreprise
    company.abonnementActifId = abonnement._id;
    await company.save();
    console.log(`Abonnement PROFESSIONNEL/ANNUEL cree — expire le 01/01/2027.`);

    // 7. Parametres par defaut (lies a l'entreprise)
    console.log('\nCreation des parametres par defaut...');
    const settingsData = getSettingsData();
    await Settings.create({ ...settingsData, companyId: company._id, createdBy: adminUser._id });
    console.log('Parametres par defaut crees.');

    // ════════════════════════════════════════════
    // PHASE 2 — Modules Commerciaux
    // ════════════════════════════════════════════
    console.log('\n--- Phase 2: Modules Commerciaux ---\n');

    // 8. Clients
    console.log('Creation des clients...');
    const clientsRaw = getClientsData(adminUser._id);
    const clients = await Client.insertMany(withCompany(clientsRaw, company._id));
    console.log(`${clients.length} clients crees.`);

    // 9. Fournisseurs
    console.log('\nCreation des fournisseurs...');
    const fournisseursRaw = getFournisseursData(adminUser._id);
    const fournisseurs = await Fournisseur.insertMany(withCompany(fournisseursRaw, company._id));
    console.log(`${fournisseurs.length} fournisseurs crees.`);

    // 10. Categories
    console.log('\nCreation des categories...');
    const categoriesRaw = getCategoriesData(adminUser._id);
    const categories = [];
    for (const catData of withCompany(categoriesRaw, company._id)) {
      categories.push(await Category.create(catData));
    }
    console.log(`${categories.length} categories creees.`);
    const categoryMap = new Map();
    categories.forEach((c) => categoryMap.set(c.name, c._id));

    // 11. Produits
    console.log('\nCreation des produits...');
    const productsRaw = getProductsData(categoryMap, adminUser._id);
    const products = [];
    for (const prodData of withCompany(productsRaw, company._id)) {
      products.push(await Product.create(prodData));
    }
    console.log(`${products.length} produits crees.`);

    // 12. Depots
    console.log('\nCreation des depots...');
    const warehousesRaw = getWarehousesData(adminUser._id);
    const warehouses = [];
    for (const whData of withCompany(warehousesRaw, company._id)) {
      warehouses.push(await Warehouse.create(whData));
    }
    console.log(`${warehouses.length} depots crees.`);
    const mainWarehouse = warehouses[0];

    // 13. Stocks initiaux
    console.log('\nCreation des stocks initiaux...');
    const stocksRaw = getStocksData(products, mainWarehouse, adminUser._id);
    const stocks = await Stock.insertMany(withCompany(stocksRaw, company._id));
    console.log(`${stocks.length} lignes de stock creees.`);
    const totalStockValue = stocks.reduce((sum, s) => sum + s.valeurStock, 0);

    // ════════════════════════════════════════════
    // PHASE 4 — Comptabilite
    // ════════════════════════════════════════════
    console.log('\n--- Phase 4: Paiements & Comptabilite ---\n');

    // 14. Plan comptable SYSCOHADA
    console.log('Creation du plan comptable SYSCOHADA...');
    const planComptableRaw = getPlanComptableData(adminUser._id);
    const comptes = [];
    for (const compteData of withCompany(planComptableRaw, company._id)) {
      comptes.push(await CompteComptable.create(compteData));
    }
    console.log(`${comptes.length} comptes comptables crees.`);
    const classCounts = {};
    comptes.forEach((c) => { classCounts[c.classe] = (classCounts[c.classe] || 0) + 1; });

    // 15. Exercice comptable
    console.log('\nCreation de l\'exercice comptable 2026...');
    const exerciceRaw = getExerciceData(adminUser._id);
    const exercice = await ExerciceComptable.create({ ...exerciceRaw, companyId: company._id });
    console.log(`Exercice ${exercice.code} cree.`);

    // 16. Comptes bancaires
    console.log('\nCreation des comptes bancaires...');
    const bankAccountsRaw = getBankAccountsData(adminUser._id);
    const bankAccounts = [];
    for (const baData of withCompany(bankAccountsRaw, company._id)) {
      if (baData.compteComptableNumero) {
        const cc = comptes.find((c) => c.numero === baData.compteComptableNumero);
        if (cc) baData.compteComptable = cc._id;
      }
      bankAccounts.push(await BankAccount.create(baData));
    }
    console.log(`${bankAccounts.length} comptes bancaires crees.`);
    const totalBanque = bankAccounts.reduce((s, a) => s + a.soldeActuel, 0);

    // ════════════════════════════════════════════
    // PHASE 3+4 — Données transactionnelles
    // ════════════════════════════════════════════
    console.log('\n--- Donnees transactionnelles ---\n');
    const txResult = await seedTransactions(
      adminUser,
      users.filter((u) => u.scope === 'ENTREPRISE'),
      clients,
      products,
      warehouses,
      exercice,
      comptes,
      bankAccounts,
      company._id  // companyId injecte dans les transactions
    );

    // ════════════════════════════════════════════
    // RESUME
    // ════════════════════════════════════════════
    console.log('\n=== Seeding multi-tenant termine avec succes ===');
    console.log(`\nResume:`);
    console.log(`  SaaS:`);
    console.log(`    - ${forfaits.length} forfaits (Standard/Professionnel/Complet)`);
    console.log(`    - 1 abonnement demo PROFESSIONNEL/ANNUEL`);
    console.log(`  Phase 1:`);
    console.log(`    - ${permissions.length} permissions`);
    console.log(`    - ${roles.length} roles`);
    console.log(`    - 1 super_admin [scope=PLATFORM]`);
    console.log(`    - ${users.length - 1} utilisateurs entreprise [scope=ENTREPRISE]`);
    console.log(`    - Entreprise demo: ${company.name}`);
    console.log(`  Phase 2:`);
    console.log(`    - ${clients.length} clients`);
    console.log(`    - ${fournisseurs.length} fournisseurs`);
    console.log(`    - ${categories.length} categories`);
    console.log(`    - ${products.length} produits`);
    console.log(`    - ${warehouses.length} depots`);
    console.log(`    - ${stocks.length} lignes de stock`);
    console.log(`    - Valeur stock: ${new Intl.NumberFormat('fr-FR').format(totalStockValue)} FCFA`);
    console.log(`  Phase 3+4:`);
    console.log(`    - ${txResult.devis} devis`);
    console.log(`    - ${txResult.commandes} commandes`);
    console.log(`    - ${txResult.bonsLivraison} bons de livraison`);
    console.log(`    - ${txResult.factures} factures`);
    console.log(`    - ${txResult.payments} paiements`);
    console.log(`    - ${txResult.ecritures} ecritures comptables`);
    console.log(`  Comptabilite:`);
    console.log(`    - ${comptes.length} comptes SYSCOHADA`);
    for (let cl = 1; cl <= 8; cl++) {
      if (classCounts[cl]) console.log(`      Classe ${cl}: ${classCounts[cl]} comptes`);
    }
    console.log(`    - Tresorerie: ${new Intl.NumberFormat('fr-FR').format(totalBanque)} FCFA`);

    console.log('\nComptes de test:');
    console.log('  [PLATFORM]  superadmin@erp-senegal.com / SuperAdmin@2026!');
    console.log('  [ENTREPRISE] admin@erp-senegal.com / Admin@2026');
    console.log('  [ENTREPRISE] manager@erp-senegal.com / Manager@2026');
    console.log('  [ENTREPRISE] comptable@erp-senegal.com / Comptable@2026');
    console.log('  [ENTREPRISE] commercial@erp-senegal.com / Commercial@2026');
    console.log('  [ENTREPRISE] vendeur@erp-senegal.com / Vendeur@2026');
    console.log('  [ENTREPRISE] caissier@erp-senegal.com / Caissier@2026');
    console.log('  [ENTREPRISE] stock@erp-senegal.com / Stock@2026');

    process.exit(0);
  } catch (error) {
    console.error('Erreur lors du seeding:', error.message);
    console.error(error);
    process.exit(1);
  }
};

seed();
