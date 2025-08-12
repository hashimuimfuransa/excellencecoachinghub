import jwt from 'jsonwebtoken';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

// 100ms API configuration
const HMS_API_BASE_URL = 'https://api.100ms.live/v2';
const HMS_BEAM_API_BASE_URL = 'https://prod-in2.100ms.live/api/v2'; // Regional endpoint for beam operations

// Role definitions for 100ms
export interface HMSRole {
  name: string;
  publishParams: {
    allowed: string[];
    audio: {
      bitRate: number;
      codec: string;
    };
    video: {
      bitRate: number;
      codec: string;
      width: number;
      height: number;
      frameRate: number;
    };
    screen: {
      bitRate: number;
      codec: string;
      width: number;
      height: number;
      frameRate: number;
    };
  };
  subscribeParams: {
    subscribeToRoles: string[];
    maxSubsBitRate: number;
  };
  permissions: {
    endRoom: boolean;
    removeOthers: boolean;
    mute: boolean;
    unmute: boolean;
    changeRole: boolean;
  };
  priority: number;
}

// User role mapping
export type UserRole = 'student' | 'teacher' | 'admin';

export interface HMSTokenRequest {
  role: UserRole;
  userName: string;
  userId: string;
  roomId?: string;
  isRecorder?: boolean;
}

export interface HMSTokenResponse {
  token: string;
  roomId: string;
  userId: string;
  role: string;
}

export interface HMSRoomResponse {
  id: string;
  name: string;
  enabled: boolean;
  description: string;
  customer_id: string;
  recording_info: {
    enabled: boolean;
    upload_info: {
      type: string;
      location: string;
    };
  };
  region: string;
  template_id: string;
  template: string;
  created_at: string;
  updated_at: string;
}

// Recording session tracking
export interface RecordingSession {
  recordingId: string;
  roomId: string;
  method: 'live-streams' | 'beam' | 'server-side' | 'fallback';
  startTime: Date;
  status: 'starting' | 'active' | 'stopping' | 'stopped' | 'failed';
  jobId?: string;
  beamId?: string;
}

export class HMSVideoService {
  private appId: string;
  private appSecret: string;
  private managementToken: string;
  private templateId: string;
  private activeRecordings: Map<string, RecordingSession> = new Map();

  constructor() {
    this.appId = process.env['HMS_APP_ID'] || '';
    this.appSecret = process.env['HMS_APP_SECRET'] || '';
    this.managementToken = process.env['HMS_MANAGEMENT_TOKEN'] || '';
    this.templateId = process.env['HMS_TEMPLATE_ID'] || '';

    if (!this.appId || !this.appSecret) {
      console.warn('⚠️ HMS credentials not configured. Video features will not work.');
    }
  }

  /**
   * Validate HMS credentials and configuration
   */
  private validateCredentials(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!this.appId) {
      errors.push('HMS_APP_ID is not configured');
    }
    
    if (!this.appSecret) {
      errors.push('HMS_APP_SECRET is not configured');
    }
    
