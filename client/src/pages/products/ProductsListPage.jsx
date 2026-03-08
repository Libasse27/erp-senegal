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
import Alert from 'react-bootstrap/Alert';
import BsPagination from 'react-bootstrap/Pagination';
import InputGroup from 'react-bootstrap/InputGroup';
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiSearch,
  FiPackage,
  FiTool,
  FiFilter,
  FiEye,
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import usePageTitle from '../../hooks/usePageTitle';
import { formatMoney } from '../../utils/formatters';
import { useAuth } from '../../contexts/AuthContext';
import { PERM } from '../../config/permissions';
import {
  useGetProductsQuery,
  useDeleteProductMutation,
  useGetCategoriesQuery,
} from '../../redux/api/productsApi';

/* ─── helpers ─────────────────────────────────────────────────────────────── */
const TYPE_META = {
  produit: { label: 'Produit', bg: 'primary', Icon: FiPackage },
  service: { label: 'Service', bg: 'info',    Icon: FiTool    },
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
const ProductsListPage = () => {
  usePageTitle('Produits', [
    { label: 'Accueil', path: '/' },
    { label: 'Produits' },
  ]);

  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  const [page, setPage]                   = useState(1);
  const [search, setSearch]               = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [typeFilter, setTypeFilter]       = useState('');

  const queryParams = {
    page,
    limit: 20,
    search,
    ...(categoryFilter && { category: categoryFilter }),
    ...(typeFilter && { type: typeFilter }),
  };

  const { data, isLoading, error }  = useGetProductsQuery(queryParams);
  const { data: categoriesData }    = useGetCategoriesQuery();
  const [deleteProduct]             = useDeleteProductMutation();

  const handleSearch = (e) => { setSearch(e.target.value); setPage(1); };
  const handleCategoryFilter = (e) => { setCategoryFilter(e.target.value); setPage(1); };
  const handleTypeFilter = (e) => { setTypeFilter(e.target.value); setPage(1); };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Supprimer le produit "${name}" ?`)) return;
    try {
      await deleteProduct(id).unwrap();
      toast.success('Produit supprime avec succes');
    } catch (err) {
      toast.error(err.data?.message || 'Erreur lors de la suppression');
    }
  };

  const products   = data?.data  || [];
  const meta       = data?.meta;
  const categories = categoriesData?.data || [];

  const totalProduits = products.filter((p) => p.type === 'produit').length;
  const totalServices = products.filter((p) => p.type === 'service').length;
  const totalActifs   = products.filter((p) => p.isActive).length;

  return (
    <>
      {/* ── En-tête ─────────────────────────────────────────────────────── */}
      <div className="page-header">
        <div>
          <h1 className="mb-0">Produits & Services</h1>
          <p className="text-muted mb-0 small mt-1">
            Catalogue, tarifs et gestion du stock
          </p>
        </div>
        {hasPermission(PERM.PRODUITS_CREATE) && (
          <Button
            variant="primary"
            onClick={() => navigate('/produits/nouveau')}
            className="d-flex align-items-center gap-2"
          >
            <FiPlus size={18} />
            Nouveau Produit
          </Button>
        )}
      </div>

      {/* ── Stats rapides ───────────────────────────────────────────────── */}
      {!isLoading && products.length > 0 && (
        <Row className="g-3 mb-4">
          <Col xs={6} md={3}>
            <StatCard label="Total" value={meta?.total ?? products.length} color="#6366f1" Icon={FiPackage} />
          </Col>
          <Col xs={6} md={3}>
            <StatCard label="Produits" value={totalProduits} color="#3b82f6" Icon={FiPackage} />
          </Col>
          <Col xs={6} md={3}>
            <StatCard label="Services" value={totalServices} color="#06b6d4" Icon={FiTool} />
          </Col>
          <Col xs={6} md={3}>
            <StatCard label="Actifs" value={totalActifs} color="#22c55e" Icon={FiFilter} />
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
                  placeholder="Rechercher par nom, code, code-barres..."
                  value={search}
                  onChange={handleSearch}
                  className="border-start-0"
                />
              </InputGroup>
            </Col>
            <Col md={3}>
              <Form.Select value={categoryFilter} onChange={handleCategoryFilter}>
                <option value="">Toutes les categories</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </Form.Select>
            </Col>
            <Col md={2}>
              <Form.Select value={typeFilter} onChange={handleTypeFilter}>
                <option value="">Tous les types</option>
                <option value="produit">Produit</option>
                <option value="service">Service</option>
              </Form.Select>
            </Col>
            {(search || categoryFilter || typeFilter) && (
              <Col md={2}>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={() => { setSearch(''); setCategoryFilter(''); setTypeFilter(''); setPage(1); }}
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
              <p className="mt-2 text-muted">Chargement du catalogue...</p>
            </div>
          ) : error ? (
            <Alert variant="danger">
              Erreur : {error.data?.message || 'Impossible de charger les produits'}
            </Alert>
          ) : products.length === 0 ? (
            <div className="text-center py-5">
              <FiPackage size={48} className="text-muted mb-3" />
              <h5 className="text-muted">Aucun produit trouve</h5>
              <p className="text-muted small mb-3">
                {search || categoryFilter || typeFilter
                  ? 'Modifiez vos filtres ou '
                  : ''}
                Commencez par creer votre premier produit
              </p>
              {hasPermission(PERM.PRODUITS_CREATE) && (
                <Button variant="primary" onClick={() => navigate('/produits/nouveau')}>
                  <FiPlus className="me-1" />
                  Nouveau Produit
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <Table hover className="align-middle mb-0" style={{ fontSize: 14 }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8f9fc' }}>
                      <th className="border-0 py-3 text-muted fw-semibold" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>Code</th>
                      <th className="border-0 py-3 text-muted fw-semibold" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>Produit / Service</th>
                      <th className="border-0 py-3 text-muted fw-semibold" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>Categorie</th>
                      <th className="border-0 py-3 text-muted fw-semibold" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>Type</th>
                      <th className="border-0 py-3 text-muted fw-semibold text-end" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>Prix Vente</th>
                      <th className="border-0 py-3 text-muted fw-semibold text-end" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>Prix Achat</th>
                      <th className="border-0 py-3 text-muted fw-semibold text-center" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>Statut</th>
                      <th className="border-0 py-3 text-end" style={{ width: 100 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => {
                      const tm = TYPE_META[product.type] || TYPE_META.produit;
                      return (
                        <tr
                          key={product._id}
                          style={{ cursor: 'pointer' }}
                          onClick={() => navigate(`/produits/${product._id}`)}
                        >
                          <td className="py-3">
                            <code
                              className="px-2 py-1 rounded"
                              style={{ backgroundColor: '#f1f5f9', fontSize: 12, color: '#475569' }}
                            >
                              {product.code || '—'}
                            </code>
                          </td>
                          <td className="py-3">
                            <div className="fw-semibold text-dark">{product.name}</div>
                            {product.barcode && (
                              <div className="text-muted small">
                                Code-barres: {product.barcode}
                              </div>
                            )}
                          </td>
                          <td className="py-3">
                            {product.category ? (
                              <span className="text-muted">{product.category.name}</span>
                            ) : (
                              <span className="text-muted fst-italic">—</span>
                            )}
                          </td>
                          <td className="py-3">
                            <Badge
                              bg={tm.bg}
                              className="d-inline-flex align-items-center gap-1"
                              style={{ fontWeight: 500 }}
                            >
                              <tm.Icon size={11} />
                              {tm.label}
                            </Badge>
                          </td>
                          <td className="py-3 text-end fw-semibold text-dark">
                            {formatMoney(product.prixVente)}
                          </td>
                          <td className="py-3 text-end text-muted">
                            {formatMoney(product.prixAchat)}
                          </td>
                          <td className="py-3 text-center">
                            <Badge
                              bg={product.isActive ? 'success' : 'secondary'}
                              style={{ fontSize: 11 }}
                            >
                              {product.isActive ? 'Actif' : 'Inactif'}
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
                              onClick={() => navigate(`/produits/${product._id}`)}
                            >
                              <FiEye size={15} />
                            </Button>
                            {hasPermission(PERM.PRODUITS_UPDATE) && (
                              <Button
                                variant="link"
                                size="sm"
                                className="text-warning p-1 me-1"
                                title="Modifier"
                                onClick={() => navigate(`/produits/${product._id}/modifier`)}
                              >
                                <FiEdit2 size={15} />
                              </Button>
                            )}
                            {hasPermission(PERM.PRODUITS_DELETE) && (
                              <Button
                                variant="link"
                                size="sm"
                                className="text-danger p-1"
                                title="Supprimer"
                                onClick={() => handleDelete(product._id, product.name)}
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
                    <strong>{meta.total}</strong> produits
                  </small>
                  <BsPagination className="mb-0">
                    <BsPagination.Prev
                      disabled={!meta.hasPrevPage}
                      onClick={() => setPage((p) => p - 1)}
                    />
                    {[...Array(Math.min(meta.totalPages, 7))].map((_, i) => {
                      const pageNum = i + 1;
                      return (
                        <BsPagination.Item
                          key={pageNum}
                          active={pageNum === page}
                          onClick={() => setPage(pageNum)}
                        >
                          {pageNum}
                        </BsPagination.Item>
                      );
                    })}
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

export default ProductsListPage;
