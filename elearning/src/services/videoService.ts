import { apiService } from './apiService';

export interface VideoTokenRequest {
  role: 'student' | 'teacher' | 'admin';
  userName: string;
  sessionId?: string;
  roomId?: string;
  isRecorder?: boolean;
}

export interface VideoTokenResponse {
  token: string;
  roomId: string;
  userId: string;
  role: string;
  userName: string;
}

export interface RecordingRequest {
  sessionId?: string;
  roomId?: string;
  recordingId?: string;
}

export interface RecordingResponse {
  recordingId?: string;
  recordingUrl?: string;
  roomId: string;
}

export interface EndRoomRequest {
  sessionId?: string;
  roomId?: string;
  reason?: string;
}

export interface EnableRoomRequest {
  roomId: string;
}

class VideoService {
  /**
   * Generate HMS token for video session
   */
  async generateToken(request: VideoTokenRequest): Promise<VideoTokenResponse> {
    try {
      const response = await apiService.post<VideoTokenResponse>('/video/token', request);

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error(response.error || 'Failed to generate video token');
    } catch (error) {
      console.error('❌ Error generating video token:', error);
      throw error;
    }
  }

  /**
   * Start recording for a video session
   */
  async startRecording(request: RecordingRequest): Promise<RecordingResponse> {
    try {
      const response = await apiService.post<{ data: RecordingResponse }>('/video/recording/start', request);
      
      if (response.success && response.data) {
        return response.data.data;
      }
      
      throw new Error(response.error || 'Failed to start recording');
    } catch (error) {
      console.error('❌ Error starting recording:', error);
      throw error;
    }
  }

  /**
   * Stop recording for a video session
   */
  async stopRecording(request: RecordingRequest): Promise<RecordingResponse> {
    try {
      const response = await apiService.post<{ data: RecordingResponse }>('/video/recording/stop', request);
      
      if (response.success && response.data) {
        return response.data.data;
      }
      
      throw new Error(response.error || 'Failed to stop recording');
    } catch (error) {
      console.error('❌ Error stopping recording:', error);
      throw error;
    }
  }

  /**
   * End a video room
   */
  async endRoom(request: EndRoomRequest): Promise<{ roomId: string }> {
    try {
      const response = await apiService.post<{ data: { roomId: string } }>('/video/room/end', request);
      
      if (response.success && response.data) {
        return response.data.data;
      }
      
      throw new Error(response.error || 'Failed to end room');
    } catch (error) {
      console.error('❌ Error ending room:', error);
      throw error;
    }
  }

  /**
   * Enable a video room
   */
  async enableRoom(roomId: string): Promise<{ roomId: string; enabled: boolean }> {
    try {
      const response = await apiService.post<{ data: { roomId: string; enabled: boolean } }>('/video/room/enable', { roomId });
      
      if (response.success && response.data) {
        return response.data.data;
      }
      
      throw new Error(response.error || 'Failed to enable room');
    } catch (error) {
      console.error('❌ Error enabling room:', error);
      throw error;
    }
  }

  /**
   * Join a live class session
   */
  async joinLiveClass(sessionId: string, userRole: 'student' | 'teacher' | 'admin'): Promise<VideoTokenResponse> {
    try {
      return await this.generateToken({
        role: userRole,
        userName: 'User', // This will be overridden by the backend with actual user data
        sessionId
      });
    } catch (error) {
      console.error('❌ Error joining live class:', error);
      throw error;
    }
  }

  /**
   * Start a live class session (teacher only)
   */
  async startLiveClass(sessionId: string): Promise<VideoTokenResponse> {
    try {
      return await this.generateToken({
        role: 'teacher',
        userName: 'Teacher', // This will be overridden by the backend with actual user data
        sessionId
      });
    } catch (error) {
      console.error('❌ Error starting live class:', error);
      throw error;
    }
  }

  /**
   * Join exam proctoring session
   */
  async joinExamProctoring(examId: string, userRole: 'student' | 'admin'): Promise<VideoTokenResponse> {
    try {
      return await this.generateToken({
        role: userRole,
        userName: 'User', // This will be overridden by the backend with actual user data
        roomId: `exam-${examId}`,
        isRecorder: userRole === 'admin'
      });
    } catch (error) {
      console.error('❌ Error joining exam proctoring:', error);
      throw error;
    }
  }

  /**
   * Create a custom video room
   */
  async createCustomRoom(roomName: string, userRole: 'student' | 'teacher' | 'admin'): Promise<VideoTokenResponse> {
    try {
      return await this.generateToken({
        role: userRole,
        userName: 'User', // This will be overridden by the backend with actual user data
        roomId: `custom-${roomName}-${Date.now()}`
      });
    } catch (error) {
      console.error('❌ Error creating custom room:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const videoService = new VideoService();
export default videoService;
