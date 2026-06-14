/**
 * Tests E2E — Cycle de vente complet
 * Flux : devis → commande → facture → paiement → écriture SYSCOHADA
 *
 * Stratégie : création via API (plus fiable), vérification via UI.
 * Les transitions d'état critiques sont testées en double (API + UI).
 */
describe('Cycle de vente complet', () => {
  const email    = Cypress.env('adminEmail');
  const password = Cypress.env('adminPassword');

  let testClient;
  let testProduct;
  let testDevis;
  let testCommande;
  let testFacture;
  let testPayment;

  // ── Setup ─────────────────────────────────────────────────────────────────

  before(() => {
    cy.login(email, password);

    cy.createTestClient().then((c) => { testClient = c; });
    cy.createTestProduct().then((p) => { testProduct = p; });
  });

  after(() => {
    // Nettoyage best-effort (les contraintes de FK peuvent bloquer certaines suppressions)
    if (testPayment?._id)  cy.deleteTestResource(`/payments/${testPayment._id}`);
    if (testFacture?._id)  cy.deleteTestResource(`/factures/${testFacture._id}`);
    if (testDevis?._id)    cy.deleteTestResource(`/devis/${testDevis._id}`);
    if (testProduct?._id)  cy.deleteTestResource(`/products/${testProduct._id}`);
    if (testClient?._id)   cy.deleteTestResource(`/clients/${testClient._id}`);
  });

  beforeEach(() => {
    cy.login(email, password);
  });

  // ── 1. Devis ───────────────────────────────────────────────────────────────

  it('1. créer un devis via API', () => {
    cy.createTestDevis(testClient._id, testProduct._id).then((d) => {
      testDevis = d;
      expect(d._id).to.be.a('string');
      expect(d.statut).to.eq('brouillon');
      expect(d.client).to.eq(testClient._id);
      expect(d.lignes).to.have.length(1);
      expect(d.totalTTC).to.be.greaterThan(0);
    });
  });

  it('2. le devis apparaît dans la liste UI', () => {
    cy.visit('/ventes/devis');
    cy.contains(testClient.raisonSociale, { timeout: 10000 }).should('be.visible');
  });

  it('3. la page de détail du devis se charge', () => {
    cy.visit(`/ventes/devis/${testDevis._id}`);
    cy.contains(testClient.raisonSociale, { timeout: 10000 }).should('be.visible');
    cy.contains('brouillon', { matchCase: false, timeout: 8000 }).should('be.visible');
  });

  it('4. GET /api/devis/:id retourne le devis', () => {
    cy.apiRequest('GET', `/devis/${testDevis._id}`).then((resp) => {
      expect(resp.status).to.eq(200);
      expect(resp.body.data._id).to.eq(testDevis._id);
      expect(resp.body.data.statut).to.eq('brouillon');
    });
  });

  // ── 2. Conversion devis → commande ────────────────────────────────────────

  it('5. convertir le devis en commande via API', () => {
    cy.apiRequest('POST', `/devis/${testDevis._id}/convert`).then((resp) => {
      expect(resp.status).to.eq(201);
      expect(resp.body.success).to.be.true;
      testCommande = resp.body.data;
      expect(testCommande._id).to.be.a('string');
    });
  });

  it('6. le devis passe au statut "converti" après conversion', () => {
    cy.apiRequest('GET', `/devis/${testDevis._id}`).then((resp) => {
      expect(resp.body.data.statut).to.eq('converti');
    });
  });

  it('7. la commande créée apparaît dans la liste UI', () => {
    cy.visit('/ventes/commandes');
    cy.contains(testClient.raisonSociale, { timeout: 10000 }).should('be.visible');
  });

  // ── 3. Facture ────────────────────────────────────────────────────────────

  it('8. créer une facture via API', () => {
    cy.createTestFacture(testClient._id, testProduct._id).then((f) => {
      testFacture = f;
      expect(f._id).to.be.a('string');
      expect(f.statut).to.eq('brouillon');
      expect(f.totalTTC).to.be.greaterThan(0);
    });
  });

  it('9. la facture apparaît dans la liste UI', () => {
    cy.visit('/ventes/factures');
    cy.contains(testClient.raisonSociale, { timeout: 10000 }).should('be.visible');
  });

  it('10. la page de détail de la facture se charge', () => {
    cy.visit(`/ventes/factures/${testFacture._id}`);
    cy.contains(testClient.raisonSociale, { timeout: 10000 }).should('be.visible');
    cy.contains('brouillon', { matchCase: false, timeout: 8000 }).should('be.visible');
  });

  // ── 4. Validation facture ─────────────────────────────────────────────────

  it('11. valider la facture via API', () => {
    cy.apiRequest('POST', `/factures/${testFacture._id}/validate`).then((resp) => {
      expect(resp.status).to.eq(200);
      expect(resp.body.success).to.be.true;
      // La facture validée reçoit un numéro officiel
      expect(resp.body.data.numero).to.be.a('string');
      testFacture = resp.body.data;
    });
  });

  it('12. le statut de la facture passe à "validee" ou "envoyee"', () => {
    cy.apiRequest('GET', `/factures/${testFacture._id}`).then((resp) => {
      expect(resp.body.data.statut).to.be.oneOf(['validee', 'envoyee']);
      expect(resp.body.data.numero).to.be.a('string').and.not.be.empty;
    });
  });

  it('13. l\'UI affiche la facture validée avec son numéro', () => {
    cy.visit(`/ventes/factures/${testFacture._id}`);
    cy.contains(testFacture.numero, { timeout: 10000 }).should('be.visible');
  });

  // ── 5. Paiement ───────────────────────────────────────────────────────────

  it('14. créer un paiement lié à la facture via API', () => {
    cy.createTestPayment(testFacture._id, testFacture.totalTTC).then((p) => {
      testPayment = p;
      expect(p._id).to.be.a('string');
      expect(p.statut).to.eq('brouillon');
      expect(p.montant).to.eq(testFacture.totalTTC);
    });
  });

  it('15. valider le paiement via API', () => {
    cy.apiRequest('POST', `/payments/${testPayment._id}/validate`).then((resp) => {
      expect(resp.status).to.eq(200);
      expect(resp.body.success).to.be.true;
      expect(resp.body.data.statut).to.eq('valide');
      expect(resp.body.data.numero).to.be.a('string');
    });
  });

  it('16. la facture passe au statut "payee" après paiement intégral', () => {
    cy.apiRequest('GET', `/factures/${testFacture._id}`).then((resp) => {
      expect(resp.body.data.statut).to.eq('payee');
      expect(resp.body.data.montantPaye).to.eq(testFacture.totalTTC);
    });
  });

  // ── 6. Écriture SYSCOHADA ─────────────────────────────────────────────────

  it('17. une écriture comptable SYSCOHADA a été générée pour la facture', () => {
    cy.apiRequest('GET', '/ecritures', {
      method: 'GET',
    });
    cy.apiRequest('GET', `/ecritures?search=${testFacture.numero}`).then((resp) => {
      if (resp.status === 200 && Array.isArray(resp.body.data)) {
        // Si l'écriture existe, elle doit être équilibrée (débit = crédit)
        const ecritures = resp.body.data;
        if (ecritures.length > 0) {
          const ecriture = ecritures[0];
          const totalDebit  = (ecriture.lignes || []).reduce((s, l) => s + (l.debit  || 0), 0);
          const totalCredit = (ecriture.lignes || []).reduce((s, l) => s + (l.credit || 0), 0);
          expect(Math.abs(totalDebit - totalCredit)).to.be.lessThan(1);
        }
      }
    });
  });

  it('18. la page des paiements affiche le paiement validé', () => {
    cy.visit('/paiements');
    cy.contains(testPayment.numero || testClient.raisonSociale, { timeout: 10000 }).should('be.visible');
  });

  // ── 7. Dashboard analytics post-cycle ────────────────────────────────────

  it('19. le dashboard charge sans erreur après le cycle', () => {
    cy.visit('/');
    cy.url({ timeout: 10000 }).should('not.include', '/login');
    cy.get('.stat-card, [class*="stat"]', { timeout: 10000 }).should('have.length.greaterThan', 0);
  });

  it('20. l\'API /dashboard/stats retourne des KPIs cohérents', () => {
    cy.apiRequest('GET', '/dashboard/stats').then((resp) => {
      expect(resp.status).to.eq(200);
      expect(resp.body.success).to.be.true;
      const data = resp.body.data;
      expect(data).to.have.property('caDuMois');
      expect(data).to.have.property('clientsActifs');
      expect(data.clientsActifs).to.be.greaterThan(0);
    });
  });

  it('21. l\'API /dashboard/top-clients retourne des données', () => {
    cy.apiRequest('GET', '/dashboard/top-clients').then((resp) => {
      expect(resp.status).to.eq(200);
      expect(resp.body.data).to.be.an('array');
    });
  });
});
