import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user) {
      const newSocket = io(process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000', {
        auth: {
          token: localStorage.getItem('token'),
        },
      });

      newSocket.on('connect', () => {
        setIsConnected(true);
      });

      newSocket.on('disconnect', () => {
        setIsConnected(false);
      });

      newSocket.on('notification', (notification) => {
        setNotifications(prev => [notification, ...prev]);
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    } else {
      if (socket) {
        socket.close();
        setSocket(null);
        setIsConnected(false);
      }
    }
  }, [isAuthenticated, user]);

  const joinRoom = (roomId) => {
    if (socket && isConnected) {
      socket.emit('join-room', roomId);
    }
  };

  const leaveRoom = (roomId) => {
    if (socket && isConnected) {
      socket.emit('leave-room', roomId);
    }
  };

  const sendMessage = (roomId, message) => {
    if (socket && isConnected) {
      socket.emit('send-message', { roomId, message });
    }
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const value = {
    socket,
    isConnected,
    notifications,
    joinRoom,
    leaveRoom,
    sendMessage,
    clearNotifications,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};