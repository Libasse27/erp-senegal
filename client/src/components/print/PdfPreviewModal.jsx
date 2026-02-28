import React from 'react';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import { FiDownload, FiPrinter, FiX } from 'react-icons/fi';

const PdfPreviewModal = ({ show, onHide, blobUrl, documentTitle, onDownload, onPrint }) => {
  return (
    <Modal show={show} onHide={onHide} size="xl" fullscreen="lg-down">
      <Modal.Header closeButton>
        <Modal.Title>Apercu — {documentTitle}</Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ height: '80vh', padding: 0 }}>
        {blobUrl && (
          <iframe
            src={blobUrl}
            width="100%"
            height="100%"
            title="Apercu PDF"
            style={{ border: 'none' }}
          />
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          <FiX className="me-2" />
          Fermer
        </Button>
        {onPrint && (
          <Button variant="outline-primary" onClick={onPrint}>
            <FiPrinter className="me-2" />
            Imprimer
          </Button>
        )}
        {onDownload && (
          <Button variant="primary" onClick={onDownload}>
            <FiDownload className="me-2" />
            Telecharger
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default PdfPreviewModal;
