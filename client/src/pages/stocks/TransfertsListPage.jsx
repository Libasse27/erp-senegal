import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Table from 'react-bootstrap/Table';
import Button from 'react-bootstrap/Button';
import Badge from 'react-bootstrap/Badge';
import Form from 'react-bootstrap/Form';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import {
  FiPlus,
  FiEye,
  FiArrowRight,
  FiPackage,
  FiAlertTriangle,
  FiCheckCircle,
  FiXCircle,
  FiClock,
} from 'react-icons/fi';
import usePageTitle from '../../hooks/usePageTitle';
import { formatDate } from '../../utils/formatters';
import { useGetTransfertsQuery } from '../../redux/api/transfertsApi';
import { useGetWarehousesQuery } from '../../redux/api/stocksApi';
import { useAuth } from '../../contexts/AuthContext';
import { PERM } from '../../config/permissions';

const STATUT_CFG = {
  brouillon: { label: 'Brouillon', variant: 'secondary', icon: FiClock },
  valide:    { label: 'Validé',    variant: 'success',   icon: FiCheckCircle },
  annule:    { label: 'Annulé',    variant: 'danger',    icon: FiXCircle },
};

const TransfertsListPage = () => {
  usePageTitle('Transferts de stock', [
    { label: 'Accueil', path: '/' },
    { label: 'Stocks', path: '/stocks' },
    { label: 'Transferts' },
  ]);

  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const canCreate = hasPermission(PERM.STOCKS_UPDATE);

  const [filters, setFilters] = useState({ statut: '', warehouseSource: '', warehouseDestination: '', page: 1, limit: 20 });

  const { data, isLoading, error } = useGetTransfertsQuery(filters);
  const { data: wData } = useGetWarehousesQuery({ limit: 50 });

  const transferts = data?.data || [];
  const meta = data?.meta || {};
  const warehouses = wData?.data || [];

  return (
    <>
      <div className="page-header">
        <div className="d-flex align-items-center gap-2">
          <FiArrowRight size={22} className="text-primary" />
          <h1 className="mb-0">Transferts inter-dépôts</h1>
        </div>
        {canCreate && (
          <Button variant="primary" size="sm" onClick={() => navigate('/stocks/transferts/nouveau')}>
            <FiPlus className="me-1" /> Nouveau transfert
          </Button>
        )}
      </div>

      {/* Filtres */}
      <Card className="shadow-sm mb-3">
        <Card.Body className="py-2">
          <Row className="g-2 align-items-center">
            <Col md={3}>
              <Form.Select
                size="sm"
                value={filters.statut}
                onChange={(e) => setFilters((p) => ({ ...p, statut: e.target.value, page: 1 }))}
              >
                <option value="">Tous les statuts</option>
                {Object.entries(STATUT_CFG).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </Form.Select>
            </Col>
            <Col md={3}>
              <Form.Select
                size="sm"
                value={filters.warehouseSource}
                onChange={(e) => setFilters((p) => ({ ...p, warehouseSource: e.target.value, page: 1 }))}
              >
                <option value="">Tous les dépôts source</option>
                {warehouses.map((w) => <option key={w._id} value={w._id}>{w.name}</option>)}
              </Form.Select>
            </Col>
            <Col md={3}>
              <Form.Select
                size="sm"
                value={filters.warehouseDestination}
                onChange={(e) => setFilters((p) => ({ ...p, warehouseDestination: e.target.value, page: 1 }))}
              >
                <option value="">Tous les dépôts dest.</option>
                {warehouses.map((w) => <option key={w._id} value={w._id}>{w.name}</option>)}
              </Form.Select>
            </Col>
            <Col md="auto">
              <Button
                size="sm"
                variant="outline-secondary"
                onClick={() => setFilters({ statut: '', warehouseSource: '', warehouseDestination: '', page: 1, limit: 20 })}
              >
                Réinitialiser
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Tableau */}
      <Card className="shadow-sm">
        <Card.Body className="p-0">
          {isLoading ? (
            <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
          ) : error ? (
            <Alert variant="danger" className="m-3">
              <FiAlertTriangle className="me-2" />{error.data?.message || error.message}
            </Alert>
          ) : transferts.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <FiPackage size={44} className="mb-3" />
              <p className="mb-1">Aucun transfert enregistré</p>
              {canCreate && (
                <Button variant="primary" size="sm" onClick={() => navigate('/stocks/transferts/nouveau')}>
                  <FiPlus className="me-1" /> Créer le premier transfert
                </Button>
              )}
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover className="mb-0" style={{ fontSize: '0.875rem' }}>
                <thead className="table-light">
                  <tr>
                    <th>Référence</th>
                    <th>Date</th>
                    <th>Dépôt source</th>
                    <th></th>
                    <th>Dépôt destination</th>
                    <th className="text-center">Produits</th>
                    <th>Motif</th>
                    <th className="text-center">Statut</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {transferts.map((t) => {
                    const cfg = STATUT_CFG[t.statut] || { label: t.statut, variant: 'secondary' };
                    const Icon = cfg.icon || FiClock;
                    return (
                      <tr key={t._id}>
                        <td className="fw-medium">{t.reference}</td>
                        <td className="text-muted small">{formatDate(t.dateTransfert)}</td>
                        <td className="small">{t.warehouseSource?.name || '—'}</td>
                        <td className="text-muted"><FiArrowRight size={12} /></td>
                        <td className="small">{t.warehouseDestination?.name || '—'}</td>
                        <td className="text-center small">
                          <Badge bg="light" text="dark" pill>{t.lignes?.length || 0}</Badge>
                        </td>
                        <td className="small text-muted">{t.motif || '—'}</td>
                        <td className="text-center">
                          <Badge bg={cfg.variant} className="d-flex align-items-center gap-1 justify-content-center" style={{ fontSize: '0.7rem' }}>
                            <Icon size={10} /> {cfg.label}
                          </Badge>
                        </td>
                        <td className="text-end">
                          <Button as={Link} to={`/stocks/transferts/${t._id}`} variant="outline-primary" size="sm">
                            <FiEye size={14} />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
        {meta.totalPages > 1 && (
          <Card.Footer className="d-flex justify-content-between align-items-center">
            <small className="text-muted">Page {meta.page}/{meta.totalPages} — {meta.total} transfert(s)</small>
            <div className="d-flex gap-2">
              <Button size="sm" variant="outline-secondary" disabled={filters.page <= 1}
                onClick={() => setFilters((p) => ({ ...p, page: p.page - 1 }))}>Précédent</Button>
              <Button size="sm" variant="outline-secondary" disabled={filters.page >= meta.totalPages}
                onClick={() => setFilters((p) => ({ ...p, page: p.page + 1 }))}>Suivant</Button>
            </div>
          </Card.Footer>
        )}
      </Card>
    </>
  );
};

export default TransfertsListPage;
