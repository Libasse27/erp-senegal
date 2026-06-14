import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Table from 'react-bootstrap/Table';
import Button from 'react-bootstrap/Button';
import Badge from 'react-bootstrap/Badge';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import { FiPlus, FiSearch, FiEye, FiAlertCircle, FiCheckCircle, FiClock } from 'react-icons/fi';
import usePageTitle from '../../hooks/usePageTitle';
import { formatMoney, formatDate } from '../../utils/formatters';
import {
  useGetFacturesFournisseurQuery,
  useGetStatsFacturesFournisseurQuery,
} from '../../redux/api/facturesFournisseurApi';
import { useAuth } from '../../contexts/AuthContext';
import { PERM } from '../../config/permissions';

const STATUT_CONFIG = {
  brouillon:          { label: 'Brouillon',         variant: 'secondary' },
  validee:            { label: 'Validée',            variant: 'primary' },
  partiellement_payee:{ label: 'Part. payée',       variant: 'warning' },
  payee:              { label: 'Payée',              variant: 'success' },
  annulee:            { label: 'Annulée',            variant: 'danger' },
};

const StatCard = ({ title, value, subtitle, icon: Icon, color }) => (
  <Card className="shadow-sm border-0 h-100">
    <Card.Body className="d-flex align-items-center gap-3">
      <div
        className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
        style={{ width: 48, height: 48, background: `${color}20`, color }}
      >
        <Icon size={22} />
      </div>
      <div>
        <div className="text-muted small">{title}</div>
        <div className="fs-5 fw-bold">{value}</div>
        {subtitle && <div className="text-muted small">{subtitle}</div>}
      </div>
    </Card.Body>
  </Card>
);

