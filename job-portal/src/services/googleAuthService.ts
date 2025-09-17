/**
 * Modern Google OAuth Authentication Service
 * Fixed for Google Identity Services & correct redirect URI
 */

import config from '../config/env';
import { apiPost } from './api';

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
  authProvider?: 'google' | 'local';
  registrationCompleted?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GoogleUserInfo {
  sub: string;           // Google ID
  name: string;
  given_name: string;
  family_name: string;
  email: string;
  picture: string;
  email_verified: boolean;
}

export interface AuthResult {
  success: boolean;
  user?: User;
  token?: string;
  requiresRoleSelection?: boolean;
  userData?: any;
  error?: string;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: any) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
            ux_mode?: 'popup' | 'redirect';
          }) => void;
          prompt: (momentListener?: (promptMoment: any) => void) => void;
          renderButton: (element: HTMLElement, options: any) => void;
          disableAutoSelect: () => void;
          revoke: (accessToken: string, done: () => void) => void;
        };
      };
    };
  }
}

class GoogleAuthService {
  private clientId: string;
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;

  constructor() {
    this.clientId = config.googleClientId;
    // Using postmessage flow - no redirect URIs needed!
    console.log('🚀 Using Google OAuth postmessage flow');
    console.log('🌍 Current hostname:', window.location.hostname);
  }

