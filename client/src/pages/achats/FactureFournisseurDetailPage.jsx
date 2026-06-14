import React, { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Table from 'react-bootstrap/Table';
import Button from 'react-bootstrap/Button';
import Badge from 'react-bootstrap/Badge';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import Alert from 'react-bootstrap/Alert';
import Spinner from 'react-bootstrap/Spinner';
import {
  FiArrowLeft,
  FiEdit2,
  FiCheck,
  FiDollarSign,
  FiTrash2,
  FiAlertTriangle,
  FiLink,
} from 'react-icons/fi';
import usePageTitle from '../../hooks/usePageTitle';
import { formatMoney, formatDate } from '../../utils/formatters';
import {
  useGetFactureFournisseurQuery,
  useValiderFactureFournisseurMutation,
  useDeleteFactureFournisseurMutation,
  useEnregistrerPaiementFournisseurMutation,
} from '../../redux/api/facturesFournisseurApi';
import { useAuth } from '../../contexts/AuthContext';
import { PERM } from '../../config/permissions';

const STATUT_CONFIG = {
  brouillon:           { label: 'Brouillon',         variant: 'secondary' },
  validee:             { label: 'Validée',            variant: 'primary' },
  partiellement_payee: { label: 'Part. payée',        variant: 'warning' },
  payee:               { label: 'Payée',              variant: 'success' },
  annulee:             { label: 'Annulée',            variant: 'danger' },
};

const MODE_LABELS = {
  especes: 'Espèces', cheque: 'Chèque', virement: 'Virement',
  orange_money: 'Orange Money', wave: 'Wave', carte_bancaire: 'Carte',
};

const FactureFournisseurDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const canCreate = hasPermission(PERM.FACTURES_FOURN_CREATE);

  usePageTitle('Facture Fournisseur', [
    { label: 'Accueil', path: '/' },
    { label: 'Achats', path: '/achats/commandes' },
    { label: 'Factures fournisseurs', path: '/achats/factures-fournisseur' },
    { label: 'Détail' },
  ]);

  const { data, isLoading, error, refetch } = useGetFactureFournisseurQuery(id);
  const [valider, { isLoading: validating }] = useValiderFactureFournisseurMutation();
  const [supprimer, { isLoading: deleting }] = useDeleteFactureFournisseurMutation();
  const [enregistrerPaiement, { isLoading: paying }] = useEnregistrerPaiementFournisseurMutation();

  const [showPaiementModal, setShowPaiementModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [paiementForm, setPaiementForm] = useState({
    montant: '',
    modePaiement: 'virement',
    datePaiement: new Date().toISOString().split('T')[0],
    reference: '',
    notes: '',
  });
  const [actionError, setActionError] = useState('');

  const ff = data?.data;
  const paiements = ff?.paiements || [];

  const handleValider = async () => {
    setActionError('');
    try {
      await valider(id).unwrap();
    } catch (err) {
      setActionError(err.data?.message || 'Erreur lors de la validation');
    }
  };

  const handleDelete = async () => {
    try {
      await supprimer(id).unwrap();
      navigate('/achats/factures-fournisseur');
    } catch (err) {
      setActionError(err.data?.message || 'Erreur lors de la suppression');
      setShowDeleteModal(false);
    }
  };

  const handlePaiement = async (e) => {
    e.preventDefault();
    setActionError('');
    try {
      await enregistrerPaiement({ id, ...paiementForm, montant: Number(paiementForm.montant) }).unwrap();
      setShowPaiementModal(false);
      setPaiementForm({ montant: '', modePaiement: 'virement', datePaiement: new Date().toISOString().split('T')[0], reference: '', notes: '' });
    } catch (err) {
      setActionError(err.data?.message || 'Erreur lors du paiement');
    }
  };

  if (isLoading) return (
    <div className="text-center py-5">
      <Spinner animation="border" variant="primary" />
    </div>
  );

  if (error) return (
    <Alert variant="danger">
      <FiAlertTriangle className="me-2" />
      {error.data?.message || 'Erreur de chargement'}
      <Button variant="link" size="sm" onClick={refetch}>Réessayer</Button>
    </Alert>
  );

  if (!ff) return null;

  const cfg = STATUT_CONFIG[ff.statut] || { label: ff.statut, variant: 'secondary' };
  const restant = Math.max(0, (ff.totalTTC || 0) - (ff.montantPaye || 0));
  const pctPaye = ff.totalTTC > 0 ? Math.round((ff.montantPaye / ff.totalTTC) * 100) : 0;

  return (
    <>
      <div className="page-header">
        <div className="d-flex align-items-center gap-3">
          <Button variant="outline-secondary" size="sm" onClick={() => navigate(-1)}>
            <FiArrowLeft />
          </Button>
          <div>
            <h1 className="mb-0">{ff.numero || 'Facture fournisseur'}</h1>
            {ff.referenceFournisseur && (
              <small className="text-muted">Réf. fournisseur : {ff.referenceFournisseur}</small>
            )}
          </div>
          <Badge bg={cfg.variant} className="fs-6">{cfg.label}</Badge>
        </div>
        <div className="d-flex gap-2">
          {canCreate && ff.statut === 'brouillon' && (
            <>
              <Button
                as={Link}
                to={`/achats/factures-fournisseur/${id}/modifier`}
                variant="outline-secondary"
                size="sm"
              >
                <FiEdit2 className="me-1" /> Modifier
              </Button>
              <Button
                variant="success"
                size="sm"
                onClick={handleValider}
                disabled={validating}
              >
                {validating ? <Spinner animation="border" size="sm" className="me-1" /> : <FiCheck className="me-1" />}
                Valider
              </Button>
              <Button
                variant="outline-danger"
                size="sm"
                onClick={() => setShowDeleteModal(true)}
              >
                <FiTrash2 />
              </Button>
            </>
          )}
          {canCreate && ['validee', 'partiellement_payee'].includes(ff.statut) && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setPaiementForm((p) => ({ ...p, montant: String(restant) }));
                setShowPaiementModal(true);
              }}
            >
              <FiDollarSign className="me-1" /> Enregistrer un paiement
            </Button>
          )}
        </div>
      </div>

      {actionError && (
        <Alert variant="danger" onClose={() => setActionError('')} dismissible>
          {actionError}
        </Alert>
      )}

      <Row className="g-3">
        {/* Infos principales */}
        <Col lg={8}>
          {/* En-tête facture */}
          <Card className="shadow-sm mb-3">
            <Card.Body>
              <Row>
                <Col md={6}>
                  <h6 className="text-muted mb-1">Fournisseur</h6>
                  <div className="fw-semibold">{ff.fournisseurSnapshot?.raisonSociale || '—'}</div>
                  {ff.fournisseurSnapshot?.email && (
                    <div className="text-muted small">{ff.fournisseurSnapshot.email}</div>
                  )}
                  {ff.fournisseurSnapshot?.ninea && (
                    <div className="text-muted small">NINEA : {ff.fournisseurSnapshot.ninea}</div>
                  )}
                </Col>
                <Col md={6} className="text-md-end">
                  <div className="small text-muted">Date facture</div>
                  <div className="fw-semibold">{formatDate(ff.dateFacture)}</div>
                  {ff.dateEcheance && (
                    <>
                      <div className="small text-muted mt-2">Échéance</div>
                      <div className={`fw-semibold ${new Date(ff.dateEcheance) < new Date() && ff.statut !== 'payee' ? 'text-danger' : ''}`}>
                        {formatDate(ff.dateEcheance)}
                      </div>
                    </>
                  )}
                  {ff.commandeAchat && (
                    <div className="mt-2">
                      <Button
                        as={Link}
                        to={`/achats/commandes/${ff.commandeAchat._id || ff.commandeAchat}`}
                        variant="outline-secondary"
                        size="sm"
                      >
                        <FiLink size={12} className="me-1" />
                        Commande {ff.commandeAchat.numero || ''}
                      </Button>
                    </div>
                  )}
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Lignes */}
          <Card className="shadow-sm mb-3">
            <Card.Header className="bg-white">
              <h6 className="mb-0">Lignes de la facture</h6>
            </Card.Header>
            <Card.Body className="p-0">
              <div className="table-responsive">
                <Table className="mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Désignation</th>
                      <th className="text-end">Qté</th>
                      <th className="text-end">Prix HT</th>
                      <th className="text-end">Rem.%</th>
                      <th className="text-end">HT</th>
                      <th className="text-end">TVA</th>
                      <th className="text-end">TTC</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(ff.lignes || []).map((l, idx) => (
                      <tr key={idx}>
                        <td>
                          <div className="fw-medium small">{l.designation}</div>
                          {l.reference && <div className="text-muted" style={{ fontSize: '0.75rem' }}>{l.reference}</div>}
                        </td>
                        <td className="text-end small">{l.quantite} {l.unite}</td>
                        <td className="text-end small">{formatMoney(l.prixUnitaire)}</td>
                        <td className="text-end small">{l.remise > 0 ? `${l.remise}%` : '—'}</td>
                        <td className="text-end small">{formatMoney(l.montantHT)}</td>
                        <td className="text-end small text-muted">{formatMoney(l.montantTVA)}</td>
                        <td className="text-end fw-semibold small">{formatMoney(l.montantTTC)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="table-light">
                    <tr>
                      <th colSpan={4} className="text-end">Total HT</th>
                      <th className="text-end">{formatMoney(ff.totalHT)}</th>
                      <th className="text-end">{formatMoney(ff.totalTVA)}</th>
                      <th className="text-end">{formatMoney(ff.totalTTC)}</th>
                    </tr>
                  </tfoot>
                </Table>
              </div>
            </Card.Body>
          </Card>

          {/* Paiements reçus */}
          {paiements.length > 0 && (
            <Card className="shadow-sm">
              <Card.Header className="bg-white">
                <h6 className="mb-0">Historique des paiements</h6>
              </Card.Header>
              <Card.Body className="p-0">
                <Table hover className="mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Date</th>
                      <th>Mode</th>
                      <th>Référence</th>
                      <th className="text-end">Montant</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paiements.map((p) => (
                      <tr key={p._id}>
                        <td className="small">{formatDate(p.datePaiement)}</td>
                        <td className="small">{MODE_LABELS[p.modePaiement] || p.modePaiement}</td>
                        <td className="small text-muted">{p.referenceInterne || '—'}</td>
                        <td className="text-end fw-semibold text-success small">{formatMoney(p.montant)}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          )}
        </Col>

        {/* Récapitulatif paiement */}
        <Col lg={4}>
          <Card className="shadow-sm mb-3">
            <Card.Header className="bg-white">
              <h6 className="mb-0">Récapitulatif</h6>
            </Card.Header>
            <Card.Body>
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">Total TTC</span>
                <span className="fw-bold">{formatMoney(ff.totalTTC)}</span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">Montant payé</span>
                <span className="text-success fw-semibold">{formatMoney(ff.montantPaye)}</span>
              </div>
              <hr />
              <div className="d-flex justify-content-between mb-3">
                <span className="fw-semibold">Restant dû</span>
                <span className={`fw-bold fs-5 ${restant > 0 ? 'text-danger' : 'text-success'}`}>
                  {formatMoney(restant)}
                </span>
              </div>
              {ff.totalTTC > 0 && (
                <div>
                  <div className="d-flex justify-content-between small text-muted mb-1">
                    <span>Taux de paiement</span>
                    <span>{pctPaye}%</span>
                  </div>
                  <div className="progress" style={{ height: 6 }}>
                    <div
                      className={`progress-bar ${pctPaye >= 100 ? 'bg-success' : pctPaye >= 50 ? 'bg-warning' : 'bg-danger'}`}
                      style={{ width: `${pctPaye}%` }}
                    />
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>

          {ff.notes && (
            <Card className="shadow-sm">
              <Card.Header className="bg-white">
                <h6 className="mb-0">Notes</h6>
              </Card.Header>
              <Card.Body>
                <p className="mb-0 small text-muted">{ff.notes}</p>
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>

      {/* Modal paiement */}
      <Modal show={showPaiementModal} onHide={() => setShowPaiementModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Enregistrer un paiement</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handlePaiement}>
          <Modal.Body>
            <Alert variant="info" className="small">
              Restant dû : <strong>{formatMoney(restant)}</strong>
            </Alert>
            <Form.Group className="mb-3">
              <Form.Label>Montant *</Form.Label>
              <Form.Control
                type="number"
                min="1"
                max={restant}
                step="1"
                value={paiementForm.montant}
                onChange={(e) => setPaiementForm((p) => ({ ...p, montant: e.target.value }))}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Mode de paiement *</Form.Label>
              <Form.Select
                value={paiementForm.modePaiement}
                onChange={(e) => setPaiementForm((p) => ({ ...p, modePaiement: e.target.value }))}
                required
              >
                <option value="virement">Virement bancaire</option>
                <option value="cheque">Chèque</option>
                <option value="especes">Espèces</option>
                <option value="orange_money">Orange Money</option>
                <option value="wave">Wave</option>
                <option value="carte_bancaire">Carte bancaire</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Date *</Form.Label>
              <Form.Control
                type="date"
                value={paiementForm.datePaiement}
                onChange={(e) => setPaiementForm((p) => ({ ...p, datePaiement: e.target.value }))}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Référence</Form.Label>
              <Form.Control
                value={paiementForm.reference}
                onChange={(e) => setPaiementForm((p) => ({ ...p, reference: e.target.value }))}
                placeholder="N° virement, chèque..."
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowPaiementModal(false)}>Annuler</Button>
            <Button type="submit" variant="primary" disabled={paying}>
              {paying ? <Spinner animation="border" size="sm" className="me-1" /> : null}
              Enregistrer
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Modal suppression */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirmer la suppression</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Supprimer la facture <strong>{ff.numero}</strong> ? Cette action est irréversible.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Annuler</Button>
          <Button variant="danger" onClick={handleDelete} disabled={deleting}>
            {deleting ? <Spinner animation="border" size="sm" className="me-1" /> : null}
            Supprimer
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default FactureFournisseurDetailPage;
