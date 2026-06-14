/**
 * Tests d'intégration — Paiements SaaS
 *
 * Couvre : initier un paiement, webhook, confirmation simulation, statut.
 * Utilise Wave en mode simulation (WAVE_SIMULATION=true par défaut).
 */
require('../setup');
const request = require('supertest');
const app     = require('../../app');
const {
  createTestCompany,
  createTestSettings,
  createTestForfait,
  createTestAbonnement,
  createSaasUser,
} = require('../helpers');
const PaiementSaaS = require('../../src/models/PaiementSaaS');
const Abonnement   = require('../../src/models/Abonnement');
const Company      = require('../../src/models/Company');

let company, forfait, abonnement;
let adminUser, adminToken;

beforeEach(async () => {
  company = await createTestCompany({ name: 'Acme SaaS', status: 'pending_payment' });
  await createTestSettings(company._id);

  forfait    = await createTestForfait({ code: 'STANDARD_T', nom: 'Standard Test' });
  abonnement = await createTestAbonnement(company._id, forfait._id, {
    montant: 15000, statut: 'EN_ATTENTE',
    dateDebut: new Date(),
    dateFin:   new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });

  // Mettre à jour l'entreprise avec l'abonnement
  await Company.findByIdAndUpdate(company._id, {
    forfaitId: forfait._id,
    abonnementActifId: null,
  });

  const res = await createSaasUser(company._id, 'admin', { email: 'acme-admin@test.sn' });
  adminUser  = res.user;
  adminToken = res.token;
});

// ── POST /api/paiements-saas/initier ────────────────────────────────────────

describe('POST /api/paiements-saas/initier', () => {
  it('crée un paiement EN_ATTENTE et retourne une checkoutUrl', async () => {
    const res = await request(app)
      .post('/api/paiements-saas/initier')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ abonnementId: abonnement._id, methode: 'WAVE' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('reference');
    expect(res.body.data).toHaveProperty('checkoutUrl');
    expect(res.body.data).toHaveProperty('transactionId');
    expect(res.body.data.montant).toBe(15000);
    expect(res.body.data.methode).toBe('WAVE');

    // Vérifier en DB
    const paiement = await PaiementSaaS.findOne({ reference: res.body.data.reference });
    expect(paiement).not.toBeNull();
    expect(paiement.statut).toBe('EN_ATTENTE');
    expect(paiement.entrepriseId.toString()).toBe(company._id.toString());
  });

  it('retourne 400 si abonnementId manquant', async () => {
    const res = await request(app)
      .post('/api/paiements-saas/initier')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ methode: 'WAVE' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('retourne 400 si methode invalide', async () => {
    const res = await request(app)
      .post('/api/paiements-saas/initier')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ abonnementId: abonnement._id, methode: 'PAYPAL' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('retourne 401 sans token', async () => {
    const res = await request(app)
      .post('/api/paiements-saas/initier')
      .send({ abonnementId: abonnement._id, methode: 'WAVE' });

    expect(res.status).toBe(401);
  });

  it('retourne 404 si abonnementId ne correspond pas à la company', async () => {
    const autreCompany = await createTestCompany({ name: 'Autre', email: 'autre@test.sn' });
    const autreAbo = await createTestAbonnement(autreCompany._id, forfait._id, {
      montant: 15000, statut: 'EN_ATTENTE',
    });

    const res = await request(app)
      .post('/api/paiements-saas/initier')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ abonnementId: autreAbo._id, methode: 'WAVE' });

    expect(res.status).toBe(404);
  });

  it("retourne 409 si l'abonnement est déjà ACTIF", async () => {
    await Abonnement.findByIdAndUpdate(abonnement._id, { statut: 'ACTIF' });

    const res = await request(app)
      .post('/api/paiements-saas/initier')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ abonnementId: abonnement._id, methode: 'WAVE' });

    expect(res.status).toBe(409);
  });
});

// ── POST /api/paiements-saas/confirmer-simulation ───────────────────────────

