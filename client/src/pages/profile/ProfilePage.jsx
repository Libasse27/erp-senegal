import React, { useState } from 'react';
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
import { FiUser, FiLock, FiSave, FiMail, FiPhone } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { useGetMeQuery, useUpdateMeMutation, useChangePasswordMutation } from '../../redux/api/authApi';
import usePageTitle from '../../hooks/usePageTitle';
import { formatDate } from '../../utils/formatters';

export default function ProfilePage() {
  usePageTitle('Mon Profil', [
    { label: 'Accueil', path: '/' },
    { label: 'Mon Profil' },
  ]);

  const { data, isLoading } = useGetMeQuery();
  const [updateMe, { isLoading: isSaving }] = useUpdateMeMutation();
  const [changePassword, { isLoading: isChangingPwd }] = useChangePasswordMutation();

  const user = data?.data;

  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });
  const [profileInitialized, setProfileInitialized] = useState(false);

  const [pwdForm, setPwdForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [pwdError, setPwdError] = useState('');

  // Initialize form once user data arrives
  if (user && !profileInitialized) {
    setProfileForm({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      phone: user.phone || '',
    });
    setProfileInitialized(true);
  }

  const handleProfileChange = (field, value) => {
    setProfileForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateMe(profileForm).unwrap();
      toast.success('Profil mis a jour avec succes');
    } catch (err) {
      toast.error(err?.data?.message || 'Erreur lors de la mise a jour');
    }
  };

  const handlePwdChange = (field, value) => {
    setPwdError('');
    setPwdForm((prev) => ({ ...prev, [field]: value }));
  };

  const handlePwdSubmit = async (e) => {
    e.preventDefault();
    if (pwdForm.newPassword !== pwdForm.confirmPassword) {
      setPwdError('Les nouveaux mots de passe ne correspondent pas');
      return;
    }
    if (pwdForm.newPassword.length < 6) {
      setPwdError('Le nouveau mot de passe doit contenir au moins 6 caracteres');
      return;
    }
    try {
      await changePassword({
        currentPassword: pwdForm.currentPassword,
        newPassword: pwdForm.newPassword,
      }).unwrap();
      toast.success('Mot de passe modifie avec succes');
      setPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err?.data?.message || 'Erreur lors du changement de mot de passe');
    }
  };

  const getInitials = () => {
    if (!user) return '?';
    return `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase();
  };

  const getRoleName = () => {
    if (!user?.role) return null;
    return user.role.displayName || user.role.name || null;
  };

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 300 }}>
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="d-flex align-items-center gap-3 mb-4">
        <div
          className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold fs-4"
          style={{ width: 64, height: 64, background: 'var(--bs-primary, #0d6efd)', flexShrink: 0 }}
        >
          {getInitials()}
        </div>
        <div>
          <h2 className="mb-1">
            {user?.firstName} {user?.lastName}
          </h2>
          <div className="d-flex align-items-center gap-2">
            {getRoleName() && (
              <Badge bg="primary">{getRoleName()}</Badge>
            )}
            {user?.isActive ? (
              <Badge bg="success">Actif</Badge>
            ) : (
              <Badge bg="secondary">Inactif</Badge>
            )}
          </div>
        </div>
      </div>

      {user?.lastLogin && (
        <p className="text-muted small mb-4">
          Derniere connexion : {formatDate(user.lastLogin)}
        </p>
      )}

      <Tabs defaultActiveKey="informations" className="mb-4">
        {/* ── Onglet Informations ── */}
        <Tab eventKey="informations" title={<><FiUser className="me-1" />Informations</>}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Informations personnelles</h5>
            </Card.Header>
            <Card.Body>
              <Form onSubmit={handleProfileSubmit}>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Prenom</Form.Label>
                      <Form.Control
                        type="text"
                        value={profileForm.firstName}
                        onChange={(e) => handleProfileChange('firstName', e.target.value)}
                        required
                        minLength={2}
                        maxLength={50}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Nom</Form.Label>
                      <Form.Control
                        type="text"
                        value={profileForm.lastName}
                        onChange={(e) => handleProfileChange('lastName', e.target.value)}
                        required
                        minLength={2}
                        maxLength={50}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        <FiMail className="me-1" />
                        Email
                      </Form.Label>
                      <Form.Control
                        type="email"
                        value={profileForm.email}
                        onChange={(e) => handleProfileChange('email', e.target.value)}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        <FiPhone className="me-1" />
                        Telephone
                      </Form.Label>
                      <Form.Control
                        type="text"
                        value={profileForm.phone}
                        onChange={(e) => handleProfileChange('phone', e.target.value)}
                        placeholder="+221 77 000 00 00"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <div className="d-flex justify-content-end">
                  <Button type="submit" variant="primary" disabled={isSaving}>
                    {isSaving ? (
                      <><Spinner size="sm" className="me-2" />Enregistrement...</>
                    ) : (
                      <><FiSave className="me-2" />Enregistrer</>
                    )}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Tab>

        {/* ── Onglet Securite ── */}
        <Tab eventKey="securite" title={<><FiLock className="me-1" />Securite</>}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Changer le mot de passe</h5>
            </Card.Header>
            <Card.Body>
              {pwdError && (
                <Alert variant="danger" onClose={() => setPwdError('')} dismissible>
                  {pwdError}
                </Alert>
              )}
              <Form onSubmit={handlePwdSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Mot de passe actuel</Form.Label>
                  <Form.Control
                    type="password"
                    value={pwdForm.currentPassword}
                    onChange={(e) => handlePwdChange('currentPassword', e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Nouveau mot de passe</Form.Label>
                  <Form.Control
                    type="password"
                    value={pwdForm.newPassword}
                    onChange={(e) => handlePwdChange('newPassword', e.target.value)}
                    required
                    minLength={6}
                    autoComplete="new-password"
                  />
                  <Form.Text className="text-muted">Minimum 6 caracteres</Form.Text>
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label>Confirmer le nouveau mot de passe</Form.Label>
                  <Form.Control
                    type="password"
                    value={pwdForm.confirmPassword}
                    onChange={(e) => handlePwdChange('confirmPassword', e.target.value)}
                    required
                    autoComplete="new-password"
                    isInvalid={
                      pwdForm.confirmPassword !== '' &&
                      pwdForm.confirmPassword !== pwdForm.newPassword
                    }
                  />
                  <Form.Control.Feedback type="invalid">
                    Les mots de passe ne correspondent pas
                  </Form.Control.Feedback>
                </Form.Group>

                <div className="d-flex justify-content-end">
                  <Button type="submit" variant="warning" disabled={isChangingPwd}>
                    {isChangingPwd ? (
                      <><Spinner size="sm" className="me-2" />Modification...</>
                    ) : (
                      <><FiLock className="me-2" />Modifier le mot de passe</>
                    )}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>
    </div>
  );
}
