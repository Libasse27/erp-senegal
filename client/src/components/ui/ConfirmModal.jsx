import React from 'react';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';

/**
 * Confirmation dialog modal
 * @param {Object} props
 * @param {boolean} props.show - Show/hide modal
 * @param {Function} props.onHide - Callback when modal is hidden
 * @param {Function} props.onConfirm - Callback when confirmed
 * @param {string} props.title - Modal title
 * @param {string} props.message - Confirmation message
 * @param {string} props.confirmLabel - Confirm button label (default: 'Confirmer')
 * @param {string} props.confirmVariant - Confirm button variant (default: 'danger')
 * @param {boolean} props.isLoading - Loading state
 */
const ConfirmModal = ({
  show,
  onHide,
  onConfirm,
  title = 'Confirmation',
  message = 'Êtes-vous sûr de vouloir continuer?',
  confirmLabel = 'Confirmer',
  confirmVariant = 'danger',
  isLoading = false,
}) => {
  const handleConfirm = () => {
    if (onConfirm && !isLoading) {
      onConfirm();
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p className="mb-0">{message}</p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={isLoading}>
          Annuler
        </Button>
        <Button variant={confirmVariant} onClick={handleConfirm} disabled={isLoading}>
          {isLoading ? (
            <>
              <Spinner
                as="span"
                animation="border"
                size="sm"
                role="status"
                aria-hidden="true"
                className="me-2"
              />
              Chargement...
            </>
          ) : (
            confirmLabel
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ConfirmModal;
