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
  private redirectUri: string;

  constructor() {
    this.clientId = config.googleClientId;
    // Set redirect URI based on current environment and what's configured in Google Cloud Console
    const hostname = window.location.hostname;
    const origin = window.location.origin;
    
    if (hostname === 'exjobnet.com') {
      // Production - use HTTPS without www
      this.redirectUri = 'https://exjobnet.com/login';
    } else if (hostname === 'www.exjobnet.com') {
      // Production with www - redirect to non-www
      this.redirectUri = 'https://www.exjobnet.com/login';
    } else if (hostname === 'localhost') {
      // Development environment - use exact port and protocol
      const port = window.location.port;
      if (port === '3000') {
        this.redirectUri = 'http://localhost:3000/login';
      } else if (port === '5173') {
        this.redirectUri = 'http://localhost:5173/login';
      } else {
        this.redirectUri = `${origin}/login`;
      }
    } else {
      // Fallback for other domains
      this.redirectUri = `${origin}/login`;
    }
    console.log('🔗 OAuth Redirect URI:', this.redirectUri);
    console.log('🌍 Current hostname:', hostname);
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
      if (window.google?.accounts?.id) return resolve();

      const existing = document.querySelector('script[src*="accounts.google.com/gsi/client"]');
      if (existing) {
        const waitForGoogle = () => {
          if (window.google?.accounts?.id) resolve();
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
          if (window.google?.accounts?.id) resolve();
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

  /** Desktop sign-in (popup / One Tap) */
  public async signIn(): Promise<AuthResult> {
    await this.initialize();
    if (!window.google?.accounts?.id) return { success: false, error: 'Google Identity Services not available' };

    const isMobile = this.isMobileDevice();
    if (isMobile) return this.signInMobile();

    return new Promise<AuthResult>((resolve) => {
      try {
        window.google!.accounts.id.initialize({
          client_id: this.clientId,
          callback: async (response) => {
            if (!response.credential) return resolve({ success: false, error: 'No credential received' });
            const userInfo = this.parseJWT(response.credential);
            const result = await this.processGoogleAuth(userInfo);
            resolve(result);
          },
          auto_select: false,
          cancel_on_tap_outside: false,
          ux_mode: 'popup'
        });

        window.google!.accounts.id.prompt(); // Show One Tap / popup

      } catch (error: any) {
        resolve({ success: false, error: error.message || 'Failed to initialize Google sign-in' });
      }
    });
  }

  /** Mobile sign-in using redirect flow */
  public async signInMobile(): Promise<AuthResult> {
    await this.initialize();
    if (!window.google?.accounts?.id) return { success: false, error: 'Google Identity Services not available' };

    return new Promise<AuthResult>((resolve) => {
      try {
        // Store state for verification
        const state = Math.random().toString(36).substring(2);
        const nonce = Math.random().toString(36).substring(2);
        localStorage.setItem('google_oauth_state', state);
        localStorage.setItem('google_oauth_nonce', nonce);

        const scope = encodeURIComponent('openid email profile');
        const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
          `client_id=${encodeURIComponent(this.clientId)}` +
          `&redirect_uri=${encodeURIComponent(this.redirectUri)}` +
          `&response_type=code` +
          `&scope=${scope}` +
          `&state=${state}` +
          `&nonce=${nonce}` +
          `&access_type=online` +
          `&include_granted_scopes=true`;

        // Redirect to Google
        window.location.href = googleAuthUrl;

      } catch (error: any) {
        resolve({ success: false, error: error.message || 'Failed to initiate mobile Google sign-in' });
      }
    });
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
