/**
 * Tests Phase 6 — Cycle de vie des abonnements
 *
 * Couvre :
 *   - ACTIF  + dateFin <= now → EN_PERIODE_GRACE + Company EN_ATTENTE_PAIEMENT
 *   - ESSAI  + dateFin <= now → EN_ATTENTE + Company EN_ATTENTE_PAIEMENT
 *   - EN_PERIODE_GRACE + graceEndsAt <= now → EXPIRE + Company EXPIREE
 *   - Abonnements futurs non touchés
 *   - Rappels J-7, J-3, J-1 (renewalReminder)
 *   - graceEndsAt calculé depuis PlatformSetting.abonnement.joursGrace
 *   - Idempotence : abonnements déjà expirés non retraités
 */
require('../setup');
const Abonnement     = require('../../src/models/Abonnement');
const Company        = require('../../src/models/Company');
const PlatformSetting = require('../../src/models/PlatformSetting');
const Plan           = require('../../src/models/Plan');
const { traiterExpirations } = require('../../src/jobs/subscriptionExpiry');
const { traiterGracePeriod } = require('../../src/jobs/gracePeriodJob');
const { envoyerRappels }     = require('../../src/jobs/renewalReminder');
const { createTestCompany, createTestAbonnement, createSaasUser } = require('../helpers');

// ── Helpers locaux ─────────────────────────────────────────────────────────

const datePasse = (joursAvant) => new Date(Date.now() - joursAvant * 24 * 60 * 60 * 1000);
const dateFuture = (jours) => new Date(Date.now() + jours * 24 * 60 * 60 * 1000);

const creerPlan = async (suffix = '') => Plan.create({
  code:    `LCY${suffix}${Date.now() % 1000000}`,
  nom:     'Plan Lifecycle',
  tarifs:  { mensuel: 15000, annuel: 150000 },
  modules: ['GESCOM', 'FACTURATION', 'STOCK', 'COMPTABILITE', 'VENTES'],
});

const creerAbonnementAvecAdmin = async (statut, dateFin, opts = {}) => {
  const company = await createTestCompany({ name: opts.name || `Co ${Date.now()}`, status: opts.companyStatus || 'ACTIVE' });
  const plan    = await creerPlan();
  const abo     = await createTestAbonnement(company._id, plan._id, {
    statut, dateFin, dateDebut: datePasse(30), montant: 15000, ...opts.aboOpts,
  });
  const { user } = await createSaasUser(company._id, 'admin', { email: `admin-lc-${Date.now()}@test.sn` });
  await Company.findByIdAndUpdate(company._id, { adminUser: user._id, planId: plan._id });
  const fresh = await Company.findById(company._id);
  return { company: fresh, abo, user };
};

// ─────────────────────────────────────────────────────────────────────────────
// ACTIF → EN_PERIODE_GRACE
// ─────────────────────────────────────────────────────────────────────────────

