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
import { FiSearch, FiEye, FiFileText, FiAlertTriangle } from 'react-icons/fi';
import usePageTitle from '../../../hooks/usePageTitle';
import { formatMoney, formatDate } from '../../../utils/formatters';
import { useGetFacturesQuery } from '../../../redux/api/facturesApi';
import usePdfActions from '../../../hooks/usePdfActions';

const STATUT_CONFIG = {
  brouillon: { label: 'Brouillon', variant: 'secondary' },
  validee:   { label: 'Validé',    variant: 'primary' },
  envoyee:   { label: 'Envoyé',    variant: 'info' },
  annulee:   { label: 'Annulé',    variant: 'danger' },
};

const AvoirsListPage = () => {
  usePageTitle('Avoirs clients', [
    { label: 'Accueil', path: '/' },
    { label: 'Ventes', path: '#' },
    { label: 'Avoirs' },
  ]);

  const [filters, setFilters] = useState({ search: '', statut: '', page: 1, limit: 20 });
  const { downloadPdf } = usePdfActions();

  const { data, isLoading, error } = useGetFacturesQuery({
    ...filters,
    typeDocument: 'avoir',
  });

  const avoirs = data?.data || [];
  const meta = data?.meta || {};

  const handleFilter = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value, page: 1 }));
  };

  return (
    <>
      <div className="page-header">
        <div className="d-flex align-items-center gap-2">
          <FiFileText size={22} className="text-warning" />
          <h1 className="mb-0">Avoirs clients</h1>
        </div>
      </div>

      {/* KPIs rapides */}
      <Row className="g-3 mb-3">
        <Col sm={6} md={3}>
          <Card className="shadow-sm border-0 text-center py-3">
            <div className="fs-4 fw-bold text-primary">{meta.total ?? 0}</div>
            <div className="text-muted small">Total avoirs</div>
          </Card>
        </Col>
        <Col sm={6} md={3}>
          <Card className="shadow-sm border-0 text-center py-3">
            <div className="fs-4 fw-bold text-success">
              {formatMoney(avoirs.reduce((s, a) => s + (a.totalTTC || 0), 0))}
            </div>
            <div className="text-muted small">Montant total (page)</div>
          </Card>
        </Col>
        <Col sm={6} md={3}>
          <Card className="shadow-sm border-0 text-center py-3">
            <div className="fs-4 fw-bold text-secondary">
              {avoirs.filter((a) => a.statut === 'brouillon').length}
            </div>
            <div className="text-muted small">En brouillon</div>
          </Card>
        </Col>
        <Col sm={6} md={3}>
          <Card className="shadow-sm border-0 text-center py-3">
            <div className="fs-4 fw-bold text-primary">
              {avoirs.filter((a) => a.statut === 'validee').length}
            </div>
            <div className="text-muted small">Validés</div>
          </Card>
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
                  placeholder="N° avoir, client..."
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
              <FiAlertTriangle className="me-2" />
              Erreur : {error.data?.message || error.message}
            </Alert>
          ) : avoirs.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <FiFileText size={40} className="mb-2 text-muted" />
              <p>Aucun avoir trouvé</p>
              <small>Les avoirs sont créés depuis le détail d'une facture validée</small>
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover className="mb-0">
                <thead className="table-light">
                  <tr>
                    <th>N° Avoir</th>
                    <th>Client</th>
                    <th>Facture d'origine</th>
                    <th>Date</th>
                    <th className="text-end">Total TTC</th>
                    <th className="text-center">Statut</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {avoirs.map((avoir) => {
                    const cfg = STATUT_CONFIG[avoir.statut] || { label: avoir.statut, variant: 'secondary' };
                    return (
                      <tr key={avoir._id}>
                        <td className="fw-medium small">{avoir.numero || '—'}</td>
                        <td className="small">
                          {avoir.clientSnapshot?.displayName ||
                            avoir.clientSnapshot?.raisonSociale ||
                            avoir.client?.raisonSociale ||
                            '—'}
                        </td>
                        <td className="small">
                          {avoir.factureOrigine ? (
                            <Link
                              to={`/ventes/factures/${avoir.factureOrigine._id || avoir.factureOrigine}`}
                              className="text-decoration-none"
                            >
                              {avoir.factureOrigine.numero || 'Voir'}
                            </Link>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </td>
                        <td className="small">{formatDate(avoir.dateFacture)}</td>
                        <td className="text-end fw-semibold text-danger small">
                          -{formatMoney(avoir.totalTTC)}
                        </td>
                        <td className="text-center">
                          <Badge bg={cfg.variant} style={{ fontSize: '0.7rem' }}>{cfg.label}</Badge>
                        </td>
                        <td className="text-end">
                          <div className="d-flex gap-1 justify-content-end">
                            <Button
                              as={Link}
                              to={`/ventes/avoirs/${avoir._id}`}
                              variant="outline-primary"
                              size="sm"
                              title="Voir l'avoir"
                            >
                              <FiEye size={14} />
                            </Button>
                            {avoir.statut !== 'brouillon' && (
                              <Button
                                variant="outline-secondary"
                                size="sm"
                                onClick={() => downloadPdf(`/factures/${avoir._id}/pdf`, `${avoir.numero || 'avoir'}.pdf`)}
                                title="Télécharger PDF"
                              >
                                PDF
                              </Button>
                            )}
                          </div>
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
              Page {meta.page} / {meta.totalPages} — {meta.total} avoir(s)
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

export default AvoirsListPage;
