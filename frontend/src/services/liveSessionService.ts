import { apiService } from './api';

// Live Session interfaces
export interface IAttendee {
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
}

export interface ILiveSession {
  _id: string;
  title: string;
  description?: string;
  course: {
    _id: string;
    title: string;
  };
  instructor: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  scheduledTime: string;
  duration: number;
  actualStartTime?: string;
  actualEndTime?: string;
  meetingUrl?: string;
  meetingId?: string;
  participants: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  }[];
  maxParticipants?: number;
  isRecorded: boolean;
  recordingUrl?: string;
  recordingSize?: number;
  status: 'scheduled' | 'live' | 'ended' | 'cancelled';
  agenda?: string[];
  materials?: string[];
  chatEnabled: boolean;
  handRaiseEnabled: boolean;
  screenShareEnabled: boolean;
  attendanceRequired: boolean;
  attendees: IAttendee[];
  createdAt: string;
  updatedAt: string;
}

export interface ILiveSessionListResponse {
  sessions: ILiveSession[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalSessions: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface ISessionsByTeacher {
  teacherId: string;
  teacherName: string;
  teacherEmail: string;
  sessionCount: number;
  activeSessions: number;
  scheduledSessions: number;
}

export interface ILiveSessionStats {
  totalSessions: number;
  activeSessions: number;
  scheduledSessions: number;
  endedSessions: number;
  cancelledSessions: number;
  sessionsByTeacher: ISessionsByTeacher[];
  recentSessions: ILiveSession[];
  upcomingSessions: ILiveSession[];
}

export interface ISessionAttendance {
  session: {
    id: string;
    title: string;
    scheduledTime: string;
    duration: number;
    status: string;
  };
  attendance: {
    totalRegistered: number;
    totalAttended: number;
    attendanceRate: number;
    attendees: IAttendee[];
  };
}

export interface ILiveSessionFilters {
  page?: number;
  limit?: number;
  status?: string;
  teacherId?: string;
  search?: string;
}

export interface ICancelSessionData {
  reason?: string;
}

export interface ICreateLiveSessionData {
  title: string;
  description?: string;
  courseId: string;
  scheduledTime: string;
  duration: number;
  maxParticipants?: number;
  isRecorded?: boolean;
  agenda?: string[];
  chatEnabled?: boolean;
  handRaiseEnabled?: boolean;
  screenShareEnabled?: boolean;
  attendanceRequired?: boolean;
}

export interface IUpdateLiveSessionData {
  title?: string;
  description?: string;
  scheduledTime?: string;
  duration?: number;
  maxParticipants?: number;
  isRecorded?: boolean;
  agenda?: string[];
  chatEnabled?: boolean;
  handRaiseEnabled?: boolean;
  screenShareEnabled?: boolean;
  attendanceRequired?: boolean;
}

export const liveSessionService = {
  // Teacher-specific methods
  // Create a new live session (Teacher only)
  createSession: async (data: ICreateLiveSessionData): Promise<ILiveSession> => {
    const response = await apiService.post<{ session: ILiveSession }>('/teacher/live-sessions', data);
    
    if (response.success && response.data) {
      return response.data.session;
    }
    
    throw new Error(response.error || 'Failed to create live session');
  },

  // Get teacher's live sessions
  getTeacherSessions: async (filters: ILiveSessionFilters = {}): Promise<ILiveSessionListResponse> => {
    const queryParams = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    const response = await apiService.get<ILiveSessionListResponse>(
      `/teacher/live-sessions?${queryParams.toString()}`
    );
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.error || 'Failed to fetch teacher sessions');
  },

  // Get teacher's session by ID
  getTeacherSessionById: async (id: string): Promise<ILiveSession> => {
    const response = await apiService.get<{ session: ILiveSession }>(`/teacher/live-sessions/${id}`);
    
    if (response.success && response.data) {
      return response.data.session;
    }
    
    throw new Error(response.error || 'Failed to fetch session');
  },

  // Update live session (Teacher only)
  updateSession: async (id: string, data: IUpdateLiveSessionData): Promise<ILiveSession> => {
    const response = await apiService.put<{ session: ILiveSession }>(`/teacher/live-sessions/${id}`, data);
    
    if (response.success && response.data) {
      return response.data.session;
    }
    
    throw new Error(response.error || 'Failed to update session');
  },

  // Delete live session (Teacher only)
  deleteSession: async (id: string): Promise<void> => {
    const response = await apiService.delete(`/teacher/live-sessions/${id}`);
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to delete session');
    }
  },

