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
import usePageTitle from '../../hooks/usePageTitle';
import {
  FournisseurSelect,
  LignesDocumentEditor,
  TotauxDocument,
  calculateLigne,
  LIGNE_VIDE,
} from '../../components/forms';
import {
  useGetCommandeAchatQuery,
  useCreateCommandeAchatMutation,
  useUpdateCommandeAchatMutation,
} from '../../redux/api/commandesAchatApi';

const CommandeAchatFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  usePageTitle(
    isEditMode ? 'Modifier la commande achat' : 'Nouvelle commande achat',
    [
      { label: 'Accueil', path: '/' },
      { label: 'Achats', path: '#' },
      { label: 'Commandes achat', path: '/achats/commandes' },
      { label: isEditMode ? 'Modifier' : 'Nouveau', path: '#' },
    ]
  );

  const { data: cmdData, isLoading: isLoadingCmd } = useGetCommandeAchatQuery(id, {
    skip: !isEditMode,
  });
  const [createCommandeAchat, { isLoading: isCreating }] = useCreateCommandeAchatMutation();
  const [updateCommandeAchat, { isLoading: isUpdating }] = useUpdateCommandeAchatMutation();

  const [formData, setFormData] = useState({
    fournisseur: '',
    dateCommande: new Date().toISOString().split('T')[0],
    dateReceptionPrevue: '',
    conditionsPaiement: '',
    notes: '',
    remiseGlobale: 0,
  });

  const [lignes, setLignes] = useState([{ ...LIGNE_VIDE }]);
  const [fournisseurError, setFournisseurError] = useState('');

  useEffect(() => {
    if (isEditMode && cmdData?.data) {
      const cmd = cmdData.data;
      setFormData({
        fournisseur: cmd.fournisseur?._id || '',
        dateCommande: cmd.dateCommande
          ? new Date(cmd.dateCommande).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        dateReceptionPrevue: cmd.dateReceptionPrevue
          ? new Date(cmd.dateReceptionPrevue).toISOString().split('T')[0]
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
  }, [isEditMode, cmdData]);

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

    if (!isEditMode && !formData.fournisseur) {
      setFournisseurError('Veuillez selectionner un fournisseur');
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
        await updateCommandeAchat({
          id,
          dateCommande: formData.dateCommande || undefined,
          dateReceptionPrevue: formData.dateReceptionPrevue || undefined,
          conditionsPaiement: formData.conditionsPaiement || undefined,
          notes: formData.notes || undefined,
          remiseGlobale: Number(formData.remiseGlobale),
          lignes: lignesPayload,
        }).unwrap();
        toast.success('Commande achat modifiee avec succes');
      } else {
        await createCommandeAchat({
          fournisseur: formData.fournisseur,
          dateCommande: formData.dateCommande || undefined,
          dateReceptionPrevue: formData.dateReceptionPrevue || undefined,
          conditionsPaiement: formData.conditionsPaiement || undefined,
          notes: formData.notes || undefined,
          remiseGlobale: Number(formData.remiseGlobale),
          lignes: lignesPayload,
        }).unwrap();
        toast.success('Commande achat creee avec succes');
      }
      navigate('/achats/commandes');
    } catch (err) {
      toast.error(err?.data?.message || "Erreur lors de l'enregistrement");
    }
  };

  if (isEditMode && isLoadingCmd) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2 text-muted">Chargement...</p>
      </div>
    );
  }

  const cmd = cmdData?.data;

  return (
    <>
      <div className="page-header d-flex justify-content-between align-items-center mb-4">
        <h1>{isEditMode ? 'Modifier la commande achat' : 'Nouvelle commande achat'}</h1>
        <Button variant="secondary" onClick={() => navigate('/achats/commandes')}>
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
                    <Form.Label>Fournisseur</Form.Label>
                    <Form.Control
                      type="text"
                      value={
                        cmd?.fournisseurSnapshot?.raisonSociale ||
                        cmd?.fournisseur?.raisonSociale ||
                        'N/A'
                      }
                      disabled
                    />
                    <Form.Text className="text-muted">
                      Le fournisseur ne peut pas etre modifie apres creation.
                    </Form.Text>
                  </Form.Group>
                ) : (
                  <FournisseurSelect
                    value={formData.fournisseur}
                    onChange={(fId) => {
                      setFormData({ ...formData, fournisseur: fId });
                      setFournisseurError('');
                    }}
                    error={fournisseurError}
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
                  <Form.Label>Date de reception prevue</Form.Label>
                  <Form.Control
                    type="date"
                    value={formData.dateReceptionPrevue}
                    onChange={(e) =>
                      setFormData({ ...formData, dateReceptionPrevue: e.target.value })
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
              label="Lignes de la commande achat"
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
              onClick={() => navigate('/achats/commandes')}
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

export default CommandeAchatFormPage;
