import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import Badge from 'react-bootstrap/Badge';
import Alert from 'react-bootstrap/Alert';
import Spinner from 'react-bootstrap/Spinner';
import { FiSave, FiX, FiShield, FiUser, FiLock, FiUnlock } from 'react-icons/fi';
import { toast } from 'react-toastify';
import usePageTitle from '../../hooks/usePageTitle';
import {
  useGetUserQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
} from '../../redux/api/usersApi';
import { useGetRolesQuery } from '../../redux/api/adminApi';

// ── Libellés visuels ────────────────────────────────────────────────────────
const ACTION_LABELS = {
  create:   { label: 'Créer',     bg: 'success'   },
  read:     { label: 'Lire',      bg: 'info'      },
  update:   { label: 'Modifier',  bg: 'warning'   },
  delete:   { label: 'Supprimer', bg: 'danger'    },
  export:   { label: 'Exporter',  bg: 'secondary' },
  validate: { label: 'Valider',   bg: 'primary'   },
};

const MODULE_LABELS = {
  clients:      'Clients',
  suppliers:    'Fournisseurs',
  products:     'Produits',
  stocks:       'Stocks',
  quotes:       'Devis',
  invoices:     'Factures',
  commandes:    'Commandes',
  payments:     'Paiements',
  comptabilite: 'Comptabilité',
  ecritures:    'Ecritures',
  reports:      'Rapports',
  settings:     'Paramètres',
  users:        'Utilisateurs',
  roles:        'Rôles',
  audit:        'Journal d\'Audit',
};

