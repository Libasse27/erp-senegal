import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from 'react-bootstrap/Card';
import Table from 'react-bootstrap/Table';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Badge from 'react-bootstrap/Badge';
import Spinner from 'react-bootstrap/Spinner';
import InputGroup from 'react-bootstrap/InputGroup';
import BsPagination from 'react-bootstrap/Pagination';
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiSearch,
  FiUsers,
  FiUser,
  FiBriefcase,
  FiEye,
  FiStar,
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import usePageTitle from '../../hooks/usePageTitle';
import { formatMoney, formatPhone } from '../../utils/formatters';
import { useAuth } from '../../contexts/AuthContext';
import { PERM } from '../../config/permissions';
import {
  useGetClientsQuery,
  useDeleteClientMutation,
} from '../../redux/api/clientsApi';

/* ─── helpers ─────────────────────────────────────────────────────────────── */
const getDisplayName = (client) =>
  client.type === 'professionnel' && client.raisonSociale
    ? client.raisonSociale
    : [client.firstName, client.lastName].filter(Boolean).join(' ') || '—';

const getInitials = (client) => {
  const name = getDisplayName(client);
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
};

const SEGMENT_META = {
  A: { bg: '#22c55e', label: 'A — Premium',  desc: 'Top 20% CA' },
  B: { bg: '#f59e0b', label: 'B — Standard', desc: 'Milieu 30% CA' },
  C: { bg: '#94a3b8', label: 'C — Basique',  desc: 'Base 50% CA' },
};

const SegmentBadge = ({ segment }) => {
  const meta = SEGMENT_META[segment];
  if (!meta) return <span className="text-muted">—</span>;
  return (
    <Badge
      style={{ backgroundColor: meta.bg, fontSize: 11 }}
      title={meta.desc}
    >
      {segment}
    </Badge>
  );
};

const StatCard = ({ label, value, color, Icon }) => (
  <Card
    className="border-0 shadow-sm h-100"
    style={{ borderLeft: `4px solid ${color}`, borderRadius: 10 }}
  >
    <Card.Body className="d-flex align-items-center gap-3 py-3">
      <div
        className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
        style={{ width: 44, height: 44, backgroundColor: `${color}20` }}
      >
        <Icon size={20} color={color} />
      </div>
      <div>
        <div className="fw-bold fs-5 lh-1">{value}</div>
        <div className="text-muted small">{label}</div>
      </div>
    </Card.Body>
  </Card>
);

