import React from 'react';
import { Link } from 'react-router-dom';
import { Row, Col, Card, Badge, Spinner, Alert, ProgressBar } from 'react-bootstrap';
import {
  FiUsers, FiShield, FiDatabase, FiServer, FiActivity,
  FiAlertTriangle, FiHardDrive, FiCpu, FiCheckCircle,
  FiXCircle, FiRefreshCw, FiArchive, FiFileText,
} from 'react-icons/fi';
import { useGetSystemStatsQuery, useGetSystemHealthQuery } from '../../redux/api/superAdminApi';
import { useAuth } from '../../contexts/AuthContext';

const StatusDot = ({ status }) => {
  const colors = {
    healthy: 'success',
    degraded: 'warning',
    unhealthy: 'danger',
    disabled: 'secondary',
    unknown: 'secondary',
  };
  const labels = {
    healthy: 'Opérationnel',
    degraded: 'Dégradé',
    unhealthy: 'Défaillant',
    disabled: 'Désactivé',
    unknown: 'Inconnu',
  };
  return <Badge bg={colors[status] || 'secondary'}>{labels[status] || status}</Badge>;
};

const KpiCard = ({ title, value, sub, icon: Icon, color = 'primary', to }) => (
  <Card className="h-100 border-0 shadow-sm">
    <Card.Body className="d-flex align-items-center gap-3">
      <div
        className="rounded-3 p-3 flex-shrink-0"
        style={{ background: `var(--bs-${color}-bg-subtle)` }}
      >
        <Icon size={22} className={`text-${color}`} />
      </div>
      <div className="flex-grow-1">
        <div className="text-muted small">{title}</div>
        <div className="fs-4 fw-bold">{value ?? '—'}</div>
        {sub && <div className="text-muted small">{sub}</div>}
      </div>
      {to && (
        <Link to={to} className={`btn btn-sm btn-outline-${color}`}>
          Voir
        </Link>
      )}
    </Card.Body>
  </Card>
);

const HealthRow = ({ label, data, latencyKey = 'latencyMs' }) => {
  if (!data) return null;
  const isOk = data.status === 'healthy';
  return (
    <div className="d-flex align-items-center justify-content-between py-2 border-bottom">
      <span className="fw-medium">{label}</span>
      <div className="d-flex align-items-center gap-3">
        {data[latencyKey] != null && (
          <span className="text-muted small">{data[latencyKey]} ms</span>
        )}
        <StatusDot status={data.status} />
        {isOk ? <FiCheckCircle className="text-success" /> : <FiXCircle className="text-danger" />}
      </div>
    </div>
  );
};

