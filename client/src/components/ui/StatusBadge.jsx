import React from 'react';
import Badge from 'react-bootstrap/Badge';

/**
 * Status badge component for documents, payments, quotes, orders
 * @param {Object} props
 * @param {string} props.status - Status value
 * @param {string} props.type - Type: 'document'|'payment'|'quote'|'order'
 */
const StatusBadge = ({ status, type = 'document' }) => {
  const getStatusConfig = () => {
    const statusLower = status?.toLowerCase();

    // Document statuses
    const documentStatuses = {
      brouillon: { variant: 'secondary', label: 'Brouillon' },
      validee: { variant: 'success', label: 'Validée' },
      valide: { variant: 'success', label: 'Validé' },
      envoyee: { variant: 'info', label: 'Envoyée' },
      envoye: { variant: 'info', label: 'Envoyé' },
      annulee: { variant: 'danger', label: 'Annulée' },
      annule: { variant: 'danger', label: 'Annulé' },
    };

    // Payment statuses
    const paymentStatuses = {
      non_payee: { variant: 'warning', label: 'Non payée' },
      partiellement_payee: { variant: 'warning', label: 'Partiellement payée' },
      payee: { variant: 'success', label: 'Payée' },
      en_retard: { variant: 'danger', label: 'En retard' },
    };

    // Quote statuses
    const quoteStatuses = {
      brouillon: { variant: 'secondary', label: 'Brouillon' },
      envoyee: { variant: 'info', label: 'Envoyée' },
      accepte: { variant: 'success', label: 'Accepté' },
      refuse: { variant: 'danger', label: 'Refusé' },
      expire: { variant: 'dark', label: 'Expiré' },
      converti: { variant: 'primary', label: 'Converti' },
      annulee: { variant: 'danger', label: 'Annulée' },
    };

    // Order statuses
    const orderStatuses = {
      brouillon: { variant: 'secondary', label: 'Brouillon' },
      confirmee: { variant: 'primary', label: 'Confirmée' },
      en_cours: { variant: 'info', label: 'En cours' },
      livree: { variant: 'success', label: 'Livrée' },
      partiellement_livree: { variant: 'warning', label: 'Partiellement livrée' },
      annulee: { variant: 'danger', label: 'Annulée' },
    };

    let statusMap = {};

    switch (type) {
      case 'payment':
        statusMap = paymentStatuses;
        break;
      case 'quote':
        statusMap = quoteStatuses;
        break;
      case 'order':
        statusMap = orderStatuses;
        break;
      case 'document':
      default:
        statusMap = documentStatuses;
        break;
    }

    return (
      statusMap[statusLower] || { variant: 'secondary', label: status || 'Inconnu' }
    );
  };

  const { variant, label } = getStatusConfig();

  return <Badge bg={variant}>{label}</Badge>;
};

export default StatusBadge;
