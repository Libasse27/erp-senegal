import React from 'react';
import Button from 'react-bootstrap/Button';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import { FiEye, FiPrinter, FiDownload } from 'react-icons/fi';

/**
 * Barre d'actions PDF commune à toutes les pages détail.
 * S'intègre avec usePdfActions.
 *
 * @param {Function} props.onPreview  - () => previewPdf(path)
 * @param {Function} props.onPrint    - () => printPdf(path)
 * @param {Function} props.onDownload - () => downloadPdf(path, filename)
 * @param {boolean}  props.isLoading  - désactive tous les boutons pendant le chargement PDF
 * @param {string}   [props.className] - classe CSS additionnelle sur le ButtonGroup
 *
 * Exemple d'usage :
 * const { downloadPdf, printPdf, previewPdf, isLoading: isPdfLoading } = usePdfActions();
 * <PrintToolbar
 *   onPreview={() => previewPdf(pdfPath)}
 *   onPrint={() => printPdf(pdfPath)}
 *   onDownload={() => downloadPdf(pdfPath, pdfFilename)}
 *   isLoading={isPdfLoading}
 * />
 */
const PrintToolbar = ({ onPreview, onPrint, onDownload, isLoading = false, className = '' }) => (
  <ButtonGroup className={className}>
    {onPreview && (
      <Button
        variant="outline-secondary"
        onClick={onPreview}
        disabled={isLoading}
        title="Apercu PDF"
      >
        <FiEye className="me-1" />
        Apercu
      </Button>
    )}
    {onPrint && (
      <Button
        variant="outline-secondary"
        onClick={onPrint}
        disabled={isLoading}
        title="Imprimer"
      >
        <FiPrinter className="me-1" />
        Imprimer
      </Button>
    )}
    {onDownload && (
      <Button
        variant="secondary"
        onClick={onDownload}
        disabled={isLoading}
        title="Telecharger PDF"
      >
        <FiDownload className="me-1" />
        {isLoading ? 'Chargement...' : 'Telecharger PDF'}
      </Button>
    )}
  </ButtonGroup>
);

export default PrintToolbar;
