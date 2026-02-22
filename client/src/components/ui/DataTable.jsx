import React from 'react';
import Table from 'react-bootstrap/Table';
import Spinner from 'react-bootstrap/Spinner';
import { FiChevronUp, FiChevronDown } from 'react-icons/fi';

/**
 * Reusable data table component with sorting support
 * @param {Object} props
 * @param {Array} props.columns - Array of {key, label, render?, sortable?}
 * @param {Array} props.data - Array of data objects
 * @param {boolean} props.loading - Loading state
 * @param {string} props.emptyMessage - Message to display when no data
 * @param {Function} props.onSort - Callback when sort is triggered (key)
 * @param {Object} props.currentSort - Current sort state {field, order: 'asc'|'desc'}
 */
const DataTable = ({
  columns = [],
  data = [],
  loading = false,
  emptyMessage = 'Aucune donnée disponible',
  onSort,
  currentSort = { field: null, order: 'asc' },
}) => {
  const handleSort = (columnKey, sortable) => {
    if (!sortable || !onSort) return;
    onSort(columnKey);
  };

  const renderSortIcon = (columnKey, sortable) => {
    if (!sortable || !onSort) return null;

    if (currentSort.field === columnKey) {
      return currentSort.order === 'asc' ? (
        <FiChevronUp className="ms-1" size={14} />
      ) : (
        <FiChevronDown className="ms-1" size={14} />
      );
    }

    return <FiChevronDown className="ms-1 text-muted opacity-50" size={14} />;
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" role="status" variant="primary">
          <span className="visually-hidden">Chargement...</span>
        </Spinner>
        <div className="mt-2 text-muted">Chargement des données...</div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-5 text-muted">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <Table striped bordered hover responsive>
      <thead>
        <tr>
          {columns.map((column) => (
            <th
              key={column.key}
              style={{
                cursor: column.sortable && onSort ? 'pointer' : 'default',
                userSelect: 'none',
              }}
              onClick={() => handleSort(column.key, column.sortable)}
            >
              {column.label}
              {renderSortIcon(column.key, column.sortable)}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, rowIndex) => (
          <tr key={row._id || row.id || rowIndex}>
            {columns.map((column) => (
              <td key={`${rowIndex}-${column.key}`}>
                {column.render ? column.render(row) : row[column.key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </Table>
  );
};

export default DataTable;
