import axios from 'axios';

// Create axios instance
const axiosClient = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'https://excellencecoachinghubbackend.onrender.com/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
axiosClient.interceptors.request.use(
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

// Response interceptor to handle token expiration
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only redirect to login on actual authentication errors (401)
    // Don't redirect on network errors or server issues
    if (error.response?.status === 401) {
      // Only redirect if we're not already on the login page
      if (window.location.pathname !== '/login') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default axiosClient;