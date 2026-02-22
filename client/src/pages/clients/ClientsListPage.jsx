import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from 'react-bootstrap/Card';
import Table from 'react-bootstrap/Table';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Badge from 'react-bootstrap/Badge';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import BsPagination from 'react-bootstrap/Pagination';
import { FiPlus, FiEdit2, FiTrash2, FiSearch } from 'react-icons/fi';
import { toast } from 'react-toastify';
import usePageTitle from '../../hooks/usePageTitle';
import {
  useGetClientsQuery,
  useDeleteClientMutation,
} from '../../redux/api/clientsApi';

const ClientsListPage = () => {
  usePageTitle('Clients', [
    { label: 'Accueil', path: '/' },
    { label: 'Clients' },
  ]);

  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [segmentFilter, setSegmentFilter] = useState('');

  const queryParams = {
    page,
    limit: 25,
    search,
    ...(segmentFilter && { segment: segmentFilter }),
  };

  const { data, isLoading, error } = useGetClientsQuery(queryParams);
  const [deleteClient] = useDeleteClientMutation();

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleSegmentFilter = (e) => {
    setSegmentFilter(e.target.value);
    setPage(1);
  };

  const handleDelete = async (id, name) => {
    if (
      window.confirm(
        `Etes-vous sur de vouloir supprimer le client "${name}" ?`
      )
    ) {
      try {
        await deleteClient(id).unwrap();
        toast.success('Client supprime avec succes');
      } catch (err) {
        toast.error(err.data?.message || 'Erreur lors de la suppression');
      }
    }
  };

  const getSegmentBadgeVariant = (segment) => {
    switch (segment) {
      case 'A':
        return 'success';
      case 'B':
        return 'warning';
      case 'C':
        return 'secondary';
      default:
        return 'light';
    }
  };

  const clients = data?.data || [];
  const meta = data?.meta;

  return (
    <>
      <div className="page-header">
        <h1>Gestion des Clients</h1>
        <Button
          variant="primary"
          onClick={() => navigate('/clients/nouveau')}
          className="d-flex align-items-center gap-2"
        >
          <FiPlus size={18} />
          Nouveau Client
        </Button>
      </div>

      <Card className="shadow-sm">
        <Card.Body>
          <Row className="mb-3 g-3">
            <Col md={6}>
              <Form.Group>
                <div className="position-relative">
                  <FiSearch
                    className="position-absolute"
                    style={{
                      left: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#6c757d',
                    }}
                    size={18}
                  />
                  <Form.Control
                    type="text"
                    placeholder="Rechercher par nom, email, telephone..."
                    value={search}
                    onChange={handleSearch}
                    style={{ paddingLeft: 40 }}
                  />
                </div>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Select value={segmentFilter} onChange={handleSegmentFilter}>
                <option value="">Tous les segments</option>
                <option value="A">Segment A</option>
                <option value="B">Segment B</option>
                <option value="C">Segment C</option>
              </Form.Select>
            </Col>
          </Row>

          {isLoading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2 text-muted">Chargement...</p>
            </div>
          ) : error ? (
            <Alert variant="danger">
              Erreur lors du chargement des clients:{' '}
              {error.data?.message || error.message}
            </Alert>
          ) : clients.length === 0 ? (
            <Alert variant="info">
              Aucun client trouve. Cliquez sur "Nouveau Client" pour en ajouter
              un.
            </Alert>
          ) : (
            <>
              <div className="table-responsive">
                <Table hover className="mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Code</th>
                      <th>Nom / Raison Sociale</th>
                      <th>Email</th>
                      <th>Telephone</th>
                      <th>Segment</th>
                      <th>Ville</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clients.map((client) => (
                      <tr
                        key={client._id}
                        style={{ cursor: 'pointer' }}
                        onClick={() => navigate(`/clients/${client._id}`)}
                      >
                        <td>
                          <strong>{client.code}</strong>
                        </td>
                        <td>
                          {client.type === 'entreprise'
                            ? client.raisonSociale
                            : `${client.firstName} ${client.lastName}`}
                        </td>
                        <td>{client.email || '-'}</td>
                        <td>{client.phone || '-'}</td>
                        <td>
                          <Badge bg={getSegmentBadgeVariant(client.segment)}>
                            {client.segment || '-'}
                          </Badge>
                        </td>
                        <td>{client.address?.city || '-'}</td>
                        <td className="text-end" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            className="me-2"
                            onClick={() =>
                              navigate(`/clients/${client._id}/modifier`)
                            }
                          >
                            <FiEdit2 size={14} />
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() =>
                              handleDelete(
                                client._id,
                                client.type === 'entreprise'
                                  ? client.raisonSociale
                                  : `${client.firstName} ${client.lastName}`
                              )
                            }
                          >
                            <FiTrash2 size={14} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>

              {meta && (
                <div className="d-flex justify-content-between align-items-center mt-3">
                  <small className="text-muted">
                    Affichage {(meta.page - 1) * meta.limit + 1} -{' '}
                    {Math.min(meta.page * meta.limit, meta.total)} sur{' '}
                    {meta.total}
                  </small>
                  <BsPagination>
                    <BsPagination.Prev
                      disabled={!meta.hasPrevPage}
                      onClick={() => handlePageChange(page - 1)}
                    />
                    {[...Array(meta.totalPages)].map((_, i) => (
                      <BsPagination.Item
                        key={i + 1}
                        active={i + 1 === page}
                        onClick={() => handlePageChange(i + 1)}
                      >
                        {i + 1}
                      </BsPagination.Item>
                    ))}
                    <BsPagination.Next
                      disabled={!meta.hasNextPage}
                      onClick={() => handlePageChange(page + 1)}
                    />
                  </BsPagination>
                </div>
              )}
            </>
          )}
        </Card.Body>
      </Card>
    </>
  );
};

export default ClientsListPage;
