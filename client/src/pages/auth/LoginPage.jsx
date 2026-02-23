import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import { FiMail, FiLock, FiEye, FiEyeOff, FiLogIn, FiAlertCircle } from 'react-icons/fi';
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
  const [showPassword, setShowPassword] = useState(false);

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
    <div style={styles.wrapper}>
      {/* Decorative background shapes */}
      <div style={styles.bgShape1} />
      <div style={styles.bgShape2} />
      <div style={styles.bgShape3} />

      <div style={styles.container}>
        {/* Left panel - Branding */}
        <div style={styles.brandPanel}>
          <div style={styles.brandContent}>
            <div style={styles.logoContainer}>
              <div style={styles.logoIcon}>
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                  <rect width="40" height="40" rx="10" fill="white" fillOpacity="0.2" />
                  <path d="M10 14h20v3H10zM10 20h14v3H10zM10 26h18v3H10z" fill="white" />
                </svg>
              </div>
              <div>
                <h1 style={styles.brandTitle}>ERP Senegal</h1>
                <p style={styles.brandTagline}>Gestion Commerciale & Comptable</p>
              </div>
            </div>

            <div style={styles.featuresList}>
              <FeatureItem text="Gestion commerciale complete" />
              <FeatureItem text="Comptabilite SYSCOHADA / OHADA" />
              <FeatureItem text="Facturation conforme DGI" />
              <FeatureItem text="Tableaux de bord en temps reel" />
              <FeatureItem text="Multi-depots et gestion des stocks" />
            </div>

            <div style={styles.brandFooter}>
              <p style={styles.brandFooterText}>
                Solution ERP adaptee aux PME/TPE du Senegal et d'Afrique de l'Ouest
              </p>
            </div>
          </div>
        </div>

        {/* Right panel - Login form */}
        <div style={styles.formPanel}>
          <div style={styles.formContent}>
            <div style={styles.formHeader}>
              <h2 style={styles.formTitle}>Bienvenue</h2>
              <p style={styles.formSubtitle}>
                Connectez-vous pour acceder a votre espace de gestion
              </p>
            </div>

            {error && (
              <div style={styles.errorBox}>
                <FiAlertCircle size={18} style={{ flexShrink: 0 }} />
                <span>{error}</span>
                <button
                  onClick={() => setError('')}
                  style={styles.errorClose}
                  aria-label="Fermer"
                >
                  &times;
                </button>
              </div>
            )}

            <Form onSubmit={handleSubmit}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Adresse email</label>
                <div style={styles.inputWrapper}>
                  <FiMail size={18} style={styles.inputIcon} />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="votre@email.com"
                    required
                    autoFocus
                    autoComplete="email"
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Mot de passe</label>
                <div style={styles.inputWrapper}>
                  <FiLock size={18} style={styles.inputIcon} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Votre mot de passe"
                    required
                    autoComplete="current-password"
                    style={styles.input}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={styles.togglePassword}
                    tabIndex={-1}
                    aria-label={showPassword ? 'Masquer' : 'Afficher'}
                  >
                    {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                  </button>
                </div>
              </div>

              <div style={styles.optionsRow}>
                <Form.Check
                  type="checkbox"
                  label="Se souvenir de moi"
                  id="rememberMe"
                  style={{ fontSize: '0.875rem' }}
                />
                <Link to="/forgot-password" style={styles.forgotLink}>
                  Mot de passe oublie ?
                </Link>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                style={{
                  ...styles.submitBtn,
                  ...(isLoading ? styles.submitBtnLoading : {}),
                }}
                className="w-100"
              >
                {isLoading ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Connexion en cours...
                  </>
                ) : (
                  <>
                    <FiLogIn size={18} className="me-2" />
                    Se connecter
                  </>
                )}
              </Button>
            </Form>

            <div style={styles.divider}>
              <span style={styles.dividerLine} />
              <span style={styles.dividerText}>SYSCOHADA / OHADA</span>
              <span style={styles.dividerLine} />
            </div>

            <p style={styles.footer}>
              ERP Commercial & Comptable &mdash; Conforme aux normes senegalaises
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const FeatureItem = ({ text }) => (
  <div style={styles.featureItem}>
    <div style={styles.featureCheck}>
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M2 7l3.5 3.5L12 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
    <span style={styles.featureText}>{text}</span>
  </div>
);

