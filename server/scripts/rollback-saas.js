/**
 * Script de rollback — annule la migration multi-tenant
 *
 * ⚠️  DESTRUCTIF — à utiliser uniquement en développement ou urgence absolue.
 *
 * Ce script :
 *  1. Retire companyId de tous les documents métier
 *  2. Supprime les Settings créés par la migration
 *  3. Supprime les Abonnements SaaS
 *  4. Supprime les Forfaits SaaS
 *  5. Retire scope et remet companyId=null sur les Users
 *  6. Supprime le compte super_admin créé par la migration
 *  OPTIONNEL (--delete-company) : supprime aussi l'entreprise principale
 *
 * Usage :
 *   node server/scripts/rollback-saas.js
 *   node server/scripts/rollback-saas.js --delete-company
 *
 * IMPORTANT : Une confirmation manuelle est requise (tapez "CONFIRMER").
 */

const readline = require('readline');
const path     = require('path');
const dotenv   = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const mongoose = require('mongoose');

const User       = require('../src/models/User');
const Company    = require('../src/models/Company');
const Forfait    = require('../src/models/Forfait');
const Abonnement = require('../src/models/Abonnement');
const Settings   = require('../src/models/Settings');

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

const DELETE_COMPANY = process.argv.includes('--delete-company');
const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || 'superadmin@erp-senegal.com';

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/erp-gescom';
  await mongoose.connect(uri);
};

const confirm = () =>
  new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question('\nTapez CONFIRMER pour exécuter le rollback : ', (answer) => {
      rl.close();
      resolve(answer.trim() === 'CONFIRMER');
    });
  });

const rollback = async () => {
  await connectDB();

  console.log('\n╔══════════════════════════════════════════════╗');
  console.log('║   ROLLBACK Migration Multi-Tenant            ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log('\n  ⚠️  OPÉRATION DESTRUCTIVE — données SaaS supprimées.');
  if (DELETE_COMPANY) console.log('  ⚠️  --delete-company : l\'entreprise principale sera aussi supprimée.');

  const ok = await confirm();
  if (!ok) {
    console.log('\n  Rollback annulé.\n');
    process.exit(0);
  }

  console.log('\n  Rollback en cours...');

  // 1. Retirer companyId des documents métier
  console.log('\n▶ 1/6 — Retrait de companyId sur les documents métier...');
  for (const Model of BUSINESS_MODELS) {
    const r = await Model.collection.updateMany(
      { companyId: { $exists: true } },
      { $unset: { companyId: '' } }
    );
    console.log(`  ${Model.modelName.padEnd(22)} ${r.modifiedCount} doc(s) modifié(s)`);
  }

  // 2. Supprimer les Settings créés par la migration
  console.log('\n▶ 2/6 — Suppression des Settings...');
  const settingsRes = await Settings.collection.deleteMany({});
  console.log(`  ${settingsRes.deletedCount} Settings supprimé(s)`);

  // 3. Supprimer les Abonnements
  console.log('\n▶ 3/6 — Suppression des Abonnements SaaS...');
  const aboRes = await Abonnement.collection.deleteMany({});
  console.log(`  ${aboRes.deletedCount} Abonnement(s) supprimé(s)`);

  // 4. Supprimer les Forfaits
  console.log('\n▶ 4/6 — Suppression des Forfaits SaaS...');
  const forfaitRes = await Forfait.collection.deleteMany({});
  console.log(`  ${forfaitRes.deletedCount} Forfait(s) supprimé(s)`);

  // 5. Supprimer le super_admin créé par la migration
  console.log('\n▶ 5/6 — Suppression du super admin...');
  const saRes = await User.collection.deleteOne({ email: SUPER_ADMIN_EMAIL, scope: 'PLATFORM' });
  console.log(`  ${saRes.deletedCount} super admin supprimé`);

  // Remettre scope/companyId par défaut sur les autres users
  await User.collection.updateMany(
    { scope: { $exists: true } },
    { $unset: { scope: '' } }
  );
  console.log('  Scope retiré de tous les utilisateurs');

  // 6. Supprimer l'entreprise principale (optionnel)
  if (DELETE_COMPANY) {
    console.log('\n▶ 6/6 — Suppression de l\'entreprise principale...');
    const cRes = await Company.collection.deleteMany({});
    console.log(`  ${cRes.deletedCount} entreprise(s) supprimée(s)`);
  } else {
    console.log('\n▶ 6/6 — Entreprise conservée (passez --delete-company pour la supprimer)');
    // Reset abonnementActifId et forfaitId sur les entreprises
    await Company.collection.updateMany(
      {},
      { $unset: { abonnementActifId: '', forfaitId: '' }, $set: { status: 'pending_payment', plan: 'STANDARD' } }
    );
  }

  console.log('\n╔══════════════════════════════════════════════╗');
  console.log('║        Rollback terminé avec succès           ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log('\n  La base est revenue à l\'état pré-migration.');
  console.log('  Relancez npm run migrate:multitenant pour réappliquer.\n');
  process.exit(0);
};

rollback().catch((err) => {
  console.error('[ERREUR]', err.message);
  process.exit(1);
});
