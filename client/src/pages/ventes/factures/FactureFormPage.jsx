import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Card from 'react-bootstrap/Card';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Table from 'react-bootstrap/Table';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import { FiSave, FiX, FiPlus, FiTrash2 } from 'react-icons/fi';
import { toast } from 'react-toastify';
import usePageTitle from '../../../hooks/usePageTitle';
import { formatMoney } from '../../../utils/formatters';
import {
  useGetFactureQuery,
  useCreateFactureMutation,
  useUpdateFactureMutation,
} from '../../../redux/api/facturesApi';
import { useGetClientsQuery } from '../../../redux/api/clientsApi';
import { useGetProductsQuery } from '../../../redux/api/productsApi';

const FactureFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  usePageTitle(
    isEditMode ? 'Modifier la Facture' : 'Nouvelle Facture',
    [
      { label: 'Accueil', path: '/' },
      { label: 'Ventes', path: '#' },
      { label: 'Factures', path: '/ventes/factures' },
      { label: isEditMode ? 'Modifier' : 'Nouveau' },
    ]
  );

  const { data: factureData, isLoading: isLoadingFacture } = useGetFactureQuery(
    id,
    {
      skip: !isEditMode,
    }
  );
  const { data: clientsData } = useGetClientsQuery({ limit: 1000 });
  const { data: productsData } = useGetProductsQuery({ limit: 1000 });
  const [createFacture, { isLoading: isCreating }] = useCreateFactureMutation();
  const [updateFacture, { isLoading: isUpdating }] = useUpdateFactureMutation();

  const [formData, setFormData] = useState({
    client: '',
    date: new Date().toISOString().split('T')[0],
    dateEcheance: '',
    conditionsPaiement: '',
    notes: '',
    lignes: [
      {
        product: '',
        designation: '',
        quantite: 1,
        prixUnitaire: 0,
        remise: 0,
        tauxTVA: 18,
      },
    ],
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isEditMode && factureData?.data) {
      const facture = factureData.data;
      setFormData({
        client: facture.client?._id || '',
        date: facture.date ? new Date(facture.date).toISOString().split('T')[0] : '',
        dateEcheance: facture.dateEcheance ? new Date(facture.dateEcheance).toISOString().split('T')[0] : '',
        conditionsPaiement: facture.conditionsPaiement || '',
        notes: facture.notes || '',
        lignes: facture.lignes?.length > 0 ? facture.lignes.map(l => ({
          product: l.product?._id || '',
          designation: l.designation || '',
          quantite: l.quantite || 1,
          prixUnitaire: l.prixUnitaire || 0,
          remise: l.remise || 0,
          tauxTVA: l.tauxTVA || 18,
        })) : [
          {
            product: '',
            designation: '',
            quantite: 1,
            prixUnitaire: 0,
            remise: 0,
            tauxTVA: 18,
          },
        ],
      });
    }
  }, [isEditMode, factureData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleLigneChange = (index, field, value) => {
    const newLignes = [...formData.lignes];
    newLignes[index][field] = value;

    if (field === 'product' && value) {
      const product = products.find(p => p._id === value);
      if (product) {
        newLignes[index].designation = product.designation;
        newLignes[index].prixUnitaire = product.prixVente;
        newLignes[index].tauxTVA = product.tva || 18;
      }
    }

    setFormData((prev) => ({
      ...prev,
      lignes: newLignes,
    }));
  };

  const addLigne = () => {
    setFormData((prev) => ({
      ...prev,
      lignes: [
        ...prev.lignes,
        {
          product: '',
          designation: '',
          quantite: 1,
          prixUnitaire: 0,
          remise: 0,
          tauxTVA: 18,
        },
      ],
    }));
  };

  const removeLigne = (index) => {
    if (formData.lignes.length > 1) {
      setFormData((prev) => ({
        ...prev,
        lignes: prev.lignes.filter((_, i) => i !== index),
      }));
    }
  };

  const calculateLigne = (ligne) => {
    const sousTotal = ligne.quantite * ligne.prixUnitaire;
    const montantRemise = Math.round((sousTotal * ligne.remise) / 100);
    const ht = sousTotal - montantRemise;
    const tva = Math.round((ht * ligne.tauxTVA) / 100);
    const ttc = ht + tva;
    return { sousTotal, montantRemise, ht, tva, ttc };
  };

  const calculateTotals = () => {
    let totalHT = 0;
    let totalRemise = 0;
    let totalTVA = 0;

    formData.lignes.forEach((ligne) => {
      const calc = calculateLigne(ligne);
      totalHT += calc.ht;
      totalRemise += calc.montantRemise;
      totalTVA += calc.tva;
    });

    const totalTTC = totalHT + totalTVA;
    return { totalHT, totalRemise, totalTVA, totalTTC };
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.client) {
      newErrors.client = 'Le client est requis';
    }

    if (!formData.date) {
      newErrors.date = 'La date est requise';
    }

    if (!formData.dateEcheance) {
      newErrors.dateEcheance = 'La date d\'echeance est requise';
    }

    if (formData.lignes.length === 0) {
      newErrors.lignes = 'Au moins une ligne est requise';
    }

    formData.lignes.forEach((ligne, index) => {
      if (!ligne.designation.trim()) {
        newErrors[`ligne_${index}_designation`] = 'La designation est requise';
      }
      if (ligne.quantite <= 0) {
        newErrors[`ligne_${index}_quantite`] = 'La quantite doit etre superieure a 0';
      }
      if (ligne.prixUnitaire <= 0) {
        newErrors[`ligne_${index}_prixUnitaire`] = 'Le prix unitaire doit etre superieur a 0';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Veuillez corriger les erreurs dans le formulaire');
      return;
    }

    const totals = calculateTotals();
    const payload = {
      client: formData.client,
      date: formData.date,
      dateEcheance: formData.dateEcheance,
      conditionsPaiement: formData.conditionsPaiement || undefined,
      notes: formData.notes || undefined,
      lignes: formData.lignes.map((ligne) => ({
        product: ligne.product || undefined,
        designation: ligne.designation,
        quantite: Number(ligne.quantite),
        prixUnitaire: Number(ligne.prixUnitaire),
        remise: Number(ligne.remise),
        tauxTVA: Number(ligne.tauxTVA),
      })),
      totalHT: totals.totalHT,
      totalTVA: totals.totalTVA,
      totalTTC: totals.totalTTC,
    };

    try {
      if (isEditMode) {
        await updateFacture({ id, ...payload }).unwrap();
        toast.success('Facture modifiee avec succes');
      } else {
        await createFacture(payload).unwrap();
        toast.success('Facture creee avec succes');
      }
      navigate('/ventes/factures');
    } catch (err) {
      toast.error(
        err.data?.message ||
          `Erreur lors de ${isEditMode ? 'la modification' : 'la creation'} de la facture`
      );
    }
  };

  if (isEditMode && isLoadingFacture) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2 text-muted">Chargement...</p>
      </div>
    );
  }

  const clients = clientsData?.data || [];
  const products = productsData?.data || [];
  const totals = calculateTotals();

  return (
    <>
      <div className="page-header">
        <h1>{isEditMode ? 'Modifier la Facture' : 'Nouvelle Facture'}</h1>
      </div>

      <Card className="shadow-sm">
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <Row className="g-3 mb-4">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>
                    Client <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Select
                    name="client"
                    value={formData.client}
                    onChange={handleChange}
                    isInvalid={!!errors.client}
                  >
                    <option value="">Selectionner un client</option>
                    {clients.map((client) => (
                      <option key={client._id} value={client._id}>
                        {client.type === 'entreprise'
                          ? client.raisonSociale
                          : `${client.firstName} ${client.lastName}`}
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">
                    {errors.client}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col md={3}>
                <Form.Group>
                  <Form.Label>
                    Date <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    isInvalid={!!errors.date}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.date}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col md={3}>
                <Form.Group>
                  <Form.Label>
                    Date d'echeance <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="date"
                    name="dateEcheance"
                    value={formData.dateEcheance}
                    onChange={handleChange}
                    isInvalid={!!errors.dateEcheance}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.dateEcheance}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label>Conditions de paiement</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    name="conditionsPaiement"
                    value={formData.conditionsPaiement}
                    onChange={handleChange}
                    placeholder="Ex: Paiement a 30 jours"
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
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="Notes ou observations"
                  />
                </Form.Group>
              </Col>
            </Row>

            <h5 className="mb-3">Lignes de la facture</h5>
            {errors.lignes && (
              <Alert variant="danger" className="mb-3">
                {errors.lignes}
              </Alert>
            )}

            <div className="table-responsive mb-3">
              <Table bordered>
                <thead className="table-light">
                  <tr>
                    <th style={{ width: '25%' }}>Produit</th>
                    <th style={{ width: '20%' }}>Designation *</th>
                    <th style={{ width: '10%' }}>Qte *</th>
                    <th style={{ width: '12%' }}>Prix Unit. *</th>
                    <th style={{ width: '10%' }}>Remise %</th>
                    <th style={{ width: '10%' }}>TVA %</th>
                    <th style={{ width: '10%' }}>Total TTC</th>
                    <th style={{ width: '3%' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {formData.lignes.map((ligne, index) => {
                    const calc = calculateLigne(ligne);
                    return (
                      <tr key={index}>
                        <td>
                          <Form.Select
                            size="sm"
                            value={ligne.product}
                            onChange={(e) => handleLigneChange(index, 'product', e.target.value)}
                          >
                            <option value="">Aucun</option>
                            {products.map((p) => (
                              <option key={p._id} value={p._id}>
                                {p.reference} - {p.designation}
                              </option>
                            ))}
                          </Form.Select>
                        </td>
                        <td>
                          <Form.Control
                            size="sm"
                            type="text"
                            value={ligne.designation}
                            onChange={(e) => handleLigneChange(index, 'designation', e.target.value)}
                            isInvalid={!!errors[`ligne_${index}_designation`]}
                            placeholder="Description"
                          />
                        </td>
                        <td>
                          <Form.Control
                            size="sm"
                            type="number"
                            value={ligne.quantite}
                            onChange={(e) => handleLigneChange(index, 'quantite', e.target.value)}
                            isInvalid={!!errors[`ligne_${index}_quantite`]}
                            min="1"
                          />
                        </td>
                        <td>
                          <Form.Control
                            size="sm"
                            type="number"
                            value={ligne.prixUnitaire}
                            onChange={(e) => handleLigneChange(index, 'prixUnitaire', e.target.value)}
                            isInvalid={!!errors[`ligne_${index}_prixUnitaire`]}
                            min="0"
                          />
                        </td>
                        <td>
                          <Form.Control
                            size="sm"
                            type="number"
                            value={ligne.remise}
                            onChange={(e) => handleLigneChange(index, 'remise', e.target.value)}
                            min="0"
                            max="100"
                          />
                        </td>
                        <td>
                          <Form.Select
                            size="sm"
                            value={ligne.tauxTVA}
                            onChange={(e) => handleLigneChange(index, 'tauxTVA', e.target.value)}
                          >
                            <option value={18}>18%</option>
                            <option value={0}>0%</option>
                          </Form.Select>
                        </td>
                        <td className="text-end">
                          <strong>{formatMoney(calc.ttc)}</strong>
                        </td>
                        <td>
                          <Button
                            variant="link"
                            size="sm"
                            className="p-0 text-danger"
                            onClick={() => removeLigne(index)}
                            disabled={formData.lignes.length === 1}
                          >
                            <FiTrash2 size={16} />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>

            <Button variant="outline-primary" size="sm" onClick={addLigne} className="mb-4">
              <FiPlus className="me-1" />
              Ajouter une ligne
            </Button>

            <Row>
              <Col md={8}></Col>
              <Col md={4}>
                <Card className="bg-light">
                  <Card.Body>
                    <div className="d-flex justify-content-between mb-2">
                      <span>Sous-total HT:</span>
                      <strong>{formatMoney(totals.totalHT)}</strong>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <span>Total Remise:</span>
                      <strong>{formatMoney(totals.totalRemise)}</strong>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <span>Total TVA:</span>
                      <strong>{formatMoney(totals.totalTVA)}</strong>
                    </div>
                    <hr />
                    <div className="d-flex justify-content-between">
                      <strong>Total TTC:</strong>
                      <h4 className="text-primary mb-0">{formatMoney(totals.totalTTC)}</h4>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            <div className="d-flex justify-content-end gap-2 mt-4">
              <Button
                variant="outline-secondary"
                onClick={() => navigate('/ventes/factures')}
                disabled={isCreating || isUpdating}
              >
                <FiX className="me-1" />
                Annuler
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isCreating || isUpdating}
              >
                {isCreating || isUpdating ? (
                  <>
                    <Spinner
                      as="span"
                      animation="border"
                      size="sm"
                      className="me-2"
                    />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <FiSave className="me-1" />
                    Enregistrer
                  </>
                )}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </>
  );
};

export default FactureFormPage;
