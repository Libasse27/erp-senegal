import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Badge from 'react-bootstrap/Badge';
import Alert from 'react-bootstrap/Alert';
import Spinner from 'react-bootstrap/Spinner';
import ProgressBar from 'react-bootstrap/ProgressBar';
import Table from 'react-bootstrap/Table';
import Form from 'react-bootstrap/Form';
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
  FiTrendingUp,
  FiTrendingDown,
  FiTarget,
  FiZap,
} from 'react-icons/fi';
import usePageTitle from '../../hooks/usePageTitle';
import { formatMoney, formatDateTime } from '../../utils/formatters';
import {
  useGetDashboardStatsQuery,
  useGetDashboardChartsQuery,
  useGetDashboardTopClientsQuery,
  useGetDashboardStockAlertsQuery,
  useGetDashboardKpisQuery,
  useGetDashboardTopProductsQuery,
  useGetDashboardStockEvolutionQuery,
  useGetDashboardRecouvrementQuery,
} from '../../redux/api/dashboardApi';
import { useGetUsageSaasQuery } from '../../redux/api/saasApi';
import useNotificationsHook from '../../hooks/useNotifications';
import StatCard from '../../components/ui/StatCard';
import { SalesEvolutionChart, TopProductsChart, HorizontalBarChart, StockEvolutionChart } from '../../components/charts';
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

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - i);

