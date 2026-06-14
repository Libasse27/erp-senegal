const jwt = require('jsonwebtoken');
const User = require('../src/models/User');
const Role = require('../src/models/Role');
const Permission = require('../src/models/Permission');
const Company    = require('../src/models/Company');
const Forfait    = require('../src/models/Forfait');
const Abonnement = require('../src/models/Abonnement');
const Settings   = require('../src/models/Settings');
const Client = require('../src/models/Client');
const Product = require('../src/models/Product');
const Category = require('../src/models/Category');
const Fournisseur = require('../src/models/Fournisseur');
const Warehouse = require('../src/models/Warehouse');
const Devis = require('../src/models/Devis');
const Commande = require('../src/models/Commande');
const Facture = require('../src/models/Facture');
const Payment = require('../src/models/Payment');
const BankAccount = require('../src/models/BankAccount');
const Notification = require('../src/models/Notification');

/**
 * Generate JWT access token for a user (legacy — no companyId in payload)
 */
const getAuthToken = (user) => {
  return jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '15m',
  });
};

/**
 * Generate JWT access token with SaaS scope (includes companyId + scope)
 */
const getSaasAuthToken = (user) => {
  return jwt.sign(
    {
      id:        user._id,
      scope:     user.scope     || 'ENTREPRISE',
      companyId: user.companyId || null,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '15m' }
  );
};

/**
 * Create a test Company
 */
const createTestCompany = async (data = {}) => {
  return Company.create({
    name:   data.name   || 'Entreprise Test SA',
    email:  data.email  || 'contact@test-company.sn',
    phone:  data.phone  || '+221 33 123 45 67',
    status: data.status || 'active',
    ...data,
  });
};

/**
 * Create a test Forfait
 */
const createTestForfait = async (data = {}) => {
  return Forfait.create({
    code:          data.code || 'STANDARD',
    nom:           data.nom  || 'Standard Test',
    prixMensuel:   data.prixMensuel  || 15000,
    prixAnnuel:    data.prixAnnuel   || 150000,
    modulesInclus: data.modulesInclus || ['GESCOM', 'FACTURATION'],
    limites: {
      maxUtilisateurs: data.maxUtilisateurs ?? 3,
      maxFacturesMois: data.maxFacturesMois ?? 100,
      stockageMo:      data.stockageMo ?? 1024,
      supportPrioritaire: false,
      ...data.limites,
    },
    actif:  true,
    ordre:  data.ordre || 1,
    ...data,
  });
};

/**
 * Create a test Abonnement
 */
const createTestAbonnement = async (entrepriseId, forfaitId, data = {}) => {
  const dateDebut = data.dateDebut || new Date();
  const dateFin   = data.dateFin   || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  return Abonnement.create({
    entrepriseId,
    forfaitId,
    periodicite: data.periodicite || 'MENSUEL',
    dateDebut,
    dateFin,
    montant:     data.montant || 15000,
    statut:      data.statut  || 'EN_ATTENTE',
    ...data,
  });
};

/**
 * Create Settings (séquences de numérotation) for a company
 */
const createTestSettings = async (companyId) => {
  return Settings.create({
    companyId,
    isActive: true,
    numbering: {
      invoice:       { prefix: 'FA', currentSequence: 0 },
      quote:         { prefix: 'DE', currentSequence: 0 },
      purchaseOrder: { prefix: 'BC', currentSequence: 0 },
      deliveryNote:  { prefix: 'BL', currentSequence: 0 },
      creditNote:    { prefix: 'AV', currentSequence: 0 },
      salesOrder:    { prefix: 'CM', currentSequence: 0 },
      payment:       { prefix: 'PA', currentSequence: 0 },
    },
    general: { currency: 'XOF', language: 'fr', timezone: 'Africa/Dakar' },
  });
};

/**
 * Create a user belonging to a specific company (SaaS ENTREPRISE scope)
 */
const createSaasUser = async (companyId, roleName = 'admin', data = {}) => {
  let role = await Role.findOne({ name: roleName });
  if (!role) {
    let perms = await Permission.find();
    if (perms.length === 0) perms = await createTestPermissions();
    role = await Role.create({
      name:        roleName,
      displayName: roleName,
      description: `Role ${roleName}`,
      permissions: perms.map((p) => p._id),
      isSystem:    true,
    });
  }

  const email = data.email || `${roleName}-${companyId}@test.sn`;
  const user  = await User.create({
    firstName: data.firstName || 'Test',
    lastName:  data.lastName  || 'User',
    email,
    password:  data.password  || 'password123',
    phone:     data.phone     || '+221771234567',
    role:      role._id,
    scope:     'ENTREPRISE',
    companyId,
    isActive:  true,
    ...data,
  });

  await user.populate({ path: 'role', populate: { path: 'permissions' } });

  const token = getSaasAuthToken(user);
  return { user, token };
};

/**
 * Create test permissions
 */
const createTestPermissions = async () => {
  const permissions = [];
  const modules = ['users', 'clients', 'products', 'factures', 'payments', 'comptabilite'];
  const actions = ['create', 'read', 'update', 'delete', 'export'];

  for (const module of modules) {
    for (const action of actions) {
      const permission = await Permission.create({
        module,
        action,
        code: `${module}:${action}`,
        description: `Permission to ${action} ${module}`,
      });
      permissions.push(permission);
    }
  }

  return permissions;
};

/**
 * Create test role with permissions
 */
const createTestRole = async (name, permissionCodes = []) => {
  const permissions = await Permission.find({
    code: { $in: permissionCodes },
  });

  const role = await Role.create({
    name,
    displayName: name.charAt(0).toUpperCase() + name.slice(1),
    description: `Test ${name} role`,
    permissions: permissions.map((p) => p._id),
    isSystem: true,
  });

  return role;
};

