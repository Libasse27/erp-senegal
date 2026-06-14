import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  FiUser, FiMail, FiLock, FiPhone, FiEye, FiEyeOff,
  FiBriefcase, FiMapPin, FiCheck, FiAlertCircle,
  FiArrowLeft, FiArrowRight, FiCheckCircle, FiStar,
  FiUsers, FiZap, FiAward,
} from 'react-icons/fi';
import { useRegisterSaaSMutation } from '../../redux/api/authApi';

// ─── Données forfaits ─────────────────────────────────────────────────────────

const FORFAITS = [
  {
    code: 'STANDARD',
    nom: 'Standard',
    icon: FiZap,
    couleur: '#059669',
    couleurBg: '#ecfdf5',
    couleurBorder: '#a7f3d0',
    description: 'Idéal pour les TPE et petits commerces',
    prixMensuel: 15000,
    prixAnnuel: 150000,
    maxUsers: '3 utilisateurs',
    modules: ['Gestion commerciale', 'Facturation', 'Gestion des stocks'],
    populaire: false,
  },
  {
    code: 'PROFESSIONNEL',
    nom: 'Professionnel',
    icon: FiStar,
    couleur: '#1a56db',
    couleurBg: '#eff6ff',
    couleurBorder: '#93c5fd',
    description: 'Pour les PME en croissance',
    prixMensuel: 35000,
    prixAnnuel: 350000,
    maxUsers: '10 utilisateurs',
    modules: ['Gestion commerciale', 'Facturation', 'Stocks', 'Comptabilité SYSCOHADA', 'Reporting'],
    populaire: true,
  },
  {
    code: 'COMPLET',
    nom: 'Complet',
    icon: FiAward,
    couleur: '#7c3aed',
    couleurBg: '#f5f3ff',
    couleurBorder: '#c4b5fd',
    description: 'Solution tout-en-un pour entreprises établies',
    prixMensuel: 75000,
    prixAnnuel: 750000,
    maxUsers: 'Utilisateurs illimités',
    modules: ['Tout Professionnel', 'Paie', 'Accès API', 'Support prioritaire'],
    populaire: false,
  },
];

const LEGAL_FORMS = ['SARL', 'SA', 'SAS', 'SASU', 'SNC', 'EI', 'GIE', 'Autre'];

const SECTEURS = [
  'Commerce général', 'Import / Export', 'Restauration / Hôtellerie',
  'BTP / Construction', 'Services informatiques', 'Transport / Logistique',
  'Santé / Pharmacie', 'Agriculture / Agro-alimentaire',
  'Finance / Assurance', 'Industrie / Manufacture', 'Autre',
];

const CITIES_SN = [
  'Dakar', 'Thiès', 'Saint-Louis', 'Ziguinchor', 'Kaolack',
  'Touba', 'Mbour', 'Diourbel', 'Tambacounda', 'Rufisque', 'Autre',
];

// ─── Utilitaires ─────────────────────────────────────────────────────────────

const fmt = (n) => new Intl.NumberFormat('fr-SN').format(n);

const validate = {
  step1: (d) => {
    const errs = {};
    if (!d.firstName.trim()) errs.firstName = 'Le prénom est requis';
    else if (d.firstName.trim().length < 2) errs.firstName = 'Minimum 2 caractères';
    if (!d.lastName.trim()) errs.lastName = 'Le nom est requis';
    else if (d.lastName.trim().length < 2) errs.lastName = 'Minimum 2 caractères';
    if (!d.email.trim()) errs.email = "L'email est requis";
    else if (!/^\S+@\S+\.\S+$/.test(d.email)) errs.email = 'Email invalide';
    if (!d.password) errs.password = 'Le mot de passe est requis';
    else if (d.password.length < 8) errs.password = 'Minimum 8 caractères';
    if (d.password !== d.confirm) errs.confirm = 'Les mots de passe ne correspondent pas';
    return errs;
  },
  step2: (d) => {
    const errs = {};
    if (!d.companyName.trim()) errs.companyName = "Le nom de l'entreprise est requis";
    else if (d.companyName.trim().length < 2) errs.companyName = 'Minimum 2 caractères';
    return errs;
  },
};

// ─── Sous-composants ─────────────────────────────────────────────────────────

