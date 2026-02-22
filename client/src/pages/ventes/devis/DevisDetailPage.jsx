import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Table from 'react-bootstrap/Table';
import Badge from 'react-bootstrap/Badge';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import Modal from 'react-bootstrap/Modal';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import {
  FiEdit2,
  FiTrash2,
  FiRefreshCw,
  FiSend,
  FiDownload,
  FiArrowLeft,
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import usePageTitle from '../../../hooks/usePageTitle';
import { formatMoney, formatDate } from '../../../utils/formatters';
import {
  useGetDevisByIdQuery,
  useDeleteDevisMutation,
  useConvertDevisMutation,
  useSendDevisMutation,
} from '../../../redux/api/devisApi';

const statusColors = {
  brouillon: 'secondary',
  envoye: 'info',
  accepte: 'success',
  refuse: 'danger',
  expire: 'dark',
  converti: 'primary',
};

const statusLabels = {
  brouillon: 'Brouillon',
  envoye: 'Envoye',
  accepte: 'Accepte',
  refuse: 'Refuse',
  expire: 'Expire',
  converti: 'Converti',
};

const DevisDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [convertModalOpen, setConvertModalOpen] = useState(false);

  usePageTitle('Detail du devis', [
    { label: 'Accueil', path: '/' },
    { label: 'Ventes', path: '#' },
    { label: 'Devis', path: '/ventes/devis' },
    { label: 'Detail', path: '#' },
  ]);

  const { data, isLoading, isError, error } = useGetDevisByIdQuery(id);
  const [deleteDevis, { isLoading: isDeleting }] = useDeleteDevisMutation();
  const [convertDevis, { isLoading: isConverting }] = useConvertDevisMutation();
  const [sendDevis, { isLoading: isSending }] = useSendDevisMutation();

  const handleDelete = async () => {
    try {
      await deleteDevis(id).unwrap();
      toast.success('Devis supprime avec succes');
      navigate('/ventes/devis');
    } catch (err) {
      toast.error(err?.data?.message || 'Erreur lors de la suppression');
    }
  };

  const handleConvert = async () => {
    try {
      const result = await convertDevis(id).unwrap();
      toast.success('Devis converti en commande avec succes');
      setConvertModalOpen(false);
      if (result?.data?.commande?._id) {
        navigate(`/ventes/commandes/${result.data.commande._id}`);
      }
    } catch (err) {
      toast.error(err?.data?.message || 'Erreur lors de la conversion');
    }
  };

  const handleSend = async () => {
    try {
      await sendDevis(id).unwrap();
      toast.success('Devis envoye au client avec succes');
    } catch (err) {
      toast.error(err?.data?.message || 'Erreur lors de l\'envoi');
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2 text-muted">Chargement du devis...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <Alert variant="danger">
        Erreur lors du chargement du devis: {error?.data?.message || error?.message}
      </Alert>
    );
  }

  const devis = data?.data;

  if (!devis) {
    return <Alert variant="warning">Devis non trouve</Alert>;
  }

  const calculateLigne = (ligne) => {
    const ht = Math.round(ligne.quantite * ligne.prixUnitaire * (1 - ligne.remise / 100));
    const tva = Math.round((ht * ligne.tauxTVA) / 100);
    return { ht, tva, ttc: ht + tva };
  };

  return (
    <>
      <div className="page-header d-flex justify-content-between align-items-center mb-4">
        <div>
          <Button
            variant="link"
            className="p-0 me-3 text-decoration-none"
            onClick={() => navigate('/ventes/devis')}
          >
            <FiArrowLeft className="me-2" />
            Retour
          </Button>
          <h1 className="d-inline-block ms-2">Devis {devis.numero}</h1>
        </div>
        <div>
          {devis.status === 'brouillon' && (
            <>
              <Button
                variant="warning"
                className="me-2"
                onClick={() => navigate(`/ventes/devis/${id}/modifier`)}
              >
                <FiEdit2 className="me-2" />
                Modifier
              </Button>
              <Button variant="danger" className="me-2" onClick={() => setDeleteModalOpen(true)}>
                <FiTrash2 className="me-2" />
                Supprimer
              </Button>
            </>
          )}
          {(devis.status === 'brouillon' || devis.status === 'accepte') && (
            <Button
              variant="info"
              className="me-2"
              onClick={handleSend}
              disabled={isSending}
            >
              <FiSend className="me-2" />
              {isSending ? 'Envoi...' : 'Envoyer'}
            </Button>
          )}
          {devis.status === 'accepte' && (
            <Button variant="success" className="me-2" onClick={() => setConvertModalOpen(true)}>
              <FiRefreshCw className="me-2" />
              Convertir en commande
            </Button>
          )}
          <Button variant="secondary">
            <FiDownload className="me-2" />
            Telecharger PDF
          </Button>
        </div>
      </div>

      <Row className="g-3 mb-4">
        <Col lg={8}>
          <Card className="shadow-sm">
            <Card.Header className="bg-white">
              <div className="d-flex justify-content-between align-items-center">
                <h6 className="mb-0">Informations du devis</h6>
                <Badge bg={statusColors[devis.status]}>{statusLabels[devis.status]}</Badge>
              </div>
            </Card.Header>
            <Card.Body>
              <Row className="mb-3">
                <Col md={6}>
                  <p className="mb-2">
                    <strong>Numero:</strong> {devis.numero}
                  </p>
                  <p className="mb-2">
                    <strong>Date:</strong> {formatDate(devis.date)}
                  </p>
                  <p className="mb-2">
                    <strong>Date de validite:</strong> {formatDate(devis.dateValidite)}
                  </p>
                </Col>
                <Col md={6}>
                  {devis.conditionsPaiement && (
                    <p className="mb-2">
                      <strong>Conditions de paiement:</strong>
                      <br />
                      {devis.conditionsPaiement}
                    </p>
                  )}
                </Col>
              </Row>
              {devis.notes && (
                <div>
                  <strong>Notes:</strong>
                  <p className="text-muted mb-0">{devis.notes}</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
        <Col lg={4}>
          <Card className="shadow-sm">
            <Card.Header className="bg-white">
              <h6 className="mb-0">Client</h6>
            </Card.Header>
            <Card.Body>
              {devis.client ? (
                <>
                  <h6 className="mb-2">{devis.client.nom}</h6>
                  <p className="mb-1 small text-muted">
                    <strong>Email:</strong> {devis.client.email || 'N/A'}
                  </p>
                  <p className="mb-1 small text-muted">
                    <strong>Tel:</strong> {devis.client.telephone || 'N/A'}
                  </p>
                  {devis.client.adresse && (
                    <p className="mb-0 small text-muted">
                      <strong>Adresse:</strong> {devis.client.adresse}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-muted mb-0">Aucun client associe</p>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="shadow-sm mb-4">
        <Card.Header className="bg-white">
          <h6 className="mb-0">Lignes du devis</h6>
        </Card.Header>
        <Card.Body className="p-0">
          <Table responsive className="mb-0">
            <thead className="table-light">
              <tr>
                <th>Designation</th>
                <th className="text-center">Quantite</th>
                <th className="text-end">Prix unitaire</th>
                <th className="text-center">Remise</th>
                <th className="text-center">TVA</th>
                <th className="text-end">Total HT</th>
                <th className="text-end">Total TTC</th>
              </tr>
            </thead>
            <tbody>
              {devis.lignes?.map((ligne, index) => {
                const calc = calculateLigne(ligne);
                return (
                  <tr key={index}>
                    <td>
                      {ligne.designation}
                      {ligne.product && (
                        <small className="text-muted d-block">
                          Ref: {ligne.product.reference}
                        </small>
                      )}
                    </td>
                    <td className="text-center">{ligne.quantite}</td>
                    <td className="text-end">{formatMoney(ligne.prixUnitaire)}</td>
                    <td className="text-center">{ligne.remise}%</td>
                    <td className="text-center">{ligne.tauxTVA}%</td>
                    <td className="text-end">{formatMoney(calc.ht)}</td>
                    <td className="text-end">
                      <strong>{formatMoney(calc.ttc)}</strong>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      <Card className="shadow-sm">
        <Card.Body>
          <Row>
            <Col md={8}></Col>
            <Col md={4}>
              <div className="d-flex justify-content-between mb-2">
                <span>Total HT:</span>
                <strong>{formatMoney(devis.totalHT)}</strong>
              </div>
              {devis.remiseGlobale > 0 && (
                <div className="d-flex justify-content-between mb-2 text-muted">
                  <span>Remise globale ({devis.remiseGlobale}%):</span>
                  <span>
                    -{formatMoney(Math.round((devis.totalHT * devis.remiseGlobale) / 100))}
                  </span>
                </div>
              )}
              <div className="d-flex justify-content-between mb-2">
                <span>Total TVA:</span>
                <strong>{formatMoney(devis.totalTVA)}</strong>
              </div>
              <hr />
              <div className="d-flex justify-content-between">
                <strong>Total TTC:</strong>
                <h4 className="text-primary mb-0">{formatMoney(devis.totalTTC)}</h4>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Modal show={deleteModalOpen} onHide={() => setDeleteModalOpen(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirmer la suppression</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Etes-vous sur de vouloir supprimer le devis <strong>{devis.numero}</strong> ? Cette
          action est irreversible.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setDeleteModalOpen(false)}>
            Annuler
          </Button>
          <Button variant="danger" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? 'Suppression...' : 'Supprimer'}
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={convertModalOpen} onHide={() => setConvertModalOpen(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Convertir en commande</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Voulez-vous convertir le devis <strong>{devis.numero}</strong> en commande client ?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setConvertModalOpen(false)}>
            Annuler
          </Button>
          <Button variant="success" onClick={handleConvert} disabled={isConverting}>
            {isConverting ? 'Conversion...' : 'Convertir'}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default DevisDetailPage;
