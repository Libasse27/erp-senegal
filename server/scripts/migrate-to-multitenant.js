/**
 * Script de migration vers le mode multi-tenant
 *
 * Idempotent : peut être relancé plusieurs fois sans effet de bord.
 * À exécuter UNE SEULE FOIS sur une base existante (single-tenant).
 *
 * Actions :
 *  1. Seed des 3 forfaits SaaS (STANDARD / PROFESSIONNEL / COMPLET)
 *  2. Création de l'entreprise principale (la première existante ou nouvelle)
 *  3. Création d'un abonnement ACTIF pour l'entreprise principale
 *  4. Création du super_admin (scope PLATFORM)
 *  5. Mise à jour du scope de tous les utilisateurs existants
 *  6. Estampillage companyId sur tous les documents métier sans tenant
 *  7. Création des Settings par défaut pour l'entreprise (obligatoire pour getNextSequence)
 *
 * Usage :
 *   node server/scripts/migrate-to-multitenant.js
 *   NODE_ENV=production node server/scripts/migrate-to-multitenant.js
 *
 * Variables d'environnement optionnelles :
 *   COMPANY_NAME, COMPANY_EMAIL, SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD
 */

const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const mongoose = require('mongoose');

// ── Modèles ───────────────────────────────────────────────────────────────────
const User     = require('../src/models/User');
const Role     = require('../src/models/Role');
const Company  = require('../src/models/Company');
const Plan     = require('../src/models/Plan');
const Abonnement = require('../src/models/Abonnement');
const Settings = require('../src/models/Settings');

// Tous les modèles métier à estampiller avec companyId
const BUSINESS_MODELS = [
  require('../src/models/Client'),
  require('../src/models/Fournisseur'),
  require('../src/models/Product'),
  require('../src/models/Category'),
  require('../src/models/Stock'),
  require('../src/models/StockMovement'),
  require('../src/models/Warehouse'),
  require('../src/models/Devis'),
  require('../src/models/Commande'),
  require('../src/models/BonLivraison'),
  require('../src/models/Facture'),
  require('../src/models/CommandeAchat'),
  require('../src/models/Payment'),
  require('../src/models/BankAccount'),
  require('../src/models/ExerciceComptable'),
  require('../src/models/CompteComptable'),
  require('../src/models/EcritureComptable'),
  require('../src/models/AuditLog'),
  require('../src/models/Notification'),
];

// ── Configuration ─────────────────────────────────────────────────────────────
const MAIN_COMPANY_NAME    = process.env.COMPANY_NAME          || 'Mon Entreprise';
const MAIN_COMPANY_EMAIL   = process.env.COMPANY_EMAIL         || 'contact@entreprise.sn';
const SUPER_ADMIN_EMAIL    = process.env.SUPER_ADMIN_EMAIL     || 'superadmin@erp-senegal.com';
const SUPER_ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD  || 'SuperAdmin@2026!';

