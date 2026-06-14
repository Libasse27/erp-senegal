import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiMail, FiSend, FiAlertCircle, FiCheckCircle, FiArrowLeft, FiRefreshCw } from 'react-icons/fi';
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
      const msg = err.data?.message;
      if (err.status === 429) {
        setError('Trop de demandes. Attendez quelques minutes avant de réessayer.');
      } else {
        setError(msg || "Erreur lors de l'envoi. Veuillez réessayer.");
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
                <rect x="40" y="52" width="40" height="32" rx="4" fill="rgba(255,255,255,0.25)" />
                <path d="M48 52V42a12 12 0 0124 0v10" stroke="rgba(255,255,255,0.5)" strokeWidth="3" strokeLinecap="round" fill="none" />
                <circle cx="60" cy="66" r="4" fill="white" />
                <rect x="58.5" y="69" width="3" height="6" rx="1.5" fill="white" />
              </svg>
            </div>

            <div style={styles.infoList}>
              {[
                'Un email sécurisé vous sera envoyé',
                'Le lien expire après 30 minutes',
                'Vérifiez vos spams si besoin',
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

        {/* Panneau droit — Formulaire */}
        <div style={styles.formPanel}>
          <div style={styles.formContent}>
            {!success ? (
              <>
                <div style={styles.formHeader}>
                  <div style={styles.iconCircle}>
                    <FiMail size={28} color="#1a56db" />
                  </div>
                  <h2 style={styles.formTitle}>Mot de passe oublié ?</h2>
                  <p style={styles.formSubtitle}>
                    Entrez votre adresse email et nous vous enverrons un lien
                    de réinitialisation.
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
                  <div style={styles.inputGroup}>
                    <label htmlFor="email" style={styles.label}>
                      Adresse email
                    </label>
                    <div style={styles.inputWrapper}>
                      <FiMail size={18} style={styles.inputIcon} aria-hidden="true" />
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); if (error) setError(''); }}
                        placeholder="votre@email.com"
                        required
                        autoFocus
                        autoComplete="email"
                        style={styles.input}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || !email}
                    style={{
                      ...styles.submitBtn,
                      ...((isLoading || !email) ? styles.submitBtnDisabled : {}),
                    }}
                  >
                    {isLoading ? (
                      <>
                        <span style={styles.spinner} aria-hidden="true" />
                        Envoi en cours...
                      </>
                    ) : (
                      <>
                        <FiSend size={18} style={{ marginRight: '8px' }} />
                        Envoyer le lien
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
                <h2 style={styles.successTitle}>Email envoyé !</h2>
                <p style={styles.successText}>
                  Un email de réinitialisation a été envoyé à
                </p>
                <p style={styles.successEmail}>{email}</p>
                <p style={styles.successHint}>
                  Vérifiez votre boîte de réception et suivez les instructions.
                  Si vous ne le trouvez pas, vérifiez vos spams.
                </p>
                <button
                  type="button"
                  onClick={() => { setSuccess(false); setEmail(''); }}
                  style={styles.resendBtn}
                >
                  <FiRefreshCw size={14} style={{ marginRight: '6px' }} />
                  Renvoyer l'email
                </button>
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
    display: 'flex', width: '100%', maxWidth: '960px', minHeight: '560px',
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
  inputGroup: { marginBottom: '1.5rem' },
  label: { display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' },
  inputWrapper: { position: 'relative', display: 'flex', alignItems: 'center' },
  inputIcon: { position: 'absolute', left: '14px', color: '#9ca3af', pointerEvents: 'none', zIndex: 1 },
  input: {
    width: '100%', padding: '0.75rem 1rem 0.75rem 2.75rem', fontSize: '0.95rem',
    border: '1.5px solid #e5e7eb', borderRadius: '10px', outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s', backgroundColor: '#f9fafb', color: '#111827', boxSizing: 'border-box',
  },
  submitBtn: {
    width: '100%', padding: '0.8rem 1.5rem', fontSize: '1rem', fontWeight: 600,
    border: 'none', borderRadius: '10px',
    background: 'linear-gradient(135deg, #1a56db 0%, #1e40af 100%)',
    color: '#fff', cursor: 'pointer', transition: 'opacity 0.15s, box-shadow 0.15s',
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
  successText: { fontSize: '0.9rem', color: '#6b7280', margin: 0, lineHeight: 1.5 },
  successEmail: { fontSize: '1rem', fontWeight: 600, color: '#1a56db', margin: '0.25rem 0 1rem' },
  successHint: { fontSize: '0.825rem', color: '#9ca3af', margin: '0 0 1.5rem', lineHeight: 1.6 },
  resendBtn: {
    display: 'inline-flex', alignItems: 'center', background: 'none',
    border: '1.5px solid #e5e7eb', borderRadius: '10px', padding: '0.6rem 1.5rem',
    fontSize: '0.875rem', fontWeight: 500, color: '#374151', cursor: 'pointer',
    transition: 'border-color 0.2s',
  },
  divider: { display: 'flex', alignItems: 'center', gap: '1rem', margin: '1.75rem 0 1.25rem' },
  dividerLine: { flex: 1, height: '1px', backgroundColor: '#e5e7eb' },
  backLink: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '0.9rem', color: '#1a56db', textDecoration: 'none', fontWeight: 500,
    padding: '0.6rem', borderRadius: '8px', transition: 'background-color 0.2s',
  },
};

export default ForgotPasswordPage;
