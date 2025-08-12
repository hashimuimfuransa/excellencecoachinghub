import { io, Socket } from 'socket.io-client';

interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: Date;
  isTeacher: boolean;
  type: 'message' | 'system' | 'question' | 'poll';
}

interface VideoEvent {
  userId: string;
  userName: string;
}

interface AudioEvent {
  userId: string;
  userName: string;
  isAudioOn: boolean;
}

interface HandEvent {
  userId: string;
  userName: string;
  hasRaisedHand: boolean;
}

interface PermissionEvent {
  sessionId: string;
  permission: 'speak' | 'video';
}

class SocketService {
  private socket: Socket | null = null;
  private sessionId: string | null = null;

  connect(userId: string): void {
    if (this.socket?.connected) return;

    // Use dedicated socket URL or fallback to API URL without /api
    const serverUrl = process.env.REACT_APP_SOCKET_URL ||
                     (process.env.REACT_APP_API_URL || 'http://localhost:5000/api').replace('/api', '');

    console.log('🔌 Connecting to socket server:', serverUrl);

    this.socket = io(serverUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => {
      console.log('✅ Connected to server:', this.socket?.id);
      this.socket?.emit('user:join', userId);
      console.log('📡 Joined user room:', userId);
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Disconnected from server');
    });

    this.socket.on('connect_error', (error) => {
      console.error('🔥 Connection error:', error);
    });

    this.socket.on('reconnect', () => {
      console.log('🔄 Reconnected to server');
      this.socket?.emit('user:join', userId);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.sessionId = null;
    }
  }

  // Session management
  joinSession(sessionId: string, userId: string): void {
    if (!this.socket) {
      console.error('❌ Socket not connected, cannot join session');
      return;
    }

    this.sessionId = sessionId;
    console.log('🏠 Joining session:', sessionId, 'as user:', userId);
    this.socket.emit('session:join', sessionId, userId);
  }

  leaveSession(sessionId: string, userId: string): void {
    if (!this.socket) return;
    
    this.socket.emit('session:leave', sessionId, userId);
    this.sessionId = null;
  }

  // Chat functionality
  sendChatMessage(data: {
    sessionId: string;
    userId: string;
    userName: string;
    message: string;
    isTeacher: boolean;
    type?: 'message' | 'system' | 'question' | 'poll';
  }): void {
    if (!this.socket) {
      console.error('❌ Socket not connected, cannot send message');
      return;
    }

    console.log('💬 Sending chat message:', data);
    this.socket.emit('session:chat', {
      ...data,
      type: data.type || 'message'
    });
  }

  onChatMessage(callback: (message: ChatMessage) => void): void {
    if (!this.socket) return;

    console.log('👂 Setting up chat message listener');
    this.socket.on('chat:message', (message) => {
      console.log('📨 Received chat message:', message);

      // Ensure timestamp is a Date object
      const processedMessage = {
        ...message,
        timestamp: new Date(message.timestamp)
      };

      callback(processedMessage);
    });
  }

  // Video functionality
  startVideo(sessionId: string, userId: string, userName: string): void {
    if (!this.socket) return;

    console.log('📹 Starting video for:', userName);
    this.socket.emit('session:video-start', sessionId, userId, userName);
  }

  stopVideo(sessionId: string, userId: string, userName: string): void {
    if (!this.socket) return;

    console.log('📹 Stopping video for:', userName);
    this.socket.emit('session:video-stop', sessionId, userId, userName);
  }

  // Video stream sharing (for WebRTC signaling)
  sendVideoOffer(sessionId: string, targetUserId: string, offer: RTCSessionDescriptionInit): void {
    if (!this.socket) return;

    console.log('📡 Sending video offer to:', targetUserId);
    this.socket.emit('video:offer', { sessionId, targetUserId, offer });
  }

  sendVideoAnswer(sessionId: string, targetUserId: string, answer: RTCSessionDescriptionInit): void {
    if (!this.socket) return;

    console.log('📡 Sending video answer to:', targetUserId);
    this.socket.emit('video:answer', { sessionId, targetUserId, answer });
  }

  sendIceCandidate(sessionId: string, targetUserId: string, candidate: RTCIceCandidateInit): void {
    if (!this.socket) return;

    this.socket.emit('video:ice-candidate', { sessionId, targetUserId, candidate });
  }

  // Video stream events
  onVideoOffer(callback: (data: { fromUserId: string; offer: RTCSessionDescriptionInit }) => void): void {
    if (!this.socket) return;

    this.socket.on('video:offer', callback);
  }

  onVideoAnswer(callback: (data: { fromUserId: string; answer: RTCSessionDescriptionInit }) => void): void {
    if (!this.socket) return;

    this.socket.on('video:answer', callback);
  }

  onIceCandidate(callback: (data: { fromUserId: string; candidate: RTCIceCandidateInit }) => void): void {
    if (!this.socket) return;

    this.socket.on('video:ice-candidate', callback);
  }

  onVideoStarted(callback: (data: VideoEvent) => void): void {
    if (!this.socket) return;
    
    this.socket.on('video:started', callback);
  }

  onVideoStopped(callback: (data: VideoEvent) => void): void {
    if (!this.socket) return;

    this.socket.on('video:stopped', callback);
  }

  // Teacher video availability
  onTeacherVideoAvailable(callback: (data: { teacherId: string; teacherName: string; message: string }) => void): void {
    if (!this.socket) return;

    console.log('👂 Setting up teacher video availability listener');
    this.socket.on('teacher:video-available', callback);
  }

  // Video frame streaming
  sendVideoFrame(sessionId: string, teacherId: string, frameData: string): void {
    if (!this.socket) return;

    this.socket.emit('video:frame', {
      sessionId,
      teacherId,
      frameData,
      timestamp: Date.now()
    });
  }

  onVideoFrame(callback: (data: { teacherId: string; frameData: string; timestamp: number }) => void): void {
    if (!this.socket) return;

    this.socket.on('video:frame', callback);
  }

  // Audio streaming
  sendAudioChunk(sessionId: string, teacherId: string, audioData: string): void {
    if (!this.socket) return;

    this.socket.emit('audio:chunk', {
      sessionId,
      teacherId,
      audioData,
      timestamp: Date.now()
    });
  }

  onAudioChunk(callback: (data: { teacherId: string; audioData: string; timestamp: number }) => void): void {
    if (!this.socket) return;

    this.socket.on('audio:chunk', callback);
  }

  // Audio functionality
  toggleAudio(sessionId: string, userId: string, userName: string, isAudioOn: boolean): void {
    if (!this.socket) return;
    
    this.socket.emit('session:audio-toggle', sessionId, userId, userName, isAudioOn);
  }

  onAudioToggled(callback: (data: AudioEvent) => void): void {
    if (!this.socket) return;
    
    this.socket.on('audio:toggled', callback);
  }

  // Hand raise functionality
  toggleHand(sessionId: string, userId: string, userName: string, hasRaisedHand: boolean): void {
    if (!this.socket) return;
    
    this.socket.emit('session:hand-toggle', sessionId, userId, userName, hasRaisedHand);
  }

  onHandToggled(callback: (data: HandEvent) => void): void {
    if (!this.socket) return;
    
    this.socket.on('hand:toggled', callback);
  }

  // Permission events (for students)
  onPermissionGranted(callback: (data: PermissionEvent) => void): void {
    if (!this.socket) return;
    
    this.socket.on('permission:granted', callback);
  }

  onPermissionRevoked(callback: (data: PermissionEvent) => void): void {
    if (!this.socket) return;
    
    this.socket.on('permission:revoked', callback);
  }

  // User events
  onUserJoined(callback: (userId: string) => void): void {
    if (!this.socket) return;
    
    this.socket.on('user:joined', callback);
  }

  onUserLeft(callback: (userId: string) => void): void {
    if (!this.socket) return;
    
    this.socket.on('user:left', callback);
  }

  // Session status
  onSessionStatusChanged(callback: (data: { status: string }) => void): void {
    if (!this.socket) return;
    
    this.socket.on('session:status-changed', callback);
  }

  // Clean up event listeners
  removeAllListeners(): void {
    if (!this.socket) return;
    
    this.socket.removeAllListeners();
  }

  // Get connection status
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getCurrentSessionId(): string | null {
    return this.sessionId;
  }
}

// Export singleton instance
export const socketService = new SocketService();
export default socketService;
