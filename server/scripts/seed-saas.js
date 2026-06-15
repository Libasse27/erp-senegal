/**
 * Seed SaaS — Développement & Tests
 *
 * Insère/met à jour uniquement les données de la plateforme SaaS :
 *  - 3 Forfaits (STANDARD / PROFESSIONNEL / COMPLET)
 *  - 1 compte Super Admin (scope PLATFORM)
 *
 * Idempotent : si les données existent déjà, elles sont mises à jour.
 * NE touche PAS aux documents métier existants.
 *
 * Usage :
 *   node server/scripts/seed-saas.js
 *   SUPER_ADMIN_EMAIL=admin@test.com SUPER_ADMIN_PASSWORD=Test@1234 node server/scripts/seed-saas.js
 */

const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const mongoose = require('mongoose');

const User = require('../src/models/User');
const Role = require('../src/models/Role');
const Plan = require('../src/models/Plan');

const SUPER_ADMIN_EMAIL    = process.env.SUPER_ADMIN_EMAIL    || 'superadmin@erp-senegal.com';
const SUPER_ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin@2026!';

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/erp-gescom';
  await mongoose.connect(uri);
  console.log(`[DB] Connecté à : ${uri.replace(/\/\/.*@/, '//***:***@')}`);
};

const fmt = (n) => new Intl.NumberFormat('fr-FR').format(n);

const PLANS = [
  {
    code: 'STANDARD',
    nom: 'Standard',
    description: 'Idéal pour les TPE et petits commerces — jusqu\'à 3 utilisateurs',
    tarifs: { mensuel: 15000, annuel: 150000, devise: 'XOF' },
    modules: ['GESCOM', 'FACTURATION', 'STOCK'],
    limites: { maxUtilisateurs: 3, maxFacturesMois: 100, maxStockageMo: 1024 },
    features: { supportPrioritaire: false, apiAccess: false, multiEtablissement: false },
    essaiGratuitJours: 14,
    actif: true, visible: true, ordreAffichage: 1,
  },
  {
    code: 'PROFESSIONNEL',
    nom: 'Professionnel',
    description: 'Pour les PME en croissance — comptabilité SYSCOHADA incluse',
    tarifs: { mensuel: 35000, annuel: 350000, devise: 'XOF' },
    modules: ['GESCOM', 'FACTURATION', 'STOCK', 'COMPTABILITE', 'REPORTING'],
    limites: { maxUtilisateurs: 10, maxFacturesMois: 1000, maxStockageMo: 5120 },
    features: { supportPrioritaire: false, apiAccess: false, multiEtablissement: false },
    essaiGratuitJours: 14,
    actif: true, visible: true, ordreAffichage: 2,
  },
  {
    code: 'COMPLET',
    nom: 'Complet',
    description: 'Solution tout-en-un — utilisateurs illimités, accès API, support prioritaire',
    tarifs: { mensuel: 75000, annuel: 750000, devise: 'XOF' },
    modules: ['GESCOM', 'FACTURATION', 'STOCK', 'COMPTABILITE', 'REPORTING', 'PAIE', 'API'],
    limites: { maxUtilisateurs: -1, maxFacturesMois: -1, maxStockageMo: 20480 },
    features: { supportPrioritaire: true, apiAccess: true, multiEtablissement: false },
    essaiGratuitJours: 14,
    actif: true, visible: true, ordreAffichage: 3,
  },
];

const seed = async () => {
  try {
    await connectDB();
    console.log('\n╔══════════════════════════════════════════════╗');
    console.log('║        Seed SaaS — ERP Sénégal               ║');
    console.log('╚══════════════════════════════════════════════╝\n');

    // ── Plans ─────────────────────────────────────────────────────────────────
    console.log('▶ Plans SaaS...');
    for (const p of PLANS) {
      await Plan.findOneAndUpdate(
        { code: p.code },
        { $set: p },
        { upsert: true, new: true, runValidators: true }
      );
      const remise = Math.round(((p.tarifs.mensuel * 12 - p.tarifs.annuel) / (p.tarifs.mensuel * 12)) * 100);
      console.log(`  ✅ ${p.code.padEnd(14)} ${fmt(p.tarifs.mensuel).padStart(8)} FCFA/mois | ${fmt(p.tarifs.annuel).padStart(10)} FCFA/an (-${remise}%)`);
    }

    // ── Super Admin ───────────────────────────────────────────────────────────
    console.log('\n▶ Compte Super Admin...');
    const saRole = await Role.findOne({ name: { $in: ['super_admin', 'SUPER_ADMIN'] } });
    if (!saRole) {
      console.log('  ⚠️  Rôle super_admin introuvable en base.');
      console.log('     Lancez d\'abord le seed principal : npm run seed');
      console.log('     Puis relancez : npm run seed:saas');
    } else {
      const existing = await User.findOne({ email: SUPER_ADMIN_EMAIL }).setOptions({ includeDeleted: true });
      if (!existing) {
        await User.create({
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
        console.log(`  ✅ Super Admin créé : ${SUPER_ADMIN_EMAIL}`);
        console.log(`  🔑 Mot de passe    : ${SUPER_ADMIN_PASSWORD}`);
        console.log('  ⚠️  Changez le mot de passe après la première connexion !');
      } else {
        let changed = false;
        if (existing.scope !== 'PLATFORM')  { existing.scope = 'PLATFORM'; changed = true; }
        if (existing.companyId !== null)     { existing.companyId = null;   changed = true; }
        if (!existing.isActive)              { existing.isActive = true;    changed = true; }
        if (changed) {
          await existing.save();
          console.log(`  ✅ Super Admin mis à jour : ${SUPER_ADMIN_EMAIL}`);
        } else {
          console.log(`  ✅ Super Admin déjà présent : ${SUPER_ADMIN_EMAIL}`);
        }
      }
    }

    // ── Résumé ────────────────────────────────────────────────────────────────
    console.log('\n╔══════════════════════════════════════════════╗');
    console.log('║         Seed SaaS terminé avec succès        ║');
    console.log('╚══════════════════════════════════════════════╝');
    console.log('\n  Plans disponibles :');
    PLANS.forEach((p) => {
      const users = p.limites.maxUtilisateurs === -1 ? 'illimité' : `max ${p.limites.maxUtilisateurs}`;
      console.log(`    ${p.nom.padEnd(16)} ${fmt(p.tarifs.mensuel)} FCFA/mois | ${users} utilisateurs`);
    });
    console.log(`\n  Super Admin : ${SUPER_ADMIN_EMAIL}`);
    console.log('  URL         : /login → redirection automatique vers /super-admin\n');

    process.exit(0);
  } catch (err) {
    console.error('\n[ERREUR]', err.message);
    console.error(err);
    process.exit(1);
  }
};

seed();