const styles = {
  wrapper: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #f0f4ff 0%, #e8edf5 50%, #f5f0ff 100%)',
    padding: '1rem',
    position: 'relative',
    overflow: 'hidden',
  },
  bgShape1: {
    position: 'absolute',
    top: '-120px',
    right: '-120px',
    width: '400px',
    height: '400px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, rgba(26, 86, 219, 0.08), rgba(26, 86, 219, 0.03))',
    pointerEvents: 'none',
  },
  bgShape2: {
    position: 'absolute',
    bottom: '-80px',
    left: '-80px',
    width: '300px',
    height: '300px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, rgba(5, 150, 105, 0.06), rgba(5, 150, 105, 0.02))',
    pointerEvents: 'none',
  },
  bgShape3: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '600px',
    height: '600px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(26, 86, 219, 0.03) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  container: {
    display: 'flex',
    width: '100%',
    maxWidth: '960px',
    minHeight: '580px',
    borderRadius: '20px',
    overflow: 'hidden',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.12), 0 4px 20px rgba(0, 0, 0, 0.06)',
    position: 'relative',
    zIndex: 1,
  },
  brandPanel: {
    flex: '0 0 42%',
    background: 'linear-gradient(160deg, #1a56db 0%, #1e40af 40%, #1e3a8a 100%)',
    padding: '2.5rem',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  brandContent: {
    position: 'relative',
    zIndex: 2,
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    marginBottom: '2.5rem',
  },
  logoIcon: {
    flexShrink: 0,
  },
  brandTitle: {
    fontSize: '1.75rem',
    fontWeight: 800,
    color: '#ffffff',
    margin: 0,
    letterSpacing: '-0.02em',
    lineHeight: 1.2,
  },
  brandTagline: {
    fontSize: '0.85rem',
    color: 'rgba(255, 255, 255, 0.7)',
    margin: 0,
    marginTop: '2px',
  },
  featuresList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.875rem',
    marginBottom: '2.5rem',
  },
  featureItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  featureCheck: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  featureText: {
    fontSize: '0.9rem',
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 1.4,
  },
  brandFooter: {
    borderTop: '1px solid rgba(255, 255, 255, 0.15)',
    paddingTop: '1.25rem',
  },
  brandFooterText: {
    fontSize: '0.8rem',
    color: 'rgba(255, 255, 255, 0.5)',
    margin: 0,
    lineHeight: 1.5,
  },
  formPanel: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: '2.5rem',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },
  formContent: {
    width: '100%',
    maxWidth: '380px',
    margin: '0 auto',
  },
  formHeader: {
    marginBottom: '2rem',
  },
  formTitle: {
    fontSize: '1.75rem',
    fontWeight: 700,
    color: '#111827',
    margin: 0,
    marginBottom: '0.5rem',
    letterSpacing: '-0.02em',
  },
  formSubtitle: {
    fontSize: '0.9rem',
    color: '#6b7280',
    margin: 0,
    lineHeight: 1.5,
  },
  errorBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.875rem 1rem',
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '10px',
    color: '#dc2626',
    fontSize: '0.875rem',
    marginBottom: '1.5rem',
    lineHeight: 1.4,
  },
  errorClose: {
    background: 'none',
    border: 'none',
    color: '#dc2626',
    fontSize: '1.25rem',
    cursor: 'pointer',
    padding: 0,
    marginLeft: 'auto',
    lineHeight: 1,
    opacity: 0.6,
  },
  inputGroup: {
    marginBottom: '1.25rem',
  },
  label: {
    display: 'block',
    fontSize: '0.85rem',
    fontWeight: 600,
    color: '#374151',
    marginBottom: '0.5rem',
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: '14px',
    color: '#9ca3af',
    pointerEvents: 'none',
    zIndex: 1,
  },
  input: {
    width: '100%',
    padding: '0.75rem 1rem 0.75rem 2.75rem',
    fontSize: '0.95rem',
    border: '1.5px solid #e5e7eb',
    borderRadius: '10px',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    backgroundColor: '#f9fafb',
    color: '#111827',
  },
  togglePassword: {
    position: 'absolute',
    right: '12px',
    background: 'none',
    border: 'none',
    color: '#9ca3af',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    zIndex: 1,
  },
  optionsRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
  },
  forgotLink: {
    fontSize: '0.85rem',
    color: '#1a56db',
    textDecoration: 'none',
    fontWeight: 500,
  },
  submitBtn: {
    padding: '0.8rem 1.5rem',
    fontSize: '1rem',
    fontWeight: 600,
    border: 'none',
    borderRadius: '10px',
    background: 'linear-gradient(135deg, #1a56db 0%, #1e40af 100%)',
    color: '#ffffff',
    cursor: 'pointer',
    transition: 'transform 0.15s, box-shadow 0.15s',
    boxShadow: '0 4px 14px rgba(26, 86, 219, 0.35)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnLoading: {
    opacity: 0.85,
    cursor: 'not-allowed',
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    margin: '1.75rem 0 1rem',
  },
  dividerLine: {
    flex: 1,
    height: '1px',
    backgroundColor: '#e5e7eb',
  },
  dividerText: {
    fontSize: '0.7rem',
    color: '#9ca3af',
    fontWeight: 600,
    letterSpacing: '0.08em',
  },
  footer: {
    textAlign: 'center',
    fontSize: '0.8rem',
    color: '#9ca3af',
    margin: 0,
  },
};

export default LoginPage;
