const mongoose = require('mongoose');
const EcritureComptable = require('../../src/models/EcritureComptable');
const CompteComptable = require('../../src/models/CompteComptable');
const ExerciceComptable = require('../../src/models/ExerciceComptable');
const User = require('../../src/models/User');
const Role = require('../../src/models/Role');

describe('EcritureComptable Model', () => {
  let testUser;
  let exercice;
  let compte411;
  let compte701;

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
      lastName: 'Comptable',
      email: 'ecriture-test@test.com',
      password: 'password123',
      phone: '221771234567',
      role: role._id,
    });

    exercice = await ExerciceComptable.create({
      code: 'EX2026',
      libelle: 'Exercice 2026',
      dateDebut: new Date('2026-01-01'),
      dateFin: new Date('2026-12-31'),
      statut: 'ouvert',
      createdBy: testUser._id,
    });

    compte411 = await CompteComptable.create({
      numero: '411000',
      libelle: 'Clients',
      classe: 4,
      type: 'detail',
      isImputable: true,
      createdBy: testUser._id,
    });

    compte701 = await CompteComptable.create({
      numero: '701000',
      libelle: 'Ventes de marchandises',
      classe: 7,
      type: 'detail',
      isImputable: true,
      createdBy: testUser._id,
    });
  });

  const validEcritureData = () => ({
    journal: 'VE',
    dateEcriture: new Date('2026-01-15'),
    libelle: 'Facture test',
    exercice: exercice._id,
    lignes: [
      {
        compte: compte411._id,
        compteNumero: '411000',
        compteLibelle: 'Clients',
        libelle: 'Client - Facture',
        debit: 118000,
        credit: 0,
      },
      {
        compte: compte701._id,
        compteNumero: '701000',
        compteLibelle: 'Ventes de marchandises',
        libelle: 'Ventes',
        debit: 0,
        credit: 118000,
      },
    ],
    createdBy: testUser._id,
  });

  it('should create a valid ecriture with 2 lines', async () => {
    const ecriture = await EcritureComptable.create(validEcritureData());

    expect(ecriture).toBeDefined();
    expect(ecriture.journal).toBe('VE');
    expect(ecriture.lignes).toHaveLength(2);
    expect(ecriture.statut).toBe('brouillon');
  });

  it('should auto-calculate totalDebit and totalCredit', async () => {
    const ecriture = await EcritureComptable.create(validEcritureData());

    expect(ecriture.totalDebit).toBe(118000);
    expect(ecriture.totalCredit).toBe(118000);
  });

  it('should have isEquilibree virtual true when balanced', async () => {
    const ecriture = await EcritureComptable.create(validEcritureData());
    expect(ecriture.isEquilibree).toBe(true);
  });

  it('should reject line with both debit AND credit > 0', async () => {
    const data = validEcritureData();
    data.lignes[0].debit = 100000;
    data.lignes[0].credit = 50000;

    await expect(EcritureComptable.create(data)).rejects.toThrow();
  });

  it('should reject line with debit=0 AND credit=0', async () => {
    const data = validEcritureData();
    data.lignes[0].debit = 0;
    data.lignes[0].credit = 0;

    await expect(EcritureComptable.create(data)).rejects.toThrow();
  });

  it('should require at least 2 lines', async () => {
    const data = validEcritureData();
    data.lignes = [data.lignes[0]];

    await expect(EcritureComptable.create(data)).rejects.toThrow();
  });

  it('should validate via valider() method', async () => {
    const ecriture = await EcritureComptable.create(validEcritureData());

    const validated = await ecriture.valider(testUser._id);
    expect(validated.statut).toBe('validee');
    expect(validated.validatedBy.toString()).toBe(testUser._id.toString());
    expect(validated.validatedAt).toBeDefined();
  });

  it('should reject valider() if already validated', async () => {
    const ecriture = await EcritureComptable.create(validEcritureData());
    await ecriture.valider(testUser._id);

    await expect(ecriture.valider(testUser._id)).rejects.toThrow(
      'Cette ecriture est deja validee'
    );
  });

  it('should reject valider() if not balanced', async () => {
    const data = validEcritureData();
    // Create unbalanced entry by manipulating after creation
    const ecriture = await EcritureComptable.create(data);
    // Manually set unbalanced totals
    ecriture.totalDebit = 118000;
    ecriture.totalCredit = 100000;

    await expect(ecriture.valider(testUser._id)).rejects.toThrow(
      "L'ecriture n'est pas equilibree"
    );
  });

  it('should reject softDelete for validated entries', async () => {
    const ecriture = await EcritureComptable.create(validEcritureData());
    await ecriture.valider(testUser._id);

    await expect(ecriture.softDelete(testUser._id)).rejects.toThrow(
      'Une ecriture validee ne peut pas etre supprimee'
    );
  });

  it('should allow softDelete for brouillon entries', async () => {
    const ecriture = await EcritureComptable.create(validEcritureData());
    await ecriture.softDelete(testUser._id);

    expect(ecriture.isActive).toBe(false);
  });

  it('should auto-generate numero', async () => {
    const ecriture = await EcritureComptable.create(validEcritureData());
    expect(ecriture.numero).toBeDefined();
    expect(ecriture.numero).toMatch(/^VE-/);
  });
});
