import { apiService } from './api';
import { AuthResponse } from './authService';
import { simpleGoogleAuth } from './googleAuthSimple';

// Google OAuth types
declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (config: GoogleInitConfig) => void;
          renderButton: (element: HTMLElement, config: GoogleButtonConfig) => void;
          prompt: () => void;
          disableAutoSelect: () => void;
        };
        oauth2: {
          initTokenClient: (config: GoogleTokenClientConfig) => GoogleTokenClient;
        };
      };
    };
  }
}

interface GoogleTokenClient {
  requestAccessToken: (overrideConfig?: { prompt?: string }) => void;
  callback?: (response: GoogleTokenResponse) => void;
}

interface GoogleTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
  error?: string;
  error_description?: string;
}

interface GoogleInitConfig {
  client_id: string;
  callback: (response: GoogleCredentialResponse) => void;
  auto_select?: boolean;
  cancel_on_tap_outside?: boolean;
}

interface GoogleTokenClientConfig {
  client_id: string;
  scope: string;
  callback: (response: GoogleTokenResponse) => void;
}

interface GoogleButtonConfig {
  theme?: 'outline' | 'filled_blue' | 'filled_black';
  size?: 'large' | 'medium' | 'small';
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
  shape?: 'rectangular' | 'pill' | 'circle' | 'square';
  logo_alignment?: 'left' | 'center';
  width?: string;
  locale?: string;
}

interface GoogleCredentialResponse {
  credential: string;
  select_by?: string;
}

interface SocialAuthResponse {
  provider: 'google';
  token: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    picture?: string;
  };
}

class SocialAuthService {
  private googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
  private isGoogleLoaded = false;

  // Initialize Google OAuth
  initializeGoogle(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isGoogleLoaded) {
        resolve();
        return;
      }

      if (!this.googleClientId) {
        reject(new Error('Google Client ID not configured. Please add VITE_GOOGLE_CLIENT_ID to your .env file'));
        return;
      }

      // Load Google Identity Services script
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        if (window.google && window.google.accounts) {
          this.isGoogleLoaded = true;
          resolve();
        } else {
          reject(new Error('Failed to load Google Identity Services'));
        }
      };
      
      script.onerror = () => {
        reject(new Error('Failed to load Google Identity Services script'));
      };
      
      document.head.appendChild(script);
    });
  }



  // Google Sign In using simplified approach
  async signInWithGoogle(): Promise<AuthResponse> {
    try {
      // Use the simple Google auth service
      return await simpleGoogleAuth.signInWithGSI();
    } catch (error: any) {
      throw new Error(`Google sign-in failed: ${error.message || 'Unknown error'}`);
    }
  }

  // Get user info from Google API
  private async getUserInfo(accessToken: string): Promise<any> {
    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to get user info from Google');
      }
      
      return await response.json();
    } catch (error) {
      throw new Error('Failed to retrieve user information from Google');
    }
  }



  // Handle Google OAuth callback
  private async handleGoogleOAuthCallback(accessToken: string, userInfo: any): Promise<AuthResponse> {
    try {
      const response = await apiService.post<AuthResponse>('/auth/google', {
        accessToken,
        userInfo
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
      
      throw new Error(response.error || 'Google authentication failed');
    } catch (error: any) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.message) {
        throw new Error(error.message);
      } else {
        throw new Error('Google authentication failed. Please try again.');
      }
    }
  }

  // Legacy method for JWT credential (keeping for backward compatibility)
  private async handleGoogleCallback(credential: string): Promise<AuthResponse> {
    try {
      const response = await apiService.post<AuthResponse>('/auth/google', {
        credential
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
      
      throw new Error(response.error || 'Google authentication failed');
    } catch (error: any) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.message) {
        throw new Error(error.message);
      } else {
        throw new Error('Google authentication failed. Please try again.');
      }
    }
  }



  // Render Google Sign-In Button
  renderGoogleButton(element: HTMLElement, config?: Partial<GoogleButtonConfig>): void {
    if (!this.isGoogleLoaded) {
      console.error('Google Identity Services not loaded');
      return;
    }

    const defaultConfig: GoogleButtonConfig = {
      theme: 'outline',
      size: 'large',
      text: 'continue_with',
      shape: 'rectangular',
      logo_alignment: 'left',
      width: '100%'
    };

    window.google.accounts.id.renderButton(element, { ...defaultConfig, ...config });
  }


}

export const socialAuthService = new SocialAuthService();