import React from 'react';
import { Link } from 'react-router-dom';
import { FiAlertTriangle, FiRefreshCw, FiMail } from 'react-icons/fi';
import { useGetUsageSaasQuery } from '../../redux/api/saasApi';

const SubscriptionExpiredPage = () => {
  const { data: usage } = useGetUsageSaasQuery();
  const forfait = usage?.abonnement?.forfaitId;
  const dateFinStr = usage?.abonnement?.dateFin || usage?.subscriptionEndDate;
  const dateFin = dateFinStr ? new Date(dateFinStr).toLocaleDateString('fr-SN', { day: '2-digit', month: 'long', year: 'numeric' }) : null;

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {/* Icône d'alerte */}
        <div style={styles.iconWrapper}>
          <FiAlertTriangle size={40} color="#dc2626" />
        </div>

        <h1 style={styles.title}>Abonnement expiré</h1>

        <p style={styles.subtitle}>
          Votre abonnement{forfait ? ` ${forfait.nom}` : ''} a expiré
          {dateFin ? ` le ${dateFin}` : ''}.
          <br />
          L'accès aux fonctionnalités est temporairement restreint.
        </p>

        {/* Actions */}
        <div style={styles.actions}>
          <Link to="/abonnement/paiement" style={styles.btnPrimary}>
            <FiRefreshCw size={18} />
            Renouveler maintenant
          </Link>
          <Link to="/pricing" style={styles.btnSecondary}>
            Voir les forfaits
          </Link>
        </div>

        {/* Séparateur */}
        <div style={styles.divider} />

        {/* Accès limité */}
        <div style={styles.accessSection}>
          <p style={styles.accessTitle}>Ce que vous pouvez toujours faire :</p>
          <ul style={styles.accessList}>
            <li>Consulter votre tableau de bord</li>
            <li>Voir l'historique de vos paiements</li>
            <li>Télécharger vos anciens documents</li>
            <li>Contacter le support</li>
          </ul>
        </div>

        {/* Contact support */}
        <a href="mailto:support@erp-senegal.sn" style={styles.supportLink}>
          <FiMail size={15} />
          Contacter le support
        </a>
      </div>
    </div>
  );
};

const styles = {
  page:          { minHeight: '100vh', backgroundColor: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' },
  card:          { width: '100%', maxWidth: '500px', backgroundColor: '#fff', borderRadius: '20px', padding: '2.5rem', boxShadow: '0 8px 32px rgba(220,38,38,0.1)', border: '1.5px solid #fecaca', textAlign: 'center' },
  iconWrapper:   { width: '72px', height: '72px', borderRadius: '50%', backgroundColor: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' },
  title:         { fontSize: '1.75rem', fontWeight: 800, color: '#dc2626', margin: '0 0 0.75rem' },
  subtitle:      { fontSize: '0.95rem', color: '#6b7280', lineHeight: 1.6, margin: '0 0 2rem' },
  actions:       { display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' },
  btnPrimary:    { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '0.9rem 1.5rem', background: 'linear-gradient(135deg,#dc2626,#b91c1c)', color: '#fff', borderRadius: '10px', textDecoration: 'none', fontWeight: 700, fontSize: '1rem' },
  btnSecondary:  { display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.75rem 1.5rem', border: '1.5px solid #e5e7eb', color: '#374151', borderRadius: '10px', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem' },
  divider:       { height: '1px', backgroundColor: '#f3f4f6', margin: '0 0 1.5rem' },
  accessSection: { textAlign: 'left', marginBottom: '1.5rem' },
  accessTitle:   { fontSize: '0.875rem', fontWeight: 700, color: '#374151', marginBottom: '0.5rem' },
  accessList:    { margin: 0, paddingLeft: '1.25rem', fontSize: '0.875rem', color: '#6b7280', lineHeight: 2 },
  supportLink:   { display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#6b7280', textDecoration: 'none', fontSize: '0.875rem' },
};

export default SubscriptionExpiredPage;
