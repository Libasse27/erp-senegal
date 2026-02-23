const comptabiliteService = require('../../src/services/comptabiliteService');
const CompteComptable = require('../../src/models/CompteComptable');
const ExerciceComptable = require('../../src/models/ExerciceComptable');
const EcritureComptable = require('../../src/models/EcritureComptable');
const User = require('../../src/models/User');
const Role = require('../../src/models/Role');

describe('comptabiliteService', () => {
  let testUser;
  let testRole;
  let openExercice;
  let comptes = {};

  beforeEach(async () => {
    // Create test role
    testRole = await Role.create({
      name: 'admin',
      displayName: 'Administrateur',
    });

    // Create test user
    testUser = await User.create({
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      password: 'password123',
      role: testRole._id,
    });

    // Create open exercice
    openExercice = await ExerciceComptable.create({
      code: 'EX2025',
      libelle: 'Exercice 2025',
      dateDebut: new Date('2025-01-01'),
      dateFin: new Date('2025-12-31'),
      statut: 'ouvert',
      isCurrent: true,
      createdBy: testUser._id,
    });

    // Create required CompteComptable records
    const compteDefinitions = [
      { numero: '411000', libelle: 'Clients', classe: 4, type: 'debit', isImputable: true },
      { numero: '701000', libelle: 'Ventes de marchandises', classe: 7, type: 'credit', isImputable: true },
      { numero: '443100', libelle: 'TVA facturee', classe: 4, type: 'credit', isImputable: true },
      { numero: '521000', libelle: 'Banques', classe: 5, type: 'debit', isImputable: true },
      { numero: '571000', libelle: 'Caisse', classe: 5, type: 'debit', isImputable: true },
      { numero: '401000', libelle: 'Fournisseurs', classe: 4, type: 'credit', isImputable: true },
      { numero: '521100', libelle: 'Banque Mobile Money', classe: 5, type: 'debit', isImputable: true },
    ];

    for (const def of compteDefinitions) {
      const compte = await CompteComptable.create({
        ...def,
        createdBy: testUser._id,
      });
      comptes[def.numero] = compte;
    }
  });

  describe('getPaymentAccounts', () => {
    it('should return CA journal and 571000 for especes', () => {
      const payment = { modePaiement: 'especes' };
      const result = comptabiliteService.getPaymentAccounts(payment);
      expect(result).toEqual({ journal: 'CA', compteDebit: '571000' });
    });

    it('should return BQ journal and 521000 for cheque', () => {
      const payment = { modePaiement: 'cheque' };
      const result = comptabiliteService.getPaymentAccounts(payment);
      expect(result).toEqual({ journal: 'BQ', compteDebit: '521000' });
    });

    it('should return BQ journal and 521000 for virement', () => {
      const payment = { modePaiement: 'virement' };
      const result = comptabiliteService.getPaymentAccounts(payment);
      expect(result).toEqual({ journal: 'BQ', compteDebit: '521000' });
    });

    it('should return BQ journal and 521100 for orange_money', () => {
      const payment = { modePaiement: 'orange_money' };
      const result = comptabiliteService.getPaymentAccounts(payment);
      expect(result).toEqual({ journal: 'BQ', compteDebit: '521100' });
    });

    it('should return BQ journal and 521100 for wave', () => {
      const payment = { modePaiement: 'wave' };
      const result = comptabiliteService.getPaymentAccounts(payment);
      expect(result).toEqual({ journal: 'BQ', compteDebit: '521100' });
    });

    it('should return default BQ journal and 521000 for unknown mode', () => {
      const payment = { modePaiement: 'unknown_mode' };
      const result = comptabiliteService.getPaymentAccounts(payment);
      expect(result).toEqual({ journal: 'BQ', compteDebit: '521000' });
    });
  });

  describe('generateEcritureFromFacture', () => {
    it('should create accounting entry for normal facture', async () => {
      const mockFacture = {
        _id: 'facture123',
        typeDocument: 'facture',
        numero: 'FA-2025-0001',
        dateFacture: new Date('2025-02-15'),
        totalHT: 100000,
        totalTVA: 18000,
        totalTTC: 118000,
        clientSnapshot: {
          displayName: 'Client Test',
        },
      };

      const ecriture = await comptabiliteService.generateEcritureFromFacture(
        mockFacture,
        testUser._id.toString()
      );

      expect(ecriture).toBeDefined();
      expect(ecriture.journal).toBe('VE');
      expect(ecriture.lignes).toHaveLength(3);
      expect(ecriture.statut).toBe('validee');
      expect(ecriture.sourceDocument.type).toBe('facture');

      // Verify debit 411000 = totalTTC
      const ligne411 = ecriture.lignes.find((l) => l.compteNumero === '411000');
      expect(ligne411).toBeDefined();
      expect(ligne411.debit).toBe(118000);
      expect(ligne411.credit).toBe(0);

      // Verify credit 701000 = totalHT
      const ligne701 = ecriture.lignes.find((l) => l.compteNumero === '701000');
      expect(ligne701).toBeDefined();
      expect(ligne701.debit).toBe(0);
      expect(ligne701.credit).toBe(100000);

      // Verify credit 443100 = totalTVA
      const ligne443 = ecriture.lignes.find((l) => l.compteNumero === '443100');
      expect(ligne443).toBeDefined();
      expect(ligne443.debit).toBe(0);
      expect(ligne443.credit).toBe(18000);
    });

    it('should create balanced entry', async () => {
      const mockFacture = {
        _id: 'facture124',
        typeDocument: 'facture',
        numero: 'FA-2025-0002',
        dateFacture: new Date('2025-02-15'),
        totalHT: 50000,
        totalTVA: 9000,
        totalTTC: 59000,
        clientSnapshot: {
          displayName: 'Client Test 2',
        },
      };

      const ecriture = await comptabiliteService.generateEcritureFromFacture(
        mockFacture,
        testUser._id.toString()
      );

      expect(ecriture.totalDebit).toBe(ecriture.totalCredit);
      expect(ecriture.isEquilibree).toBe(true);
      expect(ecriture.totalDebit).toBe(59000);
    });

    it('should create reversed entries for avoir', async () => {
      const mockAvoir = {
        _id: 'avoir123',
        typeDocument: 'avoir',
        numero: 'AV-2025-0001',
        dateFacture: new Date('2025-02-15'),
        totalHT: 30000,
        totalTVA: 5400,
        totalTTC: 35400,
        clientSnapshot: {
          displayName: 'Client Test',
        },
      };

      const ecriture = await comptabiliteService.generateEcritureFromFacture(
        mockAvoir,
        testUser._id.toString()
      );

      expect(ecriture.journal).toBe('VE');

      // For avoir: credit 411000 (reversed)
      const ligne411 = ecriture.lignes.find((l) => l.compteNumero === '411000');
      expect(ligne411.debit).toBe(0);
      expect(ligne411.credit).toBe(35400);

      // For avoir: debit 701000 (reversed)
      const ligne701 = ecriture.lignes.find((l) => l.compteNumero === '701000');
      expect(ligne701.debit).toBe(30000);
      expect(ligne701.credit).toBe(0);

      expect(ecriture.isEquilibree).toBe(true);
    });

    it('should skip TVA line if totalTVA is 0', async () => {
      const mockFacture = {
        _id: 'facture125',
        typeDocument: 'facture',
        numero: 'FA-2025-0003',
        dateFacture: new Date('2025-02-15'),
        totalHT: 50000,
        totalTVA: 0,
        totalTTC: 50000,
        clientSnapshot: {
          displayName: 'Client Exonere',
        },
      };

      const ecriture = await comptabiliteService.generateEcritureFromFacture(
        mockFacture,
        testUser._id.toString()
      );

      expect(ecriture.lignes).toHaveLength(2);
      expect(ecriture.lignes.find((l) => l.compteNumero === '443100')).toBeUndefined();
      expect(ecriture.isEquilibree).toBe(true);
    });
  });

  describe('generateEcritureFromPaymentClient', () => {
    it('should create entry for cash payment', async () => {
      const mockPayment = {
        _id: 'payment123',
        numero: 'PAY-2025-0001',
        datePaiement: new Date('2025-02-20'),
        montant: 50000,
        modePaiement: 'especes',
        tiersSnapshot: {
          displayName: 'Client ABC',
        },
      };

      const ecriture = await comptabiliteService.generateEcritureFromPaymentClient(
        mockPayment,
        testUser._id.toString()
      );

      expect(ecriture.journal).toBe('CA');
      expect(ecriture.lignes).toHaveLength(2);

      // Debit Caisse (571000)
      const ligneCaisse = ecriture.lignes.find((l) => l.compteNumero === '571000');
      expect(ligneCaisse).toBeDefined();
      expect(ligneCaisse.debit).toBe(50000);
      expect(ligneCaisse.credit).toBe(0);

      // Credit Client (411000)
      const ligneClient = ecriture.lignes.find((l) => l.compteNumero === '411000');
      expect(ligneClient).toBeDefined();
      expect(ligneClient.debit).toBe(0);
      expect(ligneClient.credit).toBe(50000);

      expect(ecriture.isEquilibree).toBe(true);
    });

    it('should create entry for bank payment', async () => {
      const mockPayment = {
        _id: 'payment124',
        numero: 'PAY-2025-0002',
        datePaiement: new Date('2025-02-20'),
        montant: 100000,
        modePaiement: 'virement',
        tiersSnapshot: {
          displayName: 'Client XYZ',
        },
      };

      const ecriture = await comptabiliteService.generateEcritureFromPaymentClient(
        mockPayment,
        testUser._id.toString()
      );

      expect(ecriture.journal).toBe('BQ');

      // Debit Banque (521000)
      const ligneBanque = ecriture.lignes.find((l) => l.compteNumero === '521000');
      expect(ligneBanque).toBeDefined();
      expect(ligneBanque.debit).toBe(100000);
    });

    it('should create entry for mobile money payment', async () => {
      const mockPayment = {
        _id: 'payment125',
        numero: 'PAY-2025-0003',
        datePaiement: new Date('2025-02-20'),
        montant: 75000,
        modePaiement: 'orange_money',
        tiersSnapshot: {
          displayName: 'Client DEF',
        },
      };

      const ecriture = await comptabiliteService.generateEcritureFromPaymentClient(
        mockPayment,
        testUser._id.toString()
      );

      expect(ecriture.journal).toBe('BQ');

      // Debit Mobile Money (521100)
      const ligneMM = ecriture.lignes.find((l) => l.compteNumero === '521100');
      expect(ligneMM).toBeDefined();
      expect(ligneMM.debit).toBe(75000);
    });
  });

  describe('getBalance', () => {
    it('should return balance with comptes array and totaux', async () => {
      // Create some test entries
      await EcritureComptable.create({
        journal: 'VE',
        dateEcriture: new Date('2025-02-15'),
        libelle: 'Test entry',
        exercice: openExercice._id,
        lignes: [
          {
            compte: comptes['411000']._id,
            compteNumero: '411000',
            compteLibelle: 'Clients',
            libelle: 'Test client debit',
            debit: 100000,
            credit: 0,
          },
          {
            compte: comptes['701000']._id,
            compteNumero: '701000',
            compteLibelle: 'Ventes',
            libelle: 'Test vente',
            debit: 0,
            credit: 100000,
          },
        ],
        statut: 'validee',
        createdBy: testUser._id,
      });

      const balance = await comptabiliteService.getBalance({ exercice: openExercice._id });

      expect(balance).toHaveProperty('comptes');
      expect(balance).toHaveProperty('totaux');
      expect(Array.isArray(balance.comptes)).toBe(true);
      expect(balance.totaux).toHaveProperty('totalDebit');
      expect(balance.totaux).toHaveProperty('totalCredit');
      expect(balance.totaux).toHaveProperty('totalSoldeDebiteur');
      expect(balance.totaux).toHaveProperty('totalSoldeCrediteur');
      expect(balance.totaux.totalDebit).toBe(balance.totaux.totalCredit);
    });
  });

  describe('exportFEC', () => {
    it('should export FEC format with correct structure', async () => {
      // Create a test entry
      await EcritureComptable.create({
        journal: 'VE',
        dateEcriture: new Date('2025-02-15'),
        libelle: 'Test FEC entry',
        reference: 'FA-2025-0001',
        exercice: openExercice._id,
        lignes: [
          {
            compte: comptes['411000']._id,
            compteNumero: '411000',
            compteLibelle: 'Clients',
            libelle: 'Client test',
            debit: 50000,
            credit: 0,
          },
          {
            compte: comptes['701000']._id,
            compteNumero: '701000',
            compteLibelle: 'Ventes',
            libelle: 'Vente test',
            debit: 0,
            credit: 50000,
          },
        ],
        statut: 'validee',
        validatedAt: new Date('2025-02-15'),
        createdBy: testUser._id,
      });

      const fecLines = await comptabiliteService.exportFEC({ exercice: openExercice._id });

      expect(Array.isArray(fecLines)).toBe(true);
      expect(fecLines.length).toBeGreaterThan(0);

      const firstLine = fecLines[0];
      expect(firstLine).toHaveProperty('JournalCode');
      expect(firstLine).toHaveProperty('JournalLib');
      expect(firstLine).toHaveProperty('EcritureNum');
      expect(firstLine).toHaveProperty('EcritureDate');
      expect(firstLine).toHaveProperty('CompteNum');
      expect(firstLine).toHaveProperty('CompteLib');
      expect(firstLine).toHaveProperty('CompAuxNum');
      expect(firstLine).toHaveProperty('CompAuxLib');
      expect(firstLine).toHaveProperty('PieceRef');
      expect(firstLine).toHaveProperty('PieceDate');
      expect(firstLine).toHaveProperty('EcritureLib');
      expect(firstLine).toHaveProperty('Debit');
      expect(firstLine).toHaveProperty('Credit');
      expect(firstLine).toHaveProperty('EcrtureLet');
      expect(firstLine).toHaveProperty('DateLet');
      expect(firstLine).toHaveProperty('ValidDate');
      expect(firstLine).toHaveProperty('Montantdevise');
      expect(firstLine).toHaveProperty('Idevise');

      expect(firstLine.JournalCode).toBe('VE');
      expect(firstLine.Idevise).toBe('XOF');
    });

    it('should format dates as YYYYMMDD', async () => {
      const testDate = new Date('2025-02-15');
      await EcritureComptable.create({
        journal: 'CA',
        dateEcriture: testDate,
        libelle: 'Test date formatting',
        exercice: openExercice._id,
        lignes: [
          {
            compte: comptes['571000']._id,
            compteNumero: '571000',
            compteLibelle: 'Caisse',
            libelle: 'Test',
            debit: 1000,
            credit: 0,
          },
          {
            compte: comptes['701000']._id,
            compteNumero: '701000',
            compteLibelle: 'Ventes',
            libelle: 'Test',
            debit: 0,
            credit: 1000,
          },
        ],
        statut: 'validee',
        validatedAt: testDate,
        createdBy: testUser._id,
      });

      const fecLines = await comptabiliteService.exportFEC({ exercice: openExercice._id });
      const line = fecLines[0];

      expect(line.EcritureDate).toBe('20250215');
      expect(line.PieceDate).toBe('20250215');
      expect(line.ValidDate).toBe('20250215');
    });

    it('should format amounts with comma separator', async () => {
      await EcritureComptable.create({
        journal: 'VE',
        dateEcriture: new Date('2025-02-15'),
        libelle: 'Test amount formatting',
        exercice: openExercice._id,
        lignes: [
          {
            compte: comptes['411000']._id,
            compteNumero: '411000',
            compteLibelle: 'Clients',
            libelle: 'Test',
            debit: 123456,
            credit: 0,
          },
          {
            compte: comptes['701000']._id,
            compteNumero: '701000',
            compteLibelle: 'Ventes',
            libelle: 'Test',
            debit: 0,
            credit: 123456,
          },
        ],
        statut: 'validee',
        createdBy: testUser._id,
      });

      const fecLines = await comptabiliteService.exportFEC({ exercice: openExercice._id });
      const debitLine = fecLines.find((l) => l.CompteNum === '411000');

      expect(debitLine.Debit).toBe('123456,00');
      expect(debitLine.Credit).toBe('0,00');
    });
  });

  describe('getExerciceForDate', () => {
    it('should throw error if no open exercice exists', async () => {
      // Close the exercice
      await openExercice.cloturer(testUser._id);

      const mockFacture = {
        dateFacture: new Date('2025-03-01'),
        totalHT: 100000,
        totalTVA: 18000,
        totalTTC: 118000,
        clientSnapshot: { displayName: 'Test' },
      };

      await expect(
        comptabiliteService.generateEcritureFromFacture(mockFacture, testUser._id.toString())
      ).rejects.toThrow('cloture');
    });
  });

  describe('resolveCompte', () => {
    it('should throw error if compte does not exist', async () => {
      const mockFacture = {
        _id: 'test',
        typeDocument: 'facture',
        numero: 'FA-TEST',
        dateFacture: new Date('2025-02-15'),
        totalHT: 100000,
        totalTVA: 18000,
        totalTTC: 118000,
        clientSnapshot: { displayName: 'Test' },
      };

      // Delete the compte to simulate not found
      await CompteComptable.deleteOne({ numero: '411000' });

      await expect(
        comptabiliteService.generateEcritureFromFacture(mockFacture, testUser._id.toString())
      ).rejects.toThrow('non trouve');
    });

    it('should throw error if compte is not imputable', async () => {
      // Make compte non-imputable
      await CompteComptable.findOneAndUpdate(
        { numero: '411000' },
        { isImputable: false }
      );

      const mockFacture = {
        _id: 'test',
        typeDocument: 'facture',
        numero: 'FA-TEST',
        dateFacture: new Date('2025-02-15'),
        totalHT: 100000,
        totalTVA: 18000,
        totalTTC: 118000,
        clientSnapshot: { displayName: 'Test' },
      };

      await expect(
        comptabiliteService.generateEcritureFromFacture(mockFacture, testUser._id.toString())
      ).rejects.toThrow('pas imputable');
    });
  });
});
