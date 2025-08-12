import { socketService } from './socketService';

class VideoStreamService {
  private localStream: MediaStream | null = null;
  private isStreaming: boolean = false;
  private streamInterval: NodeJS.Timeout | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private context: CanvasRenderingContext2D | null = null;
  private mediaRecorder: MediaRecorder | null = null;

  // Initialize video streaming for teacher with better quality
  async startTeacherStream(sessionId: string, teacherId: string): Promise<void> {
    try {
      console.log('🎥 Starting teacher video stream...');

      // Get teacher's camera and microphone
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 30 } // Higher frame rate for smoother video
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } as MediaTrackConstraints
      });

      // Create canvas for video processing
      this.canvas = document.createElement('canvas');
      this.canvas.width = 640;
      this.canvas.height = 480;
      this.context = this.canvas.getContext('2d');

      if (!this.context) {
        throw new Error('Could not get canvas context');
      }

      // Create video element to capture frames
      const video = document.createElement('video');
      video.srcObject = this.localStream;
      video.play();

      video.onloadedmetadata = () => {
        this.isStreaming = true;

        // Use MediaRecorder for smoother video streaming
        try {
          if (!this.localStream) {
            throw new Error('No local stream available');
          }

          this.mediaRecorder = new MediaRecorder(this.localStream, {
            mimeType: 'video/webm;codecs=vp8',
            videoBitsPerSecond: 1000000 // 1 Mbps for good quality
          });

          this.mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
              // Convert blob to base64
              const reader = new FileReader();
              reader.onloadend = () => {
                const base64data = reader.result as string;
                socketService.sendVideoFrame(sessionId, teacherId, base64data);
              };
              reader.readAsDataURL(event.data);
            }
          };

          // Start recording in small chunks for real-time streaming
          this.mediaRecorder.start(100); // 100ms chunks for smooth streaming

          console.log('✅ MediaRecorder started for smooth video streaming');
        } catch (error) {
          console.log('MediaRecorder not supported, falling back to canvas method');

          // Fallback to canvas method with optimized frame rate
          let lastFrameTime = 0;
          const targetFPS = 25; // 25 FPS for smooth video
          const frameInterval = 1000 / targetFPS;

          const streamFrames = (currentTime: number) => {
            if (this.context && this.canvas && video.readyState === video.HAVE_ENOUGH_DATA && this.isStreaming) {
              // Only send frame if enough time has passed
              if (currentTime - lastFrameTime >= frameInterval) {
                // Draw video frame to canvas
                this.context.drawImage(video, 0, 0, this.canvas.width, this.canvas.height);

                // Convert canvas to base64 image with optimized quality
                const imageData = this.canvas.toDataURL('image/jpeg', 0.85);

                // Send frame to students via Socket.IO
                socketService.sendVideoFrame(sessionId, teacherId, imageData);

                lastFrameTime = currentTime;
              }
            }

            // Use requestAnimationFrame for smooth streaming
            if (this.isStreaming) {
              requestAnimationFrame(streamFrames);
            }
          };

          // Start the streaming loop
          requestAnimationFrame(streamFrames);
        }

        console.log('✅ Teacher video stream started successfully');
      };

    } catch (error) {
      console.error('❌ Failed to start teacher video stream:', error);
      throw error;
    }
  }

  // Stop teacher video streaming
  stopTeacherStream(): void {
    console.log('🛑 Stopping teacher video stream...');

    this.isStreaming = false;

    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
      this.mediaRecorder = null;
    }

    if (this.streamInterval) {
      clearInterval(this.streamInterval);
      this.streamInterval = null;
    }

    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    this.canvas = null;
    this.context = null;

    console.log('✅ Teacher video stream stopped');
  }

  // For students: Set up listener for video frames
  onVideoFrame(callback: (data: { teacherId: string; frameData: string; timestamp: number }) => void): void {
    socketService.onVideoFrame(callback);
  }

  // Get local stream (for teacher's own video display)
  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  // Check if currently streaming
  isCurrentlyStreaming(): boolean {
    return this.isStreaming;
  }
}

// Export singleton instance
export const videoStreamService = new VideoStreamService();
export default videoStreamService;
