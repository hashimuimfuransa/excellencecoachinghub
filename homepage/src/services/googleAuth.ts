import { apiService } from './api';
import type { AuthResponse } from '../types/auth';

interface GoogleAuthConfig {
  clientId: string;
  redirectUri: string;
  scope: string;
}

interface GoogleUserInfo {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  locale: string;
}

class GoogleAuthService {
  private config: GoogleAuthConfig;

  constructor() {
    this.config = {
      clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
      redirectUri: window.location.origin,
      scope: 'openid email profile'
    };
  }

  // Generate Google OAuth URL
  private getGoogleAuthUrl(): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: this.config.scope,
      response_type: 'code',
      access_type: 'offline',
      prompt: 'consent'
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  // Open Google OAuth popup
  private openPopup(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const popup = window.open(
        url,
        'google-oauth',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );

      if (!popup) {
        reject(new Error('Failed to open popup. Please allow popups for this site.'));
        return;
      }

      // Check for popup close or success
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          reject(new Error('Authentication was cancelled'));
        }
      }, 1000);

      // Listen for messages from popup
      const messageListener = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) {
          return;
        }

        if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
          clearInterval(checkClosed);
          window.removeEventListener('message', messageListener);
          popup.close();
          resolve(event.data.code);
        } else if (event.data.type === 'GOOGLE_AUTH_ERROR') {
          clearInterval(checkClosed);
          window.removeEventListener('message', messageListener);
          popup.close();
          reject(new Error(event.data.error || 'Authentication failed'));
        }
      };

      window.addEventListener('message', messageListener);
    });
  }

  // Exchange code for tokens and get user info
  private async exchangeCodeForTokens(code: string): Promise<GoogleUserInfo> {
    try {
      // This would typically be done on the backend for security
      // For now, we'll send the code to our backend to handle the exchange
      const response = await apiService.post<{ userInfo: GoogleUserInfo }>('/auth/google/exchange', {
        code,
        redirectUri: this.config.redirectUri
      });

      if (response.success && response.data) {
        return response.data.userInfo;
      }

      throw new Error(response.error || 'Failed to exchange code for tokens');
    } catch (error: any) {
      throw new Error(error.message || 'Failed to get user information');
    }
  }

  // Main sign-in method
  async signIn(): Promise<AuthResponse> {
    try {
      if (!this.config.clientId) {
        throw new Error('Google Client ID not configured. Please add VITE_GOOGLE_CLIENT_ID to your .env file');
      }

      // Step 1: Get authorization code
      const authUrl = this.getGoogleAuthUrl();
      const code = await this.openPopup(authUrl);

      // Step 2: Exchange code for user info (via backend)
      const userInfo = await this.exchangeCodeForTokens(code);

      // Step 3: Authenticate with our backend
      const response = await apiService.post<AuthResponse>('/auth/google', {
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
}

export const googleAuthService = new GoogleAuthService();