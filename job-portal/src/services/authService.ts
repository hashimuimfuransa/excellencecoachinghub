import { apiPost, apiGet, handleApiResponse } from './api';

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
  // Google OAuth fields
  provider?: string;
  googleId?: string;
  isEmailVerified?: boolean;
  profilePicture?: string;
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
  // Google OAuth fields
  provider?: string;
  googleId?: string;
  isEmailVerified?: boolean;
  profilePicture?: string;
}

export interface AuthResponse {
  user: User | null;
  token: string;
}

class AuthService {
  // Login user
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiPost('/auth/login', credentials);
    const authData = handleApiResponse(response);
    
    // Store token and user data
    localStorage.setItem('token', authData.token);
    if (authData.user) {
      localStorage.setItem('user', JSON.stringify(authData.user));
    }
    
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
    if (authData.user) {
      localStorage.setItem('user', JSON.stringify(authData.user));
    }
    
    // Send welcome email automatically after successful registration using backend SendGrid service
    if (authData.user) {
      try {
        const emailResponse = await apiPost('/email/welcome', {
          email: authData.user.email,
          name: authData.user.firstName
        });
        
        if (emailResponse && emailResponse.status === 200) {
          console.log('✅ Welcome email sent successfully via SendGrid after registration');
        }
      } catch (emailError: any) {
        console.error('❌ Failed to send welcome email after registration:', emailError.message);
        // Don't fail registration if email fails - it's not critical
      }
    }
    
    return authData;
  }

  // Logout user
  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Don't force redirect here - let the component handle navigation
    // This prevents refresh loops and gives better control to the calling component
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
      
      // handleApiResponse returns response.data, so result IS the data object
      if (result && result.email && result.resetToken) {
        console.log('Backend provided user data for email sending:', result);
        
        try {
          // Use the new backend SendGrid email service
          const resetUrl = `${window.location.origin}/reset-password?token=${result.resetToken}`;
          
          const emailResponse = await apiPost('/email/password-reset', {
            email: result.email,
            name: result.firstName || 'User',
            resetUrl: resetUrl
          });

          if (emailResponse && emailResponse.status === 200) {
            console.log('✅ Password reset email sent successfully via SendGrid');
          } else {
            console.log('⚠️ Email service response:', emailResponse);
          }
        } catch (emailError: any) {
          console.log('❌ Failed to send password reset email via SendGrid:', emailError.message);
          // Fallback: show console message for development
          console.log('📧 Check your browser console for the password reset link (Email service unavailable)');
          console.log('🔗 Reset URL: ' + `${window.location.origin}/reset-password?token=${result.resetToken}`);
        }
      } else {
        console.log('❌ Backend did not provide expected user data for email sending:', result);
      }
    } catch (error: any) {
      console.error('Forgot password error:', error);
      // Handle JSON parsing errors specifically
      if (error.message?.includes('JSON') || error.message?.includes('parse') || 
          error.message?.includes('Unexpected end of JSON input')) {
        throw new Error('Unable to process password reset request. Please try again in a moment.');
      }
      // Handle network errors
      if (error.message?.includes('fetch') || error.message?.includes('Network')) {
        throw new Error('Network error. Please check your internet connection and try again.');
      }
      // Handle specific error messages from backend
      if (error.message?.includes('No user found') || error.message?.includes('not found')) {
        throw new Error('We couldn\'t find an account with that email address. Please check your email and try again.');
      }
      throw error;
    }
  }

  // Reset password
  async resetPassword(token: string, password: string): Promise<AuthResponse> {
    try {
      const response = await apiPost('/auth/reset-password', { token, password });
      const authData = handleApiResponse(response);
      
      // Store token and user data after successful password reset
      localStorage.setItem('token', authData.token);
      if (authData.user) {
        localStorage.setItem('user', JSON.stringify(authData.user));
      }
      
      return authData;
    } catch (error: any) {
      console.error('Reset password error:', error);
      // Handle JSON parsing errors specifically
      if (error.message?.includes('JSON') || error.message?.includes('parse') || 
          error.message?.includes('Unexpected end of JSON input')) {
        throw new Error('Unable to reset password. Please try again or request a new reset link.');
      }
      // Handle network errors
      if (error.message?.includes('fetch') || error.message?.includes('Network')) {
        throw new Error('Network error. Please check your internet connection and try again.');
      }
      // Handle token errors
      if (error.message?.includes('Invalid token') || error.message?.includes('expired')) {
        throw new Error('This reset link has expired or is invalid. Please request a new password reset.');
      }
      throw error;
    }
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