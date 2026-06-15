import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import { FiArrowLeft, FiSave } from 'react-icons/fi';
import { toast } from 'react-toastify';
import usePageTitle from '../../hooks/usePageTitle';
import {
  useGetOpportuniteQuery,
  useCreateOpportuniteMutation,
  useUpdateOpportuniteMutation,
} from '../../redux/api/crmApi';
import { useGetClientsQuery } from '../../redux/api/clientsApi';

const ETAPES = [
  { value: 'prospect',      label: 'Prospect' },
  { value: 'qualification', label: 'Qualification' },
  { value: 'proposition',   label: 'Proposition' },
  { value: 'negociation',   label: 'Négociation' },
  { value: 'gagne',         label: 'Gagné' },
  { value: 'perdu',         label: 'Perdu' },
];

const SOURCES = [
  { value: 'appel_entrant',  label: 'Appel entrant' },
  { value: 'email',          label: 'Email' },
  { value: 'site_web',       label: 'Site web' },
  { value: 'recommandation', label: 'Recommandation' },
  { value: 'salon',          label: 'Salon / Événement' },
  { value: 'prospection',    label: 'Prospection active' },
  { value: 'autre',          label: 'Autre' },
];

const PROBA_PAR_ETAPE = {
  prospect: 10, qualification: 25, proposition: 50, negociation: 75, gagne: 100, perdu: 0,
};

const EMPTY_FORM = {
  titre: '', description: '', client: '', etape: 'prospect',
  probabilite: 10, montantEstime: '', dateEcheance: '',
  sourceContact: 'autre', notes: '',
};

const OpportuniteFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  usePageTitle(isEdit ? 'Modifier l\'opportunité' : 'Nouvelle opportunité', [
    { label: 'Accueil', path: '/' },
    { label: 'CRM', path: '/crm' },
    { label: isEdit ? 'Modifier' : 'Nouvelle opportunité' },
  ]);

  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');

  const { data: existing } = useGetOpportuniteQuery(id, { skip: !isEdit });
  const { data: clientsData } = useGetClientsQuery({ limit: 500 });
  const [create, { isLoading: creating }] = useCreateOpportuniteMutation();
  const [update, { isLoading: updating }] = useUpdateOpportuniteMutation();
  const saving = creating || updating;

  const clients = clientsData?.data || [];

  useEffect(() => {
    if (existing?.data) {
      const o = existing.data;
      setForm({
        titre:         o.titre,
        description:   o.description || '',
        client:        o.client?._id || '',
        etape:         o.etape,
        probabilite:   o.probabilite,
        montantEstime: o.montantEstime || '',
        dateEcheance:  o.dateEcheance ? o.dateEcheance.slice(0, 10) : '',
        sourceContact: o.sourceContact,
        notes:         o.notes || '',
      });
    }
  }, [existing]);

  const set = (field) => (e) => setForm((p) => ({ ...p, [field]: e.target.value }));

  const handleEtapeChange = (e) => {
    const etape = e.target.value;
    setForm((p) => ({
      ...p,
      etape,
      probabilite: PROBA_PAR_ETAPE[etape] ?? p.probabilite,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.titre) return setError('Le titre est obligatoire.');

    const payload = {
      ...form,
      montantEstime: form.montantEstime ? Number(form.montantEstime) : 0,
      probabilite:   Number(form.probabilite),
      client:        form.client || null,
      dateEcheance:  form.dateEcheance || null,
    };

    try {
      if (isEdit) {
        await update({ id, ...payload }).unwrap();
        toast.success('Opportunité mise à jour');
      } else {
        await create(payload).unwrap();
        toast.success('Opportunité créée');
      }
      navigate('/crm');
    } catch (err) {
      setError(err?.data?.message || 'Erreur lors de la sauvegarde');
    }
  };

  return (
    <>
      <div className="page-header mb-4">
        <div className="d-flex align-items-center gap-3">
          <Button variant="outline-secondary" size="sm" onClick={() => navigate('/crm')}>
            <FiArrowLeft />
          </Button>
          <div>
            <h1 className="mb-0">{isEdit ? 'Modifier l\'opportunité' : 'Nouvelle opportunité'}</h1>
            <small className="text-muted">Pipeline commercial</small>
          </div>
        </div>
      </div>

      <Card className="shadow-sm" style={{ maxWidth: 760 }}>
        <Card.Body>
          {error && <Alert variant="danger" className="mb-3">{error}</Alert>}
          <Form onSubmit={handleSubmit}>
            <Row className="g-3">
              <Col md={12}>
                <Form.Group>
                  <Form.Label className="fw-semibold">Titre <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    value={form.titre} onChange={set('titre')}
                    placeholder="Ex: Fourniture de matériel informatique — Client X"
                    maxLength={200} required
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold">Client</Form.Label>
                  <Form.Select value={form.client} onChange={set('client')}>
                    <option value="">— Aucun client —</option>
                    {clients.map((c) => (
                      <option key={c._id} value={c._id}>{c.nom}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold">Source du contact</Form.Label>
                  <Form.Select value={form.sourceContact} onChange={set('sourceContact')}>
                    {SOURCES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group>
                  <Form.Label className="fw-semibold">Étape</Form.Label>
                  <Form.Select value={form.etape} onChange={handleEtapeChange}>
                    {ETAPES.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group>
                  <Form.Label className="fw-semibold">Probabilité (%)</Form.Label>
                  <Form.Control
                    type="number" min={0} max={100} step={5}
                    value={form.probabilite} onChange={set('probabilite')}
                  />
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group>
                  <Form.Label className="fw-semibold">Montant estimé (FCFA)</Form.Label>
                  <Form.Control
                    type="number" min={0} step={1000}
                    placeholder="0"
                    value={form.montantEstime} onChange={set('montantEstime')}
                  />
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group>
                  <Form.Label className="fw-semibold">Date d'échéance</Form.Label>
                  <Form.Control type="date" value={form.dateEcheance} onChange={set('dateEcheance')} />
                </Form.Group>
              </Col>

              <Col md={12}>
                <Form.Group>
                  <Form.Label className="fw-semibold">Description</Form.Label>
                  <Form.Control
                    as="textarea" rows={2}
                    value={form.description} onChange={set('description')}
                    placeholder="Contexte, besoin client, enjeux..."
                    maxLength={2000}
                  />
                </Form.Group>
              </Col>

              <Col md={12}>
                <Form.Group>
                  <Form.Label className="fw-semibold">Notes internes</Form.Label>
                  <Form.Control
                    as="textarea" rows={2}
                    value={form.notes} onChange={set('notes')}
                    maxLength={2000}
                  />
                </Form.Group>
              </Col>

              <Col md={12} className="d-flex justify-content-end gap-2">
                <Button variant="secondary" onClick={() => navigate('/crm')}>Annuler</Button>
                <Button type="submit" variant="primary" disabled={saving}>
                  {saving ? <Spinner size="sm" animation="border" className="me-1" /> : <FiSave className="me-1" />}
                  {isEdit ? 'Enregistrer' : 'Créer l\'opportunité'}
                </Button>
              </Col>
            </Row>
          </Form>
        </Card.Body>
      </Card>
    </>
  );
};

export default OpportuniteFormPage;
