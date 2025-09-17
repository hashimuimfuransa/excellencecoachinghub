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



  /** Validate Google ID token with backend */
  private async validateGoogleIdToken(idToken: string): Promise<AuthResult> {
    try {
      console.log('🔄 Validating Google ID token with backend...');
      const response = await apiPost('/auth/google/exchange-code', {
        idToken: idToken,
        platform: 'job-portal'
      });

      console.log('🔍 Backend response:', response);
      console.log('🔍 Response success:', response.success);
      console.log('🔍 Response data:', response.data);

      if (response.success) {
        // For new users requiring role selection
        if (response.data && response.data.requiresRoleSelection) {
          console.log('🆕 New user - role selection required');
          return { 
            success: true, 
            requiresRoleSelection: true, 
            userData: response.data.googleUserData 
          };
        }
        // For existing users (login)
        else if (response.data && response.data.user && response.data.token) {
          console.log('✅ Existing user - logging in');
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

      return { success: false, error: response.error || 'ID token validation failed' };
    } catch (error: any) {
      console.error('❌ ID token validation failed:', error);
      return { success: false, error: error.message || 'Failed to validate Google ID token' };
    }
  }



  /** Google sign-in using ID token flow (no redirects needed) */
  public async signIn(): Promise<AuthResult> {
    try {
      await this.initialize();
      
      if (!window.google?.accounts?.id) {
        return { success: false, error: 'Google Identity Services not available' };
      }

      console.log('🔐 Starting Google ID token authentication...');
      
      return new Promise((resolve) => {
        // Initialize Google Sign-In
        window.google.accounts.id.initialize({
          client_id: this.clientId,
          callback: async (response: any) => {
            try {
              if (response.credential) {
                console.log('✅ Google ID token received');
                // Validate the ID token with our backend
                const result = await this.validateGoogleIdToken(response.credential);
                resolve(result);
              } else {
                console.error('❌ No credential received from Google');
                resolve({ success: false, error: 'No credential received from Google' });
              }
            } catch (error: any) {
              console.error('❌ Authentication error:', error);
              resolve({ success: false, error: error.message || 'Authentication failed' });
            }
          },
          auto_select: false,
          cancel_on_tap_outside: false
        });

        // Try One Tap first
        window.google.accounts.id.prompt((notification: any) => {
          console.log('One Tap notification:', notification);
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            // If One Tap fails, show manual button
            console.log('One Tap not available, showing manual button');
            this.renderSignInButton();
          }
        });
      });
    } catch (error: any) {
      console.error('❌ Google Sign-In initialization error:', error);
      return { success: false, error: error.message || 'Failed to initialize Google Sign-In' };
    }
  }

  /** Mobile sign-in using ID token flow (same as desktop now) */
  public async signInMobile(): Promise<AuthResult> {
    console.log('📱 Using ID token flow for mobile');
    // Use the same ID token flow for mobile - it works better than redirects
    return this.signIn();
  }



  /** Sign out user */
  public signOut(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    if (window.google?.accounts?.id) window.google.accounts.id.disableAutoSelect();
  }

  /** Render a temporary sign-in button when One Tap is not available */
  private renderSignInButton(): void {
    // Create a temporary container for the sign-in button if not exists
    let buttonContainer = document.getElementById('google-signin-button-temp');
    if (!buttonContainer) {
      buttonContainer = document.createElement('div');
      buttonContainer.id = 'google-signin-button-temp';
      buttonContainer.style.position = 'fixed';
      buttonContainer.style.top = '50%';
      buttonContainer.style.left = '50%';
      buttonContainer.style.transform = 'translate(-50%, -50%)';
      buttonContainer.style.zIndex = '10000';
      buttonContainer.style.padding = '20px';
      buttonContainer.style.backgroundColor = 'white';
      buttonContainer.style.borderRadius = '8px';
      buttonContainer.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
      document.body.appendChild(buttonContainer);
    }

    window.google.accounts.id.renderButton(buttonContainer, {
      theme: 'outline',
      size: 'large',
      type: 'standard',
      shape: 'rectangular',
      text: 'signin_with',
      width: '300'
    });

    // Auto-remove after 10 seconds
    setTimeout(() => {
      const container = document.getElementById('google-signin-button-temp');
      if (container) container.remove();
    }, 10000);
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
        await this.validateGoogleIdToken(response.credential);
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
            const result = await this.validateGoogleIdToken(response.credential);
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
