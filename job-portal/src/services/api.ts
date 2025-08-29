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
    // Check if response data exists and is valid
    if (response.data === '' || response.data === null || response.data === undefined) {
      // Create a proper empty response
      response.data = { success: false, error: 'Empty response from server' };
    }
    
    // Additional safety check for malformed JSON
    if (typeof response.data === 'string') {
      try {
        // If it's a string, try to parse it as JSON
        response.data = JSON.parse(response.data);
      } catch (parseError) {
        console.error('❌ Failed to parse string response as JSON:', parseError);
        response.data = { 
          success: false, 
          error: 'Invalid JSON response from server',
          originalData: response.data 
        };
      }
    }
    
    return response;
  },
  (error) => {
    // Handle JSON parsing errors more comprehensively
    if (error.message?.includes('Unexpected end of JSON input') || 
        error.message?.includes('Failed to execute \'json\' on \'Response\'') ||
        error.message?.includes('JSON.parse') ||
        (error.response && error.response.status === 200 && !error.response.data)) {
      console.error('JSON parsing error detected:', error);
      console.error('Response details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        headers: error.response?.headers,
        data: error.response?.data
      });
      
      // Create a standardized error response
      const customError = {
        ...error,
        response: {
          ...error.response,
          data: {
            success: false,
            error: 'Server returned invalid response format',
            message: 'The server response could not be processed. Please try again.'
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
  try {
    const response = await api.get<T>(url, { params, signal });
    return response.data;
  } catch (error: any) {
    console.error(`API GET Error for ${url}:`, error);
    throw error;
  }
};

export const apiPost = async <T>(url: string, data?: any): Promise<T> => {
  try {
    console.log(`🌐 Making POST request to ${url}`);
    console.log(`🌐 Request data:`, data);
    
    const response = await api.post<T>(url, data);
    console.log(`✅ POST request successful for ${url}:`, response.status);
    
    // Additional validation to ensure we received valid data
    if (response.data === null || response.data === undefined) {
      console.error('❌ Received null/undefined response data');
      throw new Error('Server returned invalid response format');
    }
    
    return response.data;
  } catch (error: any) {
    console.error(`❌ API POST Error for ${url}:`, {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      headers: error.response?.headers,
      config: error.config
    });
    
    // Enhanced error handling for specific cases
    if (error.code === 'NETWORK_ERROR' || !error.response) {
      throw new Error('Network connection failed. Please check your internet connection and try again.');
    }
    
    if (error.response?.status === 502 || error.response?.status === 503 || error.response?.status === 504) {
      throw new Error('Server is temporarily unavailable. Please try again in a few moments.');
    }
    
    // Handle cases where response data is not valid JSON or is empty
    if (error.response?.status === 200 && (!error.response.data || error.response.data === '')) {
      throw new Error('Server returned empty response');
    }
    
    throw error;
  }
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

// Named export for api instance
export { api };

export default api;