/**
 * Create test user with role
 */
const createTestUser = async (roleName = 'admin', permissionCodes = []) => {
  // Create permissions if they don't exist
  let permissions = await Permission.find();
  if (permissions.length === 0) {
    permissions = await createTestPermissions();
  }

  // Create role if it doesn't exist
  let role = await Role.findOne({ name: roleName });
  if (!role) {
    const codes = permissionCodes.length > 0
      ? permissionCodes
      : permissions.map((p) => p.code);
    role = await createTestRole(roleName, codes);
  }

  // Create user
  const user = await User.create({
    firstName: 'Test',
    lastName: 'User',
    email: `${roleName}@test.com`,
    password: 'password123',
    phone: '221771234567',
    role: role._id,
  });

  const token = getAuthToken(user);

  // Populate role and permissions for convenience
  await user.populate({
    path: 'role',
    populate: { path: 'permissions' },
  });

  return { user, token };
};

/**
 * Create test client
 */
const createTestClient = async (userId, data = {}) => {
  const client = await Client.create({
    type: data.type || 'professionnel',
    raisonSociale: data.raisonSociale || 'Test Client SA',
    email: data.email || 'client@test.com',
    phone: data.phone || '221771234567',
    ninea: data.ninea || '123456789',
    segment: data.segment || 'C',
    category: data.category || 'grossiste',
    createdBy: userId,
    ...data,
  });

  return client;
};

/**
 * Create test category
 */
const createTestCategory = async (userId, data = {}) => {
  const category = await Category.create({
    name: data.name || 'Test Category',
    description: data.description || 'Test category description',
    createdBy: userId,
    ...data,
  });

  return category;
};

/**
 * Create test product
 */
const createTestProduct = async (userId, categoryId, data = {}) => {
  const product = await Product.create({
    name: data.name || 'Test Product',
    category: categoryId,
    prixAchat: data.prixAchat || 1000,
    prixVente: data.prixVente || 1500,
    tauxTVA: data.tauxTVA !== undefined ? data.tauxTVA : 18,
    type: data.type || 'produit',
    createdBy: userId,
    ...data,
  });

  return product;
};

/**
 * Create test fournisseur
 */
const createTestFournisseur = async (userId, data = {}) => {
  return Fournisseur.create({
    raisonSociale: data.raisonSociale || 'Test Fournisseur SA',
    email: data.email || 'fournisseur@test.com',
    phone: data.phone || '221771234567',
    category: data.category || 'local',
    createdBy: userId,
    ...data,
  });
};

/**
 * Create test warehouse
 */
const createTestWarehouse = async (userId, data = {}) => {
  return Warehouse.create({
    name: data.name || 'Depot Test',
    type: data.type || 'principal',
    createdBy: userId,
    ...data,
  });
};

/**
 * Create test devis
 */
const createTestDevis = async (userId, clientId, productId, data = {}) => {
  return Devis.create({
    client: clientId,
    dateValidite: data.dateValidite || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    lignes: data.lignes || [{
      product: productId,
      designation: 'Produit Test',
      quantite: 2,
      prixUnitaire: 10000,
      tauxTVA: 18,
    }],
    createdBy: userId,
    ...data,
  });
};

/**
 * Create test commande
 */
const createTestCommande = async (userId, clientId, productId, data = {}) => {
  return Commande.create({
    client: clientId,
    lignes: data.lignes || [{
      product: productId,
      designation: 'Produit Test',
      quantite: 5,
      prixUnitaire: 10000,
      tauxTVA: 18,
    }],
    createdBy: userId,
    ...data,
  });
};

/**
 * Create test facture
 */
const createTestFacture = async (userId, clientId, productId, data = {}) => {
  return Facture.create({
    client: clientId,
    lignes: data.lignes || [{
      product: productId,
      designation: 'Produit Test',
      quantite: 3,
      prixUnitaire: 15000,
      tauxTVA: 18,
    }],
    createdBy: userId,
    ...data,
  });
};

/**
 * Create test payment
 */
const createTestPayment = async (userId, data = {}) => {
  return Payment.create({
    montant: data.montant || 50000,
    modePaiement: data.modePaiement || 'especes',
    typeTiers: data.typeTiers || 'client',
    tiers: data.tiers,
    facture: data.facture,
    datePaiement: data.datePaiement || new Date(),
    createdBy: userId,
    ...data,
  });
};

/**
 * Create test bank account
 */
const createTestBankAccount = async (userId, data = {}) => {
  return BankAccount.create({
    nom: data.nom || 'Compte Test',
    banque: data.banque || 'Banque Test',
    numeroCompte: data.numeroCompte || `TEST-${Date.now()}`,
    type: data.type || 'courant',
    soldeInitial: data.soldeInitial || 1000000,
    soldeActuel: data.soldeActuel || 1000000,
    createdBy: userId,
    ...data,
  });
};

/**
 * Create test notification
 */
const createTestNotification = async (userId, data = {}) => {
  return Notification.create({
    user: userId,
    type: data.type || 'info',
    title: data.title || 'Test Notification',
    message: data.message || 'Ceci est une notification de test',
    ...data,
  });
};

module.exports = {
  getAuthToken,
  getSaasAuthToken,
  createTestPermissions,
  createTestRole,
  createTestUser,
  createSaasUser,
  createTestCompany,
  createTestForfait,
  createTestAbonnement,
  createTestSettings,
  createTestClient,
  createTestCategory,
  createTestProduct,
  createTestFournisseur,
  createTestWarehouse,
  createTestDevis,
  createTestCommande,
  createTestFacture,
  createTestPayment,
  createTestBankAccount,
  createTestNotification,
};
