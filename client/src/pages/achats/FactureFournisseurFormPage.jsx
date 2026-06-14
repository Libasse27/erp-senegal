import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Table from 'react-bootstrap/Table';
import Alert from 'react-bootstrap/Alert';
import Spinner from 'react-bootstrap/Spinner';
import { FiPlus, FiTrash2, FiSave, FiArrowLeft } from 'react-icons/fi';
import usePageTitle from '../../hooks/usePageTitle';
import { formatMoney } from '../../utils/formatters';
import {
  useCreateFactureFournisseurMutation,
  useUpdateFactureFournisseurMutation,
  useGetFactureFournisseurQuery,
} from '../../redux/api/facturesFournisseurApi';
import { useGetFournisseursQuery } from '../../redux/api/fournisseursApi';
import { useGetCommandesAchatQuery, useGetCommandeAchatQuery } from '../../redux/api/commandesAchatApi';

const emptyLigne = () => ({
  designation: '',
  reference: '',
  quantite: 1,
  prixUnitaire: 0,
  remise: 0,
  tauxTVA: 18,
  unite: 'Unite',
});

const calcLigne = (l) => {
  const ht = Math.round(l.quantite * l.prixUnitaire * (1 - l.remise / 100));
  const tva = Math.round((ht * l.tauxTVA) / 100);
  return { ...l, montantHT: ht, montantTVA: tva, montantTTC: ht + tva };
};

