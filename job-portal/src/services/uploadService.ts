import { api } from './api';

export interface UploadResponse {
  success: boolean;
  data: {
    url: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
  };
}

class UploadService {
  async uploadFile(file: File, type: 'avatar' | 'post' | 'chat' = 'post'): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    try {
      const response = await api.post<UploadResponse>('/upload/media', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        // You can add upload progress tracking here if needed
        onUploadProgress: (progressEvent) => {
          const progress = progressEvent.total
            ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
            : 0;
          console.log(`Upload progress: ${progress}%`);
        },
      });

      return response.data;
    } catch (error) {
      console.error('Upload failed:', error);
      throw error;
    }
  }

  async uploadMultipleFiles(files: File[], type: 'post' | 'chat' = 'post'): Promise<UploadResponse[]> {
    const uploadPromises = files.map(file => this.uploadFile(file, type));
    return Promise.all(uploadPromises);
  }

  // Helper method to validate file before upload
  validateFile(file: File, type: 'image' | 'video'): { valid: boolean; error?: string } {
    const maxImageSize = 5 * 1024 * 1024; // 5MB
    const maxVideoSize = 50 * 1024 * 1024; // 50MB
    
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov'];

    if (type === 'image') {
      if (!allowedImageTypes.includes(file.type)) {
        return { valid: false, error: 'Invalid image format. Supported formats: JPEG, PNG, GIF, WebP' };
      }
      if (file.size > maxImageSize) {
        return { valid: false, error: 'Image size must be less than 5MB' };
      }
    } else if (type === 'video') {
      if (!allowedVideoTypes.includes(file.type)) {
        return { valid: false, error: 'Invalid video format. Supported formats: MP4, WebM, OGG, AVI, MOV' };
      }
      if (file.size > maxVideoSize) {
        return { valid: false, error: 'Video size must be less than 50MB' };
      }
    }

    return { valid: true };
  }

  // Helper method to create file preview
  createPreviewUrl(file: File): string {
    return URL.createObjectURL(file);
  }

  // Helper method to cleanup preview URLs
  revokePreviewUrl(url: string): void {
    if (url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
  }

  // Helper method to generate video thumbnail
  async generateVideoThumbnail(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      video.onloadeddata = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        video.currentTime = Math.min(1, video.duration / 2); // Capture frame at 1 second or middle
      };

      video.onseeked = () => {
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const thumbnail = canvas.toDataURL('image/jpeg', 0.7);
          resolve(thumbnail);
        } else {
          reject(new Error('Canvas context not available'));
        }
        
        // Cleanup
        URL.revokeObjectURL(video.src);
      };

      video.onerror = () => {
        reject(new Error('Failed to generate thumbnail'));
        URL.revokeObjectURL(video.src);
      };

      video.src = URL.createObjectURL(file);
      video.load();
    });
  }
}

export const uploadService = new UploadService();
export default uploadService;