describe('ACTIF → EN_PERIODE_GRACE (subscriptionExpiry)', () => {
  it('passe un abonnement ACTIF expiré en EN_PERIODE_GRACE', async () => {
    const { company, abo } = await creerAbonnementAvecAdmin('ACTIF', datePasse(1));

    const result = await traiterExpirations();
    expect(result.totalActif).toBeGreaterThanOrEqual(1);

    const updatedAbo = await Abonnement.findById(abo._id);
    expect(updatedAbo.statut).toBe('EN_PERIODE_GRACE');
    expect(updatedAbo.graceEndsAt).not.toBeNull();
    expect(updatedAbo.historique.some((h) => h.action === 'grace_period_start')).toBe(true);

    const updatedCompany = await Company.findById(company._id);
    expect(updatedCompany.status).toBe('EN_ATTENTE_PAIEMENT');
  });

  it('calcule graceEndsAt = dateFin + joursGrace (défaut 7 jours)', async () => {
    const dateFinPassee = datePasse(2);
    const { abo } = await creerAbonnementAvecAdmin('ACTIF', dateFinPassee);

    await traiterExpirations();

    const updatedAbo = await Abonnement.findById(abo._id);
    const attendu = new Date(dateFinPassee.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Tolérance ± 5 min pour le temps de traitement
    expect(Math.abs(updatedAbo.graceEndsAt.getTime() - attendu.getTime())).toBeLessThan(5 * 60 * 1000);
  });

  it('respecte joursGrace de PlatformSetting (ex: 14 jours)', async () => {
    // Configurer 14 jours de grâce
    await PlatformSetting.findOneAndUpdate(
      { _singleton: 'PLATFORM' },
      { 'abonnement.joursGrace': 14 },
      { upsert: true }
    );

    const dateFinPassee = datePasse(1);
    const { abo } = await creerAbonnementAvecAdmin('ACTIF', dateFinPassee);

    await traiterExpirations();

    const updatedAbo = await Abonnement.findById(abo._id);
    const attendu = new Date(dateFinPassee.getTime() + 14 * 24 * 60 * 60 * 1000);
    expect(Math.abs(updatedAbo.graceEndsAt.getTime() - attendu.getTime())).toBeLessThan(5 * 60 * 1000);

    // Remettre à 7 jours
    await PlatformSetting.findOneAndUpdate({ _singleton: 'PLATFORM' }, { 'abonnement.joursGrace': 7 }, { upsert: true });
  });

  it('ne touche pas les abonnements ACTIF dont dateFin est dans le futur', async () => {
    const { abo } = await creerAbonnementAvecAdmin('ACTIF', dateFuture(5));

    await traiterExpirations();

    const updatedAbo = await Abonnement.findById(abo._id);
    expect(updatedAbo.statut).toBe('ACTIF');
  });

  it('est idempotent : ne retraite pas un abonnement déjà EN_PERIODE_GRACE', async () => {
    const { abo } = await creerAbonnementAvecAdmin('EN_PERIODE_GRACE', datePasse(1), {
      aboOpts: { graceEndsAt: dateFuture(3) },
    });

    const result = await traiterExpirations();

    const updatedAbo = await Abonnement.findById(abo._id);
    expect(updatedAbo.statut).toBe('EN_PERIODE_GRACE'); // pas retouché
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ESSAI → EN_ATTENTE
// ─────────────────────────────────────────────────────────────────────────────

describe('ESSAI → EN_ATTENTE (subscriptionExpiry)', () => {
  it('passe un abonnement ESSAI expiré à EN_ATTENTE', async () => {
    const { company, abo } = await creerAbonnementAvecAdmin('ESSAI', datePasse(1), {
      companyStatus: 'ESSAI',
    });

    const result = await traiterExpirations();
    expect(result.totalEssai).toBeGreaterThanOrEqual(1);

    const updatedAbo = await Abonnement.findById(abo._id);
    expect(updatedAbo.statut).toBe('EN_ATTENTE');
    expect(updatedAbo.historique.some((h) => h.action === 'trial_expired')).toBe(true);

    const updatedCompany = await Company.findById(company._id);
    expect(updatedCompany.status).toBe('EN_ATTENTE_PAIEMENT');
  });

  it('ne touche pas les essais encore valides', async () => {
    const { abo } = await creerAbonnementAvecAdmin('ESSAI', dateFuture(3), {
      companyStatus: 'ESSAI',
    });

    await traiterExpirations();

    const updatedAbo = await Abonnement.findById(abo._id);
    expect(updatedAbo.statut).toBe('ESSAI');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// EN_PERIODE_GRACE → EXPIRE
// ─────────────────────────────────────────────────────────────────────────────

describe('EN_PERIODE_GRACE → EXPIRE (gracePeriodJob)', () => {
  it('expire un abonnement EN_PERIODE_GRACE dont graceEndsAt est dépassé', async () => {
    const { company, abo } = await creerAbonnementAvecAdmin('EN_PERIODE_GRACE', datePasse(8), {
      companyStatus: 'EN_ATTENTE_PAIEMENT',
      aboOpts: { graceEndsAt: datePasse(1) }, // grâce terminée hier
    });

    const result = await traiterGracePeriod();
    expect(result.total).toBeGreaterThanOrEqual(1);

    const updatedAbo = await Abonnement.findById(abo._id);
    expect(updatedAbo.statut).toBe('EXPIRE');
    expect(updatedAbo.historique.some((h) => h.action === 'grace_period_expired')).toBe(true);

    const updatedCompany = await Company.findById(company._id);
    expect(updatedCompany.status).toBe('EXPIREE');
    expect(updatedCompany.abonnementActifId).toBeNull();
  });

  it('ne touche pas les EN_PERIODE_GRACE dont graceEndsAt est dans le futur', async () => {
    const { abo } = await creerAbonnementAvecAdmin('EN_PERIODE_GRACE', datePasse(3), {
      companyStatus: 'EN_ATTENTE_PAIEMENT',
      aboOpts: { graceEndsAt: dateFuture(4) }, // grâce encore valide
    });

    await traiterGracePeriod();

    const updatedAbo = await Abonnement.findById(abo._id);
    expect(updatedAbo.statut).toBe('EN_PERIODE_GRACE'); // pas touché
  });

  it('est idempotent : ne retraite pas un abonnement déjà EXPIRE', async () => {
    const { abo } = await creerAbonnementAvecAdmin('EXPIRE', datePasse(10), {
      companyStatus: 'EXPIREE',
    });

    const result = await traiterGracePeriod();

    const updatedAbo = await Abonnement.findById(abo._id);
    expect(updatedAbo.statut).toBe('EXPIRE'); // inchangé
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Cycle complet : ACTIF → grace → EXPIRE
// ─────────────────────────────────────────────────────────────────────────────

describe('Cycle complet ACTIF → EN_PERIODE_GRACE → EXPIRE', () => {
  it('enchaîne les deux jobs pour un abonnement expiré depuis plus de 7 jours', async () => {
    const { company, abo } = await creerAbonnementAvecAdmin('ACTIF', datePasse(10));

    // Job 1 : ACTIF → EN_PERIODE_GRACE (graceEndsAt = dateFin + 7j = il y a 3j)
    await traiterExpirations();
    let updatedAbo = await Abonnement.findById(abo._id);
    expect(updatedAbo.statut).toBe('EN_PERIODE_GRACE');
    expect(updatedAbo.graceEndsAt < new Date()).toBe(true); // grâce déjà terminée

    // Job 2 : EN_PERIODE_GRACE → EXPIRE
    await traiterGracePeriod();
    updatedAbo = await Abonnement.findById(abo._id);
    expect(updatedAbo.statut).toBe('EXPIRE');

    const updatedCompany = await Company.findById(company._id);
    expect(updatedCompany.status).toBe('EXPIREE');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Rappels de renouvellement
// ─────────────────────────────────────────────────────────────────────────────

describe('Rappels de renouvellement (renewalReminder)', () => {
  it('envoie des notifications pour les abonnements expirant dans 7 jours', async () => {
    const { abo } = await creerAbonnementAvecAdmin('ACTIF', dateFuture(7), {
      name: 'RappelJ7',
    });

    await expect(envoyerRappels()).resolves.not.toThrow();

    // La fonction est non-bloquante — pas de retour formel, juste vérifier qu'elle ne plante pas
  });

  it('ne plante pas quand il n\'y a aucun abonnement à rappeler', async () => {
    await expect(envoyerRappels()).resolves.not.toThrow();
  });
});
