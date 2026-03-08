import React from 'react';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import { formatMoney } from '../../utils/formatters';

/**
 * Affiche le résumé HT / TVA / TTC d'un document.
 *
 * Props:
 *   totals              { totalHT, totalTVA, totalTTC, remiseGlobaleAmount?, totalRemise? }
 *   remiseGlobale       number  — si fourni, affiche un champ remise globale éditable (mode devis)
 *   onRemiseGlobaleChange fn   — requis si remiseGlobale est fourni
 */
const TotauxDocument = ({ totals, remiseGlobale, onRemiseGlobaleChange }) => {
  const hasRemiseGlobale = remiseGlobale !== undefined && onRemiseGlobaleChange;
  const hasRemiseLignes = !hasRemiseGlobale && totals.totalRemise > 0;

  return (
    <Row>
      <Col md={8} />
      <Col md={4}>
        <div className="d-flex justify-content-between mb-2">
          <span>Total HT :</span>
          <strong>{formatMoney(totals.totalHT)}</strong>
        </div>

        {hasRemiseGlobale && (
          <div className="d-flex justify-content-between mb-2 align-items-center">
            <div className="d-flex align-items-center gap-1">
              <span>Remise globale :</span>
              <Form.Control
                type="number"
                min="0"
                max="100"
                size="sm"
                style={{ width: '70px' }}
                value={remiseGlobale}
                onChange={(e) => onRemiseGlobaleChange(Number(e.target.value))}
              />
              <span>%</span>
            </div>
            <strong>-{formatMoney(totals.remiseGlobaleAmount || 0)}</strong>
          </div>
        )}

        {hasRemiseLignes && (
          <div className="d-flex justify-content-between mb-2">
            <span>Total remises :</span>
            <strong>-{formatMoney(totals.totalRemise)}</strong>
          </div>
        )}

        <div className="d-flex justify-content-between mb-2">
          <span>Total TVA :</span>
          <strong>{formatMoney(totals.totalTVA)}</strong>
        </div>

        <hr className="my-2" />

        <div className="d-flex justify-content-between">
          <strong>Total TTC :</strong>
          <h5 className="text-primary mb-0">{formatMoney(totals.totalTTC)}</h5>
        </div>
      </Col>
    </Row>
  );
};

export default TotauxDocument;
