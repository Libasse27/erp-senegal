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
  FiTruck,
  FiGlobe,
  FiHome,
  FiStar,
  FiEye,
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import usePageTitle from '../../hooks/usePageTitle';
import { formatMoney } from '../../utils/formatters';
import { useAuth } from '../../contexts/AuthContext';
import { PERM } from '../../config/permissions';
import {
  useGetFournisseursQuery,
  useDeleteFournisseurMutation,
} from '../../redux/api/fournisseursApi';

/* ─── helpers ─────────────────────────────────────────────────────────────── */
const getInitials = (name = '') =>
  name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?';

const CATEGORY_META = {
  local:          { label: 'Local',          color: '#22c55e', bg: 'success' },
  international:  { label: 'International',  color: '#6366f1', bg: 'primary' },
  fabricant:      { label: 'Fabricant',      color: '#3b82f6', bg: 'info'    },
  distributeur:   { label: 'Distributeur',   color: '#f59e0b', bg: 'warning' },
  prestataire:    { label: 'Prestataire',    color: '#8b5cf6', bg: 'purple'  },
  autre:          { label: 'Autre',          color: '#94a3b8', bg: 'secondary'},
};

const StarRating = ({ value }) => {
  const stars = Math.round(value || 0);
  return (
    <span style={{ color: '#f59e0b', fontSize: 12 }}>
      {'★'.repeat(stars)}
      <span style={{ color: '#e2e8f0' }}>{'★'.repeat(5 - stars)}</span>
    </span>
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
const FournisseursListPage = () => {
  usePageTitle('Fournisseurs', [
    { label: 'Accueil', path: '/' },
    { label: 'Fournisseurs' },
  ]);

  const navigate          = useNavigate();
  const { hasPermission } = useAuth();

  const [page, setPage]                   = useState(1);
  const [search, setSearch]               = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const queryParams = {
    page,
    limit: 20,
    search,
    ...(categoryFilter && { category: categoryFilter }),
  };

  const { data, isLoading, error } = useGetFournisseursQuery(queryParams);
  const [deleteFournisseur]        = useDeleteFournisseurMutation();

  const handleSearch         = (e) => { setSearch(e.target.value);          setPage(1); };
  const handleCategoryFilter = (e) => { setCategoryFilter(e.target.value);  setPage(1); };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Supprimer le fournisseur "${name}" ?`)) return;
    try {
      await deleteFournisseur(id).unwrap();
      toast.success('Fournisseur supprime avec succes');
    } catch (err) {
      toast.error(err.data?.message || 'Erreur lors de la suppression');
    }
  };

  const fournisseurs = data?.data || [];
  const meta         = data?.meta;

  const nbLocaux         = fournisseurs.filter((f) => f.category === 'local').length;
  const nbInternationaux = fournisseurs.filter((f) => f.category === 'international').length;
  const avgRating        = fournisseurs.length > 0
    ? (fournisseurs.reduce((s, f) => s + (f.ratingMoyen || 0), 0) / fournisseurs.length).toFixed(1)
    : '—';

  return (
    <>
      {/* ── En-tête ─────────────────────────────────────────────────────── */}
      <div className="page-header">
        <div>
          <h1 className="mb-0">Fournisseurs</h1>
          <p className="text-muted mb-0 small mt-1">
            Gestion du portefeuille fournisseurs et conditions d'achat
          </p>
        </div>
        {hasPermission(PERM.FOURNISSEURS_CREATE) && (
          <Button
            variant="primary"
            onClick={() => navigate('/fournisseurs/nouveau')}
            className="d-flex align-items-center gap-2"
          >
            <FiPlus size={18} />
            Nouveau Fournisseur
          </Button>
        )}
      </div>

      {/* ── Stats rapides ───────────────────────────────────────────────── */}
      {!isLoading && fournisseurs.length > 0 && (
        <Row className="g-3 mb-4">
          <Col xs={6} md={3}>
            <StatCard label="Total fournisseurs" value={meta?.total ?? fournisseurs.length} color="#6366f1" Icon={FiTruck} />
          </Col>
          <Col xs={6} md={3}>
            <StatCard label="Locaux" value={nbLocaux} color="#22c55e" Icon={FiHome} />
          </Col>
          <Col xs={6} md={3}>
            <StatCard label="Internationaux" value={nbInternationaux} color="#3b82f6" Icon={FiGlobe} />
          </Col>
          <Col xs={6} md={3}>
            <StatCard label="Note moyenne" value={avgRating} color="#f59e0b" Icon={FiStar} />
          </Col>
        </Row>
      )}

      {/* ── Tableau ─────────────────────────────────────────────────────── */}
      <Card className="border-0 shadow-sm" style={{ borderRadius: 12 }}>
        <Card.Body>
          {/* Filtres */}
          <Row className="mb-4 g-2 align-items-center">
            <Col md={6}>
              <InputGroup>
                <InputGroup.Text className="bg-white border-end-0">
                  <FiSearch color="#6c757d" />
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Rechercher par raison sociale, email, NINEA..."
                  value={search}
                  onChange={handleSearch}
                  className="border-start-0"
                />
              </InputGroup>
            </Col>
            <Col md={3}>
              <Form.Select value={categoryFilter} onChange={handleCategoryFilter}>
                <option value="">Toutes les categories</option>
                <option value="local">Local</option>
                <option value="international">International</option>
                <option value="fabricant">Fabricant</option>
                <option value="distributeur">Distributeur</option>
                <option value="prestataire">Prestataire</option>
                <option value="autre">Autre</option>
              </Form.Select>
            </Col>
            {(search || categoryFilter) && (
              <Col md="auto">
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={() => { setSearch(''); setCategoryFilter(''); setPage(1); }}
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
              <p className="mt-2 text-muted">Chargement des fournisseurs...</p>
            </div>
          ) : error ? (
            <div className="alert alert-danger">
              Erreur : {error.data?.message || 'Impossible de charger les fournisseurs'}
            </div>
          ) : fournisseurs.length === 0 ? (
            <div className="text-center py-5">
              <FiTruck size={48} className="text-muted mb-3" />
              <h5 className="text-muted">Aucun fournisseur trouve</h5>
              <p className="text-muted small mb-3">
                {search || categoryFilter ? 'Modifiez vos filtres ou c' : 'C'}
                ommencez par creer votre premier fournisseur
              </p>
              {hasPermission(PERM.FOURNISSEURS_CREATE) && (
                <Button variant="primary" onClick={() => navigate('/fournisseurs/nouveau')}>
                  <FiPlus className="me-1" />
                  Nouveau Fournisseur
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <Table hover className="align-middle mb-0" style={{ fontSize: 14 }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8f9fc' }}>
                      <th className="border-0 py-3 text-muted fw-semibold" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>Fournisseur</th>
                      <th className="border-0 py-3 text-muted fw-semibold" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>Contact</th>
                      <th className="border-0 py-3 text-muted fw-semibold" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>Ville</th>
                      <th className="border-0 py-3 text-muted fw-semibold" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>Categorie</th>
                      <th className="border-0 py-3 text-muted fw-semibold text-center" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>Note</th>
                      <th className="border-0 py-3 text-muted fw-semibold text-end" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>Total Achats</th>
                      <th className="border-0 py-3 text-end" style={{ width: 100 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {fournisseurs.map((f) => {
                      const catMeta = CATEGORY_META[f.category] || CATEGORY_META.autre;
                      return (
                        <tr
                          key={f._id}
                          style={{ cursor: 'pointer' }}
                          onClick={() => navigate(`/fournisseurs/${f._id}`)}
                        >
                          <td className="py-3">
                            <div className="d-flex align-items-center gap-3">
                              <div
                                className="rounded-2 d-flex align-items-center justify-content-center flex-shrink-0 fw-bold text-white"
                                style={{
                                  width: 38, height: 38, fontSize: 13,
                                  background: `linear-gradient(135deg,${catMeta.color},${catMeta.color}99)`,
                                }}
                              >
                                {getInitials(f.raisonSociale)}
                              </div>
                              <div>
                                <div className="fw-semibold text-dark">{f.raisonSociale}</div>
                                <code style={{ fontSize: 11, color: '#94a3b8' }}>{f.code}</code>
                              </div>
                            </div>
                          </td>
                          <td className="py-3">
                            {f.email && <div className="text-muted small">{f.email}</div>}
                            {f.phone && <div className="text-dark small">{f.phone}</div>}
                            {f.contactPerson?.name && (
                              <div className="text-muted small fst-italic">{f.contactPerson.name}</div>
                            )}
                            {!f.email && !f.phone && !f.contactPerson?.name && (
                              <span className="text-muted fst-italic">—</span>
                            )}
                          </td>
                          <td className="py-3 text-muted">
                            {f.address?.city || '—'}
                          </td>
                          <td className="py-3">
                            <Badge
                              bg={catMeta.bg === 'purple' ? undefined : catMeta.bg}
                              style={{
                                fontSize: 11,
                                ...(catMeta.bg === 'purple' ? { backgroundColor: '#8b5cf6' } : {}),
                              }}
                            >
                              {catMeta.label}
                            </Badge>
                          </td>
                          <td className="py-3 text-center">
                            {f.ratingMoyen > 0
                              ? <StarRating value={f.ratingMoyen} />
                              : <span className="text-muted small">—</span>}
                          </td>
                          <td className="py-3 text-end fw-semibold">
                            {f.totalAchats > 0
                              ? formatMoney(f.totalAchats)
                              : <span className="text-muted">—</span>}
                          </td>
                          <td
                            className="py-3 text-end"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button
                              variant="link" size="sm"
                              className="text-primary p-1 me-1"
                              title="Voir le detail"
                              onClick={() => navigate(`/fournisseurs/${f._id}`)}
                            >
                              <FiEye size={15} />
                            </Button>
                            {hasPermission(PERM.FOURNISSEURS_UPDATE) && (
                              <Button
                                variant="link" size="sm"
                                className="text-warning p-1 me-1"
                                title="Modifier"
                                onClick={() => navigate(`/fournisseurs/${f._id}/modifier`)}
                              >
                                <FiEdit2 size={15} />
                              </Button>
                            )}
                            {hasPermission(PERM.FOURNISSEURS_DELETE) && (
                              <Button
                                variant="link" size="sm"
                                className="text-danger p-1"
                                title="Supprimer"
                                onClick={() => handleDelete(f._id, f.raisonSociale)}
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
                    <strong>{meta.total}</strong> fournisseurs
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

export default FournisseursListPage;
