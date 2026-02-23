const request = require('supertest');
const app = require('../app');
const CompteComptable = require('../src/models/CompteComptable');
const EcritureComptable = require('../src/models/EcritureComptable');
const ExerciceComptable = require('../src/models/ExerciceComptable');
const { createTestUser } = require('./helpers');

describe('Comptabilite Routes', () => {
  let authToken;
  let testUser;
  let testExercice;
  let compte411;
  let compte701;
  let compte57;

  beforeAll(async () => {
    const result = await createTestUser('admin', [
      'comptabilite:create',
      'comptabilite:read',
      'comptabilite:update',
      'comptabilite:delete',
      'ecritures:create',
      'ecritures:read',
      'ecritures:update',
      'ecritures:delete',
      'ecritures:validate',
    ]);
    authToken = result.token;
    testUser = result.user;

    // Create an exercice
    testExercice = await ExerciceComptable.create({
      libelle: '2024',
      dateDebut: new Date('2024-01-01'),
      dateFin: new Date('2024-12-31'),
      statut: 'ouvert',
      createdBy: testUser._id,
    });

    // Create test accounts
    compte411 = await CompteComptable.create({
      numero: '411',
      libelle: 'Clients',
      classe: 4,
      type: 'debit',
      createdBy: testUser._id,
    });

    compte701 = await CompteComptable.create({
      numero: '701',
      libelle: 'Ventes de marchandises',
      classe: 7,
      type: 'credit',
      createdBy: testUser._id,
    });

    compte57 = await CompteComptable.create({
      numero: '57',
      libelle: 'Caisse',
      classe: 5,
      type: 'debit',
      createdBy: testUser._id,
    });
  });

  describe('GET /api/comptabilite/plan', () => {
    it('should get plan comptable', async () => {
      const res = await request(app)
        .get('/api/comptabilite/plan')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('POST /api/comptabilite/plan', () => {
    it('should create a compte comptable', async () => {
      const res = await request(app)
        .post('/api/comptabilite/plan')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          numero: '401',
          libelle: 'Fournisseurs',
          classe: 4,
          type: 'credit',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('numero', '401');
      expect(res.body.data).toHaveProperty('libelle', 'Fournisseurs');
    });
  });

  describe('POST /api/comptabilite/ecritures', () => {
    it('should create an ecriture (with balanced lines)', async () => {
      const res = await request(app)
        .post('/api/comptabilite/ecritures')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          journal: 'VE',
          dateEcriture: new Date().toISOString(),
          libelle: 'Vente facture FA-001',
          exercice: testExercice._id,
          lignes: [
            {
              compte: compte411._id,
              compteNumero: compte411.numero,
              libelle: 'Client ABC',
              debit: 11800,
              credit: 0,
            },
            {
              compte: compte701._id,
              compteNumero: compte701.numero,
              libelle: 'Vente marchandises',
              debit: 0,
              credit: 10000,
            },
            {
              compte: compte57._id,
              compteNumero: '4431',
              compteLibelle: 'TVA facturee',
              libelle: 'TVA 18%',
              debit: 0,
              credit: 1800,
            },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('journal', 'VE');
      expect(res.body.data.lignes).toHaveLength(3);
      expect(res.body.data).toHaveProperty('totalDebit', 11800);
      expect(res.body.data).toHaveProperty('totalCredit', 11800);
    });

    it('should reject unbalanced ecriture', async () => {
      const res = await request(app)
        .post('/api/comptabilite/ecritures')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          journal: 'OD',
          dateEcriture: new Date().toISOString(),
          libelle: 'Ecriture non equilibree',
          exercice: testExercice._id,
          lignes: [
            {
              compte: compte411._id,
              compteNumero: compte411.numero,
              libelle: 'Debit',
              debit: 10000,
              credit: 0,
            },
            {
              compte: compte701._id,
              compteNumero: compte701.numero,
              libelle: 'Credit',
              debit: 0,
              credit: 5000, // Not balanced!
            },
          ],
        });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/comptabilite/ecritures/:id/validate', () => {
    it('should validate an ecriture', async () => {
      const ecriture = await EcritureComptable.create({
        journal: 'VE',
        dateEcriture: new Date(),
        libelle: 'Test ecriture',
        exercice: testExercice._id,
        lignes: [
          {
            compte: compte411._id,
            compteNumero: compte411.numero,
            libelle: 'Debit',
            debit: 5000,
            credit: 0,
          },
          {
            compte: compte701._id,
            compteNumero: compte701.numero,
            libelle: 'Credit',
            debit: 0,
            credit: 5000,
          },
        ],
        statut: 'brouillon',
        createdBy: testUser._id,
      });

      const res = await request(app)
        .post(`/api/comptabilite/ecritures/${ecriture._id}/validate`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('statut', 'validee');
    });
  });

  describe('POST /api/comptabilite/ecritures/:id/contrepasser', () => {
    it('should contrepasser an ecriture', async () => {
      const ecriture = await EcritureComptable.create({
        journal: 'VE',
        dateEcriture: new Date(),
        libelle: 'Ecriture a contrepasser',
        exercice: testExercice._id,
        lignes: [
          {
            compte: compte411._id,
            compteNumero: compte411.numero,
            libelle: 'Debit',
            debit: 3000,
            credit: 0,
          },
          {
            compte: compte701._id,
            compteNumero: compte701.numero,
            libelle: 'Credit',
            debit: 0,
            credit: 3000,
          },
        ],
        statut: 'validee',
        createdBy: testUser._id,
      });

      const res = await request(app)
        .post(`/api/comptabilite/ecritures/${ecriture._id}/contrepasser`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('isContrepassation', true);
      expect(res.body.data).toHaveProperty('ecritureOrigine');
    });
  });

  describe('GET /api/comptabilite/grand-livre', () => {
    it('should get grand livre', async () => {
      const res = await request(app)
        .get('/api/comptabilite/grand-livre')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ exercice: testExercice._id });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/comptabilite/balance', () => {
    it('should get balance', async () => {
      const res = await request(app)
        .get('/api/comptabilite/balance')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ exercice: testExercice._id });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
