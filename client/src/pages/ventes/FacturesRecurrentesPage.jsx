import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Table from 'react-bootstrap/Table';
import Button from 'react-bootstrap/Button';
import Badge from 'react-bootstrap/Badge';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import {
  FiRepeat,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiPlay,
  FiPause,
  FiZap,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiAlertCircle,
  FiSearch,
  FiCalendar,
} from 'react-icons/fi';
import usePageTitle from '../../hooks/usePageTitle';
import { formatDate, formatMoney as formatMontant } from '../../utils/formatters';
import {
  useGetFacturesRecurrentesQuery,
  useCreateFactureRecurrenteMutation,
  useUpdateFactureRecurrenteMutation,
  useDeleteFactureRecurrenteMutation,
  useToggleFactureRecurrenteActiveMutation,
  useGenererFactureMaintenantMutation,
} from '../../redux/api/facturesRecurrentesApi';
import { useGetClientsQuery } from '../../redux/api/clientsApi';

// ─── Constantes ─────────────────────────────────────────────────────────────

const FREQUENCES = [
  { value: 'hebdomadaire', label: 'Hebdomadaire', badge: 'warning' },
  { value: 'mensuel',      label: 'Mensuel',      badge: 'primary' },
  { value: 'trimestriel',  label: 'Trimestriel',  badge: 'info' },
  { value: 'semestriel',   label: 'Semestriel',   badge: 'secondary' },
  { value: 'annuel',       label: 'Annuel',        badge: 'dark' },
];

const FREQUENCE_MAP = Object.fromEntries(FREQUENCES.map((f) => [f.value, f]));

const TVA_OPTIONS = [0, 18];

const defaultLigne = () => ({
  designation: '',
  quantite: 1,
  prixUnitaire: 0,
  remise: 0,
  tauxTVA: 18,
  unite: '',
});

// ─── Calculs ────────────────────────────────────────────────────────────────

const calculerLigne = (ligne) => {
  const base = ligne.quantite * ligne.prixUnitaire;
  const apresRemise = base * (1 - (ligne.remise || 0) / 100);
  const montantHT = Math.round(apresRemise);
  const montantTVA = Math.round(montantHT * (ligne.tauxTVA || 0) / 100);
  return { ...ligne, montantHT, montantTVA, montantTTC: montantHT + montantTVA };
};

const calculerTotaux = (lignes, remiseGlobale = 0) => {
  const totalHT = lignes.reduce((s, l) => s + (calculerLigne(l).montantHT || 0), 0);
  const totalHTApresRemise = Math.round(totalHT * (1 - remiseGlobale / 100));
  const totalTVA = lignes.reduce((s, l) => {
    const lg = calculerLigne(l);
    return s + Math.round((lg.montantHT || 0) * (1 - remiseGlobale / 100) * (l.tauxTVA || 0) / 100);
  }, 0);
  return { totalHT: totalHTApresRemise, totalTVA, totalTTC: totalHTApresRemise + totalTVA };
};

// ─── Formulaire lignes ───────────────────────────────────────────────────────

