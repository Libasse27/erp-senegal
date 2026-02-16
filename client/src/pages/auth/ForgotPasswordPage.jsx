import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Card from 'react-bootstrap/Card';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import { useForgotPasswordMutation } from '../../redux/api/authApi';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await forgotPassword({ email }).unwrap();
      setSuccess(true);
    } catch (err) {
      setError(err.data?.message || "Erreur lors de l'envoi. Veuillez reessayer.");
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
              Mot de passe oublie
            </h3>
            <p className="text-muted">
              Entrez votre adresse email pour recevoir un lien de reinitialisation.
            </p>
          </div>

          {error && (
            <Alert variant="danger" onClose={() => setError('')} dismissible>
              {error}
            </Alert>
          )}

          {success ? (
            <Alert variant="success">
              Un email de reinitialisation a ete envoye a <strong>{email}</strong>.
              Verifiez votre boite de reception.
            </Alert>
          ) : (
            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3">
                <Form.Label>Adresse email</Form.Label>
                <Form.Control
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  required
                  autoFocus
                />
              </Form.Group>

              <Button
                type="submit"
                variant="primary"
                className="w-100 mb-3"
                disabled={isLoading}
                style={{ backgroundColor: '#1a56db', borderColor: '#1a56db' }}
              >
                {isLoading ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Envoi en cours...
                  </>
                ) : (
                  'Envoyer le lien'
                )}
              </Button>
            </Form>
          )}

          <div className="text-center">
            <Link to="/login" className="text-decoration-none small">
              Retour a la connexion
            </Link>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default ForgotPasswordPage;
