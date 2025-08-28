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
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Only redirect if we're not already on the login page
      const currentPath = window.location.pathname;
      if (currentPath !== '/login') {
        console.warn('Authentication failed, redirecting to login');
        // Token expired or invalid
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Use React Router navigation instead of direct window.location
        setTimeout(() => {
          window.location.href = '/login';
        }, 100);
      }
    }
    return Promise.reject(error);
  }
);

// Generic API functions
export const apiGet = async <T>(url: string, params?: any): Promise<T> => {
  const response = await api.get<T>(url, { params });
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

export const apiDelete = async <T>(url: string, config?: any): Promise<T> => {
  const response = await api.delete<T>(url, config);
  return response.data;
};

// Utility functions for handling API responses
export const handleApiResponse = (response: any) => {
  // Handle direct axios response
  if (response.data) {
    const data = response.data;
    if (data.success === false) {
      throw new Error(data.error || 'API request failed');
    }
    return data.success ? data.data : data;
  }
  
  // Handle already processed response
  if (response.success === false) {
    throw new Error(response.error || 'API request failed');
  }
  return response.success ? response.data : response;
};

export const handlePaginatedResponse = (response: any) => {
  // Handle direct axios response
  if (response.data) {
    const data = response.data;
    if (data.success === false) {
      throw new Error(data.error || 'API request failed');
    }
    return data;
  }
  
  // Handle already processed response
  if (response.success === false) {
    throw new Error('API request failed');
  }
  return response;
};

export default api;