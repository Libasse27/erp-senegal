import React from 'react';
import Form from 'react-bootstrap/Form';
import { useGetProductsQuery } from '../../redux/api/productsApi';

/**
 * Select produit autonome. Appelle onSelect(productId, productObject|null)
 * pour permettre au parent de pré-remplir la désignation et le prix.
 */
const ProductSelect = ({ value, onSelect }) => {
  const { data } = useGetProductsQuery({ limit: 1000, isActive: true });
  const products = data?.data || [];

  const handleChange = (e) => {
    const productId = e.target.value;
    const product = products.find((p) => p._id === productId) || null;
    onSelect(productId, product);
  };

  return (
    <Form.Select size="sm" value={value} onChange={handleChange}>
      <option value="">Aucun</option>
      {products.map((p) => (
        <option key={p._id} value={p._id}>
          {p.reference} - {p.nom}
        </option>
      ))}
    </Form.Select>
  );
};

export default ProductSelect;
