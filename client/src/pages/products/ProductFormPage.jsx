import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Card from 'react-bootstrap/Card';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import { FiSave, FiX } from 'react-icons/fi';
import { toast } from 'react-toastify';
import usePageTitle from '../../hooks/usePageTitle';
import {
  useGetProductQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useGetCategoriesQuery,
} from '../../redux/api/productsApi';

const ProductFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

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
    {
      skip: !isEditMode,
    }
  );
  const { data: categoriesData } = useGetCategoriesQuery();
  const [createProduct, { isLoading: isCreating }] = useCreateProductMutation();
  const [updateProduct, { isLoading: isUpdating }] = useUpdateProductMutation();

  const [formData, setFormData] = useState({
    type: 'produit',
    reference: '',
    designation: '',
    description: '',
    category: '',
    prixVente: '',
    prixAchat: '',
    tva: 18,
    unite: '',
    stockMinimum: '',
    codeBarre: '',
    isActive: true,
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isEditMode && productData?.data) {
      const product = productData.data;
      setFormData({
        type: product.type || 'produit',
        reference: product.reference || '',
        designation: product.designation || '',
        description: product.description || '',
        category: product.category?._id || '',
        prixVente: product.prixVente || '',
        prixAchat: product.prixAchat || '',
        tva: product.tva || 18,
        unite: product.unite || '',
        stockMinimum: product.stockMinimum || '',
        codeBarre: product.codeBarre || '',
        isActive: product.isActive !== false,
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
    const newErrors = {};

    if (!formData.designation.trim()) {
      newErrors.designation = 'La designation est requise';
    }

    if (!formData.prixVente || formData.prixVente <= 0) {
      newErrors.prixVente = 'Le prix de vente doit etre superieur a 0';
    }

    if (!formData.prixAchat || formData.prixAchat <= 0) {
      newErrors.prixAchat = 'Le prix d\'achat doit etre superieur a 0';
    }

    if (formData.stockMinimum && formData.stockMinimum < 0) {
      newErrors.stockMinimum = 'Le stock minimum doit etre positif';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Veuillez corriger les erreurs dans le formulaire');
      return;
    }

    const payload = {
      type: formData.type,
      reference: formData.reference || undefined,
      designation: formData.designation,
      description: formData.description || undefined,
      category: formData.category || undefined,
      prixVente: Number(formData.prixVente),
      prixAchat: Number(formData.prixAchat),
      tva: Number(formData.tva),
      unite: formData.unite || undefined,
      stockMinimum: formData.stockMinimum ? Number(formData.stockMinimum) : undefined,
      codeBarre: formData.codeBarre || undefined,
      isActive: formData.isActive,
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
        <p className="mt-2 text-muted">Chargement...</p>
      </div>
    );
  }

  const categories = categoriesData?.data || [];

  return (
    <>
      <div className="page-header">
        <h1>{isEditMode ? 'Modifier le Produit' : 'Nouveau Produit'}</h1>
      </div>

      <Card className="shadow-sm">
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <Row className="mb-3">
              <Col md={12}>
                <Form.Group>
                  <Form.Label>
                    Type <span className="text-danger">*</span>
                  </Form.Label>
                  <div>
                    <Form.Check
                      inline
                      type="radio"
                      label="Produit"
                      name="type"
                      value="produit"
                      checked={formData.type === 'produit'}
                      onChange={handleChange}
                    />
                    <Form.Check
                      inline
                      type="radio"
                      label="Service"
                      name="type"
                      value="service"
                      checked={formData.type === 'service'}
                      onChange={handleChange}
                    />
                  </div>
                </Form.Group>
              </Col>
            </Row>

            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Reference</Form.Label>
                  <Form.Control
                    type="text"
                    name="reference"
                    value={formData.reference}
                    onChange={handleChange}
                    placeholder="Generee automatiquement si vide"
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label>
                    Designation <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="designation"
                    value={formData.designation}
                    onChange={handleChange}
                    isInvalid={!!errors.designation}
                    placeholder="Nom du produit"
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.designation}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col md={12}>
                <Form.Group>
                  <Form.Label>Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Description detaillee du produit"
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label>Categorie</Form.Label>
                  <Form.Select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                  >
                    <option value="">Aucune categorie</option>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label>Unite</Form.Label>
                  <Form.Control
                    type="text"
                    name="unite"
                    value={formData.unite}
                    onChange={handleChange}
                    placeholder="unite, kg, litre..."
                  />
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group>
                  <Form.Label>
                    Prix de Vente (FCFA) <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="number"
                    name="prixVente"
                    value={formData.prixVente}
                    onChange={handleChange}
                    isInvalid={!!errors.prixVente}
                    min="0"
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.prixVente}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group>
                  <Form.Label>
                    Prix d'Achat (FCFA) <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="number"
                    name="prixAchat"
                    value={formData.prixAchat}
                    onChange={handleChange}
                    isInvalid={!!errors.prixAchat}
                    min="0"
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.prixAchat}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group>
                  <Form.Label>
                    TVA <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Select name="tva" value={formData.tva} onChange={handleChange}>
                    <option value={18}>18%</option>
                    <option value={0}>0% (Exonere)</option>
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label>Stock Minimum</Form.Label>
                  <Form.Control
                    type="number"
                    name="stockMinimum"
                    value={formData.stockMinimum}
                    onChange={handleChange}
                    isInvalid={!!errors.stockMinimum}
                    min="0"
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.stockMinimum}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label>Code-barres</Form.Label>
                  <Form.Control
                    type="text"
                    name="codeBarre"
                    value={formData.codeBarre}
                    onChange={handleChange}
                    placeholder="Code-barres du produit"
                  />
                </Form.Group>
              </Col>

              <Col md={12}>
                <Form.Group>
                  <Form.Check
                    type="checkbox"
                    name="isActive"
                    label="Produit actif"
                    checked={formData.isActive}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
            </Row>

            <div className="d-flex justify-content-end gap-2 mt-4">
              <Button
                variant="outline-secondary"
                onClick={() => navigate('/produits')}
                disabled={isCreating || isUpdating}
              >
                <FiX className="me-1" />
                Annuler
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isCreating || isUpdating}
              >
                {isCreating || isUpdating ? (
                  <>
                    <Spinner
                      as="span"
                      animation="border"
                      size="sm"
                      className="me-2"
                    />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <FiSave className="me-1" />
                    Enregistrer
                  </>
                )}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </>
  );
};

export default ProductFormPage;
