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
import Modal from 'react-bootstrap/Modal';
import Tabs from 'react-bootstrap/Tabs';
import Tab from 'react-bootstrap/Tab';
import BsPagination from 'react-bootstrap/Pagination';
import {
  FiPackage,
  FiAlertTriangle,
  FiSearch,
  FiPlus,
  FiArrowUpRight,
  FiArrowDownLeft,
  FiTruck,
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import usePageTitle from '../../hooks/usePageTitle';
import { formatMoney, formatDate } from '../../utils/formatters';
import {
  useGetStocksQuery,
  useGetStockAlertsQuery,
  useGetStockMovementsQuery,
  useCreateStockMovementMutation,
  useGetWarehousesQuery,
} from '../../redux/api/stocksApi';

const StocksPage = () => {
  usePageTitle('Stocks', [
    { label: 'Accueil', path: '/' },
    { label: 'Stocks' },
  ]);

  const [activeTab, setActiveTab] = useState('stocks');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('');
  const [showMvtModal, setShowMvtModal] = useState(false);
  const [mvtForm, setMvtForm] = useState({
    product: '',
    warehouse: '',
    type: 'entree',
    quantity: '',
    motif: '',
  });

  const queryParams = {
    page,
    limit: 25,
    search,
    ...(warehouseFilter && { warehouse: warehouseFilter }),
  };

  const { data: stocksData, isLoading: isLoadingStocks, error: stocksError } = useGetStocksQuery(queryParams);
  const { data: alertsData, isLoading: isLoadingAlerts } = useGetStockAlertsQuery();
  const { data: movementsData, isLoading: isLoadingMovements } = useGetStockMovementsQuery({ page, limit: 25 });
  const { data: warehousesData } = useGetWarehousesQuery();
  const [createStockMovement, { isLoading: isCreatingMvt }] = useCreateStockMovementMutation();

  const stocks = stocksData?.data || [];
  const meta = stocksData?.meta;
  const alerts = alertsData?.data || [];
  const movements = movementsData?.data || [];
  const warehouses = warehousesData?.data || [];

  const handleMvtChange = (e) => {
    const { name, value } = e.target;
    setMvtForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateMovement = async () => {
    if (!mvtForm.product || !mvtForm.warehouse || !mvtForm.quantity) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      await createStockMovement({
        product: mvtForm.product,
        warehouse: mvtForm.warehouse,
        type: mvtForm.type,
        quantity: Number(mvtForm.quantity),
        motif: mvtForm.motif,
      }).unwrap();
      toast.success('Mouvement de stock cree avec succes');
      setShowMvtModal(false);
      setMvtForm({ product: '', warehouse: '', type: 'entree', quantity: '', motif: '' });
    } catch (err) {
      toast.error(err.data?.message || 'Erreur lors de la creation du mouvement');
    }
  };

  const getStockBadge = (stock) => {
    if (!stock.product) return <Badge bg="secondary">-</Badge>;
    const min = stock.product.stockMinimum || 0;
    if (stock.quantite <= 0) return <Badge bg="danger">Rupture</Badge>;
    if (stock.quantite <= min) return <Badge bg="warning">Faible</Badge>;
    return <Badge bg="success">Normal</Badge>;
  };

  const getMovementTypeBadge = (type) => {
    switch (type) {
      case 'entree':
        return <Badge bg="success"><FiArrowDownLeft className="me-1" size={12} />Entree</Badge>;
      case 'sortie':
        return <Badge bg="danger"><FiArrowUpRight className="me-1" size={12} />Sortie</Badge>;
      case 'transfert':
        return <Badge bg="info"><FiTruck className="me-1" size={12} />Transfert</Badge>;
      case 'ajustement':
        return <Badge bg="warning">Ajustement</Badge>;
      default:
        return <Badge bg="secondary">{type}</Badge>;
    }
  };

  return (
    <>
      <div className="page-header">
        <h1>Gestion des Stocks</h1>
        <Button
          variant="primary"
          onClick={() => setShowMvtModal(true)}
          className="d-flex align-items-center gap-2"
        >
          <FiPlus size={18} />
          Nouveau Mouvement
        </Button>
      </div>

      {/* Alert summary cards */}
      <Row className="g-3 mb-4">
        <Col sm={6} lg={3}>
          <Card className="shadow-sm h-100">
            <Card.Body className="d-flex align-items-center">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center me-3"
                style={{ width: 48, height: 48, backgroundColor: '#05966915', color: '#059669' }}
              >
                <FiPackage size={24} />
              </div>
              <div>
                <div className="text-muted small">Total Produits</div>
                <div className="fw-bold fs-5">{stocks.length || 0}</div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col sm={6} lg={3}>
          <Card className="shadow-sm h-100">
            <Card.Body className="d-flex align-items-center">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center me-3"
                style={{ width: 48, height: 48, backgroundColor: '#dc262615', color: '#dc2626' }}
              >
                <FiAlertTriangle size={24} />
              </div>
              <div>
                <div className="text-muted small">Alertes Stock</div>
                <div className="fw-bold fs-5 text-danger">{alerts.length || 0}</div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col sm={6} lg={3}>
          <Card className="shadow-sm h-100">
            <Card.Body className="d-flex align-items-center">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center me-3"
                style={{ width: 48, height: 48, backgroundColor: '#1a56db15', color: '#1a56db' }}
              >
                <FiTruck size={24} />
              </div>
              <div>
                <div className="text-muted small">Depots</div>
                <div className="fw-bold fs-5">{warehouses.length || 0}</div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col sm={6} lg={3}>
          <Card className="shadow-sm h-100">
            <Card.Body className="d-flex align-items-center">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center me-3"
                style={{ width: 48, height: 48, backgroundColor: '#d9770615', color: '#d97706' }}
              >
                <FiPackage size={24} />
              </div>
              <div>
                <div className="text-muted small">Valeur Totale</div>
                <div className="fw-bold fs-6">{formatMoney(stocks.reduce((sum, s) => sum + (s.valeurStock || 0), 0))}</div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="shadow-sm">
        <Card.Body>
          <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-3">
            <Tab eventKey="stocks" title="Etat des Stocks">
              <Row className="mb-3 g-3">
                <Col md={6}>
                  <div className="position-relative">
                    <FiSearch
                      className="position-absolute"
                      style={{ left: 12, top: '50%', transform: 'translateY(-50%)', color: '#6c757d' }}
                      size={18}
                    />
                    <Form.Control
                      type="text"
                      placeholder="Rechercher par produit..."
                      value={search}
                      onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                      style={{ paddingLeft: 40 }}
                    />
                  </div>
                </Col>
                <Col md={3}>
                  <Form.Select
                    value={warehouseFilter}
                    onChange={(e) => { setWarehouseFilter(e.target.value); setPage(1); }}
                  >
                    <option value="">Tous les depots</option>
                    {warehouses.map((wh) => (
                      <option key={wh._id} value={wh._id}>{wh.name}</option>
                    ))}
                  </Form.Select>
                </Col>
              </Row>

              {isLoadingStocks ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="primary" />
                  <p className="mt-2 text-muted">Chargement...</p>
                </div>
              ) : stocksError ? (
                <Alert variant="danger">
                  Erreur lors du chargement des stocks: {stocksError.data?.message || stocksError.message}
                </Alert>
              ) : stocks.length === 0 ? (
                <Alert variant="info">Aucun stock trouve.</Alert>
              ) : (
                <>
                  <div className="table-responsive">
                    <Table hover className="mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>Produit</th>
                          <th>Reference</th>
                          <th>Depot</th>
                          <th className="text-end">Quantite</th>
                          <th className="text-end">Stock Min.</th>
                          <th className="text-end">Valeur Stock</th>
                          <th>Statut</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stocks.map((stock) => (
                          <tr key={stock._id}>
                            <td><strong>{stock.product?.designation || '-'}</strong></td>
                            <td>{stock.product?.reference || '-'}</td>
                            <td>{stock.warehouse?.name || '-'}</td>
                            <td className="text-end">{stock.quantite}</td>
                            <td className="text-end">{stock.product?.stockMinimum || 0}</td>
                            <td className="text-end">{formatMoney(stock.valeurStock || 0)}</td>
                            <td>{getStockBadge(stock)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                  {meta && (
                    <div className="d-flex justify-content-between align-items-center mt-3">
                      <small className="text-muted">
                        Affichage {(meta.page - 1) * meta.limit + 1} - {Math.min(meta.page * meta.limit, meta.total)} sur {meta.total}
                      </small>
                      <BsPagination>
                        <BsPagination.Prev disabled={!meta.hasPrevPage} onClick={() => setPage(page - 1)} />
                        {[...Array(Math.min(meta.totalPages || 1, 10))].map((_, i) => (
                          <BsPagination.Item key={i + 1} active={i + 1 === page} onClick={() => setPage(i + 1)}>
                            {i + 1}
                          </BsPagination.Item>
                        ))}
                        <BsPagination.Next disabled={!meta.hasNextPage} onClick={() => setPage(page + 1)} />
                      </BsPagination>
                    </div>
                  )}
                </>
              )}
            </Tab>

            <Tab eventKey="alertes" title={<>Alertes <Badge bg="danger" className="ms-1">{alerts.length}</Badge></>}>
              {isLoadingAlerts ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="primary" />
                  <p className="mt-2 text-muted">Chargement...</p>
                </div>
              ) : alerts.length === 0 ? (
                <Alert variant="success" className="mt-3">Aucune alerte de stock. Tous les niveaux sont normaux.</Alert>
              ) : (
                <div className="table-responsive mt-3">
                  <Table hover className="mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Produit</th>
                        <th>Reference</th>
                        <th>Depot</th>
                        <th className="text-end">Stock Actuel</th>
                        <th className="text-end">Stock Minimum</th>
                        <th>Niveau</th>
                      </tr>
                    </thead>
                    <tbody>
                      {alerts.map((alert, index) => (
                        <tr key={index}>
                          <td><strong>{alert.product?.designation || '-'}</strong></td>
                          <td>{alert.product?.reference || '-'}</td>
                          <td>{alert.warehouse?.name || '-'}</td>
                          <td className="text-end text-danger fw-bold">{alert.quantite || 0}</td>
                          <td className="text-end">{alert.product?.stockMinimum || 0}</td>
                          <td>
                            {(alert.quantite || 0) <= 0 ? (
                              <Badge bg="danger">Rupture</Badge>
                            ) : (
                              <Badge bg="warning">Faible</Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </Tab>

            <Tab eventKey="mouvements" title="Mouvements">
              {isLoadingMovements ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="primary" />
                  <p className="mt-2 text-muted">Chargement...</p>
                </div>
              ) : movements.length === 0 ? (
                <Alert variant="info" className="mt-3">Aucun mouvement de stock enregistre.</Alert>
              ) : (
                <div className="table-responsive mt-3">
                  <Table hover className="mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Date</th>
                        <th>Produit</th>
                        <th>Type</th>
                        <th>Depot</th>
                        <th className="text-end">Quantite</th>
                        <th>Motif</th>
                        <th>Utilisateur</th>
                      </tr>
                    </thead>
                    <tbody>
                      {movements.map((mvt) => (
                        <tr key={mvt._id}>
                          <td>{formatDate(mvt.createdAt)}</td>
                          <td><strong>{mvt.product?.designation || '-'}</strong></td>
                          <td>{getMovementTypeBadge(mvt.type)}</td>
                          <td>{mvt.warehouse?.name || '-'}</td>
                          <td className="text-end">{mvt.quantity}</td>
                          <td>{mvt.motif || '-'}</td>
                          <td>{mvt.createdBy?.firstName} {mvt.createdBy?.lastName}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </Tab>
          </Tabs>
        </Card.Body>
      </Card>

      {/* Modal Nouveau Mouvement */}
      <Modal show={showMvtModal} onHide={() => setShowMvtModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Nouveau Mouvement de Stock</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row className="g-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Type de mouvement <span className="text-danger">*</span></Form.Label>
                <Form.Select name="type" value={mvtForm.type} onChange={handleMvtChange}>
                  <option value="entree">Entree</option>
                  <option value="sortie">Sortie</option>
                  <option value="ajustement">Ajustement</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Depot <span className="text-danger">*</span></Form.Label>
                <Form.Select name="warehouse" value={mvtForm.warehouse} onChange={handleMvtChange}>
                  <option value="">Selectionner un depot</option>
                  {warehouses.map((wh) => (
                    <option key={wh._id} value={wh._id}>{wh.name}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Produit <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  type="text"
                  name="product"
                  value={mvtForm.product}
                  onChange={handleMvtChange}
                  placeholder="ID du produit"
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Quantite <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  type="number"
                  name="quantity"
                  value={mvtForm.quantity}
                  onChange={handleMvtChange}
                  min="1"
                  placeholder="0"
                />
              </Form.Group>
            </Col>
            <Col md={12}>
              <Form.Group>
                <Form.Label>Motif</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  name="motif"
                  value={mvtForm.motif}
                  onChange={handleMvtChange}
                  placeholder="Motif du mouvement..."
                />
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowMvtModal(false)}>
            Annuler
          </Button>
          <Button variant="primary" onClick={handleCreateMovement} disabled={isCreatingMvt}>
            {isCreatingMvt ? 'Creation...' : 'Creer le mouvement'}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default StocksPage;
