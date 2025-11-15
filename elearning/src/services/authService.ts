import { apiService } from './api';
import { emailService } from './emailService';
import { IUser, LoginForm, RegisterForm, ApiResponse } from '../shared/types';
// EmailJS removed - now using backend SendGrid service

// Interface for forgot password response
interface ForgotPasswordResponse {
  success: boolean;
  message: string;
  userData?: {
    email: string;
    firstName: string;
    resetToken: string;
  };
}

interface AuthResponse {
  user: IUser;
  token: string;
  refreshToken?: string;
}

export const authService = {
  // Login user
  login: async (credentials: LoginForm): Promise<AuthResponse> => {
    try {
      const response = await apiService.post<AuthResponse>('/auth/login', credentials);
      
      if (response.success && response.data) {
        // Store token and user data
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
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
        platform: 'elearning' // This is the e-learning platform
      };
      
      const response = await apiService.post<AuthResponse>('/auth/register', registerPayload);

      if (response.success && response.data) {
        // Store token and user data
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));

        if (response.data.refreshToken) {
          localStorage.setItem('refreshToken', response.data.refreshToken);
        }

        // Send both verification and welcome emails using EmailJS
        try {
          // Send verification email first
          await authService.sendRegistrationVerification(
            response.data.user.email,
            response.data.user.firstName
          );
          console.log('✅ Verification email sent to:', response.data.user.email);

          // Send welcome email automatically after successful registration
          await emailService.sendWelcomeEmail(
            response.data.user.email,
            response.data.user.firstName,
            response.data.user.role
          );
          console.log('✅ Welcome email sent to:', response.data.user.email);
        } catch (emailError) {
          console.error('Failed to send registration emails:', emailError);
          // Don't fail registration if email fails
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
  getCurrentUser: async (): Promise<IUser> => {
    const response = await apiService.get<{ user: IUser }>('/auth/me');
    
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

  // Verify email
  verifyEmail: async (token: string, email?: string): Promise<void> => {
    const requestData: any = { token };

    // If email is provided, include it for frontend verification
    if (email) {
      requestData.email = email;
    }

    const response = await apiService.post('/auth/verify-email', requestData);

    if (!response.success) {
      throw new Error(response.error || 'Email verification failed');
    }
  },

  // Resend verification email using EmailJS
  resendVerification: async (): Promise<void> => {
    console.log('🔍 Starting resendVerification function...');

    try {
      // Get current user data
      const userString = localStorage.getItem('user');
      console.log('🔍 Raw user string from localStorage:', userString);

      const user = JSON.parse(userString || '{}');
      console.log('🔍 Parsed user data:', user);

      if (!user.email || !user.firstName) {
        console.error('🔍 User data validation failed:', { email: user.email, firstName: user.firstName });
        throw new Error('User data not found');
      }

      // Generate verification code
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      console.log('🔍 Generated verification code:', verificationCode);

      // Store verification code IMMEDIATELY (before any async operations)
      console.log('🔍 Setting localStorage items...');
      localStorage.setItem('pendingVerificationCode', verificationCode);
      localStorage.setItem('pendingVerificationEmail', user.email);

      // Verify they were set
      const storedCode = localStorage.getItem('pendingVerificationCode');
      const storedEmail = localStorage.getItem('pendingVerificationEmail');
      console.log('🔍 Verification after setting:');
      console.log('- Stored code:', storedCode);
      console.log('- Stored email:', storedEmail);
      console.log('- Codes match:', storedCode === verificationCode);

      // Send email using backend SendGrid service
      try {
        await apiService.post('/email/verification-code', {
          email: user.email,
          name: user.firstName,
          verificationCode: verificationCode
        });
        console.log('🔍 Verification email sent successfully via SendGrid');
      } catch (emailError) {
        console.error('🔍 Email sending failed, but verification code is stored:', emailError);
        // Fallback: show console message for development
        console.log('📧 Check your browser console for the verification code (Email service unavailable)');
        console.log('🔢 Verification Code: ' + verificationCode);
      }

    } catch (error) {
      console.error('🔍 Resend verification error:', error);
      throw error;
    }
  },

  // Send verification email for new registration
  sendRegistrationVerification: async (email: string, firstName: string): Promise<string> => {
    try {
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

      try {
        await apiService.post('/email/verification-code', {
          email: email,
          name: firstName,
          verificationCode: verificationCode
        });
        console.log('✅ Registration verification email sent successfully via SendGrid');
      } catch (emailError) {
        console.error('❌ Failed to send verification email via SendGrid:', emailError);
        // Fallback: show console message for development
        console.log('📧 Check your browser console for the verification code (Email service unavailable)');
        console.log('🔢 Verification Code: ' + verificationCode);
        // Don't throw - the verification can still work with the stored code
      }

      // Store verification code for later verification
      localStorage.setItem('pendingVerificationCode', verificationCode);
      localStorage.setItem('pendingVerificationEmail', email);

      return verificationCode;
    } catch (error) {
      console.error('Send verification error:', error);
      throw error;
    }
  },

  // Forgot password - use backend + EmailJS for real emails
  forgotPassword: async (identifier: string): Promise<void> => {
    try {
      // First, call the backend to generate the reset token
      const response = await apiService.post('/auth/forgot-password', { identifier }) as ForgotPasswordResponse;

      if (!response.success) {
        throw new Error(response.message || 'Failed to send password reset email');
      }

      // Backend provides user data and reset token
      const userData = response.userData;

      if (userData && userData.resetToken) {
        console.log('✅ Reset token generated, sending email via EmailJS...');

        // Send real email using EmailJS
        const { emailService } = await import('./emailService');
        const emailSent = await emailService.sendPasswordResetEmail(
          userData.email,
          userData.firstName,
          userData.resetToken
        );

        if (!emailSent) {
          console.warn('⚠️ EmailJS failed, but reset token is valid. Check console for reset link.');
        } else {
          console.log('✅ Password reset email sent successfully via EmailJS!');
        }
      } else {
        console.log('✅ Password reset request processed. Check backend console for reset link.');
      }

    } catch (error: any) {
      console.error('Forgot password error:', error);
      throw error;
    }
  },

  // Send password reset email using EmailJS (for future use)
  sendPasswordResetEmailJS: async (email: string, firstName: string, resetToken: string): Promise<void> => {
    try {
      const { emailService } = await import('./emailService');
      const emailSent = await emailService.sendPasswordResetEmail(email, firstName, resetToken);

      if (!emailSent) {
        throw new Error('Failed to send password reset email');
      }

      console.log('✅ Password reset email sent via EmailJS to:', email);

    } catch (error: any) {
      console.error('Send password reset email error:', error);
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
  getStoredUser: (): IUser | null => {
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

// Named exports for convenience
export const {
  login,
  register,
  logout,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  getCurrentUser,
  isAuthenticated,
  getToken,
  clearAuth,
  refreshToken
} = authService;
