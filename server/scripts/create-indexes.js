/**
 * Script de création des index composites multi-tenant.
 *
 * Usage : node server/scripts/create-indexes.js
 *
 * Crée tous les index { companyId: 1, ... } sur les collections business.
 * Idempotent : MongoDB ignore les index qui existent déjà.
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error('MONGODB_URI manquant dans les variables d\'environnement');
  process.exit(1);
}

// ── Définition des index par collection ─────────────────────────────────────

const INDEXES = [
  {
    collection: 'clients',
    indexes: [
      { key: { companyId: 1, isActive: 1 }, options: {} },
      { key: { companyId: 1, type: 1, isActive: 1 }, options: {} },
      { key: { companyId: 1, createdAt: -1 }, options: {} },
    ],
  },
  {
    collection: 'products',
    indexes: [
      { key: { companyId: 1, isActive: 1 }, options: {} },
      { key: { companyId: 1, category: 1, isActive: 1 }, options: {} },
      { key: { companyId: 1, type: 1 }, options: {} },
    ],
  },
  {
    collection: 'factures',
    indexes: [
      { key: { companyId: 1, statut: 1, createdAt: -1 }, options: {} },
      { key: { companyId: 1, client: 1, createdAt: -1 }, options: {} },
      { key: { companyId: 1, type: 1, statut: 1 }, options: {} },
    ],
  },
  {
    collection: 'commandes',
    indexes: [
      { key: { companyId: 1, statut: 1, createdAt: -1 }, options: {} },
      { key: { companyId: 1, client: 1, createdAt: -1 }, options: {} },
    ],
  },
  {
    collection: 'commandeachats',
    indexes: [
      { key: { companyId: 1, statut: 1, createdAt: -1 }, options: {} },
      { key: { companyId: 1, fournisseur: 1, createdAt: -1 }, options: {} },
    ],
  },
  {
    collection: 'devis',
    indexes: [
      { key: { companyId: 1, statut: 1, dateValidite: 1 }, options: {} },
      { key: { companyId: 1, client: 1 }, options: {} },
    ],
  },
  {
    collection: 'bonlivraisons',
    indexes: [
      { key: { companyId: 1, statut: 1, createdAt: -1 }, options: {} },
      { key: { companyId: 1, client: 1 }, options: {} },
    ],
  },
  {
    collection: 'stocks',
    indexes: [
      { key: { companyId: 1, product: 1, warehouse: 1 }, options: {} },
      { key: { companyId: 1, product: 1, quantite: 1 }, options: {} },
    ],
  },
  {
    collection: 'stockmovements',
    indexes: [
      { key: { companyId: 1, product: 1, createdAt: -1 }, options: {} },
      { key: { companyId: 1, type: 1, createdAt: -1 }, options: {} },
    ],
  },
  {
    collection: 'ecriturecomptables',
    indexes: [
      { key: { companyId: 1, exercice: 1, createdAt: -1 }, options: {} },
      { key: { companyId: 1, compteDebit: 1, createdAt: -1 }, options: {} },
      { key: { companyId: 1, compteCredit: 1, createdAt: -1 }, options: {} },
    ],
  },
  {
    collection: 'payments',
    indexes: [
      { key: { companyId: 1, statut: 1, createdAt: -1 }, options: {} },
      { key: { companyId: 1, facture: 1 }, options: {} },
    ],
  },
  {
    collection: 'notifications',
    indexes: [
      { key: { companyId: 1, userId: 1, isRead: 1 }, options: {} },
      { key: { companyId: 1, createdAt: -1 }, options: {} },
    ],
  },
  {
    collection: 'auditlogs',
    indexes: [
      { key: { companyId: 1, entity: 1, createdAt: -1 }, options: {} },
      { key: { companyId: 1, userId: 1, createdAt: -1 }, options: {} },
    ],
  },
  {
    collection: 'bankaccounts',
    indexes: [
      { key: { companyId: 1, isActive: 1 }, options: {} },
    ],
  },
  {
    collection: 'categories',
    indexes: [
      { key: { companyId: 1, isActive: 1 }, options: {} },
    ],
  },
  {
    collection: 'fournisseurs',
    indexes: [
      { key: { companyId: 1, isActive: 1 }, options: {} },
    ],
  },
  {
    collection: 'warehouses',
    indexes: [
      { key: { companyId: 1, isActive: 1 }, options: {} },
    ],
  },
];

// ── Exécution ────────────────────────────────────────────────────────────────

async function createIndexes() {
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connecté à MongoDB\n');

  const db = mongoose.connection.db;
  let totalCreated = 0;
  let totalErrors = 0;

  for (const { collection, indexes } of INDEXES) {
    console.log(`📦 Collection: ${collection}`);
    const coll = db.collection(collection);

    for (const { key, options } of indexes) {
      try {
        await coll.createIndex(key, { background: true, ...options });
        const keyStr = JSON.stringify(key);
        console.log(`  ✓ ${keyStr}`);
        totalCreated++;
      } catch (err) {
        console.error(`  ✗ ${JSON.stringify(key)} — ${err.message}`);
        totalErrors++;
      }
    }
  }

  console.log(`\n🎯 Résumé : ${totalCreated} index créés, ${totalErrors} erreurs`);
  await mongoose.disconnect();
}

createIndexes().catch((err) => {
  console.error('Erreur fatale:', err);
  process.exit(1);
});
