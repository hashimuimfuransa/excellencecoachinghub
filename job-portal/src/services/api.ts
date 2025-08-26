import axios from 'axios';

// Create axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    // Check if response data exists and is valid JSON
    if (response.data === '' || response.data === null || response.data === undefined) {
      // Create a proper empty response
      response.data = { success: false, error: 'Empty response from server' };
    }
    return response;
  },
  (error) => {
    // Handle JSON parsing errors
    if (error.message?.includes('Unexpected end of JSON input') || 
        error.message?.includes('Failed to execute \'json\' on \'Response\'')) {
      console.error('JSON parsing error detected:', error);
      // Create a standardized error response
      const customError = {
        ...error,
        response: {
          ...error.response,
          data: {
            success: false,
            error: 'Invalid server response',
            message: 'The server returned an invalid response. Please try again.'
          }
        }
      };
      return Promise.reject(customError);
    }
    
    if (error.response?.status === 401) {
      // Check if this is a login or register request - don't redirect in these cases
      const isAuthRequest = error.config?.url?.includes('/auth/login') || 
                           error.config?.url?.includes('/auth/register');
      
      if (!isAuthRequest) {
        // Token expired or invalid for protected routes
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      } else {
        // For auth requests, just clear any existing invalid tokens but don't redirect
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    return Promise.reject(error);
  }
);

// Generic API functions
export const apiGet = async <T>(url: string, params?: any, signal?: AbortSignal): Promise<T> => {
  const response = await api.get<T>(url, { params, signal });
  return response.data;
};

export const apiPost = async <T>(url: string, data?: any): Promise<T> => {
  const response = await api.post<T>(url, data);
  return response.data;
};

export const apiPut = async <T>(url: string, data?: any): Promise<T> => {
  const response = await api.put<T>(url, data);
  return response.data;
};

export const apiDelete = async <T>(url: string): Promise<T> => {
  const response = await api.delete<T>(url);
  return response.data;
};

// Utility functions for handling API responses
export const handleApiResponse = (response: any) => {
  if (!response.success) {
    // Create a more detailed error that preserves backend error information
    const error = new Error(response.message || response.error || 'API request failed');
    // Attach the full error data for detailed error handling
    (error as any).errorData = response;
    throw error;
  }
  return response.data;
};

export const handlePaginatedResponse = (response: any) => {
  if (!response.success) {
    throw new Error('API request failed');
  }
  return response;
};

export default api;