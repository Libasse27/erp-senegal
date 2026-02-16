/**
 * Format an amount in FCFA
 * @param {number} amount
 * @returns {string} Formatted amount (e.g. "1 500 000 FCFA")
 */
export const formatMoney = (amount) => {
  if (amount == null || isNaN(amount)) return '0 FCFA';
  return (
    new Intl.NumberFormat('fr-FR', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.round(amount)) + ' FCFA'
  );
};

/**
 * Format a date in French format
 * @param {Date|string} date
 * @returns {string} Formatted date (e.g. "15/02/2026")
 */
export const formatDate = (date) => {
  if (!date) return '';
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date));
};

/**
 * Format a datetime in French format
 * @param {Date|string} date
 * @returns {string} Formatted datetime (e.g. "15/02/2026 14:30")
 */
export const formatDateTime = (date) => {
  if (!date) return '';
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
};

/**
 * Format a percentage
 * @param {number} value
 * @returns {string} Formatted percentage (e.g. "18%")
 */
export const formatPercent = (value) => {
  if (value == null || isNaN(value)) return '0%';
  return `${value}%`;
};

/**
 * Format a phone number
 * @param {string} phone
 * @returns {string} Formatted phone number
 */
export const formatPhone = (phone) => {
  if (!phone) return '';
  return phone.replace(/(\+221)\s?(\d{2})\s?(\d{3})\s?(\d{2})\s?(\d{2})/, '$1 $2 $3 $4 $5');
};

/**
 * Truncate text with ellipsis
 * @param {string} text
 * @param {number} maxLength
 * @returns {string}
 */
export const truncate = (text, maxLength = 50) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};
