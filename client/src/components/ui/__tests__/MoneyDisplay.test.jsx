import React from 'react';
import { render, screen } from '@testing-library/react';
import MoneyDisplay from '../MoneyDisplay';

describe('MoneyDisplay', () => {
  describe('Amount formatting', () => {
    it('renders formatted FCFA amount', () => {
      render(<MoneyDisplay amount={1500000} />);
      expect(screen.getByText('1 500 000 FCFA')).toBeInTheDocument();
    });

    it('renders zero amount', () => {
      render(<MoneyDisplay amount={0} />);
      expect(screen.getByText('0 FCFA')).toBeInTheDocument();
    });

    it('renders small amounts', () => {
      render(<MoneyDisplay amount={500} />);
      expect(screen.getByText('500 FCFA')).toBeInTheDocument();
    });

    it('renders large amounts', () => {
      render(<MoneyDisplay amount={999999999} />);
      expect(screen.getByText('999 999 999 FCFA')).toBeInTheDocument();
    });

    it('handles null amount', () => {
      render(<MoneyDisplay amount={null} />);
      expect(screen.getByText('0 FCFA')).toBeInTheDocument();
    });

    it('handles undefined amount', () => {
      render(<MoneyDisplay amount={undefined} />);
      expect(screen.getByText('0 FCFA')).toBeInTheDocument();
    });
  });

  describe('Size variants', () => {
    it('renders small size with correct font size', () => {
      const { container } = render(<MoneyDisplay amount={1000} size="sm" />);
      const span = container.querySelector('span');
      expect(span).toHaveStyle({ fontSize: '0.875rem' });
    });

    it('renders medium size with correct font size', () => {
      const { container } = render(<MoneyDisplay amount={1000} size="md" />);
      const span = container.querySelector('span');
      expect(span).toHaveStyle({ fontSize: '1rem' });
    });

    it('renders large size with correct font size', () => {
      const { container } = render(<MoneyDisplay amount={1000} size="lg" />);
      const span = container.querySelector('span');
      expect(span).toHaveStyle({ fontSize: '1.5rem', fontWeight: 'bold' });
    });

    it('defaults to medium size when size is not specified', () => {
      const { container } = render(<MoneyDisplay amount={1000} />);
      const span = container.querySelector('span');
      expect(span).toHaveStyle({ fontSize: '1rem' });
    });
  });

  describe('Color variants', () => {
    it('renders positive amount in green', () => {
      const { container } = render(<MoneyDisplay amount={1000} positive />);
      const span = container.querySelector('span');
      expect(span).toHaveStyle({ color: '#059669' });
    });

    it('renders negative amount in red', () => {
      const { container } = render(<MoneyDisplay amount={1000} negative />);
      const span = container.querySelector('span');
      expect(span).toHaveStyle({ color: '#dc2626' });
    });

    it('renders default color when no color prop is provided', () => {
      const { container } = render(<MoneyDisplay amount={1000} />);
      const span = container.querySelector('span');
      expect(span).toHaveStyle({ color: 'inherit' });
    });

    it('prioritizes positive color over negative when both are provided', () => {
      const { container } = render(<MoneyDisplay amount={1000} positive negative />);
      const span = container.querySelector('span');
      expect(span).toHaveStyle({ color: '#059669' });
    });
  });

  describe('Styling', () => {
    it('applies monospace font family', () => {
      const { container } = render(<MoneyDisplay amount={1000} />);
      const span = container.querySelector('span');
      expect(span).toHaveStyle({ fontFamily: 'monospace' });
    });

    it('applies bold font weight for large size', () => {
      const { container } = render(<MoneyDisplay amount={1000} size="lg" />);
      const span = container.querySelector('span');
      expect(span).toHaveStyle({ fontWeight: 'bold' });
    });

    it('applies normal font weight for small and medium sizes', () => {
      const { container: containerSm } = render(<MoneyDisplay amount={1000} size="sm" />);
      const spanSm = containerSm.querySelector('span');
      expect(spanSm).toHaveStyle({ fontWeight: 'normal' });

      const { container: containerMd } = render(<MoneyDisplay amount={1000} size="md" />);
      const spanMd = containerMd.querySelector('span');
      expect(spanMd).toHaveStyle({ fontWeight: 'normal' });
    });
  });
});
