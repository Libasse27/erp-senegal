import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Table from 'react-bootstrap/Table';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import Badge from 'react-bootstrap/Badge';
import {
  FiArrowLeft,
  FiPlus,
  FiTrash2,
  FiArrowRight,
  FiSave,
  FiAlertTriangle,
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import usePageTitle from '../../hooks/usePageTitle';
import { formatMoney } from '../../utils/formatters';
import {
  useCreateTransfertMutation,
  useUpdateTransfertMutation,
  useGetTransfertQuery,
} from '../../redux/api/transfertsApi';
import { useGetWarehousesQuery, useGetStocksQuery } from '../../redux/api/stocksApi';

const TransfertFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  usePageTitle(isEdit ? 'Modifier le transfert' : 'Nouveau transfert', [
    { label: 'Accueil', path: '/' },
    { label: 'Stocks', path: '/stocks' },
    { label: 'Transferts', path: '/stocks/transferts' },
    { label: isEdit ? 'Modifier' : 'Nouveau' },
  ]);

  const [form, setForm] = useState({
    warehouseSource: '',
    warehouseDestination: '',
    dateTransfert: new Date().toISOString().split('T')[0],
    motif: '',
    notes: '',
  });
  const [lignes, setLignes] = useState([]);
  const [selectedStockId, setSelectedStockId] = useState('');
  const [error, setError] = useState('');

  const { data: existingData } = useGetTransfertQuery(id, { skip: !isEdit });
  const { data: wData } = useGetWarehousesQuery({ limit: 50 });
  const { data: stocksData } = useGetStocksQuery(
    { warehouse: form.warehouseSource, limit: 200, populate: 'product' },
    { skip: !form.warehouseSource }
  );

  const [create, { isLoading: creating }] = useCreateTransfertMutation();
  const [update, { isLoading: updating }] = useUpdateTransfertMutation();
  const saving = creating || updating;

  const warehouses = wData?.data || [];
  const sourceStocks = (stocksData?.data || []).filter((s) => s.quantite > 0 && s.product);

  // Load existing data for edit
  useEffect(() => {
    if (existingData?.data) {
      const t = existingData.data;
      if (t.statut !== 'brouillon') { navigate(`/stocks/transferts/${id}`); return; }
      setForm({
        warehouseSource: t.warehouseSource?._id || t.warehouseSource,
        warehouseDestination: t.warehouseDestination?._id || t.warehouseDestination,
        dateTransfert: t.dateTransfert ? t.dateTransfert.split('T')[0] : new Date().toISOString().split('T')[0],
        motif: t.motif || '',
        notes: t.notes || '',
      });
      setLignes(t.lignes.map((l) => ({
        productId: l.product?._id || l.product,
        name: l.productSnapshot?.name || l.product?.name || '—',
        code: l.productSnapshot?.code || l.product?.code,
        unite: l.productSnapshot?.unite || l.product?.unite,
        quantite: l.quantite,
        stockDispo: null,
      })));
    }
  }, [existingData, id, navigate]);

  // Reset lignes when source warehouse changes
  const handleSourceChange = (wId) => {
    setForm((p) => ({ ...p, warehouseSource: wId }));
    setLignes([]);
    setSelectedStockId('');
  };

  const handleAddProduct = () => {
    if (!selectedStockId) return;
    const stock = sourceStocks.find((s) => s._id === selectedStockId);
    if (!stock) return;
    const alreadyIn = lignes.some((l) => l.productId === String(stock.product._id));
    if (alreadyIn) { toast.warning('Ce produit est déjà dans la liste'); return; }
    setLignes((prev) => [
      ...prev,
      {
        productId: String(stock.product._id),
        name: stock.product.name,
        code: stock.product.code,
        unite: stock.product.unite,
        quantite: 1,
        stockDispo: stock.quantite,
        cump: stock.cump,
      },
    ]);
    setSelectedStockId('');
  };

  const handleQtyChange = (idx, val) => {
    setLignes((prev) => prev.map((l, i) => i === idx ? { ...l, quantite: Number(val) } : l));
  };

  const handleRemove = (idx) => setLignes((prev) => prev.filter((_, i) => i !== idx));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.warehouseSource || !form.warehouseDestination) {
      return setError('Veuillez sélectionner les deux dépôts');
    }
    if (form.warehouseSource === form.warehouseDestination) {
      return setError('Le dépôt source et de destination doivent être différents');
    }
    if (lignes.length === 0) {
      return setError('Ajoutez au moins un produit');
    }
    for (const l of lignes) {
      if (!l.quantite || l.quantite < 1) return setError(`Quantité invalide pour "${l.name}"`);
      if (l.stockDispo !== null && l.quantite > l.stockDispo) {
        return setError(`Stock insuffisant pour "${l.name}" : disponible ${l.stockDispo}, demandé ${l.quantite}`);
      }
    }

    const payload = {
      ...form,
      lignes: lignes.map((l) => ({ product: l.productId, quantite: l.quantite })),
    };

    try {
      const res = isEdit
        ? await update({ id, ...payload }).unwrap()
        : await create(payload).unwrap();
      navigate(`/stocks/transferts/${res.data._id}`);
    } catch (err) {
      setError(err.data?.message || 'Erreur lors de la sauvegarde');
    }
  };

  return (
    <>
      <div className="page-header">
        <div className="d-flex align-items-center gap-3">
          <Button variant="outline-secondary" size="sm" onClick={() => navigate('/stocks/transferts')}>
            <FiArrowLeft />
          </Button>
          <div>
            <h1 className="mb-0">{isEdit ? 'Modifier le transfert' : 'Nouveau transfert de stock'}</h1>
            <small className="text-muted">Déplacer des produits entre deux dépôts</small>
          </div>
        </div>
      </div>

      <Form onSubmit={handleSubmit}>
        {error && (
          <Alert variant="danger" className="d-flex gap-2 align-items-center mb-3">
            <FiAlertTriangle /> {error}
          </Alert>
        )}

        {/* En-tête */}
        <Card className="shadow-sm mb-3">
          <Card.Header><strong>Informations du transfert</strong></Card.Header>
          <Card.Body>
            <Row className="g-3">
              <Col md={5}>
                <Form.Group>
                  <Form.Label>Dépôt source <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    value={form.warehouseSource}
                    onChange={(e) => handleSourceChange(e.target.value)}
                    required
                  >
                    <option value="">— Sélectionner le dépôt source —</option>
                    {warehouses.map((w) => (
                      <option key={w._id} value={w._id}>{w.name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={1} className="d-flex align-items-end justify-content-center pb-2">
                <FiArrowRight size={22} className="text-primary" />
              </Col>
              <Col md={5}>
                <Form.Group>
                  <Form.Label>Dépôt destination <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    value={form.warehouseDestination}
                    onChange={(e) => setForm((p) => ({ ...p, warehouseDestination: e.target.value }))}
                    required
                  >
                    <option value="">— Sélectionner le dépôt destination —</option>
                    {warehouses
                      .filter((w) => w._id !== form.warehouseSource)
                      .map((w) => (
                        <option key={w._id} value={w._id}>{w.name}</option>
                      ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Date du transfert</Form.Label>
                  <Form.Control
                    type="date"
                    value={form.dateTransfert}
                    onChange={(e) => setForm((p) => ({ ...p, dateTransfert: e.target.value }))}
                  />
                </Form.Group>
              </Col>
              <Col md={5}>
                <Form.Group>
                  <Form.Label>Motif</Form.Label>
                  <Form.Control
                    type="text"
                    value={form.motif}
                    onChange={(e) => setForm((p) => ({ ...p, motif: e.target.value }))}
                    placeholder="Ex: Réapprovionnement dépôt secondaire..."
                    maxLength={500}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Notes internes</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={1}
                    value={form.notes}
                    onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                    maxLength={1000}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Lignes produits */}
        <Card className="shadow-sm mb-3">
          <Card.Header className="d-flex justify-content-between align-items-center">
            <strong>Produits à transférer</strong>
            <Badge bg="secondary" pill>{lignes.length} produit(s)</Badge>
          </Card.Header>
          <Card.Body>
            {!form.warehouseSource ? (
              <Alert variant="info" className="small py-2 mb-0">
                Sélectionnez d'abord le dépôt source pour voir les produits disponibles.
              </Alert>
            ) : (
              <Row className="g-2 mb-3 align-items-end">
                <Col md={7}>
                  <Form.Label className="small fw-semibold">Ajouter un produit depuis le dépôt source</Form.Label>
                  <Form.Select
                    size="sm"
                    value={selectedStockId}
                    onChange={(e) => setSelectedStockId(e.target.value)}
                  >
                    <option value="">
                      {sourceStocks.length === 0 ? 'Aucun produit en stock dans ce dépôt' : '— Choisir un produit —'}
                    </option>
                    {sourceStocks
                      .filter((s) => !lignes.some((l) => l.productId === String(s.product._id)))
                      .map((s) => (
                        <option key={s._id} value={s._id}>
                          {s.product.name} ({s.product.code}) — Stock : {s.quantite} {s.product.unite}
                        </option>
                      ))}
                  </Form.Select>
                </Col>
                <Col md="auto">
                  <Button
                    size="sm"
                    variant="outline-primary"
                    onClick={handleAddProduct}
                    disabled={!selectedStockId}
                  >
                    <FiPlus className="me-1" /> Ajouter
                  </Button>
                </Col>
              </Row>
            )}

            {lignes.length > 0 && (
              <Table hover size="sm" className="mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Produit</th>
                    <th>Code</th>
                    <th className="text-end">Dispo source</th>
                    <th className="text-center" style={{ width: 130 }}>Qté à transférer</th>
                    <th className="text-end">CUMP</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {lignes.map((l, idx) => {
                    const overStock = l.stockDispo !== null && l.quantite > l.stockDispo;
                    return (
                      <tr key={l.productId} className={overStock ? 'table-danger' : ''}>
                        <td className="fw-medium small">{l.name}</td>
                        <td className="text-muted small">{l.code}</td>
                        <td className="text-end small">
                          {l.stockDispo !== null
                            ? <span className={overStock ? 'text-danger fw-semibold' : 'text-success'}>{l.stockDispo} {l.unite}</span>
                            : '—'}
                        </td>
                        <td>
                          <Form.Control
                            type="number"
                            size="sm"
                            min={1}
                            max={l.stockDispo || undefined}
                            step={1}
                            value={l.quantite}
                            onChange={(e) => handleQtyChange(idx, e.target.value)}
                            className={overStock ? 'border-danger' : ''}
                            style={{ textAlign: 'center' }}
                          />
                        </td>
                        <td className="text-end small text-muted">
                          {l.cump ? formatMoney(l.cump) : '—'}
                        </td>
                        <td className="text-end">
                          <Button
                            variant="link"
                            size="sm"
                            className="text-danger p-0"
                            onClick={() => handleRemove(idx)}
                          >
                            <FiTrash2 size={14} />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            )}
          </Card.Body>
          <Card.Footer className="d-flex justify-content-end gap-2">
            <Button variant="secondary" onClick={() => navigate('/stocks/transferts')}>
              Annuler
            </Button>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? <Spinner animation="border" size="sm" className="me-1" /> : <FiSave className="me-1" />}
              {isEdit ? 'Enregistrer les modifications' : 'Créer le transfert'}
            </Button>
          </Card.Footer>
        </Card>
      </Form>
    </>
  );
};

export default TransfertFormPage;
