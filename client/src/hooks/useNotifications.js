import { useEffect, useCallback } from 'react';
import { useSocket } from '../contexts/SocketContext';
import {
  useGetNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
} from '../redux/api/notificationsApi';

/**
 * Hook pour gerer les notifications en temps reel et via API
 * @param {Object} [queryParams] - Parametres de requete pour la pagination/filtre
 * @returns {Object} Notifications, compteur non lues, et actions
 */
const useNotificationsHook = (queryParams = { page: 1, limit: 10 }) => {
  const { subscribe, unsubscribe } = useSocket();

  const {
    data: notificationsData,
    isLoading: isLoadingNotifications,
    refetch: refetchNotifications,
  } = useGetNotificationsQuery(queryParams);

  const {
    data: unreadData,
    refetch: refetchUnreadCount,
  } = useGetUnreadCountQuery();

  const [markAsReadMutation] = useMarkAsReadMutation();
  const [markAllAsReadMutation] = useMarkAllAsReadMutation();

  // Ecouter les evenements socket pour actualiser en temps reel
  useEffect(() => {
    const handleNotification = () => {
      refetchNotifications();
      refetchUnreadCount();
    };

    // Evenements qui declenchent un rafraichissement des notifications
    const events = [
      'notification',
      'stock:alert',
      'facture:created',
      'facture:validated',
      'facture:paid',
      'payment:received',
      'payment:validated',
      'devis:converted',
      'dashboard:update',
    ];

    events.forEach((event) => {
      subscribe(event, handleNotification);
    });

    return () => {
      events.forEach((event) => {
        unsubscribe(event, handleNotification);
      });
    };
  }, [subscribe, unsubscribe, refetchNotifications, refetchUnreadCount]);

  const markAsRead = useCallback(
    async (notificationId) => {
      try {
        await markAsReadMutation(notificationId).unwrap();
      } catch (error) {
        console.error('Erreur lors du marquage comme lu:', error);
      }
    },
    [markAsReadMutation]
  );

  const markAllAsRead = useCallback(async () => {
    try {
      await markAllAsReadMutation().unwrap();
    } catch (error) {
      console.error('Erreur lors du marquage de toutes les notifications:', error);
    }
  }, [markAllAsReadMutation]);

  return {
    notifications: notificationsData?.data || [],
    meta: notificationsData?.meta || {},
    unreadCount: unreadData?.data?.count || 0,
    isLoading: isLoadingNotifications,
    markAsRead,
    markAllAsRead,
    refetchNotifications,
    refetchUnreadCount,
  };
};

export default useNotificationsHook;
