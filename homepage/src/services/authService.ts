import { apiService } from './api';
import { emailService } from './emailService';
import type { LoginForm, RegisterForm, User, AuthResponse } from '../types/auth';

export const authService = {
  // Login user
  login: async (credentials: LoginForm): Promise<AuthResponse> => {
    try {
      const response = await apiService.post<AuthResponse>('/auth/login', credentials);
      
      if (response.success && response.data) {
        // Store token and user data
        localStorage.setItem('token', response.data.token);
        if (response.data.user) {
          localStorage.setItem('user', JSON.stringify(response.data.user));
        }
        
        if (response.data.refreshToken) {
          localStorage.setItem('refreshToken', response.data.refreshToken);
        }
        
        return response.data;
      }
      
      throw new Error(response.error || 'Login failed');
    } catch (error: any) {
      // Handle axios errors properly
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.message) {
        throw new Error(error.message);
      } else {
        throw new Error('Login failed. Please try again.');
      }
    }
  },

  // Register user
  register: async (userData: RegisterForm): Promise<AuthResponse> => {
    try {
      // Automatically add platform information
      const registerPayload = {
        ...userData,
        platform: 'homepage' // This is the homepage platform
      };
      
      const response = await apiService.post<AuthResponse>('/auth/register', registerPayload);

      if (response.success && response.data) {
        // Store token and user data
        localStorage.setItem('token', response.data.token);
        if (response.data.user) {
          localStorage.setItem('user', JSON.stringify(response.data.user));
        }

        if (response.data.refreshToken) {
          localStorage.setItem('refreshToken', response.data.refreshToken);
        }

        // Send welcome email automatically after successful registration
        if (response.data.user) {
          try {
            await emailService.sendWelcomeEmail(
              response.data.user.email,
              response.data.user.firstName,
              response.data.user.role
            );
            console.log('✅ Welcome email sent successfully after registration');
          } catch (emailError) {
            console.error('❌ Failed to send welcome email after registration:', emailError);
            // Don't fail registration if email fails - it's not critical
          }
        }

        return response.data;
      }

      throw new Error(response.error || 'Registration failed');
    } catch (error: any) {
      // Handle axios errors properly
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.message) {
        throw new Error(error.message);
      } else {
        throw new Error('Registration failed. Please try again.');
      }
    }
  },

  // Get current user
  getCurrentUser: async (): Promise<User> => {
    const response = await apiService.get<{ user: User }>('/auth/me');
    
    if (response.success && response.data) {
      // Update stored user data
      localStorage.setItem('user', JSON.stringify(response.data.user));
      return response.data.user;
    }
    
    throw new Error(response.error || 'Failed to get user data');
  },

  // Logout user
  logout: async (): Promise<void> => {
    try {
      await apiService.post('/auth/logout');
    } catch (error) {
      // Even if logout fails on server, clear local storage
      console.error('Logout error:', error);
    } finally {
      // Clear local storage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('refreshToken');
    }
  },

  // Forgot password
  forgotPassword: async (email: string): Promise<void> => {
    try {
      // First, call the backend to generate the reset token
      const response = await apiService.post<{
        email: string;
        firstName?: string;
        resetToken: string;
      }>('/auth/forgot-password', { email });

      if (!response.success) {
        // Handle specific error types with friendly messages
        if (response.error?.includes('No user found') || response.error?.includes('not found')) {
          throw new Error('We couldn\'t find an account with that email address. Please check your email and try again, or create a new account if you haven\'t registered yet.');
        }
        throw new Error(response.error || 'Failed to send password reset email');
      }

      // Backend returned success with user data, now send actual email via SendGrid (handled by backend)
      if (response.data) {
        try {
          // Use the new backend SendGrid email service
          const resetUrl = `${window.location.origin}/reset-password?token=${response.data.resetToken}`;
          
          await apiService.post('/email/password-reset', {
            email: response.data.email,
            name: response.data.firstName || 'User',
            resetUrl: resetUrl
          });

          console.log('✅ Password reset email sent successfully via SendGrid');
        } catch (emailError: any) {
          console.log('❌ Failed to send password reset email via SendGrid:', emailError.message);
          // Fallback: show console message for development
          console.log('📧 Check your browser console for the password reset link (Email service unavailable)');
          console.log('🔗 Reset URL: ' + `${window.location.origin}/reset-password?token=${response.data.resetToken}`);
        }
      }
    } catch (error: any) {
      console.error('Forgot password error:', error);
      // Re-throw with friendly error message if it's a network error
      if (error.message?.includes('fetch') || error.message?.includes('Network')) {
        throw new Error('Network error. Please check your internet connection and try again.');
      }
      throw error;
    }
  },

  // Reset password
  resetPassword: async (token: string, password: string): Promise<AuthResponse> => {
    const response = await apiService.post<AuthResponse>('/auth/reset-password', { 
      token, 
      password 
    });
    
    if (response.success && response.data) {
      // Store token and user data
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      if (response.data.refreshToken) {
        localStorage.setItem('refreshToken', response.data.refreshToken);
      }
      
      return response.data;
    }
    
    throw new Error(response.error || 'Password reset failed');
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    return !!(token && user);
  },

  // Get stored token
  getToken: (): string | null => {
    return localStorage.getItem('token');
  },

  // Get stored user
  getStoredUser: (): User | null => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        return JSON.parse(userData);
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        localStorage.removeItem('user');
      }
    }
    return null;
  },

  // Clear authentication data
  clearAuth: (): void => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('refreshToken');
  },

  // Refresh token (if implemented)
  refreshToken: async (): Promise<string> => {
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await apiService.post<{ token: string }>('/auth/refresh', {
        refreshToken
      });
      
      if (response.success && response.data) {
        localStorage.setItem('token', response.data.token);
        return response.data.token;
      }
      
      throw new Error(response.error || 'Token refresh failed');
    } catch (error) {
      // If refresh fails, clear all auth data
      authService.clearAuth();
      throw error;
    }
  }
};