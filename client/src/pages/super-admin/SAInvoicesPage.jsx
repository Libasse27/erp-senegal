import React, { useState } from 'react';
import {
  FiFileText, FiDollarSign, FiCheckCircle, FiClock,
  FiRefreshCw, FiAlertCircle, FiFilter,
} from 'react-icons/fi';
import {
  useGetSaasInvoicesQuery,
  useGetSaasInvoiceStatsQuery,
} from '../../redux/api/superAdminApi';

// ── Utilitaires ───────────────────────────────────────────────────────────────

const fmt = (n) => new Intl.NumberFormat('fr-SN').format(Math.round(n ?? 0));

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('fr-SN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const StatutBadge = ({ statut }) => {
  const map = {
    PAYEE:   { color: '#059669', bg: '#d1fae5', label: 'Payée' },
    EMISE:   { color: '#d97706', bg: '#fef3c7', label: 'Émise' },
    ANNULEE: { color: '#dc2626', bg: '#fee2e2', label: 'Annulée' },
  };
  const { color, bg, label } = map[statut] || map.EMISE;
  return (
    <span style={{ backgroundColor: bg, color, borderRadius: 20, padding: '3px 10px', fontSize: '0.72rem', fontWeight: 700, display: 'inline-block' }}>
      {label}
    </span>
  );
};

// ── KPI Card compacte ──────────────────────────────────────────────────────────

