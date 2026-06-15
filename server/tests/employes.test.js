const request = require('supertest');
const app = require('../app');
const Employe = require('../src/models/Employe');
const ExerciceComptable = require('../src/models/ExerciceComptable');
const { createTestUser, createTestEmploye } = require('./helpers');

const PERMS = ['employes:create', 'employes:read', 'employes:update', 'employes:delete'];

describe('Employes Routes — /api/rh/employes', () => {
  let authToken;
  let testUser;

  beforeEach(async () => {
    const result = await createTestUser('admin', PERMS);
    authToken = result.token;
    testUser  = result.user;
  });

  // ── POST ─────────────────────────────────────────────────────────────────────
  describe('POST /api/rh/employes', () => {
    it('crée un employé et génère un matricule EMP-YYYY-NNNN', async () => {
      const res = await request(app)
        .post('/api/rh/employes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          nom: 'Sow', prenom: 'Fatou',
          poste: 'Comptable', departement: 'Finance',
          dateEmbauche: '2025-03-01',
          typeContrat: 'CDI',
          salaireBrut: 400000,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('matricule');
      expect(res.body.data.matricule).toMatch(/^EMP-\d{4}-\d{4}$/);
      expect(res.body.data.nom).toBe('Sow');
    });

    it('calcule le salaire net automatiquement (brut - IPRES - IR)', async () => {
      const res = await request(app)
        .post('/api/rh/employes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          nom: 'Ndiaye', prenom: 'Ibrahima',
          poste: 'Développeur', departement: 'IT',
          dateEmbauche: '2025-01-01',
          typeContrat: 'CDI',
          salaireBrut: 500000,
          tauxIPRES: 5.6,
          tauxIR: 0,
        });

      expect(res.status).toBe(201);
      // salaireNet = 500000 * (1 - 0.056) = 472000
      expect(res.body.data.salaireNet).toBe(472000);
    });

    it('rejette la création sans nom (400)', async () => {
      const res = await request(app)
        .post('/api/rh/employes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ prenom: 'Test', poste: 'RH', departement: 'RH', typeContrat: 'CDI', salaireBrut: 200000, dateEmbauche: '2025-01-01' });

      expect(res.status).toBe(400);
    });

    it('rejette sans token (401)', async () => {
      const res = await request(app)
        .post('/api/rh/employes')
        .send({ nom: 'Test', prenom: 'Test', poste: 'X', departement: 'Y', typeContrat: 'CDI', salaireBrut: 100000, dateEmbauche: '2025-01-01' });

      expect(res.status).toBe(401);
    });
  });

  // ── GET stats ─────────────────────────────────────────────────────────────────
  describe('GET /api/rh/employes/stats', () => {
    it('retourne les KPIs RH (effectif, masse salariale)', async () => {
      await createTestEmploye(testUser._id, { salaireBrut: 300000 });
      await createTestEmploye(testUser._id, { salaireBrut: 400000, nom: 'Fall' });

      const res = await request(app)
        .get('/api/rh/employes/stats')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('totalEmployes');
      expect(res.body.data.totalEmployes).toBe(2);
    });
  });

  // ── GET liste ─────────────────────────────────────────────────────────────────
  describe('GET /api/rh/employes', () => {
    beforeEach(async () => {
      await createTestEmploye(testUser._id, { nom: 'Diallo', departement: 'Finance' });
      await createTestEmploye(testUser._id, { nom: 'Gaye',   departement: 'IT' });
    });

    it('retourne la liste paginée (200)', async () => {
      const res = await request(app)
        .get('/api/rh/employes')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBe(2);
    });

    it('filtre par département', async () => {
      const res = await request(app)
        .get('/api/rh/employes?departement=IT')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.every((e) => e.departement === 'IT')).toBe(true);
    });

    it('isole les données par entreprise (multi-tenant)', async () => {
      const { token: otherToken } = await createTestUser('admin', PERMS);
      await createTestEmploye(testUser._id, { nom: 'Diop' });

      const res = await request(app)
        .get('/api/rh/employes')
        .set('Authorization', `Bearer ${otherToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(0);
    });
  });

  // ── GET :id ───────────────────────────────────────────────────────────────────
  describe('GET /api/rh/employes/:id', () => {
    it('retourne le détail d\'un employé (200)', async () => {
      const employe = await createTestEmploye(testUser._id);

      const res = await request(app)
        .get(`/api/rh/employes/${employe._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data._id).toBe(employe._id.toString());
    });

    it('retourne 404 pour un id inexistant', async () => {
      const res = await request(app)
        .get('/api/rh/employes/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(404);
    });
  });

  // ── PUT :id ───────────────────────────────────────────────────────────────────
  describe('PUT /api/rh/employes/:id', () => {
    it('met à jour le poste d\'un employé (200)', async () => {
      const employe = await createTestEmploye(testUser._id, { poste: 'Junior' });

      const res = await request(app)
        .put(`/api/rh/employes/${employe._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ poste: 'Senior' });

      expect(res.status).toBe(200);
      expect(res.body.data.poste).toBe('Senior');
    });

    it('retourne 404 pour un id inexistant', async () => {
      const res = await request(app)
        .put('/api/rh/employes/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ poste: 'Senior' });

      expect(res.status).toBe(404);
    });
  });

  // ── DELETE :id ────────────────────────────────────────────────────────────────
  describe('DELETE /api/rh/employes/:id', () => {
    it('désactive l\'employé (soft delete — statut = inactif)', async () => {
      const employe = await createTestEmploye(testUser._id);

      const res = await request(app)
        .delete(`/api/rh/employes/${employe._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const updated = await Employe.findById(employe._id);
      expect(updated.statut).toBe('inactif');
    });
  });

  // ── GET :id/bulletin ──────────────────────────────────────────────────────────
  describe('GET /api/rh/employes/:id/bulletin', () => {
    it('retourne les données du bulletin de paie (200)', async () => {
      const employe = await createTestEmploye(testUser._id, { salaireBrut: 350000 });

      const res = await request(app)
        .get(`/api/rh/employes/${employe._id}/bulletin?mois=6&annee=2026`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('salaireBrut');
      expect(res.body.data).toHaveProperty('salaireNet');
    });
  });

  // ── POST :id/ecritures-paie ───────────────────────────────────────────────────
  describe('POST /api/rh/employes/:id/ecritures-paie', () => {
    it('génère les écritures SYSCOHADA (D.661/C.421/C.431/C.447)', async () => {
      // Un exercice ouvert est requis par le controller
      await ExerciceComptable.create({
        companyId: testUser.companyId,
        annee: 2026,
        code: 'EX-2026',
        libelle: 'Exercice 2026',
        dateDebut: new Date('2026-01-01'),
        dateFin:   new Date('2026-12-31'),
        statut: 'ouvert',
        createdBy: testUser._id,
      });

      const employe = await createTestEmploye(testUser._id, { salaireBrut: 300000, tauxIPRES: 5.6, tauxIR: 0 });

      const res = await request(app)
        .post(`/api/rh/employes/${employe._id}/ecritures-paie`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ mois: 6, annee: 2026 });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      // L'écriture est un document unique avec un tableau de lignes
      expect(res.body.data).toHaveProperty('lignes');
      expect(res.body.data.lignes.length).toBeGreaterThanOrEqual(2);
      // D.661 Rémunérations et C.421 Rémunérations dues doivent être présentes
      const comptes = res.body.data.lignes.map((l) => l.compteNumero);
      expect(comptes).toContain('6611');
      expect(comptes).toContain('4211');
    });

    it('retourne 400 si aucun exercice comptable ouvert', async () => {
      const employe = await createTestEmploye(testUser._id);

      const res = await request(app)
        .post(`/api/rh/employes/${employe._id}/ecritures-paie`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ mois: 6, annee: 2026 });

      expect(res.status).toBe(400);
    });
  });
});