/* ─── composant principal ─────────────────────────────────────────────────── */
const ClientsListPage = () => {
  usePageTitle('Clients', [
    { label: 'Accueil', path: '/' },
    { label: 'Clients' },
  ]);

  const navigate          = useNavigate();
  const { hasPermission } = useAuth();

  const [page, setPage]               = useState(1);
  const [search, setSearch]           = useState('');
  const [segmentFilter, setSegmentFilter] = useState('');
  const [typeFilter, setTypeFilter]   = useState('');

  const queryParams = {
    page,
    limit: 20,
    search,
    ...(segmentFilter && { segment: segmentFilter }),
    ...(typeFilter    && { type: typeFilter }),
  };

  const { data, isLoading, error } = useGetClientsQuery(queryParams);
  const [deleteClient]             = useDeleteClientMutation();

  const handleSearch        = (e) => { setSearch(e.target.value);         setPage(1); };
  const handleSegmentFilter = (e) => { setSegmentFilter(e.target.value);  setPage(1); };
  const handleTypeFilter    = (e) => { setTypeFilter(e.target.value);      setPage(1); };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Supprimer le client "${name}" ?`)) return;
    try {
      await deleteClient(id).unwrap();
      toast.success('Client supprime avec succes');
    } catch (err) {
      toast.error(err.data?.message || 'Erreur lors de la suppression');
    }
  };

  const clients   = data?.data || [];
  const meta      = data?.meta;

  const nbProfessionnels = clients.filter((c) => c.type === 'professionnel').length;
  const nbParticuliers   = clients.filter((c) => c.type === 'particulier').length;
  const nbSegmentA       = clients.filter((c) => c.segment === 'A').length;

  return (
    <>
      {/* ── En-tête ─────────────────────────────────────────────────────── */}
      <div className="page-header">
        <div>
          <h1 className="mb-0">Clients</h1>
          <p className="text-muted mb-0 small mt-1">
            Gestion du portefeuille client et suivi commercial
          </p>
        </div>
        {hasPermission(PERM.CLIENTS_CREATE) && (
          <Button
            variant="primary"
            onClick={() => navigate('/clients/nouveau')}
            className="d-flex align-items-center gap-2"
          >
            <FiPlus size={18} />
            Nouveau Client
          </Button>
        )}
      </div>

      {/* ── Stats rapides ───────────────────────────────────────────────── */}
      {!isLoading && clients.length > 0 && (
        <Row className="g-3 mb-4">
          <Col xs={6} md={3}>
            <StatCard label="Total clients" value={meta?.total ?? clients.length} color="#6366f1" Icon={FiUsers} />
          </Col>
          <Col xs={6} md={3}>
            <StatCard label="Professionnels" value={nbProfessionnels} color="#3b82f6" Icon={FiBriefcase} />
          </Col>
          <Col xs={6} md={3}>
            <StatCard label="Particuliers" value={nbParticuliers} color="#06b6d4" Icon={FiUser} />
          </Col>
          <Col xs={6} md={3}>
            <StatCard label="Segment A (premium)" value={nbSegmentA} color="#22c55e" Icon={FiStar} />
          </Col>
        </Row>
      )}

      {/* ── Tableau ─────────────────────────────────────────────────────── */}
      <Card className="border-0 shadow-sm" style={{ borderRadius: 12 }}>
        <Card.Body>
          {/* Filtres */}
          <Row className="mb-4 g-2 align-items-center">
            <Col md={5}>
              <InputGroup>
                <InputGroup.Text className="bg-white border-end-0">
                  <FiSearch color="#6c757d" />
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Rechercher par nom, email, telephone..."
                  value={search}
                  onChange={handleSearch}
                  className="border-start-0"
                />
              </InputGroup>
            </Col>
            <Col md={2}>
              <Form.Select value={typeFilter} onChange={handleTypeFilter}>
                <option value="">Tous les types</option>
                <option value="professionnel">Professionnel</option>
                <option value="particulier">Particulier</option>
              </Form.Select>
            </Col>
            <Col md={2}>
              <Form.Select value={segmentFilter} onChange={handleSegmentFilter}>
                <option value="">Tous segments</option>
                <option value="A">Segment A</option>
                <option value="B">Segment B</option>
                <option value="C">Segment C</option>
              </Form.Select>
            </Col>
            {(search || segmentFilter || typeFilter) && (
              <Col md="auto">
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={() => { setSearch(''); setSegmentFilter(''); setTypeFilter(''); setPage(1); }}
                >
                  Reinitialiser
                </Button>
              </Col>
            )}
          </Row>

          {/* Contenu */}
          {isLoading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2 text-muted">Chargement des clients...</p>
            </div>
          ) : error ? (
            <div className="alert alert-danger">
              Erreur : {error.data?.message || 'Impossible de charger les clients'}
            </div>
          ) : clients.length === 0 ? (
            <div className="text-center py-5">
              <FiUsers size={48} className="text-muted mb-3" />
              <h5 className="text-muted">Aucun client trouve</h5>
              <p className="text-muted small mb-3">
                {search || segmentFilter || typeFilter
                  ? 'Modifiez vos filtres ou '
                  : ''}
                Commencez par creer votre premier client
              </p>
              {hasPermission(PERM.CLIENTS_CREATE) && (
                <Button variant="primary" onClick={() => navigate('/clients/nouveau')}>
                  <FiPlus className="me-1" />
                  Nouveau Client
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <Table hover className="align-middle mb-0" style={{ fontSize: 14 }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8f9fc' }}>
                      <th className="border-0 py-3 text-muted fw-semibold" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>Client</th>
                      <th className="border-0 py-3 text-muted fw-semibold" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>Contact</th>
                      <th className="border-0 py-3 text-muted fw-semibold" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>Ville</th>
                      <th className="border-0 py-3 text-muted fw-semibold text-center" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>Segment</th>
                      <th className="border-0 py-3 text-muted fw-semibold text-end" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>CA Total</th>
                      <th className="border-0 py-3 text-muted fw-semibold text-center" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>Statut</th>
                      <th className="border-0 py-3 text-end" style={{ width: 100 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {clients.map((client) => {
                      const displayName = getDisplayName(client);
                      const initials    = getInitials(client);
                      const isPro       = client.type === 'professionnel';
                      return (
                        <tr
                          key={client._id}
                          style={{ cursor: 'pointer' }}
                          onClick={() => navigate(`/clients/${client._id}`)}
                        >
                          <td className="py-3">
                            <div className="d-flex align-items-center gap-3">
                              {/* Avatar */}
                              <div
                                className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 fw-bold text-white"
                                style={{
                                  width: 36, height: 36, fontSize: 13,
                                  background: isPro
                                    ? 'linear-gradient(135deg,#6366f1,#818cf8)'
                                    : 'linear-gradient(135deg,#06b6d4,#22d3ee)',
                                }}
                              >
                                {initials}
                              </div>
                              <div>
                                <div className="fw-semibold text-dark">{displayName}</div>
                                <div className="d-flex align-items-center gap-1 mt-1">
                                  <code style={{ fontSize: 11, color: '#94a3b8' }}>{client.code}</code>
                                  <Badge
                                    bg={isPro ? 'primary' : 'info'}
                                    style={{ fontSize: 10 }}
                                  >
                                    {isPro ? 'Pro' : 'Particulier'}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3">
                            {client.email && (
                              <div className="text-muted small">{client.email}</div>
                            )}
                            {client.phone && (
                              <div className="text-dark small">{client.phone}</div>
                            )}
                            {!client.email && !client.phone && (
                              <span className="text-muted fst-italic">—</span>
                            )}
                          </td>
                          <td className="py-3 text-muted">
                            {client.address?.city || '—'}
                          </td>
                          <td className="py-3 text-center">
                            <SegmentBadge segment={client.segment} />
                          </td>
                          <td className="py-3 text-end fw-semibold">
                            {client.totalCA > 0
                              ? formatMoney(client.totalCA)
                              : <span className="text-muted">—</span>}
                          </td>
                          <td className="py-3 text-center">
                            <Badge
                              bg={client.isActive ? 'success' : 'secondary'}
                              style={{ fontSize: 11 }}
                            >
                              {client.isActive ? 'Actif' : 'Inactif'}
                            </Badge>
                          </td>
                          <td
                            className="py-3 text-end"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button
                              variant="link"
                              size="sm"
                              className="text-primary p-1 me-1"
                              title="Voir le detail"
                              onClick={() => navigate(`/clients/${client._id}`)}
                            >
                              <FiEye size={15} />
                            </Button>
                            {hasPermission(PERM.CLIENTS_UPDATE) && (
                              <Button
                                variant="link"
                                size="sm"
                                className="text-warning p-1 me-1"
                                title="Modifier"
                                onClick={() => navigate(`/clients/${client._id}/modifier`)}
                              >
                                <FiEdit2 size={15} />
                              </Button>
                            )}
                            {hasPermission(PERM.CLIENTS_DELETE) && (
                              <Button
                                variant="link"
                                size="sm"
                                className="text-danger p-1"
                                title="Supprimer"
                                onClick={() => handleDelete(client._id, displayName)}
                              >
                                <FiTrash2 size={15} />
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              </div>

              {/* Pagination */}
              {meta && meta.totalPages > 1 && (
                <div className="d-flex justify-content-between align-items-center mt-4 pt-3 border-top">
                  <small className="text-muted">
                    {(meta.page - 1) * meta.limit + 1}–
                    {Math.min(meta.page * meta.limit, meta.total)} sur{' '}
                    <strong>{meta.total}</strong> clients
                  </small>
                  <BsPagination className="mb-0">
                    <BsPagination.Prev
                      disabled={!meta.hasPrevPage}
                      onClick={() => setPage((p) => p - 1)}
                    />
                    {[...Array(Math.min(meta.totalPages, 7))].map((_, i) => (
                      <BsPagination.Item
                        key={i + 1}
                        active={i + 1 === page}
                        onClick={() => setPage(i + 1)}
                      >
                        {i + 1}
                      </BsPagination.Item>
                    ))}
                    {meta.totalPages > 7 && <BsPagination.Ellipsis disabled />}
                    <BsPagination.Next
                      disabled={!meta.hasNextPage}
                      onClick={() => setPage((p) => p + 1)}
                    />
                  </BsPagination>
                </div>
              )}
            </>
          )}
        </Card.Body>
      </Card>
    </>
  );
};

export default ClientsListPage;
