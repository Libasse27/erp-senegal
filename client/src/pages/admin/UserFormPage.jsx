import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import { FiSave, FiX } from 'react-icons/fi';
import { toast } from 'react-toastify';
import usePageTitle from '../../hooks/usePageTitle';
import { ROLES } from '../../utils/constants';
import {
  useGetUserQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
} from '../../redux/api/usersApi';

export default function UserFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  usePageTitle(isEditMode ? 'Modifier Utilisateur' : 'Nouvel Utilisateur', [
    { label: 'Accueil', path: '/' },
    { label: 'Administration' },
    { label: 'Utilisateurs', path: '/admin/utilisateurs' },
    { label: isEditMode ? 'Modifier' : 'Nouveau' },
  ]);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'vendeur',
    password: '',
    confirmPassword: '',
    isActive: true,
  });

  const [errors, setErrors] = useState({});

  const { data: userData, isLoading: isLoadingUser } = useGetUserQuery(id, {
    skip: !isEditMode,
  });

  const [createUser, { isLoading: isCreating }] = useCreateUserMutation();
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();

  useEffect(() => {
    if (isEditMode && userData?.data) {
      const user = userData.data;
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        role: user.role || 'vendeur',
        password: '',
        confirmPassword: '',
        isActive: user.isActive !== false,
      });
    }
  }, [isEditMode, userData]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Le prenom est requis';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Le nom est requis';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'L\'email est requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Format d\'email invalide';
    }

    if (!isEditMode) {
      if (!formData.password) {
        newErrors.password = 'Le mot de passe est requis';
      } else if (formData.password.length < 8) {
        newErrors.password = 'Le mot de passe doit contenir au moins 8 caracteres';
      }

      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Veuillez confirmer le mot de passe';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
      }
    } else {
      if (formData.password && formData.password.length < 8) {
        newErrors.password = 'Le mot de passe doit contenir au moins 8 caracteres';
      }

      if (formData.password && formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Veuillez corriger les erreurs du formulaire');
      return;
    }

    try {
      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        role: formData.role,
        isActive: formData.isActive,
      };

      if (!isEditMode || formData.password) {
        payload.password = formData.password;
      }

      if (isEditMode) {
        await updateUser({ id, ...payload }).unwrap();
        toast.success('Utilisateur modifie avec succes');
      } else {
        await createUser(payload).unwrap();
        toast.success('Utilisateur cree avec succes');
      }

      navigate('/admin/utilisateurs');
    } catch (err) {
      toast.error(err?.data?.message || 'Erreur lors de l\'enregistrement');
    }
  };

  if (isEditMode && isLoadingUser) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Chargement des donnees utilisateur...</p>
      </div>
    );
  }

  return (
    <div className="user-form-page">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">{isEditMode ? 'Modifier Utilisateur' : 'Nouvel Utilisateur'}</h2>
          <p className="text-muted mb-0">
            {isEditMode
              ? 'Modifier les informations de l\'utilisateur'
              : 'Creer un nouvel utilisateur du systeme'}
          </p>
        </div>
      </div>

      <Card>
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    Prenom <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Entrez le prenom"
                    value={formData.firstName}
                    onChange={(e) => handleChange('firstName', e.target.value)}
                    isInvalid={!!errors.firstName}
                  />
                  <Form.Control.Feedback type="invalid">{errors.firstName}</Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    Nom <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Entrez le nom"
                    value={formData.lastName}
                    onChange={(e) => handleChange('lastName', e.target.value)}
                    isInvalid={!!errors.lastName}
                  />
                  <Form.Control.Feedback type="invalid">{errors.lastName}</Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    Email <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="email"
                    placeholder="utilisateur@exemple.com"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    isInvalid={!!errors.email}
                  />
                  <Form.Control.Feedback type="invalid">{errors.email}</Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Telephone</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="+221 77 123 45 67"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    Role <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Select
                    value={formData.role}
                    onChange={(e) => handleChange('role', e.target.value)}
                  >
                    {Object.entries(ROLES).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Statut</Form.Label>
                  <Form.Check
                    type="switch"
                    label={formData.isActive ? 'Actif' : 'Inactif'}
                    checked={formData.isActive}
                    onChange={(e) => handleChange('isActive', e.target.checked)}
                    className="mt-2"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    {isEditMode ? 'Nouveau mot de passe (optionnel)' : 'Mot de passe'}{' '}
                    {!isEditMode && <span className="text-danger">*</span>}
                  </Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Minimum 8 caracteres"
                    value={formData.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    isInvalid={!!errors.password}
                  />
                  <Form.Control.Feedback type="invalid">{errors.password}</Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    {isEditMode ? 'Confirmer le nouveau mot de passe' : 'Confirmer le mot de passe'}{' '}
                    {!isEditMode && <span className="text-danger">*</span>}
                  </Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Confirmez le mot de passe"
                    value={formData.confirmPassword}
                    onChange={(e) => handleChange('confirmPassword', e.target.value)}
                    isInvalid={!!errors.confirmPassword}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.confirmPassword}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <div className="d-flex justify-content-end gap-2 mt-4">
              <Button variant="secondary" onClick={() => navigate('/admin/utilisateurs')}>
                <FiX className="me-2" />
                Annuler
              </Button>
              <Button
                variant="primary"
                type="submit"
                disabled={isCreating || isUpdating}
              >
                <FiSave className="me-2" />
                {isCreating || isUpdating ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
}
