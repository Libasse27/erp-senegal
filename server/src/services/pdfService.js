const puppeteer = require('puppeteer');
const Handlebars = require('handlebars');
const fs = require('fs');
const path = require('path');
const logger = require('../config/logger');

// Register Handlebars helpers
Handlebars.registerHelper('formatMontant', (montant) => {
  if (montant == null) return '0';
  return new Intl.NumberFormat('fr-FR').format(montant);
});

Handlebars.registerHelper('formatDate', (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
});

Handlebars.registerHelper('eq', (a, b) => a === b);

Handlebars.registerHelper('add', (a, b) => (a || 0) + (b || 0));

Handlebars.registerHelper('multiply', (a, b) => Math.round((a || 0) * (b || 0)));

Handlebars.registerHelper('inc', (val) => (val || 0) + 1);

Handlebars.registerHelper('formatPercent', (val) => {
  if (val == null) return '0%';
  return `${val}%`;
});

Handlebars.registerHelper('numberToWords', (montant) => {
  if (montant == null || isNaN(montant)) return '';
  const n = Math.round(montant);
  if (n === 0) return 'Zéro franc CFA';

  const units = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf',
    'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
  const tens = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante', 'quatre-vingt', 'quatre-vingt'];

  const convert = (num) => {
    if (num === 0) return '';
    if (num < 20) return units[num];
    if (num < 100) {
      const t = Math.floor(num / 10);
      const u = num % 10;
      if (t === 7) return 'soixante-' + units[10 + u];
      if (t === 9) return 'quatre-vingt-' + (u === 0 ? '' : units[u]);
      return tens[t] + (u === 1 && t !== 8 ? '-et-un' : u > 0 ? '-' + units[u] : (t === 8 ? 's' : ''));
    }
    if (num < 1000) {
      const h = Math.floor(num / 100);
      const r = num % 100;
      return (h === 1 ? 'cent' : units[h] + ' cent') + (r > 0 ? ' ' + convert(r) : (h > 1 ? 's' : ''));
    }
    if (num < 1000000) {
      const m = Math.floor(num / 1000);
      const r = num % 1000;
      return (m === 1 ? 'mille' : convert(m) + ' mille') + (r > 0 ? ' ' + convert(r) : '');
    }
    if (num < 1000000000) {
      const m = Math.floor(num / 1000000);
      const r = num % 1000000;
      return convert(m) + ' million' + (m > 1 ? 's' : '') + (r > 0 ? ' ' + convert(r) : '');
    }
    const b = Math.floor(num / 1000000000);
    const r = num % 1000000000;
    return convert(b) + ' milliard' + (b > 1 ? 's' : '') + (r > 0 ? ' ' + convert(r) : '');
  };

  const words = convert(n);
  return words.charAt(0).toUpperCase() + words.slice(1) + ' franc' + (n > 1 ? 's' : '') + ' CFA';
});

// Cache compiled templates
const templateCache = {};

const getTemplate = (templateName) => {
  if (templateCache[templateName]) return templateCache[templateName];

  const templatePath = path.join(__dirname, '..', 'templates', 'pdf', `${templateName}.hbs`);
  const source = fs.readFileSync(templatePath, 'utf8');
  const compiled = Handlebars.compile(source);
  templateCache[templateName] = compiled;
  return compiled;
};

/**
 * Generate PDF buffer from a Handlebars template
 * @param {string} templateName - Template file name (without .hbs)
 * @param {Object} data - Data to pass to the template
 * @returns {Promise<Buffer>} PDF buffer
 */
const generatePDF = async (templateName, data) => {
  let browser;
  try {
    const template = getTemplate(templateName);
    const html = template(data);

    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' },
      printBackground: true,
    });

    return pdfBuffer;
  } catch (error) {
    logger.error(`Erreur generation PDF (${templateName}): ${error.message}`);
    throw error;
  } finally {
    if (browser) await browser.close();
  }
};

/**
 * Generate facture PDF
 * @param {Object} facture - Facture document (populated)
 * @param {Object} company - Company info
 * @returns {Promise<Buffer>} PDF buffer
 */
const generateFacturePDF = async (facture, company) => {
  return generatePDF('facture', {
    facture: facture.toObject ? facture.toObject() : facture,
    company: company.toObject ? company.toObject() : company,
    generatedAt: new Date(),
  });
};

/**
 * Generate devis PDF
 * @param {Object} devis - Devis document (populated)
 * @param {Object} company - Company info
 * @returns {Promise<Buffer>} PDF buffer
 */
const generateDevisPDF = async (devis, company) => {
  return generatePDF('devis', {
    devis: devis.toObject ? devis.toObject() : devis,
    company: company.toObject ? company.toObject() : company,
    generatedAt: new Date(),
  });
};

/**
 * Generate bon de livraison PDF
 * @param {Object} bonLivraison - BonLivraison document (populated)
 * @param {Object} company - Company info
 * @returns {Promise<Buffer>} PDF buffer
 */
const generateBonLivraisonPDF = async (bonLivraison, company) => {
  return generatePDF('bon-livraison', {
    bonLivraison: bonLivraison.toObject ? bonLivraison.toObject() : bonLivraison,
    company: company.toObject ? company.toObject() : company,
    generatedAt: new Date(),
  });
};

/**
 * Generate commande PDF
 * @param {Object} commande - Commande document (populated)
 * @param {Object} company - Company info
 * @returns {Promise<Buffer>} PDF buffer
 */
const generateCommandePDF = async (commande, company) => {
  return generatePDF('commande', {
    commande: commande.toObject ? commande.toObject() : commande,
    company: company.toObject ? company.toObject() : company,
    generatedAt: new Date(),
  });
};

module.exports = {
  generatePDF,
  generateFacturePDF,
  generateDevisPDF,
  generateBonLivraisonPDF,
  generateCommandePDF,
};
