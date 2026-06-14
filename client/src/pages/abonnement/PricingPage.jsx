import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiCheck, FiZap, FiStar, FiAward } from 'react-icons/fi';
import { useGetForfaitsQuery, useGetUsageSaasQuery } from '../../redux/api/saasApi';

const MODULE_LABELS = {
  GESCOM:       'Gestion commerciale',
  FACTURATION:  'Facturation & Devis',
  STOCK:        'Gestion des stocks',
  COMPTABILITE: 'Comptabilité SYSCOHADA',
  REPORTING:    'Rapports & Analytique',
  MULTIDEVISE:  'Multi-devise',
  API:          'Accès API',
};

const FORFAIT_ICONS = { STANDARD: FiZap, PROFESSIONNEL: FiStar, COMPLET: FiAward };
const FORFAIT_COLORS = {
  STANDARD:      { gradient: 'linear-gradient(135deg,#3b82f6,#2563eb)', accent: '#1d4ed8' },
  PROFESSIONNEL: { gradient: 'linear-gradient(135deg,#8b5cf6,#7c3aed)', accent: '#6d28d9' },
  COMPLET:       { gradient: 'linear-gradient(135deg,#f59e0b,#d97706)', accent: '#b45309' },
};

const PricingPage = () => {
  const navigate = useNavigate();
  const [periode, setPeriode] = useState('mensuel');
  const { data: forfaits = [], isLoading } = useGetForfaitsQuery();
  const { data: usage } = useGetUsageSaasQuery();

  const forfaitActifCode = usage?.abonnement?.forfaitId?.code;

  const handleSouscrire = (forfait) => {
    navigate('/abonnement/paiement', { state: { forfaitCode: forfait.code, forfaitId: forfait._id } });
  };

  if (isLoading) return (
    <div style={styles.loading}>
      <div style={styles.spinner} />
      <p>Chargement des forfaits...</p>
    </div>
  );

  return (
    <div style={styles.page}>
      {/* En-tête */}
      <div style={styles.header}>
        <h1 style={styles.pageTitle}>Choisir un forfait</h1>
        <p style={styles.pageSubtitle}>
          Des plans adaptés aux PME et TPE du Sénégal
        </p>

        {/* Toggle mensuel / annuel */}
        <div style={styles.toggle}>
          <button
            style={{ ...styles.toggleBtn, ...(periode === 'mensuel' ? styles.toggleBtnActive : {}) }}
            onClick={() => setPeriode('mensuel')}
          >
            Mensuel
          </button>
          <button
            style={{ ...styles.toggleBtn, ...(periode === 'annuel' ? styles.toggleBtnActive : {}) }}
            onClick={() => setPeriode('annuel')}
          >
            Annuel
            <span style={styles.discount}>-17%</span>
          </button>
        </div>
      </div>

      {/* Grille forfaits */}
      <div style={styles.grid}>
        {forfaits.map((forfait) => {
          const code   = forfait.code || 'STANDARD';
          const colors = FORFAIT_COLORS[code] || FORFAIT_COLORS.STANDARD;
          const Icon   = FORFAIT_ICONS[code] || FiZap;
          const prix   = periode === 'annuel'
            ? Math.round((forfait.prixAnnuel || forfait.prixMensuel * 10) / 12)
            : forfait.prixMensuel || 0;
          const isActuel = code === forfaitActifCode;

          return (
            <div
              key={forfait._id || code}
              style={{ ...styles.card, ...(isActuel ? styles.cardActuel : {}) }}
            >
              {isActuel && <div style={styles.badgeActuel}>Forfait actuel</div>}

              {/* Icône et nom */}
              <div style={{ ...styles.cardTop, background: colors.gradient }}>
                <Icon size={28} color="#fff" />
                <h2 style={styles.forfaitNom}>{forfait.nom}</h2>
              </div>

              {/* Prix */}
              <div style={styles.prixSection}>
                <span style={styles.prix}>
                  {prix.toLocaleString('fr-SN')}
                </span>
                <span style={styles.devise}> FCFA</span>
                <span style={styles.periode}> / mois</span>
                {periode === 'annuel' && (
                  <p style={styles.prixAnnuelNote}>
                    Facturé {(forfait.prixAnnuel || forfait.prixMensuel * 10).toLocaleString('fr-SN')} FCFA / an
                  </p>
                )}
              </div>

              {/* Limites */}
              <div style={styles.limitesSection}>
                {forfait.limites?.maxFacturesMois !== undefined && (
                  <div style={styles.limiteItem}>
                    {forfait.limites.maxFacturesMois === -1
                      ? '✓ Factures illimitées'
                      : `✓ ${forfait.limites.maxFacturesMois} factures / mois`}
                  </div>
                )}
                {forfait.limites?.maxUtilisateurs !== undefined && (
                  <div style={styles.limiteItem}>
                    {forfait.limites.maxUtilisateurs === -1
                      ? '✓ Utilisateurs illimités'
                      : `✓ ${forfait.limites.maxUtilisateurs} utilisateur${forfait.limites.maxUtilisateurs > 1 ? 's' : ''}`}
                  </div>
                )}
                {forfait.limites?.supportPrioritaire && (
                  <div style={{ ...styles.limiteItem, color: colors.accent, fontWeight: 600 }}>
                    ✓ Support prioritaire
                  </div>
                )}
              </div>

              {/* Modules */}
              <div style={styles.modulesSection}>
                <p style={styles.modulesTitle}>Modules inclus</p>
                {(forfait.modulesInclus || []).map((m) => (
                  <div key={m} style={styles.moduleRow}>
                    <FiCheck size={14} color={colors.accent} />
                    <span>{MODULE_LABELS[m] || m}</span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <button
                onClick={() => handleSouscrire(forfait)}
                disabled={isActuel}
                style={{
                  ...styles.cta,
                  ...(isActuel
                    ? styles.ctaActuel
                    : { background: colors.gradient }),
                }}
              >
                {isActuel ? 'Forfait actuel' : 'Souscrire'}
              </button>
            </div>
          );
        })}
      </div>

      <p style={styles.note}>
        Paiements acceptés : Wave, Orange Money · Facturation mensuelle ou annuelle · Sans engagement
      </p>
    </div>
  );
};

const styles = {
  page:           { padding: '2rem', maxWidth: '1100px', margin: '0 auto' },
  loading:        { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '1rem', color: '#6b7280' },
  spinner:        { width: '36px', height: '36px', border: '3px solid #e5e7eb', borderTopColor: '#1a56db', borderRadius: '50%', animation: 'spin 0.7s linear infinite' },
  header:         { textAlign: 'center', marginBottom: '2.5rem' },
  pageTitle:      { fontSize: '1.75rem', fontWeight: 800, color: '#111827', margin: 0 },
  pageSubtitle:   { fontSize: '1rem', color: '#6b7280', margin: '0.5rem 0 1.5rem' },
  toggle:         { display: 'inline-flex', gap: '4px', padding: '4px', backgroundColor: '#f3f4f6', borderRadius: '10px' },
  toggleBtn:      { padding: '8px 20px', borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 500, color: '#6b7280', display: 'flex', alignItems: 'center', gap: '6px' },
  toggleBtnActive:{ background: '#fff', color: '#111827', fontWeight: 700, boxShadow: '0 1px 4px rgba(0,0,0,0.1)' },
  discount:       { padding: '2px 7px', backgroundColor: '#d1fae5', color: '#059669', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 700 },
  grid:           { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' },
  card:           { backgroundColor: '#fff', borderRadius: '16px', border: '1.5px solid #e5e7eb', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', position: 'relative', display: 'flex', flexDirection: 'column' },
  cardActuel:     { border: '2px solid #1a56db', boxShadow: '0 4px 20px rgba(26,86,219,0.15)' },
  badgeActuel:    { position: 'absolute', top: '12px', right: '12px', padding: '4px 10px', backgroundColor: '#fff', color: '#1a56db', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700, border: '1.5px solid #1a56db', zIndex: 1 },
  cardTop:        { padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' },
  forfaitNom:     { fontSize: '1.25rem', fontWeight: 700, color: '#fff', margin: 0 },
  prixSection:    { padding: '1.25rem 1.5rem', borderBottom: '1px solid #f3f4f6' },
  prix:           { fontSize: '2rem', fontWeight: 800, color: '#111827' },
  devise:         { fontSize: '1rem', fontWeight: 600, color: '#374151' },
  periode:        { fontSize: '0.875rem', color: '#9ca3af' },
  prixAnnuelNote: { fontSize: '0.8rem', color: '#9ca3af', margin: '4px 0 0' },
  limitesSection: { padding: '1rem 1.5rem', borderBottom: '1px solid #f3f4f6', display: 'flex', flexDirection: 'column', gap: '4px' },
  limiteItem:     { fontSize: '0.875rem', color: '#374151' },
  modulesSection: { padding: '1rem 1.5rem', flex: 1 },
  modulesTitle:   { fontSize: '0.75rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', marginBottom: '0.5rem', margin: '0 0 8px' },
  moduleRow:      { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', color: '#374151', marginBottom: '5px' },
  cta:            { margin: '1.25rem 1.5rem', padding: '0.75rem', borderRadius: '10px', border: 'none', cursor: 'pointer', fontSize: '0.95rem', fontWeight: 700, color: '#fff', transition: 'opacity 0.15s' },
  ctaActuel:      { background: '#e5e7eb', color: '#9ca3af', cursor: 'default' },
  note:           { textAlign: 'center', fontSize: '0.8rem', color: '#9ca3af', marginTop: '2rem' },
};

export default PricingPage;
