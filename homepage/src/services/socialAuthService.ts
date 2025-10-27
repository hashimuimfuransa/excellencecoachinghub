import type { AuthResponse, User } from '../types/auth';

// Google Identity Services types
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

export interface AuthResult {
  success: boolean;
  user?: User;
  token?: string;
  requiresRoleSelection?: boolean;
  userData?: any;
  error?: string;
}

class SocialAuthService {
  private googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;

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
      script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
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

  // Initialize Google OAuth (legacy method for compatibility)
  initializeGoogle(): Promise<void> {
    return this.initialize();
  }

  /** Validate Google ID token with backend */
  private async validateGoogleIdToken(idToken: string): Promise<AuthResult> {
    try {
      console.log('🔄 Validating Google ID token with backend...');
      
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${apiUrl}/auth/google/exchange-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idToken: idToken,
          platform: 'homepage'
        }),
      });

      const responseData = await response.json();
      console.log('🔍 Backend response:', responseData);

      if (responseData.success) {
        // For new users requiring role selection
        if (responseData.data && responseData.data.requiresRoleSelection) {
          console.log('🆕 New user - role selection required');
          return { 
            success: true, 
            requiresRoleSelection: true, 
            userData: responseData.data.googleUserData 
          };
        }
        // For existing users (login)
        else if (responseData.data && responseData.data.user && responseData.data.token) {
          console.log('✅ Existing user - logging in');
          localStorage.setItem('token', responseData.data.token);
          localStorage.setItem('user', JSON.stringify(responseData.data.user));
          return { 
            success: true, 
            user: responseData.data.user, 
            token: responseData.data.token, 
            requiresRoleSelection: false 
          };
        }
      }

      return { success: false, error: responseData.error || 'ID token validation failed' };
    } catch (error: any) {
      console.error('❌ ID token validation failed:', error);
      return { success: false, error: error.message || 'Failed to validate Google ID token' };
    }
  }

  // Google Sign In using Google Identity Services
  async signInWithGoogle(): Promise<AuthResponse> {
    try {
      await this.initialize();
      
      if (!window.google?.accounts?.id) {
        throw new Error('Google Identity Services not available');
      }

      if (!this.googleClientId) {
        throw new Error('Google Client ID not configured. Please add VITE_GOOGLE_CLIENT_ID to your .env file');
      }

      console.log('🔐 Starting Google ID token authentication...');
      
      return new Promise((resolve, reject) => {
        if (!window.google?.accounts?.id) {
          reject(new Error('Google Identity Services not available'));
          return;
        }
        
        // Initialize Google Sign-In
        window.google.accounts.id.initialize({
          client_id: this.googleClientId,
          callback: async (response: any) => {
            try {
              if (response.credential) {
                console.log('✅ Google ID token received');
                // Validate the ID token with our backend
                const result = await this.validateGoogleIdToken(response.credential);
                
                if (result.success) {
                  // Convert to AuthResponse format
                  const authResponse: AuthResponse = {
                    user: result.user || null,
                    token: result.token || '',
                    refreshToken: undefined,
                    requiresRoleSelection: result.requiresRoleSelection,
                    googleUserData: result.userData
                  };
                  resolve(authResponse);
                } else {
                  reject(new Error(result.error || 'Authentication failed'));
                }
              } else {
                console.error('❌ No credential received from Google');
                reject(new Error('No credential received from Google'));
              }
            } catch (error: any) {
              console.error('❌ Authentication error:', error);
              reject(error);
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
            this.renderSignInButton(resolve, reject);
          }
        });
      });
    } catch (error: any) {
      console.error('❌ Google Sign-In initialization error:', error);
      throw error;
    }
  }

  /** Render a temporary sign-in button when One Tap is not available */
  private renderSignInButton(_resolve: (value: AuthResponse) => void, reject: (reason?: any) => void): void {
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

      // Add close button
      const closeButton = document.createElement('button');
      closeButton.textContent = '×';
      closeButton.style.position = 'absolute';
      closeButton.style.top = '5px';
      closeButton.style.right = '10px';
      closeButton.style.background = 'none';
      closeButton.style.border = 'none';
      closeButton.style.fontSize = '20px';
      closeButton.style.cursor = 'pointer';
      closeButton.onclick = () => {
        buttonContainer?.remove();
        reject(new Error('Google sign-in cancelled by user'));
      };
      buttonContainer.appendChild(closeButton);

      // Add title
      const title = document.createElement('div');
      title.textContent = 'Sign in with Google';
      title.style.marginBottom = '15px';
      title.style.fontWeight = 'bold';
      title.style.textAlign = 'center';
      buttonContainer.appendChild(title);
    }

    if (!window.google?.accounts?.id) {
      reject(new Error('Google Identity Services not available'));
      return;
    }

    window.google.accounts.id.renderButton(buttonContainer, {
      theme: 'outline',
      size: 'large',
      type: 'standard',
      shape: 'rectangular',
      text: 'signin_with',
      width: '300'
    });

    // Auto-remove after 30 seconds
    setTimeout(() => {
      const container = document.getElementById('google-signin-button-temp');
      if (container) {
        container.remove();
        reject(new Error('Google sign-in timeout'));
      }
    }, 30000);
  }

  /** Complete registration with role selection */
  async completeRegistration(userData: any, role: string): Promise<AuthResult> {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${apiUrl}/auth/google/complete-registration`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...userData,
          role,
          platform: 'homepage'
        }),
      });

      const responseData = await response.json();

      if (responseData.success && responseData.data) {
        localStorage.setItem('token', responseData.data.token);
        localStorage.setItem('user', JSON.stringify(responseData.data.user));
        return { success: true, user: responseData.data.user, token: responseData.data.token };
      }

      return { success: false, error: responseData.error || 'Registration completion failed' };
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to complete registration' };
    }
  }
}

export const socialAuthService = new SocialAuthService();