  // Start live session (Teacher only)
  startSession: async (id: string): Promise<ILiveSession> => {
    const response = await apiService.post<{ session: ILiveSession }>(`/teacher/live-sessions/${id}/start`);
    
    if (response.success && response.data) {
      return response.data.session;
    }
    
    throw new Error(response.error || 'Failed to start session');
  },

  // End live session (Teacher only)
  endSession: async (id: string): Promise<ILiveSession> => {
    const response = await apiService.post<{ session: ILiveSession }>(`/teacher/live-sessions/${id}/end`);

    if (response.success && response.data) {
      return response.data.session;
    }

    throw new Error(response.error || 'Failed to end session');
  },

  // Start recording (Teacher only)
  startRecording: async (id: string): Promise<ILiveSession> => {
    const response = await apiService.post<{ session: ILiveSession }>(`/teacher/live-sessions/${id}/start-recording`);

    if (response.success && response.data) {
      return response.data.session;
    }

    throw new Error(response.error || 'Failed to start recording');
  },

  // Stop recording (Teacher only)
  stopRecording: async (id: string, recordingData?: { recordingUrl?: string; recordingSize?: number }): Promise<ILiveSession> => {
    const response = await apiService.post<{ session: ILiveSession }>(`/teacher/live-sessions/${id}/stop-recording`, recordingData);

    if (response.success && response.data) {
      return response.data.session;
    }

    throw new Error(response.error || 'Failed to stop recording');
  },

  // Join live session (Teacher)
  joinSession: async (id: string): Promise<ILiveSession> => {
    const response = await apiService.post<{ session: ILiveSession }>(`/teacher/live-sessions/${id}/join`);

    if (response.success && response.data) {
      return response.data.session;
    }

    throw new Error(response.error || 'Failed to join session');
  },

  // Join live session (Student)
  joinSessionAsStudent: async (sessionId: string): Promise<ILiveSession> => {
    const response = await apiService.post<{ session: ILiveSession }>(`/student/live-sessions/${sessionId}/join`);

    if (response.success && response.data) {
      return response.data.session;
    }

    throw new Error(response.error || 'Failed to join session');
  },