  /** Detect mobile devices */
  private isMobileDevice(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  /** Check popup support */
  private async testPopupSupport(): Promise<boolean> {
    try {
      return !!(window.open && !window.navigator.webdriver);
    } catch {
      return false;
    }
  }

  /** Load Google Identity Services script */
  private loadGoogleScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (window.google?.accounts?.oauth2 && window.google?.accounts?.id) return resolve();

      const existing = document.querySelector('script[src*="accounts.google.com/gsi/client"]');
      if (existing) {
        const waitForGoogle = () => {
          if (window.google?.accounts?.oauth2 && window.google?.accounts?.id) resolve();
          else setTimeout(waitForGoogle, 100);
        };
        waitForGoogle();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        const waitForGoogle = () => {
          if (window.google?.accounts?.oauth2 && window.google?.accounts?.id) resolve();
          else setTimeout(waitForGoogle, 100);
        };
        waitForGoogle();
      };
      script.onerror = (e) => reject(new Error('Failed to load Google Identity Services'));
      document.head.appendChild(script);
    });
  }

  /** Initialize Google Identity Services */
  private async initialize(): Promise<void> {
    if (this.isInitialized) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = this.loadGoogleScript();
    await this.initPromise;
    this.isInitialized = true;
  }

  /** Parse JWT from Google */
  private parseJWT(token: string): GoogleUserInfo {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch {
      throw new Error('Invalid Google token');
    }
  }

  /** Exchange authorization code for tokens */
  private async exchangeCodeForTokens(authorizationCode: string): Promise<AuthResult> {
    try {
      console.log('🔄 Exchanging authorization code for tokens...');
      const response = await apiPost('/auth/google/exchange-code', {
        code: authorizationCode,
        platform: 'job-portal'
      });

      if (response.success && response.data) {
        if (response.data.requiresRoleSelection) {
          return { 
            success: true, 
            requiresRoleSelection: true, 
            userData: response.data.googleUserData 
          };
        } else if (response.data.user && response.data.token) {
          localStorage.setItem('token', response.data.token);
          localStorage.setItem('user', JSON.stringify(response.data.user));
          return { 
            success: true, 
            user: response.data.user, 
            token: response.data.token, 
            requiresRoleSelection: false 
          };
        }
      }

      return { success: false, error: response.error || 'Token exchange failed' };
    } catch (error: any) {
      console.error('❌ Token exchange failed:', error);
      return { success: false, error: error.message || 'Failed to exchange authorization code' };
    }
  }

  /** Send Google user info to backend */
  private async processGoogleAuth(userInfo: GoogleUserInfo): Promise<AuthResult> {
    try {
      const response = await apiPost('/auth/google', { userInfo, platform: 'job-portal' });

      if (response.success && response.data) {
        if (response.data.requiresRoleSelection) {
          return { success: true, requiresRoleSelection: true, userData: response.data.googleUserData };
        } else if (response.data.user && response.data.token) {
          localStorage.setItem('token', response.data.token);
          localStorage.setItem('user', JSON.stringify(response.data.user));
          return { success: true, user: response.data.user, token: response.data.token, requiresRoleSelection: false };
        }
      }

      return { success: false, error: 'Unexpected response from Google authentication' };
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to process Google authentication' };
    }
  }

  /** Google sign-in using postmessage flow (no redirects needed) */
  public async signIn(): Promise<AuthResult> {
    try {
      await this.initialize();
      
      if (!window.google?.accounts?.oauth2) {
        return { success: false, error: 'Google OAuth Services not available' };
      }

      console.log('🔐 Starting Google OAuth postmessage flow...');
      
      return new Promise((resolve) => {
        const client = window.google.accounts.oauth2.initCodeClient({
          client_id: this.clientId,
          scope: 'openid email profile',
          ux_mode: 'popup',
          callback: async (response: any) => {
            try {
              if (response.code) {
                console.log('✅ Authorization code received');
                // Send the authorization code to backend
                const result = await this.exchangeCodeForTokens(response.code);
                resolve(result);
              } else if (response.error) {
                console.error('❌ OAuth error:', response.error);
                resolve({ success: false, error: response.error });
              } else {
                resolve({ success: false, error: 'No authorization code received' });
              }
            } catch (error: any) {
              console.error('❌ Token exchange error:', error);
              resolve({ success: false, error: error.message || 'Authentication failed' });
            }
          }
        });

        // Request the authorization code
        client.requestCode();
      });
    } catch (error: any) {
      console.error('❌ Authentication error:', error);
      return { success: false, error: error.message || 'Authentication failed' };
    }
  }

  /** Mobile sign-in using postmessage flow (same as desktop now) */
  public async signInMobile(): Promise<AuthResult> {
    console.log('📱 Using postmessage flow for mobile');
    // Use the same postmessage flow for mobile - it works better than redirects
    return this.signIn();
  }

  /** Handle callback after redirect (mobile flow) */
  public async handleOAuthCallback(): Promise<AuthResult | null> {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const storedState = localStorage.getItem('google_oauth_state');

    if (!code) return null;
    if (!state || state !== storedState) return { success: false, error: 'Invalid OAuth state parameter' };

    try {
      const response = await apiPost('/auth/google/callback', { code, redirectUri: this.redirectUri, platform: 'job-portal' });

      // Clean up state
      localStorage.removeItem('google_oauth_state');
      localStorage.removeItem('google_oauth_nonce');

      if (response.success && response.data) {
        if (response.data.requiresRoleSelection) {
          return { success: true, requiresRoleSelection: true, userData: response.data.googleUserData };
        } else if (response.data.user && response.data.token) {
          localStorage.setItem('token', response.data.token);
          localStorage.setItem('user', JSON.stringify(response.data.user));
          return { success: true, user: response.data.user, token: response.data.token, requiresRoleSelection: false };
        }
      }

      return { success: false, error: 'Invalid OAuth callback response' };
    } catch (error: any) {
      return { success: false, error: error.message || 'OAuth callback failed' };
    }
  }

  /** Sign out user */
  public signOut(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    if (window.google?.accounts?.id) window.google.accounts.id.disableAutoSelect();
  }

  /** Render Google sign-in button in any container */
  public async renderButton(containerElement: HTMLElement): Promise<void> {
    await this.initialize();
    if (!window.google?.accounts?.id) throw new Error('Google Identity Services not available');

    containerElement.innerHTML = '';
    window.google.accounts.id.initialize({
      client_id: this.clientId,
      callback: async (response) => {
        if (!response.credential) return;
        const userInfo = this.parseJWT(response.credential);
        await this.processGoogleAuth(userInfo);
      },
      auto_select: false,
      cancel_on_tap_outside: false
    });

    window.google.accounts.id.renderButton(containerElement, {
      theme: 'outline',
      size: 'large',
      text: 'continue_with',
      shape: 'rectangular',
      logo_alignment: 'left',
      width: '100%'
    });
  }

  /** Create mobile sign-in button - alias for renderButton for backwards compatibility */
  public async createMobileButton(element: HTMLElement): Promise<AuthResult> {
    return new Promise(async (resolve) => {
      try {
        await this.initialize();
        if (!window.google?.accounts?.id) {
          resolve({ success: false, error: 'Google Identity Services not available' });
          return;
        }

        element.innerHTML = '';
        window.google.accounts.id.initialize({
          client_id: this.clientId,
          callback: async (response) => {
            if (!response.credential) {
              resolve({ success: false, error: 'No credential received' });
              return;
            }
            const userInfo = this.parseJWT(response.credential);
            const result = await this.processGoogleAuth(userInfo);
            resolve(result);
          },
          auto_select: false,
          cancel_on_tap_outside: false
        });

        window.google.accounts.id.renderButton(element, {
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'rectangular',
          logo_alignment: 'left',
          width: '100%'
        });
      } catch (error: any) {
        resolve({ success: false, error: error.message || 'Failed to create mobile button' });
      }
    });
  }

  /** Complete registration with role selection */
  public async completeRegistration(userData: any, role: string): Promise<AuthResult> {
    try {
      const response = await apiPost('/auth/google/complete-registration', {
        ...userData,
        role,
        platform: 'job-portal'
      });

      if (response.success && response.data) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        return { success: true, user: response.data.user, token: response.data.token };
      }

      return { success: false, error: response.error || 'Registration completion failed' };
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to complete registration' };
    }
  }

  /** Get mobile popup instructions */
  public getMobilePopupInstructions(): string {
    return `📱 Enable Popups on Mobile:
1. Open your browser settings
2. Find "Site Settings" or "Permissions"  
3. Look for "Pop-ups" or "Pop-ups and redirects"
4. Set to "Allow" for this site
5. Return here and try Google sign-in again`;
  }
}

// Export singleton
export const googleAuthService = new GoogleAuthService();
export default googleAuthService;
