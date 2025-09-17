import { apiService } from './api';
import { IUser } from '../shared/types';

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initCodeClient: (config: any) => {
            requestCode: () => void;
          };
        };
      };
    };
  }
}

// Google OAuth configuration
const GOOGLE_CLIENT_ID = '192720000772-1qkm1i0lmg52b17vaslf0gm56lll3p0m.apps.googleusercontent.com';

export interface GoogleAuthResponse {
  success: boolean;
  requiresRoleSelection?: boolean;
  user?: IUser;
  token?: string;
  googleUserData?: {
    email: string;
    firstName: string;
    lastName: string;
    googleId: string;
    profilePicture: string;
    verified: boolean;
  };
  error?: string;
}

export interface GoogleCompleteRegistrationData {
  role: string;
  platform: string;
  googleUserData: {
    email: string;
    firstName: string;
    lastName: string;
    googleId: string;
    profilePicture: string;
    verified: boolean;
  };
}

export const googleAuthService = {
  // Initialize Google OAuth with postmessage flow
  initGoogleAuth: (): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!window.google) {
        reject(new Error('Google Identity Services not loaded'));
        return;
      }

      try {
        const client = window.google.accounts.oauth2.initCodeClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: 'openid email profile',
          ux_mode: 'popup',
          callback: (response: { code: string; error?: string }) => {
            if (response.error) {
              reject(new Error(response.error));
              return;
            }
            
            if (response.code) {
              resolve(response.code);
            } else {
              reject(new Error('No authorization code received'));
            }
          }
        });

        // Request the authorization code
        client.requestCode();
      } catch (error) {
        reject(error);
      }
    });
  },

  // Exchange authorization code for user data
  exchangeCodeForUser: async (authCode: string): Promise<GoogleAuthResponse> => {
    try {
      const response = await apiService.post<GoogleAuthResponse>('/auth/google/exchange-code', {
        code: authCode,
        platform: 'elearning'
      });

      if (response.success && response.data) {
        // If we get user + token, store them (existing user login)
        if (response.data.user && response.data.token) {
          localStorage.setItem('token', response.data.token);
          localStorage.setItem('user', JSON.stringify(response.data.user));
        }
        
        return response.data;
      }

      throw new Error(response.error || 'Failed to authenticate with Google');
    } catch (error: any) {
      console.error('Google authentication error:', error);
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error(error.message || 'Google authentication failed');
    }
  },

  // Complete registration for new users
  completeRegistration: async (registrationData: GoogleCompleteRegistrationData): Promise<GoogleAuthResponse> => {
    try {
      const response = await apiService.post<GoogleAuthResponse>('/auth/google/complete-registration', registrationData);

      if (response.success && response.data) {
        // Store user and token
        if (response.data.user && response.data.token) {
          localStorage.setItem('token', response.data.token);
          localStorage.setItem('user', JSON.stringify(response.data.user));
        }
        
        return response.data;
      }

      throw new Error(response.error || 'Failed to complete registration');
    } catch (error: any) {
      console.error('Google registration completion error:', error);
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error(error.message || 'Registration completion failed');
    }
  },

  // Full Google login/registration flow
  handleGoogleAuth: async (): Promise<GoogleAuthResponse> => {
    try {
      // Step 1: Get authorization code
      const authCode = await googleAuthService.initGoogleAuth();
      
      // Step 2: Exchange code for user data
      const result = await googleAuthService.exchangeCodeForUser(authCode);
      
      return result;
    } catch (error: any) {
      console.error('Google auth flow error:', error);
      throw error;
    }
  }
};