import React from 'react';
import Table from 'react-bootstrap/Table';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import { formatMoney } from '../../utils/formatters';
import ProductSelect from './ProductSelect';

export const LIGNE_VIDE = {
  product: '',
  designation: '',
  quantite: 1,
  prixUnitaire: 0,
  remise: 0,
  tauxTVA: 18,
};

export const calculateLigne = (l) => {
  const sousTotal = Number(l.quantite) * Number(l.prixUnitaire);
  const montantRemise = Math.round((sousTotal * Number(l.remise)) / 100);
  const ht = sousTotal - montantRemise;
  const tva = Math.round((ht * Number(l.tauxTVA)) / 100);
  return { sousTotal, montantRemise, ht, tva, ttc: ht + tva };
};

const LignesDocumentEditor = ({ lignes, onChange, label = 'Lignes', requireProduct = false }) => {
  const addLigne = () => {
    onChange([...lignes, { ...LIGNE_VIDE }]);
  };

  const removeLigne = (index) => {
    onChange(lignes.filter((_, i) => i !== index));
  };

  const updateLigne = (index, field, value) => {
    const updated = lignes.map((l, i) => (i === index ? { ...l, [field]: value } : l));
    onChange(updated);
  };

  const handleProductSelect = (index, productId, product) => {
    const updated = lignes.map((l, i) => {
      if (i !== index) return l;
      return {
        ...l,
        product: productId,
        designation: product ? product.nom || l.designation : l.designation,
        prixUnitaire: product ? product.prixVente || 0 : l.prixUnitaire,
      };
    });
    onChange(updated);
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h6 className="mb-0">{label}</h6>
        <Button variant="primary" size="sm" onClick={addLigne}>
          <FiPlus className="me-1" />
          Ajouter une ligne
        </Button>
      </div>

      <Table responsive bordered className="mb-0">
        <thead className="table-light">
          <tr>
            <th style={{ width: '20%' }}>
              Produit {requireProduct && <span className="text-danger">*</span>}
            </th>
            <th style={{ width: '24%' }}>Designation *</th>
            <th style={{ width: '9%' }}>Qte *</th>
            <th style={{ width: '12%' }}>Prix unit. *</th>
            <th style={{ width: '8%' }}>Remise %</th>
            <th style={{ width: '8%' }}>TVA %</th>
            <th style={{ width: '14%' }} className="text-end">
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
                  <ProductSelect
                    value={ligne.product}
                    onSelect={(id, product) => handleProductSelect(index, id, product)}
                  />
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
                    <option value="18">18%</option>
                    <option value="0">0%</option>
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
    </div>
  );
};

export default LignesDocumentEditor;
