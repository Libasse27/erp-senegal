import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Card from 'react-bootstrap/Card';
import Table from 'react-bootstrap/Table';
import Button from 'react-bootstrap/Button';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Badge from 'react-bootstrap/Badge';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import Modal from 'react-bootstrap/Modal';
import { FiEdit2, FiTrash2, FiCheck, FiX, FiArrowLeft } from 'react-icons/fi';
import { toast } from 'react-toastify';
import usePageTitle from '../../hooks/usePageTitle';
import { formatMoney, formatDate } from '../../utils/formatters';
import {
  useGetEcritureQuery,
  useValidateEcritureMutation,
  useContrepasserEcritureMutation,
  useDeleteEcritureMutation
} from '../../redux/api/comptabiliteApi';

const JOURNAL_LABELS = {
  VE: 'Ventes',
  AC: 'Achats',
  BQ: 'Banque',
  CA: 'Caisse',
  OD: 'Operations Diverses'
};

const JOURNAL_VARIANTS = {
  VE: 'success',
  AC: 'warning',
  BQ: 'info',
  CA: 'primary',
  OD: 'secondary'
};

const SOURCE_TYPE_LABELS = {
  facture: 'Facture',
  devis: 'Devis',
  commande: 'Commande',
  bonLivraison: 'Bon de Livraison',
  paiement: 'Paiement',
  autre: 'Autre'
};

