import React, { useState } from 'react';
import Card from 'react-bootstrap/Card';
import Table from 'react-bootstrap/Table';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Badge from 'react-bootstrap/Badge';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import BsPagination from 'react-bootstrap/Pagination';
import { FiSearch, FiShield } from 'react-icons/fi';
import usePageTitle from '../../hooks/usePageTitle';
import { formatDateTime } from '../../utils/formatters';
import { apiSlice } from '../../redux/api/apiSlice';

// Create audit API endpoint inline
const auditApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAuditLogs: builder.query({
      query: (params) => ({ url: '/admin/audit-logs', params }),
      providesTags: [{ type: 'AuditLog', id: 'LIST' }],
    }),
  }),
});

const { useGetAuditLogsQuery } = auditApi;

const ACTION_VARIANTS = {
  create: 'success',
  update: 'info',
  delete: 'danger',
  login: 'primary',
  logout: 'secondary',
};

const ACTION_LABELS = {
  create: 'Creation',
  update: 'Modification',
  delete: 'Suppression',
  login: 'Connexion',
  logout: 'Deconnexion',
};

const MODULES = [
  { value: '', label: 'Tous les modules' },
  { value: 'auth', label: 'Authentification' },
  { value: 'clients', label: 'Clients' },
  { value: 'fournisseurs', label: 'Fournisseurs' },
  { value: 'produits', label: 'Produits' },
  { value: 'stocks', label: 'Stocks' },
  { value: 'devis', label: 'Devis' },
  { value: 'commandes', label: 'Commandes' },
  { value: 'factures', label: 'Factures' },
  { value: 'paiements', label: 'Paiements' },
  { value: 'comptabilite', label: 'Comptabilite' },
  { value: 'users', label: 'Utilisateurs' },
];

const ACTIONS = [
  { value: '', label: 'Toutes les actions' },
  { value: 'create', label: 'Creation' },
  { value: 'update', label: 'Modification' },
  { value: 'delete', label: 'Suppression' },
  { value: 'login', label: 'Connexion' },
  { value: 'logout', label: 'Deconnexion' },
];

export default function AuditLogPage() {
  usePageTitle("Journal d'Audit", [
    { label: 'Accueil', path: '/' },
    { label: 'Administration' },
    { label: 'Audit' },
  ]);

  const [filters, setFilters] = useState({
    dateDebut: '',
    dateFin: '',
    action: '',
    module: '',
    user: '',
  });
  const [page, setPage] = useState(1);
  const [limit] = useState(25);

  const { data, isLoading, isError, error } = useGetAuditLogsQuery({
    page,
    limit,
    dateDebut: filters.dateDebut || undefined,
    dateFin: filters.dateFin || undefined,
    action: filters.action || undefined,
    module: filters.module || undefined,
    user: filters.user || undefined,
  });

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setPage(1);
  };

  const logs = data?.data || [];
  const meta = data?.meta || {};
  const totalPages = meta.totalPages || 1;

  return (
    <div className="audit-log-page">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">
            <FiShield className="me-2" />
            Journal d'Audit
          </h2>
          <p className="text-muted mb-0">Historique de toutes les actions dans le systeme</p>
        </div>
      </div>

      <Card>
        <Card.Body>
          <Row className="mb-3">
            <Col md={3}>
              <Form.Group>
                <Form.Label>Date Debut</Form.Label>
                <Form.Control
                  type="date"
                  value={filters.dateDebut}
                  onChange={(e) => handleFilterChange('dateDebut', e.target.value)}
                />
              </Form.Group>
            </Col>

            <Col md={3}>
              <Form.Group>
                <Form.Label>Date Fin</Form.Label>
                <Form.Control
                  type="date"
                  value={filters.dateFin}
                  onChange={(e) => handleFilterChange('dateFin', e.target.value)}
                />
              </Form.Group>
            </Col>

            <Col md={3}>
              <Form.Group>
                <Form.Label>Action</Form.Label>
                <Form.Select
                  value={filters.action}
                  onChange={(e) => handleFilterChange('action', e.target.value)}
                >
                  {ACTIONS.map((action) => (
                    <option key={action.value} value={action.value}>
                      {action.label}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={3}>
              <Form.Group>
                <Form.Label>Module</Form.Label>
                <Form.Select
                  value={filters.module}
                  onChange={(e) => handleFilterChange('module', e.target.value)}
                >
                  {MODULES.map((module) => (
                    <option key={module.value} value={module.value}>
                      {module.label}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col md={12}>
              <Form.Group>
                <Form.Label>Rechercher par Utilisateur</Form.Label>
                <div className="position-relative">
                  <Form.Control
                    type="text"
                    placeholder="Nom ou email de l'utilisateur..."
                    value={filters.user}
                    onChange={(e) => handleFilterChange('user', e.target.value)}
                  />
                  <FiSearch
                    className="position-absolute top-50 end-0 translate-middle-y me-3"
                    style={{ pointerEvents: 'none' }}
                  />
                </div>
              </Form.Group>
            </Col>
          </Row>

          {isLoading && (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">Chargement du journal d'audit...</p>
            </div>
          )}

          {isError && (
            <Alert variant="danger">
              Erreur lors du chargement du journal d'audit: {error?.data?.message || error?.message}
            </Alert>
          )}

          {!isLoading && !isError && (
            <>
              <Table responsive hover className="mb-0">
                <thead>
                  <tr>
                    <th>Date/Heure</th>
                    <th>Utilisateur</th>
                    <th>Action</th>
                    <th>Module</th>
                    <th>Description</th>
                    <th>IP</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-4">
                        Aucune entree d'audit trouvee
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log._id}>
                        <td>{formatDateTime(log.createdAt || log.timestamp)}</td>
                        <td>
                          {log.user?.firstName} {log.user?.lastName}
                          <br />
                          <small className="text-muted">{log.user?.email}</small>
                        </td>
                        <td>
                          <Badge bg={ACTION_VARIANTS[log.action] || 'secondary'}>
                            {ACTION_LABELS[log.action] || log.action}
                          </Badge>
                        </td>
                        <td>{log.module}</td>
                        <td>{log.description || log.message || '-'}</td>
                        <td>
                          <small>{log.ipAddress || log.ip || '-'}</small>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>

              {totalPages > 1 && (
                <div className="d-flex justify-content-between align-items-center mt-3">
                  <div className="text-muted">
                    Page {page} sur {totalPages} ({meta.total || 0} entree(s))
                  </div>
                  <BsPagination>
                    <BsPagination.Prev disabled={page === 1} onClick={() => setPage(page - 1)} />
                    {[...Array(totalPages)].map((_, idx) => {
                      const pageNum = idx + 1;
                      if (
                        pageNum === 1 ||
                        pageNum === totalPages ||
                        (pageNum >= page - 1 && pageNum <= page + 1)
                      ) {
                        return (
                          <BsPagination.Item
                            key={pageNum}
                            active={pageNum === page}
                            onClick={() => setPage(pageNum)}
                          >
                            {pageNum}
                          </BsPagination.Item>
                        );
                      } else if (pageNum === page - 2 || pageNum === page + 2) {
                        return <BsPagination.Ellipsis key={pageNum} disabled />;
                      }
                      return null;
                    })}
                    <BsPagination.Next
                      disabled={page === totalPages}
                      onClick={() => setPage(page + 1)}
                    />
                  </BsPagination>
                </div>
              )}
            </>
          )}
        </Card.Body>
      </Card>
    </div>
  );
}
