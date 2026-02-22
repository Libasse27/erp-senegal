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
import { FiPlus, FiEye, FiEdit2, FiTrash2, FiSearch, FiCheck, FiX } from 'react-icons/fi';
import { toast } from 'react-toastify';
import usePageTitle from '../../hooks/usePageTitle';
import { formatMoney, formatDate } from '../../utils/formatters';
import {
  useGetPaymentsQuery,
  useDeletePaymentMutation,
  useValidatePaymentMutation,
  useCancelPaymentMutation,
} from '../../redux/api/paymentsApi';

const PaymentsListPage = () => {
  usePageTitle('Paiements', [
    { label: 'Accueil', path: '/' },
    { label: 'Paiements' },
  ]);

  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [typePaiement, setTypePaiement] = useState('');
  const [modePaiement, setModePaiement] = useState('');
  const [statut, setStatut] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const queryParams = {
    page,
    limit: 25,
    search,
    ...(typePaiement && { typePaiement }),
    ...(modePaiement && { modePaiement }),
    ...(statut && { statut }),
    ...(dateFrom && { dateFrom }),
    ...(dateTo && { dateTo }),
  };

  const { data, isLoading, error } = useGetPaymentsQuery(queryParams);
  const [deletePayment] = useDeletePaymentMutation();
  const [validatePayment] = useValidatePaymentMutation();
  const [cancelPayment] = useCancelPaymentMutation();

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleDelete = async (id, numero) => {
    if (window.confirm(`Etes-vous sur de vouloir supprimer le paiement "${numero}" ?`)) {
      try {
        await deletePayment(id).unwrap();
        toast.success('Paiement supprime avec succes');
      } catch (err) {
        toast.error(err.data?.message || 'Erreur lors de la suppression');
      }
    }
  };

  const handleValidate = async (id, numero) => {
    if (window.confirm(`Etes-vous sur de vouloir valider le paiement "${numero}" ?`)) {
      try {
        await validatePayment(id).unwrap();
        toast.success('Paiement valide avec succes');
      } catch (err) {
        toast.error(err.data?.message || 'Erreur lors de la validation');
      }
    }
  };

  const handleCancel = async (id, numero) => {
    if (window.confirm(`Etes-vous sur de vouloir annuler le paiement "${numero}" ?`)) {
      try {
        await cancelPayment(id).unwrap();
        toast.success('Paiement annule avec succes');
      } catch (err) {
        toast.error(err.data?.message || 'Erreur lors de l\'annulation');
      }
    }
  };

  const getStatutBadge = (statut) => {
    switch (statut) {
      case 'brouillon':
        return <Badge bg="secondary">Brouillon</Badge>;
      case 'valide':
        return <Badge bg="success">Valide</Badge>;
      case 'annule':
        return <Badge bg="danger">Annule</Badge>;
      default:
        return <Badge bg="light">{statut}</Badge>;
    }
  };

  const getTypeBadge = (type) => {
    return type === 'client' ? (
      <Badge bg="primary">Client</Badge>
    ) : (
      <Badge bg="warning">Fournisseur</Badge>
    );
  };

  const getModeLabel = (mode) => {
    const labels = {
      especes: 'Especes',
      cheque: 'Cheque',
      virement: 'Virement',
      orange_money: 'Orange Money',
      wave: 'Wave',
      carte_bancaire: 'Carte bancaire',
    };
    return labels[mode] || mode;
  };

  const payments = data?.data || [];
  const meta = data?.meta;

  return (
    <>
      <div className="page-header">
        <h1>Gestion des Paiements</h1>
        <Button
          variant="primary"
          onClick={() => navigate('/paiements/nouveau')}
          className="d-flex align-items-center gap-2"
        >
          <FiPlus size={18} />
          Nouveau Paiement
        </Button>
      </div>

      <Card className="shadow-sm">
        <Card.Body>
          <Row className="mb-3 g-3">
            <Col md={4}>
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
                    placeholder="Rechercher par numero, reference..."
                    value={search}
                    onChange={handleSearch}
                    style={{ paddingLeft: 40 }}
                  />
                </div>
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Select value={typePaiement} onChange={(e) => { setTypePaiement(e.target.value); setPage(1); }}>
                <option value="">Tous les types</option>
                <option value="client">Client</option>
                <option value="fournisseur">Fournisseur</option>
              </Form.Select>
            </Col>
            <Col md={2}>
              <Form.Select value={modePaiement} onChange={(e) => { setModePaiement(e.target.value); setPage(1); }}>
                <option value="">Tous les modes</option>
                <option value="especes">Especes</option>
                <option value="cheque">Cheque</option>
                <option value="virement">Virement</option>
                <option value="orange_money">Orange Money</option>
                <option value="wave">Wave</option>
                <option value="carte_bancaire">Carte bancaire</option>
              </Form.Select>
            </Col>
            <Col md={2}>
              <Form.Select value={statut} onChange={(e) => { setStatut(e.target.value); setPage(1); }}>
                <option value="">Tous les statuts</option>
                <option value="brouillon">Brouillon</option>
                <option value="valide">Valide</option>
                <option value="annule">Annule</option>
              </Form.Select>
            </Col>
            <Col md={2}>
              <Form.Control
                type="date"
                placeholder="Date debut"
                value={dateFrom}
                onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
              />
            </Col>
            <Col md={2}>
              <Form.Control
                type="date"
                placeholder="Date fin"
                value={dateTo}
                onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
              />
            </Col>
          </Row>

          {isLoading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2 text-muted">Chargement...</p>
            </div>
          ) : error ? (
            <Alert variant="danger">
              Erreur lors du chargement des paiements: {error.data?.message || error.message}
            </Alert>
          ) : payments.length === 0 ? (
            <Alert variant="info">
              Aucun paiement trouve. Cliquez sur "Nouveau Paiement" pour en ajouter un.
            </Alert>
          ) : (
            <>
              <div className="table-responsive">
                <Table hover className="mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Numero</th>
                      <th>Type</th>
                      <th>Tiers</th>
                      <th>Date</th>
                      <th className="text-end">Montant</th>
                      <th>Mode</th>
                      <th>Statut</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment) => (
                      <tr key={payment._id}>
                        <td>
                          <strong>{payment.numero}</strong>
                        </td>
                        <td>{getTypeBadge(payment.typePaiement)}</td>
                        <td>
                          {payment.client
                            ? payment.client.type === 'entreprise'
                              ? payment.client.raisonSociale
                              : `${payment.client.firstName} ${payment.client.lastName}`
                            : payment.fournisseur?.nom || '-'}
                        </td>
                        <td>{formatDate(payment.datePaiement)}</td>
                        <td className="text-end">
                          <strong>{formatMoney(payment.montant)}</strong>
                        </td>
                        <td>{getModeLabel(payment.modePaiement)}</td>
                        <td>{getStatutBadge(payment.statut)}</td>
                        <td className="text-end">
                          <Button
                            variant="outline-info"
                            size="sm"
                            className="me-2"
                            onClick={() => navigate(`/paiements/${payment._id}`)}
                          >
                            <FiEye size={14} />
                          </Button>
                          {payment.statut === 'brouillon' && (
                            <>
                              <Button
                                variant="outline-primary"
                                size="sm"
                                className="me-2"
                                onClick={() => navigate(`/paiements/${payment._id}/modifier`)}
                              >
                                <FiEdit2 size={14} />
                              </Button>
                              <Button
                                variant="outline-success"
                                size="sm"
                                className="me-2"
                                onClick={() => handleValidate(payment._id, payment.numero)}
                              >
                                <FiCheck size={14} />
                              </Button>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => handleDelete(payment._id, payment.numero)}
                              >
                                <FiTrash2 size={14} />
                              </Button>
                            </>
                          )}
                          {payment.statut === 'valide' && (
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => handleCancel(payment._id, payment.numero)}
                            >
                              <FiX size={14} />
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>

              {meta && (
                <div className="d-flex justify-content-between align-items-center mt-3">
                  <small className="text-muted">
                    Affichage {(meta.page - 1) * meta.limit + 1} - {Math.min(meta.page * meta.limit, meta.total)} sur {meta.total}
                  </small>
                  <BsPagination>
                    <BsPagination.Prev
                      disabled={!meta.hasPrevPage}
                      onClick={() => handlePageChange(page - 1)}
                    />
                    {[...Array(Math.min(meta.totalPages, 10))].map((_, i) => (
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

export default PaymentsListPage;