const DashboardPage = () => {
  usePageTitle('Tableau de bord', [{ label: 'Accueil', path: '/' }]);

  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);

  const { user, hasPermission, hasRole } = useAuth();
  const { data: statsData, isLoading } = useGetDashboardStatsQuery();
  const stats = statsData?.data || {};

  const { data: chartsData, isLoading: isLoadingCharts } = useGetDashboardChartsQuery({ year: selectedYear });

  const canViewFactures = hasPermission(PERM.FACTURES_READ);
  const canViewStock    = hasPermission(PERM.STOCKS_READ);

  const { data: topClientsData, isLoading: isLoadingTopClients } = useGetDashboardTopClientsQuery(
    { year: selectedYear },
    { skip: !canViewFactures, pollingInterval: 120000 }
  );
  const { data: stockAlertsData, isLoading: isLoadingStockAlerts } = useGetDashboardStockAlertsQuery(
    undefined,
    { skip: !canViewStock, pollingInterval: 60000 }
  );
  const { data: kpisData } = useGetDashboardKpisQuery(
    undefined,
    { skip: !canViewFactures, pollingInterval: 120000 }
  );
  const { data: topProductsData, isLoading: isLoadingTopProducts } = useGetDashboardTopProductsQuery(
    { year: selectedYear },
    { skip: !canViewFactures }
  );
  const { data: stockEvolutionData, isLoading: isLoadingStockEvolution } = useGetDashboardStockEvolutionQuery(
    { year: selectedYear },
    { skip: !canViewStock }
  );
  const { data: recouvrementData } = useGetDashboardRecouvrementQuery(
    { year: selectedYear },
    { skip: !canViewFactures }
  );

  const topClients     = topClientsData?.data     || [];
  const stockAlerts    = stockAlertsData?.data    || [];
  const kpis           = kpisData?.data           || {};
  const topProducts    = topProductsData?.data    || [];
  const stockEvolution = stockEvolutionData?.data || [];
  const recouvrement   = recouvrementData?.data   || {};

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

  // ── Trend CA mois en cours vs mois précédent ─────────────────────────────
  const caTrendPct = kpis.caTrend;
  const caTrend = caTrendPct !== null && caTrendPct !== undefined
    ? { value: `${caTrendPct > 0 ? '+' : ''}${caTrendPct}% vs mois préc.`, isUp: caTrendPct >= 0 }
    : undefined;

  // ── Stat cards filtrées par permission ───────────────────────────────────
  const statCards = [
    hasPermission(PERM.FACTURES_READ) && {
      title: 'CA du mois',
      value: formatMoney(stats.caDuMois || 0),
      icon: FiDollarSign,
      color: '#059669',
      subtitle: 'Chiffre d\'affaires',
      trend: caTrend,
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
        <div className="d-flex gap-2 flex-wrap align-items-center">
          <Form.Select
            size="sm"
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            style={{ width: 'auto' }}
            title="Filtrer par année"
          >
            {YEAR_OPTIONS.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </Form.Select>
          {headerActions}
        </div>
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
                trend={card.trend}
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
                  <h6 className="mb-0">Évolution du chiffre d'affaires ({selectedYear})</h6>
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

      {/* ── KPIs avancés : conversion + délai paiement ─────────────── */}
      {canViewFactures && (kpis.tauxConversion !== undefined || kpis.delaiMoyenPaiement !== null) && (
        <Row className="g-3 mb-4">
          <Col sm={6} lg={3}>
            <Card className="shadow-sm h-100">
              <Card.Body className="d-flex align-items-center">
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center me-3 flex-shrink-0"
                  style={{ width: 48, height: 48, backgroundColor: '#818cf815', color: '#818cf8' }}
                >
                  <FiTarget size={24} />
                </div>
                <div>
                  <div className="text-muted small">Taux conversion devis</div>
                  <div className="fw-bold" style={{ fontSize: '1.5rem', color: '#818cf8' }}>
                    {kpis.tauxConversion ?? 0}%
                  </div>
                  <small className="text-muted">{kpis.devisConverts ?? 0}/{kpis.totalDevis ?? 0} ce mois</small>
                </div>
              </Card.Body>
            </Card>
          </Col>
          {kpis.delaiMoyenPaiement !== null && kpis.delaiMoyenPaiement !== undefined && (
            <Col sm={6} lg={3}>
              <Card className="shadow-sm h-100">
                <Card.Body className="d-flex align-items-center">
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center me-3 flex-shrink-0"
                    style={{ width: 48, height: 48, backgroundColor: '#22d3ee15', color: '#0891b2' }}
                  >
                    <FiClock size={24} />
                  </div>
                  <div>
                    <div className="text-muted small">Délai moyen paiement</div>
                    <div className="fw-bold" style={{ fontSize: '1.5rem', color: '#0891b2' }}>
                      {kpis.delaiMoyenPaiement} j
                    </div>
                    <small className="text-muted">jours entre facture et paiement</small>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          )}
          {kpis.caPrevMonth !== undefined && (
            <Col sm={6} lg={3}>
              <Card className="shadow-sm h-100">
                <Card.Body className="d-flex align-items-center">
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center me-3 flex-shrink-0"
                    style={{ width: 48, height: 48, backgroundColor: '#fb923c15', color: '#ea580c' }}
                  >
                    <FiZap size={24} />
                  </div>
                  <div>
                    <div className="text-muted small">CA mois précédent</div>
                    <div className="fw-bold" style={{ fontSize: '1.25rem', color: '#ea580c' }}>
                      {formatMoney(kpis.caPrevMonth || 0)}
                    </div>
                    {caTrend && (
                      <small className={caTrend.isUp ? 'text-success' : 'text-danger'} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        {caTrend.isUp ? <FiTrendingUp size={12} /> : <FiTrendingDown size={12} />}
                        {caTrend.value}
                      </small>
                    )}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          )}
        </Row>
      )}

      {/* ── Top produits + Taux de recouvrement ────────────────────── */}
      {canViewFactures && (
        <Row className="g-3 mb-4">
          <Col lg={8}>
            <Card className="shadow-sm h-100">
              <Card.Header className="bg-white d-flex justify-content-between align-items-center">
                <h6 className="mb-0">
                  <FiPackage size={16} className="me-2 text-primary" />
                  Top produits — CA {selectedYear}
                </h6>
                {isLoadingTopProducts && <Spinner animation="border" size="sm" />}
              </Card.Header>
              <Card.Body>
                {topProducts.length === 0 && !isLoadingTopProducts ? (
                  <p className="text-muted text-center py-4 mb-0">Aucune vente cette année</p>
                ) : (
                  <HorizontalBarChart data={topProducts} dataKey="totalCA" nameKey="designation" height={280} />
                )}
              </Card.Body>
            </Card>
          </Col>

          <Col lg={4}>
            <Card className="shadow-sm h-100">
              <Card.Header className="bg-white">
                <h6 className="mb-0">
                  <FiCheckCircle size={16} className="me-2 text-success" />
                  Taux de recouvrement {selectedYear}
                </h6>
              </Card.Header>
              <Card.Body>
                {recouvrement.totalCA > 0 ? (
                  <>
                    <div className="text-center mb-3">
                      <div
                        className="fw-bold"
                        style={{ fontSize: '2.5rem', color: recouvrement.tauxRecouvrement >= 80 ? '#059669' : recouvrement.tauxRecouvrement >= 50 ? '#d97706' : '#dc2626' }}
                      >
                        {recouvrement.tauxRecouvrement}%
                      </div>
                      <div className="text-muted small">de recouvrement</div>
                    </div>
                    <ProgressBar
                      now={recouvrement.tauxRecouvrement}
                      variant={recouvrement.tauxRecouvrement >= 80 ? 'success' : recouvrement.tauxRecouvrement >= 50 ? 'warning' : 'danger'}
                      className="mb-3"
                      style={{ height: 10 }}
                    />
                    <div className="d-flex flex-column gap-2" style={{ fontSize: '0.82rem' }}>
                      <div className="d-flex justify-content-between">
                        <span className="text-muted">CA total facturé</span>
                        <span className="fw-semibold">{formatMoney(recouvrement.totalCA)}</span>
                      </div>
                      <div className="d-flex justify-content-between">
                        <span className="text-success">Encaissé</span>
                        <span className="fw-semibold text-success">{formatMoney(recouvrement.totalPaye)}</span>
                      </div>
                      <div className="d-flex justify-content-between border-top pt-2">
                        <span className="text-danger">Créances restantes</span>
                        <span className="fw-semibold text-danger">{formatMoney(recouvrement.totalDu)}</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-muted text-center py-4 mb-0">Aucune facture cette année</p>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* ── Évolution des stocks ─────────────────────────────────────── */}
      {canViewStock && (
        <Row className="g-3 mb-4">
          <Col lg={12}>
            <Card className="shadow-sm">
              <Card.Header className="bg-white d-flex justify-content-between align-items-center">
                <h6 className="mb-0">
                  <FiBox size={16} className="me-2 text-warning" />
                  Évolution des stocks — entrées / sorties {selectedYear}
                </h6>
                {isLoadingStockEvolution && <Spinner animation="border" size="sm" />}
              </Card.Header>
              <Card.Body>
                {stockEvolution.every((m) => m.entrees === 0 && m.sorties === 0) && !isLoadingStockEvolution ? (
                  <p className="text-muted text-center py-4 mb-0">Aucun mouvement de stock cette année</p>
                ) : (
                  <StockEvolutionChart data={stockEvolution} height={280} />
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* ── Top clients + Alertes stock ─────────────────────────────── */}
      {(canViewFactures || canViewStock) && (
        <Row className="g-3 mb-4">
          {canViewFactures && (
            <Col lg={canViewStock ? 7 : 12}>
              <Card className="shadow-sm h-100">
                <Card.Header className="bg-white d-flex justify-content-between align-items-center">
                  <h6 className="mb-0">
                    <FiUsers size={16} className="me-2 text-primary" />
                    Top clients — CA {selectedYear}
                  </h6>
                  {isLoadingTopClients && <Spinner animation="border" size="sm" />}
                </Card.Header>
                <Card.Body className="p-0">
                  {topClients.length === 0 && !isLoadingTopClients ? (
                    <p className="text-muted text-center py-4 mb-0">Aucune facture cette année</p>
                  ) : (
                    <div className="table-responsive">
                      <Table hover className="mb-0 align-middle">
                        <thead className="table-light">
                          <tr>
                            <th>#</th>
                            <th>Client</th>
                            <th className="text-end">CA</th>
                            <th className="text-end d-none d-md-table-cell">Factures</th>
                            <th className="d-none d-lg-table-cell" style={{ width: 120 }}>Part</th>
                          </tr>
                        </thead>
                        <tbody>
                          {topClients.map((c, i) => (
                            <tr key={c.clientId}>
                              <td className="text-muted small">{i + 1}</td>
                              <td>
                                <span className="fw-medium">{c.displayName}</span>
                              </td>
                              <td className="text-end fw-semibold text-success">
                                {formatMoney(c.totalCA)}
                              </td>
                              <td className="text-end d-none d-md-table-cell text-muted small">
                                {c.nbFactures}
                              </td>
                              <td className="d-none d-lg-table-cell">
                                <div className="d-flex align-items-center gap-2">
                                  <div
                                    className="flex-grow-1 bg-light rounded"
                                    style={{ height: 6 }}
                                  >
                                    <div
                                      className="rounded"
                                      style={{
                                        width: `${c.pct}%`,
                                        height: 6,
                                        backgroundColor: '#059669',
                                        transition: 'width 0.4s ease',
                                      }}
                                    />
                                  </div>
                                  <span className="text-muted small" style={{ minWidth: 30 }}>
                                    {c.pct}%
                                  </span>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          )}

          {canViewStock && (
            <Col lg={canViewFactures ? 5 : 12}>
              <Card className="shadow-sm h-100">
                <Card.Header className="bg-white d-flex justify-content-between align-items-center">
                  <h6 className="mb-0">
                    <FiAlertTriangle size={16} className="me-2 text-danger" />
                    Alertes stock
                  </h6>
                  {isLoadingStockAlerts ? (
                    <Spinner animation="border" size="sm" />
                  ) : (
                    <Badge bg={stockAlerts.some((a) => a.severity === 'critical') ? 'danger' : 'warning'}>
                      {stockAlerts.length}
                    </Badge>
                  )}
                </Card.Header>
                <Card.Body className="p-0" style={{ maxHeight: 340, overflowY: 'auto' }}>
                  {stockAlerts.length === 0 && !isLoadingStockAlerts ? (
                    <div className="text-center text-success py-4">
                      <FiCheckCircle size={32} className="mb-2 opacity-50" />
                      <p className="mb-0 small">Tous les stocks sont au-dessus du seuil</p>
                    </div>
                  ) : (
                    <div className="list-group list-group-flush">
                      {stockAlerts.map((alert) => (
                        <div
                          key={alert.stockId}
                          className="list-group-item list-group-item-action d-flex align-items-center py-2 px-3"
                        >
                          <div
                            className="rounded-circle d-flex align-items-center justify-content-center me-2 flex-shrink-0"
                            style={{
                              width: 32,
                              height: 32,
                              backgroundColor: alert.severity === 'critical' ? '#dc262615' : '#d9770615',
                              color: alert.severity === 'critical' ? '#dc2626' : '#d97706',
                            }}
                          >
                            <FiAlertTriangle size={14} />
                          </div>
                          <div className="flex-grow-1 overflow-hidden">
                            <div
                              className="fw-medium text-truncate small"
                              title={alert.productName}
                            >
                              {alert.productName}
                            </div>
                            <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                              {alert.warehouseName} — {alert.quantite} / {alert.seuil}
                            </div>
                          </div>
                          <Badge
                            bg={alert.severity === 'critical' ? 'danger' : 'warning'}
                            className="ms-2 flex-shrink-0"
                          >
                            {alert.severity === 'critical' ? 'Rupture' : 'Faible'}
                          </Badge>
                        </div>
                      ))}
                    </div>
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
