/**
 * Convert a number to French words (for invoice amounts)
 * Handles FCFA amounts (integers only, no decimals)
 * @param {number} n - The number to convert
 * @returns {string} The number in French words
 */
const numberToWords = (n) => {
  if (n === 0) return 'zero';
  if (n < 0) return `moins ${numberToWords(-n)}`;

  n = Math.round(n);

  const units = [
    '', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept',
    'huit', 'neuf', 'dix', 'onze', 'douze', 'treize', 'quatorze',
    'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf',
  ];

  const tens = [
    '', '', 'vingt', 'trente', 'quarante', 'cinquante',
    'soixante', 'soixante', 'quatre-vingt', 'quatre-vingt',
  ];

  const convertBelow100 = (num) => {
    if (num < 20) return units[num];

    const tenIndex = Math.floor(num / 10);
    const unitPart = num % 10;

    // Special French counting: 70-79 uses soixante-dix, 90-99 uses quatre-vingt-dix
    if (tenIndex === 7 || tenIndex === 9) {
      const base = tens[tenIndex];
      const remainder = num - tenIndex * 10 + 10;
      if (remainder === 11 && tenIndex === 7) {
        return `${base} et onze`;
      }
      return `${base}-${units[remainder]}`;
    }

    if (unitPart === 0) {
      if (tenIndex === 8) return 'quatre-vingts';
      return tens[tenIndex];
    }

    if (unitPart === 1 && tenIndex !== 8) {
      return `${tens[tenIndex]} et un`;
    }

    return `${tens[tenIndex]}-${units[unitPart]}`;
  };

  const convertBelow1000 = (num) => {
    if (num < 100) return convertBelow100(num);

    const hundreds = Math.floor(num / 100);
    const remainder = num % 100;

    let result = '';
    if (hundreds === 1) {
      result = 'cent';
    } else {
      result = `${units[hundreds]} cent`;
    }

    if (remainder === 0) {
      if (hundreds > 1) result += 's';
      return result;
    }

    return `${result} ${convertBelow100(remainder)}`;
  };

  const scales = [
    { value: 1000000000000, singular: 'billion', plural: 'billions' },
    { value: 1000000000, singular: 'milliard', plural: 'milliards' },
    { value: 1000000, singular: 'million', plural: 'millions' },
    { value: 1000, singular: 'mille', plural: 'mille' },
  ];

  let result = '';
  let remaining = n;

  for (const scale of scales) {
    const count = Math.floor(remaining / scale.value);
    if (count > 0) {
      remaining %= scale.value;

      if (scale.value === 1000) {
        if (count === 1) {
          result += 'mille ';
        } else {
          result += `${convertBelow1000(count)} mille `;
        }
      } else {
        if (count === 1) {
          result += `un ${scale.singular} `;
        } else {
          result += `${convertBelow1000(count)} ${scale.plural} `;
        }
      }
    }
  }

  if (remaining > 0) {
    result += convertBelow1000(remaining);
  }

  return result.trim();
};

/**
 * Format amount in words with currency for invoices
 * @param {number} amount - Amount in FCFA
 * @returns {string} e.g., "un million cinq cent mille francs CFA"
 */
const amountToWords = (amount) => {
  const words = numberToWords(Math.round(amount));
  return `${words} francs CFA`;
};

module.exports = {
  numberToWords,
  amountToWords,
};
