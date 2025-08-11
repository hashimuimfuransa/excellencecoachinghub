import { socketService } from './socketService';

class SimpleVideoService {
  private isTeacherStreaming: boolean = false;
  private teacherVideoElement: HTMLVideoElement | null = null;
  private streamingInterval: NodeJS.Timeout | null = null;
  private onVideoFrameCallback: ((frameData: string) => void) | null = null;

  // Teacher: Start simple video sharing
  startTeacherVideoSharing(videoElement: HTMLVideoElement, sessionId: string): void {
    console.log('🎥 Teacher starting simple video sharing...');
    
    this.teacherVideoElement = videoElement;
    this.isTeacherStreaming = true;

    // Send video frames every 3 seconds (very conservative to avoid rate limiting)
    this.streamingInterval = setInterval(() => {
      if (this.teacherVideoElement && this.isTeacherStreaming) {
        try {
          // Create canvas to capture video frame
          const canvas = document.createElement('canvas');
          canvas.width = 320; // Smaller resolution to reduce data
          canvas.height = 240;
          const ctx = canvas.getContext('2d');

          if (ctx) {
            // Draw current video frame to canvas
            ctx.drawImage(this.teacherVideoElement, 0, 0, canvas.width, canvas.height);
            
            // Add live indicator
            ctx.fillStyle = 'rgba(239, 68, 68, 0.9)';
            ctx.beginPath();
            ctx.arc(canvas.width - 20, 20, 8, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = 'white';
            ctx.font = 'bold 10px Arial';
            ctx.textAlign = 'right';
            ctx.fillText('LIVE', canvas.width - 35, 25);
            
            // Convert to base64 image with lower quality
            const frameData = canvas.toDataURL('image/jpeg', 0.3);
            
            // Send frame to students via socket
            socketService.sendChatMessage({
              sessionId,
              userId: 'teacher-video',
              userName: 'TeacherVideo',
              message: `VIDEO_FRAME:${frameData}`,
              isTeacher: true,
              type: 'system'
            });
          }
        } catch (error) {
          console.error('❌ Error capturing video frame:', error);
        }
      }
    }, 3000); // 3 seconds interval to avoid rate limiting

    console.log('✅ Teacher simple video sharing started');
  }

  // Teacher: Stop sharing video
  stopTeacherVideoSharing(): void {
    console.log('🛑 Teacher stopping video sharing...');
    
    this.isTeacherStreaming = false;
    
    if (this.streamingInterval) {
      clearInterval(this.streamingInterval);
      this.streamingInterval = null;
    }
    
    this.teacherVideoElement = null;
    console.log('✅ Teacher video sharing stopped');
  }

  // Student: Set up to receive video frames
  onVideoFrame(callback: (frameData: string) => void): void {
    this.onVideoFrameCallback = callback;
    
    // Listen for video frames via socket
    socketService.onChatMessage((message) => {
      if (message.userName === 'TeacherVideo' && message.message.startsWith('VIDEO_FRAME:')) {
        const frameData = message.message.replace('VIDEO_FRAME:', '');
        if (this.onVideoFrameCallback) {
          this.onVideoFrameCallback(frameData);
        }
      }
    });
  }

  // Student: Create video display from received frames
  createStudentVideoDisplay(containerElement: HTMLVideoElement): void {
    console.log('📺 Creating student video display...');
    
    // Create canvas for displaying received frames
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.objectFit = 'cover';
    canvas.style.borderRadius = '8px';
    
    const ctx = canvas.getContext('2d');
    
    // Replace video element with canvas
    if (containerElement.parentNode) {
      containerElement.parentNode.replaceChild(canvas, containerElement);
    }
    
    // Set up frame receiving
    this.onVideoFrame((frameData) => {
      if (ctx) {
        const img = new Image();
        img.onload = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        };
        img.onerror = () => {
          console.log('Error loading video frame');
        };
        img.src = frameData;
      }
    });
    
    // Show initial "connecting" screen
    if (ctx) {
      ctx.fillStyle = '#059669';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = 'white';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Connecting to teacher\'s video...', canvas.width / 2, canvas.height / 2);
      
      ctx.font = '16px Arial';
      ctx.fillText('You will see the teacher\'s video shortly', canvas.width / 2, canvas.height / 2 + 40);
    }
    
    console.log('✅ Student video display created');
  }

  // Auto-connect student when teacher starts video
  autoConnectStudent(sessionId: string, canvasElement: HTMLCanvasElement): void {
    console.log('📺 Auto-connecting student to teacher video...');
    
    const ctx = canvasElement.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvasElement.width = 640;
    canvasElement.height = 480;

    // Show waiting screen
    this.showWaitingScreen(ctx, canvasElement);

    // Set up frame receiving
    this.onVideoFrame((frameData) => {
      if (ctx) {
        const img = new Image();
        img.onload = () => {
          ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
          ctx.drawImage(img, 0, 0, canvasElement.width, canvasElement.height);
        };
        img.onerror = () => {
          console.log('Error loading video frame');
        };
        img.src = frameData;
      }
    });

    console.log('✅ Student auto-connected to teacher video');
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

  // Check if teacher is currently streaming
  isStreaming(): boolean {
    return this.isTeacherStreaming;
  }

  // Cleanup
  cleanup(): void {
    this.stopTeacherVideoSharing();
    this.onVideoFrameCallback = null;
  }
}

// Export singleton instance
export const simpleVideoService = new SimpleVideoService();
export default simpleVideoService;
