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
  FiSend,
  FiCheckCircle,
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import usePageTitle from '../../../hooks/usePageTitle';
import usePagination from '../../../hooks/usePagination';
import { formatMoney, formatDate } from '../../../utils/formatters';
import {
  useGetFacturesQuery,
  useDeleteFactureMutation,
  useValidateFactureMutation,
  useSendFactureMutation,
} from '../../../redux/api/facturesApi';

const statusColors = {
  brouillon: 'secondary',
  validee: 'primary',
  envoyee: 'info',
  payee_partiellement: 'warning',
  payee: 'success',
  annulee: 'danger',
};

const statusLabels = {
  brouillon: 'Brouillon',
  validee: 'Validee',
  envoyee: 'Envoyee',
  payee_partiellement: 'Payee partiellement',
  payee: 'Payee',
  annulee: 'Annulee',
};

const FacturesListPage = () => {
  const navigate = useNavigate();
  const { page, limit, queryParams, handlePageChange } = usePagination(25);
  const [statusFilter, setStatusFilter] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedFacture, setSelectedFacture] = useState(null);

  usePageTitle('Factures', [
    { label: 'Accueil', path: '/' },
    { label: 'Ventes', path: '#' },
    { label: 'Factures', path: '/ventes/factures' },
  ]);

  const params = { ...queryParams, ...(statusFilter && { status: statusFilter }) };
  const { data, isLoading, isError, error } = useGetFacturesQuery(params);
  const [deleteFacture, { isLoading: isDeleting }] = useDeleteFactureMutation();
  const [validateFacture, { isLoading: isValidating }] = useValidateFactureMutation();
  const [sendFacture, { isLoading: isSending }] = useSendFactureMutation();

  const handleDelete = async () => {
    try {
      await deleteFacture(selectedFacture._id).unwrap();
      toast.success('Facture supprimee avec succes');
      setDeleteModalOpen(false);
      setSelectedFacture(null);
    } catch (err) {
      toast.error(err?.data?.message || 'Erreur lors de la suppression');
    }
  };

  const handleValidate = async (id) => {
    try {
      await validateFacture(id).unwrap();
      toast.success('Facture validee avec succes');
    } catch (err) {
      toast.error(err?.data?.message || 'Erreur lors de la validation');
    }
  };

  const handleSend = async (id) => {
    try {
      await sendFacture(id).unwrap();
      toast.success('Facture envoyee au client avec succes');
    } catch (err) {
      toast.error(err?.data?.message || 'Erreur lors de l\'envoi');
    }
  };

  const openDeleteModal = (facture) => {
    setSelectedFacture(facture);
    setDeleteModalOpen(true);
  };

  if (isError) {
    return (
      <Alert variant="danger">
        Erreur lors du chargement des factures: {error?.data?.message || error?.message}
      </Alert>
    );
  }

  const facturesList = data?.data || [];
  const meta = data?.meta;

  return (
    <>
      <div className="page-header d-flex justify-content-between align-items-center mb-4">
        <h1>Factures</h1>
        <Button variant="primary" onClick={() => navigate('/ventes/factures/nouveau')}>
          <FiPlus className="me-2" />
          Nouvelle facture
        </Button>
      </div>

      <Card className="shadow-sm">
        <Card.Header className="bg-white">
          <Row className="align-items-center">
            <Col md={6}>
              <h6 className="mb-0">Liste des factures</h6>
            </Col>
            <Col md={6}>
              <Form.Select
                size="sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">Tous les statuts</option>
                <option value="brouillon">Brouillon</option>
                <option value="validee">Validee</option>
                <option value="envoyee">Envoyee</option>
                <option value="payee_partiellement">Payee partiellement</option>
                <option value="payee">Payee</option>
                <option value="annulee">Annulee</option>
              </Form.Select>
            </Col>
          </Row>
        </Card.Header>
        <Card.Body>
          {isLoading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2 text-muted">Chargement des factures...</p>
            </div>
          ) : facturesList.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <p>Aucune facture trouvee</p>
              <Button variant="primary" onClick={() => navigate('/ventes/factures/nouveau')}>
                Creer votre premiere facture
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
                    <th>Echeance</th>
                    <th className="text-end">Montant TTC</th>
                    <th className="text-end">Montant Paye</th>
                    <th className="text-end">Reste</th>
                    <th>Statut</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {facturesList.map((facture) => {
                    const reste = (facture.totalTTC || 0) - (facture.montantPaye || 0);
                    return (
                      <tr key={facture._id}>
                        <td>
                          <strong>{facture.numero}</strong>
                        </td>
                        <td>{facture.client?.nom || 'N/A'}</td>
                        <td>{formatDate(facture.date)}</td>
                        <td>{formatDate(facture.dateEcheance)}</td>
                        <td className="text-end">
                          <strong>{formatMoney(facture.totalTTC)}</strong>
                        </td>
                        <td className="text-end">
                          {formatMoney(facture.montantPaye || 0)}
                        </td>
                        <td className="text-end">
                          <Badge bg={reste === 0 ? 'success' : reste < facture.totalTTC ? 'warning' : 'danger'}>
                            {formatMoney(reste)}
                          </Badge>
                        </td>
                        <td>
                          <Badge bg={statusColors[facture.status]}>
                            {statusLabels[facture.status]}
                          </Badge>
                        </td>
                        <td className="text-end">
                          <Button
                            variant="link"
                            size="sm"
                            className="p-1 text-primary"
                            onClick={() => navigate(`/ventes/factures/${facture._id}`)}
                            title="Voir"
                          >
                            <FiEye size={18} />
                          </Button>
                          {facture.status === 'brouillon' && (
                            <>
                              <Button
                                variant="link"
                                size="sm"
                                className="p-1 text-warning"
                                onClick={() => navigate(`/ventes/factures/${facture._id}/modifier`)}
                                title="Modifier"
                              >
                                <FiEdit2 size={18} />
                              </Button>
                              <Button
                                variant="link"
                                size="sm"
                                className="p-1 text-danger"
                                onClick={() => openDeleteModal(facture)}
                                title="Supprimer"
                              >
                                <FiTrash2 size={18} />
                              </Button>
                              <Button
                                variant="link"
                                size="sm"
                                className="p-1 text-success"
                                onClick={() => handleValidate(facture._id)}
                                disabled={isValidating}
                                title="Valider"
                              >
                                <FiCheckCircle size={18} />
                              </Button>
                            </>
                          )}
                          {(facture.status === 'validee' || facture.status === 'envoyee') && (
                            <Button
                              variant="link"
                              size="sm"
                              className="p-1 text-info"
                              onClick={() => handleSend(facture._id)}
                              disabled={isSending}
                              title="Envoyer"
                            >
                              <FiSend size={18} />
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
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
          Etes-vous sur de vouloir supprimer la facture <strong>{selectedFacture?.numero}</strong> ?
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
    </>
  );
};

export default FacturesListPage;
