import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Table from 'react-bootstrap/Table';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import Modal from 'react-bootstrap/Modal';
import {
  FiArrowLeft,
  FiCheckCircle,
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import usePageTitle from '../../../hooks/usePageTitle';
import { formatDate } from '../../../utils/formatters';
import {
  useGetBonLivraisonQuery,
  useValidateBonLivraisonMutation,
} from '../../../redux/api/bonsLivraisonApi';
import usePdfActions from '../../../hooks/usePdfActions';
import { PrintToolbar, DocumentHeader, PdfPreviewModal } from '../../../components/print';

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

  const tiers = bl.clientSnapshot
    ? {
        nom: bl.clientSnapshot.displayName,
        phone: bl.clientSnapshot.phone,
        adresse: [bl.clientSnapshot.address?.street, bl.clientSnapshot.address?.city]
          .filter(Boolean)
          .join(', ') || undefined,
      }
    : null;

  const commandeLink = bl.commande ? (
    <Button
      variant="link"
      size="sm"
      className="p-0"
      onClick={() => navigate(`/ventes/commandes/${bl.commande._id}`)}
    >
      {bl.commande.numero}
    </Button>
  ) : null;

  const factureLink = bl.facture ? (
    <Button
      variant="link"
      size="sm"
      className="p-0"
      onClick={() => navigate(`/ventes/factures/${bl.facture._id}`)}
    >
      {bl.facture.numero}
    </Button>
  ) : null;

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
        <div className="d-flex align-items-center gap-2">
          {statut === 'brouillon' && (
            <Button variant="success" onClick={() => setValidateModalOpen(true)}>
              <FiCheckCircle className="me-2" />
              Valider
            </Button>
          )}
          <PrintToolbar
            onPreview={() => previewPdf(pdfPath)}
            onPrint={() => printPdf(pdfPath)}
            onDownload={() => downloadPdf(pdfPath, pdfFilename)}
            isLoading={isPdfLoading}
          />
        </div>
      </div>

      <DocumentHeader
        docLabel="Informations du bon de livraison"
        numero={bl.numero}
        statut={statut}
        statusColors={statusColors}
        statusLabels={statusLabels}
        dateFields={[
          { label: 'Date de livraison', value: formatDate(bl.dateLivraison) },
          { label: 'Commande', value: commandeLink },
          { label: 'Facture associee', value: factureLink },
        ]}
        notes={bl.notes}
        tiersLabel="Client"
        tiers={tiers}
      />

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
