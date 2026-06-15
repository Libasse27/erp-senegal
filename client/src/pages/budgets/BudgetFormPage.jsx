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
  useGetBudgetQuery,
  useCreateBudgetMutation,
  useUpdateBudgetMutation,
} from '../../redux/api/budgetsApi';

const MOIS_OPTIONS = [
  { value: '', label: 'Annuel (toute l\'année)' },
  { value: 1,  label: 'Janvier' }, { value: 2,  label: 'Février' },
  { value: 3,  label: 'Mars' },    { value: 4,  label: 'Avril' },
  { value: 5,  label: 'Mai' },     { value: 6,  label: 'Juin' },
  { value: 7,  label: 'Juillet' }, { value: 8,  label: 'Août' },
  { value: 9,  label: 'Septembre'},{ value: 10, label: 'Octobre' },
  { value: 11, label: 'Novembre' },{ value: 12, label: 'Décembre' },
];

const CATEGORIES_PRODUITS = [
  'Ventes produits', 'Ventes services', 'Subventions', 'Produits financiers', 'Autres produits',
];
const CATEGORIES_CHARGES = [
  'Achats matières premières', 'Achats marchandises', 'Frais généraux', 'Salaires & charges sociales',
  'Loyer & charges', 'Transport & logistique', 'Marketing & communication',
  'Frais bancaires', 'Impôts & taxes', 'Amortissements', 'Autres charges',
];

const EMPTY_FORM = {
  annee: new Date().getFullYear(),
  mois: '',
  type: 'produits',
  categorie: '',
  libelle: '',
  montantPrevu: '',
  notes: '',
};

const BudgetFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  usePageTitle(isEdit ? 'Modifier le budget' : 'Nouveau budget', [
    { label: 'Accueil', path: '/' },
    { label: 'Budget & Prévisions', path: '/budgets' },
    { label: isEdit ? 'Modifier' : 'Nouveau' },
  ]);

  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');

  const { data: existing } = useGetBudgetQuery(id, { skip: !isEdit });
  const [create, { isLoading: creating }] = useCreateBudgetMutation();
  const [update, { isLoading: updating }] = useUpdateBudgetMutation();
  const saving = creating || updating;

  useEffect(() => {
    if (existing?.data) {
      const b = existing.data;
      setForm({
        annee:        b.annee,
        mois:         b.mois ?? '',
        type:         b.type,
        categorie:    b.categorie,
        libelle:      b.libelle,
        montantPrevu: b.montantPrevu,
        notes:        b.notes || '',
      });
    }
  }, [existing]);

  const set = (field) => (e) => setForm((p) => ({ ...p, [field]: e.target.value }));

  const categorieOptions = form.type === 'produits' ? CATEGORIES_PRODUITS : CATEGORIES_CHARGES;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.annee || !form.type || !form.categorie || !form.libelle || form.montantPrevu === '') {
      return setError('Tous les champs obligatoires doivent être remplis.');
    }
    if (Number(form.montantPrevu) < 0) {
      return setError('Le montant prévu doit être positif ou nul.');
    }

    const payload = {
      ...form,
      annee:        Number(form.annee),
      mois:         form.mois ? Number(form.mois) : null,
      montantPrevu: Number(form.montantPrevu),
    };

    try {
      if (isEdit) {
        await update({ id, ...payload }).unwrap();
        toast.success('Budget mis à jour');
      } else {
        await create(payload).unwrap();
        toast.success('Budget créé');
      }
      navigate('/budgets');
    } catch (err) {
      setError(err?.data?.message || 'Erreur lors de la sauvegarde');
    }
  };

  return (
    <>
      <div className="page-header mb-4">
        <div className="d-flex align-items-center gap-3">
          <Button variant="outline-secondary" size="sm" onClick={() => navigate('/budgets')}>
            <FiArrowLeft />
          </Button>
          <div>
            <h1 className="mb-0">{isEdit ? 'Modifier le budget' : 'Nouveau budget'}</h1>
            <small className="text-muted">Définir un objectif budgétaire pour la période</small>
          </div>
        </div>
      </div>

      <Card className="shadow-sm" style={{ maxWidth: 700 }}>
        <Card.Body>
          {error && (
            <Alert variant="danger" className="mb-3">{error}</Alert>
          )}

          <Form onSubmit={handleSubmit}>
            <Row className="g-3">
              {/* Période */}
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold">Année <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="number"
                    min={2020}
                    max={2035}
                    value={form.annee}
                    onChange={set('annee')}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold">Mois</Form.Label>
                  <Form.Select value={form.mois} onChange={set('mois')}>
                    {MOIS_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </Form.Select>
                  <Form.Text className="text-muted">Laissez vide pour un budget annuel global</Form.Text>
                </Form.Group>
              </Col>

              {/* Type */}
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold">Type <span className="text-danger">*</span></Form.Label>
                  <Form.Select value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value, categorie: '' }))}>
                    <option value="produits">Produits / Revenus</option>
                    <option value="charges">Charges / Dépenses</option>
                  </Form.Select>
                </Form.Group>
              </Col>

              {/* Catégorie */}
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold">Catégorie <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    value={form.categorie}
                    onChange={set('categorie')}
                    required
                  >
                    <option value="">— Choisir une catégorie —</option>
                    {categorieOptions.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                    <option value="__autre__">Autre (saisie libre)</option>
                  </Form.Select>
                </Form.Group>
              </Col>

              {/* Catégorie libre */}
              {form.categorie === '__autre__' && (
                <Col md={12}>
                  <Form.Group>
                    <Form.Label className="fw-semibold">Catégorie personnalisée <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Ex: Frais de formation..."
                      maxLength={100}
                      value=""
                      onChange={(e) => setForm((p) => ({ ...p, categorie: e.target.value }))}
                    />
                  </Form.Group>
                </Col>
              )}

              {/* Libellé */}
              <Col md={12}>
                <Form.Group>
                  <Form.Label className="fw-semibold">Libellé <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Description précise de ce poste budgétaire..."
                    value={form.libelle}
                    onChange={set('libelle')}
                    maxLength={200}
                    required
                  />
                </Form.Group>
              </Col>

              {/* Montant */}
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold">Montant prévu (FCFA) <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="number"
                    min={0}
                    step={1}
                    placeholder="0"
                    value={form.montantPrevu}
                    onChange={set('montantPrevu')}
                    required
                  />
                </Form.Group>
              </Col>

              {/* Notes */}
              <Col md={12}>
                <Form.Group>
                  <Form.Label className="fw-semibold">Notes</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    placeholder="Commentaires, hypothèses de calcul..."
                    value={form.notes}
                    onChange={set('notes')}
                    maxLength={500}
                  />
                </Form.Group>
              </Col>

              {/* Boutons */}
              <Col md={12} className="d-flex justify-content-end gap-2 mt-2">
                <Button variant="secondary" onClick={() => navigate('/budgets')}>
                  Annuler
                </Button>
                <Button type="submit" variant="primary" disabled={saving}>
                  {saving ? <Spinner size="sm" animation="border" className="me-1" /> : <FiSave className="me-1" />}
                  {isEdit ? 'Enregistrer' : 'Créer le budget'}
                </Button>
              </Col>
            </Row>
          </Form>
        </Card.Body>
      </Card>
    </>
  );
};

export default BudgetFormPage;
