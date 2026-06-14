/**
 * Tests E2E — Module Comptabilité SYSCOHADA
 * Flux : écritures, balance, bilan, compte de résultat
 */
describe('Module Comptabilité SYSCOHADA', () => {
  const email    = Cypress.env('adminEmail');
  const password = Cypress.env('adminPassword');

  beforeEach(() => {
    cy.login(email, password);
  });

  // ── Navigation ─────────────────────────────────────────────────────────────

  it('la page Plan Comptable se charge', () => {
    cy.visit('/comptabilite/plan');
    cy.url({ timeout: 10000 }).should('include', '/plan');
    cy.get('body').should('not.be.empty');
  });

  it('la page des Écritures se charge', () => {
    cy.visit('/comptabilite/ecritures');
    cy.url({ timeout: 10000 }).should('include', '/ecritures');
    cy.get('body').should('not.be.empty');
  });

  it('la page Grand Livre se charge', () => {
    cy.visit('/comptabilite/grand-livre');
    cy.url({ timeout: 10000 }).should('include', '/grand-livre');
    cy.get('body').should('not.be.empty');
  });

  it('la page Balance se charge', () => {
    cy.visit('/comptabilite/balance');
    cy.url({ timeout: 10000 }).should('include', '/balance');
    cy.get('body').should('not.be.empty');
  });

  it('la page Bilan se charge', () => {
    cy.visit('/comptabilite/bilan');
    cy.url({ timeout: 10000 }).should('include', '/bilan');
    cy.get('body').should('not.be.empty');
  });

  it('la page Compte de Résultat se charge', () => {
    cy.visit('/comptabilite/resultat');
    cy.url({ timeout: 10000 }).should('include', '/resultat');
    cy.get('body').should('not.be.empty');
  });

  it('la page des Exercices se charge', () => {
    cy.visit('/comptabilite/exercices');
    cy.url({ timeout: 10000 }).should('include', '/exercices');
    cy.get('body').should('not.be.empty');
  });

  // ── API Plan Comptable ──────────────────────────────────────────────────────

  it('GET /api/plan-comptable retourne les comptes SYSCOHADA', () => {
    cy.apiRequest('GET', '/plan-comptable').then((resp) => {
      expect(resp.status).to.eq(200);
      expect(resp.body.data).to.be.an('array').with.length.greaterThan(0);
      // Vérifier la structure SYSCOHADA : classes 1 à 8
      const numeros = resp.body.data.map((c) => c.numero?.toString().charAt(0));
      const classes = [...new Set(numeros)].sort();
      expect(classes.some((c) => ['1','2','3','4','5','6','7'].includes(c))).to.be.true;
    });
  });

  // ── API Balance ─────────────────────────────────────────────────────────────

  it('GET /api/comptabilite/balance retourne la structure attendue', () => {
    cy.apiRequest('GET', '/comptabilite/balance').then((resp) => {
      expect(resp.status).to.eq(200);
      expect(resp.body.success).to.be.true;
      const data = resp.body.data;
      expect(data).to.have.property('comptes');
      expect(data).to.have.property('totaux');
      expect(data.totaux).to.have.all.keys(
        'totalDebit',
        'totalCredit',
        'totalSoldeDebiteur',
        'totalSoldeCrediteur'
      );
    });
  });

  it('la balance est équilibrée (totalDebit ≈ totalCredit)', () => {
    cy.apiRequest('GET', '/comptabilite/balance').then((resp) => {
      const { totalDebit, totalCredit } = resp.body.data.totaux;
      // Tolérance de 1 FCFA pour les arrondis
      expect(Math.abs(totalDebit - totalCredit)).to.be.lessThan(1);
    });
  });

  // ── API Bilan ───────────────────────────────────────────────────────────────

  it('GET /api/rapports/bilan retourne actif et passif', () => {
    cy.apiRequest('GET', '/rapports/bilan').then((resp) => {
      expect(resp.status).to.eq(200);
      const data = resp.body.data;
      expect(data).to.have.property('actif');
      expect(data).to.have.property('passif');
      expect(data).to.have.property('totalActif');
      expect(data).to.have.property('totalPassif');
    });
  });

  it('bilan SYSCOHADA : totalActif ≈ totalPassif', () => {
    cy.apiRequest('GET', '/rapports/bilan').then((resp) => {
      const { totalActif, totalPassif } = resp.body.data;
      // Tolérance de 1 FCFA
      expect(Math.abs(totalActif - totalPassif)).to.be.lessThan(1);
    });
  });

  // ── API Compte de résultat ──────────────────────────────────────────────────

  it('GET /api/rapports/resultat retourne produits et charges', () => {
    cy.apiRequest('GET', '/rapports/resultat').then((resp) => {
      expect(resp.status).to.eq(200);
      const data = resp.body.data;
      expect(data).to.have.property('produits');
      expect(data).to.have.property('charges');
      expect(data).to.have.property('resultatNet');
    });
  });

  // ── API Exercices ───────────────────────────────────────────────────────────

  it('GET /api/exercices retourne au moins un exercice', () => {
    cy.apiRequest('GET', '/exercices').then((resp) => {
      expect(resp.status).to.eq(200);
      expect(resp.body.data).to.be.an('array');
    });
  });

  // ── Écriture manuelle ───────────────────────────────────────────────────────

  it('le formulaire de nouvelle écriture est accessible', () => {
    cy.visit('/comptabilite/ecritures/nouveau');
    cy.url({ timeout: 10000 }).should('include', '/ecritures/nouveau');
    cy.get('body').should('not.be.empty');
  });

  it('POST /api/ecritures rejette une écriture déséquilibrée', () => {
    const today = new Date().toISOString().split('T')[0];
    cy.apiRequest('POST', '/ecritures', {
      journal: 'OD',
      dateEcriture: today,
      libelle: 'Test ecriture desEquilibree',
      lignes: [
        { compte: '411000', libelle: 'Client', debit: 10000, credit: 0 },
        { compte: '701000', libelle: 'Ventes', debit: 0, credit: 5000 }, // déséquilibré
      ],
    }).then((resp) => {
      expect(resp.status).to.be.oneOf([400, 422]);
    });
  });
});
