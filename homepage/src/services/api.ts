import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosRequestConfig, AxiosResponse } from 'axios';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error) => {
    // Handle network errors gracefully
    if (!error.response) {
      // Network error - server is not reachable
      console.warn('Network error - server may be unavailable:', error.message);
      
      // Check if it's a connection refused error (server not running)
      if (error.code === 'ECONNREFUSED' || error.message.includes('ECONNREFUSED')) {
        return Promise.reject(new Error('Unable to connect to server. Please ensure the server is running.'));
      }
      
      // Check if it's a timeout error
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        return Promise.reject(new Error('Request timeout. Please check your connection and try again.'));
      }
      
      // Generic network error
      return Promise.reject(new Error('Network error. Please check your connection and try again.'));
    }
    
    if (error.response?.status === 401) {
      // Don't handle 401 errors for login/register endpoints - let them bubble up
      if (error.config?.url?.includes('/auth/login') || error.config?.url?.includes('/auth/register')) {
        return Promise.reject(error);
      }
      
      // Token expired or invalid for other endpoints
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Only redirect if we're not already on a public page
      if (!window.location.pathname.includes('/login') && 
          !window.location.pathname.includes('/register') &&
          !window.location.pathname.includes('/') &&
          window.location.pathname !== '/') {
        window.location.href = '/login';
      }
    }
    
    // Handle other HTTP errors
    if (error.response?.status >= 500) {
      return Promise.reject(new Error('Server error. Please try again later.'));
    }
    
    return Promise.reject(error);
  }
);

// Generic API methods
export const apiService = {
  get: async <T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
    const response = await api.get(url, config);
    return response.data;
  },

  post: async <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
    const response = await api.post(url, data, config);
    return response.data;
  },

  put: async <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
    const response = await api.put(url, data, config);
    return response.data;
  },

  delete: async <T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
    const response = await api.delete(url, config);
    return response.data;
  },

  patch: async <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
    const response = await api.patch(url, data, config);
    return response.data;
  },

  postFormData: async <T>(url: string, formData: FormData, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
    const response = await api.post(url, formData, {
      ...config,
      headers: {
        'Content-Type': 'multipart/form-data',
        ...config?.headers,
      },
    });
    return response.data;
  },
};

export default api;