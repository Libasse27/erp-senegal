import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Table from 'react-bootstrap/Table';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import { FiPlus, FiTrash2, FiSave } from 'react-icons/fi';
import { toast } from 'react-toastify';
import usePageTitle from '../../../hooks/usePageTitle';
import { formatMoney } from '../../../utils/formatters';
import {
  useGetDevisByIdQuery,
  useCreateDevisMutation,
  useUpdateDevisMutation,
} from '../../../redux/api/devisApi';
import { useGetClientsQuery } from '../../../redux/api/clientsApi';
import { useGetProductsQuery } from '../../../redux/api/productsApi';

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
  const { data: clientsData } = useGetClientsQuery({ limit: 1000, isActive: true });
  const { data: productsData } = useGetProductsQuery({ limit: 1000, isActive: true });
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

  const [lignes, setLignes] = useState([
    { product: '', designation: '', quantite: 1, prixUnitaire: 0, remise: 0, tauxTVA: 18 },
  ]);

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

  const addLigne = () => {
    setLignes([
      ...lignes,
      { product: '', designation: '', quantite: 1, prixUnitaire: 0, remise: 0, tauxTVA: 18 },
    ]);
  };

  const removeLigne = (index) => {
    setLignes(lignes.filter((_, i) => i !== index));
  };

  const updateLigne = (index, field, value) => {
    const updated = [...lignes];
    updated[index] = { ...updated[index], [field]: value };

    if (field === 'product' && value) {
      const product = productsData?.data?.find((p) => p._id === value);
      if (product) {
        updated[index].designation = product.nom;
        updated[index].prixUnitaire = product.prixVente || 0;
      }
    }

    setLignes(updated);
  };

  const calculateLigne = (l) => {
    const ht = Math.round(l.quantite * l.prixUnitaire * (1 - l.remise / 100));
    const tva = Math.round((ht * l.tauxTVA) / 100);
    return { ht, tva, ttc: ht + tva };
  };

  const calculateTotals = () => {
    const totalHT = lignes.reduce((sum, l) => sum + calculateLigne(l).ht, 0);
    const remiseGlobaleAmount = Math.round((totalHT * formData.remiseGlobale) / 100);
    const totalHTApresRemise = totalHT - remiseGlobaleAmount;
    const totalTVA = lignes.reduce((sum, l) => {
      const ligne = calculateLigne(l);
      const htLigne = Math.round((ligne.ht * (100 - formData.remiseGlobale)) / 100);
      return sum + Math.round((htLigne * l.tauxTVA) / 100);
    }, 0);
    const totalTTC = totalHTApresRemise + totalTVA;

    return { totalHT, remiseGlobaleAmount, totalHTApresRemise, totalTVA, totalTTC };
  };

  const totals = calculateTotals();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.client) {
      toast.error('Veuillez selectionner un client');
      return;
    }

    if (lignes.length === 0 || lignes.some((l) => !l.designation || l.quantite <= 0)) {
      toast.error('Veuillez ajouter au moins une ligne valide');
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
      toast.error(err?.data?.message || 'Erreur lors de l\'enregistrement');
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

  const clients = clientsData?.data || [];
  const products = productsData?.data || [];

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
                <Form.Group className="mb-3">
                  <Form.Label>
                    Client <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Select
                    required
                    value={formData.client}
                    onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                  >
                    <option value="">Selectionner un client</option>
                    {clients.map((client) => (
                      <option key={client._id} value={client._id}>
                        {client.nom} - {client.email}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
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
          <Card.Header className="bg-white d-flex justify-content-between align-items-center">
            <h6 className="mb-0">Lignes du devis</h6>
            <Button variant="primary" size="sm" onClick={addLigne}>
              <FiPlus className="me-1" />
              Ajouter une ligne
            </Button>
          </Card.Header>
          <Card.Body className="p-0">
            <Table responsive className="mb-0">
              <thead className="table-light">
                <tr>
                  <th style={{ width: '20%' }}>Produit</th>
                  <th style={{ width: '25%' }}>Designation</th>
                  <th style={{ width: '10%' }}>Quantite</th>
                  <th style={{ width: '12%' }}>Prix unit.</th>
                  <th style={{ width: '8%' }}>Remise %</th>
                  <th style={{ width: '8%' }}>TVA %</th>
                  <th style={{ width: '12%' }} className="text-end">
                    Total TTC
                  </th>
                  <th style={{ width: '5%' }}></th>
                </tr>
              </thead>
              <tbody>
                {lignes.map((ligne, index) => {
                  const calc = calculateLigne(ligne);
                  return (
                    <tr key={index}>
                      <td>
                        <Form.Select
                          size="sm"
                          value={ligne.product}
                          onChange={(e) => updateLigne(index, 'product', e.target.value)}
                        >
                          <option value="">Aucun</option>
                          {products.map((product) => (
                            <option key={product._id} value={product._id}>
                              {product.reference} - {product.nom}
                            </option>
                          ))}
                        </Form.Select>
                      </td>
                      <td>
                        <Form.Control
                          size="sm"
                          type="text"
                          required
                          value={ligne.designation}
                          onChange={(e) => updateLigne(index, 'designation', e.target.value)}
                          placeholder="Description"
                        />
                      </td>
                      <td>
                        <Form.Control
                          size="sm"
                          type="number"
                          min="1"
                          required
                          value={ligne.quantite}
                          onChange={(e) => updateLigne(index, 'quantite', e.target.value)}
                        />
                      </td>
                      <td>
                        <Form.Control
                          size="sm"
                          type="number"
                          min="0"
                          required
                          value={ligne.prixUnitaire}
                          onChange={(e) => updateLigne(index, 'prixUnitaire', e.target.value)}
                        />
                      </td>
                      <td>
                        <Form.Control
                          size="sm"
                          type="number"
                          min="0"
                          max="100"
                          value={ligne.remise}
                          onChange={(e) => updateLigne(index, 'remise', e.target.value)}
                        />
                      </td>
                      <td>
                        <Form.Select
                          size="sm"
                          value={ligne.tauxTVA}
                          onChange={(e) => updateLigne(index, 'tauxTVA', e.target.value)}
                        >
                          <option value="0">0%</option>
                          <option value="18">18%</option>
                        </Form.Select>
                      </td>
                      <td className="text-end">
                        <strong>{formatMoney(calc.ttc)}</strong>
                      </td>
                      <td className="text-center">
                        <Button
                          variant="link"
                          size="sm"
                          className="p-0 text-danger"
                          onClick={() => removeLigne(index)}
                          disabled={lignes.length === 1}
                        >
                          <FiTrash2 size={16} />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </Card.Body>
        </Card>

        <Card className="shadow-sm mb-4">
          <Card.Header className="bg-white">
            <h6 className="mb-0">Totaux</h6>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col md={8}></Col>
              <Col md={4}>
                <div className="d-flex justify-content-between mb-2">
                  <span>Total HT:</span>
                  <strong>{formatMoney(totals.totalHT)}</strong>
                </div>
                <div className="d-flex justify-content-between mb-2 align-items-center">
                  <div>
                    <span>Remise globale:</span>
                    <Form.Control
                      type="number"
                      min="0"
                      max="100"
                      size="sm"
                      className="d-inline-block ms-2"
                      style={{ width: '80px' }}
                      value={formData.remiseGlobale}
                      onChange={(e) =>
                        setFormData({ ...formData, remiseGlobale: Number(e.target.value) })
                      }
                    />
                    <span className="ms-1">%</span>
                  </div>
                  <strong>-{formatMoney(totals.remiseGlobaleAmount)}</strong>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span>Total TVA:</span>
                  <strong>{formatMoney(totals.totalTVA)}</strong>
                </div>
                <hr />
                <div className="d-flex justify-content-between">
                  <strong>Total TTC:</strong>
                  <h5 className="text-primary mb-0">{formatMoney(totals.totalTTC)}</h5>
                </div>
              </Col>
            </Row>
          </Card.Body>
          <Card.Footer className="bg-white text-end">
            <Button variant="secondary" className="me-2" onClick={() => navigate('/ventes/devis')}>
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

export default DevisFormPage;
