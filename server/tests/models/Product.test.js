const Product = require('../../src/models/Product');
const Category = require('../../src/models/Category');
const User = require('../../src/models/User');
const Role = require('../../src/models/Role');

describe('Product Model', () => {
  let testUser;
  let testCategory;

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
      email: 'product-test@test.com',
      password: 'password123',
      phone: '221771234567',
      role: role._id,
    });

    testCategory = await Category.create({
      name: 'Electronique',
      createdBy: testUser._id,
    });
  });

  const validProductData = () => ({
    name: `Product-${Date.now()}`,
    category: testCategory._id,
    prixAchat: 5000,
    prixVente: 8000,
    tauxTVA: 18,
    type: 'produit',
    createdBy: testUser._id,
  });

  it('should create a product with valid data', async () => {
    const product = await Product.create(validProductData());

    expect(product).toBeDefined();
    expect(product.name).toBeDefined();
    expect(product.prixAchat).toBe(5000);
    expect(product.prixVente).toBe(8000);
    expect(product.tauxTVA).toBe(18);
  });

  it('should auto-generate code', async () => {
    const product = await Product.create(validProductData());
    expect(product.code).toMatch(/^PRD-\d{5}$/);
  });

  it('should calculate margeBrute virtual', async () => {
    const product = await Product.create(validProductData());
    expect(product.margeBrute).toBe(3000); // 8000 - 5000
  });

  it('should calculate tauxMarge virtual', async () => {
    const product = await Product.create(validProductData());
    expect(product.tauxMarge).toBe(60); // (3000/5000) * 100
  });

  it('should set tauxTVA to 0 when isExonere', async () => {
    const product = await Product.create({
      ...validProductData(),
      isExonere: true,
      tauxTVA: 18,
    });

    expect(product.tauxTVA).toBe(0);
    expect(product.isExonere).toBe(true);
  });

  it('should reject without name', async () => {
    const data = validProductData();
    delete data.name;
    await expect(Product.create(data)).rejects.toThrow();
  });

  it('should reject without category', async () => {
    const data = validProductData();
    delete data.category;
    await expect(Product.create(data)).rejects.toThrow();
  });

  it('should reject without prixAchat', async () => {
    const data = validProductData();
    delete data.prixAchat;
    await expect(Product.create(data)).rejects.toThrow();
  });

  it('should reject without prixVente', async () => {
    const data = validProductData();
    delete data.prixVente;
    await expect(Product.create(data)).rejects.toThrow();
  });

  it('should soft delete', async () => {
    const product = await Product.create(validProductData());
    await product.softDelete(testUser._id);

    expect(product.isActive).toBe(false);
    expect(product.deletedAt).toBeDefined();
    expect(product.deletedBy.toString()).toBe(testUser._id.toString());
  });

  it('should filter soft-deleted products', async () => {
    const product = await Product.create(validProductData());
    const id = product._id;
    await product.softDelete(testUser._id);

    const found = await Product.findById(id);
    expect(found).toBeNull();
  });

  it('should default stockMinimum to 5', async () => {
    const product = await Product.create(validProductData());
    expect(product.stockMinimum).toBe(5);
  });

  it('should default type to produit', async () => {
    const product = await Product.create(validProductData());
    expect(product.type).toBe('produit');
  });
});
