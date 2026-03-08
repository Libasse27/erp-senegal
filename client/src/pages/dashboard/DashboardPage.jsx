import React from 'react';
import { Link } from 'react-router-dom';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Badge from 'react-bootstrap/Badge';
import Alert from 'react-bootstrap/Alert';
import {
  FiDollarSign,
  FiUsers,
  FiFileText,
  FiAlertTriangle,
  FiPlus,
  FiCreditCard,
  FiCheckCircle,
  FiClock,
  FiBookOpen,
  FiBox,
  FiBarChart2,
  FiPackage,
  FiShoppingCart,
  FiClipboard,
} from 'react-icons/fi';
import usePageTitle from '../../hooks/usePageTitle';
import { formatMoney, formatDateTime } from '../../utils/formatters';
import { useGetDashboardStatsQuery } from '../../redux/api/dashboardApi';
import StatCard from '../../components/ui/StatCard';
import { SalesEvolutionChart, TopProductsChart } from '../../components/charts';
import { useAuth } from '../../contexts/AuthContext';
import { PERM } from '../../config/permissions';

// Thème par rôle (couleur d'accent du workspace)
const ROLE_WORKSPACE = {
  admin:              { label: 'Administrateur',    color: '#f87171', icon: '🔐' },
  manager:            { label: 'Manager',            color: '#818cf8', icon: '👔' },
  comptable:          { label: 'Comptable',          color: '#34d399', icon: '💰' },
  commercial:         { label: 'Commercial',         color: '#fb923c', icon: '📈' },
  vendeur:            { label: 'Vendeur',            color: '#fbbf24', icon: '🛒' },
  caissier:           { label: 'Caissier',           color: '#22d3ee', icon: '💳' },
  gestionnaire_stock: { label: 'Gestion du Stock',  color: '#a78bfa', icon: '📦' },
};

const revenueData = [
  { mois: 'Jan', ca: 4500000 },
  { mois: 'Fev', ca: 5200000 },
  { mois: 'Mar', ca: 3800000 },
  { mois: 'Avr', ca: 6100000 },
  { mois: 'Mai', ca: 5500000 },
  { mois: 'Jun', ca: 7200000 },
  { mois: 'Jul', ca: 6800000 },
  { mois: 'Aou', ca: 5900000 },
  { mois: 'Sep', ca: 7500000 },
  { mois: 'Oct', ca: 8100000 },
  { mois: 'Nov', ca: 7800000 },
  { mois: 'Dec', ca: 9200000 },
];

const paymentData = [
  { name: 'Especes',      value: 35 },
  { name: 'Virement',     value: 25 },
  { name: 'Orange Money', value: 20 },
  { name: 'Wave',         value: 15 },
  { name: 'Cheque',       value: 5  },
];

const recentActivities = [
  { id: 1, icon: FiFileText,   color: '#1a56db', message: 'Facture FA-2026-001 creee',           time: new Date(Date.now() - 1000 * 60 * 15)  },
  { id: 2, icon: FiCreditCard, color: '#059669', message: 'Paiement de 500 000 FCFA recu',       time: new Date(Date.now() - 1000 * 60 * 45)  },
  { id: 3, icon: FiUsers,      color: '#ff6900', message: 'Nouveau client ajoute : SONATEL',     time: new Date(Date.now() - 1000 * 60 * 120) },
  { id: 4, icon: FiAlertTriangle, color: '#dc2626', message: 'Stock faible : Produit XYZ',       time: new Date(Date.now() - 1000 * 60 * 180) },
  { id: 5, icon: FiCheckCircle,   color: '#059669', message: 'Devis DE-2026-015 accepte',        time: new Date(Date.now() - 1000 * 60 * 240) },
];

