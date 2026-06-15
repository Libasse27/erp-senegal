import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';

// Layout and Guards (critical path - not lazy loaded)
import Layout from './components/layout/Layout';
import PrivateRoute from './guards/PrivateRoute';
import SuperAdminGuard from './guards/SuperAdminGuard';

// Auth pages (critical path - not lazy loaded)
import LoginPage from './pages/auth/LoginPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import RegisterPage from './pages/auth/RegisterPage';

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
const InventairesListPage = lazy(() => import('./pages/stocks/InventairesListPage'));
const InventaireDetailPage = lazy(() => import('./pages/stocks/InventaireDetailPage'));
const TransfertsListPage = lazy(() => import('./pages/stocks/TransfertsListPage'));
const TransfertFormPage = lazy(() => import('./pages/stocks/TransfertFormPage'));
const TransfertDetailPage = lazy(() => import('./pages/stocks/TransfertDetailPage'));
const StockAlertsPage = lazy(() => import('./pages/stocks/StockAlertsPage'));

// Ventes - Devis
const DevisListPage = lazy(() => import('./pages/ventes/devis/DevisListPage'));
const DevisFormPage = lazy(() => import('./pages/ventes/devis/DevisFormPage'));
const DevisDetailPage = lazy(() => import('./pages/ventes/devis/DevisDetailPage'));

// Ventes - Commandes
const CommandesListPage = lazy(() => import('./pages/ventes/commandes/CommandesListPage'));
const CommandeFormPage = lazy(() => import('./pages/ventes/commandes/CommandeFormPage'));
const CommandeDetailPage = lazy(() => import('./pages/ventes/commandes/CommandeDetailPage'));

// Ventes - Bons de livraison
const BonLivraisonDetailPage = lazy(() => import('./pages/ventes/bons-livraison/BonLivraisonDetailPage'));

// Ventes - Factures
const FacturesListPage = lazy(() => import('./pages/ventes/factures/FacturesListPage'));
const FactureFormPage = lazy(() => import('./pages/ventes/factures/FactureFormPage'));
const FactureDetailPage = lazy(() => import('./pages/ventes/factures/FactureDetailPage'));

// Ventes - Facturation Récurrente
const FacturesRecurrentesPage = lazy(() => import('./pages/ventes/FacturesRecurrentesPage'));

// Ventes - Avoirs
const AvoirsListPage = lazy(() => import('./pages/ventes/avoirs/AvoirsListPage'));
const AvoirDetailPage = lazy(() => import('./pages/ventes/avoirs/AvoirDetailPage'));

// Ventes - Relances / Recouvrement
// eslint-disable-next-line no-unused-vars
const RecouvrementPage = lazy(() => import('./pages/ventes/relances/RecouvrementPage'));
// eslint-disable-next-line no-unused-vars
const RelanceDetailPage = lazy(() => import('./pages/ventes/relances/RelanceDetailPage'));

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
const DeclarationTVAPage = lazy(() => import('./pages/comptabilite/DeclarationTVAPage'));

// Rapports
const ReportsPage = lazy(() => import('./pages/reports/ReportsPage'));
const SalesReportPage = lazy(() => import('./pages/reports/SalesReportPage'));
const CARapportPage = lazy(() => import('./pages/reports/CARapportPage'));
const RapportRecouvrementPage = lazy(() => import('./pages/reports/RapportRecouvrementPage'));
const RapportAchatsPage = lazy(() => import('./pages/reports/RapportAchatsPage'));
const RapportStocksPage = lazy(() => import('./pages/reports/RapportStocksPage'));
const RapportABCPage = lazy(() => import('./pages/reports/RapportABCPage'));
const RapportComptablePage = lazy(() => import('./pages/reports/RapportComptablePage'));
const RapportPerformancePage = lazy(() => import('./pages/reports/RapportPerformancePage'));
const RapportActivitePage = lazy(() => import('./pages/reports/RapportActivitePage'));
const RapportFinancierPage = lazy(() => import('./pages/reports/RapportFinancierPage'));

// Administration
const UsersListPage = lazy(() => import('./pages/admin/UsersListPage'));
const UserFormPage = lazy(() => import('./pages/admin/UserFormPage'));
const RolesPage = lazy(() => import('./pages/admin/RolesPage'));
const SettingsPage = lazy(() => import('./pages/admin/SettingsPage'));
const CompanyPage = lazy(() => import('./pages/admin/CompanyPage'));
const AuditLogPage = lazy(() => import('./pages/admin/AuditLogPage'));

