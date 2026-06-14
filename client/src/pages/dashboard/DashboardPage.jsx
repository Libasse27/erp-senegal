import React from 'react';
import { Link } from 'react-router-dom';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Badge from 'react-bootstrap/Badge';
import Alert from 'react-bootstrap/Alert';
import Spinner from 'react-bootstrap/Spinner';
import ProgressBar from 'react-bootstrap/ProgressBar';
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
  FiInfo,
  FiAlertCircle,
  FiCalendar,
  FiRefreshCw,
} from 'react-icons/fi';
import usePageTitle from '../../hooks/usePageTitle';
import { formatMoney, formatDateTime } from '../../utils/formatters';
import { useGetDashboardStatsQuery, useGetDashboardChartsQuery } from '../../redux/api/dashboardApi';
import { useGetUsageSaasQuery } from '../../redux/api/saasApi';
import useNotificationsHook from '../../hooks/useNotifications';
import StatCard from '../../components/ui/StatCard';
import { SalesEvolutionChart, TopProductsChart } from '../../components/charts';
import { useAuth } from '../../contexts/AuthContext';
import { PERM } from '../../config/permissions';

const ROLE_WORKSPACE = {
  admin:              { label: 'Administrateur',   color: '#f87171', icon: '🔐' },
  manager:            { label: 'Manager',           color: '#818cf8', icon: '👔' },
  comptable:          { label: 'Comptable',         color: '#34d399', icon: '💰' },
  commercial:         { label: 'Commercial',        color: '#fb923c', icon: '📈' },
  vendeur:            { label: 'Vendeur',           color: '#fbbf24', icon: '🛒' },
  caissier:           { label: 'Caissier',          color: '#22d3ee', icon: '💳' },
  gestionnaire_stock: { label: 'Gestion du Stock', color: '#a78bfa', icon: '📦' },
};

