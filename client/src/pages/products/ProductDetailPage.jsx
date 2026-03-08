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
import ProgressBar from 'react-bootstrap/ProgressBar';
import Table from 'react-bootstrap/Table';
import {
  FiEdit2,
  FiTrash2,
  FiArrowLeft,
  FiPackage,
  FiTool,
  FiAlertTriangle,
  FiCheckCircle,
  FiXCircle,
  FiInfo,
  FiShoppingCart,
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import usePageTitle from '../../hooks/usePageTitle';
import { formatMoney, formatDate } from '../../utils/formatters';
import { useAuth } from '../../contexts/AuthContext';
import { PERM } from '../../config/permissions';
import {
  useGetProductQuery,
  useDeleteProductMutation,
} from '../../redux/api/productsApi';

/* ─── helpers visuels ─────────────────────────────────────────────────────── */
const InfoRow = ({ label, value }) => (
  <div className="d-flex py-2 border-bottom" style={{ gap: 8 }}>
    <span className="text-muted flex-shrink-0" style={{ minWidth: 160, fontSize: 13 }}>
      {label}
    </span>
    <span className="fw-medium text-dark" style={{ fontSize: 14 }}>
      {value ?? <span className="text-muted fst-italic">—</span>}
    </span>
  </div>
);

const PriceCard = ({ label, amount, color, sub }) => (
  <Card
    className="border-0 h-100"
    style={{ background: `${color}12`, borderLeft: `3px solid ${color}`, borderRadius: 8 }}
  >
    <Card.Body className="py-3">
      <div className="text-muted small mb-1">{label}</div>
      <div className="fw-bold fs-5" style={{ color }}>{formatMoney(amount)}</div>
      {sub && <div className="text-muted" style={{ fontSize: 11 }}>{sub}</div>}
    </Card.Body>
  </Card>
);

const StockKpi = ({ label, value, unit = '', color = '#374151' }) => (
  <Card className="border-0 shadow-sm h-100 text-center" style={{ borderRadius: 10 }}>
    <Card.Body className="py-3">
      <div className="fw-bold" style={{ fontSize: 28, color }}>{value}</div>
      {unit && <div className="text-muted small">{unit}</div>}
      <div className="text-muted mt-1" style={{ fontSize: 12 }}>{label}</div>
    </Card.Body>
  </Card>
);

/* ─── composant principal ─────────────────────────────────────────────────── */
const ProductDetailPage = () => {
  const navigate  = useNavigate();
  const { id }    = useParams();
  const [activeTab, setActiveTab] = useState('informations');
  const { hasPermission } = useAuth();

  usePageTitle('Detail du produit', [
    { label: 'Accueil', path: '/' },
    { label: 'Produits', path: '/produits' },
    { label: 'Detail' },
  ]);

  const { data, isLoading, error }              = useGetProductQuery(id);
  const [deleteProduct, { isLoading: isDeleting }] = useDeleteProductMutation();

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
        Erreur : {error.data?.message || 'Impossible de charger ce produit'}
      </Alert>
    );
  }

  const product      = data?.data;
  const stockSummary = product?.stockSummary;
  const stocks       = product?.stocks || [];

  if (!product) {
    return <Alert variant="warning">Produit non trouve</Alert>;
  }

  const handleDelete = async () => {
    if (!window.confirm(`Supprimer le produit "${product.name}" ?`)) return;
    try {
      await deleteProduct(id).unwrap();
      toast.success('Produit supprime avec succes');
      navigate('/produits');
    } catch (err) {
      toast.error(err.data?.message || 'Erreur lors de la suppression');
    }
  };

  const isService    = product.type === 'service';
  const marge        = product.prixAchat > 0
    ? Math.round(((product.prixVente - product.prixAchat) / product.prixAchat) * 100)
    : 0;
  const prixHT       = product.tauxTVA > 0
    ? Math.round(product.prixVente / (1 + product.tauxTVA / 100))
    : product.prixVente;

  const stockTotal       = stockSummary?.totalStock ?? 0;
  const stockDisponible  = stockSummary?.totalDisponible ?? 0;
  const stockReserve     = stockSummary?.totalReserved ?? 0;
  const stockValue       = stockSummary?.totalValue ?? 0;
  const isEnRupture      = stockSummary?.isEnRupture ?? (stockTotal <= 0);
  const isEnAlerte       = stockSummary?.isEnAlerte ?? false;
  const stockPct         = product.stockMaximum > 0
    ? Math.min(100, Math.round((stockTotal / product.stockMaximum) * 100))
    : 0;

  const stockBarVariant  = isEnRupture ? 'danger' : isEnAlerte ? 'warning' : 'success';

  return (
    <>
      {/* ── Breadcrumb / navigation ─────────────────────────────────────── */}
      <div className="d-flex align-items-center gap-2 mb-3">
        <Button
          variant="link"
          className="p-0 text-muted text-decoration-none d-flex align-items-center gap-1"
          onClick={() => navigate('/produits')}
        >
          <FiArrowLeft size={16} />
          <span style={{ fontSize: 14 }}>Retour aux produits</span>
        </Button>
      </div>

      {/* ── Hero banniere ───────────────────────────────────────────────── */}
      <Card
        className="border-0 shadow-sm mb-4"
        style={{
          borderRadius: 14,
          background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
        }}
      >
        <Card.Body className="p-4">
          <Row className="align-items-start g-3">
            <Col xs={12} md>
              {/* Icone produit */}
              <div className="d-flex align-items-start gap-3">
                <div
                  className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0"
                  style={{
                    width: 56, height: 56,
                    background: product.type === 'produit' ? '#3b82f620' : '#06b6d420',
                  }}
                >
                  {product.type === 'produit'
                    ? <FiPackage size={26} color={product.type === 'produit' ? '#60a5fa' : '#22d3ee'} />
                    : <FiTool size={26} color="#22d3ee" />
                  }
                </div>
                <div>
                  <div className="d-flex align-items-center gap-2 flex-wrap mb-1">
                    <Badge
                      bg={product.type === 'produit' ? 'primary' : 'info'}
                      style={{ fontSize: 11 }}
                    >
                      {product.type === 'produit' ? 'Produit' : 'Service'}
                    </Badge>
                    {product.category && (
                      <Badge bg="secondary" style={{ fontSize: 11 }}>
                        {product.category.name}
                      </Badge>
                    )}
                    <Badge
                      bg={product.isActive ? 'success' : 'danger'}
                      style={{ fontSize: 11 }}
                    >
                      {product.isActive ? 'Actif' : 'Inactif'}
                    </Badge>
                  </div>
                  <h2 className="text-white fw-bold mb-1" style={{ fontSize: 22 }}>
                    {product.name}
                  </h2>
                  {product.code && (
                    <code className="text-secondary" style={{ fontSize: 13 }}>
                      {product.code}
                    </code>
                  )}
                  {product.description && (
                    <p className="text-secondary mb-0 mt-2" style={{ fontSize: 13 }}>
                      {product.description}
                    </p>
                  )}
                </div>
              </div>
            </Col>

            {/* Actions */}
            <Col xs={12} md="auto" className="d-flex gap-2 flex-wrap">
              {hasPermission(PERM.PRODUITS_UPDATE) && (
                <Button
                  variant="warning"
                  onClick={() => navigate(`/produits/${id}/modifier`)}
                  className="d-flex align-items-center gap-2"
                >
                  <FiEdit2 size={15} />
                  Modifier
                </Button>
              )}
              {hasPermission(PERM.PRODUITS_DELETE) && (
                <Button
                  variant="outline-danger"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="d-flex align-items-center gap-2"
                >
                  <FiTrash2 size={15} />
                  {isDeleting ? 'Suppression...' : 'Supprimer'}
                </Button>
              )}
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* ── Cartes de prix ──────────────────────────────────────────────── */}
      <Row className="g-3 mb-4">
        <Col xs={6} md={3}>
          <PriceCard label="Prix de Vente TTC" amount={product.prixVente} color="#6366f1" />
        </Col>
        <Col xs={6} md={3}>
          <PriceCard
            label="Prix de Vente HT"
            amount={prixHT}
            color="#8b5cf6"
            sub={`TVA ${product.tauxTVA}%`}
          />
        </Col>
        <Col xs={6} md={3}>
          <PriceCard label="Prix d'Achat" amount={product.prixAchat} color="#3b82f6" />
        </Col>
        <Col xs={6} md={3}>
          <PriceCard
            label="Marge brute"
            amount={product.prixVente - product.prixAchat}
            color={marge >= 0 ? '#22c55e' : '#ef4444'}
            sub={`${marge >= 0 ? '+' : ''}${marge}%`}
          />
        </Col>
      </Row>

      {/* ── Tabs ────────────────────────────────────────────────────────── */}
      <Tab.Container activeKey={activeTab} onSelect={setActiveTab}>
        <Card className="border-0 shadow-sm" style={{ borderRadius: 12 }}>
          <Card.Header className="bg-white border-bottom" style={{ borderRadius: '12px 12px 0 0' }}>
            <Nav variant="tabs" className="border-0">
              <Nav.Item>
                <Nav.Link eventKey="informations" className="d-flex align-items-center gap-2">
                  <FiInfo size={14} /> Informations
                </Nav.Link>
              </Nav.Item>
              {!isService && (
                <Nav.Item>
                  <Nav.Link eventKey="stock" className="d-flex align-items-center gap-2">
                    <FiPackage size={14} /> Stock
                    {isEnRupture && (
                      <Badge bg="danger" style={{ fontSize: 10 }}>Rupture</Badge>
                    )}
                    {!isEnRupture && isEnAlerte && (
                      <Badge bg="warning" text="dark" style={{ fontSize: 10 }}>Alerte</Badge>
                    )}
                  </Nav.Link>
                </Nav.Item>
              )}
              <Nav.Item>
                <Nav.Link eventKey="ventes" className="d-flex align-items-center gap-2">
                  <FiShoppingCart size={14} /> Ventes
                </Nav.Link>
              </Nav.Item>
            </Nav>
          </Card.Header>

          <Card.Body className="p-4">
            <Tab.Content>

              {/* ── Onglet Informations ──────────────────────────────── */}
              <Tab.Pane eventKey="informations">
                <Row className="g-4">
                  <Col md={6}>
                    <h6 className="text-uppercase text-muted fw-semibold mb-3" style={{ fontSize: 11, letterSpacing: 1 }}>
                      Identification
                    </h6>
                    <InfoRow label="Code produit" value={product.code} />
                    <InfoRow label="Designation" value={product.name} />
                    <InfoRow label="Code-barres" value={product.barcode} />
                    <InfoRow label="Marque" value={product.marque} />
                    <InfoRow label="Type" value={product.type === 'produit' ? 'Produit physique' : 'Service'} />
                    <InfoRow label="Categorie" value={product.category?.name} />
                    <InfoRow label="Unite de mesure" value={product.unite} />
                    <InfoRow label="Statut" value={
                      <Badge bg={product.isActive ? 'success' : 'secondary'}>
                        {product.isActive ? 'Actif' : 'Inactif'}
                      </Badge>
                    } />
                  </Col>
                  <Col md={6}>
                    <h6 className="text-uppercase text-muted fw-semibold mb-3" style={{ fontSize: 11, letterSpacing: 1 }}>
                      Tarification
                    </h6>
                    <InfoRow label="Prix de Vente TTC" value={formatMoney(product.prixVente)} />
                    <InfoRow label="Prix de Vente HT" value={formatMoney(prixHT)} />
                    <InfoRow label="Taux TVA" value={`${product.tauxTVA}% ${product.isExonere ? '(Exonere)' : ''}`} />
                    <InfoRow label="Prix d'Achat" value={formatMoney(product.prixAchat)} />
                    <InfoRow label="Marge brute" value={`${formatMoney(product.prixVente - product.prixAchat)} (${marge}%)`} />
                    {product.prixVenteGros && (
                      <InfoRow label="Prix de Gros" value={formatMoney(product.prixVenteGros)} />
                    )}
                    {product.prixVenteSpecial && (
                      <InfoRow label="Prix Special" value={formatMoney(product.prixVenteSpecial)} />
                    )}

                    {product.description && (
                      <>
                        <h6 className="text-uppercase text-muted fw-semibold mb-3 mt-4" style={{ fontSize: 11, letterSpacing: 1 }}>
                          Description
                        </h6>
                        <p className="text-muted" style={{ fontSize: 14, lineHeight: 1.6 }}>
                          {product.description}
                        </p>
                      </>
                    )}
                  </Col>
                </Row>

                <Row className="g-3 mt-1">
                  <Col md={12}>
                    <h6 className="text-uppercase text-muted fw-semibold mb-3" style={{ fontSize: 11, letterSpacing: 1 }}>
                      Informations systeme
                    </h6>
                    <Row>
                      <Col md={4}>
                        <InfoRow label="Cree le" value={formatDate(product.createdAt)} />
                      </Col>
                      <Col md={4}>
                        <InfoRow label="Modifie le" value={formatDate(product.updatedAt)} />
                      </Col>
                      <Col md={4}>
                        <InfoRow label="Stockable" value={
                          product.isStockable
                            ? <span className="text-success d-flex align-items-center gap-1"><FiCheckCircle size={14} /> Oui</span>
                            : <span className="text-secondary d-flex align-items-center gap-1"><FiXCircle size={14} /> Non</span>
                        } />
                      </Col>
                    </Row>
                  </Col>
                </Row>
              </Tab.Pane>

              {/* ── Onglet Stock ─────────────────────────────────────── */}
              {!isService && (
                <Tab.Pane eventKey="stock">
                  {/* Alertes */}
                  {isEnRupture && (
                    <Alert variant="danger" className="d-flex align-items-center gap-2 mb-4">
                      <FiXCircle size={18} />
                      <span>
                        <strong>Rupture de stock.</strong> Ce produit n'a plus aucune unite disponible.
                      </span>
                    </Alert>
                  )}
                  {!isEnRupture && isEnAlerte && (
                    <Alert variant="warning" className="d-flex align-items-center gap-2 mb-4">
                      <FiAlertTriangle size={18} />
                      <span>
                        <strong>Alerte stock.</strong> Le stock est en dessous du seuil d'alerte ({product.stockAlerte} unites).
                      </span>
                    </Alert>
                  )}
                  {!isEnRupture && !isEnAlerte && (
                    <Alert variant="success" className="d-flex align-items-center gap-2 mb-4">
                      <FiCheckCircle size={18} />
                      <span>Stock suffisant.</span>
                    </Alert>
                  )}

                  {/* KPIs */}
                  <Row className="g-3 mb-4">
                    <Col xs={6} md={3}>
                      <StockKpi
                        label="Stock Total"
                        value={stockTotal}
                        unit={product.unite || 'unites'}
                        color={isEnRupture ? '#ef4444' : '#22c55e'}
                      />
                    </Col>
                    <Col xs={6} md={3}>
                      <StockKpi label="Disponible" value={stockDisponible} unit={product.unite || 'unites'} color="#3b82f6" />
                    </Col>
                    <Col xs={6} md={3}>
                      <StockKpi label="Reserve" value={stockReserve} unit={product.unite || 'unites'} color="#f59e0b" />
                    </Col>
                    <Col xs={6} md={3}>
                      <StockKpi label="Valeur stock" value={formatMoney(stockValue)} color="#6366f1" />
                    </Col>
                  </Row>

                  {/* Barre de niveau */}
                  {product.stockMaximum > 0 && (
                    <Card className="border-0 bg-light mb-4" style={{ borderRadius: 10 }}>
                      <Card.Body>
                        <div className="d-flex justify-content-between mb-2">
                          <span className="text-muted small">Niveau de stock</span>
                          <span className="fw-semibold small">
                            {stockTotal} / {product.stockMaximum} {product.unite || 'unites'}
                          </span>
                        </div>
                        <ProgressBar
                          now={stockPct}
                          variant={stockBarVariant}
                          style={{ height: 10, borderRadius: 6 }}
                        />
                        <div className="d-flex justify-content-between mt-2">
                          <small className="text-muted">
                            Minimum: {product.stockMinimum ?? 0}
                          </small>
                          <small className="text-muted">
                            Alerte: {product.stockAlerte ?? 0}
                          </small>
                          <small className="text-muted">
                            Maximum: {product.stockMaximum}
                          </small>
                        </div>
                      </Card.Body>
                    </Card>
                  )}

                  {/* Entrepots */}
                  {stocks.length > 0 ? (
                    <>
                      <h6 className="text-muted fw-semibold mb-3" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Repartition par entrepot
                      </h6>
                      <div className="table-responsive">
                        <Table bordered hover className="mb-0" style={{ fontSize: 14 }}>
                          <thead className="table-light">
                            <tr>
                              <th>Entrepot</th>
                              <th className="text-end">Quantite</th>
                              <th className="text-end">Reserve</th>
                              <th className="text-end">Disponible</th>
                              <th className="text-end">Valeur</th>
                            </tr>
                          </thead>
                          <tbody>
                            {stocks.map((s) => (
                              <tr key={s._id}>
                                <td>
                                  <div className="fw-semibold">{s.warehouse?.name ?? '—'}</div>
                                  <small className="text-muted">{s.warehouse?.code}</small>
                                </td>
                                <td className="text-end">{s.quantite}</td>
                                <td className="text-end text-warning">{s.quantiteReservee}</td>
                                <td className="text-end text-success fw-semibold">
                                  {Math.max(0, s.quantite - s.quantiteReservee)}
                                </td>
                                <td className="text-end">{formatMoney(s.valeurStock)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </div>
                    </>
                  ) : (
                    <p className="text-muted fst-italic">Aucun depot configure pour ce produit.</p>
                  )}
                </Tab.Pane>
              )}

              {/* ── Onglet Ventes ────────────────────────────────────── */}
              <Tab.Pane eventKey="ventes">
                <div className="text-center py-5">
                  <FiShoppingCart size={40} className="text-muted mb-3" />
                  <p className="text-muted">
                    L'historique des ventes de ce produit sera affiche ici.
                  </p>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={() => navigate('/ventes/factures')}
                  >
                    Voir les factures
                  </Button>
                </div>
              </Tab.Pane>

            </Tab.Content>
          </Card.Body>
        </Card>
      </Tab.Container>
    </>
  );
};

export default ProductDetailPage;
