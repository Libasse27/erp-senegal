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

// Clients
import ClientsListPage from './pages/clients/ClientsListPage';
import ClientFormPage from './pages/clients/ClientFormPage';
import ClientDetailPage from './pages/clients/ClientDetailPage';

// Fournisseurs
import FournisseursListPage from './pages/fournisseurs/FournisseursListPage';
import FournisseurFormPage from './pages/fournisseurs/FournisseurFormPage';
import FournisseurDetailPage from './pages/fournisseurs/FournisseurDetailPage';

// Produits
import ProductsListPage from './pages/products/ProductsListPage';
import ProductFormPage from './pages/products/ProductFormPage';
import ProductDetailPage from './pages/products/ProductDetailPage';

// Stocks
import StocksPage from './pages/stocks/StocksPage';

// Ventes - Devis
import DevisListPage from './pages/ventes/devis/DevisListPage';
import DevisFormPage from './pages/ventes/devis/DevisFormPage';
import DevisDetailPage from './pages/ventes/devis/DevisDetailPage';

// Ventes - Commandes
import CommandesListPage from './pages/ventes/commandes/CommandesListPage';
import CommandeDetailPage from './pages/ventes/commandes/CommandeDetailPage';

// Ventes - Factures
import FacturesListPage from './pages/ventes/factures/FacturesListPage';
import FactureFormPage from './pages/ventes/factures/FactureFormPage';
import FactureDetailPage from './pages/ventes/factures/FactureDetailPage';

// Paiements
import PaymentsListPage from './pages/payments/PaymentsListPage';
import PaymentFormPage from './pages/payments/PaymentFormPage';
import PaymentDetailPage from './pages/payments/PaymentDetailPage';
import TresoreriePage from './pages/payments/TresoreriePage';
import BankAccountsPage from './pages/payments/BankAccountsPage';

// Comptabilite
import PlanComptablePage from './pages/comptabilite/PlanComptablePage';
import EcrituresListPage from './pages/comptabilite/EcrituresListPage';
import EcritureFormPage from './pages/comptabilite/EcritureFormPage';
import EcritureDetailPage from './pages/comptabilite/EcritureDetailPage';
import GrandLivrePage from './pages/comptabilite/GrandLivrePage';
import BalancePage from './pages/comptabilite/BalancePage';
import BilanPage from './pages/comptabilite/BilanPage';
import CompteResultatPage from './pages/comptabilite/CompteResultatPage';
import ExercicesPage from './pages/comptabilite/ExercicesPage';

// Rapports
import ReportsPage from './pages/reports/ReportsPage';
import SalesReportPage from './pages/reports/SalesReportPage';

// Administration
import UsersListPage from './pages/admin/UsersListPage';
import UserFormPage from './pages/admin/UserFormPage';
import SettingsPage from './pages/admin/SettingsPage';
import CompanyPage from './pages/admin/CompanyPage';
import AuditLogPage from './pages/admin/AuditLogPage';

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
          <Route path="/clients" element={<ClientsListPage />} />
          <Route path="/clients/nouveau" element={<ClientFormPage />} />
          <Route path="/clients/:id" element={<ClientDetailPage />} />
          <Route path="/clients/:id/modifier" element={<ClientFormPage />} />

          {/* Fournisseurs */}
          <Route path="/fournisseurs" element={<FournisseursListPage />} />
          <Route path="/fournisseurs/nouveau" element={<FournisseurFormPage />} />
          <Route path="/fournisseurs/:id" element={<FournisseurDetailPage />} />
          <Route path="/fournisseurs/:id/modifier" element={<FournisseurFormPage />} />

          {/* Produits */}
          <Route path="/produits" element={<ProductsListPage />} />
          <Route path="/produits/nouveau" element={<ProductFormPage />} />
          <Route path="/produits/:id" element={<ProductDetailPage />} />
          <Route path="/produits/:id/modifier" element={<ProductFormPage />} />

          {/* Stocks */}
          <Route path="/stocks" element={<StocksPage />} />

          {/* Ventes - Devis */}
          <Route path="/ventes/devis" element={<DevisListPage />} />
          <Route path="/ventes/devis/nouveau" element={<DevisFormPage />} />
          <Route path="/ventes/devis/:id" element={<DevisDetailPage />} />
          <Route path="/ventes/devis/:id/modifier" element={<DevisFormPage />} />

          {/* Ventes - Commandes */}
          <Route path="/ventes/commandes" element={<CommandesListPage />} />
          <Route path="/ventes/commandes/:id" element={<CommandeDetailPage />} />

          {/* Ventes - Factures */}
          <Route path="/ventes/factures" element={<FacturesListPage />} />
          <Route path="/ventes/factures/nouveau" element={<FactureFormPage />} />
          <Route path="/ventes/factures/:id" element={<FactureDetailPage />} />
          <Route path="/ventes/factures/:id/modifier" element={<FactureFormPage />} />

          {/* Paiements */}
          <Route path="/paiements" element={<PaymentsListPage />} />
          <Route path="/paiements/nouveau" element={<PaymentFormPage />} />
          <Route path="/paiements/:id" element={<PaymentDetailPage />} />
          <Route path="/paiements/tresorerie" element={<TresoreriePage />} />
          <Route path="/paiements/comptes-bancaires" element={<BankAccountsPage />} />

          {/* Comptabilite */}
          <Route path="/comptabilite/plan" element={<PlanComptablePage />} />
          <Route path="/comptabilite/ecritures" element={<EcrituresListPage />} />
          <Route path="/comptabilite/ecritures/nouveau" element={<EcritureFormPage />} />
          <Route path="/comptabilite/ecritures/:id" element={<EcritureDetailPage />} />
          <Route path="/comptabilite/ecritures/:id/modifier" element={<EcritureFormPage />} />
          <Route path="/comptabilite/grand-livre" element={<GrandLivrePage />} />
          <Route path="/comptabilite/balance" element={<BalancePage />} />
          <Route path="/comptabilite/bilan" element={<BilanPage />} />
          <Route path="/comptabilite/resultat" element={<CompteResultatPage />} />
          <Route path="/comptabilite/exercices" element={<ExercicesPage />} />

          {/* Rapports */}
          <Route path="/rapports" element={<ReportsPage />} />
          <Route path="/rapports/ventes" element={<SalesReportPage />} />

          {/* Administration */}
          <Route path="/admin/utilisateurs" element={<UsersListPage />} />
          <Route path="/admin/utilisateurs/nouveau" element={<UserFormPage />} />
          <Route path="/admin/utilisateurs/:id/modifier" element={<UserFormPage />} />
          <Route path="/admin/parametres" element={<SettingsPage />} />
          <Route path="/admin/entreprise" element={<CompanyPage />} />
          <Route path="/admin/audit" element={<AuditLogPage />} />
        </Route>
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default AppRoutes;
