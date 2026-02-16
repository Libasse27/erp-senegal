import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import Card from 'react-bootstrap/Card';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import { useLoginMutation } from '../../redux/api/authApi';
import { setCredentials } from '../../redux/slices/authSlice';
import { useAuth } from '../../contexts/AuthContext';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { isAuthenticated } = useAuth();
  const [login, { isLoading }] = useLoginMutation();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const from = location.state?.from?.pathname || '/';

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const result = await login(formData).unwrap();
      dispatch(
        setCredentials({
          user: result.data.user,
          accessToken: result.data.accessToken,
        })
      );
      toast.success('Connexion reussie');
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.data?.message || 'Erreur de connexion. Veuillez reessayer.');
    }
  };

  return (
    <div
      className="d-flex justify-content-center align-items-center vh-100"
      style={{ backgroundColor: '#f3f4f6' }}
    >
      <Card style={{ width: '100%', maxWidth: 420 }} className="shadow-sm">
        <Card.Body className="p-4">
          <div className="text-center mb-4">
            <h3 className="fw-bold" style={{ color: '#1a56db' }}>
              ERP Senegal
            </h3>
            <p className="text-muted">Gestion Commerciale & Comptable</p>
          </div>

          {error && (
            <Alert variant="danger" onClose={() => setError('')} dismissible>
              {error}
            </Alert>
          )}

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Adresse email</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="votre@email.com"
                required
                autoFocus
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Mot de passe</Form.Label>
              <Form.Control
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Votre mot de passe"
                required
              />
            </Form.Group>

            <div className="d-flex justify-content-between align-items-center mb-3">
              <Form.Check type="checkbox" label="Se souvenir de moi" />
              <a href="/forgot-password" className="text-decoration-none small">
                Mot de passe oublie ?
              </a>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-100"
              disabled={isLoading}
              style={{ backgroundColor: '#1a56db', borderColor: '#1a56db' }}
            >
              {isLoading ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Connexion en cours...
                </>
              ) : (
                'Se connecter'
              )}
            </Button>
          </Form>

          <div className="text-center mt-3">
            <small className="text-muted">
              ERP Commercial & Comptable - SYSCOHADA / OHADA
            </small>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default LoginPage;
