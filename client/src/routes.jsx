import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Layout
import Layout from './components/layout/Layout';

// Guards
import PrivateRoute from './guards/PrivateRoute';

// Auth pages
import LoginPage from './pages/auth/LoginPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';

// Dashboard
import DashboardPage from './pages/dashboard/DashboardPage';

// 404
import NotFoundPage from './pages/NotFoundPage';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      {/* Protected routes */}
      <Route element={<PrivateRoute />}>
        <Route element={<Layout />}>
          {/* Dashboard */}
          <Route path="/" element={<DashboardPage />} />

          {/* Clients */}
          {/* <Route path="/clients" element={<ClientsListPage />} /> */}
          {/* <Route path="/clients/new" element={<ClientFormPage />} /> */}
          {/* <Route path="/clients/:id" element={<ClientDetailPage />} /> */}
          {/* <Route path="/clients/:id/edit" element={<ClientFormPage />} /> */}

          {/* Fournisseurs */}
          {/* <Route path="/fournisseurs" element={<FournisseursListPage />} /> */}

          {/* Produits */}
          {/* <Route path="/produits" element={<ProductsListPage />} /> */}

          {/* Stocks */}
          {/* <Route path="/stocks" element={<StocksPage />} /> */}

          {/* Devis */}
          {/* <Route path="/devis" element={<DevisListPage />} /> */}

          {/* Commandes */}
          {/* <Route path="/commandes" element={<CommandesListPage />} /> */}

          {/* Factures */}
          {/* <Route path="/factures" element={<FacturesListPage />} /> */}

          {/* Paiements */}
          {/* <Route path="/paiements" element={<PaiementsListPage />} /> */}

          {/* Comptabilite */}
          {/* <Route path="/comptabilite" element={<ComptabilitePage />} /> */}

          {/* Rapports */}
          {/* <Route path="/rapports" element={<RapportsPage />} /> */}

          {/* Administration */}
          {/* <Route path="/admin/*" element={<AdminRoutes />} /> */}
        </Route>
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default AppRoutes;
