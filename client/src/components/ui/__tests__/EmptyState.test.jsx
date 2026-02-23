import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import EmptyState from '../EmptyState';
import { FiInbox } from 'react-icons/fi';

describe('EmptyState', () => {
  describe('Content rendering', () => {
    it('renders title', () => {
      render(
        <EmptyState
          title="Aucun client trouvé"
          message="Commencez par créer votre premier client"
        />
      );

      expect(screen.getByText('Aucun client trouvé')).toBeInTheDocument();
    });

    it('renders message', () => {
      render(
        <EmptyState
          title="Aucun client trouvé"
          message="Commencez par créer votre premier client"
        />
      );

      expect(screen.getByText('Commencez par créer votre premier client')).toBeInTheDocument();
    });

    it('renders icon when provided', () => {
      const { container } = render(
        <EmptyState
          icon={FiInbox}
          title="Aucun client trouvé"
          message="Commencez par créer votre premier client"
        />
      );

      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('does not render icon when not provided', () => {
      const { container } = render(
        <EmptyState
          title="Aucun client trouvé"
          message="Commencez par créer votre premier client"
        />
      );

      const icon = container.querySelector('svg');
      expect(icon).not.toBeInTheDocument();
    });
  });

  describe('Action button', () => {
    it('renders action button when actionLabel and onAction are provided', () => {
      const mockOnAction = jest.fn();

      render(
        <EmptyState
          title="Aucun client trouvé"
          message="Commencez par créer votre premier client"
          actionLabel="Créer un client"
          onAction={mockOnAction}
        />
      );

      expect(screen.getByRole('button', { name: 'Créer un client' })).toBeInTheDocument();
    });

    it('does not render action button when actionLabel is not provided', () => {
      const mockOnAction = jest.fn();

      render(
        <EmptyState
          title="Aucun client trouvé"
          message="Commencez par créer votre premier client"
          onAction={mockOnAction}
        />
      );

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('does not render action button when onAction is not provided', () => {
      render(
        <EmptyState
          title="Aucun client trouvé"
          message="Commencez par créer votre premier client"
          actionLabel="Créer un client"
        />
      );

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('calls onAction when button is clicked', () => {
      const mockOnAction = jest.fn();

      render(
        <EmptyState
          title="Aucun client trouvé"
          message="Commencez par créer votre premier client"
          actionLabel="Créer un client"
          onAction={mockOnAction}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: 'Créer un client' }));
      expect(mockOnAction).toHaveBeenCalledTimes(1);
    });

    it('renders button with primary variant', () => {
      const mockOnAction = jest.fn();

      render(
        <EmptyState
          title="Aucun client trouvé"
          message="Commencez par créer votre premier client"
          actionLabel="Créer un client"
          onAction={mockOnAction}
        />
      );

      const button = screen.getByRole('button', { name: 'Créer un client' });
      expect(button).toHaveClass('btn-primary');
    });
  });

  describe('Styling', () => {
    it('applies text-center class', () => {
      const { container } = render(
        <EmptyState
          title="Aucun client trouvé"
          message="Commencez par créer votre premier client"
        />
      );

      const wrapper = container.querySelector('.text-center');
      expect(wrapper).toBeInTheDocument();
    });

    it('applies text-muted class to title', () => {
      render(
        <EmptyState
          title="Aucun client trouvé"
          message="Commencez par créer votre premier client"
        />
      );

      const title = screen.getByText('Aucun client trouvé');
      expect(title).toHaveClass('text-muted');
    });

    it('applies text-muted class to message', () => {
      render(
        <EmptyState
          title="Aucun client trouvé"
          message="Commencez par créer votre premier client"
        />
      );

      const message = screen.getByText('Commencez par créer votre premier client');
      expect(message).toHaveClass('text-muted');
    });
  });

  describe('Complete example', () => {
    it('renders all elements together', () => {
      const mockOnAction = jest.fn();

      const { container } = render(
        <EmptyState
          icon={FiInbox}
          title="Aucune facture"
          message="Vous n'avez pas encore créé de facture"
          actionLabel="Créer une facture"
          onAction={mockOnAction}
        />
      );

      expect(container.querySelector('svg')).toBeInTheDocument();
      expect(screen.getByText('Aucune facture')).toBeInTheDocument();
      expect(screen.getByText("Vous n'avez pas encore créé de facture")).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Créer une facture' })).toBeInTheDocument();
    });
  });
});
