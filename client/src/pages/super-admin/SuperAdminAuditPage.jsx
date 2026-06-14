import React, { useState } from 'react';
import {
  Card, Table, Badge, Button, Form, Row, Col,
  Spinner, Alert, Modal, InputGroup,
} from 'react-bootstrap';
import {
  FiAlertTriangle, FiRefreshCw, FiTrash2, FiFilter,
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import {
  useGetSuperAdminAuditLogsQuery,
  usePurgeAuditLogsMutation,
} from '../../redux/api/superAdminApi';

const ACTION_COLORS = {
  create: 'success',
  update: 'primary',
  delete: 'danger',
  login: 'info',
  logout: 'secondary',
  export: 'warning',
  other: 'light',
};

const SuperAdminAuditPage = () => {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ module: '', action: '', dateFrom: '', dateTo: '' });
  const [purgeModal, setPurgeModal] = useState(false);
  const [purgeDays, setPurgeDays] = useState(90);

  const params = {
    page,
    limit: 25,
    ...(filters.module && { module: filters.module }),
    ...(filters.action && { action: filters.action }),
    ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
    ...(filters.dateTo && { dateTo: filters.dateTo }),
  };

  const { data, isLoading, isError, refetch } = useGetSuperAdminAuditLogsQuery(params);
  const [purgeLogs, { isLoading: purging }] = usePurgeAuditLogsMutation();

  const logs = data?.data || [];
  const pagination = data?.pagination;

  const handlePurge = async () => {
    try {
      const result = await purgeLogs({ olderThanDays: purgeDays }).unwrap();
      toast.success(result.message);
      setPurgeModal(false);
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || 'Erreur lors de la purge.');
    }
  };

  const updateFilter = (key, value) => {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(1);
  };

  return (
    <div className="p-4">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h4 className="fw-bold mb-1"><FiAlertTriangle className="me-2" />Journal d'Audit</h4>
          <p className="text-muted mb-0 small">
            {pagination?.total ? `${pagination.total} entrée(s)` : ''}
          </p>
        </div>
        <div className="d-flex gap-2">
          <Button variant="outline-secondary" size="sm" onClick={refetch}>
            <FiRefreshCw size={14} className="me-1" /> Actualiser
          </Button>
          <Button variant="outline-danger" size="sm" onClick={() => setPurgeModal(true)}>
            <FiTrash2 size={14} className="me-1" /> Purger les anciens logs
          </Button>
        </div>
      </div>

      {/* Filtres */}
      <Card className="border-0 shadow-sm mb-3">
        <Card.Body className="py-2">
          <Row className="g-2 align-items-center">
            <Col xs={12} sm={6} md={3}>
              <Form.Select size="sm" value={filters.module} onChange={(e) => updateFilter('module', e.target.value)}>
                <option value="">Tous les modules</option>
                {['users', 'roles', 'clients', 'fournisseurs', 'produits', 'factures', 'paiements', 'comptabilite', 'audit', 'backups', 'settings', 'company'].map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </Form.Select>
            </Col>
            <Col xs={12} sm={6} md={2}>
              <Form.Select size="sm" value={filters.action} onChange={(e) => updateFilter('action', e.target.value)}>
                <option value="">Toutes les actions</option>
                {['create', 'update', 'delete', 'login', 'logout', 'export', 'other'].map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </Form.Select>
            </Col>
            <Col xs={12} sm={6} md={3}>
              <InputGroup size="sm">
                <InputGroup.Text><FiFilter size={12} /></InputGroup.Text>
                <Form.Control
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => updateFilter('dateFrom', e.target.value)}
                  placeholder="Depuis"
                />
              </InputGroup>
            </Col>
            <Col xs={12} sm={6} md={3}>
              <Form.Control
                size="sm"
                type="date"
                value={filters.dateTo}
                onChange={(e) => updateFilter('dateTo', e.target.value)}
                placeholder="Jusqu'à"
              />
            </Col>
            <Col xs="auto">
              <Button size="sm" variant="outline-secondary" onClick={() => { setFilters({ module: '', action: '', dateFrom: '', dateTo: '' }); setPage(1); }}>
                Effacer
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {isLoading && <div className="text-center py-5"><Spinner /></div>}
      {isError && <Alert variant="danger">Impossible de charger le journal d'audit.</Alert>}

      <Card className="border-0 shadow-sm">
        <Card.Body className="p-0">
          <Table responsive hover size="sm" className="mb-0">
            <thead className="table-light">
              <tr>
                <th>Date & Heure</th>
                <th>Utilisateur</th>
                <th>Action</th>
                <th>Module</th>
                <th>Description</th>
                <th>IP</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 && !isLoading && (
                <tr><td colSpan={6} className="text-center py-4 text-muted">Aucune entrée dans ce journal.</td></tr>
              )}
              {logs.map((log) => (
                <tr key={log._id}>
                  <td className="small text-nowrap text-muted">
                    {new Date(log.createdAt).toLocaleString('fr-SN')}
                  </td>
                  <td className="small">
                    {log.user ? (
                      <>
                        <div>{log.user.firstName} {log.user.lastName}</div>
                        <div className="text-muted">{log.user.email}</div>
                      </>
                    ) : '—'}
                  </td>
                  <td>
                    <Badge bg={ACTION_COLORS[log.action] || 'secondary'} text={['light', 'warning'].includes(ACTION_COLORS[log.action]) ? 'dark' : undefined}>
                      {log.action}
                    </Badge>
                  </td>
                  <td><code className="small">{log.module}</code></td>
                  <td className="small" style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {log.description || '—'}
                  </td>
                  <td className="small text-muted">{log.ipAddress || '—'}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
        {pagination && pagination.totalPages > 1 && (
          <Card.Footer className="bg-transparent border-0 d-flex align-items-center justify-content-between">
            <small className="text-muted">Page {pagination.page}/{pagination.totalPages}</small>
            <div className="d-flex gap-1">
              <Button size="sm" variant="outline-secondary" disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</Button>
              <Button size="sm" variant="outline-secondary" disabled={page >= pagination.totalPages} onClick={() => setPage(p => p + 1)}>›</Button>
            </div>
          </Card.Footer>
        )}
      </Card>

      {/* Modal Purge */}
      <Modal show={purgeModal} onHide={() => setPurgeModal(false)} centered size="sm">
        <Modal.Header closeButton>
          <Modal.Title><FiTrash2 className="me-2 text-danger" />Purger les logs</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="danger" className="small">
            Cette action supprime définitivement les journaux. Elle ne peut pas être annulée.
          </Alert>
          <Form.Group>
            <Form.Label>Supprimer les logs antérieurs à</Form.Label>
            <Form.Select value={purgeDays} onChange={(e) => setPurgeDays(Number(e.target.value))}>
              <option value={30}>30 jours</option>
              <option value={60}>60 jours</option>
              <option value={90}>90 jours (recommandé)</option>
              <option value={180}>180 jours</option>
              <option value={365}>365 jours</option>
            </Form.Select>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" size="sm" onClick={() => setPurgeModal(false)}>Annuler</Button>
          <Button variant="danger" size="sm" onClick={handlePurge} disabled={purging}>
            {purging ? <Spinner size="sm" className="me-1" /> : null}
            Purger
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default SuperAdminAuditPage;
