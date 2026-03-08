import React from 'react';
import Form from 'react-bootstrap/Form';
import { useGetClientsQuery } from '../../redux/api/clientsApi';

const ClientSelect = ({ value, onChange, error, required = true }) => {
  const { data } = useGetClientsQuery({ limit: 1000, isActive: true });
  const clients = data?.data || [];

  return (
    <Form.Group>
      <Form.Label>
        Client {required && <span className="text-danger">*</span>}
      </Form.Label>
      <Form.Select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        isInvalid={!!error}
        required={required}
      >
        <option value="">Selectionner un client</option>
        {clients.map((client) => (
          <option key={client._id} value={client._id}>
            {client.nom}{client.email ? ` - ${client.email}` : ''}
          </option>
        ))}
      </Form.Select>
      {error && (
        <Form.Control.Feedback type="invalid">{error}</Form.Control.Feedback>
      )}
    </Form.Group>
  );
};

export default ClientSelect;
