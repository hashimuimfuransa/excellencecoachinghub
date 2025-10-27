import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface Announcement {
  _id: string;
  title: string;
  content: string;
  course: string;
  instructor: {
    _id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  type: 'general' | 'assignment' | 'exam' | 'schedule' | 'urgent';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  isPinned: boolean;
  isPublished: boolean;
  scheduledDate?: Date;
  expiryDate?: Date;
  attachments: Array<{
    filename: string;
    originalName: string;
    fileUrl: string;
    fileSize: number;
  }>;
  readBy: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AnnouncementRead {
  announcementId: string;
  readAt: Date;
}

class AnnouncementService {
  // Get course announcements
  async getCourseAnnouncements(courseId: string, limit?: number): Promise<Announcement[]> {
    try {
      const params = limit ? { limit } : {};
      const response = await api.get(`/announcements/course/${courseId}`, { params });
      return response.data.data || [];
    } catch (error: any) {
      console.error('Failed to fetch course announcements:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch announcements');
    }
  }

  // Get announcement by ID
  async getAnnouncementById(announcementId: string): Promise<Announcement> {
    try {
      const response = await api.get(`/announcements/${announcementId}`);
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to fetch announcement:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch announcement');
    }
  }

  // Get read status for course announcements
  async getReadStatus(courseId: string): Promise<AnnouncementRead[]> {
    try {
      const response = await api.get(`/announcements/course/${courseId}/read-status`);
      return response.data.data || [];
    } catch (error: any) {
      console.error('Failed to fetch read status:', error);
      // Return empty array if endpoint doesn't exist yet
      return [];
    }
  }

  // Mark announcement as read
  async markAsRead(announcementId: string): Promise<void> {
    try {
      await api.post(`/announcements/${announcementId}/read`);
    } catch (error: any) {
      console.error('Failed to mark announcement as read:', error);
      throw new Error(error.response?.data?.message || 'Failed to mark as read');
    }
  }

  // Mark announcement as unread
  async markAsUnread(announcementId: string): Promise<void> {
    try {
      await api.delete(`/announcements/${announcementId}/read`);
    } catch (error: any) {
      console.error('Failed to mark announcement as unread:', error);
      throw new Error(error.response?.data?.message || 'Failed to mark as unread');
    }
  }

  // Get unread count for course
  async getUnreadCount(courseId: string): Promise<number> {
    try {
      const response = await api.get(`/announcements/course/${courseId}/unread-count`);
      return response.data.data || 0;
    } catch (error: any) {
      console.error('Failed to fetch unread count:', error);
      return 0;
    }
  }

  // Search announcements
  async searchAnnouncements(courseId: string, query: string): Promise<Announcement[]> {
    try {
      const response = await api.get(`/announcements/course/${courseId}/search`, {
        params: { q: query }
      });
      return response.data.data || [];
    } catch (error: any) {
      console.error('Failed to search announcements:', error);
      throw new Error(error.response?.data?.message || 'Failed to search announcements');
    }
  }

  // Get announcements by type
  async getAnnouncementsByType(courseId: string, type: string): Promise<Announcement[]> {
    try {
      const response = await api.get(`/announcements/course/${courseId}`, {
        params: { type }
      });
      return response.data.data || [];
    } catch (error: any) {
      console.error('Failed to fetch announcements by type:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch announcements');
    }
  }

  // Get announcements by priority
  async getAnnouncementsByPriority(courseId: string, priority: string): Promise<Announcement[]> {
    try {
      const response = await api.get(`/announcements/course/${courseId}`, {
        params: { priority }
      });
      return response.data.data || [];
    } catch (error: any) {
      console.error('Failed to fetch announcements by priority:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch announcements');
    }
  }

  // Get pinned announcements
  async getPinnedAnnouncements(courseId: string): Promise<Announcement[]> {
    try {
      const response = await api.get(`/announcements/course/${courseId}/pinned`);
      return response.data.data || [];
    } catch (error: any) {
      console.error('Failed to fetch pinned announcements:', error);
      return [];
    }
  }

  // Download attachment
  async downloadAttachment(fileUrl: string): Promise<Blob> {
    try {
      const response = await api.get(fileUrl, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error: any) {
      console.error('Failed to download attachment:', error);
      throw new Error(error.response?.data?.message || 'Failed to download attachment');
    }
  }
}

export const announcementService = new AnnouncementService();
export default announcementService;