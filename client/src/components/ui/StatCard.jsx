import React from 'react';
import Card from 'react-bootstrap/Card';
import { FiTrendingUp, FiTrendingDown } from 'react-icons/fi';

/**
 * KPI stat card for dashboard
 * @param {Object} props
 * @param {string} props.title - Card title
 * @param {string|number} props.value - Main value to display
 * @param {React.Component} props.icon - Icon component from react-icons/fi
 * @param {string} props.color - Color for icon and value (hex or named)
 * @param {string} props.subtitle - Optional subtitle text
 * @param {Object} props.trend - Optional trend {value: string, isUp: boolean}
 */
const StatCard = ({ title, value, icon: Icon, color, subtitle, trend }) => {
  return (
    <Card className="stat-card h-100 shadow-sm">
      <Card.Body className="d-flex align-items-center">
        <div
          className="rounded-circle d-flex align-items-center justify-content-center me-3 flex-shrink-0"
          style={{
            width: 48,
            height: 48,
            backgroundColor: `${color}15`,
            color: color,
          }}
        >
          {Icon && <Icon size={24} />}
        </div>
        <div className="flex-grow-1">
          <div className="stat-label text-muted small">{title}</div>
          <div className="stat-value fw-bold" style={{ color, fontSize: '1.5rem' }}>
            {value}
          </div>
          {subtitle && <small className="text-muted d-block">{subtitle}</small>}
          {trend && (
            <div
              className={`d-flex align-items-center mt-1 small ${
                trend.isUp ? 'text-success' : 'text-danger'
              }`}
            >
              {trend.isUp ? (
                <FiTrendingUp size={14} className="me-1" />
              ) : (
                <FiTrendingDown size={14} className="me-1" />
              )}
              <span>{trend.value}</span>
            </div>
          )}
        </div>
      </Card.Body>
    </Card>
  );
};

export default StatCard;
