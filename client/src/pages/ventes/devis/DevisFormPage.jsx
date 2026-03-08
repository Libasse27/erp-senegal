import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Spinner from 'react-bootstrap/Spinner';
import { FiSave } from 'react-icons/fi';
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
  useGetDevisByIdQuery,
  useCreateDevisMutation,
  useUpdateDevisMutation,
} from '../../../redux/api/devisApi';

const DevisFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  usePageTitle(
    isEditMode ? 'Modifier le devis' : 'Nouveau devis',
    [
      { label: 'Accueil', path: '/' },
      { label: 'Ventes', path: '#' },
      { label: 'Devis', path: '/ventes/devis' },
      { label: isEditMode ? 'Modifier' : 'Nouveau', path: '#' },
    ]
  );

  const { data: devisData, isLoading: isLoadingDevis } = useGetDevisByIdQuery(id, {
    skip: !isEditMode,
  });
  const [createDevis, { isLoading: isCreating }] = useCreateDevisMutation();
  const [updateDevis, { isLoading: isUpdating }] = useUpdateDevisMutation();

  const [formData, setFormData] = useState({
    client: '',
    date: new Date().toISOString().split('T')[0],
    dateValidite: '',
    notes: '',
    conditionsPaiement: '',
    remiseGlobale: 0,
  });

  const [lignes, setLignes] = useState([{ ...LIGNE_VIDE }]);
  const [clientError, setClientError] = useState('');

  useEffect(() => {
    if (isEditMode && devisData?.data) {
      const devis = devisData.data;
      setFormData({
        client: devis.client?._id || '',
        date: devis.date?.split('T')[0] || '',
        dateValidite: devis.dateValidite?.split('T')[0] || '',
        notes: devis.notes || '',
        conditionsPaiement: devis.conditionsPaiement || '',
        remiseGlobale: devis.remiseGlobale || 0,
      });
      if (devis.lignes?.length > 0) {
        setLignes(
          devis.lignes.map((l) => ({
            product: l.product?._id || '',
            designation: l.designation || '',
            quantite: l.quantite || 1,
            prixUnitaire: l.prixUnitaire || 0,
            remise: l.remise || 0,
            tauxTVA: l.tauxTVA || 18,
          }))
        );
      }
    }
  }, [isEditMode, devisData]);

  const calculateTotals = () => {
    const totalHT = lignes.reduce((sum, l) => sum + calculateLigne(l).ht, 0);
    const remiseGlobaleAmount = Math.round((totalHT * formData.remiseGlobale) / 100);
    const totalHTApresRemise = totalHT - remiseGlobaleAmount;
    const totalTVA = lignes.reduce((sum, l) => {
      const { ht } = calculateLigne(l);
      const htApresRemise = Math.round((ht * (100 - formData.remiseGlobale)) / 100);
      return sum + Math.round((htApresRemise * Number(l.tauxTVA)) / 100);
    }, 0);
    return { totalHT, remiseGlobaleAmount, totalHTApresRemise, totalTVA, totalTTC: totalHTApresRemise + totalTVA };
  };

  const totals = calculateTotals();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.client) {
      setClientError('Veuillez selectionner un client');
      return;
    }

    if (lignes.some((l) => !l.designation || Number(l.quantite) <= 0)) {
      toast.error('Veuillez remplir toutes les lignes correctement');
      return;
    }

    const payload = {
      ...formData,
      lignes: lignes.map((l) => ({
        product: l.product || null,
        designation: l.designation,
        quantite: Number(l.quantite),
        prixUnitaire: Number(l.prixUnitaire),
        remise: Number(l.remise),
        tauxTVA: Number(l.tauxTVA),
      })),
      totalHT: totals.totalHT,
      totalTVA: totals.totalTVA,
      totalTTC: totals.totalTTC,
      remiseGlobale: Number(formData.remiseGlobale),
    };

    try {
      if (isEditMode) {
        await updateDevis({ id, ...payload }).unwrap();
        toast.success('Devis modifie avec succes');
      } else {
        await createDevis(payload).unwrap();
        toast.success('Devis cree avec succes');
      }
      navigate('/ventes/devis');
    } catch (err) {
      toast.error(err?.data?.message || "Erreur lors de l'enregistrement");
    }
  };

  if (isEditMode && isLoadingDevis) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2 text-muted">Chargement du devis...</p>
      </div>
    );
  }

  return (
    <>
      <div className="page-header d-flex justify-content-between align-items-center mb-4">
        <h1>{isEditMode ? 'Modifier le devis' : 'Nouveau devis'}</h1>
        <Button variant="secondary" onClick={() => navigate('/ventes/devis')}>
          Retour
        </Button>
      </div>

      <Form onSubmit={handleSubmit}>
        <Card className="shadow-sm mb-4">
          <Card.Header className="bg-white">
            <h6 className="mb-0">Informations generales</h6>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col md={6}>
                <ClientSelect
                  value={formData.client}
                  onChange={(id) => {
                    setFormData({ ...formData, client: id });
                    setClientError('');
                  }}
                  error={clientError}
                />
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    Date <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    Date de validite <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="date"
                    required
                    value={formData.dateValidite}
                    onChange={(e) => setFormData({ ...formData, dateValidite: e.target.value })}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Conditions de paiement</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={formData.conditionsPaiement}
                    onChange={(e) =>
                      setFormData({ ...formData, conditionsPaiement: e.target.value })
                    }
                    placeholder="Ex: Paiement a 30 jours"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Notes</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Notes internes"
                  />
                </Form.Group>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        <Card className="shadow-sm mb-4">
          <Card.Body>
            <LignesDocumentEditor
              lignes={lignes}
              onChange={setLignes}
              label="Lignes du devis"
            />
          </Card.Body>
        </Card>

        <Card className="shadow-sm mb-4">
          <Card.Header className="bg-white">
            <h6 className="mb-0">Totaux</h6>
          </Card.Header>
          <Card.Body>
            <TotauxDocument
              totals={totals}
              remiseGlobale={formData.remiseGlobale}
              onRemiseGlobaleChange={(v) => setFormData({ ...formData, remiseGlobale: v })}
            />
          </Card.Body>
          <Card.Footer className="bg-white text-end">
            <Button
              variant="secondary"
              className="me-2"
              onClick={() => navigate('/ventes/devis')}
            >
              Annuler
            </Button>
            <Button type="submit" variant="success" disabled={isCreating || isUpdating}>
              <FiSave className="me-2" />
              {isCreating || isUpdating
                ? 'Enregistrement...'
                : isEditMode
                ? 'Modifier'
                : 'Enregistrer'}
            </Button>
          </Card.Footer>
        </Card>
      </Form>
    </>
  );
};

export default DevisFormPage;
