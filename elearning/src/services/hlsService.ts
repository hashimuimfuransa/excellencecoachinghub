import axios from 'axios';

class HLSService {
  private mediaRecorder: MediaRecorder | null = null;
  private isStreaming: boolean = false;
  private streamingInterval: NodeJS.Timeout | null = null;
  private sessionId: string | null = null;
  private teacherId: string | null = null;

  // Teacher: Start HLS streaming
  async startTeacherStream(sessionId: string, teacherId: string, videoElement: HTMLVideoElement): Promise<void> {
    try {
      console.log('🎥 Starting HLS stream for teacher...');

      this.sessionId = sessionId;
      this.teacherId = teacherId;

      // Start stream on server
      await axios.post(`/api/live-stream/start/${sessionId}`, {
        teacherId
      });

      // Get video stream from video element
      const stream = videoElement.srcObject as MediaStream;
      if (!stream) {
        throw new Error('No video stream available');
      }

      // Create MediaRecorder for capturing video chunks
      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp8,opus'
      });

      // Handle data available (video chunks)
      this.mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0 && this.isStreaming) {
          try {
            // Convert blob to base64
            const reader = new FileReader();
            reader.onloadend = async () => {
              const base64data = reader.result as string;
              
              // Send chunk to server
              await axios.post(`/api/live-stream/chunk/${sessionId}`, {
                chunk: base64data,
                timestamp: Date.now()
              });
            };
            reader.readAsDataURL(event.data);
          } catch (error) {
            console.error('❌ Error sending video chunk:', error);
          }
        }
      };

      // Start recording with longer intervals to avoid rate limiting
      this.isStreaming = true;
      this.mediaRecorder.start(2000); // Capture chunks every 2 seconds

      console.log('✅ HLS streaming started successfully');

    } catch (error) {
      console.error('❌ Failed to start HLS stream:', error);
      throw error;
    }
  }

  // Teacher: Stop streaming
  async stopTeacherStream(): Promise<void> {
    try {
      console.log('🛑 Stopping HLS stream...');

      this.isStreaming = false;

      if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.stop();
      }

      if (this.streamingInterval) {
        clearInterval(this.streamingInterval);
        this.streamingInterval = null;
      }

      // Stop stream on server
      if (this.sessionId) {
        await axios.post(`/api/live-stream/stop/${this.sessionId}`);
      }

      this.mediaRecorder = null;
      this.sessionId = null;
      this.teacherId = null;

      console.log('✅ HLS streaming stopped');

    } catch (error) {
      console.error('❌ Error stopping HLS stream:', error);
    }
  }

  // Student: Start receiving stream
  async startStudentStream(sessionId: string, canvasElement: HTMLCanvasElement): Promise<void> {
    try {
      console.log('📺 Starting HLS stream reception for student...');

      const ctx = canvasElement.getContext('2d');
      if (!ctx) {
        throw new Error('Cannot get canvas context');
      }

      // Set canvas size
      canvasElement.width = 640;
      canvasElement.height = 480;

      // Show initial loading screen
      this.showLoadingScreen(ctx, canvasElement);

      // Poll for stream data
      const pollInterval = setInterval(async () => {
        try {
          const response = await axios.get(`/api/live-stream/data/${sessionId}`);
          
          if (response.data.success && response.data.chunks.length > 0) {
            // Get the latest chunk
            const latestChunk = response.data.chunks[response.data.chunks.length - 1];
            
            if (latestChunk && latestChunk.data) {
              // Create image from chunk data
              const img = new Image();
              img.onload = () => {
                if (ctx) {
                  ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
                  ctx.drawImage(img, 0, 0, canvasElement.width, canvasElement.height);
                  
                  // Add live indicator
                  this.addLiveIndicator(ctx, canvasElement);
                }
              };
              img.src = latestChunk.data;
            }
          } else {
            // Show waiting screen if no data
            this.showWaitingScreen(ctx, canvasElement);
          }

        } catch (error) {
          console.error('❌ Error polling stream data:', error);
          this.showErrorScreen(ctx, canvasElement);
        }
      }, 1000); // Poll every 1 second to avoid rate limiting

      // Store interval for cleanup
      this.streamingInterval = pollInterval;

      console.log('✅ Student stream reception started');

    } catch (error) {
      console.error('❌ Failed to start student stream:', error);
      throw error;
    }
  }

  // Student: Stop receiving stream
  stopStudentStream(): void {
    if (this.streamingInterval) {
      clearInterval(this.streamingInterval);
      this.streamingInterval = null;
    }
    console.log('✅ Student stream reception stopped');
  }

  // Helper: Show loading screen
  private showLoadingScreen(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void {
    ctx.fillStyle = '#1e40af';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = 'white';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Loading teacher\'s video...', canvas.width / 2, canvas.height / 2);
    
    ctx.font = '16px Arial';
    ctx.fillText('Please wait while we connect to the live stream', canvas.width / 2, canvas.height / 2 + 40);
  }

  // Helper: Show waiting screen
  private showWaitingScreen(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void {
    ctx.fillStyle = '#059669';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = 'white';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Waiting for teacher...', canvas.width / 2, canvas.height / 2);
    
    ctx.font = '16px Arial';
    ctx.fillText('The teacher will start their video shortly', canvas.width / 2, canvas.height / 2 + 40);
  }

  // Helper: Show error screen
  private showErrorScreen(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void {
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = 'white';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Connection Error', canvas.width / 2, canvas.height / 2);
    
    ctx.font = '16px Arial';
    ctx.fillText('Unable to connect to the live stream', canvas.width / 2, canvas.height / 2 + 40);
  }

  // Helper: Add live indicator
  private addLiveIndicator(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void {
    // Live indicator
    ctx.fillStyle = 'rgba(239, 68, 68, 0.9)';
    ctx.beginPath();
    ctx.arc(canvas.width - 30, 30, 12, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = 'white';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'right';
    ctx.fillText('LIVE', canvas.width - 50, 35);
  }

  // Get stream info
  async getStreamInfo(sessionId: string): Promise<any> {
    try {
      const response = await axios.get(`/api/live-stream/info/${sessionId}`);
      return response.data;
    } catch (error) {
      console.error('❌ Error getting stream info:', error);
      return { isActive: false, viewers: 0 };
    }
  }

  // Check if currently streaming
  isCurrentlyStreaming(): boolean {
    return this.isStreaming;
  }

  // Cleanup
  cleanup(): void {
    this.stopTeacherStream();
    this.stopStudentStream();
  }
}

// Export singleton instance
export const hlsService = new HLSService();
export default hlsService;
