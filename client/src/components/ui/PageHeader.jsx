import React from 'react';

/**
 * Page header with title and action buttons
 * @param {Object} props
 * @param {string} props.title - Page title
 * @param {string} props.subtitle - Optional subtitle
 * @param {React.ReactNode} props.children - Action buttons or other elements
 */
const PageHeader = ({ title, subtitle, children }) => {
  return (
    <div className="page-header mb-4">
      <div className="d-flex justify-content-between align-items-start flex-wrap">
        <div className="mb-2 mb-md-0">
          <h1 className="mb-1">{title}</h1>
          {subtitle && <p className="text-muted mb-0">{subtitle}</p>}
        </div>
        {children && <div className="d-flex gap-2 flex-wrap">{children}</div>}
      </div>
    </div>
  );
};

export default PageHeader;
