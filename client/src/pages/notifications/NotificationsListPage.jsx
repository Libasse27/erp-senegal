import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Badge from 'react-bootstrap/Badge';
import Spinner from 'react-bootstrap/Spinner';
import { FiInfo, FiCheckCircle, FiAlertTriangle, FiXCircle, FiTrash2, FiCheck, FiBell } from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import usePageTitle from '../../hooks/usePageTitle';
import useNotificationsHook from '../../hooks/useNotifications';
import { useDeleteNotificationMutation } from '../../redux/api/notificationsApi';

const ICON_MAP = {
  info: { Icon: FiInfo, colorClass: 'text-info' },
  success: { Icon: FiCheckCircle, colorClass: 'text-success' },
  warning: { Icon: FiAlertTriangle, colorClass: 'text-warning' },
  error: { Icon: FiXCircle, colorClass: 'text-danger' },
};

const NotificationsListPage = () => {
  usePageTitle('Notifications', [
    { label: 'Accueil', path: '/' },
    { label: 'Notifications' },
  ]);

  const navigate = useNavigate();

  const [page, setPage] = useState(1);
  const [filterType, setFilterType] = useState('');
  const [filterRead, setFilterRead] = useState('');

  const queryParams = {
    page,
    limit: 20,
    ...(filterType && { type: filterType }),
    ...(filterRead === 'unread' && { isRead: false }),
    ...(filterRead === 'read' && { isRead: true }),
  };

  const { notifications, meta, unreadCount, isLoading, markAsRead, markAllAsRead } =
    useNotificationsHook(queryParams);

  const [deleteNotification] = useDeleteNotificationMutation();

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      await markAsRead(notification._id);
    }
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    await deleteNotification(id);
  };

  const handleMarkRead = async (e, id) => {
    e.stopPropagation();
    await markAsRead(id);
  };

  const handleFilterChange = (setter) => (e) => {
    setter(e.target.value);
    setPage(1);
  };

  const totalPages = meta?.totalPages || 1;

  return (
    <div>
      {/* En-tête */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex align-items-center gap-2">
          <FiBell size={24} className="text-primary" />
          <h4 className="mb-0 fw-bold">Notifications</h4>
          {unreadCount > 0 && (
            <Badge bg="danger" pill>
              {unreadCount}
            </Badge>
          )}
        </div>
        {unreadCount > 0 && (
          <Button variant="outline-primary" size="sm" onClick={markAllAsRead}>
            <FiCheck className="me-1" />
            Tout marquer comme lu
          </Button>
        )}
      </div>

      {/* Filtres */}
      <Card className="mb-3 border-0 shadow-sm">
        <Card.Body className="py-2">
          <Row className="g-2 align-items-center">
            <Col xs={12} sm={6} md={4}>
              <Form.Select
                size="sm"
                value={filterType}
                onChange={handleFilterChange(setFilterType)}
              >
                <option value="">Tous les types</option>
                <option value="info">Info</option>
                <option value="success">Succès</option>
                <option value="warning">Avertissement</option>
                <option value="error">Erreur</option>
              </Form.Select>
            </Col>
            <Col xs={12} sm={6} md={4}>
              <Form.Select
                size="sm"
                value={filterRead}
                onChange={handleFilterChange(setFilterRead)}
              >
                <option value="">Toutes les notifications</option>
                <option value="unread">Non lues</option>
                <option value="read">Lues</option>
              </Form.Select>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Contenu */}
      {isLoading ? (
        <div className="d-flex justify-content-center py-5">
          <Spinner animation="border" variant="primary" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center text-muted py-5">
          <FiBell size={48} className="mb-3 opacity-50" />
          <p className="mb-0">Aucune notification</p>
        </div>
      ) : (
        <div className="d-flex flex-column gap-2">
          {notifications.map((notification) => {
            const { Icon, colorClass } = ICON_MAP[notification.type] || ICON_MAP.info;
            const isUnread = !notification.isRead;

            return (
              <Card
                key={notification._id}
                className={`border-0 shadow-sm ${isUnread ? 'bg-light' : ''} ${notification.link ? 'cursor-pointer' : ''}`}
                onClick={() => notification.link && handleNotificationClick(notification)}
                style={notification.link ? { cursor: 'pointer' } : {}}
              >
                <Card.Body className="py-3">
                  <div className="d-flex align-items-start gap-3">
                    <div className={`flex-shrink-0 mt-1 ${colorClass}`}>
                      <Icon size={20} />
                    </div>
                    <div className="flex-grow-1 min-w-0">
                      <div className="d-flex justify-content-between align-items-start">
                        <p className={`mb-1 ${isUnread ? 'fw-semibold' : ''}`}>
                          {notification.title}
                        </p>
                        <small className="text-muted ms-2 flex-shrink-0">
                          {formatDistanceToNow(new Date(notification.createdAt), {
                            addSuffix: true,
                            locale: fr,
                          })}
                        </small>
                      </div>
                      <p className="mb-0 text-muted small">{notification.message}</p>
                    </div>
                    <div className="flex-shrink-0 d-flex gap-1">
                      {isUnread && (
                        <Button
                          variant="outline-success"
                          size="sm"
                          onClick={(e) => handleMarkRead(e, notification._id)}
                          title="Marquer comme lu"
                        >
                          <FiCheck size={14} />
                        </Button>
                      )}
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={(e) => handleDelete(e, notification._id)}
                        title="Supprimer"
                      >
                        <FiTrash2 size={14} />
                      </Button>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="d-flex justify-content-center gap-2 mt-4">
          <Button
            variant="outline-secondary"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Précédent
          </Button>
          <span className="d-flex align-items-center text-muted small px-2">
            Page {page} / {totalPages}
          </span>
          <Button
            variant="outline-secondary"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Suivant
          </Button>
        </div>
      )}
    </div>
  );
};

export default NotificationsListPage;