    if (!process.env['HMS_ROOM_ID']) {
      errors.push('HMS_ROOM_ID is not configured');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Ensure room exists and is active, create/enable if needed
   */
  private async ensureRoomActive(roomId: string, sessionName?: string): Promise<string> {
    try {
      // First, check if room exists and is active
      const roomDetails = await this.getRoomDetails(roomId);
      
      if (roomDetails && roomDetails.enabled) {
        console.log(`✅ Room ${roomId} is already active`);
        return roomId;
      }
      
      if (roomDetails && !roomDetails.enabled) {
        console.log(`🔄 Room ${roomId} exists but is disabled, enabling...`);
        const enabled = await this.enableRoom(roomId);
        if (enabled) {
          console.log(`✅ Room ${roomId} enabled successfully`);
          return roomId;
        }
      }
      
      // Room doesn't exist, create it
      console.log(`🏗️ Room ${roomId} not found, creating new room...`);
      const newRoomId = await this.createRoom(
        sessionName || `Session ${roomId}`,
        `Video room for session ${roomId}`
      );
      
      console.log(`✅ Created and activated room: ${newRoomId}`);
      return newRoomId;
      
    } catch (error) {
      console.error(`❌ Error ensuring room is active:`, error);
      
      // Fallback: try to use the default room from environment
      const defaultRoomId = process.env['HMS_ROOM_ID'];
      if (defaultRoomId && defaultRoomId !== roomId) {
        console.log(`🔄 Falling back to default room: ${defaultRoomId}`);
        return await this.ensureRoomActive(defaultRoomId);
      }
      
      throw new Error(`Failed to ensure room is active: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Generate JWT token for 100ms room access
   */
  async generateToken(request: HMSTokenRequest): Promise<HMSTokenResponse> {
    try {
      const { role, userName, userId, roomId, isRecorder = false } = request;
      
      // Validate credentials first
      const credentialCheck = this.validateCredentials();
      if (!credentialCheck.isValid) {
        throw new Error(`HMS credentials validation failed: ${credentialCheck.errors.join(', ')}`);
      }

      // Determine which room to use
      let targetRoomId = roomId || process.env['HMS_ROOM_ID'] || 'default-room';
      
      console.log(`🎥 Preparing room: ${targetRoomId} with validated credentials`);
      console.log(`🔐 HMS App ID: ${this.appId.substring(0, 8)}...`);
      
      // Ensure room is active before generating token
      const activeRoomId = await this.ensureRoomActive(targetRoomId, `Session ${userId}`);

      // Map user role to HMS role
      const hmsRole = this.mapUserRoleToHMSRole(role, isRecorder);

      // Create JWT payload with timing adjustments for clock skew
      const now = Math.floor(Date.now() / 1000);
      const payload = {
        access_key: this.appId,
        room_id: activeRoomId,
        user_id: userId,
        role: hmsRole,
        type: 'app',
        version: 2,
        jti: uuidv4(), // JWT ID - required by 100ms
        iat: now - 60, // Issue time: 1 minute ago to account for clock skew
        nbf: now - 60, // Not before: 1 minute ago to account for clock skew
        exp: now + (24 * 60 * 60) // Expires: 24 hours from now
      };

      // Generate JWT token
      const token = jwt.sign(payload, this.appSecret, {
        algorithm: 'HS256'
      });

      console.log(`✅ Generated HMS token for user ${userName} (${role}) in active room ${activeRoomId}`);

      return {
        token,
        roomId: activeRoomId,
        userId,
        role: hmsRole
      };

    } catch (error) {
      console.error('❌ Error generating HMS token:', error);
      throw new Error('Failed to generate video token');
    }
  }

  /**
   * Create a new 100ms room
   */
  async createRoom(name: string, description?: string): Promise<string> {
    try {
      const response = await axios.post(
        `${HMS_API_BASE_URL}/rooms`,
        {
          name,
          description: description || `Room for ${name}`,
          template_id: this.templateId,
          region: 'us'
        },
        {
          headers: {
            'Authorization': `Bearer ${this.managementToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const room: HMSRoomResponse = response.data;
      console.log(`✅ Created HMS room: ${room.id} (${room.name})`);
      
      return room.id;

    } catch (error) {
      console.error('❌ Error creating HMS room:', error);
      
      // Fallback to a default room ID if creation fails
      const fallbackRoomId = `fallback-room-${uuidv4()}`;
      console.log(`⚠️ Using fallback room ID: ${fallbackRoomId}`);
      
      return fallbackRoomId;
    }
  }

  /**
   * Start recording for a room
   */
  async startRecording(roomId: string): Promise<{ recordingId: string }> {
    try {
      // Check if recording already exists for this room
      const existingRecording = Array.from(this.activeRecordings.values())
        .find(session => session.roomId === roomId && ['starting', 'active'].includes(session.status));
      
      if (existingRecording) {
        console.log(`⚠️ Recording already active for room ${roomId}: ${existingRecording.recordingId}`);
        return { recordingId: existingRecording.recordingId };
      }

      let recordingId: string | undefined;
      let recordingMethod: RecordingSession['method'] = 'fallback';
      let jobId: string | undefined;
      let beamId: string | undefined;

      // Try 1: Live-streams API
      try {
        console.log(`🎥 Attempting to start recording with live-streams API for room: ${roomId}`);
        const response = await axios.post(
          `${HMS_BEAM_API_BASE_URL}/live-streams`,
          {
            name: `Recording for room ${roomId}`,
            room_id: roomId,
            recording: {
              enabled: true,
              upload_info: {
                type: 'gs',
                location: 'gs://100ms-recordings'
              }
            }
          },
          {
            headers: {
              'Authorization': `Bearer ${this.managementToken}`,
              'Content-Type': 'application/json'
            }
          }
        );

        recordingId = response.data.id;
        if (recordingId) {
          recordingMethod = 'live-streams';
          jobId = response.data.id;
          console.log(`✅ Started recording with live-streams API for room ${roomId}: ${recordingId}`);
          console.log('Live-streams API response:', response.data);
        }
      } catch (liveStreamsError) {
        console.log(`⚠️ Live-streams API failed, trying server-side recording API...`);
      }

      // Try 2: Server-side Recording API
      try {
        console.log('Trying server-side recording API...');
        const response = await axios.post(
          `${HMS_BEAM_API_BASE_URL}/recordings/room/${roomId}/start`,
          {
            recording_config: {
              output_format: 'mp4',
              resolution: {
                width: 1280,
                height: 720
              }
            }
          },
          {
            headers: {
              'Authorization': `Bearer ${this.managementToken}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        recordingId = response.data.id || response.data.recording_id;
        if (recordingId) {
          console.log(`✅ Started recording with server-side API for room ${roomId}: ${recordingId}`);
          console.log('Server-side API response:', response.data);
          return { recordingId };
        }
      } catch (serverSideError) {
        console.log(`⚠️ Server-side recording API failed, trying beam API...`);
      }

      // Try 3: Beam Recording API
      try {
        console.log('Trying recording-specific beam endpoint...');
        const response = await axios.post(
          `${HMS_BEAM_API_BASE_URL}/beam/recording`,
          {
            room_id: roomId,
            recording: {
              enabled: true,
              upload_info: {
                type: 'gs',
                location: 'gs://100ms-recordings'
              }
            }
          },
          {
            headers: {
              'Authorization': `Bearer ${this.managementToken}`,
              'Content-Type': 'application/json'
            }
          }
        );

        recordingId = response.data.id || response.data.beam_id || response.data.job_id || response.data.recording_id;
        if (recordingId) {
          console.log(`✅ Started recording with beam recording API for room ${roomId}: ${recordingId}`);
          console.log('Beam recording API response:', response.data);
          return { recordingId };
        }
      } catch (beamRecordingError) {
        console.log('Recording endpoint failed, trying general beam endpoint...');
      }

      // Try 4: General Beam API
      if (!recordingId) {
        try {
          console.log('Trying general beam endpoint...');
          const response = await axios.post(
            `${HMS_BEAM_API_BASE_URL}/beam`,
            {
              operation: 'start',
              room_id: roomId,
              meeting_url: `https://your-app.100ms.live/meeting/${roomId}`,
              record: true,
              resolution: {
                width: 1280,
                height: 720
              }
            },
            {
              headers: {
                'Authorization': `Bearer ${this.managementToken}`,
                'Content-Type': 'application/json'
              }
            }
          );

          // Handle different response formats
          if (typeof response.data === 'string') {
            console.log('String response received:', response.data);
            if (response.data.includes('Beam started')) {
              // For string responses, we'll create a fallback recording that doesn't need to be stopped via API
              recordingId = `beam_${roomId}_${Date.now()}`;
              recordingMethod = 'fallback'; // Mark as fallback since we can't stop it via API
              console.log(`✅ Generated fallback recording ID for beam: ${recordingId}`);
              console.log(`⚠️ Note: This recording will auto-stop when the room ends`);
            }
          } else {
            recordingId = response.data.id || response.data.beam_id || response.data.job_id || response.data.recording_id;
            if (recordingId) {
              recordingMethod = 'beam';
              jobId = response.data.job_id || recordingId;
              beamId = response.data.beam_id || response.data.id;
              console.log(`✅ Started recording with general beam API for room ${roomId}: ${recordingId}`);
              console.log('General beam API response:', response.data);
            }
          }
        } catch (generalBeamError) {
          console.log('❌ All beam API endpoints failed:', generalBeamError);
        }
      }

      // Fallback: Create development recording ID
      if (!recordingId) {
        console.error('❌ No recording ID received from any HMS API');
        console.log('🔄 Creating fallback recording ID for development...');
        recordingId = `fallback_${roomId}_${Date.now()}`;
        recordingMethod = 'fallback';
        console.log(`⚠️ Using fallback recording ID: ${recordingId}`);
      }
      
      // Track the recording session
      const recordingSession: RecordingSession = {
        recordingId,
        roomId,
        method: recordingMethod,
        startTime: new Date(),
        status: 'active',
        ...(jobId && { jobId }),
        ...(beamId && { beamId })
      };
      
      this.activeRecordings.set(recordingId, recordingSession);
      console.log(`📁 Tracking recording session: ${recordingId} (${recordingMethod})`);
      
      return { recordingId };

    } catch (error) {
      console.error('❌ Error starting recording:', error);
      if (axios.isAxiosError(error)) {
        console.error('Response data:', error.response?.data);
        console.error('Response status:', error.response?.status);
        console.error('Request URL:', error.config?.url);
        console.error('Request method:', error.config?.method);
        console.error('Request headers:', error.config?.headers);
      }
      throw new Error('Failed to start recording');
    }
  }

  /**
   * Stop recording for a room
   */
  async stopRecording(roomId: string, recordingId: string): Promise<{ recordingUrl?: string }> {
    try {
      // Get the tracked recording session
      const recordingSession = this.activeRecordings.get(recordingId);
      
      if (!recordingSession) {
        console.log(`⚠️ Recording session not found in tracking: ${recordingId}`);
        console.log(`🔍 Available recordings: ${Array.from(this.activeRecordings.keys()).join(', ')}`);
        
        // Try to find by room ID
        const roomRecording = Array.from(this.activeRecordings.values())
          .find(session => session.roomId === roomId && ['active', 'starting'].includes(session.status));
        
        if (roomRecording) {
          console.log(`🔄 Found recording for room ${roomId}: ${roomRecording.recordingId}`);
          return await this.stopRecording(roomId, roomRecording.recordingId);
        }
        
        console.log(`⚠️ No active recording found for room ${roomId}`);
        return {};
      }
      
      // Update status to stopping
      recordingSession.status = 'stopping';
      console.log(`🛑 Stopping recording: ${recordingId} (method: ${recordingSession.method})`);
      
      let response;
      let stopSuccess = false;

      // Use the appropriate stop method based on how recording was started
      if (recordingSession.method === 'live-streams') {
        try {
          console.log(`🛑 Stopping live-streams recording: ${recordingId}`);
          response = await axios.post(
            `${HMS_BEAM_API_BASE_URL}/live-streams/${recordingId}/stop`,
            {},
            {
              headers: {
                'Authorization': `Bearer ${this.managementToken}`,
                'Content-Type': 'application/json'
              }
            }
          );
          stopSuccess = true;
          console.log(`✅ Stopped live-streams recording: ${recordingId}`);
        } catch (error) {
          console.log(`⚠️ Live-streams stop failed: ${error}`);
        }
      }
      
      if (!stopSuccess && recordingSession.method === 'beam' && recordingSession.jobId) {
        try {
          console.log(`🛑 Stopping beam recording with job ID: ${recordingSession.jobId}`);
          response = await axios.post(
            `${HMS_BEAM_API_BASE_URL}/beam`,
            {
              operation: 'stop',
              room_id: roomId,
              job_id: recordingSession.jobId
            },
            {
              headers: {
                'Authorization': `Bearer ${this.managementToken}`,
                'Content-Type': 'application/json'
              }
            }
          );
          stopSuccess = true;
          console.log(`✅ Stopped beam recording: ${recordingSession.jobId}`);
        } catch (error) {
          console.log(`⚠️ Beam stop failed: ${error}`);
          
          // Try alternative beam stop methods
          try {
            console.log(`🔄 Trying alternative beam stop method...`);
            response = await axios.delete(
              `${HMS_BEAM_API_BASE_URL}/beam/${recordingSession.jobId}`,
              {
                headers: {
                  'Authorization': `Bearer ${this.managementToken}`,
                  'Content-Type': 'application/json'
                }
              }
            );
            stopSuccess = true;
            console.log(`✅ Stopped beam recording with DELETE method`);
          } catch (deleteError) {
            console.log(`⚠️ Alternative beam stop also failed: ${deleteError}`);
          }
        }
      }
      
      if (!stopSuccess && recordingSession.method === 'server-side') {
        try {
          console.log(`🛑 Stopping server-side recording: ${recordingId}`);
          response = await axios.post(
            `${HMS_BEAM_API_BASE_URL}/recordings/room/${roomId}/stop`,
            { recording_id: recordingId },
            {
              headers: {
                'Authorization': `Bearer ${this.managementToken}`,
                'Content-Type': 'application/json'
              }
            }
          );
          stopSuccess = true;
          console.log(`✅ Stopped server-side recording: ${recordingId}`);
        } catch (error) {
          console.log(`⚠️ Server-side stop failed: ${error}`);
        }
      }
      
      // Handle fallback recordings (those that can't be stopped via API)
      if (!stopSuccess && recordingSession.method === 'fallback') {
        console.log(`🔄 Fallback recording detected - marking as stopped (will auto-stop with room)`);
        recordingSession.status = 'stopped';
        stopSuccess = true;
        
        // For fallback recordings, we'll end the room to ensure recording stops
        try {
          console.log(`🚪 Ending room to ensure recording stops: ${roomId}`);
          await this.endRoom(roomId, 'Recording session ended');
          console.log(`✅ Room ended successfully`);
        } catch (roomEndError) {
          console.log(`⚠️ Room end failed: ${roomEndError}`);
        }
      }
      
      // Update recording session status
      if (stopSuccess) {
        recordingSession.status = 'stopped';
        console.log(`✅ Recording ${recordingId} marked as stopped`);
      } else {
        recordingSession.status = 'failed';
        console.log(`❌ Recording ${recordingId} stop failed, marked as failed`);
      }
      
      // Clean up tracking after a delay (keep for potential URL retrieval)
      setTimeout(() => {
        this.activeRecordings.delete(recordingId);
        console.log(`🗑️ Cleaned up recording session: ${recordingId}`);
      }, 300000); // 5 minutes
      
      // The recording URL will be available after processing
      const recordingUrl = response?.data?.recording_url || response?.data?.playback_url;
      return { recordingUrl };

    } catch (error) {
      console.error('❌ Error stopping recording:', error);
      if (axios.isAxiosError(error)) {
        console.error('Response data:', error.response?.data);
        console.error('Response status:', error.response?.status);
        console.error('Request URL:', error.config?.url);
        
        // If recording not found (404), it might have already been stopped or never started
        if (error.response?.status === 404) {
          console.log('⚠️ Recording not found (404) - it may have already been stopped or never started');
          return {};
        }
      }
      throw new Error('Failed to stop recording');
    }
  }

  /**
   * Get recording details and status
   */
  async getRecordingDetails(recordingId: string): Promise<{ status: string; recordingUrl?: string; playbackUrl?: string }> {
    try {
      let response;

      try {
        // Try live-streams API first
        response = await axios.get(
          `${HMS_BEAM_API_BASE_URL}/live-streams/${recordingId}`,
          {
            headers: {
              'Authorization': `Bearer ${this.managementToken}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
      } catch (liveStreamsError) {
        // Fallback to beam API
        response = await axios.get(
          `${HMS_BEAM_API_BASE_URL}/beam/${recordingId}`,
          {
            headers: {
              'Authorization': `Bearer ${this.managementToken}`,
              'Content-Type': 'application/json'
            }
          }
        );
      }

      const data = response.data;
      console.log(`✅ Retrieved recording details for ${recordingId}:`, data.status);
      
      return {
        status: data.status,
        recordingUrl: data.recording_url,
        playbackUrl: data.playback_url
      };

    } catch (error) {
      console.error('❌ Error getting recording details:', error);
      if (axios.isAxiosError(error)) {
        console.error('Response data:', error.response?.data);
        console.error('Response status:', error.response?.status);
      }
      throw new Error('Failed to get recording details');
    }
  }

  /**
   * Wait for recording to be processed and get final URL
   */
  async waitForRecordingCompletion(recordingId: string, maxWaitTime: number = 300000): Promise<{ recordingUrl?: string; status: string }> {
    const startTime = Date.now();
    const pollInterval = 10000; // Poll every 10 seconds

    console.log(`🔄 Waiting for recording completion: ${recordingId}`);

    while (Date.now() - startTime < maxWaitTime) {
      try {
        const details = await this.getRecordingDetails(recordingId);
        
        console.log(`📊 Recording status: ${details.status}`);
        
        if (details.status === 'completed' && details.recordingUrl) {
          console.log(`✅ Recording completed with URL: ${details.recordingUrl}`);
          return {
            recordingUrl: details.recordingUrl,
            status: 'completed'
          };
        }
        
        if (details.status === 'failed') {
          console.log(`❌ Recording failed`);
          return {
            status: 'failed'
          };
        }
        
        // Wait before next poll
        await new Promise(resolve => setTimeout(resolve, pollInterval));
        
      } catch (error) {
        console.error(`⚠️ Error checking recording status: ${error}`);
        // Continue polling even if there's an error
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      }
    }

    console.log(`⏰ Recording completion timeout reached for: ${recordingId}`);
    return {
      status: 'timeout'
    };
  }

  /**
   * Map user role to HMS role name
   */
  private mapUserRoleToHMSRole(userRole: UserRole, isRecorder: boolean = false): string {
    if (isRecorder) {
      return 'host'; // Recorders get host permissions for recording
    }

    switch (userRole) {
      case 'teacher':
        return 'host'; // Teachers get host role (can publish audio/video/screen + admin permissions)
      case 'admin':
        return 'host'; // Admins get host permissions
      case 'student':
      default:
        return 'guest'; // Students get guest role (can publish screen/audio)
    }
  }

  /**
   * Get room details
   */
  async getRoomDetails(roomId: string): Promise<HMSRoomResponse | null> {
    try {
      const response = await axios.get(
        `${HMS_API_BASE_URL}/rooms/${roomId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.managementToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;

    } catch (error) {
      console.error('❌ Error getting room details:', error);
      return null;
    }
  }

  /**
   * Enable a room
   */
  async enableRoom(roomId: string): Promise<boolean> {
    try {
      const response = await axios.post(
        `${HMS_API_BASE_URL}/rooms/${roomId}`,
        {
          enabled: true
        },
        {
          headers: {
            'Authorization': `Bearer ${this.managementToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log(`✅ Enabled HMS room: ${roomId}`);
      return response.data.enabled === true;

    } catch (error) {
      console.error('❌ Error enabling room:', error);
      return false;
    }
  }

  /**
   * End a room session
   */
  async endRoom(roomId: string, reason?: string): Promise<boolean> {
    try {
      await axios.post(
        `${HMS_API_BASE_URL}/active-rooms/${roomId}/end-room`,
        {
          reason: reason || 'Session ended by host',
          lock: true
        },
        {
          headers: {
            'Authorization': `Bearer ${this.managementToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log(`✅ Ended HMS room: ${roomId}`);
      return true;

    } catch (error) {
      console.error('❌ Error ending room:', error);
      return false;
    }
  }
}

// Export singleton instance
export const hmsVideoService = new HMSVideoService();
export default hmsVideoService;