// Achats
const CommandesAchatListPage = lazy(() => import('./pages/achats/CommandesAchatListPage'));
const CommandeAchatFormPage = lazy(() => import('./pages/achats/CommandeAchatFormPage'));
const CommandeAchatDetailPage = lazy(() => import('./pages/achats/CommandeAchatDetailPage'));
const FacturesFournisseurListPage = lazy(() => import('./pages/achats/FacturesFournisseurListPage'));
const FactureFournisseurFormPage = lazy(() => import('./pages/achats/FactureFournisseurFormPage'));
const FactureFournisseurDetailPage = lazy(() => import('./pages/achats/FactureFournisseurDetailPage'));

// Profil
const ProfilePage = lazy(() => import('./pages/profile/ProfilePage'));

// Notifications
const NotificationsListPage = lazy(() => import('./pages/notifications/NotificationsListPage'));

// Import / Export
const ImportPage = lazy(() => import('./pages/imports/ImportPage'));

// Abonnement SaaS
const AbonnementPage        = lazy(() => import('./pages/abonnement/AbonnementPage'));
const PricingPage           = lazy(() => import('./pages/abonnement/PricingPage'));
const PaiementSaasPage      = lazy(() => import('./pages/abonnement/PaiementSaasPage'));
const SubscriptionExpiredPage = lazy(() => import('./pages/abonnement/SubscriptionExpiredPage'));

// Budget & Prévisions
const BudgetsPage    = lazy(() => import('./pages/budgets/BudgetsPage'));
const BudgetFormPage = lazy(() => import('./pages/budgets/BudgetFormPage'));

// 404
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