const StepIndicator = ({ current, total }) => (
  <div style={styles.stepIndicator}>
    {Array.from({ length: total }, (_, i) => (
      <React.Fragment key={i}>
        <div style={{
          ...styles.stepDot,
          ...(i + 1 === current ? styles.stepDotActive : {}),
          ...(i + 1 < current ? styles.stepDotDone : {}),
        }}>
          {i + 1 < current ? <FiCheck size={12} /> : i + 1}
        </div>
        {i < total - 1 && (
          <div style={{
            ...styles.stepLine,
            ...(i + 1 < current ? styles.stepLineDone : {}),
          }} />
        )}
      </React.Fragment>
    ))}
  </div>
);

const Field = ({ label, error, children, required }) => (
  <div style={styles.field}>
    <label style={styles.label}>
      {label}{required && <span style={{ color: '#ef4444', marginLeft: '2px' }}>*</span>}
    </label>
    {children}
    {error && <p style={styles.fieldError}>{error}</p>}
  </div>
);

const InputIcon = ({ icon: Icon, children, error }) => (
  <div style={styles.inputWrapper}>
    <Icon size={17} style={styles.inputIcon} aria-hidden="true" />
    {React.cloneElement(children, {
      style: { ...styles.input, ...(error ? styles.inputError : {}) },
    })}
  </div>
);

// ─── Page principale ──────────────────────────────────────────────────────────

