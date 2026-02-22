import React from 'react';
import { formatMoney } from '../../utils/formatters';

/**
 * FCFA amount display component
 * @param {Object} props
 * @param {number} props.amount - Amount to display
 * @param {string} props.size - Size: 'sm'|'md'|'lg' (default: 'md')
 * @param {boolean} props.positive - Show in green for positive values
 * @param {boolean} props.negative - Show in red for negative values
 */
const MoneyDisplay = ({ amount, size = 'md', positive = false, negative = false }) => {
  const getFontSize = () => {
    switch (size) {
      case 'sm':
        return '0.875rem';
      case 'lg':
        return '1.5rem';
      case 'md':
      default:
        return '1rem';
    }
  };

  const getColor = () => {
    if (positive) return '#059669';
    if (negative) return '#dc2626';
    return 'inherit';
  };

  return (
    <span
      style={{
        fontFamily: 'monospace',
        fontSize: getFontSize(),
        color: getColor(),
        fontWeight: size === 'lg' ? 'bold' : 'normal',
      }}
    >
      {formatMoney(amount)}
    </span>
  );
};

export default MoneyDisplay;
