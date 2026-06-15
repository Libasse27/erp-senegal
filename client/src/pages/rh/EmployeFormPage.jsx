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
import { useGetEmployeQuery, useCreateEmployeMutation, useUpdateEmployeMutation } from '../../redux/api/rhApi';

const DEPARTEMENTS = [
  'Direction générale', 'Comptabilité & Finance', 'Commercial & Ventes', 'Marketing',
  'Ressources Humaines', 'Informatique & Systèmes', 'Logistique & Stock', 'Production',
  'Juridique', 'Service client', 'Autre',
];

const EMPTY_FORM = {
  nom: '', prenom: '', email: '', telephone: '', genre: 'M',
  dateNaissance: '', nationalite: 'Sénégalaise', adresse: '',
  poste: '', departement: '', dateEmbauche: '', dateFin: '',
  typeContrat: 'CDI', statut: 'actif',
  salaireBrut: '', tauxIPRES: 5.6, tauxIR: 0,
  modePaiement: 'virement', numeroCompte: '', notes: '',
};

const EmployeFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  usePageTitle(isEdit ? 'Modifier l\'employé' : 'Nouvel employé', [
    { label: 'Accueil', path: '/' },
    { label: 'RH', path: '/rh' },
    { label: 'Employés', path: '/rh/employes' },
    { label: isEdit ? 'Modifier' : 'Nouveau' },
  ]);

  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');

  const { data: existing } = useGetEmployeQuery(id, { skip: !isEdit });
  const [create, { isLoading: creating }] = useCreateEmployeMutation();
  const [update, { isLoading: updating }] = useUpdateEmployeMutation();
  const saving = creating || updating;

  useEffect(() => {
    if (existing?.data) {
      const e = existing.data;
      setForm({
        nom: e.nom, prenom: e.prenom, email: e.email || '',
        telephone: e.telephone || '', genre: e.genre,
        dateNaissance: e.dateNaissance ? e.dateNaissance.slice(0, 10) : '',
        nationalite: e.nationalite, adresse: e.adresse || '',
        poste: e.poste, departement: e.departement,
        dateEmbauche: e.dateEmbauche ? e.dateEmbauche.slice(0, 10) : '',
        dateFin: e.dateFin ? e.dateFin.slice(0, 10) : '',
        typeContrat: e.typeContrat, statut: e.statut,
        salaireBrut: e.salaireBrut, tauxIPRES: e.tauxIPRES, tauxIR: e.tauxIR,
        modePaiement: e.modePaiement, numeroCompte: e.numeroCompte || '', notes: e.notes || '',
      });
    }
  }, [existing]);

  const set = (field) => (e) => setForm((p) => ({ ...p, [field]: e.target.value }));

  const salaireNet = form.salaireBrut
    ? Math.round(Number(form.salaireBrut) * (1 - form.tauxIPRES / 100 - form.tauxIR / 100))
    : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.nom || !form.prenom || !form.poste || !form.departement || !form.dateEmbauche || !form.typeContrat || !form.salaireBrut) {
      return setError('Les champs marqués * sont obligatoires.');
    }

    const payload = {
      ...form,
      salaireBrut: Number(form.salaireBrut),
      tauxIPRES:   Number(form.tauxIPRES),
      tauxIR:      Number(form.tauxIR),
      dateFin:     form.dateFin || null,
      dateNaissance: form.dateNaissance || null,
    };

    try {
      if (isEdit) {
        await update({ id, ...payload }).unwrap();
        toast.success('Employé mis à jour');
      } else {
        await create(payload).unwrap();
        toast.success('Employé créé');
      }
      navigate('/rh/employes');
    } catch (err) {
      setError(err?.data?.message || 'Erreur lors de la sauvegarde');
    }
  };

  return (
    <>
      <div className="page-header mb-4">
        <div className="d-flex align-items-center gap-3">
          <Button variant="outline-secondary" size="sm" onClick={() => navigate('/rh/employes')}>
            <FiArrowLeft />
          </Button>
          <div>
            <h1 className="mb-0">{isEdit ? 'Modifier l\'employé' : 'Nouvel employé'}</h1>
            <small className="text-muted">Fiche RH complète</small>
          </div>
        </div>
      </div>

      <Form onSubmit={handleSubmit}>
        {error && <Alert variant="danger" className="mb-3">{error}</Alert>}

        {/* IDENTITÉ */}
        <Card className="shadow-sm mb-3">
          <Card.Header><strong>Identité</strong></Card.Header>
          <Card.Body>
            <Row className="g-3">
              <Col md={3}>
                <Form.Group>
                  <Form.Label className="fw-semibold">Nom <span className="text-danger">*</span></Form.Label>
                  <Form.Control value={form.nom} onChange={set('nom')} maxLength={100} required />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label className="fw-semibold">Prénom <span className="text-danger">*</span></Form.Label>
                  <Form.Control value={form.prenom} onChange={set('prenom')} maxLength={100} required />
                </Form.Group>
              </Col>
              <Col md={2}>
                <Form.Group>
                  <Form.Label className="fw-semibold">Genre</Form.Label>
                  <Form.Select value={form.genre} onChange={set('genre')}>
                    <option value="M">Masculin</option>
                    <option value="F">Féminin</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={2}>
                <Form.Group>
                  <Form.Label className="fw-semibold">Date naissance</Form.Label>
                  <Form.Control type="date" value={form.dateNaissance} onChange={set('dateNaissance')} />
                </Form.Group>
              </Col>
              <Col md={2}>
                <Form.Group>
                  <Form.Label className="fw-semibold">Nationalité</Form.Label>
                  <Form.Control value={form.nationalite} onChange={set('nationalite')} maxLength={60} />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="fw-semibold">Email</Form.Label>
                  <Form.Control type="email" value={form.email} onChange={set('email')} />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label className="fw-semibold">Téléphone</Form.Label>
                  <Form.Control value={form.telephone} onChange={set('telephone')} />
                </Form.Group>
              </Col>
              <Col md={5}>
                <Form.Group>
                  <Form.Label className="fw-semibold">Adresse</Form.Label>
                  <Form.Control value={form.adresse} onChange={set('adresse')} maxLength={300} />
                </Form.Group>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* POSTE & CONTRAT */}
        <Card className="shadow-sm mb-3">
          <Card.Header><strong>Poste & Contrat</strong></Card.Header>
          <Card.Body>
            <Row className="g-3">
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="fw-semibold">Poste <span className="text-danger">*</span></Form.Label>
                  <Form.Control value={form.poste} onChange={set('poste')} maxLength={150} required />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="fw-semibold">Département <span className="text-danger">*</span></Form.Label>
                  <Form.Select value={form.departement} onChange={set('departement')} required>
                    <option value="">— Choisir —</option>
                    {DEPARTEMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="fw-semibold">Type de contrat <span className="text-danger">*</span></Form.Label>
                  <Form.Select value={form.typeContrat} onChange={set('typeContrat')}>
                    <option value="CDI">CDI</option>
                    <option value="CDD">CDD</option>
                    <option value="Stage">Stage</option>
                    <option value="Freelance">Freelance</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label className="fw-semibold">Date d'embauche <span className="text-danger">*</span></Form.Label>
                  <Form.Control type="date" value={form.dateEmbauche} onChange={set('dateEmbauche')} required />
                </Form.Group>
              </Col>
              {(form.typeContrat === 'CDD' || form.typeContrat === 'Stage') && (
                <Col md={3}>
                  <Form.Group>
                    <Form.Label className="fw-semibold">Date fin contrat</Form.Label>
                    <Form.Control type="date" value={form.dateFin} onChange={set('dateFin')} />
                  </Form.Group>
                </Col>
              )}
              {isEdit && (
                <Col md={3}>
                  <Form.Group>
                    <Form.Label className="fw-semibold">Statut</Form.Label>
                    <Form.Select value={form.statut} onChange={set('statut')}>
                      <option value="actif">Actif</option>
                      <option value="inactif">Inactif</option>
                      <option value="conge">En congé</option>
                      <option value="suspendu">Suspendu</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              )}
            </Row>
          </Card.Body>
        </Card>

        {/* RÉMUNÉRATION */}
        <Card className="shadow-sm mb-3">
          <Card.Header><strong>Rémunération</strong></Card.Header>
          <Card.Body>
            <Row className="g-3">
              <Col md={3}>
                <Form.Group>
                  <Form.Label className="fw-semibold">Salaire brut (FCFA) <span className="text-danger">*</span></Form.Label>
                  <Form.Control type="number" min={0} step={1} value={form.salaireBrut} onChange={set('salaireBrut')} required />
                </Form.Group>
              </Col>
              <Col md={2}>
                <Form.Group>
                  <Form.Label className="fw-semibold">Taux IPRES (%)</Form.Label>
                  <Form.Control type="number" min={0} max={30} step={0.1} value={form.tauxIPRES} onChange={set('tauxIPRES')} />
                  <Form.Text className="text-muted">Cotisation salariale IPRES</Form.Text>
                </Form.Group>
              </Col>
              <Col md={2}>
                <Form.Group>
                  <Form.Label className="fw-semibold">Taux IR (%)</Form.Label>
                  <Form.Control type="number" min={0} max={50} step={0.1} value={form.tauxIR} onChange={set('tauxIR')} />
                  <Form.Text className="text-muted">Impôt retenu à la source</Form.Text>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label className="fw-semibold">Salaire net estimé</Form.Label>
                  <div className="form-control bg-light fw-bold text-success" style={{ cursor: 'default' }}>
                    {salaireNet.toLocaleString('fr-FR')} FCFA
                  </div>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label className="fw-semibold">Mode de paiement</Form.Label>
                  <Form.Select value={form.modePaiement} onChange={set('modePaiement')}>
                    <option value="virement">Virement bancaire</option>
                    <option value="especes">Espèces</option>
                    <option value="cheque">Chèque</option>
                    <option value="orange_money">Orange Money</option>
                    <option value="wave">Wave</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="fw-semibold">Numéro de compte / Téléphone</Form.Label>
                  <Form.Control value={form.numeroCompte} onChange={set('numeroCompte')} maxLength={50} placeholder="Pour virement ou Mobile Money" />
                </Form.Group>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* NOTES */}
        <Card className="shadow-sm mb-4">
          <Card.Body>
            <Form.Group>
              <Form.Label className="fw-semibold">Notes internes</Form.Label>
              <Form.Control as="textarea" rows={2} value={form.notes} onChange={set('notes')} maxLength={1000} placeholder="Observations, informations complémentaires..." />
            </Form.Group>
          </Card.Body>
        </Card>

        <div className="d-flex justify-content-end gap-2">
          <Button variant="secondary" onClick={() => navigate('/rh/employes')}>Annuler</Button>
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? <Spinner size="sm" animation="border" className="me-1" /> : <FiSave className="me-1" />}
            {isEdit ? 'Enregistrer' : 'Créer l\'employé'}
          </Button>
        </div>
      </Form>
    </>
  );
};

export default EmployeFormPage;
