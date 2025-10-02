import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';
import { notificationService, INotification, NotificationStats } from '../services/notificationService';

interface NotificationContextType {
  notifications: INotification[];
  unreadCount: number;
  stats: NotificationStats | null;
  loading: boolean;
  error: string | null;
  refreshNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  addNotification: (notification: INotification) => void;
  removeNotification: (notificationId: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<INotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load initial notifications
  const refreshNotifications = async () => {
    if (!user) {
      console.log('🔔 NotificationContext: No user, skipping refresh');
      return;
    }

    try {
      console.log('🔄 NotificationContext: Refreshing notifications for user:', user._id);
      setLoading(true);
      setError(null);

      // Only fetch unread count to reduce API calls
      // Stats and full notifications can be fetched on demand
      const unreadCountResult = await Promise.allSettled([
        notificationService.getUnreadCount()
      ]);

      // Handle unread count
      if (unreadCountResult[0].status === 'fulfilled') {
        setUnreadCount(unreadCountResult[0].value);
        console.log('📥 NotificationContext: Unread count:', unreadCountResult[0].value);
      } else {
        console.error('Failed to load unread count:', unreadCountResult[0].reason);
        // Keep existing count if available
      }

    } catch (err: any) {
      console.error('❌ NotificationContext: Unexpected error loading notifications:', err);
      // Don't set error for rate limiting issues, just log them
      if (!err?.message?.includes('429') && !err?.message?.includes('Too Many Requests')) {
        setError(err?.message || 'Failed to load notifications');
      }
    } finally {
      setLoading(false);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      // Check if this is a mock notification (starts with 'mock-')
      if (notificationId.startsWith('mock-')) {
        // Handle mock notifications locally without API call
        setNotifications(prev =>
          prev.map(n => n._id === notificationId ? { ...n, isRead: true, readAt: new Date() } : n)
        );

        setUnreadCount(prev => Math.max(0, prev - 1));

        // Update stats
        if (stats) {
          setStats(prev => prev ? { ...prev, unread: Math.max(0, prev.unread - 1) } : null);
        }
        return;
      }

      // Handle real notifications with API call
      await notificationService.markAsRead(notificationId);

      setNotifications(prev =>
        prev.map(n => n._id === notificationId ? { ...n, isRead: true, readAt: new Date() } : n)
      );

      setUnreadCount(prev => Math.max(0, prev - 1));

      // Update stats
      if (stats) {
        setStats(prev => prev ? { ...prev, unread: Math.max(0, prev.unread - 1) } : null);
      }
    } catch (err: any) {
      console.error('Error marking notification as read:', err);
      throw err;
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      // Separate mock and real notifications
      const mockNotifications = notifications.filter(n => n._id.startsWith('mock-'));
      const realNotifications = notifications.filter(n => !n._id.startsWith('mock-'));

      // Mark real notifications as read via API if there are any
      if (realNotifications.length > 0) {
        await notificationService.markAllAsRead();
      }

      // Update all notifications locally
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true, readAt: new Date() })));
      setUnreadCount(0);

      if (stats) {
        setStats(prev => prev ? { ...prev, unread: 0 } : null);
      }
    } catch (err: any) {
      console.error('Error marking all notifications as read:', err);
      throw err;
    }
  };

  // Add new notification (for real-time updates)
  const addNotification = (notification: INotification) => {
    setNotifications(prev => [notification, ...prev.slice(0, 9)]); // Keep only 10 most recent
    
    if (!notification.isRead) {
      setUnreadCount(prev => prev + 1);
    }
    
    // Update stats
    if (stats) {
      setStats(prev => {
        if (!prev) return null;
        
        const newStats = { ...prev };
        newStats.total += 1;
        
        if (!notification.isRead) {
          newStats.unread += 1;
        }
        
        // Update type counts
        newStats.byType[notification.type] += 1;
        
        // Update priority counts
        newStats.byPriority[notification.priority] += 1;
        
        // Update category counts
        newStats.byCategory[notification.category] += 1;
        
        if (notification.actionRequired) {
          newStats.actionRequired += 1;
        }
        
        return newStats;
      });
    }
  };

  // Remove notification
  const removeNotification = (notificationId: string) => {
    const notification = notifications.find(n => n._id === notificationId);

    setNotifications(prev => prev.filter(n => n._id !== notificationId));

    if (notification && !notification.isRead) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }

    // Update stats
    if (stats && notification) {
      setStats(prev => {
        if (!prev) return null;

        const newStats = { ...prev };
        newStats.total = Math.max(0, newStats.total - 1);

        if (!notification.isRead) {
          newStats.unread = Math.max(0, newStats.unread - 1);
        }

        if (notification.actionRequired) {
          newStats.actionRequired = Math.max(0, newStats.actionRequired - 1);
        }

        return newStats;
      });
    }
  };

  // Load notifications when user changes
  useEffect(() => {
    if (user) {
      refreshNotifications();
    } else {
      setNotifications([]);
      setUnreadCount(0);
      setStats(null);
    }
  }, [user]);

  // Set up real-time notification polling with exponential backoff
  useEffect(() => {
    if (!user) return;

    let pollInterval = 60000; // Start with 1 minute
    let maxInterval = 300000; // Max 5 minutes
    let currentInterval = pollInterval;
    let timeoutId: NodeJS.Timeout;

    const pollForNotifications = async () => {
      try {
        const newUnreadCount = await notificationService.getUnreadCount();
        
        // If unread count increased, refresh notifications
        if (newUnreadCount > unreadCount) {
          await refreshNotifications();
        } else if (newUnreadCount !== unreadCount) {
          // Update unread count even if it didn't increase
          setUnreadCount(newUnreadCount);
        }
        
        // Reset interval to normal on success
        currentInterval = pollInterval;
      } catch (err: any) {
        console.error('Error polling for notifications:', err);
        
        // If it's a rate limiting error, increase the interval
        if (err?.message?.includes('429') || err?.message?.includes('Too Many Requests')) {
          currentInterval = Math.min(currentInterval * 2, maxInterval);
          console.log(`Rate limited, increasing poll interval to ${currentInterval}ms`);
        }
        // Don't break the polling loop, just log the error
      }

      // Schedule next poll with current interval
      timeoutId = setTimeout(pollForNotifications, currentInterval);
    };

    // Initial poll
    pollForNotifications();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [user, unreadCount]);

  // Simulate real-time notifications for demo purposes
  useEffect(() => {
    if (!user || user.role !== 'admin') return;

    // Simulate new notifications every 2 minutes for admin users
    const simulateInterval = setInterval(() => {
      const mockNotifications = [
        {
          _id: `mock-${Date.now()}`,
          title: 'New Teacher Application',
          message: 'A new teacher has submitted their application for review.',
          type: 'info' as const,
          priority: 'medium' as const,
          category: 'user' as const,
          recipient: user._id,
          isRead: false,
          isArchived: false,
          actionRequired: true,
          actionUrl: '/dashboard/admin/teachers',
          actionText: 'Review Application',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          _id: `mock-${Date.now() + 1}`,
          title: 'System Maintenance Scheduled',
          message: 'System maintenance is scheduled for tonight at 2:00 AM.',
          type: 'warning' as const,
          priority: 'high' as const,
          category: 'system' as const,
          recipient: user._id,
          isRead: false,
          isArchived: false,
          actionRequired: false,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          _id: `mock-${Date.now() + 2}`,
          title: 'New Course Submission',
          message: 'A teacher has submitted a new course for approval.',
          type: 'info' as const,
          priority: 'medium' as const,
          category: 'course' as const,
          recipient: user._id,
          isRead: false,
          isArchived: false,
          actionRequired: true,
          actionUrl: '/dashboard/admin/courses',
          actionText: 'Review Course',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      // Randomly add one of the mock notifications
      const randomNotification = mockNotifications[Math.floor(Math.random() * mockNotifications.length)];
      addNotification(randomNotification);
    }, 120000); // Every 2 minutes

    return () => clearInterval(simulateInterval);
  }, [user]);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    stats,
    loading,
    error,
    refreshNotifications,
    markAsRead,
    markAllAsRead,
    addNotification,
    removeNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export default NotificationContext;
