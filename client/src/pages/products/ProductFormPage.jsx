import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Card from 'react-bootstrap/Card';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Spinner from 'react-bootstrap/Spinner';
import Badge from 'react-bootstrap/Badge';
import {
  FiSave,
  FiX,
  FiPackage,
  FiTool,
  FiTag,
  FiDollarSign,
  FiBox,
  FiInfo,
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import usePageTitle from '../../hooks/usePageTitle';
import {
  useGetProductQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useGetCategoriesQuery,
} from '../../redux/api/productsApi';

/* ─── helper : titre de section ──────────────────────────────────────────── */
const SectionTitle = ({ icon: Icon, title, sub }) => (
  <div className="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
    <div
      className="d-flex align-items-center justify-content-center rounded-2"
      style={{ width: 32, height: 32, backgroundColor: '#6366f115' }}
    >
      <Icon size={16} color="#6366f1" />
    </div>
    <div>
      <div className="fw-semibold text-dark" style={{ fontSize: 14 }}>{title}</div>
      {sub && <div className="text-muted" style={{ fontSize: 11 }}>{sub}</div>}
    </div>
  </div>
);

/* ─── Apercu prix / marge ─────────────────────────────────────────────────── */
const PricePreview = ({ prixVente, prixAchat, tauxTVA }) => {
  const pv   = Number(prixVente)  || 0;
  const pa   = Number(prixAchat)  || 0;
  const tva  = Number(tauxTVA)    || 0;
  const marge = pa > 0 ? Math.round(((pv - pa) / pa) * 100) : 0;
  const prixHT = tva > 0 ? Math.round(pv / (1 + tva / 100)) : pv;
  const montantTVA = pv - prixHT;
  const margeColor = marge >= 20 ? '#22c55e' : marge >= 0 ? '#f59e0b' : '#ef4444';

  if (!pv && !pa) return null;

  return (
    <div
      className="rounded-3 p-3 mt-2"
      style={{ background: '#f8faff', border: '1px solid #e0e7ff', fontSize: 13 }}
    >
      <div className="fw-semibold text-muted mb-2" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        Apercu
      </div>
      <Row className="g-2">
        <Col xs={6} sm={3}>
          <div className="text-muted">Prix HT</div>
          <div className="fw-bold">{prixHT.toLocaleString('fr-FR')} FCFA</div>
        </Col>
        <Col xs={6} sm={3}>
          <div className="text-muted">TVA {tva}%</div>
          <div className="fw-bold">{montantTVA.toLocaleString('fr-FR')} FCFA</div>
        </Col>
        <Col xs={6} sm={3}>
          <div className="text-muted">Marge</div>
          <div className="fw-bold" style={{ color: margeColor }}>
            {marge >= 0 ? '+' : ''}{marge}%
          </div>
        </Col>
        <Col xs={6} sm={3}>
          <div className="text-muted">Profit unitaire</div>
          <div className="fw-bold" style={{ color: margeColor }}>
            {(pv - pa).toLocaleString('fr-FR')} FCFA
          </div>
        </Col>
      </Row>
    </div>
  );
};

/* ─── composant principal ─────────────────────────────────────────────────── */
const ProductFormPage = () => {
  const { id }        = useParams();
  const navigate      = useNavigate();
  const isEditMode    = Boolean(id);

  usePageTitle(
    isEditMode ? 'Modifier le Produit' : 'Nouveau Produit',
    [
      { label: 'Accueil', path: '/' },
      { label: 'Produits', path: '/produits' },
      { label: isEditMode ? 'Modifier' : 'Nouveau' },
    ]
  );

  const { data: productData, isLoading: isLoadingProduct } = useGetProductQuery(
    id,
    { skip: !isEditMode }
  );
  const { data: categoriesData } = useGetCategoriesQuery();
  const [createProduct, { isLoading: isCreating }] = useCreateProductMutation();
  const [updateProduct, { isLoading: isUpdating }] = useUpdateProductMutation();

  const [formData, setFormData] = useState({
    type:         'produit',
    name:         '',
    description:  '',
    category:     '',
    marque:       '',
    prixVente:    '',
    prixAchat:    '',
    tauxTVA:      18,
    unite:        'Unite',
    stockMinimum: 5,
    stockAlerte:  10,
    barcode:      '',
    isActive:     true,
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isEditMode && productData?.data) {
      const p = productData.data;
      setFormData({
        type:         p.type         || 'produit',
        name:         p.name         || '',
        description:  p.description  || '',
        category:     p.category?._id || '',
        marque:       p.marque        || '',
        prixVente:    p.prixVente     ?? '',
        prixAchat:    p.prixAchat     ?? '',
        tauxTVA:      p.tauxTVA       ?? 18,
        unite:        p.unite         || 'Unite',
        stockMinimum: p.stockMinimum  ?? 5,
        stockAlerte:  p.stockAlerte   ?? 10,
        barcode:      p.barcode       || '',
        isActive:     p.isActive      !== false,
      });
    }
  }, [isEditMode, productData]);

  const handleChange = (e) => {
    const { name, value, type: inputType, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: inputType === 'checkbox' ? checked : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const errs = {};
    if (!formData.name.trim())
      errs.name = 'Le nom du produit est requis';
    if (!formData.category)
      errs.category = 'La categorie est requise';
    if (!formData.prixVente || Number(formData.prixVente) < 0)
      errs.prixVente = 'Le prix de vente est requis';
    if (!formData.prixAchat || Number(formData.prixAchat) < 0)
      errs.prixAchat = "Le prix d'achat est requis";
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
      name:         formData.name.trim(),
      category:     formData.category,
      prixVente:    Number(formData.prixVente),
      prixAchat:    Number(formData.prixAchat),
      tauxTVA:      Number(formData.tauxTVA),
      unite:        formData.unite        || undefined,
      description:  formData.description  || undefined,
      marque:       formData.marque        || undefined,
      barcode:      formData.barcode       || undefined,
      stockMinimum: formData.stockMinimum !== '' ? Number(formData.stockMinimum) : undefined,
      stockAlerte:  formData.stockAlerte  !== '' ? Number(formData.stockAlerte)  : undefined,
      isActive:     formData.isActive,
    };

    try {
      if (isEditMode) {
        await updateProduct({ id, ...payload }).unwrap();
        toast.success('Produit modifie avec succes');
      } else {
        await createProduct(payload).unwrap();
        toast.success('Produit cree avec succes');
      }
      navigate('/produits');
    } catch (err) {
      toast.error(
        err.data?.message ||
          `Erreur lors de ${isEditMode ? 'la modification' : 'la creation'} du produit`
      );
    }
  };

  if (isEditMode && isLoadingProduct) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2 text-muted">Chargement du produit...</p>
      </div>
    );
  }

  const categories = categoriesData?.data || [];
  const isSaving   = isCreating || isUpdating;

  return (
    <>
      {/* ── En-tête ─────────────────────────────────────────────────────── */}
      <div className="page-header">
        <div>
          <h1 className="mb-0">
            {isEditMode ? 'Modifier le Produit' : 'Nouveau Produit'}
          </h1>
          <p className="text-muted mb-0 small mt-1">
            {isEditMode
              ? 'Mettez a jour les informations du produit'
              : 'Remplissez les informations pour creer un produit dans le catalogue'}
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
                <SectionTitle
                  icon={FiTag}
                  title="Identification"
                  sub="Informations principales du produit"
                />

                {/* Type */}
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold small">Type</Form.Label>
                  <div className="d-flex gap-3">
                    {[
                      { val: 'produit', label: 'Produit physique', Icon: FiPackage, color: '#3b82f6' },
                      { val: 'service', label: 'Service',          Icon: FiTool,    color: '#06b6d4' },
                    ].map(({ val, label, Icon, color }) => (
                      <label
                        key={val}
                        className="d-flex align-items-center gap-2 px-3 py-2 rounded-3 cursor-pointer"
                        style={{
                          border: `2px solid ${formData.type === val ? color : '#e2e8f0'}`,
                          background: formData.type === val ? `${color}10` : '#fff',
                          cursor: 'pointer',
                          transition: '0.2s',
                          flex: 1,
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
                        <Icon size={16} color={formData.type === val ? color : '#94a3b8'} />
                        <span style={{ fontSize: 14, color: formData.type === val ? color : '#64748b', fontWeight: formData.type === val ? 600 : 400 }}>
                          {label}
                        </span>
                      </label>
                    ))}
                  </div>
                </Form.Group>

                <Row className="g-3">
                  <Col md={8}>
                    <Form.Group>
                      <Form.Label className="fw-semibold small">
                        Designation <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        isInvalid={!!errors.name}
                        placeholder="Nom complet du produit ou service"
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.name}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>

                  <Col md={4}>
                    <Form.Group>
                      <Form.Label className="fw-semibold small">Marque</Form.Label>
                      <Form.Control
                        type="text"
                        name="marque"
                        value={formData.marque}
                        onChange={handleChange}
                        placeholder="Marque / fabricant"
                      />
                    </Form.Group>
                  </Col>

                  <Col md={12}>
                    <Form.Group>
                      <Form.Label className="fw-semibold small">Description</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Description detaillee du produit (optionnel)"
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* Tarification */}
            <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: 12 }}>
              <Card.Body className="p-4">
                <SectionTitle
                  icon={FiDollarSign}
                  title="Tarification"
                  sub="Prix en FCFA (entiers)"
                />

                <Row className="g-3">
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label className="fw-semibold small">
                        Prix de Vente TTC <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        type="number"
                        name="prixVente"
                        value={formData.prixVente}
                        onChange={handleChange}
                        isInvalid={!!errors.prixVente}
                        min="0"
                        step="1"
                        placeholder="0"
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.prixVente}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>

                  <Col md={4}>
                    <Form.Group>
                      <Form.Label className="fw-semibold small">
                        Prix d'Achat <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        type="number"
                        name="prixAchat"
                        value={formData.prixAchat}
                        onChange={handleChange}
                        isInvalid={!!errors.prixAchat}
                        min="0"
                        step="1"
                        placeholder="0"
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.prixAchat}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>

                  <Col md={4}>
                    <Form.Group>
                      <Form.Label className="fw-semibold small">
                        Taux TVA <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Select
                        name="tauxTVA"
                        value={formData.tauxTVA}
                        onChange={handleChange}
                      >
                        <option value={18}>18% — TVA normale</option>
                        <option value={0}>0% — Exonere de TVA</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                {/* Apercu calcul */}
                <PricePreview
                  prixVente={formData.prixVente}
                  prixAchat={formData.prixAchat}
                  tauxTVA={formData.tauxTVA}
                />
              </Card.Body>
            </Card>

            {/* Stock — seulement pour les produits physiques */}
            {formData.type === 'produit' && (
              <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: 12 }}>
                <Card.Body className="p-4">
                  <SectionTitle
                    icon={FiBox}
                    title="Gestion du Stock"
                    sub="Seuils d'alerte et de reapprovisionnement"
                  />

                  <Row className="g-3">
                    <Col md={4}>
                      <Form.Group>
                        <Form.Label className="fw-semibold small">Stock Minimum</Form.Label>
                        <Form.Control
                          type="number"
                          name="stockMinimum"
                          value={formData.stockMinimum}
                          onChange={handleChange}
                          min="0"
                          step="1"
                        />
                        <Form.Text className="text-muted">
                          Seuil de reapprovisionnement
                        </Form.Text>
                      </Form.Group>
                    </Col>

                    <Col md={4}>
                      <Form.Group>
                        <Form.Label className="fw-semibold small">Stock Alerte</Form.Label>
                        <Form.Control
                          type="number"
                          name="stockAlerte"
                          value={formData.stockAlerte}
                          onChange={handleChange}
                          min="0"
                          step="1"
                        />
                        <Form.Text className="text-muted">
                          Declenchement des notifications
                        </Form.Text>
                      </Form.Group>
                    </Col>

                    <Col md={4}>
                      <Form.Group>
                        <Form.Label className="fw-semibold small">Unite de mesure</Form.Label>
                        <Form.Control
                          type="text"
                          name="unite"
                          value={formData.unite}
                          onChange={handleChange}
                          placeholder="Unite, kg, litre, m²..."
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            )}

          </Col>

          {/* ── Colonne laterale ────────────────────────────────────────── */}
          <Col lg={4}>

            {/* Classification */}
            <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: 12 }}>
              <Card.Body className="p-4">
                <SectionTitle
                  icon={FiPackage}
                  title="Classification"
                  sub="Categorie et code-barres"
                />

                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold small">
                    Categorie <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    isInvalid={!!errors.category}
                  >
                    <option value="">— Choisir une categorie —</option>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.name}
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">
                    {errors.category}
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group>
                  <Form.Label className="fw-semibold small">Code-barres</Form.Label>
                  <Form.Control
                    type="text"
                    name="barcode"
                    value={formData.barcode}
                    onChange={handleChange}
                    placeholder="EAN-13, QR code..."
                  />
                </Form.Group>
              </Card.Body>
            </Card>

            {/* Statut */}
            <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: 12 }}>
              <Card.Body className="p-4">
                <SectionTitle
                  icon={FiInfo}
                  title="Statut"
                  sub="Visibilite dans le catalogue"
                />

                <div
                  className="d-flex align-items-center justify-content-between p-3 rounded-3"
                  style={{ background: formData.isActive ? '#f0fdf4' : '#fef2f2', border: `1px solid ${formData.isActive ? '#86efac' : '#fca5a5'}` }}
                >
                  <div>
                    <div className="fw-semibold" style={{ fontSize: 14, color: formData.isActive ? '#16a34a' : '#dc2626' }}>
                      {formData.isActive ? 'Produit actif' : 'Produit inactif'}
                    </div>
                    <div className="text-muted" style={{ fontSize: 12 }}>
                      {formData.isActive
                        ? 'Visible dans le catalogue et les devis'
                        : 'Masque dans le catalogue'}
                    </div>
                  </div>
                  <Form.Check
                    type="switch"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleChange}
                    style={{ transform: 'scale(1.2)' }}
                  />
                </div>
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
                    {isEditMode ? 'Sauvegarder les modifications' : 'Creer le produit'}
                  </>
                )}
              </Button>

              <Button
                variant="outline-secondary"
                onClick={() => navigate('/produits')}
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

export default ProductFormPage;
