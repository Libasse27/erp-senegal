// Commandes Cypress personnalisées

/**
 * Connexion via l'API (plus rapide que passer par l'UI)
 * Stocke le token dans localStorage pour que RTK Query l'utilise
 */
Cypress.Commands.add('login', (email, password) => {
  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/auth/login`,
    body: { email, password },
    failOnStatusCode: false,
  }).then((resp) => {
    if (resp.status !== 200) {
      throw new Error(`Login failed: ${resp.status} — ${JSON.stringify(resp.body)}`);
    }
    const { accessToken, refreshToken, user } = resp.body.data;
    window.localStorage.setItem('accessToken', accessToken);
    window.localStorage.setItem('refreshToken', refreshToken);
    window.localStorage.setItem('user', JSON.stringify(user));
  });
});

/**
 * Connexion via l'interface de login (teste le flux UI complet)
 */
Cypress.Commands.add('loginUI', (email, password) => {
  cy.visit('/login');
  cy.get('input[type="email"], input[name="email"]').first().clear().type(email);
  cy.get('input[type="password"]').first().clear().type(password);
  cy.get('button[type="submit"]').click();
  cy.url().should('not.include', '/login');
});

/**
 * Déconnexion
 */
Cypress.Commands.add('logout', () => {
  window.localStorage.clear();
  cy.visit('/login');
});
