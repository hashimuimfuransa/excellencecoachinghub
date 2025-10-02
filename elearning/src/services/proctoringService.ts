import axios from 'axios';
import { apiService } from './apiService';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

interface ProctoringSession {
  _id: string;
  assessmentId: string;
  studentId: string;
  startTime: Date;
  endTime?: Date;
  status: 'active' | 'completed' | 'flagged' | 'terminated';
  violations: ProctoringViolation[];
  screenRecording?: string;
  webcamRecording?: string;
  keystrokeLog?: string;
  browserEvents: BrowserEvent[];
}

interface ProctoringViolation {
  type: 'tab_switch' | 'window_blur' | 'copy_paste' | 'multiple_faces' | 'no_face' | 'suspicious_movement' | 'external_device';
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  evidence?: string; // Screenshot or other evidence
  aiConfidence?: number;
}

interface BrowserEvent {
  type: 'focus' | 'blur' | 'visibility_change' | 'beforeunload' | 'keydown' | 'paste' | 'copy';
  timestamp: Date;
  details?: any;
}

interface ProctoringSettings {
  enableWebcam: boolean;
  enableScreenRecording: boolean;
  enableKeystrokeLogging: boolean;
  enableTabSwitchDetection: boolean;
  enableCopyPasteDetection: boolean;
  enableFaceDetection: boolean;
  enableAIMonitoring: boolean;
  allowedTabSwitches: number;
  warningThreshold: number;
  terminationThreshold: number;
  recordingQuality: 'low' | 'medium' | 'high';
}

interface ProctoringReport {
  sessionId: string;
  studentName: string;
  assessmentTitle: string;
  duration: number;
  totalViolations: number;
  violationsByType: Record<string, number>;
  riskScore: number;
  recommendation: 'accept' | 'review' | 'reject';
  timeline: Array<{
    timestamp: Date;
    event: string;
    severity: string;
  }>;
}

class ProctoringService {
  private mediaRecorder: MediaRecorder | null = null;
  private webcamStream: MediaStream | null = null;
  private screenStream: MediaStream | null = null;
  private currentSession: ProctoringSession | null = null;
  private violationCount = 0;
  private eventListeners: Array<() => void> = [];

  // Start proctoring session
  async startSession(assessmentId: string, settings: ProctoringSettings): Promise<ProctoringSession> {
    try {
      // Create proctoring session
      const response = await api.post('/proctoring/start', {
        assessmentId,
        settings
      });
      
      this.currentSession = response.data.data;
      
      // Initialize monitoring
      await this.initializeMonitoring(settings);
      
      if (!this.currentSession) {
        throw new Error('Failed to create proctoring session');
      }
      
      return this.currentSession;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to start proctoring session');
    }
  }

  // End proctoring session
  async endSession(): Promise<void> {
    try {
      if (!this.currentSession) return;

      // Stop all monitoring
      this.stopMonitoring();

      // End session on server
      await api.post(`/proctoring/end/${this.currentSession._id}`);
      
      this.currentSession = null;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to end proctoring session');
    }
  }

  // Initialize monitoring systems
  private async initializeMonitoring(settings: ProctoringSettings): Promise<void> {
    try {
      // Setup webcam monitoring
      if (settings.enableWebcam) {
        await this.setupWebcamMonitoring();
      }

      // Setup screen recording
      if (settings.enableScreenRecording) {
        await this.setupScreenRecording();
      }

      // Setup browser event monitoring
      this.setupBrowserEventMonitoring(settings);

      // Setup AI monitoring
      if (settings.enableAIMonitoring) {
        this.setupAIMonitoring();
      }

    } catch (error) {
      console.error('Failed to initialize monitoring:', error);
      throw error;
    }
  }

