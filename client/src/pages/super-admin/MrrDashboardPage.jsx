import React, { useState } from 'react';
import {
  FiTrendingUp, FiTrendingDown, FiUsers, FiDollarSign,
  FiActivity, FiAlertCircle, FiRefreshCw, FiBarChart2,
  FiArrowUp, FiArrowDown, FiMinus,
} from 'react-icons/fi';
import { useGetMrrStatsQuery, useGetMrrHistoriqueQuery } from '../../redux/api/superAdminApi';

// ─── Utilitaires ─────────────────────────────────────────────────────────────

const fmt = (n) => new Intl.NumberFormat('fr-SN').format(Math.round(n ?? 0));

const GrowthBadge = ({ value }) => {
  if (value === null || value === undefined) return <span style={s.badgeNeutral}>—</span>;
  const positive = value >= 0;
  const Icon = value === 0 ? FiMinus : positive ? FiArrowUp : FiArrowDown;
  return (
    <span style={{ ...s.badge, ...(positive ? s.badgePos : s.badgeNeg) }}>
      <Icon size={11} />
      {Math.abs(value)}%
    </span>
  );
};

// ─── KPI Card ────────────────────────────────────────────────────────────────

const KpiCard = ({ label, value, sub, icon: Icon, color, badge }) => (
  <div style={{ ...s.card, borderTop: `3px solid ${color}` }}>
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
      <div>
        <p style={s.kpiLabel}>{label}</p>
        <p style={{ ...s.kpiValue, color }}>{value}</p>
        {sub && <p style={s.kpiSub}>{sub}</p>}
      </div>
      <div style={{ ...s.kpiIconBox, backgroundColor: color + '15' }}>
        <Icon size={20} color={color} />
      </div>
    </div>
    {badge !== undefined && (
      <div style={{ marginTop: '0.5rem' }}>
        <GrowthBadge value={badge} />
        <span style={{ fontSize: '0.72rem', color: '#9ca3af', marginLeft: '6px' }}>vs mois dernier</span>
      </div>
    )}
  </div>
);

// ─── Bar Chart (CSS pur) ──────────────────────────────────────────────────────

