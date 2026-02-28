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
import Form from 'react-bootstrap/Form';
import {
  FiEdit2,
  FiTrash2,
  FiTruck,
  FiArrowLeft,
  FiDownload,
  FiPrinter,
  FiEye,
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import usePageTitle from '../../../hooks/usePageTitle';
import { formatMoney, formatDate } from '../../../utils/formatters';
import {
  useGetCommandeQuery,
  useDeleteCommandeMutation,
  useUpdateCommandeStatusMutation,
  useGenerateLivraisonMutation,
} from '../../../redux/api/commandesApi';
import usePdfActions from '../../../hooks/usePdfActions';
import PdfPreviewModal from '../../../components/print/PdfPreviewModal';

const statusColors = {
  brouillon: 'secondary',
  confirmee: 'primary',
  en_preparation: 'info',
  en_cours: 'info',
  partiellement_livree: 'warning',
  livree: 'success',
  annulee: 'danger',
};

const statusLabels = {
  brouillon: 'Brouillon',
  confirmee: 'Confirmee',
  en_preparation: 'En preparation',
  en_cours: 'En cours',
  partiellement_livree: 'Partiellement livree',
  livree: 'Livree',
  annulee: 'Annulee',
};

const CommandeDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [livraisonModalOpen, setLivraisonModalOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');

  usePageTitle('Detail de la commande', [
    { label: 'Accueil', path: '/' },
    { label: 'Ventes', path: '#' },
    { label: 'Commandes', path: '/ventes/commandes' },
    { label: 'Detail', path: '#' },
  ]);

  const { data, isLoading, isError, error } = useGetCommandeQuery(id);
  const [deleteCommande, { isLoading: isDeleting }] = useDeleteCommandeMutation();
  const [updateStatus, { isLoading: isUpdatingStatus }] = useUpdateCommandeStatusMutation();
  const [generateLivraison, { isLoading: isGenerating }] = useGenerateLivraisonMutation();

  const { downloadPdf, printPdf, previewPdf, closePreview, previewUrl, isLoading: isPdfLoading } = usePdfActions();

  const handleDelete = async () => {
    try {
      await deleteCommande(id).unwrap();
      toast.success('Commande supprimee avec succes');
      navigate('/ventes/commandes');
    } catch (err) {
      toast.error(err?.data?.message || 'Erreur lors de la suppression');
    }
  };

  const handleUpdateStatus = async () => {
    try {
      await updateStatus({ id, status: newStatus }).unwrap();
      toast.success('Statut mis a jour avec succes');
      setStatusModalOpen(false);
      setNewStatus('');
    } catch (err) {
      toast.error(err?.data?.message || 'Erreur lors de la mise a jour');
    }
  };

  const handleGenerateLivraison = async () => {
    try {
      const result = await generateLivraison(id).unwrap();
      toast.success('Bon de livraison genere avec succes');
      setLivraisonModalOpen(false);
      if (result?.data?.bonLivraison?._id) {
        navigate(`/ventes/bons-livraison/${result.data.bonLivraison._id}`);
      }
    } catch (err) {
      toast.error(err?.data?.message || 'Erreur lors de la generation');
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2 text-muted">Chargement de la commande...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <Alert variant="danger">
        Erreur lors du chargement de la commande: {error?.data?.message || error?.message}
      </Alert>
    );
  }

  const commande = data?.data;

  if (!commande) {
    return <Alert variant="warning">Commande non trouvee</Alert>;
  }

  const calculateLigne = (ligne) => {
    const ht = Math.round(ligne.quantite * ligne.prixUnitaire * (1 - ligne.remise / 100));
    const tva = Math.round((ht * ligne.tauxTVA) / 100);
    return { ht, tva, ttc: ht + tva };
  };

  const statut = commande.statut || commande.status;
  const pdfPath = `/commandes/${id}/pdf`;
  const pdfFilename = `BC-${commande.numero || id}.pdf`;

  return (
    <>
      <div className="page-header d-flex justify-content-between align-items-center mb-4">
        <div>
          <Button
            variant="link"
            className="p-0 me-3 text-decoration-none"
            onClick={() => navigate('/ventes/commandes')}
          >
            <FiArrowLeft className="me-2" />
            Retour
          </Button>
          <h1 className="d-inline-block ms-2">Commande {commande.numero}</h1>
        </div>
        <div>
          {statut === 'brouillon' && (
            <>
              <Button
                variant="warning"
                className="me-2"
                onClick={() => navigate(`/ventes/commandes/${id}/modifier`)}
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
          <Button
            variant="info"
            className="me-2"
            onClick={() => {
              setNewStatus(statut);
              setStatusModalOpen(true);
            }}
          >
            Changer statut
          </Button>
          {statut === 'confirmee' && (
            <Button variant="success" className="me-2" onClick={() => setLivraisonModalOpen(true)}>
              <FiTruck className="me-2" />
              Generer bon de livraison
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
                <h6 className="mb-0">Informations de la commande</h6>
                <Badge bg={statusColors[statut] || 'secondary'}>{statusLabels[statut] || statut}</Badge>
              </div>
            </Card.Header>
            <Card.Body>
              <Row className="mb-3">
                <Col md={6}>
                  <p className="mb-2">
                    <strong>Numero:</strong> {commande.numero}
                  </p>
                  <p className="mb-2">
                    <strong>Date:</strong> {formatDate(commande.dateCommande || commande.date)}
                  </p>
                  {commande.devis && (
                    <p className="mb-2">
                      <strong>Devis lie:</strong>{' '}
                      <Button
                        variant="link"
                        size="sm"
                        className="p-0"
                        onClick={() => navigate(`/ventes/devis/${commande.devis._id}`)}
                      >
                        {commande.devis.numero}
                      </Button>
                    </p>
                  )}
                </Col>
                <Col md={6}>
                  {commande.conditionsPaiement && (
                    <p className="mb-2">
                      <strong>Conditions de paiement:</strong>
                      <br />
                      {commande.conditionsPaiement}
                    </p>
                  )}
                </Col>
              </Row>
              {commande.notes && (
                <div>
                  <strong>Notes:</strong>
                  <p className="text-muted mb-0">{commande.notes}</p>
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
              {commande.clientSnapshot ? (
                <>
                  <h6 className="mb-2">{commande.clientSnapshot.displayName}</h6>
                  <p className="mb-1 small text-muted">
                    <strong>Email:</strong> {commande.clientSnapshot.email || 'N/A'}
                  </p>
                  <p className="mb-1 small text-muted">
                    <strong>Tel:</strong> {commande.clientSnapshot.phone || 'N/A'}
                  </p>
                </>
              ) : commande.client ? (
                <>
                  <h6 className="mb-2">{commande.client.displayName || commande.client.nom}</h6>
                  <p className="mb-1 small text-muted">
                    <strong>Email:</strong> {commande.client.email || 'N/A'}
                  </p>
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
          <h6 className="mb-0">Lignes de la commande</h6>
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
              {commande.lignes?.map((ligne, index) => {
                const calc = calculateLigne(ligne);
                return (
                  <tr key={index}>
                    <td>
                      {ligne.designation}
                      {ligne.reference && (
                        <small className="text-muted d-block">Ref: {ligne.reference}</small>
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
                <strong>{formatMoney(commande.totalHT)}</strong>
              </div>
              {commande.remiseGlobale > 0 && (
                <div className="d-flex justify-content-between mb-2 text-muted">
                  <span>Remise globale ({commande.remiseGlobale}%):</span>
                  <span>
                    -{formatMoney(Math.round((commande.totalHT * commande.remiseGlobale) / 100))}
                  </span>
                </div>
              )}
              <div className="d-flex justify-content-between mb-2">
                <span>Total TVA:</span>
                <strong>{formatMoney(commande.totalTVA)}</strong>
              </div>
              <hr />
              <div className="d-flex justify-content-between">
                <strong>Total TTC:</strong>
                <h4 className="text-primary mb-0">{formatMoney(commande.totalTTC)}</h4>
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
          Etes-vous sur de vouloir supprimer la commande <strong>{commande.numero}</strong> ? Cette
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

      <Modal show={statusModalOpen} onHide={() => setStatusModalOpen(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Changer le statut</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Nouveau statut</Form.Label>
            <Form.Select value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
              <option value="brouillon">Brouillon</option>
              <option value="confirmee">Confirmee</option>
              <option value="en_cours">En cours</option>
              <option value="partiellement_livree">Partiellement livree</option>
              <option value="livree">Livree</option>
              <option value="annulee">Annulee</option>
            </Form.Select>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setStatusModalOpen(false)}>
            Annuler
          </Button>
          <Button variant="primary" onClick={handleUpdateStatus} disabled={isUpdatingStatus}>
            {isUpdatingStatus ? 'Mise a jour...' : 'Mettre a jour'}
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={livraisonModalOpen} onHide={() => setLivraisonModalOpen(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Generer bon de livraison</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Voulez-vous generer un bon de livraison pour la commande <strong>{commande.numero}</strong> ?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setLivraisonModalOpen(false)}>
            Annuler
          </Button>
          <Button variant="success" onClick={handleGenerateLivraison} disabled={isGenerating}>
            {isGenerating ? 'Generation...' : 'Generer'}
          </Button>
        </Modal.Footer>
      </Modal>

      <PdfPreviewModal
        show={!!previewUrl}
        onHide={closePreview}
        blobUrl={previewUrl}
        documentTitle={commande.numero}
        onDownload={() => downloadPdf(pdfPath, pdfFilename)}
        onPrint={() => printPdf(pdfPath)}
      />
    </>
  );
};

export default CommandeDetailPage;