// ── Connexion ─────────────────────────────────────────────────────────────────
const connectDB = async () => {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/erp-gescom';
  await mongoose.connect(uri);
  console.log(`[DB] Connecte a : ${uri.replace(/\/\/.*@/, '//***:***@')}`);
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (n) => new Intl.NumberFormat('fr-FR').format(n);

/**
 * Estampille companyId sur tous les documents d'un modèle qui n'en ont pas encore.
 * Couvre à la fois { $exists: false } et { $eq: null } pour maximiser la couverture.
 */
const stamp = async (Model, companyId) => {
  const result = await Model.updateMany(
    { $or: [{ companyId: { $exists: false } }, { companyId: null }] },
    { $set: { companyId } },
    // Bypass du pre-find hook isActive pour toucher aussi les soft-deleted
    { strict: false }
  );
  // countDocuments bypasse le pre-find car on passe un filtre explicite
  const total = await Model.collection.countDocuments({ companyId });
  return { stamped: result.modifiedCount, total };
};

// ── Plans SaaS ────────────────────────────────────────────────────────────────
const PLAN_DEFAULTS = [
  {
    code: 'STANDARD', nom: 'Standard',
    description: 'Idéal pour les TPE et petits commerces',
    tarifs: { mensuel: 15000, annuel: 150000, devise: 'XOF' },
    modules: ['GESCOM', 'FACTURATION', 'STOCK'],
    limites: { maxUtilisateurs: 3, maxFacturesMois: 100, maxStockageMo: 1024 },
    features: { supportPrioritaire: false, apiAccess: false, multiEtablissement: false },
    essaiGratuitJours: 14, actif: true, visible: true, ordreAffichage: 1,
  },
  {
    code: 'PROFESSIONNEL', nom: 'Professionnel',
    description: 'Pour les PME en croissance',
    tarifs: { mensuel: 35000, annuel: 350000, devise: 'XOF' },
    modules: ['GESCOM', 'FACTURATION', 'STOCK', 'COMPTABILITE', 'REPORTING'],
    limites: { maxUtilisateurs: 10, maxFacturesMois: 1000, maxStockageMo: 5120 },
    features: { supportPrioritaire: false, apiAccess: false, multiEtablissement: false },
    essaiGratuitJours: 14, actif: true, visible: true, ordreAffichage: 2,
  },
  {
    code: 'COMPLET', nom: 'Complet',
    description: 'Solution tout-en-un pour entreprises établies',
    tarifs: { mensuel: 75000, annuel: 750000, devise: 'XOF' },
    modules: ['GESCOM', 'FACTURATION', 'STOCK', 'COMPTABILITE', 'REPORTING', 'PAIE', 'API'],
    limites: { maxUtilisateurs: -1, maxFacturesMois: -1, maxStockageMo: 20480 },
    features: { supportPrioritaire: true, apiAccess: true, multiEtablissement: false },
    essaiGratuitJours: 14, actif: true, visible: true, ordreAffichage: 3,
  },
];

// ── Script principal ───────────────────────────────────────────────────────────
const migrate = async () => {
  const stats = {
    companiesCreated: 0,
    superAdminsCreated: 0,
    usersUpdated: 0,
    plansCreated: 0,
    abonnementsCreated: 0,
    settingsCreated: 0,
    documentsStamped: 0,
  };

  try {
    await connectDB();
    console.log('\n╔══════════════════════════════════════════════╗');
    console.log('║   Migration Multi-Tenant — ERP Sénégal       ║');
    console.log('╚══════════════════════════════════════════════╝\n');

    // ── Étape 1 : Plans SaaS ─────────────────────────────────────────────────
    console.log('▶ Étape 1/7 : Seed des plans SaaS...');
    for (const def of PLAN_DEFAULTS) {
      const existing = await Plan.findOne({ code: def.code });
      if (!existing) {
        await Plan.create(def);
        stats.plansCreated++;
        console.log(`  [+] ${def.code} — ${fmt(def.tarifs.mensuel)} FCFA/mois | ${fmt(def.tarifs.annuel)} FCFA/an`);
      } else {
        console.log(`  [=] ${def.code} déjà présent`);
      }
    }
    const planPro = await Plan.findOne({ code: 'PROFESSIONNEL' });

    // ── Étape 2 : Entreprise principale ──────────────────────────────────────
    console.log('\n▶ Étape 2/7 : Entreprise principale...');
    // findOne bypasse pre-find (companyId n'existe pas sur Company lui-même)
    let company = await Company.findOne({}).sort({ createdAt: 1 });
    if (!company) {
      company = await Company.create({
        name: MAIN_COMPANY_NAME,
        email: MAIN_COMPANY_EMAIL,
        address: { city: 'Dakar', country: 'Senegal' },
        currency: 'XOF',
        status: 'ACTIVE',
        plan: 'PROFESSIONNEL',
        planId: planPro._id,
        subscriptionStartDate: new Date(),
        subscriptionEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      });
      stats.companiesCreated++;
      console.log(`  [+] Créée : ${company.name} (${company._id})`);
    } else {
      let changed = false;
      if (!company.planId) { company.planId = planPro._id; changed = true; }
      if (!company.plan || company.plan === 'starter') { company.plan = 'PROFESSIONNEL'; changed = true; }
      if (!company.status || company.status === 'pending_payment') { company.status = 'ACTIVE'; changed = true; }
      if (changed) { await company.save(); console.log(`  [~] Mise à jour : ${company.name}`); }
      else { console.log(`  [=] Existante : ${company.name} (${company._id})`); }
    }

    // ── Étape 3 : Abonnement ACTIF ────────────────────────────────────────────
    console.log('\n▶ Étape 3/7 : Abonnement de l\'entreprise principale...');
    const existingAbo = await Abonnement.findOne({ entrepriseId: company._id, statut: 'ACTIF' });
    if (!existingAbo) {
      const now = new Date();
      const dateFin = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
      const planSnapshot = {
        code: planPro.code, nom: planPro.nom,
        tarifs: planPro.tarifs, limites: planPro.limites,
        modules: planPro.modules, features: planPro.features,
        version: planPro.version || 1, snapshotAt: now,
      };
      const abo = await Abonnement.create({
        entrepriseId: company._id,
        planId: planPro._id,
        planSnapshot,
        periodicite: 'ANNUEL',
        dateDebut: now,
        dateFin,
        montant: planPro.tarifs.annuel,
        statut: 'ACTIF',
        renouvellementAuto: true,
        historique: [{ action: 'creation', nouveauPlan: planPro.code, note: 'Migration multi-tenant' }],
      });
      company.abonnementActifId = abo._id;
      await company.save();
      stats.abonnementsCreated++;
      console.log(`  [+] PROFESSIONNEL / ANNUEL — expire le ${dateFin.toLocaleDateString('fr-FR')}`);
    } else {
      console.log(`  [=] Abonnement actif présent (expire le ${existingAbo.dateFin?.toLocaleDateString('fr-FR')})`);
      if (!company.abonnementActifId) {
        company.abonnementActifId = existingAbo._id;
        await company.save();
      }
    }

    // ── Étape 4 : Super Admin ─────────────────────────────────────────────────
    console.log('\n▶ Étape 4/7 : Super Admin (scope PLATFORM)...');
    let superAdmin = await User.findOne({ email: SUPER_ADMIN_EMAIL }).setOptions({ includeDeleted: true });
    if (!superAdmin) {
      const saRole = await Role.findOne({ name: { $in: ['super_admin', 'SUPER_ADMIN'] } });
      if (!saRole) {
        console.log('  [!] Rôle super_admin introuvable. Lancez d\'abord : npm run seed');
      } else {
        superAdmin = await User.create({
          firstName: 'Super',
          lastName: 'Admin',
          email: SUPER_ADMIN_EMAIL,
          password: SUPER_ADMIN_PASSWORD,
          phone: '+221 77 000 0000',
          role: saRole._id,
          scope: 'PLATFORM',
          companyId: null,
          isActive: true,
        });
        stats.superAdminsCreated++;
        console.log(`  [+] Créé : ${superAdmin.email}`);
        console.log(`  [!] Mot de passe initial : ${SUPER_ADMIN_PASSWORD}`);
        console.log('  [!] Changez-le immédiatement après la première connexion.');
      }
    } else {
      let changed = false;
      if (superAdmin.scope !== 'PLATFORM')     { superAdmin.scope = 'PLATFORM'; changed = true; }
      if (superAdmin.companyId !== null)        { superAdmin.companyId = null;   changed = true; }
      if (!superAdmin.isActive)                 { superAdmin.isActive = true;    changed = true; }
      if (changed) { await superAdmin.save(); console.log('  [~] Mis à jour : scope=PLATFORM, companyId=null'); }
      else          { console.log(`  [=] Présent : ${superAdmin.email}`); }
    }

    // ── Étape 5 : Scope utilisateurs existants ────────────────────────────────
    console.log('\n▶ Étape 5/7 : Scope des utilisateurs existants...');
    const usersNoScope = await User.find({ scope: { $exists: false } }).setOptions({ includeDeleted: true });
    for (const u of usersNoScope) {
      u.scope = 'ENTREPRISE';
      if (!u.companyId) u.companyId = company._id;
      await u.save();
      stats.usersUpdated++;
    }

    const usersNoCompany = await User.find({ companyId: null, scope: { $ne: 'PLATFORM' } }).setOptions({ includeDeleted: true });
    for (const u of usersNoCompany) {
      u.scope = 'ENTREPRISE';
      u.companyId = company._id;
      await u.save();
      stats.usersUpdated++;
    }
    console.log(`  [~] ${stats.usersUpdated} utilisateur(s) mis à jour avec scope=ENTREPRISE`);

    // Lier adminUser à l'entreprise
    if (!company.adminUser) {
      const adminRole = await Role.findOne({ name: { $in: ['admin', 'ADMIN'] } });
      if (adminRole) {
        const adminUser = await User.findOne({ role: adminRole._id, companyId: company._id });
        if (adminUser) {
          company.adminUser = adminUser._id;
          await company.save();
          console.log(`  [~] Admin lié à l'entreprise : ${adminUser.email}`);
        }
      }
    }

    // ── Étape 6 : Estampillage companyId sur les documents métier ─────────────
    console.log('\n▶ Étape 6/7 : Estampillage companyId sur les documents métier...');
    let totalStamped = 0;
    for (const Model of BUSINESS_MODELS) {
      const modelName = Model.modelName || '?';
      const { stamped, total } = await stamp(Model, company._id);
      if (stamped > 0) {
        console.log(`  [~] ${modelName.padEnd(20)} ${stamped} doc(s) estampillé(s)  (total: ${total})`);
        totalStamped += stamped;
      } else if (total > 0) {
        console.log(`  [=] ${modelName.padEnd(20)} ${total} doc(s) déjà à jour`);
      } else {
        console.log(`  [-] ${modelName.padEnd(20)} collection vide`);
      }
    }
    stats.documentsStamped = totalStamped;

    // ── Étape 7 : Settings par entreprise (CRITIQUE pour getNextSequence) ─────
    console.log('\n▶ Étape 7/7 : Settings par entreprise (séquences de numérotation)...');
    const allCompanies = await Company.find({});
    for (const c of allCompanies) {
      const existingSettings = await Settings.findOne({ companyId: c._id }).setOptions({ includeDeleted: true });
      if (!existingSettings) {
        await Settings.create({
          companyId: c._id,
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
          general: {
            currency: 'XOF',
            language: 'fr',
            timezone: 'Africa/Dakar',
            dateFormat: 'DD/MM/YYYY',
            defaultPaymentTermDays: 30,
            defaultTvaRate: 18,
          },
        });
        stats.settingsCreated++;
        console.log(`  [+] Settings créés pour : ${c.name}`);
      } else {
        console.log(`  [=] Settings existants pour : ${c.name}`);
      }
    }

    // ── Bilan ─────────────────────────────────────────────────────────────────
    console.log('\n╔══════════════════════════════════════════════╗');
    console.log('║        Migration terminée avec succès         ║');
    console.log('╚══════════════════════════════════════════════╝');
    console.log('\nBilan :');
    console.log(`  Plans créés           : ${stats.plansCreated}`);
    console.log(`  Entreprises créées    : ${stats.companiesCreated}`);
    console.log(`  Abonnements créés     : ${stats.abonnementsCreated}`);
    console.log(`  Super admins créés    : ${stats.superAdminsCreated}`);
    console.log(`  Utilisateurs mis à j. : ${stats.usersUpdated}`);
    console.log(`  Documents estampillés : ${stats.documentsStamped}`);
    console.log(`  Settings créés        : ${stats.settingsCreated}`);
    console.log('\n  Entreprise principale :', company._id.toString());
    console.log('  Super Admin email     :', SUPER_ADMIN_EMAIL);
    console.log('\n  La migration est idempotente — relançable sans risque.\n');

    process.exit(0);
  } catch (err) {
    console.error('\n[ERREUR] Migration échouée :', err.message);
    console.error(err);
    process.exit(1);
  }
};

migrate();
