import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';

// Layout and Guards (critical path - not lazy loaded)
import Layout from './components/layout/Layout';
import PrivateRoute from './guards/PrivateRoute';

// Auth pages (critical path - not lazy loaded)
import LoginPage from './pages/auth/LoginPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';

// Lazy loaded pages
const DashboardPage = lazy(() => import('./pages/dashboard/DashboardPage'));

// Clients
const ClientsListPage = lazy(() => import('./pages/clients/ClientsListPage'));
const ClientFormPage = lazy(() => import('./pages/clients/ClientFormPage'));
const ClientDetailPage = lazy(() => import('./pages/clients/ClientDetailPage'));

// Fournisseurs
const FournisseursListPage = lazy(() => import('./pages/fournisseurs/FournisseursListPage'));
const FournisseurFormPage = lazy(() => import('./pages/fournisseurs/FournisseurFormPage'));
const FournisseurDetailPage = lazy(() => import('./pages/fournisseurs/FournisseurDetailPage'));

// Produits
const ProductsListPage = lazy(() => import('./pages/products/ProductsListPage'));
const ProductFormPage = lazy(() => import('./pages/products/ProductFormPage'));
const ProductDetailPage = lazy(() => import('./pages/products/ProductDetailPage'));

// Stocks
const StocksPage = lazy(() => import('./pages/stocks/StocksPage'));

// Ventes - Devis
const DevisListPage = lazy(() => import('./pages/ventes/devis/DevisListPage'));
const DevisFormPage = lazy(() => import('./pages/ventes/devis/DevisFormPage'));
const DevisDetailPage = lazy(() => import('./pages/ventes/devis/DevisDetailPage'));

// Ventes - Commandes
const CommandesListPage = lazy(() => import('./pages/ventes/commandes/CommandesListPage'));
const CommandeDetailPage = lazy(() => import('./pages/ventes/commandes/CommandeDetailPage'));

// Ventes - Bons de livraison
const BonLivraisonDetailPage = lazy(() => import('./pages/ventes/bons-livraison/BonLivraisonDetailPage'));

// Ventes - Factures
const FacturesListPage = lazy(() => import('./pages/ventes/factures/FacturesListPage'));
const FactureFormPage = lazy(() => import('./pages/ventes/factures/FactureFormPage'));
const FactureDetailPage = lazy(() => import('./pages/ventes/factures/FactureDetailPage'));

// Paiements
const PaymentsListPage = lazy(() => import('./pages/payments/PaymentsListPage'));
const PaymentFormPage = lazy(() => import('./pages/payments/PaymentFormPage'));
const PaymentDetailPage = lazy(() => import('./pages/payments/PaymentDetailPage'));
const TresoreriePage = lazy(() => import('./pages/payments/TresoreriePage'));
const BankAccountsPage = lazy(() => import('./pages/payments/BankAccountsPage'));

// Comptabilite
const PlanComptablePage = lazy(() => import('./pages/comptabilite/PlanComptablePage'));
const EcrituresListPage = lazy(() => import('./pages/comptabilite/EcrituresListPage'));
const EcritureFormPage = lazy(() => import('./pages/comptabilite/EcritureFormPage'));
const EcritureDetailPage = lazy(() => import('./pages/comptabilite/EcritureDetailPage'));
const GrandLivrePage = lazy(() => import('./pages/comptabilite/GrandLivrePage'));
const BalancePage = lazy(() => import('./pages/comptabilite/BalancePage'));
const BilanPage = lazy(() => import('./pages/comptabilite/BilanPage'));
const CompteResultatPage = lazy(() => import('./pages/comptabilite/CompteResultatPage'));
const ExercicesPage = lazy(() => import('./pages/comptabilite/ExercicesPage'));

// Rapports
const ReportsPage = lazy(() => import('./pages/reports/ReportsPage'));
const SalesReportPage = lazy(() => import('./pages/reports/SalesReportPage'));

// Administration
const UsersListPage = lazy(() => import('./pages/admin/UsersListPage'));
const UserFormPage = lazy(() => import('./pages/admin/UserFormPage'));
const SettingsPage = lazy(() => import('./pages/admin/SettingsPage'));
const CompanyPage = lazy(() => import('./pages/admin/CompanyPage'));
const AuditLogPage = lazy(() => import('./pages/admin/AuditLogPage'));

// Notifications
const NotificationsListPage = lazy(() => import('./pages/notifications/NotificationsListPage'));

// 404
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

// Loading fallback component
const PageLoader = () => (
  <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
    <div className="spinner-border text-primary" role="status">
      <span className="visually-hidden">Chargement...</span>
    </div>
  </div>
);

const AppRoutes = () => {
  return (
    <Suspense fallback={<PageLoader />}>
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

          {/* Ventes - Bons de livraison */}
          <Route path="/ventes/bons-livraison/:id" element={<BonLivraisonDetailPage />} />

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

          {/* Notifications */}
          <Route path="/notifications" element={<NotificationsListPage />} />

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
    </Suspense>
  );
};

export default AppRoutes;
