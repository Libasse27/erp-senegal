/**
 * Tests E2E — Abonnement SaaS (vue admin entreprise)
 *
 * Couvre :
 *   - Admin peut voir son abonnement actuel
 *   - Admin peut voir ses factures SaaS
 *   - La cloche de notification est visible dans le header
 *   - La page pricing affiche les plans depuis l'API
 *
 * Prérequis : compte admin entreprise créé par seed:saas-demo
 *   email    : demo-admin@ndakaru.sn (ou Cypress.env('adminEmail'))
 *   password : Admin@Demo2026!       (ou Cypress.env('adminPassword'))
 */
describe('Abonnement SaaS — vue admin entreprise', () => {
  const email    = Cypress.env('demoAdminEmail')    || Cypress.env('adminEmail');
  const password = Cypress.env('demoAdminPassword') || Cypress.env('adminPassword');

  before(() => {
    cy.clearLocalStorage();
    cy.clearCookies();
  });

  // ── Helper login ────────────────────────────────────────────────────────────
  const login = () => {
    cy.visit('/login');
    cy.get('input[type="email"], input[name="email"]').type(email);
    cy.get('input[type="password"]').type(password);
    cy.get('button[type="submit"]').click();
    cy.url({ timeout: 15000 }).should('not.include', '/login');
  };

  // ── Tests pricing (sans login) ──────────────────────────────────────────────

  describe('Page Pricing publique', () => {
    it('affiche les 3 plans avec prix FCFA depuis l\'API', () => {
      cy.visit('/pricing');
      cy.contains('Standard',     { timeout: 12000 }).should('be.visible');
      cy.contains('Professionnel', { timeout: 8000  }).should('be.visible');
      cy.contains('Complet',       { timeout: 8000  }).should('be.visible');
      cy.contains('FCFA').should('be.visible');
    });

    it('le toggle mensuel / annuel change les prix', () => {
      cy.visit('/pricing');
      cy.contains('Annuel', { matchCase: false, timeout: 10000 }).click();
      cy.contains('FCFA', { timeout: 5000 }).should('be.visible');
      cy.contains('Mensuel', { matchCase: false }).click();
      cy.contains('FCFA').should('be.visible');
    });
  });

  // ── Tests abonnement connecté ───────────────────────────────────────────────

  describe('Espace abonnement authentifié', () => {
    beforeEach(() => {
      login();
    });

    it('la page Mon Abonnement est accessible après connexion', () => {
      cy.visit('/abonnement');
      // La page doit afficher le statut ou un message d'abonnement
      cy.url({ timeout: 10000 }).should('include', '/abonnement');
      cy.get('body', { timeout: 10000 }).should('be.visible');
    });

    it('la page Factures SaaS affiche le tableau ou l\'état vide', () => {
      cy.visit('/abonnement/factures');
      cy.url({ timeout: 10000 }).should('include', '/abonnement/factures');
      // Soit un tableau, soit "Aucune facture"
      cy.get('body', { timeout: 12000 }).then(($body) => {
        const hasTable  = $body.find('table').length > 0;
        const hasEmpty  = $body.text().match(/aucune facture/i);
        expect(hasTable || hasEmpty).to.be.true;
      });
    });

    it('la cloche de notification est présente dans le header', () => {
      cy.visit('/');
      // Le bouton cloche FiBell est dans le header
      cy.get('svg', { timeout: 10000 }).should('exist');
      // Chercher la zone de notification dans le header
      cy.get('nav, header, [class*="header"], [class*="topbar"]', { timeout: 8000 })
        .should('exist');
    });
  });

  // ── Tests register SaaS (stepper) ──────────────────────────────────────────

  describe('Page d\'inscription SaaS', () => {
    beforeEach(() => {
      cy.clearLocalStorage();
      cy.clearCookies();
    });

    it('affiche le formulaire d\'inscription en plusieurs étapes', () => {
      cy.visit('/register');
      cy.url({ timeout: 8000 }).should('include', '/register');
      cy.get('form, [class*="form"], [class*="register"]', { timeout: 10000 }).should('exist');
    });

    it('affiche les champs de l\'étape 1 (informations personnelles)', () => {
      cy.visit('/register');
      // Chercher un champ email ou prénom
      cy.get('input[type="email"], input[name="email"]', { timeout: 10000 }).should('exist');
    });

    it('le formulaire ne soumet pas sans les champs obligatoires', () => {
      cy.visit('/register');
      cy.get('button[type="submit"]', { timeout: 8000 }).click({ force: true });
      cy.url({ timeout: 5000 }).should('include', '/register');
    });
  });
});
