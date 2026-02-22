import React from 'react';
import Button from 'react-bootstrap/Button';

/**
 * Empty state component for lists
 * @param {Object} props
 * @param {React.Component} props.icon - Icon component from react-icons/fi
 * @param {string} props.title - Title text
 * @param {string} props.message - Description message
 * @param {string} props.actionLabel - Optional action button label
 * @param {Function} props.onAction - Optional action button callback
 */
const EmptyState = ({ icon: Icon, title, message, actionLabel, onAction }) => {
  return (
    <div className="text-center py-5">
      {Icon && (
        <div className="mb-3">
          <Icon size={64} className="text-muted" />
        </div>
      )}
      <h5 className="text-muted mb-2">{title}</h5>
      <p className="text-muted mb-4">{message}</p>
      {actionLabel && onAction && (
        <Button variant="primary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
