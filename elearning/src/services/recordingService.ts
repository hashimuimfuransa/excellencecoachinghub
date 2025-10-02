import { apiService } from './api';
import { ILiveSession } from './liveSessionService';

// Recording-specific interfaces
export interface IRecording {
  _id: string;
  title: string;
  description?: string;
  recordingUrl: string;
  recordingSize?: number;
  recordingTitle?: string;
  recordingDescription?: string;
  duration: number;
  scheduledTime: string;
  actualStartTime?: string;
  actualEndTime?: string;
  course: {
    _id: string;
    title: string;
    description?: string;
    thumbnail?: string;
  };
  instructor: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  participants: Array<{
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  }>;
  attendees: Array<{
    user: {
      _id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
    joinTime?: string;
    leaveTime?: string;
    duration?: number;
    participated: boolean;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface IRecordingListResponse {
  recordings: IRecording[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalRecordings: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface IRecordingFilters {
  page?: number;
  limit?: number;
  courseId?: string;
  instructorId?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export const recordingService = {
  // Student-specific methods
  // Get available recordings for students (from enrolled courses)
  getStudentRecordings: async (filters: IRecordingFilters = {}): Promise<IRecordingListResponse> => {
    const queryParams = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    const response = await apiService.get<IRecordingListResponse>(
      `/student/recordings?${queryParams.toString()}`
    );

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error || 'Failed to fetch student recordings');
  },

  // Get recording by ID (for students)
  getRecordingById: async (id: string): Promise<IRecording> => {
    const response = await apiService.get<{ recording: IRecording }>(`/student/recordings/${id}`);

    if (response.success && response.data) {
      return response.data.recording;
    }

    throw new Error(response.error || 'Failed to fetch recording');
  },

  // Get recordings from live sessions (alternative method)
  getRecordingsFromSessions: (sessions: ILiveSession[]): IRecording[] => {
    return sessions
      .filter(session => session.status === 'ended' && session.recordingUrl)
      .map(session => ({
        _id: session._id,
        title: session.title,
        description: session.description,
        recordingUrl: session.recordingUrl!,
        recordingSize: session.recordingSize,
        recordingTitle: session.recordingTitle,
        recordingDescription: session.recordingDescription,
        duration: session.duration,
        scheduledTime: session.scheduledTime,
        actualStartTime: session.actualStartTime,
        actualEndTime: session.actualEndTime,
        course: session.course,
        instructor: session.instructor,
        participants: session.participants,
        attendees: session.attendees,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
      }));
  },

  // Mark recording as watched (for progress tracking)
  markRecordingWatched: async (recordingId: string): Promise<void> => {
    const response = await apiService.post(`/student/recordings/${recordingId}/watched`);

    if (!response.success) {
      throw new Error(response.error || 'Failed to mark recording as watched');
    }
  },

  // Get recording watch progress
  getRecordingProgress: async (recordingId: string): Promise<{ watchedPercentage: number; lastWatchedAt?: string }> => {
    const response = await apiService.get<{ watchedPercentage: number; lastWatchedAt?: string }>(
      `/student/recordings/${recordingId}/progress`
    );

    if (response.success && response.data) {
      return response.data;
    }

    return { watchedPercentage: 0 };
  },

  // Update recording watch progress
  updateRecordingProgress: async (recordingId: string, watchedPercentage: number): Promise<void> => {
    const response = await apiService.post(`/student/recordings/${recordingId}/progress`, {
      watchedPercentage
    });

    if (!response.success) {
      throw new Error(response.error || 'Failed to update recording progress');
    }
  },

  // Admin-specific methods
  // Get all recordings (Admin only)
  getAllRecordings: async (filters: IRecordingFilters = {}): Promise<IRecordingListResponse> => {
    const queryParams = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    const response = await apiService.get<IRecordingListResponse>(
      `/admin/recordings?${queryParams.toString()}`
    );
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.error || 'Failed to fetch recordings');
  },

  // Delete recording (Admin only)
  deleteRecording: async (id: string): Promise<void> => {
    const response = await apiService.delete(`/admin/recordings/${id}`);
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to delete recording');
    }
  },

  // Get recording statistics (Admin only)
  getRecordingStats: async (): Promise<{
    totalRecordings: number;
    totalSize: number;
    recordingsByMonth: Array<{ month: string; count: number; size: number }>;
    topCourses: Array<{ courseId: string; courseTitle: string; recordingCount: number }>;
  }> => {
    const response = await apiService.get<{
      totalRecordings: number;
      totalSize: number;
      recordingsByMonth: Array<{ month: string; count: number; size: number }>;
      topCourses: Array<{ courseId: string; courseTitle: string; recordingCount: number }>;
    }>('/admin/recordings/stats');
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.error || 'Failed to fetch recording statistics');
  },

  // Utility methods
  // Format file size
  formatFileSize: (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  // Format duration
  formatDuration: (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (remainingMinutes === 0) {
      return `${hours}h`;
    }
    
    return `${hours}h ${remainingMinutes}m`;
  },

  // Generate recording thumbnail URL (if available)
  getThumbnailUrl: (recordingUrl: string): string => {
    // This would typically generate a thumbnail URL based on the video URL
    // For now, return a placeholder or the video URL itself
    return recordingUrl.replace(/\.[^/.]+$/, '_thumbnail.jpg');
  },

  // Check if recording is accessible to student
  isRecordingAccessible: (recording: IRecording, studentId: string): boolean => {
    // Check if student is enrolled in the course or was a participant
    return recording.participants.some(participant => participant._id === studentId) ||
           recording.attendees.some(attendee => attendee.user._id === studentId);
  }
};