const SuperAdminDashboard = () => {
  const { user } = useAuth();
  const {
    data: statsData,
    isLoading: statsLoading,
    refetch: refetchStats,
  } = useGetSystemStatsQuery();
  const {
    data: healthData,
    isLoading: healthLoading,
    refetch: refetchHealth,
  } = useGetSystemHealthQuery();

  const stats = statsData?.data;
  const health = healthData?.data;

  const memPercent = health?.memory?.usagePercent || 0;
  const memColor = memPercent > 85 ? 'danger' : memPercent > 65 ? 'warning' : 'success';

  const uptimeHours = health ? Math.floor(health.server.uptime / 3600) : 0;
  const uptimeMins = health ? Math.floor((health.server.uptime % 3600) / 60) : 0;

  return (
    <div className="p-4">
      {/* En-tête */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h3 className="mb-1 fw-bold">
            <FiShield className="me-2 text-danger" />
            Super Administration
          </h3>
          <p className="text-muted mb-0">
            Bonjour {user?.firstName} — Contrôle total de la plateforme ERP GesCom-Compta
          </p>
        </div>
        <button
          className="btn btn-outline-secondary btn-sm"
          onClick={() => { refetchStats(); refetchHealth(); }}
        >
          <FiRefreshCw size={14} className="me-1" /> Actualiser
        </button>
      </div>

      {/* KPIs */}
      {statsLoading ? (
        <div className="text-center py-4"><Spinner animation="border" /></div>
      ) : (
        <Row className="g-3 mb-4">
          <Col xs={12} sm={6} xl={3}>
            <KpiCard
              title="Utilisateurs"
              value={stats?.users?.total}
              sub={`${stats?.users?.active} actifs`}
              icon={FiUsers}
              color="primary"
              to="/super-admin/utilisateurs"
            />
          </Col>
          <Col xs={12} sm={6} xl={3}>
            <KpiCard
              title="Clients"
              value={stats?.clients}
              icon={FiUsers}
              color="success"
            />
          </Col>
          <Col xs={12} sm={6} xl={3}>
            <KpiCard
              title="Fournisseurs"
              value={stats?.fournisseurs}
              icon={FiUsers}
              color="info"
            />
          </Col>
          <Col xs={12} sm={6} xl={3}>
            <KpiCard
              title="Produits"
              value={stats?.produits}
              icon={FiHardDrive}
              color="warning"
            />
          </Col>
          <Col xs={12} sm={6} xl={3}>
            <KpiCard
              title="Factures"
              value={stats?.factures}
              icon={FiFileText}
              color="secondary"
            />
          </Col>
          <Col xs={12} sm={6} xl={3}>
            <KpiCard
              title="CA Total"
              value={stats?.ca?.total ? `${stats.ca.total.toLocaleString('fr-SN')} FCFA` : '—'}
              sub={`Mois: ${stats?.ca?.mois ? stats.ca.mois.toLocaleString('fr-SN') + ' FCFA' : '—'}`}
              icon={FiActivity}
              color="success"
            />
          </Col>
          <Col xs={12} sm={6} xl={3}>
            <KpiCard
              title="Journaux d'audit"
              value={stats?.auditLogs}
              icon={FiFileText}
              color="danger"
              to="/super-admin/audit"
            />
          </Col>
          <Col xs={12} sm={6} xl={3}>
            <KpiCard
              title="Rôles"
              value={stats?.roles}
              icon={FiShield}
              color="primary"
              to="/super-admin/rbac"
            />
          </Col>
        </Row>
      )}

      <Row className="g-3">
        {/* Santé Système */}
        <Col xs={12} lg={6}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Header className="bg-transparent border-0 pt-3">
              <div className="d-flex align-items-center justify-content-between">
                <h6 className="mb-0 fw-bold">
                  <FiServer className="me-2" /> Santé du Système
                </h6>
                {healthLoading && <Spinner size="sm" />}
              </div>
            </Card.Header>
            <Card.Body>
              {health ? (
                <>
                  <HealthRow label="Serveur Node.js" data={health.server} />
                  <HealthRow label="MongoDB" data={health.mongodb} />
                  <HealthRow label="Redis" data={health.redis} />

                  <div className="mt-3">
                    <div className="d-flex justify-content-between small mb-1">
                      <span>Mémoire RAM utilisée</span>
                      <span className={`text-${memColor}`}>{memPercent}%</span>
                    </div>
                    <ProgressBar now={memPercent} variant={memColor} style={{ height: '6px' }} />
                    <div className="text-muted small mt-1">
                      {formatBytes(health.memory.usedBytes)} / {formatBytes(health.memory.totalBytes)}
                    </div>
                  </div>

                  <div className="mt-3 d-flex gap-3 flex-wrap">
                    <div className="text-muted small">
                      <FiCpu className="me-1" />
                      {health.cpu.count} CPU · Load {health.cpu.loadAvg['1min']}
                    </div>
                    <div className="text-muted small">
                      Uptime {uptimeHours}h {uptimeMins}m
                    </div>
                    <div className="text-muted small">
                      Node {health.server.nodeVersion}
                    </div>
                  </div>
                </>
              ) : (
                healthLoading ? null : <Alert variant="warning">Données de santé indisponibles</Alert>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Raccourcis Super Admin */}
        <Col xs={12} lg={6}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Header className="bg-transparent border-0 pt-3">
              <h6 className="mb-0 fw-bold">
                <FiShield className="me-2" /> Accès Rapide
              </h6>
            </Card.Header>
            <Card.Body>
              <div className="d-grid gap-2">
                {[
                  { to: '/super-admin/utilisateurs', icon: FiUsers, label: 'Gestion des Utilisateurs', color: 'primary' },
                  { to: '/super-admin/rbac', icon: FiShield, label: 'Matrice RBAC', color: 'danger' },
                  { to: '/super-admin/monitoring', icon: FiServer, label: 'Monitoring Système', color: 'success' },
                  { to: '/super-admin/logs', icon: FiFileText, label: 'Journaux Système', color: 'warning' },
                  { to: '/super-admin/sauvegardes', icon: FiArchive, label: 'Sauvegardes', color: 'info' },
                  { to: '/super-admin/audit', icon: FiAlertTriangle, label: "Journal d'Audit", color: 'secondary' },
                ].map(({ to, icon: Icon, label, color }) => (
                  <Link key={to} to={to} className={`btn btn-outline-${color} text-start`}>
                    <Icon size={16} className="me-2" />
                    {label}
                  </Link>
                ))}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export default SuperAdminDashboard;
