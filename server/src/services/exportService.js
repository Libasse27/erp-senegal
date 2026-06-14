/**
 * exportService.js — Export Excel (xlsx) des états comptables et listes métier
 *
 * Utilise la librairie xlsx (déjà installée).
 * Retourne un Buffer prêt à envoyer en réponse HTTP.
 */
const XLSX = require('xlsx');
const comptabiliteService = require('./comptabiliteService');
const Facture  = require('../models/Facture');
const Client   = require('../models/Client');
const Fournisseur = require('../models/Fournisseur');
const Product  = require('../models/Product');
const Stock    = require('../models/Stock');
const Payment  = require('../models/Payment');

const fmt = (n) => (n == null ? 0 : Math.round(n));

// ─── Utilitaires ──────────────────────────────────────────────────────────────

const buildWorkbook = (sheetName, rows) => {
  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName.substring(0, 31));
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
};

const autoWidth = (ws, rows) => {
  if (!rows || rows.length === 0) return;
  const colWidths = rows[0].map((_, i) =>
    Math.max(...rows.map((r) => (r[i] ? String(r[i]).length : 0)), 10)
  );
  ws['!cols'] = colWidths.map((w) => ({ wch: Math.min(w + 2, 50) }));
};

const buildWorkbookWithWidth = (sheetName, rows) => {
  const ws = XLSX.utils.aoa_to_sheet(rows);
  autoWidth(ws, rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName.substring(0, 31));
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
};

// ─── Balance Générale ─────────────────────────────────────────────────────────

/**
 * @param {string} companyId
 * @param {Object} options - exercice, dateFrom, dateTo
 * @returns {Buffer} xlsx
 */
const exportBalanceExcel = async (companyId, options = {}) => {
  const { comptes: lignes, totaux } = await comptabiliteService.getBalance(options);

  const header = [
    'N° Compte',
    'Libellé',
    'Classe',
    'Total Débit (FCFA)',
    'Total Crédit (FCFA)',
    'Solde Débiteur (FCFA)',
    'Solde Créditeur (FCFA)',
  ];

  const rows = [
    header,
    ...lignes.map((l) => [
      l.numero || l._id,
      l.libelle || l.compteLibelle,
      l.classe || '',
      fmt(l.totalDebit),
      fmt(l.totalCredit),
      fmt(l.soldeDebiteur),
      fmt(l.soldeCrediteur),
    ]),
  ];

  rows.push([
    '',
    'TOTAUX',
    '',
    fmt(totaux.totalDebit),
    fmt(totaux.totalCredit),
    fmt(totaux.totalSoldeDebiteur),
    fmt(totaux.totalSoldeCrediteur),
  ]);

  return buildWorkbookWithWidth('Balance', rows);
};

// ─── Grand Livre ──────────────────────────────────────────────────────────────

/**
 * @param {string} companyId
 * @param {string} compteNumero
 * @param {Object} options - exercice, dateFrom, dateTo
 * @returns {Buffer} xlsx
 */
const exportGrandLivreExcel = async (companyId, compteNumero, options = {}) => {
  const result = await comptabiliteService.getGrandLivre(compteNumero, options);

  const header = [
    'Date',
    'N° Pièce',
    'Libellé',
    'Journal',
    'Débit (FCFA)',
    'Crédit (FCFA)',
    'Solde cumulé (FCFA)',
  ];

  const mouvements = result.mouvements || [];
  const rows = [
    [`Grand Livre — Compte ${compteNumero} : ${result.compteLibelle || ''}`],
    [],
    header,
    ...mouvements.map((m) => [
      m.date ? new Date(m.date).toLocaleDateString('fr-FR') : '',
      m.piece || m.ecritureNumero || '',
      m.libelle || '',
      m.journal || m.journalCode || '',
      fmt(m.debit),
      fmt(m.credit),
      fmt(m.soldeCumule),
    ]),
  ];

  if (mouvements.length > 0) {
    rows.push([
      '', '', 'TOTAL', '',
      fmt(result.totalDebit),
      fmt(result.totalCredit),
      fmt(result.solde),
    ]);
  }

  return buildWorkbookWithWidth(`GL-${compteNumero}`, rows);
};

// ─── Compte de Résultat ───────────────────────────────────────────────────────

/**
 * @param {string} companyId
 * @param {Object} options - exercice, dateFrom, dateTo
 * @returns {Buffer} xlsx
 */
