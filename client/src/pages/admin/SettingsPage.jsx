import React, { useState, useEffect } from 'react';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Spinner from 'react-bootstrap/Spinner';
import { FiSettings, FiSave } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { useGetSettingsQuery, useUpdateSettingsMutation } from '../../redux/api/settingsApi';
import usePageTitle from '../../hooks/usePageTitle';

export default function SettingsPage() {
  usePageTitle('Parametres', [
    { label: 'Accueil', path: '/' },
    { label: 'Administration' },
    { label: 'Parametres' },
  ]);

  const { data, isLoading } = useGetSettingsQuery();
  const [updateSettings, { isLoading: isSaving }] = useUpdateSettingsMutation();

  const [formData, setFormData] = useState({
    // Numerotation
    prefixeFacture: 'FA',
    prefixeDevis: 'DE',
    prefixeCommande: 'CM',
    prefixeBonLivraison: 'BL',
    prefixePaiement: 'PA',
    // General
    defaultPaymentTermDays: 30,
    dateFormat: 'DD/MM/YYYY',
    language: 'fr',
    // Email notifications
    onInvoiceCreated: true,
    onPaymentReceived: true,
    onQuoteAccepted: true,
    onLowStock: true,
  });

  useEffect(() => {
    if (data?.data) {
      const s = data.data;
      setFormData({
        prefixeFacture: s.numbering?.invoice?.prefix ?? 'FA',
        prefixeDevis: s.numbering?.quote?.prefix ?? 'DE',
        prefixeCommande: s.numbering?.salesOrder?.prefix ?? 'CM',
        prefixeBonLivraison: s.numbering?.deliveryNote?.prefix ?? 'BL',
        prefixePaiement: s.numbering?.payment?.prefix ?? 'PA',
        defaultPaymentTermDays: s.general?.defaultPaymentTermDays ?? 30,
        dateFormat: s.general?.dateFormat ?? 'DD/MM/YYYY',
        language: s.general?.language ?? 'fr',
        onInvoiceCreated: s.emailNotifications?.onInvoiceCreated ?? true,
        onPaymentReceived: s.emailNotifications?.onPaymentReceived ?? true,
        onQuoteAccepted: s.emailNotifications?.onQuoteAccepted ?? true,
        onLowStock: s.emailNotifications?.onLowStock ?? true,
      });
    }
  }, [data]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateSettings({
        numbering: {
          invoice: { prefix: formData.prefixeFacture },
          quote: { prefix: formData.prefixeDevis },
          salesOrder: { prefix: formData.prefixeCommande },
          deliveryNote: { prefix: formData.prefixeBonLivraison },
          payment: { prefix: formData.prefixePaiement },
        },
        general: {
          defaultPaymentTermDays: Number(formData.defaultPaymentTermDays),
          dateFormat: formData.dateFormat,
          language: formData.language,
        },
        emailNotifications: {
          onInvoiceCreated: formData.onInvoiceCreated,
          onPaymentReceived: formData.onPaymentReceived,
          onQuoteAccepted: formData.onQuoteAccepted,
          onLowStock: formData.onLowStock,
        },
      }).unwrap();
      toast.success('Parametres enregistres avec succes');
    } catch (err) {
      toast.error(err?.data?.message || 'Erreur lors de la sauvegarde');
    }
  };

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 300 }}>
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  return (
    <div className="settings-page">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">
            <FiSettings className="me-2" />
            Parametres
          </h2>
          <p className="text-muted mb-0">Configuration generale de l'application</p>
        </div>
      </div>

      <Form onSubmit={handleSubmit}>
        {/* Parametres Generaux */}
        <Card className="mb-3">
          <Card.Header>
            <h5 className="mb-0">Parametres Generaux</h5>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Devise</Form.Label>
                  <Form.Control type="text" value="XOF" readOnly disabled />
                  <Form.Text className="text-muted">
                    Franc CFA (XOF) — monnaie obligatoire pour le Senegal
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Taux de TVA</Form.Label>
                  <Form.Control type="text" value="18%" readOnly disabled />
                  <Form.Text className="text-muted">
                    Taux normal de TVA au Senegal (18% ou 0% pour exonere)
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Delai de paiement par defaut (jours)</Form.Label>
                  <Form.Control
                    type="number"
                    min={0}
                    value={formData.defaultPaymentTermDays}
                    onChange={(e) => handleChange('defaultPaymentTermDays', e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Format de Date</Form.Label>
                  <Form.Select
                    value={formData.dateFormat}
                    onChange={(e) => handleChange('dateFormat', e.target.value)}
                  >
                    <option value="DD/MM/YYYY">JJ/MM/AAAA</option>
                    <option value="MM/DD/YYYY">MM/JJ/AAAA</option>
                    <option value="YYYY-MM-DD">AAAA-MM-JJ</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Langue</Form.Label>
                  <Form.Select
                    value={formData.language}
                    onChange={(e) => handleChange('language', e.target.value)}
                  >
                    <option value="fr">Francais</option>
                    <option value="en">Anglais</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Numerotation des Documents */}
        <Card className="mb-3">
          <Card.Header>
            <h5 className="mb-0">Numerotation des Documents</h5>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Prefixe Facture</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.prefixeFacture}
                    onChange={(e) => handleChange('prefixeFacture', e.target.value)}
                    placeholder="FA"
                  />
                  <Form.Text className="text-muted">Ex : FA-2026-001</Form.Text>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Prefixe Devis</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.prefixeDevis}
                    onChange={(e) => handleChange('prefixeDevis', e.target.value)}
                    placeholder="DE"
                  />
                  <Form.Text className="text-muted">Ex : DE-2026-001</Form.Text>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Prefixe Commande</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.prefixeCommande}
                    onChange={(e) => handleChange('prefixeCommande', e.target.value)}
                    placeholder="CM"
                  />
                  <Form.Text className="text-muted">Ex : CM-2026-001</Form.Text>
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Prefixe Bon de Livraison</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.prefixeBonLivraison}
                    onChange={(e) => handleChange('prefixeBonLivraison', e.target.value)}
                    placeholder="BL"
                  />
                  <Form.Text className="text-muted">Ex : BL-2026-001</Form.Text>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Prefixe Paiement</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.prefixePaiement}
                    onChange={(e) => handleChange('prefixePaiement', e.target.value)}
                    placeholder="PA"
                  />
                  <Form.Text className="text-muted">Ex : PA-2026-001</Form.Text>
                </Form.Group>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Notifications Email */}
        <Card className="mb-3">
          <Card.Header>
            <h5 className="mb-0">Notifications Email</h5>
          </Card.Header>
          <Card.Body>
            <Form.Check
              type="switch"
              id="notif-invoice"
              label="Notification a la creation d'une facture"
              checked={formData.onInvoiceCreated}
              onChange={(e) => handleChange('onInvoiceCreated', e.target.checked)}
              className="mb-2"
            />
            <Form.Check
              type="switch"
              id="notif-payment"
              label="Notification a la reception d'un paiement"
              checked={formData.onPaymentReceived}
              onChange={(e) => handleChange('onPaymentReceived', e.target.checked)}
              className="mb-2"
            />
            <Form.Check
              type="switch"
              id="notif-quote"
              label="Notification a l'acceptation d'un devis"
              checked={formData.onQuoteAccepted}
              onChange={(e) => handleChange('onQuoteAccepted', e.target.checked)}
              className="mb-2"
            />
            <Form.Check
              type="switch"
              id="notif-stock"
              label="Notification de stock bas"
              checked={formData.onLowStock}
              onChange={(e) => handleChange('onLowStock', e.target.checked)}
            />
          </Card.Body>
        </Card>

        <div className="d-flex justify-content-end">
          <Button variant="primary" type="submit" disabled={isSaving}>
            {isSaving ? (
              <><Spinner size="sm" className="me-2" />Enregistrement...</>
            ) : (
              <><FiSave className="me-2" />Enregistrer les Parametres</>
            )}
          </Button>
        </div>
      </Form>
    </div>
  );
}
