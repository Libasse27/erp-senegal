import React, { useState } from 'react';
import {
  Card, Table, Badge, Button, Form, Row, Col, Modal,
  Spinner, Alert, InputGroup, Tabs, Tab, ProgressBar,
} from 'react-bootstrap';
import {
  FiPlus, FiSearch, FiEdit2, FiTrash2, FiRefreshCw,
  FiPauseCircle, FiPlayCircle, FiEye, FiBriefcase,
  FiUsers, FiFileText, FiDollarSign, FiCheckCircle,
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import {
  useGetCompaniesOverviewQuery,
  useListAllCompaniesQuery,
  useGetCompanyAdminQuery,
  useCreateCompanyAdminMutation,
  useUpdateCompanyAdminMutation,
  useSuspendCompanyMutation,
  useActivateCompanyMutation,
  useDeleteCompanyAdminMutation,
} from '../../redux/api/superAdminApi';

// ── Badges ────────────────────────────────────────────────────────────────────

const StatusBadge = ({ status }) => {
  const map = {
    active:    { bg: 'success',   label: 'Actif' },
    suspended: { bg: 'danger',    label: 'Suspendu' },
    trial:     { bg: 'warning',   label: 'Essai' },
    expired:   { bg: 'secondary', label: 'Expiré' },
  };
  const cfg = map[status] || { bg: 'secondary', label: status };
  return <Badge bg={cfg.bg}>{cfg.label}</Badge>;
};

const PlanBadge = ({ plan }) => {
  const map = {
    starter:      { bg: 'light', label: 'Starter', text: 'dark' },
    professional: { bg: 'primary', label: 'Professional' },
    enterprise:   { bg: 'dark', label: 'Enterprise' },
  };
  const cfg = map[plan] || { bg: 'secondary', label: plan };
  return <Badge bg={cfg.bg} text={cfg.text}>{cfg.label}</Badge>;
};

// ── Formulaire Entreprise ─────────────────────────────────────────────────────

const EMPTY_FORM = {
  name: '', legalForm: '', ninea: '', rccm: '',
  email: '', phone: '', website: '', sector: '', employeeCount: '',
  plan: 'starter', status: 'active',
  superAdminNotes: '',
  subscriptionStartDate: '', subscriptionEndDate: '',
  address: { street: '', city: 'Dakar', region: '', postalCode: '', country: 'Sénégal' },
  fiscalInfo: { tvaRate: 18, isSubjectToTVA: true, fiscalRegime: 'reel_normal' },
};

const CompanyForm = ({ initial = EMPTY_FORM, onSubmit, loading }) => {
  const [form, setForm] = useState(initial);

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }));
  const setAddress = (field, value) => setForm((f) => ({ ...f, address: { ...f.address, [field]: value } }));
  const setFiscal = (field, value) => setForm((f) => ({ ...f, fiscalInfo: { ...f.fiscalInfo, [field]: value } }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { ...form };
    if (payload.employeeCount) payload.employeeCount = Number(payload.employeeCount);
    onSubmit(payload);
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Tabs defaultActiveKey="general" className="mb-3" fill>
        {/* Onglet Général */}
        <Tab eventKey="general" title="Général">
          <Row className="g-3">
            <Col xs={12} md={8}>
              <Form.Group>
                <Form.Label>Nom de l'entreprise <span className="text-danger">*</span></Form.Label>
                <Form.Control value={form.name} onChange={(e) => set('name', e.target.value)} required />
              </Form.Group>
            </Col>
            <Col xs={12} md={4}>
              <Form.Group>
                <Form.Label>Forme juridique</Form.Label>
                <Form.Select value={form.legalForm} onChange={(e) => set('legalForm', e.target.value)}>
                  <option value="">-- Sélectionner --</option>
                  {['SARL', 'SA', 'SAS', 'SASU', 'SNC', 'EI', 'GIE', 'Autre'].map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col xs={12} md={4}>
              <Form.Group>
                <Form.Label>NINEA</Form.Label>
                <Form.Control
                  value={form.ninea}
                  onChange={(e) => set('ninea', e.target.value.toUpperCase())}
                  placeholder="Ex: 005234567 2G3"
                />
              </Form.Group>
            </Col>
            <Col xs={12} md={4}>
              <Form.Group>
                <Form.Label>RCCM</Form.Label>
                <Form.Control value={form.rccm} onChange={(e) => set('rccm', e.target.value)} />
              </Form.Group>
            </Col>
            <Col xs={12} md={4}>
              <Form.Group>
                <Form.Label>Secteur d'activité</Form.Label>
                <Form.Control value={form.sector} onChange={(e) => set('sector', e.target.value)} placeholder="Ex: Distribution, Services..." />
              </Form.Group>
            </Col>
            <Col xs={12} md={6}>
              <Form.Group>
                <Form.Label>Email</Form.Label>
                <Form.Control type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
              </Form.Group>
            </Col>
            <Col xs={12} md={3}>
              <Form.Group>
                <Form.Label>Téléphone</Form.Label>
                <Form.Control value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+221 77..." />
              </Form.Group>
            </Col>
            <Col xs={12} md={3}>
              <Form.Group>
                <Form.Label>Effectif</Form.Label>
                <Form.Control type="number" min={0} value={form.employeeCount} onChange={(e) => set('employeeCount', e.target.value)} />
              </Form.Group>
            </Col>
            <Col xs={12} md={6}>
              <Form.Group>
                <Form.Label>Site web</Form.Label>
                <Form.Control value={form.website} onChange={(e) => set('website', e.target.value)} placeholder="www.example.sn" />
              </Form.Group>
            </Col>
          </Row>
        </Tab>

        {/* Onglet Adresse */}
        <Tab eventKey="address" title="Adresse">
          <Row className="g-3">
            <Col xs={12}>
              <Form.Group>
                <Form.Label>Rue / Avenue</Form.Label>
                <Form.Control value={form.address.street} onChange={(e) => setAddress('street', e.target.value)} />
              </Form.Group>
            </Col>
            <Col xs={12} md={4}>
              <Form.Group>
                <Form.Label>Ville</Form.Label>
                <Form.Control value={form.address.city} onChange={(e) => setAddress('city', e.target.value)} />
              </Form.Group>
            </Col>
            <Col xs={12} md={4}>
              <Form.Group>
                <Form.Label>Région</Form.Label>
                <Form.Select value={form.address.region} onChange={(e) => setAddress('region', e.target.value)}>
                  <option value="">-- Sélectionner --</option>
                  {['Dakar', 'Thiès', 'Saint-Louis', 'Diourbel', 'Fatick', 'Kaolack', 'Kolda', 'Louga', 'Matam', 'Sédhiou', 'Tambacounda', 'Ziguinchor', 'Kaffrine', 'Kédougou'].map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col xs={12} md={4}>
              <Form.Group>
                <Form.Label>Code postal</Form.Label>
                <Form.Control value={form.address.postalCode} onChange={(e) => setAddress('postalCode', e.target.value)} />
              </Form.Group>
            </Col>
            <Col xs={12} md={6}>
              <Form.Group>
                <Form.Label>Pays</Form.Label>
                <Form.Control value={form.address.country} onChange={(e) => setAddress('country', e.target.value)} />
              </Form.Group>
            </Col>
          </Row>
        </Tab>

        {/* Onglet Plan & Abonnement */}
        <Tab eventKey="plan" title="Plan & Abonnement">
          <Row className="g-3">
            <Col xs={12} md={4}>
              <Form.Group>
                <Form.Label>Plan</Form.Label>
                <Form.Select value={form.plan} onChange={(e) => set('plan', e.target.value)}>
                  <option value="starter">Starter</option>
                  <option value="professional">Professional</option>
                  <option value="enterprise">Enterprise</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col xs={12} md={4}>
              <Form.Group>
                <Form.Label>Statut</Form.Label>
                <Form.Select value={form.status} onChange={(e) => set('status', e.target.value)}>
                  <option value="active">Actif</option>
                  <option value="trial">Essai</option>
                  <option value="suspended">Suspendu</option>
                  <option value="expired">Expiré</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col xs={12} md={4}>
              <Form.Group>
                <Form.Label>Début d'abonnement</Form.Label>
                <Form.Control type="date" value={form.subscriptionStartDate ? form.subscriptionStartDate.slice(0, 10) : ''} onChange={(e) => set('subscriptionStartDate', e.target.value)} />
              </Form.Group>
            </Col>
            <Col xs={12} md={4}>
              <Form.Group>
                <Form.Label>Fin d'abonnement</Form.Label>
                <Form.Control type="date" value={form.subscriptionEndDate ? form.subscriptionEndDate.slice(0, 10) : ''} onChange={(e) => set('subscriptionEndDate', e.target.value)} />
              </Form.Group>
            </Col>
            <Col xs={12}>
              <Form.Group>
                <Form.Label>Notes Super Admin</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={form.superAdminNotes}
                  onChange={(e) => set('superAdminNotes', e.target.value)}
                  placeholder="Notes internes visibles par le Super Admin uniquement..."
                />
              </Form.Group>
            </Col>
          </Row>
        </Tab>

        {/* Onglet Fiscal */}
        <Tab eventKey="fiscal" title="Paramètres Fiscaux">
          <Row className="g-3">
            <Col xs={12} md={4}>
              <Form.Group>
                <Form.Label>Taux TVA (%)</Form.Label>
                <Form.Control
                  type="number" min={0} max={100}
                  value={form.fiscalInfo.tvaRate}
                  onChange={(e) => setFiscal('tvaRate', Number(e.target.value))}
                />
              </Form.Group>
            </Col>
            <Col xs={12} md={4}>
              <Form.Group>
                <Form.Label>Régime fiscal</Form.Label>
                <Form.Select value={form.fiscalInfo.fiscalRegime} onChange={(e) => setFiscal('fiscalRegime', e.target.value)}>
                  <option value="reel_normal">Réel Normal</option>
                  <option value="reel_simplifie">Réel Simplifié</option>
                  <option value="contribuable_unique">Contribuable Unique</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col xs={12} md={4} className="d-flex align-items-end">
              <Form.Check
                type="switch"
                label="Assujetti à la TVA"
                checked={form.fiscalInfo.isSubjectToTVA}
                onChange={(e) => setFiscal('isSubjectToTVA', e.target.checked)}
                className="mb-2"
              />
            </Col>
          </Row>
        </Tab>
      </Tabs>

      <div className="d-flex justify-content-end gap-2 mt-3 pt-3 border-top">
        <Button type="submit" variant="primary" disabled={loading}>
          {loading ? <Spinner size="sm" className="me-1" /> : <FiCheckCircle className="me-1" />}
          Enregistrer
        </Button>
      </div>
    </Form>
  );
};

// ── Panneau de détail entreprise ──────────────────────────────────────────────

const CompanyDetail = ({ id }) => {
  const { data, isLoading } = useGetCompanyAdminQuery(id, { skip: !id });
  if (isLoading) return <div className="text-center py-4"><Spinner /></div>;
  if (!data) return null;

  const { company, stats } = data.data;

  return (
    <div>
      <Row className="g-3 mb-3">
        {[
          { label: 'Utilisateurs', value: stats.totalUsers, icon: FiUsers, color: 'primary' },
          { label: 'Clients', value: stats.totalClients, icon: FiUsers, color: 'success' },
          { label: 'Factures', value: stats.totalFactures, icon: FiFileText, color: 'warning' },
          { label: 'CA Total', value: `${(stats.caTotal || 0).toLocaleString('fr-SN')} FCFA`, icon: FiDollarSign, color: 'info' },
        ].map(({ label, value, icon: Icon, color }) => (
          <Col xs={6} key={label}>
            <div className={`p-3 rounded-3 bg-${color}-subtle d-flex align-items-center gap-2`}>
              <Icon className={`text-${color}`} size={18} />
              <div>
                <div className="small text-muted">{label}</div>
                <div className="fw-bold">{value}</div>
              </div>
            </div>
          </Col>
        ))}
      </Row>

      <table className="table table-borderless table-sm small">
        <tbody>
          <tr><td className="text-muted w-40">NINEA</td><td><code>{company.ninea || '—'}</code></td></tr>
          <tr><td className="text-muted">RCCM</td><td>{company.rccm || '—'}</td></tr>
          <tr><td className="text-muted">Adresse</td><td>{company.fullAddress || '—'}</td></tr>
          <tr><td className="text-muted">Email</td><td>{company.email || '—'}</td></tr>
          <tr><td className="text-muted">Téléphone</td><td>{company.phone || '—'}</td></tr>
          <tr><td className="text-muted">Secteur</td><td>{company.sector || '—'}</td></tr>
          <tr><td className="text-muted">Effectif</td><td>{company.employeeCount || '—'}</td></tr>
          <tr><td className="text-muted">Régime fiscal</td><td>{company.fiscalInfo?.fiscalRegime || '—'}</td></tr>
          <tr><td className="text-muted">TVA</td><td>{company.fiscalInfo?.tvaRate}%</td></tr>
          {company.suspensionReason && (
            <tr>
              <td className="text-muted">Motif suspension</td>
              <td className="text-danger">{company.suspensionReason}</td>
            </tr>
          )}
          {company.superAdminNotes && (
            <tr>
              <td className="text-muted">Notes SA</td>
              <td><em>{company.superAdminNotes}</em></td>
            </tr>
          )}
          <tr><td className="text-muted">Créée le</td><td>{new Date(company.createdAt).toLocaleDateString('fr-SN')}</td></tr>
        </tbody>
      </table>
    </div>
  );
};

// ── Page principale ───────────────────────────────────────────────────────────

const SuperAdminCompaniesPage = () => {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPlan, setFilterPlan] = useState('');
  const [page, setPage] = useState(1);

  const [createModal, setCreateModal] = useState(false);
  const [editModal, setEditModal] = useState({ show: false, company: null });
  const [detailModal, setDetailModal] = useState({ show: false, id: null });
  const [suspendModal, setSuspendModal] = useState({ show: false, company: null });
  const [deleteModal, setDeleteModal] = useState({ show: false, company: null });
  const [suspendReason, setSuspendReason] = useState('');

  const params = {
    page, limit: 15,
    ...(search && { search }),
    ...(filterStatus && { status: filterStatus }),
    ...(filterPlan && { plan: filterPlan }),
    includeDeleted: true,
  };

  const { data: overviewData } = useGetCompaniesOverviewQuery();
  const { data, isLoading, isError, refetch } = useListAllCompaniesQuery(params);
  const [createCompany, { isLoading: creating }] = useCreateCompanyAdminMutation();
  const [updateCompany, { isLoading: updating }] = useUpdateCompanyAdminMutation();
  const [suspendComp, { isLoading: suspending }] = useSuspendCompanyMutation();
  const [activateComp, { isLoading: activating }] = useActivateCompanyMutation();
  const [deleteComp, { isLoading: deleting }] = useDeleteCompanyAdminMutation();

  const companies = data?.data || [];
  const pagination = data?.pagination;
  const overview = overviewData?.data;

  const handleCreate = async (formData) => {
    try {
      await createCompany(formData).unwrap();
      toast.success('Entreprise créée avec succès.');
      setCreateModal(false);
    } catch (err) {
      toast.error(err?.data?.message || 'Erreur lors de la création.');
    }
  };

  const handleUpdate = async (formData) => {
    try {
      await updateCompany({ id: editModal.company._id, ...formData }).unwrap();
      toast.success('Entreprise mise à jour avec succès.');
      setEditModal({ show: false, company: null });
    } catch (err) {
      toast.error(err?.data?.message || 'Erreur lors de la mise à jour.');
    }
  };

  const handleSuspend = async () => {
    if (!suspendReason.trim() || suspendReason.trim().length < 5) {
      toast.warn('Le motif de suspension doit contenir au moins 5 caractères.');
      return;
    }
    try {
      await suspendComp({ id: suspendModal.company._id, reason: suspendReason }).unwrap();
      toast.success(`Entreprise "${suspendModal.company.name}" suspendue.`);
      setSuspendModal({ show: false, company: null });
      setSuspendReason('');
    } catch (err) {
      toast.error(err?.data?.message || 'Erreur lors de la suspension.');
    }
  };

  const handleActivate = async (company) => {
    try {
      await activateComp(company._id).unwrap();
      toast.success(`Entreprise "${company.name}" réactivée.`);
    } catch (err) {
      toast.error(err?.data?.message || 'Erreur lors de la réactivation.');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteComp(deleteModal.company._id).unwrap();
      toast.success(`Entreprise "${deleteModal.company.name}" supprimée.`);
      setDeleteModal({ show: false, company: null });
    } catch (err) {
      toast.error(err?.data?.message || 'Erreur lors de la suppression.');
    }
  };

  const openEdit = (company) => {
    setEditModal({
      show: true,
      company: {
        ...company,
        subscriptionStartDate: company.subscriptionStartDate || '',
        subscriptionEndDate: company.subscriptionEndDate || '',
        address: company.address || { street: '', city: 'Dakar', region: '', postalCode: '', country: 'Sénégal' },
        fiscalInfo: company.fiscalInfo || { tvaRate: 18, isSubjectToTVA: true, fiscalRegime: 'reel_normal' },
      },
    });
  };

  return (
    <div className="p-4">
      {/* En-tête */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h4 className="fw-bold mb-1"><FiBriefcase className="me-2" />Gestion des Entreprises</h4>
          <p className="text-muted mb-0 small">
            {pagination?.total ?? '—'} entreprise(s) enregistrée(s)
          </p>
        </div>
        <div className="d-flex gap-2">
          <Button variant="outline-secondary" size="sm" onClick={refetch}>
            <FiRefreshCw size={14} className="me-1" /> Actualiser
          </Button>
          <Button variant="primary" size="sm" onClick={() => setCreateModal(true)}>
            <FiPlus size={14} className="me-1" /> Nouvelle entreprise
          </Button>
        </div>
      </div>

      {/* KPIs aperçu */}
      {overview && (
        <Row className="g-2 mb-4">
          {[
            { label: 'Total', value: overview.total, color: 'primary' },
            { label: 'Actives', value: overview.byStatus.active, color: 'success' },
            { label: 'Essai', value: overview.byStatus.trial, color: 'warning' },
            { label: 'Suspendues', value: overview.byStatus.suspended, color: 'danger' },
            { label: 'Expirées', value: overview.byStatus.expired, color: 'secondary' },
          ].map(({ label, value, color }) => (
            <Col xs={6} sm={4} md={2} key={label}>
              <Card className={`border-0 text-center py-2 bg-${color}-subtle`}>
                <div className={`fw-bold fs-5 text-${color}`}>{value ?? 0}</div>
                <div className="small text-muted">{label}</div>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* Filtres */}
      <Card className="border-0 shadow-sm mb-3">
        <Card.Body className="py-2">
          <Row className="g-2 align-items-center">
            <Col xs={12} md={5}>
              <InputGroup size="sm">
                <InputGroup.Text><FiSearch /></InputGroup.Text>
                <Form.Control
                  placeholder="Rechercher (nom, NINEA, email)..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                />
              </InputGroup>
            </Col>
            <Col xs={6} md={2}>
              <Form.Select size="sm" value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}>
                <option value="">Tous statuts</option>
                <option value="active">Actif</option>
                <option value="trial">Essai</option>
                <option value="suspended">Suspendu</option>
                <option value="expired">Expiré</option>
              </Form.Select>
            </Col>
            <Col xs={6} md={2}>
              <Form.Select size="sm" value={filterPlan} onChange={(e) => { setFilterPlan(e.target.value); setPage(1); }}>
                <option value="">Tous plans</option>
                <option value="starter">Starter</option>
                <option value="professional">Professional</option>
                <option value="enterprise">Enterprise</option>
              </Form.Select>
            </Col>
            {(search || filterStatus || filterPlan) && (
              <Col xs="auto">
                <Button size="sm" variant="outline-secondary" onClick={() => { setSearch(''); setFilterStatus(''); setFilterPlan(''); setPage(1); }}>
                  Effacer
                </Button>
              </Col>
            )}
          </Row>
        </Card.Body>
      </Card>

      {/* Tableau */}
      {isLoading && <div className="text-center py-5"><Spinner /></div>}
      {isError && <Alert variant="danger">Impossible de charger les entreprises.</Alert>}

      <Card className="border-0 shadow-sm">
        <Card.Body className="p-0">
          <Table responsive hover className="mb-0">
            <thead className="table-light">
              <tr>
                <th>Entreprise</th>
                <th>NINEA</th>
                <th>Contact</th>
                <th>Plan</th>
                <th>Statut</th>
                <th>Créée le</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {companies.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={7} className="text-center py-5 text-muted">
                    <FiBriefcase size={32} className="d-block mx-auto mb-2 opacity-25" />
                    Aucune entreprise trouvée.
                  </td>
                </tr>
              )}
              {companies.map((company) => (
                <tr key={company._id} style={{ opacity: company.isActive ? 1 : 0.5 }}>
                  <td>
                    <div className="fw-medium">{company.name}</div>
                    {company.legalForm && <span className="badge bg-light text-dark small">{company.legalForm}</span>}
                    {company.sector && <div className="text-muted" style={{ fontSize: '0.75rem' }}>{company.sector}</div>}
                  </td>
                  <td><code className="small">{company.ninea || '—'}</code></td>
                  <td className="small">
                    <div>{company.email || '—'}</div>
                    <div className="text-muted">{company.phone || ''}</div>
                  </td>
                  <td><PlanBadge plan={company.plan} /></td>
                  <td><StatusBadge status={company.status} /></td>
                  <td className="small text-muted">
                    {new Date(company.createdAt).toLocaleDateString('fr-SN')}
                  </td>
                  <td>
                    <div className="d-flex gap-1 justify-content-end flex-wrap">
                      <Button
                        size="sm" variant="outline-info"
                        title="Détails"
                        onClick={() => setDetailModal({ show: true, id: company._id })}
                      >
                        <FiEye size={13} />
                      </Button>
                      <Button
                        size="sm" variant="outline-primary"
                        title="Modifier"
                        onClick={() => openEdit(company)}
                      >
                        <FiEdit2 size={13} />
                      </Button>
                      {company.status !== 'suspended' && company.isActive ? (
                        <Button
                          size="sm" variant="outline-warning"
                          title="Suspendre"
                          onClick={() => { setSuspendModal({ show: true, company }); setSuspendReason(''); }}
                        >
                          <FiPauseCircle size={13} />
                        </Button>
                      ) : (
                        <Button
                          size="sm" variant="outline-success"
                          title="Réactiver"
                          onClick={() => handleActivate(company)}
                          disabled={activating}
                        >
                          <FiPlayCircle size={13} />
                        </Button>
                      )}
                      <Button
                        size="sm" variant="outline-danger"
                        title="Supprimer"
                        onClick={() => setDeleteModal({ show: true, company })}
                      >
                        <FiTrash2 size={13} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
        {pagination && pagination.totalPages > 1 && (
          <Card.Footer className="bg-transparent border-0 d-flex align-items-center justify-content-between">
            <small className="text-muted">
              {pagination.total} entreprise(s) — page {pagination.page}/{pagination.totalPages}
            </small>
            <div className="d-flex gap-1">
              <Button size="sm" variant="outline-secondary" disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</Button>
              <Button size="sm" variant="outline-secondary" disabled={page >= pagination.totalPages} onClick={() => setPage(p => p + 1)}>›</Button>
            </div>
          </Card.Footer>
        )}
      </Card>

      {/* ── Modal Création ─────────────────────────────────────────────── */}
      <Modal show={createModal} onHide={() => setCreateModal(false)} size="xl" fullscreen="lg-down">
        <Modal.Header closeButton>
          <Modal.Title><FiPlus className="me-2" />Nouvelle Entreprise</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <CompanyForm onSubmit={handleCreate} loading={creating} />
        </Modal.Body>
      </Modal>

      {/* ── Modal Édition ──────────────────────────────────────────────── */}
      <Modal show={editModal.show} onHide={() => setEditModal({ show: false, company: null })} size="xl" fullscreen="lg-down">
        <Modal.Header closeButton>
          <Modal.Title><FiEdit2 className="me-2" />Modifier — {editModal.company?.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {editModal.company && (
            <CompanyForm initial={editModal.company} onSubmit={handleUpdate} loading={updating} />
          )}
        </Modal.Body>
      </Modal>

      {/* ── Modal Détail ───────────────────────────────────────────────── */}
      <Modal show={detailModal.show} onHide={() => setDetailModal({ show: false, id: null })} size="lg">
        <Modal.Header closeButton>
          <Modal.Title><FiEye className="me-2" />Détail Entreprise</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {detailModal.id && <CompanyDetail id={detailModal.id} />}
        </Modal.Body>
      </Modal>

      {/* ── Modal Suspension ───────────────────────────────────────────── */}
      <Modal show={suspendModal.show} onHide={() => setSuspendModal({ show: false, company: null })} centered>
        <Modal.Header closeButton>
          <Modal.Title><FiPauseCircle className="me-2 text-warning" />Suspendre l'entreprise</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="warning" className="small">
            L'entreprise <strong>{suspendModal.company?.name}</strong> sera suspendue. Ses utilisateurs ne pourront plus se connecter.
          </Alert>
          <Form.Group>
            <Form.Label>Motif de suspension <span className="text-danger">*</span></Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              placeholder="Ex: Impayé de 3 mois, violation des conditions d'utilisation..."
            />
            <Form.Text className="text-muted">{suspendReason.length}/500 caractères (min. 5)</Form.Text>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setSuspendModal({ show: false, company: null })}>Annuler</Button>
          <Button variant="warning" onClick={handleSuspend} disabled={suspending}>
            {suspending ? <Spinner size="sm" className="me-1" /> : null}
            Confirmer la suspension
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ── Modal Suppression ──────────────────────────────────────────── */}
      <Modal show={deleteModal.show} onHide={() => setDeleteModal({ show: false, company: null })} centered size="sm">
        <Modal.Header closeButton>
          <Modal.Title>Confirmer la suppression</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Supprimer définitivement <strong>{deleteModal.company?.name}</strong> ?</p>
          <Alert variant="danger" className="small mb-0">Action irréversible. Toutes les données associées seront désactivées.</Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" size="sm" onClick={() => setDeleteModal({ show: false, company: null })}>Annuler</Button>
          <Button variant="danger" size="sm" onClick={handleDelete} disabled={deleting}>
            {deleting ? <Spinner size="sm" className="me-1" /> : null}
            Supprimer
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default SuperAdminCompaniesPage;
