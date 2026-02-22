import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import { FiSave, FiArrowLeft } from 'react-icons/fi';
import { toast } from 'react-toastify';
import usePageTitle from '../../hooks/usePageTitle';
import {
  useGetPaymentQuery,
  useCreatePaymentMutation,
  useUpdatePaymentMutation,
} from '../../redux/api/paymentsApi';
import { useGetClientsQuery } from '../../redux/api/clientsApi';
import { useGetFournisseursQuery } from '../../redux/api/fournisseursApi';
import { useGetBankAccountsQuery } from '../../redux/api/bankAccountsApi';

const PaymentFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  usePageTitle(
    isEditing ? 'Modifier Paiement' : 'Nouveau Paiement',
    [
      { label: 'Accueil', path: '/' },
      { label: 'Paiements', path: '/paiements' },
      { label: isEditing ? 'Modifier' : 'Nouveau' },
    ]
  );

  const { data: paymentData, isLoading: isLoadingPayment } = useGetPaymentQuery(id, {
    skip: !isEditing,
  });
  const { data: clientsData } = useGetClientsQuery({ limit: 1000 });
  const { data: fournisseursData } = useGetFournisseursQuery({ limit: 1000 });
  const { data: bankAccountsData } = useGetBankAccountsQuery({ limit: 100 });

  const [createPayment, { isLoading: isCreating }] = useCreatePaymentMutation();
  const [updatePayment, { isLoading: isUpdating }] = useUpdatePaymentMutation();

  const [formData, setFormData] = useState({
    typePaiement: 'client',
    client: '',
    fournisseur: '',
    modePaiement: 'especes',
    montant: '',
    datePaiement: new Date().toISOString().split('T')[0],
    facture: '',
    compteBancaire: '',
    detailsCheque: {
      numeroCheque: '',
      banque: '',
      dateEncaissement: '',
    },
    detailsMobileMoney: {
      numeroTransaction: '',
      telephone: '',
    },
    detailsVirement: {
      numeroVirement: '',
      banqueEmettrice: '',
    },
    notes: '',
  });

  useEffect(() => {
    if (isEditing && paymentData?.data) {
      const payment = paymentData.data;
      setFormData({
        typePaiement: payment.typePaiement,
        client: payment.client?._id || '',
        fournisseur: payment.fournisseur?._id || '',
        modePaiement: payment.modePaiement,
        montant: payment.montant,
        datePaiement: payment.datePaiement?.split('T')[0] || '',
        facture: payment.facture?._id || '',
        compteBancaire: payment.compteBancaire?._id || '',
        detailsCheque: payment.detailsCheque || {
          numeroCheque: '',
          banque: '',
          dateEncaissement: '',
        },
        detailsMobileMoney: payment.detailsMobileMoney || {
          numeroTransaction: '',
          telephone: '',
        },
        detailsVirement: payment.detailsVirement || {
          numeroVirement: '',
          banqueEmettrice: '',
        },
        notes: payment.notes || '',
      });
    }
  }, [isEditing, paymentData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleNestedChange = (section, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.montant || formData.montant <= 0) {
      toast.error('Le montant doit etre superieur a 0');
      return;
    }

    if (formData.typePaiement === 'client' && !formData.client) {
      toast.error('Veuillez selectionner un client');
      return;
    }

    if (formData.typePaiement === 'fournisseur' && !formData.fournisseur) {
      toast.error('Veuillez selectionner un fournisseur');
      return;
    }

    if (['cheque', 'virement'].includes(formData.modePaiement) && !formData.compteBancaire) {
      toast.error('Veuillez selectionner un compte bancaire');
      return;
    }

    const payload = {
      typePaiement: formData.typePaiement,
      modePaiement: formData.modePaiement,
      montant: parseInt(formData.montant),
      datePaiement: formData.datePaiement,
      notes: formData.notes,
    };

    if (formData.typePaiement === 'client') {
      payload.client = formData.client;
    } else {
      payload.fournisseur = formData.fournisseur;
    }

    if (formData.facture) {
      payload.facture = formData.facture;
    }

    if (formData.compteBancaire) {
      payload.compteBancaire = formData.compteBancaire;
    }

    if (formData.modePaiement === 'cheque') {
      payload.detailsCheque = formData.detailsCheque;
    } else if (['orange_money', 'wave'].includes(formData.modePaiement)) {
      payload.detailsMobileMoney = formData.detailsMobileMoney;
    } else if (formData.modePaiement === 'virement') {
      payload.detailsVirement = formData.detailsVirement;
    }

    try {
      if (isEditing) {
        await updatePayment({ id, data: payload }).unwrap();
        toast.success('Paiement modifie avec succes');
      } else {
        await createPayment(payload).unwrap();
        toast.success('Paiement cree avec succes');
      }
      navigate('/paiements');
    } catch (err) {
      toast.error(err.data?.message || 'Erreur lors de l\'enregistrement');
    }
  };

  if (isEditing && isLoadingPayment) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2 text-muted">Chargement...</p>
      </div>
    );
  }

  const clients = clientsData?.data || [];
  const fournisseurs = fournisseursData?.data || [];
  const bankAccounts = bankAccountsData?.data || [];

  return (
    <>
      <div className="page-header">
        <div>
          <Button
            variant="outline-secondary"
            onClick={() => navigate('/paiements')}
            className="mb-2"
          >
            <FiArrowLeft className="me-2" />
            Retour
          </Button>
          <h1>{isEditing ? 'Modifier Paiement' : 'Nouveau Paiement'}</h1>
        </div>
      </div>

      <Card className="shadow-sm">
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Type de Paiement *</Form.Label>
                  <Form.Select
                    name="typePaiement"
                    value={formData.typePaiement}
                    onChange={handleChange}
                    required
                  >
                    <option value="client">Paiement Client</option>
                    <option value="fournisseur">Paiement Fournisseur</option>
                  </Form.Select>
                </Form.Group>
              </Col>

              {formData.typePaiement === 'client' ? (
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Client *</Form.Label>
                    <Form.Select
                      name="client"
                      value={formData.client}
                      onChange={handleChange}
                      required
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
                  </Form.Group>
                </Col>
              ) : (
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Fournisseur *</Form.Label>
                    <Form.Select
                      name="fournisseur"
                      value={formData.fournisseur}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Selectionner un fournisseur</option>
                      {fournisseurs.map((fournisseur) => (
                        <option key={fournisseur._id} value={fournisseur._id}>
                          {fournisseur.nom}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
              )}

              <Col md={4}>
                <Form.Group>
                  <Form.Label>Mode de Paiement *</Form.Label>
                  <Form.Select
                    name="modePaiement"
                    value={formData.modePaiement}
                    onChange={handleChange}
                    required
                  >
                    <option value="especes">Especes</option>
                    <option value="cheque">Cheque</option>
                    <option value="virement">Virement</option>
                    <option value="orange_money">Orange Money</option>
                    <option value="wave">Wave</option>
                    <option value="carte_bancaire">Carte bancaire</option>
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group>
                  <Form.Label>Montant (FCFA) *</Form.Label>
                  <Form.Control
                    type="number"
                    name="montant"
                    value={formData.montant}
                    onChange={handleChange}
                    required
                    min="0"
                  />
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group>
                  <Form.Label>Date de Paiement *</Form.Label>
                  <Form.Control
                    type="date"
                    name="datePaiement"
                    value={formData.datePaiement}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>

              {['cheque', 'virement'].includes(formData.modePaiement) && (
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Compte Bancaire *</Form.Label>
                    <Form.Select
                      name="compteBancaire"
                      value={formData.compteBancaire}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Selectionner un compte</option>
                      {bankAccounts.map((account) => (
                        <option key={account._id} value={account._id}>
                          {account.nom} - {account.numeroCompte}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
              )}

              {formData.modePaiement === 'cheque' && (
                <>
                  <Col md={12}>
                    <hr />
                    <h5>Details du Cheque</h5>
                  </Col>
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label>Numero Cheque</Form.Label>
                      <Form.Control
                        type="text"
                        value={formData.detailsCheque.numeroCheque}
                        onChange={(e) =>
                          handleNestedChange('detailsCheque', 'numeroCheque', e.target.value)
                        }
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label>Banque</Form.Label>
                      <Form.Control
                        type="text"
                        value={formData.detailsCheque.banque}
                        onChange={(e) =>
                          handleNestedChange('detailsCheque', 'banque', e.target.value)
                        }
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label>Date Encaissement</Form.Label>
                      <Form.Control
                        type="date"
                        value={formData.detailsCheque.dateEncaissement}
                        onChange={(e) =>
                          handleNestedChange('detailsCheque', 'dateEncaissement', e.target.value)
                        }
                      />
                    </Form.Group>
                  </Col>
                </>
              )}

              {['orange_money', 'wave'].includes(formData.modePaiement) && (
                <>
                  <Col md={12}>
                    <hr />
                    <h5>Details Mobile Money</h5>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Numero Transaction</Form.Label>
                      <Form.Control
                        type="text"
                        value={formData.detailsMobileMoney.numeroTransaction}
                        onChange={(e) =>
                          handleNestedChange('detailsMobileMoney', 'numeroTransaction', e.target.value)
                        }
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Telephone</Form.Label>
                      <Form.Control
                        type="text"
                        value={formData.detailsMobileMoney.telephone}
                        onChange={(e) =>
                          handleNestedChange('detailsMobileMoney', 'telephone', e.target.value)
                        }
                      />
                    </Form.Group>
                  </Col>
                </>
              )}

              {formData.modePaiement === 'virement' && (
                <>
                  <Col md={12}>
                    <hr />
                    <h5>Details du Virement</h5>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Numero Virement</Form.Label>
                      <Form.Control
                        type="text"
                        value={formData.detailsVirement.numeroVirement}
                        onChange={(e) =>
                          handleNestedChange('detailsVirement', 'numeroVirement', e.target.value)
                        }
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Banque Emettrice</Form.Label>
                      <Form.Control
                        type="text"
                        value={formData.detailsVirement.banqueEmettrice}
                        onChange={(e) =>
                          handleNestedChange('detailsVirement', 'banqueEmettrice', e.target.value)
                        }
                      />
                    </Form.Group>
                  </Col>
                </>
              )}

              <Col md={12}>
                <Form.Group>
                  <Form.Label>Notes</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
            </Row>

            <div className="mt-4 d-flex gap-2">
              <Button
                type="submit"
                variant="primary"
                disabled={isCreating || isUpdating}
                className="d-flex align-items-center gap-2"
              >
                {isCreating || isUpdating ? (
                  <>
                    <Spinner animation="border" size="sm" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <FiSave size={18} />
                    Enregistrer
                  </>
                )}
              </Button>
              <Button variant="outline-secondary" onClick={() => navigate('/paiements')}>
                Annuler
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </>
  );
};

export default PaymentFormPage;
