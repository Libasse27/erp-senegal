import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from 'react-bootstrap/Card';
import Table from 'react-bootstrap/Table';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Badge from 'react-bootstrap/Badge';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import Modal from 'react-bootstrap/Modal';
import Pagination from 'react-bootstrap/Pagination';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import {
  FiPlus,
  FiEye,
  FiEdit2,
  FiTrash2,
  FiRefreshCw,
  FiSend,
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import usePageTitle from '../../../hooks/usePageTitle';
import usePagination from '../../../hooks/usePagination';
import { formatMoney, formatDate } from '../../../utils/formatters';
import {
  useGetDevisQuery,
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

const DevisListPage = () => {
  const navigate = useNavigate();
  const { page, limit, queryParams, handlePageChange } = usePagination(25);
  const [statusFilter, setStatusFilter] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [convertModalOpen, setConvertModalOpen] = useState(false);
  const [selectedDevis, setSelectedDevis] = useState(null);

  usePageTitle('Devis', [
    { label: 'Accueil', path: '/' },
    { label: 'Ventes', path: '#' },
    { label: 'Devis', path: '/ventes/devis' },
  ]);

  const params = { ...queryParams, ...(statusFilter && { status: statusFilter }) };
  const { data, isLoading, isError, error } = useGetDevisQuery(params);
  const [deleteDevis, { isLoading: isDeleting }] = useDeleteDevisMutation();
  const [convertDevis, { isLoading: isConverting }] = useConvertDevisMutation();
  const [sendDevis, { isLoading: isSending }] = useSendDevisMutation();

  const handleDelete = async () => {
    try {
      await deleteDevis(selectedDevis._id).unwrap();
      toast.success('Devis supprime avec succes');
      setDeleteModalOpen(false);
      setSelectedDevis(null);
    } catch (err) {
      toast.error(err?.data?.message || 'Erreur lors de la suppression');
    }
  };

  const handleConvert = async () => {
    try {
      const result = await convertDevis(selectedDevis._id).unwrap();
      toast.success('Devis converti en commande avec succes');
      setConvertModalOpen(false);
      setSelectedDevis(null);
      if (result?.data?.commande?._id) {
        navigate(`/ventes/commandes/${result.data.commande._id}`);
      }
    } catch (err) {
      toast.error(err?.data?.message || 'Erreur lors de la conversion');
    }
  };

  const handleSend = async (id) => {
    try {
      await sendDevis(id).unwrap();
      toast.success('Devis envoye au client avec succes');
    } catch (err) {
      toast.error(err?.data?.message || 'Erreur lors de l\'envoi');
    }
  };

  const openDeleteModal = (devis) => {
    setSelectedDevis(devis);
    setDeleteModalOpen(true);
  };

  const openConvertModal = (devis) => {
    setSelectedDevis(devis);
    setConvertModalOpen(true);
  };

  if (isError) {
    return (
      <Alert variant="danger">
        Erreur lors du chargement des devis: {error?.data?.message || error?.message}
      </Alert>
    );
  }

  const devisList = data?.data || [];
  const meta = data?.meta;

  return (
    <>
      <div className="page-header d-flex justify-content-between align-items-center mb-4">
        <h1>Devis</h1>
        <Button variant="primary" onClick={() => navigate('/ventes/devis/nouveau')}>
          <FiPlus className="me-2" />
          Nouveau devis
        </Button>
      </div>

      <Card className="shadow-sm">
        <Card.Header className="bg-white">
          <Row className="align-items-center">
            <Col md={6}>
              <h6 className="mb-0">Liste des devis</h6>
            </Col>
            <Col md={6}>
              <Form.Select
                size="sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">Tous les statuts</option>
                <option value="brouillon">Brouillon</option>
                <option value="envoye">Envoye</option>
                <option value="accepte">Accepte</option>
                <option value="refuse">Refuse</option>
                <option value="expire">Expire</option>
                <option value="converti">Converti</option>
              </Form.Select>
            </Col>
          </Row>
        </Card.Header>
        <Card.Body>
          {isLoading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2 text-muted">Chargement des devis...</p>
            </div>
          ) : devisList.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <p>Aucun devis trouve</p>
              <Button variant="primary" onClick={() => navigate('/ventes/devis/nouveau')}>
                Creer votre premier devis
              </Button>
            </div>
          ) : (
            <>
              <Table responsive hover className="mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Numero</th>
                    <th>Client</th>
                    <th>Date</th>
                    <th>Validite</th>
                    <th className="text-end">Montant TTC</th>
                    <th>Statut</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {devisList.map((devis) => (
                    <tr key={devis._id}>
                      <td>
                        <strong>{devis.numero}</strong>
                      </td>
                      <td>{devis.client?.nom || 'N/A'}</td>
                      <td>{formatDate(devis.date)}</td>
                      <td>{formatDate(devis.dateValidite)}</td>
                      <td className="text-end">
                        <strong>{formatMoney(devis.totalTTC)}</strong>
                      </td>
                      <td>
                        <Badge bg={statusColors[devis.status]}>
                          {statusLabels[devis.status]}
                        </Badge>
                      </td>
                      <td className="text-end">
                        <Button
                          variant="link"
                          size="sm"
                          className="p-1 text-primary"
                          onClick={() => navigate(`/ventes/devis/${devis._id}`)}
                          title="Voir"
                        >
                          <FiEye size={18} />
                        </Button>
                        {devis.status === 'brouillon' && (
                          <>
                            <Button
                              variant="link"
                              size="sm"
                              className="p-1 text-warning"
                              onClick={() => navigate(`/ventes/devis/${devis._id}/modifier`)}
                              title="Modifier"
                            >
                              <FiEdit2 size={18} />
                            </Button>
                            <Button
                              variant="link"
                              size="sm"
                              className="p-1 text-danger"
                              onClick={() => openDeleteModal(devis)}
                              title="Supprimer"
                            >
                              <FiTrash2 size={18} />
                            </Button>
                          </>
                        )}
                        {(devis.status === 'brouillon' || devis.status === 'accepte') && (
                          <Button
                            variant="link"
                            size="sm"
                            className="p-1 text-info"
                            onClick={() => handleSend(devis._id)}
                            disabled={isSending}
                            title="Envoyer"
                          >
                            <FiSend size={18} />
                          </Button>
                        )}
                        {devis.status === 'accepte' && (
                          <Button
                            variant="link"
                            size="sm"
                            className="p-1 text-success"
                            onClick={() => openConvertModal(devis)}
                            title="Convertir en commande"
                          >
                            <FiRefreshCw size={18} />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>

              {meta && (
                <div className="d-flex justify-content-between align-items-center mt-3">
                  <small className="text-muted">
                    Affichage {((meta.page - 1) * meta.limit) + 1}-{Math.min(meta.page * meta.limit, meta.total)} sur {meta.total}
                  </small>
                  <Pagination>
                    <Pagination.Prev
                      disabled={!meta.hasPrevPage}
                      onClick={() => handlePageChange(page - 1)}
                    />
                    {[...Array(Math.min(meta.totalPages, 10))].map((_, i) => (
                      <Pagination.Item
                        key={i + 1}
                        active={i + 1 === page}
                        onClick={() => handlePageChange(i + 1)}
                      >
                        {i + 1}
                      </Pagination.Item>
                    ))}
                    <Pagination.Next
                      disabled={!meta.hasNextPage}
                      onClick={() => handlePageChange(page + 1)}
                    />
                  </Pagination>
                </div>
              )}
            </>
          )}
        </Card.Body>
      </Card>

      <Modal show={deleteModalOpen} onHide={() => setDeleteModalOpen(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirmer la suppression</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Etes-vous sur de vouloir supprimer le devis <strong>{selectedDevis?.numero}</strong> ?
          Cette action est irreversible.
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
          Voulez-vous convertir le devis <strong>{selectedDevis?.numero}</strong> en commande client ?
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

export default DevisListPage;
