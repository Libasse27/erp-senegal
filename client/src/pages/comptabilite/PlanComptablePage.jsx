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
import { FiPlus, FiEdit2, FiTrash2, FiSearch } from 'react-icons/fi';
import { toast } from 'react-toastify';
import usePageTitle from '../../hooks/usePageTitle';
import { formatMoney } from '../../utils/formatters';
import {
  useGetPlanComptableQuery,
  useCreateCompteComptableMutation,
  useUpdateCompteComptableMutation,
  useDeleteCompteComptableMutation
} from '../../redux/api/comptabiliteApi';

const CLASSE_LABELS = {
  1: 'Comptes de capitaux',
  2: 'Immobilisations',
  3: 'Stocks',
  4: 'Tiers',
  5: 'Financiers',
  6: 'Charges',
  7: 'Produits',
  8: 'Comptes speciaux'
};

export default function PlanComptablePage() {
  usePageTitle('Plan Comptable', [
    { label: 'Accueil', path: '/' },
    { label: 'Comptabilite' },
    { label: 'Plan Comptable' }
  ]);

  const [search, setSearch] = useState('');
  const [classeFilter, setClasseFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCompte, setEditingCompte] = useState(null);
  const [formData, setFormData] = useState({
    numero: '',
    libelle: '',
    classe: '',
    type: 'debit',
    parent: ''
  });

  const { data: comptes, isLoading, error } = useGetPlanComptableQuery();
  const [createCompte, { isLoading: isCreating }] = useCreateCompteComptableMutation();
  const [updateCompte, { isLoading: isUpdating }] = useUpdateCompteComptableMutation();
  const [deleteCompte, { isLoading: isDeleting }] = useDeleteCompteComptableMutation();

  const handleOpenModal = (compte = null) => {
    if (compte) {
      setEditingCompte(compte);
      setFormData({
        numero: compte.numero,
        libelle: compte.libelle,
        classe: compte.classe,
        type: compte.type,
        parent: compte.parent?._id || ''
      });
    } else {
      setEditingCompte(null);
      setFormData({
        numero: '',
        libelle: '',
        classe: '',
        type: 'debit',
        parent: ''
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCompte(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };

      // Auto-detect classe from numero
      if (name === 'numero' && value.length > 0) {
        const firstChar = value.charAt(0);
        if (firstChar >= '1' && firstChar <= '8') {
          updated.classe = parseInt(firstChar);
        }
      }

      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const payload = {
        ...formData,
        classe: parseInt(formData.classe)
      };

      if (!payload.parent) {
        delete payload.parent;
      }

      if (editingCompte) {
        await updateCompte({ id: editingCompte._id, ...payload }).unwrap();
        toast.success('Compte modifie avec succes');
      } else {
        await createCompte(payload).unwrap();
        toast.success('Compte cree avec succes');
      }

      handleCloseModal();
    } catch (err) {
      toast.error(err.data?.message || 'Une erreur est survenue');
    }
  };

  const handleDelete = async (id, isSystem) => {
    if (isSystem) {
      toast.warning('Impossible de supprimer un compte systeme');
      return;
    }

    if (!window.confirm('Etes-vous sur de vouloir supprimer ce compte ?')) {
      return;
    }

    try {
      await deleteCompte(id).unwrap();
      toast.success('Compte supprime avec succes');
    } catch (err) {
      toast.error(err.data?.message || 'Erreur lors de la suppression');
    }
  };

  // Filter comptes
  const filteredComptes = comptes?.data?.filter(compte => {
    const matchesSearch = !search ||
      compte.numero.toLowerCase().includes(search.toLowerCase()) ||
      compte.libelle.toLowerCase().includes(search.toLowerCase());

    const matchesClasse = !classeFilter || compte.classe === parseInt(classeFilter);

    return matchesSearch && matchesClasse;
  }) || [];

  // Get parent comptes for dropdown
  const parentComptes = comptes?.data?.filter(c => c.numero.length <= 2) || [];

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
          <h5 className="mb-0">Plan Comptable SYSCOHADA</h5>
          <Button variant="primary" onClick={() => handleOpenModal()}>
            <FiPlus className="me-2" />
            Nouveau Compte
          </Button>
        </Card.Header>
        <Card.Body>
          <Row className="mb-3">
            <Col md={6}>
              <Form.Group>
                <div className="position-relative">
                  <FiSearch className="position-absolute" style={{ left: '10px', top: '12px' }} />
                  <Form.Control
                    type="text"
                    placeholder="Rechercher par numero ou libelle..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ paddingLeft: '35px' }}
                  />
                </div>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Select value={classeFilter} onChange={(e) => setClasseFilter(e.target.value)}>
                <option value="">Toutes les classes</option>
                {Object.entries(CLASSE_LABELS).map(([num, label]) => (
                  <option key={num} value={num}>
                    Classe {num} - {label}
                  </option>
                ))}
              </Form.Select>
            </Col>
          </Row>

          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>Numero</th>
                <th>Libelle</th>
                <th>Classe</th>
                <th>Type</th>
                <th className="text-end">Solde</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredComptes.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center text-muted">
                    Aucun compte trouve
                  </td>
                </tr>
              ) : (
                filteredComptes.map(compte => (
                  <tr key={compte._id}>
                    <td><strong>{compte.numero}</strong></td>
                    <td>{compte.libelle}</td>
                    <td>
                      <Badge bg="info">
                        {compte.classe} - {CLASSE_LABELS[compte.classe]}
                      </Badge>
                    </td>
                    <td>
                      <Badge bg={compte.type === 'debit' ? 'primary' : 'success'}>
                        {compte.type}
                      </Badge>
                    </td>
                    <td className="text-end">
                      <span className={compte.solde >= 0 ? 'text-success' : 'text-danger'}>
                        <strong>{formatMoney(compte.solde)}</strong>
                      </span>
                    </td>
                    <td className="text-center">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="me-2"
                        onClick={() => handleOpenModal(compte)}
                      >
                        <FiEdit2 />
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDelete(compte._id, compte.isSystem)}
                        disabled={compte.isSystem || isDeleting}
                      >
                        <FiTrash2 />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      {/* Create/Edit Modal */}
      <Modal show={showModal} onHide={handleCloseModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingCompte ? 'Modifier le compte' : 'Nouveau compte'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Numero <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    name="numero"
                    value={formData.numero}
                    onChange={handleChange}
                    required
                    disabled={editingCompte !== null}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Classe <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    name="classe"
                    value={formData.classe}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Selectionner...</option>
                    {Object.entries(CLASSE_LABELS).map(([num, label]) => (
                      <option key={num} value={num}>
                        {num} - {label}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Libelle <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                name="libelle"
                value={formData.libelle}
                onChange={handleChange}
                required
              />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Type <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    required
                  >
                    <option value="debit">Debit</option>
                    <option value="credit">Credit</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Compte parent (optionnel)</Form.Label>
                  <Form.Select
                    name="parent"
                    value={formData.parent}
                    onChange={handleChange}
                  >
                    <option value="">Aucun</option>
                    {parentComptes.map(compte => (
                      <option key={compte._id} value={compte._id}>
                        {compte.numero} - {compte.libelle}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              Annuler
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={isCreating || isUpdating}
            >
              {isCreating || isUpdating ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Enregistrement...
                </>
              ) : (
                editingCompte ? 'Modifier' : 'Creer'
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}
