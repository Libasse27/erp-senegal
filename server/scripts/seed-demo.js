/**
 * Seed Démo — Entreprise de démonstration
 *
 * Crée (ou met à jour) :
 *  - 1 entreprise de démo : Ndakaru SARL
 *  - 1 compte admin : admin@ndakaru.sn
 *  - 1 abonnement PROFESSIONNEL actif (30 jours)
 *
 * Prérequis :
 *   npm run seed       ← roles, permissions, forfaits de base
 *   npm run seed:saas  ← forfaits SaaS + super_admin
 *
 * Usage :
 *   node server/scripts/seed-demo.js
 *   DEMO_ADMIN_EMAIL=custom@test.com node server/scripts/seed-demo.js
 */

const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const mongoose = require('mongoose');

const Company     = require('../src/models/Company');
const User        = require('../src/models/User');
const Role        = require('../src/models/Role');
const Forfait     = require('../src/models/Forfait');
const Abonnement  = require('../src/models/Abonnement');

const DEMO_EMAIL    = process.env.DEMO_ADMIN_EMAIL    || 'admin@ndakaru.sn';
const DEMO_PASSWORD = process.env.DEMO_ADMIN_PASSWORD || 'Admin@Demo2026!';
const COMPANY_NAME  = 'Ndakaru SARL';
const FORFAIT_CODE  = 'PROFESSIONNEL';

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/erp-gescom';
  await mongoose.connect(uri);
  console.log(`[DB] Connecté à : ${uri.replace(/\/\/.*@/, '//***:***@')}`);
};

const fmt = (n) => new Intl.NumberFormat('fr-FR').format(n);

const seed = async () => {
  try {
    await connectDB();

    console.log('\n╔══════════════════════════════════════════════╗');
    console.log('║      Seed Démo — Ndakaru SARL                ║');
    console.log('╚══════════════════════════════════════════════╝\n');

    // ── Vérifier que le forfait existe ────────────────────────────────────────
    const forfait = await Forfait.findOne({ code: FORFAIT_CODE });
    if (!forfait) {
      console.error(`❌ Forfait "${FORFAIT_CODE}" introuvable.`);
      console.error('   Lancez d\'abord : npm run seed:saas');
      process.exit(1);
    }
    console.log(`✅ Forfait trouvé : ${forfait.nom} (${fmt(forfait.prixMensuel)} FCFA/mois)`);

    // ── Rôle admin ────────────────────────────────────────────────────────────
    const adminRole = await Role.findOne({ name: 'admin' });
    if (!adminRole) {
      console.error('❌ Rôle "admin" introuvable. Lancez d\'abord : npm run seed');
      process.exit(1);
    }

    // ── Entreprise de démo ────────────────────────────────────────────────────
    let company = await Company.findOne({ name: COMPANY_NAME });
    if (!company) {
      company = await Company.create({
        name: COMPANY_NAME,
        legalForm: 'SARL',
        ninea: 'SN-DEMO-001',
        rccm: 'SN-DKR-2026-DEMO-001',
        address: { street: '12 Avenue Cheikh Anta Diop', city: 'Dakar', country: 'Senegal' },
        phone: '+221 33 821 00 00',
        email: 'contact@ndakaru.sn',
        website: 'www.ndakaru.sn',
        sector: 'Commerce général',
        employeeCount: 8,
        currency: 'XOF',
        forfaitId: forfait._id,
        plan: FORFAIT_CODE,
        status: 'active',
        fiscalInfo: { tvaRate: 18, isSubjectToTVA: true, fiscalRegime: 'reel_normal' },
      });
      console.log(`✅ Entreprise créée : ${company.name} (${company._id})`);
    } else {
      console.log(`✅ Entreprise existante : ${company.name} (${company._id})`);
    }

    // ── Compte admin de démo ──────────────────────────────────────────────────
    let adminUser = await User.findOne({ email: DEMO_EMAIL });
    if (!adminUser) {
      adminUser = await User.create({
        firstName: 'Abdou',
        lastName: 'Diallo',
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
        phone: '+221 77 123 4567',
        role: adminRole._id,
        companyId: company._id,
        scope: 'COMPANY',
        isActive: true,
      });
      console.log(`✅ Admin créé : ${DEMO_EMAIL}`);
      console.log(`🔑 Mot de passe : ${DEMO_PASSWORD}`);

      // Lier l'admin à l'entreprise
      await Company.findByIdAndUpdate(company._id, { adminUser: adminUser._id });
    } else {
      console.log(`✅ Admin existant : ${DEMO_EMAIL}`);
    }

    // ── Abonnement PROFESSIONNEL actif (30 jours) ─────────────────────────────
    let abonnement = await Abonnement.findOne({
      entrepriseId: company._id,
      statut: 'ACTIF',
    });

    if (!abonnement) {
      const debut = new Date();
      const fin   = new Date();
      fin.setDate(fin.getDate() + 30);

      abonnement = await Abonnement.create({
        entrepriseId: company._id,
        forfaitId: forfait._id,
        periodicite: 'MENSUEL',
        dateDebut: debut,
        dateFin: fin,
        montant: forfait.prixMensuel,
        statut: 'ACTIF',
        autoRenouvellement: false,
      });

      // Mettre à jour Company avec l'abonnement actif
      await Company.findByIdAndUpdate(company._id, {
        abonnementActifId: abonnement._id,
        status: 'active',
        subscriptionEndDate: fin,
      });

      const finStr = fin.toLocaleDateString('fr-SN', { day: '2-digit', month: 'long', year: 'numeric' });
      console.log(`✅ Abonnement ${FORFAIT_CODE} créé — actif jusqu'au ${finStr}`);
    } else {
      console.log(`✅ Abonnement ACTIF existant — expire le ${abonnement.dateFin?.toLocaleDateString('fr-SN')}`);
    }

    // ── Résumé ─────────────────────────────────────────────────────────────────
    console.log('\n╔══════════════════════════════════════════════╗');
    console.log('║     Seed Démo terminé avec succès            ║');
    console.log('╚══════════════════════════════════════════════╝\n');
    console.log('  Connexion de démonstration :');
    console.log(`  Email      : ${DEMO_EMAIL}`);
    console.log(`  Mot de passe: ${DEMO_PASSWORD}`);
    console.log(`  Entreprise : ${COMPANY_NAME}`);
    console.log(`  Forfait    : ${forfait.nom} (${fmt(forfait.prixMensuel)} FCFA/mois)`);
    console.log(`  Modules    : ${forfait.modulesInclus.join(', ')}`);
    console.log(`  URL        : http://localhost:3000/login\n`);

    process.exit(0);
  } catch (err) {
    console.error('\n[ERREUR]', err.message);
    console.error(err);
    process.exit(1);
  }
};

seed();
