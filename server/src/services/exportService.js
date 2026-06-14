/**
 * exportService.js — Export Excel (xlsx) des états comptables et listes métier
 *
 * Utilise la librairie xlsx (déjà installée).
 * Retourne un Buffer prêt à envoyer en réponse HTTP.
 */
const XLSX = require('xlsx');
const comptabiliteService = require('./comptabiliteService');
const Facture = require('../models/Facture');

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
  const lignes = await comptabiliteService.getBalance(options);

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
      l.compteNumero,
      l.compteLibelle,
      l.classe,
      fmt(l.totalDebit),
      fmt(l.totalCredit),
      fmt(l.soldeDebiteur),
      fmt(l.soldeCrediteur),
    ]),
  ];

  // Ligne de totalisation
  const totalD  = lignes.reduce((s, l) => s + (l.totalDebit  || 0), 0);
  const totalC  = lignes.reduce((s, l) => s + (l.totalCredit || 0), 0);
  const totalSD = lignes.reduce((s, l) => s + (l.soldeDebiteur  || 0), 0);
  const totalSC = lignes.reduce((s, l) => s + (l.soldeCrediteur || 0), 0);
  rows.push(['', 'TOTAUX', '', fmt(totalD), fmt(totalC), fmt(totalSD), fmt(totalSC)]);

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

  const charges = cr.charges?.lignes || [];
  const produits = cr.produits?.lignes || [];
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

module.exports = {
  exportBalanceExcel,
  exportGrandLivreExcel,
  exportCompteResultatExcel,
  exportFacturesExcel,
};
