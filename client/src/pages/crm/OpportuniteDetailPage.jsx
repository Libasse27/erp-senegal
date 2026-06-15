import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Badge from 'react-bootstrap/Badge';
import Spinner from 'react-bootstrap/Spinner';
import Modal from 'react-bootstrap/Modal';
import Alert from 'react-bootstrap/Alert';
import { FiArrowLeft, FiEdit2, FiFileText, FiPlus, FiTrash2, FiCheck } from 'react-icons/fi';
import { toast } from 'react-toastify';
import usePageTitle from '../../hooks/usePageTitle';
import { formatMoney } from '../../utils/formatters';
import {
  useGetOpportuniteQuery,
  useUpdateOpportuniteMutation,
  useDeleteOpportuniteMutation,
  useConvertirEnDevisMutation,
  useCreateActiviteMutation,
  useUpdateActiviteMutation,
  useDeleteActiviteMutation,
} from '../../redux/api/crmApi';

const ETAPES = [
  { key: 'prospect',      label: 'Prospect',      color: '#6b7280' },
  { key: 'qualification', label: 'Qualification', color: '#2563eb' },
  { key: 'proposition',   label: 'Proposition',   color: '#7c3aed' },
  { key: 'negociation',   label: 'Négociation',   color: '#d97706' },
  { key: 'gagne',         label: 'Gagné',         color: '#059669' },
  { key: 'perdu',         label: 'Perdu',         color: '#dc2626' },
];

const TYPE_ACTIVITE = {
  appel: '📞', email: '📧', reunion: '🤝', demonstration: '🖥️', relance: '🔔', autre: '📌',
};

const STATUT_ACT = { planifie: 'warning', realise: 'success', annule: 'secondary' };

const EMPTY_ACT = {
  type: 'appel', titre: '', dateActivite: new Date().toISOString().slice(0, 16),
  dureeMinutes: 30, statut: 'planifie', description: '', resultat: '',
};

const OpportuniteDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [showActModal, setShowActModal] = useState(false);
  const [actForm, setActForm]           = useState(EMPTY_ACT);
  const [editActId, setEditActId]       = useState(null);

  const { data, isLoading, refetch } = useGetOpportuniteQuery(id);
  const [updateOpp]    = useUpdateOpportuniteMutation();
  const [deleteOpp, { isLoading: deleting }] = useDeleteOpportuniteMutation();
  const [convertir, { isLoading: converting }] = useConvertirEnDevisMutation();
  const [createAct, { isLoading: creatingAct }] = useCreateActiviteMutation();
  const [updateAct, { isLoading: updatingAct }] = useUpdateActiviteMutation();
  const [deleteAct] = useDeleteActiviteMutation();

  const opp       = data?.data;
  const activites = opp?.activites || [];

  usePageTitle(opp?.titre || 'Opportunité', [
    { label: 'Accueil', path: '/' },
    { label: 'CRM', path: '/crm' },
    { label: opp?.titre || '...' },
  ]);

  if (isLoading) return <div className="d-flex justify-content-center py-5"><Spinner animation="border" /></div>;
  if (!opp)      return <Alert variant="danger">Opportunité non trouvée.</Alert>;

  const etape = ETAPES.find((e) => e.key === opp.etape) || ETAPES[0];

  const handleDelete = async () => {
    if (!window.confirm('Archiver cette opportunité ?')) return;
    await deleteOpp(id).unwrap();
    toast.success('Opportunité archivée');
    navigate('/crm');
  };

  const handleConvertir = async () => {
    try {
      const res = await convertir(id).unwrap();
      toast.success('Devis créé');
      navigate(`/ventes/devis/${res.data._id}`);
    } catch (err) {
      toast.error(err?.data?.message || 'Erreur lors de la conversion');
    }
  };

  const setAct = (field) => (e) => setActForm((p) => ({ ...p, [field]: e.target.value }));

  const openNewAct = () => {
    setActForm({ ...EMPTY_ACT, dateActivite: new Date().toISOString().slice(0, 16) });
    setEditActId(null);
    setShowActModal(true);
  };

  const openEditAct = (act) => {
    setActForm({
      type:          act.type,
      titre:         act.titre,
      dateActivite:  act.dateActivite ? act.dateActivite.slice(0, 16) : '',
      dureeMinutes:  act.dureeMinutes,
      statut:        act.statut,
      description:   act.description || '',
      resultat:      act.resultat    || '',
    });
    setEditActId(act._id);
    setShowActModal(true);
  };

  const handleSaveAct = async (e) => {
    e.preventDefault();
    const payload = { ...actForm, opportunite: id, dureeMinutes: Number(actForm.dureeMinutes) };
    try {
      if (editActId) {
        await updateAct({ id: editActId, ...payload }).unwrap();
        toast.success('Activité mise à jour');
      } else {
        await createAct(payload).unwrap();
        toast.success('Activité ajoutée');
      }
      setShowActModal(false);
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || 'Erreur');
    }
  };

  const handleDeleteAct = async (actId) => {
    if (!window.confirm('Supprimer cette activité ?')) return;
    await deleteAct(actId).unwrap();
    refetch();
    toast.success('Activité supprimée');
  };

  const handleRealiserAct = async (act) => {
    await updateAct({ id: act._id, statut: 'realise' }).unwrap();
    refetch();
    toast.success('Activité marquée réalisée');
  };

  return (
    <>
      <div className="page-header mb-4">
        <div className="d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-3">
            <Button variant="outline-secondary" size="sm" onClick={() => navigate('/crm')}>
              <FiArrowLeft />
            </Button>
            <div>
              <div className="d-flex align-items-center gap-2">
                <h1 className="mb-0">{opp.titre}</h1>
                <Badge style={{ backgroundColor: etape.color }}>{etape.label}</Badge>
              </div>
              <small className="text-muted font-monospace">{opp.reference}</small>
            </div>
          </div>
          <div className="d-flex gap-2">
            {!opp.devisId && opp.client && (
              <Button variant="outline-success" size="sm" onClick={handleConvertir} disabled={converting}>
                {converting ? <Spinner size="sm" animation="border" /> : <><FiFileText className="me-1" />Convertir en devis</>}
              </Button>
            )}
            {opp.devisId && (
              <Link to={`/ventes/devis/${opp.devisId._id}`} className="btn btn-outline-success btn-sm">
                <FiFileText className="me-1" />Voir le devis
              </Link>
            )}
            <Link to={`/crm/opportunites/${id}/modifier`} className="btn btn-outline-primary btn-sm">
              <FiEdit2 className="me-1" />Modifier
            </Link>
            <Button variant="outline-danger" size="sm" onClick={handleDelete} disabled={deleting}>
              Archiver
            </Button>
          </div>
        </div>
      </div>

      <Row className="g-3">
        {/* Infos principales */}
        <Col lg={4}>
          <Card className="shadow-sm mb-3">
            <Card.Header><strong>Détails</strong></Card.Header>
            <Card.Body>
              {[
                ['Client',     opp.client ? <Link key="cl" to={`/clients/${opp.client._id}`}>{opp.client.nom}</Link> : '—'],
                ['Responsable',opp.responsable ? `${opp.responsable.firstName} ${opp.responsable.lastName}` : '—'],
                ['Montant estimé', formatMoney(opp.montantEstime)],
                ['Probabilité', <Badge key="proba" bg="secondary">{opp.probabilite}%</Badge>],
                ['Échéance',   opp.dateEcheance ? new Date(opp.dateEcheance).toLocaleDateString('fr-FR') : '—'],
                ['Source',     opp.sourceContact],
                ['Devis lié',  opp.devisId ? <Link key="dv" to={`/ventes/devis/${opp.devisId._id}`}>{opp.devisId.numero}</Link> : '—'],
              ].map(([label, val]) => (
                <div key={label} className="d-flex justify-content-between small py-1 border-bottom align-items-center">
                  <span className="text-muted">{label}</span>
                  <span className="fw-medium text-end">{val}</span>
                </div>
              ))}
            </Card.Body>
          </Card>

          {/* Changer étape */}
          <Card className="shadow-sm mb-3">
            <Card.Header><strong>Avancement</strong></Card.Header>
            <Card.Body>
              <div className="d-flex flex-column gap-1">
                {ETAPES.map((e) => (
                  <Button
                    key={e.key}
                    size="sm"
                    variant={opp.etape === e.key ? 'primary' : 'outline-secondary'}
                    style={opp.etape === e.key ? { backgroundColor: e.color, borderColor: e.color } : {}}
                    onClick={() => updateOpp({ id, etape: e.key }).then(() => refetch())}
                    className="text-start"
                  >
                    {e.label}
                  </Button>
                ))}
              </div>
            </Card.Body>
          </Card>

          {opp.description && (
            <Card className="shadow-sm">
              <Card.Header><strong>Description</strong></Card.Header>
              <Card.Body><p className="small mb-0">{opp.description}</p></Card.Body>
            </Card>
          )}
        </Col>

        {/* Activités */}
        <Col lg={8}>
          <Card className="shadow-sm">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <strong>Activités ({activites.length})</strong>
              <Button variant="outline-primary" size="sm" onClick={openNewAct}>
                <FiPlus className="me-1" size={14} />Ajouter
              </Button>
            </Card.Header>
            <Card.Body className="p-0">
              {activites.length === 0 ? (
                <p className="text-muted text-center py-4 small">Aucune activité enregistrée.</p>
              ) : (
                <div className="list-group list-group-flush">
                  {activites.map((act) => (
                    <div key={act._id} className="list-group-item d-flex align-items-start gap-3 py-2">
                      <span style={{ fontSize: '1.2rem' }}>{TYPE_ACTIVITE[act.type] || '📌'}</span>
                      <div className="flex-grow-1">
                        <div className="d-flex justify-content-between align-items-start">
                          <span className="fw-semibold small">{act.titre}</span>
                          <Badge bg={STATUT_ACT[act.statut] || 'secondary'} className="ms-2" style={{ fontSize: '0.65rem' }}>
                            {act.statut}
                          </Badge>
                        </div>
                        <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                          {new Date(act.dateActivite).toLocaleString('fr-FR')}
                          {act.dureeMinutes > 0 && ` · ${act.dureeMinutes} min`}
                          {act.responsable && ` · ${act.responsable.firstName}`}
                        </div>
                        {act.resultat && <p className="small mb-0 mt-1 text-success">{act.resultat}</p>}
                        {act.description && <p className="small mb-0 text-muted">{act.description}</p>}
                      </div>
                      <div className="d-flex gap-1 flex-shrink-0">
                        {act.statut === 'planifie' && (
                          <Button variant="link" size="sm" className="p-0 text-success" onClick={() => handleRealiserAct(act)}>
                            <FiCheck size={14} />
                          </Button>
                        )}
                        <Button variant="link" size="sm" className="p-0 text-primary" onClick={() => openEditAct(act)}>
                          <FiEdit2 size={13} />
                        </Button>
                        <Button variant="link" size="sm" className="p-0 text-danger" onClick={() => handleDeleteAct(act._id)}>
                          <FiTrash2 size={13} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>

          {opp.notes && (
            <Card className="shadow-sm mt-3">
              <Card.Header><strong>Notes internes</strong></Card.Header>
              <Card.Body><p className="small mb-0">{opp.notes}</p></Card.Body>
            </Card>
          )}
        </Col>
      </Row>

      {/* Modale activité */}
      <Modal show={showActModal} onHide={() => setShowActModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{editActId ? 'Modifier l\'activité' : 'Nouvelle activité'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form id="actForm" onSubmit={handleSaveAct}>
            <Row className="g-2">
              <Col md={6}>
                <Form.Label className="small fw-semibold">Type *</Form.Label>
                <Form.Select value={actForm.type} onChange={setAct('type')}>
                  {Object.entries(TYPE_ACTIVITE).map(([v, icon]) => (
                    <option key={v} value={v}>{icon} {v.charAt(0).toUpperCase() + v.slice(1)}</option>
                  ))}
                </Form.Select>
              </Col>
              <Col md={6}>
                <Form.Label className="small fw-semibold">Statut</Form.Label>
                <Form.Select value={actForm.statut} onChange={setAct('statut')}>
                  <option value="planifie">Planifié</option>
                  <option value="realise">Réalisé</option>
                  <option value="annule">Annulé</option>
                </Form.Select>
              </Col>
              <Col md={12}>
                <Form.Label className="small fw-semibold">Titre *</Form.Label>
                <Form.Control value={actForm.titre} onChange={setAct('titre')} required maxLength={200} />
              </Col>
              <Col md={8}>
                <Form.Label className="small fw-semibold">Date & heure *</Form.Label>
                <Form.Control type="datetime-local" value={actForm.dateActivite} onChange={setAct('dateActivite')} required />
              </Col>
              <Col md={4}>
                <Form.Label className="small fw-semibold">Durée (min)</Form.Label>
                <Form.Control type="number" min={0} value={actForm.dureeMinutes} onChange={setAct('dureeMinutes')} />
              </Col>
              <Col md={12}>
                <Form.Label className="small fw-semibold">Description</Form.Label>
                <Form.Control as="textarea" rows={2} value={actForm.description} onChange={setAct('description')} maxLength={1000} />
              </Col>
              <Col md={12}>
                <Form.Label className="small fw-semibold">Résultat</Form.Label>
                <Form.Control as="textarea" rows={2} value={actForm.resultat} onChange={setAct('resultat')} placeholder="Outcome, décision prise..." maxLength={1000} />
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowActModal(false)}>Annuler</Button>
          <Button type="submit" form="actForm" variant="primary" disabled={creatingAct || updatingAct}>
            {(creatingAct || updatingAct) ? <Spinner size="sm" animation="border" /> : 'Enregistrer'}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default OpportuniteDetailPage;