  // Student-specific methods
  // Get available sessions for students (from enrolled courses)
  getStudentSessions: async (filters: ILiveSessionFilters = {}): Promise<ILiveSessionListResponse> => {
    const queryParams = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    const response = await apiService.get<ILiveSessionListResponse>(
      `/student/live-sessions?${queryParams.toString()}`
    );

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error || 'Failed to fetch student sessions');
  },

  // Get all available sessions for students (legacy method - now uses student endpoint)
  getAllSessions: async (filters: ILiveSessionFilters = {}): Promise<{ sessions: ILiveSession[] }> => {
    const response = await liveSessionService.getStudentSessions(filters);
    return { sessions: response.sessions };
  },

  // Get session by ID (for students)
  getSessionById: async (id: string): Promise<ILiveSession> => {
    const response = await apiService.get<{ session: ILiveSession }>(`/live-sessions/${id}`);

    if (response.success && response.data) {
      return response.data.session;
    }

    throw new Error(response.error || 'Failed to fetch session');
  },

  // Admin-only methods
  // Get all live sessions (Admin only)
  getAllSessionsAdmin: async (filters: ILiveSessionFilters = {}): Promise<ILiveSessionListResponse> => {
    const queryParams = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    const response = await apiService.get<ILiveSessionListResponse>(
      `/live-sessions?${queryParams.toString()}`
    );
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.error || 'Failed to fetch live sessions');
  },

  // Get live session by ID (Admin only)
  getSessionByIdAdmin: async (id: string): Promise<ILiveSession> => {
    const response = await apiService.get<{ session: ILiveSession }>(`/live-sessions/${id}`);
    
    if (response.success && response.data) {
      return response.data.session;
    }
    
    throw new Error(response.error || 'Failed to fetch live session');
  },

  // Get sessions by teacher (Admin only)
  getSessionsByTeacher: async (teacherId: string, filters: ILiveSessionFilters = {}): Promise<ILiveSessionListResponse> => {
    const queryParams = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    const response = await apiService.get<ILiveSessionListResponse>(
      `/live-sessions/teacher/${teacherId}?${queryParams.toString()}`
    );
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.error || 'Failed to fetch teacher sessions');
  },

  // Get active/live sessions (Admin only)
  getActiveSessions: async (): Promise<ILiveSession[]> => {
    const response = await apiService.get<{ sessions: ILiveSession[] }>('/live-sessions/active');
    
    if (response.success && response.data) {
      return response.data.sessions;
    }
    
    throw new Error(response.error || 'Failed to fetch active sessions');
  },

  // Cancel session (Admin only)
  cancelSession: async (id: string, data: ICancelSessionData = {}): Promise<ILiveSession> => {
    const response = await apiService.put<{ session: ILiveSession }>(`/live-sessions/${id}/cancel`, data);
    
    if (response.success && response.data) {
      return response.data.session;
    }
    
    throw new Error(response.error || 'Failed to cancel session');
  },

  // Force end session (Admin only)
  forceEndSession: async (id: string): Promise<ILiveSession> => {
    const response = await apiService.put<{ session: ILiveSession }>(`/live-sessions/${id}/force-end`);
    
    if (response.success && response.data) {
      return response.data.session;
    }
    
    throw new Error(response.error || 'Failed to end session');
  },

  // Get session statistics (Admin only)
  getSessionStats: async (): Promise<ILiveSessionStats> => {
    const response = await apiService.get<ILiveSessionStats>('/live-sessions/stats');
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.error || 'Failed to fetch session statistics');
  },

  // Get session attendance details (Admin only)
  getSessionAttendance: async (id: string): Promise<ISessionAttendance> => {
    const response = await apiService.get<ISessionAttendance>(`/live-sessions/${id}/attendance`);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.error || 'Failed to fetch session attendance');
  },

  // Helper functions for formatting
  formatDuration: (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  },

  formatSessionStatus: (status: string): { label: string; color: 'success' | 'warning' | 'error' | 'info' | 'default' } => {
    switch (status) {
      case 'live':
        return { label: 'Live', color: 'success' };
      case 'scheduled':
        return { label: 'Scheduled', color: 'info' };
      case 'ended':
        return { label: 'Ended', color: 'default' };
      case 'cancelled':
        return { label: 'Cancelled', color: 'error' };
      default:
        return { label: status, color: 'default' };
    }
  },

  isSessionLive: (session: ILiveSession): boolean => {
    return session.status === 'live';
  },

  isSessionUpcoming: (session: ILiveSession): boolean => {
    return session.status === 'scheduled' && new Date(session.scheduledTime) > new Date();
  },

  isSessionPast: (session: ILiveSession): boolean => {
    return session.status === 'ended' || 
           (session.status === 'scheduled' && new Date(session.scheduledTime) < new Date());
  },

  getSessionTimeStatus: (session: ILiveSession): string => {
    const now = new Date();
    const scheduledTime = new Date(session.scheduledTime);
    
    if (session.status === 'live') {
      return 'Live Now';
    }
    
    if (session.status === 'ended') {
      return 'Ended';
    }
    
    if (session.status === 'cancelled') {
      return 'Cancelled';
    }
    
    if (scheduledTime > now) {
      const diffMs = scheduledTime.getTime() - now.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHours / 24);
      
      if (diffDays > 0) {
        return `In ${diffDays} day${diffDays > 1 ? 's' : ''}`;
      } else if (diffHours > 0) {
        return `In ${diffHours} hour${diffHours > 1 ? 's' : ''}`;
      } else {
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        return `In ${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`;
      }
    }
    
    return 'Past';
  },

  // Sync recorded sessions to course content
  syncRecordedSessionsToCourseContent: async (courseId: string): Promise<{
    totalRecordedSessions: number;
    addedToCourseContent: number;
    errors?: string[];
  }> => {
    const response = await apiService.post<{
      totalRecordedSessions: number;
      addedToCourseContent: number;
      errors?: string[];
    }>(`/live-sessions/course/${courseId}/sync-recordings`);

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error || 'Failed to sync recorded sessions');
  },

  // Sync recorded sessions quietly (without throwing errors)
  syncRecordedSessionsQuietly: async (courseId: string) => {
    try {
      return await liveSessionService.syncRecordedSessionsToCourseContent(courseId);
    } catch (error) {
      console.warn('Failed to sync recorded sessions:', error);
      return null;
    }
  }
};
