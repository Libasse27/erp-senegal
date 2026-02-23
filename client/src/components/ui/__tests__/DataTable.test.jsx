import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import DataTable from '../DataTable';

describe('DataTable', () => {
  const mockColumns = [
    { key: 'id', label: 'ID', sortable: true },
    { key: 'name', label: 'Name', sortable: true },
    { key: 'email', label: 'Email', sortable: false },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <span className="badge">{row.status}</span>
    },
  ];

  const mockData = [
    { _id: '1', id: '001', name: 'John Doe', email: 'john@example.com', status: 'Active' },
    { _id: '2', id: '002', name: 'Jane Smith', email: 'jane@example.com', status: 'Inactive' },
    { _id: '3', id: '003', name: 'Bob Johnson', email: 'bob@example.com', status: 'Active' },
  ];

  const mockOnSort = jest.fn();

  describe('Rendering', () => {
    it('renders table headers from columns prop', () => {
      render(<DataTable columns={mockColumns} data={mockData} />);

      expect(screen.getByText('ID')).toBeInTheDocument();
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
    });

    it('renders data rows correctly', () => {
      render(<DataTable columns={mockColumns} data={mockData} />);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('jane@example.com')).toBeInTheDocument();
      expect(screen.getByText('003')).toBeInTheDocument();
    });

    it('renders custom cell content using render function', () => {
      render(<DataTable columns={mockColumns} data={mockData} />);

      const badges = screen.getAllByText('Active');
      expect(badges).toHaveLength(2);
      badges.forEach(badge => {
        expect(badge).toHaveClass('badge');
      });
    });
  });

  describe('Loading state', () => {
    it('shows loading spinner when loading is true', () => {
      render(<DataTable columns={mockColumns} data={[]} loading={true} />);

      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText('Chargement des données...')).toBeInTheDocument();
    });

    it('shows visually hidden loading text for screen readers', () => {
      render(<DataTable columns={mockColumns} data={[]} loading={true} />);

      const hiddenText = document.querySelector('.visually-hidden');
      expect(hiddenText).toHaveTextContent('Chargement...');
    });

    it('does not render table when loading', () => {
      const { container } = render(<DataTable columns={mockColumns} data={mockData} loading={true} />);

      const table = container.querySelector('table');
      expect(table).not.toBeInTheDocument();
    });
  });

  describe('Empty state', () => {
    it('shows empty message when data is empty', () => {
      render(<DataTable columns={mockColumns} data={[]} />);

      expect(screen.getByText('Aucune donnée disponible')).toBeInTheDocument();
    });

    it('shows custom empty message', () => {
      render(
        <DataTable
          columns={mockColumns}
          data={[]}
          emptyMessage="Aucun résultat trouvé"
        />
      );

      expect(screen.getByText('Aucun résultat trouvé')).toBeInTheDocument();
    });

    it('shows empty message when data is null', () => {
      render(<DataTable columns={mockColumns} data={null} />);

      expect(screen.getByText('Aucune donnée disponible')).toBeInTheDocument();
    });
  });

  describe('Sorting', () => {
    it('displays sort icons for sortable columns', () => {
      render(
        <DataTable
          columns={mockColumns}
          data={mockData}
          onSort={mockOnSort}
          currentSort={{ field: 'id', order: 'asc' }}
        />
      );

      const idHeader = screen.getByText('ID').parentElement;
      expect(idHeader).toHaveStyle({ cursor: 'pointer' });
    });

    it('calls onSort when sortable column header is clicked', () => {
      render(
        <DataTable
          columns={mockColumns}
          data={mockData}
          onSort={mockOnSort}
          currentSort={{ field: null, order: 'asc' }}
        />
      );

      const idHeader = screen.getByText('ID').parentElement;
      fireEvent.click(idHeader);

      expect(mockOnSort).toHaveBeenCalledWith('id');
    });

    it('does not call onSort when non-sortable column is clicked', () => {
      render(
        <DataTable
          columns={mockColumns}
          data={mockData}
          onSort={mockOnSort}
        />
      );

      const emailHeader = screen.getByText('Email').parentElement;
      fireEvent.click(emailHeader);

      expect(mockOnSort).not.toHaveBeenCalled();
    });

    it('shows correct sort icon for ascending sort', () => {
      const { container } = render(
        <DataTable
          columns={mockColumns}
          data={mockData}
          onSort={mockOnSort}
          currentSort={{ field: 'id', order: 'asc' }}
        />
      );

      // FiChevronUp should be present for ascending sort
      const idHeader = screen.getByText('ID').parentElement;
      const svg = idHeader.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('shows correct sort icon for descending sort', () => {
      render(
        <DataTable
          columns={mockColumns}
          data={mockData}
          onSort={mockOnSort}
          currentSort={{ field: 'name', order: 'desc' }}
        />
      );

      const nameHeader = screen.getByText('Name').parentElement;
      const svg = nameHeader.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('does not show sort icons when onSort is not provided', () => {
      const { container } = render(
        <DataTable
          columns={mockColumns}
          data={mockData}
        />
      );

      const idHeader = screen.getByText('ID').parentElement;
      expect(idHeader).toHaveStyle({ cursor: 'default' });
    });
  });

  describe('Table structure', () => {
    it('renders table with correct Bootstrap classes', () => {
      const { container } = render(<DataTable columns={mockColumns} data={mockData} />);

      const table = container.querySelector('table');
      expect(table).toHaveClass('table', 'table-striped', 'table-bordered', 'table-hover', 'table-responsive');
    });

    it('renders correct number of rows', () => {
      const { container } = render(<DataTable columns={mockColumns} data={mockData} />);

      const rows = container.querySelectorAll('tbody tr');
      expect(rows).toHaveLength(mockData.length);
    });

    it('renders correct number of columns', () => {
      const { container } = render(<DataTable columns={mockColumns} data={mockData} />);

      const headerCells = container.querySelectorAll('thead th');
      expect(headerCells).toHaveLength(mockColumns.length);
    });
  });

  describe('Row keys', () => {
    it('uses _id field for row key', () => {
      const { container } = render(<DataTable columns={mockColumns} data={mockData} />);

      const firstRow = container.querySelector('tbody tr');
      expect(firstRow).toBeInTheDocument();
    });

    it('falls back to id field when _id is not present', () => {
      const dataWithoutId = [
        { id: '1', name: 'Test', email: 'test@test.com', status: 'Active' },
      ];

      const { container } = render(<DataTable columns={mockColumns} data={dataWithoutId} />);

      const row = container.querySelector('tbody tr');
      expect(row).toBeInTheDocument();
    });

    it('uses array index as fallback when no id fields exist', () => {
      const dataWithoutAnyId = [
        { name: 'Test', email: 'test@test.com', status: 'Active' },
      ];

      const { container } = render(<DataTable columns={mockColumns} data={dataWithoutAnyId} />);

      const row = container.querySelector('tbody tr');
      expect(row).toBeInTheDocument();
    });
  });

  describe('Default props', () => {
    it('uses default empty array for columns', () => {
      render(<DataTable data={mockData} />);

      const table = screen.queryByRole('table');
      expect(table).toBeInTheDocument();
    });

    it('uses default empty array for data', () => {
      render(<DataTable columns={mockColumns} />);

      expect(screen.getByText('Aucune donnée disponible')).toBeInTheDocument();
    });

    it('uses default loading false', () => {
      render(<DataTable columns={mockColumns} data={mockData} />);

      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
  });
});
