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

/**
 * Requête API authentifiée — utilise le token stocké en localStorage
 */
Cypress.Commands.add('apiRequest', (method, path, body) => {
  const token = window.localStorage.getItem('accessToken');
  return cy.request({
    method,
    url: `${Cypress.env('apiUrl')}${path}`,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body,
    failOnStatusCode: false,
  });
});

/**
 * Créer un client de test via l'API
 */
Cypress.Commands.add('createTestClient', (overrides = {}) => {
  const uid = Date.now();
  return cy.apiRequest('POST', '/clients', {
    type: 'entreprise',
    raisonSociale: `E2E Client ${uid}`,
    email: `e2e-client-${uid}@test.sn`,
    phone: '+221771234567',
    ...overrides,
  }).then((resp) => {
    if (resp.status !== 201) {
      throw new Error(`createTestClient failed (${resp.status}): ${JSON.stringify(resp.body)}`);
    }
    return resp.body.data;
  });
});

/**
 * Créer un produit/service de test via l'API
 */
Cypress.Commands.add('createTestProduct', (overrides = {}) => {
  const uid = Date.now();
  return cy.apiRequest('POST', '/products', {
    name: `E2E Produit ${uid}`,
    code: `E2E-${uid}`,
    type: 'service',
    prixVente: 75000,
    tauxTVA: 18,
    unite: 'U',
    ...overrides,
  }).then((resp) => {
    if (resp.status !== 201) {
      throw new Error(`createTestProduct failed (${resp.status}): ${JSON.stringify(resp.body)}`);
    }
    return resp.body.data;
  });
});

/**
 * Créer un devis de test via l'API
 */
Cypress.Commands.add('createTestDevis', (clientId, productId, overrides = {}) => {
  const dateValidite = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  return cy.apiRequest('POST', '/devis', {
    client: clientId,
    dateValidite,
    lignes: [{
      product: productId,
      designation: 'Prestation E2E',
      quantite: 2,
      prixUnitaire: 75000,
      tauxTVA: 18,
      remise: 0,
    }],
    ...overrides,
  }).then((resp) => {
    if (resp.status !== 201) {
      throw new Error(`createTestDevis failed (${resp.status}): ${JSON.stringify(resp.body)}`);
    }
    return resp.body.data;
  });
});

/**
 * Créer une facture de test via l'API
 */
Cypress.Commands.add('createTestFacture', (clientId, productId, overrides = {}) => {
  const dateEcheance = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  return cy.apiRequest('POST', '/factures', {
    client: clientId,
    dateEcheance,
    lignes: [{
      product: productId,
      designation: 'Facture E2E',
      quantite: 1,
      prixUnitaire: 100000,
      tauxTVA: 18,
      remise: 0,
    }],
    ...overrides,
  }).then((resp) => {
    if (resp.status !== 201) {
      throw new Error(`createTestFacture failed (${resp.status}): ${JSON.stringify(resp.body)}`);
    }
    return resp.body.data;
  });
});

/**
 * Créer un paiement de test via l'API
 */
Cypress.Commands.add('createTestPayment', (factureId, montant, overrides = {}) => {
  return cy.apiRequest('POST', '/payments', {
    type: 'encaissement',
    montant,
    modePaiement: 'virement',
    datePaiement: new Date().toISOString().split('T')[0],
    ...(factureId && { facture: factureId }),
    ...overrides,
  }).then((resp) => {
    if (resp.status !== 201) {
      throw new Error(`createTestPayment failed (${resp.status}): ${JSON.stringify(resp.body)}`);
    }
    return resp.body.data;
  });
});

/**
 * Supprimer une ressource de test via l'API (best-effort)
 */
Cypress.Commands.add('deleteTestResource', (path) => {
  cy.apiRequest('DELETE', path).then(() => {});
});
