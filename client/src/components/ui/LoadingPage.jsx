import React from 'react';
import Spinner from 'react-bootstrap/Spinner';

/**
 * Full page loading spinner
 * @param {Object} props
 * @param {string} props.message - Optional loading message
 */
const LoadingPage = ({ message = 'Chargement...' }) => {
  return (
    <div
      className="d-flex flex-column justify-content-center align-items-center"
      style={{ minHeight: '60vh' }}
    >
      <Spinner animation="border" role="status" variant="primary" style={{ width: 60, height: 60 }}>
        <span className="visually-hidden">{message}</span>
      </Spinner>
      <div className="mt-3 text-muted">{message}</div>
    </div>
  );
};

export default LoadingPage;
