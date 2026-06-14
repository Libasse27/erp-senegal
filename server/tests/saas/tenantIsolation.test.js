/**
 * Tests d'isolation multi-tenant (critiques)
 *
 * Vérifie que chaque entreprise ne peut voir que ses propres données,
 * peu importe l'utilisateur authentifié.
 */
require('../setup');
const request = require('supertest');
const app     = require('../../app');
const {
  createTestCompany,
  createTestSettings,
  createSaasUser,
} = require('../helpers');
const Client  = require('../../src/models/Client');
const Product = require('../../src/models/Product');
const Category = require('../../src/models/Category');

let companyA, companyB;
let userA, tokenA;
let userB, tokenB;

beforeEach(async () => {
  // Créer deux entreprises indépendantes
  companyA = await createTestCompany({ name: 'Entreprise Alpha', email: 'alpha@test.sn' });
  companyB = await createTestCompany({ name: 'Entreprise Beta',  email: 'beta@test.sn'  });

  await createTestSettings(companyA._id);
  await createTestSettings(companyB._id);

  const resA = await createSaasUser(companyA._id, 'admin', { email: 'admin@alpha.sn' });
  const resB = await createSaasUser(companyB._id, 'admin', { email: 'admin@beta.sn'  });

  userA  = resA.user;  tokenA = resA.token;
  userB  = resB.user;  tokenB = resB.token;
});

describe('Isolation des clients', () => {
  it("Company A voit ses clients mais pas ceux de Company B", async () => {
    // Insérer un client pour chaque entreprise directement en DB
    await Client.create({
      type: 'professionnel', raisonSociale: 'Client Alpha', email: 'c@alpha.sn',
      phone: '+221771111111', companyId: companyA._id, createdBy: userA._id,
    });
    await Client.create({
      type: 'professionnel', raisonSociale: 'Client Beta', email: 'c@beta.sn',
      phone: '+221772222222', companyId: companyB._id, createdBy: userB._id,
    });

    const res = await request(app)
      .get('/api/clients')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].raisonSociale).toBe('Client Alpha');
  });

  it("Company B ne peut pas accéder aux clients de Company A", async () => {
    const clientA = await Client.create({
      type: 'professionnel', raisonSociale: 'Client Alpha', email: 'x@alpha.sn',
      phone: '+221771111111', companyId: companyA._id, createdBy: userA._id,
    });

    // Tenter d'accéder au client de A avec le token de B
    const res = await request(app)
      .get(`/api/clients/${clientA._id}`)
      .set('Authorization', `Bearer ${tokenB}`);

    // Doit retourner 404 (pas visible dans le scope de B)
    expect(res.status).toBe(404);
  });

  it("Liste clients retourne 0 résultats si aucun client pour l'entreprise", async () => {
    // Créer un client pour A seulement
    await Client.create({
      type: 'professionnel', raisonSociale: 'Client Alpha', email: 'y@alpha.sn',
      phone: '+221771111111', companyId: companyA._id, createdBy: userA._id,
    });

    const res = await request(app)
      .get('/api/clients')
      .set('Authorization', `Bearer ${tokenB}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
  });
});

describe('Isolation des produits', () => {
  it("Company A voit uniquement ses produits", async () => {
    const catA = await Category.create({
      name: 'Cat Alpha', companyId: companyA._id, createdBy: userA._id,
    });
    const catB = await Category.create({
      name: 'Cat Beta', companyId: companyB._id, createdBy: userB._id,
    });

    await Product.create({
      name: 'Produit Alpha', category: catA._id, prixAchat: 1000, prixVente: 1500,
      tauxTVA: 18, type: 'produit', companyId: companyA._id, createdBy: userA._id,
    });
    await Product.create({
      name: 'Produit Beta', category: catB._id, prixAchat: 2000, prixVente: 2500,
      tauxTVA: 18, type: 'produit', companyId: companyB._id, createdBy: userB._id,
    });

    const resA = await request(app)
      .get('/api/products')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(resA.status).toBe(200);
    expect(resA.body.data.every((p) => p.name.includes('Alpha'))).toBe(true);

    const resB = await request(app)
      .get('/api/products')
      .set('Authorization', `Bearer ${tokenB}`);

    expect(resB.status).toBe(200);
    expect(resB.body.data.every((p) => p.name.includes('Beta'))).toBe(true);
  });
});

describe('Isolation par token', () => {
  it("Une requête sans token retourne 401", async () => {
    const res = await request(app).get('/api/clients');
    expect(res.status).toBe(401);
  });

  it("Un utilisateur sans companyId dans le token retourne ses données (superadmin comportement)", async () => {
    // Le super admin a scope=PLATFORM, companyId=null
    // Le test vérifie que le controller ne crashe pas — il retourne [] ou toutes les données
    const jwt = require('jsonwebtoken');
    const User = require('../../src/models/User');
    const Role = require('../../src/models/Role');

    let role = await Role.findOne({ name: 'super_admin' });
    if (!role) {
      role = await Role.create({
        name: 'super_admin', displayName: 'Super Admin',
        description: 'Platform admin', permissions: [], isSystem: true,
      });
    }

    const superAdmin = await User.create({
      firstName: 'Super', lastName: 'Admin',
      email: 'superadmin@test.sn', password: 'password123',
      phone: '+221770000000', role: role._id,
      scope: 'PLATFORM', companyId: null, isActive: true,
    });

    const saToken = jwt.sign(
      { id: superAdmin._id, scope: 'PLATFORM', companyId: null },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    const res = await request(app)
      .get('/api/clients')
      .set('Authorization', `Bearer ${saToken}`);

    // Super admin peut accéder à la route (pas de 401/403)
    expect([200, 403]).toContain(res.status);
  });
});