const FactureFournisseurFormPage = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  usePageTitle(isEdit ? 'Modifier la facture fournisseur' : 'Nouvelle facture fournisseur', [
    { label: 'Accueil', path: '/' },
    { label: 'Achats', path: '/achats/commandes' },
    { label: 'Factures fournisseurs', path: '/achats/factures-fournisseur' },
    { label: isEdit ? 'Modifier' : 'Nouveau' },
  ]);

  const preselectedCmde = searchParams.get('commandeAchat') || '';

  const [form, setForm] = useState({
    fournisseurId: '',
    commandeAchatId: preselectedCmde,
    referenceFournisseur: '',
    dateFacture: new Date().toISOString().split('T')[0],
    dateEcheance: '',
    remiseGlobale: 0,
    conditionsPaiement: '',
    notes: '',
    lignes: [emptyLigne()],
  });

  const [serverError, setServerError] = useState('');

  const { data: ffData } = useGetFactureFournisseurQuery(id, { skip: !isEdit });
  const { data: fournisseursData } = useGetFournisseursQuery({ limit: 200 });
  const { data: commandesData } = useGetCommandesAchatQuery(
    { statut: 'confirmee,partiellement_recue,recue', limit: 100 },
    { skip: !form.fournisseurId }
  );
  const { data: cmdeDetail } = useGetCommandeAchatQuery(form.commandeAchatId, {
    skip: !form.commandeAchatId,
  });

  const [create, { isLoading: creating }] = useCreateFactureFournisseurMutation();
  const [update, { isLoading: updating }] = useUpdateFactureFournisseurMutation();
  const isSaving = creating || updating;

  useEffect(() => {
    if (isEdit && ffData?.data) {
      const ff = ffData.data;
      setForm({
        fournisseurId: ff.fournisseur?._id || ff.fournisseur || '',
        commandeAchatId: ff.commandeAchat?._id || ff.commandeAchat || '',
        referenceFournisseur: ff.referenceFournisseur || '',
        dateFacture: ff.dateFacture ? ff.dateFacture.split('T')[0] : '',
        dateEcheance: ff.dateEcheance ? ff.dateEcheance.split('T')[0] : '',
        remiseGlobale: ff.remiseGlobale || 0,
        conditionsPaiement: ff.conditionsPaiement || '',
        notes: ff.notes || '',
        lignes: ff.lignes?.length > 0 ? ff.lignes : [emptyLigne()],
      });
    }
  }, [isEdit, ffData]);

  // Import lignes from commandeAchat
  useEffect(() => {
    if (cmdeDetail?.data && !isEdit) {
      const cmde = cmdeDetail.data;
      setForm((prev) => ({
        ...prev,
        fournisseurId: cmde.fournisseur?._id || cmde.fournisseur || prev.fournisseurId,
        lignes: cmde.lignes.map((l) => ({
          product: l.product?._id || l.product,
          designation: l.designation,
          reference: l.reference || '',
          quantite: l.quantite,
          prixUnitaire: l.prixUnitaire,
          remise: l.remise || 0,
          tauxTVA: l.tauxTVA,
          unite: l.unite || 'Unite',
        })),
      }));
    }
  }, [cmdeDetail, isEdit]);

  const fournisseurs = fournisseursData?.data || [];
  const commandes = commandesData?.data || [];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleLigneChange = (idx, field, value) => {
    setForm((prev) => {
      const lignes = [...prev.lignes];
      lignes[idx] = { ...lignes[idx], [field]: field === 'designation' || field === 'reference' || field === 'unite' ? value : Number(value) };
      return { ...prev, lignes };
    });
  };

  const addLigne = () => setForm((prev) => ({ ...prev, lignes: [...prev.lignes, emptyLigne()] }));
  const removeLigne = (idx) =>
    setForm((prev) => ({ ...prev, lignes: prev.lignes.filter((_, i) => i !== idx) }));

  const computed = form.lignes.map(calcLigne);
  const sumHT = computed.reduce((s, l) => s + l.montantHT, 0);
  const sumTVA = computed.reduce((s, l) => s + l.montantTVA, 0);
  const remF = 1 - form.remiseGlobale / 100;
  const totalHT = Math.round(sumHT * remF);
  const totalTVA = Math.round(sumTVA * remF);
  const totalTTC = totalHT + totalTVA;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    try {
      const payload = {
        fournisseurId: form.fournisseurId,
        commandeAchatId: form.commandeAchatId || undefined,
        referenceFournisseur: form.referenceFournisseur,
        dateFacture: form.dateFacture,
        dateEcheance: form.dateEcheance || undefined,
        remiseGlobale: Number(form.remiseGlobale),
        conditionsPaiement: form.conditionsPaiement,
        notes: form.notes,
        lignes: form.lignes.map((l) => ({
          product: l.product || undefined,
          designation: l.designation,
          reference: l.reference,
          quantite: Number(l.quantite),
          prixUnitaire: Number(l.prixUnitaire),
          remise: Number(l.remise || 0),
          tauxTVA: Number(l.tauxTVA),
          unite: l.unite,
        })),
      };

      if (isEdit) {
        await update({ id, ...payload }).unwrap();
      } else {
        const res = await create(payload).unwrap();
        navigate(`/achats/factures-fournisseur/${res.data._id}`);
        return;
      }
      navigate(`/achats/factures-fournisseur/${id}`);
    } catch (err) {
      setServerError(err.data?.message || 'Une erreur est survenue');
    }
  };

  return (
    <>
      <div className="page-header">
        <h1>{isEdit ? 'Modifier la facture fournisseur' : 'Nouvelle facture fournisseur'}</h1>
        <Button variant="outline-secondary" size="sm" onClick={() => navigate(-1)}>
          <FiArrowLeft className="me-1" /> Retour
        </Button>
      </div>

      {serverError && <Alert variant="danger">{serverError}</Alert>}

      <Form onSubmit={handleSubmit}>
        <Row className="g-3">
          {/* Fournisseur + commande */}
          <Col md={8}>
            <Card className="shadow-sm mb-3">
              <Card.Header className="bg-white">
                <h6 className="mb-0">Informations de la facture</h6>
              </Card.Header>
              <Card.Body>
                <Row className="g-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Fournisseur *</Form.Label>
                      <Form.Select
                        name="fournisseurId"
                        value={form.fournisseurId}
                        onChange={handleChange}
                        required
                        disabled={isEdit}
                      >
                        <option value="">Sélectionner...</option>
                        {fournisseurs.map((f) => (
                          <option key={f._id} value={f._id}>{f.raisonSociale}</option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Importer depuis une commande achat</Form.Label>
                      <Form.Select
                        name="commandeAchatId"
                        value={form.commandeAchatId}
                        onChange={handleChange}
                        disabled={isEdit}
                      >
                        <option value="">Aucune (saisie manuelle)</option>
                        {commandes.map((c) => (
                          <option key={c._id} value={c._id}>
                            {c.numero} — {c.fournisseurSnapshot?.raisonSociale || ''}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label>N° facture fournisseur</Form.Label>
                      <Form.Control
                        name="referenceFournisseur"
                        value={form.referenceFournisseur}
                        onChange={handleChange}
                        placeholder="Ex: INV-2024-001"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label>Date facture *</Form.Label>
                      <Form.Control
                        type="date"
                        name="dateFacture"
                        value={form.dateFacture}
                        onChange={handleChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label>Date échéance</Form.Label>
                      <Form.Control
                        type="date"
                        name="dateEcheance"
                        value={form.dateEcheance}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Conditions de paiement</Form.Label>
                      <Form.Control
                        name="conditionsPaiement"
                        value={form.conditionsPaiement}
                        onChange={handleChange}
                        placeholder="Ex: 30 jours net"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Notes</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={2}
                        name="notes"
                        value={form.notes}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* Lignes */}
            <Card className="shadow-sm">
              <Card.Header className="bg-white d-flex justify-content-between align-items-center">
                <h6 className="mb-0">Lignes de la facture</h6>
                <Button variant="outline-primary" size="sm" onClick={addLigne}>
                  <FiPlus className="me-1" /> Ajouter une ligne
                </Button>
              </Card.Header>
              <Card.Body className="p-0">
                <div className="table-responsive">
                  <Table className="mb-0">
                    <thead className="table-light">
                      <tr>
                        <th style={{ minWidth: 200 }}>Désignation *</th>
                        <th style={{ width: 90 }}>Qté</th>
                        <th style={{ width: 120 }}>Prix HT</th>
                        <th style={{ width: 80 }}>Rem.%</th>
                        <th style={{ width: 80 }}>TVA%</th>
                        <th className="text-end" style={{ width: 120 }}>Montant TTC</th>
                        <th style={{ width: 40 }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {form.lignes.map((ligne, idx) => {
                        const c = calcLigne(ligne);
                        return (
                          <tr key={idx}>
                            <td>
                              <Form.Control
                                size="sm"
                                value={ligne.designation}
                                onChange={(e) => handleLigneChange(idx, 'designation', e.target.value)}
                                placeholder="Désignation"
                                required
                              />
                            </td>
                            <td>
                              <Form.Control
                                size="sm"
                                type="number"
                                min="0.01"
                                step="0.01"
                                value={ligne.quantite}
                                onChange={(e) => handleLigneChange(idx, 'quantite', e.target.value)}
                              />
                            </td>
                            <td>
                              <Form.Control
                                size="sm"
                                type="number"
                                min="0"
                                step="1"
                                value={ligne.prixUnitaire}
                                onChange={(e) => handleLigneChange(idx, 'prixUnitaire', e.target.value)}
                              />
                            </td>
                            <td>
                              <Form.Control
                                size="sm"
                                type="number"
                                min="0"
                                max="100"
                                value={ligne.remise}
                                onChange={(e) => handleLigneChange(idx, 'remise', e.target.value)}
                              />
                            </td>
                            <td>
                              <Form.Select
                                size="sm"
                                value={ligne.tauxTVA}
                                onChange={(e) => handleLigneChange(idx, 'tauxTVA', e.target.value)}
                              >
                                <option value={0}>0%</option>
                                <option value={18}>18%</option>
                              </Form.Select>
                            </td>
                            <td className="text-end fw-semibold small">{formatMoney(c.montantTTC)}</td>
                            <td>
                              <Button
                                variant="link"
                                size="sm"
                                className="text-danger p-0"
                                onClick={() => removeLigne(idx)}
                                disabled={form.lignes.length === 1}
                              >
                                <FiTrash2 size={14} />
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Totaux */}
          <Col md={4}>
            <Card className="shadow-sm mb-3">
              <Card.Header className="bg-white">
                <h6 className="mb-0">Récapitulatif</h6>
              </Card.Header>
              <Card.Body>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Total HT</span>
                  <span className="fw-medium">{formatMoney(sumHT)}</span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">TVA</span>
                  <span className="fw-medium">{formatMoney(sumTVA)}</span>
                </div>
                <Form.Group className="mb-2">
                  <Form.Label className="small text-muted">Remise globale (%)</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    max="100"
                    size="sm"
                    name="remiseGlobale"
                    value={form.remiseGlobale}
                    onChange={handleChange}
                  />
                </Form.Group>
                <hr />
                <div className="d-flex justify-content-between mb-1">
                  <span className="text-muted small">Total HT net</span>
                  <span>{formatMoney(totalHT)}</span>
                </div>
                <div className="d-flex justify-content-between mb-1">
                  <span className="text-muted small">TVA nette</span>
                  <span>{formatMoney(totalTVA)}</span>
                </div>
                <div className="d-flex justify-content-between fw-bold fs-5 mt-2">
                  <span>Total TTC</span>
                  <span className="text-primary">{formatMoney(totalTTC)}</span>
                </div>
              </Card.Body>
            </Card>

            <Button
              type="submit"
              variant="primary"
              className="w-100"
              disabled={isSaving}
            >
              {isSaving
                ? <Spinner animation="border" size="sm" className="me-1" />
                : <FiSave className="me-1" />}
              {isEdit ? 'Enregistrer les modifications' : 'Créer la facture'}
            </Button>
          </Col>
        </Row>
      </Form>
    </>
  );
};

export default FactureFournisseurFormPage;
