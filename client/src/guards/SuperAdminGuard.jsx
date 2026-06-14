import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * Guard qui bloque l'accès à toute route réservée au Super Administrateur.
 * Redirige les autres rôles vers le tableau de bord principal.
 */
const SuperAdminGuard = () => {
  const { isSuperAdmin, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '300px' }}>
        <div className="spinner-border text-danger" role="status">
          <span className="visually-hidden">Vérification des droits...</span>
        </div>
      </div>
    );
  }

  if (!isSuperAdmin()) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default SuperAdminGuard;
