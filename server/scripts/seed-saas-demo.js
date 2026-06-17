/**
 * Script de seed démo pour la soutenance de thèse.
 *
 * Crée :
 *   - Plan PROFESSIONNEL (si absent)
 *   - Rôle admin (si absent)
 *   - Entreprise  "Ndakaru SARL" (Dakar, Sénégal)
 *   - Admin       demo-admin@ndakaru.sn / Admin@Demo2026!
 *   - Abonnement  ACTIF PROFESSIONNEL (mensuel, 35 000 FCFA)
 *   - Paiement    REUSSI (Wave, 35 000 FCFA)
 *   - Facture SaaS PAYEE
 *
 * Usage :
 *   node server/scripts/seed-saas-demo.js
 *   ou via npm script : npm run seed:saas-demo
 */

'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

// ── Import modèles ─────────────────────────────────────────────────────────────
const Company        = require('../src/models/Company');
const User           = require('../src/models/User');
const Plan           = require('../src/models/Plan');
const Abonnement     = require('../src/models/Abonnement');
const PaiementSaas   = require('../src/models/PaiementSaas');
const InvoiceSaas    = require('../src/models/InvoiceSaas');

let Role;
try { Role = require('../src/models/Role'); } catch (_) { Role = null; }

// ── Config ──────────────────────────────────────────────────────────────────────

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/erp-senegal';

const ADMIN_EMAIL    = 'demo-admin@ndakaru.sn';
const ADMIN_PASSWORD = 'Admin@Demo2026!';
const COMPANY_NAME   = 'Ndakaru SARL';

// ── Helpers ─────────────────────────────────────────────────────────────────────

const log = (msg) => console.log(`[seed-demo] ${msg}`);
const warn = (msg) => console.warn(`[seed-demo] WARN: ${msg}`);

async function upsertRole(name, displayName) {
  if (!Role) return null;
  let role = await Role.findOne({ name });
  if (!role) {
    role = await Role.create({ name, displayName, permissions: [], isSystem: true });
    log(`Rôle "${name}" créé.`);
  }
  return role;
}

async function upsertPlan() {
  let plan = await Plan.findOne({ code: 'PRO' });
  if (plan) { log('Plan PRO déjà présent.'); return plan; }

  plan = await Plan.create({
    code: 'PRO',
    nom: 'Professionnel',
    description: 'Plan professionnel pour PME sénégalaises',
    tarifs: { mensuel: 35000, annuel: 350000, devise: 'XOF' },
    modules: ['GESCOM', 'COMPTABILITE', 'CRM', 'RH', 'REPORTING'],
    limites: { maxUtilisateurs: 10, maxFacturesMois: 500, maxStockageMo: 5120 },
    features: {
      multiEntreprise: false,
      exportComptable: true,
      apiAccess: true,
      supportPrioritaire: true,
    },
    actif: true,
    ordre: 2,
  });
  log('Plan PRO créé.');
  return plan;
}

async function upsertCompany() {
  let company = await Company.findOne({ name: COMPANY_NAME });
  if (company) { log(`Entreprise "${COMPANY_NAME}" déjà présente.`); return company; }

  company = await Company.create({
    name: COMPANY_NAME,
    email: ADMIN_EMAIL,
    phone: '+221776543210',
    address: {
      street: 'Rue 10 × Avenue Cheikh Anta Diop',
      city: 'Dakar',
      country: 'Sénégal',
    },
    siret: 'SN-DKR-2026-001',
    secteur: 'Commerce général',
    devise: 'XOF',
    locale: 'fr-SN',
    timezone: 'Africa/Dakar',
    isActive: true,
  });
  log(`Entreprise "${COMPANY_NAME}" créée.`);
  return company;
}

async function upsertAdmin(company, adminRole) {
  let user = await User.findOne({ email: ADMIN_EMAIL });
  if (user) { log(`Admin "${ADMIN_EMAIL}" déjà présent.`); return user; }

  const hash = await bcrypt.hash(ADMIN_PASSWORD, 12);
  user = await User.create({
    firstName: 'Ibrahima',
    lastName:  'Diallo',
    email:     ADMIN_EMAIL,
    password:  hash,
    phone:     '+221776543210',
    role:      adminRole?._id || undefined,
    companyId: company._id,
    isActive:  true,
    scope:     'COMPANY',
  });
  log(`Admin "${ADMIN_EMAIL}" créé (mot de passe : ${ADMIN_PASSWORD}).`);
  return user;
}

