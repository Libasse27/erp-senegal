import React from 'react';
import { render, screen } from '@testing-library/react';
import StatusBadge from '../StatusBadge';

describe('StatusBadge', () => {
  describe('Document statuses', () => {
    it('renders brouillon status with secondary variant', () => {
      render(<StatusBadge status="brouillon" type="document" />);
      const badge = screen.getByText('Brouillon');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('badge', 'bg-secondary');
    });

    it('renders validee status with success variant', () => {
      render(<StatusBadge status="validee" type="document" />);
      const badge = screen.getByText('Validée');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('badge', 'bg-success');
    });

    it('renders valide status with success variant', () => {
      render(<StatusBadge status="valide" type="document" />);
      const badge = screen.getByText('Validé');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('badge', 'bg-success');
    });

    it('renders envoyee status with info variant', () => {
      render(<StatusBadge status="envoyee" type="document" />);
      const badge = screen.getByText('Envoyée');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('badge', 'bg-info');
    });

    it('renders annulee status with danger variant', () => {
      render(<StatusBadge status="annulee" type="document" />);
      const badge = screen.getByText('Annulée');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('badge', 'bg-danger');
    });
  });

  describe('Payment statuses', () => {
    it('renders non_payee status', () => {
      render(<StatusBadge status="non_payee" type="payment" />);
      const badge = screen.getByText('Non payée');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('badge', 'bg-warning');
    });

    it('renders payee status', () => {
      render(<StatusBadge status="payee" type="payment" />);
      const badge = screen.getByText('Payée');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('badge', 'bg-success');
    });

    it('renders partiellement_payee status', () => {
      render(<StatusBadge status="partiellement_payee" type="payment" />);
      const badge = screen.getByText('Partiellement payée');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('badge', 'bg-warning');
    });

    it('renders en_retard status', () => {
      render(<StatusBadge status="en_retard" type="payment" />);
      const badge = screen.getByText('En retard');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('badge', 'bg-danger');
    });
  });

  describe('Quote statuses', () => {
    it('renders accepte status', () => {
      render(<StatusBadge status="accepte" type="quote" />);
      const badge = screen.getByText('Accepté');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('badge', 'bg-success');
    });

    it('renders refuse status', () => {
      render(<StatusBadge status="refuse" type="quote" />);
      const badge = screen.getByText('Refusé');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('badge', 'bg-danger');
    });

    it('renders expire status', () => {
      render(<StatusBadge status="expire" type="quote" />);
      const badge = screen.getByText('Expiré');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('badge', 'bg-dark');
    });

    it('renders converti status', () => {
      render(<StatusBadge status="converti" type="quote" />);
      const badge = screen.getByText('Converti');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('badge', 'bg-primary');
    });
  });

  describe('Order statuses', () => {
    it('renders confirmee status', () => {
      render(<StatusBadge status="confirmee" type="order" />);
      const badge = screen.getByText('Confirmée');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('badge', 'bg-primary');
    });

    it('renders en_cours status', () => {
      render(<StatusBadge status="en_cours" type="order" />);
      const badge = screen.getByText('En cours');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('badge', 'bg-info');
    });

    it('renders livree status', () => {
      render(<StatusBadge status="livree" type="order" />);
      const badge = screen.getByText('Livrée');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('badge', 'bg-success');
    });

    it('renders partiellement_livree status', () => {
      render(<StatusBadge status="partiellement_livree" type="order" />);
      const badge = screen.getByText('Partiellement livrée');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('badge', 'bg-warning');
    });
  });

  describe('Edge cases', () => {
    it('renders unknown status with default variant', () => {
      render(<StatusBadge status="unknown_status" type="document" />);
      const badge = screen.getByText('unknown_status');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('badge', 'bg-secondary');
    });

    it('renders Inconnu when status is null', () => {
      render(<StatusBadge status={null} type="document" />);
      const badge = screen.getByText('Inconnu');
      expect(badge).toBeInTheDocument();
    });

    it('handles case-insensitive status values', () => {
      render(<StatusBadge status="BROUILLON" type="document" />);
      const badge = screen.getByText('Brouillon');
      expect(badge).toBeInTheDocument();
    });
  });
});
