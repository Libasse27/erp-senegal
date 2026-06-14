import React, { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Table from 'react-bootstrap/Table';
import Button from 'react-bootstrap/Button';
import Badge from 'react-bootstrap/Badge';
import Modal from 'react-bootstrap/Modal';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import {
  FiArrowLeft,
  FiEdit,
  FiCheck,
  FiX,
  FiTrash2,
  FiArrowRight,
  FiAlertTriangle,
  FiPackage,
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import usePageTitle from '../../hooks/usePageTitle';
import { formatDate, formatMoney } from '../../utils/formatters';
import {
  useGetTransfertQuery,
  useValiderTransfertMutation,
  useAnnulerTransfertMutation,
  useDeleteTransfertMutation,
} from '../../redux/api/transfertsApi';
import { useAuth } from '../../contexts/AuthContext';
import { PERM } from '../../config/permissions';

const STATUT_CFG = {
  brouillon: { label: 'Brouillon',  variant: 'secondary' },
  valide:    { label: 'Validé',     variant: 'success' },
  annule:    { label: 'Annulé',     variant: 'danger' },
};

const TransfertDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const canEdit = hasPermission(PERM.STOCKS_UPDATE);

  usePageTitle('Détail du transfert', [
    { label: 'Accueil', path: '/' },
    { label: 'Stocks', path: '/stocks' },
    { label: 'Transferts', path: '/stocks/transferts' },
    { label: 'Détail' },
  ]);

  const { data, isLoading, error, refetch } = useGetTransfertQuery(id);
  const [valider, { isLoading: validating }] = useValiderTransfertMutation();
  const [annuler, { isLoading: cancelling }] = useAnnulerTransfertMutation();
  const [supprimer, { isLoading: deleting }] = useDeleteTransfertMutation();

  const [showValidateModal, setShowValidateModal] = useState(false);
  const [showAnnulerModal, setShowAnnulerModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleValider = async () => {
    try {
      const res = await valider(id).unwrap();
      toast.success(res.message || 'Transfert validé');
      setShowValidateModal(false);
    } catch (err) {
      toast.error(err.data?.message || 'Erreur lors de la validation');
    }
  };

  const handleAnnuler = async () => {
    try {
      await annuler(id).unwrap();
      toast.success('Transfert annulé');
      setShowAnnulerModal(false);
    } catch (err) {
      toast.error(err.data?.message || 'Erreur');
    }
  };

  const handleDelete = async () => {
    try {
      await supprimer(id).unwrap();
      navigate('/stocks/transferts');
    } catch (err) {
      toast.error(err.data?.message || 'Erreur');
    }
  };

  if (isLoading) return (
    <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
  );

  if (error) return (
    <Alert variant="danger">
      <FiAlertTriangle className="me-2" />
      {error.data?.message || 'Erreur de chargement'}
      <Button variant="link" size="sm" onClick={refetch}>Réessayer</Button>
    </Alert>
  );

  if (!data?.data) return null;
  const t = data.data;
  const cfg = STATUT_CFG[t.statut] || { label: t.statut, variant: 'secondary' };
  const lignes = t.lignes || [];

  return (
    <>
      <div className="page-header">
        <div className="d-flex align-items-center gap-3">
          <Button variant="outline-secondary" size="sm" onClick={() => navigate('/stocks/transferts')}>
            <FiArrowLeft />
          </Button>
          <div>
            <div className="d-flex align-items-center gap-2">
              <FiArrowRight size={18} className="text-primary" />
              <h1 className="mb-0">{t.reference}</h1>
              <Badge bg={cfg.variant}>{cfg.label}</Badge>
            </div>
            <small className="text-muted">{formatDate(t.dateTransfert)}</small>
          </div>
        </div>
        <div className="d-flex gap-2">
          {canEdit && t.statut === 'brouillon' && (
            <>
              <Button
                as={Link}
                to={`/stocks/transferts/${id}/modifier`}
                variant="outline-secondary"
                size="sm"
              >
                <FiEdit className="me-1" /> Modifier
              </Button>
              <Button variant="success" size="sm" onClick={() => setShowValidateModal(true)}>
                <FiCheck className="me-1" /> Valider
              </Button>
              <Button variant="outline-warning" size="sm" onClick={() => setShowAnnulerModal(true)}>
                <FiX className="me-1" /> Annuler
              </Button>
              <Button variant="outline-danger" size="sm" onClick={() => setShowDeleteModal(true)}>
                <FiTrash2 />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Résumé validation */}
      {t.statut === 'valide' && (
        <Alert variant="success" className="d-flex gap-2 align-items-center mb-3">
          <FiCheck size={18} className="flex-shrink-0" />
          <div>
            Transfert validé le <strong>{formatDate(t.validatedAt)}</strong>
            {t.validatedBy && <> par <strong>{t.validatedBy.firstName} {t.validatedBy.lastName}</strong></>}.
            Les stocks ont été ajustés automatiquement.
          </div>
        </Alert>
      )}
      {t.statut === 'annule' && (
        <Alert variant="warning" className="mb-3">
          Transfert annulé le {formatDate(t.cancelledAt)}.
        </Alert>
      )}

      {/* Entête dépôts */}
      <Row className="g-3 mb-3">
        <Col md={5}>
          <Card className="shadow-sm h-100">
            <Card.Body>
              <div className="text-muted small mb-1">Dépôt SOURCE</div>
              <div className="fs-5 fw-semibold d-flex align-items-center gap-2">
                <FiPackage className="text-danger" />
                {t.warehouseSource?.name || '—'}
              </div>
              {t.warehouseSource?.city && (
                <small className="text-muted">{t.warehouseSource.city}</small>
              )}
            </Card.Body>
          </Card>
        </Col>
        <Col md={2} className="d-flex align-items-center justify-content-center">
          <div className="text-center">
            <FiArrowRight size={28} className="text-primary" />
            <div className="small text-muted mt-1">{lignes.length} produit(s)</div>
          </div>
        </Col>
        <Col md={5}>
          <Card className="shadow-sm h-100">
            <Card.Body>
              <div className="text-muted small mb-1">Dépôt DESTINATION</div>
              <div className="fs-5 fw-semibold d-flex align-items-center gap-2">
                <FiPackage className="text-success" />
                {t.warehouseDestination?.name || '—'}
              </div>
              {t.warehouseDestination?.city && (
                <small className="text-muted">{t.warehouseDestination.city}</small>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Infos complémentaires */}
      {(t.motif || t.notes) && (
        <Row className="g-3 mb-3">
          {t.motif && (
            <Col md={6}>
              <Card className="shadow-sm">
                <Card.Body className="py-2">
                  <span className="text-muted small">Motif : </span>
                  <span className="small">{t.motif}</span>
                </Card.Body>
              </Card>
            </Col>
          )}
          {t.notes && (
            <Col md={6}>
              <Card className="shadow-sm">
                <Card.Body className="py-2">
                  <span className="text-muted small">Notes : </span>
                  <span className="small">{t.notes}</span>
                </Card.Body>
              </Card>
            </Col>
          )}
        </Row>
      )}

      {/* Lignes produits */}
      <Card className="shadow-sm">
        <Card.Header><strong>Produits transférés</strong></Card.Header>
        <Card.Body className="p-0">
          <Table hover className="mb-0" style={{ fontSize: '0.875rem' }}>
            <thead className="table-light">
              <tr>
                <th>Produit</th>
                <th>Code</th>
                <th>Unité</th>
                <th className="text-end">Qté transférée</th>
                {t.statut === 'valide' && (
                  <th className="text-end">Stock avant (source)</th>
                )}
                <th className="text-end">CUMP</th>
                <th className="text-end">Valeur</th>
              </tr>
            </thead>
            <tbody>
              {lignes.map((l) => {
                const prod = l.product || {};
                const name = l.productSnapshot?.name || prod.name || '—';
                const code = l.productSnapshot?.code || prod.code;
                const unite = l.productSnapshot?.unite || prod.unite;
                return (
                  <tr key={l._id}>
                    <td className="fw-medium">{name}</td>
                    <td className="text-muted small">{code}</td>
                    <td className="small">{unite}</td>
                    <td className="text-end fw-semibold">{l.quantite}</td>
                    {t.statut === 'valide' && (
                      <td className="text-end text-muted small">{l.stockSource ?? '—'}</td>
                    )}
                    <td className="text-end small text-muted">{l.cump ? formatMoney(l.cump) : '—'}</td>
                    <td className="text-end small">
                      {l.cump ? formatMoney(Math.round(l.quantite * l.cump)) : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="table-light">
              <tr>
                <td colSpan={t.statut === 'valide' ? 5 : 4} className="text-end fw-semibold small">Total produits</td>
                <td className="text-end fw-semibold">
                  {lignes.reduce((s, l) => s + l.quantite, 0)} unités
                </td>
                <td className="text-end fw-semibold">
                  {formatMoney(lignes.reduce((s, l) => s + (l.cump ? Math.round(l.quantite * l.cump) : 0), 0))}
                </td>
              </tr>
            </tfoot>
          </Table>
        </Card.Body>
        {t.createdBy && (
          <Card.Footer className="text-muted small">
            Créé le {formatDate(t.createdAt)} par {t.createdBy.firstName} {t.createdBy.lastName}
          </Card.Footer>
        )}
      </Card>

      {/* Modal validation */}
      <Modal show={showValidateModal} onHide={() => setShowValidateModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Valider le transfert</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="info" className="small">
            La validation va immédiatement déduire les quantités du dépôt source et les ajouter au dépôt de destination.
            Cette action est <strong>irréversible</strong>.
          </Alert>
          <p>
            De : <strong>{t.warehouseSource?.name}</strong><br />
            Vers : <strong>{t.warehouseDestination?.name}</strong><br />
            Produits : <strong>{lignes.length}</strong>
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowValidateModal(false)}>Retour</Button>
          <Button variant="success" onClick={handleValider} disabled={validating}>
            {validating ? <Spinner animation="border" size="sm" className="me-1" /> : <FiCheck className="me-1" />}
            Confirmer le transfert
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal annulation */}
      <Modal show={showAnnulerModal} onHide={() => setShowAnnulerModal(false)}>
        <Modal.Header closeButton><Modal.Title>Annuler le transfert</Modal.Title></Modal.Header>
        <Modal.Body>Annuler le transfert <strong>{t.reference}</strong> ? Aucun stock ne sera modifié.</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAnnulerModal(false)}>Retour</Button>
          <Button variant="warning" onClick={handleAnnuler} disabled={cancelling}>
            {cancelling ? <Spinner animation="border" size="sm" className="me-1" /> : null}
            Annuler le transfert
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal suppression */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton><Modal.Title>Supprimer le transfert</Modal.Title></Modal.Header>
        <Modal.Body>Supprimer définitivement le transfert <strong>{t.reference}</strong> ?</Modal.Body>
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

export default TransfertDetailPage;
