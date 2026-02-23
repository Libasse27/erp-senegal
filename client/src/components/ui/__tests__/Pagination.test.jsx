import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Pagination from '../Pagination';

describe('Pagination', () => {
  const mockMeta = {
    total: 100,
    page: 1,
    limit: 10,
    totalPages: 10,
    hasNextPage: true,
    hasPrevPage: false,
  };

  const mockOnPageChange = jest.fn();
  const mockOnLimitChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders page info text correctly', () => {
      render(
        <Pagination
          meta={mockMeta}
          onPageChange={mockOnPageChange}
          onLimitChange={mockOnLimitChange}
        />
      );

      expect(screen.getByText(/Affichage 1-10 sur 100/)).toBeInTheDocument();
    });

    it('renders page size selector', () => {
      render(
        <Pagination
          meta={mockMeta}
          onPageChange={mockOnPageChange}
          onLimitChange={mockOnLimitChange}
        />
      );

      const select = screen.getByDisplayValue('10');
      expect(select).toBeInTheDocument();
      expect(screen.getByText('par page')).toBeInTheDocument();
    });

    it('renders pagination buttons', () => {
      render(
        <Pagination
          meta={mockMeta}
          onPageChange={mockOnPageChange}
          onLimitChange={mockOnLimitChange}
        />
      );

      expect(screen.getByLabelText('First')).toBeInTheDocument();
      expect(screen.getByLabelText('Previous')).toBeInTheDocument();
      expect(screen.getByLabelText('Next')).toBeInTheDocument();
      expect(screen.getByLabelText('Last')).toBeInTheDocument();
    });

    it('returns null when meta is not provided', () => {
      const { container } = render(
        <Pagination
          meta={null}
          onPageChange={mockOnPageChange}
          onLimitChange={mockOnLimitChange}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('returns null when totalPages is 0', () => {
      const emptyMeta = { ...mockMeta, totalPages: 0 };
      const { container } = render(
        <Pagination
          meta={emptyMeta}
          onPageChange={mockOnPageChange}
          onLimitChange={mockOnLimitChange}
        />
      );

      expect(container.firstChild).toBeNull();
    });
  });

  describe('Page info calculation', () => {
    it('calculates correct start and end for first page', () => {
      render(
        <Pagination
          meta={{ ...mockMeta, page: 1 }}
          onPageChange={mockOnPageChange}
          onLimitChange={mockOnLimitChange}
        />
      );

      expect(screen.getByText(/Affichage 1-10 sur 100/)).toBeInTheDocument();
    });

    it('calculates correct start and end for middle page', () => {
      render(
        <Pagination
          meta={{ ...mockMeta, page: 5 }}
          onPageChange={mockOnPageChange}
          onLimitChange={mockOnLimitChange}
        />
      );

      expect(screen.getByText(/Affichage 41-50 sur 100/)).toBeInTheDocument();
    });

    it('calculates correct start and end for last page', () => {
      render(
        <Pagination
          meta={{ ...mockMeta, page: 10, totalPages: 10, hasNextPage: false }}
          onPageChange={mockOnPageChange}
          onLimitChange={mockOnLimitChange}
        />
      );

      expect(screen.getByText(/Affichage 91-100 sur 100/)).toBeInTheDocument();
    });

    it('handles partial last page correctly', () => {
      render(
        <Pagination
          meta={{
            total: 95,
            page: 10,
            limit: 10,
            totalPages: 10,
            hasNextPage: false,
            hasPrevPage: true,
          }}
          onPageChange={mockOnPageChange}
          onLimitChange={mockOnLimitChange}
        />
      );

      expect(screen.getByText(/Affichage 91-95 sur 95/)).toBeInTheDocument();
    });
  });

  describe('Page navigation', () => {
    it('calls onPageChange when clicking next button', () => {
      render(
        <Pagination
          meta={mockMeta}
          onPageChange={mockOnPageChange}
          onLimitChange={mockOnLimitChange}
        />
      );

      fireEvent.click(screen.getByLabelText('Next'));
      expect(mockOnPageChange).toHaveBeenCalledWith(2);
    });

    it('calls onPageChange when clicking previous button', () => {
      render(
        <Pagination
          meta={{ ...mockMeta, page: 5, hasPrevPage: true }}
          onPageChange={mockOnPageChange}
          onLimitChange={mockOnLimitChange}
        />
      );

      fireEvent.click(screen.getByLabelText('Previous'));
      expect(mockOnPageChange).toHaveBeenCalledWith(4);
    });

    it('calls onPageChange when clicking first button', () => {
      render(
        <Pagination
          meta={{ ...mockMeta, page: 5, hasPrevPage: true }}
          onPageChange={mockOnPageChange}
          onLimitChange={mockOnLimitChange}
        />
      );

      fireEvent.click(screen.getByLabelText('First'));
      expect(mockOnPageChange).toHaveBeenCalledWith(1);
    });

    it('calls onPageChange when clicking last button', () => {
      render(
        <Pagination
          meta={{ ...mockMeta, page: 1 }}
          onPageChange={mockOnPageChange}
          onLimitChange={mockOnLimitChange}
        />
      );

      fireEvent.click(screen.getByLabelText('Last'));
      expect(mockOnPageChange).toHaveBeenCalledWith(10);
    });

    it('disables previous and first buttons on first page', () => {
      render(
        <Pagination
          meta={mockMeta}
          onPageChange={mockOnPageChange}
          onLimitChange={mockOnLimitChange}
        />
      );

      expect(screen.getByLabelText('First')).toBeDisabled();
      expect(screen.getByLabelText('Previous')).toBeDisabled();
    });

    it('disables next and last buttons on last page', () => {
      render(
        <Pagination
          meta={{ ...mockMeta, page: 10, hasNextPage: false, hasPrevPage: true }}
          onPageChange={mockOnPageChange}
          onLimitChange={mockOnLimitChange}
        />
      );

      expect(screen.getByLabelText('Next')).toBeDisabled();
      expect(screen.getByLabelText('Last')).toBeDisabled();
    });
  });

  describe('Limit change', () => {
    it('calls onLimitChange when selecting different page size', () => {
      render(
        <Pagination
          meta={mockMeta}
          onPageChange={mockOnPageChange}
          onLimitChange={mockOnLimitChange}
        />
      );

      const select = screen.getByDisplayValue('10');
      fireEvent.change(select, { target: { value: '25' } });

      expect(mockOnLimitChange).toHaveBeenCalledWith(25);
    });

    it('renders all page size options', () => {
      render(
        <Pagination
          meta={mockMeta}
          onPageChange={mockOnPageChange}
          onLimitChange={mockOnLimitChange}
        />
      );

      const select = screen.getByDisplayValue('10');
      expect(select).toContainHTML('<option value="10">10</option>');
      expect(select).toContainHTML('<option value="25">25</option>');
      expect(select).toContainHTML('<option value="50">50</option>');
      expect(select).toContainHTML('<option value="100">100</option>');
    });
  });
});
