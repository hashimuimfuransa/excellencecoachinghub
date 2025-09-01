// API configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Other configuration options can be added here
export const config = {
  apiUrl: API_BASE_URL,
  // Add other config variables as needed
} as const;