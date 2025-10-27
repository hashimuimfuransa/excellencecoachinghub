import axios from 'axios';
import api from './api';

// Backend API endpoint for file uploads
const UPLOAD_API_URL = '/upload/material';

export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  format: string;
  resource_type: string;
  bytes: number;
  width?: number;
  height?: number;
}

export const uploadToCloudinary = async (
  file: File,
  onProgress?: (progress: number) => void
): Promise<CloudinaryUploadResult> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', 'course-materials');

  // Check if user is authenticated
  const token = localStorage.getItem('token');
  console.log('🔑 Upload request - Token present:', !!token);
  console.log('📁 Upload request - File:', file.name, file.size, file.type);

  try {
    const response = await api.post(UPLOAD_API_URL, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = (progressEvent.loaded / progressEvent.total) * 100;
          onProgress(progress);
        }
      },
    });

    console.log('✅ Upload successful:', response.data);
    return response.data.data;
  } catch (error: any) {
    console.error('❌ Upload error:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data
    });
    
    // Provide more specific error messages based on status codes
    if (error.response?.status === 401) {
      throw new Error('Authentication failed. Please log in again.');
    }
    
    if (error.response?.status === 403) {
      throw new Error('You do not have permission to upload files.');
    }
    
    if (error.response?.status === 408) {
      throw new Error('Upload timed out. Please try again with a smaller file or check your connection.');
    }
    
    if (error.response?.status === 503) {
      throw new Error('Upload service is temporarily unavailable. Please try again in a few moments.');
    }
    
    // Use the server's error message if available
    const serverMessage = error.response?.data?.message;
    if (serverMessage) {
      throw new Error(serverMessage);
    }
    
    // Fallback error messages
    if (error.code === 'ECONNRESET' || error.message?.includes('ECONNRESET')) {
      throw new Error('Network connection was reset. Please try again.');
    }
    
    if (error.code === 'ETIMEDOUT' || error.message?.includes('timeout')) {
      throw new Error('Upload timed out. Please check your connection and try again.');
    }
    
    throw new Error('Upload failed. Please try again or contact support if the problem persists.');
  }
};

export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
  try {
    await api.delete(`/upload/material/${publicId}`);
  } catch (error: any) {
    console.error('Delete error:', error);
    throw new Error(error.response?.data?.message || 'Failed to delete file');
  }
};
