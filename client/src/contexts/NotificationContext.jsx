import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useSocket } from './SocketContext';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const { subscribe, unsubscribe } = useSocket();

  const addNotification = useCallback((notification) => {
    const newNotif = {
      id: notification.notificationId || Date.now(),
      _id: notification.notificationId || String(Date.now()),
      isRead: false,
      createdAt: notification.timestamp || new Date().toISOString(),
      ...notification,
    };
    setNotifications((prev) => [newNotif, ...prev].slice(0, 50)); // Garder max 50 en memoire

    // Afficher un toast
    const toastType = notification.type || 'info';
    const toastFn = toast[toastType] || toast.info;
    toastFn(notification.message || notification.title, {
      position: 'top-right',
      autoClose: 5000,
    });
  }, []);

  const markAsRead = useCallback((notificationId) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === notificationId || n._id === notificationId
          ? { ...n, isRead: true, read: true }
          : n
      )
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true, read: true })));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // Ecouter les evenements socket pour ajouter des notifications locales
  useEffect(() => {
    const handleSocketNotification = (data) => {
      addNotification(data);
    };

    const events = [
      'stock:alert',
      'facture:created',
      'facture:validated',
      'facture:paid',
      'payment:received',
      'payment:validated',
      'devis:converted',
    ];

    events.forEach((event) => {
      subscribe(event, handleSocketNotification);
    });

    return () => {
      events.forEach((event) => {
        unsubscribe(event, handleSocketNotification);
      });
    };
  }, [subscribe, unsubscribe, addNotification]);

  const unreadCount = notifications.filter((n) => !n.isRead && !n.read).length;

  const value = {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearAll,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export default NotificationContext;
