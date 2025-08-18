import { socketService } from './socketService';

class WebRTCService {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private sessionId: string | null = null;
  private userId: string | null = null;
  private isTeacher: boolean = false;
  private onRemoteStreamCallback: ((stream: MediaStream) => void) | null = null;

  // Multiple STUN servers for better reliability
  private iceServers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' }
  ];

  constructor() {
    this.setupSocketListeners();
  }

  // Initialize WebRTC for teacher (broadcaster) - simplified and reliable
  async initializeAsTeacher(sessionId: string, userId: string): Promise<MediaStream> {
    this.sessionId = sessionId;
    this.userId = userId;
    this.isTeacher = true;

    console.log('🎥 Initializing reliable WebRTC as teacher...');

    try {
      // Get teacher's camera and microphone with optimized settings
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640, max: 1280 },
          height: { ideal: 480, max: 720 },
          frameRate: { ideal: 30, max: 30 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: { ideal: 44100 }
        } as MediaTrackConstraints
      });

      console.log('✅ Teacher media access granted');

      // Create peer connection immediately
      this.createPeerConnection();

      // Add local stream to peer connection
      if (this.peerConnection && this.localStream) {
        this.localStream.getTracks().forEach(track => {
          this.peerConnection!.addTrack(track, this.localStream!);
        });
        console.log('✅ Local stream added to peer connection');
      }

      // Immediately start broadcasting (like YouTube Live)
      setTimeout(() => {
        this.startBroadcasting();
      }, 1000);

      // Notify students that teacher is ready
      socketService.sendChatMessage({
        sessionId,
        userId: 'system',
        userName: 'System',
        message: 'TEACHER_WEBRTC_READY',
        isTeacher: false,
        type: 'system'
      });

      return this.localStream;

    } catch (error) {
      console.error('❌ Failed to initialize teacher WebRTC:', error);
      throw new Error('Could not access camera and microphone. Please check permissions.');
    }
  }

  // Initialize WebRTC for student (receiver) - simplified and reliable
  async initializeAsStudent(sessionId: string, userId: string, onRemoteStream: (stream: MediaStream) => void): Promise<void> {
    // Prevent multiple initializations
    if (this.peerConnection) {
      console.log('📺 Student WebRTC already initialized');
      return;
    }

    this.sessionId = sessionId;
    this.userId = userId;
    this.isTeacher = false;
    this.onRemoteStreamCallback = onRemoteStream;

    console.log('📺 Initializing reliable WebRTC as student...');

    // Create peer connection
    this.createPeerConnection();

    // Send ready signal to teacher (only once)
    socketService.sendChatMessage({
      sessionId,
      userId: 'system',
      userName: 'System',
      message: 'STUDENT_WEBRTC_READY',
      isTeacher: false,
      type: 'system'
    });

    console.log('✅ Student WebRTC initialized and ready for teacher offer');
  }

  private createPeerConnection(): void {
    console.log('🔗 Creating peer connection...');

    this.peerConnection = new RTCPeerConnection({
      iceServers: this.iceServers,
      iceCandidatePoolSize: 10
    });

    // Handle remote stream
    this.peerConnection.ontrack = (event) => {
      console.log('📺 Received remote stream from teacher!');
      this.remoteStream = event.streams[0];

      // Immediately notify callback
      if (this.onRemoteStreamCallback && this.remoteStream) {
        this.onRemoteStreamCallback(this.remoteStream);
        console.log('✅ Remote stream passed to callback');
      }
    };

    // Handle ICE candidates
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.sessionId) {
        console.log('🧊 Sending ICE candidate');
        // Send ICE candidate via socket
        socketService.sendChatMessage({
          sessionId: this.sessionId,
          userId: this.userId || 'unknown',
          userName: 'WebRTC',
          message: `ICE_CANDIDATE:${JSON.stringify(event.candidate)}`,
          isTeacher: this.isTeacher,
          type: 'system'
        });
      }
    };

    // Handle connection state changes
    this.peerConnection.onconnectionstatechange = () => {
      const state = this.peerConnection?.connectionState;
      console.log('🔗 Connection state:', state);

      if (state === 'connected') {
        console.log('✅ WebRTC connection established successfully!');
      } else if (state === 'failed' || state === 'disconnected') {
        console.log('❌ WebRTC connection failed, attempting to reconnect...');
        this.reconnect();
      }
    };

    // Handle ICE connection state
    this.peerConnection.oniceconnectionstatechange = () => {
      console.log('🧊 ICE connection state:', this.peerConnection?.iceConnectionState);
    };

    console.log('✅ Peer connection created');
  }

  private setupSocketListeners(): void {
    // Handle WebRTC signaling through chat messages
    socketService.onChatMessage((message) => {
      console.log('🔍 Checking message for WebRTC:', message.userName, message.message.substring(0, 20));
      if (message.userName === 'WebRTC') {
        console.log('🔗 Processing WebRTC message');
        this.handleWebRTCMessage(message.message);
      }
    });
  }

  private async handleWebRTCMessage(message: string): Promise<void> {
    try {
      if (message.startsWith('WEBRTC_OFFER:')) {
        const offerData = message.replace('WEBRTC_OFFER:', '');
        const offer = JSON.parse(offerData);
        console.log('📨 Received WebRTC offer');
        if (!this.isTeacher) {
          await this.handleOffer(offer);
        }
      } else if (message.startsWith('WEBRTC_ANSWER:')) {
        const answerData = message.replace('WEBRTC_ANSWER:', '');
        const answer = JSON.parse(answerData);
        console.log('📨 Received WebRTC answer');
        if (this.isTeacher) {
          await this.handleAnswer(answer);
        }
      } else if (message.startsWith('ICE_CANDIDATE:')) {
        const candidateData = message.replace('ICE_CANDIDATE:', '');
        const candidate = JSON.parse(candidateData);
        console.log('🧊 Received ICE candidate');
        await this.handleIceCandidate(candidate);
      }
    } catch (error) {
      console.error('❌ Error handling WebRTC message:', error);
    }
  }

  // Teacher: Start broadcasting to students
  async startBroadcasting(): Promise<void> {
    if (!this.localStream || !this.sessionId || !this.peerConnection) {
      console.error('❌ Cannot start broadcasting - missing requirements');
      return;
    }

    console.log('📡 Teacher starting broadcast...');

    try {
      // Create and send offer to students
      const offer = await this.peerConnection.createOffer({
        offerToReceiveAudio: false,
        offerToReceiveVideo: false
      });

      await this.peerConnection.setLocalDescription(offer);

      // Send offer via socket
      socketService.sendChatMessage({
        sessionId: this.sessionId,
        userId: this.userId || 'teacher',
        userName: 'WebRTC',
        message: `WEBRTC_OFFER:${JSON.stringify(offer)}`,
        isTeacher: true,
        type: 'system'
      });

      console.log('✅ Video offer sent to students');
    } catch (error) {
      console.error('❌ Error creating video offer:', error);
    }
  }

  // Student: Handle offer from teacher
  async handleOffer(offer: RTCSessionDescriptionInit): Promise<void> {
    if (!this.peerConnection || !this.sessionId) {
      console.error('❌ Cannot handle offer - missing peer connection or session ID');
      return;
    }

    console.log('📨 🎯 STUDENT HANDLING OFFER FROM TEACHER!');
    console.log('📨 Offer type:', offer.type);
    console.log('📨 Offer SDP length:', offer.sdp?.length);

    try {
      console.log('🔗 Setting remote description (offer)...');
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      console.log('✅ Remote description set successfully');

      console.log('🔗 Creating answer...');
      const answer = await this.peerConnection.createAnswer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      });
      console.log('✅ Answer created successfully');
      console.log('📤 Answer SDP length:', answer.sdp?.length);

      console.log('🔗 Setting local description (answer)...');
      await this.peerConnection.setLocalDescription(answer);
      console.log('✅ Local description set successfully');

      // Send answer back to teacher
      console.log('📤 Sending answer to teacher...');
      socketService.sendChatMessage({
        sessionId: this.sessionId,
        userId: this.userId || 'student',
        userName: 'WebRTC',
        message: `WEBRTC_ANSWER:${JSON.stringify(answer)}`,
        isTeacher: false,
        type: 'system'
      });

      console.log('✅ 🎯 ANSWER SENT TO TEACHER - WAITING FOR CONNECTION');
    } catch (error) {
      console.error('❌ Error handling offer:', error);
      console.error('❌ Error details:', error);
    }
  }

  // Teacher: Handle answer from student
  async handleAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
    if (!this.peerConnection) {
      console.error('❌ Cannot handle answer - no peer connection');
      return;
    }

    console.log('📨 Teacher handling answer from student');
    console.log('📨 Answer SDP:', answer.sdp?.substring(0, 100) + '...');

    try {
      console.log('🔗 Setting remote description (answer)...');
      await this.peerConnection.setRemoteDescription(answer);
      console.log('✅ Answer processed successfully - WebRTC connection should be established');
    } catch (error) {
      console.error('❌ Error handling answer:', error);
    }
  }

  // Handle ICE candidate
  async handleIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    if (!this.peerConnection) return;

    try {
      await this.peerConnection.addIceCandidate(candidate);
      console.log('✅ ICE candidate added');
    } catch (error) {
      console.error('❌ Error adding ICE candidate:', error);
    }
  }

  // Reconnection logic
  private async reconnect(): Promise<void> {
    console.log('🔄 Attempting to reconnect...');

    if (this.peerConnection) {
      this.peerConnection.close();
    }

    // Wait a bit before reconnecting
    setTimeout(() => {
      this.createPeerConnection();
      if (this.isTeacher) {
        this.startBroadcasting();
      }
    }, 2000);
  }

  // Student: Request teacher's stream
  private requestTeacherStream(): void {
    if (!this.sessionId) return;

    // Send a message to teacher requesting video stream
    socketService.sendChatMessage({
      sessionId: this.sessionId,
      userId: this.userId || 'student',
      userName: 'Student',
      message: 'REQUEST_VIDEO_STREAM',
      isTeacher: false,
      type: 'system'
    });
  }

  // Get local stream (for teacher)
  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  // Get remote stream (for student)
  getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }

  // Callback for when remote stream is received
  onRemoteStreamReceived: ((stream: MediaStream) => void) | null = null;

  // Clean up
  cleanup(): void {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    this.remoteStream = null;
    this.sessionId = null;
    this.userId = null;
  }

  // Toggle video
  toggleVideo(enabled: boolean): void {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = enabled;
      }
    }
  }

  // Toggle audio
  toggleAudio(enabled: boolean): void {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = enabled;
      }
    }
  }
}

// Export singleton instance
export const webrtcService = new WebRTCService();
export default webrtcService;
