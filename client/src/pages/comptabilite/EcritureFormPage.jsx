import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Card from 'react-bootstrap/Card';
import Table from 'react-bootstrap/Table';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import { FiPlus, FiTrash2, FiSave, FiX } from 'react-icons/fi';
import { toast } from 'react-toastify';
import usePageTitle from '../../hooks/usePageTitle';
import { formatMoney } from '../../utils/formatters';
import {
  useGetPlanComptableQuery,
  useGetEcritureQuery,
  useCreateEcritureMutation,
  useUpdateEcritureMutation
} from '../../redux/api/comptabiliteApi';

const JOURNAL_OPTIONS = [
  { value: 'VE', label: 'VE - Ventes' },
  { value: 'AC', label: 'AC - Achats' },
  { value: 'BQ', label: 'BQ - Banque' },
  { value: 'CA', label: 'CA - Caisse' },
  { value: 'OD', label: 'OD - Operations Diverses' }
];

const EMPTY_LINE = {
  compte: '',
  libelle: '',
  debit: 0,
  credit: 0
};

export default function EcritureFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  usePageTitle(
    isEditMode ? 'Modifier Ecriture' : 'Nouvelle Ecriture',
    [
      { label: 'Accueil', path: '/' },
      { label: 'Comptabilite' },
      { label: 'Ecritures', path: '/comptabilite/ecritures' },
      { label: isEditMode ? 'Modifier' : 'Nouveau' }
    ]
  );

  const [formData, setFormData] = useState({
    journal: 'OD',
    date: new Date().toISOString().split('T')[0],
    libelle: '',
    pieceRef: '',
    lignes: [{ ...EMPTY_LINE }, { ...EMPTY_LINE }]
  });

  const [errors, setErrors] = useState({});

  const { data: planComptable, isLoading: isLoadingPlan } = useGetPlanComptableQuery();
  const { data: ecritureData, isLoading: isLoadingEcriture } = useGetEcritureQuery(id, {
    skip: !isEditMode
  });
  const [createEcriture, { isLoading: isCreating }] = useCreateEcritureMutation();
  const [updateEcriture, { isLoading: isUpdating }] = useUpdateEcritureMutation();

  // Load existing ecriture data
  useEffect(() => {
    if (isEditMode && ecritureData?.data) {
      const ecriture = ecritureData.data;
      setFormData({
        journal: ecriture.journal,
        date: new Date(ecriture.date).toISOString().split('T')[0],
        libelle: ecriture.libelle,
        pieceRef: ecriture.pieceRef || '',
        lignes: ecriture.lignes.map(ligne => ({
          compte: ligne.compte._id,
          libelle: ligne.libelle,
          debit: ligne.debit,
          credit: ligne.credit
        }))
      });
    }
  }, [ecritureData, isEditMode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLineChange = (index, field, value) => {
    setFormData(prev => {
      const newLignes = [...prev.lignes];
      newLignes[index] = {
        ...newLignes[index],
        [field]: field === 'debit' || field === 'credit' ? parseFloat(value) || 0 : value
      };
      return { ...prev, lignes: newLignes };
    });
  };

  const addLine = () => {
    setFormData(prev => ({
      ...prev,
      lignes: [...prev.lignes, { ...EMPTY_LINE }]
    }));
  };

  const removeLine = (index) => {
    if (formData.lignes.length <= 2) {
      toast.warning('Une ecriture doit avoir au moins 2 lignes');
      return;
    }
    setFormData(prev => ({
      ...prev,
      lignes: prev.lignes.filter((_, i) => i !== index)
    }));
  };

  const calculateTotals = () => {
    return formData.lignes.reduce(
      (acc, ligne) => ({
        debit: acc.debit + (ligne.debit || 0),
        credit: acc.credit + (ligne.credit || 0)
      }),
      { debit: 0, credit: 0 }
    );
  };

  const validate = () => {
    const newErrors = {};

    // Check basic fields
    if (!formData.journal) newErrors.journal = 'Le journal est requis';
    if (!formData.date) newErrors.date = 'La date est requise';
    if (!formData.libelle) newErrors.libelle = 'Le libelle est requis';

    // Check lines
    if (formData.lignes.length < 2) {
      newErrors.lignes = 'Une ecriture doit avoir au moins 2 lignes';
    }

    formData.lignes.forEach((ligne, index) => {
      if (!ligne.compte) {
        newErrors[`ligne_${index}_compte`] = 'Le compte est requis';
      }
      if (!ligne.libelle) {
        newErrors[`ligne_${index}_libelle`] = 'Le libelle est requis';
      }
      if (ligne.debit > 0 && ligne.credit > 0) {
        newErrors[`ligne_${index}_montant`] = 'Une ligne doit avoir soit un debit, soit un credit';
      }
      if (ligne.debit === 0 && ligne.credit === 0) {
        newErrors[`ligne_${index}_montant`] = 'Une ligne doit avoir un montant';
      }
    });

    // Check totals
    const totals = calculateTotals();
    if (Math.abs(totals.debit - totals.credit) > 0.01) {
      newErrors.totals = 'Le total debit doit etre egale au total credit';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      toast.error('Veuillez corriger les erreurs dans le formulaire');
      return;
    }

    try {
      const payload = {
        ...formData,
        lignes: formData.lignes.map(ligne => ({
          compte: ligne.compte,
          libelle: ligne.libelle,
          debit: ligne.debit || 0,
          credit: ligne.credit || 0
        }))
      };

      if (isEditMode) {
        await updateEcriture({ id, ...payload }).unwrap();
        toast.success('Ecriture modifiee avec succes');
      } else {
        await createEcriture(payload).unwrap();
        toast.success('Ecriture creee avec succes');
      }

      navigate('/comptabilite/ecritures');
    } catch (err) {
      toast.error(err.data?.message || 'Une erreur est survenue');
    }
  };

  const totals = calculateTotals();
  const ecart = totals.debit - totals.credit;

  if (isLoadingPlan || (isEditMode && isLoadingEcriture)) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Chargement...</p>
      </div>
    );
  }

  const comptes = planComptable?.data || [];

  // Group comptes by classe for better organization
  const groupedComptes = comptes.reduce((acc, compte) => {
    if (!acc[compte.classe]) {
      acc[compte.classe] = [];
    }
    acc[compte.classe].push(compte);
    return acc;
  }, {});

  return (
    <div>
      <Card>
        <Card.Header>
          <h5 className="mb-0">
            {isEditMode ? 'Modifier une ecriture' : 'Nouvelle ecriture comptable'}
          </h5>
        </Card.Header>
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <Row className="mb-3">
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Journal <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    name="journal"
                    value={formData.journal}
                    onChange={handleChange}
                    isInvalid={!!errors.journal}
                    required
                  >
                    {JOURNAL_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">
                    {errors.journal}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Date <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    isInvalid={!!errors.date}
                    required
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.date}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Piece de reference</Form.Label>
                  <Form.Control
                    type="text"
                    name="pieceRef"
                    value={formData.pieceRef}
                    onChange={handleChange}
                    placeholder="Ex: FAC-2026-001"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row className="mb-3">
              <Col md={12}>
                <Form.Group>
                  <Form.Label>Libelle <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    name="libelle"
                    value={formData.libelle}
                    onChange={handleChange}
                    isInvalid={!!errors.libelle}
                    placeholder="Description de l'operation"
                    required
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.libelle}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            {errors.lignes && (
              <Alert variant="danger">{errors.lignes}</Alert>
            )}

            <div className="table-responsive">
              <Table bordered>
                <thead className="table-light">
                  <tr>
                    <th style={{ width: '30%' }}>Compte <span className="text-danger">*</span></th>
                    <th style={{ width: '30%' }}>Libelle <span className="text-danger">*</span></th>
                    <th style={{ width: '15%' }} className="text-end">Debit</th>
                    <th style={{ width: '15%' }} className="text-end">Credit</th>
                    <th style={{ width: '10%' }} className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.lignes.map((ligne, index) => (
                    <tr key={index}>
                      <td>
                        <Form.Select
                          value={ligne.compte}
                          onChange={(e) => handleLineChange(index, 'compte', e.target.value)}
                          isInvalid={!!errors[`ligne_${index}_compte`]}
                          size="sm"
                        >
                          <option value="">Selectionner un compte...</option>
                          {Object.entries(groupedComptes).map(([classe, comptesInClasse]) => (
                            <optgroup key={classe} label={`Classe ${classe}`}>
                              {comptesInClasse.map(compte => (
                                <option key={compte._id} value={compte._id}>
                                  {compte.numero} - {compte.libelle}
                                </option>
                              ))}
                            </optgroup>
                          ))}
                        </Form.Select>
                      </td>
                      <td>
                        <Form.Control
                          type="text"
                          value={ligne.libelle}
                          onChange={(e) => handleLineChange(index, 'libelle', e.target.value)}
                          isInvalid={!!errors[`ligne_${index}_libelle`]}
                          size="sm"
                          placeholder="Description"
                        />
                      </td>
                      <td>
                        <Form.Control
                          type="number"
                          value={ligne.debit || ''}
                          onChange={(e) => handleLineChange(index, 'debit', e.target.value)}
                          isInvalid={!!errors[`ligne_${index}_montant`]}
                          size="sm"
                          min="0"
                          step="1"
                          className="text-end"
                        />
                      </td>
                      <td>
                        <Form.Control
                          type="number"
                          value={ligne.credit || ''}
                          onChange={(e) => handleLineChange(index, 'credit', e.target.value)}
                          isInvalid={!!errors[`ligne_${index}_montant`]}
                          size="sm"
                          min="0"
                          step="1"
                          className="text-end"
                        />
                      </td>
                      <td className="text-center">
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => removeLine(index)}
                          disabled={formData.lignes.length <= 2}
                        >
                          <FiTrash2 />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="table-light">
                  <tr>
                    <td colSpan="2" className="text-end">
                      <strong>Totaux:</strong>
                    </td>
                    <td className="text-end">
                      <strong>{formatMoney(totals.debit)}</strong>
                    </td>
                    <td className="text-end">
                      <strong>{formatMoney(totals.credit)}</strong>
                    </td>
                    <td></td>
                  </tr>
                  <tr>
                    <td colSpan="2" className="text-end">
                      <strong>Ecart:</strong>
                    </td>
                    <td colSpan="2" className="text-end">
                      <strong className={ecart !== 0 ? 'text-danger' : 'text-success'}>
                        {formatMoney(Math.abs(ecart))}
                        {ecart !== 0 && ' (Non equilibre)'}
                      </strong>
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </Table>
            </div>

            <div className="mb-3">
              <Button variant="outline-primary" onClick={addLine}>
                <FiPlus className="me-2" />
                Ajouter une ligne
              </Button>
            </div>

            {errors.totals && (
              <Alert variant="danger">{errors.totals}</Alert>
            )}

            <div className="d-flex justify-content-end gap-2">
              <Button
                variant="secondary"
                onClick={() => navigate('/comptabilite/ecritures')}
              >
                <FiX className="me-2" />
                Annuler
              </Button>
              <Button
                variant="primary"
                type="submit"
                disabled={isCreating || isUpdating}
              >
                {isCreating || isUpdating ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <FiSave className="me-2" />
                    {isEditMode ? 'Modifier' : 'Creer'}
                  </>
                )}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
}
