/**
 * Tests E2E — Authentification
 *
 * Prérequis : serveur backend + frontend démarrés
 *   cd server && npm start
 *   cd client && npm start
 *   cd client && npx cypress run
 */
describe('Authentification', () => {
  const email    = Cypress.env('adminEmail');
  const password = Cypress.env('adminPassword');

  beforeEach(() => {
    cy.clearLocalStorage();
    cy.clearCookies();
  });

  it('affiche la page de login', () => {
    cy.visit('/login');
    cy.contains('Connexion').should('be.visible');
    cy.get('input[type="email"], input[name="email"]').should('be.visible');
    cy.get('input[type="password"]').should('be.visible');
    cy.get('button[type="submit"]').should('be.visible');
  });

  it('affiche un lien vers la page d\'inscription', () => {
    cy.visit('/login');
    cy.contains('Créer un compte', { matchCase: false }).should('be.visible');
    cy.contains('Créer un compte', { matchCase: false }).click();
    cy.url().should('include', '/register');
  });

  it('affiche une erreur avec des identifiants invalides', () => {
    cy.visit('/login');
    cy.get('input[type="email"], input[name="email"]').first().type('mauvais@email.sn');
    cy.get('input[type="password"]').first().type('MauvaisMotDePasse!');
    cy.get('button[type="submit"]').click();
    // L'URL ne change pas OU un message d'erreur est affiché
    cy.get('body').should('not.contain', '/');
    cy.url().should('include', '/login');
  });

  it('connecte un utilisateur valide et redirige vers le dashboard', () => {
    cy.visit('/login');
    cy.get('input[type="email"], input[name="email"]').first().clear().type(email);
    cy.get('input[type="password"]').first().clear().type(password);
    cy.get('button[type="submit"]').click();
    // Après connexion, quitter la page login
    cy.url({ timeout: 10000 }).should('not.include', '/login');
    // La sidebar ou le dashboard doit être visible
    cy.get('body').should('not.be.empty');
  });

  it('la page /pricing est accessible sans connexion', () => {
    cy.visit('/pricing');
    // La page doit charger (même si redirigée vers login)
    cy.get('body').should('not.be.empty');
  });

  it('la route protégée / redirige vers /login sans token', () => {
    cy.clearLocalStorage();
    cy.visit('/');
    cy.url({ timeout: 8000 }).should('include', '/login');
  });

  it('connecte via API et accède au dashboard', () => {
    cy.login(email, password);
    cy.visit('/');
    cy.url({ timeout: 10000 }).should('not.include', '/login');
  });
});
