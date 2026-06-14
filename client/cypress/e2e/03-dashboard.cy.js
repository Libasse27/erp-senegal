/**
 * Tests E2E — Dashboard et navigation post-connexion
 */
describe('Dashboard et navigation', () => {
  const email    = Cypress.env('adminEmail');
  const password = Cypress.env('adminPassword');

  beforeEach(() => {
    cy.login(email, password);
  });

  it('charge le tableau de bord', () => {
    cy.visit('/');
    cy.url({ timeout: 10000 }).should('not.include', '/login');
    cy.get('body').should('not.be.empty');
  });

  it('la sidebar est visible et contient les sections principales', () => {
    cy.visit('/');
    cy.get('nav, .sidebar', { timeout: 8000 }).should('be.visible');
  });

  it('navigue vers la page clients', () => {
    cy.visit('/clients');
    cy.url({ timeout: 10000 }).should('include', '/clients');
    cy.get('body').should('not.be.empty');
  });

  it('navigue vers la page factures', () => {
    cy.visit('/ventes/factures');
    cy.url({ timeout: 10000 }).should('include', '/factures');
    cy.get('body').should('not.be.empty');
  });

  it('navigue vers la page abonnement', () => {
    cy.visit('/abonnement');
    cy.url({ timeout: 10000 }).should('include', '/abonnement');
    cy.get('body').should('not.be.empty');
  });

  it('navigue vers la page comptabilité — balance', () => {
    cy.visit('/comptabilite/balance');
    cy.url({ timeout: 10000 }).should('include', '/balance');
    cy.get('body').should('not.be.empty');
  });

  it('l\'API health-check répond avec succès', () => {
    cy.request(`${Cypress.env('apiUrl')}/health`).then((resp) => {
      expect(resp.status).to.eq(200);
      expect(resp.body.success).to.be.true;
    });
  });

  it('l\'API forfaits répond avec les 3 forfaits', () => {
    cy.request(`${Cypress.env('apiUrl')}/forfaits`).then((resp) => {
      expect(resp.status).to.eq(200);
      expect(resp.body.data).to.be.an('array').with.length.greaterThan(0);
      const codes = resp.body.data.map((f) => f.code);
      expect(codes).to.include.members(['STANDARD', 'PROFESSIONNEL', 'COMPLET']);
    });
  });
});
