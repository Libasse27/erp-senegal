import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Card from 'react-bootstrap/Card';
import Table from 'react-bootstrap/Table';
import Button from 'react-bootstrap/Button';
import Badge from 'react-bootstrap/Badge';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import {
  FiPlus,
  FiEye,
  FiPackage,
  FiAlertTriangle,
  FiCheckCircle,
  FiClock,
} from 'react-icons/fi';
import usePageTitle from '../../hooks/usePageTitle';
import { formatDate, formatMoney } from '../../utils/formatters';
import {
  useGetInventairesQuery,
  useCreateInventaireMutation,
} from '../../redux/api/inventairesApi';
import { useGetWarehousesQuery } from '../../redux/api/stocksApi';
import { useAuth } from '../../contexts/AuthContext';
import { PERM } from '../../config/permissions';

const STATUT_CONFIG = {
  brouillon: { label: 'Brouillon', variant: 'secondary', icon: FiClock },
  en_cours:  { label: 'En cours',  variant: 'warning',   icon: FiClock },
  valide:    { label: 'Validé',    variant: 'success',   icon: FiCheckCircle },
  annule:    { label: 'Annulé',    variant: 'danger',    icon: FiAlertTriangle },
};

const InventairesListPage = () => {
  usePageTitle('Inventaires physiques', [
    { label: 'Accueil', path: '/' },
    { label: 'Stocks', path: '/stocks' },
    { label: 'Inventaires' },
  ]);

  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const canCreate = hasPermission(PERM.STOCKS_UPDATE);

  const [filters, setFilters] = useState({ statut: '', page: 1, limit: 20 });
  const [showModal, setShowModal] = useState(false);
  const [newForm, setNewForm] = useState({ warehouseId: '', dateInventaire: new Date().toISOString().split('T')[0], description: '' });
  const [createError, setCreateError] = useState('');

  const { data, isLoading, error } = useGetInventairesQuery(filters);
  const { data: warehousesData } = useGetWarehousesQuery({ limit: 50 });
  const [create, { isLoading: creating }] = useCreateInventaireMutation();

  const inventaires = data?.data || [];
  const meta = data?.meta || {};
  const warehouses = warehousesData?.data || [];

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreateError('');
    try {
      const res = await create({
        warehouseId: newForm.warehouseId || undefined,
        dateInventaire: newForm.dateInventaire,
        description: newForm.description,
      }).unwrap();
      setShowModal(false);
      navigate(`/stocks/inventaires/${res.data._id}`);
    } catch (err) {
      setCreateError(err.data?.message || 'Erreur lors de la création');
    }
  };

  return (
    <>
      <div className="page-header">
        <div className="d-flex align-items-center gap-2">
          <FiPackage size={22} className="text-primary" />
          <h1 className="mb-0">Inventaires physiques</h1>
        </div>
        {canCreate && (
          <Button variant="primary" size="sm" onClick={() => setShowModal(true)}>
            <FiPlus className="me-1" /> Nouvel inventaire
          </Button>
        )}
      </div>

      {/* Filtre statut */}
      <Card className="shadow-sm mb-3">
        <Card.Body className="py-2">
          <div className="d-flex gap-2 flex-wrap align-items-center">
            <span className="text-muted small me-1">Statut :</span>
            {['', 'brouillon', 'en_cours', 'valide', 'annule'].map((s) => (
              <Button
                key={s}
                size="sm"
                variant={filters.statut === s ? 'primary' : 'outline-secondary'}
                onClick={() => setFilters((p) => ({ ...p, statut: s, page: 1 }))}
              >
                {s === '' ? 'Tous' : STATUT_CONFIG[s]?.label}
              </Button>
            ))}
          </div>
        </Card.Body>
      </Card>

      {/* Tableau */}
      <Card className="shadow-sm">
        <Card.Body className="p-0">
          {isLoading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
            </div>
          ) : error ? (
            <Alert variant="danger" className="m-3">
              <FiAlertTriangle className="me-2" />
              {error.data?.message || error.message}
            </Alert>
          ) : inventaires.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <FiPackage size={44} className="mb-3" />
              <p className="mb-1">Aucun inventaire enregistré</p>
              {canCreate && (
                <Button variant="primary" size="sm" onClick={() => setShowModal(true)}>
                  <FiPlus className="me-1" /> Créer le premier inventaire
                </Button>
              )}
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover className="mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Référence</th>
                    <th>Date</th>
                    <th>Dépôt</th>
                    <th className="text-center">Lignes</th>
                    <th className="text-center">Comptées</th>
                    <th className="text-center">Avec écart</th>
                    <th className="text-end">Valeur écart +</th>
                    <th className="text-end">Valeur écart −</th>
                    <th className="text-center">Statut</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {inventaires.map((inv) => {
                    const cfg = STATUT_CONFIG[inv.statut] || { label: inv.statut, variant: 'secondary' };
                    return (
                      <tr key={inv._id}>
                        <td className="fw-medium small">{inv.reference}</td>
                        <td className="small">{formatDate(inv.dateInventaire)}</td>
                        <td className="small text-muted">
                          {inv.warehouse?.name || 'Tous dépôts'}
                        </td>
                        <td className="text-center small">{inv.nbLignes || inv.lignes?.length || 0}</td>
                        <td className="text-center small">{inv.nbLignesComptees || 0}</td>
                        <td className="text-center small">
                          {inv.nbLignesAvecEcart > 0 ? (
                            <Badge bg="warning" text="dark">{inv.nbLignesAvecEcart}</Badge>
                          ) : (
                            <span className="text-muted">0</span>
                          )}
                        </td>
                        <td className="text-end small text-success fw-semibold">
                          {inv.totalEcartPositif > 0 ? `+${formatMoney(inv.totalEcartPositif)}` : '—'}
                        </td>
                        <td className="text-end small text-danger fw-semibold">
                          {inv.totalEcartNegatif > 0 ? `-${formatMoney(inv.totalEcartNegatif)}` : '—'}
                        </td>
                        <td className="text-center">
                          <Badge bg={cfg.variant} style={{ fontSize: '0.7rem' }}>{cfg.label}</Badge>
                        </td>
                        <td className="text-end">
                          <Button
                            as={Link}
                            to={`/stocks/inventaires/${inv._id}`}
                            variant="outline-primary"
                            size="sm"
                          >
                            <FiEye size={14} />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
        {meta.totalPages > 1 && (
          <Card.Footer className="d-flex justify-content-between align-items-center">
            <small className="text-muted">
              Page {meta.page}/{meta.totalPages} — {meta.total} inventaire(s)
            </small>
            <div className="d-flex gap-2">
              <Button size="sm" variant="outline-secondary" disabled={filters.page <= 1}
                onClick={() => setFilters((p) => ({ ...p, page: p.page - 1 }))}>Précédent</Button>
              <Button size="sm" variant="outline-secondary" disabled={filters.page >= meta.totalPages}
                onClick={() => setFilters((p) => ({ ...p, page: p.page + 1 }))}>Suivant</Button>
            </div>
          </Card.Footer>
        )}
      </Card>

      {/* Modal création */}
      <Modal show={showModal} onHide={() => { setShowModal(false); setCreateError(''); }}>
        <Modal.Header closeButton>
          <Modal.Title>Nouvel inventaire physique</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreate}>
          <Modal.Body>
            {createError && <Alert variant="danger">{createError}</Alert>}
            <Alert variant="info" className="small">
              L'inventaire sera pré-rempli avec tous les articles en stock au moment de sa création.
              Vous pourrez ensuite saisir les quantités réellement comptées.
            </Alert>
            <Form.Group className="mb-3">
              <Form.Label>Date de l'inventaire *</Form.Label>
              <Form.Control
                type="date"
                value={newForm.dateInventaire}
                onChange={(e) => setNewForm((p) => ({ ...p, dateInventaire: e.target.value }))}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Dépôt (optionnel)</Form.Label>
              <Form.Select
                value={newForm.warehouseId}
                onChange={(e) => setNewForm((p) => ({ ...p, warehouseId: e.target.value }))}
              >
                <option value="">Tous les dépôts</option>
                {warehouses.map((w) => (
                  <option key={w._id} value={w._id}>{w.name}</option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group>
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={newForm.description}
                onChange={(e) => setNewForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Ex: Inventaire de fin d'année, Inventaire tournant..."
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Annuler</Button>
            <Button type="submit" variant="primary" disabled={creating}>
              {creating ? <Spinner animation="border" size="sm" className="me-1" /> : <FiPlus className="me-1" />}
              Créer et démarrer la saisie
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </>
  );
};

export default InventairesListPage;
