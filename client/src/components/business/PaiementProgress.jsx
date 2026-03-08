import React from 'react';
import ProgressBar from 'react-bootstrap/ProgressBar';
import { formatMoney } from '../../utils/formatters';

/**
 * Barre de progression montant payé / total — avec reste dû.
 *
 * @param {number}  props.montantTotal  - Montant TTC total du document
 * @param {number}  props.montantPaye   - Montant déjà encaissé
 * @param {boolean} props.showAmounts   - Afficher les montants sous la barre (défaut: true)
 * @param {boolean} props.compact       - Barre fine sans montants (défaut: false)
 */
const PaiementProgress = ({
  montantTotal = 0,
  montantPaye = 0,
  showAmounts = true,
  compact = false,
}) => {
  if (!montantTotal || montantTotal <= 0) return null;

  const pct = Math.min(Math.round((montantPaye / montantTotal) * 100), 100);
  const resteDu = Math.max(montantTotal - montantPaye, 0);
  const isComplet = pct >= 100;

  const variant = isComplet ? 'success' : pct >= 50 ? 'info' : 'warning';

  return (
    <div style={{ minWidth: compact ? 80 : 160 }}>
      <ProgressBar
        now={pct}
        variant={variant}
        style={{ height: compact ? 6 : 10 }}
        label={!compact && pct >= 15 ? `${pct}%` : ''}
      />
      {showAmounts && !compact && (
        <div className="mt-1" style={{ fontSize: '0.75rem' }}>
          <div className="d-flex justify-content-between">
            <span className="text-muted">
              Payé : <strong className="text-success">{formatMoney(montantPaye)}</strong>
            </span>
            <span className="text-muted">{pct}%</span>
          </div>
          {!isComplet && (
            <div className="text-muted">
              Reste dû : <strong className="text-danger">{formatMoney(resteDu)}</strong>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PaiementProgress;
