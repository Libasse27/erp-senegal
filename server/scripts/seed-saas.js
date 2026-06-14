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

const User    = require('../src/models/User');
const Role    = require('../src/models/Role');
const Forfait = require('../src/models/Forfait');

const SUPER_ADMIN_EMAIL    = process.env.SUPER_ADMIN_EMAIL    || 'superadmin@erp-senegal.com';
const SUPER_ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin@2026!';

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/erp-gescom';
  await mongoose.connect(uri);
  console.log(`[DB] Connecté à : ${uri.replace(/\/\/.*@/, '//***:***@')}`);
};

const fmt = (n) => new Intl.NumberFormat('fr-FR').format(n);

const FORFAITS = [
  {
    code: 'STANDARD',
    nom: 'Standard',
    description: 'Idéal pour les TPE et petits commerces — jusqu\'à 3 utilisateurs',
    prixMensuel: 15000,
    prixAnnuel: 150000,
    modulesInclus: ['GESCOM', 'FACTURATION', 'STOCK'],
    limites: {
      maxUtilisateurs: 3,
      maxFacturesMois: 100,
      stockageMo: 1024,
      supportPrioritaire: false,
    },
    actif: true,
    ordre: 1,
  },
  {
    code: 'PROFESSIONNEL',
    nom: 'Professionnel',
    description: 'Pour les PME en croissance — comptabilité SYSCOHADA incluse',
    prixMensuel: 35000,
    prixAnnuel: 350000,
    modulesInclus: ['GESCOM', 'FACTURATION', 'STOCK', 'COMPTABILITE', 'REPORTING'],
    limites: {
      maxUtilisateurs: 10,
      maxFacturesMois: 1000,
      stockageMo: 5120,
      supportPrioritaire: false,
    },
    actif: true,
    ordre: 2,
  },
  {
    code: 'COMPLET',
    nom: 'Complet',
    description: 'Solution tout-en-un — utilisateurs illimités, accès API, support prioritaire',
    prixMensuel: 75000,
    prixAnnuel: 750000,
    modulesInclus: ['GESCOM', 'FACTURATION', 'STOCK', 'COMPTABILITE', 'REPORTING', 'PAIE', 'API'],
    limites: {
      maxUtilisateurs: -1,
      maxFacturesMois: -1,
      stockageMo: 20480,
      supportPrioritaire: true,
    },
    actif: true,
    ordre: 3,
  },
];

const seed = async () => {
  try {
    await connectDB();
    console.log('\n╔══════════════════════════════════════════════╗');
    console.log('║        Seed SaaS — ERP Sénégal               ║');
    console.log('╚══════════════════════════════════════════════╝\n');

    // ── Forfaits ──────────────────────────────────────────────────────────────
    console.log('▶ Forfaits SaaS...');
    for (const f of FORFAITS) {
      const result = await Forfait.findOneAndUpdate(
        { code: f.code },
        { $set: f },
        { upsert: true, new: true, runValidators: true }
      );
      const remise = Math.round(((f.prixMensuel * 12 - f.prixAnnuel) / (f.prixMensuel * 12)) * 100);
      console.log(`  ✅ ${f.code.padEnd(14)} ${fmt(f.prixMensuel).padStart(8)} FCFA/mois | ${fmt(f.prixAnnuel).padStart(10)} FCFA/an (-${remise}%)`);
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
    console.log('\n  Forfaits disponibles :');
    FORFAITS.forEach((f) => {
      const users = f.limites.maxUtilisateurs === -1 ? 'illimité' : `max ${f.limites.maxUtilisateurs}`;
      console.log(`    ${f.nom.padEnd(16)} ${fmt(f.prixMensuel)} FCFA/mois | ${users} utilisateurs`);
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
