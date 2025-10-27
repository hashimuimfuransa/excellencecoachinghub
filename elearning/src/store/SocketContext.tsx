import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { socketConnectionManager } from '../utils/socketConnectionManager';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user) {
      // Initialize socket connection
      const socketUrl = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';
      const newSocket = io(socketUrl, {
        auth: {
          userId: user._id,
        },
        withCredentials: true,
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        maxReconnectionAttempts: 5,
        autoConnect: true
      });

      // Connection event handlers
      newSocket.on('connect', () => {
        socketConnectionManager.logConnectionEvent('connect', newSocket.id);
        setIsConnected(true);
        
        // Join user's personal room
        newSocket.emit('user:join', user._id);
      });

      newSocket.on('disconnect', (reason) => {
        socketConnectionManager.logConnectionEvent('disconnect', reason);
        setIsConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        socketConnectionManager.logConnectionEvent('connect_error', error);
        setIsConnected(false);
        socketConnectionManager.incrementAttempts();
      });

      newSocket.on('reconnect', (attemptNumber) => {
        socketConnectionManager.logConnectionEvent('reconnect', attemptNumber);
        setIsConnected(true);
        newSocket.emit('user:join', user._id);
      });

      newSocket.on('reconnect_attempt', (attemptNumber) => {
        socketConnectionManager.logConnectionEvent('reconnect_attempt', attemptNumber);
      });

      newSocket.on('reconnect_error', (error) => {
        socketConnectionManager.logConnectionEvent('reconnect_error', error);
      });

      newSocket.on('reconnect_failed', () => {
        socketConnectionManager.logConnectionEvent('reconnect_failed');
        setIsConnected(false);
      });

      setSocket(newSocket);

      // Cleanup on unmount or user change
      return () => {
        newSocket.emit('user:leave', user._id);
        newSocket.close();
        setSocket(null);
        setIsConnected(false);
      };
    } else {
      // Disconnect socket if user is not authenticated
      if (socket) {
        socket.close();
        setSocket(null);
        setIsConnected(false);
      }
    }
  }, [isAuthenticated, user]);

  const value: SocketContextType = {
    socket,
    isConnected,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = (): SocketContextType => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
