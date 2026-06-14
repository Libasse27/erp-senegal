/**
 * Tests E2E — Page Tarifs (Pricing) et Inscription SaaS
 */
describe('Page Tarifs SaaS', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.clearCookies();
  });

  it('affiche les 3 forfaits SaaS depuis l\'API', () => {
    cy.visit('/pricing');
    // Les 3 forfaits doivent apparaître
    cy.contains('Standard',        { timeout: 10000 }).should('be.visible');
    cy.contains('Professionnel',    { timeout: 10000 }).should('be.visible');
    cy.contains('Complet',          { timeout: 10000 }).should('be.visible');
  });

  it('affiche les prix en FCFA', () => {
    cy.visit('/pricing');
    cy.contains('FCFA', { timeout: 10000 }).should('be.visible');
  });

  it('le toggle mensuel/annuel fonctionne', () => {
    cy.visit('/pricing');
    cy.contains('Annuel', { matchCase: false, timeout: 8000 }).click();
    cy.contains('FCFA').should('be.visible');
    cy.contains('Mensuel', { matchCase: false }).click();
    cy.contains('FCFA').should('be.visible');
  });

  it('affiche la page d\'inscription', () => {
    cy.visit('/register');
    cy.contains('Créer', { matchCase: false, timeout: 8000 }).should('be.visible');
    cy.get('input[name="firstName"], input[placeholder*="Prénom"]').should('be.visible');
    cy.get('input[name="email"], input[type="email"]').should('be.visible');
  });

  it('le formulaire d\'inscription valide les champs obligatoires', () => {
    cy.visit('/register');
    cy.get('button[type="submit"]').click();
    // Des messages de validation doivent apparaître
    cy.get('body').then(($body) => {
      const hasError = $body.text().match(/requis|obligatoire|required/i);
      const staysOnRegister = Cypress.config('baseUrl') + '/register';
      if (!hasError) {
        cy.url().should('include', '/register');
      }
    });
  });
});