  // Analyze frame for AI cheating detection
  async analyzeFrame(frameBlob: Blob): Promise<{ violations: Array<{ type: string; confidence: number; description: string }> }> {
    try {
      const formData = new FormData();
      formData.append('frame', frameBlob);
      formData.append('sessionId', this.currentSession?._id || '');

      const response = await api.post('/proctoring/analyze-frame', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data.data;
    } catch (error: any) {
      console.error('Frame analysis failed:', error);
      return { violations: [] };
    }
  }

  // Log proctoring event
  async logEvent(event: { type: string; assessmentId: string; timestamp: Date; data?: any }): Promise<void> {
    try {
      await api.post('/proctoring/log-event', event);
    } catch (error) {
      console.error('Failed to log proctoring event:', error);
    }
  }

  // Report violation
  async reportViolation(violation: Omit<ProctoringViolation, 'timestamp'>): Promise<void> {
    try {
      if (!this.currentSession) return;

      const violationData = {
        ...violation,
        timestamp: new Date(),
        sessionId: this.currentSession._id
      };

      await api.post('/proctoring/report-violation', violationData);
      this.violationCount++;
    } catch (error) {
      console.error('Failed to report violation:', error);
    }
  }

  // Setup webcam monitoring
  private async setupWebcamMonitoring(): Promise<void> {
    try {
      this.webcamStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: true
      });
    } catch (error) {
      throw new Error('Webcam access denied. Camera is required for this proctored assessment.');
    }
  }

  // Setup screen recording
  private async setupScreenRecording(): Promise<void> {
    try {
      // @ts-ignore - getDisplayMedia is supported in modern browsers
      this.screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });
    } catch (error) {
      console.warn('Screen recording not available:', error);
    }
  }

  // Setup browser event monitoring
  private setupBrowserEventMonitoring(settings: ProctoringSettings): void {
    // Tab switch detection
    if (settings.enableTabSwitchDetection) {
      const handleVisibilityChange = () => {
        if (document.hidden) {
          this.reportViolation({
            type: 'tab_switch',
            severity: 'medium',
            description: 'Student switched tabs or minimized window'
          });
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);
      this.eventListeners.push(() => document.removeEventListener('visibilitychange', handleVisibilityChange));
    }

    // Copy/paste detection
    if (settings.enableCopyPasteDetection) {
      const handleCopy = () => {
        this.reportViolation({
          type: 'copy_paste',
          severity: 'low',
          description: 'Student attempted to copy content'
        });
      };

      const handlePaste = () => {
        this.reportViolation({
          type: 'copy_paste',
          severity: 'medium',
          description: 'Student attempted to paste content'
        });
      };

      document.addEventListener('copy', handleCopy);
      document.addEventListener('paste', handlePaste);
      
      this.eventListeners.push(() => {
        document.removeEventListener('copy', handleCopy);
        document.removeEventListener('paste', handlePaste);
      });
    }

    // Keyboard monitoring
    if (settings.enableKeystrokeLogging) {
      const handleKeyDown = (event: KeyboardEvent) => {
        // Log suspicious key combinations
        if (event.ctrlKey || event.altKey || event.metaKey) {
          this.reportViolation({
            type: 'suspicious_movement',
            severity: 'low',
            description: `Suspicious key combination: ${event.key}`
          });
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      this.eventListeners.push(() => document.removeEventListener('keydown', handleKeyDown));
    }
  }

  // Setup AI monitoring
  private setupAIMonitoring(): void {
    // This would integrate with AI services for behavior analysis
    // For now, we'll implement basic monitoring
    setInterval(() => {
      if (this.webcamStream) {
        // Capture frame and analyze (implementation would depend on AI service)
        this.captureAndAnalyzeFrame();
      }
    }, 10000); // Analyze every 10 seconds
  }

  // Capture and analyze frame
  private async captureAndAnalyzeFrame(): Promise<void> {
    try {
      if (!this.webcamStream) return;

      const video = document.createElement('video');
      video.srcObject = this.webcamStream;
      video.play();

      video.addEventListener('loadedmetadata', async () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0);
          
          canvas.toBlob(async (blob) => {
            if (blob) {
              const analysis = await this.analyzeFrame(blob);
              // Handle analysis results
              if (analysis.violations.length > 0) {
                analysis.violations.forEach(violation => {
                  this.reportViolation({
                    type: violation.type as 'tab_switch' | 'window_blur' | 'copy_paste' | 'multiple_faces' | 'no_face' | 'suspicious_movement' | 'external_device',
                    severity: violation.confidence > 0.8 ? 'high' : violation.confidence > 0.5 ? 'medium' : 'low',
                    description: violation.description,
                    aiConfidence: violation.confidence
                  });
                });
              }
            }
          }, 'image/jpeg', 0.8);
        }
      });
    } catch (error) {
      console.error('Frame capture failed:', error);
    }
  }

  // Stop all monitoring
  private stopMonitoring(): void {
    // Stop media streams
    if (this.webcamStream) {
      this.webcamStream.getTracks().forEach(track => track.stop());
      this.webcamStream = null;
    }

    if (this.screenStream) {
      this.screenStream.getTracks().forEach(track => track.stop());
      this.screenStream = null;
    }

    // Remove event listeners
    this.eventListeners.forEach(removeListener => removeListener());
    this.eventListeners = [];

    // Stop media recorder
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
  }

  // Get current session
  getCurrentSession(): ProctoringSession | null {
    return this.currentSession;
  }

  // Get violation count
  getViolationCount(): number {
    return this.violationCount;
  }

  // Admin methods
  async getActiveSessions(): Promise<ProctoringSession[]> {
    try {
      const response = await api.get('/proctoring/active-sessions');
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch active sessions');
    }
  }

  async getSessionReport(sessionId: string): Promise<ProctoringReport> {
    try {
      const response = await api.get(`/proctoring/report/${sessionId}`);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch session report');
    }
  }

  async getAllSessions(filters?: { assessmentId?: string; studentId?: string; status?: string }): Promise<ProctoringSession[]> {
    try {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value) params.append(key, value);
        });
      }

      const response = await api.get(`/proctoring/sessions?${params.toString()}`);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch proctoring sessions');
    }
  }

  async flagSession(sessionId: string, reason: string): Promise<void> {
    try {
      await api.post(`/proctoring/flag/${sessionId}`, { reason });
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to flag session');
    }
  }

  async terminateSession(sessionId: string, reason: string): Promise<void> {
    try {
      await api.post(`/proctoring/terminate/${sessionId}`, { reason });
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to terminate session');
    }
  }
}

// Export singleton instance
export const proctoringService = new ProctoringService();
export default proctoringService;

// Export types
export type {
  ProctoringSession,
  ProctoringViolation,
  BrowserEvent,
  ProctoringSettings,
  ProctoringReport
};