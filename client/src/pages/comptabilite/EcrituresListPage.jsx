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
import Modal from 'react-bootstrap/Modal';
import BsPagination from 'react-bootstrap/Pagination';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiEye, FiCheck, FiX } from 'react-icons/fi';
import { toast } from 'react-toastify';
import usePageTitle from '../../hooks/usePageTitle';
import { formatMoney, formatDate } from '../../utils/formatters';
import {
  useGetEcrituresQuery,
  useDeleteEcritureMutation,
  useValidateEcritureMutation,
  useContrepasserEcritureMutation
} from '../../redux/api/comptabiliteApi';

const JOURNAL_LABELS = {
  VE: 'Ventes',
  AC: 'Achats',
  BQ: 'Banque',
  CA: 'Caisse',
  OD: 'Operations Diverses'
};

const JOURNAL_VARIANTS = {
  VE: 'success',
  AC: 'warning',
  BQ: 'info',
  CA: 'primary',
  OD: 'secondary'
};

export default function EcrituresListPage() {
  const navigate = useNavigate();

  usePageTitle('Ecritures Comptables', [
    { label: 'Accueil', path: '/' },
    { label: 'Comptabilite' },
    { label: 'Ecritures' }
  ]);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [journalFilter, setJournalFilter] = useState('');
  const [statutFilter, setStatutFilter] = useState('');
  const [dateDebutFilter, setDateDebutFilter] = useState('');
  const [dateFinFilter, setDateFinFilter] = useState('');
  const [showValidateModal, setShowValidateModal] = useState(false);
  const [showContrepasserModal, setShowContrepasserModal] = useState(false);
  const [selectedEcriture, setSelectedEcriture] = useState(null);

  const queryParams = {
    page,
    limit: 25,
    search,
    journal: journalFilter,
    statut: statutFilter,
    dateDebut: dateDebutFilter,
    dateFin: dateFinFilter
  };

  const { data, isLoading, error } = useGetEcrituresQuery(queryParams);
  const [deleteEcriture, { isLoading: isDeleting }] = useDeleteEcritureMutation();
  const [validateEcriture, { isLoading: isValidating }] = useValidateEcritureMutation();
  const [contrepasserEcriture, { isLoading: isContrepassing }] = useContrepasserEcritureMutation();

  const handleDelete = async (id) => {
    if (!window.confirm('Etes-vous sur de vouloir supprimer cette ecriture ?')) {
      return;
    }

    try {
      await deleteEcriture(id).unwrap();
      toast.success('Ecriture supprimee avec succes');
    } catch (err) {
      toast.error(err.data?.message || 'Erreur lors de la suppression');
    }
  };

  const handleOpenValidateModal = (ecriture) => {
    setSelectedEcriture(ecriture);
    setShowValidateModal(true);
  };

  const handleValidate = async () => {
    try {
      await validateEcriture(selectedEcriture._id).unwrap();
      toast.success('Ecriture validee avec succes');
      setShowValidateModal(false);
      setSelectedEcriture(null);
    } catch (err) {
      toast.error(err.data?.message || 'Erreur lors de la validation');
    }
  };

  const handleOpenContrepasserModal = (ecriture) => {
    setSelectedEcriture(ecriture);
    setShowContrepasserModal(true);
  };

  const handleContrepasser = async () => {
    try {
      await contrepasserEcriture(selectedEcriture._id).unwrap();
      toast.success('Ecriture contrepassee avec succes');
      setShowContrepasserModal(false);
      setSelectedEcriture(null);
    } catch (err) {
      toast.error(err.data?.message || 'Erreur lors de la contrepassation');
    }
  };

  const calculateTotals = (lignes) => {
    return lignes.reduce((acc, ligne) => ({
      debit: acc.debit + ligne.debit,
      credit: acc.credit + ligne.credit
    }), { debit: 0, credit: 0 });
  };

  const renderPagination = () => {
    if (!data?.meta) return null;

    const { currentPage, totalPages } = data.meta;
    const items = [];

    items.push(
      <BsPagination.Prev
        key="prev"
        disabled={currentPage === 1}
        onClick={() => setPage(currentPage - 1)}
      />
    );

    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - 2 && i <= currentPage + 2)
      ) {
        items.push(
          <BsPagination.Item
            key={i}
            active={i === currentPage}
            onClick={() => setPage(i)}
          >
            {i}
          </BsPagination.Item>
        );
      } else if (i === currentPage - 3 || i === currentPage + 3) {
        items.push(<BsPagination.Ellipsis key={`ellipsis-${i}`} />);
      }
    }

    items.push(
      <BsPagination.Next
        key="next"
        disabled={currentPage === totalPages}
        onClick={() => setPage(currentPage + 1)}
      />
    );

    return <BsPagination>{items}</BsPagination>;
  };

  if (isLoading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Chargement...</p>
      </div>
    );
  }

  if (error) {
    return <Alert variant="danger">Erreur: {error.data?.message || error.message}</Alert>;
  }

  return (
    <div>
      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Ecritures Comptables</h5>
          <Button
            variant="primary"
            onClick={() => navigate('/comptabilite/ecritures/nouveau')}
          >
            <FiPlus className="me-2" />
            Nouvelle Ecriture
          </Button>
        </Card.Header>
        <Card.Body>
          <Row className="mb-3">
            <Col md={3}>
              <Form.Group>
                <div className="position-relative">
                  <FiSearch className="position-absolute" style={{ left: '10px', top: '12px' }} />
                  <Form.Control
                    type="text"
                    placeholder="Rechercher..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ paddingLeft: '35px' }}
                  />
                </div>
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Select value={journalFilter} onChange={(e) => setJournalFilter(e.target.value)}>
                <option value="">Tous les journaux</option>
                {Object.entries(JOURNAL_LABELS).map(([code, label]) => (
                  <option key={code} value={code}>
                    {code} - {label}
                  </option>
                ))}
              </Form.Select>
            </Col>
            <Col md={2}>
              <Form.Select value={statutFilter} onChange={(e) => setStatutFilter(e.target.value)}>
                <option value="">Tous les statuts</option>
                <option value="brouillon">Brouillon</option>
                <option value="validee">Validee</option>
              </Form.Select>
            </Col>
            <Col md={2}>
              <Form.Control
                type="date"
                value={dateDebutFilter}
                onChange={(e) => setDateDebutFilter(e.target.value)}
                placeholder="Date debut"
              />
            </Col>
            <Col md={2}>
              <Form.Control
                type="date"
                value={dateFinFilter}
                onChange={(e) => setDateFinFilter(e.target.value)}
                placeholder="Date fin"
              />
            </Col>
            <Col md={1}>
              <Button
                variant="outline-secondary"
                onClick={() => {
                  setSearch('');
                  setJournalFilter('');
                  setStatutFilter('');
                  setDateDebutFilter('');
                  setDateFinFilter('');
                  setPage(1);
                }}
              >
                <FiX />
              </Button>
            </Col>
          </Row>

          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>Numero</th>
                <th>Date</th>
                <th>Journal</th>
                <th>Libelle</th>
                <th className="text-end">Debit</th>
                <th className="text-end">Credit</th>
                <th>Statut</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {!data?.data || data.data.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center text-muted">
                    Aucune ecriture trouvee
                  </td>
                </tr>
              ) : (
                data.data.map(ecriture => {
                  const totals = calculateTotals(ecriture.lignes);
                  return (
                    <tr key={ecriture._id}>
                      <td><strong>{ecriture.numero}</strong></td>
                      <td>{formatDate(ecriture.date)}</td>
                      <td>
                        <Badge bg={JOURNAL_VARIANTS[ecriture.journal]}>
                          {ecriture.journal}
                        </Badge>
                      </td>
                      <td>{ecriture.libelle}</td>
                      <td className="text-end">{formatMoney(totals.debit)}</td>
                      <td className="text-end">{formatMoney(totals.credit)}</td>
                      <td>
                        <Badge bg={ecriture.statut === 'validee' ? 'success' : 'secondary'}>
                          {ecriture.statut}
                        </Badge>
                      </td>
                      <td className="text-center">
                        <Button
                          variant="outline-info"
                          size="sm"
                          className="me-1"
                          onClick={() => navigate(`/comptabilite/ecritures/${ecriture._id}`)}
                        >
                          <FiEye />
                        </Button>
                        {ecriture.statut === 'brouillon' && (
                          <>
                            <Button
                              variant="outline-primary"
                              size="sm"
                              className="me-1"
                              onClick={() => navigate(`/comptabilite/ecritures/${ecriture._id}/modifier`)}
                            >
                              <FiEdit2 />
                            </Button>
                            <Button
                              variant="outline-success"
                              size="sm"
                              className="me-1"
                              onClick={() => handleOpenValidateModal(ecriture)}
                            >
                              <FiCheck />
                            </Button>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => handleDelete(ecriture._id)}
                              disabled={isDeleting}
                            >
                              <FiTrash2 />
                            </Button>
                          </>
                        )}
                        {ecriture.statut === 'validee' && (
                          <Button
                            variant="outline-warning"
                            size="sm"
                            onClick={() => handleOpenContrepasserModal(ecriture)}
                          >
                            <FiX className="me-1" />
                            Contrepasser
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </Table>

          {data?.meta && (
            <div className="d-flex justify-content-between align-items-center mt-3">
              <div className="text-muted">
                Affichage de {data.meta.currentPage * data.meta.limit - data.meta.limit + 1} a{' '}
                {Math.min(data.meta.currentPage * data.meta.limit, data.meta.total)} sur{' '}
                {data.meta.total} resultats
              </div>
              {renderPagination()}
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Validate Modal */}
      <Modal show={showValidateModal} onHide={() => setShowValidateModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Valider l'ecriture</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Etes-vous sur de vouloir valider cette ecriture ?</p>
          {selectedEcriture && (
            <div className="bg-light p-3 rounded">
              <strong>Numero:</strong> {selectedEcriture.numero}<br />
              <strong>Libelle:</strong> {selectedEcriture.libelle}<br />
              <strong>Date:</strong> {formatDate(selectedEcriture.date)}
            </div>
          )}
          <Alert variant="warning" className="mt-3 mb-0">
            Une fois validee, cette ecriture ne pourra plus etre modifiee ou supprimee.
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowValidateModal(false)}>
            Annuler
          </Button>
          <Button variant="success" onClick={handleValidate} disabled={isValidating}>
            {isValidating ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Validation...
              </>
            ) : (
              'Valider'
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Contrepasser Modal */}
      <Modal show={showContrepasserModal} onHide={() => setShowContrepasserModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Contrepasser l'ecriture</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Etes-vous sur de vouloir contrepasser cette ecriture ?</p>
          {selectedEcriture && (
            <div className="bg-light p-3 rounded">
              <strong>Numero:</strong> {selectedEcriture.numero}<br />
              <strong>Libelle:</strong> {selectedEcriture.libelle}<br />
              <strong>Date:</strong> {formatDate(selectedEcriture.date)}
            </div>
          )}
          <Alert variant="info" className="mt-3 mb-0">
            Une ecriture inverse sera creee automatiquement pour annuler cette operation.
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowContrepasserModal(false)}>
            Annuler
          </Button>
          <Button variant="warning" onClick={handleContrepasser} disabled={isContrepassing}>
            {isContrepassing ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Contrepassation...
              </>
            ) : (
              'Contrepasser'
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
