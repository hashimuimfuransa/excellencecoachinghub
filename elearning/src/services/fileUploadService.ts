import axios from 'axios';

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

interface FileUploadResult {
  filename: string;
  originalName: string;
  fileUrl: string;
  fileSize: number;
  uploadedAt: Date;
}

class FileUploadService {
  // Upload assignment file (student submission)
  async uploadAssignmentFile(
    file: File, 
    courseId: string, 
    assignmentId: string,
    onProgress?: (progress: number) => void
  ): Promise<FileUploadResult> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('courseId', courseId);

      const response = await api.post(`/assignments/${assignmentId}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(progress);
          }
        },
      });

      return response.data.data;
    } catch (error: any) {
      console.error('File upload failed:', error);
      throw new Error(error.response?.data?.message || 'Failed to upload file');
    }
  }

  // Upload assignment document (instructor)
  async uploadAssignmentDocument(
    file: File, 
    assignmentId: string,
    onProgress?: (progress: number) => void
  ): Promise<FileUploadResult> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post(`/assignments/${assignmentId}/upload-document`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(progress);
          }
        },
      });

      return response.data.data;
    } catch (error: any) {
      console.error('Document upload failed:', error);
      throw new Error(error.response?.data?.message || 'Failed to upload document');
    }
  }

  // Upload assessment file
  async uploadAssessmentFile(
    file: File, 
    assessmentId: string,
    onProgress?: (progress: number) => void
  ): Promise<FileUploadResult> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post(`/assessments/${assessmentId}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(progress);
          }
        },
      });

      return response.data.data;
    } catch (error: any) {
      console.error('Assessment file upload failed:', error);
      throw new Error(error.response?.data?.message || 'Failed to upload assessment file');
    }
  }

  // Upload course material
  async uploadCourseMaterial(
    file: File, 
    courseId: string,
    materialType: 'document' | 'video' | 'image' | 'other' = 'document',
    onProgress?: (progress: number) => void
  ): Promise<FileUploadResult> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('materialType', materialType);

      const response = await api.post(`/courses/${courseId}/upload-material`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(progress);
          }
        },
      });

      return response.data.data;
    } catch (error: any) {
      console.error('Course material upload failed:', error);
      throw new Error(error.response?.data?.message || 'Failed to upload course material');
    }
  }

  // Download file
  async downloadFile(fileUrl: string): Promise<Blob> {
    try {
      const response = await api.get(fileUrl, {
        responseType: 'blob',
      });

      return response.data;
    } catch (error: any) {
      console.error('File download failed:', error);
      throw new Error(error.response?.data?.message || 'Failed to download file');
    }
  }

  // Delete file
  async deleteFile(fileUrl: string): Promise<void> {
    try {
      await api.delete('/files/delete', {
        data: { fileUrl }
      });
    } catch (error: any) {
      console.error('File deletion failed:', error);
      throw new Error(error.response?.data?.message || 'Failed to delete file');
    }
  }

  // Get file info
  async getFileInfo(fileUrl: string): Promise<{
    filename: string;
    originalName: string;
    fileSize: number;
    mimeType: string;
    uploadedAt: Date;
  }> {
    try {
      const response = await api.get('/files/info', {
        params: { fileUrl }
      });

      return response.data.data;
    } catch (error: any) {
      console.error('Failed to get file info:', error);
      throw new Error(error.response?.data?.message || 'Failed to get file information');
    }
  }

  // Validate file before upload
  validateFile(
    file: File, 
    allowedTypes: string[] = [], 
    maxSizeInMB: number = 10
  ): { isValid: boolean; error?: string } {
    // Check file size
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
    if (file.size > maxSizeInBytes) {
      return {
        isValid: false,
        error: `File size exceeds ${maxSizeInMB}MB limit`
      };
    }

    // Check file type
    if (allowedTypes.length > 0) {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      if (!fileExtension || !allowedTypes.includes(fileExtension)) {
        return {
          isValid: false,
          error: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`
        };
      }
    }

    // Check for malicious file names
    const dangerousPatterns = [
      /\.exe$/i,
      /\.bat$/i,
      /\.cmd$/i,
      /\.scr$/i,
      /\.vbs$/i,
      /\.js$/i,
      /\.jar$/i,
      /\.com$/i,
      /\.pif$/i
    ];

    if (dangerousPatterns.some(pattern => pattern.test(file.name))) {
      return {
        isValid: false,
        error: 'File type not allowed for security reasons'
      };
    }

    return { isValid: true };
  }

  // Format file size for display
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Get file icon based on extension
  getFileIcon(filename: string): string {
    const extension = filename.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'pdf':
        return '📄';
      case 'doc':
      case 'docx':
        return '📝';
      case 'xls':
      case 'xlsx':
        return '📊';
      case 'ppt':
      case 'pptx':
        return '📽️';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return '🖼️';
      case 'mp4':
      case 'avi':
      case 'mov':
        return '🎥';
      case 'mp3':
      case 'wav':
        return '🎵';
      case 'zip':
      case 'rar':
        return '📦';
      case 'txt':
        return '📄';
      default:
        return '📎';
    }
  }
}

export const fileUploadService = new FileUploadService();
export default fileUploadService;