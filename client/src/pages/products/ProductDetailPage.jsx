import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Badge from 'react-bootstrap/Badge';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Nav from 'react-bootstrap/Nav';
import Tab from 'react-bootstrap/Tab';
import { FiEdit2, FiTrash2, FiArrowLeft, FiPackage } from 'react-icons/fi';
import { toast } from 'react-toastify';
import usePageTitle from '../../hooks/usePageTitle';
import { formatMoney } from '../../utils/formatters';
import {
  useGetProductQuery,
  useDeleteProductMutation,
} from '../../redux/api/productsApi';

const ProductDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('informations');

  usePageTitle('Detail du produit', [
    { label: 'Accueil', path: '/' },
    { label: 'Produits', path: '/produits' },
    { label: 'Detail' },
  ]);

  const { data, isLoading, error } = useGetProductQuery(id);
  const [deleteProduct, { isLoading: isDeleting }] = useDeleteProductMutation();

  const handleDelete = async () => {
    if (
      window.confirm(
        `Etes-vous sur de vouloir supprimer le produit "${product.designation}" ?`
      )
    ) {
      try {
        await deleteProduct(id).unwrap();
        toast.success('Produit supprime avec succes');
        navigate('/produits');
      } catch (err) {
        toast.error(err.data?.message || 'Erreur lors de la suppression');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2 text-muted">Chargement...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="danger">
        Erreur lors du chargement du produit:{' '}
        {error.data?.message || error.message}
      </Alert>
    );
  }

  const product = data?.data;

  if (!product) {
    return <Alert variant="warning">Produit non trouve</Alert>;
  }

  const stockValue = (product.stockActuel || 0) * (product.prixAchat || 0);
  const isStockLow =
    product.stockActuel <= (product.stockMinimum || 0) && product.type === 'produit';

  return (
    <>
      <div className="page-header d-flex justify-content-between align-items-center mb-4">
        <div>
          <Button
            variant="link"
            className="p-0 me-3 text-decoration-none"
            onClick={() => navigate('/produits')}
          >
            <FiArrowLeft className="me-2" />
            Retour
          </Button>
          <h1 className="d-inline-block ms-2">{product.designation}</h1>
        </div>
        <div>
          <Button
            variant="warning"
            className="me-2"
            onClick={() => navigate(`/produits/${id}/modifier`)}
          >
            <FiEdit2 className="me-2" />
            Modifier
          </Button>
          <Button
            variant="danger"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            <FiTrash2 className="me-2" />
            {isDeleting ? 'Suppression...' : 'Supprimer'}
          </Button>
        </div>
      </div>

      <Row className="g-3 mb-4">
        <Col lg={12}>
          <Card className="shadow-sm">
            <Card.Header className="bg-white">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="mb-1">{product.reference}</h6>
                  <div className="mt-2">
                    <Badge
                      bg={product.type === 'produit' ? 'primary' : 'info'}
                      className="me-2"
                    >
                      {product.type === 'produit' ? 'Produit' : 'Service'}
                    </Badge>
                    {product.category && (
                      <Badge bg="secondary">{product.category.name}</Badge>
                    )}
                  </div>
                </div>
                <div className="text-end">
                  <Badge bg={product.isActive ? 'success' : 'danger'}>
                    {product.isActive ? 'Actif' : 'Inactif'}
                  </Badge>
                </div>
              </div>
            </Card.Header>
          </Card>
        </Col>
      </Row>

      <Tab.Container activeKey={activeTab} onSelect={setActiveTab}>
        <Card className="shadow-sm">
          <Card.Header className="bg-white">
            <Nav variant="tabs">
              <Nav.Item>
                <Nav.Link eventKey="informations">Informations</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="stock">Stock</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="historique">Historique</Nav.Link>
              </Nav.Item>
            </Nav>
          </Card.Header>
          <Card.Body>
            <Tab.Content>
              <Tab.Pane eventKey="informations">
                <Row className="g-3">
                  <Col md={6}>
                    <p className="mb-2">
                      <strong>Reference:</strong> {product.reference || '-'}
                    </p>
                    <p className="mb-2">
                      <strong>Designation:</strong> {product.designation}
                    </p>
                    <p className="mb-2">
                      <strong>Description:</strong>{' '}
                      {product.description || 'Aucune description'}
                    </p>
                    <p className="mb-2">
                      <strong>Categorie:</strong>{' '}
                      {product.category?.name || 'Aucune'}
                    </p>
                    <p className="mb-2">
                      <strong>Type:</strong>{' '}
                      {product.type === 'produit' ? 'Produit' : 'Service'}
                    </p>
                  </Col>
                  <Col md={6}>
                    <p className="mb-2">
                      <strong>Prix de Vente:</strong>{' '}
                      {formatMoney(product.prixVente)}
                    </p>
                    <p className="mb-2">
                      <strong>Prix d'Achat:</strong>{' '}
                      {formatMoney(product.prixAchat)}
                    </p>
                    <p className="mb-2">
                      <strong>TVA:</strong> {product.tva}%
                    </p>
                    <p className="mb-2">
                      <strong>Unite:</strong> {product.unite || '-'}
                    </p>
                    <p className="mb-2">
                      <strong>Code-barres:</strong> {product.codeBarre || '-'}
                    </p>
                  </Col>
                </Row>
              </Tab.Pane>

              <Tab.Pane eventKey="stock">
                {product.type === 'produit' ? (
                  <Row className="g-3">
                    <Col md={12}>
                      {isStockLow && (
                        <Alert variant="warning">
                          <FiPackage className="me-2" />
                          Le stock actuel est inferieur ou egal au stock minimum.
                          Veuillez reapprovisionner.
                        </Alert>
                      )}
                    </Col>
                    <Col md={4}>
                      <Card className="bg-light">
                        <Card.Body>
                          <h6 className="text-muted mb-2">Stock Actuel</h6>
                          <h3 className="mb-0">
                            <Badge
                              bg={isStockLow ? 'danger' : 'success'}
                              className="fs-4"
                            >
                              {product.stockActuel || 0}
                            </Badge>
                          </h3>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={4}>
                      <Card className="bg-light">
                        <Card.Body>
                          <h6 className="text-muted mb-2">Stock Minimum</h6>
                          <h3 className="mb-0">{product.stockMinimum || 0}</h3>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={4}>
                      <Card className="bg-light">
                        <Card.Body>
                          <h6 className="text-muted mb-2">Valeur du Stock</h6>
                          <h3 className="mb-0 text-primary">
                            {formatMoney(stockValue)}
                          </h3>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>
                ) : (
                  <Alert variant="info">
                    La gestion du stock ne s'applique pas aux services.
                  </Alert>
                )}
              </Tab.Pane>

              <Tab.Pane eventKey="historique">
                <Alert variant="info">
                  L'historique des mouvements de stock sera affiche ici.
                </Alert>
              </Tab.Pane>
            </Tab.Content>
          </Card.Body>
        </Card>
      </Tab.Container>
    </>
  );
};

export default ProductDetailPage;