describe('POST /api/paiements-saas/confirmer-simulation', () => {
  it("active l'abonnement et met company.status='active'", async () => {
    // Initier le paiement d'abord
    const initRes = await request(app)
      .post('/api/paiements-saas/initier')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ abonnementId: abonnement._id, methode: 'WAVE' });

    expect(initRes.status).toBe(201);
    const { reference } = initRes.body.data;

    // Confirmer la simulation
    const confRes = await request(app)
      .post('/api/paiements-saas/confirmer-simulation')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reference, statut: 'REUSSI' });

    expect(confRes.status).toBe(200);
    expect(confRes.body.success).toBe(true);

    // Vérifier la chaîne d'activation en DB
    const paiement = await PaiementSaaS.findOne({ reference });
    expect(paiement.statut).toBe('REUSSI');

    const abo = await Abonnement.findById(abonnement._id);
    expect(abo.statut).toBe('ACTIF');
    expect(abo.paiementId.toString()).toBe(paiement._id.toString());

    const updatedCompany = await Company.findById(company._id);
    expect(updatedCompany.status).toBe('active');
    expect(updatedCompany.abonnementActifId.toString()).toBe(abo._id.toString());
  });

  it("retourne 404 si la référence est inconnue", async () => {
    const res = await request(app)
      .post('/api/paiements-saas/confirmer-simulation')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reference: 'SAA-INCONNU-XXXX', statut: 'REUSSI' });

    expect(res.status).toBe(404);
  });
});

// ── GET /api/paiements-saas/statut/:ref ─────────────────────────────────────

describe('GET /api/paiements-saas/statut/:ref', () => {
  it("retourne le statut d'un paiement existant", async () => {
    const initRes = await request(app)
      .post('/api/paiements-saas/initier')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ abonnementId: abonnement._id, methode: 'WAVE' });

    const { reference } = initRes.body.data;

    const res = await request(app)
      .get(`/api/paiements-saas/statut/${reference}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.reference).toBe(reference);
    expect(res.body.data.statut).toBe('EN_ATTENTE');
  });

  it("retourne 404 pour une référence inconnue", async () => {
    const res = await request(app)
      .get('/api/paiements-saas/statut/SAA-00000000-DEAD')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
  });
});

// ── POST /api/paiements-saas/webhook/wave ────────────────────────────────────

describe('POST /api/paiements-saas/webhook/wave (simulation)', () => {
  it("traite un webhook 'completed' et active l'abonnement", async () => {
    // Initier le paiement
    const initRes = await request(app)
      .post('/api/paiements-saas/initier')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ abonnementId: abonnement._id, methode: 'WAVE' });

    const { transactionId, reference } = initRes.body.data;

    // Simuler le webhook Wave
    const webhookBody = {
      id:             transactionId,
      payment_status: 'completed',
      client_reference: reference,
    };

    const res = await request(app)
      .post('/api/paiements-saas/webhook/wave')
      .send(webhookBody);

    expect(res.status).toBe(200);
    expect(res.body.received).toBe(true);

    // Attendre le traitement asynchrone (le webhook répond avant de traiter)
    await new Promise((r) => setTimeout(r, 100));

    const paiement = await PaiementSaaS.findOne({ reference });
    expect(paiement.statut).toBe('REUSSI');
  });

  it("est idempotent — rejette les webhooks dupliqués", async () => {
    const initRes = await request(app)
      .post('/api/paiements-saas/initier')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ abonnementId: abonnement._id, methode: 'WAVE' });

    const { transactionId } = initRes.body.data;
    const webhookBody = { id: transactionId, payment_status: 'completed' };

    // Premier webhook
    const res1 = await request(app)
      .post('/api/paiements-saas/webhook/wave')
      .send(webhookBody);
    expect(res1.status).toBe(200);

    await new Promise((r) => setTimeout(r, 100));

    // Deuxième webhook identique — doit retourner deja_traite
    const res2 = await request(app)
      .post('/api/paiements-saas/webhook/wave')
      .send(webhookBody);
    expect(res2.status).toBe(200);
    expect(res2.body.info).toBe('deja_traite');
  });

  it("retourne 200 même pour un provider inconnu (jamais de 500 sur webhook)", async () => {
    const res = await request(app)
      .post('/api/paiements-saas/webhook/unknown_psp')
      .send({ id: 'xyz', status: 'paid' });

    expect(res.status).toBe(200);
  });
});