async function buildPlanSnapshot(plan) {
  return {
    code:     plan.code,
    nom:      plan.nom,
    tarifs:   plan.tarifs,
    limites:  plan.limites,
    modules:  plan.modules,
    features: plan.features || {},
    version:  plan.__v ?? 1,
    snapshotAt: new Date(),
  };
}

async function upsertAbonnement(company, plan) {
  let abo = await Abonnement.findOne({ entrepriseId: company._id });
  if (abo) { log('Abonnement déjà présent.'); return abo; }

  const now       = new Date();
  const dateFin   = new Date(now.getTime() + 30 * 24 * 3600 * 1000);
  const snapshot  = await buildPlanSnapshot(plan);

  abo = await Abonnement.create({
    entrepriseId:  company._id,
    planId:        plan._id,
    planSnapshot:  snapshot,
    periodicite:   'MENSUEL',
    dateDebut:     now,
    dateFin,
    montant:       35000,
    statut:        'ACTIF',
    renouvellementAuto: true,
  });
  log('Abonnement ACTIF créé.');
  return abo;
}

async function upsertPaiement(company, abo) {
  let paiement = await PaiementSaas.findOne({ entrepriseId: company._id });
  if (paiement) { log('Paiement SaaS déjà présent.'); return paiement; }

  paiement = await PaiementSaas.create({
    entrepriseId:   company._id,
    abonnementId:   abo._id,
    montant:        35000,
    devise:         'XOF',
    methodePaiement:'WAVE',
    statut:         'REUSSI',
    reference:      `WAVE-DEMO-${Date.now()}`,
    datePaiement:   new Date(),
    periodicite:    'MENSUEL',
    metadata:       { source: 'seed-demo' },
  });
  log('PaiementSaaS REUSSI créé.');
  return paiement;
}

async function upsertInvoice(company, abo, paiement) {
  let invoice = await InvoiceSaas.findOne({ entrepriseId: company._id });
  if (invoice) { log('Facture SaaS déjà présente.'); return invoice; }

  const now    = new Date();
  const numero = `INV-DEMO-${now.getFullYear()}-001`;

  invoice = await InvoiceSaas.create({
    numero,
    entrepriseId: company._id,
    abonnementId: abo._id,
    paiementId:   paiement._id,
    dateEmission: now,
    dateEcheance: new Date(now.getTime() + 30 * 24 * 3600 * 1000),
    lignes: [
      {
        description: `Abonnement Plan Professionnel — ${now.toLocaleDateString('fr-SN', { month: 'long', year: 'numeric' })}`,
        quantite:    1,
        prixUnitaire: 35000,
        tva:         18,
        montantHT:   35000,
        montantTVA:  6300,
        montantTTC:  41300,
      },
    ],
    totalHT:   35000,
    totalTVA:  6300,
    totalTTC:  41300,
    statut:    'PAYEE',
    datePaiement: now,
    metadata: { source: 'seed-demo' },
  });
  log(`Facture SaaS PAYEE créée : ${numero}`);
  return invoice;
}

// ── Point d'entrée ────────────────────────────────────────────────────────────

async function main() {
  log('Connexion à MongoDB…');
  await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 10000 });
  log('Connecté.');

  try {
    const adminRole = await upsertRole('admin', 'Administrateur');
    const plan      = await upsertPlan();
    const company   = await upsertCompany();
    const _admin    = await upsertAdmin(company, adminRole);
    const abo       = await upsertAbonnement(company, plan);
    const paiement  = await upsertPaiement(company, abo);
    await upsertInvoice(company, abo, paiement);

    console.log('\n✅  Seed démo terminé avec succès !');
    console.log('──────────────────────────────────────');
    console.log(`  Entreprise : ${COMPANY_NAME}`);
    console.log(`  Admin      : ${ADMIN_EMAIL}`);
    console.log(`  Mot de passe : ${ADMIN_PASSWORD}`);
    console.log('──────────────────────────────────────');
  } finally {
    await mongoose.disconnect();
    log('Déconnecté de MongoDB.');
  }
}

main().catch((err) => {
  console.error('[seed-demo] ERREUR :', err.message);
  process.exit(1);
});
