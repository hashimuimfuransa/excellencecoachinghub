// Simple proctoring service without complex AI models
export interface ProctoringEvent {
  type: 'tab_switch' | 'window_blur' | 'fullscreen_exit' | 'suspicious_activity' | 'camera_blocked';
  timestamp: Date;
  details?: string;
}

export interface ProctoringSession {
  sessionId: string;
  userId: string;
  examId: string;
  startTime: Date;
  endTime?: Date;
  events: ProctoringEvent[];
  isActive: boolean;
}

class ProctoringService {
  private session: ProctoringSession | null = null;
  private eventListeners: Array<() => void> = [];
  private mediaStream: MediaStream | null = null;

  // Start proctoring session
  async startSession(userId: string, examId: string): Promise<ProctoringSession> {
    try {
      // Request camera and microphone permissions
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      this.session = {
        sessionId: this.generateSessionId(),
        userId,
        examId,
        startTime: new Date(),
        events: [],
        isActive: true
      };

      // Set up event listeners
      this.setupEventListeners();

      // Enter fullscreen mode
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }

      return this.session;
    } catch (error) {
      console.error('Failed to start proctoring session:', error);
      throw new Error('Unable to start proctoring. Please ensure camera and microphone access.');
    }
  }

  // Stop proctoring session
  stopSession(): void {
    if (this.session) {
      this.session.endTime = new Date();
      this.session.isActive = false;
    }

    // Clean up event listeners
    this.removeEventListeners();

    // Stop media stream
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    // Exit fullscreen
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
  }

  // Get current session
  getCurrentSession(): ProctoringSession | null {
    return this.session;
  }

  // Add event to current session
  private addEvent(event: ProctoringEvent): void {
    if (this.session && this.session.isActive) {
      this.session.events.push(event);
      
      // Send event to backend
      this.sendEventToBackend(event);
    }
  }

  // Setup event listeners for proctoring
  private setupEventListeners(): void {
    // Tab switch detection
    const handleVisibilityChange = () => {
      if (document.hidden) {
        this.addEvent({
          type: 'tab_switch',
          timestamp: new Date(),
          details: 'User switched away from exam tab'
        });
      }
    };

    // Window blur detection
    const handleWindowBlur = () => {
      this.addEvent({
        type: 'window_blur',
        timestamp: new Date(),
        details: 'Exam window lost focus'
      });
    };

    // Fullscreen exit detection
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        this.addEvent({
          type: 'fullscreen_exit',
          timestamp: new Date(),
          details: 'User exited fullscreen mode'
        });
      }
    };

    // Right-click prevention
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      this.addEvent({
        type: 'suspicious_activity',
        timestamp: new Date(),
        details: 'Right-click attempted'
      });
    };

    // Keyboard shortcuts prevention
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent common shortcuts
      if (
        (e.ctrlKey && (e.key === 'c' || e.key === 'v' || e.key === 'a' || e.key === 't')) ||
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && e.key === 'I') ||
        e.altKey && e.key === 'Tab'
      ) {
        e.preventDefault();
        this.addEvent({
          type: 'suspicious_activity',
          timestamp: new Date(),
          details: `Blocked keyboard shortcut: ${e.key}`
        });
      }
    };

    // Add event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    // Store references for cleanup
    this.eventListeners = [
      () => document.removeEventListener('visibilitychange', handleVisibilityChange),
      () => window.removeEventListener('blur', handleWindowBlur),
      () => document.removeEventListener('fullscreenchange', handleFullscreenChange),
      () => document.removeEventListener('contextmenu', handleContextMenu),
      () => document.removeEventListener('keydown', handleKeyDown)
    ];
  }

  // Remove event listeners
  private removeEventListeners(): void {
    this.eventListeners.forEach(removeListener => removeListener());
    this.eventListeners = [];
  }

  // Send event to backend
  private async sendEventToBackend(event: ProctoringEvent): Promise<void> {
    try {
      if (!this.session) return;

      await fetch('/api/proctoring/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          sessionId: this.session.sessionId,
          event
        })
      });
    } catch (error) {
      console.error('Failed to send proctoring event:', error);
    }
  }

  // Generate unique session ID
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Check if browser supports required features
  static isSupported(): boolean {
    return !!(
      navigator.mediaDevices &&
      typeof navigator.mediaDevices.getUserMedia === 'function' &&
      document.documentElement.requestFullscreen
    );
  }

  // Get proctoring requirements
  static getRequirements(): string[] {
    return [
      'Camera access for identity verification',
      'Microphone access for audio monitoring',
      'Fullscreen mode during exam',
      'No tab switching or window changes',
      'Stable internet connection'
    ];
  }

  // Simple face detection using basic camera feed
  async performBasicFaceCheck(): Promise<boolean> {
    try {
      if (!this.mediaStream) {
        return false;
      }

      // Create a video element to capture frame
      const video = document.createElement('video');
      video.srcObject = this.mediaStream;
      video.play();

      return new Promise((resolve) => {
        video.addEventListener('loadedmetadata', () => {
          // Simple check: if video is playing and has dimensions, assume face is present
          const hasVideo = video.videoWidth > 0 && video.videoHeight > 0;
          resolve(hasVideo);
        });
      });
    } catch (error) {
      console.error('Face check failed:', error);
      return false;
    }
  }

  // Monitor camera status
  monitorCamera(): void {
    if (!this.mediaStream) return;

    const videoTrack = this.mediaStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.addEventListener('ended', () => {
        this.addEvent({
          type: 'camera_blocked',
          timestamp: new Date(),
          details: 'Camera access was blocked or disconnected'
        });
      });
    }
  }

  // Get session summary
  getSessionSummary(): {
    duration: number;
    eventCount: number;
    suspiciousEvents: number;
    riskLevel: 'low' | 'medium' | 'high';
  } | null {
    if (!this.session) return null;

    const duration = this.session.endTime 
      ? this.session.endTime.getTime() - this.session.startTime.getTime()
      : Date.now() - this.session.startTime.getTime();

    const eventCount = this.session.events.length;
    const suspiciousEvents = this.session.events.filter(
      event => event.type === 'suspicious_activity' || 
               event.type === 'tab_switch' || 
               event.type === 'fullscreen_exit'
    ).length;

    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    if (suspiciousEvents > 5) {
      riskLevel = 'high';
    } else if (suspiciousEvents > 2) {
      riskLevel = 'medium';
    }

    return {
      duration: Math.round(duration / 1000 / 60), // in minutes
      eventCount,
      suspiciousEvents,
      riskLevel
    };
  }
}

// Export singleton instance
export const proctoringService = new ProctoringService();
export default ProctoringService;
