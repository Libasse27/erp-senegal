/**
 * Tests E2E — Module Stocks et produits
 */
describe('Module Stocks', () => {
  const email    = Cypress.env('adminEmail');
  const password = Cypress.env('adminPassword');

  let testProduct;

  before(() => {
    cy.login(email, password);
    cy.createTestProduct({
      name: `E2E Stock ${Date.now()}`,
      stockMinimum: 5,
      stockAlerte: 10,
    }).then((p) => { testProduct = p; });
  });

  after(() => {
    if (testProduct?._id) {
      cy.deleteTestResource(`/products/${testProduct._id}`);
    }
  });

  beforeEach(() => {
    cy.login(email, password);
  });

  // ── Navigation ─────────────────────────────────────────────────────────────

  it('la page Stocks se charge', () => {
    cy.visit('/stocks');
    cy.url({ timeout: 10000 }).should('include', '/stocks');
    cy.get('body').should('not.be.empty');
  });

  it('la page Produits se charge', () => {
    cy.visit('/produits');
    cy.url({ timeout: 10000 }).should('include', '/produits');
    cy.get('body').should('not.be.empty');
  });

  // ── Produit ─────────────────────────────────────────────────────────────────

  it('le produit de test apparaît dans la liste', () => {
    cy.visit('/produits');
    cy.contains(testProduct.name, { timeout: 10000 }).should('be.visible');
  });

  it('la page de détail produit se charge', () => {
    cy.visit(`/produits/${testProduct._id}`);
    cy.contains(testProduct.name, { timeout: 10000 }).should('be.visible');
  });

  // ── API Stocks ──────────────────────────────────────────────────────────────

  it('GET /api/stocks retourne la liste des stocks', () => {
    cy.apiRequest('GET', '/stocks').then((resp) => {
      expect(resp.status).to.eq(200);
      expect(resp.body.data).to.be.an('array');
    });
  });

  it('GET /api/products retourne une liste paginée', () => {
    cy.apiRequest('GET', '/products').then((resp) => {
      expect(resp.status).to.eq(200);
      expect(resp.body.success).to.be.true;
      expect(resp.body.data).to.be.an('array');
    });
  });

  it('GET /api/products/:id retourne le produit de test', () => {
    cy.apiRequest('GET', `/products/${testProduct._id}`).then((resp) => {
      expect(resp.status).to.eq(200);
      expect(resp.body.data.name).to.eq(testProduct.name);
    });
  });

  // ── Alertes stock ───────────────────────────────────────────────────────────

  it('GET /api/dashboard/stock-alerts retourne la structure attendue', () => {
    cy.apiRequest('GET', '/dashboard/stock-alerts').then((resp) => {
      expect(resp.status).to.eq(200);
      expect(resp.body.data).to.be.an('array');
      // Vérifier la structure de chaque alerte
      resp.body.data.forEach((alert) => {
        expect(alert).to.have.property('productName');
        expect(alert).to.have.property('quantite');
        expect(alert).to.have.property('seuil');
        expect(alert.severity).to.be.oneOf(['critical', 'warning']);
      });
    });
  });

  // ── Entrepôts ───────────────────────────────────────────────────────────────

  it('GET /api/warehouses retourne les entrepôts', () => {
    cy.apiRequest('GET', '/warehouses').then((resp) => {
      expect(resp.status).to.eq(200);
      expect(resp.body.data).to.be.an('array');
    });
  });

  // ── Mouvement de stock ──────────────────────────────────────────────────────

  it('l\'API refuse un mouvement de stock avec une quantité négative', () => {
    cy.apiRequest('POST', '/stocks/mouvement', {
      type: 'entree',
      product: testProduct._id,
      quantite: -5,
    }).then((resp) => {
      expect(resp.status).to.be.oneOf([400, 422]);
    });
  });

  // ── Dashboard alertes ───────────────────────────────────────────────────────

  it('le dashboard affiche le widget d\'alertes stock', () => {
    cy.visit('/');
    cy.url({ timeout: 10000 }).should('not.include', '/login');
    // Le widget Alertes stock doit être présent (heading ou badge)
    cy.contains('Alertes stock', { timeout: 10000, matchCase: false }).should('be.visible');
  });
});
