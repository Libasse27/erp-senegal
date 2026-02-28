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
  FiArrowLeft,
  FiCheckCircle,
  FiDownload,
  FiPrinter,
  FiEye,
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import usePageTitle from '../../../hooks/usePageTitle';
import { formatDate } from '../../../utils/formatters';
import {
  useGetBonLivraisonQuery,
  useValidateBonLivraisonMutation,
} from '../../../redux/api/bonsLivraisonApi';
import usePdfActions from '../../../hooks/usePdfActions';
import PdfPreviewModal from '../../../components/print/PdfPreviewModal';

const statusColors = {
  brouillon: 'secondary',
  valide: 'success',
  annule: 'danger',
};

const statusLabels = {
  brouillon: 'Brouillon',
  valide: 'Valide',
  annule: 'Annule',
};

const BonLivraisonDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [validateModalOpen, setValidateModalOpen] = useState(false);

  usePageTitle('Detail du bon de livraison', [
    { label: 'Accueil', path: '/' },
    { label: 'Ventes', path: '#' },
    { label: 'Bons de livraison', path: '/ventes/bons-livraison' },
    { label: 'Detail', path: '#' },
  ]);

  const { data, isLoading, isError, error } = useGetBonLivraisonQuery(id);
  const [validateBL, { isLoading: isValidating }] = useValidateBonLivraisonMutation();

  const { downloadPdf, printPdf, previewPdf, closePreview, previewUrl, isLoading: isPdfLoading } = usePdfActions();

  const handleValidate = async () => {
    try {
      await validateBL({ id }).unwrap();
      toast.success('Bon de livraison valide avec succes');
      setValidateModalOpen(false);
    } catch (err) {
      toast.error(err?.data?.message || 'Erreur lors de la validation');
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="warning" />
        <p className="mt-2 text-muted">Chargement du bon de livraison...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <Alert variant="danger">
        Erreur lors du chargement: {error?.data?.message || error?.message}
      </Alert>
    );
  }

  const bl = data?.data;

  if (!bl) {
    return <Alert variant="warning">Bon de livraison non trouve</Alert>;
  }

  const statut = bl.statut || bl.status;
  const pdfPath = `/bons-livraison/${id}/pdf`;
  const pdfFilename = `BL-${bl.numero || id}.pdf`;

  return (
    <>
      <div className="page-header d-flex justify-content-between align-items-center mb-4">
        <div>
          <Button
            variant="link"
            className="p-0 me-3 text-decoration-none"
            onClick={() => navigate('/ventes/bons-livraison')}
          >
            <FiArrowLeft className="me-2" />
            Retour
          </Button>
          <h1 className="d-inline-block ms-2">Bon de livraison {bl.numero}</h1>
        </div>
        <div>
          {statut === 'brouillon' && (
            <Button
              variant="success"
              className="me-2"
              onClick={() => setValidateModalOpen(true)}
            >
              <FiCheckCircle className="me-2" />
              Valider
            </Button>
          )}
          <Button
            variant="outline-secondary"
            className="me-2"
            onClick={() => previewPdf(pdfPath)}
            disabled={isPdfLoading}
          >
            <FiEye className="me-2" />
            Apercu
          </Button>
          <Button
            variant="outline-secondary"
            className="me-2"
            onClick={() => printPdf(pdfPath)}
            disabled={isPdfLoading}
          >
            <FiPrinter className="me-2" />
            Imprimer
          </Button>
          <Button
            variant="secondary"
            onClick={() => downloadPdf(pdfPath, pdfFilename)}
            disabled={isPdfLoading}
          >
            <FiDownload className="me-2" />
            {isPdfLoading ? 'Chargement...' : 'Telecharger PDF'}
          </Button>
        </div>
      </div>

      <Row className="g-3 mb-4">
        <Col lg={8}>
          <Card className="shadow-sm">
            <Card.Header className="bg-white">
              <div className="d-flex justify-content-between align-items-center">
                <h6 className="mb-0">Informations du bon de livraison</h6>
                <Badge bg={statusColors[statut] || 'secondary'}>{statusLabels[statut] || statut}</Badge>
              </div>
            </Card.Header>
            <Card.Body>
              <Row className="mb-3">
                <Col md={6}>
                  <p className="mb-2">
                    <strong>Numero:</strong> {bl.numero}
                  </p>
                  <p className="mb-2">
                    <strong>Date de livraison:</strong> {formatDate(bl.dateLivraison)}
                  </p>
                  {bl.commande && (
                    <p className="mb-2">
                      <strong>Commande:</strong>{' '}
                      <Button
                        variant="link"
                        size="sm"
                        className="p-0"
                        onClick={() => navigate(`/ventes/commandes/${bl.commande._id}`)}
                      >
                        {bl.commande.numero}
                      </Button>
                    </p>
                  )}
                </Col>
                <Col md={6}>
                  {bl.facture && (
                    <p className="mb-2">
                      <strong>Facture associee:</strong>{' '}
                      <Button
                        variant="link"
                        size="sm"
                        className="p-0"
                        onClick={() => navigate(`/ventes/factures/${bl.facture._id}`)}
                      >
                        {bl.facture.numero}
                      </Button>
                    </p>
                  )}
                  {bl.notes && (
                    <p className="mb-2">
                      <strong>Notes:</strong> {bl.notes}
                    </p>
                  )}
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={4}>
          <Card className="shadow-sm">
            <Card.Header className="bg-white">
              <h6 className="mb-0">Client</h6>
            </Card.Header>
            <Card.Body>
              {bl.clientSnapshot ? (
                <>
                  <h6 className="mb-2">{bl.clientSnapshot.displayName}</h6>
                  <p className="mb-1 small text-muted">
                    <strong>Tel:</strong> {bl.clientSnapshot.phone || 'N/A'}
                  </p>
                  {bl.clientSnapshot.address?.street && (
                    <p className="mb-0 small text-muted">
                      <strong>Adresse:</strong> {bl.clientSnapshot.address.street}, {bl.clientSnapshot.address.city}
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
          <h6 className="mb-0">Lignes du bon de livraison</h6>
        </Card.Header>
        <Card.Body className="p-0">
          <Table responsive className="mb-0">
            <thead className="table-light">
              <tr>
                <th>Designation</th>
                <th className="text-center">Reference</th>
                <th className="text-center">Quantite</th>
                <th className="text-center">Unite</th>
              </tr>
            </thead>
            <tbody>
              {bl.lignes?.map((ligne, index) => (
                <tr key={index}>
                  <td>{ligne.designation}</td>
                  <td className="text-center">{ligne.reference || '-'}</td>
                  <td className="text-center">{ligne.quantite}</td>
                  <td className="text-center">{ligne.unite || '-'}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      <Modal show={validateModalOpen} onHide={() => setValidateModalOpen(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Valider le bon de livraison</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Voulez-vous valider le bon de livraison <strong>{bl.numero}</strong> ? Le stock sera decremente.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setValidateModalOpen(false)}>
            Annuler
          </Button>
          <Button variant="success" onClick={handleValidate} disabled={isValidating}>
            {isValidating ? 'Validation...' : 'Valider'}
          </Button>
        </Modal.Footer>
      </Modal>

      <PdfPreviewModal
        show={!!previewUrl}
        onHide={closePreview}
        blobUrl={previewUrl}
        documentTitle={bl.numero}
        onDownload={() => downloadPdf(pdfPath, pdfFilename)}
        onPrint={() => printPdf(pdfPath)}
      />
    </>
  );
};

export default BonLivraisonDetailPage;
