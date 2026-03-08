import React from 'react';
import ProgressBar from 'react-bootstrap/ProgressBar';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';
import { formatMoney } from '../../utils/formatters';

/**
 * Encours client vs plafond de crédit — barre de progression colorée.
 *
 * @param {number}  props.encours    - Montant total des factures impayées
 * @param {number}  props.plafond    - Plafond de crédit autorisé
 * @param {boolean} props.showLabels - Afficher les montants sous la barre (défaut: true)
 * @param {boolean} props.compact    - Mode compact sans labels (défaut: false)
 */
const ClientSolvabilite = ({ encours = 0, plafond = 0, showLabels = true, compact = false }) => {
  if (!plafond || plafond <= 0) {
    return (
      <span className="text-muted small">Aucun plafond défini</span>
    );
  }

  const pct = Math.min(Math.round((encours / plafond) * 100), 100);
  const variant = pct >= 90 ? 'danger' : pct >= 70 ? 'warning' : 'success';
  const disponible = Math.max(plafond - encours, 0);

  const tooltipText = `Encours : ${formatMoney(encours)} / Plafond : ${formatMoney(plafond)} — Disponible : ${formatMoney(disponible)}`;

  return (
    <OverlayTrigger placement="top" overlay={<Tooltip>{tooltipText}</Tooltip>}>
      <div style={{ minWidth: compact ? 80 : 140 }}>
        <ProgressBar
          now={pct}
          variant={variant}
          style={{ height: compact ? 6 : 10, cursor: 'default' }}
          label={pct >= 20 ? `${pct}%` : ''}
        />
        {showLabels && !compact && (
          <div className="d-flex justify-content-between mt-1" style={{ fontSize: '0.75rem' }}>
            <span className="text-muted">
              Encours : <strong>{formatMoney(encours)}</strong>
            </span>
            <span className="text-muted">
              / {formatMoney(plafond)}
            </span>
          </div>
        )}
      </div>
    </OverlayTrigger>
  );
};

export default ClientSolvabilite;
