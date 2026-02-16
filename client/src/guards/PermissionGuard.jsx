import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import Alert from 'react-bootstrap/Alert';

const PermissionGuard = ({ permission, children, fallback }) => {
  const { hasPermission } = useAuth();

  if (!hasPermission(permission)) {
    if (fallback) return fallback;
    return (
      <div className="container mt-5">
        <Alert variant="warning">
          <Alert.Heading>Permission insuffisante</Alert.Heading>
          <p>
            Vous n'avez pas la permission requise pour acceder a cette
            fonctionnalite.
          </p>
        </Alert>
      </div>
    );
  }

  return children;
};

export default PermissionGuard;
