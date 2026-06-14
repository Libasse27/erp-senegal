import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { FiSmartphone, FiCreditCard, FiCheckCircle, FiAlertCircle, FiExternalLink, FiArrowLeft, FiRefreshCw } from 'react-icons/fi';
import { useGetForfaitsQuery, useGetUsageSaasQuery, useInitierPaiementSaasMutation, useGetStatutPaiementSaasQuery } from '../../redux/api/saasApi';

const METHODES = [
  { code: 'WAVE',         label: 'Wave',         icon: FiSmartphone, color: '#1a73e8', desc: 'Paiement rapide via Wave CI' },
  { code: 'ORANGE_MONEY', label: 'Orange Money', icon: FiSmartphone, color: '#ff6600', desc: 'Paiement via Orange Money Sénégal' },
];

const PaiementSaasPage = () => {
  const location = useLocation();
  const navigate  = useNavigate();

  const forfaitCode = location.state?.forfaitCode;
  const forfaitId   = location.state?.forfaitId;

  const { data: usage }    = useGetUsageSaasQuery();
  const { data: forfaits } = useGetForfaitsQuery();

  // Trouver l'abonnement EN_ATTENTE de la company
  const abonnement = usage?.abonnement;
  const abonnementId = abonnement?._id;

  const [methode,    setMethode]    = useState('WAVE');
  const [reference,  setReference]  = useState(null);
  const [checkoutUrl,setCheckoutUrl]= useState(null);
  const [montant,    setMontant]    = useState(null);
  const [error,      setError]      = useState('');
  const [initiated,  setInitiated]  = useState(false);

  const [initierPaiement, { isLoading: isInitiating }] = useInitierPaiementSaasMutation();

  const { data: statut, refetch: refetchStatut } = useGetStatutPaiementSaasQuery(reference, {
    skip: !reference,
    pollingInterval: reference && statut?.statut === 'EN_ATTENTE' ? 4000 : 0,
  });

  const forfait = forfaitCode
    ? (forfaits || []).find((f) => f.code === forfaitCode)
    : abonnement?.forfaitId;

  const handleInitier = async () => {
    setError('');
    if (!abonnementId) {
      setError('Aucun abonnement en attente trouvé. Contactez le support.');
      return;
    }
    try {
      const res = await initierPaiement({ abonnementId, methode }).unwrap();
      setReference(res.data.reference);
      setCheckoutUrl(res.data.checkoutUrl);
      setMontant(res.data.montant);
      setInitiated(true);
    } catch (err) {
      setError(err.data?.message || 'Impossible d\'initier le paiement.');
    }
  };

  const paiementReussi  = statut?.statut === 'REUSSI';
  const paiementEchoue  = statut?.statut === 'ECHOUE';

  // Succès → rediriger vers abonnement après 3s
  useEffect(() => {
    if (paiementReussi) {
      const t = setTimeout(() => navigate('/abonnement'), 3000);
      return () => clearTimeout(t);
    }
  }, [paiementReussi, navigate]);

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        {/* Navigation retour */}
        <Link to="/abonnement" style={styles.backLink}>
          <FiArrowLeft size={16} /> Retour à mon abonnement
        </Link>

        <h1 style={styles.title}>Paiement de l'abonnement</h1>

        {/* Récap forfait */}
        {forfait && (
          <div style={styles.forfaitCard}>
            <div>
              <p style={styles.forfaitLabel}>Forfait sélectionné</p>
              <p style={styles.forfaitNom}>{forfait.nom}</p>
            </div>
            <div style={styles.forfaitPrix}>
              {(montant || forfait.prixMensuel || 0).toLocaleString('fr-SN')} <span style={{ fontSize: '0.9rem' }}>FCFA</span>
            </div>
          </div>
        )}

        {/* ── Succès ── */}
        {paiementReussi && (
          <div style={styles.successBox}>
            <FiCheckCircle size={40} color="#059669" />
            <h2 style={{ color: '#059669', margin: '0.75rem 0 0.25rem' }}>Paiement confirmé !</h2>
            <p style={{ color: '#065f46', margin: 0 }}>Votre abonnement est maintenant actif. Redirection en cours...</p>
          </div>
        )}

        {/* ── Checkout URL (attente de paiement) ── */}
        {initiated && !paiementReussi && !paiementEchoue && (
          <div style={styles.checkoutBox}>
            <div style={styles.pulseIcon}>
              <FiSmartphone size={28} color="#1a56db" />
            </div>
            <h2 style={styles.checkoutTitle}>Finalisez votre paiement</h2>
            <p style={styles.checkoutDesc}>
              Cliquez sur le bouton ci-dessous pour ouvrir la page de paiement {methode === 'WAVE' ? 'Wave' : 'Orange Money'}.
            </p>
            <a href={checkoutUrl} target="_blank" rel="noopener noreferrer" style={styles.checkoutBtn}>
              <FiExternalLink size={16} />
              Payer {methode === 'WAVE' ? 'via Wave' : 'via Orange Money'}
            </a>
            <p style={styles.refNote}>Référence : <code>{reference}</code></p>
            <div style={styles.pollingInfo}>
              <div style={styles.dot} />
              En attente de confirmation du paiement...
              <button onClick={refetchStatut} style={styles.refreshBtn} title="Vérifier maintenant">
                <FiRefreshCw size={13} />
              </button>
            </div>
          </div>
        )}

        {/* ── Échec ── */}
        {paiementEchoue && (
          <div style={styles.errorBox}>
            <FiAlertCircle size={28} color="#dc2626" />
            <p style={{ color: '#dc2626', fontWeight: 600, margin: '0.5rem 0 0' }}>Le paiement a échoué.</p>
            <button onClick={() => { setInitiated(false); setReference(null); setError(''); }} style={styles.retryBtn}>
              Réessayer
            </button>
          </div>
        )}

        {/* ── Formulaire initial ── */}
        {!initiated && (
          <>
            {error && (
              <div style={styles.alertError}>
                <FiAlertCircle size={16} />
                {error}
              </div>
            )}

            <div style={styles.section}>
              <p style={styles.sectionTitle}>Choisir un moyen de paiement</p>
              <div style={styles.methodesGrid}>
                {METHODES.map((m) => (
                  <button
                    key={m.code}
                    onClick={() => setMethode(m.code)}
                    style={{
                      ...styles.methodeCard,
                      ...(methode === m.code ? { ...styles.methodeCardActive, borderColor: m.color } : {}),
                    }}
                  >
                    <m.icon size={24} color={m.color} />
                    <span style={styles.methodeLabel}>{m.label}</span>
                    <span style={styles.methodeDesc}>{m.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleInitier}
              disabled={isInitiating || !abonnementId}
              style={{
                ...styles.submitBtn,
                ...(!abonnementId || isInitiating ? styles.submitBtnDisabled : {}),
              }}
            >
              {isInitiating ? (
                <><span style={styles.spinner} /> Initialisation...</>
              ) : (
                `Payer via ${methode === 'WAVE' ? 'Wave' : 'Orange Money'}`
              )}
            </button>

            {!abonnementId && (
              <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                Aucun abonnement en attente. <Link to="/pricing" style={{ color: '#1a56db' }}>Choisir un forfait</Link>
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const styles = {
  page:             { minHeight: '100vh', backgroundColor: '#f9fafb', padding: '2rem 1rem', display: 'flex', alignItems: 'flex-start', justifyContent: 'center' },
  container:        { width: '100%', maxWidth: '520px', backgroundColor: '#fff', borderRadius: '16px', padding: '2rem', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', border: '1px solid #e5e7eb' },
  backLink:         { display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#6b7280', textDecoration: 'none', fontSize: '0.875rem', marginBottom: '1.25rem' },
  title:            { fontSize: '1.5rem', fontWeight: 700, color: '#111827', margin: '0 0 1.5rem' },
  forfaitCard:      { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', backgroundColor: '#eff6ff', borderRadius: '10px', border: '1.5px solid #bfdbfe', marginBottom: '1.5rem' },
  forfaitLabel:     { fontSize: '0.75rem', color: '#3b82f6', fontWeight: 600, textTransform: 'uppercase', margin: '0 0 2px' },
  forfaitNom:       { fontSize: '1rem', fontWeight: 700, color: '#1e40af', margin: 0 },
  forfaitPrix:      { fontSize: '1.5rem', fontWeight: 800, color: '#1a56db' },
  section:          { marginBottom: '1.5rem' },
  sectionTitle:     { fontSize: '0.875rem', fontWeight: 700, color: '#374151', marginBottom: '0.75rem' },
  methodesGrid:     { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' },
  methodeCard:      { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', padding: '1rem', border: '1.5px solid #e5e7eb', borderRadius: '10px', background: '#fff', cursor: 'pointer', transition: 'all 0.15s' },
  methodeCardActive:{ backgroundColor: '#eff6ff', boxShadow: '0 0 0 3px rgba(26,86,219,0.1)' },
  methodeLabel:     { fontSize: '0.9rem', fontWeight: 700, color: '#111827' },
  methodeDesc:      { fontSize: '0.75rem', color: '#6b7280', textAlign: 'center' },
  alertError:       { display: 'flex', alignItems: 'center', gap: '8px', padding: '0.75rem 1rem', backgroundColor: '#fee2e2', color: '#dc2626', borderRadius: '8px', fontSize: '0.875rem', marginBottom: '1rem' },
  submitBtn:        { width: '100%', padding: '0.85rem', background: 'linear-gradient(135deg,#1a56db,#1e40af)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '1rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' },
  submitBtnDisabled:{ opacity: 0.6, cursor: 'not-allowed' },
  spinner:          { display: 'inline-block', width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' },
  successBox:       { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem', backgroundColor: '#ecfdf5', borderRadius: '12px', border: '1.5px solid #6ee7b7', textAlign: 'center' },
  checkoutBox:      { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem 1.5rem', backgroundColor: '#eff6ff', borderRadius: '12px', border: '1.5px solid #bfdbfe', textAlign: 'center', gap: '0.75rem' },
  pulseIcon:        { width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  checkoutTitle:    { fontSize: '1.1rem', fontWeight: 700, color: '#1e40af', margin: 0 },
  checkoutDesc:     { fontSize: '0.875rem', color: '#3b82f6', margin: 0 },
  checkoutBtn:      { display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '0.75rem 1.5rem', background: 'linear-gradient(135deg,#1a56db,#1e40af)', color: '#fff', borderRadius: '10px', textDecoration: 'none', fontWeight: 700, fontSize: '0.95rem' },
  refNote:          { fontSize: '0.8rem', color: '#6b7280' },
  pollingInfo:      { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#6b7280' },
  dot:              { width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#34d399', animation: 'pulse 1.5s infinite' },
  refreshBtn:       { background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: '2px', display: 'flex' },
  errorBox:         { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1.5rem', backgroundColor: '#fee2e2', borderRadius: '12px', border: '1.5px solid #fca5a5', textAlign: 'center', gap: '0.5rem' },
  retryBtn:         { marginTop: '0.5rem', padding: '0.6rem 1.5rem', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 },
};

export default PaiementSaasPage;
