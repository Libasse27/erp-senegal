/**
 * importService.js — Import Excel/CSV pour clients, fournisseurs, produits
 *
 * Reçoit un Buffer (multer memoryStorage), parse avec xlsx,
 * valide chaque ligne et insère / met à jour les documents MongoDB.
 * Retourne { imported, updated, skipped, errors: [{row, field, message}] }
 */
const XLSX = require('xlsx');
const Client      = require('../models/Client');
const Fournisseur = require('../models/Fournisseur');
const Product     = require('../models/Product');
const Category    = require('../models/Category');
const logger      = require('../config/logger');

// ─── Helpers ──────────────────────────────────────────────────────────────────

const parseBuffer = (buffer) => {
  const wb = XLSX.read(buffer, { type: 'buffer' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json(ws, { defval: '' });
};

const str = (v) => (v != null ? String(v).trim() : '');
const num = (v) => {
  const n = parseFloat(String(v).replace(/\s/g, '').replace(',', '.'));
  return isNaN(n) ? 0 : n;
};
const isValidEmail = (e) => !e || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

// ─── Templates Excel ──────────────────────────────────────────────────────────

const TEMPLATES = {
  clients: {
    sheetName: 'Clients',
    headers: ['Type (professionnel/particulier)', 'Raison Sociale / Nom *', 'Prénom', 'Email', 'Téléphone', 'NINEA', 'Ville', 'Adresse'],
    example1: ['professionnel', 'Entreprise Diallo SARL', '', 'contact@diallo.sn', '33 123 45 67', 'SN-12345', 'Dakar', 'Rue 10, Point E'],
    example2: ['particulier', 'Ndiaye', 'Fatou', 'fatou@gmail.com', '77 987 65 43', '', 'Thiès', ''],
  },
  fournisseurs: {
    sheetName: 'Fournisseurs',
    headers: ['Raison Sociale *', 'Email', 'Téléphone', 'NINEA', 'RCCM', 'Ville', 'Adresse', 'Délai paiement (jours)'],
    example1: ['Fournisseur Alpha SA', 'alpha@supplier.sn', '33 890 12 34', 'SN-98765', 'SN-DKR-2024-B-1234', 'Dakar', 'Zone Industrielle', '30'],
    example2: ['Import Export Diop', '', '77 112 23 34', '', '', 'Rufisque', '', '45'],
  },
  produits: {
    sheetName: 'Produits',
    headers: ['Référence', 'Nom *', 'Catégorie (nom exact)', 'Prix Achat (FCFA)', 'Prix Vente (FCFA) *', 'TVA % (0 ou 18)', 'Stock Minimum', 'Unité'],
    example1: ['REF-001', 'Ordinateur Portable Dell', 'Informatique', '350000', '450000', '18', '2', 'Unité'],
    example2: ['', 'Stylo Bic', 'Fournitures', '150', '250', '18', '50', 'Unité'],
  },
};

const generateTemplate = (type) => {
  const tpl = TEMPLATES[type];
  if (!tpl) throw new Error(`Type d'import inconnu: ${type}`);

  const rows = [tpl.headers, tpl.example1, tpl.example2];
  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Auto-width
  const colWidths = tpl.headers.map((h, i) =>
    Math.max(h.length, tpl.example1[i]?.length || 0, tpl.example2[i]?.length || 0, 12)
  );
  ws['!cols'] = colWidths.map((w) => ({ wch: Math.min(w + 2, 40) }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, tpl.sheetName);
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
};

// ─── Import Clients ───────────────────────────────────────────────────────────

const importClients = async (buffer, companyId, userId) => {
  const rows = parseBuffer(buffer);
  let imported = 0, updated = 0, skipped = 0;
  const errors = [];

  for (let i = 0; i < rows.length; i++) {
    const rowNum = i + 2; // ligne Excel (1=header, so data starts at 2)
    const row = rows[i];

    const keys = Object.keys(row);
    const type          = str(row[keys[0]] || 'professionnel').toLowerCase();
    const raisonSociale = str(row[keys[1]]);
    const firstName     = str(row[keys[2]]);
    const email         = str(row[keys[3]]).toLowerCase();
    const phone         = str(row[keys[4]]);
    const ninea         = str(row[keys[5]]);
    const city          = str(row[keys[6]]);
    const street        = str(row[keys[7]]);

    // Validation
    if (!raisonSociale) {
      errors.push({ row: rowNum, field: 'Raison Sociale / Nom', message: 'Champ obligatoire manquant' });
      continue;
    }
    if (!['professionnel', 'particulier'].includes(type)) {
      errors.push({ row: rowNum, field: 'Type', message: `Type invalide "${type}". Valeurs: professionnel, particulier` });
      continue;
    }
    if (email && !isValidEmail(email)) {
      errors.push({ row: rowNum, field: 'Email', message: `Email invalide: ${email}` });
      continue;
    }

    try {
      const docData = {
        companyId,
        type,
        email: email || undefined,
        phone: phone || undefined,
        ninea: ninea || undefined,
        address: (city || street) ? { city, street } : undefined,
        createdBy: userId,
        modifiedBy: userId,
      };

      if (type === 'professionnel') {
        docData.raisonSociale = raisonSociale;
        docData.firstName = firstName || undefined;
      } else {
        docData.lastName  = raisonSociale;
        docData.firstName = firstName || undefined;
      }

      // Upsert by email (if provided) or raisonSociale+companyId
      const matchQuery = email
        ? { companyId, email }
        : { companyId, raisonSociale, type };

      const existing = await Client.findOne(matchQuery);
      if (existing) {
        Object.assign(existing, docData);
        await existing.save();
        updated++;
      } else {
        await Client.create(docData);
        imported++;
      }
    } catch (err) {
      errors.push({ row: rowNum, field: '-', message: err.message });
      skipped++;
    }
  }

  logger.info(`[Import] Clients — imported:${imported} updated:${updated} errors:${errors.length}`);
  return { imported, updated, skipped, errors, total: rows.length };
};

// ─── Import Fournisseurs ──────────────────────────────────────────────────────

const importFournisseurs = async (buffer, companyId, userId) => {
  const rows = parseBuffer(buffer);
  let imported = 0, updated = 0, skipped = 0;
  const errors = [];

  for (let i = 0; i < rows.length; i++) {
    const rowNum = i + 2;
    const row = rows[i];
    const keys = Object.keys(row);

    const raisonSociale  = str(row[keys[0]]);
    const email          = str(row[keys[1]]).toLowerCase();
    const phone          = str(row[keys[2]]);
    const ninea          = str(row[keys[3]]);
    const rccm           = str(row[keys[4]]);
    const city           = str(row[keys[5]]);
    const street         = str(row[keys[6]]);
    const delaiPaiement  = num(row[keys[7]]) || 30;

    if (!raisonSociale) {
      errors.push({ row: rowNum, field: 'Raison Sociale', message: 'Champ obligatoire manquant' });
      continue;
    }
    if (email && !isValidEmail(email)) {
      errors.push({ row: rowNum, field: 'Email', message: `Email invalide: ${email}` });
      continue;
    }

    try {
      const docData = {
        companyId,
        raisonSociale,
        email: email || undefined,
        phone: phone || undefined,
        ninea: ninea || undefined,
        rccm:  rccm  || undefined,
        delaiPaiement,
        address: (city || street) ? { city, street } : undefined,
        modifiedBy: userId,
      };

      const matchQuery = email
        ? { companyId, email }
        : { companyId, raisonSociale };

      const existing = await Fournisseur.findOne(matchQuery);
      if (existing) {
        Object.assign(existing, docData);
        await existing.save();
        updated++;
      } else {
        await Fournisseur.create({ ...docData, createdBy: userId });
        imported++;
      }
    } catch (err) {
      errors.push({ row: rowNum, field: '-', message: err.message });
      skipped++;
    }
  }

  logger.info(`[Import] Fournisseurs — imported:${imported} updated:${updated} errors:${errors.length}`);
  return { imported, updated, skipped, errors, total: rows.length };
};

// ─── Import Produits ──────────────────────────────────────────────────────────

const importProduits = async (buffer, companyId, userId) => {
  const rows = parseBuffer(buffer);
  let imported = 0, updated = 0, skipped = 0;
  const errors = [];

  // Cache des catégories (nom → id)
  const categories = await Category.find({ companyId, isActive: true }).lean();
  const catMap = {};
  categories.forEach((c) => { catMap[c.name.toLowerCase()] = c._id; });

  for (let i = 0; i < rows.length; i++) {
    const rowNum = i + 2;
    const row = rows[i];
    const keys = Object.keys(row);

    const reference   = str(row[keys[0]]);
    const name        = str(row[keys[1]]);
    const catNom      = str(row[keys[2]]).toLowerCase();
    const prixAchat   = num(row[keys[3]]);
    const prixVente   = num(row[keys[4]]);
    const tauxTVA     = num(row[keys[5]]) === 0 ? 0 : 18;
    const stockMin    = num(row[keys[6]]) || 0;
    const unite       = str(row[keys[7]]) || 'Unité';

    if (!name) {
      errors.push({ row: rowNum, field: 'Nom', message: 'Nom du produit obligatoire' });
      continue;
    }
    if (prixVente <= 0) {
      errors.push({ row: rowNum, field: 'Prix Vente', message: 'Prix de vente obligatoire (> 0)' });
      continue;
    }

    let categorieId = null;
    if (catNom) {
      categorieId = catMap[catNom];
      if (!categorieId) {
        // Créer la catégorie à la volée
        const newCat = await Category.create({ name: row[keys[2]].trim(), companyId, createdBy: userId });
        categorieId = newCat._id;
        catMap[catNom] = categorieId;
      }
    }

    if (!categorieId) {
      // Utiliser la première catégorie disponible ou créer "Général"
      if (categories.length > 0) {
        categorieId = categories[0]._id;
      } else {
        const genCat = await Category.create({ name: 'Général', companyId, createdBy: userId });
        categorieId = genCat._id;
        categories.push(genCat);
      }
    }

    try {
      const docData = {
        companyId,
        name,
        categorie: categorieId,
        prixAchat: prixAchat || undefined,
        prixVente,
        tauxTVA,
        stockMinimum: stockMin,
        unite,
        modifiedBy: userId,
      };

      const matchQuery = reference
        ? { companyId, $or: [{ reference }, { code: reference }] }
        : { companyId, name };

      const existing = await Product.findOne(matchQuery);
      if (existing) {
        Object.assign(existing, docData);
        if (reference) existing.reference = reference;
        await existing.save();
        updated++;
      } else {
        await Product.create({ ...docData, reference: reference || undefined, createdBy: userId });
        imported++;
      }
    } catch (err) {
      errors.push({ row: rowNum, field: '-', message: err.message });
      skipped++;
    }
  }

  logger.info(`[Import] Produits — imported:${imported} updated:${updated} errors:${errors.length}`);
  return { imported, updated, skipped, errors, total: rows.length };
};

module.exports = {
  generateTemplate,
  importClients,
  importFournisseurs,
  importProduits,
};
