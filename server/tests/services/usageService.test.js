/**
 * Tests unitaires — usageService
 *
 * Vérifie : comptage de factures, isolation par company, détection de limite.
 */
require('../setup');
const {
  createTestCompany,
  createTestSettings,
  createTestForfait,
  createTestAbonnement,
  createSaasUser,
  createTestCategory,
} = require('../helpers');
const {
  compterFacturesDuMois,
  compterUtilisateursActifs,
  limiteFacturesAtteinte,
  getUsage,
} = require('../../src/services/usageService');
const Facture  = require('../../src/models/Facture');
const Company  = require('../../src/models/Company');
const mongoose = require('mongoose');

let companyA, companyB;
let userA;
let forfait;

beforeEach(async () => {
  companyA = await createTestCompany({ name: 'Company Usage A', email: 'a@usage.sn' });
  companyB = await createTestCompany({ name: 'Company Usage B', email: 'b@usage.sn' });

  await createTestSettings(companyA._id);
  await createTestSettings(companyB._id);

  forfait = await createTestForfait({
    code: 'STD_USG', nom: 'Standard Usage',
    limites: { maxFacturesMois: 5, maxUtilisateurs: 3 },
  });

  const aboA = await createTestAbonnement(companyA._id, forfait._id, {
    statut: 'ACTIF',
    dateDebut: new Date(),
    dateFin: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    montant: 15000,
  });

  await Company.findByIdAndUpdate(companyA._id, {
    abonnementActifId: aboA._id,
    forfaitId: forfait._id,
    status: 'active',
  });

  const resA = await createSaasUser(companyA._id, 'admin', { email: 'admin@usage-a.sn' });
  userA = resA.user;
});

// ── compterFacturesDuMois ────────────────────────────────────────────────────

describe('compterFacturesDuMois()', () => {
  it("compte uniquement les factures du mois courant pour la company", async () => {
    // Créer 3 factures pour companyA ce mois
    const clientId = new mongoose.Types.ObjectId();
    for (let i = 0; i < 3; i++) {
      await Facture.create({
        client: clientId, type: 'FACTURE', statut: 'BROUILLON',
        lignes: [], montantHT: 0, montantTVA: 0, montantTTC: 0,
        companyId: companyA._id, createdBy: userA._id,
        numero: `FA${i}`,
      });
    }

    const count = await compterFacturesDuMois(companyA._id);
    expect(count).toBe(3);
  });

  it("ne compte pas les factures de l'autre company", async () => {
    const clientId = new mongoose.Types.ObjectId();
    // Créer des factures pour companyB
    for (let i = 0; i < 5; i++) {
      await Facture.create({
        client: clientId, type: 'FACTURE', statut: 'BROUILLON',
        lignes: [], montantHT: 0, montantTVA: 0, montantTTC: 0,
        companyId: companyB._id, createdBy: userA._id,
        numero: `FB${i}`,
      });
    }

    // companyA ne doit voir aucune facture de companyB
    const countA = await compterFacturesDuMois(companyA._id);
    expect(countA).toBe(0);
  });

  it("ne compte pas les factures du mois précédent", async () => {
    const clientId = new mongoose.Types.ObjectId();
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    // Insérer directement en DB pour avoir une date arbitraire
    await Facture.collection.insertOne({
      client: clientId, type: 'FACTURE', statut: 'BROUILLON',
      lignes: [], montantHT: 0, montantTVA: 0, montantTTC: 0,
      companyId: companyA._id, createdBy: userA._id,
      numero: 'FA-OLD', createdAt: lastMonth, updatedAt: lastMonth,
    });

    const count = await compterFacturesDuMois(companyA._id);
    expect(count).toBe(0);
  });
});

// ── compterUtilisateursActifs ────────────────────────────────────────────────

