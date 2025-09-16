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
    // Clear consecutive error count on successful responses
    sessionStorage.removeItem('consecutive_401s');
    
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
                           error.config?.url?.includes('/auth/register') ||
                           error.config?.url?.includes('/auth/google');
      
      // Check if this is a public endpoint that should not redirect
      const isPublicEndpoint = error.config?.url?.includes('/jobs') && !error.config?.url?.includes('/employer/') && !error.config?.url?.includes('/applications');
      
      // Check if we're on a public page
      const isPublicPage = ['/', '/jobs', '/support', '/home'].includes(window.location.pathname) ||
                          window.location.pathname.startsWith('/jobs/');
      
      // Check if this is a Google OAuth session
      const isGoogleOAuthSession = localStorage.getItem('google_oauth_session') === 'true';
      const currentToken = localStorage.getItem('token');
      const isGoogleToken = currentToken?.includes('google');
      
      console.log('🔍 401 Error Analysis:', { 
        isAuthRequest, 
        isPublicEndpoint, 
        isPublicPage, 
        isGoogleOAuthSession,
        isGoogleToken,
        currentPath: window.location.pathname 
      });
      
      if (!isAuthRequest && !isPublicEndpoint && !isPublicPage) {
        // For Google OAuth sessions, be more lenient
        if (isGoogleOAuthSession && isGoogleToken) {
          console.warn('⚠️ 401 detected on Google OAuth session - may be temporary network issue');
          // Don't immediately logout on first 401 for Google sessions
          // Add a flag to track consecutive 401s
          const consecutiveErrors = parseInt(sessionStorage.getItem('consecutive_401s') || '0');
          sessionStorage.setItem('consecutive_401s', (consecutiveErrors + 1).toString());
          
          // Only logout after multiple consecutive 401s
          if (consecutiveErrors >= 2) {
            console.error('🚨 Multiple 401s detected, logging out Google OAuth session');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('google_oauth_session');
            localStorage.removeItem('session_timestamp');
            sessionStorage.removeItem('consecutive_401s');
            
            if (window.location.pathname !== '/login') {
              setTimeout(() => {
                window.location.replace('/login');
              }, 100);
            }
          }
        } else {
          // For non-Google sessions, logout immediately
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          
          if (window.location.pathname !== '/login') {
            setTimeout(() => {
              window.location.replace('/login');
            }, 100);
          }
        }
      } else {
        // For auth requests, public endpoints, or public pages - just clear any existing invalid tokens but don't redirect
        if (!isPublicEndpoint && !isPublicPage && !isAuthRequest) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
    } else {
      // Clear consecutive error count on successful requests
      sessionStorage.removeItem('consecutive_401s');
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
    
    // Handle validation errors (400)
    if (error.response?.status === 400) {
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.response?.statusText || 
                          'Invalid request data';
      console.error('❌ Validation error details:', error.response?.data);
      throw new Error(`Registration failed: ${errorMessage}`);
    }
    
    // Handle authentication errors (401)
    if (error.response?.status === 401) {
      const errorMessage = error.response?.data?.message || 'Authentication failed';
      throw new Error(errorMessage);
    }
    
    // Handle server errors
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

export const apiPatch = async <T>(url: string, data?: any): Promise<T> => {
  try {
    console.log(`🌐 Making PATCH request to ${url}`);
    console.log(`🌐 Request data:`, data);
    
    const response = await api.patch<T>(url, data);
    console.log(`✅ PATCH request successful for ${url}:`, response.status);
    
    // Additional validation to ensure we received valid data
    if (response.data === null || response.data === undefined) {
      console.error('❌ Received null/undefined response data');
      throw new Error('Server returned invalid response format');
    }
    
    return response.data;
  } catch (error: any) {
    console.error(`❌ API PATCH Error for ${url}:`, {
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