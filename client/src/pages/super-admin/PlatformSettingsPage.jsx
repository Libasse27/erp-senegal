import React, { useState, useEffect } from 'react';
import {
  FiSettings, FiSave, FiRefreshCw, FiAlertCircle,
  FiClock, FiMail, FiCreditCard, FiShield, FiToggleRight,
} from 'react-icons/fi';
import {
  useGetPlatformSettingsQuery,
  useUpdatePlatformSettingsMutation,
} from '../../redux/api/superAdminApi';

// ── Utilitaires ───────────────────────────────────────────────────────────────

const Section = ({ title, icon: Icon, children }) => (
  <div style={s.section}>
    <h2 style={s.sectionTitle}>
      <Icon size={16} style={{ marginRight: 8, color: '#1a56db' }} />
      {title}
    </h2>
    <div style={s.sectionBody}>{children}</div>
  </div>
);

const Field = ({ label, children, hint }) => (
  <div style={s.field}>
    <label style={s.label}>{label}</label>
    {children}
    {hint && <p style={s.hint}>{hint}</p>}
  </div>
);

const Toggle = ({ checked, onChange, label }) => (
  <label style={s.toggleWrap}>
    <span
      style={{ ...s.toggleTrack, backgroundColor: checked ? '#1a56db' : '#d1d5db' }}
      onClick={() => onChange(!checked)}
      role="switch"
      aria-checked={checked}
      tabIndex={0}
      onKeyDown={(e) => e.key === ' ' && onChange(!checked)}
    >
      <span style={{ ...s.toggleThumb, transform: checked ? 'translateX(20px)' : 'translateX(2px)' }} />
    </span>
    <span style={s.toggleLabel}>{label}</span>
  </label>
);

// ── Page principale ───────────────────────────────────────────────────────────