describe('compterUtilisateursActifs()', () => {
  it("compte les utilisateurs actifs de la company", async () => {
    // userA est déjà créé, créer 2 autres
    await createSaasUser(companyA._id, 'admin', { email: 'user2@usage-a.sn' });
    await createSaasUser(companyA._id, 'admin', { email: 'user3@usage-a.sn' });

    const count = await compterUtilisateursActifs(companyA._id);
    expect(count).toBe(3);
  });

  it("ne compte pas les utilisateurs d'une autre company", async () => {
    // Créer des utilisateurs pour companyB
    await createSaasUser(companyB._id, 'admin', { email: 'user@usage-b.sn' });

    const count = await compterUtilisateursActifs(companyA._id);
    expect(count).toBe(1); // seul userA
  });
});

// ── limiteFacturesAtteinte ───────────────────────────────────────────────────

describe('limiteFacturesAtteinte()', () => {
  it("retourne false quand la limite n'est pas atteinte", async () => {
    // Aucune facture ce mois
    const atteinte = await limiteFacturesAtteinte(companyA._id);
    expect(atteinte).toBe(false);
  });

  it("retourne true quand la limite mensuelle est atteinte (maxFacturesMois=5)", async () => {
    const clientId = new mongoose.Types.ObjectId();
    for (let i = 0; i < 5; i++) {
      await Facture.create({
        client: clientId, type: 'FACTURE', statut: 'BROUILLON',
        lignes: [], montantHT: 0, montantTVA: 0, montantTTC: 0,
        companyId: companyA._id, createdBy: userA._id,
        numero: `FLIM${i}`,
      });
    }

    const atteinte = await limiteFacturesAtteinte(companyA._id);
    expect(atteinte).toBe(true);
  });

  it("retourne false si la company n'a pas d'abonnement actif (pas de limite)", async () => {
    // companyB n'a pas d'abonnement actif lié à un forfait
    const atteinte = await limiteFacturesAtteinte(companyB._id);
    expect(atteinte).toBe(false);
  });
});

// ── getUsage ─────────────────────────────────────────────────────────────────

describe('getUsage()', () => {
  it("retourne les stats d'utilisation avec le forfait", async () => {
    const usage = await getUsage(companyA._id);

    expect(usage).toHaveProperty('facturesMois');
    expect(usage).toHaveProperty('utilisateurs');
    expect(usage).toHaveProperty('limites');
    expect(usage).toHaveProperty('alertes');
    expect(usage.limites.maxFacturesMois).toBe(5);
    expect(usage.limites.maxUtilisateurs).toBe(3);
    expect(usage.forfait.nom).toBe('Standard Usage');
  });

  it("génère une alerte quand la limite à 80% est approchée", async () => {
    // 4 factures sur 5 = 80%
    const clientId = new mongoose.Types.ObjectId();
    for (let i = 0; i < 4; i++) {
      await Facture.create({
        client: clientId, type: 'FACTURE', statut: 'BROUILLON',
        lignes: [], montantHT: 0, montantTVA: 0, montantTTC: 0,
        companyId: companyA._id, createdBy: userA._id,
        numero: `FALRT${i}`,
      });
    }

    const usage = await getUsage(companyA._id);
    expect(usage.alertes.length).toBeGreaterThan(0);
    expect(usage.alertes[0]).toContain('80%');
  });

  it("génère une alerte 'Quota atteint' à 100%", async () => {
    const clientId = new mongoose.Types.ObjectId();
    for (let i = 0; i < 5; i++) {
      await Facture.create({
        client: clientId, type: 'FACTURE', statut: 'BROUILLON',
        lignes: [], montantHT: 0, montantTVA: 0, montantTTC: 0,
        companyId: companyA._id, createdBy: userA._id,
        numero: `FMAX${i}`,
      });
    }

    const usage = await getUsage(companyA._id);
    expect(usage.alertes.some((a) => a.includes('atteint'))).toBe(true);
  });

  it("lève une erreur si la company est introuvable", async () => {
    const fakeId = new mongoose.Types.ObjectId();
    await expect(getUsage(fakeId)).rejects.toThrow();
  });
});
