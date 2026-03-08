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
import { FiPlus, FiEye, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { toast } from 'react-toastify';
import usePageTitle from '../../hooks/usePageTitle';
import usePagination from '../../hooks/usePagination';
import { formatMoney, formatDate } from '../../utils/formatters';
import {
  useGetCommandesAchatQuery,
  useDeleteCommandeAchatMutation,
} from '../../redux/api/commandesAchatApi';

const statusColors = {
  brouillon: 'secondary',
  envoyee: 'info',
  confirmee: 'primary',
  partiellement_recue: 'warning',
  recue: 'success',
  annulee: 'danger',
};

const statusLabels = {
  brouillon: 'Brouillon',
  envoyee: 'Envoyee',
  confirmee: 'Confirmee',
  partiellement_recue: 'Partiellement recue',
  recue: 'Recue',
  annulee: 'Annulee',
};

const CommandesAchatListPage = () => {
  const navigate = useNavigate();
  const { page, queryParams, handlePageChange } = usePagination(25);
  const [statutFilter, setStatutFilter] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  usePageTitle('Commandes achat', [
    { label: 'Accueil', path: '/' },
    { label: 'Achats', path: '#' },
    { label: 'Commandes achat', path: '/achats/commandes' },
  ]);

  const params = { ...queryParams, ...(statutFilter && { statut: statutFilter }) };
  const { data, isLoading, isError, error } = useGetCommandesAchatQuery(params);
  const [deleteCommande, { isLoading: isDeleting }] = useDeleteCommandeAchatMutation();

  const handleDelete = async () => {
    try {
      await deleteCommande(selected._id).unwrap();
      toast.success('Commande achat supprimee avec succes');
      setDeleteModalOpen(false);
      setSelected(null);
    } catch (err) {
      toast.error(err?.data?.message || 'Erreur lors de la suppression');
    }
  };

  if (isError) {
    return (
      <Alert variant="danger">
        Erreur: {error?.data?.message || error?.message}
      </Alert>
    );
  }

  const list = data?.data || [];
  const meta = data?.meta;

  return (
    <>
      <div className="page-header d-flex justify-content-between align-items-center mb-4">
        <h1>Commandes achat</h1>
        <Button variant="primary" onClick={() => navigate('/achats/commandes/nouveau')}>
          <FiPlus className="me-2" />
          Nouvelle commande achat
        </Button>
      </div>

      <Card className="shadow-sm">
        <Card.Header className="bg-white">
          <Row className="align-items-center">
            <Col md={6}>
              <h6 className="mb-0">Liste des commandes achat</h6>
            </Col>
            <Col md={6}>
              <Form.Select
                size="sm"
                value={statutFilter}
                onChange={(e) => setStatutFilter(e.target.value)}
              >
                <option value="">Tous les statuts</option>
                <option value="brouillon">Brouillon</option>
                <option value="envoyee">Envoyee</option>
                <option value="confirmee">Confirmee</option>
                <option value="partiellement_recue">Partiellement recue</option>
                <option value="recue">Recue</option>
                <option value="annulee">Annulee</option>
              </Form.Select>
            </Col>
          </Row>
        </Card.Header>
        <Card.Body>
          {isLoading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2 text-muted">Chargement...</p>
            </div>
          ) : list.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <p>Aucune commande achat trouvee</p>
              <Button variant="primary" onClick={() => navigate('/achats/commandes/nouveau')}>
                Creer votre premiere commande achat
              </Button>
            </div>
          ) : (
            <>
              <Table responsive hover className="mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Numero</th>
                    <th>Fournisseur</th>
                    <th>Date</th>
                    <th>Reception prevue</th>
                    <th className="text-end">Montant TTC</th>
                    <th>Statut</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((cmd) => (
                    <tr key={cmd._id}>
                      <td>
                        <strong>{cmd.numero}</strong>
                      </td>
                      <td>
                        {cmd.fournisseurSnapshot?.raisonSociale ||
                          cmd.fournisseur?.raisonSociale ||
                          'N/A'}
                      </td>
                      <td>{formatDate(cmd.dateCommande)}</td>
                      <td>{cmd.dateReceptionPrevue ? formatDate(cmd.dateReceptionPrevue) : '—'}</td>
                      <td className="text-end">
                        <strong>{formatMoney(cmd.totalTTC)}</strong>
                      </td>
                      <td>
                        <Badge bg={statusColors[cmd.statut]}>
                          {statusLabels[cmd.statut]}
                        </Badge>
                      </td>
                      <td className="text-end">
                        <Button
                          variant="link"
                          size="sm"
                          className="p-1 text-primary"
                          onClick={() => navigate(`/achats/commandes/${cmd._id}`)}
                          title="Voir"
                        >
                          <FiEye size={18} />
                        </Button>
                        {cmd.statut === 'brouillon' && (
                          <>
                            <Button
                              variant="link"
                              size="sm"
                              className="p-1 text-warning"
                              onClick={() => navigate(`/achats/commandes/${cmd._id}/modifier`)}
                              title="Modifier"
                            >
                              <FiEdit2 size={18} />
                            </Button>
                            <Button
                              variant="link"
                              size="sm"
                              className="p-1 text-danger"
                              onClick={() => {
                                setSelected(cmd);
                                setDeleteModalOpen(true);
                              }}
                              title="Supprimer"
                            >
                              <FiTrash2 size={18} />
                            </Button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>

              {meta && (
                <div className="d-flex justify-content-between align-items-center mt-3">
                  <small className="text-muted">
                    Affichage {(meta.page - 1) * meta.limit + 1}-
                    {Math.min(meta.page * meta.limit, meta.total)} sur {meta.total}
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
          Etes-vous sur de vouloir supprimer la commande achat{' '}
          <strong>{selected?.numero}</strong> ? Cette action est irreversible.
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

export default CommandesAchatListPage;