const FacturesFournisseurListPage = () => {
  usePageTitle('Factures Fournisseurs', [
    { label: 'Accueil', path: '/' },
    { label: 'Achats', path: '/achats/commandes' },
    { label: 'Factures fournisseurs' },
  ]);

  const { hasPermission } = useAuth();
  const canCreate = hasPermission(PERM.FACTURES_FOURN_CREATE);

  const [filters, setFilters] = useState({ search: '', statut: '', page: 1, limit: 20 });

  const { data, isLoading, error } = useGetFacturesFournisseurQuery(filters);
  const { data: statsData } = useGetStatsFacturesFournisseurQuery();

  const factures = data?.data || [];
  const meta = data?.meta || {};
  const stats = statsData?.data || {};

  const handleFilter = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value, page: 1 }));
  };

  return (
    <>
      <div className="page-header">
        <h1>Factures Fournisseurs</h1>
        {canCreate && (
          <Button as={Link} to="/achats/factures-fournisseur/nouveau" variant="primary" size="sm">
            <FiPlus className="me-1" /> Nouvelle facture
          </Button>
        )}
      </div>

      {/* KPIs */}
      <Row className="g-3 mb-4">
        <Col sm={6} lg={3}>
          <StatCard
            title="Total dû fournisseurs"
            value={formatMoney(stats.totalDu || 0)}
            subtitle={`${stats.nbEnAttente || 0} facture(s) impayée(s)`}
            icon={FiAlertCircle}
            color="#dc2626"
          />
        </Col>
        <Col sm={6} lg={3}>
          <StatCard
            title="En attente / en cours"
            value={stats.encours || 0}
            subtitle="Brouillons + validées"
            icon={FiClock}
            color="#d97706"
          />
        </Col>
        <Col sm={6} lg={3}>
          <StatCard
            title="Payées ce mois"
            value={formatMoney(stats.paidThisMonth || 0)}
            subtitle={`${stats.nbPaidThisMonth || 0} facture(s)`}
            icon={FiCheckCircle}
            color="#059669"
          />
        </Col>
        <Col sm={6} lg={3}>
          <StatCard
            title="Échues non payées"
            value={stats.overdue || 0}
            subtitle="Délai dépassé"
            icon={FiAlertCircle}
            color="#7c3aed"
          />
        </Col>
      </Row>

      {/* Filtres */}
      <Card className="shadow-sm mb-3">
        <Card.Body>
          <Row className="g-3 align-items-end">
            <Col md={5}>
              <InputGroup>
                <InputGroup.Text><FiSearch /></InputGroup.Text>
                <Form.Control
                  placeholder="N° facture, référence fournisseur..."
                  name="search"
                  value={filters.search}
                  onChange={handleFilter}
                />
              </InputGroup>
            </Col>
            <Col md={3}>
              <Form.Select name="statut" value={filters.statut} onChange={handleFilter}>
                <option value="">Tous les statuts</option>
                {Object.entries(STATUT_CONFIG).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </Form.Select>
            </Col>
            <Col md={2}>
              <Button
                variant="outline-secondary"
                className="w-100"
                onClick={() => setFilters({ search: '', statut: '', page: 1, limit: 20 })}
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
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
            </div>
          ) : error ? (
            <Alert variant="danger" className="m-3">
              Erreur : {error.data?.message || error.message}
            </Alert>
          ) : factures.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <FiAlertCircle size={40} className="mb-2" />
              <p>Aucune facture fournisseur trouvée</p>
              {canCreate && (
                <Button as={Link} to="/achats/factures-fournisseur/nouveau" variant="primary" size="sm">
                  <FiPlus className="me-1" /> Créer une facture
                </Button>
              )}
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover className="mb-0">
                <thead className="table-light">
                  <tr>
                    <th>N° Facture</th>
                    <th>Fournisseur</th>
                    <th>Réf. fournisseur</th>
                    <th>Date</th>
                    <th>Échéance</th>
                    <th className="text-end">Total TTC</th>
                    <th className="text-end">Payé</th>
                    <th className="text-end">Restant</th>
                    <th className="text-center">Statut</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {factures.map((ff) => {
                    const cfg = STATUT_CONFIG[ff.statut] || { label: ff.statut, variant: 'secondary' };
                    const restant = (ff.totalTTC || 0) - (ff.montantPaye || 0);
                    const isOverdue =
                      ff.dateEcheance &&
                      new Date(ff.dateEcheance) < new Date() &&
                      ff.statut !== 'payee' &&
                      ff.statut !== 'annulee';
                    return (
                      <tr key={ff._id}>
                        <td className="fw-medium small">{ff.numero || '—'}</td>
                        <td className="small">
                          {ff.fournisseurSnapshot?.raisonSociale ||
                            ff.fournisseur?.raisonSociale ||
                            '—'}
                        </td>
                        <td className="text-muted small">{ff.referenceFournisseur || '—'}</td>
                        <td className="small">{formatDate(ff.dateFacture)}</td>
                        <td className="small">
                          {ff.dateEcheance ? (
                            <span className={isOverdue ? 'text-danger fw-semibold' : ''}>
                              {formatDate(ff.dateEcheance)}
                              {isOverdue && ' ⚠'}
                            </span>
                          ) : '—'}
                        </td>
                        <td className="text-end fw-semibold small">{formatMoney(ff.totalTTC)}</td>
                        <td className="text-end text-success small">{formatMoney(ff.montantPaye)}</td>
                        <td className="text-end small">
                          <span className={restant > 0 ? 'text-danger fw-semibold' : 'text-success'}>
                            {formatMoney(Math.max(0, restant))}
                          </span>
                        </td>
                        <td className="text-center">
                          <Badge bg={cfg.variant} style={{ fontSize: '0.7rem' }}>{cfg.label}</Badge>
                        </td>
                        <td className="text-end">
                          <Button
                            as={Link}
                            to={`/achats/factures-fournisseur/${ff._id}`}
                            variant="outline-primary"
                            size="sm"
                          >
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
            <small className="text-muted">
              Page {meta.page} / {meta.totalPages} — {meta.total} résultat(s)
            </small>
            <div className="d-flex gap-2">
              <Button
                size="sm"
                variant="outline-secondary"
                disabled={filters.page <= 1}
                onClick={() => setFilters((p) => ({ ...p, page: p.page - 1 }))}
              >
                Précédent
              </Button>
              <Button
                size="sm"
                variant="outline-secondary"
                disabled={filters.page >= meta.totalPages}
                onClick={() => setFilters((p) => ({ ...p, page: p.page + 1 }))}
              >
                Suivant
              </Button>
            </div>
          </Card.Footer>
        )}
      </Card>
    </>
  );
};

export default FacturesFournisseurListPage;
