import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Card from 'react-bootstrap/Card';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Spinner from 'react-bootstrap/Spinner';
import { FiSave, FiX } from 'react-icons/fi';
import { toast } from 'react-toastify';
import usePageTitle from '../../../hooks/usePageTitle';
import {
  ClientSelect,
  LignesDocumentEditor,
  TotauxDocument,
  calculateLigne,
  LIGNE_VIDE,
} from '../../../components/forms';
import {
  useGetFactureQuery,
  useCreateFactureMutation,
  useUpdateFactureMutation,
} from '../../../redux/api/facturesApi';

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

  const { data: factureData, isLoading: isLoadingFacture } = useGetFactureQuery(id, {
    skip: !isEditMode,
  });
  const [createFacture, { isLoading: isCreating }] = useCreateFactureMutation();
  const [updateFacture, { isLoading: isUpdating }] = useUpdateFactureMutation();

  const [formData, setFormData] = useState({
    client: '',
    date: new Date().toISOString().split('T')[0],
    dateEcheance: '',
    conditionsPaiement: '',
    notes: '',
    lignes: [{ ...LIGNE_VIDE }],
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isEditMode && factureData?.data) {
      const facture = factureData.data;
      setFormData({
        client: facture.client?._id || '',
        date: facture.date ? new Date(facture.date).toISOString().split('T')[0] : '',
        dateEcheance: facture.dateEcheance
          ? new Date(facture.dateEcheance).toISOString().split('T')[0]
          : '',
        conditionsPaiement: facture.conditionsPaiement || '',
        notes: facture.notes || '',
        lignes:
          facture.lignes?.length > 0
            ? facture.lignes.map((l) => ({
                product: l.product?._id || '',
                designation: l.designation || '',
                quantite: l.quantite || 1,
                prixUnitaire: l.prixUnitaire || 0,
                remise: l.remise || 0,
                tauxTVA: l.tauxTVA || 18,
              }))
            : [{ ...LIGNE_VIDE }],
      });
    }
  }, [isEditMode, factureData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
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
    return { totalHT, totalRemise, totalTVA, totalTTC: totalHT + totalTVA };
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.client) newErrors.client = 'Le client est requis';
    if (!formData.date) newErrors.date = 'La date est requise';
    if (!formData.dateEcheance) newErrors.dateEcheance = "La date d'echeance est requise";
    if (formData.lignes.length === 0) newErrors.lignes = 'Au moins une ligne est requise';
    formData.lignes.forEach((ligne, i) => {
      if (!ligne.designation.trim())
        newErrors[`ligne_${i}_designation`] = 'La designation est requise';
      if (Number(ligne.quantite) <= 0)
        newErrors[`ligne_${i}_quantite`] = 'La quantite doit etre superieure a 0';
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
      lignes: formData.lignes.map((l) => ({
        product: l.product || undefined,
        designation: l.designation,
        quantite: Number(l.quantite),
        prixUnitaire: Number(l.prixUnitaire),
        remise: Number(l.remise),
        tauxTVA: Number(l.tauxTVA),
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

  const totals = calculateTotals();

  return (
    <>
      <div className="page-header d-flex justify-content-between align-items-center mb-4">
        <h1>{isEditMode ? 'Modifier la Facture' : 'Nouvelle Facture'}</h1>
        <Button variant="secondary" onClick={() => navigate('/ventes/factures')}>
          Retour
        </Button>
      </div>

      <Form onSubmit={handleSubmit}>
        <Card className="shadow-sm mb-4">
          <Card.Header className="bg-white">
            <h6 className="mb-0">Informations generales</h6>
          </Card.Header>
          <Card.Body>
            <Row className="g-3">
              <Col md={6}>
                <ClientSelect
                  value={formData.client}
                  onChange={(clientId) => {
                    setFormData((prev) => ({ ...prev, client: clientId }));
                    if (errors.client) setErrors((prev) => ({ ...prev, client: '' }));
                  }}
                  error={errors.client}
                />
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
                  <Form.Control.Feedback type="invalid">{errors.date}</Form.Control.Feedback>
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
          </Card.Body>
        </Card>

        <Card className="shadow-sm mb-4">
          <Card.Body>
            <LignesDocumentEditor
              lignes={formData.lignes}
              onChange={(newLignes) =>
                setFormData((prev) => ({ ...prev, lignes: newLignes }))
              }
              label="Lignes de la facture"
            />
          </Card.Body>
        </Card>

        <Card className="shadow-sm mb-4">
          <Card.Header className="bg-white">
            <h6 className="mb-0">Totaux</h6>
          </Card.Header>
          <Card.Body>
            <TotauxDocument totals={totals} />
          </Card.Body>
          <Card.Footer className="bg-white text-end">
            <Button
              variant="outline-secondary"
              className="me-2"
              onClick={() => navigate('/ventes/factures')}
              disabled={isCreating || isUpdating}
            >
              <FiX className="me-1" />
              Annuler
            </Button>
            <Button type="submit" variant="primary" disabled={isCreating || isUpdating}>
              {isCreating || isUpdating ? (
                <>
                  <Spinner as="span" animation="border" size="sm" className="me-2" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <FiSave className="me-1" />
                  Enregistrer
                </>
              )}
            </Button>
          </Card.Footer>
        </Card>
      </Form>
    </>
  );
};

export default FactureFormPage;
