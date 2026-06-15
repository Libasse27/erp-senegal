import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Spinner from 'react-bootstrap/Spinner';
import Badge from 'react-bootstrap/Badge';
import Table from 'react-bootstrap/Table';
import Modal from 'react-bootstrap/Modal';
import Alert from 'react-bootstrap/Alert';
import { FiPlus, FiCheck, FiX, FiCalendar } from 'react-icons/fi';
import { toast } from 'react-toastify';
import usePageTitle from '../../hooks/usePageTitle';
import {
  useGetCongesQuery,
  useGetEmployesQuery,
  useCreateCongeMutation,
  useUpdateCongeMutation,
  useDeleteCongeMutation,
} from '../../redux/api/rhApi';

const TYPE_LABELS = {
  conge_annuel: 'Congé annuel', maladie: 'Maladie', maternite: 'Maternité',
  paternite: 'Paternité', sans_solde: 'Sans solde', autre: 'Autre',
};

const STATUT_BADGE = {
  en_attente: { bg: 'warning', label: 'En attente' },
  approuve:   { bg: 'success', label: 'Approuvé' },
  refuse:     { bg: 'danger',  label: 'Refusé' },
  annule:     { bg: 'secondary', label: 'Annulé' },
};

const EMPTY_FORM = {
  employe: '', type: 'conge_annuel', dateDebut: '', dateFin: '', motif: '',
};

