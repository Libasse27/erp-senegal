import React, { useState, useMemo } from 'react';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import Table from 'react-bootstrap/Table';
import Badge from 'react-bootstrap/Badge';
import Modal from 'react-bootstrap/Modal';
import ProgressBar from 'react-bootstrap/ProgressBar';
import { Link } from 'react-router-dom';
import {
  FiPlus, FiTrendingUp, FiTrendingDown, FiTarget, FiEdit2, FiTrash2, FiBarChart2,
} from 'react-icons/fi';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { toast } from 'react-toastify';
import usePageTitle from '../../hooks/usePageTitle';
import { formatMoney } from '../../utils/formatters';
import {
  useGetBudgetsQuery,
  useGetBudgetComparaisonQuery,
  useDeleteBudgetMutation,
} from '../../redux/api/budgetsApi';

const MOIS_LABELS = ['', 'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
const TYPE_COLORS = { produits: '#059669', charges: '#ef4444' };
const TYPE_LABELS = { produits: 'Produits / Revenus', charges: 'Charges / Dépenses' };

const TauxBadge = ({ taux }) => {
  if (taux === null || taux === undefined) return <span className="text-muted small">—</span>;
  const variant = taux >= 90 ? 'success' : taux >= 60 ? 'warning' : 'danger';
  return <Badge bg={variant}>{taux}%</Badge>;
};

const BudgetsPage = () => {
  usePageTitle('Budget & Prévisions', [
    { label: 'Accueil', path: '/' },
    { label: 'Budget & Prévisions' },
  ]);

  const currentYear = new Date().getFullYear();
  const [annee, setAnnee]     = useState(currentYear);
  const [mois,  setMois]      = useState('');
  const [params, setParams]   = useState({ annee: currentYear });
  const [view, setView]       = useState('comparaison'); // 'comparaison' | 'liste'
  const [toDelete, setToDelete] = useState(null);

  const { data: compData, isLoading: loadingComp } = useGetBudgetComparaisonQuery(params);
  const { data: listData, isLoading: loadingList } = useGetBudgetsQuery({ annee: params.annee, ...(params.mois ? { mois: params.mois } : {}) });
  const [deleteBudget, { isLoading: deleting }] = useDeleteBudgetMutation();

  const comparaison = useMemo(() => compData?.data || null, [compData]);
  const budgets     = useMemo(() => listData?.data || [], [listData]);

  const handleApply = () => setParams({ annee, ...(mois ? { mois } : {}) });

  const handleDelete = async () => {
    try {
      await deleteBudget(toDelete._id).unwrap();
      toast.success('Budget supprimé');
      setToDelete(null);
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };

  const kpis = comparaison?.kpis || {};

  const chartData = [
    { name: 'Produits', prévu: kpis.totalPrevuProduits || 0, réalisé: kpis.totalRealiseProduits || 0 },
    { name: 'Charges',  prévu: kpis.totalPrevuCharges  || 0, réalisé: kpis.totalRealiseCharges  || 0 },
    { name: 'Résultat', prévu: kpis.resultatPrevu       || 0, réalisé: kpis.resultatRealise      || 0 },
  ];

  const periodeLabel = mois ? `${MOIS_LABELS[Number(mois)]} ${annee}` : `Exercice ${annee}`;

  return (
    <>
      <div className="page-header mb-4">
        <div className="d-flex align-items-center justify-content-between">
          <div>
            <h1 className="mb-0">Budget & Prévisions</h1>
            <small className="text-muted">Planification budgétaire et suivi du réalisé</small>
          </div>
          <Link to="/budgets/nouveau" className="btn btn-primary">
            <FiPlus className="me-1" /> Nouveau budget
          </Link>
        </div>
      </div>

      {/* Filtres */}
      <Card className="shadow-sm mb-4">
        <Card.Body>
          <Row className="g-2 align-items-end">
            <Col md={2}>
              <Form.Label className="small fw-semibold">Année</Form.Label>
              <Form.Control type="number" value={annee} min={2020} max={2035} onChange={(e) => setAnnee(Number(e.target.value))} />
            </Col>
            <Col md={2}>
              <Form.Label className="small fw-semibold">Mois (optionnel)</Form.Label>
              <Form.Select value={mois} onChange={(e) => setMois(e.target.value)}>
                <option value="">Annuel</option>
                {MOIS_LABELS.slice(1).map((m, i) => (
                  <option key={i + 1} value={i + 1}>{m}</option>
                ))}
              </Form.Select>
            </Col>
            <Col md="auto">
              <Button variant="primary" onClick={handleApply}>Appliquer</Button>
            </Col>
            <Col md="auto" className="ms-auto">
              <div className="btn-group">
                <Button variant={view === 'comparaison' ? 'primary' : 'outline-secondary'} size="sm" onClick={() => setView('comparaison')}>
                  <FiBarChart2 className="me-1" />Comparaison
                </Button>
                <Button variant={view === 'liste' ? 'primary' : 'outline-secondary'} size="sm" onClick={() => setView('liste')}>
                  Lignes budgétaires
                </Button>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* VUE COMPARAISON */}
      {view === 'comparaison' && (
        <>
          {loadingComp && <div className="d-flex justify-content-center py-5"><Spinner animation="border" /></div>}
          {!loadingComp && comparaison && (
            <>
              {/* KPIs */}
              <Row className="g-3 mb-4">
                {[
                  { label: 'Produits prévus',    val: kpis.totalPrevuProduits,    color: '#059669', icon: FiTrendingUp },
                  { label: 'Produits réalisés',  val: kpis.totalRealiseProduits,  color: '#10b981', icon: FiTrendingUp },
                  { label: 'Charges prévues',    val: kpis.totalPrevuCharges,     color: '#f59e0b', icon: FiTrendingDown },
                  { label: 'Charges réalisées',  val: kpis.totalRealiseCharges,   color: '#ef4444', icon: FiTrendingDown },
                ].map((k) => (
                  <Col key={k.label} sm={6} xl={3}>
                    <Card className="shadow-sm h-100">
                      <Card.Body className="d-flex align-items-center gap-3">
                        <div className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                          style={{ width: 44, height: 44, backgroundColor: `${k.color}20`, color: k.color }}>
                          <k.icon size={20} />
                        </div>
                        <div>
                          <div className="text-muted small">{k.label}</div>
                          <div className="fw-bold fs-6" style={{ color: k.color }}>{formatMoney(k.val)}</div>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>

              {/* Résultat net */}
              <Row className="g-3 mb-4">
                <Col md={6}>
                  <Card className="shadow-sm" style={{ borderLeft: `4px solid ${kpis.resultatPrevu >= 0 ? '#059669' : '#ef4444'}` }}>
                    <Card.Body className="d-flex justify-content-between align-items-center">
                      <div>
                        <div className="text-muted small">Résultat prévu — {periodeLabel}</div>
                        <div className={`fw-bold fs-5 ${kpis.resultatPrevu >= 0 ? 'text-success' : 'text-danger'}`}>
                          {formatMoney(kpis.resultatPrevu)}
                        </div>
                      </div>
                      <FiTarget size={32} className="text-muted opacity-50" />
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6}>
                  <Card className="shadow-sm" style={{ borderLeft: `4px solid ${kpis.resultatRealise >= 0 ? '#059669' : '#ef4444'}` }}>
                    <Card.Body className="d-flex justify-content-between align-items-center">
                      <div>
                        <div className="text-muted small">Résultat réalisé — {periodeLabel}</div>
                        <div className={`fw-bold fs-5 ${kpis.resultatRealise >= 0 ? 'text-success' : 'text-danger'}`}>
                          {formatMoney(kpis.resultatRealise)}
                        </div>
                      </div>
                      <FiBarChart2 size={32} className="text-muted opacity-50" />
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              {/* Taux de réalisation */}
              <Row className="g-3 mb-4">
                <Col md={6}>
                  <Card className="shadow-sm">
                    <Card.Header><strong>Taux de réalisation — Produits</strong></Card.Header>
                    <Card.Body>
                      {kpis.tauxRealisationProduits !== null ? (
                        <>
                          <div className="d-flex justify-content-between small mb-1">
                            <span>Réalisé</span>
                            <span className="fw-bold">{kpis.tauxRealisationProduits}%</span>
                          </div>
                          <ProgressBar
                            now={Math.min(kpis.tauxRealisationProduits, 100)}
                            variant={kpis.tauxRealisationProduits >= 90 ? 'success' : kpis.tauxRealisationProduits >= 60 ? 'warning' : 'danger'}
                            style={{ height: 20 }}
                            label={`${kpis.tauxRealisationProduits}%`}
                          />
                        </>
                      ) : <p className="text-muted small mb-0">Aucun budget produits défini</p>}
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6}>
                  <Card className="shadow-sm">
                    <Card.Header><strong>Taux de réalisation — Charges</strong></Card.Header>
                    <Card.Body>
                      {kpis.tauxRealisationCharges !== null ? (
                        <>
                          <div className="d-flex justify-content-between small mb-1">
                            <span>Consommé</span>
                            <span className="fw-bold">{kpis.tauxRealisationCharges}%</span>
                          </div>
                          <ProgressBar
                            now={Math.min(kpis.tauxRealisationCharges, 100)}
                            variant={kpis.tauxRealisationCharges <= 90 ? 'success' : kpis.tauxRealisationCharges <= 110 ? 'warning' : 'danger'}
                            style={{ height: 20 }}
                            label={`${kpis.tauxRealisationCharges}%`}
                          />
                        </>
                      ) : <p className="text-muted small mb-0">Aucun budget charges défini</p>}
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              {/* Graphique Prévu vs Réalisé */}
              <Card className="shadow-sm mb-4">
                <Card.Header><strong>Prévu vs Réalisé — {periodeLabel}</strong></Card.Header>
                <Card.Body>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 13 }} />
                      <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 12 }} />
                      <Tooltip formatter={(v) => formatMoney(v)} />
                      <Legend />
                      <Bar dataKey="prévu"   name="Prévu"   fill="#94a3b8" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="réalisé" name="Réalisé" fill="#1a56db" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Card.Body>
              </Card>

              {/* Tableau détail par catégorie */}
              {comparaison.parCategorie.length > 0 && (
                <Card className="shadow-sm">
                  <Card.Header><strong>Détail par catégorie</strong></Card.Header>
                  <Card.Body className="p-0">
                    <Table hover size="sm" className="mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>Type</th>
                          <th>Catégorie</th>
                          <th className="text-end">Prévu</th>
                          <th className="text-end">Réalisé</th>
                          <th className="text-end">Écart</th>
                          <th className="text-center">Taux</th>
                        </tr>
                      </thead>
                      <tbody>
                        {comparaison.parCategorie.map((c, i) => (
                          <tr key={i}>
                            <td>
                              <Badge bg="light" text="dark" style={{ color: TYPE_COLORS[c.type] }}>
                                {TYPE_LABELS[c.type]}
                              </Badge>
                            </td>
                            <td className="fw-medium small">{c.categorie}</td>
                            <td className="text-end small">{formatMoney(c.prevu)}</td>
                            <td className="text-end small">{c.realise !== null ? formatMoney(c.realise) : <span className="text-muted">—</span>}</td>
                            <td className={`text-end small fw-semibold ${c.ecart > 0 ? 'text-success' : c.ecart < 0 ? 'text-danger' : ''}`}>
                              {c.realise !== null ? formatMoney(Math.abs(c.ecart)) : '—'}
                            </td>
                            <td className="text-center"><TauxBadge taux={c.tauxRealisation} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </Card.Body>
                </Card>
              )}

              {comparaison.parCategorie.length === 0 && (
                <Alert variant="info" className="text-center">
                  Aucun budget défini pour cette période.{' '}
                  <Link to="/budgets/nouveau">Créer le premier budget →</Link>
                </Alert>
              )}
            </>
          )}
        </>
      )}

      {/* VUE LISTE */}
      {view === 'liste' && (
        <>
          {loadingList && <div className="d-flex justify-content-center py-5"><Spinner animation="border" /></div>}
          {!loadingList && (
            <Card className="shadow-sm">
              <Card.Header className="d-flex justify-content-between align-items-center">
                <strong>{budgets.length} ligne(s) budgétaire(s)</strong>
                <Link to="/budgets/nouveau" className="btn btn-sm btn-primary">
                  <FiPlus className="me-1" size={14} />Ajouter
                </Link>
              </Card.Header>
              <Card.Body className="p-0">
                {budgets.length === 0 ? (
                  <p className="text-muted text-center py-4">Aucun budget sur cet exercice.</p>
                ) : (
                  <Table hover size="sm" className="mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Type</th>
                        <th>Catégorie</th>
                        <th>Libellé</th>
                        <th>Période</th>
                        <th className="text-end">Montant prévu</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {budgets.map((b) => (
                        <tr key={b._id}>
                          <td>
                            <Badge bg={b.type === 'produits' ? 'success' : 'danger'}>
                              {b.type === 'produits' ? 'Produits' : 'Charges'}
                            </Badge>
                          </td>
                          <td className="small text-muted">{b.categorie}</td>
                          <td className="fw-medium small">{b.libelle}</td>
                          <td className="small">{b.mois ? `${MOIS_LABELS[b.mois]} ${b.annee}` : `Annuel ${b.annee}`}</td>
                          <td className="text-end fw-semibold small">{formatMoney(b.montantPrevu)}</td>
                          <td className="text-end">
                            <div className="d-flex gap-1 justify-content-end">
                              <Link to={`/budgets/${b._id}/modifier`} className="btn btn-link btn-sm p-0 text-primary">
                                <FiEdit2 size={14} />
                              </Link>
                              <Button variant="link" size="sm" className="p-0 text-danger" onClick={() => setToDelete(b)}>
                                <FiTrash2 size={14} />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                )}
              </Card.Body>
            </Card>
          )}
        </>
      )}

      {/* Modale suppression */}
      <Modal show={!!toDelete} onHide={() => setToDelete(null)} centered size="sm">
        <Modal.Header closeButton>
          <Modal.Title>Supprimer le budget</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Supprimer <strong>{toDelete?.libelle}</strong> ?</p>
          <p className="text-muted small mb-0">Cette action est irréversible.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" size="sm" onClick={() => setToDelete(null)}>Annuler</Button>
          <Button variant="danger" size="sm" onClick={handleDelete} disabled={deleting}>
            {deleting ? <Spinner size="sm" animation="border" /> : 'Supprimer'}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default BudgetsPage;
