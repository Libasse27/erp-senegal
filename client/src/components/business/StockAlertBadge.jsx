import React from 'react';
import Badge from 'react-bootstrap/Badge';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';
import { FiAlertTriangle, FiAlertOctagon } from 'react-icons/fi';

/**
 * Badge d'alerte de stock affiché sur les lignes produit.
 *
 * @param {number} props.quantite      - Stock actuel
 * @param {number} props.seuilAlerte   - Seuil déclenchant l'alerte orange
 * @param {number} props.seuilRupture  - Seuil de rupture rouge (défaut: 0)
 * @param {boolean} props.showCount    - Afficher la quantité dans le badge (défaut: true)
 */
const StockAlertBadge = ({
  quantite = 0,
  seuilAlerte = 5,
  seuilRupture = 0,
  showCount = true,
}) => {
  if (quantite > seuilAlerte) return null;

  const isRupture = quantite <= seuilRupture;
  const variant = isRupture ? 'danger' : 'warning';
  const Icon = isRupture ? FiAlertOctagon : FiAlertTriangle;
  const label = isRupture ? 'Rupture de stock' : 'Stock faible';
  const text = showCount ? `${label} (${quantite})` : label;

  return (
    <OverlayTrigger
      placement="top"
      overlay={
        <Tooltip>
          {isRupture
            ? `Rupture — stock actuel : ${quantite}`
            : `Stock faible — ${quantite} unité(s) restante(s), seuil : ${seuilAlerte}`}
        </Tooltip>
      }
    >
      <Badge
        bg={variant}
        className="d-inline-flex align-items-center gap-1"
        style={{ cursor: 'default' }}
      >
        <Icon size={11} />
        {text}
      </Badge>
    </OverlayTrigger>
  );
};

export default StockAlertBadge;
