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
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { toast } from 'react-toastify';
import usePageTitle from '../../hooks/usePageTitle';
import { formatMoney } from '../../utils/formatters';
import {
  useGetBankAccountsQuery,
  useCreateBankAccountMutation,
  useUpdateBankAccountMutation,
  useDeleteBankAccountMutation,
} from '../../redux/api/bankAccountsApi';

const BankAccountsPage = () => {
  usePageTitle('Comptes Bancaires', [
    { label: 'Accueil', path: '/' },
    { label: 'Paiements' },
    { label: 'Comptes Bancaires' },
  ]);

  const [showModal, setShowModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [formData, setFormData] = useState({
    nom: '',
    banque: '',
    numeroCompte: '',
    iban: '',
    swift: '',
    type: 'courant',
    devise: 'XOF',
    soldeInitial: 0,
    agence: '',
    contactBanque: '',
    telephoneBanque: '',
    isDefault: false,
  });

  const { data, isLoading, error } = useGetBankAccountsQuery();
  const [createAccount, { isLoading: isCreating }] = useCreateBankAccountMutation();
  const [updateAccount, { isLoading: isUpdating }] = useUpdateBankAccountMutation();
  const [deleteAccount] = useDeleteBankAccountMutation();

  const accounts = data?.data || [];

  const handleShowModal = (account = null) => {
    if (account) {
      setEditingAccount(account);
      setFormData({
        nom: account.nom || '',
        banque: account.banque || '',
        numeroCompte: account.numeroCompte || '',
        iban: account.iban || '',
        swift: account.swift || '',
        type: account.type || 'courant',
        devise: account.devise || 'XOF',
        soldeInitial: account.soldeInitial || 0,
        agence: account.agence || '',
        contactBanque: account.contactBanque || '',
        telephoneBanque: account.telephoneBanque || '',
        isDefault: account.isDefault || false,
      });
    } else {
      setEditingAccount(null);
      setFormData({
        nom: '',
        banque: '',
        numeroCompte: '',
        iban: '',
        swift: '',
        type: 'courant',
        devise: 'XOF',
        soldeInitial: 0,
        agence: '',
        contactBanque: '',
        telephoneBanque: '',
        isDefault: false,
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingAccount(null);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingAccount) {
        await updateAccount({ id: editingAccount._id, ...formData }).unwrap();
        toast.success('Compte bancaire modifie avec succes');
      } else {
        await createAccount(formData).unwrap();
        toast.success('Compte bancaire cree avec succes');
      }
      handleCloseModal();
    } catch (err) {
      toast.error(err.data?.message || 'Erreur lors de la sauvegarde');
    }
  };

  const handleDelete = async (id, nom) => {
    if (window.confirm(`Etes-vous sur de vouloir supprimer le compte "${nom}" ?`)) {
      try {
        await deleteAccount(id).unwrap();
        toast.success('Compte bancaire supprime avec succes');
      } catch (err) {
        toast.error(err.data?.message || 'Erreur lors de la suppression');
      }
    }
  };

  const getTypeBadgeVariant = (type) => {
    switch (type) {
      case 'courant':
        return 'primary';
      case 'epargne':
        return 'info';
      case 'mobile_money':
        return 'warning';
      case 'caisse':
        return 'success';
      default:
        return 'secondary';
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'courant':
        return 'Compte Courant';
      case 'epargne':
        return 'Epargne';
      case 'mobile_money':
        return 'Mobile Money';
      case 'caisse':
        return 'Caisse';
      default:
        return type;
    }
  };

  const getSoldeColor = (solde) => {
    if (solde > 0) return 'text-success';
    if (solde < 0) return 'text-danger';
    return 'text-muted';
  };

  return (
    <>
      <div className="page-header">
        <h1>Comptes Bancaires</h1>
        <Button
          variant="primary"
          onClick={() => handleShowModal()}
          className="d-flex align-items-center gap-2"
        >
          <FiPlus size={18} />
          Nouveau Compte
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
              Erreur lors du chargement des comptes: {error.data?.message || error.message}
            </Alert>
          ) : accounts.length === 0 ? (
            <Alert variant="info">
              Aucun compte bancaire trouve. Cliquez sur "Nouveau Compte" pour en ajouter un.
            </Alert>
          ) : (
            <div className="table-responsive">
              <Table hover className="mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Nom</th>
                    <th>Banque</th>
                    <th>Numero Compte</th>
                    <th>Type</th>
                    <th>Devise</th>
                    <th className="text-end">Solde Initial</th>
                    <th className="text-end">Solde Actuel</th>
                    <th className="text-center">Par Defaut</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.map((account) => (
                    <tr key={account._id}>
                      <td>
                        <strong>{account.nom}</strong>
                      </td>
                      <td>{account.banque || '-'}</td>
                      <td>{account.numeroCompte || '-'}</td>
                      <td>
                        <Badge bg={getTypeBadgeVariant(account.type)}>
                          {getTypeLabel(account.type)}
                        </Badge>
                      </td>
                      <td>{account.devise}</td>
                      <td className="text-end">{formatMoney(account.soldeInitial || 0)}</td>
                      <td className={`text-end fw-bold ${getSoldeColor(account.soldeActuel)}`}>
                        {formatMoney(account.soldeActuel || 0)}
                      </td>
                      <td className="text-center">
                        {account.isDefault && <Badge bg="success">Oui</Badge>}
                      </td>
                      <td className="text-end">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="me-2"
                          onClick={() => handleShowModal(account)}
                        >
                          <FiEdit2 size={14} />
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDelete(account._id, account.nom)}
                        >
                          <FiTrash2 size={14} />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>

      <Modal show={showModal} onHide={handleCloseModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingAccount ? 'Modifier le Compte' : 'Nouveau Compte Bancaire'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>
                    Nom du compte <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="nom"
                    value={formData.nom}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Banque</Form.Label>
                  <Form.Control
                    type="text"
                    name="banque"
                    value={formData.banque}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Numero de compte</Form.Label>
                  <Form.Control
                    type="text"
                    name="numeroCompte"
                    value={formData.numeroCompte}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>IBAN</Form.Label>
                  <Form.Control
                    type="text"
                    name="iban"
                    value={formData.iban}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Code SWIFT/BIC</Form.Label>
                  <Form.Control
                    type="text"
                    name="swift"
                    value={formData.swift}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>
                    Type <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Select name="type" value={formData.type} onChange={handleInputChange} required>
                    <option value="courant">Compte Courant</option>
                    <option value="epargne">Epargne</option>
                    <option value="mobile_money">Mobile Money</option>
                    <option value="caisse">Caisse</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Devise</Form.Label>
                  <Form.Control
                    type="text"
                    name="devise"
                    value={formData.devise}
                    onChange={handleInputChange}
                    readOnly
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Solde Initial</Form.Label>
                  <Form.Control
                    type="number"
                    name="soldeInitial"
                    value={formData.soldeInitial}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Agence</Form.Label>
                  <Form.Control
                    type="text"
                    name="agence"
                    value={formData.agence}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Contact Banque</Form.Label>
                  <Form.Control
                    type="text"
                    name="contactBanque"
                    value={formData.contactBanque}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Telephone Banque</Form.Label>
                  <Form.Control
                    type="text"
                    name="telephoneBanque"
                    value={formData.telephoneBanque}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Check
                  type="checkbox"
                  name="isDefault"
                  label="Definir comme compte par defaut"
                  checked={formData.isDefault}
                  onChange={handleInputChange}
                />
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              Annuler
            </Button>
            <Button variant="primary" type="submit" disabled={isCreating || isUpdating}>
              {isCreating || isUpdating ? (
                <>
                  <Spinner as="span" animation="border" size="sm" className="me-2" />
                  Enregistrement...
                </>
              ) : (
                'Enregistrer'
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </>
  );
};

export default BankAccountsPage;
