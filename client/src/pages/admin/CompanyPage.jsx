import React, { useState } from 'react';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { FiSave, FiUpload } from 'react-icons/fi';
import { toast } from 'react-toastify';
import usePageTitle from '../../hooks/usePageTitle';
import { LEGAL_FORMS } from '../../utils/constants';

export default function CompanyPage() {
  usePageTitle('Entreprise', [
    { label: 'Accueil', path: '/' },
    { label: 'Administration' },
    { label: 'Entreprise' },
  ]);

  const [formData, setFormData] = useState({
    // Informations generales
    raisonSociale: 'ERP COMMERCIAL & COMPTABLE SENEGAL',
    formeJuridique: 'SARL',
    activitePrincipale: 'Commerce et services',

    // Identifiants fiscaux
    ninea: '',
    rccm: '',

    // Contacts
    telephone: '+221 33 123 45 67',
    email: 'contact@erp-senegal.com',
    siteWeb: 'www.erp-senegal.com',

    // Adresse
    street: '123 Avenue Cheikh Anta Diop',
    city: 'Dakar',
    region: 'Dakar',
    postalCode: '12000',
    country: 'Senegal',

    // Logo
    logo: null,
  });

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Pour l'instant, on stocke juste le nom du fichier
      // Dans une vraie implementation, on uploadera le fichier
      setFormData((prev) => ({ ...prev, logo: file }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    toast.info('Fonctionnalite en cours de developpement');
  };

  return (
    <div className="company-page">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">Informations Entreprise</h2>
          <p className="text-muted mb-0">Parametres et informations de votre entreprise</p>
        </div>
      </div>

      <Form onSubmit={handleSubmit}>
        <Card className="mb-3">
          <Card.Header>
            <h5 className="mb-0">Informations Generales</h5>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col md={8}>
                <Form.Group className="mb-3">
                  <Form.Label>Raison Sociale</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Nom de l'entreprise"
                    value={formData.raisonSociale}
                    onChange={(e) => handleChange('raisonSociale', e.target.value)}
                  />
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Forme Juridique</Form.Label>
                  <Form.Select
                    value={formData.formeJuridique}
                    onChange={(e) => handleChange('formeJuridique', e.target.value)}
                  >
                    {LEGAL_FORMS.map((form) => (
                      <option key={form.value} value={form.value}>
                        {form.label}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Activite Principale</Form.Label>
              <Form.Control
                type="text"
                placeholder="Secteur d'activite"
                value={formData.activitePrincipale}
                onChange={(e) => handleChange('activitePrincipale', e.target.value)}
              />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>NINEA</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Numero d'identification national des entreprises et associations"
                    value={formData.ninea}
                    onChange={(e) => handleChange('ninea', e.target.value)}
                  />
                  <Form.Text className="text-muted">
                    Numero d'identification fiscale au Senegal
                  </Form.Text>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>RCCM</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Registre de Commerce et du Credit Mobilier"
                    value={formData.rccm}
                    onChange={(e) => handleChange('rccm', e.target.value)}
                  />
                  <Form.Text className="text-muted">
                    Numero d'immatriculation au registre de commerce
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        <Card className="mb-3">
          <Card.Header>
            <h5 className="mb-0">Coordonnees</h5>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Telephone</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="+221 33 123 45 67"
                    value={formData.telephone}
                    onChange={(e) => handleChange('telephone', e.target.value)}
                  />
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    placeholder="contact@entreprise.com"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                  />
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Site Web</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="www.entreprise.com"
                    value={formData.siteWeb}
                    onChange={(e) => handleChange('siteWeb', e.target.value)}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        <Card className="mb-3">
          <Card.Header>
            <h5 className="mb-0">Adresse</h5>
          </Card.Header>
          <Card.Body>
            <Form.Group className="mb-3">
              <Form.Label>Rue</Form.Label>
              <Form.Control
                type="text"
                placeholder="Numero et nom de rue"
                value={formData.street}
                onChange={(e) => handleChange('street', e.target.value)}
              />
            </Form.Group>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Ville</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Dakar"
                    value={formData.city}
                    onChange={(e) => handleChange('city', e.target.value)}
                  />
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Region</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Region"
                    value={formData.region}
                    onChange={(e) => handleChange('region', e.target.value)}
                  />
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Code Postal</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="12000"
                    value={formData.postalCode}
                    onChange={(e) => handleChange('postalCode', e.target.value)}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Pays</Form.Label>
              <Form.Control
                type="text"
                placeholder="Senegal"
                value={formData.country}
                onChange={(e) => handleChange('country', e.target.value)}
              />
            </Form.Group>
          </Card.Body>
        </Card>

        <Card className="mb-3">
          <Card.Header>
            <h5 className="mb-0">Logo de l'Entreprise</h5>
          </Card.Header>
          <Card.Body>
            <Form.Group className="mb-3">
              <Form.Label>Telecharger le Logo</Form.Label>
              <Form.Control
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                disabled
              />
              <Form.Text className="text-muted">
                Format recommande: PNG ou JPG, taille maximale: 2 MB (Fonctionnalite bientot disponible)
              </Form.Text>
            </Form.Group>

            {formData.logo && (
              <div className="mt-2">
                <p className="mb-0">
                  <strong>Fichier selectionne:</strong> {formData.logo.name}
                </p>
              </div>
            )}
          </Card.Body>
        </Card>

        <div className="d-flex justify-content-end">
          <Button variant="primary" type="submit">
            <FiSave className="me-2" />
            Enregistrer les Informations
          </Button>
        </div>
      </Form>
    </div>
  );
}
