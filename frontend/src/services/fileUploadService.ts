import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
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

export interface UploadResult {
  filename: string;
  originalName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: Date;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

class FileUploadService {
  // Upload assignment file
  async uploadAssignmentFile(
    file: File, 
    courseId: string, 
    assignmentId: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('courseId', courseId);
      formData.append('assignmentId', assignmentId);

      const response = await api.post('/uploads/assignment', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress: UploadProgress = {
              loaded: progressEvent.loaded,
              total: progressEvent.total,
              percentage: Math.round((progressEvent.loaded * 100) / progressEvent.total)
            };
            onProgress(progress);
          }
        }
      });

      return response.data.data;
    } catch (error: any) {
      console.error('Failed to upload assignment file:', error);
      throw new Error(error.response?.data?.message || 'Failed to upload file');
    }
  }

  // Upload course material
  async uploadCourseMaterial(
    file: File, 
    courseId: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('courseId', courseId);

      const response = await api.post('/uploads/course-material', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress: UploadProgress = {
              loaded: progressEvent.loaded,
              total: progressEvent.total,
              percentage: Math.round((progressEvent.loaded * 100) / progressEvent.total)
            };
            onProgress(progress);
          }
        }
      });

      return response.data.data;
    } catch (error: any) {
      console.error('Failed to upload course material:', error);
      throw new Error(error.response?.data?.message || 'Failed to upload file');
    }
  }

  // Upload profile avatar
  async uploadAvatar(
    file: File,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult> {
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await api.post('/uploads/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress: UploadProgress = {
              loaded: progressEvent.loaded,
              total: progressEvent.total,
              percentage: Math.round((progressEvent.loaded * 100) / progressEvent.total)
            };
            onProgress(progress);
          }
        }
      });

      return response.data.data;
    } catch (error: any) {
      console.error('Failed to upload avatar:', error);
      throw new Error(error.response?.data?.message || 'Failed to upload avatar');
    }
  }

  // Upload course thumbnail
  async uploadCourseThumbnail(
    file: File, 
    courseId: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult> {
    try {
      const formData = new FormData();
      formData.append('thumbnail', file);
      formData.append('courseId', courseId);

      const response = await api.post('/uploads/course-thumbnail', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress: UploadProgress = {
              loaded: progressEvent.loaded,
              total: progressEvent.total,
              percentage: Math.round((progressEvent.loaded * 100) / progressEvent.total)
            };
            onProgress(progress);
          }
        }
      });

      return response.data.data;
    } catch (error: any) {
      console.error('Failed to upload course thumbnail:', error);
      throw new Error(error.response?.data?.message || 'Failed to upload thumbnail');
    }
  }

  // Upload announcement attachment
  async uploadAnnouncementAttachment(
    file: File, 
    courseId: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('courseId', courseId);

      const response = await api.post('/uploads/announcement-attachment', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress: UploadProgress = {
              loaded: progressEvent.loaded,
              total: progressEvent.total,
              percentage: Math.round((progressEvent.loaded * 100) / progressEvent.total)
            };
            onProgress(progress);
          }
        }
      });

      return response.data.data;
    } catch (error: any) {
      console.error('Failed to upload announcement attachment:', error);
      throw new Error(error.response?.data?.message || 'Failed to upload attachment');
    }
  }

  // Upload multiple files
  async uploadMultipleFiles(
    files: File[], 
    uploadType: 'assignment' | 'course-material' | 'announcement',
    courseId: string,
    assignmentId?: string,
    onProgress?: (fileIndex: number, progress: UploadProgress) => void
  ): Promise<UploadResult[]> {
    try {
      const results: UploadResult[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        let result: UploadResult;

        const progressCallback = onProgress ? (progress: UploadProgress) => onProgress(i, progress) : undefined;

        switch (uploadType) {
          case 'assignment':
            if (!assignmentId) throw new Error('Assignment ID required for assignment uploads');
            result = await this.uploadAssignmentFile(file, courseId, assignmentId, progressCallback);
            break;
          case 'course-material':
            result = await this.uploadCourseMaterial(file, courseId, progressCallback);
            break;
          case 'announcement':
            result = await this.uploadAnnouncementAttachment(file, courseId, progressCallback);
            break;
          default:
            throw new Error('Invalid upload type');
        }

        results.push(result);
      }

      return results;
    } catch (error: any) {
      console.error('Failed to upload multiple files:', error);
      throw new Error(error.message || 'Failed to upload files');
    }
  }

  // Download file
  async downloadFile(fileUrl: string): Promise<Blob> {
    try {
      const response = await api.get(fileUrl, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error: any) {
      console.error('Failed to download file:', error);
      throw new Error(error.response?.data?.message || 'Failed to download file');
    }
  }

  // Delete file
  async deleteFile(fileUrl: string): Promise<void> {
    try {
      await api.delete('/uploads/file', {
        data: { fileUrl }
      });
    } catch (error: any) {
      console.error('Failed to delete file:', error);
      throw new Error(error.response?.data?.message || 'Failed to delete file');
    }
  }

  // Get file info
  async getFileInfo(fileUrl: string): Promise<any> {
    try {
      const response = await api.get('/uploads/file-info', {
        params: { fileUrl }
      });
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to get file info:', error);
      throw new Error(error.response?.data?.message || 'Failed to get file info');
    }
  }

  // Validate file before upload
  validateFile(file: File, options: {
    maxSize?: number; // in bytes
    allowedTypes?: string[];
    allowedExtensions?: string[];
  }): { isValid: boolean; error?: string } {
    const { maxSize, allowedTypes, allowedExtensions } = options;

    // Check file size
    if (maxSize && file.size > maxSize) {
      return {
        isValid: false,
        error: `File size exceeds maximum allowed size of ${(maxSize / 1024 / 1024).toFixed(2)} MB`
      };
    }

    // Check file type
    if (allowedTypes && !allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: `File type ${file.type} is not allowed. Allowed types: ${allowedTypes.join(', ')}`
      };
    }

    // Check file extension
    if (allowedExtensions) {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
        return {
          isValid: false,
          error: `File extension .${fileExtension} is not allowed. Allowed extensions: ${allowedExtensions.join(', ')}`
        };
      }
    }

    return { isValid: true };
  }

  // Get upload limits
  async getUploadLimits(): Promise<any> {
    try {
      const response = await api.get('/uploads/limits');
      return response.data.data || {
        maxFileSize: 10 * 1024 * 1024, // 10MB default
        allowedTypes: ['image/*', 'application/pdf', 'text/*'],
        maxFilesPerUpload: 5
      };
    } catch (error: any) {
      console.error('Failed to get upload limits:', error);
      return {
        maxFileSize: 10 * 1024 * 1024, // 10MB default
        allowedTypes: ['image/*', 'application/pdf', 'text/*'],
        maxFilesPerUpload: 5
      };
    }
  }

  // Generate presigned URL for direct upload (for large files)
  async generatePresignedUrl(fileName: string, fileType: string, uploadType: string): Promise<any> {
    try {
      const response = await api.post('/uploads/presigned-url', {
        fileName,
        fileType,
        uploadType
      });
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to generate presigned URL:', error);
      throw new Error(error.response?.data?.message || 'Failed to generate presigned URL');
    }
  }

  // Upload to presigned URL
  async uploadToPresignedUrl(
    presignedUrl: string, 
    file: File,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<void> {
    try {
      await axios.put(presignedUrl, file, {
        headers: {
          'Content-Type': file.type,
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress: UploadProgress = {
              loaded: progressEvent.loaded,
              total: progressEvent.total,
              percentage: Math.round((progressEvent.loaded * 100) / progressEvent.total)
            };
            onProgress(progress);
          }
        }
      });
    } catch (error: any) {
      console.error('Failed to upload to presigned URL:', error);
      throw new Error('Failed to upload file');
    }
  }
}

export const fileUploadService = new FileUploadService();
export default fileUploadService;