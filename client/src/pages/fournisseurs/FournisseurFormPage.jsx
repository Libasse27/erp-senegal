import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Card from 'react-bootstrap/Card';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Spinner from 'react-bootstrap/Spinner';
import { FiSave, FiX } from 'react-icons/fi';
import { toast } from 'react-toastify';
import usePageTitle from '../../hooks/usePageTitle';
import {
  useGetFournisseurQuery,
  useCreateFournisseurMutation,
  useUpdateFournisseurMutation,
} from '../../redux/api/fournisseursApi';

const FournisseurFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  usePageTitle(
    isEditMode ? 'Modifier le Fournisseur' : 'Nouveau Fournisseur',
    [
      { label: 'Accueil', path: '/' },
      { label: 'Fournisseurs', path: '/fournisseurs' },
      { label: isEditMode ? 'Modifier' : 'Nouveau' },
    ]
  );

  const { data: fournisseurData, isLoading: isLoadingFournisseur } =
    useGetFournisseurQuery(id, {
      skip: !isEditMode,
    });
  const [createFournisseur, { isLoading: isCreating }] =
    useCreateFournisseurMutation();
  const [updateFournisseur, { isLoading: isUpdating }] =
    useUpdateFournisseurMutation();

  const [formData, setFormData] = useState({
    raisonSociale: '',
    contactName: '',
    email: '',
    phone: '',
    street: '',
    city: '',
    region: '',
    postalCode: '',
    ninea: '',
    rccm: '',
    conditionsPaiement: '',
    notes: '',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isEditMode && fournisseurData?.data) {
      const fournisseur = fournisseurData.data;
      setFormData({
        raisonSociale: fournisseur.raisonSociale || '',
        contactName: fournisseur.contactName || '',
        email: fournisseur.email || '',
        phone: fournisseur.phone || '',
        street: fournisseur.address?.street || '',
        city: fournisseur.address?.city || '',
        region: fournisseur.address?.region || '',
        postalCode: fournisseur.address?.postalCode || '',
        ninea: fournisseur.ninea || '',
        rccm: fournisseur.rccm || '',
        conditionsPaiement: fournisseur.conditionsPaiement || '',
        notes: fournisseur.notes || '',
      });
    }
  }, [isEditMode, fournisseurData]);

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

    if (!formData.raisonSociale.trim()) {
      newErrors.raisonSociale = 'La raison sociale est requise';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email invalide';
    }

    if (formData.phone && !/^\+?[\d\s-]+$/.test(formData.phone)) {
      newErrors.phone = 'Numero de telephone invalide';
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
      raisonSociale: formData.raisonSociale,
      contactName: formData.contactName || undefined,
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
      conditionsPaiement: formData.conditionsPaiement || undefined,
      notes: formData.notes || undefined,
    };

    try {
      if (isEditMode) {
        await updateFournisseur({ id, ...payload }).unwrap();
        toast.success('Fournisseur modifie avec succes');
      } else {
        await createFournisseur(payload).unwrap();
        toast.success('Fournisseur cree avec succes');
      }
      navigate('/fournisseurs');
    } catch (err) {
      toast.error(
        err.data?.message ||
          `Erreur lors de ${isEditMode ? 'la modification' : 'la creation'} du fournisseur`
      );
    }
  };

  if (isEditMode && isLoadingFournisseur) {
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
        <h1>
          {isEditMode ? 'Modifier le Fournisseur' : 'Nouveau Fournisseur'}
        </h1>
      </div>

      <Card className="shadow-sm">
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <Row className="g-3">
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

              <Col md={6}>
                <Form.Group>
                  <Form.Label>Nom du Contact</Form.Label>
                  <Form.Control
                    type="text"
                    name="contactName"
                    value={formData.contactName}
                    onChange={handleChange}
                    placeholder="Nom de la personne de contact"
                  />
                </Form.Group>
              </Col>

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

              <Col md={12}>
                <Form.Group>
                  <Form.Label>Conditions de Paiement</Form.Label>
                  <Form.Control
                    type="text"
                    name="conditionsPaiement"
                    value={formData.conditionsPaiement}
                    onChange={handleChange}
                    placeholder="Ex: 30 jours net, paiement a la livraison..."
                  />
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
                onClick={() => navigate('/fournisseurs')}
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

export default FournisseurFormPage;
