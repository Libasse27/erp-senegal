import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ConfirmModal from '../ConfirmModal';

describe('ConfirmModal', () => {
  const mockOnHide = jest.fn();
  const mockOnConfirm = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Visibility', () => {
    it('renders modal when show is true', () => {
      render(
        <ConfirmModal
          show={true}
          onHide={mockOnHide}
          onConfirm={mockOnConfirm}
        />
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('does not render modal when show is false', () => {
      render(
        <ConfirmModal
          show={false}
          onHide={mockOnHide}
          onConfirm={mockOnConfirm}
        />
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('Content rendering', () => {
    it('displays default title', () => {
      render(
        <ConfirmModal
          show={true}
          onHide={mockOnHide}
          onConfirm={mockOnConfirm}
        />
      );

      expect(screen.getByText('Confirmation')).toBeInTheDocument();
    });

    it('displays custom title', () => {
      render(
        <ConfirmModal
          show={true}
          onHide={mockOnHide}
          onConfirm={mockOnConfirm}
          title="Supprimer le client"
        />
      );

      expect(screen.getByText('Supprimer le client')).toBeInTheDocument();
    });

    it('displays default message', () => {
      render(
        <ConfirmModal
          show={true}
          onHide={mockOnHide}
          onConfirm={mockOnConfirm}
        />
      );

      expect(screen.getByText('Êtes-vous sûr de vouloir continuer?')).toBeInTheDocument();
    });

    it('displays custom message', () => {
      render(
        <ConfirmModal
          show={true}
          onHide={mockOnHide}
          onConfirm={mockOnConfirm}
          message="Cette action est irréversible."
        />
      );

      expect(screen.getByText('Cette action est irréversible.')).toBeInTheDocument();
    });

    it('displays default confirm button label', () => {
      render(
        <ConfirmModal
          show={true}
          onHide={mockOnHide}
          onConfirm={mockOnConfirm}
        />
      );

      expect(screen.getByRole('button', { name: 'Confirmer' })).toBeInTheDocument();
    });

    it('displays custom confirm button label', () => {
      render(
        <ConfirmModal
          show={true}
          onHide={mockOnHide}
          onConfirm={mockOnConfirm}
          confirmLabel="Supprimer"
        />
      );

      expect(screen.getByRole('button', { name: 'Supprimer' })).toBeInTheDocument();
    });

    it('displays cancel button', () => {
      render(
        <ConfirmModal
          show={true}
          onHide={mockOnHide}
          onConfirm={mockOnConfirm}
        />
      );

      expect(screen.getByRole('button', { name: 'Annuler' })).toBeInTheDocument();
    });
  });

  describe('Button interactions', () => {
    it('calls onConfirm when confirm button is clicked', () => {
      render(
        <ConfirmModal
          show={true}
          onHide={mockOnHide}
          onConfirm={mockOnConfirm}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: 'Confirmer' }));
      expect(mockOnConfirm).toHaveBeenCalledTimes(1);
    });

    it('calls onHide when cancel button is clicked', () => {
      render(
        <ConfirmModal
          show={true}
          onHide={mockOnHide}
          onConfirm={mockOnConfirm}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));
      expect(mockOnHide).toHaveBeenCalledTimes(1);
    });

    it('does not call onConfirm when loading', () => {
      render(
        <ConfirmModal
          show={true}
          onHide={mockOnHide}
          onConfirm={mockOnConfirm}
          isLoading={true}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: 'Chargement...' }));
      expect(mockOnConfirm).not.toHaveBeenCalled();
    });
  });

  describe('Loading state', () => {
    it('shows loading spinner when isLoading is true', () => {
      render(
        <ConfirmModal
          show={true}
          onHide={mockOnHide}
          onConfirm={mockOnConfirm}
          isLoading={true}
        />
      );

      expect(screen.getByText('Chargement...')).toBeInTheDocument();
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('disables both buttons when loading', () => {
      render(
        <ConfirmModal
          show={true}
          onHide={mockOnHide}
          onConfirm={mockOnConfirm}
          isLoading={true}
        />
      );

      expect(screen.getByRole('button', { name: 'Annuler' })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Chargement...' })).toBeDisabled();
    });

    it('enables buttons when not loading', () => {
      render(
        <ConfirmModal
          show={true}
          onHide={mockOnHide}
          onConfirm={mockOnConfirm}
          isLoading={false}
        />
      );

      expect(screen.getByRole('button', { name: 'Annuler' })).not.toBeDisabled();
      expect(screen.getByRole('button', { name: 'Confirmer' })).not.toBeDisabled();
    });
  });

  describe('Button variant', () => {
    it('applies default danger variant to confirm button', () => {
      render(
        <ConfirmModal
          show={true}
          onHide={mockOnHide}
          onConfirm={mockOnConfirm}
        />
      );

      const confirmButton = screen.getByRole('button', { name: 'Confirmer' });
      expect(confirmButton).toHaveClass('btn-danger');
    });

    it('applies custom variant to confirm button', () => {
      render(
        <ConfirmModal
          show={true}
          onHide={mockOnHide}
          onConfirm={mockOnConfirm}
          confirmVariant="primary"
        />
      );

      const confirmButton = screen.getByRole('button', { name: 'Confirmer' });
      expect(confirmButton).toHaveClass('btn-primary');
    });
  });

  describe('Modal close behavior', () => {
    it('has close button in header', () => {
      render(
        <ConfirmModal
          show={true}
          onHide={mockOnHide}
          onConfirm={mockOnConfirm}
        />
      );

      const closeButton = screen.getByLabelText('Close');
      expect(closeButton).toBeInTheDocument();
    });
  });
});
