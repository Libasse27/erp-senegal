import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
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
  useGetCommandeQuery,
  useCreateCommandeMutation,
  useUpdateCommandeMutation,
} from '../../../redux/api/commandesApi';

const CommandeFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  usePageTitle(
    isEditMode ? 'Modifier la commande' : 'Nouvelle commande',
    [
      { label: 'Accueil', path: '/' },
      { label: 'Ventes', path: '#' },
      { label: 'Commandes', path: '/ventes/commandes' },
      { label: isEditMode ? 'Modifier' : 'Nouveau', path: '#' },
    ]
  );

  const { data: commandeData, isLoading: isLoadingCommande } = useGetCommandeQuery(id, {
    skip: !isEditMode,
  });
  const [createCommande, { isLoading: isCreating }] = useCreateCommandeMutation();
  const [updateCommande, { isLoading: isUpdating }] = useUpdateCommandeMutation();

  const [formData, setFormData] = useState({
    client: '',
    dateCommande: new Date().toISOString().split('T')[0],
    dateLivraisonPrevue: '',
    conditionsPaiement: '',
    notes: '',
    remiseGlobale: 0,
  });

  const [lignes, setLignes] = useState([{ ...LIGNE_VIDE }]);
  const [clientError, setClientError] = useState('');

  useEffect(() => {
    if (isEditMode && commandeData?.data) {
      const cmd = commandeData.data;
      setFormData({
        client: cmd.client?._id || '',
        dateCommande: cmd.dateCommande
          ? new Date(cmd.dateCommande).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        dateLivraisonPrevue: cmd.dateLivraisonPrevue
          ? new Date(cmd.dateLivraisonPrevue).toISOString().split('T')[0]
          : '',
        conditionsPaiement: cmd.conditionsPaiement || '',
        notes: cmd.notes || '',
        remiseGlobale: cmd.remiseGlobale || 0,
      });
      if (cmd.lignes?.length > 0) {
        setLignes(
          cmd.lignes.map((l) => ({
            product: l.product?._id || l.product || '',
            designation: l.designation || '',
            quantite: l.quantite || 1,
            prixUnitaire: l.prixUnitaire || 0,
            remise: l.remise || 0,
            tauxTVA: l.tauxTVA || 18,
          }))
        );
      }
    }
  }, [isEditMode, commandeData]);

  const calculateTotals = () => {
    const totalHT = lignes.reduce((sum, l) => sum + calculateLigne(l).ht, 0);
    const remiseGlobaleAmount = Math.round((totalHT * formData.remiseGlobale) / 100);
    const totalHTApresRemise = totalHT - remiseGlobaleAmount;
    const totalTVA = lignes.reduce((sum, l) => {
      const { ht } = calculateLigne(l);
      const htApresRemise = Math.round((ht * (100 - formData.remiseGlobale)) / 100);
      return sum + Math.round((htApresRemise * Number(l.tauxTVA)) / 100);
    }, 0);
    return {
      totalHT,
      remiseGlobaleAmount,
      totalHTApresRemise,
      totalTVA,
      totalTTC: totalHTApresRemise + totalTVA,
    };
  };

  const totals = calculateTotals();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isEditMode && !formData.client) {
      setClientError('Veuillez selectionner un client');
      return;
    }

    if (lignes.some((l) => !l.product)) {
      toast.error('Veuillez selectionner un produit pour chaque ligne');
      return;
    }

    if (lignes.some((l) => !l.designation || Number(l.quantite) <= 0)) {
      toast.error('Veuillez remplir toutes les lignes correctement');
      return;
    }

    const lignesPayload = lignes.map((l) => ({
      product: l.product,
      designation: l.designation,
      quantite: Number(l.quantite),
      prixUnitaire: Number(l.prixUnitaire),
      remise: Number(l.remise),
      tauxTVA: Number(l.tauxTVA),
    }));

    try {
      if (isEditMode) {
        const payload = {
          dateCommande: formData.dateCommande || undefined,
          dateLivraisonPrevue: formData.dateLivraisonPrevue || undefined,
          conditionsPaiement: formData.conditionsPaiement || undefined,
          notes: formData.notes || undefined,
          remiseGlobale: Number(formData.remiseGlobale),
          lignes: lignesPayload,
        };
        await updateCommande({ id, ...payload }).unwrap();
        toast.success('Commande modifiee avec succes');
      } else {
        const payload = {
          client: formData.client,
          dateCommande: formData.dateCommande || undefined,
          dateLivraisonPrevue: formData.dateLivraisonPrevue || undefined,
          conditionsPaiement: formData.conditionsPaiement || undefined,
          notes: formData.notes || undefined,
          remiseGlobale: Number(formData.remiseGlobale),
          lignes: lignesPayload,
        };
        await createCommande(payload).unwrap();
        toast.success('Commande creee avec succes');
      }
      navigate('/ventes/commandes');
    } catch (err) {
      toast.error(err?.data?.message || "Erreur lors de l'enregistrement");
    }
  };

  if (isEditMode && isLoadingCommande) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2 text-muted">Chargement de la commande...</p>
      </div>
    );
  }

  const commande = commandeData?.data;

  return (
    <>
      <div className="page-header d-flex justify-content-between align-items-center mb-4">
        <h1>{isEditMode ? 'Modifier la commande' : 'Nouvelle commande'}</h1>
        <Button variant="secondary" onClick={() => navigate('/ventes/commandes')}>
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
                {isEditMode ? (
                  <Form.Group>
                    <Form.Label>Client</Form.Label>
                    <Form.Control
                      type="text"
                      value={
                        commande?.clientSnapshot?.displayName ||
                        commande?.client?.nom ||
                        'N/A'
                      }
                      disabled
                    />
                    <Form.Text className="text-muted">
                      Le client ne peut pas etre modifie apres creation.
                    </Form.Text>
                  </Form.Group>
                ) : (
                  <ClientSelect
                    value={formData.client}
                    onChange={(clientId) => {
                      setFormData({ ...formData, client: clientId });
                      setClientError('');
                    }}
                    error={clientError}
                  />
                )}
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Date de commande</Form.Label>
                  <Form.Control
                    type="date"
                    value={formData.dateCommande}
                    onChange={(e) =>
                      setFormData({ ...formData, dateCommande: e.target.value })
                    }
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Date de livraison prevue</Form.Label>
                  <Form.Control
                    type="date"
                    value={formData.dateLivraisonPrevue}
                    onChange={(e) =>
                      setFormData({ ...formData, dateLivraisonPrevue: e.target.value })
                    }
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
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
                <Form.Group>
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
              label="Lignes de la commande"
              requireProduct
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
              onRemiseGlobaleChange={(v) =>
                setFormData({ ...formData, remiseGlobale: v })
              }
            />
          </Card.Body>
          <Card.Footer className="bg-white text-end">
            <Button
              variant="outline-secondary"
              className="me-2"
              onClick={() => navigate('/ventes/commandes')}
            >
              <FiX className="me-1" />
              Annuler
            </Button>
            <Button
              type="submit"
              variant="success"
              disabled={isCreating || isUpdating}
            >
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

export default CommandeFormPage;
