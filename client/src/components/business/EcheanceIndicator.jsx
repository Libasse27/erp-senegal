import React from 'react';
import Badge from 'react-bootstrap/Badge';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';
import { FiCheckCircle, FiClock, FiAlertCircle } from 'react-icons/fi';
import { formatDate } from '../../utils/formatters';

const STATUTS_PAYES = ['payee', 'paye', 'soldee'];

/**
 * Indicateur visuel d'échéance de paiement.
 *
 * @param {string|Date} props.dateEcheance - Date limite de paiement
 * @param {string}      props.statut       - Statut actuel du document
 * @param {boolean}     props.showDate     - Afficher la date dans le badge (défaut: true)
 */
const EcheanceIndicator = ({ dateEcheance, statut = '', showDate = true }) => {
  if (!dateEcheance) return null;

  if (STATUTS_PAYES.includes(statut?.toLowerCase())) {
    return (
      <Badge bg="success" className="d-inline-flex align-items-center gap-1">
        <FiCheckCircle size={11} />
        Payé
      </Badge>
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const echeance = new Date(dateEcheance);
  echeance.setHours(0, 0, 0, 0);
  const diffDays = Math.round((echeance - today) / (1000 * 60 * 60 * 24));

  let variant, Icon, label, tooltipText;

  if (diffDays < 0) {
    variant = 'danger';
    Icon = FiAlertCircle;
    label = `${Math.abs(diffDays)}j de retard`;
    tooltipText = `Echéance dépassée de ${Math.abs(diffDays)} jour(s) — échéance : ${formatDate(dateEcheance)}`;
  } else if (diffDays <= 7) {
    variant = 'warning';
    Icon = FiClock;
    label = diffDays === 0 ? "Aujourd'hui" : `${diffDays}j restants`;
    tooltipText = `Echéance dans ${diffDays} jour(s) — ${formatDate(dateEcheance)}`;
  } else {
    variant = 'success';
    Icon = FiClock;
    label = `${diffDays}j restants`;
    tooltipText = `Echéance le ${formatDate(dateEcheance)}`;
  }

  const badgeText = showDate ? `${formatDate(dateEcheance)} · ${label}` : label;

  return (
    <OverlayTrigger placement="top" overlay={<Tooltip>{tooltipText}</Tooltip>}>
      <Badge
        bg={variant}
        className="d-inline-flex align-items-center gap-1"
        style={{ cursor: 'default' }}
      >
        <Icon size={11} />
        {badgeText}
      </Badge>
    </OverlayTrigger>
  );
};

export default EcheanceIndicator;
