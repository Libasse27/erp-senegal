import React, { useState } from 'react';
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
import { FiPlus, FiLock, FiAlertTriangle } from 'react-icons/fi';
import { toast } from 'react-toastify';
import usePageTitle from '../../hooks/usePageTitle';
import { formatDate } from '../../utils/formatters';
import {
  useGetExercicesQuery,
  useCreateExerciceMutation,
  useCloturerExerciceMutation,
} from '../../redux/api/comptabiliteApi';

const ExercicesPage = () => {
  usePageTitle('Exercices Comptables', [
    { label: 'Accueil', path: '/' },
    { label: 'Comptabilite' },
    { label: 'Exercices' },
  ]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showClotureModal, setShowClotureModal] = useState(false);
  const [selectedExercice, setSelectedExercice] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    libelle: '',
    dateDebut: '',
    dateFin: '',
  });

  const { data, isLoading, error } = useGetExercicesQuery();
  const [createExercice, { isLoading: isCreating }] = useCreateExerciceMutation();
  const [cloturerExercice, { isLoading: isCloturing }] = useCloturerExerciceMutation();

  const exercices = data?.data || [];

  const handleShowCreateModal = () => {
    setFormData({
      code: '',
      libelle: '',
      dateDebut: '',
      dateFin: '',
    });
    setShowCreateModal(true);
  };

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
  };

  const handleShowClotureModal = (exercice) => {
    setSelectedExercice(exercice);
    setShowClotureModal(true);
  };

  const handleCloseClotureModal = () => {
    setShowClotureModal(false);
    setSelectedExercice(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createExercice(formData).unwrap();
      toast.success('Exercice comptable cree avec succes');
      handleCloseCreateModal();
    } catch (err) {
      toast.error(err.data?.message || 'Erreur lors de la creation');
    }
  };

  const handleClotureConfirm = async () => {
    try {
      await cloturerExercice(selectedExercice._id).unwrap();
      toast.success('Exercice cloture avec succes');
      handleCloseClotureModal();
    } catch (err) {
      toast.error(err.data?.message || 'Erreur lors de la cloture');
    }
  };

  const getStatutBadgeVariant = (statut) => {
    switch (statut) {
      case 'ouvert':
        return 'success';
      case 'cloture':
        return 'secondary';
      default:
        return 'light';
    }
  };

  const getStatutLabel = (statut) => {
    switch (statut) {
      case 'ouvert':
        return 'Ouvert';
      case 'cloture':
        return 'Cloture';
      default:
        return statut;
    }
  };

  return (
    <>
      <div className="page-header">
        <h1>Exercices Comptables</h1>
        <Button
          variant="primary"
          onClick={handleShowCreateModal}
          className="d-flex align-items-center gap-2"
        >
          <FiPlus size={18} />
          Nouvel Exercice
        </Button>
      </div>

      <Card className="shadow-sm">
        <Card.Body>
          {isLoading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2 text-muted">Chargement...</p>
            </div>
          ) : error ? (
            <Alert variant="danger">
              Erreur lors du chargement des exercices: {error.data?.message || error.message}
            </Alert>
          ) : exercices.length === 0 ? (
            <Alert variant="info">
              Aucun exercice comptable trouve. Cliquez sur "Nouvel Exercice" pour en creer un.
            </Alert>
          ) : (
            <div className="table-responsive">
              <Table hover className="mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Code</th>
                    <th>Libelle</th>
                    <th>Date Debut</th>
                    <th>Date Fin</th>
                    <th>Statut</th>
                    <th className="text-center">Courant</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {exercices.map((exercice) => (
                    <tr key={exercice._id}>
                      <td>
                        <strong>{exercice.code}</strong>
                      </td>
                      <td>{exercice.libelle}</td>
                      <td>{formatDate(exercice.dateDebut)}</td>
                      <td>{formatDate(exercice.dateFin)}</td>
                      <td>
                        <Badge bg={getStatutBadgeVariant(exercice.statut)}>
                          {getStatutLabel(exercice.statut)}
                        </Badge>
                      </td>
                      <td className="text-center">
                        {exercice.isCurrent && <Badge bg="primary">Oui</Badge>}
                      </td>
                      <td className="text-end">
                        {exercice.statut === 'ouvert' && (
                          <Button
                            variant="outline-warning"
                            size="sm"
                            onClick={() => handleShowClotureModal(exercice)}
                          >
                            <FiLock size={14} className="me-1" />
                            Cloturer
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>

      <Modal show={showCreateModal} onHide={handleCloseCreateModal}>
        <Modal.Header closeButton>
          <Modal.Title>Nouvel Exercice Comptable</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row className="g-3">
              <Col md={12}>
                <Form.Group>
                  <Form.Label>
                    Code <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleInputChange}
                    placeholder="Ex: EX2026"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Group>
                  <Form.Label>
                    Libelle <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="libelle"
                    value={formData.libelle}
                    onChange={handleInputChange}
                    placeholder="Ex: Exercice 2026"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>
                    Date Debut <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="date"
                    name="dateDebut"
                    value={formData.dateDebut}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>
                    Date Fin <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="date"
                    name="dateFin"
                    value={formData.dateFin}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseCreateModal}>
              Annuler
            </Button>
            <Button variant="primary" type="submit" disabled={isCreating}>
              {isCreating ? (
                <>
                  <Spinner as="span" animation="border" size="sm" className="me-2" />
                  Creation...
                </>
              ) : (
                'Creer'
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <Modal show={showClotureModal} onHide={handleCloseClotureModal}>
        <Modal.Header closeButton>
          <Modal.Title className="d-flex align-items-center">
            <FiAlertTriangle className="me-2 text-warning" size={24} />
            Cloturer l'Exercice
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="warning" className="mb-3">
            <strong>Attention:</strong> La cloture est irreversible. Toutes les ecritures seront
            figees.
          </Alert>
          {selectedExercice && (
            <div>
              <p>
                Vous etes sur le point de cloturer l'exercice suivant:
              </p>
              <ul>
                <li>
                  <strong>Code:</strong> {selectedExercice.code}
                </li>
                <li>
                  <strong>Libelle:</strong> {selectedExercice.libelle}
                </li>
                <li>
                  <strong>Periode:</strong> {formatDate(selectedExercice.dateDebut)} au{' '}
                  {formatDate(selectedExercice.dateFin)}
                </li>
              </ul>
              <p className="mb-0">
                Cette action ne peut pas etre annulee. Voulez-vous continuer?
              </p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseClotureModal}>
            Annuler
          </Button>
          <Button variant="warning" onClick={handleClotureConfirm} disabled={isCloturing}>
            {isCloturing ? (
              <>
                <Spinner as="span" animation="border" size="sm" className="me-2" />
                Cloture en cours...
              </>
            ) : (
              <>
                <FiLock className="me-1" />
                Confirmer la Cloture
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default ExercicesPage;
