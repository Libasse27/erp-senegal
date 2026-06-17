import React, { useState } from 'react';
import {
  FiFileText, FiDownload, FiRefreshCw, FiAlertCircle,
  FiCheckCircle, FiClock, FiXCircle, FiFilter,
} from 'react-icons/fi';
import { useGetMesFacturesSaasQuery } from '../../redux/api/saasApi';

// ── Utilitaires ───────────────────────────────────────────────────────────────

const fmt = (n) => new Intl.NumberFormat('fr-SN').format(Math.round(n ?? 0));

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString('fr-SN', { day: '2-digit', month: 'long', year: 'numeric' })
    : '—';

const StatutBadge = ({ statut }) => {
  const map = {
    PAYEE:   { color: '#059669', bg: '#d1fae5', icon: FiCheckCircle, label: 'Payée' },
    EMISE:   { color: '#d97706', bg: '#fef3c7', icon: FiClock,       label: 'Émise' },
    ANNULEE: { color: '#dc2626', bg: '#fee2e2', icon: FiXCircle,     label: 'Annulée' },
  };
  const { color, bg, icon: Icon, label } = map[statut] || map.EMISE;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, backgroundColor: bg, color, borderRadius: 20, padding: '3px 10px', fontSize: '0.75rem', fontWeight: 600 }}>
      <Icon size={12} /> {label}
    </span>
  );
};

// ── Page principale ───────────────────────────────────────────────────────────

