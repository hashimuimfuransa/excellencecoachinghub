import { api } from './api';

export interface Notification {
  _id: string;
  recipient: string;
  type: 'connection_accepted' | 'connection_request' | 'message' | 'job_match' | 'event_reminder' | 'application_update';
  title: string;
  message: string;
  data?: {
    userId?: string;
    userName?: string;
    userProfilePicture?: string;
    chatId?: string;
    jobId?: string;
    eventId?: string;
    applicationId?: string;
  };
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

class NotificationService {
  // Get all notifications for current user
  async getNotifications(page = 1, limit = 20) {
    const response = await api.get('/notifications', {
      params: { page, limit }
    });
    return response.data;
  }

  // Get unread notifications count
  async getUnreadCount() {
    const response = await api.get('/notifications/unread-count');
    return response.data;
  }

  // Mark notification as read
  async markAsRead(notificationId: string) {
    const response = await api.put(`/notifications/${notificationId}/read`);
    return response.data;
  }

  // Mark all notifications as read
  async markAllAsRead() {
    const response = await api.put('/notifications/read-all');
    return response.data;
  }

  // Delete notification
  async deleteNotification(notificationId: string) {
    const response = await api.delete(`/notifications/${notificationId}`);
    return response.data;
  }
}

export const notificationService = new NotificationService();