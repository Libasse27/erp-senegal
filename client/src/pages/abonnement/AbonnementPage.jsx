import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiRefreshCw, FiLayers, FiAlertTriangle, FiCheckCircle, FiClock, FiUsers, FiFileText, FiArrowRight } from 'react-icons/fi';
import { useGetUsageSaasQuery, useGetPaiementsSaasQuery } from '../../redux/api/saasApi';

const STATUS_CONFIG = {
  active:          { label: 'Actif',       color: '#059669', bg: '#d1fae5', icon: FiCheckCircle },
  expired:         { label: 'Expiré',      color: '#dc2626', bg: '#fee2e2', icon: FiAlertTriangle },
  suspended:       { label: 'Suspendu',    color: '#d97706', bg: '#fef3c7', icon: FiAlertTriangle },
  pending_payment: { label: 'En attente',  color: '#6b7280', bg: '#f3f4f6', icon: FiClock },
};

const UsageBar = ({ label, icon: Icon, value, max, color }) => {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const barColor = pct >= 100 ? '#dc2626' : pct >= 80 ? '#d97706' : color || '#1a56db';

  return (
    <div style={{ marginBottom: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.875rem', color: '#374151' }}>
          <Icon size={15} />
          {label}
        </div>
        <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>
          {max === -1 ? `${value} / illimité` : `${value} / ${max}`}
        </span>
      </div>
      <div style={{ height: '8px', borderRadius: '4px', backgroundColor: '#e5e7eb', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${max === -1 ? 0 : pct}%`, backgroundColor: barColor, borderRadius: '4px', transition: 'width 0.4s ease' }} />
      </div>
    </div>
  );
};

const AbonnementPage = () => {
  const navigate = useNavigate();
  const { data: usage, isLoading, isError } = useGetUsageSaasQuery();
  const { data: paiementsRes } = useGetPaiementsSaasQuery({ limit: 5 });

  const paiements = paiementsRes?.data || [];
  const status = usage?.companyStatus || 'pending_payment';
  const statusConf = STATUS_CONFIG[status] || STATUS_CONFIG.pending_payment;
  const StatusIcon = statusConf.icon;

  const abonnement = usage?.abonnement;
  const forfait = abonnement?.forfaitId;
  const dateFinStr = abonnement?.dateFin || usage?.subscriptionEndDate;
  const dateFin = dateFinStr ? new Date(dateFinStr) : null;
  const joursRestants = dateFin ? Math.max(0, Math.ceil((dateFin - Date.now()) / 86400000)) : null;

  if (isLoading) return (
    <div style={styles.loading}>
      <div style={styles.spinner} />
      <p>Chargement de l'abonnement...</p>
    </div>
  );

  if (isError) return (
    <div style={styles.errorBox}>
      <FiAlertTriangle size={20} />
      Impossible de charger les informations d'abonnement.
    </div>
  );

  return (
    <div style={styles.page}>
      {/* En-tête */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.pageTitle}>Mon Abonnement</h1>
          <p style={styles.pageSubtitle}>Gérez votre forfait et vos paiements</p>
        </div>
        <div style={styles.headerActions}>
          <Link to="/abonnement/paiement" style={styles.btnPrimary}>
            <FiRefreshCw size={16} />
            Renouveler
          </Link>
          <Link to="/pricing" style={styles.btnSecondary}>
            <FiLayers size={16} />
            Changer de forfait
          </Link>
        </div>
      </div>

      {/* Alertes */}
      {(usage?.alertes || []).map((alerte, i) => (
        <div key={i} style={styles.alertBanner}>
          <FiAlertTriangle size={16} />
          {alerte}
        </div>
      ))}

      <div style={styles.grid}>
        {/* Carte statut */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h3 style={styles.cardTitle}>Statut de l'abonnement</h3>
          </div>
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div style={{ ...styles.statusBadge, color: statusConf.color, backgroundColor: statusConf.bg }}>
              <StatusIcon size={18} />
              {statusConf.label}
            </div>
            {forfait && (
              <div style={{ marginTop: '1rem' }}>
                <p style={styles.forfaitName}>{forfait.nom}</p>
                <p style={styles.forfaitPrice}>
                  {(forfait.prixMensuel || 0).toLocaleString('fr-SN')} FCFA / mois
                </p>
              </div>
            )}
            {joursRestants !== null && status === 'active' && (
              <div style={{ marginTop: '0.75rem', fontSize: '0.875rem', color: joursRestants <= 7 ? '#dc2626' : '#6b7280' }}>
                <FiClock size={14} style={{ marginRight: '4px' }} />
                {joursRestants === 0 ? 'Expire aujourd\'hui' : `Expire dans ${joursRestants} jour${joursRestants > 1 ? 's' : ''}`}
              </div>
            )}
            {dateFin && (
              <p style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '0.25rem' }}>
                {status === 'expired' ? 'Expiré le' : 'Valide jusqu\'au'} {dateFin.toLocaleDateString('fr-SN', { day: '2-digit', month: 'long', year: 'numeric' })}
              </p>
            )}
          </div>

          {status === 'expired' && (
            <div style={styles.expiredCta}>
              <p style={{ fontSize: '0.875rem', color: '#dc2626', marginBottom: '0.75rem', textAlign: 'center' }}>
                Votre accès est restreint. Renouvelez pour continuer.
              </p>
              <Link to="/abonnement/paiement" style={{ ...styles.btnPrimary, justifyContent: 'center' }}>
                Renouveler maintenant <FiArrowRight size={14} />
              </Link>
            </div>
          )}
        </div>

        {/* Carte usage */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h3 style={styles.cardTitle}>Utilisation ce mois</h3>
          </div>
          <UsageBar
            label="Factures émises"
            icon={FiFileText}
            value={usage?.facturesMois || 0}
            max={usage?.limites?.maxFacturesMois ?? -1}
          />
          <UsageBar
            label="Utilisateurs actifs"
            icon={FiUsers}
            value={usage?.utilisateurs || 0}
            max={usage?.limites?.maxUtilisateurs ?? -1}
            color="#059669"
          />
          {forfait?.modulesInclus?.length > 0 && (
            <div style={{ marginTop: '1rem' }}>
              <p style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '6px', fontWeight: 600 }}>MODULES INCLUS</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {forfait.modulesInclus.map((m) => (
                  <span key={m} style={styles.moduleBadge}>{m}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Historique paiements */}
      <div style={{ ...styles.card, marginTop: '1.5rem' }}>
        <div style={{ ...styles.cardHeader, marginBottom: '1rem' }}>
          <h3 style={styles.cardTitle}>Historique des paiements</h3>
          <Link to="/abonnement/historique" style={{ fontSize: '0.875rem', color: '#1a56db', textDecoration: 'none' }}>
            Voir tout
          </Link>
        </div>
        {paiements.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#9ca3af', padding: '2rem 0', fontSize: '0.875rem' }}>
            Aucun paiement enregistré
          </p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                {['Référence', 'Méthode', 'Montant', 'Date', 'Statut'].map((h) => (
                  <th key={h} style={styles.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paiements.map((p) => (
                <tr key={p._id} style={styles.tr}>
                  <td style={styles.td}><code style={{ fontSize: '0.8rem' }}>{p.reference}</code></td>
                  <td style={styles.td}>{p.methode}</td>
                  <td style={styles.td}>{(p.montant || 0).toLocaleString('fr-SN')} FCFA</td>
                  <td style={styles.td}>{p.createdAt ? new Date(p.createdAt).toLocaleDateString('fr-SN') : '—'}</td>
                  <td style={styles.td}>
                    <span style={{
                      padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600,
                      ...(p.statut === 'REUSSI'    ? { color: '#059669', backgroundColor: '#d1fae5' } :
                         p.statut === 'ECHOUE'     ? { color: '#dc2626', backgroundColor: '#fee2e2' } :
                         p.statut === 'EN_ATTENTE' ? { color: '#d97706', backgroundColor: '#fef3c7' } :
                                                     { color: '#6b7280', backgroundColor: '#f3f4f6' }),
                    }}>{p.statut}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

const styles = {
  page:         { padding: '2rem', maxWidth: '960px', margin: '0 auto' },
  loading:      { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '1rem', color: '#6b7280' },
  spinner:      { width: '36px', height: '36px', border: '3px solid #e5e7eb', borderTopColor: '#1a56db', borderRadius: '50%', animation: 'spin 0.7s linear infinite' },
  errorBox:     { display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem', backgroundColor: '#fee2e2', color: '#dc2626', borderRadius: '10px', margin: '2rem' },
  header:       { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' },
  pageTitle:    { fontSize: '1.5rem', fontWeight: 700, color: '#111827', margin: 0 },
  pageSubtitle: { fontSize: '0.9rem', color: '#6b7280', margin: '4px 0 0' },
  headerActions:{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' },
  btnPrimary:   { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '0.6rem 1.25rem', background: 'linear-gradient(135deg,#1a56db,#1e40af)', color: '#fff', borderRadius: '8px', textDecoration: 'none', fontWeight: 600, fontSize: '0.875rem' },
  btnSecondary: { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '0.6rem 1.25rem', background: '#fff', color: '#374151', border: '1.5px solid #e5e7eb', borderRadius: '8px', textDecoration: 'none', fontWeight: 600, fontSize: '0.875rem' },
  alertBanner:  { display: 'flex', alignItems: 'center', gap: '8px', padding: '0.75rem 1rem', backgroundColor: '#fef3c7', borderLeft: '4px solid #f59e0b', borderRadius: '8px', color: '#92400e', fontSize: '0.875rem', marginBottom: '0.75rem' },
  grid:         { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' },
  card:         { backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  cardHeader:   { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' },
  cardTitle:    { fontSize: '1rem', fontWeight: 700, color: '#111827', margin: 0 },
  statusBadge:  { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 16px', borderRadius: '20px', fontSize: '0.9rem', fontWeight: 700 },
  forfaitName:  { fontSize: '1.25rem', fontWeight: 700, color: '#1a56db', margin: '0.5rem 0 0' },
  forfaitPrice: { fontSize: '0.9rem', color: '#6b7280', margin: '4px 0 0' },
  expiredCta:   { marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid #fee2e2' },
  moduleBadge:  { padding: '3px 10px', backgroundColor: '#eff6ff', color: '#1d4ed8', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600 },
  table:        { width: '100%', borderCollapse: 'collapse' },
  th:           { padding: '0.625rem 0.75rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', borderBottom: '2px solid #f3f4f6' },
  td:           { padding: '0.75rem', fontSize: '0.875rem', color: '#374151', borderBottom: '1px solid #f3f4f6' },
  tr:           { transition: 'background 0.1s' },
};

export default AbonnementPage;
