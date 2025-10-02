import { apiService } from './api';
import { IUser } from '../shared/types';

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

// Google OAuth configuration - use environment variable or fallback
// Note: CRA uses process.env, not import.meta.env
const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || '192720000772-1qkm1i0lmg52b17vaslf0gm56lll3p0m.apps.googleusercontent.com';

// Rate limiting for Google auth requests
let lastGoogleAuthRequest = 0;
const GOOGLE_AUTH_COOLDOWN = 5000; // 5 seconds between requests

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
  email: string;
  firstName: string;
  lastName: string;
  googleId: string;
  googleUserData: {
    email: string;
    firstName: string;
    lastName: string;
    googleId: string;
    profilePicture: string;
    verified: boolean;
    platform?: string;
  };
}

class GoogleAuthService {
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;

  constructor() {
    console.log('🚀 E-learning Google Auth Service initialized');
    console.log('🌍 Current hostname:', window.location.hostname);
    console.log('🔧 Google Client ID:', GOOGLE_CLIENT_ID ? `${GOOGLE_CLIENT_ID.substring(0, 20)}...` : 'NOT SET');
    
    // Check for OAuth configuration issues
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      console.warn('⚠️ OAUTH WARNING: Running on localhost may cause Google OAuth issues');
      console.warn('💡 Solutions:');
      console.warn('   1. Configure Google OAuth for localhost in Google Console:');
      console.warn('      - Go to: https://console.cloud.google.com/');
      console.warn('      - Navigate to: APIs & Services > Credentials');
      console.warn('      - Edit your OAuth 2.0 Client ID');
      console.warn('      - Add to Authorized JavaScript origins:');
      console.warn('        * http://localhost:3000');
      console.warn('        * http://127.0.0.1:3000');
      console.warn('   2. Use a tunnel service like ngrok for testing');
      console.warn('   3. Use a production domain for testing');
      
      // Check if using the hardcoded client ID
      if (GOOGLE_CLIENT_ID === '192720000772-1qkm1i0lmg52b17vaslf0gm56lll3p0m.apps.googleusercontent.com') {
        console.warn('⚠️ Using hardcoded Google Client ID - this may not be configured for localhost');
        console.warn('💡 Create a .env file in the elearning directory with:');
        console.warn('   REACT_APP_GOOGLE_CLIENT_ID=your_actual_client_id_here');
      }
    }
  }

  /** Wait for Google Identity Services script to load */
  private waitForGoogleScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (window.google?.accounts?.id) {
        console.log('✅ Google Identity Services already loaded');
        return resolve();
      }

      console.log('🔍 Checking for Google script in DOM...');
      
      // Check if script is already in the DOM (loaded statically)
      const existingScript = document.querySelector('script[src*="accounts.google.com/gsi/client"]');
      if (existingScript) {
        console.log('📜 Google script found in DOM, waiting for it to load...');
        let attempts = 0;
        const maxAttempts = 50; // 5 seconds max wait
        
        const waitForGoogle = () => {
          attempts++;
          if (window.google?.accounts?.id) {
            console.log('✅ Google Identity Services loaded successfully');
            resolve();
          } else if (attempts >= maxAttempts) {
            console.error('❌ Google Identity Services failed to load after 5 seconds');
            reject(new Error('Google Identity Services failed to load. Please check your internet connection and try again.'));
          } else {
            setTimeout(waitForGoogle, 100);
          }
        };
        waitForGoogle();
        return;
      }

      // If no script found, try to add it dynamically as fallback
      console.warn('⚠️ Google script not found in DOM, attempting to load dynamically...');
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        console.log('📜 Google script loaded dynamically, waiting for initialization...');
        let attempts = 0;
        const maxAttempts = 50;
        
        const waitForGoogle = () => {
          attempts++;
          if (window.google?.accounts?.id) {
            console.log('✅ Google Identity Services loaded successfully');
            resolve();
          } else if (attempts >= maxAttempts) {
            console.error('❌ Google Identity Services failed to initialize after dynamic load');
            reject(new Error('Google Identity Services failed to initialize. Please refresh the page and try again.'));
          } else {
            setTimeout(waitForGoogle, 100);
          }
        };
        waitForGoogle();
      };
      script.onerror = (e) => {
        console.error('❌ Failed to load Google script dynamically:', e);
        reject(new Error('Failed to load Google Identity Services. Please check your internet connection.'));
      };
      document.head.appendChild(script);
    });
  }

  /** Initialize Google Identity Services */
  private async initialize(): Promise<void> {
    if (this.isInitialized) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = this.waitForGoogleScript();
    await this.initPromise;
    this.isInitialized = true;
  }

  /** Validate Google ID token with backend */
  private async validateGoogleIdToken(idToken: string): Promise<GoogleAuthResponse> {
    try {
      console.log('🔄 Validating Google ID token with backend...');
      
      // Add retry logic for rate limiting
      let retries = 5; // Increased retries
      let lastError: any;
      
      while (retries > 0) {
        try {
          const response = await apiService.post<GoogleAuthResponse>('/auth/google/exchange-code', {
            idToken: idToken,
            platform: 'elearning'
          });

          console.log('🔍 Backend response:', response);

          if (response.success && response.data) {
            // For new users requiring role selection
            if (response.data.requiresRoleSelection) {
              console.log('🆕 New user - role selection required');
              return { 
                success: true, 
                requiresRoleSelection: true, 
                googleUserData: response.data.googleUserData 
              };
            }
            // For existing users (login)
            else if (response.data.user && response.data.token) {
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
          lastError = error;
          
          // Check if it's a rate limiting error
          if (error?.response?.status === 429 || error?.message?.includes('429') || error?.message?.includes('Too Many Requests')) {
            const waitTime = Math.min(1000 * Math.pow(2, 5 - retries), 10000); // Max 10 seconds
            console.warn(`⚠️ Rate limited, retrying in ${waitTime/1000} seconds... (${retries} attempts left)`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            retries--;
            continue;
          }
          
          // For other errors, don't retry
          throw error;
        }
      }
      
      // If we've exhausted retries, return a user-friendly error
      console.error('❌ All retry attempts failed for rate limiting');
      return { 
        success: false, 
        error: 'Server is currently busy. Please wait a moment and try again.' 
      };
    } catch (error: any) {
      console.error('❌ ID token validation failed:', error);
      return { success: false, error: error.message || 'Failed to validate Google ID token' };
    }
  }

  /** Google sign-in using ID token flow (no redirects needed) */
  public async handleGoogleAuth(): Promise<GoogleAuthResponse> {
    try {
      // Rate limiting check
      const now = Date.now();
      if (now - lastGoogleAuthRequest < GOOGLE_AUTH_COOLDOWN) {
        const remainingTime = Math.ceil((GOOGLE_AUTH_COOLDOWN - (now - lastGoogleAuthRequest)) / 1000);
        return { 
          success: false, 
          error: `Please wait ${remainingTime} seconds before trying again. Rate limiting protection.` 
        };
      }
      lastGoogleAuthRequest = now;

      await this.initialize();
      
      if (!window.google?.accounts?.id) {
        return { success: false, error: 'Google Identity Services not available' };
      }

      console.log('🔐 Starting Google ID token authentication...');
      
      return new Promise((resolve) => {
        // Initialize Google Sign-In with better error handling
        try {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
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
            cancel_on_tap_outside: false,
            // Add better error handling
            error_callback: (error: any) => {
              console.error('❌ Google OAuth error:', error);
              if (error.type === 'popup_closed_by_user') {
                resolve({ success: false, error: 'Sign-in was cancelled' });
              } else if (error.type === 'popup_blocked') {
                resolve({ success: false, error: 'Popup was blocked. Please allow popups for this site.' });
              } else {
                resolve({ success: false, error: `Google OAuth error: ${error.type || 'Unknown error'}` });
              }
            }
          });

          // Skip One Tap to avoid FedCM/CORS issues and go directly to manual button
          console.log('🚫 Skipping One Tap to avoid FedCM/CORS issues, showing manual button');
          this.renderSignInButton();
        } catch (initError: any) {
          console.error('❌ Google initialization error:', initError);
          resolve({ 
            success: false, 
            error: `Failed to initialize Google Sign-In: ${initError.message || 'Unknown error'}` 
          });
        }
      });
    } catch (error: any) {
      console.error('❌ Google Sign-In initialization error:', error);
      return { success: false, error: error.message || 'Failed to initialize Google Sign-In' };
    }
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
      buttonContainer.style.border = '1px solid #dadce0';
      document.body.appendChild(buttonContainer);
    }

    // Clear any existing content
    buttonContainer.innerHTML = '';

    try {
      window.google.accounts.id.renderButton(buttonContainer, {
        theme: 'outline',
        size: 'large',
        type: 'standard',
        shape: 'rectangular',
        text: 'signin_with',
        width: '300'
      });
    } catch (error) {
      console.error('Failed to render Google button:', error);
      // Fallback: create a simple button that triggers the auth flow
      buttonContainer.innerHTML = `
        <button onclick="window.google.accounts.id.prompt()" 
                style="padding: 12px 24px; background: #4285f4; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;">
          Continue with Google
        </button>
      `;
    }

    // Auto-remove after 30 seconds (increased from 10)
    setTimeout(() => {
      const container = document.getElementById('google-signin-button-temp');
      if (container) container.remove();
    }, 30000);
  }

  /** Complete registration for new users */
  public async completeRegistration(registrationData: GoogleCompleteRegistrationData): Promise<GoogleAuthResponse> {
    try {
      console.log('🔍 Google Auth Service - Complete registration data:', registrationData);
      const response = await apiService.post<GoogleAuthResponse>('/auth/google/complete-registration', registrationData);
      console.log('🔍 Google Auth Service - Backend response:', response);

      if (response.success && response.data) {
        console.log('🔍 Google Auth Service - Response user:', response.data.user);
        console.log('🔍 Google Auth Service - Response user role:', response.data.user?.role);
        
        // Store user and token
        if (response.data.user && response.data.token) {
          localStorage.setItem('token', response.data.token);
          localStorage.setItem('user', JSON.stringify(response.data.user));
          console.log('🔍 Google Auth Service - Stored user in localStorage:', response.data.user);
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
  }
}

// Export singleton instance
const googleAuthService = new GoogleAuthService();

// Export both named and default exports
export { googleAuthService };
export default googleAuthService;