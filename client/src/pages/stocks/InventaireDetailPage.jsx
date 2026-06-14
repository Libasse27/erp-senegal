import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Table from 'react-bootstrap/Table';
import Button from 'react-bootstrap/Button';
import Badge from 'react-bootstrap/Badge';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import InputGroup from 'react-bootstrap/InputGroup';
import ProgressBar from 'react-bootstrap/ProgressBar';
import {
  FiArrowLeft,
  FiPlay,
  FiCheck,
  FiX,
  FiTrash2,
  FiSearch,
  FiAlertTriangle,
  FiSave,
  FiPackage,
  FiTrendingUp,
  FiTrendingDown,
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import usePageTitle from '../../hooks/usePageTitle';
import { formatMoney, formatDate } from '../../utils/formatters';
import {
  useGetInventaireQuery,
  useUpdateInventaireLignesMutation,
  useDemarrerInventaireMutation,
  useValiderInventaireMutation,
  useAnnulerInventaireMutation,
  useDeleteInventaireMutation,
} from '../../redux/api/inventairesApi';
import { useAuth } from '../../contexts/AuthContext';
import { PERM } from '../../config/permissions';

const STATUT_CONFIG = {
  brouillon: { label: 'Brouillon',  variant: 'secondary' },
  en_cours:  { label: 'En cours',   variant: 'warning' },
  valide:    { label: 'Validé',     variant: 'success' },
  annule:    { label: 'Annulé',     variant: 'danger' },
};

const EcartBadge = ({ ecart }) => {
  if (ecart === null || ecart === undefined) return <span className="text-muted small">—</span>;
  if (ecart === 0) return <Badge bg="success">0</Badge>;
  if (ecart > 0) return <Badge bg="primary">+{ecart}</Badge>;
  return <Badge bg="danger">{ecart}</Badge>;
};

const InventaireDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const canEdit = hasPermission(PERM.STOCKS_UPDATE);

  usePageTitle('Inventaire physique', [
    { label: 'Accueil', path: '/' },
    { label: 'Stocks', path: '/stocks' },
    { label: 'Inventaires', path: '/stocks/inventaires' },
    { label: 'Saisie' },
  ]);

  const { data, isLoading, error, refetch } = useGetInventaireQuery(id);
  const [updateLignes, { isLoading: saving }] = useUpdateInventaireLignesMutation();
  const [demarrer, { isLoading: starting }] = useDemarrerInventaireMutation();
  const [valider, { isLoading: validating }] = useValiderInventaireMutation();
  const [annuler, { isLoading: cancelling }] = useAnnulerInventaireMutation();
  const [supprimer, { isLoading: deleting }] = useDeleteInventaireMutation();

  const [localCounts, setLocalCounts] = useState({});
  const [search, setSearch] = useState('');
  const [showOnlyEcart, setShowOnlyEcart] = useState(false);
  const [showValidateModal, setShowValidateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAnnulerModal, setShowAnnulerModal] = useState(false);
  const [isSavingLocal, setIsSavingLocal] = useState(false);

  const inv = data?.data;

  useEffect(() => {
    if (inv?.lignes) {
      const init = {};
      inv.lignes.forEach((l) => {
        init[l._id] = l.quantiteComptee !== null && l.quantiteComptee !== undefined
          ? String(l.quantiteComptee)
          : '';
      });
      setLocalCounts(init);
    }
  }, [inv]);

  const handleCountChange = (ligneId, value) => {
    setLocalCounts((prev) => ({ ...prev, [ligneId]: value }));
  };

  const handleSave = useCallback(async () => {
    if (!inv) return;
    setIsSavingLocal(true);
    try {
      const lignes = Object.entries(localCounts)
        .filter(([, v]) => v !== '')
        .map(([ligneId, v]) => ({ ligneId, quantiteComptee: Number(v) }));
      await updateLignes({ id, lignes }).unwrap();
      toast.success('Saisie enregistrée');
    } catch (err) {
      toast.error(err.data?.message || 'Erreur de sauvegarde');
    } finally {
      setIsSavingLocal(false);
    }
  }, [id, localCounts, inv, updateLignes]);

  const handleDemarrer = async () => {
    try {
      await demarrer(id).unwrap();
      toast.success('Inventaire démarré');
    } catch (err) {
      toast.error(err.data?.message || 'Erreur');
    }
  };

  const handleValider = async () => {
    try {
      await handleSave();
      const res = await valider(id).unwrap();
      toast.success(res.message || 'Inventaire validé');
      setShowValidateModal(false);
    } catch (err) {
      toast.error(err.data?.message || 'Erreur lors de la validation');
    }
  };

  const handleAnnuler = async () => {
    try {
      await annuler(id).unwrap();
      toast.success('Inventaire annulé');
      setShowAnnulerModal(false);
    } catch (err) {
      toast.error(err.data?.message || 'Erreur');
    }
  };

  const handleDelete = async () => {
    try {
      await supprimer(id).unwrap();
      navigate('/stocks/inventaires');
    } catch (err) {
      toast.error(err.data?.message || 'Erreur');
    }
  };

  if (isLoading) return (
    <div className="text-center py-5">
      <Spinner animation="border" variant="primary" />
    </div>
  );

  if (error) return (
    <Alert variant="danger">
      <FiAlertTriangle className="me-2" />
      {error.data?.message || 'Erreur de chargement'}
      <Button variant="link" size="sm" onClick={refetch}>Réessayer</Button>
    </Alert>
  );

  if (!inv) return null;

  const cfg = STATUT_CONFIG[inv.statut] || { label: inv.statut, variant: 'secondary' };
  const isEditable = ['brouillon', 'en_cours'].includes(inv.statut) && canEdit;
  const lignes = inv.lignes || [];

  // Live computation from localCounts
  const lignesWithCalc = lignes.map((l) => {
    const rawCount = localCounts[l._id];
    const comptee = rawCount !== '' && rawCount !== undefined ? Number(rawCount) : (l.quantiteComptee ?? null);
    const ecart = comptee !== null ? comptee - l.quantiteTheorique : null;
    return { ...l, liveComptee: comptee, liveEcart: ecart };
  });

  const filtered = lignesWithCalc.filter((l) => {
    const searchLc = search.toLowerCase();
    const matchSearch = !search ||
      l.productSnapshot?.name?.toLowerCase().includes(searchLc) ||
      l.productSnapshot?.code?.toLowerCase().includes(searchLc) ||
      l.warehouseName?.toLowerCase().includes(searchLc);
    const matchEcart = !showOnlyEcart || (l.liveEcart !== null && l.liveEcart !== 0);
    return matchSearch && matchEcart;
  });

  const totalComptees = lignesWithCalc.filter((l) => l.liveComptee !== null).length;
  const pctProgression = lignes.length > 0 ? Math.round((totalComptees / lignes.length) * 100) : 0;
  const ecartPositifs = lignesWithCalc.filter((l) => l.liveEcart !== null && l.liveEcart > 0);
  const ecartNegatifs = lignesWithCalc.filter((l) => l.liveEcart !== null && l.liveEcart < 0);
  const valeurPos = ecartPositifs.reduce((s, l) => s + Math.round(l.liveEcart * (l.cump || 0)), 0);
  const valeurNeg = ecartNegatifs.reduce((s, l) => s + Math.round(Math.abs(l.liveEcart) * (l.cump || 0)), 0);

  return (
    <>
      <div className="page-header">
        <div className="d-flex align-items-center gap-3">
          <Button variant="outline-secondary" size="sm" onClick={() => navigate('/stocks/inventaires')}>
            <FiArrowLeft />
          </Button>
          <div>
            <div className="d-flex align-items-center gap-2">
              <FiPackage size={18} className="text-primary" />
              <h1 className="mb-0">{inv.reference}</h1>
              <Badge bg={cfg.variant}>{cfg.label}</Badge>
            </div>
            <small className="text-muted">
              {formatDate(inv.dateInventaire)}
              {inv.warehouse?.name ? ` — ${inv.warehouse.name}` : ' — Tous dépôts'}
            </small>
          </div>
        </div>
        <div className="d-flex gap-2">
          {isEditable && inv.statut === 'en_cours' && (
            <Button variant="outline-primary" size="sm" onClick={handleSave} disabled={saving || isSavingLocal}>
              {saving || isSavingLocal ? <Spinner animation="border" size="sm" className="me-1" /> : <FiSave className="me-1" />}
              Sauvegarder
            </Button>
          )}
          {canEdit && inv.statut === 'brouillon' && (
            <Button variant="warning" size="sm" onClick={handleDemarrer} disabled={starting}>
              {starting ? <Spinner animation="border" size="sm" className="me-1" /> : <FiPlay className="me-1" />}
              Démarrer la saisie
            </Button>
          )}
          {canEdit && inv.statut === 'en_cours' && (
            <Button variant="success" size="sm" onClick={() => setShowValidateModal(true)}>
              <FiCheck className="me-1" /> Valider l'inventaire
            </Button>
          )}
          {canEdit && ['brouillon', 'en_cours'].includes(inv.statut) && (
            <Button variant="outline-warning" size="sm" onClick={() => setShowAnnulerModal(true)}>
              <FiX className="me-1" /> Annuler
            </Button>
          )}
          {canEdit && inv.statut === 'brouillon' && (
            <Button variant="outline-danger" size="sm" onClick={() => setShowDeleteModal(true)}>
              <FiTrash2 />
            </Button>
          )}
        </div>
      </div>

      {inv.description && (
        <Alert variant="light" className="border mb-3 small">{inv.description}</Alert>
      )}

      {/* KPIs progression */}
      <Row className="g-3 mb-3">
        <Col sm={6} lg={3}>
          <Card className="shadow-sm border-0 text-center py-3">
            <div className="fs-3 fw-bold text-primary">{lignes.length}</div>
            <div className="text-muted small">Articles à inventorier</div>
          </Card>
        </Col>
        <Col sm={6} lg={3}>
          <Card className="shadow-sm border-0 text-center py-3">
            <div className="fs-3 fw-bold text-success">{totalComptees}</div>
            <div className="text-muted small">Comptés ({pctProgression}%)</div>
            <ProgressBar now={pctProgression} variant={pctProgression >= 100 ? 'success' : 'primary'} style={{ height: 4, margin: '6px 16px 0' }} />
          </Card>
        </Col>
        <Col sm={6} lg={3}>
          <Card className="shadow-sm border-0 text-center py-3">
            <div className="d-flex justify-content-center gap-3">
              <div>
                <div className="fs-5 fw-bold text-success">+{ecartPositifs.length}</div>
                <div className="text-muted" style={{ fontSize: '0.7rem' }}>{formatMoney(valeurPos)}</div>
              </div>
              <div className="border-start" />
              <div>
                <div className="fs-5 fw-bold text-danger">-{ecartNegatifs.length}</div>
                <div className="text-muted" style={{ fontSize: '0.7rem' }}>{formatMoney(valeurNeg)}</div>
              </div>
            </div>
            <div className="text-muted small mt-1">Écarts +/−</div>
          </Card>
        </Col>
        <Col sm={6} lg={3}>
          <Card className={`shadow-sm border-0 text-center py-3 ${inv.statut === 'valide' ? 'border border-success' : ''}`}>
            <div className="fs-3 fw-bold">{ecartPositifs.length + ecartNegatifs.length}</div>
            <div className="text-muted small">Lignes avec écart</div>
          </Card>
        </Col>
      </Row>

      {/* Résumé validation */}
      {inv.statut === 'valide' && (
        <Alert variant="success" className="d-flex align-items-center gap-2 mb-3">
          <FiCheck size={20} className="flex-shrink-0" />
          <div>
            Inventaire validé le <strong>{formatDate(inv.validatedAt)}</strong> —{' '}
            <strong>{inv.nbLignesAvecEcart}</strong> ajustement(s) de stock effectués.
            Surplus : <span className="text-success fw-semibold">+{formatMoney(inv.totalEcartPositif)}</span> ·
            Manquant : <span className="text-danger fw-semibold">−{formatMoney(inv.totalEcartNegatif)}</span>
          </div>
        </Alert>
      )}

      {/* Filtres table */}
      <Card className="shadow-sm mb-2">
        <Card.Body className="py-2">
          <Row className="g-2 align-items-center">
            <Col md={5}>
              <InputGroup size="sm">
                <InputGroup.Text><FiSearch /></InputGroup.Text>
                <Form.Control
                  placeholder="Rechercher un article..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </InputGroup>
            </Col>
            <Col md="auto">
              <Form.Check
                type="switch"
                label="Seulement les écarts"
                checked={showOnlyEcart}
                onChange={(e) => setShowOnlyEcart(e.target.checked)}
              />
            </Col>
            <Col className="text-end">
              <small className="text-muted">{filtered.length} / {lignes.length} article(s)</small>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Table saisie */}
      <Card className="shadow-sm">
        <Card.Body className="p-0">
          {filtered.length === 0 ? (
            <div className="text-center py-4 text-muted small">Aucun article</div>
          ) : (
            <div className="table-responsive">
              <Table hover className="mb-0" style={{ fontSize: '0.875rem' }}>
                <thead className="table-light">
                  <tr>
                    <th>Article</th>
                    <th>Code</th>
                    <th>Dépôt</th>
                    <th className="text-end">Qté théorique</th>
                    <th className="text-center" style={{ minWidth: 120 }}>
                      Qté comptée
                      {isEditable && <span className="text-primary fw-normal ms-1">(saisir)</span>}
                    </th>
                    <th className="text-center">Écart</th>
                    <th className="text-end">CUMP</th>
                    <th className="text-end">Valeur écart</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((ligne) => {
                    const hasEcart = ligne.liveEcart !== null && ligne.liveEcart !== 0;
                    const valEcart = ligne.liveEcart !== null
                      ? Math.round(ligne.liveEcart * (ligne.cump || 0))
                      : null;
                    return (
                      <tr
                        key={ligne._id}
                        className={hasEcart ? (ligne.liveEcart > 0 ? 'table-primary' : 'table-danger') : ''}
                      >
                        <td className="fw-medium">{ligne.productSnapshot?.name || '—'}</td>
                        <td className="text-muted small">{ligne.productSnapshot?.code || '—'}</td>
                        <td className="text-muted small">{ligne.warehouseName || '—'}</td>
                        <td className="text-end fw-semibold">{ligne.quantiteTheorique}</td>
                        <td className="text-center">
                          {isEditable ? (
                            <Form.Control
                              type="number"
                              size="sm"
                              min="0"
                              step="0.01"
                              style={{ width: 100, display: 'inline-block', textAlign: 'center' }}
                              value={localCounts[ligne._id] ?? ''}
                              placeholder="—"
                              onChange={(e) => handleCountChange(ligne._id, e.target.value)}
                            />
                          ) : (
                            <span className={ligne.liveComptee !== null ? 'fw-semibold' : 'text-muted'}>
                              {ligne.liveComptee !== null ? ligne.liveComptee : '—'}
                            </span>
                          )}
                          <small className="text-muted ms-1">{ligne.productSnapshot?.unite}</small>
                        </td>
                        <td className="text-center">
                          <EcartBadge ecart={ligne.liveEcart} />
                        </td>
                        <td className="text-end small text-muted">{formatMoney(ligne.cump)}</td>
                        <td className="text-end small">
                          {valEcart !== null ? (
                            <span className={valEcart > 0 ? 'text-success fw-semibold' : valEcart < 0 ? 'text-danger fw-semibold' : 'text-muted'}>
                              {valEcart > 0 ? '+' : ''}{formatMoney(valEcart)}
                            </span>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
        {isEditable && inv.statut === 'en_cours' && (
          <Card.Footer className="d-flex justify-content-between align-items-center">
            <small className="text-muted">
              {totalComptees}/{lignes.length} articles comptés — {pctProgression}% de progression
            </small>
            <Button variant="primary" size="sm" onClick={handleSave} disabled={saving || isSavingLocal}>
              {saving || isSavingLocal ? <Spinner animation="border" size="sm" className="me-1" /> : <FiSave className="me-1" />}
              Sauvegarder la saisie
            </Button>
          </Card.Footer>
        )}
      </Card>

      {/* Légende */}
      {isEditable && (
        <div className="d-flex gap-3 mt-2 flex-wrap">
          <small className="text-muted d-flex align-items-center gap-1">
            <FiTrendingUp size={12} className="text-primary" /> Ligne bleue = surplus (quantité comptée supérieure)
          </small>
          <small className="text-muted d-flex align-items-center gap-1">
            <FiTrendingDown size={12} className="text-danger" /> Ligne rouge = manquant (quantité comptée inférieure)
          </small>
        </div>
      )}

      {/* Modal validation */}
      <Modal show={showValidateModal} onHide={() => setShowValidateModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Valider l'inventaire</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="warning" className="small">
            <strong>Attention :</strong> La validation va ajuster le stock réel de tous les articles
            ayant un écart. Cette action est <strong>irréversible</strong>.
          </Alert>
          <p>
            Articles comptés : <strong>{totalComptees}/{lignes.length}</strong><br />
            Articles avec écart : <strong>{ecartPositifs.length + ecartNegatifs.length}</strong><br />
            Surplus : <span className="text-success fw-semibold">+{formatMoney(valeurPos)}</span><br />
            Manquant : <span className="text-danger fw-semibold">−{formatMoney(valeurNeg)}</span>
          </p>
          {totalComptees < lignes.length && (
            <Alert variant="info" className="small">
              {lignes.length - totalComptees} article(s) n'ont pas été comptés et ne seront pas ajustés.
            </Alert>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowValidateModal(false)}>Annuler</Button>
          <Button variant="success" onClick={handleValider} disabled={validating || saving}>
            {validating ? <Spinner animation="border" size="sm" className="me-1" /> : <FiCheck className="me-1" />}
            Confirmer et ajuster le stock
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal annuler */}
      <Modal show={showAnnulerModal} onHide={() => setShowAnnulerModal(false)}>
        <Modal.Header closeButton><Modal.Title>Annuler l'inventaire</Modal.Title></Modal.Header>
        <Modal.Body>Annuler l'inventaire <strong>{inv.reference}</strong> ? La saisie sera perdue, aucun stock ne sera modifié.</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAnnulerModal(false)}>Retour</Button>
          <Button variant="warning" onClick={handleAnnuler} disabled={cancelling}>
            {cancelling ? <Spinner animation="border" size="sm" className="me-1" /> : null}
            Annuler l'inventaire
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal suppression */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton><Modal.Title>Supprimer l'inventaire</Modal.Title></Modal.Header>
        <Modal.Body>Supprimer définitivement l'inventaire <strong>{inv.reference}</strong> ?</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Annuler</Button>
          <Button variant="danger" onClick={handleDelete} disabled={deleting}>
            {deleting ? <Spinner animation="border" size="sm" className="me-1" /> : null}
            Supprimer
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default InventaireDetailPage;
