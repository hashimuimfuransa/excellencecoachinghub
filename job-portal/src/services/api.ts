import axios from 'axios';

// Debug environment variables
console.log('VITE_API_URL:', import.meta.env.VITE_API_URL);
console.log('Default API URL:', 'http://localhost:5000/api');
console.log('Final baseURL:', import.meta.env.VITE_API_URL || 'http://localhost:5000/api');

// Create axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 120000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token and handle deduplication
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Check for duplicate requests (only for GET requests to prevent unnecessary API calls)
    if (config.method?.toLowerCase() === 'get') {
      const requestKey = getRequestKey(config);
      const pendingRequest = pendingRequests.get(requestKey);
      
      if (pendingRequest) {
        console.log(`🔄 Deduplicating duplicate request: ${requestKey}`);
        // Return a promise that resolves with the pending request result
        return pendingRequest.then(response => response);
      }
      
      // Mark this request as pending (we'll store the actual promise in the response interceptor)
      config._isDeduplicationCandidate = true;
      config._requestKey = requestKey;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Rate limiting state management - per request instead of global
const requestRetryCounts = new Map<string, number>();
const pendingRequests = new Map<string, Promise<any>>();
const MAX_RETRY_ATTEMPTS = 5; // Increased retry attempts
const RATE_LIMIT_RETRY_DELAYS = [2000, 5000, 10000, 20000, 30000]; // Exponential backoff delays in ms
const REQUEST_QUEUE = new Map<string, Array<() => Promise<any>>>();
const isProcessingQueue = new Set<string>();

// Helper function to get request key
const getRequestKey = (config: any): string => {
  return `${config.method?.toUpperCase() || 'GET'}:${config.url}`;
};

// Helper function to get retry count for a request
const getRetryCount = (config: any): number => {
  const key = getRequestKey(config);
  return requestRetryCounts.get(key) || 0;
};

// Helper function to increment retry count
const incrementRetryCount = (config: any): number => {
  const key = getRequestKey(config);
  const currentCount = requestRetryCounts.get(key) || 0;
  const newCount = currentCount + 1;
  requestRetryCounts.set(key, newCount);
  return newCount;
};

// Helper function to reset retry count
const resetRetryCount = (config: any): void => {
  const key = getRequestKey(config);
  requestRetryCounts.delete(key);
};

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    // Clear consecutive error count on successful responses
    sessionStorage.removeItem('consecutive_401s');
    // Reset rate limit retry count on successful response
    resetRetryCount(response.config);
    
    // Handle request deduplication cleanup
    if (response.config._isDeduplicationCandidate && response.config._requestKey) {
      pendingRequests.delete(response.config._requestKey);
    }
    
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
    // Handle request deduplication cleanup for failed requests
    if (error.config?._isDeduplicationCandidate && error.config?._requestKey) {
      pendingRequests.delete(error.config._requestKey);
    }
    
    // Handle 429 Rate Limiting errors with improved exponential backoff
    if (error.response?.status === 429) {
      const currentRetryCount = getRetryCount(error.config);
      const nextAttempt = currentRetryCount + 1;
      const retryAfter = error.response?.headers?.['retry-after'] || 'unknown';
      
      console.warn('🚨 Rate limit exceeded (429). Attempting retry...', {
        attempt: nextAttempt,
        maxAttempts: MAX_RETRY_ATTEMPTS,
        retryAfter,
        requestUrl: error.config?.url
      });
      
      if (currentRetryCount < MAX_RETRY_ATTEMPTS) {
        // Use exponential backoff with jitter to prevent thundering herd
        const baseDelay = RATE_LIMIT_RETRY_DELAYS[currentRetryCount] || 30000;
        const jitter = Math.random() * 1000; // Add random jitter up to 1 second
        const delay = baseDelay + jitter;
        
        incrementRetryCount(error.config);
        
        console.log(`⏳ Waiting ${Math.round(delay)}ms before retry attempt ${nextAttempt}/${MAX_RETRY_ATTEMPTS} for ${error.config?.url}`);
        
        // Return a promise that will retry after delay
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            // Retry the original request
            api.request(error.config)
              .then(resolve)
              .catch(reject);
          }, delay);
        });
      } else {
        console.error('❌ Max retry attempts reached for rate limiting. Request failed.', {
          requestUrl: error.config?.url,
          totalAttempts: currentRetryCount + 1
        });
        resetRetryCount(error.config); // Reset for future requests
        
        // Create a user-friendly error message with specific guidance
        const retryAfterSeconds = parseInt(retryAfter) || 60;
        const retryAfterMinutes = Math.ceil(retryAfterSeconds / 60);
        
        const customError = {
          ...error,
          response: {
            ...error.response,
            data: {
              success: false,
              error: 'Rate limit exceeded',
              message: `Too many requests. Please wait ${retryAfterMinutes} minute${retryAfterMinutes > 1 ? 's' : ''} and try again. If the problem persists, check your network connection.`,
              retryAfter: retryAfterSeconds,
              userFriendly: true,
              action: 'Please refresh the page or try again later'
            }
          }
        };
        return Promise.reject(customError);
      }
    }
    
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
      
      // Check if this is a Google OAuth session - recognize new Google tokens
      const currentToken = localStorage.getItem('token');
      const isGoogleToken = currentToken?.startsWith('google_');
      const isGoogleOAuthSession = isGoogleToken;
      
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
    
    // Enhanced error handling for user-friendly messages
    if (error.response?.data?.userFriendly) {
      throw new Error(error.response.data.message);
    }
    
    // Handle network errors
    if (error.code === 'NETWORK_ERROR' || !error.response) {
      throw new Error('Network connection failed. Please check your internet connection and try again.');
    }
    
    // Handle rate limiting errors
    if (error.response?.status === 429) {
      const retryAfter = error.response?.data?.retryAfter || 60;
      const minutes = Math.ceil(retryAfter / 60);
      throw new Error(`Too many requests. Please wait ${minutes} minute${minutes > 1 ? 's' : ''} and try again.`);
    }
    
    // Handle server errors
    if (error.response?.status >= 500) {
      throw new Error('Server is temporarily unavailable. Please try again in a few moments.');
    }
    
    // Handle client errors
    if (error.response?.status >= 400 && error.response?.status < 500) {
      const message = error.response?.data?.message || error.response?.data?.error || 'Request failed';
      throw new Error(message);
    }
    
    throw error;
  }
};

export const apiPost = async <T>(url: string, data?: any): Promise<T> => {
  try {
    console.log(`🌐 Making POST request to ${url}`);
    console.log(`🌐 Full URL should be: ${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}${url}`);
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