const DashboardPage = () => {
  usePageTitle('Tableau de bord', [{ label: 'Accueil', path: '/' }]);

  const { user, hasPermission, hasRole } = useAuth();
  const { data: statsData, isLoading } = useGetDashboardStatsQuery();
  const stats = statsData?.data || {};

  const roleName = user?.role?.name || '';
  const workspace = ROLE_WORKSPACE[roleName];
  const firstName = user?.firstName || '';

  // ── Stat cards filtrées par permission ──────────────────────────────────
  const statCards = [
    hasPermission(PERM.FACTURES_READ) && {
      title: 'CA du mois',
      value: formatMoney(stats.caDuMois || 0),
      icon: FiDollarSign,
      color: '#059669',
      subtitle: 'Chiffre d\'affaires',
    },
    hasPermission(PERM.CLIENTS_READ) && {
      title: 'Clients actifs',
      value: stats.clientsActifs || 0,
      icon: FiUsers,
      color: '#1a56db',
      subtitle: 'Total',
    },
    hasPermission(PERM.FACTURES_READ) && {
      title: 'Factures impayees',
      value: stats.facturesImpayees || 0,
      icon: FiFileText,
      color: '#d97706',
      subtitle: 'En attente',
    },
    hasPermission(PERM.PRODUITS_READ) && {
      title: 'Alertes stock',
      value: stats.alertesStock || 0,
      icon: FiAlertTriangle,
      color: '#dc2626',
      subtitle: 'Rupture ou faible',
    },
    // Caissier / Comptable sans accès factures → voir paiements
    hasPermission(PERM.PAIEMENTS_READ) && !hasPermission(PERM.FACTURES_READ) && {
      title: 'Paiements du mois',
      value: formatMoney(stats.paiementsDuMois || 0),
      icon: FiCreditCard,
      color: '#22d3ee',
      subtitle: 'Encaissements',
    },
    // Comptable → écritures comptables
    hasPermission(PERM.ECRITURES_READ) && {
      title: 'Ecritures du mois',
      value: stats.ecrituresDuMois || 0,
      icon: FiBookOpen,
      color: '#34d399',
      subtitle: 'Passees ce mois',
    },
  ].filter(Boolean);

  // ── Boutons header ───────────────────────────────────────────────────────
  const headerActions = [
    hasPermission(PERM.DEVIS_CREATE) && (
      <Button key="devis" as={Link} to="/ventes/devis/nouveau" variant="outline-primary" size="sm">
        <FiFileText className="me-1" /> Nouveau devis
      </Button>
    ),
    hasPermission(PERM.FACTURES_CREATE) && (
      <Button key="facture" as={Link} to="/ventes/factures/nouveau" variant="outline-primary" size="sm">
        <FiClipboard className="me-1" /> Nouvelle facture
      </Button>
    ),
    hasPermission(PERM.PAIEMENTS_CREATE) && (
      <Button key="paiement" as={Link} to="/paiements/nouveau" variant="primary" size="sm">
        <FiCreditCard className="me-1" /> Nouveau paiement
      </Button>
    ),
  ].filter(Boolean);

  // ── Actions rapides filtrées par permission ──────────────────────────────
  const quickActions = [
    hasPermission(PERM.DEVIS_CREATE) && {
      to: '/ventes/devis/nouveau',
      label: 'Creer un devis',
      icon: FiFileText,
      variant: 'outline-primary',
    },
    hasPermission(PERM.FACTURES_CREATE) && {
      to: '/ventes/factures/nouveau',
      label: 'Creer une facture',
      icon: FiClipboard,
      variant: 'outline-primary',
    },
    hasPermission(PERM.PAIEMENTS_CREATE) && {
      to: '/paiements/nouveau',
      label: 'Enregistrer un paiement',
      icon: FiCreditCard,
      variant: 'outline-success',
    },
    hasPermission(PERM.CLIENTS_CREATE) && {
      to: '/clients/nouveau',
      label: 'Ajouter un client',
      icon: FiUsers,
      variant: 'outline-primary',
    },
    hasPermission(PERM.PRODUITS_CREATE) && {
      to: '/produits/nouveau',
      label: 'Ajouter un produit',
      icon: FiPackage,
      variant: 'outline-primary',
    },
    hasPermission(PERM.ECRITURES_CREATE) && {
      to: '/comptabilite/ecritures/nouveau',
      label: 'Nouvelle ecriture',
      icon: FiBookOpen,
      variant: 'outline-success',
    },
    hasPermission(PERM.STOCKS_READ) && !hasPermission(PERM.PRODUITS_CREATE) && {
      to: '/stocks',
      label: 'Voir les stocks',
      icon: FiBox,
      variant: 'outline-warning',
    },
    hasPermission(PERM.FACTURES_READ) && !hasPermission(PERM.FACTURES_CREATE) && {
      to: '/ventes/factures',
      label: 'Voir les factures',
      icon: FiClipboard,
      variant: 'outline-primary',
    },
    hasPermission(PERM.PAIEMENTS_READ) && !hasPermission(PERM.PAIEMENTS_CREATE) && {
      to: '/paiements',
      label: 'Voir les paiements',
      icon: FiCreditCard,
      variant: 'outline-info',
    },
    hasPermission(PERM.COMPTABILITE_READ) && {
      to: '/comptabilite/balance',
      label: 'Consulter la balance',
      icon: FiBarChart2,
      variant: 'outline-success',
    },
    hasPermission(PERM.RAPPORTS_READ) && {
      to: '/rapports',
      label: 'Voir les rapports',
      icon: FiBarChart2,
      variant: 'outline-secondary',
    },
    hasRole('admin') && {
      to: '/admin/utilisateurs',
      label: 'Gerer les utilisateurs',
      icon: FiUsers,
      variant: 'outline-danger',
    },
  ].filter(Boolean);

  const showRevenueChart = hasPermission(PERM.FACTURES_READ) || hasPermission(PERM.RAPPORTS_READ);
  const showPaymentChart  = hasPermission(PERM.PAIEMENTS_READ);

  return (
    <>
      {/* ── En-tête ─────────────────────────────────────────────────── */}
      <div className="page-header">
        <div>
          <h1 className="mb-0">Tableau de bord</h1>
          {workspace && (
            <p className="text-muted mb-0 small">
              {workspace.icon}{' '}
              Bonjour {firstName} —{' '}
              <Badge
                style={{ backgroundColor: workspace.color, color: '#fff', fontWeight: 500 }}
              >
                {workspace.label}
              </Badge>
            </p>
          )}
        </div>
        {headerActions.length > 0 && (
          <div className="d-flex gap-2 flex-wrap">
            {headerActions}
          </div>
        )}
      </div>

      {/* ── Stat Cards ──────────────────────────────────────────────── */}
      {statCards.length > 0 ? (
        <Row className="g-3 mb-4">
          {statCards.map((card) => (
            <Col key={card.title} sm={6} lg={Math.max(3, Math.floor(12 / Math.min(statCards.length, 4)))}>
              <StatCard
                title={card.title}
                value={card.value}
                icon={card.icon}
                color={card.color}
                subtitle={card.subtitle}
                loading={isLoading}
              />
            </Col>
          ))}
        </Row>
      ) : (
        <Alert variant="info" className="mb-4">
          Bienvenue dans votre espace de travail.
        </Alert>
      )}

      {/* ── Graphiques ──────────────────────────────────────────────── */}
      {(showRevenueChart || showPaymentChart) && (
        <Row className="g-3 mb-4">
          {showRevenueChart && (
            <Col lg={showPaymentChart ? 8 : 12}>
              <Card className="shadow-sm">
                <Card.Header className="bg-white">
                  <h6 className="mb-0">Evolution du chiffre d'affaires (2026)</h6>
                </Card.Header>
                <Card.Body>
                  <SalesEvolutionChart data={revenueData} dataKey="ca" labelKey="mois" type="bar" />
                </Card.Body>
              </Card>
            </Col>
          )}
          {showPaymentChart && (
            <Col lg={showRevenueChart ? 4 : 12}>
              <Card className="shadow-sm">
                <Card.Header className="bg-white">
                  <h6 className="mb-0">Modes de paiement</h6>
                </Card.Header>
                <Card.Body>
                  <TopProductsChart data={paymentData} />
                </Card.Body>
              </Card>
            </Col>
          )}
        </Row>
      )}

      {/* ── Activité + Actions rapides ──────────────────────────────── */}
      <Row className="g-3">
        {/* Activité récente — visible si au moins une permission globale */}
        {(hasPermission(PERM.FACTURES_READ) || hasPermission(PERM.PAIEMENTS_READ) || hasPermission(PERM.CLIENTS_READ)) && (
          <Col lg={quickActions.length > 0 ? 8 : 12}>
            <Card className="shadow-sm">
              <Card.Header className="bg-white d-flex justify-content-between align-items-center">
                <h6 className="mb-0">Activite recente</h6>
                <Badge bg="secondary">{recentActivities.length}</Badge>
              </Card.Header>
              <Card.Body>
                <div className="activity-list">
                  {recentActivities.map((activity) => (
                    <div key={activity.id} className="d-flex align-items-start py-3 border-bottom">
                      <div
                        className="rounded-circle d-flex align-items-center justify-content-center me-3"
                        style={{
                          width: 40,
                          height: 40,
                          backgroundColor: `${activity.color}15`,
                          color: activity.color,
                          flexShrink: 0,
                        }}
                      >
                        <activity.icon size={18} />
                      </div>
                      <div className="flex-grow-1">
                        <p className="mb-1">{activity.message}</p>
                        <small className="text-muted d-flex align-items-center">
                          <FiClock size={12} className="me-1" />
                          {formatDateTime(activity.time)}
                        </small>
                      </div>
                    </div>
                  ))}
                </div>
              </Card.Body>
            </Card>
          </Col>
        )}

        {/* Actions rapides ─────────────────────────────────────────── */}
        {quickActions.length > 0 && (
          <Col lg={hasPermission(PERM.FACTURES_READ) || hasPermission(PERM.PAIEMENTS_READ) || hasPermission(PERM.CLIENTS_READ) ? 4 : 12}>
            <Card className="shadow-sm">
              <Card.Header className="bg-white">
                <h6 className="mb-0">Actions rapides</h6>
              </Card.Header>
              <Card.Body>
                <div className="d-grid gap-2">
                  {quickActions.map((action) => {
                    const Icon = action.icon;
                    return (
                      <Button
                        key={action.to}
                        as={Link}
                        to={action.to}
                        variant={action.variant}
                        className="text-start d-flex align-items-center"
                      >
                        <Icon className="me-2" />
                        {action.label}
                      </Button>
                    );
                  })}
                </div>
              </Card.Body>
            </Card>
          </Col>
        )}

        {/* Raccourcis comptabilité pour comptable sans autres sections */}
        {hasPermission(PERM.COMPTABILITE_READ) && !hasPermission(PERM.FACTURES_READ) && !hasPermission(PERM.CLIENTS_READ) && (
          <Col lg={12}>
            <Card className="shadow-sm">
              <Card.Header className="bg-white">
                <h6 className="mb-0">Acces rapide — Comptabilite</h6>
              </Card.Header>
              <Card.Body>
                <Row className="g-2">
                  {[
                    { to: '/comptabilite/ecritures',   label: 'Ecritures',         icon: FiBookOpen,  variant: 'outline-success'   },
                    { to: '/comptabilite/grand-livre', label: 'Grand Livre',       icon: FiFileText,  variant: 'outline-primary'   },
                    { to: '/comptabilite/balance',     label: 'Balance',           icon: FiBarChart2, variant: 'outline-primary'   },
                    { to: '/comptabilite/bilan',       label: 'Bilan',             icon: FiBarChart2, variant: 'outline-primary'   },
                    { to: '/comptabilite/resultat',    label: 'Compte de Resultat',icon: FiBarChart2, variant: 'outline-primary'   },
                    { to: '/comptabilite/exercices',   label: 'Exercices',         icon: FiShoppingCart, variant: 'outline-secondary' },
                  ].map((a) => {
                    const Icon = a.icon;
                    return (
                      <Col key={a.to} sm={6} md={4}>
                        <Button as={Link} to={a.to} variant={a.variant} className="w-100 text-start d-flex align-items-center">
                          <Icon className="me-2" /> {a.label}
                        </Button>
                      </Col>
                    );
                  })}
                </Row>
              </Card.Body>
            </Card>
          </Col>
        )}

        {/* Espace gestionnaire stock */}
        {hasRole('gestionnaire_stock') && (
          <Col lg={12}>
            <Card className="shadow-sm border-warning">
              <Card.Header className="bg-warning bg-opacity-10">
                <h6 className="mb-0">📦 Espace Stock</h6>
              </Card.Header>
              <Card.Body>
                <Row className="g-2">
                  {[
                    { to: '/stocks',          label: 'Etat des stocks',    icon: FiBox,     variant: 'outline-warning'  },
                    { to: '/produits',        label: 'Catalogue produits', icon: FiPackage, variant: 'outline-primary'  },
                    { to: '/produits/nouveau',label: 'Ajouter un produit', icon: FiPlus,    variant: 'warning'          },
                  ].map((a) => {
                    const Icon = a.icon;
                    return (
                      <Col key={a.to} sm={6} md={4}>
                        <Button as={Link} to={a.to} variant={a.variant} className="w-100 text-start d-flex align-items-center">
                          <Icon className="me-2" /> {a.label}
                        </Button>
                      </Col>
                    );
                  })}
                </Row>
              </Card.Body>
            </Card>
          </Col>
        )}
      </Row>
    </>
  );
};

export default DashboardPage;
