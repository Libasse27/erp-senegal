import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiLock, FiEye, FiEyeOff, FiAlertCircle, FiCheckCircle, FiArrowLeft } from 'react-icons/fi';
import { useResetPasswordMutation } from '../../redux/api/authApi';

const PasswordStrength = ({ password }) => {
  const checks = [
    { label: '8 caractères minimum', ok: password.length >= 8 },
    { label: 'Une majuscule', ok: /[A-Z]/.test(password) },
    { label: 'Un chiffre', ok: /[0-9]/.test(password) },
    { label: 'Un caractère spécial', ok: /[^A-Za-z0-9]/.test(password) },
  ];
  const score = checks.filter((c) => c.ok).length;
  const colors = ['#e5e7eb', '#ef4444', '#f59e0b', '#10b981', '#1a56db'];
  const labels = ['', 'Faible', 'Moyen', 'Fort', 'Excellent'];

  if (!password) return null;

  return (
    <div style={{ marginTop: '8px' }}>
      <div style={{ display: 'flex', gap: '4px', marginBottom: '6px' }}>
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            style={{
              flex: 1, height: '4px', borderRadius: '2px',
              backgroundColor: i <= score ? colors[score] : '#e5e7eb',
              transition: 'background-color 0.3s',
            }}
          />
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.75rem', color: score > 0 ? colors[score] : '#9ca3af', fontWeight: 500 }}>
          {labels[score]}
        </span>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {checks.map((c) => (
            <span
              key={c.label}
              style={{ fontSize: '0.7rem', color: c.ok ? '#059669' : '#9ca3af', display: 'flex', alignItems: 'center', gap: '2px' }}
            >
              {c.ok ? '✓' : '○'} {c.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

const ResetPasswordPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [resetPassword, { isLoading }] = useResetPasswordMutation();

  const [formData, setFormData] = useState({ password: '', confirm: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    if (formData.password !== formData.confirm) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    try {
      await resetPassword({ token, password: formData.password }).unwrap();
      setSuccess(true);
      toast.success('Mot de passe réinitialisé avec succès');
      setTimeout(() => navigate('/login', { replace: true }), 3000);
    } catch (err) {
      const msg = err.data?.message;
      if (err.status === 400 && msg?.includes('expire')) {
        setError('Ce lien a expiré. Veuillez faire une nouvelle demande.');
      } else if (err.status === 400) {
        setError('Lien de réinitialisation invalide.');
      } else {
        setError(msg || 'Erreur lors de la réinitialisation. Veuillez réessayer.');
      }
    }
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.bgShape1} />
      <div style={styles.bgShape2} />
      <div style={styles.bgShape3} />

      <div style={styles.container}>
        {/* Panneau gauche — Branding */}
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
                <h1 style={styles.brandTitle}>ERP Sénégal</h1>
                <p style={styles.brandTagline}>Gestion Commerciale & Comptable</p>
              </div>
            </div>

            <div style={styles.illustrationContainer}>
              <svg width="110" height="110" viewBox="0 0 120 120" fill="none">
                <circle cx="60" cy="60" r="50" fill="rgba(255,255,255,0.08)" />
                <circle cx="60" cy="60" r="35" fill="rgba(255,255,255,0.06)" />
                <rect x="38" y="50" width="44" height="34" rx="5" fill="rgba(255,255,255,0.25)" />
                <path d="M50 50V40a10 10 0 0120 0v10" stroke="rgba(255,255,255,0.5)" strokeWidth="3" strokeLinecap="round" fill="none" />
                <rect x="55" y="60" width="10" height="14" rx="3" fill="white" opacity="0.8" />
                <circle cx="60" cy="62" r="3" fill="rgba(26,86,219,0.5)" />
              </svg>
            </div>

            <div style={styles.infoList}>
              {[
                'Choisissez un mot de passe sécurisé',
                'Minimum 8 caractères recommandés',
                'Mélangez majuscules, chiffres et symboles',
              ].map((text) => (
                <div key={text} style={styles.infoItem}>
                  <div style={styles.infoCheck}>
                    <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                      <path d="M2 7l3.5 3.5L12 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <span style={styles.infoText}>{text}</span>
                </div>
              ))}
            </div>

            <div style={styles.brandFooter}>
              <p style={styles.brandFooterText}>
                Solution ERP adaptée aux PME/TPE du Sénégal et d'Afrique de l'Ouest
              </p>
            </div>
          </div>
        </div>

        {/* Panneau droit */}
        <div style={styles.formPanel}>
          <div style={styles.formContent}>
            {!success ? (
              <>
                <div style={styles.formHeader}>
                  <div style={styles.iconCircle}>
                    <FiLock size={28} color="#1a56db" />
                  </div>
                  <h2 style={styles.formTitle}>Nouveau mot de passe</h2>
                  <p style={styles.formSubtitle}>
                    Choisissez un nouveau mot de passe sécurisé pour votre compte.
                  </p>
                </div>

                {error && (
                  <div style={styles.errorBox} role="alert">
                    <FiAlertCircle size={18} style={{ flexShrink: 0 }} />
                    <span>{error}</span>
                    <button
                      type="button"
                      onClick={() => setError('')}
                      style={styles.errorClose}
                      aria-label="Fermer"
                    >
                      &times;
                    </button>
                  </div>
                )}

                <form onSubmit={handleSubmit} noValidate>
                  {/* Nouveau mot de passe */}
                  <div style={styles.inputGroup}>
                    <label htmlFor="password" style={styles.label}>
                      Nouveau mot de passe
                    </label>
                    <div style={styles.inputWrapper}>
                      <FiLock size={18} style={styles.inputIcon} aria-hidden="true" />
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Nouveau mot de passe"
                        required
                        autoFocus
                        autoComplete="new-password"
                        style={styles.input}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        style={styles.togglePassword}
                        tabIndex={-1}
                        aria-label={showPassword ? 'Masquer' : 'Afficher'}
                      >
                        {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                      </button>
                    </div>
                    <PasswordStrength password={formData.password} />
                  </div>

                  {/* Confirmation */}
                  <div style={styles.inputGroup}>
                    <label htmlFor="confirm" style={styles.label}>
                      Confirmer le mot de passe
                    </label>
                    <div style={styles.inputWrapper}>
                      <FiLock size={18} style={styles.inputIcon} aria-hidden="true" />
                      <input
                        id="confirm"
                        type={showConfirm ? 'text' : 'password'}
                        name="confirm"
                        value={formData.confirm}
                        onChange={handleChange}
                        placeholder="Confirmer le mot de passe"
                        required
                        autoComplete="new-password"
                        style={{
                          ...styles.input,
                          borderColor: formData.confirm && formData.confirm !== formData.password
                            ? '#fca5a5' : '#e5e7eb',
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm((v) => !v)}
                        style={styles.togglePassword}
                        tabIndex={-1}
                        aria-label={showConfirm ? 'Masquer' : 'Afficher'}
                      >
                        {showConfirm ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                      </button>
                    </div>
                    {formData.confirm && formData.confirm !== formData.password && (
                      <p style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '4px' }}>
                        Les mots de passe ne correspondent pas
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || !formData.password || !formData.confirm}
                    style={{
                      ...styles.submitBtn,
                      ...((isLoading || !formData.password || !formData.confirm) ? styles.submitBtnDisabled : {}),
                    }}
                  >
                    {isLoading ? (
                      <>
                        <span style={styles.spinner} aria-hidden="true" />
                        Réinitialisation en cours...
                      </>
                    ) : (
                      <>
                        <FiLock size={18} style={{ marginRight: '8px' }} />
                        Réinitialiser le mot de passe
                      </>
                    )}
                  </button>
                </form>
              </>
            ) : (
              <div style={styles.successContainer}>
                <div style={styles.successIconCircle}>
                  <FiCheckCircle size={40} color="#059669" />
                </div>
                <h2 style={styles.successTitle}>Mot de passe mis à jour !</h2>
                <p style={styles.successText}>
                  Votre mot de passe a été réinitialisé avec succès.
                  Vous allez être redirigé vers la page de connexion dans quelques secondes.
                </p>
                <Link to="/login" style={styles.loginBtn}>
                  Se connecter maintenant
                </Link>
              </div>
            )}

            <div style={styles.divider}>
              <span style={styles.dividerLine} />
              <span style={styles.dividerLine} />
            </div>

            <Link to="/login" style={styles.backLink}>
              <FiArrowLeft size={16} style={{ marginRight: '0.5rem' }} />
              Retour à la connexion
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  wrapper: {
    minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'linear-gradient(135deg, #f0f4ff 0%, #e8edf5 50%, #f5f0ff 100%)',
    padding: '1rem', position: 'relative', overflow: 'hidden',
  },
  bgShape1: {
    position: 'absolute', top: '-120px', right: '-120px', width: '400px', height: '400px', borderRadius: '50%',
    background: 'linear-gradient(135deg, rgba(26,86,219,0.08), rgba(26,86,219,0.03))', pointerEvents: 'none',
  },
  bgShape2: {
    position: 'absolute', bottom: '-80px', left: '-80px', width: '300px', height: '300px', borderRadius: '50%',
    background: 'linear-gradient(135deg, rgba(5,150,105,0.06), rgba(5,150,105,0.02))', pointerEvents: 'none',
  },
  bgShape3: {
    position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
    width: '600px', height: '600px', borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(26,86,219,0.03) 0%, transparent 70%)', pointerEvents: 'none',
  },
  container: {
    display: 'flex', width: '100%', maxWidth: '960px', minHeight: '580px',
    borderRadius: '20px', overflow: 'hidden',
    boxShadow: '0 20px 60px rgba(0,0,0,0.12), 0 4px 20px rgba(0,0,0,0.06)',
    position: 'relative', zIndex: 1,
  },
  brandPanel: {
    flex: '0 0 42%', background: 'linear-gradient(160deg, #1a56db 0%, #1e40af 40%, #1e3a8a 100%)',
    padding: '2.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', overflow: 'hidden',
  },
  brandContent: { position: 'relative', zIndex: 2 },
  logoContainer: { display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' },
  logoIcon: { flexShrink: 0 },
  brandTitle: { fontSize: '1.75rem', fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '-0.02em', lineHeight: 1.2 },
  brandTagline: { fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', margin: 0, marginTop: '2px' },
  illustrationContainer: { display: 'flex', justifyContent: 'center', marginBottom: '2rem' },
  infoList: { display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' },
  infoItem: { display: 'flex', alignItems: 'center', gap: '0.75rem' },
  infoCheck: {
    width: '22px', height: '22px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.15)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  infoText: { fontSize: '0.85rem', color: 'rgba(255,255,255,0.85)', lineHeight: 1.4 },
  brandFooter: { borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: '1.25rem' },
  brandFooterText: { fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', margin: 0, lineHeight: 1.5 },
  formPanel: {
    flex: 1, backgroundColor: '#fff', padding: '2.5rem',
    display: 'flex', flexDirection: 'column', justifyContent: 'center',
  },
  formContent: { width: '100%', maxWidth: '380px', margin: '0 auto' },
  formHeader: { marginBottom: '2rem', textAlign: 'center' },
  iconCircle: {
    width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#eff6ff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    margin: '0 auto 1.25rem', border: '2px solid #dbeafe',
  },
  formTitle: { fontSize: '1.6rem', fontWeight: 700, color: '#111827', margin: 0, marginBottom: '0.5rem', letterSpacing: '-0.02em' },
  formSubtitle: { fontSize: '0.9rem', color: '#6b7280', margin: 0, lineHeight: 1.6 },
  errorBox: {
    display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.875rem 1rem',
    backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px',
    color: '#dc2626', fontSize: '0.875rem', marginBottom: '1.5rem', lineHeight: 1.4,
  },
  errorClose: {
    background: 'none', border: 'none', color: '#dc2626', fontSize: '1.25rem',
    cursor: 'pointer', padding: 0, marginLeft: 'auto', lineHeight: 1, opacity: 0.6,
  },
  inputGroup: { marginBottom: '1.25rem' },
  label: { display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' },
  inputWrapper: { position: 'relative', display: 'flex', alignItems: 'center' },
  inputIcon: { position: 'absolute', left: '14px', color: '#9ca3af', pointerEvents: 'none', zIndex: 1 },
  input: {
    width: '100%', padding: '0.75rem 1rem 0.75rem 2.75rem', fontSize: '0.95rem',
    border: '1.5px solid #e5e7eb', borderRadius: '10px', outline: 'none',
    transition: 'border-color 0.2s', backgroundColor: '#f9fafb', color: '#111827', boxSizing: 'border-box',
  },
  togglePassword: {
    position: 'absolute', right: '12px', background: 'none', border: 'none',
    color: '#9ca3af', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', zIndex: 1,
  },
  submitBtn: {
    width: '100%', padding: '0.8rem 1.5rem', fontSize: '1rem', fontWeight: 600,
    border: 'none', borderRadius: '10px',
    background: 'linear-gradient(135deg, #1a56db 0%, #1e40af 100%)',
    color: '#fff', cursor: 'pointer', transition: 'opacity 0.15s',
    boxShadow: '0 4px 14px rgba(26,86,219,0.35)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  submitBtnDisabled: { opacity: 0.65, cursor: 'not-allowed', boxShadow: 'none' },
  spinner: {
    display: 'inline-block', width: '16px', height: '16px', marginRight: '8px',
    border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff',
    borderRadius: '50%', animation: 'spin 0.7s linear infinite',
  },
  successContainer: { textAlign: 'center', padding: '1rem 0' },
  successIconCircle: {
    width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#ecfdf5',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    margin: '0 auto 1.5rem', border: '2px solid #a7f3d0',
  },
  successTitle: { fontSize: '1.5rem', fontWeight: 700, color: '#111827', margin: 0, marginBottom: '0.75rem' },
  successText: { fontSize: '0.9rem', color: '#6b7280', margin: '0 0 1.5rem', lineHeight: 1.6 },
  loginBtn: {
    display: 'inline-block', padding: '0.75rem 2rem', borderRadius: '10px',
    background: 'linear-gradient(135deg, #1a56db 0%, #1e40af 100%)',
    color: '#fff', textDecoration: 'none', fontWeight: 600, fontSize: '0.95rem',
    boxShadow: '0 4px 14px rgba(26,86,219,0.35)',
  },
  divider: { display: 'flex', alignItems: 'center', gap: '1rem', margin: '1.75rem 0 1.25rem' },
  dividerLine: { flex: 1, height: '1px', backgroundColor: '#e5e7eb' },
  backLink: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '0.9rem', color: '#1a56db', textDecoration: 'none', fontWeight: 500,
    padding: '0.6rem', borderRadius: '8px',
  },
};

export default ResetPasswordPage;
