import AgoraRTC, { 
  IAgoraRTCClient, 
  ICameraVideoTrack, 
  IMicrophoneAudioTrack,
  IRemoteVideoTrack,
  IRemoteAudioTrack
} from 'agora-rtc-sdk-ng';

class AgoraService {
  private client: IAgoraRTCClient | null = null;
  private localVideoTrack: ICameraVideoTrack | null = null;
  private localAudioTrack: IMicrophoneAudioTrack | null = null;
  private isJoined: boolean = false;

  // Demo Agora App ID - for production, get your own from https://console.agora.io/
  private readonly DEMO_APP_ID = 'demo-app-id-for-testing';

  constructor() {
    // Initialize Agora client
    this.client = AgoraRTC.createClient({ 
      mode: 'live', // Live streaming mode like YouTube Live
      codec: 'vp8' 
    });

    // Set up event listeners
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    if (!this.client) return;

    // Handle remote user joining
    this.client.on('user-published', async (user, mediaType) => {
      console.log('🎥 Remote user published:', user.uid, mediaType);
      
      // Subscribe to remote user
      await this.client!.subscribe(user, mediaType);
      
      if (mediaType === 'video') {
        const remoteVideoTrack = user.videoTrack as IRemoteVideoTrack;
        // Trigger callback for video received
        if (this.onRemoteVideoCallback) {
          this.onRemoteVideoCallback(remoteVideoTrack);
        }
      }
      
      if (mediaType === 'audio') {
        const remoteAudioTrack = user.audioTrack as IRemoteAudioTrack;
        remoteAudioTrack.play();
      }
    });

    // Handle remote user leaving
    this.client.on('user-unpublished', (user, mediaType) => {
      console.log('🚪 Remote user unpublished:', user.uid, mediaType);
    });

    // Handle connection state changes
    this.client.on('connection-state-change', (curState, revState) => {
      console.log('🔗 Connection state changed:', revState, '->', curState);
    });
  }

  private onRemoteVideoCallback: ((track: IRemoteVideoTrack) => void) | null = null;

  // Teacher: Start broadcasting
  async startBroadcasting(channelName: string, teacherId: string): Promise<void> {
    if (!this.client) throw new Error('Agora client not initialized');

    try {
      console.log('🎥 Teacher starting broadcast with Agora...');

      // Set client role as broadcaster (teacher)
      await this.client.setClientRole('host');

      // Create local tracks
      [this.localAudioTrack, this.localVideoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks(
        {
          // Audio configuration
          AEC: true,
          ANS: true,
          AGC: true
        },
        {
          encoderConfig: {
            width: 640,
            height: 480,
            frameRate: 30,
            bitrateMin: 600,
            bitrateMax: 1000
          }
        }
      );

      // Join channel
      await this.client.join(this.DEMO_APP_ID, channelName, null, teacherId);
      this.isJoined = true;

      // Publish local tracks
      await this.client.publish([this.localAudioTrack, this.localVideoTrack]);

      console.log('✅ Teacher broadcasting started successfully!');

    } catch (error) {
      console.error('❌ Failed to start broadcasting:', error);
      throw error;
    }
  }

  // Student: Join as audience
  async joinAsAudience(channelName: string, studentId: string, onVideoReceived: (track: IRemoteVideoTrack) => void): Promise<void> {
    if (!this.client) throw new Error('Agora client not initialized');

    try {
      console.log('📺 Student joining as audience with Agora...');

      // Set client role as audience (student)
      await this.client.setClientRole('audience');

      // Set callback for when teacher video is received
      this.onRemoteVideoCallback = onVideoReceived;

      // Join channel
      await this.client.join(this.DEMO_APP_ID, channelName, null, studentId);
      this.isJoined = true;

      console.log('✅ Student joined as audience successfully!');

    } catch (error) {
      console.error('❌ Failed to join as audience:', error);
      throw error;
    }
  }

  // Get local video track for teacher's preview
  getLocalVideoTrack(): ICameraVideoTrack | null {
    return this.localVideoTrack;
  }

  // Leave channel and cleanup
  async leave(): Promise<void> {
    if (!this.client || !this.isJoined) return;

    try {
      // Close local tracks
      if (this.localVideoTrack) {
        this.localVideoTrack.close();
        this.localVideoTrack = null;
      }
      
      if (this.localAudioTrack) {
        this.localAudioTrack.close();
        this.localAudioTrack = null;
      }

      // Leave channel
      await this.client.leave();
      this.isJoined = false;

      console.log('✅ Left Agora channel successfully');

    } catch (error) {
      console.error('❌ Error leaving channel:', error);
    }
  }

  // Toggle video
  async toggleVideo(enabled: boolean): Promise<void> {
    if (this.localVideoTrack) {
      await this.localVideoTrack.setEnabled(enabled);
    }
  }

  // Toggle audio
  async toggleAudio(enabled: boolean): Promise<void> {
    if (this.localAudioTrack) {
      await this.localAudioTrack.setEnabled(enabled);
    }
  }

  // Check if currently broadcasting/joined
  isConnected(): boolean {
    return this.isJoined;
  }
}

// Export singleton instance
export const agoraService = new AgoraService();
export default agoraService;
