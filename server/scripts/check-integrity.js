/**
 * Script de vérification d'intégrité multi-tenant
 *
 * Vérifie que :
 *  - Aucun document métier n'existe sans companyId
 *  - Chaque Company a des Settings associés
 *  - Chaque Company a un Abonnement actif
 *  - Aucun User ENTREPRISE n'a companyId=null
 *  - Aucun User PLATFORM n'a companyId non-null
 *
 * Usage :
 *   node server/scripts/check-integrity.js
 *   node server/scripts/check-integrity.js --fix   (corrige les orphelins trouvés)
 */

const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const mongoose = require('mongoose');

const User       = require('../src/models/User');
const Company    = require('../src/models/Company');
const Forfait    = require('../src/models/Forfait');
const Abonnement = require('../src/models/Abonnement');
const Settings   = require('../src/models/Settings');

const BUSINESS_MODELS = [
  { Model: require('../src/models/Client'),           name: 'Client' },
  { Model: require('../src/models/Fournisseur'),      name: 'Fournisseur' },
  { Model: require('../src/models/Product'),          name: 'Product' },
  { Model: require('../src/models/Category'),         name: 'Category' },
  { Model: require('../src/models/Stock'),            name: 'Stock' },
  { Model: require('../src/models/StockMovement'),    name: 'StockMovement' },
  { Model: require('../src/models/Warehouse'),        name: 'Warehouse' },
  { Model: require('../src/models/Devis'),            name: 'Devis' },
  { Model: require('../src/models/Commande'),         name: 'Commande' },
  { Model: require('../src/models/BonLivraison'),     name: 'BonLivraison' },
  { Model: require('../src/models/Facture'),          name: 'Facture' },
  { Model: require('../src/models/CommandeAchat'),    name: 'CommandeAchat' },
  { Model: require('../src/models/Payment'),          name: 'Payment' },
  { Model: require('../src/models/BankAccount'),      name: 'BankAccount' },
  { Model: require('../src/models/ExerciceComptable'),name: 'ExerciceComptable' },
  { Model: require('../src/models/CompteComptable'),  name: 'CompteComptable' },
  { Model: require('../src/models/EcritureComptable'),name: 'EcritureComptable' },
  { Model: require('../src/models/AuditLog'),         name: 'AuditLog' },
  { Model: require('../src/models/Notification'),     name: 'Notification' },
];

const FIX_MODE = process.argv.includes('--fix');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/erp-gescom';
  await mongoose.connect(uri);
  console.log(`[DB] Connecté à : ${uri.replace(/\/\/.*@/, '//***:***@')}`);
};

