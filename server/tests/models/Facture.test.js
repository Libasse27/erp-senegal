const mongoose = require('mongoose');
const Facture = require('../../src/models/Facture');
const User = require('../../src/models/User');
const Client = require('../../src/models/Client');
const Product = require('../../src/models/Product');
const Category = require('../../src/models/Category');
const Role = require('../../src/models/Role');

describe('Facture Model', () => {
  let testUser;
  let testClient;
  let testProduct;

  beforeAll(async () => {
    const role = await Role.create({
      name: 'admin',
      displayName: 'Admin',
      description: 'Admin role',
      permissions: [],
      isSystem: true,
    });

    testUser = await User.create({
      firstName: 'Test',
      lastName: 'User',
      email: 'model@test.com',
      password: 'password123',
      phone: '221771234567',
      role: role._id,
    });

    testClient = await Client.create({
      type: 'professionnel',
      raisonSociale: 'Client Test',
      email: 'client-model@test.com',
      phone: '221771234568',
      segment: 'B',
      createdBy: testUser._id,
    });

    const category = await Category.create({
      name: 'Cat Test',
      createdBy: testUser._id,
    });

    testProduct = await Product.create({
      name: 'Produit Test',
      category: category._id,
      prixAchat: 5000,
      prixVente: 8000,
      tauxTVA: 18,
      createdBy: testUser._id,
    });
  });

  const validFactureData = () => ({
    client: testClient._id,
    lignes: [
      {
        product: testProduct._id,
        designation: 'Produit Test',
        quantite: 10,
        prixUnitaire: 8000,
        tauxTVA: 18,
      },
    ],
    createdBy: testUser._id,
  });

  it('should create a facture with valid data', async () => {
    const facture = await Facture.create(validFactureData());

    expect(facture).toBeDefined();
    expect(facture.statut).toBe('brouillon');
    expect(facture.referenceInterne).toBeDefined();
  });

  it('should auto-calculate line amounts', async () => {
    const facture = await Facture.create(validFactureData());

    const ligne = facture.lignes[0];
    expect(ligne.montantHT).toBe(80000); // 10 * 8000
    expect(ligne.montantTVA).toBe(14400); // 80000 * 18%
    expect(ligne.montantTTC).toBe(94400); // 80000 + 14400
  });

  it('should auto-calculate totals', async () => {
    const facture = await Facture.create(validFactureData());

    expect(facture.totalHT).toBe(80000);
    expect(facture.totalTVA).toBe(14400);
    expect(facture.totalTTC).toBe(94400);
  });

  it('should apply remiseGlobale to totals', async () => {
    const facture = await Facture.create({
      ...validFactureData(),
      remiseGlobale: 10,
    });

    expect(facture.totalHT).toBe(72000); // 80000 * 0.9
    expect(facture.totalTVA).toBe(12960); // 14400 * 0.9
    expect(facture.totalTTC).toBe(84960);
  });

  it('should calculate montantRestant virtual', async () => {
    const facture = await Facture.create({
      ...validFactureData(),
      montantPaye: 50000,
    });

    expect(facture.montantRestant).toBe(facture.totalTTC - 50000);
  });

  it('should calculate tauxRecouvrement virtual', async () => {
    const facture = await Facture.create({
      ...validFactureData(),
      montantPaye: 47200,
    });

    // 47200 / 94400 * 100 = 50%
    expect(facture.tauxRecouvrement).toBe(50);
  });

  it('should only softDelete brouillon factures', async () => {
    const facture = await Facture.create(validFactureData());
    await facture.softDelete(testUser._id);
    expect(facture.isActive).toBe(false);
  });

  it('should reject softDelete for non-brouillon', async () => {
    const facture = await Facture.create({
      ...validFactureData(),
      statut: 'validee',
      numero: `FA-TEST-${Date.now()}`,
    });

    await expect(facture.softDelete(testUser._id)).rejects.toThrow(
      'Seules les factures en brouillon peuvent etre supprimees'
    );
  });

  it('should auto-generate referenceInterne', async () => {
    const facture = await Facture.create(validFactureData());
    expect(facture.referenceInterne).toMatch(/^TMP-FA-\d{5}$/);
  });

  it('should reject without client', async () => {
    await expect(
      Facture.create({
        lignes: [
          {
            product: testProduct._id,
            designation: 'Test',
            quantite: 1,
            prixUnitaire: 1000,
          },
        ],
        createdBy: testUser._id,
      })
    ).rejects.toThrow();
  });

  it('should reject without lignes', async () => {
    await expect(
      Facture.create({
        client: testClient._id,
        lignes: [],
        createdBy: testUser._id,
      })
    ).rejects.toThrow();
  });

  it('should handle multiple lines correctly', async () => {
    const facture = await Facture.create({
      client: testClient._id,
      lignes: [
        {
          product: testProduct._id,
          designation: 'Produit A',
          quantite: 5,
          prixUnitaire: 10000,
          tauxTVA: 18,
        },
        {
          product: testProduct._id,
          designation: 'Produit B',
          quantite: 3,
          prixUnitaire: 5000,
          tauxTVA: 0,
        },
      ],
      createdBy: testUser._id,
    });

    expect(facture.lignes).toHaveLength(2);
    expect(facture.totalHT).toBe(65000); // 50000 + 15000
    expect(facture.totalTVA).toBe(9000); // 9000 + 0
    expect(facture.totalTTC).toBe(74000);
  });
});
