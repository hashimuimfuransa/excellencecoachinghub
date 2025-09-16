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

  // Complete Google registration (similar to homepage)
  async completeGoogleRegistration(userData: any): Promise<AuthResponse> {
    console.log('🌐 Making POST request to /auth/google/complete-registration');
    console.log('🌐 Request data:', userData);
    
    const response = await apiPost('/auth/google/complete-registration', userData);
    const authData = handleApiResponse(response);
    
    console.log('🔍 Complete Google registration raw response:', response);
    console.log('🔍 Complete Google registration processed data:', authData);
    console.log('🔍 AuthData user:', authData?.user);
    console.log('🔍 AuthData token:', authData?.token);
    
    // Enhanced token handling for Google OAuth
    if (authData?.token) {
      // Generate a more robust token for Google OAuth sessions
      const googleToken = authData.token.startsWith('google_') 
        ? authData.token 
        : `google_oauth_new_${Date.now()}_${authData.token}`;
      
      localStorage.setItem('token', googleToken);
      localStorage.setItem('google_oauth_session', 'true');
      localStorage.setItem('google_oauth_persistent', 'true');
      localStorage.setItem('session_timestamp', Date.now().toString());
      console.log('✅ Google OAuth persistent token stored:', googleToken.substring(0, 20) + '...');
    }
    
    if (authData?.user) {
      // Store user data with additional Google OAuth metadata
      const enhancedUser = {
        ...authData.user,
        provider: 'google',
        sessionStarted: new Date().toISOString(),
        sessionId: `google_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };
      
      localStorage.setItem('user', JSON.stringify(enhancedUser));
      
      // Also save to registeredUsers array for future Google login detection
      try {
        const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
        const existingIndex = registeredUsers.findIndex((user: any) => user.email === authData.user.email);
        
        const userToSave = {
          ...enhancedUser,
          registrationCompleted: true,
          lastLogin: new Date().toISOString()
        };
        
        if (existingIndex >= 0) {
          registeredUsers[existingIndex] = userToSave;
        } else {
          registeredUsers.push(userToSave);
        }
        
        localStorage.setItem('registeredUsers', JSON.stringify(registeredUsers));
        console.log('✅ User saved to registeredUsers for future Google login detection');
      } catch (error) {
        console.error('Error saving user to registeredUsers:', error);
      }
    }
    
    return authData;
  }

  // Logout user
  logout(): void {
    console.log('🚪 Logging out user...');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('google_oauth_session');
    localStorage.removeItem('google_oauth_persistent');
    localStorage.removeItem('session_timestamp');
    
    // Clear any Google Sign-In session if it exists
    if (window.google?.accounts?.id) {
      try {
        window.google.accounts.id.disableAutoSelect();
        console.log('✅ Google Sign-In session cleared');
      } catch (error) {
        console.log('Google Sign-In not available for cleanup:', error);
      }
    }
    
    console.log('✅ Logout completed successfully with all session markers cleared');
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
    
    if (!token || !user) {
      return false;
    }
    
    // Enhanced validation for Google OAuth sessions - very lenient for persistent sessions
    const isGoogleSession = localStorage.getItem('google_oauth_session') === 'true';
    const isPersistentSession = localStorage.getItem('google_oauth_persistent') === 'true';
    
    if (isGoogleSession || isPersistentSession) {
      const sessionTimestamp = localStorage.getItem('session_timestamp');
      if (sessionTimestamp) {
        const sessionAge = Date.now() - parseInt(sessionTimestamp);
        // Persistent sessions last longer (30 days), regular Google sessions last 7 days
        const maxSessionAge = isPersistentSession ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;
        
        if (sessionAge > maxSessionAge) {
          const sessionType = isPersistentSession ? 'persistent' : 'regular';
          const maxDays = isPersistentSession ? 30 : 7;
          console.warn(`🕒 Google OAuth ${sessionType} session expired (${maxDays}+ days), clearing auth data`);
          this.logout();
          return false;
        } else {
          // Only refresh timestamp occasionally to reduce overhead (every 30 minutes max)
          const shouldRefresh = sessionAge > 30 * 60 * 1000; // 30 minutes
          if (shouldRefresh) {
            localStorage.setItem('session_timestamp', Date.now().toString());
          }
          const sessionType = isPersistentSession ? 'persistent' : 'regular';
          console.log(`✅ Google OAuth ${sessionType} session valid, age:`, Math.round(sessionAge / (60 * 60 * 1000)), 'hours');
        }
      } else {
        // If no session timestamp exists for Google OAuth, create one
        localStorage.setItem('session_timestamp', Date.now().toString());
        console.log('✅ Google OAuth session timestamp created');
      }
    }
    
    console.log('✅ User is authenticated:', user.email);
    return true;
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