const exportCompteResultatExcel = async (companyId, options = {}) => {
  const cr = await comptabiliteService.getCompteResultat(options);

  const rows = [
    ['COMPTE DE RÉSULTAT'],
    ['(en FCFA — SYSCOHADA)'],
    [],
    ['CHARGES', 'Montant', '', 'PRODUITS', 'Montant'],
  ];

  const charges = cr.charges || [];
  const produits = cr.produits || [];
  const maxLen = Math.max(charges.length, produits.length);

  for (let i = 0; i < maxLen; i++) {
    const c = charges[i];
    const p = produits[i];
    rows.push([
      c ? c.compteLibelle || c.libelle || '' : '',
      c ? fmt(c.montant || c.solde) : '',
      '',
      p ? p.compteLibelle || p.libelle || '' : '',
      p ? fmt(p.montant || p.solde) : '',
    ]);
  }

  rows.push([]);
  rows.push(['TOTAL CHARGES', fmt(cr.charges?.total || cr.totalCharges), '', 'TOTAL PRODUITS', fmt(cr.produits?.total || cr.totalProduits)]);
  rows.push([]);

  const resultat = cr.resultatNet || 0;
  if (resultat >= 0) {
    rows.push(['', '', '', 'RÉSULTAT NET (Bénéfice)', fmt(resultat)]);
  } else {
    rows.push(['RÉSULTAT NET (Perte)', fmt(Math.abs(resultat)), '', '', '']);
  }

  return buildWorkbookWithWidth('Compte de Resultat', rows);
};

// ─── Bilan ────────────────────────────────────────────────────────────────────

/**
 * @param {string} companyId
 * @param {Object} options - exercice, dateFrom, dateTo
 * @returns {Buffer} xlsx
 */
const exportBilanExcel = async (companyId, options = {}) => {
  const bilan = await comptabiliteService.getBilan(options);

  const rows = [
    ['BILAN SYSCOHADA'],
    ['(en FCFA)'],
    [],
    ['ACTIF', 'Montant (FCFA)', '', 'PASSIF', 'Montant (FCFA)'],
  ];

  const flatActif = [
    ...((bilan.actif?.immobilisations || []).map((i) => ({ ...i, section: 'Actif Immobilisé (Cl. 2)' }))),
    ...((bilan.actif?.stocks || []).map((i) => ({ ...i, section: 'Stocks (Cl. 3)' }))),
    ...((bilan.actif?.creances || []).map((i) => ({ ...i, section: 'Créances (Cl. 4)' }))),
    ...((bilan.actif?.tresorerie || []).map((i) => ({ ...i, section: 'Trésorerie (Cl. 5)' }))),
  ];
  const flatPassif = [
    ...((bilan.passif?.capitaux || []).map((i) => ({ ...i, section: 'Capitaux Propres (Cl. 1)' }))),
    ...((bilan.passif?.dettes || []).map((i) => ({ ...i, section: 'Dettes (Cl. 4)' }))),
    ...((bilan.passif?.tresorerie || []).map((i) => ({ ...i, section: 'Passif Trésorerie (Cl. 5)' }))),
  ];
  const maxLen = Math.max(flatActif.length, flatPassif.length);

  for (let i = 0; i < maxLen; i++) {
    const a = flatActif[i];
    const p = flatPassif[i];
    rows.push([
      a ? a.compteLibelle || a._id || '' : '',
      a ? fmt(a.solde) : '',
      '',
      p ? p.compteLibelle || p._id || '' : '',
      p ? fmt(p.solde) : '',
    ]);
  }

  rows.push([]);
  rows.push(['TOTAL ACTIF', fmt(bilan.totalActif), '', 'TOTAL PASSIF', fmt(bilan.totalPassif)]);

  if (bilan.isEquilibre) {
    rows.push(['', '', '', 'Bilan équilibré', '']);
  } else {
    const ecart = Math.abs((bilan.totalActif || 0) - (bilan.totalPassif || 0));
    rows.push(['', '', '', `Écart : ${fmt(ecart)} FCFA`, '']);
  }

  return buildWorkbookWithWidth('Bilan', rows);
};

// ─── Liste des Factures ───────────────────────────────────────────────────────

/**
 * @param {string} companyId
 * @param {Object} filter - statut, dateFrom, dateTo, type
 * @returns {Buffer} xlsx
 */