const check = async () => {
  await connectDB();

  const errors   = [];
  const warnings = [];

  console.log('\n╔══════════════════════════════════════════════╗');
  console.log('║   Vérification d\'intégrité Multi-Tenant      ║');
  if (FIX_MODE) console.log('║   MODE --fix ACTIVÉ                          ║');
  console.log('╚══════════════════════════════════════════════╝\n');

  // 1. Documents métier sans companyId
  console.log('▶ 1/5 — Documents sans companyId...');
  let orphansTotal = 0;
  for (const { Model, name } of BUSINESS_MODELS) {
    const orphans = await Model.collection.countDocuments({
      $or: [{ companyId: { $exists: false } }, { companyId: null }],
    });
    if (orphans > 0) {
      errors.push(`${name}: ${orphans} document(s) sans companyId`);
      console.log(`  ❌ ${name.padEnd(22)} ${orphans} orphelin(s)`);
      orphansTotal += orphans;
    } else {
      console.log(`  ✅ ${name.padEnd(22)} OK`);
    }
  }
  if (orphansTotal > 0 && FIX_MODE) {
    console.log(`\n  [fix] ${orphansTotal} orphelin(s) détecté(s) — lancez migrate:multitenant pour corriger.`);
  }

  // 2. Users ENTREPRISE sans companyId
  console.log('\n▶ 2/5 — Users ENTREPRISE sans companyId...');
  const usersNoCompany = await User.collection.countDocuments({
    scope: 'ENTREPRISE',
    $or: [{ companyId: { $exists: false } }, { companyId: null }],
  });
  if (usersNoCompany > 0) {
    errors.push(`User: ${usersNoCompany} user(s) ENTREPRISE sans companyId`);
    console.log(`  ❌ ${usersNoCompany} user(s) ENTREPRISE sans companyId`);
  } else {
    console.log('  ✅ Tous les users ENTREPRISE ont un companyId');
  }

  // 3. Users PLATFORM avec companyId non-null
  console.log('\n▶ 3/5 — Users PLATFORM avec companyId non-null...');
  const platformWithCompany = await User.collection.countDocuments({
    scope: 'PLATFORM',
    companyId: { $ne: null, $exists: true },
  });
  if (platformWithCompany > 0) {
    warnings.push(`User: ${platformWithCompany} user(s) PLATFORM avec companyId non-null`);
    console.log(`  ⚠️  ${platformWithCompany} user(s) PLATFORM ont un companyId (devrait être null)`);
    if (FIX_MODE) {
      await User.updateMany({ scope: 'PLATFORM' }, { $set: { companyId: null } });
      console.log('  [fix] companyId réinitialisé à null pour tous les users PLATFORM');
    }
  } else {
    console.log('  ✅ Tous les users PLATFORM ont companyId=null');
  }

  // 4. Entreprises sans Settings
  console.log('\n▶ 4/5 — Entreprises sans Settings (séquences de numérotation)...');
  const companies = await Company.find({});
  let companiesNoSettings = 0;
  for (const c of companies) {
    const s = await Settings.collection.findOne({ companyId: c._id });
    if (!s) {
      warnings.push(`Company "${c.name}" (${c._id}) sans Settings`);
      console.log(`  ⚠️  "${c.name}" — pas de Settings (getNextSequence va échouer !)`);
      companiesNoSettings++;
      if (FIX_MODE) {
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
          general: { currency: 'XOF', language: 'fr', timezone: 'Africa/Dakar' },
        });
        console.log(`  [fix] Settings créés pour : ${c.name}`);
      }
    } else {
      console.log(`  ✅ "${c.name}" — Settings OK`);
    }
  }
  if (companies.length === 0) {
    warnings.push('Aucune entreprise trouvée en base');
    console.log('  ⚠️  Aucune entreprise en base — lancez la migration d\'abord');
  }

  // 5. Entreprises sans abonnement actif
  console.log('\n▶ 5/5 — Entreprises sans abonnement actif...');
  let companiesNoAbo = 0;
  for (const c of companies) {
    const abo = await Abonnement.findOne({ entrepriseId: c._id, statut: 'ACTIF' });
    if (!abo) {
      warnings.push(`Company "${c.name}" sans abonnement ACTIF`);
      console.log(`  ⚠️  "${c.name}" — pas d'abonnement actif (accès bloqué par subscriptionGuard)`);
      companiesNoAbo++;
    } else {
      const jours = Math.ceil((abo.dateFin - new Date()) / (1000 * 60 * 60 * 24));
      const icon = jours < 7 ? '⚠️ ' : '✅';
      console.log(`  ${icon} "${c.name}" — expire dans ${jours} jour(s)`);
    }
  }

  // Résumé
  console.log('\n╔══════════════════════════════════════════════╗');
  console.log('║              Rapport d\'intégrité             ║');
  console.log('╚══════════════════════════════════════════════╝');

  if (errors.length === 0 && warnings.length === 0) {
    console.log('\n  ✅ Intégrité parfaite — aucun problème détecté.\n');
    process.exit(0);
  }

  if (errors.length > 0) {
    console.log(`\n  ERREURS (${errors.length}) :`);
    errors.forEach((e) => console.log(`    ❌ ${e}`));
  }
  if (warnings.length > 0) {
    console.log(`\n  AVERTISSEMENTS (${warnings.length}) :`);
    warnings.forEach((w) => console.log(`    ⚠️  ${w}`));
  }

  if (!FIX_MODE && (errors.length > 0 || warnings.length > 0)) {
    console.log('\n  Relancez avec --fix pour corriger automatiquement les problèmes détectés.');
    console.log('  Ou lancez : npm run migrate:multitenant\n');
  }

  process.exit(errors.length > 0 ? 1 : 0);
};

check().catch((err) => {
  console.error('[ERREUR]', err.message);
  process.exit(1);
});
