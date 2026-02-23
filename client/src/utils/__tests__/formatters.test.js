import {
  formatMoney,
  formatDate,
  formatDateTime,
  formatPercent,
  formatPhone,
  truncate,
} from '../formatters';

describe('formatters', () => {
  describe('formatMoney', () => {
    it('formats positive amounts correctly', () => {
      expect(formatMoney(1500000)).toBe('1 500 000 FCFA');
      expect(formatMoney(500)).toBe('500 FCFA');
      expect(formatMoney(999999999)).toBe('999 999 999 FCFA');
    });

    it('formats zero correctly', () => {
      expect(formatMoney(0)).toBe('0 FCFA');
    });

    it('handles null and undefined', () => {
      expect(formatMoney(null)).toBe('0 FCFA');
      expect(formatMoney(undefined)).toBe('0 FCFA');
    });

    it('handles NaN', () => {
      expect(formatMoney(NaN)).toBe('0 FCFA');
      expect(formatMoney('not a number')).toBe('0 FCFA');
    });

    it('rounds decimal values', () => {
      expect(formatMoney(1500.75)).toBe('1 501 FCFA');
      expect(formatMoney(1500.25)).toBe('1 500 FCFA');
    });

    it('formats small amounts', () => {
      expect(formatMoney(1)).toBe('1 FCFA');
      expect(formatMoney(99)).toBe('99 FCFA');
    });

    it('uses French number formatting with spaces', () => {
      expect(formatMoney(1000)).toBe('1 000 FCFA');
      expect(formatMoney(10000)).toBe('10 000 FCFA');
      expect(formatMoney(100000)).toBe('100 000 FCFA');
    });
  });

  describe('formatDate', () => {
    it('formats valid Date object', () => {
      const date = new Date('2026-02-15T10:30:00');
      expect(formatDate(date)).toBe('15/02/2026');
    });

    it('formats valid date string', () => {
      expect(formatDate('2026-02-15')).toBe('15/02/2026');
      expect(formatDate('2026-12-31T23:59:59')).toBe('31/12/2026');
    });

    it('returns empty string for null', () => {
      expect(formatDate(null)).toBe('');
    });

    it('returns empty string for undefined', () => {
      expect(formatDate(undefined)).toBe('');
    });

    it('returns empty string for empty string', () => {
      expect(formatDate('')).toBe('');
    });

    it('formats dates with leading zeros', () => {
      expect(formatDate('2026-01-01')).toBe('01/01/2026');
      expect(formatDate('2026-03-05')).toBe('05/03/2026');
    });
  });

  describe('formatDateTime', () => {
    it('formats valid datetime with time', () => {
      const date = new Date('2026-02-15T14:30:00');
      const result = formatDateTime(date);
      expect(result).toContain('15/02/2026');
      expect(result).toContain('14:30');
    });

    it('formats date string with time', () => {
      const result = formatDateTime('2026-12-31T23:45:00');
      expect(result).toContain('31/12/2026');
      expect(result).toContain('23:45');
    });

    it('returns empty string for null', () => {
      expect(formatDateTime(null)).toBe('');
    });

    it('returns empty string for undefined', () => {
      expect(formatDateTime(undefined)).toBe('');
    });

    it('returns empty string for empty string', () => {
      expect(formatDateTime('')).toBe('');
    });
  });

  describe('formatPercent', () => {
    it('formats percentage values', () => {
      expect(formatPercent(18)).toBe('18%');
      expect(formatPercent(0)).toBe('0%');
      expect(formatPercent(100)).toBe('100%');
    });

    it('handles decimal percentages', () => {
      expect(formatPercent(18.5)).toBe('18.5%');
      expect(formatPercent(0.5)).toBe('0.5%');
    });

    it('handles null and undefined', () => {
      expect(formatPercent(null)).toBe('0%');
      expect(formatPercent(undefined)).toBe('0%');
    });

    it('handles NaN', () => {
      expect(formatPercent(NaN)).toBe('0%');
      expect(formatPercent('not a number')).toBe('0%');
    });

    it('handles negative percentages', () => {
      expect(formatPercent(-5)).toBe('-5%');
    });
  });

  describe('formatPhone', () => {
    it('formats Senegalese phone numbers', () => {
      expect(formatPhone('+221771234567')).toBe('+221 77 123 45 67');
      expect(formatPhone('+221331234567')).toBe('+221 33 123 45 67');
    });

    it('formats phone numbers with existing spaces', () => {
      expect(formatPhone('+221 77 123 45 67')).toBe('+221 77 123 45 67');
    });

    it('returns empty string for null', () => {
      expect(formatPhone(null)).toBe('');
    });

    it('returns empty string for undefined', () => {
      expect(formatPhone(undefined)).toBe('');
    });

    it('returns empty string for empty string', () => {
      expect(formatPhone('')).toBe('');
    });
  });

  describe('truncate', () => {
    it('truncates text longer than maxLength', () => {
      const longText = 'This is a very long text that should be truncated';
      expect(truncate(longText, 20)).toBe('This is a very long ...');
    });

    it('does not truncate text shorter than maxLength', () => {
      const shortText = 'Short text';
      expect(truncate(shortText, 20)).toBe('Short text');
    });

    it('uses default maxLength of 50', () => {
      const text = 'This is a text that is exactly fifty characters long!';
      const result = truncate(text);
      expect(result).toBe('This is a text that is exactly fifty characters ...');
    });

    it('returns original text when exactly at maxLength', () => {
      const text = 'Exactly twenty chars';
      expect(truncate(text, 20)).toBe('Exactly twenty chars');
    });

    it('returns empty string for null', () => {
      expect(truncate(null)).toBe('');
    });

    it('returns empty string for undefined', () => {
      expect(truncate(undefined)).toBe('');
    });

    it('returns empty string for empty string', () => {
      expect(truncate('')).toBe('');
    });

    it('adds ellipsis correctly', () => {
      expect(truncate('Hello World', 5)).toBe('Hello...');
    });
  });
});
