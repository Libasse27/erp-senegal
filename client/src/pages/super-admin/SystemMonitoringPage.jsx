import React from 'react';
import { Row, Col, Card, Badge, Spinner, Alert, ProgressBar, Table } from 'react-bootstrap';
import { FiServer, FiDatabase, FiCpu, FiHardDrive, FiRefreshCw, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import { useGetSystemHealthQuery } from '../../redux/api/superAdminApi';

const StatusBadge = ({ status }) => {
  const map = {
    healthy:    { bg: 'success', label: 'Opérationnel' },
    degraded:   { bg: 'warning', label: 'Dégradé' },
    unhealthy:  { bg: 'danger',  label: 'Défaillant' },
    disabled:   { bg: 'secondary', label: 'Désactivé' },
    unknown:    { bg: 'secondary', label: 'Inconnu' },
  };
  const cfg = map[status] || map.unknown;
  return <Badge bg={cfg.bg}>{cfg.label}</Badge>;
};

function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatUptime(seconds) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return [d && `${d}j`, h && `${h}h`, `${m}m`].filter(Boolean).join(' ');
}

const SystemMonitoringPage = () => {
  const { data, isLoading, isError, refetch } = useGetSystemHealthQuery(undefined, {
    pollingInterval: 30000,
  });

  const health = data?.data;

  const memPercent = health?.memory?.usagePercent || 0;
  const memColor = memPercent > 85 ? 'danger' : memPercent > 65 ? 'warning' : 'success';

  const heapPercent = health
    ? Math.round((health.memory.process.heapUsed / health.memory.process.heapTotal) * 100)
    : 0;

  return (
    <div className="p-4">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h4 className="fw-bold mb-1"><FiServer className="me-2" />Monitoring Système</h4>
          <p className="text-muted mb-0 small">Actualisation automatique toutes les 30 secondes</p>
        </div>
        <button className="btn btn-outline-secondary btn-sm" onClick={refetch}>
          <FiRefreshCw size={14} className="me-1" /> Actualiser
        </button>
      </div>

      {isLoading && <div className="text-center py-5"><Spinner /></div>}
      {isError && <Alert variant="danger">Impossible de charger les données de monitoring.</Alert>}

      {health && (
        <Row className="g-3">
          {/* Serveur */}
          <Col xs={12} md={6}>
            <Card className="border-0 shadow-sm h-100">
              <Card.Header className="bg-transparent border-0 pt-3">
                <h6 className="fw-bold mb-0"><FiServer className="me-2" />Serveur</h6>
              </Card.Header>
              <Card.Body>
                <Table borderless size="sm" className="mb-0">
                  <tbody>
                    <tr><td className="text-muted">Statut</td><td><StatusBadge status={health.server.status} /></td></tr>
                    <tr><td className="text-muted">Uptime</td><td>{formatUptime(health.server.uptime)}</td></tr>
                    <tr><td className="text-muted">Node.js</td><td><code>{health.server.nodeVersion}</code></td></tr>
                    <tr><td className="text-muted">Plateforme</td><td>{health.server.platform} ({health.server.arch})</td></tr>
                    <tr><td className="text-muted">Hôte</td><td>{health.server.hostname}</td></tr>
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Col>

          {/* CPU */}
          <Col xs={12} md={6}>
            <Card className="border-0 shadow-sm h-100">
              <Card.Header className="bg-transparent border-0 pt-3">
                <h6 className="fw-bold mb-0"><FiCpu className="me-2" />Processeur</h6>
              </Card.Header>
              <Card.Body>
                <Table borderless size="sm" className="mb-0">
                  <tbody>
                    <tr><td className="text-muted">Modèle</td><td className="small">{health.cpu.model}</td></tr>
                    <tr><td className="text-muted">Cœurs</td><td>{health.cpu.count}</td></tr>
                    <tr><td className="text-muted">Load 1m</td><td>{health.cpu.loadAvg['1min']}</td></tr>
                    <tr><td className="text-muted">Load 5m</td><td>{health.cpu.loadAvg['5min']}</td></tr>
                    <tr><td className="text-muted">Load 15m</td><td>{health.cpu.loadAvg['15min']}</td></tr>
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Col>

          {/* Mémoire RAM */}
          <Col xs={12} md={6}>
            <Card className="border-0 shadow-sm h-100">
              <Card.Header className="bg-transparent border-0 pt-3">
                <h6 className="fw-bold mb-0"><FiHardDrive className="me-2" />Mémoire RAM</h6>
              </Card.Header>
              <Card.Body>
                <div className="mb-3">
                  <div className="d-flex justify-content-between small mb-1">
                    <span>Utilisation système</span>
                    <span className={`fw-bold text-${memColor}`}>{memPercent}%</span>
                  </div>
                  <ProgressBar now={memPercent} variant={memColor} style={{ height: '8px' }} />
                  <div className="text-muted small mt-1">
                    {formatBytes(health.memory.usedBytes)} / {formatBytes(health.memory.totalBytes)} — Libre : {formatBytes(health.memory.freeBytes)}
                  </div>
                </div>

                <div className="mb-2">
                  <div className="d-flex justify-content-between small mb-1">
                    <span>Heap Node.js</span>
                    <span className="fw-bold">{heapPercent}%</span>
                  </div>
                  <ProgressBar now={heapPercent} variant="info" style={{ height: '6px' }} />
                  <div className="text-muted small mt-1">
                    {formatBytes(health.memory.process.heapUsed)} / {formatBytes(health.memory.process.heapTotal)}
                  </div>
                </div>

                <Table borderless size="sm" className="mb-0 mt-3">
                  <tbody>
                    <tr><td className="text-muted">RSS</td><td>{formatBytes(health.memory.process.rss)}</td></tr>
                    <tr><td className="text-muted">External</td><td>{formatBytes(health.memory.process.external)}</td></tr>
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Col>

          {/* Bases de données */}
          <Col xs={12} md={6}>
            <Card className="border-0 shadow-sm h-100">
              <Card.Header className="bg-transparent border-0 pt-3">
                <h6 className="fw-bold mb-0"><FiDatabase className="me-2" />Bases de Données</h6>
              </Card.Header>
              <Card.Body>
                <div className="mb-3 p-3 rounded-2" style={{ background: 'var(--bs-light)' }}>
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <span className="fw-medium">MongoDB</span>
                    <div className="d-flex align-items-center gap-2">
                      {health.mongodb.status === 'healthy'
                        ? <FiCheckCircle className="text-success" />
                        : <FiXCircle className="text-danger" />
                      }
                      <StatusBadge status={health.mongodb.status} />
                    </div>
                  </div>
                  <Table borderless size="sm" className="mb-0 small">
                    <tbody>
                      <tr><td className="text-muted">Hôte</td><td>{health.mongodb.host}</td></tr>
                      <tr><td className="text-muted">Base</td><td>{health.mongodb.dbName}</td></tr>
                      <tr><td className="text-muted">Latence</td><td>{health.mongodb.latencyMs ?? '—'} ms</td></tr>
                    </tbody>
                  </Table>
                </div>

                <div className="p-3 rounded-2" style={{ background: 'var(--bs-light)' }}>
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <span className="fw-medium">Redis</span>
                    <div className="d-flex align-items-center gap-2">
                      {health.redis.status === 'healthy'
                        ? <FiCheckCircle className="text-success" />
                        : health.redis.status === 'disabled'
                        ? null
                        : <FiXCircle className="text-danger" />
                      }
                      <StatusBadge status={health.redis.status} />
                    </div>
                  </div>
                  {health.redis.latencyMs != null && (
                    <div className="text-muted small">Latence : {health.redis.latencyMs} ms</div>
                  )}
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </div>
  );
};

export default SystemMonitoringPage;
