import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

// API configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

console.log('🔧 API Service Configuration:');
console.log('📡 API Base URL:', API_BASE_URL);
console.log('🌐 Environment API URL:', process.env.REACT_APP_API_URL);
console.log('🔧 Current environment:', process.env.NODE_ENV);

// Create axios instance
const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔑 API Request with token:', config.url, token.substring(0, 20) + '...');
    } else {
      console.warn('⚠️ API Request without token:', config.url);
    }
    console.log('📡 Full API Request URL:', config.baseURL + config.url);
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log('✅ API Response received:', response.config.url, 'Status:', response.status);
    console.log('📦 Response data:', response.data);
    return response;
  },
  (error) => {
    console.error('❌ API Response error:', error.config?.url, 'Status:', error.response?.status);
    console.error('❌ Error data:', error.response?.data);
    console.error('❌ Error message:', error.message);
    
    if (error.response?.status === 401) {
      // Token expired or invalid
      console.log('🔐 Token expired, redirecting to login');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API service interface
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

// Generic API service
export const apiService = {
  // GET request
  get: async <T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
    try {
      const response = await axiosInstance.get(url, config);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Request failed');
    }
  },

  // POST request
  post: async <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
    try {
      const response = await axiosInstance.post(url, data, config);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Request failed');
    }
  },

  // PUT request
  put: async <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
    try {
      const response = await axiosInstance.put(url, data, config);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Request failed');
    }
  },

  // PATCH request
  patch: async <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
    try {
      const response = await axiosInstance.patch(url, data, config);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Request failed');
    }
  },

  // DELETE request
  delete: async <T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
    try {
      const response = await axiosInstance.delete(url, config);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Request failed');
    }
  },

  // Upload file
  upload: async <T = any>(url: string, formData: FormData, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
    try {
      const response = await axiosInstance.post(url, formData, {
        ...config,
        headers: {
          'Content-Type': 'multipart/form-data',
          ...config?.headers,
        },
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Upload failed');
    }
  },

  // Download file
  download: async (url: string, filename?: string, config?: AxiosRequestConfig): Promise<void> => {
    try {
      const response = await axiosInstance.get(url, {
        ...config,
        responseType: 'blob',
      });

      const blob = new Blob([response.data]);
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result;
          if (typeof result === 'string') {
            resolve(result);
          } else {
            reject(new Error('Failed to convert file for download'));
          }
        };
        reader.onerror = () => {
          reject(new Error('File conversion error'));
        };
        reader.readAsDataURL(blob);
      });

      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = filename || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Download failed');
    }
  },
};

// Export axios instance for direct use if needed
export { axiosInstance };
export default apiService;
