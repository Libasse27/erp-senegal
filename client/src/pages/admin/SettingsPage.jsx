import React, { useState } from 'react';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { FiSettings, FiSave } from 'react-icons/fi';
import { toast } from 'react-toastify';
import usePageTitle from '../../hooks/usePageTitle';

export default function SettingsPage() {
  usePageTitle('Parametres', [
    { label: 'Accueil', path: '/' },
    { label: 'Administration' },
    { label: 'Parametres' },
  ]);

  const [formData, setFormData] = useState({
    // Parametres generaux
    devise: 'XOF',
    tvaRate: 18,
    formatDate: 'dd/mm/yyyy',
    langue: 'fr',

    // Facturation
    prefixeFacture: 'FA',
    prefixeDevis: 'DV',
    prefixeCommande: 'CMD',
    prefixeBonLivraison: 'BL',
    prefixePaiement: 'PA',
    conditionsPaiement: 'Paiement a 30 jours net.\nPenalites de retard: 3x le taux d\'interet legal.\nIndemnite forfaitaire pour frais de recouvrement: 40 euros.',

    // Stock
    alerteStockMinimum: 10,
    methodeValorisationStock: 'FIFO',

    // Email
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    smtpUser: '',
    smtpPassword: '',
  });

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    toast.info('Fonctionnalite en cours de developpement');
  };

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
        <Card className="mb-3">
          <Card.Header>
            <h5 className="mb-0">Parametres Generaux</h5>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Devise</Form.Label>
                  <Form.Control type="text" value={formData.devise} readOnly disabled />
                  <Form.Text className="text-muted">
                    Franc CFA (XOF) - monnaie obligatoire pour le Senegal
                  </Form.Text>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Taux de TVA</Form.Label>
                  <Form.Control
                    type="text"
                    value={`${formData.tvaRate}%`}
                    readOnly
                    disabled
                  />
                  <Form.Text className="text-muted">
                    Taux normal de TVA au Senegal (18% ou 0% pour exonere)
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Format de Date</Form.Label>
                  <Form.Select
                    value={formData.formatDate}
                    onChange={(e) => handleChange('formatDate', e.target.value)}
                  >
                    <option value="dd/mm/yyyy">JJ/MM/AAAA</option>
                    <option value="mm/dd/yyyy">MM/JJ/AAAA</option>
                    <option value="yyyy-mm-dd">AAAA-MM-JJ</option>
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Langue</Form.Label>
                  <Form.Select
                    value={formData.langue}
                    onChange={(e) => handleChange('langue', e.target.value)}
                  >
                    <option value="fr">Francais</option>
                    <option value="en">Anglais</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        <Card className="mb-3">
          <Card.Header>
            <h5 className="mb-0">Parametres de Facturation</h5>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Prefixe Facture</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="FA"
                    value={formData.prefixeFacture}
                    onChange={(e) => handleChange('prefixeFacture', e.target.value)}
                  />
                  <Form.Text className="text-muted">Ex: FA-2026-001</Form.Text>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Prefixe Devis</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="DV"
                    value={formData.prefixeDevis}
                    onChange={(e) => handleChange('prefixeDevis', e.target.value)}
                  />
                  <Form.Text className="text-muted">Ex: DV-2026-001</Form.Text>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Prefixe Commande</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="CMD"
                    value={formData.prefixeCommande}
                    onChange={(e) => handleChange('prefixeCommande', e.target.value)}
                  />
                  <Form.Text className="text-muted">Ex: CMD-2026-001</Form.Text>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Prefixe Bon de Livraison</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="BL"
                    value={formData.prefixeBonLivraison}
                    onChange={(e) => handleChange('prefixeBonLivraison', e.target.value)}
                  />
                  <Form.Text className="text-muted">Ex: BL-2026-001</Form.Text>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Prefixe Paiement</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="PA"
                    value={formData.prefixePaiement}
                    onChange={(e) => handleChange('prefixePaiement', e.target.value)}
                  />
                  <Form.Text className="text-muted">Ex: PA-2026-001</Form.Text>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Conditions de Paiement par Defaut</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                placeholder="Conditions de paiement..."
                value={formData.conditionsPaiement}
                onChange={(e) => handleChange('conditionsPaiement', e.target.value)}
              />
              <Form.Text className="text-muted">
                Ces conditions apparaitront sur les factures et devis
              </Form.Text>
            </Form.Group>
          </Card.Body>
        </Card>

        <Card className="mb-3">
          <Card.Header>
            <h5 className="mb-0">Parametres de Stock</h5>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Seuil d'Alerte Stock Minimum</Form.Label>
                  <Form.Control
                    type="number"
                    placeholder="10"
                    value={formData.alerteStockMinimum}
                    onChange={(e) => handleChange('alerteStockMinimum', parseInt(e.target.value))}
                  />
                  <Form.Text className="text-muted">
                    Quantite en dessous de laquelle une alerte est declenchee
                  </Form.Text>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Methode de Valorisation du Stock</Form.Label>
                  <Form.Select
                    value={formData.methodeValorisationStock}
                    onChange={(e) => handleChange('methodeValorisationStock', e.target.value)}
                  >
                    <option value="FIFO">FIFO (Premier Entre, Premier Sorti)</option>
                    <option value="CUMP">CUMP (Cout Unitaire Moyen Pondere)</option>
                    <option value="PMP">PMP (Prix Moyen Pondere)</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        <Card className="mb-3">
          <Card.Header>
            <h5 className="mb-0">Configuration Email (SMTP)</h5>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Serveur SMTP</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="smtp.gmail.com"
                    value={formData.smtpHost}
                    onChange={(e) => handleChange('smtpHost', e.target.value)}
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Port SMTP</Form.Label>
                  <Form.Control
                    type="number"
                    placeholder="587"
                    value={formData.smtpPort}
                    onChange={(e) => handleChange('smtpPort', parseInt(e.target.value))}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Utilisateur SMTP</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="votre-email@exemple.com"
                    value={formData.smtpUser}
                    onChange={(e) => handleChange('smtpUser', e.target.value)}
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Mot de Passe SMTP</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Mot de passe ou cle API"
                    value={formData.smtpPassword}
                    onChange={(e) => handleChange('smtpPassword', e.target.value)}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        <div className="d-flex justify-content-end">
          <Button variant="primary" type="submit">
            <FiSave className="me-2" />
            Enregistrer les Parametres
          </Button>
        </div>
      </Form>
    </div>
  );
}