const MONTHS = ['Jan', 'Fev', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aou', 'Sep', 'Oct', 'Nov', 'Dec'];

const MODE_LABELS = {
  especes:      'Espèces',
  virement:     'Virement',
  cheque:       'Chèque',
  orange_money: 'Orange Money',
  wave:         'Wave',
  free_money:   'Free Money',
  carte:        'Carte bancaire',
};

const NOTIF_ICON = {
  success: FiCheckCircle,
  warning: FiAlertTriangle,
  error:   FiAlertCircle,
  info:    FiInfo,
};
const NOTIF_COLOR = {
  success: '#059669',
  warning: '#d97706',
  error:   '#dc2626',
  info:    '#1a56db',
};

const DashboardPage = () => {
  usePageTitle('Tableau de bord', [{ label: 'Accueil', path: '/' }]);

  const { user, hasPermission, hasRole } = useAuth();
  const { data: statsData, isLoading } = useGetDashboardStatsQuery();
  const stats = statsData?.data || {};

  const { data: chartsData, isLoading: isLoadingCharts } = useGetDashboardChartsQuery();

  const isAdmin = hasRole('admin');
  const { data: usageData } = useGetUsageSaasQuery(undefined, { skip: !isAdmin });

  const { notifications: recentNotifs } = useNotificationsHook({ page: 1, limit: 5 });

  const roleName = user?.role?.name || '';
  const workspace = ROLE_WORKSPACE[roleName];
  const firstName = user?.firstName || '';

  // ── Données graphique CA mensuel ─────────────────────────────────────────
  const revenueData = MONTHS.map((mois, i) => {
    const found = (chartsData?.data?.caMensuel || []).find((m) => m._id === i + 1);
    return { mois, ca: found?.total || 0 };
  });

  // ── Données graphique paiements par mode ─────────────────────────────────
  const rawPayments = chartsData?.data?.paiementsParMode || [];
  const grandTotal = rawPayments.reduce((s, p) => s + p.total, 0);
  const paymentData = rawPayments.map((p) => ({
    name:  MODE_LABELS[p._id] || p._id,
    value: grandTotal > 0 ? Math.round((p.total / grandTotal) * 100) : 0,
  }));

  // ── Activités récentes depuis les notifications API ───────────────────────
  const recentActivities = recentNotifs.slice(0, 5).map((n, i) => ({
    id:      n._id || i,
    icon:    NOTIF_ICON[n.type] || FiInfo,
    color:   NOTIF_COLOR[n.type] || '#1a56db',
    message: n.message || n.title || '',
    time:    new Date(n.createdAt),
  }));

  // ── Abonnement SaaS ───────────────────────────────────────────────────────
  const abonnement = usageData?.abonnement;
  const dateFin = abonnement?.dateFin ? new Date(abonnement.dateFin) : null;
  const now = new Date();
  const joursRestants = dateFin ? Math.max(0, Math.ceil((dateFin - now) / (1000 * 60 * 60 * 24))) : 0;
  const dateDebut = abonnement?.dateDebut ? new Date(abonnement.dateDebut) : null;
  const dureeTotal = dateFin && dateDebut ? Math.ceil((dateFin - dateDebut) / (1000 * 60 * 60 * 24)) : 30;
  const progressPct = dateFin ? Math.round(((dureeTotal - joursRestants) / dureeTotal) * 100) : 0;

  // ── Stat cards filtrées par permission ───────────────────────────────────
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
    hasPermission(PERM.PAIEMENTS_READ) && !hasPermission(PERM.FACTURES_READ) && {
      title: 'Paiements du mois',
      value: formatMoney(stats.paiementsDuMois || 0),
      icon: FiCreditCard,
      color: '#22d3ee',
      subtitle: 'Encaissements',
    },
    hasPermission(PERM.ECRITURES_READ) && {
      title: 'Ecritures du mois',
      value: stats.ecrituresDuMois || 0,
      icon: FiBookOpen,
      color: '#34d399',
      subtitle: 'Passees ce mois',
    },
  ].filter(Boolean);

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
  const showActivities    = hasPermission(PERM.FACTURES_READ) || hasPermission(PERM.PAIEMENTS_READ) || hasPermission(PERM.CLIENTS_READ);

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
              <Badge style={{ backgroundColor: workspace.color, color: '#fff', fontWeight: 500 }}>
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

      {/* ── Widget abonnement SaaS (admin uniquement) ────────────────── */}
      {isAdmin && abonnement && (
        <Alert
          variant={joursRestants <= 7 ? 'warning' : 'info'}
          className="mb-4 d-flex align-items-center justify-content-between flex-wrap gap-2"
        >
          <div className="d-flex align-items-center gap-2">
            <FiCalendar size={18} />
            <span>
              <strong>Abonnement {abonnement?.forfaitId?.nom || 'SaaS'}</strong>
              {' — '}
              <Badge bg={abonnement.statut === 'ACTIF' ? 'success' : 'danger'} className="me-2">
                {abonnement.statut}
              </Badge>
              {dateFin && (
                <>
                  Expire le {dateFin.toLocaleDateString('fr-SN', { day: '2-digit', month: 'long', year: 'numeric' })}
                  {' ('}
                  <strong>{joursRestants} jour{joursRestants !== 1 ? 's' : ''}</strong>
                  {' restant)'}
                </>
              )}
            </span>
          </div>
          <div className="d-flex align-items-center gap-2">
            {joursRestants <= 30 && (
              <Button as={Link} to="/abonnement/paiement" size="sm" variant={joursRestants <= 7 ? 'warning' : 'outline-primary'}>
                <FiRefreshCw size={14} className="me-1" /> Renouveler
              </Button>
            )}
            <Button as={Link} to="/abonnement" size="sm" variant="outline-secondary">
              Gérer
            </Button>
          </div>
          {dateFin && (
            <div className="w-100 mt-1">
              <ProgressBar
                now={progressPct}
                variant={joursRestants <= 7 ? 'danger' : joursRestants <= 30 ? 'warning' : 'success'}
                style={{ height: 4 }}
              />
            </div>
          )}
        </Alert>
      )}

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
                <Card.Header className="bg-white d-flex justify-content-between align-items-center">
                  <h6 className="mb-0">Evolution du chiffre d'affaires ({new Date().getFullYear()})</h6>
                  {isLoadingCharts && <Spinner animation="border" size="sm" />}
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
                <Card.Header className="bg-white d-flex justify-content-between align-items-center">
                  <h6 className="mb-0">Modes de paiement</h6>
                  {isLoadingCharts && <Spinner animation="border" size="sm" />}
                </Card.Header>
                <Card.Body>
                  {paymentData.length > 0 ? (
                    <TopProductsChart data={paymentData} />
                  ) : (
                    <p className="text-muted text-center py-4 mb-0">Aucun paiement enregistré</p>
                  )}
                </Card.Body>
              </Card>
            </Col>
          )}
        </Row>
      )}

      {/* ── Activité + Actions rapides ──────────────────────────────── */}
      <Row className="g-3">
        {showActivities && (
          <Col lg={quickActions.length > 0 ? 8 : 12}>
            <Card className="shadow-sm">
              <Card.Header className="bg-white d-flex justify-content-between align-items-center">
                <h6 className="mb-0">Activite recente</h6>
                <Badge bg="secondary">{recentActivities.length}</Badge>
              </Card.Header>
              <Card.Body>
                {recentActivities.length > 0 ? (
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
                ) : (
                  <p className="text-muted text-center py-4 mb-0">Aucune activité récente</p>
                )}
              </Card.Body>
            </Card>
          </Col>
        )}

        {quickActions.length > 0 && (
          <Col lg={showActivities ? 4 : 12}>
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

        {hasPermission(PERM.COMPTABILITE_READ) && !hasPermission(PERM.FACTURES_READ) && !hasPermission(PERM.CLIENTS_READ) && (
          <Col lg={12}>
            <Card className="shadow-sm">
              <Card.Header className="bg-white">
                <h6 className="mb-0">Acces rapide — Comptabilite</h6>
              </Card.Header>
              <Card.Body>
                <Row className="g-2">
                  {[
                    { to: '/comptabilite/ecritures',   label: 'Ecritures',          icon: FiBookOpen,     variant: 'outline-success'   },
                    { to: '/comptabilite/grand-livre', label: 'Grand Livre',        icon: FiFileText,     variant: 'outline-primary'   },
                    { to: '/comptabilite/balance',     label: 'Balance',            icon: FiBarChart2,    variant: 'outline-primary'   },
                    { to: '/comptabilite/bilan',       label: 'Bilan',              icon: FiBarChart2,    variant: 'outline-primary'   },
                    { to: '/comptabilite/resultat',    label: 'Compte de Resultat', icon: FiBarChart2,    variant: 'outline-primary'   },
                    { to: '/comptabilite/exercices',   label: 'Exercices',          icon: FiShoppingCart, variant: 'outline-secondary' },
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

        {hasRole('gestionnaire_stock') && (
          <Col lg={12}>
            <Card className="shadow-sm border-warning">
              <Card.Header className="bg-warning bg-opacity-10">
                <h6 className="mb-0">📦 Espace Stock</h6>
              </Card.Header>
              <Card.Body>
                <Row className="g-2">
                  {[
                    { to: '/stocks',           label: 'Etat des stocks',    icon: FiBox,     variant: 'outline-warning' },
                    { to: '/produits',         label: 'Catalogue produits', icon: FiPackage, variant: 'outline-primary' },
                    { to: '/produits/nouveau', label: 'Ajouter un produit', icon: FiPlus,    variant: 'warning'         },
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