const FacturesSaasPage = () => {
  const [statut, setStatut] = useState('');
  const [page,   setPage]   = useState(1);

  const { data: result, isLoading, isFetching, refetch, error } = useGetMesFacturesSaasQuery({
    page,
    limit: 15,
    ...(statut ? { statut } : {}),
  });

  const factures    = result?.data          || [];
  const pagination  = result?.pagination    || {};
  const totalPages  = pagination.totalPages || 1;

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <h1 style={s.pageTitle}>
            <FiFileText size={20} style={{ marginRight: 10, verticalAlign: 'middle' }} />
            Mes factures d'abonnement
          </h1>
          <p style={s.pageSubtitle}>Historique des factures SaaS émises par la plateforme</p>
        </div>
        <button style={s.refreshBtn} onClick={refetch} disabled={isFetching} title="Actualiser">
          <FiRefreshCw size={14} style={{ animation: isFetching ? 'spin 0.7s linear infinite' : 'none' }} />
          Actualiser
        </button>
      </div>

      {/* Filtre statut */}
      <div style={s.filterBar}>
        <FiFilter size={14} style={{ color: '#6b7280', marginRight: 6 }} />
        <span style={{ fontSize: '0.8rem', color: '#6b7280', marginRight: 8 }}>Statut :</span>
        {['', 'PAYEE', 'EMISE', 'ANNULEE'].map((v) => (
          <button
            key={v}
            style={{ ...s.filterBtn, ...(statut === v ? s.filterBtnActive : {}) }}
            onClick={() => { setStatut(v); setPage(1); }}
          >
            {v || 'Tous'}
          </button>
        ))}
      </div>

      {/* État de chargement */}
      {isLoading ? (
        <div style={s.centered}>
          <div style={s.spinner} />
          <p style={{ color: '#6b7280', marginTop: 12 }}>Chargement des factures…</p>
        </div>
      ) : error ? (
        <div style={s.centered}>
          <FiAlertCircle size={32} color="#ef4444" />
          <p style={{ color: '#dc2626', marginTop: 8 }}>Erreur lors du chargement.</p>
          <button style={s.refreshBtn} onClick={refetch}>Réessayer</button>
        </div>
      ) : factures.length === 0 ? (
        <div style={s.emptyState}>
          <FiFileText size={40} color="#d1d5db" />
          <p style={s.emptyText}>Aucune facture d'abonnement trouvée.</p>
          <p style={s.emptyHint}>Les factures apparaîtront ici après chaque paiement d'abonnement confirmé.</p>
        </div>
      ) : (
        <>
          {/* Table */}
          <div style={s.tableWrap}>
            <table style={s.table}>
              <thead>
                <tr>
                  {['Numéro', 'Date émission', 'Description', 'Montant TTC', 'Statut', 'Actions'].map((h) => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {factures.map((f) => (
                  <tr key={f._id} style={s.tr}>
                    <td style={s.td}>
                      <span style={{ fontWeight: 600, color: '#1a56db', fontFamily: 'monospace' }}>{f.numero}</span>
                    </td>
                    <td style={s.td}>{fmtDate(f.dateEmission)}</td>
                    <td style={s.td}>
                      {f.lignes?.[0]?.description || '—'}
                    </td>
                    <td style={s.td}>
                      <span style={{ fontWeight: 700, color: '#111827' }}>{fmt(f.totalTTC)} FCFA</span>
                    </td>
                    <td style={s.td}><StatutBadge statut={f.statut} /></td>
                    <td style={s.td}>
                      <button
                        style={s.dlBtn}
                        title="Télécharger PDF"
                        onClick={() => alert(`PDF de la facture ${f.numero} — génération PDF à intégrer.`)}
                      >
                        <FiDownload size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={s.pagination}>
              <button style={s.pageBtn} disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                &lsaquo; Précédent
              </button>
              <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                Page {page} / {totalPages} — {pagination.total ?? 0} facture{pagination.total > 1 ? 's' : ''}
              </span>
              <button style={s.pageBtn} disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                Suivant &rsaquo;
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const s = {
  page:         { padding: '1.5rem 2rem', maxWidth: '1100px', margin: '0 auto' },
  header:       { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', flexWrap: 'wrap', gap: 12 },
  pageTitle:    { fontSize: '1.4rem', fontWeight: 800, color: '#111827', margin: 0 },
  pageSubtitle: { fontSize: '0.875rem', color: '#6b7280', margin: '4px 0 0' },
  refreshBtn:   { display: 'flex', alignItems: 'center', gap: 6, padding: '0.4rem 0.875rem', fontSize: '0.8rem', border: '1.5px solid #e5e7eb', borderRadius: 8, backgroundColor: '#fff', color: '#374151', cursor: 'pointer' },

  filterBar:     { display: 'flex', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: 6 },
  filterBtn:     { padding: '4px 14px', fontSize: '0.78rem', border: '1.5px solid #e5e7eb', borderRadius: 20, backgroundColor: '#fff', color: '#6b7280', cursor: 'pointer', fontWeight: 500 },
  filterBtnActive:{ borderColor: '#1a56db', color: '#1a56db', backgroundColor: '#eff6ff' },

  centered:   { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 280 },
  spinner:    { width: 32, height: 32, border: '3px solid #e5e7eb', borderTopColor: '#1a56db', borderRadius: '50%', animation: 'spin 0.7s linear infinite' },
  emptyState: { textAlign: 'center', padding: '3rem 1rem' },
  emptyText:  { fontSize: '1rem', fontWeight: 600, color: '#374151', margin: '1rem 0 0.25rem' },
  emptyHint:  { fontSize: '0.85rem', color: '#9ca3af', margin: 0 },

  tableWrap: { overflowX: 'auto', borderRadius: 12, border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' },
  table:     { width: '100%', borderCollapse: 'collapse', backgroundColor: '#fff' },
  th:        { padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em', backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' },
  tr:        { borderBottom: '1px solid #f3f4f6' },
  td:        { padding: '0.875rem 1rem', fontSize: '0.875rem', color: '#374151', verticalAlign: 'middle' },

  dlBtn:     { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 8, border: '1.5px solid #e5e7eb', backgroundColor: '#fff', color: '#6b7280', cursor: 'pointer' },

  pagination: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, marginTop: '1rem' },
  pageBtn:    { padding: '0.4rem 1rem', fontSize: '0.8rem', border: '1.5px solid #e5e7eb', borderRadius: 8, backgroundColor: '#fff', color: '#374151', cursor: 'pointer' },
};

export default FacturesSaasPage;
