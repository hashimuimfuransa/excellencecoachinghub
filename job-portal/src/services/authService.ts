import { apiPost, apiGet, handleApiResponse } from './api';
import { sendWelcomeEmail } from './emailjsService';

// Local type definitions
export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  avatar?: string;
  company?: string;
  jobTitle?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: string;
  company?: string;
  jobTitle?: string;
  platform?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

class AuthService {
  // Login user
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiPost('/auth/login', credentials);
    const authData = handleApiResponse(response);
    
    // Store token and user data
    localStorage.setItem('token', authData.token);
    localStorage.setItem('user', JSON.stringify(authData.user));
    
    return authData;
  }

  // Register user
  async register(userData: RegisterData): Promise<AuthResponse> {
    // Automatically add platform information
    const registerPayload = {
      ...userData,
      platform: 'job-portal' // This is the job portal platform
    };
    
    const response = await apiPost('/auth/register', registerPayload);
    const authData = handleApiResponse(response);
    
    // Store token and user data
    localStorage.setItem('token', authData.token);
    localStorage.setItem('user', JSON.stringify(authData.user));
    
    // Send welcome email automatically after successful registration
    try {
      await sendWelcomeEmail(
        authData.user.email,
        authData.user.firstName,
        authData.user.role
      );
      console.log('✅ Welcome email sent successfully after registration');
    } catch (emailError) {
      console.error('❌ Failed to send welcome email after registration:', emailError);
      // Don't fail registration if email fails - it's not critical
    }
    
    return authData;
  }

  // Logout user
  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }

  // Get current user from localStorage
  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (error) {
        console.error('Error parsing user data:', error);
        // Just clear the invalid data, don't redirect
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        return null;
      }
    }
    return null;
  }

  // Get current token
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    const token = this.getToken();
    const user = this.getCurrentUser();
    return !!(token && user);
  }

  // Refresh user data
  async refreshUser(): Promise<User> {
    const response = await apiGet('/auth/me');
    const user = handleApiResponse(response);
    
    localStorage.setItem('user', JSON.stringify(user));
    return user;
  }

  // Forgot password
  async forgotPassword(email: string): Promise<void> {
    try {
      const response = await apiPost('/auth/forgot-password', { email });
      const result = handleApiResponse(response);
      
      // If backend provides user data for frontend email sending
      if (result.userData) {
        console.log('Backend provided user data for frontend email sending:', result.userData);
        // Additional frontend email logic can be added here if needed
      }
    } catch (error: any) {
      // Handle JSON parsing errors specifically
      if (error.message?.includes('JSON') || error.message?.includes('parse')) {
        console.error('Password reset JSON error caught:', error);
        throw new Error('Server communication error. Please try again in a moment.');
      }
      throw error;
    }
  }

  // Reset password
  async resetPassword(token: string, password: string): Promise<void> {
    const response = await apiPost('/auth/reset-password', { token, password });
    handleApiResponse(response);
  }

  // Change password
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const response = await apiPost('/auth/change-password', {
      currentPassword,
      newPassword
    });
    handleApiResponse(response);
  }

  // Update profile
  async updateProfile(userData: Partial<User>): Promise<User> {
    const response = await apiPost('/auth/update-profile', userData);
    const user = handleApiResponse(response);
    
    localStorage.setItem('user', JSON.stringify(user));
    return user;
  }

  // Check if user has specific role
  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user?.role === role;
  }

  // Check if user has any of the specified roles
  hasAnyRole(roles: string[]): boolean {
    const user = this.getCurrentUser();
    return user ? roles.includes(user.role) : false;
  }
}

export const authService = new AuthService();
export default authService;