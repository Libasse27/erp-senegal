import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Table from 'react-bootstrap/Table';
import Button from 'react-bootstrap/Button';
import Badge from 'react-bootstrap/Badge';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import Spinner from 'react-bootstrap/Spinner';
import Tabs from 'react-bootstrap/Tabs';
import Tab from 'react-bootstrap/Tab';
import {
  FiAlertCircle,
  FiSend,
  FiDollarSign,
  FiUsers,
  FiFileText,
  FiRefreshCw,
  FiEye,
  FiCheck,
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import usePageTitle from '../../../hooks/usePageTitle';
import { formatMoney, formatDate } from '../../../utils/formatters';
import {
  useGetCreancesEnRetardQuery,
  useGetStatsRelancesQuery,
  useGetRelancesQuery,
  useCreateRelanceMutation,
  useAcquitterRelanceMutation,
} from '../../../redux/api/relancesApi';
import { useAuth } from '../../../contexts/AuthContext';
import { PERM } from '../../../config/permissions';

const NIVEAU_CFG = {
  1: { label: '1ère relance', variant: 'info' },
  2: { label: '2ème relance', variant: 'warning' },
  3: { label: '3ème relance', variant: 'danger' },
};

const STATUT_CFG = {
  brouillon:  { label: 'Brouillon',  variant: 'secondary' },
  envoyee:    { label: 'Envoyée',    variant: 'primary' },
  acquittee:  { label: 'Acquittée', variant: 'success' },
  annulee:    { label: 'Annulée',   variant: 'danger' },
};

const AgingCell = ({ value }) => (
  <td className="text-end small">
    {value > 0 ? <span className="text-warning fw-semibold">{formatMoney(value)}</span> : <span className="text-muted">—</span>}
  </td>
);

const RecouvrementPage = () => {
  usePageTitle('Recouvrement', [
    { label: 'Accueil', path: '/' },
    { label: 'Ventes' },
    { label: 'Recouvrement' },
  ]);

  const { hasPermission } = useAuth();
  const canCreate = hasPermission(PERM.FACTURES_CREATE);

  const [relanceModal, setRelanceModal] = useState(null); // { client, factures }
  const [relanceForm, setRelanceForm] = useState({ niveau: 1, mode: 'email', notes: '', dateEcheanceRelance: '', selectedFactures: [] });
  const [acquitterModal, setAcquitterModal] = useState(null);

  const { data: retardsData, isLoading: loadingRetards, refetch: refetchRetards, isFetching } = useGetCreancesEnRetardQuery();
  const { data: statsData } = useGetStatsRelancesQuery();
  const { data: relancesData, isLoading: loadingRelances } = useGetRelancesQuery({ limit: 50, sort: '-dateRelance' });

  const [createRelance, { isLoading: creating }] = useCreateRelanceMutation();
  const [acquitter, { isLoading: acquitting }] = useAcquitterRelanceMutation();

  const retards = retardsData?.data || [];
  const summary = retardsData?.summary || {};
  const stats = statsData?.data || {};
  const relances = relancesData?.data || [];

  const openRelanceModal = (row) => {
    setRelanceModal(row);
    setRelanceForm({
      niveau: 1,
      mode: 'email',
      notes: '',
      dateEcheanceRelance: '',
      selectedFactures: row.factures.map((f) => f._id),
    });
  };

  const handleCreateRelance = async () => {
    if (relanceForm.selectedFactures.length === 0) {
      toast.warning('Sélectionnez au moins une facture');
      return;
    }
    try {
      const res = await createRelance({
        clientId: relanceModal.client._id,
        factureIds: relanceForm.selectedFactures,
        niveau: relanceForm.niveau,
        mode: relanceForm.mode,
        notes: relanceForm.notes,
        dateEcheanceRelance: relanceForm.dateEcheanceRelance || undefined,
      }).unwrap();
      toast.success(`Relance ${res.data.reference} créée`);
      setRelanceModal(null);
    } catch (err) {
      toast.error(err.data?.message || 'Erreur');
    }
  };

  const handleAcquitter = async () => {
    try {
      await acquitter({ id: acquitterModal._id }).unwrap();
      toast.success('Relance acquittée');
      setAcquitterModal(null);
    } catch (err) {
      toast.error(err.data?.message || 'Erreur');
    }
  };

  return (
    <>
      <div className="page-header">
        <div className="d-flex align-items-center gap-2">
          <FiAlertCircle size={22} className="text-warning" />
          <h1 className="mb-0">Recouvrement clients</h1>
        </div>
        <Button variant="outline-secondary" size="sm" onClick={refetchRetards} disabled={isFetching}>
          {isFetching ? <Spinner animation="border" size="sm" /> : <FiRefreshCw size={14} />}
          <span className="ms-1 d-none d-md-inline">Actualiser</span>
        </Button>
      </div>

      {/* KPIs */}
      <Row className="g-3 mb-3">
        {[
          { label: 'Clients en retard',     value: summary.nbClients || 0,    icon: FiUsers,       color: '#dc3545', fmt: false },
          { label: 'Factures en retard',    value: summary.nbFactures || 0,   icon: FiFileText,    color: '#fd7e14', fmt: false },
          { label: 'Total créances dues',   value: summary.totalDu || 0,      icon: FiDollarSign,  color: '#6f42c1', fmt: true },
          { label: 'Relances en attente',   value: stats.envoyees || 0,       icon: FiSend,        color: '#0dcaf0', fmt: false },
        ].map(({ label, value, icon: Icon, color, fmt }) => (
          <Col key={label} sm={6} xl={3}>
            <Card className="shadow-sm border-0 h-100">
              <Card.Body className="d-flex align-items-center gap-3">
                <div style={{ width: 44, height: 44, borderRadius: 12, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={22} style={{ color }} />
                </div>
                <div className="overflow-hidden">
                  <div className="fw-bold fs-4" style={{ color, lineHeight: 1 }}>
                    {fmt ? formatMoney(value) : value}
                  </div>
                  <div className="text-muted small text-truncate">{label}</div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      <Tabs defaultActiveKey="retards" className="mb-3">
        {/* Onglet — Créances en retard */}
        <Tab eventKey="retards" title={<span><FiAlertCircle className="me-1" />Créances en retard {retards.length > 0 && <Badge bg="danger" pill>{retards.length}</Badge>}</span>}>
          <Card className="shadow-sm">
            <Card.Body className="p-0">
              {loadingRetards ? (
                <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
              ) : retards.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <FiCheck size={40} className="mb-2 text-success" />
                  <p className="mb-0 fw-semibold">Aucune créance en retard</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <Table hover className="mb-0" style={{ fontSize: '0.875rem' }}>
                    <thead className="table-light">
                      <tr>
                        <th>Client</th>
                        <th className="text-center">Factures</th>
                        <th className="text-end">1–30 j</th>
                        <th className="text-end">31–60 j</th>
                        <th className="text-end">61–90 j</th>
                        <th className="text-end">&gt; 90 j</th>
                        <th className="text-end fw-semibold">Total dû</th>
                        <th className="text-center">Retard max</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {retards.map((row) => {
                        const joursMax = row.joursMaxRetard;
                        const dangerLevel = joursMax > 90 ? 'danger' : joursMax > 60 ? 'warning' : joursMax > 30 ? 'info' : 'secondary';
                        return (
                          <tr key={row.client._id}>
                            <td>
                              <div className="fw-medium">{row.client.name}</div>
                              {row.client.email && <small className="text-muted">{row.client.email}</small>}
                            </td>
                            <td className="text-center">
                              <Badge bg="light" text="dark" pill>{row.nbFactures}</Badge>
                            </td>
                            <AgingCell value={row.aging?.['1_30'] || 0} />
                            <AgingCell value={row.aging?.['31_60'] || 0} />
                            <AgingCell value={row.aging?.['61_90'] || 0} />
                            <td className="text-end small">
                              {row.aging?.sup90 > 0
                                ? <span className="text-danger fw-bold">{formatMoney(row.aging.sup90)}</span>
                                : <span className="text-muted">—</span>}
                            </td>
                            <td className="text-end fw-bold text-danger">{formatMoney(row.totalDu)}</td>
                            <td className="text-center">
                              <Badge bg={dangerLevel}>{joursMax} j</Badge>
                            </td>
                            <td className="text-end">
                              {canCreate && (
                                <Button
                                  variant="outline-warning"
                                  size="sm"
                                  onClick={() => openRelanceModal(row)}
                                  className="d-flex align-items-center gap-1"
                                >
                                  <FiSend size={12} /> Relancer
                                </Button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="table-light fw-semibold">
                      <tr>
                        <td>TOTAL</td>
                        <td className="text-center">{summary.nbFactures || 0}</td>
                        <td className="text-end small text-warning">{formatMoney(summary.aging?.['1_30'] || 0)}</td>
                        <td className="text-end small text-warning">{formatMoney(summary.aging?.['31_60'] || 0)}</td>
                        <td className="text-end small text-warning">{formatMoney(summary.aging?.['61_90'] || 0)}</td>
                        <td className="text-end small text-danger">{formatMoney(summary.aging?.sup90 || 0)}</td>
                        <td className="text-end text-danger">{formatMoney(summary.totalDu || 0)}</td>
                        <td colSpan={2}></td>
                      </tr>
                    </tfoot>
                  </Table>
                </div>
              )}
            </Card.Body>
          </Card>
        </Tab>

        {/* Onglet — Historique relances */}
        <Tab eventKey="historique" title={<span><FiSend className="me-1" />Historique relances</span>}>
          <Card className="shadow-sm">
            <Card.Body className="p-0">
              {loadingRelances ? (
                <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
              ) : relances.length === 0 ? (
                <div className="text-center py-5 text-muted">Aucune relance enregistrée</div>
              ) : (
                <div className="table-responsive">
                  <Table hover className="mb-0" style={{ fontSize: '0.875rem' }}>
                    <thead className="table-light">
                      <tr>
                        <th>Référence</th>
                        <th>Client</th>
                        <th className="text-center">Niveau</th>
                        <th className="text-center">Mode</th>
                        <th className="text-end">Montant dû</th>
                        <th>Date relance</th>
                        <th className="text-center">Statut</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {relances.map((r) => {
                        const niv = NIVEAU_CFG[r.niveau] || NIVEAU_CFG[1];
                        const stat = STATUT_CFG[r.statut] || STATUT_CFG.brouillon;
                        return (
                          <tr key={r._id}>
                            <td className="fw-medium small">{r.reference}</td>
                            <td className="small">{r.clientSnapshot?.name || r.client?.name || '—'}</td>
                            <td className="text-center">
                              <Badge bg={niv.variant} style={{ fontSize: '0.7rem' }}>{niv.label}</Badge>
                            </td>
                            <td className="text-center small text-muted text-capitalize">{r.mode}</td>
                            <td className="text-end fw-semibold small">{formatMoney(r.montantTotalDu)}</td>
                            <td className="small text-muted">{formatDate(r.dateRelance)}</td>
                            <td className="text-center">
                              <Badge bg={stat.variant} style={{ fontSize: '0.7rem' }}>{stat.label}</Badge>
                            </td>
                            <td className="text-end">
                              <div className="d-flex gap-1 justify-content-end">
                                <Button as={Link} to={`/ventes/relances/${r._id}`} variant="outline-primary" size="sm">
                                  <FiEye size={13} />
                                </Button>
                                {r.statut === 'envoyee' && canCreate && (
                                  <Button
                                    variant="outline-success"
                                    size="sm"
                                    title="Marquer acquittée"
                                    onClick={() => setAcquitterModal(r)}
                                  >
                                    <FiCheck size={13} />
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                </div>
              )}
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>

      {/* Modal — Créer relance */}
      <Modal show={!!relanceModal} onHide={() => setRelanceModal(null)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <FiSend className="me-2 text-warning" />
            Relance — {relanceModal?.client?.name}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {relanceModal && (
            <>
              <Row className="g-3 mb-3">
                <Col md={4}>
                  <Form.Group>
                    <Form.Label className="small fw-semibold">Niveau de relance</Form.Label>
                    <Form.Select
                      value={relanceForm.niveau}
                      onChange={(e) => setRelanceForm((p) => ({ ...p, niveau: Number(e.target.value) }))}
                    >
                      <option value={1}>1ère relance (amiable)</option>
                      <option value={2}>2ème relance (formelle)</option>
                      <option value={3}>3ème relance (pré-contentieux)</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label className="small fw-semibold">Mode d'envoi</Form.Label>
                    <Form.Select
                      value={relanceForm.mode}
                      onChange={(e) => setRelanceForm((p) => ({ ...p, mode: e.target.value }))}
                    >
                      <option value="email">Email</option>
                      <option value="telephone">Téléphone</option>
                      <option value="courrier">Courrier</option>
                      <option value="sms">SMS</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label className="small fw-semibold">Délai de réponse</Form.Label>
                    <Form.Control
                      type="date"
                      value={relanceForm.dateEcheanceRelance}
                      onChange={(e) => setRelanceForm((p) => ({ ...p, dateEcheanceRelance: e.target.value }))}
                    />
                  </Form.Group>
                </Col>
              </Row>

              {/* Factures sélectionnables */}
              <div className="mb-3">
                <div className="small fw-semibold mb-2">
                  Factures en retard à inclure ({relanceForm.selectedFactures.length}/{relanceModal.factures.length})
                </div>
                <div className="table-responsive border rounded">
                  <Table size="sm" className="mb-0" style={{ fontSize: '0.8rem' }}>
                    <thead className="table-light">
                      <tr>
                        <th style={{ width: 32 }}></th>
                        <th>N° Facture</th>
                        <th>Date</th>
                        <th>Échéance</th>
                        <th className="text-end">Retard</th>
                        <th className="text-end">Montant dû</th>
                      </tr>
                    </thead>
                    <tbody>
                      {relanceModal.factures.map((f) => {
                        const selected = relanceForm.selectedFactures.includes(f._id);
                        const toggleFact = () => setRelanceForm((p) => ({
                          ...p,
                          selectedFactures: selected
                            ? p.selectedFactures.filter((id) => id !== f._id)
                            : [...p.selectedFactures, f._id],
                        }));
                        return (
                          <tr key={f._id} className={selected ? 'table-warning' : ''} style={{ cursor: 'pointer' }} onClick={toggleFact}>
                            <td><Form.Check type="checkbox" checked={selected} onChange={() => {}} onClick={(e) => e.stopPropagation()} /></td>
                            <td className="fw-medium">{f.numero || f.referenceInterne || '—'}</td>
                            <td>{formatDate(f.dateFacture)}</td>
                            <td className="text-danger">{formatDate(f.dateEcheance)}</td>
                            <td className="text-end"><Badge bg="danger">{f.joursRetard} j</Badge></td>
                            <td className="text-end fw-semibold">{formatMoney(f.montantDu)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="table-light fw-semibold">
                      <tr>
                        <td colSpan={5} className="text-end">Total sélectionné :</td>
                        <td className="text-end">
                          {formatMoney(
                            relanceModal.factures
                              .filter((f) => relanceForm.selectedFactures.includes(f._id))
                              .reduce((s, f) => s + f.montantDu, 0)
                          )}
                        </td>
                      </tr>
                    </tfoot>
                  </Table>
                </div>
              </div>

              <Form.Group>
                <Form.Label className="small fw-semibold">Notes internes</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  value={relanceForm.notes}
                  onChange={(e) => setRelanceForm((p) => ({ ...p, notes: e.target.value }))}
                  placeholder="Contexte, accord verbal, etc."
                />
              </Form.Group>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setRelanceModal(null)}>Annuler</Button>
          <Button variant="warning" onClick={handleCreateRelance} disabled={creating}>
            {creating ? <Spinner animation="border" size="sm" className="me-1" /> : <FiSend className="me-1" />}
            Enregistrer la relance
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal — Acquitter */}
      <Modal show={!!acquitterModal} onHide={() => setAcquitterModal(null)} size="sm">
        <Modal.Header closeButton><Modal.Title>Acquitter la relance</Modal.Title></Modal.Header>
        <Modal.Body>
          Marquer la relance <strong>{acquitterModal?.reference}</strong> comme acquittée (client a répondu / payé) ?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setAcquitterModal(null)}>Retour</Button>
          <Button variant="success" onClick={handleAcquitter} disabled={acquitting}>
            {acquitting ? <Spinner animation="border" size="sm" className="me-1" /> : <FiCheck className="me-1" />}
            Acquitter
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default RecouvrementPage;
