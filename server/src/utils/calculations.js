const { TVA_RATE } = require('../config/constants');

/**
 * Calculate line total before tax
 * @param {number} quantity - Quantity
 * @param {number} unitPrice - Unit price in FCFA
 * @param {number} discount - Discount percentage (0-100)
 * @returns {number} Line total HT (integer)
 */
const calculateLineHT = (quantity, unitPrice, discount = 0) => {
  const gross = quantity * unitPrice;
  const discountAmount = Math.round(gross * discount / 100);
  return Math.round(gross - discountAmount);
};

/**
 * Calculate TVA amount for a line
 * @param {number} amountHT - Amount before tax
 * @param {number} tvaRate - TVA rate (0 or 18)
 * @returns {number} TVA amount (integer)
 */
const calculateTVA = (amountHT, tvaRate = TVA_RATE) => {
  return Math.round(amountHT * tvaRate / 100);
};

/**
 * Calculate TTC from HT amount
 * @param {number} amountHT - Amount before tax
 * @param {number} tvaRate - TVA rate (0 or 18)
 * @returns {number} Amount TTC (integer)
 */
const calculateTTC = (amountHT, tvaRate = TVA_RATE) => {
  return amountHT + calculateTVA(amountHT, tvaRate);
};

/**
 * Calculate invoice totals from lines
 * @param {Array} lines - Invoice lines [{quantity, prixUnitaire, remise, tauxTVA}]
 * @returns {Object} {totalHT, totalTVA, totalTTC, lines with computed amounts}
 */
const calculateInvoiceTotals = (lines) => {
  let totalHT = 0;
  let totalTVA = 0;

  const computedLines = lines.map((line) => {
    const lineHT = calculateLineHT(line.quantite, line.prixUnitaire, line.remise || 0);
    const lineTVA = calculateTVA(lineHT, line.tauxTVA != null ? line.tauxTVA : TVA_RATE);
    const lineTTC = lineHT + lineTVA;

    totalHT += lineHT;
    totalTVA += lineTVA;

    return {
      ...line,
      montantHT: lineHT,
      montantTVA: lineTVA,
      montantTTC: lineTTC,
    };
  });

  return {
    totalHT,
    totalTVA,
    totalTTC: totalHT + totalTVA,
    lines: computedLines,
  };
};

/**
 * Calculate CUMP (Cout Unitaire Moyen Pondere) after a new stock entry
 * @param {number} currentQty - Current stock quantity
 * @param {number} currentValue - Current stock total value
 * @param {number} newQty - Quantity entering stock
 * @param {number} newUnitCost - Unit cost of new entry
 * @returns {Object} {newCUMP, newTotalQty, newTotalValue}
 */
const calculateCUMP = (currentQty, currentValue, newQty, newUnitCost) => {
  const newTotalQty = currentQty + newQty;
  const newTotalValue = currentValue + Math.round(newQty * newUnitCost);

  const newCUMP = newTotalQty > 0 ? Math.round(newTotalValue / newTotalQty) : 0;

  return {
    newCUMP,
    newTotalQty,
    newTotalValue,
  };
};

module.exports = {
  calculateLineHT,
  calculateTVA,
  calculateTTC,
  calculateInvoiceTotals,
  calculateCUMP,
};
