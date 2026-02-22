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
import { FiPlus, FiEdit2, FiTrash2, FiSearch } from 'react-icons/fi';
import { toast } from 'react-toastify';
import usePageTitle from '../../hooks/usePageTitle';
import { formatMoney } from '../../utils/formatters';
import {
  useGetProductsQuery,
  useDeleteProductMutation,
  useGetCategoriesQuery,
} from '../../redux/api/productsApi';

const ProductsListPage = () => {
  usePageTitle('Produits', [
    { label: 'Accueil', path: '/' },
    { label: 'Produits' },
  ]);

  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const queryParams = {
    page,
    limit: 25,
    search,
    ...(categoryFilter && { category: categoryFilter }),
    ...(typeFilter && { type: typeFilter }),
  };

  const { data, isLoading, error } = useGetProductsQuery(queryParams);
  const { data: categoriesData } = useGetCategoriesQuery();
  const [deleteProduct] = useDeleteProductMutation();

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleCategoryFilter = (e) => {
    setCategoryFilter(e.target.value);
    setPage(1);
  };

  const handleTypeFilter = (e) => {
    setTypeFilter(e.target.value);
    setPage(1);
  };

  const handleDelete = async (id, name) => {
    if (
      window.confirm(
        `Etes-vous sur de vouloir supprimer le produit "${name}" ?`
      )
    ) {
      try {
        await deleteProduct(id).unwrap();
        toast.success('Produit supprime avec succes');
      } catch (err) {
        toast.error(err.data?.message || 'Erreur lors de la suppression');
      }
    }
  };

  const products = data?.data || [];
  const meta = data?.meta;
  const categories = categoriesData?.data || [];

  return (
    <>
      <div className="page-header">
        <h1>Gestion des Produits</h1>
        <Button
          variant="primary"
          onClick={() => navigate('/produits/nouveau')}
          className="d-flex align-items-center gap-2"
        >
          <FiPlus size={18} />
          Nouveau Produit
        </Button>
      </div>

      <Card className="shadow-sm">
        <Card.Body>
          <Row className="mb-3 g-3">
            <Col md={5}>
              <Form.Group>
                <div className="position-relative">
                  <FiSearch
                    className="position-absolute"
                    style={{
                      left: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#6c757d',
                    }}
                    size={18}
                  />
                  <Form.Control
                    type="text"
                    placeholder="Rechercher par nom, reference, code-barres..."
                    value={search}
                    onChange={handleSearch}
                    style={{ paddingLeft: 40 }}
                  />
                </div>
              </Form.Group>
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
          </Row>

          {isLoading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2 text-muted">Chargement...</p>
            </div>
          ) : error ? (
            <Alert variant="danger">
              Erreur lors du chargement des produits:{' '}
              {error.data?.message || error.message}
            </Alert>
          ) : products.length === 0 ? (
            <Alert variant="info">
              Aucun produit trouve. Cliquez sur "Nouveau Produit" pour en
              ajouter un.
            </Alert>
          ) : (
            <>
              <div className="table-responsive">
                <Table hover className="mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Reference</th>
                      <th>Designation</th>
                      <th>Categorie</th>
                      <th>Type</th>
                      <th className="text-end">Prix Vente</th>
                      <th className="text-end">Prix Achat</th>
                      <th className="text-end">Stock</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <tr
                        key={product._id}
                        style={{ cursor: 'pointer' }}
                        onClick={() => navigate(`/produits/${product._id}`)}
                      >
                        <td>
                          <strong>{product.reference}</strong>
                        </td>
                        <td>{product.designation}</td>
                        <td>{product.category?.name || '-'}</td>
                        <td>
                          <Badge
                            bg={product.type === 'produit' ? 'primary' : 'info'}
                          >
                            {product.type === 'produit' ? 'Produit' : 'Service'}
                          </Badge>
                        </td>
                        <td className="text-end">
                          {formatMoney(product.prixVente)}
                        </td>
                        <td className="text-end">
                          {formatMoney(product.prixAchat)}
                        </td>
                        <td className="text-end">
                          <Badge
                            bg={
                              product.stockActuel <= (product.stockMinimum || 0)
                                ? 'danger'
                                : 'success'
                            }
                          >
                            {product.stockActuel || 0}
                          </Badge>
                        </td>
                        <td className="text-end" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            className="me-2"
                            onClick={() =>
                              navigate(`/produits/${product._id}/modifier`)
                            }
                          >
                            <FiEdit2 size={14} />
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() =>
                              handleDelete(product._id, product.designation)
                            }
                          >
                            <FiTrash2 size={14} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>

              {meta && (
                <div className="d-flex justify-content-between align-items-center mt-3">
                  <small className="text-muted">
                    Affichage {(meta.page - 1) * meta.limit + 1} -{' '}
                    {Math.min(meta.page * meta.limit, meta.total)} sur{' '}
                    {meta.total}
                  </small>
                  <BsPagination>
                    <BsPagination.Prev
                      disabled={!meta.hasPrevPage}
                      onClick={() => handlePageChange(page - 1)}
                    />
                    {[...Array(meta.totalPages)].map((_, i) => (
                      <BsPagination.Item
                        key={i + 1}
                        active={i + 1 === page}
                        onClick={() => handlePageChange(i + 1)}
                      >
                        {i + 1}
                      </BsPagination.Item>
                    ))}
                    <BsPagination.Next
                      disabled={!meta.hasNextPage}
                      onClick={() => handlePageChange(page + 1)}
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
