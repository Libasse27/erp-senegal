import React, { useState } from 'react';
import {
  Card, Row, Col, Form, Badge, Spinner, Alert, Button,
} from 'react-bootstrap';
import { FiFileText, FiRefreshCw, FiAlertTriangle, FiInfo, FiAlertCircle } from 'react-icons/fi';
import { useGetSystemLogsQuery, useGetLogFilesQuery } from '../../redux/api/superAdminApi';

const LevelBadge = ({ level }) => {
  const map = {
    error:   { bg: 'danger',    label: 'ERROR' },
    warn:    { bg: 'warning',   label: 'WARN' },
    info:    { bg: 'info',      label: 'INFO' },
    http:    { bg: 'secondary', label: 'HTTP' },
    verbose: { bg: 'light',     label: 'VERBOSE' },
    debug:   { bg: 'light',     label: 'DEBUG' },
  };
  const cfg = map[level] || { bg: 'secondary', label: level?.toUpperCase() || '?' };
  return <Badge bg={cfg.bg} text={['light', 'warning'].includes(cfg.bg) ? 'dark' : undefined}>{cfg.label}</Badge>;
};

const LevelIcon = ({ level }) => {
  if (level === 'error') return <FiAlertCircle className="text-danger" size={14} />;
  if (level === 'warn') return <FiAlertTriangle className="text-warning" size={14} />;
  return <FiInfo className="text-info" size={14} />;
};

const SystemLogsPage = () => {
  const [logType, setLogType] = useState('combined');
  const [lines, setLines] = useState(100);

  const { data: filesData } = useGetLogFilesQuery();
  const { data, isLoading, isError, refetch } = useGetSystemLogsQuery({ type: logType, lines });

  const logs = data?.data?.lines || [];
  const logFiles = filesData?.data || [];

  return (
    <div className="p-4">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h4 className="fw-bold mb-1"><FiFileText className="me-2" />Journaux Système</h4>
          <p className="text-muted mb-0 small">
            {data?.data?.total ? `${data.data.total} lignes au total — ${data.data.returned} affichées` : ''}
          </p>
        </div>
        <Button variant="outline-secondary" size="sm" onClick={refetch}>
          <FiRefreshCw size={14} className="me-1" /> Actualiser
        </Button>
      </div>

      {/* Contrôles */}
      <Card className="border-0 shadow-sm mb-3">
        <Card.Body className="py-2">
          <Row className="g-2 align-items-center">
            <Col xs="auto">
              <Form.Select
                size="sm"
                value={logType}
                onChange={(e) => setLogType(e.target.value)}
                style={{ minWidth: '160px' }}
              >
                <option value="combined">combined.log</option>
                <option value="error">error.log</option>
                <option value="access">access.log</option>
              </Form.Select>
            </Col>
            <Col xs="auto">
              <Form.Select
                size="sm"
                value={lines}
                onChange={(e) => setLines(Number(e.target.value))}
              >
                <option value={50}>50 dernières lignes</option>
                <option value={100}>100 dernières lignes</option>
                <option value={200}>200 dernières lignes</option>
                <option value={500}>500 dernières lignes</option>
              </Form.Select>
            </Col>
            {logFiles.length > 0 && (
              <Col xs="auto" className="ms-auto">
                <div className="d-flex gap-2">
                  {logFiles.map((f) => (
                    <span key={f.name} className="badge bg-light text-dark border small">
                      {f.name} · {formatBytes(f.size)}
                    </span>
                  ))}
                </div>
              </Col>
            )}
          </Row>
        </Card.Body>
      </Card>

      {isLoading && <div className="text-center py-5"><Spinner /></div>}
      {isError && <Alert variant="danger">Impossible de charger les journaux système.</Alert>}

      {!isLoading && (
        <Card className="border-0 shadow-sm">
          <Card.Body className="p-0">
            {data?.data?.message && (
              <div className="p-3 text-muted text-center">{data.data.message}</div>
            )}
            <div
              style={{
                fontFamily: 'monospace',
                fontSize: '0.78rem',
                maxHeight: '70vh',
                overflowY: 'auto',
                backgroundColor: '#0d1117',
                color: '#c9d1d9',
              }}
            >
              {logs.map((log, idx) => (
                <div
                  key={idx}
                  className="d-flex align-items-start gap-2 px-3 py-1 border-bottom border-secondary"
                  style={{
                    borderColor: '#21262d !important',
                    background: log.level === 'error' ? 'rgba(248, 81, 73, 0.08)' :
                                log.level === 'warn' ? 'rgba(210, 153, 34, 0.08)' : 'transparent',
                  }}
                >
                  <span className="flex-shrink-0 mt-1"><LevelIcon level={log.level} /></span>
                  <span className="flex-shrink-0" style={{ minWidth: '160px', color: '#8b949e' }}>
                    {log.timestamp || ''}
                  </span>
                  <span className="flex-shrink-0"><LevelBadge level={log.level} /></span>
                  <span className="flex-grow-1" style={{ wordBreak: 'break-all' }}>
                    {log.stack || log.message || JSON.stringify(log)}
                  </span>
                </div>
              ))}
              {logs.length === 0 && (
                <div className="p-4 text-center" style={{ color: '#8b949e' }}>
                  Aucune entrée dans ce journal.
                </div>
              )}
            </div>
          </Card.Body>
        </Card>
      )}
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

export default SystemLogsPage;
