import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Alert from 'react-bootstrap/Alert';

const RoleGuard = ({ roles, children }) => {
  const { hasRole, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!hasRole(...roles)) {
    return (
      <div className="container mt-5">
        <Alert variant="danger">
          <Alert.Heading>Acces refuse</Alert.Heading>
          <p>
            Vous n'avez pas les droits necessaires pour acceder a cette page.
            Veuillez contacter votre administrateur.
          </p>
        </Alert>
      </div>
    );
  }

  return children;
};

export default RoleGuard;
