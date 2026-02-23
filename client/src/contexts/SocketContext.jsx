import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { selectIsAuthenticated, selectAccessToken, selectCurrentUser } from '../redux/slices/authSlice';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const accessToken = useSelector(selectAccessToken);
  const user = useSelector(selectCurrentUser);
  const listenersRef = useRef([]);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    const socketUrl = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

    const newSocket = io(socketUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      auth: {
        token: accessToken,
      },
    });

    newSocket.on('connect', () => {
      setIsConnected(true);

      // Auto-join user room and role room
      if (user) {
        newSocket.emit('join', {
          userId: user._id,
          role: user.role?.name,
        });
      }
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Erreur connexion socket:', error.message);
      setIsConnected(false);
    });

    // Ecouter les notifications generales et afficher un toast
    newSocket.on('notification', (data) => {
      const toastType = data.type || 'info';
      const toastFn = toast[toastType] || toast.info;
      toastFn(data.message || data.title, {
        position: 'top-right',
        autoClose: 5000,
      });
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, accessToken]);

  // Re-join rooms when user data becomes available after socket is connected
  useEffect(() => {
    if (socket && isConnected && user) {
      socket.emit('join', {
        userId: user._id,
        role: user.role?.name,
      });
    }
  }, [socket, isConnected, user]);

  /**
   * Souscrire a un evenement socket
   * @param {string} event - Nom de l'evenement
   * @param {Function} handler - Callback
   */
  const subscribe = useCallback(
    (event, handler) => {
      if (socket) {
        socket.on(event, handler);
        listenersRef.current.push({ event, handler });
      }
    },
    [socket]
  );

  /**
   * Se desabonner d'un evenement socket
   * @param {string} event - Nom de l'evenement
   * @param {Function} handler - Callback
   */
  const unsubscribe = useCallback(
    (event, handler) => {
      if (socket) {
        socket.off(event, handler);
        listenersRef.current = listenersRef.current.filter(
          (l) => !(l.event === event && l.handler === handler)
        );
      }
    },
    [socket]
  );

  const value = {
    socket,
    isConnected,
    subscribe,
    unsubscribe,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export default SocketContext;
