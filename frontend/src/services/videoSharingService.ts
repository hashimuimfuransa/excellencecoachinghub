import { socketService } from './socketService';

class VideoSharingService {
  private isTeacherStreaming: boolean = false;
  private teacherVideoElement: HTMLVideoElement | null = null;
  private streamingInterval: NodeJS.Timeout | null = null;
  private onVideoFrameCallback: ((frameData: string) => void) | null = null;

  // Teacher: Start sharing video frames
  startTeacherVideoSharing(videoElement: HTMLVideoElement, sessionId: string): void {
    console.log('🎥 Teacher starting video sharing...');
    
    this.teacherVideoElement = videoElement;
    this.isTeacherStreaming = true;

    // Send video frames every 100ms (10 FPS for smooth streaming)
    this.streamingInterval = setInterval(() => {
      if (this.teacherVideoElement && this.isTeacherStreaming) {
        try {
          // Create canvas to capture video frame
          const canvas = document.createElement('canvas');
          canvas.width = 640;
          canvas.height = 480;
          const ctx = canvas.getContext('2d');

          if (ctx) {
            // Draw current video frame to canvas
            ctx.drawImage(this.teacherVideoElement, 0, 0, canvas.width, canvas.height);
            
            // Add live indicator
            ctx.fillStyle = 'rgba(239, 68, 68, 0.9)';
            ctx.beginPath();
            ctx.arc(canvas.width - 30, 30, 10, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = 'white';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'right';
            ctx.fillText('LIVE', canvas.width - 50, 35);
            
            // Convert to base64 image
            const frameData = canvas.toDataURL('image/jpeg', 0.7);
            
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
    }, 100); // 10 FPS

    console.log('✅ Teacher video sharing started');
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
      ctx.fillText('Please wait while we establish the connection', canvas.width / 2, canvas.height / 2 + 40);
    }
    
    console.log('✅ Student video display created');
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
export const videoSharingService = new VideoSharingService();
export default videoSharingService;
