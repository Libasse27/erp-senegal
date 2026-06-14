import React, { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
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
import {
  FiArrowLeft,
  FiCheck,
  FiX,
  FiTrash2,
  FiSend,
  FiAlertCircle,
  FiFileText,
  FiPhone,
  FiMail,
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import usePageTitle from '../../../hooks/usePageTitle';
import { formatMoney, formatDate } from '../../../utils/formatters';
import {
  useGetRelanceQuery,
  useAcquitterRelanceMutation,
  useAnnulerRelanceMutation,
  useDeleteRelanceMutation,
} from '../../../redux/api/relancesApi';
import { useAuth } from '../../../contexts/AuthContext';
import { PERM } from '../../../config/permissions';

const NIVEAU_CFG = {
  1: { label: '1ère relance — Amiable',     variant: 'info',    desc: 'Rappel courtois de l\'échéance dépassée' },
  2: { label: '2ème relance — Formelle',    variant: 'warning', desc: 'Mise en demeure formelle de paiement' },
  3: { label: '3ème relance — Pré-contentieux', variant: 'danger', desc: 'Notification pré-contentieux, transmission possible à un recouvrement judiciaire' },
};

const STATUT_CFG = {
  brouillon:  { label: 'Brouillon',  variant: 'secondary' },
  envoyee:    { label: 'Envoyée',    variant: 'primary' },
  acquittee:  { label: 'Acquittée', variant: 'success' },
  annulee:    { label: 'Annulée',   variant: 'danger' },
};

const MODE_ICON = {
  email:      FiMail,
  telephone:  FiPhone,
  courrier:   FiSend,
  sms:        FiSend,
};

const RelanceDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const canEdit = hasPermission(PERM.FACTURES_CREATE);

  usePageTitle('Détail relance', [
    { label: 'Accueil', path: '/' },
    { label: 'Recouvrement', path: '/ventes/relances' },
    { label: 'Détail' },
  ]);

  const { data, isLoading, error } = useGetRelanceQuery(id);
  const [acquitter, { isLoading: acquitting }] = useAcquitterRelanceMutation();
  const [annuler, { isLoading: cancelling }] = useAnnulerRelanceMutation();
  const [supprimer, { isLoading: deleting }] = useDeleteRelanceMutation();

  const [acquitterModal, setAcquitterModal] = useState(false);
  const [acquitterNote, setAcquitterNote] = useState('');
  const [annulerModal, setAnnulerModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);

  const handleAcquitter = async () => {
    try {
      await acquitter({ id, notes: acquitterNote }).unwrap();
      toast.success('Relance acquittée');
      setAcquitterModal(false);
    } catch (err) {
      toast.error(err.data?.message || 'Erreur');
    }
  };

  const handleAnnuler = async () => {
    try {
      await annuler(id).unwrap();
      toast.success('Relance annulée');
      setAnnulerModal(false);
    } catch (err) {
      toast.error(err.data?.message || 'Erreur');
    }
  };

  const handleDelete = async () => {
    try {
      await supprimer(id).unwrap();
      navigate('/ventes/relances');
    } catch (err) {
      toast.error(err.data?.message || 'Erreur');
    }
  };

  if (isLoading) return <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>;
  if (error) return <Alert variant="danger"><FiAlertCircle className="me-2" />{error.data?.message || 'Erreur de chargement'}</Alert>;
  if (!data?.data) return null;

  const r = data.data;
  const niv = NIVEAU_CFG[r.niveau] || NIVEAU_CFG[1];
  const stat = STATUT_CFG[r.statut] || STATUT_CFG.brouillon;
  const ModeIcon = MODE_ICON[r.mode] || FiSend;

  return (
    <>
      <div className="page-header">
        <div className="d-flex align-items-center gap-3">
          <Button variant="outline-secondary" size="sm" onClick={() => navigate('/ventes/relances')}>
            <FiArrowLeft />
          </Button>
          <div>
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <FiSend size={18} className="text-warning" />
              <h1 className="mb-0">{r.reference}</h1>
              <Badge bg={niv.variant}>{niv.label}</Badge>
              <Badge bg={stat.variant}>{stat.label}</Badge>
            </div>
            <small className="text-muted">{formatDate(r.dateRelance)} · <ModeIcon size={11} className="me-1" />{r.mode}</small>
          </div>
        </div>
        <div className="d-flex gap-2">
          {canEdit && r.statut === 'envoyee' && (
            <Button variant="success" size="sm" onClick={() => setAcquitterModal(true)}>
              <FiCheck className="me-1" /> Acquitter
            </Button>
          )}
          {canEdit && ['envoyee', 'brouillon'].includes(r.statut) && (
            <Button variant="outline-warning" size="sm" onClick={() => setAnnulerModal(true)}>
              <FiX className="me-1" /> Annuler
            </Button>
          )}
          {canEdit && ['brouillon', 'annulee'].includes(r.statut) && (
            <Button variant="outline-danger" size="sm" onClick={() => setDeleteModal(true)}>
              <FiTrash2 />
            </Button>
          )}
        </div>
      </div>

      {/* Résumé statut */}
      {r.statut === 'acquittee' && (
        <Alert variant="success" className="d-flex gap-2 align-items-center mb-3">
          <FiCheck size={18} className="flex-shrink-0" />
          <div>
            Acquittée le <strong>{formatDate(r.acquittedAt)}</strong>
            {r.acquittedBy && <> par <strong>{r.acquittedBy.firstName} {r.acquittedBy.lastName}</strong></>}.
          </div>
        </Alert>
      )}
      {r.statut === 'annulee' && (
        <Alert variant="warning" className="mb-3">Relance annulée.</Alert>
      )}

      {/* Niveau alerte */}
      <Alert variant={niv.variant} className="small mb-3 d-flex align-items-center gap-2">
        <FiAlertCircle size={16} className="flex-shrink-0" />
        <strong>{niv.label}</strong> — {niv.desc}
      </Alert>

      <Row className="g-3 mb-3">
        {/* Client */}
        <Col md={5}>
          <Card className="shadow-sm h-100">
            <Card.Header className="small fw-semibold text-muted">CLIENT</Card.Header>
            <Card.Body>
              <div className="fw-semibold fs-6">{r.clientSnapshot?.name || r.client?.name}</div>
              {(r.clientSnapshot?.email || r.client?.email) && (
                <div className="text-muted small d-flex align-items-center gap-1 mt-1">
                  <FiMail size={12} /> {r.clientSnapshot?.email || r.client?.email}
                </div>
              )}
              {(r.clientSnapshot?.phone || r.client?.phone) && (
                <div className="text-muted small d-flex align-items-center gap-1">
                  <FiPhone size={12} /> {r.clientSnapshot?.phone || r.client?.phone}
                </div>
              )}
              <div className="mt-2">
                <Button
                  as={Link}
                  to={`/clients/${r.client?._id || r.client}`}
                  variant="outline-secondary"
                  size="sm"
                >
                  Voir la fiche client
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Montant + Délai */}
        <Col md={4}>
          <Card className="shadow-sm h-100">
            <Card.Header className="small fw-semibold text-muted">MONTANT</Card.Header>
            <Card.Body className="text-center d-flex flex-column justify-content-center">
              <div className="fs-2 fw-bold text-danger">{formatMoney(r.montantTotalDu)}</div>
              <div className="text-muted small mt-1">Total créances dues</div>
              {r.dateEcheanceRelance && (
                <div className="mt-2 small">
                  Délai de réponse : <strong className="text-warning">{formatDate(r.dateEcheanceRelance)}</strong>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Infos relance */}
        <Col md={3}>
          <Card className="shadow-sm h-100">
            <Card.Header className="small fw-semibold text-muted">DÉTAILS</Card.Header>
            <Card.Body className="small">
              <div className="d-flex justify-content-between mb-1">
                <span className="text-muted">Mode</span>
                <span className="fw-medium text-capitalize">{r.mode}</span>
              </div>
              <div className="d-flex justify-content-between mb-1">
                <span className="text-muted">Factures</span>
                <span className="fw-medium">{r.factures?.length || 0}</span>
              </div>
              {r.createdBy && (
                <div className="d-flex justify-content-between">
                  <span className="text-muted">Créée par</span>
                  <span className="fw-medium">{r.createdBy.firstName}</span>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Factures liées */}
      <Card className="shadow-sm mb-3">
        <Card.Header className="d-flex align-items-center gap-2">
          <FiFileText /> <strong>Factures concernées</strong>
          <Badge bg="secondary" pill>{r.factures?.length || 0}</Badge>
        </Card.Header>
        <Card.Body className="p-0">
          <Table hover className="mb-0" style={{ fontSize: '0.875rem' }}>
            <thead className="table-light">
              <tr>
                <th>N° Facture</th>
                <th>Date facture</th>
                <th>Échéance</th>
                <th className="text-end">Retard</th>
                <th className="text-end">Montant TTC</th>
                <th className="text-end">Payé</th>
                <th className="text-end fw-semibold">Restant dû</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {(r.factures || []).map((ligne) => {
                const f = ligne.facture || {};
                return (
                  <tr key={ligne._id}>
                    <td className="fw-medium">{ligne.numero || f.numero || f.referenceInterne || '—'}</td>
                    <td className="text-muted small">{formatDate(ligne.dateFacture || f.dateFacture)}</td>
                    <td className="text-danger small">{formatDate(ligne.dateEcheance || f.dateEcheance)}</td>
                    <td className="text-end">
                      <Badge bg={ligne.joursRetard > 90 ? 'danger' : ligne.joursRetard > 30 ? 'warning' : 'info'}>
                        {ligne.joursRetard} j
                      </Badge>
                    </td>
                    <td className="text-end small">{formatMoney(ligne.montantTTC)}</td>
                    <td className="text-end small text-success">{formatMoney(ligne.montantPaye)}</td>
                    <td className="text-end fw-bold text-danger">{formatMoney(ligne.montantDu)}</td>
                    <td className="text-end">
                      <Button
                        as={Link}
                        to={`/ventes/factures/${f._id || ligne.facture}`}
                        variant="outline-secondary"
                        size="sm"
                      >
                        <FiFileText size={12} />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="table-light fw-semibold">
              <tr>
                <td colSpan={6} className="text-end">Total dû :</td>
                <td className="text-end text-danger">{formatMoney(r.montantTotalDu)}</td>
                <td></td>
              </tr>
            </tfoot>
          </Table>
        </Card.Body>
      </Card>

      {r.notes && (
        <Card className="shadow-sm">
          <Card.Body className="small">
            <strong>Notes :</strong> {r.notes}
          </Card.Body>
        </Card>
      )}

      {/* Modals */}
      <Modal show={acquitterModal} onHide={() => setAcquitterModal(false)}>
        <Modal.Header closeButton><Modal.Title>Acquitter la relance</Modal.Title></Modal.Header>
        <Modal.Body>
          <p>Marquer cette relance comme acquittée signifie que le client a répondu ou payé.</p>
          <Form.Group>
            <Form.Label className="small">Note de clôture (optionnel)</Form.Label>
            <Form.Control as="textarea" rows={2} value={acquitterNote} onChange={(e) => setAcquitterNote(e.target.value)} placeholder="Ex: Client a promis de payer le 20/06..." />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setAcquitterModal(false)}>Retour</Button>
          <Button variant="success" onClick={handleAcquitter} disabled={acquitting}>
            {acquitting ? <Spinner animation="border" size="sm" className="me-1" /> : <FiCheck className="me-1" />}
            Acquitter
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={annulerModal} onHide={() => setAnnulerModal(false)}>
        <Modal.Header closeButton><Modal.Title>Annuler la relance</Modal.Title></Modal.Header>
        <Modal.Body>Annuler définitivement la relance <strong>{r.reference}</strong> ?</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setAnnulerModal(false)}>Retour</Button>
          <Button variant="warning" onClick={handleAnnuler} disabled={cancelling}>
            {cancelling ? <Spinner animation="border" size="sm" className="me-1" /> : null}
            Annuler
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={deleteModal} onHide={() => setDeleteModal(false)}>
        <Modal.Header closeButton><Modal.Title>Supprimer la relance</Modal.Title></Modal.Header>
        <Modal.Body>Supprimer définitivement <strong>{r.reference}</strong> ?</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setDeleteModal(false)}>Annuler</Button>
          <Button variant="danger" onClick={handleDelete} disabled={deleting}>
            {deleting ? <Spinner animation="border" size="sm" className="me-1" /> : null}
            Supprimer
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default RelanceDetailPage;
