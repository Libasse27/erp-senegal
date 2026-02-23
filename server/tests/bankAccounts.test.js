const request = require('supertest');
const app = require('../app');
const Permission = require('../src/models/Permission');
const { createTestUser, createTestBankAccount } = require('./helpers');

describe('BankAccount Routes', () => {
  let authToken;
  let testUser;

  beforeAll(async () => {
    const extraModules = ['comptes_bancaires'];
    const actions = ['create', 'read', 'update', 'delete', 'export'];
    for (const mod of extraModules) {
      for (const action of actions) {
        await Permission.create({
          module: mod,
          action,
          code: `${mod}:${action}`,
          description: `Permission to ${action} ${mod}`,
        });
      }
    }
    const result = await createTestUser('admin');
    authToken = result.token;
    testUser = result.user;
  });

  describe('POST /api/bank-accounts', () => {
    it('should create a bank account', async () => {
      const res = await request(app)
        .post('/api/bank-accounts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          nom: 'Compte Courant CBAO',
          banque: 'CBAO',
          numeroCompte: 'SN012345678901',
          type: 'courant',
          soldeInitial: 5000000,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('nom', 'Compte Courant CBAO');
      expect(res.body.data).toHaveProperty('banque', 'CBAO');
    });

    it('should reject without required fields', async () => {
      const res = await request(app)
        .post('/api/bank-accounts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ nom: 'Incomplet' });

      expect(res.status).toBe(400);
    });

    it('should reject unauthorized access', async () => {
      const res = await request(app)
        .post('/api/bank-accounts')
        .send({ nom: 'Test', banque: 'Test', numeroCompte: 'TEST123' });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/bank-accounts', () => {
    beforeEach(async () => {
      await createTestBankAccount(testUser._id, { nom: 'Compte A', numeroCompte: `A-${Date.now()}` });
      await createTestBankAccount(testUser._id, { nom: 'Compte B', numeroCompte: `B-${Date.now()}` });
    });

    it('should list all bank accounts', async () => {
      const res = await request(app)
        .get('/api/bank-accounts')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('GET /api/bank-accounts/:id', () => {
    it('should get a single bank account', async () => {
      const ba = await createTestBankAccount(testUser._id, { numeroCompte: `GET-${Date.now()}` });
      const res = await request(app)
        .get(`/api/bank-accounts/${ba._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data._id).toBe(ba._id.toString());
    });

    it('should return 404 for non-existent', async () => {
      const res = await request(app)
        .get('/api/bank-accounts/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/bank-accounts/:id', () => {
    it('should update a bank account', async () => {
      const ba = await createTestBankAccount(testUser._id, { numeroCompte: `UPD-${Date.now()}` });
      const res = await request(app)
        .put(`/api/bank-accounts/${ba._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ nom: 'Compte Modifie' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.nom).toBe('Compte Modifie');
    });
  });

  describe('DELETE /api/bank-accounts/:id', () => {
    it('should soft-delete a bank account', async () => {
      const ba = await createTestBankAccount(testUser._id, { numeroCompte: `DEL-${Date.now()}` });
      const res = await request(app)
        .delete(`/api/bank-accounts/${ba._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
