const { CURRENCY_SYMBOL } = require('../config/constants');

/**
 * Formater un montant en FCFA
 * @param {number} amount - Montant a formater
 * @returns {string} Montant formate (ex: "1 250 000 FCFA")
 */
const formatMoney = (amount) => {
  if (amount === null || amount === undefined) return `0 ${CURRENCY_SYMBOL}`;
  const formatted = Math.round(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${formatted} ${CURRENCY_SYMBOL}`;
};

/**
 * Formater une date au format francais
 * @param {Date|string} date - Date a formater
 * @returns {string} Date formatee (ex: "15/01/2024")
 */
const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

/**
 * Formater une date avec heure au format francais
 * @param {Date|string} date - Date a formater
 * @returns {string} Date formatee (ex: "15/01/2024 14:30")
 */
const formatDateTime = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Formater un pourcentage
 * @param {number} value - Valeur a formater
 * @returns {string} Pourcentage formate (ex: "18%")
 */
const formatPercent = (value) => {
  if (value === null || value === undefined) return '0%';
  return `${value}%`;
};

module.exports = {
  formatMoney,
  formatDate,
  formatDateTime,
  formatPercent,
};
