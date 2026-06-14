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

/** Token d'accès sans companyId (auth tests uniquement) */
const getAuthToken = (user) => {
  return jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '15m',
  });
};

/** Token d'accès avec scope ENTREPRISE + companyId */
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

/** Récupère companyId d'un utilisateur en base */
const getUserCompanyId = async (userId) => {
  const u = await User.findById(userId).select('companyId').lean();
  return u?.companyId || null;
};

// ── Forfait ──────────────────────────────────────────────────────────────────
const createTestForfait = async (data = {}) => {
  return Forfait.create({
    code:          data.code || 'STANDARD',
    nom:           data.nom  || 'Standard Test',
    prixMensuel:   data.prixMensuel  || 15000,
    prixAnnuel:    data.prixAnnuel   || 150000,
    modulesInclus: data.modulesInclus || ['GESCOM', 'FACTURATION', 'COMPTABILITE', 'ACHAT', 'STOCK'],
    limites: {
      maxUtilisateurs: data.maxUtilisateurs ?? 10,
      maxFacturesMois: data.maxFacturesMois ?? 500,
      stockageMo:      data.stockageMo      ?? 5120,
      supportPrioritaire: false,
      ...data.limites,
    },
    actif: true,
    ordre: data.ordre || 1,
    ...data,
  });
};

// ── Entreprise ───────────────────────────────────────────────────────────────
const createTestCompany = async (data = {}) => {
  return Company.create({
    name:   data.name   || 'Entreprise Test SA',
    email:  data.email  || `company-${Date.now()}@test.com`,
    phone:  data.phone  || '+221 33 123 45 67',
    status: data.status || 'active',
    ...data,
  });
};

// ── Abonnement ───────────────────────────────────────────────────────────────
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

// ── Settings ─────────────────────────────────────────────────────────────────
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

// ── Permissions ───────────────────────────────────────────────────────────────
const createTestPermissions = async () => {
  const permissions = [];
  const modules = [
    'users', 'clients', 'products', 'factures', 'payments', 'comptabilite',
    'devis', 'commandes', 'bons_livraison', 'paiements', 'ecritures',
    'stocks', 'fournisseurs', 'warehouses', 'rapports',
  ];
  const actions = ['create', 'read', 'update', 'delete', 'export', 'validate'];
  for (const module of modules) {
    for (const action of actions) {
      const perm = await Permission.create({
        module,
        action,
        code: `${module}:${action}`,
        description: `Permission to ${action} ${module}`,
      });
      permissions.push(perm);
    }
  }
  return permissions;
};

const createTestRole = async (name, permissionCodes = []) => {
  const permissions = await Permission.find({ code: { $in: permissionCodes } });
  return Role.create({
    name,
    displayName: name.charAt(0).toUpperCase() + name.slice(1),
    description: `Test ${name} role`,
    permissions: permissions.map((p) => p._id),
    isSystem: true,
  });
};

/**
 * Crée un utilisateur de test COMPLET : role + company + abonnement ACTIF + settings.
 * Le token inclut companyId pour passer tenantMiddleware et subscriptionGuard.
 * @returns {{ user, token, company, abonnement }}
 */
