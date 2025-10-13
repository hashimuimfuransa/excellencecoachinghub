import api from './api';

export interface IRecordedSession {
  _id: string;
  title: string;
  description?: string;
  teacher: string;
  course: {
    _id: string;
    title: string;
    description?: string;
  };
  videoUrl: string;
  videoFileName: string;
  videoSize: number;
  duration?: string;
  thumbnail?: string;
  views: number;
  isPublished: boolean;
  uploadDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface IRecordedSessionsResponse {
  success: boolean;
  data: {
    sessions: IRecordedSession[];
    pagination: {
      current: number;
      pages: number;
      total: number;
    };
  };
}

export interface IUploadRecordedSessionData {
  title: string;
  description?: string;
  courseId: string;
  videoUrl: string;
}

class RecordedSessionService {
  // Get teacher's recorded sessions
  async getTeacherRecordedSessions(params?: {
    courseId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<IRecordedSessionsResponse> {
    const queryParams = new URLSearchParams();
    
    if (params?.courseId) queryParams.append('courseId', params.courseId);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const response = await api.get(`/recorded-sessions/teacher?${queryParams.toString()}`);
    return response.data;
  }

  // Upload a new recorded session (Uploadcare URL)
  async uploadRecordedSession(data: IUploadRecordedSessionData): Promise<{ success: boolean; data: IRecordedSession; message: string }> {
    const response = await api.post('/recorded-sessions/upload', {
      title: data.title,
      description: data.description,
      courseId: data.courseId,
      videoUrl: data.videoUrl
    });
    return response.data;
  }

  // Get a specific recorded session
  async getRecordedSession(id: string): Promise<{ success: boolean; data: IRecordedSession }> {
    const response = await api.get(`/recorded-sessions/${id}`);
    return response.data;
  }

  // Update a recorded session
  async updateRecordedSession(
    id: string, 
    data: { title?: string; description?: string; courseId?: string; isPublished?: boolean }
  ): Promise<{ success: boolean; data: IRecordedSession; message: string }> {
    const response = await api.put(`/recorded-sessions/${id}`, data);
    return response.data;
  }

  // Delete a recorded session
  async deleteRecordedSession(id: string): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`/recorded-sessions/${id}`);
    return response.data;
  }

  // Increment view count
  async incrementViewCount(id: string): Promise<{ success: boolean; data: { views: number } }> {
    const response = await api.post(`/recorded-sessions/${id}/view`);
    return response.data;
  }

  // Get recorded sessions for students (by course)
  async getRecordedSessionsForStudents(courseId: string): Promise<{ success: boolean; data: IRecordedSession[] }> {
    const response = await api.get(`/recorded-sessions/course/${courseId}/student`);
    return response.data;
  }

  // Get all recorded sessions for a student across all enrolled courses
  async getAllRecordedSessionsForStudent(): Promise<{ success: boolean; data: IRecordedSession[] }> {
    const response = await api.get('/recorded-sessions/student');
    return response.data;
  }

  // Get video stream URL (for secure video streaming)
  getVideoStreamUrl(videoUrl: string): string {
    // Check if it's already a complete URL (Cloudinary URL)
    if (videoUrl.startsWith('http://') || videoUrl.startsWith('https://')) {
      return videoUrl;
    }
    
    // For local files, prepend the API base URL
    return `${api.defaults.baseURL}${videoUrl}`;
  }

  // Format file size
  formatFileSize(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  // Format duration
  formatDuration(duration: string): string {
    if (!duration || duration === '00:00') return 'Unknown';
    return duration;
  }

  // Format upload date
  formatUploadDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}

export const recordedSessionService = new RecordedSessionService();
export default recordedSessionService;