const CongesPage = () => {
  const [searchParams] = useSearchParams();

  usePageTitle('Gestion des congés', [
    { label: 'Accueil', path: '/' },
    { label: 'RH', path: '/rh' },
    { label: 'Congés' },
  ]);

  const [statut, setStatut]         = useState('');
  const [annee, setAnnee]           = useState(new Date().getFullYear());
  const [params, setParams]         = useState({ annee: new Date().getFullYear() });
  const [showModal, setShowModal]   = useState(false);
  const [approuveModal, setApprModal] = useState(null);
  const [commentaireRH, setComment] = useState('');
  const [form, setForm]             = useState(EMPTY_FORM);
  const [formError, setFormError]   = useState('');

  const { data, isLoading } = useGetCongesQuery(params);
  const { data: empData }   = useGetEmployesQuery({ statut: 'actif', limit: 200 });
  const [createConge, { isLoading: creating }] = useCreateCongeMutation();
  const [updateConge, { isLoading: updating }] = useUpdateCongeMutation();
  const [deleteConge, { isLoading: deleting }] = useDeleteCongeMutation();

  const conges   = data?.data    || [];
  const employes = empData?.data || [];

  // Pré-remplir l'employé depuis l'URL (depuis la fiche employé)
  useEffect(() => {
    const empId = searchParams.get('employe');
    if (empId) setForm((p) => ({ ...p, employe: empId }));
    if (empId) setShowModal(true);
  }, [searchParams]);

  const handleFilter = () => setParams({ annee, ...(statut ? { statut } : {}) });

  const set = (field) => (e) => setForm((p) => ({ ...p, [field]: e.target.value }));

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!form.employe || !form.type || !form.dateDebut || !form.dateFin) {
      return setFormError('Employé, type et dates sont requis.');
    }
    if (new Date(form.dateFin) < new Date(form.dateDebut)) {
      return setFormError('La date de fin doit être après la date de début.');
    }
    try {
      await createConge(form).unwrap();
      toast.success('Demande de congé créée');
      setShowModal(false);
      setForm(EMPTY_FORM);
    } catch (err) {
      setFormError(err?.data?.message || 'Erreur lors de la création');
    }
  };

  const handleStatutChange = async (statut) => {
    try {
      await updateConge({ id: approuveModal._id, statut, commentaireRH }).unwrap();
      toast.success(statut === 'approuve' ? 'Congé approuvé' : 'Congé refusé');
      setApprModal(null);
      setComment('');
    } catch {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Annuler ce congé ?')) return;
    try {
      await deleteConge(id).unwrap();
      toast.success('Congé annulé');
    } catch (err) {
      toast.error(err?.data?.message || 'Erreur');
    }
  };

  return (
    <>
      <div className="page-header mb-4">
        <div className="d-flex align-items-center justify-content-between">
          <div>
            <h1 className="mb-0">Gestion des congés</h1>
            <small className="text-muted">{data?.total || 0} demande(s)</small>
          </div>
          <Button variant="primary" onClick={() => setShowModal(true)}>
            <FiPlus className="me-1" />Nouvelle demande
          </Button>
        </div>
      </div>

      {/* Filtres */}
      <Card className="shadow-sm mb-4">
        <Card.Body>
          <Row className="g-2 align-items-end">
            <Col md={2}>
              <Form.Label className="small fw-semibold">Année</Form.Label>
              <Form.Control type="number" min={2020} max={2035} value={annee} onChange={(e) => setAnnee(Number(e.target.value))} />
            </Col>
            <Col md={2}>
              <Form.Label className="small fw-semibold">Statut</Form.Label>
              <Form.Select value={statut} onChange={(e) => setStatut(e.target.value)}>
                <option value="">Tous</option>
                <option value="en_attente">En attente</option>
                <option value="approuve">Approuvé</option>
                <option value="refuse">Refusé</option>
                <option value="annule">Annulé</option>
              </Form.Select>
            </Col>
            <Col md="auto">
              <Button variant="primary" onClick={handleFilter}>Filtrer</Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Liste */}
      <Card className="shadow-sm">
        <Card.Body className="p-0">
          {isLoading ? (
            <div className="d-flex justify-content-center py-5"><Spinner animation="border" /></div>
          ) : conges.length === 0 ? (
            <p className="text-muted text-center py-5">
              Aucune demande de congé trouvée.
            </p>
          ) : (
            <Table hover size="sm" className="mb-0 align-middle">
              <thead className="table-light">
                <tr>
                  <th>Employé</th>
                  <th>Type</th>
                  <th>Début</th>
                  <th>Fin</th>
                  <th className="text-center">Jours</th>
                  <th>Statut</th>
                  <th>Motif</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {conges.map((c) => {
                  const sb = STATUT_BADGE[c.statut] || { bg: 'secondary', label: c.statut };
                  return (
                    <tr key={c._id}>
                      <td className="fw-medium small">
                        {c.employe ? `${c.employe.prenom} ${c.employe.nom}` : '—'}
                        {c.employe?.departement && (
                          <div className="text-muted" style={{ fontSize: '0.72rem' }}>{c.employe.departement}</div>
                        )}
                      </td>
                      <td className="small">{TYPE_LABELS[c.type] || c.type}</td>
                      <td className="small">{new Date(c.dateDebut).toLocaleDateString('fr-FR')}</td>
                      <td className="small">{new Date(c.dateFin).toLocaleDateString('fr-FR')}</td>
                      <td className="text-center fw-semibold">{c.nbJours}</td>
                      <td><Badge bg={sb.bg}>{sb.label}</Badge></td>
                      <td className="small text-muted">{c.motif ? c.motif.slice(0, 40) : '—'}</td>
                      <td className="text-end">
                        <div className="d-flex gap-1 justify-content-end">
                          {c.statut === 'en_attente' && (
                            <>
                              <Button variant="link" size="sm" className="p-0 text-success" title="Approuver" onClick={() => { setApprModal(c); setComment(''); }}>
                                <FiCheck size={16} />
                              </Button>
                              <Button variant="link" size="sm" className="p-0 text-danger" title="Annuler" onClick={() => handleDelete(c._id)} disabled={deleting}>
                                <FiX size={16} />
                              </Button>
                            </>
                          )}
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

      {/* Modale création */}
      <Modal show={showModal} onHide={() => { setShowModal(false); setFormError(''); }} centered>
        <Modal.Header closeButton>
          <Modal.Title><FiCalendar className="me-2" />Nouvelle demande de congé</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {formError && <Alert variant="danger" className="mb-3">{formError}</Alert>}
          <Form id="congeForm" onSubmit={handleCreate}>
            <Row className="g-2">
              <Col md={12}>
                <Form.Label className="fw-semibold small">Employé *</Form.Label>
                <Form.Select value={form.employe} onChange={set('employe')} required>
                  <option value="">— Choisir un employé —</option>
                  {employes.map((e) => (
                    <option key={e._id} value={e._id}>{e.prenom} {e.nom} ({e.matricule})</option>
                  ))}
                </Form.Select>
              </Col>
              <Col md={12}>
                <Form.Label className="fw-semibold small">Type de congé *</Form.Label>
                <Form.Select value={form.type} onChange={set('type')}>
                  {Object.entries(TYPE_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </Form.Select>
              </Col>
              <Col md={6}>
                <Form.Label className="fw-semibold small">Date début *</Form.Label>
                <Form.Control type="date" value={form.dateDebut} onChange={set('dateDebut')} required />
              </Col>
              <Col md={6}>
                <Form.Label className="fw-semibold small">Date fin *</Form.Label>
                <Form.Control type="date" value={form.dateFin} onChange={set('dateFin')} required />
              </Col>
              <Col md={12}>
                <Form.Label className="fw-semibold small">Motif</Form.Label>
                <Form.Control as="textarea" rows={2} value={form.motif} onChange={set('motif')} placeholder="Précisez le motif (optionnel)..." maxLength={500} />
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Annuler</Button>
          <Button type="submit" form="congeForm" variant="primary" disabled={creating}>
            {creating ? <Spinner size="sm" animation="border" /> : 'Soumettre la demande'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modale approbation */}
      <Modal show={!!approuveModal} onHide={() => setApprModal(null)} centered size="sm">
        <Modal.Header closeButton>
          <Modal.Title>Traiter la demande</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {approuveModal && (
            <p className="small mb-2">
              Congé de <strong>{approuveModal.employe?.prenom} {approuveModal.employe?.nom}</strong>
              {' '}— {approuveModal.nbJours} jour(s) — {TYPE_LABELS[approuveModal.type]}
            </p>
          )}
          <Form.Label className="small fw-semibold">Commentaire RH (optionnel)</Form.Label>
          <Form.Control
            as="textarea" rows={2} value={commentaireRH}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Raison de l'approbation ou du refus..."
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="danger" size="sm" onClick={() => handleStatutChange('refuse')} disabled={updating}>
            {updating ? <Spinner size="sm" animation="border" /> : <><FiX className="me-1" />Refuser</>}
          </Button>
          <Button variant="success" size="sm" onClick={() => handleStatutChange('approuve')} disabled={updating}>
            {updating ? <Spinner size="sm" animation="border" /> : <><FiCheck className="me-1" />Approuver</>}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default CongesPage;
