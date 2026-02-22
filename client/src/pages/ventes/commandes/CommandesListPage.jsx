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
  FiTruck,
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import usePageTitle from '../../../hooks/usePageTitle';
import usePagination from '../../../hooks/usePagination';
import { formatMoney, formatDate } from '../../../utils/formatters';
import {
  useGetCommandesQuery,
  useDeleteCommandeMutation,
  useGenerateLivraisonMutation,
} from '../../../redux/api/commandesApi';

const statusColors = {
  brouillon: 'secondary',
  confirmee: 'primary',
  en_preparation: 'info',
  livree: 'success',
  annulee: 'danger',
};

const statusLabels = {
  brouillon: 'Brouillon',
  confirmee: 'Confirmee',
  en_preparation: 'En preparation',
  livree: 'Livree',
  annulee: 'Annulee',
};

const CommandesListPage = () => {
  const navigate = useNavigate();
  const { page, limit, queryParams, handlePageChange } = usePagination(25);
  const [statusFilter, setStatusFilter] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [livraisonModalOpen, setLivraisonModalOpen] = useState(false);
  const [selectedCommande, setSelectedCommande] = useState(null);

  usePageTitle('Commandes', [
    { label: 'Accueil', path: '/' },
    { label: 'Ventes', path: '#' },
    { label: 'Commandes', path: '/ventes/commandes' },
  ]);

  const params = { ...queryParams, ...(statusFilter && { status: statusFilter }) };
  const { data, isLoading, isError, error } = useGetCommandesQuery(params);
  const [deleteCommande, { isLoading: isDeleting }] = useDeleteCommandeMutation();
  const [generateLivraison, { isLoading: isGenerating }] = useGenerateLivraisonMutation();

  const handleDelete = async () => {
    try {
      await deleteCommande(selectedCommande._id).unwrap();
      toast.success('Commande supprimee avec succes');
      setDeleteModalOpen(false);
      setSelectedCommande(null);
    } catch (err) {
      toast.error(err?.data?.message || 'Erreur lors de la suppression');
    }
  };

  const handleGenerateLivraison = async () => {
    try {
      const result = await generateLivraison(selectedCommande._id).unwrap();
      toast.success('Bon de livraison genere avec succes');
      setLivraisonModalOpen(false);
      setSelectedCommande(null);
      if (result?.data?.bonLivraison?._id) {
        navigate(`/ventes/bons-livraison/${result.data.bonLivraison._id}`);
      }
    } catch (err) {
      toast.error(err?.data?.message || 'Erreur lors de la generation');
    }
  };

  const openDeleteModal = (commande) => {
    setSelectedCommande(commande);
    setDeleteModalOpen(true);
  };

  const openLivraisonModal = (commande) => {
    setSelectedCommande(commande);
    setLivraisonModalOpen(true);
  };

  if (isError) {
    return (
      <Alert variant="danger">
        Erreur lors du chargement des commandes: {error?.data?.message || error?.message}
      </Alert>
    );
  }

  const commandesList = data?.data || [];
  const meta = data?.meta;

  return (
    <>
      <div className="page-header d-flex justify-content-between align-items-center mb-4">
        <h1>Commandes</h1>
        <Button variant="primary" onClick={() => navigate('/ventes/commandes/nouveau')}>
          <FiPlus className="me-2" />
          Nouvelle commande
        </Button>
      </div>

      <Card className="shadow-sm">
        <Card.Header className="bg-white">
          <Row className="align-items-center">
            <Col md={6}>
              <h6 className="mb-0">Liste des commandes</h6>
            </Col>
            <Col md={6}>
              <Form.Select
                size="sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">Tous les statuts</option>
                <option value="brouillon">Brouillon</option>
                <option value="confirmee">Confirmee</option>
                <option value="en_preparation">En preparation</option>
                <option value="livree">Livree</option>
                <option value="annulee">Annulee</option>
              </Form.Select>
            </Col>
          </Row>
        </Card.Header>
        <Card.Body>
          {isLoading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2 text-muted">Chargement des commandes...</p>
            </div>
          ) : commandesList.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <p>Aucune commande trouvee</p>
              <Button variant="primary" onClick={() => navigate('/ventes/commandes/nouveau')}>
                Creer votre premiere commande
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
                    <th className="text-end">Montant TTC</th>
                    <th>Statut</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {commandesList.map((commande) => (
                    <tr key={commande._id}>
                      <td>
                        <strong>{commande.numero}</strong>
                      </td>
                      <td>{commande.client?.nom || 'N/A'}</td>
                      <td>{formatDate(commande.date)}</td>
                      <td className="text-end">
                        <strong>{formatMoney(commande.totalTTC)}</strong>
                      </td>
                      <td>
                        <Badge bg={statusColors[commande.status]}>
                          {statusLabels[commande.status]}
                        </Badge>
                      </td>
                      <td className="text-end">
                        <Button
                          variant="link"
                          size="sm"
                          className="p-1 text-primary"
                          onClick={() => navigate(`/ventes/commandes/${commande._id}`)}
                          title="Voir"
                        >
                          <FiEye size={18} />
                        </Button>
                        {commande.status === 'brouillon' && (
                          <>
                            <Button
                              variant="link"
                              size="sm"
                              className="p-1 text-warning"
                              onClick={() => navigate(`/ventes/commandes/${commande._id}/modifier`)}
                              title="Modifier"
                            >
                              <FiEdit2 size={18} />
                            </Button>
                            <Button
                              variant="link"
                              size="sm"
                              className="p-1 text-danger"
                              onClick={() => openDeleteModal(commande)}
                              title="Supprimer"
                            >
                              <FiTrash2 size={18} />
                            </Button>
                          </>
                        )}
                        {commande.status === 'confirmee' && (
                          <Button
                            variant="link"
                            size="sm"
                            className="p-1 text-success"
                            onClick={() => openLivraisonModal(commande)}
                            title="Generer bon de livraison"
                          >
                            <FiTruck size={18} />
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
          Etes-vous sur de vouloir supprimer la commande <strong>{selectedCommande?.numero}</strong> ?
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

      <Modal show={livraisonModalOpen} onHide={() => setLivraisonModalOpen(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Generer bon de livraison</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Voulez-vous generer un bon de livraison pour la commande <strong>{selectedCommande?.numero}</strong> ?
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
    </>
  );
};

export default CommandesListPage;