// Super Admin
const SuperAdminDashboard = lazy(() => import('./pages/super-admin/SuperAdminDashboard'));
const SystemMonitoringPage = lazy(() => import('./pages/super-admin/SystemMonitoringPage'));
const SuperAdminUsersPage = lazy(() => import('./pages/super-admin/SuperAdminUsersPage'));
const RbacMatrixPage = lazy(() => import('./pages/super-admin/RbacMatrixPage'));
const SystemLogsPage = lazy(() => import('./pages/super-admin/SystemLogsPage'));
const BackupManagementPage = lazy(() => import('./pages/super-admin/BackupManagementPage'));
const SuperAdminAuditPage = lazy(() => import('./pages/super-admin/SuperAdminAuditPage'));
const SuperAdminCompaniesPage = lazy(() => import('./pages/super-admin/SuperAdminCompaniesPage'));

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
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

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
          <Route path="/stocks/inventaires" element={<InventairesListPage />} />
          <Route path="/stocks/inventaires/:id" element={<InventaireDetailPage />} />
          <Route path="/stocks/alertes" element={<StockAlertsPage />} />
          <Route path="/stocks/transferts" element={<TransfertsListPage />} />
          <Route path="/stocks/transferts/nouveau" element={<TransfertFormPage />} />
          <Route path="/stocks/transferts/:id" element={<TransfertDetailPage />} />
          <Route path="/stocks/transferts/:id/modifier" element={<TransfertFormPage />} />

          {/* Ventes - Devis */}
          <Route path="/ventes/devis" element={<DevisListPage />} />
          <Route path="/ventes/devis/nouveau" element={<DevisFormPage />} />
          <Route path="/ventes/devis/:id" element={<DevisDetailPage />} />
          <Route path="/ventes/devis/:id/modifier" element={<DevisFormPage />} />

          {/* Ventes - Commandes */}
          <Route path="/ventes/commandes" element={<CommandesListPage />} />
          <Route path="/ventes/commandes/nouveau" element={<CommandeFormPage />} />
          <Route path="/ventes/commandes/:id" element={<CommandeDetailPage />} />
          <Route path="/ventes/commandes/:id/modifier" element={<CommandeFormPage />} />

          {/* Ventes - Bons de livraison */}
          <Route path="/ventes/bons-livraison/:id" element={<BonLivraisonDetailPage />} />

          {/* Ventes - Factures */}
          <Route path="/ventes/factures" element={<FacturesListPage />} />
          <Route path="/ventes/factures/nouveau" element={<FactureFormPage />} />
          <Route path="/ventes/factures/:id" element={<FactureDetailPage />} />
          <Route path="/ventes/factures/:id/modifier" element={<FactureFormPage />} />

          {/* Ventes - Facturation Récurrente */}
          <Route path="/ventes/factures-recurrentes" element={<FacturesRecurrentesPage />} />

          {/* Ventes - Avoirs */}
          <Route path="/ventes/avoirs" element={<AvoirsListPage />} />
          <Route path="/ventes/avoirs/:id" element={<AvoirDetailPage />} />

          {/* Ventes - Recouvrement */}
          <Route path="/ventes/relances" element={<RecouvrementPage />} />
          <Route path="/ventes/relances/:id" element={<RelanceDetailPage />} />

          {/* Achats — Commandes */}
          <Route path="/achats/commandes" element={<CommandesAchatListPage />} />
          <Route path="/achats/commandes/nouveau" element={<CommandeAchatFormPage />} />
          <Route path="/achats/commandes/:id" element={<CommandeAchatDetailPage />} />
          <Route path="/achats/commandes/:id/modifier" element={<CommandeAchatFormPage />} />

          {/* Achats — Factures fournisseurs */}
          <Route path="/achats/factures-fournisseur" element={<FacturesFournisseurListPage />} />
          <Route path="/achats/factures-fournisseur/nouveau" element={<FactureFournisseurFormPage />} />
          <Route path="/achats/factures-fournisseur/:id" element={<FactureFournisseurDetailPage />} />
          <Route path="/achats/factures-fournisseur/:id/modifier" element={<FactureFournisseurFormPage />} />

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
          <Route path="/comptabilite/tva" element={<DeclarationTVAPage />} />

          {/* Rapports */}
          <Route path="/rapports" element={<ReportsPage />} />
          <Route path="/rapports/ventes" element={<SalesReportPage />} />
          <Route path="/rapports/ca" element={<CARapportPage />} />
          <Route path="/rapports/recouvrement" element={<RapportRecouvrementPage />} />
          <Route path="/rapports/achats" element={<RapportAchatsPage />} />
          <Route path="/rapports/stocks" element={<RapportStocksPage />} />
          <Route path="/rapports/abc" element={<RapportABCPage />} />
          <Route path="/rapports/comptable" element={<RapportComptablePage />} />
          <Route path="/rapports/performance" element={<RapportPerformancePage />} />
          <Route path="/rapports/activite" element={<RapportActivitePage />} />
          <Route path="/rapports/financier" element={<RapportFinancierPage />} />

          {/* Budget & Prévisions */}
          <Route path="/budgets" element={<BudgetsPage />} />
          <Route path="/budgets/nouveau" element={<BudgetFormPage />} />
          <Route path="/budgets/:id/modifier" element={<BudgetFormPage />} />

          {/* Profil */}
          <Route path="/profil" element={<ProfilePage />} />

          {/* Notifications */}
          <Route path="/notifications" element={<NotificationsListPage />} />
          <Route path="/imports" element={<ImportPage />} />

          {/* Administration */}
          <Route path="/admin/utilisateurs" element={<UsersListPage />} />
          <Route path="/admin/utilisateurs/nouveau" element={<UserFormPage />} />
          <Route path="/admin/utilisateurs/:id/modifier" element={<UserFormPage />} />
          <Route path="/admin/roles" element={<RolesPage />} />
          <Route path="/admin/parametres" element={<SettingsPage />} />
          <Route path="/admin/entreprise" element={<CompanyPage />} />
          <Route path="/admin/audit" element={<AuditLogPage />} />

          {/* Abonnement SaaS */}
          <Route path="/abonnement"              element={<AbonnementPage />} />
          <Route path="/abonnement/paiement"     element={<PaiementSaasPage />} />
          <Route path="/abonnement-expire"       element={<SubscriptionExpiredPage />} />
          <Route path="/pricing"                 element={<PricingPage />} />

          {/* Super Administration — accès restreint au rôle super_admin */}
          <Route element={<SuperAdminGuard />}>
            <Route path="/super-admin" element={<SuperAdminDashboard />} />
            <Route path="/super-admin/entreprises" element={<SuperAdminCompaniesPage />} />
            <Route path="/super-admin/utilisateurs" element={<SuperAdminUsersPage />} />
            <Route path="/super-admin/rbac" element={<RbacMatrixPage />} />
            <Route path="/super-admin/monitoring" element={<SystemMonitoringPage />} />
            <Route path="/super-admin/logs" element={<SystemLogsPage />} />
            <Route path="/super-admin/sauvegardes" element={<BackupManagementPage />} />
            <Route path="/super-admin/audit" element={<SuperAdminAuditPage />} />
          </Route>
        </Route>
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
    </Suspense>
  );
};

export default AppRoutes;