function PermissionsPreview({ roleObj }) {
  if (!roleObj) {
    return (
      <Alert variant="light" className="border">
        Sélectionnez un rôle pour voir les autorisations associées.
      </Alert>
    );
  }

  const perms = roleObj.permissions || [];
  if (perms.length === 0) {
    return (
      <Alert variant="warning">
        Ce rôle n'a aucune autorisation configurée.
      </Alert>
    );
  }

  // Grouper par module
  const grouped = {};
  perms.forEach((p) => {
    const mod = p.module || 'autre';
    if (!grouped[mod]) grouped[mod] = [];
    grouped[mod].push(p);
  });

  return (
    <div>
      <p className="text-muted small mb-3">
        <FiShield className="me-1" />
        {perms.length} autorisation(s) accordée(s) par le rôle{' '}
        <strong>{roleObj.displayName}</strong>.
      </p>
      <Row className="g-3">
        {Object.entries(grouped).map(([mod, actions]) => (
          <Col key={mod} sm={6} lg={4}>
            <Card className="h-100 border-0 bg-light">
              <Card.Body className="p-3">
                <p className="fw-semibold mb-2 small text-uppercase text-muted">
                  {MODULE_LABELS[mod] || mod}
                </p>
                <div className="d-flex flex-wrap gap-1">
                  {actions.map((p) => {
                    const meta = ACTION_LABELS[p.action] || { label: p.action, bg: 'secondary' };
                    return (
                      <Badge key={p._id} bg={meta.bg} className="fw-normal">
                        {meta.label}
                      </Badge>
                    );
                  })}
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
}

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
    roleId: '',
    password: '',
    confirmPassword: '',
    isActive: true,
  });
  const [errors, setErrors] = useState({});

  // ── Queries ──────────────────────────────────────────────────────────────
  const { data: userData, isLoading: isLoadingUser } = useGetUserQuery(id, { skip: !isEditMode });
  const { data: rolesData, isLoading: isLoadingRoles } = useGetRolesQuery({ limit: 100 });

  const [createUser, { isLoading: isCreating }] = useCreateUserMutation();
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();

  const roles = rolesData?.data || [];

  // Rôle sélectionné (objet complet avec permissions)
  const selectedRole = roles.find((r) => r._id === formData.roleId) || null;

  // ── Pré-remplissage en mode édition ──────────────────────────────────────
  useEffect(() => {
    if (isEditMode && userData?.data) {
      const u = userData.data;
      setFormData({
        firstName: u.firstName || '',
        lastName: u.lastName || '',
        email: u.email || '',
        phone: u.phone || '',
        roleId: u.role?._id || u.role || '',
        password: '',
        confirmPassword: '',
        isActive: u.isActive !== false,
      });
    }
  }, [isEditMode, userData]);

  // ── Helpers ──────────────────────────────────────────────────────────────
  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!formData.firstName.trim()) errs.firstName = 'Le prénom est requis';
    if (!formData.lastName.trim()) errs.lastName = 'Le nom est requis';
    if (!formData.email.trim()) {
      errs.email = "L'email est requis";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errs.email = "Format d'email invalide";
    }
    if (!formData.roleId) errs.roleId = 'Le rôle est requis';

    if (!isEditMode) {
      if (!formData.password) errs.password = 'Le mot de passe est requis';
      else if (formData.password.length < 6) errs.password = 'Minimum 6 caractères';
      if (formData.password && formData.password !== formData.confirmPassword)
        errs.confirmPassword = 'Les mots de passe ne correspondent pas';
    } else {
      if (formData.password && formData.password.length < 6)
        errs.password = 'Minimum 6 caractères';
      if (formData.password && formData.password !== formData.confirmPassword)
        errs.confirmPassword = 'Les mots de passe ne correspondent pas';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Veuillez corriger les erreurs du formulaire');
      return;
    }

    const payload = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      role: formData.roleId,
      isActive: formData.isActive,
    };
    if (!isEditMode || formData.password) {
      payload.password = formData.password;
    }

    try {
      if (isEditMode) {
        await updateUser({ id, ...payload }).unwrap();
        toast.success('Utilisateur modifié avec succès');
      } else {
        await createUser(payload).unwrap();
        toast.success('Utilisateur créé avec succès');
      }
      navigate('/admin/utilisateurs');
    } catch (err) {
      toast.error(err?.data?.message || "Erreur lors de l'enregistrement");
    }
  };

  // ── Chargement initial ───────────────────────────────────────────────────
  if (isEditMode && isLoadingUser) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Chargement...</p>
      </div>
    );
  }

  const isSaving = isCreating || isUpdating;

  return (
    <div className="user-form-page">
      {/* En-tête */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">
            {isEditMode ? 'Modifier Utilisateur' : 'Nouvel Utilisateur'}
          </h2>
          <p className="text-muted mb-0">
            {isEditMode
              ? 'Modifier les informations, le rôle ou les accès de cet utilisateur'
              : 'Créer un nouvel utilisateur et lui attribuer un rôle'}
          </p>
        </div>
      </div>

      <Form onSubmit={handleSubmit}>
        <Tabs defaultActiveKey="identite" className="mb-4">
          {/* ══ Onglet 1 : Identité ══════════════════════════════════════ */}
          <Tab eventKey="identite" title={<><FiUser className="me-1" />Identité</>}>
            <Card>
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Prénom <span className="text-danger">*</span></Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Entrez le prénom"
                        value={formData.firstName}
                        onChange={(e) => handleChange('firstName', e.target.value)}
                        isInvalid={!!errors.firstName}
                      />
                      <Form.Control.Feedback type="invalid">{errors.firstName}</Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Nom <span className="text-danger">*</span></Form.Label>
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
                      <Form.Label>Email <span className="text-danger">*</span></Form.Label>
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
                      <Form.Label>Téléphone</Form.Label>
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
                        {isEditMode ? 'Nouveau mot de passe (optionnel)' : 'Mot de passe'}{' '}
                        {!isEditMode && <span className="text-danger">*</span>}
                      </Form.Label>
                      <Form.Control
                        type="password"
                        placeholder="Minimum 6 caractères"
                        value={formData.password}
                        onChange={(e) => handleChange('password', e.target.value)}
                        isInvalid={!!errors.password}
                        autoComplete="new-password"
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
                        autoComplete="new-password"
                      />
                      <Form.Control.Feedback type="invalid">{errors.confirmPassword}</Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Tab>

          {/* ══ Onglet 2 : Rôle & Autorisations ═══════════════════════════ */}
          <Tab eventKey="acces" title={<><FiShield className="me-1" />Rôle &amp; Autorisations</>}>
            <Card className="mb-4">
              <Card.Body>
                {/* ── Statut du compte ── */}
                <div className="d-flex align-items-center justify-content-between p-3 rounded mb-4"
                  style={{ background: formData.isActive ? '#f0fdf4' : '#fef2f2', border: `1px solid ${formData.isActive ? '#bbf7d0' : '#fecaca'}` }}>
                  <div className="d-flex align-items-center gap-2">
                    {formData.isActive ? (
                      <FiUnlock size={20} color="#16a34a" />
                    ) : (
                      <FiLock size={20} color="#dc2626" />
                    )}
                    <div>
                      <p className="fw-semibold mb-0" style={{ color: formData.isActive ? '#16a34a' : '#dc2626' }}>
                        Compte {formData.isActive ? 'actif' : 'bloqué'}
                      </p>
                      <p className="text-muted small mb-0">
                        {formData.isActive
                          ? "L'utilisateur peut se connecter normalement."
                          : "L'utilisateur ne peut pas se connecter."}
                      </p>
                    </div>
                  </div>
                  <Form.Check
                    type="switch"
                    checked={formData.isActive}
                    onChange={(e) => handleChange('isActive', e.target.checked)}
                    label={formData.isActive ? 'Actif' : 'Bloqué'}
                    id="isActive-switch"
                  />
                </div>

                {/* ── Sélection du rôle ── */}
                <Form.Group className="mb-4">
                  <Form.Label className="fw-semibold">
                    Rôle <span className="text-danger">*</span>
                  </Form.Label>
                  {isLoadingRoles ? (
                    <div className="d-flex align-items-center gap-2 text-muted">
                      <Spinner size="sm" />
                      <span>Chargement des rôles...</span>
                    </div>
                  ) : (
                    <>
                      <Form.Select
                        value={formData.roleId}
                        onChange={(e) => handleChange('roleId', e.target.value)}
                        isInvalid={!!errors.roleId}
                      >
                        <option value="">-- Sélectionner un rôle --</option>
                        {roles.map((role) => (
                          <option key={role._id} value={role._id}>
                            {role.displayName}
                            {role.description ? ` — ${role.description}` : ''}
                          </option>
                        ))}
                      </Form.Select>
                      <Form.Control.Feedback type="invalid">{errors.roleId}</Form.Control.Feedback>
                      {selectedRole && (
                        <Form.Text className="text-muted">
                          Ce rôle accorde{' '}
                          <strong>{selectedRole.permissions?.length || 0}</strong>{' '}
                          autorisation(s).
                        </Form.Text>
                      )}
                    </>
                  )}
                </Form.Group>

                {/* ── Aperçu des permissions du rôle ── */}
                <div>
                  <p className="fw-semibold mb-3">Autorisations accordées par ce rôle</p>
                  <PermissionsPreview roleObj={selectedRole} />
                </div>
              </Card.Body>
            </Card>
          </Tab>
        </Tabs>

        {/* ── Boutons ─────────────────────────────────────────────────────── */}
        <div className="d-flex justify-content-end gap-2">
          <Button variant="secondary" onClick={() => navigate('/admin/utilisateurs')} disabled={isSaving}>
            <FiX className="me-2" />
            Annuler
          </Button>
          <Button variant="primary" type="submit" disabled={isSaving}>
            {isSaving ? (
              <><Spinner size="sm" className="me-2" />Enregistrement...</>
            ) : (
              <><FiSave className="me-2" />{isEditMode ? 'Modifier' : 'Créer l\'utilisateur'}</>
            )}
          </Button>
        </div>
      </Form>
    </div>
  );
}