const exportFacturesExcel = async (companyId, filter = {}) => {
  const query = { companyId, isActive: { $ne: false } };
  if (filter.statut) query.statut = filter.statut;
  if (filter.type)   query.type   = filter.type;
  if (filter.dateFrom || filter.dateTo) {
    query.dateFacture = {};
    if (filter.dateFrom) query.dateFacture.$gte = new Date(filter.dateFrom);
    if (filter.dateTo)   query.dateFacture.$lte = new Date(filter.dateTo);
  }

  const factures = await Facture.find(query)
    .populate('clientId', 'nom prenom raisonSociale')
    .sort({ dateFacture: -1 })
    .limit(5000)
    .lean();

  const header = [
    'N° Facture',
    'Date',
    'Client',
    'Type',
    'Statut',
    'Total HT (FCFA)',
    'TVA (FCFA)',
    'Total TTC (FCFA)',
    'Montant Payé (FCFA)',
    'Solde Restant (FCFA)',
  ];

  const rows = [
    header,
    ...factures.map((f) => {
      const clientNom = f.clientSnapshot?.nom
        || (f.clientId?.raisonSociale || `${f.clientId?.prenom || ''} ${f.clientId?.nom || ''}`.trim())
        || '';
      const paye = f.montantPaye || 0;
      const solde = (f.totalTTC || 0) - paye;
      return [
        f.numero || f.referenceInterne || '',
        f.dateFacture ? new Date(f.dateFacture).toLocaleDateString('fr-FR') : '',
        clientNom,
        f.type === 'avoir' ? 'Avoir' : 'Facture',
        f.statut || '',
        fmt(f.totalHT),
        fmt(f.totalTVA),
        fmt(f.totalTTC),
        fmt(paye),
        fmt(solde),
      ];
    }),
  ];

  // Ligne totaux
  const totalHT  = factures.reduce((s, f) => s + (f.totalHT  || 0), 0);
  const totalTVA = factures.reduce((s, f) => s + (f.totalTVA || 0), 0);
  const totalTTC = factures.reduce((s, f) => s + (f.totalTTC || 0), 0);
  rows.push(['', '', `${factures.length} facture(s)`, '', 'TOTAL', fmt(totalHT), fmt(totalTVA), fmt(totalTTC), '', '']);

  return buildWorkbookWithWidth('Factures', rows);
};

// ─── Clients ─────────────────────────────────────────────────────────────────

const exportClientsExcel = async (companyId, filter = {}) => {
  const query = { companyId, isActive: true };
  if (filter.type) query.type = filter.type;

  const clients = await Client.find(query).sort({ raisonSociale: 1, lastName: 1 }).limit(5000).lean();

  const header = ['Type', 'Raison Sociale / Nom', 'Prénom', 'Email', 'Téléphone', 'NINEA', 'Ville', 'Adresse', 'Solde (FCFA)'];
  const rows = [
    header,
    ...clients.map((c) => [
      c.type || 'professionnel',
      c.raisonSociale || c.lastName || '',
      c.firstName || '',
      c.email || '',
      c.phone || '',
      c.ninea || '',
      c.address?.city || '',
      c.address?.street || '',
      fmt(c.solde || 0),
    ]),
  ];

  return buildWorkbookWithWidth('Clients', rows);
};

// ─── Fournisseurs ─────────────────────────────────────────────────────────────

const exportFournisseursExcel = async (companyId, filter = {}) => {
  const query = { companyId, isActive: true };
  const fournisseurs = await Fournisseur.find(query).sort({ raisonSociale: 1 }).limit(5000).lean();

  const header = ['Raison Sociale', 'Email', 'Téléphone', 'NINEA', 'RCCM', 'Ville', 'Adresse', 'Délai paiement (j)'];
  const rows = [
    header,
    ...fournisseurs.map((f) => [
      f.raisonSociale || '',
      f.email || '',
      f.phone || '',
      f.ninea || '',
      f.rccm || '',
      f.address?.city || '',
      f.address?.street || '',
      f.delaiPaiement || 30,
    ]),
  ];

  return buildWorkbookWithWidth('Fournisseurs', rows);
};

// ─── Produits ─────────────────────────────────────────────────────────────────

const exportProduitsExcel = async (companyId, filter = {}) => {
  const query = { companyId, isActive: true };
  if (filter.categorie) query.categorie = filter.categorie;

  const products = await Product.find(query)
    .populate('categorie', 'name')
    .sort({ name: 1 })
    .limit(5000)
    .lean();

  const header = ['Référence', 'Nom', 'Catégorie', 'Prix Achat (FCFA)', 'Prix Vente (FCFA)', 'TVA (%)', 'Stock Min', 'Unité', 'Actif'];
  const rows = [
    header,
    ...products.map((p) => [
      p.reference || p.code || '',
      p.name || '',
      p.categorie?.name || '',
      fmt(p.prixAchat),
      fmt(p.prixVente),
      p.tauxTVA ?? 18,
      p.stockMinimum || 0,
      p.unite || 'Unité',
      p.isActive ? 'Oui' : 'Non',
    ]),
  ];

  return buildWorkbookWithWidth('Produits', rows);
};