const LignesEditor = ({ lignes, onChange }) => {
  const addLigne = () => onChange([...lignes, defaultLigne()]);

  const updateLigne = (i, field, value) => {
    const updated = lignes.map((l, idx) =>
      idx === i ? { ...l, [field]: field === 'quantite' || field === 'prixUnitaire' || field === 'remise' ? Number(value) : value } : l
    );
    onChange(updated);
  };

  const removeLigne = (i) => onChange(lignes.filter((_, idx) => idx !== i));

  return (
    <div>
      <Table size="sm" responsive bordered className="mb-2">
        <thead className="table-light">
          <tr>
            <th style={{ minWidth: 180 }}>Désignation</th>
            <th style={{ width: 70 }}>Qté</th>
            <th style={{ width: 110 }}>P.U. HT</th>
            <th style={{ width: 70 }}>Remise%</th>
            <th style={{ width: 80 }}>TVA%</th>
            <th style={{ width: 110 }}>Total TTC</th>
            <th style={{ width: 40 }}></th>
          </tr>
        </thead>
        <tbody>
          {lignes.map((ligne, i) => {
            const { montantTTC } = calculerLigne(ligne);
            return (
              <tr key={i}>
                <td>
                  <Form.Control
                    size="sm"
                    value={ligne.designation}
                    onChange={(e) => updateLigne(i, 'designation', e.target.value)}
                    placeholder="Article / service"
                    required
                  />
                </td>
                <td>
                  <Form.Control
                    size="sm"
                    type="number"
                    min={0}
                    step="0.01"
                    value={ligne.quantite}
                    onChange={(e) => updateLigne(i, 'quantite', e.target.value)}
                  />
                </td>
                <td>
                  <Form.Control
                    size="sm"
                    type="number"
                    min={0}
                    step="1"
                    value={ligne.prixUnitaire}
                    onChange={(e) => updateLigne(i, 'prixUnitaire', e.target.value)}
                  />
                </td>
                <td>
                  <Form.Control
                    size="sm"
                    type="number"
                    min={0}
                    max={100}
                    value={ligne.remise}
                    onChange={(e) => updateLigne(i, 'remise', e.target.value)}
                  />
                </td>
                <td>
                  <Form.Select
                    size="sm"
                    value={ligne.tauxTVA}
                    onChange={(e) => updateLigne(i, 'tauxTVA', Number(e.target.value))}
                  >
                    {TVA_OPTIONS.map((t) => (
                      <option key={t} value={t}>{t}%</option>
                    ))}
                  </Form.Select>
                </td>
                <td className="text-end">
                  <small className="fw-bold">{formatMontant(montantTTC)}</small>
                </td>
                <td className="text-center">
                  <Button
                    variant="link"
                    size="sm"
                    className="p-0 text-danger"
                    onClick={() => removeLigne(i)}
                    disabled={lignes.length <= 1}
                  >
                    <FiXCircle size={15} />
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </Table>
      <Button variant="outline-secondary" size="sm" onClick={addLigne}>
        <FiPlus size={13} className="me-1" />
        Ajouter une ligne
      </Button>
    </div>
  );
};

// ─── Modal Formulaire ────────────────────────────────────────────────────────

const FormModal = ({ show, onHide, editData }) => {
  const isEdit = Boolean(editData);

  const [form, setForm] = useState({
    client: '',
    frequence: 'mensuel',
    dateDebut: new Date().toISOString().split('T')[0],
    dateFin: '',
    remiseGlobale: 0,
    conditionsPaiement: '',
    modePaiement: '',
    notes: '',
    lignes: [defaultLigne()],
  });

  const [error, setError] = useState('');

  React.useEffect(() => {
    if (editData) {
      setForm({
        client: editData.client?._id || editData.client || '',
        frequence: editData.frequence || 'mensuel',
        dateDebut: editData.dateDebut ? editData.dateDebut.split('T')[0] : '',
        dateFin: editData.dateFin ? editData.dateFin.split('T')[0] : '',
        remiseGlobale: editData.remiseGlobale || 0,
        conditionsPaiement: editData.conditionsPaiement || '',
        modePaiement: editData.modePaiement || '',
        notes: editData.notes || '',
        lignes: editData.lignes?.length ? editData.lignes : [defaultLigne()],
      });
    } else {
      setForm({
        client: '',
        frequence: 'mensuel',
        dateDebut: new Date().toISOString().split('T')[0],
        dateFin: '',
        remiseGlobale: 0,
        conditionsPaiement: '',
        modePaiement: '',
        notes: '',
        lignes: [defaultLigne()],
      });
    }
    setError('');
  }, [editData, show]);

  const { data: clientsData } = useGetClientsQuery({ limit: 200, isActive: true });
  const clients = clientsData?.data || [];

  const [createFR, { isLoading: creating }] = useCreateFactureRecurrenteMutation();
  const [updateFR, { isLoading: updating }] = useUpdateFactureRecurrenteMutation();
  const saving = creating || updating;

  const totaux = useMemo(() => calculerTotaux(form.lignes, form.remiseGlobale), [form.lignes, form.remiseGlobale]);

  const setField = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.client) { setError('Veuillez sélectionner un client.'); return; }
    if (form.lignes.some((l) => !l.designation || l.quantite <= 0)) {
      setError('Toutes les lignes doivent avoir une désignation et une quantité > 0.');
      return;
    }

    const payload = {
      ...form,
      ...totaux,
      lignes: form.lignes.map(calculerLigne),
      dateFin: form.dateFin || null,
    };

    try {
      if (isEdit) {
        await updateFR({ id: editData._id, ...payload }).unwrap();
      } else {
        await createFR(payload).unwrap();
      }
      onHide();
    } catch (err) {
      setError(err?.data?.message || 'Une erreur est survenue.');
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="xl" backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title>
          <FiRepeat className="me-2" />
          {isEdit ? 'Modifier le modèle récurrent' : 'Nouveau modèle de facturation récurrente'}
        </Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {error && <Alert variant="danger" className="py-2">{error}</Alert>}

          <Row className="g-3 mb-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label className="fw-semibold">Client <span className="text-danger">*</span></Form.Label>
                <Form.Select value={form.client} onChange={(e) => setField('client', e.target.value)} required>
                  <option value="">-- Sélectionner un client --</option>
                  {clients.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.raisonSociale || `${c.firstName} ${c.lastName}`} {c.code ? `(${c.code})` : ''}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label className="fw-semibold">Fréquence <span className="text-danger">*</span></Form.Label>
                <Form.Select value={form.frequence} onChange={(e) => setField('frequence', e.target.value)} required>
                  {FREQUENCES.map((f) => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label className="fw-semibold">Remise globale (%)</Form.Label>
                <Form.Control
                  type="number"
                  min={0}
                  max={100}
                  value={form.remiseGlobale}
                  onChange={(e) => setField('remiseGlobale', Number(e.target.value))}
                />
              </Form.Group>
            </Col>
          </Row>

          <Row className="g-3 mb-3">
            <Col md={3}>
              <Form.Group>
                <Form.Label className="fw-semibold">Date de début <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  type="date"
                  value={form.dateDebut}
                  onChange={(e) => setField('dateDebut', e.target.value)}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label className="fw-semibold">Date de fin <small className="text-muted">(optionnel)</small></Form.Label>
                <Form.Control
                  type="date"
                  value={form.dateFin}
                  min={form.dateDebut}
                  onChange={(e) => setField('dateFin', e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label className="fw-semibold">Mode de paiement</Form.Label>
                <Form.Select value={form.modePaiement} onChange={(e) => setField('modePaiement', e.target.value)}>
                  <option value="">-- Choisir --</option>
                  <option value="virement">Virement bancaire</option>
                  <option value="cheque">Chèque</option>
                  <option value="especes">Espèces</option>
                  <option value="orange_money">Orange Money</option>
                  <option value="wave">Wave</option>
                  <option value="free_money">Free Money</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label className="fw-semibold">Conditions de paiement</Form.Label>
                <Form.Control
                  placeholder="ex: Net 30"
                  value={form.conditionsPaiement}
                  onChange={(e) => setField('conditionsPaiement', e.target.value)}
                />
              </Form.Group>
            </Col>
          </Row>

          <div className="mb-3">
            <Form.Label className="fw-semibold">Lignes de facturation <span className="text-danger">*</span></Form.Label>
            <LignesEditor lignes={form.lignes} onChange={(lignes) => setField('lignes', lignes)} />
          </div>

          {/* Totaux */}
          <div className="d-flex justify-content-end mb-3">
            <div className="border rounded p-3" style={{ minWidth: 260 }}>
              <div className="d-flex justify-content-between mb-1">
                <span className="text-muted small">Total HT</span>
                <span className="small fw-semibold">{formatMontant(totaux.totalHT)} FCFA</span>
              </div>
              <div className="d-flex justify-content-between mb-1">
                <span className="text-muted small">TVA</span>
                <span className="small">{formatMontant(totaux.totalTVA)} FCFA</span>
              </div>
              <div className="d-flex justify-content-between border-top pt-1">
                <span className="fw-bold">Total TTC</span>
                <span className="fw-bold text-primary">{formatMontant(totaux.totalTTC)} FCFA</span>
              </div>
            </div>
          </div>

          <Form.Group>
            <Form.Label className="fw-semibold">Notes internes</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              value={form.notes}
              onChange={(e) => setField('notes', e.target.value)}
              placeholder="Notes qui seront copiées sur chaque facture générée..."
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide} disabled={saving}>Annuler</Button>
          <Button variant="primary" type="submit" disabled={saving}>
            {saving && <Spinner size="sm" className="me-2" />}
            {isEdit ? 'Enregistrer' : 'Créer le modèle'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

// ─── Modal Historique ────────────────────────────────────────────────────────

const HistoriqueModal = ({ show, onHide, template }) => {
  if (!template) return null;

  const occurrences = [...(template.occurrences || [])].reverse();

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          <FiClock className="me-2" />
          Historique — {template.clientSnapshot?.displayName}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {!occurrences.length ? (
          <div className="text-center py-4 text-muted">
            <FiClock size={32} className="mb-2" />
            <p>Aucune facture générée pour ce modèle.</p>
          </div>
        ) : (
          <Table bordered hover size="sm" responsive>
            <thead className="table-light">
              <tr>
                <th>#</th>
                <th>Date de génération</th>
                <th>Numéro facture</th>
                <th>Statut</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {occurrences.map((occ, i) => (
                <tr key={i}>
                  <td className="text-muted small">{occurrences.length - i}</td>
                  <td>{formatDate(occ.dateGeneration)}</td>
                  <td>{occ.numero || <span className="text-muted">—</span>}</td>
                  <td>
                    {occ.statut === 'generee' ? (
                      <Badge bg="success">Générée</Badge>
                    ) : (
                      <Badge bg="danger" title={occ.erreur}>Erreur</Badge>
                    )}
                  </td>
                  <td>
                    {occ.factureId && (
                      <Button
                        as={Link}
                        to={`/ventes/factures/${occ.factureId._id || occ.factureId}`}
                        variant="link"
                        size="sm"
                        className="p-0"
                        onClick={onHide}
                      >
                        Voir
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>Fermer</Button>
      </Modal.Footer>
    </Modal>
  );
};

// ─── Page principale ─────────────────────────────────────────────────────────

const FacturesRecurrentesPage = () => {
  usePageTitle('Factures Récurrentes', [
    { label: 'Accueil', path: '/' },
    { label: 'Ventes', path: '/ventes/factures' },
    { label: 'Factures Récurrentes' },
  ]);

  const [search, setSearch] = useState('');
  const [filterFrequence, setFilterFrequence] = useState('');
  const [filterActif, setFilterActif] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState(null);
  const [showHistorique, setShowHistorique] = useState(false);
  const [templateHistorique, setTemplateHistorique] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  const queryParams = useMemo(() => {
    const p = { page: 1, limit: 50 };
    if (search) p.search = search;
    if (filterFrequence) p.frequence = filterFrequence;
    if (filterActif !== '') p.isActive = filterActif;
    return p;
  }, [search, filterFrequence, filterActif]);

  const { data, isLoading, isError } = useGetFacturesRecurrentesQuery(queryParams);
  const templates = data?.data || [];

  const [toggleActive, { isLoading: toggling }] = useToggleFactureRecurrenteActiveMutation();
  const [genererMaintenant, { isLoading: generating }] = useGenererFactureMaintenantMutation();
  const [deleteFR, { isLoading: deleting }] = useDeleteFactureRecurrenteMutation();

  const [actionId, setActionId] = useState(null);

  const handleToggle = async (id) => {
    setActionId(id);
    try { await toggleActive(id).unwrap(); } catch (e) { /* error toast */ }
    setActionId(null);
  };

  const handleGenerer = async (id) => {
    if (!window.confirm('Générer une facture maintenant pour ce modèle ?')) return;
    setActionId(id);
    try { await genererMaintenant(id).unwrap(); } catch (e) { /* error toast */ }
    setActionId(null);
  };

  const handleDeleteConfirm = async () => {
    if (!toDelete) return;
    try { await deleteFR(toDelete._id).unwrap(); } catch (e) { /* error toast */ }
    setShowDeleteModal(false);
    setToDelete(null);
  };

  const kpis = useMemo(() => {
    const actifs = templates.filter((t) => t.isActive);
    const totalTTC = actifs.reduce((s, t) => s + (t.totalTTC || 0), 0);
    const aEcheance = templates.filter((t) => {
      const d = new Date(t.prochainGeneration);
      const in7 = new Date();
      in7.setDate(in7.getDate() + 7);
      return t.isActive && d <= in7;
    });
    return { total: templates.length, actifs: actifs.length, totalTTC, aEcheance: aEcheance.length };
  }, [templates]);

  return (
    <>
      <div className="page-header d-flex justify-content-between align-items-center mb-3">
        <h1 className="d-flex align-items-center gap-2">
          <FiRepeat size={24} />
          Factures Récurrentes
        </h1>
        <Button variant="primary" onClick={() => { setEditData(null); setShowForm(true); }}>
          <FiPlus className="me-1" />
          Nouveau modèle
        </Button>
      </div>

      {/* KPIs */}
      <Row className="g-3 mb-4">
        {[
          { label: 'Modèles au total', value: kpis.total, icon: FiRepeat, color: '#6366f1' },
          { label: 'Actifs', value: kpis.actifs, icon: FiCheckCircle, color: '#059669' },
          { label: 'CA récurrent/cycle', value: `${formatMontant(kpis.totalTTC)} F`, icon: FiCalendar, color: '#d97706', small: true },
          { label: 'Prochains 7 jours', value: kpis.aEcheance, icon: FiAlertCircle, color: '#dc2626' },
        ].map((kpi) => (
          <Col key={kpi.label} xs={6} lg={3}>
            <Card className="shadow-sm h-100 border-0">
              <Card.Body className="d-flex align-items-center gap-3">
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                  style={{ width: 44, height: 44, background: `${kpi.color}18`, color: kpi.color }}
                >
                  <kpi.icon size={20} />
                </div>
                <div>
                  <div className={`fw-bold ${kpi.small ? 'fs-6' : 'fs-4'}`}>{kpi.value}</div>
                  <div className="text-muted small">{kpi.label}</div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Filtres */}
      <Card className="shadow-sm mb-3">
        <Card.Body className="py-2">
          <Row className="g-2 align-items-center">
            <Col md={4}>
              <div className="input-group input-group-sm">
                <span className="input-group-text"><FiSearch size={14} /></span>
                <Form.Control
                  placeholder="Rechercher par client, notes..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </Col>
            <Col md={3}>
              <Form.Select size="sm" value={filterFrequence} onChange={(e) => setFilterFrequence(e.target.value)}>
                <option value="">Toutes fréquences</option>
                {FREQUENCES.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
              </Form.Select>
            </Col>
            <Col md={2}>
              <Form.Select size="sm" value={filterActif} onChange={(e) => setFilterActif(e.target.value)}>
                <option value="">Tous statuts</option>
                <option value="true">Actifs</option>
                <option value="false">Suspendus</option>
              </Form.Select>
            </Col>
            <Col md={3} className="d-flex justify-content-end">
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => { setSearch(''); setFilterFrequence(''); setFilterActif(''); }}
              >
                Réinitialiser
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Tableau */}
      <Card className="shadow-sm">
        <Card.Body className="p-0">
          {isLoading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
            </div>
          ) : isError ? (
            <Alert variant="danger" className="m-3">Erreur lors du chargement des modèles.</Alert>
          ) : !templates.length ? (
            <div className="text-center py-5 text-muted">
              <FiRepeat size={40} className="mb-3 opacity-50" />
              <h5>Aucun modèle de facturation récurrente</h5>
              <p className="small">Créez votre premier modèle pour automatiser la facturation périodique.</p>
              <Button variant="primary" onClick={() => { setEditData(null); setShowForm(true); }}>
                <FiPlus className="me-1" /> Créer un modèle
              </Button>
            </div>
          ) : (
            <Table responsive hover className="mb-0 align-middle">
              <thead className="table-light">
                <tr>
                  <th>Client</th>
                  <th>Fréquence</th>
                  <th>Prochaine génération</th>
                  <th className="text-end">Total TTC</th>
                  <th>Occurrences</th>
                  <th>Date fin</th>
                  <th>Statut</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {templates.map((t) => {
                  const freq = FREQUENCE_MAP[t.frequence];
                  const isToday = new Date(t.prochainGeneration) <= new Date();
                  const isBusy = actionId === t._id;

                  return (
                    <tr key={t._id}>
                      <td>
                        <div className="fw-semibold small">{t.clientSnapshot?.displayName || '—'}</div>
                        {t.notes && (
                          <div className="text-muted" style={{ fontSize: 11 }} title={t.notes}>
                            {t.notes.length > 40 ? `${t.notes.slice(0, 40)}…` : t.notes}
                          </div>
                        )}
                      </td>
                      <td>
                        <Badge bg={freq?.badge || 'secondary'} className="text-uppercase" style={{ fontSize: 10 }}>
                          {freq?.label || t.frequence}
                        </Badge>
                      </td>
                      <td>
                        <span className={isToday ? 'text-danger fw-semibold' : ''}>
                          {formatDate(t.prochainGeneration)}
                        </span>
                        {isToday && t.isActive && (
                          <Badge bg="danger" className="ms-1" style={{ fontSize: 9 }}>Aujourd'hui</Badge>
                        )}
                      </td>
                      <td className="text-end fw-bold text-primary">
                        {formatMontant(t.totalTTC)} F
                      </td>
                      <td className="text-center">
                        <Button
                          variant="link"
                          size="sm"
                          className="p-0"
                          onClick={() => { setTemplateHistorique(t); setShowHistorique(true); }}
                          title="Voir l'historique"
                        >
                          <FiClock size={13} className="me-1" />
                          {t.nbOccurrences}
                        </Button>
                      </td>
                      <td>
                        {t.dateFin ? (
                          <span className="text-muted small">{formatDate(t.dateFin)}</span>
                        ) : (
                          <span className="text-muted small fst-italic">Illimitée</span>
                        )}
                      </td>
                      <td>
                        {t.isActive ? (
                          <Badge bg="success">Actif</Badge>
                        ) : (
                          <Badge bg="secondary">Suspendu</Badge>
                        )}
                      </td>
                      <td>
                        <div className="d-flex gap-1 justify-content-end">
                          {/* Générer maintenant */}
                          <Button
                            variant="outline-success"
                            size="sm"
                            disabled={!t.isActive || isBusy || generating}
                            onClick={() => handleGenerer(t._id)}
                            title="Générer une facture maintenant"
                          >
                            {isBusy && generating ? <Spinner size="sm" /> : <FiZap size={13} />}
                          </Button>

                          {/* Activer / Suspendre */}
                          <Button
                            variant={t.isActive ? 'outline-warning' : 'outline-primary'}
                            size="sm"
                            disabled={isBusy || toggling}
                            onClick={() => handleToggle(t._id)}
                            title={t.isActive ? 'Suspendre' : 'Activer'}
                          >
                            {isBusy && toggling ? <Spinner size="sm" /> : t.isActive ? <FiPause size={13} /> : <FiPlay size={13} />}
                          </Button>

                          {/* Modifier */}
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={() => { setEditData(t); setShowForm(true); }}
                            title="Modifier"
                          >
                            <FiEdit2 size={13} />
                          </Button>

                          {/* Supprimer */}
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => { setToDelete(t); setShowDeleteModal(true); }}
                            title="Supprimer"
                          >
                            <FiTrash2 size={13} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Modal formulaire */}
      <FormModal
        show={showForm}
        onHide={() => { setShowForm(false); setEditData(null); }}
        editData={editData}
      />

      {/* Modal historique */}
      <HistoriqueModal
        show={showHistorique}
        onHide={() => { setShowHistorique(false); setTemplateHistorique(null); }}
        template={templateHistorique}
      />

      {/* Modal suppression */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="text-danger">
            <FiTrash2 className="me-2" />
            Supprimer le modèle
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            Voulez-vous supprimer le modèle récurrent pour{' '}
            <strong>{toDelete?.clientSnapshot?.displayName}</strong> ({toDelete?.frequence}) ?
          </p>
          <Alert variant="warning" className="py-2 small mb-0">
            Les factures déjà générées ne seront pas supprimées. Seul le modèle sera désactivé.
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Annuler</Button>
          <Button variant="danger" onClick={handleDeleteConfirm} disabled={deleting}>
            {deleting && <Spinner size="sm" className="me-1" />}
            Supprimer
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default FacturesRecurrentesPage;