const BarChart = ({ historique, maxMois }) => {
  const [hovered, setHovered] = useState(null);
  if (!historique?.length) return null;

  return (
    <div style={s.chartWrap}>
      <div style={s.chartBars}>
        {historique.map((m, i) => {
          const pct = maxMois > 0 ? (m.revenus / maxMois) * 100 : 0;
          const isHovered = hovered === i;
          return (
            <div
              key={i}
              style={s.barCol}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            >
              {isHovered && m.revenus > 0 && (
                <div style={s.tooltip}>
                  <strong>{fmt(m.revenus)} FCFA</strong>
                  <span style={{ color: '#9ca3af', fontSize: '0.7rem' }}>{m.nbPaiements} paiement{m.nbPaiements > 1 ? 's' : ''}</span>
                </div>
              )}
              <div style={s.barTrack}>
                <div
                  style={{
                    ...s.bar,
                    height: `${Math.max(pct, 2)}%`,
                    background: isHovered
                      ? 'linear-gradient(180deg,#1e40af,#1a56db)'
                      : 'linear-gradient(180deg,#3b82f6,#1a56db)',
                  }}
                />
              </div>
              <div style={s.barLabel}>{m.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Page principale ──────────────────────────────────────────────────────────

const MrrDashboardPage = () => {
  const { data: stats, isLoading: loadingStats, refetch: refetchStats, error: errStats } = useGetMrrStatsQuery();
  const { data: histo, isLoading: loadingHisto, refetch: refetchHisto } = useGetMrrHistoriqueQuery();

  const refetch = () => { refetchStats(); refetchHisto(); };

  if (loadingStats || loadingHisto) {
    return (
      <div style={s.loadingWrap}>
        <div style={s.spinner} />
        <p style={{ color: '#6b7280', marginTop: '1rem' }}>Calcul des métriques MRR…</p>
      </div>
    );
  }

  if (errStats) {
    return (
      <div style={s.errorWrap}>
        <FiAlertCircle size={32} color="#ef4444" />
        <p style={{ color: '#dc2626', marginTop: '0.5rem' }}>Erreur lors du chargement des métriques.</p>
        <button style={s.refetchBtn} onClick={refetch}>Réessayer</button>
      </div>
    );
  }

  const mrrCroissancePositive = (stats?.mrrCroissance ?? 0) >= 0;
  const netMrrPositive        = (stats?.mrrNet ?? 0) >= 0;

  return (
    <div style={s.page}>
      {/* En-tête */}
      <div style={s.header}>
        <div>
          <h1 style={s.pageTitle}>
            <FiBarChart2 size={22} style={{ marginRight: '10px', verticalAlign: 'middle' }} />
            MRR / ARR Dashboard
          </h1>
          <p style={s.pageSubtitle}>Métriques de revenus récurrents de la plateforme</p>
        </div>
        <button style={s.refetchBtn} onClick={refetch} title="Actualiser">
          <FiRefreshCw size={15} />
          Actualiser
        </button>
      </div>

      {/* ── KPI Revenus ──────────────────────────────────────────────────────── */}
      <div style={s.kpiGrid}>
        <KpiCard
          label="MRR (revenu mensuel récurrent)"
          value={`${fmt(stats?.mrr)} FCFA`}
          sub="Abonnements actifs + en grâce"
          icon={FiDollarSign}
          color="#1a56db"
          badge={stats?.mrrCroissance}
        />
        <KpiCard
          label="ARR (revenu annuel récurrent)"
          value={`${fmt(stats?.arr)} FCFA`}
          sub="MRR × 12"
          icon={FiTrendingUp}
          color="#059669"
        />
        <KpiCard
          label="MRR net ce mois"
          value={`${netMrrPositive ? '+' : ''}${fmt(stats?.mrrNet)} FCFA`}
          sub={`+${fmt(stats?.nouveauMrr)} nouveau · -${fmt(stats?.mrrPerdu)} perdu`}
          icon={netMrrPositive ? FiArrowUp : FiArrowDown}
          color={netMrrPositive ? '#059669' : '#ef4444'}
        />
        <KpiCard
          label="Taux de churn"
          value={`${stats?.tauxChurn ?? 0} %`}
          sub="Abonnements expirés ce mois"
          icon={FiActivity}
          color={stats?.tauxChurn > 5 ? '#ef4444' : '#f59e0b'}
        />
      </div>

      {/* ── KPI Abonnés ──────────────────────────────────────────────────────── */}
      <div style={{ ...s.kpiGrid, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        <KpiCard label="Abonnés actifs"   value={stats?.abonnesActifs ?? 0}   icon={FiUsers}       color="#1a56db" />
        <KpiCard label="En essai gratuit" value={stats?.abonnesEssai ?? 0}    icon={FiActivity}    color="#8b5cf6" />
        <KpiCard label="En période grâce" value={stats?.abonnesGrace ?? 0}    icon={FiAlertCircle} color="#f59e0b" />
        <KpiCard label="En attente paiement" value={stats?.abonnesAttente ?? 0} icon={FiMinus}     color="#9ca3af" />
      </div>

      <div style={s.row}>
        {/* ── Graphique historique ──────────────────────────────────────────── */}
        <div style={{ ...s.card, flex: 2 }}>
          <div style={s.sectionHeader}>
            <h2 style={s.sectionTitle}>Revenus mensuels (12 derniers mois)</h2>
            {histo?.totalAnnee > 0 && (
              <span style={s.totalBadge}>
                Total : {fmt(histo.totalAnnee)} FCFA
              </span>
            )}
          </div>
          <BarChart historique={histo?.historique} maxMois={histo?.maxMois} />
          {(!histo?.historique?.length || histo?.totalAnnee === 0) && (
            <p style={s.emptyMsg}>Aucun paiement confirmé sur les 12 derniers mois.</p>
          )}
        </div>

        {/* ── MRR par plan ─────────────────────────────────────────────────── */}
        <div style={{ ...s.card, flex: 1 }}>
          <h2 style={s.sectionTitle}>MRR par plan</h2>
          {stats?.parPlan?.length ? (
            <div style={{ marginTop: '1rem' }}>
              {stats.parPlan.map((plan) => {
                const pct = stats.mrr > 0 ? Math.round((plan.mrr / stats.mrr) * 100) : 0;
                const colors = { STANDARD: '#059669', PROFESSIONNEL: '#1a56db', COMPLET: '#7c3aed' };
                const col = colors[plan.code] || '#6b7280';
                return (
                  <div key={plan.code} style={s.planRow}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 600, color: '#111827', fontSize: '0.875rem' }}>{plan.nom}</span>
                      <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>{plan.abonnes} abonné{plan.abonnes > 1 ? 's' : ''}</span>
                    </div>
                    <div style={s.planBarTrack}>
                      <div style={{ ...s.planBar, width: `${pct}%`, backgroundColor: col }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                      <span style={{ fontSize: '0.78rem', color: col, fontWeight: 700 }}>{fmt(plan.mrr)} FCFA/mois</span>
                      <span style={{ fontSize: '0.72rem', color: '#9ca3af' }}>{pct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p style={s.emptyMsg}>Aucun abonnement actif.</p>
          )}
        </div>
      </div>

      <p style={s.note}>
        MRR calculé sur les abonnements <strong>ACTIF</strong> et <strong>EN_PERIODE_GRACE</strong>.
        Les abonnements annuels sont ramenés à une contribution mensuelle (montant / 12).
      </p>
    </div>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = {
  page:         { padding: '1.5rem 2rem', maxWidth: '1400px', margin: '0 auto' },
  loadingWrap:  { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px' },
  errorWrap:    { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '0.5rem' },
  spinner:      { width: '36px', height: '36px', border: '3px solid #e5e7eb', borderTopColor: '#1a56db', borderRadius: '50%', animation: 'spin 0.7s linear infinite' },

  header:       { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' },
  pageTitle:    { fontSize: '1.5rem', fontWeight: 800, color: '#111827', margin: 0 },
  pageSubtitle: { fontSize: '0.875rem', color: '#6b7280', margin: '4px 0 0' },

  refetchBtn:   { display: 'flex', alignItems: 'center', gap: '6px', padding: '0.5rem 1rem', fontSize: '0.875rem', fontWeight: 500, border: '1.5px solid #e5e7eb', borderRadius: '8px', backgroundColor: '#fff', color: '#374151', cursor: 'pointer', whiteSpace: 'nowrap' },

  kpiGrid:      { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1rem' },
  card:         { backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '1.25rem', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' },
  kpiLabel:     { fontSize: '0.78rem', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 6px' },
  kpiValue:     { fontSize: '1.5rem', fontWeight: 800, margin: '0 0 2px', letterSpacing: '-0.02em' },
  kpiSub:       { fontSize: '0.75rem', color: '#9ca3af', margin: 0 },
  kpiIconBox:   { width: '42px', height: '42px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },

  badge:        { display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '2px 7px', borderRadius: '10px', fontSize: '0.72rem', fontWeight: 700 },
  badgePos:     { backgroundColor: '#d1fae5', color: '#059669' },
  badgeNeg:     { backgroundColor: '#fee2e2', color: '#dc2626' },
  badgeNeutral: { backgroundColor: '#f3f4f6', color: '#9ca3af', display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '2px 7px', borderRadius: '10px', fontSize: '0.72rem', fontWeight: 700 },

  row:          { display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' },

  sectionHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' },
  sectionTitle:  { fontSize: '1rem', fontWeight: 700, color: '#111827', margin: 0 },
  totalBadge:    { fontSize: '0.8rem', fontWeight: 600, color: '#1a56db', backgroundColor: '#eff6ff', padding: '3px 10px', borderRadius: '20px' },

  chartWrap:    { marginTop: '1.25rem', height: '180px', position: 'relative' },
  chartBars:    { display: 'flex', alignItems: 'flex-end', height: '100%', gap: '4px' },
  barCol:       { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', position: 'relative', cursor: 'default' },
  barTrack:     { width: '100%', height: '140px', display: 'flex', alignItems: 'flex-end', backgroundColor: '#f3f4f6', borderRadius: '4px 4px 0 0', overflow: 'hidden' },
  bar:          { width: '100%', borderRadius: '4px 4px 0 0', transition: 'height 0.3s ease' },
  barLabel:     { fontSize: '0.6rem', color: '#9ca3af', textAlign: 'center', whiteSpace: 'nowrap', transform: 'rotate(-35deg)', transformOrigin: 'top center', marginTop: '6px' },

  tooltip:      { position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#1e293b', color: '#fff', padding: '6px 10px', borderRadius: '8px', fontSize: '0.72rem', whiteSpace: 'nowrap', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', marginBottom: '6px' },

  planRow:      { marginBottom: '1.25rem' },
  planBarTrack: { height: '8px', backgroundColor: '#f3f4f6', borderRadius: '4px', overflow: 'hidden' },
  planBar:      { height: '100%', borderRadius: '4px', transition: 'width 0.4s ease' },

  emptyMsg:     { fontSize: '0.85rem', color: '#9ca3af', textAlign: 'center', padding: '2rem 0' },
  note:         { fontSize: '0.75rem', color: '#9ca3af', marginTop: '1.5rem', textAlign: 'center', lineHeight: 1.6 },
};

export default MrrDashboardPage;
