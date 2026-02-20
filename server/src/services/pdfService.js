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

module.exports = {
  generatePDF,
  generateFacturePDF,
  generateDevisPDF,
  generateBonLivraisonPDF,
};
