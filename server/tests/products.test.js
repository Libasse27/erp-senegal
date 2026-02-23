const request = require('supertest');
const app = require('../app');
const Product = require('../src/models/Product');
const Category = require('../src/models/Category');
const { createTestUser, createTestCategory, createTestProduct } = require('./helpers');

describe('Product & Category Routes', () => {
  let authToken;
  let testUser;
  let testCategory;

  beforeAll(async () => {
    const result = await createTestUser('admin', [
      'products:create',
      'products:read',
      'products:update',
      'products:delete',
    ]);
    authToken = result.token;
    testUser = result.user;
    testCategory = await createTestCategory(testUser._id);
  });

  describe('POST /api/categories', () => {
    it('should create a category', async () => {
      const res = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Electronics',
          description: 'Electronic devices and gadgets',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('name', 'Electronics');
      expect(res.body.data).toHaveProperty('slug'); // Auto-generated
    });
  });

  describe('GET /api/categories', () => {
    it('should get all categories', async () => {
      const res = await request(app)
        .get('/api/categories')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('POST /api/products', () => {
    it('should create a product', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Laptop Dell XPS 13',
          category: testCategory._id,
          prixAchat: 500000,
          prixVente: 750000,
          tauxTVA: 18,
          type: 'produit',
          description: 'High-performance laptop',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('name', 'Laptop Dell XPS 13');
      expect(res.body.data).toHaveProperty('prixVente', 750000);
      expect(res.body.data).toHaveProperty('code'); // Auto-generated
    });

    it('should reject creation without required fields', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Incomplete Product',
        });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/products', () => {
    beforeEach(async () => {
      // Create test products
      await createTestProduct(testUser._id, testCategory._id, {
        name: 'Product A',
        prixVente: 10000,
      });
      await createTestProduct(testUser._id, testCategory._id, {
        name: 'Product B',
        prixVente: 20000,
      });
      await createTestProduct(testUser._id, testCategory._id, {
        name: 'Product C',
        prixVente: 30000,
      });
    });

    it('should get all products (paginated)', async () => {
      const res = await request(app)
        .get('/api/products')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body).toHaveProperty('meta');
    });

    it('should filter by category', async () => {
      const res = await request(app)
        .get(`/api/products?category=${testCategory._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(
        res.body.data.every((p) => p.category._id.toString() === testCategory._id.toString())
      ).toBe(true);
    });

    it('should search products by designation', async () => {
      const res = await request(app)
        .get('/api/products?search=Product A')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/products/:id', () => {
    it('should get a single product', async () => {
      const product = await createTestProduct(testUser._id, testCategory._id);

      const res = await request(app)
        .get(`/api/products/${product._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('_id', product._id.toString());
    });

    it('should return 404 for non-existent product', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const res = await request(app)
        .get(`/api/products/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/products/:id', () => {
    it('should update a product', async () => {
      const product = await createTestProduct(testUser._id, testCategory._id, {
        name: 'Old Name',
        prixVente: 10000,
      });

      const res = await request(app)
        .put(`/api/products/${product._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'New Name',
          prixVente: 15000,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('name', 'New Name');
      expect(res.body.data).toHaveProperty('prixVente', 15000);
    });
  });

  describe('DELETE /api/products/:id', () => {
    it('should delete a product', async () => {
      const product = await createTestProduct(testUser._id, testCategory._id);

      const res = await request(app)
        .delete(`/api/products/${product._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify soft delete
      const deletedProduct = await Product.findById(product._id);
      expect(deletedProduct).toBeNull();
    });
  });
});
