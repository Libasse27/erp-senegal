import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Card from 'react-bootstrap/Card';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import { FiSave, FiX } from 'react-icons/fi';
import { toast } from 'react-toastify';
import usePageTitle from '../../hooks/usePageTitle';
import {
  useGetClientQuery,
  useCreateClientMutation,
  useUpdateClientMutation,
} from '../../redux/api/clientsApi';

const ClientFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  usePageTitle(
    isEditMode ? 'Modifier le Client' : 'Nouveau Client',
    [
      { label: 'Accueil', path: '/' },
      { label: 'Clients', path: '/clients' },
      { label: isEditMode ? 'Modifier' : 'Nouveau' },
    ]
  );

  const { data: clientData, isLoading: isLoadingClient } = useGetClientQuery(
    id,
    {
      skip: !isEditMode,
    }
  );
  const [createClient, { isLoading: isCreating }] = useCreateClientMutation();
  const [updateClient, { isLoading: isUpdating }] = useUpdateClientMutation();

  const [formData, setFormData] = useState({
    type: 'particulier',
    raisonSociale: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    street: '',
    city: '',
    region: '',
    postalCode: '',
    ninea: '',
    rccm: '',
    delaiPaiement: 30,
    creditLimit: 0,
    notes: '',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isEditMode && clientData?.data) {
      const client = clientData.data;
      setFormData({
        type: client.type || 'particulier',
        raisonSociale: client.raisonSociale || '',
        firstName: client.firstName || '',
        lastName: client.lastName || '',
        email: client.email || '',
        phone: client.phone || '',
        street: client.address?.street || '',
        city: client.address?.city || '',
        region: client.address?.region || '',
        postalCode: client.address?.postalCode || '',
        ninea: client.ninea || '',
        rccm: client.rccm || '',
        delaiPaiement: client.delaiPaiement || 30,
        creditLimit: client.creditLimit || 0,
        notes: client.notes || '',
      });
    }
  }, [isEditMode, clientData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (formData.type === 'entreprise') {
      if (!formData.raisonSociale.trim()) {
        newErrors.raisonSociale = 'La raison sociale est requise';
      }
    } else {
      if (!formData.firstName.trim()) {
        newErrors.firstName = 'Le prenom est requis';
      }
      if (!formData.lastName.trim()) {
        newErrors.lastName = 'Le nom est requis';
      }
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email invalide';
    }

    if (formData.phone && !/^\+?[\d\s-]+$/.test(formData.phone)) {
      newErrors.phone = 'Numero de telephone invalide';
    }

    if (formData.delaiPaiement < 0) {
      newErrors.delaiPaiement = 'Le delai de paiement doit etre positif';
    }

    if (formData.creditLimit < 0) {
      newErrors.creditLimit = 'La limite de credit doit etre positive';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Veuillez corriger les erreurs dans le formulaire');
      return;
    }

    const payload = {
      type: formData.type,
      email: formData.email || undefined,
      phone: formData.phone || undefined,
      address: {
        street: formData.street || undefined,
        city: formData.city || undefined,
        region: formData.region || undefined,
        postalCode: formData.postalCode || undefined,
      },
      ninea: formData.ninea || undefined,
      rccm: formData.rccm || undefined,
      delaiPaiement: Number(formData.delaiPaiement),
      creditLimit: Number(formData.creditLimit),
      notes: formData.notes || undefined,
    };

    if (formData.type === 'entreprise') {
      payload.raisonSociale = formData.raisonSociale;
    } else {
      payload.firstName = formData.firstName;
      payload.lastName = formData.lastName;
    }

    try {
      if (isEditMode) {
        await updateClient({ id, ...payload }).unwrap();
        toast.success('Client modifie avec succes');
      } else {
        await createClient(payload).unwrap();
        toast.success('Client cree avec succes');
      }
      navigate('/clients');
    } catch (err) {
      toast.error(
        err.data?.message ||
          `Erreur lors de ${isEditMode ? 'la modification' : 'la creation'} du client`
      );
    }
  };

  if (isEditMode && isLoadingClient) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2 text-muted">Chargement...</p>
      </div>
    );
  }

  return (
    <>
      <div className="page-header">
        <h1>{isEditMode ? 'Modifier le Client' : 'Nouveau Client'}</h1>
      </div>

      <Card className="shadow-sm">
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <Row className="mb-3">
              <Col md={12}>
                <Form.Group>
                  <Form.Label>
                    Type de client <span className="text-danger">*</span>
                  </Form.Label>
                  <div>
                    <Form.Check
                      inline
                      type="radio"
                      label="Particulier"
                      name="type"
                      value="particulier"
                      checked={formData.type === 'particulier'}
                      onChange={handleChange}
                    />
                    <Form.Check
                      inline
                      type="radio"
                      label="Entreprise"
                      name="type"
                      value="entreprise"
                      checked={formData.type === 'entreprise'}
                      onChange={handleChange}
                    />
                  </div>
                </Form.Group>
              </Col>
            </Row>

            <Row className="g-3">
              {formData.type === 'entreprise' ? (
                <Col md={12}>
                  <Form.Group>
                    <Form.Label>
                      Raison Sociale <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      type="text"
                      name="raisonSociale"
                      value={formData.raisonSociale}
                      onChange={handleChange}
                      isInvalid={!!errors.raisonSociale}
                      placeholder="Entrez la raison sociale"
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.raisonSociale}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
              ) : (
                <>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>
                        Prenom <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        isInvalid={!!errors.firstName}
                        placeholder="Entrez le prenom"
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.firstName}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>
                        Nom <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        isInvalid={!!errors.lastName}
                        placeholder="Entrez le nom"
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.lastName}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </>
              )}

              <Col md={6}>
                <Form.Group>
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    isInvalid={!!errors.email}
                    placeholder="exemple@email.com"
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.email}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label>Telephone</Form.Label>
                  <Form.Control
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    isInvalid={!!errors.phone}
                    placeholder="+221 77 123 45 67"
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.phone}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col md={12}>
                <Form.Group>
                  <Form.Label>Adresse</Form.Label>
                  <Form.Control
                    type="text"
                    name="street"
                    value={formData.street}
                    onChange={handleChange}
                    placeholder="Rue, avenue, quartier..."
                  />
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group>
                  <Form.Label>Ville</Form.Label>
                  <Form.Control
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="Dakar"
                  />
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group>
                  <Form.Label>Region</Form.Label>
                  <Form.Control
                    type="text"
                    name="region"
                    value={formData.region}
                    onChange={handleChange}
                    placeholder="Dakar"
                  />
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group>
                  <Form.Label>Code Postal</Form.Label>
                  <Form.Control
                    type="text"
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleChange}
                    placeholder="12000"
                  />
                </Form.Group>
              </Col>

              {formData.type === 'entreprise' && (
                <>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>NINEA</Form.Label>
                      <Form.Control
                        type="text"
                        name="ninea"
                        value={formData.ninea}
                        onChange={handleChange}
                        placeholder="Numero NINEA"
                      />
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>RCCM</Form.Label>
                      <Form.Control
                        type="text"
                        name="rccm"
                        value={formData.rccm}
                        onChange={handleChange}
                        placeholder="Numero RCCM"
                      />
                    </Form.Group>
                  </Col>
                </>
              )}

              <Col md={6}>
                <Form.Group>
                  <Form.Label>Delai de Paiement (jours)</Form.Label>
                  <Form.Control
                    type="number"
                    name="delaiPaiement"
                    value={formData.delaiPaiement}
                    onChange={handleChange}
                    isInvalid={!!errors.delaiPaiement}
                    min="0"
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.delaiPaiement}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label>Limite de Credit (FCFA)</Form.Label>
                  <Form.Control
                    type="number"
                    name="creditLimit"
                    value={formData.creditLimit}
                    onChange={handleChange}
                    isInvalid={!!errors.creditLimit}
                    min="0"
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.creditLimit}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col md={12}>
                <Form.Group>
                  <Form.Label>Notes</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="Notes ou observations..."
                  />
                </Form.Group>
              </Col>
            </Row>

            <div className="d-flex justify-content-end gap-2 mt-4">
              <Button
                variant="outline-secondary"
                onClick={() => navigate('/clients')}
                disabled={isCreating || isUpdating}
              >
                <FiX className="me-1" />
                Annuler
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isCreating || isUpdating}
              >
                {isCreating || isUpdating ? (
                  <>
                    <Spinner
                      as="span"
                      animation="border"
                      size="sm"
                      className="me-2"
                    />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <FiSave className="me-1" />
                    Enregistrer
                  </>
                )}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </>
  );
};

export default ClientFormPage;
