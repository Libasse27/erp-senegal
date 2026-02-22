import React from 'react';
import PaginationBs from 'react-bootstrap/Pagination';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

/**
 * API-driven pagination component
 * @param {Object} props
 * @param {Object} props.meta - {total, page, limit, totalPages, hasNextPage, hasPrevPage}
 * @param {Function} props.onPageChange - Callback when page changes
 * @param {Function} props.onLimitChange - Callback when page size changes
 */
const Pagination = ({ meta, onPageChange, onLimitChange }) => {
  if (!meta || meta.totalPages === 0) return null;

  const { total, page, limit, totalPages, hasNextPage, hasPrevPage } = meta;

  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      onPageChange(newPage);
    }
  };

  const handleLimitChange = (e) => {
    const newLimit = parseInt(e.target.value, 10);
    if (onLimitChange) {
      onLimitChange(newLimit);
    }
  };

  const renderPageItems = () => {
    const items = [];
    const maxVisible = 5;

    let startPage = Math.max(1, page - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    if (startPage > 1) {
      items.push(
        <PaginationBs.Item key={1} onClick={() => handlePageChange(1)}>
          1
        </PaginationBs.Item>
      );
      if (startPage > 2) {
        items.push(<PaginationBs.Ellipsis key="ellipsis-start" disabled />);
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <PaginationBs.Item
          key={i}
          active={i === page}
          onClick={() => handlePageChange(i)}
        >
          {i}
        </PaginationBs.Item>
      );
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        items.push(<PaginationBs.Ellipsis key="ellipsis-end" disabled />);
      }
      items.push(
        <PaginationBs.Item
          key={totalPages}
          onClick={() => handlePageChange(totalPages)}
        >
          {totalPages}
        </PaginationBs.Item>
      );
    }

    return items;
  };

  return (
    <Row className="align-items-center mt-3">
      <Col xs={12} md={6} className="mb-2 mb-md-0">
        <div className="d-flex align-items-center">
          <span className="text-muted me-3">
            Affichage {start}-{end} sur {total}
          </span>
          <Form.Select
            size="sm"
            value={limit}
            onChange={handleLimitChange}
            style={{ width: 'auto' }}
          >
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </Form.Select>
          <span className="text-muted ms-2">par page</span>
        </div>
      </Col>
      <Col xs={12} md={6}>
        <PaginationBs className="justify-content-md-end justify-content-center mb-0">
          <PaginationBs.First
            onClick={() => handlePageChange(1)}
            disabled={!hasPrevPage}
          />
          <PaginationBs.Prev
            onClick={() => handlePageChange(page - 1)}
            disabled={!hasPrevPage}
          />
          {renderPageItems()}
          <PaginationBs.Next
            onClick={() => handlePageChange(page + 1)}
            disabled={!hasNextPage}
          />
          <PaginationBs.Last
            onClick={() => handlePageChange(totalPages)}
            disabled={!hasNextPage}
          />
        </PaginationBs>
      </Col>
    </Row>
  );
};

export default Pagination;