export default function EcritureDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  usePageTitle('Detail Ecriture', [
    { label: 'Accueil', path: '/' },
    { label: 'Comptabilite' },
    { label: 'Ecritures', path: '/comptabilite/ecritures' },
    { label: 'Detail' }
  ]);

  const [showValidateModal, setShowValidateModal] = useState(false);
  const [showContrepasserModal, setShowContrepasserModal] = useState(false);

  const { data, isLoading, error } = useGetEcritureQuery(id);
  const [validateEcriture, { isLoading: isValidating }] = useValidateEcritureMutation();
  const [contrepasserEcriture, { isLoading: isContrepassing }] = useContrepasserEcritureMutation();
  const [deleteEcriture, { isLoading: isDeleting }] = useDeleteEcritureMutation();

  const handleValidate = async () => {
    try {
      await validateEcriture(id).unwrap();
      toast.success('Ecriture validee avec succes');
      setShowValidateModal(false);
    } catch (err) {
      toast.error(err.data?.message || 'Erreur lors de la validation');
    }
  };

  const handleContrepasser = async () => {
    try {
      await contrepasserEcriture(id).unwrap();
      toast.success('Ecriture contrepassee avec succes');
      setShowContrepasserModal(false);
    } catch (err) {
      toast.error(err.data?.message || 'Erreur lors de la contrepassation');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Etes-vous sur de vouloir supprimer cette ecriture ?')) {
      return;
    }

    try {
      await deleteEcriture(id).unwrap();
      toast.success('Ecriture supprimee avec succes');
      navigate('/comptabilite/ecritures');
    } catch (err) {
      toast.error(err.data?.message || 'Erreur lors de la suppression');
    }
  };

  const calculateTotals = (lignes) => {
    return lignes.reduce(
      (acc, ligne) => ({
        debit: acc.debit + ligne.debit,
        credit: acc.credit + ligne.credit
      }),
      { debit: 0, credit: 0 }
    );
  };

  if (isLoading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Chargement...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="danger">
        Erreur: {error.data?.message || error.message}
      </Alert>
    );
  }

  const ecriture = data?.data;

  if (!ecriture) {
    return <Alert variant="warning">Ecriture non trouvee</Alert>;
  }

  const totals = calculateTotals(ecriture.lignes);

  return (
    <div>
      <div className="mb-3">
        <Button variant="outline-secondary" onClick={() => navigate('/comptabilite/ecritures')}>
          <FiArrowLeft className="me-2" />
          Retour a la liste
        </Button>
      </div>

      <Card>
        <Card.Header>
          <Row className="align-items-center">
            <Col>
              <h5 className="mb-0">Ecriture Comptable - {ecriture.numero}</h5>
            </Col>
            <Col className="text-end">
              <Badge bg={JOURNAL_VARIANTS[ecriture.journal]} className="me-2">
                {ecriture.journal} - {JOURNAL_LABELS[ecriture.journal]}
              </Badge>
              <Badge bg={ecriture.statut === 'validee' ? 'success' : 'secondary'}>
                {ecriture.statut.toUpperCase()}
              </Badge>
            </Col>
          </Row>
        </Card.Header>
        <Card.Body>
          <Row className="mb-4">
            <Col md={3}>
              <div className="mb-3">
                <small className="text-muted d-block">Numero</small>
                <strong>{ecriture.numero}</strong>
              </div>
            </Col>
            <Col md={3}>
              <div className="mb-3">
                <small className="text-muted d-block">Date</small>
                <strong>{formatDate(ecriture.date)}</strong>
              </div>
            </Col>
            <Col md={3}>
              <div className="mb-3">
                <small className="text-muted d-block">Journal</small>
                <strong>{ecriture.journal} - {JOURNAL_LABELS[ecriture.journal]}</strong>
              </div>
            </Col>
            <Col md={3}>
              <div className="mb-3">
                <small className="text-muted d-block">Piece de reference</small>
                <strong>{ecriture.pieceRef || 'N/A'}</strong>
              </div>
            </Col>
          </Row>

          <Row className="mb-4">
            <Col md={12}>
              <div className="mb-3">
                <small className="text-muted d-block">Libelle</small>
                <strong>{ecriture.libelle}</strong>
              </div>
            </Col>
          </Row>

          {ecriture.sourceDocument && (
            <Row className="mb-4">
              <Col md={12}>
                <Alert variant="info" className="mb-0">
                  <strong>Document source:</strong>{' '}
                  {SOURCE_TYPE_LABELS[ecriture.sourceDocument.type] || ecriture.sourceDocument.type}{' '}
                  - <strong>{ecriture.sourceDocument.ref}</strong>
                </Alert>
              </Col>
            </Row>
          )}

          <h6 className="mb-3">Lignes d'ecriture</h6>
          <Table bordered hover responsive>
            <thead className="table-light">
              <tr>
                <th style={{ width: '25%' }}>Compte</th>
                <th style={{ width: '40%' }}>Libelle</th>
                <th style={{ width: '17.5%' }} className="text-end">Debit</th>
                <th style={{ width: '17.5%' }} className="text-end">Credit</th>
              </tr>
            </thead>
            <tbody>
              {ecriture.lignes.map((ligne, index) => (
                <tr key={index}>
                  <td>
                    <strong>{ligne.compte.numero}</strong>
                    <br />
                    <small className="text-muted">{ligne.compte.libelle}</small>
                  </td>
                  <td>{ligne.libelle}</td>
                  <td className="text-end">
                    {ligne.debit > 0 ? (
                      <strong className="text-primary">{formatMoney(ligne.debit)}</strong>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="text-end">
                    {ligne.credit > 0 ? (
                      <strong className="text-success">{formatMoney(ligne.credit)}</strong>
                    ) : (
                      '-'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="table-light">
              <tr>
                <td colSpan="2" className="text-end">
                  <strong>Totaux:</strong>
                </td>
                <td className="text-end">
                  <strong className="text-primary">{formatMoney(totals.debit)}</strong>
                </td>
                <td className="text-end">
                  <strong className="text-success">{formatMoney(totals.credit)}</strong>
                </td>
              </tr>
            </tfoot>
          </Table>

          <Row className="mt-4">
            <Col md={6}>
              <small className="text-muted d-block">Cree le</small>
              <strong>{formatDate(ecriture.createdAt)}</strong>
              {ecriture.createdBy && (
                <span className="ms-2 text-muted">
                  par {ecriture.createdBy.nom} {ecriture.createdBy.prenom}
                </span>
              )}
            </Col>
            {ecriture.validatedAt && (
              <Col md={6}>
                <small className="text-muted d-block">Validee le</small>
                <strong>{formatDate(ecriture.validatedAt)}</strong>
                {ecriture.validatedBy && (
                  <span className="ms-2 text-muted">
                    par {ecriture.validatedBy.nom} {ecriture.validatedBy.prenom}
                  </span>
                )}
              </Col>
            )}
          </Row>

          <hr className="my-4" />

          <div className="d-flex justify-content-end gap-2">
            {ecriture.statut === 'brouillon' && (
              <>
                <Button
                  variant="outline-primary"
                  onClick={() => navigate(`/comptabilite/ecritures/${id}/modifier`)}
                >
                  <FiEdit2 className="me-2" />
                  Modifier
                </Button>
                <Button
                  variant="success"
                  onClick={() => setShowValidateModal(true)}
                >
                  <FiCheck className="me-2" />
                  Valider
                </Button>
                <Button
                  variant="danger"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  <FiTrash2 className="me-2" />
                  Supprimer
                </Button>
              </>
            )}

            {ecriture.statut === 'validee' && (
              <Button
                variant="warning"
                onClick={() => setShowContrepasserModal(true)}
              >
                <FiX className="me-2" />
                Contrepasser
              </Button>
            )}
          </div>
        </Card.Body>
      </Card>

      {/* Validate Modal */}
      <Modal show={showValidateModal} onHide={() => setShowValidateModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Valider l'ecriture</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Etes-vous sur de vouloir valider cette ecriture ?</p>
          <div className="bg-light p-3 rounded">
            <strong>Numero:</strong> {ecriture.numero}<br />
            <strong>Libelle:</strong> {ecriture.libelle}<br />
            <strong>Date:</strong> {formatDate(ecriture.date)}<br />
            <strong>Total Debit:</strong> {formatMoney(totals.debit)}<br />
            <strong>Total Credit:</strong> {formatMoney(totals.credit)}
          </div>
          <Alert variant="warning" className="mt-3 mb-0">
            <strong>Attention:</strong> Une fois validee, cette ecriture ne pourra plus etre modifiee ou supprimee.
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowValidateModal(false)}>
            Annuler
          </Button>
          <Button variant="success" onClick={handleValidate} disabled={isValidating}>
            {isValidating ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Validation...
              </>
            ) : (
              <>
                <FiCheck className="me-2" />
                Valider
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Contrepasser Modal */}
      <Modal show={showContrepasserModal} onHide={() => setShowContrepasserModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Contrepasser l'ecriture</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Etes-vous sur de vouloir contrepasser cette ecriture ?</p>
          <div className="bg-light p-3 rounded">
            <strong>Numero:</strong> {ecriture.numero}<br />
            <strong>Libelle:</strong> {ecriture.libelle}<br />
            <strong>Date:</strong> {formatDate(ecriture.date)}<br />
            <strong>Total Debit:</strong> {formatMoney(totals.debit)}<br />
            <strong>Total Credit:</strong> {formatMoney(totals.credit)}
          </div>
          <Alert variant="info" className="mt-3 mb-0">
            <strong>Information:</strong> Une ecriture inverse sera creee automatiquement pour annuler cette operation.
            Les debits deviendront des credits et vice versa.
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowContrepasserModal(false)}>
            Annuler
          </Button>
          <Button variant="warning" onClick={handleContrepasser} disabled={isContrepassing}>
            {isContrepassing ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Contrepassation...
              </>
            ) : (
              <>
                <FiX className="me-2" />
                Contrepasser
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
