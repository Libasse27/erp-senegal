/**
 * Tests E2E — Module Clients
 * Prérequis : backend sur :5000, frontend sur :3000
 */
describe('Module Clients', () => {
  const email    = Cypress.env('adminEmail');
  const password = Cypress.env('adminPassword');

  let testClient;

  before(() => {
    cy.login(email, password);
    cy.createTestClient().then((c) => { testClient = c; });
  });

  after(() => {
    if (testClient?._id) {
      cy.deleteTestResource(`/clients/${testClient._id}`);
    }
  });

  beforeEach(() => {
    cy.login(email, password);
  });

  // ── Liste ──────────────────────────────────────────────────────────────────

  it('la liste des clients se charge', () => {
    cy.visit('/clients');
    cy.url({ timeout: 10000 }).should('include', '/clients');
    cy.get('body').should('not.be.empty');
  });

  it('le client de test apparaît dans la liste', () => {
    cy.visit('/clients');
    cy.contains(testClient.raisonSociale, { timeout: 10000 }).should('be.visible');
  });

  // ── Détail ─────────────────────────────────────────────────────────────────

  it('la page de détail client se charge', () => {
    cy.visit(`/clients/${testClient._id}`);
    cy.contains(testClient.raisonSociale, { timeout: 10000 }).should('be.visible');
  });

  // ── API ────────────────────────────────────────────────────────────────────

  it('GET /api/clients retourne une liste paginée', () => {
    cy.apiRequest('GET', '/clients').then((resp) => {
      expect(resp.status).to.eq(200);
      expect(resp.body.success).to.be.true;
      expect(resp.body.data).to.be.an('array');
    });
  });

  it('GET /api/clients/:id retourne le client de test', () => {
    cy.apiRequest('GET', `/clients/${testClient._id}`).then((resp) => {
      expect(resp.status).to.eq(200);
      expect(resp.body.data.raisonSociale).to.eq(testClient.raisonSociale);
    });
  });

  it('PUT /api/clients/:id met à jour le nom', () => {
    const newName = `${testClient.raisonSociale} (modifie)`;
    cy.apiRequest('PUT', `/clients/${testClient._id}`, {
      raisonSociale: newName,
    }).then((resp) => {
      expect(resp.status).to.eq(200);
      expect(resp.body.data.raisonSociale).to.eq(newName);
    });
  });

  it('l\'API refuse un client sans raisonSociale (entreprise)', () => {
    cy.apiRequest('POST', '/clients', {
      type: 'entreprise',
      email: `bad-${Date.now()}@test.sn`,
    }).then((resp) => {
      expect(resp.status).to.be.oneOf([400, 422]);
    });
  });

  // ── Navigation ─────────────────────────────────────────────────────────────

  it('le bouton Nouveau client mène au formulaire', () => {
    cy.visit('/clients');
    cy.contains('Nouveau', { matchCase: false, timeout: 8000 }).first().click();
    cy.url({ timeout: 8000 }).should('include', '/clients/nouveau');
  });
});