const PlatformSettingsPage = () => {
  const { data: settings, isLoading, refetch } = useGetPlatformSettingsQuery();
  const [updateSettings, { isLoading: saving }] = useUpdatePlatformSettingsMutation();

  const [form, setForm] = useState(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (settings && !form) {
      setForm({
        // Email
        email_fromName:     settings.email?.fromName    || '',
        email_fromAddress:  settings.email?.fromAddress || '',
        email_supportEmail: settings.email?.supportEmail || '',
        // Abonnement
        abo_joursGrace:          settings.abonnement?.joursGrace          ?? 7,
        abo_premierRappelJours:  settings.abonnement?.premierRappelJours  ?? 14,
        abo_deuxiemeRappelJours: settings.abonnement?.deuxiemeRappelJours ?? 3,
        // Sécurité
        sec_maxTentatives:    settings.securite?.maxTentativesConnexion ?? 5,
        sec_dureeVerrouillage:settings.securite?.dureeVerrouillageMin   ?? 30,
        // Paiements
        pay_wave_actif:          settings.paiement?.wave?.actif          ?? true,
        pay_wave_sandbox:        settings.paiement?.wave?.sandbox         ?? true,
        pay_orange_actif:        settings.paiement?.orangeMoney?.actif   ?? true,
        pay_orange_sandbox:      settings.paiement?.orangeMoney?.sandbox  ?? true,
        pay_stripe_actif:        settings.paiement?.stripe?.actif         ?? false,
        // Features
        feat_inscription:  settings.features?.registrationPublique ?? true,
        feat_mfa:          settings.features?.mfaDisponible         ?? true,
        feat_essai:        settings.features?.essaiGratuitActif      ?? true,
        // Branding
        brand_nom:     settings.branding?.nomPlateforme  || '',
        brand_couleur: settings.branding?.couleurPrimaire || '#1a56db',
        brand_site:    settings.branding?.siteweb         || '',
      });
    }
  }, [settings, form]);

  const set = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await updateSettings({
        email: {
          fromName:     form.email_fromName,
          fromAddress:  form.email_fromAddress,
          supportEmail: form.email_supportEmail,
        },
        abonnement: {
          joursGrace:          Number(form.abo_joursGrace),
          premierRappelJours:  Number(form.abo_premierRappelJours),
          deuxiemeRappelJours: Number(form.abo_deuxiemeRappelJours),
        },
        securite: {
          maxTentativesConnexion: Number(form.sec_maxTentatives),
          dureeVerrouillageMin:   Number(form.sec_dureeVerrouillage),
        },
        paiement: {
          wave:        { actif: form.pay_wave_actif,    sandbox: form.pay_wave_sandbox },
          orangeMoney: { actif: form.pay_orange_actif,  sandbox: form.pay_orange_sandbox },
          stripe:      { actif: form.pay_stripe_actif,  sandbox: true },
        },
        features: {
          registrationPublique: form.feat_inscription,
          mfaDisponible:        form.feat_mfa,
          essaiGratuitActif:    form.feat_essai,
        },
        branding: {
          nomPlateforme:   form.brand_nom,
          couleurPrimaire: form.brand_couleur,
          siteweb:         form.brand_site,
        },
      }).unwrap();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err?.data?.message || 'Erreur lors de la sauvegarde.');
    }
  };

  if (isLoading || !form) {
    return (
      <div style={s.loadingWrap}>
        <div style={s.spinner} />
        <p style={{ color: '#6b7280', marginTop: 12 }}>Chargement des paramètres…</p>
      </div>
    );
  }

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <h1 style={s.pageTitle}>
            <FiSettings size={20} style={{ marginRight: 10, verticalAlign: 'middle' }} />
            Paramètres de la plateforme
          </h1>
          <p style={s.pageSubtitle}>Configuration globale SaaS — sans redéploiement</p>
        </div>
        <button style={s.refreshBtn} onClick={refetch} title="Recharger">
          <FiRefreshCw size={14} /> Recharger
        </button>
      </div>

      {saved && (
        <div style={s.banner('#d1fae5', '#059669')}>
          Paramètres enregistrés avec succès.
        </div>
      )}
      {error && (
        <div style={s.banner('#fee2e2', '#dc2626')}>
          <FiAlertCircle size={14} style={{ marginRight: 6 }} />{error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* ── Email ── */}
        <Section title="Email plateforme" icon={FiMail}>
          <div style={s.grid}>
            <Field label="Nom expéditeur">
              <input style={s.input} value={form.email_fromName} onChange={(e) => set('email_fromName', e.target.value)} />
            </Field>
            <Field label="Adresse expéditeur">
              <input style={s.input} type="email" value={form.email_fromAddress} onChange={(e) => set('email_fromAddress', e.target.value)} />
            </Field>
            <Field label="Email support">
              <input style={s.input} type="email" value={form.email_supportEmail} onChange={(e) => set('email_supportEmail', e.target.value)} />
            </Field>
          </div>
        </Section>

        {/* ── Cycle abonnement ── */}
        <Section title="Cycle de vie abonnement" icon={FiClock}>
          <div style={s.grid}>
            <Field label="Jours de grâce après expiration" hint="Accès maintenu pendant cette durée avant suspension">
              <input style={s.input} type="number" min={1} max={30} value={form.abo_joursGrace} onChange={(e) => set('abo_joursGrace', e.target.value)} />
            </Field>
            <Field label="1er rappel avant expiration (jours)">
              <input style={s.input} type="number" min={1} max={60} value={form.abo_premierRappelJours} onChange={(e) => set('abo_premierRappelJours', e.target.value)} />
            </Field>
            <Field label="2e rappel avant expiration (jours)">
              <input style={s.input} type="number" min={1} max={30} value={form.abo_deuxiemeRappelJours} onChange={(e) => set('abo_deuxiemeRappelJours', e.target.value)} />
            </Field>
          </div>
        </Section>

        {/* ── Passerelles paiement ── */}
        <Section title="Passerelles de paiement" icon={FiCreditCard}>
          <div style={s.payGrid}>
            <div style={s.payCard}>
              <p style={s.payTitle}>Wave</p>
              <Toggle checked={form.pay_wave_actif}    onChange={(v) => set('pay_wave_actif', v)}    label="Actif" />
              <Toggle checked={form.pay_wave_sandbox}  onChange={(v) => set('pay_wave_sandbox', v)}  label="Mode sandbox" />
            </div>
            <div style={s.payCard}>
              <p style={s.payTitle}>Orange Money</p>
              <Toggle checked={form.pay_orange_actif}   onChange={(v) => set('pay_orange_actif', v)}   label="Actif" />
              <Toggle checked={form.pay_orange_sandbox} onChange={(v) => set('pay_orange_sandbox', v)} label="Mode sandbox" />
            </div>
            <div style={s.payCard}>
              <p style={s.payTitle}>Stripe</p>
              <Toggle checked={form.pay_stripe_actif} onChange={(v) => set('pay_stripe_actif', v)} label="Actif" />
              <p style={{ fontSize: '0.7rem', color: '#9ca3af', marginTop: 4 }}>Toujours en sandbox</p>
            </div>
          </div>
        </Section>

        {/* ── Sécurité ── */}
        <Section title="Sécurité" icon={FiShield}>
          <div style={s.grid}>
            <Field label="Tentatives max avant verrouillage" hint="Entre 3 et 20">
              <input style={s.input} type="number" min={3} max={20} value={form.sec_maxTentatives} onChange={(e) => set('sec_maxTentatives', e.target.value)} />
            </Field>
            <Field label="Durée de verrouillage (minutes)" hint="Entre 5 et 1440">
              <input style={s.input} type="number" min={5} max={1440} value={form.sec_dureeVerrouillage} onChange={(e) => set('sec_dureeVerrouillage', e.target.value)} />
            </Field>
          </div>
        </Section>

        {/* ── Features ── */}
        <Section title="Fonctionnalités" icon={FiToggleRight}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Toggle checked={form.feat_inscription} onChange={(v) => set('feat_inscription', v)} label="Inscription publique activée (page /register-saas accessible)" />
            <Toggle checked={form.feat_mfa}         onChange={(v) => set('feat_mfa', v)}         label="MFA disponible pour les utilisateurs" />
            <Toggle checked={form.feat_essai}       onChange={(v) => set('feat_essai', v)}       label="Essai gratuit actif pour les nouvelles inscriptions" />
          </div>
        </Section>

        {/* ── Branding ── */}
        <Section title="Branding" icon={FiSettings}>
          <div style={s.grid}>
            <Field label="Nom de la plateforme">
              <input style={s.input} value={form.brand_nom} onChange={(e) => set('brand_nom', e.target.value)} />
            </Field>
            <Field label="Couleur primaire">
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input type="color" value={form.brand_couleur} onChange={(e) => set('brand_couleur', e.target.value)} style={{ width: 44, height: 36, border: 'none', cursor: 'pointer', borderRadius: 6 }} />
                <input style={{ ...s.input, flex: 1 }} value={form.brand_couleur} onChange={(e) => set('brand_couleur', e.target.value)} placeholder="#1a56db" />
              </div>
            </Field>
            <Field label="Site web">
              <input style={s.input} type="url" value={form.brand_site} onChange={(e) => set('brand_site', e.target.value)} placeholder="https://gescom.sn" />
            </Field>
          </div>
        </Section>

        <div style={s.submitRow}>
          <button type="submit" style={s.submitBtn} disabled={saving}>
            <FiSave size={15} />
            {saving ? 'Enregistrement…' : 'Enregistrer les paramètres'}
          </button>
        </div>
      </form>
    </div>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const s = {
  page:         { padding: '1.5rem 2rem', maxWidth: '900px', margin: '0 auto' },
  loadingWrap:  { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px' },
  spinner:      { width: 32, height: 32, border: '3px solid #e5e7eb', borderTopColor: '#1a56db', borderRadius: '50%', animation: 'spin 0.7s linear infinite' },

  header:       { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: 12 },
  pageTitle:    { fontSize: '1.4rem', fontWeight: 800, color: '#111827', margin: 0 },
  pageSubtitle: { fontSize: '0.875rem', color: '#6b7280', margin: '4px 0 0' },
  refreshBtn:   { display: 'flex', alignItems: 'center', gap: 6, padding: '0.4rem 0.875rem', fontSize: '0.8rem', border: '1.5px solid #e5e7eb', borderRadius: 8, backgroundColor: '#fff', color: '#374151', cursor: 'pointer' },

  banner: (bg, color) => ({ backgroundColor: bg, color, border: `1px solid ${color}30`, borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center' }),

  section:      { backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '1.25rem', marginBottom: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' },
  sectionTitle: { fontSize: '0.95rem', fontWeight: 700, color: '#111827', marginBottom: '1rem', display: 'flex', alignItems: 'center' },
  sectionBody:  {},

  grid:    { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' },
  field:   { display: 'flex', flexDirection: 'column', gap: 4 },
  label:   { fontSize: '0.8rem', fontWeight: 600, color: '#374151' },
  hint:    { fontSize: '0.72rem', color: '#9ca3af', margin: '2px 0 0' },
  input:   { border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '0.5rem 0.75rem', fontSize: '0.875rem', outline: 'none', width: '100%', boxSizing: 'border-box' },

  payGrid: { display: 'flex', gap: '1rem', flexWrap: 'wrap' },
  payCard: { flex: '1 1 160px', border: '1.5px solid #e5e7eb', borderRadius: 10, padding: '0.875rem', display: 'flex', flexDirection: 'column', gap: 8 },
  payTitle:{ fontWeight: 700, fontSize: '0.875rem', color: '#111827', margin: 0 },

  toggleWrap:  { display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' },
  toggleTrack: { width: 44, height: 24, borderRadius: 12, position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 },
  toggleThumb: { width: 20, height: 20, backgroundColor: '#fff', borderRadius: '50%', position: 'absolute', top: 2, transition: 'transform 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' },
  toggleLabel: { fontSize: '0.875rem', color: '#374151' },

  submitRow:   { display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' },
  submitBtn:   { display: 'flex', alignItems: 'center', gap: 8, backgroundColor: '#1a56db', color: '#fff', border: 'none', borderRadius: 10, padding: '0.65rem 1.5rem', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer' },
};

export default PlatformSettingsPage;
