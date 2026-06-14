import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Table from 'react-bootstrap/Table';
import Button from 'react-bootstrap/Button';
import Badge from 'react-bootstrap/Badge';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import ProgressBar from 'react-bootstrap/ProgressBar';
import {
  FiAlertTriangle,
  FiAlertCircle,
  FiXCircle,
  FiClock,
  FiSliders,
  FiShoppingCart,
  FiPackage,
  FiRefreshCw,
  FiArrowRight,
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import usePageTitle from '../../hooks/usePageTitle';
import { formatDate } from '../../utils/formatters';
import { useGetStockAlertsQuery } from '../../redux/api/stocksApi';
import { useUpdateProductSeuilsMutation } from '../../redux/api/productsApi';
import { useAuth } from '../../contexts/AuthContext';
import { PERM } from '../../config/permissions';

const TABS = [
  { key: 'all',          label: 'Toutes',       variant: 'secondary',  icon: FiAlertTriangle },
  { key: 'rupture',      label: 'Ruptures',      variant: 'danger',     icon: FiXCircle },
  { key: 'seuilMinimum', label: 'Seuil critique', variant: 'warning',   icon: FiAlertCircle },
  { key: 'seuilAlerte',  label: 'Seuil alerte',  variant: 'info',       icon: FiAlertTriangle },
  { key: 'peremption',   label: 'Péremption',    variant: 'purple',     icon: FiClock },
];

const ALERT_LEVEL = {
  rupture:      { label: 'Rupture',       bg: 'danger',  text: '' },
  seuilMinimum: { label: 'Seuil critique', bg: 'warning', text: 'dark' },
  seuilAlerte:  { label: 'Seuil alerte',   bg: 'info',    text: '' },
  peremption:   { label: 'Péremption',     bg: 'purple',  text: '' },
};

const StockBadge = ({ quantite, stockMinimum, stockAlerte }) => {
  const pct = stockAlerte > 0 ? Math.min(100, Math.round((quantite / stockAlerte) * 100)) : 0;
  let variant = 'success';
  if (quantite <= 0) variant = 'danger';
  else if (quantite <= stockMinimum) variant = 'warning';
  else if (quantite <= stockAlerte) variant = 'info';

  return (
    <div>
      <span className={`fw-bold text-${variant === 'info' ? 'info' : variant === 'warning' ? 'warning' : variant === 'danger' ? 'danger' : 'success'}`}>
        {quantite}
      </span>
      {stockAlerte > 0 && (
        <ProgressBar
          now={pct}
          variant={variant}
          style={{ height: 4, marginTop: 2 }}
        />
      )}
    </div>
  );
};

const StockAlertsPage = () => {
  usePageTitle('Alertes de stock', [
    { label: 'Accueil', path: '/' },
    { label: 'Stocks', path: '/stocks' },
    { label: 'Alertes' },
  ]);

  const { hasPermission } = useAuth();
  const canEdit = hasPermission(PERM.STOCKS_UPDATE);

  const [activeTab, setActiveTab] = useState('all');
  const [seuilModal, setSeuilModal] = useState(null); // { stockId, productId, name, stockMinimum, stockAlerte, stockMaximum }
  const [seuilForm, setSeuilForm] = useState({ stockMinimum: 0, stockAlerte: 0, stockMaximum: 0 });

  const { data, isLoading, error, refetch, isFetching } = useGetStockAlertsQuery();
  const [updateSeuils, { isLoading: savingSeuils }] = useUpdateProductSeuilsMutation();

  const alerts = useMemo(
    () => data?.data || { rupture: [], seuilAlerte: [], seuilMinimum: [], peremption: [] },
    [data]
  );
  const summary = data?.summary || { rupture: 0, seuilAlerte: 0, seuilMinimum: 0, peremption: 0, total: 0 };

  const displayRows = useMemo(() => {
    if (activeTab === 'all') {
      return [
        ...alerts.rupture.map((s) => ({ ...s, alertType: 'rupture' })),
        ...alerts.seuilMinimum.map((s) => ({ ...s, alertType: 'seuilMinimum' })),
        ...alerts.seuilAlerte.map((s) => ({ ...s, alertType: 'seuilAlerte' })),
        ...alerts.peremption.map((s) => ({ ...s, alertType: 'peremption' })),
      ];
    }
    return (alerts[activeTab] || []).map((s) => ({ ...s, alertType: activeTab }));
  }, [activeTab, alerts]);

  const openSeuilModal = (stock) => {
    setSeuilModal(stock);
    setSeuilForm({
      stockMinimum: stock.product?.stockMinimum ?? 5,
      stockAlerte:  stock.product?.stockAlerte  ?? 10,
      stockMaximum: stock.product?.stockMaximum ?? 1000,
    });
  };

  const handleSaveSeuils = async () => {
    try {
      await updateSeuils({ id: seuilModal.product._id, ...seuilForm }).unwrap();
      toast.success('Seuils mis à jour');
      setSeuilModal(null);
      refetch();
    } catch (err) {
      toast.error(err.data?.message || 'Erreur lors de la mise à jour');
    }
  };

  return (
    <>
      <div className="page-header">
        <div className="d-flex align-items-center gap-2">
          <FiAlertTriangle size={22} className="text-warning" />
          <h1 className="mb-0">Alertes de stock</h1>
          {summary.total > 0 && (
            <Badge bg="danger" pill className="fs-6">{summary.total}</Badge>
          )}
        </div>
        <Button variant="outline-secondary" size="sm" onClick={refetch} disabled={isFetching}>
          {isFetching ? <Spinner animation="border" size="sm" /> : <FiRefreshCw size={14} />}
          <span className="ms-1 d-none d-md-inline">Actualiser</span>
        </Button>
      </div>

      {/* KPI Cards */}
      <Row className="g-3 mb-3">
        {[
          { key: 'rupture',      label: 'Ruptures de stock',  icon: FiXCircle,       color: '#dc3545', bg: '#fff5f5' },
          { key: 'seuilMinimum', label: 'Seuil critique',     icon: FiAlertCircle,   color: '#fd7e14', bg: '#fff8f0' },
          { key: 'seuilAlerte',  label: 'Seuil alerte',       icon: FiAlertTriangle, color: '#0dcaf0', bg: '#f0faff' },
          { key: 'peremption',   label: 'Péremption < 30 j',  icon: FiClock,         color: '#6f42c1', bg: '#f8f5ff' },
        ].map(({ key, label, icon: Icon, color, bg }) => (
          <Col key={key} sm={6} xl={3}>
            <Card
              className="shadow-sm border-0 h-100"
              style={{ background: bg, cursor: 'pointer' }}
              onClick={() => setActiveTab(key)}
            >
              <Card.Body className="d-flex align-items-center gap-3">
                <div style={{ width: 44, height: 44, borderRadius: 12, background: color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={22} style={{ color }} />
                </div>
                <div>
                  <div className="fs-2 fw-bold" style={{ color, lineHeight: 1 }}>
                    {summary[key] || 0}
                  </div>
                  <div className="text-muted small">{label}</div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Onglets */}
      <div className="d-flex gap-2 mb-3 flex-wrap">
        {TABS.map((tab) => {
          const count = tab.key === 'all' ? summary.total : (summary[tab.key] || 0);
          return (
            <Button
              key={tab.key}
              size="sm"
              variant={activeTab === tab.key ? tab.variant : `outline-${tab.variant === 'purple' ? 'secondary' : tab.variant}`}
              onClick={() => setActiveTab(tab.key)}
              className="d-flex align-items-center gap-1"
            >
              <tab.icon size={13} /> {tab.label}
              {count > 0 && (
                <Badge bg={activeTab === tab.key ? 'light' : tab.variant} text={activeTab === tab.key ? 'dark' : ''} pill className="ms-1">
                  {count}
                </Badge>
              )}
            </Button>
          );
        })}
      </div>

      {/* Tableau */}
      <Card className="shadow-sm">
        <Card.Body className="p-0">
          {isLoading ? (
            <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
          ) : error ? (
            <Alert variant="danger" className="m-3">
              <FiAlertTriangle className="me-2" />{error.data?.message || 'Erreur de chargement'}
            </Alert>
          ) : displayRows.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <FiPackage size={44} className="mb-3 text-success" />
              <p className="mb-0 fw-semibold">Aucune alerte</p>
              <p className="small">Tous les stocks sont dans les seuils normaux.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover className="mb-0" style={{ fontSize: '0.875rem' }}>
                <thead className="table-light">
                  <tr>
                    <th>Produit</th>
                    <th>Code</th>
                    <th>Dépôt</th>
                    <th className="text-center">Stock actuel</th>
                    <th className="text-center">Seuil critique</th>
                    <th className="text-center">Seuil alerte</th>
                    <th className="text-center">Seuil max</th>
                    <th className="text-center">Alerte</th>
                    {activeTab === 'peremption' && <th className="text-center">Péremption</th>}
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {displayRows.map((stock) => {
                    const prod = stock.product || {};
                    const wh = stock.warehouse || {};
                    const level = ALERT_LEVEL[stock.alertType] || ALERT_LEVEL.seuilAlerte;
                    return (
                      <tr key={`${stock._id}-${stock.alertType}`}>
                        <td className="fw-medium">
                          <Link to={`/produits/${prod._id}`} className="text-decoration-none">
                            {prod.name || '—'}
                          </Link>
                        </td>
                        <td className="text-muted small">{prod.code || '—'}</td>
                        <td className="small text-muted">{wh.name || '—'}</td>
                        <td className="text-center">
                          <StockBadge
                            quantite={stock.quantite}
                            stockMinimum={prod.stockMinimum || 0}
                            stockAlerte={prod.stockAlerte || 0}
                          />
                        </td>
                        <td className="text-center small text-muted">{prod.stockMinimum ?? '—'}</td>
                        <td className="text-center small text-muted">{prod.stockAlerte ?? '—'}</td>
                        <td className="text-center small text-muted">{prod.stockMaximum ?? '—'}</td>
                        <td className="text-center">
                          <Badge bg={level.bg} text={level.text} style={{ fontSize: '0.7rem' }}>
                            {level.label}
                          </Badge>
                        </td>
                        {activeTab === 'peremption' && (
                          <td className="text-center small">
                            {stock.expiryDate ? (
                              <span className="text-danger fw-semibold">{formatDate(stock.expiryDate)}</span>
                            ) : '—'}
                          </td>
                        )}
                        <td className="text-end">
                          <div className="d-flex gap-1 justify-content-end">
                            {canEdit && prod._id && (
                              <Button
                                variant="outline-secondary"
                                size="sm"
                                title="Modifier les seuils"
                                onClick={() => openSeuilModal(stock)}
                              >
                                <FiSliders size={13} />
                              </Button>
                            )}
                            <Button
                              as={Link}
                              to="/achats/commandes/nouveau"
                              variant="outline-primary"
                              size="sm"
                              title="Commander"
                            >
                              <FiShoppingCart size={13} />
                            </Button>
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
        {displayRows.length > 0 && (
          <Card.Footer className="d-flex justify-content-between align-items-center">
            <small className="text-muted">{displayRows.length} alerte(s)</small>
            {summary.rupture > 0 && (
              <Button
                as={Link}
                to="/achats/commandes/nouveau"
                variant="danger"
                size="sm"
                className="d-flex align-items-center gap-1"
              >
                <FiShoppingCart size={13} /> Commander les produits en rupture
                <FiArrowRight size={13} />
              </Button>
            )}
          </Card.Footer>
        )}
      </Card>

      {/* Info box */}
      <Alert variant="light" className="border mt-3 small d-flex gap-3">
        <div className="d-flex gap-2 align-items-center">
          <FiXCircle className="text-danger" size={14} /> <strong>Rupture</strong> : stock ≤ 0
        </div>
        <div className="d-flex gap-2 align-items-center">
          <FiAlertCircle className="text-warning" size={14} /> <strong>Critique</strong> : stock ≤ seuil minimum
        </div>
        <div className="d-flex gap-2 align-items-center">
          <FiAlertTriangle className="text-info" size={14} /> <strong>Alerte</strong> : stock ≤ seuil alerte
        </div>
        <div className="d-flex gap-2 align-items-center">
          <FiClock style={{ color: '#6f42c1' }} size={14} /> <strong>Péremption</strong> : date ≤ 30 jours
        </div>
      </Alert>

      {/* Modal modifier seuils */}
      <Modal show={!!seuilModal} onHide={() => setSeuilModal(null)}>
        <Modal.Header closeButton>
          <Modal.Title>
            <FiSliders className="me-2" />
            Modifier les seuils — {seuilModal?.product?.name}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="info" className="small py-2">
            Ces seuils déclenchent les alertes sur tous les dépôts pour ce produit.
          </Alert>
          <Row className="g-3">
            <Col md={4}>
              <Form.Group>
                <Form.Label className="small fw-semibold text-danger">Seuil minimum (critique)</Form.Label>
                <Form.Control
                  type="number"
                  min={0}
                  step={1}
                  value={seuilForm.stockMinimum}
                  onChange={(e) => setSeuilForm((p) => ({ ...p, stockMinimum: Number(e.target.value) }))}
                />
                <Form.Text className="text-muted">Déclenche alerte critique</Form.Text>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label className="small fw-semibold text-warning">Seuil alerte</Form.Label>
                <Form.Control
                  type="number"
                  min={0}
                  step={1}
                  value={seuilForm.stockAlerte}
                  onChange={(e) => setSeuilForm((p) => ({ ...p, stockAlerte: Number(e.target.value) }))}
                />
                <Form.Text className="text-muted">Déclenche alerte orange</Form.Text>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label className="small fw-semibold text-success">Stock maximum</Form.Label>
                <Form.Control
                  type="number"
                  min={0}
                  step={1}
                  value={seuilForm.stockMaximum}
                  onChange={(e) => setSeuilForm((p) => ({ ...p, stockMaximum: Number(e.target.value) }))}
                />
                <Form.Text className="text-muted">Seuil de surstock</Form.Text>
              </Form.Group>
            </Col>
          </Row>

          {/* Aperçu des seuils */}
          <div className="mt-3 p-3 bg-light rounded">
            <div className="small fw-semibold mb-2">Aperçu des seuils</div>
            <div className="d-flex gap-3 align-items-center flex-wrap">
              <span><Badge bg="danger">0</Badge> ← Rupture</span>
              <FiArrowRight size={12} />
              <span><Badge bg="warning" text="dark">{seuilForm.stockMinimum}</Badge> ← Critique</span>
              <FiArrowRight size={12} />
              <span><Badge bg="info">{seuilForm.stockAlerte}</Badge> ← Alerte</span>
              <FiArrowRight size={12} />
              <span><Badge bg="success">{seuilForm.stockMaximum}</Badge> ← Max</span>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setSeuilModal(null)}>Annuler</Button>
          <Button variant="primary" onClick={handleSaveSeuils} disabled={savingSeuils}>
            {savingSeuils ? <Spinner animation="border" size="sm" className="me-1" /> : null}
            Enregistrer
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default StockAlertsPage;
