import React from 'react';
import { Link } from 'react-router-dom';
import Button from 'react-bootstrap/Button';

const NotFoundPage = () => {
  return (
    <div className="d-flex flex-column justify-content-center align-items-center vh-100">
      <h1 className="display-1 fw-bold text-muted">404</h1>
      <h4 className="mb-3">Page non trouvee</h4>
      <p className="text-muted mb-4">
        La page que vous recherchez n'existe pas ou a ete deplacee.
      </p>
      <Link to="/">
        <Button variant="primary" style={{ backgroundColor: '#1a56db', borderColor: '#1a56db' }}>
          Retour au tableau de bord
        </Button>
      </Link>
    </div>
  );
};

export default NotFoundPage;
