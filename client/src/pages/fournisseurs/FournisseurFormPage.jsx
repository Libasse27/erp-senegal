import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Card from 'react-bootstrap/Card';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Spinner from 'react-bootstrap/Spinner';
import {
  FiSave,
  FiX,
  FiTruck,
  FiMail,
  FiPhone,
  FiMapPin,
  FiDollarSign,
  FiStar,
  FiCreditCard,
  FiInfo,
  FiUser,
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import usePageTitle from '../../hooks/usePageTitle';
import {
  useGetFournisseurQuery,
  useCreateFournisseurMutation,
  useUpdateFournisseurMutation,
} from '../../redux/api/fournisseursApi';

/* ─── helper : titre de section ──────────────────────────────────────────── */
const SectionTitle = ({ icon: Icon, title, sub, color = '#6366f1' }) => (
  <div className="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
    <div
      className="d-flex align-items-center justify-content-center rounded-2"
      style={{ width: 32, height: 32, backgroundColor: `${color}15` }}
    >
      <Icon size={16} color={color} />
    </div>
    <div>
      <div className="fw-semibold text-dark" style={{ fontSize: 14 }}>{title}</div>
      {sub && <div className="text-muted" style={{ fontSize: 11 }}>{sub}</div>}
    </div>
  </div>
);

/* ─── Selector de note ────────────────────────────────────────────────────── */
const RatingSelect = ({ label, name, value, onChange }) => (
  <Form.Group className="mb-3">
    <Form.Label className="fw-semibold small d-flex justify-content-between">
      <span>{label}</span>
      <span style={{ color: '#f59e0b' }}>
        {'★'.repeat(Number(value))}
        <span style={{ color: '#e2e8f0' }}>{'★'.repeat(5 - Number(value))}</span>
        {' '}{value}/5
      </span>
    </Form.Label>
    <Form.Range
      name={name}
      value={value}
      onChange={onChange}
      min={1}
      max={5}
      step={1}
      style={{ accentColor: '#f59e0b' }}
    />
    <div className="d-flex justify-content-between">
      <small className="text-muted">Mauvais</small>
      <small className="text-muted">Excellent</small>
    </div>
  </Form.Group>
);

/* ─── composant principal ─────────────────────────────────────────────────── */
const FournisseurFormPage = () => {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const isEditMode = Boolean(id);

  usePageTitle(
    isEditMode ? 'Modifier le Fournisseur' : 'Nouveau Fournisseur',
    [
      { label: 'Accueil', path: '/' },
      { label: 'Fournisseurs', path: '/fournisseurs' },
      { label: isEditMode ? 'Modifier' : 'Nouveau' },
    ]
  );

  const { data: fournisseurData, isLoading: isLoadingFournisseur } = useGetFournisseurQuery(
    id,
    { skip: !isEditMode }
  );
  const [createFournisseur, { isLoading: isCreating }] = useCreateFournisseurMutation();
  const [updateFournisseur, { isLoading: isUpdating }] = useUpdateFournisseurMutation();

  const [formData, setFormData] = useState({
    // Identification
    raisonSociale:     '',
    ninea:             '',
    rccm:              '',
    category:          'local',
    devises:           'XOF',
    // Contact principal
    email:             '',
    phone:             '',
    mobile:            '',
    fax:               '',
    website:           '',
    // Personne de contact
    contactName:       '',
    contactPhone:      '',
    contactEmail:      '',
    contactPosition:   '',
    // Adresse
    street:            '',
    city:              'Dakar',
    region:            '',
    postalCode:        '',
    country:           'Senegal',
    // Conditions commerciales
    delaiPaiement:     30,
    delaiLivraison:    7,
    conditionsPaiement:'',
    // Evaluation
    ratingQualite:     3,
    ratingDelai:       3,
    ratingPrix:        3,
    ratingService:     3,
    // Infos bancaires
    bankName:          '',
    accountNumber:     '',
    iban:              '',
    swift:             '',
    // Notes
    notes:             '',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isEditMode && fournisseurData?.data) {
      const f = fournisseurData.data;
      setFormData({
        raisonSociale:      f.raisonSociale          || '',
        ninea:              f.ninea                  || '',
        rccm:               f.rccm                   || '',
        category:           f.category               || 'local',
        devises:            f.devises                || 'XOF',
        email:              f.email                  || '',
        phone:              f.phone                  || '',
        mobile:             f.mobile                 || '',
        fax:                f.fax                    || '',
        website:            f.website                || '',
        contactName:        f.contactPerson?.name     || '',
        contactPhone:       f.contactPerson?.phone    || '',
        contactEmail:       f.contactPerson?.email    || '',
        contactPosition:    f.contactPerson?.position || '',
        street:             f.address?.street         || '',
        city:               f.address?.city           || 'Dakar',
        region:             f.address?.region         || '',
        postalCode:         f.address?.postalCode     || '',
        country:            f.address?.country        || 'Senegal',
        delaiPaiement:      f.delaiPaiement          ?? 30,
        delaiLivraison:     f.delaiLivraison         ?? 7,
        conditionsPaiement: f.conditionsPaiement     || '',
        ratingQualite:      f.rating?.qualite        ?? 3,
        ratingDelai:        f.rating?.delai          ?? 3,
        ratingPrix:         f.rating?.prix           ?? 3,
        ratingService:      f.rating?.service        ?? 3,
        bankName:           f.bankInfo?.bankName      || '',
        accountNumber:      f.bankInfo?.accountNumber || '',
        iban:               f.bankInfo?.iban          || '',
        swift:              f.bankInfo?.swift         || '',
        notes:              f.notes                  || '',
      });
    }
  }, [isEditMode, fournisseurData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const errs = {};
    if (!formData.raisonSociale.trim())
      errs.raisonSociale = 'La raison sociale est requise';
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      errs.email = 'Adresse email invalide';
    if (Number(formData.delaiPaiement) < 0)
      errs.delaiPaiement = 'Le delai doit etre positif';
    if (Number(formData.delaiLivraison) < 0)
      errs.delaiLivraison = 'Le delai doit etre positif';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Veuillez corriger les erreurs dans le formulaire');
      return;
    }

    const payload = {
      raisonSociale:     formData.raisonSociale,
      ninea:             formData.ninea            || undefined,
      rccm:              formData.rccm             || undefined,
      category:          formData.category,
      devises:           formData.devises          || 'XOF',
      email:             formData.email            || undefined,
      phone:             formData.phone            || undefined,
      mobile:            formData.mobile           || undefined,
      fax:               formData.fax              || undefined,
      website:           formData.website          || undefined,
      address: {
        street:     formData.street     || undefined,
        city:       formData.city       || undefined,
        region:     formData.region     || undefined,
        postalCode: formData.postalCode || undefined,
        country:    formData.country    || 'Senegal',
      },
      delaiPaiement:     Number(formData.delaiPaiement),
      delaiLivraison:    Number(formData.delaiLivraison),
      conditionsPaiement:formData.conditionsPaiement || undefined,
      rating: {
        qualite: Number(formData.ratingQualite),
        delai:   Number(formData.ratingDelai),
        prix:    Number(formData.ratingPrix),
        service: Number(formData.ratingService),
      },
      notes: formData.notes || undefined,
    };

    // Personne de contact
    if (formData.contactName) {
      payload.contactPerson = {
        name:     formData.contactName     || undefined,
        phone:    formData.contactPhone    || undefined,
        email:    formData.contactEmail    || undefined,
        position: formData.contactPosition || undefined,
      };
    }

    // Infos bancaires
    if (formData.bankName || formData.accountNumber) {
      payload.bankInfo = {
        bankName:      formData.bankName      || undefined,
        accountNumber: formData.accountNumber || undefined,
        iban:          formData.iban          || undefined,
        swift:         formData.swift         || undefined,
      };
    }

    try {
      if (isEditMode) {
        await updateFournisseur({ id, ...payload }).unwrap();
        toast.success('Fournisseur modifie avec succes');
      } else {
        await createFournisseur(payload).unwrap();
        toast.success('Fournisseur cree avec succes');
      }
      navigate('/fournisseurs');
    } catch (err) {
      toast.error(
        err.data?.message ||
          `Erreur lors de ${isEditMode ? 'la modification' : 'la creation'} du fournisseur`
      );
    }
  };

  if (isEditMode && isLoadingFournisseur) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2 text-muted">Chargement du fournisseur...</p>
      </div>
    );
  }

  const isSaving = isCreating || isUpdating;

  return (
    <>
      {/* ── En-tete ─────────────────────────────────────────────────────── */}
      <div className="page-header">
        <div>
          <h1 className="mb-0">
            {isEditMode ? 'Modifier le Fournisseur' : 'Nouveau Fournisseur'}
          </h1>
          <p className="text-muted mb-0 small mt-1">
            {isEditMode
              ? 'Mettez a jour les informations du fournisseur'
              : 'Ajoutez un nouveau fournisseur a votre portefeuille'}
          </p>
        </div>
      </div>

      <Form onSubmit={handleSubmit}>
        <Row className="g-4">

          {/* ── Colonne principale ──────────────────────────────────────── */}
          <Col lg={8}>

            {/* Identification */}
            <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: 12 }}>
              <Card.Body className="p-4">
                <SectionTitle icon={FiTruck} title="Identification" sub="Informations legales du fournisseur" color="#6366f1" />
                <Row className="g-3">
                  <Col md={12}>
                    <Form.Group>
                      <Form.Label className="fw-semibold small">
                        Raison Sociale <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        type="text"
                        name="raisonSociale"
                        value={formData.raisonSociale}
                        onChange={handleChange}
                        isInvalid={!!errors.raisonSociale}
                        placeholder="Nom officiel de la societe ou organisation"
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.raisonSociale}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-semibold small">NINEA</Form.Label>
                      <Form.Control
                        type="text"
                        name="ninea"
                        value={formData.ninea}
                        onChange={handleChange}
                        placeholder="Numero NINEA (fiscal)"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-semibold small">RCCM</Form.Label>
                      <Form.Control
                        type="text"
                        name="rccm"
                        value={formData.rccm}
                        onChange={handleChange}
                        placeholder="Registre Commerce et Credit Mobilier"
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* Contact */}
            <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: 12 }}>
              <Card.Body className="p-4">
                <SectionTitle icon={FiMail} title="Contact" sub="Coordonnees de communication" color="#3b82f6" />
                <Row className="g-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-semibold small">Email</Form.Label>
                      <Form.Control
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        isInvalid={!!errors.email}
                        placeholder="contact@fournisseur.com"
                      />
                      <Form.Control.Feedback type="invalid">{errors.email}</Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-semibold small">Telephone principal</Form.Label>
                      <Form.Control
                        type="text"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="+221 33 123 45 67"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-semibold small">Mobile</Form.Label>
                      <Form.Control
                        type="text"
                        name="mobile"
                        value={formData.mobile}
                        onChange={handleChange}
                        placeholder="+221 77 000 00 00"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-semibold small">Site web</Form.Label>
                      <Form.Control
                        type="text"
                        name="website"
                        value={formData.website}
                        onChange={handleChange}
                        placeholder="https://www.fournisseur.com"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                {/* Personne de contact */}
                <div className="mt-4 mb-3 pb-2 border-bottom">
                  <span className="text-muted fw-semibold" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Personne de contact (optionnel)
                  </span>
                </div>
                <Row className="g-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-semibold small">Nom complet</Form.Label>
                      <Form.Control
                        type="text"
                        name="contactName"
                        value={formData.contactName}
                        onChange={handleChange}
                        placeholder="Prenom Nom"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-semibold small">Poste / Fonction</Form.Label>
                      <Form.Control
                        type="text"
                        name="contactPosition"
                        value={formData.contactPosition}
                        onChange={handleChange}
                        placeholder="Responsable commercial, DAF..."
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-semibold small">Telephone</Form.Label>
                      <Form.Control
                        type="text"
                        name="contactPhone"
                        value={formData.contactPhone}
                        onChange={handleChange}
                        placeholder="+221 77 000 00 00"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-semibold small">Email</Form.Label>
                      <Form.Control
                        type="email"
                        name="contactEmail"
                        value={formData.contactEmail}
                        onChange={handleChange}
                        placeholder="contact@email.com"
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* Adresse */}
            <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: 12 }}>
              <Card.Body className="p-4">
                <SectionTitle icon={FiMapPin} title="Adresse" sub="Localisation geographique" color="#10b981" />
                <Row className="g-3">
                  <Col md={12}>
                    <Form.Group>
                      <Form.Label className="fw-semibold small">Rue / Quartier</Form.Label>
                      <Form.Control
                        type="text"
                        name="street"
                        value={formData.street}
                        onChange={handleChange}
                        placeholder="Rue, avenue, zone industrielle..."
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label className="fw-semibold small">Ville</Form.Label>
                      <Form.Control
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        placeholder="Dakar"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label className="fw-semibold small">Region</Form.Label>
                      <Form.Select name="region" value={formData.region} onChange={handleChange}>
                        <option value="">— Choisir —</option>
                        {['Dakar','Thies','Diourbel','Saint-Louis','Tambacounda','Kaolack',
                          'Ziguinchor','Louga','Fatick','Kolda','Matam','Kaffrine','Kedougou','Sedhiou'].map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label className="fw-semibold small">Pays</Form.Label>
                      <Form.Control
                        type="text"
                        name="country"
                        value={formData.country}
                        onChange={handleChange}
                        placeholder="Senegal"
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* Informations bancaires */}
            <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: 12 }}>
              <Card.Body className="p-4">
                <SectionTitle icon={FiCreditCard} title="Informations bancaires" sub="Pour les virements fournisseurs (optionnel)" color="#8b5cf6" />
                <Row className="g-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-semibold small">Nom de la banque</Form.Label>
                      <Form.Control
                        type="text"
                        name="bankName"
                        value={formData.bankName}
                        onChange={handleChange}
                        placeholder="CBAO, Ecobank, SGBS..."
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-semibold small">N° de compte</Form.Label>
                      <Form.Control
                        type="text"
                        name="accountNumber"
                        value={formData.accountNumber}
                        onChange={handleChange}
                        placeholder="SN123456789"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-semibold small">IBAN</Form.Label>
                      <Form.Control
                        type="text"
                        name="iban"
                        value={formData.iban}
                        onChange={handleChange}
                        placeholder="SN28 0001 0001 ..."
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-semibold small">SWIFT / BIC</Form.Label>
                      <Form.Control
                        type="text"
                        name="swift"
                        value={formData.swift}
                        onChange={handleChange}
                        placeholder="CBAOSNDA"
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* Evaluation */}
            <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: 12 }}>
              <Card.Body className="p-4">
                <SectionTitle icon={FiStar} title="Evaluation fournisseur" sub="Notez ce fournisseur sur 4 criteres (1 a 5 etoiles)" color="#f59e0b" />
                <RatingSelect label="Qualite des produits / services" name="ratingQualite" value={formData.ratingQualite} onChange={handleChange} />
                <RatingSelect label="Respect des delais de livraison" name="ratingDelai" value={formData.ratingDelai} onChange={handleChange} />
                <RatingSelect label="Niveau des prix" name="ratingPrix" value={formData.ratingPrix} onChange={handleChange} />
                <RatingSelect label="Qualite du service client" name="ratingService" value={formData.ratingService} onChange={handleChange} />
              </Card.Body>
            </Card>

            {/* Notes */}
            <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: 12 }}>
              <Card.Body className="p-4">
                <SectionTitle icon={FiInfo} title="Notes" sub="Observations internes" color="#f59e0b" />
                <Form.Control
                  as="textarea"
                  rows={3}
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Historique, conditions speciales, remarques..."
                />
              </Card.Body>
            </Card>

          </Col>

          {/* ── Colonne laterale ────────────────────────────────────────── */}
          <Col lg={4}>

            {/* Classification & conditions */}
            <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: 12 }}>
              <Card.Body className="p-4">
                <SectionTitle icon={FiDollarSign} title="Conditions d'achat" color="#22c55e" />

                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold small">Categorie fournisseur</Form.Label>
                  <Form.Select name="category" value={formData.category} onChange={handleChange}>
                    <option value="local">Local (Senegal)</option>
                    <option value="international">International</option>
                    <option value="fabricant">Fabricant</option>
                    <option value="distributeur">Distributeur</option>
                    <option value="prestataire">Prestataire de service</option>
                    <option value="autre">Autre</option>
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold small">Devise</Form.Label>
                  <Form.Select name="devises" value={formData.devises} onChange={handleChange}>
                    <option value="XOF">XOF — Franc CFA UEMOA</option>
                    <option value="EUR">EUR — Euro</option>
                    <option value="USD">USD — Dollar americain</option>
                    <option value="GBP">GBP — Livre sterling</option>
                    <option value="MAD">MAD — Dirham marocain</option>
                    <option value="CNY">CNY — Yuan chinois</option>
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold small">Delai de paiement (jours)</Form.Label>
                  <Form.Control
                    type="number"
                    name="delaiPaiement"
                    value={formData.delaiPaiement}
                    onChange={handleChange}
                    isInvalid={!!errors.delaiPaiement}
                    min="0"
                    max="365"
                  />
                  <Form.Control.Feedback type="invalid">{errors.delaiPaiement}</Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold small">Delai de livraison (jours)</Form.Label>
                  <Form.Control
                    type="number"
                    name="delaiLivraison"
                    value={formData.delaiLivraison}
                    onChange={handleChange}
                    isInvalid={!!errors.delaiLivraison}
                    min="0"
                  />
                  <Form.Control.Feedback type="invalid">{errors.delaiLivraison}</Form.Control.Feedback>
                </Form.Group>

                <Form.Group>
                  <Form.Label className="fw-semibold small">Conditions de paiement</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    name="conditionsPaiement"
                    value={formData.conditionsPaiement}
                    onChange={handleChange}
                    placeholder="30 jours net, paiement a la livraison..."
                  />
                </Form.Group>
              </Card.Body>
            </Card>

            {/* Boutons */}
            <div className="d-flex flex-column gap-2">
              <Button
                type="submit"
                variant="primary"
                disabled={isSaving}
                className="d-flex align-items-center justify-content-center gap-2 py-2"
                style={{ borderRadius: 10 }}
              >
                {isSaving ? (
                  <>
                    <Spinner as="span" animation="border" size="sm" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <FiSave size={16} />
                    {isEditMode ? 'Sauvegarder les modifications' : 'Creer le fournisseur'}
                  </>
                )}
              </Button>

              <Button
                variant="outline-secondary"
                onClick={() => navigate('/fournisseurs')}
                disabled={isSaving}
                className="d-flex align-items-center justify-content-center gap-2 py-2"
                style={{ borderRadius: 10 }}
              >
                <FiX size={16} />
                Annuler
              </Button>
            </div>

          </Col>
        </Row>
      </Form>
    </>
  );
};

export default FournisseurFormPage;
