import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Dropdown from 'react-bootstrap/Dropdown';
import Badge from 'react-bootstrap/Badge';
import Spinner from 'react-bootstrap/Spinner';
import { FiBell, FiCheck, FiCheckCircle, FiAlertTriangle, FiInfo, FiXCircle } from 'react-icons/fi';
import useNotificationsHook from '../../hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * Obtenir l'icone selon le type de notification
 */
const getTypeIcon = (type) => {
  switch (type) {
    case 'success':
      return <FiCheckCircle className="text-success me-2" />;
    case 'warning':
      return <FiAlertTriangle className="text-warning me-2" />;
    case 'error':
      return <FiXCircle className="text-danger me-2" />;
    case 'info':
    default:
      return <FiInfo className="text-primary me-2" />;
  }
};

/**
 * Formater la date relative
 */
const formatRelativeDate = (dateStr) => {
  try {
    return formatDistanceToNow(new Date(dateStr), {
      addSuffix: true,
      locale: fr,
    });
  } catch {
    return '';
  }
};

const NotificationBell = () => {
  const navigate = useNavigate();
  const [show, setShow] = useState(false);
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
  } = useNotificationsHook({ page: 1, limit: 8 });

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      await markAsRead(notification._id);
    }
    setShow(false);
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const handleMarkAllAsRead = async (e) => {
    e.stopPropagation();
    await markAllAsRead();
  };

  const handleViewAll = () => {
    setShow(false);
    navigate('/notifications');
  };

  return (
    <Dropdown align="end" show={show} onToggle={(nextShow) => setShow(nextShow)}>
      <Dropdown.Toggle variant="link" className="text-dark p-0 position-relative">
        <FiBell size={20} />
        {unreadCount > 0 && (
          <Badge
            bg="danger"
            pill
            className="position-absolute top-0 start-100 translate-middle"
            style={{ fontSize: '0.6rem' }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Dropdown.Toggle>

      <Dropdown.Menu style={{ minWidth: '360px', maxHeight: '480px', overflowY: 'auto' }}>
        <div className="d-flex justify-content-between align-items-center px-3 py-2">
          <span className="fw-semibold">Notifications</span>
          {unreadCount > 0 && (
            <button
              className="btn btn-link btn-sm text-decoration-none p-0"
              onClick={handleMarkAllAsRead}
              title="Marquer tout comme lu"
            >
              <FiCheck className="me-1" />
              Tout marquer comme lu
            </button>
          )}
        </div>

        <Dropdown.Divider className="my-0" />

        {isLoading ? (
          <div className="text-center py-4">
            <Spinner animation="border" size="sm" variant="primary" />
            <span className="ms-2 text-muted">Chargement...</span>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-muted text-center py-4">
            Aucune notification
          </div>
        ) : (
          <>
            {notifications.map((notification) => (
              <Dropdown.Item
                key={notification._id}
                onClick={() => handleNotificationClick(notification)}
                className={`px-3 py-2 border-bottom ${!notification.isRead ? 'bg-light' : ''}`}
                style={{ whiteSpace: 'normal' }}
              >
                <div className="d-flex align-items-start">
                  <div className="mt-1">{getTypeIcon(notification.type)}</div>
                  <div className="flex-grow-1">
                    <div className="d-flex justify-content-between align-items-start">
                      <span className={`small ${!notification.isRead ? 'fw-semibold' : ''}`}>
                        {notification.title}
                      </span>
                      {!notification.isRead && (
                        <Badge bg="primary" pill style={{ fontSize: '0.5rem', minWidth: '8px', minHeight: '8px' }}>
                          {' '}
                        </Badge>
                      )}
                    </div>
                    <p className="mb-0 small text-muted" style={{ lineHeight: 1.3 }}>
                      {notification.message}
                    </p>
                    <small className="text-muted" style={{ fontSize: '0.7rem' }}>
                      {formatRelativeDate(notification.createdAt)}
                    </small>
                  </div>
                </div>
              </Dropdown.Item>
            ))}
          </>
        )}

        <Dropdown.Divider className="my-0" />

        <div className="text-center py-2">
          <button
            className="btn btn-link btn-sm text-decoration-none"
            onClick={handleViewAll}
          >
            Voir toutes les notifications
          </button>
        </div>
      </Dropdown.Menu>
    </Dropdown>
  );
};

export default NotificationBell;