// ─── Stocks ───────────────────────────────────────────────────────────────────

const exportStocksExcel = async (companyId, filter = {}) => {
  const query = { companyId, isActive: true };

  const stocks = await Stock.find(query)
    .populate('product', 'name reference code stockMinimum')
    .populate('warehouse', 'name code')
    .sort({ 'product.name': 1 })
    .limit(5000)
    .lean();

  const header = ['Référence', 'Produit', 'Dépôt', 'Quantité', 'CUMP (FCFA)', 'Valeur Stock (FCFA)', 'Stock Min', 'Statut'];
  const rows = [
    header,
    ...stocks.map((s) => {
      const seuil = s.product?.stockMinimum || 0;
      const statut = s.quantite <= 0 ? 'Rupture' : s.quantite <= seuil ? 'Faible' : 'OK';
      return [
        s.product?.reference || s.product?.code || '',
        s.product?.name || '',
        s.warehouse?.name || '',
        s.quantite || 0,
        fmt(s.cump),
        fmt(s.valeurStock || (s.quantite * s.cump)),
        seuil,
        statut,
      ];
    }),
  ];

  const totalValeur = stocks.reduce((acc, s) => acc + (s.valeurStock || s.quantite * s.cump || 0), 0);
  rows.push(['', `${stocks.length} article(s)`, '', '', 'Valeur totale', fmt(totalValeur), '', '']);

  return buildWorkbookWithWidth('Stocks', rows);
};

// ─── Paiements ────────────────────────────────────────────────────────────────

const exportPaiementsExcel = async (companyId, filter = {}) => {
  const query = { companyId, isActive: true, statut: 'valide' };
  if (filter.typePaiement) query.typePaiement = filter.typePaiement;
  if (filter.modePaiement) query.modePaiement = filter.modePaiement;
  if (filter.dateFrom || filter.dateTo) {
    query.datePaiement = {};
    if (filter.dateFrom) query.datePaiement.$gte = new Date(filter.dateFrom);
    if (filter.dateTo)   query.datePaiement.$lte = new Date(filter.dateTo);
  }

  const MODE_LABELS = {
    especes: 'Espèces', virement: 'Virement', cheque: 'Chèque',
    wave: 'Wave', orange_money: 'Orange Money', free_money: 'Free Money',
  };

  const paiements = await Payment.find(query)
    .populate('client', 'raisonSociale firstName lastName')
    .populate('fournisseur', 'raisonSociale')
    .populate('facture', 'numero')
    .sort({ datePaiement: -1 })
    .limit(5000)
    .lean();

  const header = ['N° Paiement', 'Date', 'Type', 'Tiers', 'Mode', 'Facture', 'Montant (FCFA)'];
  const rows = [
    header,
    ...paiements.map((p) => {
      const tiers = p.typePaiement === 'client'
        ? (p.client?.raisonSociale || `${p.client?.firstName || ''} ${p.client?.lastName || ''}`.trim() || '')
        : (p.fournisseur?.raisonSociale || '');
      return [
        p.numero || '',
        p.datePaiement ? new Date(p.datePaiement).toLocaleDateString('fr-FR') : '',
        p.typePaiement === 'client' ? 'Encaissement' : 'Décaissement',
        tiers,
        MODE_LABELS[p.modePaiement] || p.modePaiement || '',
        p.facture?.numero || '',
        fmt(p.montant),
      ];
    }),
  ];

  const total = paiements.reduce((s, p) => s + (p.montant || 0), 0);
  rows.push(['', `${paiements.length} paiement(s)`, '', '', '', 'TOTAL', fmt(total)]);

  return buildWorkbookWithWidth('Paiements', rows);
};

module.exports = {
  exportBalanceExcel,
  exportGrandLivreExcel,
  exportCompteResultatExcel,
  exportBilanExcel,
  exportFacturesExcel,
  exportClientsExcel,
  exportFournisseursExcel,
  exportProduitsExcel,
  exportStocksExcel,
  exportPaiementsExcel,
};
