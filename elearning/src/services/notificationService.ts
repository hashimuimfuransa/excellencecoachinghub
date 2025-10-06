import { apiService } from './api';
import { IUser } from '../shared/types';

// Notification interfaces
export interface INotification {
  _id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'system' | 'user' | 'course' | 'payment' | 'security' | 'maintenance';
  recipient: string | IUser; // User ID or populated user object
  sender?: string | IUser; // User ID or populated user object
  isRead: boolean;
  isArchived: boolean;
  actionRequired: boolean;
  actionUrl?: string;
  actionText?: string;
  expiresAt?: Date;
  metadata?: {
    userId?: string;
    courseId?: string;
    teacherId?: string;
    studentId?: string;
    amount?: number;
    [key: string]: any;
  };
  createdAt: Date;
  updatedAt: Date;
  readAt?: Date;
}

export interface NotificationFilters {
  page?: number;
  limit?: number;
  type?: string;
  category?: string;
  priority?: string;
  isRead?: boolean;
  isArchived?: boolean;
  actionRequired?: boolean;
  startDate?: string;
  endDate?: string;
}

export interface NotificationStats {
  total: number;
  unread: number;
  byType: {
    info: number;
    success: number;
    warning: number;
    error: number;
  };
  byPriority: {
    low: number;
    medium: number;
    high: number;
    urgent: number;
  };
  byCategory: {
    system: number;
    user: number;
    course: number;
    payment: number;
    security: number;
    maintenance: number;
  };
  actionRequired: number;
}

export interface CreateNotificationData {
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  category: 'system' | 'user' | 'course' | 'payment' | 'security' | 'maintenance';
  recipient: string; // User ID
  actionRequired?: boolean;
  actionUrl?: string;
  actionText?: string;
  expiresAt?: Date;
  metadata?: Record<string, any>;
}

export interface NotificationListResponse {
  notifications: INotification[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalNotifications: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  stats: NotificationStats;
}

class NotificationService {
  // Get notifications for current user
  async getNotifications(filters: NotificationFilters = {}): Promise<NotificationListResponse> {
    try {
      console.log('🔔 Frontend: Fetching notifications with filters:', filters);
      const params = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });

      const url = `/notifications?${params.toString()}`;
      console.log('📡 Frontend: Making API call to:', url);

      const response = await apiService.get(url);
      const responseData = response.data as NotificationListResponse;
      console.log('📥 Frontend: Received notifications response:', {
        success: response.success,
        notificationCount: responseData?.notifications?.length || 0,
        totalNotifications: responseData?.pagination?.totalNotifications || 0
      });

      return responseData;
    } catch (error) {
      console.error('❌ Frontend: Error fetching notifications:', error);
      throw error;
    }
  }

  // Get notification statistics
  async getNotificationStats(): Promise<NotificationStats> {
    try {
      const response = await apiService.get('/notifications/stats');
      return response.data as NotificationStats;
    } catch (error) {
      console.error('Error fetching notification stats:', error);
      throw error;
    }
  }

  // Get unread notification count
  async getUnreadCount(): Promise<number> {
    try {
      const response = await apiService.get('/notifications/unread-count');
      return (response.data as { count: number }).count;
    } catch (error: any) {
      console.error('Error fetching unread count:', error);
      
      // If it's a 401 error, the user is not authenticated
      if (error?.response?.status === 401) {
        console.warn('User not authenticated, returning 0 unread count');
        return 0;
      }
      
      // If it's a rate limiting error, throw it so the context can handle backoff
      if (error?.response?.status === 429 || error?.message?.includes('429') || error?.message?.includes('Too Many Requests')) {
        throw error;
      }
      
      // If it's a network error, return 0 but don't throw
      // This prevents the notification context from breaking
      if (error instanceof Error && (
        error.message.includes('Network error') ||
        error.message.includes('Unable to connect') ||
        error.message.includes('timeout')
      )) {
        console.warn('Network issue detected, returning 0 for unread count');
        return 0;
      }
      
      // For other errors, still return 0 to prevent breaking the UI
      return 0;
    }
  }

  // Mark notification as read
  async markAsRead(notificationId: string): Promise<void> {
    try {
      await apiService.patch(`/notifications/${notificationId}/read`);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Mark multiple notifications as read
  async markMultipleAsRead(notificationIds: string[]): Promise<void> {
    try {
      await apiService.patch('/notifications/mark-read', { notificationIds });
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      throw error;
    }
  }

  // Mark all notifications as read
  async markAllAsRead(): Promise<void> {
    try {
      await apiService.patch('/notifications/mark-all-read');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  // Archive notification
  async archiveNotification(notificationId: string): Promise<void> {
    try {
      await apiService.patch(`/notifications/${notificationId}/archive`);
    } catch (error) {
      console.error('Error archiving notification:', error);
      throw error;
    }
  }

  // Delete notification
  async deleteNotification(notificationId: string): Promise<void> {
    try {
      await apiService.delete(`/notifications/${notificationId}`);
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  // Create notification (admin only)
  async createNotification(data: CreateNotificationData): Promise<INotification> {
    try {
      const response = await apiService.post('/notifications', data);
      return response.data as INotification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  // Send bulk notifications (admin only)
  async sendBulkNotifications(data: {
    recipients: string[]; // User IDs
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    category: 'system' | 'user' | 'course' | 'payment' | 'security' | 'maintenance';
    actionRequired?: boolean;
    actionUrl?: string;
    actionText?: string;
    expiresAt?: Date;
    metadata?: Record<string, any>;
  }): Promise<{ created: number; failed: number }> {
    try {
      const response = await apiService.post('/notifications/bulk', data);
      return response.data as { created: number; failed: number };
    } catch (error) {
      console.error('Error sending bulk notifications:', error);
      throw error;
    }
  }

  // Get system alerts (admin only)
  async getSystemAlerts(): Promise<INotification[]> {
    try {
      const response = await apiService.get('/notifications/system-alerts');
      return response.data as INotification[];
    } catch (error) {
      console.error('Error fetching system alerts:', error);
      return [];
    }
  }

  // Real-time notification subscription
  subscribeToNotifications(userId: string, callback: (notification: INotification) => void) {
    // TODO: Implement WebSocket or Server-Sent Events for real-time notifications
    console.log('Subscribing to notifications for user:', userId);
    // This would typically connect to a WebSocket endpoint
    // For now, we'll use polling as a fallback
    
    const pollInterval = setInterval(async () => {
      try {
        await this.getUnreadCount();
        // You could emit an event or call the callback with new notifications
      } catch (error) {
        console.error('Error polling for notifications:', error);
      }
    }, 30000); // Poll every 30 seconds

    // Return cleanup function
    return () => {
      clearInterval(pollInterval);
    };
  }
}

export const notificationService = new NotificationService();
export default notificationService;