const RegisterPage = () => {
  const navigate = useNavigate();
  const [registerSaaS, { isLoading }] = useRegisterSaaSMutation();

  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [success, setSuccess] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [periodicite, setPeriodicite] = useState('MENSUEL');

  const [form, setForm] = useState({
    // Étape 1 — Compte
    firstName: '', lastName: '', email: '', password: '', confirm: '', phone: '',
    // Étape 2 — Entreprise
    companyName: '', legalForm: '', sector: '', ninea: '', rccm: '',
    address: '', city: 'Dakar', companyPhone: '', companyEmail: '', website: '',
    // Étape 3 — Forfait
    forfaitCode: 'PROFESSIONNEL',
  });

  const set = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
    if (apiError) setApiError('');
  };

  const goNext = () => {
    const errs = step === 1 ? validate.step1(form) : step === 2 ? validate.step2(form) : {};
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setStep((s) => s + 1);
    window.scrollTo(0, 0);
  };

  const goBack = () => { setStep((s) => s - 1); setErrors({}); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');

    const payload = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim().toLowerCase(),
      password: form.password,
      phone: form.phone.trim() || undefined,
      companyName: form.companyName.trim(),
      legalForm: form.legalForm || undefined,
      sector: form.sector || undefined,
      ninea: form.ninea.trim() || undefined,
      rccm: form.rccm.trim() || undefined,
      address: form.address.trim() || undefined,
      city: form.city || 'Dakar',
      companyPhone: form.companyPhone.trim() || undefined,
      companyEmail: form.companyEmail.trim() || undefined,
      website: form.website.trim() || undefined,
      forfaitCode: form.forfaitCode,
      periodicite,
    };

    try {
      const result = await registerSaaS(payload).unwrap();
      setSuccess(result.data);
      toast.success('Compte créé avec succès !');
    } catch (err) {
      const msg = err.data?.message;
      if (msg?.includes('existe deja')) {
        setApiError("Un compte existe déjà avec cet email. Connectez-vous ou utilisez un autre email.");
        setStep(1);
      } else if (err.status === 429) {
        setApiError("Trop de tentatives. Attendez quelques minutes.");
      } else {
        setApiError(msg || "Erreur lors de la création du compte. Veuillez réessayer.");
      }
    }
  };

  const forfaitSelectionne = FORFAITS.find((f) => f.code === form.forfaitCode);

  // ── Écran succès ────────────────────────────────────────────────────────────
  if (success) {
    return (
      <div style={styles.wrapper}>
        <div style={styles.bgShape1} /><div style={styles.bgShape2} /><div style={styles.bgShape3} />
        <div style={{ ...styles.container, maxWidth: '540px', minHeight: 'auto' }}>
          <div style={{ ...styles.formPanel, padding: '3rem 2.5rem', textAlign: 'center' }}>
            <div style={styles.successIconCircle}>
              <FiCheckCircle size={44} color="#059669" />
            </div>
            <h2 style={styles.successTitle}>Compte créé avec succès !</h2>
            <p style={{ fontSize: '0.95rem', color: '#374151', margin: '0 0 0.5rem', lineHeight: 1.6 }}>
              Bienvenue, <strong>{success.user?.firstName} {success.user?.lastName}</strong> !
            </p>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0 0 1.5rem', lineHeight: 1.7 }}>
              Votre entreprise <strong>{success.company?.name}</strong> a été créée avec le forfait{' '}
              <strong style={{ color: '#1a56db' }}>{forfaitSelectionne?.nom}</strong>.
              Finalisez votre inscription en effectuant le paiement.
            </p>

            <div style={styles.paymentCard}>
              <div style={{ fontSize: '0.8rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                Montant à régler
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#1a56db' }}>
                {fmt(success.paiement?.montant)} <span style={{ fontSize: '1rem', fontWeight: 500 }}>FCFA</span>
              </div>
              <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '4px' }}>
                {success.paiement?.periodicite === 'ANNUEL' ? 'par an' : 'par mois'} • {forfaitSelectionne?.nom}
              </div>
            </div>

            <div style={styles.paymentMethods}>
              <span style={styles.paymentBadge}>Wave</span>
              <span style={styles.paymentBadge}>Orange Money</span>
              <span style={styles.paymentBadge}>Virement bancaire</span>
            </div>

            <p style={{ fontSize: '0.8rem', color: '#9ca3af', margin: '0 0 2rem', lineHeight: 1.5 }}>
              Un email de confirmation vous a été envoyé à{' '}
              <strong style={{ color: '#374151' }}>{success.user?.email}</strong>.
            </p>

            <button
              type="button"
              onClick={() => navigate('/login')}
              style={styles.submitBtn}
            >
              Aller à la connexion
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Formulaire principal ─────────────────────────────────────────────────────
  return (
    <div style={styles.wrapper}>
      <div style={styles.bgShape1} /><div style={styles.bgShape2} /><div style={styles.bgShape3} />

      <div style={styles.container}>
        {/* Panneau gauche */}
        <div style={styles.brandPanel}>
          <div style={styles.brandContent}>
            <div style={styles.logoContainer}>
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                <rect width="40" height="40" rx="10" fill="white" fillOpacity="0.2" />
                <path d="M10 14h20v3H10zM10 20h14v3H10zM10 26h18v3H10z" fill="white" />
              </svg>
              <div>
                <h1 style={styles.brandTitle}>ERP Sénégal</h1>
                <p style={styles.brandTagline}>Gestion Commerciale & Comptable</p>
              </div>
            </div>

            {/* Avantages */}
            <div style={styles.advantageList}>
              {[
                { icon: FiCheck, text: 'Essai sans engagement' },
                { icon: FiCheck, text: 'Configuration en 5 minutes' },
                { icon: FiCheck, text: 'Support Sénégal inclus' },
                { icon: FiCheck, text: 'Conforme SYSCOHADA / DGI' },
                { icon: FiUsers, text: 'Utilisé par +500 entreprises' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} style={styles.advantageItem}>
                  <div style={styles.advantageCheck}><Icon size={13} color="white" /></div>
                  <span style={styles.advantageText}>{text}</span>
                </div>
              ))}
            </div>

            {/* Étapes visuelles */}
            <div style={styles.stepsPreview}>
              {['Votre compte', 'Votre entreprise', 'Votre forfait'].map((label, i) => (
                <div key={label} style={styles.stepPreviewItem}>
                  <div style={{
                    ...styles.stepPreviewDot,
                    backgroundColor: step > i ? 'rgba(255,255,255,0.9)' : step === i + 1 ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.2)',
                  }}>
                    {step > i + 1 ? <FiCheck size={11} color="#1a56db" /> : <span style={{ fontSize: '0.65rem', fontWeight: 700, color: step === i + 1 ? '#1a56db' : 'rgba(255,255,255,0.7)' }}>{i + 1}</span>}
                  </div>
                  <span style={{ fontSize: '0.82rem', color: step === i + 1 ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.5)', fontWeight: step === i + 1 ? 600 : 400 }}>
                    {label}
                  </span>
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
            {/* En-tête */}
            <div style={{ marginBottom: '1.5rem' }}>
              <StepIndicator current={step} total={3} />
              <h2 style={styles.formTitle}>
                {step === 1 && 'Créer votre compte'}
                {step === 2 && 'Votre entreprise'}
                {step === 3 && 'Choisir un forfait'}
              </h2>
              <p style={styles.formSubtitle}>
                {step === 1 && 'Renseignez vos informations personnelles d\'administrateur'}
                {step === 2 && 'Informations sur votre entreprise (seul le nom est obligatoire)'}
                {step === 3 && 'Sélectionnez le forfait adapté à vos besoins'}
              </p>
            </div>

            {/* Erreur API */}
            {apiError && (
              <div style={styles.errorBox} role="alert">
                <FiAlertCircle size={18} style={{ flexShrink: 0 }} />
                <span>{apiError}</span>
                <button type="button" onClick={() => setApiError('')} style={styles.errorClose} aria-label="Fermer">&times;</button>
              </div>
            )}

            {/* ── ÉTAPE 1 — Compte ───────────────────────────────────────────── */}
            {step === 1 && (
              <form onSubmit={(e) => { e.preventDefault(); goNext(); }} noValidate>
                <div style={styles.row}>
                  <Field label="Prénom" error={errors.firstName} required>
                    <InputIcon icon={FiUser} error={errors.firstName}>
                      <input type="text" value={form.firstName} onChange={set('firstName')} placeholder="Prénom" autoFocus autoComplete="given-name" />
                    </InputIcon>
                  </Field>
                  <Field label="Nom" error={errors.lastName} required>
                    <InputIcon icon={FiUser} error={errors.lastName}>
                      <input type="text" value={form.lastName} onChange={set('lastName')} placeholder="Nom de famille" autoComplete="family-name" />
                    </InputIcon>
                  </Field>
                </div>

                <Field label="Adresse email" error={errors.email} required>
                  <InputIcon icon={FiMail} error={errors.email}>
                    <input type="email" value={form.email} onChange={set('email')} placeholder="votre@email.com" autoComplete="email" />
                  </InputIcon>
                </Field>

                <Field label="Téléphone" error={errors.phone}>
                  <InputIcon icon={FiPhone}>
                    <input type="tel" value={form.phone} onChange={set('phone')} placeholder="+221 77 000 0000" autoComplete="tel" />
                  </InputIcon>
                </Field>

                <Field label="Mot de passe" error={errors.password} required>
                  <div style={styles.inputWrapper}>
                    <FiLock size={17} style={styles.inputIcon} aria-hidden="true" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={set('password')}
                      placeholder="Minimum 8 caractères"
                      autoComplete="new-password"
                      style={{ ...styles.input, ...(errors.password ? styles.inputError : {}) }}
                    />
                    <button type="button" onClick={() => setShowPassword((v) => !v)} style={styles.togglePassword} tabIndex={-1} aria-label={showPassword ? 'Masquer' : 'Afficher'}>
                      {showPassword ? <FiEyeOff size={17} /> : <FiEye size={17} />}
                    </button>
                  </div>
                  {errors.password && <p style={styles.fieldError}>{errors.password}</p>}
                </Field>

                <Field label="Confirmer le mot de passe" error={errors.confirm} required>
                  <div style={styles.inputWrapper}>
                    <FiLock size={17} style={styles.inputIcon} aria-hidden="true" />
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      value={form.confirm}
                      onChange={set('confirm')}
                      placeholder="Répéter le mot de passe"
                      autoComplete="new-password"
                      style={{ ...styles.input, ...(errors.confirm ? styles.inputError : {}) }}
                    />
                    <button type="button" onClick={() => setShowConfirm((v) => !v)} style={styles.togglePassword} tabIndex={-1} aria-label={showConfirm ? 'Masquer' : 'Afficher'}>
                      {showConfirm ? <FiEyeOff size={17} /> : <FiEye size={17} />}
                    </button>
                  </div>
                  {errors.confirm && <p style={styles.fieldError}>{errors.confirm}</p>}
                </Field>

                <button type="submit" style={styles.submitBtn}>
                  Suivant <FiArrowRight size={18} style={{ marginLeft: '8px' }} />
                </button>
              </form>
            )}

            {/* ── ÉTAPE 2 — Entreprise ────────────────────────────────────────── */}
            {step === 2 && (
              <form onSubmit={(e) => { e.preventDefault(); goNext(); }} noValidate>
                <Field label="Nom de l'entreprise" error={errors.companyName} required>
                  <InputIcon icon={FiBriefcase} error={errors.companyName}>
                    <input type="text" value={form.companyName} onChange={set('companyName')} placeholder="Nom commercial" autoFocus />
                  </InputIcon>
                </Field>

                <div style={styles.row}>
                  <Field label="Forme juridique">
                    <select value={form.legalForm} onChange={set('legalForm')} style={styles.select}>
                      <option value="">— Choisir —</option>
                      {LEGAL_FORMS.map((f) => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </Field>
                  <Field label="Secteur d'activité">
                    <select value={form.sector} onChange={set('sector')} style={styles.select}>
                      <option value="">— Choisir —</option>
                      {SECTEURS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </Field>
                </div>

                <div style={styles.row}>
                  <Field label="NINEA">
                    <InputIcon icon={FiBriefcase}>
                      <input type="text" value={form.ninea} onChange={set('ninea')} placeholder="Numéro NINEA" />
                    </InputIcon>
                  </Field>
                  <Field label="RCCM">
                    <InputIcon icon={FiBriefcase}>
                      <input type="text" value={form.rccm} onChange={set('rccm')} placeholder="Numéro RCCM" />
                    </InputIcon>
                  </Field>
                </div>

                <Field label="Adresse">
                  <InputIcon icon={FiMapPin}>
                    <input type="text" value={form.address} onChange={set('address')} placeholder="Adresse physique" />
                  </InputIcon>
                </Field>

                <div style={styles.row}>
                  <Field label="Ville">
                    <select value={form.city} onChange={set('city')} style={styles.select}>
                      {CITIES_SN.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </Field>
                  <Field label="Téléphone entreprise">
                    <InputIcon icon={FiPhone}>
                      <input type="tel" value={form.companyPhone} onChange={set('companyPhone')} placeholder="+221 33 000 0000" />
                    </InputIcon>
                  </Field>
                </div>

                <Field label="Email entreprise">
                  <InputIcon icon={FiMail}>
                    <input type="email" value={form.companyEmail} onChange={set('companyEmail')} placeholder="contact@entreprise.sn" />
                  </InputIcon>
                </Field>

                <div style={styles.navRow}>
                  <button type="button" onClick={goBack} style={styles.backBtn}>
                    <FiArrowLeft size={17} style={{ marginRight: '6px' }} /> Retour
                  </button>
                  <button type="submit" style={styles.submitBtn}>
                    Suivant <FiArrowRight size={18} style={{ marginLeft: '8px' }} />
                  </button>
                </div>
              </form>
            )}

            {/* ── ÉTAPE 3 — Forfait ───────────────────────────────────────────── */}
            {step === 3 && (
              <form onSubmit={handleSubmit} noValidate>
                {/* Toggle MENSUEL / ANNUEL */}
                <div style={styles.periodToggle}>
                  <button
                    type="button"
                    onClick={() => setPeriodicite('MENSUEL')}
                    style={{ ...styles.periodBtn, ...(periodicite === 'MENSUEL' ? styles.periodBtnActive : {}) }}
                  >
                    Mensuel
                  </button>
                  <button
                    type="button"
                    onClick={() => setPeriodicite('ANNUEL')}
                    style={{ ...styles.periodBtn, ...(periodicite === 'ANNUEL' ? styles.periodBtnActive : {}) }}
                  >
                    Annuel
                    <span style={styles.discountBadge}>2 mois offerts</span>
                  </button>
                </div>

                {/* Cartes forfait */}
                <div style={styles.forfaitGrid}>
                  {FORFAITS.map((f) => {
                    const Icon = f.icon;
                    const prix = periodicite === 'ANNUEL' ? f.prixAnnuel : f.prixMensuel;
                    const selected = form.forfaitCode === f.code;
                    return (
                      <button
                        key={f.code}
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, forfaitCode: f.code }))}
                        style={{
                          ...styles.forfaitCard,
                          ...(selected ? { ...styles.forfaitCardSelected, borderColor: f.couleur, backgroundColor: f.couleurBg } : {}),
                          ...(f.populaire && !selected ? styles.forfaitCardPopulaire : {}),
                        }}
                      >
                        {f.populaire && (
                          <div style={{ ...styles.populareBadge, backgroundColor: f.couleur }}>
                            Recommandé
                          </div>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <div style={{ ...styles.forfaitIcon, backgroundColor: f.couleurBg, color: f.couleur }}>
                            <Icon size={18} />
                          </div>
                          <span style={{ fontWeight: 700, fontSize: '1rem', color: '#111827' }}>{f.nom}</span>
                          {selected && <FiCheck size={16} color={f.couleur} style={{ marginLeft: 'auto' }} />}
                        </div>
                        <p style={styles.forfaitDesc}>{f.description}</p>
                        <div style={{ marginBottom: '10px' }}>
                          <span style={{ fontSize: '1.4rem', fontWeight: 800, color: f.couleur }}>{fmt(prix)}</span>
                          <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}> FCFA / {periodicite === 'ANNUEL' ? 'an' : 'mois'}</span>
                        </div>
                        <div style={styles.forfaitUsers}>
                          <FiUsers size={13} />
                          <span>{f.maxUsers}</span>
                        </div>
                        <ul style={styles.moduleList}>
                          {f.modules.map((m) => (
                            <li key={m} style={styles.moduleItem}>
                              <FiCheck size={12} color={f.couleur} style={{ flexShrink: 0 }} />
                              <span>{m}</span>
                            </li>
                          ))}
                        </ul>
                      </button>
                    );
                  })}
                </div>

                {/* Récapitulatif */}
                {forfaitSelectionne && (
                  <div style={styles.recap}>
                    <div style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '6px' }}>Récapitulatif</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                      <div>
                        <span style={{ fontWeight: 600, color: '#111827' }}>{forfaitSelectionne.nom}</span>
                        <span style={{ color: '#9ca3af', fontSize: '0.85rem' }}> · {periodicite === 'ANNUEL' ? 'Annuel' : 'Mensuel'}</span>
                      </div>
                      <span style={{ fontWeight: 700, color: '#1a56db', fontSize: '1.1rem' }}>
                        {fmt(periodicite === 'ANNUEL' ? forfaitSelectionne.prixAnnuel : forfaitSelectionne.prixMensuel)} FCFA
                      </span>
                    </div>
                    {periodicite === 'ANNUEL' && (
                      <p style={{ fontSize: '0.75rem', color: '#059669', margin: '4px 0 0', fontWeight: 500 }}>
                        Économie : {fmt(forfaitSelectionne.prixMensuel * 12 - forfaitSelectionne.prixAnnuel)} FCFA par rapport au mensuel
                      </p>
                    )}
                  </div>
                )}

                <div style={styles.navRow}>
                  <button type="button" onClick={goBack} style={styles.backBtn}>
                    <FiArrowLeft size={17} style={{ marginRight: '6px' }} /> Retour
                  </button>
                  <button type="submit" disabled={isLoading} style={{ ...styles.submitBtn, ...(isLoading ? styles.submitBtnDisabled : {}) }}>
                    {isLoading ? (
                      <><span style={styles.spinner} />Création en cours...</>
                    ) : (
                      <><FiCheck size={18} style={{ marginRight: '8px' }} />Créer mon compte</>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Lien connexion */}
            <p style={styles.loginHint}>
              Déjà un compte ?{' '}
              <Link to="/login" style={{ color: '#1a56db', fontWeight: 500, textDecoration: 'none' }}>
                Se connecter
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = {
  wrapper: {
    minHeight: '100vh', display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
    background: 'linear-gradient(135deg, #f0f4ff 0%, #e8edf5 50%, #f5f0ff 100%)',
    padding: '1.5rem 1rem', position: 'relative', overflow: 'hidden',
  },
  bgShape1: { position: 'absolute', top: '-120px', right: '-120px', width: '400px', height: '400px', borderRadius: '50%', background: 'linear-gradient(135deg, rgba(26,86,219,0.08), rgba(26,86,219,0.03))', pointerEvents: 'none' },
  bgShape2: { position: 'absolute', bottom: '-80px', left: '-80px', width: '300px', height: '300px', borderRadius: '50%', background: 'linear-gradient(135deg, rgba(5,150,105,0.06), rgba(5,150,105,0.02))', pointerEvents: 'none' },
  bgShape3: { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '700px', height: '700px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(26,86,219,0.03) 0%, transparent 70%)', pointerEvents: 'none' },
  container: {
    display: 'flex', width: '100%', maxWidth: '1020px',
    borderRadius: '20px', overflow: 'hidden',
    boxShadow: '0 20px 60px rgba(0,0,0,0.12), 0 4px 20px rgba(0,0,0,0.06)',
    position: 'relative', zIndex: 1, alignSelf: 'flex-start',
  },
  brandPanel: {
    flex: '0 0 36%', background: 'linear-gradient(160deg, #1a56db 0%, #1e40af 40%, #1e3a8a 100%)',
    padding: '2.5rem 2rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
  },
  brandContent: { position: 'relative', zIndex: 2 },
  logoContainer: { display: 'flex', alignItems: 'center', gap: '0.875rem', marginBottom: '2rem' },
  brandTitle: { fontSize: '1.6rem', fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '-0.02em', lineHeight: 1.2 },
  brandTagline: { fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', margin: 0, marginTop: '2px' },
  advantageList: { display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '2rem' },
  advantageItem: { display: 'flex', alignItems: 'center', gap: '0.65rem' },
  advantageCheck: { width: '22px', height: '22px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  advantageText: { fontSize: '0.85rem', color: 'rgba(255,255,255,0.9)' },
  stepsPreview: { display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '2rem' },
  stepPreviewItem: { display: 'flex', alignItems: 'center', gap: '0.75rem' },
  stepPreviewDot: { width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background-color 0.3s' },
  brandFooter: { borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: '1rem', marginTop: '1rem' },
  brandFooterText: { fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)', margin: 0, lineHeight: 1.5 },

  formPanel: { flex: 1, backgroundColor: '#fff', padding: '2rem 2.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', overflowY: 'auto' },
  formContent: { width: '100%', maxWidth: '440px', margin: '0 auto' },
  formTitle: { fontSize: '1.5rem', fontWeight: 700, color: '#111827', margin: '0.75rem 0 0.25rem', letterSpacing: '-0.02em' },
  formSubtitle: { fontSize: '0.85rem', color: '#6b7280', margin: 0, lineHeight: 1.5, marginBottom: '0.25rem' },

  // Step indicator
  stepIndicator: { display: 'flex', alignItems: 'center', marginBottom: '0.5rem' },
  stepDot: { width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: '#9ca3af', flexShrink: 0, transition: 'all 0.3s' },
  stepDotActive: { backgroundColor: '#1a56db', color: '#fff', boxShadow: '0 0 0 4px rgba(26,86,219,0.15)' },
  stepDotDone: { backgroundColor: '#059669', color: '#fff' },
  stepLine: { flex: 1, height: '2px', backgroundColor: '#e5e7eb', margin: '0 6px', transition: 'background-color 0.3s' },
  stepLineDone: { backgroundColor: '#059669' },

  // Champs
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' },
  field: { marginBottom: '1rem' },
  label: { display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#374151', marginBottom: '0.35rem' },
  fieldError: { fontSize: '0.75rem', color: '#ef4444', margin: '4px 0 0' },
  inputWrapper: { position: 'relative', display: 'flex', alignItems: 'center' },
  inputIcon: { position: 'absolute', left: '12px', color: '#9ca3af', pointerEvents: 'none', zIndex: 1 },
  input: { width: '100%', padding: '0.65rem 0.875rem 0.65rem 2.5rem', fontSize: '0.9rem', border: '1.5px solid #e5e7eb', borderRadius: '9px', outline: 'none', backgroundColor: '#f9fafb', color: '#111827', boxSizing: 'border-box', transition: 'border-color 0.2s' },
  inputError: { borderColor: '#fca5a5', backgroundColor: '#fff5f5' },
  select: { width: '100%', padding: '0.65rem 0.875rem', fontSize: '0.9rem', border: '1.5px solid #e5e7eb', borderRadius: '9px', outline: 'none', backgroundColor: '#f9fafb', color: '#111827', cursor: 'pointer' },
  togglePassword: { position: 'absolute', right: '10px', background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', zIndex: 1 },

  // Erreur API
  errorBox: { display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.8rem 0.875rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '9px', color: '#dc2626', fontSize: '0.85rem', marginBottom: '1.25rem', lineHeight: 1.4 },
  errorClose: { background: 'none', border: 'none', color: '#dc2626', fontSize: '1.2rem', cursor: 'pointer', padding: 0, marginLeft: 'auto', lineHeight: 1, opacity: 0.6 },

  // Boutons navigation
  navRow: { display: 'flex', gap: '0.75rem', marginTop: '0.5rem' },
  backBtn: { display: 'flex', alignItems: 'center', padding: '0.7rem 1.25rem', fontSize: '0.9rem', fontWeight: 500, border: '1.5px solid #e5e7eb', borderRadius: '9px', backgroundColor: '#fff', color: '#374151', cursor: 'pointer', transition: 'border-color 0.2s' },
  submitBtn: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.75rem 1.25rem', fontSize: '0.95rem', fontWeight: 600, border: 'none', borderRadius: '9px', background: 'linear-gradient(135deg, #1a56db 0%, #1e40af 100%)', color: '#fff', cursor: 'pointer', boxShadow: '0 4px 12px rgba(26,86,219,0.3)', transition: 'opacity 0.15s', width: '100%' },
  submitBtnDisabled: { opacity: 0.65, cursor: 'not-allowed', boxShadow: 'none' },
  spinner: { display: 'inline-block', width: '15px', height: '15px', marginRight: '8px', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' },

  // Forfaits
  periodToggle: { display: 'flex', backgroundColor: '#f3f4f6', borderRadius: '10px', padding: '4px', marginBottom: '1rem', gap: '2px' },
  periodBtn: { flex: 1, padding: '0.5rem', fontSize: '0.85rem', fontWeight: 500, border: 'none', borderRadius: '7px', backgroundColor: 'transparent', color: '#6b7280', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', transition: 'all 0.2s' },
  periodBtnActive: { backgroundColor: '#fff', color: '#111827', fontWeight: 600, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
  discountBadge: { backgroundColor: '#059669', color: '#fff', fontSize: '0.65rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', letterSpacing: '0.02em' },
  forfaitGrid: { display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1rem' },
  forfaitCard: { position: 'relative', textAlign: 'left', padding: '1rem', border: '1.5px solid #e5e7eb', borderRadius: '12px', backgroundColor: '#fff', cursor: 'pointer', transition: 'all 0.2s', width: '100%' },
  forfaitCardSelected: { borderWidth: '2px' },
  forfaitCardPopulaire: { borderColor: '#bfdbfe' },
  populareBadge: { position: 'absolute', top: '-10px', right: '12px', color: '#fff', fontSize: '0.68rem', fontWeight: 700, padding: '2px 10px', borderRadius: '20px', letterSpacing: '0.04em' },
  forfaitIcon: { width: '34px', height: '34px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  forfaitDesc: { fontSize: '0.78rem', color: '#6b7280', margin: '0 0 8px', lineHeight: 1.4 },
  forfaitUsers: { display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.78rem', color: '#6b7280', marginBottom: '8px' },
  moduleList: { listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '4px' },
  moduleItem: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#374151' },

  // Récap
  recap: { backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '10px', padding: '0.875rem 1rem', marginBottom: '1rem' },

  // Succès
  successIconCircle: { width: '84px', height: '84px', borderRadius: '50%', backgroundColor: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', border: '2px solid #a7f3d0' },
  successTitle: { fontSize: '1.5rem', fontWeight: 700, color: '#111827', margin: '0 0 0.75rem' },
  paymentCard: { backgroundColor: '#eff6ff', borderRadius: '12px', padding: '1.25rem', margin: '1.25rem 0', border: '1px solid #bfdbfe' },
  paymentMethods: { display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '1rem' },
  paymentBadge: { padding: '4px 12px', backgroundColor: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 500, color: '#374151' },

  // Lien connexion
  loginHint: { textAlign: 'center', fontSize: '0.85rem', color: '#6b7280', margin: '1.5rem 0 0' },
};

export default RegisterPage;