const createTestUser = async (roleName = 'admin', permissionCodes = []) => {
  // Permissions
  let permissions = await Permission.find();
  if (permissions.length === 0) {
    permissions = await createTestPermissions();
  }

  // Rôle
  let role = await Role.findOne({ name: roleName });
  if (!role) {
    const codes = permissionCodes.length > 0
      ? permissionCodes
      : permissions.map((p) => p.code);
    role = await createTestRole(roleName, codes);
  }

  // Entreprise
  const company = await Company.create({
    name:   'Test Company SA',
    email:  `company-${roleName}-${Date.now()}@test.com`,
    phone:  '+221 33 000 00 00',
    status: 'active',
  });

  // Forfait + abonnement ACTIF
  let forfait = await Forfait.findOne({ code: 'STANDARD' });
  if (!forfait) forfait = await createTestForfait();

  const now     = new Date();
  const dateFin = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const abonnement = await Abonnement.create({
    entrepriseId: company._id,
    forfaitId:    forfait._id,
    periodicite:  'MENSUEL',
    dateDebut:    now,
    dateFin,
    montant:      forfait.prixMensuel,
    statut:       'ACTIF',
  });

  await Company.findByIdAndUpdate(company._id, {
    abonnementActifId:   abonnement._id,
    forfaitId:           forfait._id,
    status:              'active',
    subscriptionEndDate: dateFin,
  });

  // Settings numérotation
  await Settings.create({
    companyId: company._id,
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

  // Utilisateur
  const user = await User.create({
    firstName: 'Test',
    lastName:  'User',
    email:     `${roleName}-${Date.now()}@test.com`,
    password:  'password123',
    phone:     '221771234567',
    role:      role._id,
    scope:     'ENTREPRISE',
    companyId: company._id,
    isActive:  true,
  });

  await user.populate({ path: 'role', populate: { path: 'permissions' } });
  const token = getSaasAuthToken(user);
  return { user, token, company, abonnement };
};

/**
 * Crée un utilisateur SaaS lié à une company existante.
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

  const email = data.email || `${roleName}-${Date.now()}@test.sn`;
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

// ── Helpers de données tenant-aware ─────────────────────────────────────────
// Chaque helper auto-récupère companyId de l'utilisateur si non fourni dans data.

const createTestClient = async (userId, data = {}) => {
  const companyId = data.companyId || await getUserCompanyId(userId);
  return Client.create({
    type:          data.type          || 'professionnel',
    raisonSociale: data.raisonSociale || `Client-${Date.now()}`,
    email:         data.email         || `client-${Date.now()}@test.com`,
    phone:         data.phone         || '221771234567',
    ninea:         data.ninea         || '123456789',
    segment:       data.segment       || 'C',
    category:      data.category      || 'grossiste',
    createdBy:     userId,
    companyId,
    isActive: true,
    ...data,
  });
};

const createTestCategory = async (userId, data = {}) => {
  const companyId = data.companyId || await getUserCompanyId(userId);
  return Category.create({
    name:        data.name        || `Category-${Date.now()}`,
    description: data.description || 'Test category',
    createdBy:   userId,
    companyId,
    isActive: true,
    ...data,
  });
};

const createTestProduct = async (userId, categoryId, data = {}) => {
  const companyId = data.companyId || await getUserCompanyId(userId);
  return Product.create({
    name:      data.name      || `Product-${Date.now()}`,
    category:  categoryId,
    prixAchat: data.prixAchat || 1000,
    prixVente: data.prixVente || 1500,
    tauxTVA:   data.tauxTVA  !== undefined ? data.tauxTVA : 18,
    type:      data.type      || 'produit',
    createdBy: userId,
    companyId,
    isActive: true,
    ...data,
  });
};

const createTestFournisseur = async (userId, data = {}) => {
  const companyId = data.companyId || await getUserCompanyId(userId);
  return Fournisseur.create({
    raisonSociale: data.raisonSociale || `Fournisseur-${Date.now()}`,
    email:         data.email         || `fournisseur-${Date.now()}@test.com`,
    phone:         data.phone         || '221771234567',
    category:      data.category      || 'local',
    createdBy:     userId,
    companyId,
    isActive: true,
    ...data,
  });
};

const createTestWarehouse = async (userId, data = {}) => {
  const companyId = data.companyId || await getUserCompanyId(userId);
  return Warehouse.create({
    name:      data.name || `Depot-${Date.now()}`,
    type:      data.type || 'principal',
    createdBy: userId,
    companyId,
    isActive: true,
    ...data,
  });
};

const createTestDevis = async (userId, clientId, productId, data = {}) => {
  const companyId = data.companyId || await getUserCompanyId(userId);
  return Devis.create({
    client:       clientId,
    dateValidite: data.dateValidite || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    lignes: data.lignes || [{
      product:      productId,
      designation:  'Produit Test',
      quantite:     2,
      prixUnitaire: 10000,
      tauxTVA:      18,
    }],
    createdBy: userId,
    companyId,
    isActive: true,
    ...data,
  });
};

const createTestCommande = async (userId, clientId, productId, data = {}) => {
  const companyId = data.companyId || await getUserCompanyId(userId);
  return Commande.create({
    client: clientId,
    lignes: data.lignes || [{
      product:      productId,
      designation:  'Produit Test',
      quantite:     5,
      prixUnitaire: 10000,
      tauxTVA:      18,
    }],
    createdBy: userId,
    companyId,
    isActive: true,
    ...data,
  });
};

const createTestFacture = async (userId, clientId, productId, data = {}) => {
  const companyId = data.companyId || await getUserCompanyId(userId);
  return Facture.create({
    client: clientId,
    lignes: data.lignes || [{
      product:      productId,
      designation:  'Produit Test',
      quantite:     3,
      prixUnitaire: 15000,
      tauxTVA:      18,
    }],
    createdBy: userId,
    companyId,
    isActive: true,
    ...data,
  });
};

const createTestPayment = async (userId, data = {}) => {
  const companyId = data.companyId || await getUserCompanyId(userId);
  return Payment.create({
    montant:      data.montant      || 50000,
    modePaiement: data.modePaiement || 'especes',
    typeTiers:    data.typeTiers    || 'client',
    tiers:        data.tiers,
    facture:      data.facture,
    datePaiement: data.datePaiement || new Date(),
    createdBy:    userId,
    companyId,
    isActive: true,
    ...data,
  });
};

const createTestBankAccount = async (userId, data = {}) => {
  const companyId = data.companyId || await getUserCompanyId(userId);
  return BankAccount.create({
    nom:          data.nom          || 'Compte Test',
    banque:       data.banque       || 'Banque Test',
    numeroCompte: data.numeroCompte || `TEST-${Date.now()}`,
    type:         data.type         || 'courant',
    soldeInitial: data.soldeInitial || 1000000,
    soldeActuel:  data.soldeActuel  || 1000000,
    createdBy:    userId,
    companyId,
    isActive: true,
    ...data,
  });
};

const createTestNotification = async (userId, data = {}) => {
  const companyId = data.companyId || await getUserCompanyId(userId);
  return Notification.create({
    user:      userId,
    type:      data.type    || 'info',
    title:     data.title   || 'Test Notification',
    message:   data.message || 'Ceci est une notification de test',
    companyId,
    ...data,
  });
};

module.exports = {
  getAuthToken,
  getSaasAuthToken,
  getUserCompanyId,
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
