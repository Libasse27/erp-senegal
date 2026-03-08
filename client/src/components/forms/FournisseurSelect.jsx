import React from 'react';
import Form from 'react-bootstrap/Form';
import { useGetFournisseursQuery } from '../../redux/api/fournisseursApi';

const FournisseurSelect = ({ value, onChange, error, required = true }) => {
  const { data } = useGetFournisseursQuery({ limit: 1000, isActive: true });
  const fournisseurs = data?.data || [];

  return (
    <Form.Group>
      <Form.Label>
        Fournisseur {required && <span className="text-danger">*</span>}
      </Form.Label>
      <Form.Select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        isInvalid={!!error}
        required={required}
      >
        <option value="">Selectionner un fournisseur</option>
        {fournisseurs.map((f) => (
          <option key={f._id} value={f._id}>
            {f.raisonSociale}{f.email ? ` - ${f.email}` : ''}
          </option>
        ))}
      </Form.Select>
      {error && (
        <Form.Control.Feedback type="invalid">{error}</Form.Control.Feedback>
      )}
    </Form.Group>
  );
};

export default FournisseurSelect;