const KpiCard = ({ label, value, color, icon: Icon }) => (
  <div style={{ ...s.card, borderTop: `3px solid ${color}`, flex: 1 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div>
        <p style={s.kpiLabel}>{label}</p>
        <p style={{ ...s.kpiValue, color }}>{value}</p>
      </div>
      <div style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={18} color={color} />
      </div>
    </div>
  </div>
);

// ── Page principale ───────────────────────────────────────────────────────────

const SAInvoicesPage = () => {
  const [statut, setStatut]             = useState('');
  const [page,   setPage]               = useState(1);

  const { data: statsData, isLoading: loadingStats } = useGetSaasInvoiceStatsQuery();
  const { data: result, isLoading, isFetching, refetch, error } = useGetSaasInvoicesQuery({
    page, limit: 20,
    ...(statut ? { statut } : {}),
  });

  const factures   = result?.data          || [];
  const pagination = result?.pagination    || {};
  const totalPages = pagination.totalPages || 1;

  return (
    <div style={s.page}>
      {/* En-tête */}
      <div style={s.header}>
        <div>
          <h1 style={s.pageTitle}>
            <FiFileText size={20} style={{ marginRight: 10, verticalAlign: 'middle' }} />
            Factures SaaS — Toutes entreprises
          </h1>
          <p style={s.pageSubtitle}>Vue Super Admin · Facturation d'abonnements plateforme</p>
        </div>
        <button style={s.refreshBtn} onClick={refetch} disabled={isFetching}>
          <FiRefreshCw size={14} style={{ animation: isFetching ? 'spin 0.7s linear infinite' : 'none' }} />
          Actualiser
        </button>
      </div>

      {/* KPI row */}
      {!loadingStats && statsData && (
        <div style={s.kpiRow}>
          <KpiCard
            label="Total encaissé"
            value={`${fmt(statsData.totalEncaisse)} FCFA`}
            color="#059669"
            icon={FiDollarSign}
          />
          <KpiCard
            label="Factures payées"
            value={statsData.parStatut?.PAYEE?.count ?? 0}
            color="#1a56db"
            icon={FiCheckCircle}
          />
          <KpiCard
            label="Factures émises"
            value={statsData.parStatut?.EMISE?.count ?? 0}
            color="#d97706"
            icon={FiClock}
          />
          <KpiCard
            label="Total factures"
            value={statsData.nombreFactures ?? 0}
            color="#7c3aed"
            icon={FiFileText}
          />
        </div>
      )}

      {/* Filtre statut */}
      <div style={s.filterBar}>
        <FiFilter size={14} style={{ color: '#6b7280', marginRight: 6 }} />
        {['', 'PAYEE', 'EMISE', 'ANNULEE'].map((v) => (
          <button
            key={v}
            style={{ ...s.filterBtn, ...(statut === v ? s.filterBtnActive : {}) }}
            onClick={() => { setStatut(v); setPage(1); }}
          >
            {v || 'Toutes'}
          </button>
        ))}
      </div>

      {/* Tableau */}
      {isLoading ? (
        <div style={s.centered}>
          <div style={s.spinner} />
          <p style={{ color: '#6b7280', marginTop: 12 }}>Chargement…</p>
        </div>
      ) : error ? (
        <div style={s.centered}>
          <FiAlertCircle size={32} color="#ef4444" />
          <p style={{ color: '#dc2626', marginTop: 8 }}>Erreur lors du chargement.</p>
          <button style={s.refreshBtn} onClick={refetch}>Réessayer</button>
        </div>
      ) : factures.length === 0 ? (
        <div style={s.centered}>
          <FiFileText size={40} color="#d1d5db" />
          <p style={{ color: '#6b7280', marginTop: 12 }}>Aucune facture trouvée.</p>
        </div>
      ) : (
        <>
          <div style={s.tableWrap}>
            <table style={s.table}>
              <thead>
                <tr>
                  {['Numéro', 'Entreprise', 'Date émission', 'Description', 'Total TTC', 'Statut'].map((h) => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {factures.map((f) => (
                  <tr key={f._id} style={s.tr}>
                    <td style={s.td}>
                      <span style={{ fontWeight: 700, color: '#1a56db', fontFamily: 'monospace', fontSize: '0.82rem' }}>{f.numero}</span>
                    </td>
                    <td style={s.td}>
                      <div style={{ fontWeight: 600, color: '#111827', fontSize: '0.85rem' }}>{f.entrepriseId?.name || '—'}</div>
                      <div style={{ fontSize: '0.72rem', color: '#9ca3af' }}>{f.entrepriseId?.email || ''}</div>
                    </td>
                    <td style={s.td}>{fmtDate(f.dateEmission)}</td>
                    <td style={s.td}>
                      <span style={{ fontSize: '0.82rem', color: '#374151' }}>{f.lignes?.[0]?.description || '—'}</span>
                    </td>
                    <td style={s.td}>
                      <span style={{ fontWeight: 800, color: '#111827' }}>{fmt(f.totalTTC)} FCFA</span>
                    </td>
                    <td style={s.td}><StatutBadge statut={f.statut} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={s.pagination}>
              <button style={s.pageBtn} disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>&lsaquo; Précédent</button>
              <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>Page {page} / {totalPages} — {pagination.total ?? 0} factures</span>
              <button style={s.pageBtn} disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Suivant &rsaquo;</button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const s = {
  page:         { padding: '1.5rem 2rem', maxWidth: '1200px', margin: '0 auto' },
  header:       { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', flexWrap: 'wrap', gap: 12 },
  pageTitle:    { fontSize: '1.4rem', fontWeight: 800, color: '#111827', margin: 0 },
  pageSubtitle: { fontSize: '0.875rem', color: '#6b7280', margin: '4px 0 0' },
  refreshBtn:   { display: 'flex', alignItems: 'center', gap: 6, padding: '0.4rem 0.875rem', fontSize: '0.8rem', border: '1.5px solid #e5e7eb', borderRadius: 8, backgroundColor: '#fff', color: '#374151', cursor: 'pointer' },

  kpiRow:    { display: 'flex', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap' },
  card:      { backgroundColor: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: '1rem 1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', minWidth: 160 },
  kpiLabel:  { fontSize: '0.72rem', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 6px' },
  kpiValue:  { fontSize: '1.35rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' },

  filterBar:      { display: 'flex', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: 6 },
  filterBtn:      { padding: '4px 14px', fontSize: '0.78rem', border: '1.5px solid #e5e7eb', borderRadius: 20, backgroundColor: '#fff', color: '#6b7280', cursor: 'pointer', fontWeight: 500 },
  filterBtnActive:{ borderColor: '#1a56db', color: '#1a56db', backgroundColor: '#eff6ff' },

  centered:   { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 240 },
  spinner:    { width: 32, height: 32, border: '3px solid #e5e7eb', borderTopColor: '#1a56db', borderRadius: '50%', animation: 'spin 0.7s linear infinite' },

  tableWrap: { overflowX: 'auto', borderRadius: 12, border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' },
  table:     { width: '100%', borderCollapse: 'collapse', backgroundColor: '#fff' },
  th:        { padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.72rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em', backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap' },
  tr:        { borderBottom: '1px solid #f3f4f6' },
  td:        { padding: '0.875rem 1rem', fontSize: '0.875rem', color: '#374151', verticalAlign: 'middle' },

  pagination: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, marginTop: '1rem' },
  pageBtn:    { padding: '0.4rem 1rem', fontSize: '0.8rem', border: '1.5px solid #e5e7eb', borderRadius: 8, backgroundColor: '#fff', color: '#374151', cursor: 'pointer' },
};

export default SAInvoicesPage;
