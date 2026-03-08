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
  FiUser,
  FiBriefcase,
  FiMail,
  FiPhone,
  FiMapPin,
  FiDollarSign,
  FiInfo,
  FiUsers,
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import usePageTitle from '../../hooks/usePageTitle';
import {
  useGetClientQuery,
  useCreateClientMutation,
  useUpdateClientMutation,
} from '../../redux/api/clientsApi';

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

/* ─── composant principal ─────────────────────────────────────────────────── */
const ClientFormPage = () => {
  const { id }        = useParams();
  const navigate      = useNavigate();
  const isEditMode    = Boolean(id);

  usePageTitle(
    isEditMode ? 'Modifier le Client' : 'Nouveau Client',
    [
      { label: 'Accueil', path: '/' },
      { label: 'Clients', path: '/clients' },
      { label: isEditMode ? 'Modifier' : 'Nouveau' },
    ]
  );

  const { data: clientData, isLoading: isLoadingClient } = useGetClientQuery(
    id,
    { skip: !isEditMode }
  );
  const [createClient, { isLoading: isCreating }] = useCreateClientMutation();
  const [updateClient, { isLoading: isUpdating }] = useUpdateClientMutation();

  const [formData, setFormData] = useState({
    // Identification
    type:          'professionnel',
    raisonSociale: '',
    firstName:     '',
    lastName:      '',
    ninea:         '',
    rccm:          '',
    // Contact
    email:         '',
    phone:         '',
    mobile:        '',
    website:       '',
    // Personne de contact (pro)
    contactName:      '',
    contactPhone:     '',
    contactEmail:     '',
    contactPosition:  '',
    // Adresse
    street:        '',
    city:          'Dakar',
    region:        '',
    postalCode:    '',
    country:       'Senegal',
    // Commercial
    category:      'autre',
    delaiPaiement: 30,
    plafondCredit: 0,
    remiseGlobale: 0,
    modePaiement:  'especes',
    // Notes
    notes:         '',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isEditMode && clientData?.data) {
      const c = clientData.data;
      setFormData({
        type:             c.type             || 'professionnel',
        raisonSociale:    c.raisonSociale    || '',
        firstName:        c.firstName        || '',
        lastName:         c.lastName         || '',
        ninea:            c.ninea            || '',
        rccm:             c.rccm             || '',
        email:            c.email            || '',
        phone:            c.phone            || '',
        mobile:           c.mobile           || '',
        website:          c.website          || '',
        contactName:      c.contactPerson?.name     || '',
        contactPhone:     c.contactPerson?.phone    || '',
        contactEmail:     c.contactPerson?.email    || '',
        contactPosition:  c.contactPerson?.position || '',
        street:           c.address?.street    || '',
        city:             c.address?.city      || 'Dakar',
        region:           c.address?.region    || '',
        postalCode:       c.address?.postalCode || '',
        country:          c.address?.country   || 'Senegal',
        category:         c.category          || 'autre',
        delaiPaiement:    c.delaiPaiement     ?? 30,
        plafondCredit:    c.plafondCredit     ?? 0,
        remiseGlobale:    c.remiseGlobale     ?? 0,
        modePaiement:     c.modePaiement      || 'especes',
        notes:            c.notes             || '',
      });
    }
  }, [isEditMode, clientData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const errs = {};
    if (formData.type === 'professionnel') {
      if (!formData.raisonSociale.trim())
        errs.raisonSociale = 'La raison sociale est requise';
    } else {
      if (!formData.firstName.trim()) errs.firstName = 'Le prenom est requis';
      if (!formData.lastName.trim())  errs.lastName  = 'Le nom est requis';
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      errs.email = 'Adresse email invalide';
    if (Number(formData.delaiPaiement) < 0)
      errs.delaiPaiement = 'Le delai doit etre positif';
    if (Number(formData.plafondCredit) < 0)
      errs.plafondCredit = 'Le plafond doit etre positif';
    if (Number(formData.remiseGlobale) < 0 || Number(formData.remiseGlobale) > 100)
      errs.remiseGlobale = 'La remise doit etre entre 0 et 100';
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
      type:         formData.type,
      email:        formData.email   || undefined,
      phone:        formData.phone   || undefined,
      mobile:       formData.mobile  || undefined,
      website:      formData.website || undefined,
      address: {
        street:     formData.street     || undefined,
        city:       formData.city       || undefined,
        region:     formData.region     || undefined,
        postalCode: formData.postalCode || undefined,
        country:    formData.country    || 'Senegal',
      },
      category:      formData.category,
      delaiPaiement: Number(formData.delaiPaiement),
      plafondCredit: Number(formData.plafondCredit),
      remiseGlobale: Number(formData.remiseGlobale),
      modePaiement:  formData.modePaiement,
      notes:         formData.notes || undefined,
    };

    // Identite selon type
    if (formData.type === 'professionnel') {
      payload.raisonSociale = formData.raisonSociale;
      payload.ninea = formData.ninea || undefined;
      payload.rccm  = formData.rccm  || undefined;
      // Personne de contact
      if (formData.contactName) {
        payload.contactPerson = {
          name:     formData.contactName     || undefined,
          phone:    formData.contactPhone    || undefined,
          email:    formData.contactEmail    || undefined,
          position: formData.contactPosition || undefined,
        };
      }
    } else {
      payload.firstName = formData.firstName;
      payload.lastName  = formData.lastName;
    }

    try {
      if (isEditMode) {
        await updateClient({ id, ...payload }).unwrap();
        toast.success('Client modifie avec succes');
      } else {
        await createClient(payload).unwrap();
        toast.success('Client cree avec succes');
      }
      navigate('/clients');
    } catch (err) {
      toast.error(
        err.data?.message ||
          `Erreur lors de ${isEditMode ? 'la modification' : 'la creation'} du client`
      );
    }
  };

  if (isEditMode && isLoadingClient) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2 text-muted">Chargement du client...</p>
      </div>
    );
  }

  const isPro    = formData.type === 'professionnel';
  const isSaving = isCreating || isUpdating;

  return (
    <>
      {/* ── En-tete ─────────────────────────────────────────────────────── */}
      <div className="page-header">
        <div>
          <h1 className="mb-0">
            {isEditMode ? 'Modifier le Client' : 'Nouveau Client'}
          </h1>
          <p className="text-muted mb-0 small mt-1">
            {isEditMode
              ? 'Mettez a jour les informations du client'
              : 'Creez un nouveau client dans votre portefeuille'}
          </p>
        </div>
      </div>

      <Form onSubmit={handleSubmit}>
        <Row className="g-4">

          {/* ── Colonne principale ──────────────────────────────────────── */}
          <Col lg={8}>

            {/* Selecteur de type */}
            <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: 12 }}>
              <Card.Body className="p-4">
                <SectionTitle icon={FiUsers} title="Type de client" color="#6366f1" />
                <div className="d-flex gap-3">
                  {[
                    { val: 'professionnel', label: 'Professionnel / Entreprise', sub: 'Societe, SARL, SA, ONG...', Icon: FiBriefcase, color: '#6366f1' },
                    { val: 'particulier',   label: 'Particulier',                sub: 'Personne physique',          Icon: FiUser,      color: '#06b6d4' },
                  ].map(({ val, label, sub, Icon, color }) => (
                    <label
                      key={val}
                      className="d-flex align-items-center gap-3 px-3 py-3 rounded-3 flex-fill"
                      style={{
                        border: `2px solid ${formData.type === val ? color : '#e2e8f0'}`,
                        background: formData.type === val ? `${color}0d` : '#fff',
                        cursor: 'pointer',
                        transition: '0.2s',
                      }}
                    >
                      <Form.Check
                        type="radio"
                        name="type"
                        value={val}
                        checked={formData.type === val}
                        onChange={handleChange}
                        className="d-none"
                      />
                      <Icon size={22} color={formData.type === val ? color : '#94a3b8'} />
                      <div>
                        <div className="fw-semibold" style={{ fontSize: 14, color: formData.type === val ? color : '#374151' }}>
                          {label}
                        </div>
                        <div className="text-muted" style={{ fontSize: 12 }}>{sub}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </Card.Body>
            </Card>

            {/* Identite */}
            <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: 12 }}>
              <Card.Body className="p-4">
                <SectionTitle
                  icon={isPro ? FiBriefcase : FiUser}
                  title={isPro ? 'Identification entreprise' : 'Identite'}
                  sub={isPro ? 'Informations legales' : 'Informations personnelles'}
                  color={isPro ? '#6366f1' : '#06b6d4'}
                />
                <Row className="g-3">
                  {isPro ? (
                    <>
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
                            placeholder="Nom de l'entreprise, organisation..."
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
                    </>
                  ) : (
                    <>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="fw-semibold small">
                            Prenom <span className="text-danger">*</span>
                          </Form.Label>
                          <Form.Control
                            type="text"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            isInvalid={!!errors.firstName}
                            placeholder="Prenom"
                          />
                          <Form.Control.Feedback type="invalid">
                            {errors.firstName}
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="fw-semibold small">
                            Nom <span className="text-danger">*</span>
                          </Form.Label>
                          <Form.Control
                            type="text"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            isInvalid={!!errors.lastName}
                            placeholder="Nom de famille"
                          />
                          <Form.Control.Feedback type="invalid">
                            {errors.lastName}
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                    </>
                  )}
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
                        placeholder="exemple@email.com"
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
                        placeholder="+221 77 123 45 67"
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
                        placeholder="+221 70 000 00 00"
                      />
                    </Form.Group>
                  </Col>
                  {isPro && (
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="fw-semibold small">Site web</Form.Label>
                        <Form.Control
                          type="text"
                          name="website"
                          value={formData.website}
                          onChange={handleChange}
                          placeholder="https://www.exemple.sn"
                        />
                      </Form.Group>
                    </Col>
                  )}
                </Row>

                {/* Personne de contact */}
                {isPro && (
                  <>
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
                            placeholder="Directeur commercial, DAF..."
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
                  </>
                )}
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
                        placeholder="Rue, avenue, quartier, VDN..."
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
                      <Form.Label className="fw-semibold small">Code Postal</Form.Label>
                      <Form.Control
                        type="text"
                        name="postalCode"
                        value={formData.postalCode}
                        onChange={handleChange}
                        placeholder="BP 12345"
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* Notes */}
            <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: 12 }}>
              <Card.Body className="p-4">
                <SectionTitle icon={FiInfo} title="Notes" sub="Observations internes (non visibles client)" color="#f59e0b" />
                <Form.Control
                  as="textarea"
                  rows={3}
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Informations complementaires, historique relationnel..."
                />
              </Card.Body>
            </Card>

          </Col>

          {/* ── Colonne laterale ────────────────────────────────────────── */}
          <Col lg={4}>

            {/* Conditions commerciales */}
            <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: 12 }}>
              <Card.Body className="p-4">
                <SectionTitle icon={FiDollarSign} title="Conditions commerciales" color="#22c55e" />

                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold small">Categorie client</Form.Label>
                  <Form.Select name="category" value={formData.category} onChange={handleChange}>
                    <option value="grossiste">Grossiste</option>
                    <option value="detaillant">Detaillant</option>
                    <option value="distributeur">Distributeur</option>
                    <option value="institutionnel">Institutionnel</option>
                    <option value="particulier">Particulier</option>
                    <option value="autre">Autre</option>
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
                  <Form.Text className="text-muted">0 = paiement immediat</Form.Text>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold small">Plafond de credit (FCFA)</Form.Label>
                  <Form.Control
                    type="number"
                    name="plafondCredit"
                    value={formData.plafondCredit}
                    onChange={handleChange}
                    isInvalid={!!errors.plafondCredit}
                    min="0"
                    step="1000"
                  />
                  <Form.Control.Feedback type="invalid">{errors.plafondCredit}</Form.Control.Feedback>
                  <Form.Text className="text-muted">0 = pas de limite</Form.Text>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold small">Remise globale (%)</Form.Label>
                  <Form.Control
                    type="number"
                    name="remiseGlobale"
                    value={formData.remiseGlobale}
                    onChange={handleChange}
                    isInvalid={!!errors.remiseGlobale}
                    min="0"
                    max="100"
                    step="0.5"
                  />
                  <Form.Control.Feedback type="invalid">{errors.remiseGlobale}</Form.Control.Feedback>
                </Form.Group>

                <Form.Group>
                  <Form.Label className="fw-semibold small">Mode de paiement prefere</Form.Label>
                  <Form.Select name="modePaiement" value={formData.modePaiement} onChange={handleChange}>
                    <option value="especes">Especes</option>
                    <option value="cheque">Cheque</option>
                    <option value="virement">Virement bancaire</option>
                    <option value="orange_money">Orange Money</option>
                    <option value="wave">Wave</option>
                    <option value="carte_bancaire">Carte bancaire</option>
                  </Form.Select>
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
                    {isEditMode ? 'Sauvegarder les modifications' : 'Creer le client'}
                  </>
                )}
              </Button>

              <Button
                variant="outline-secondary"
                onClick={() => navigate('/clients')}
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

export default ClientFormPage;
