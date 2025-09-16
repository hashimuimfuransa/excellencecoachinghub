/**
 * Modern Google OAuth Authentication Service
 * Clean, reliable implementation using Google Identity Services
 * Integrates with the same backend API as local authentication
 */

import config from '../config/env';
import { apiPost } from './api';

// Types that match local auth service
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
  name: string;          // Full name
  given_name: string;    // First name
  family_name: string;   // Last name
  email: string;         // Email address
  picture: string;       // Profile picture URL
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
  }

  /**
   * Initialize Google Identity Services
   */
  private async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this.loadGoogleScript();
    await this.initPromise;
    this.isInitialized = true;
  }

  /**
   * Load Google Identity Services script
   */
  private loadGoogleScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Check if script already exists
      const existingScript = document.querySelector('script[src*="accounts.google.com/gsi/client"]');
      
      if (existingScript) {
        if (window.google?.accounts?.id) {
          console.log('✅ Google Identity Services already loaded');
          resolve();
        } else {
          // Script exists but not loaded yet, wait a bit longer
          let attempts = 0;
          const checkGoogle = () => {
            attempts++;
            if (window.google?.accounts?.id) {
              console.log('✅ Google Identity Services loaded after wait');
              resolve();
            } else if (attempts > 50) { // 5 seconds max wait
              reject(new Error('Google script loaded but services not available after 5 seconds'));
            } else {
              setTimeout(checkGoogle, 100);
            }
          };
          checkGoogle();
        }
        return;
      }

      console.log('📡 Loading Google Identity Services script...');
      
      // Create and load script
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        console.log('📦 Google script loaded, waiting for services...');
        // Wait for Google services to be available
        let attempts = 0;
        const checkGoogle = () => {
          attempts++;
          if (window.google?.accounts?.id) {
            console.log('✅ Google Identity Services ready');
            resolve();
          } else if (attempts > 100) { // 10 seconds max wait
            reject(new Error('Google services not available after 10 seconds'));
          } else {
            setTimeout(checkGoogle, 100);
          }
        };
        checkGoogle();
      };
      
      script.onerror = (error) => {
        console.error('❌ Failed to load Google Identity Services script:', error);
        reject(new Error('Failed to load Google Identity Services'));
      };
      
      document.head.appendChild(script);
    });
  }

  /**
   * Parse JWT token to extract user information
   */
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
    } catch (error) {
      console.error('❌ Failed to parse Google JWT:', error);
      throw new Error('Invalid Google token');
    }
  }

  /**
   * Process Google authentication response using backend API
   */
  private async processGoogleAuth(googleUserInfo: GoogleUserInfo): Promise<AuthResult> {
    try {
      console.log('🌐 Processing Google auth for:', googleUserInfo.email);
      
      // Call the backend Google auth endpoint with the credential
      const response = await apiPost('/auth/google', {
        userInfo: googleUserInfo,
        platform: 'job-portal'
      });
      
      // The response from apiPost is already the JSON data from the backend
      console.log('🔍 Google auth response:', response);
      console.log('🔍 Google auth response structure keys:', Object.keys(response));
      
      // Log each key and its value to understand the structure
      Object.keys(response).forEach(key => {
        console.log(`🔍 response.${key}:`, response[key]);
      });
      
      if (response.success && response.data) {
        if (response.data.requiresRoleSelection) {
          // New user needs role selection
          console.log('🔄 New user requires role selection');
          return {
            success: true,
            requiresRoleSelection: true,
            userData: response.data.googleUserData
          };
        } else if (response.data.user && response.data.token) {
          // Existing user - they are logged in via sendTokenResponse
          localStorage.setItem('token', response.data.token);
          localStorage.setItem('user', JSON.stringify(response.data.user));
          
          console.log('✅ Existing Google user logged in:', response.data.user.email);
          
          return {
            success: true,
            user: response.data.user,
            token: response.data.token,
            requiresRoleSelection: false
          };
        }
      }
      
      return {
        success: false,
        error: 'Unexpected response from Google authentication'
      };
      
    } catch (error) {
      console.error('❌ Error processing Google auth:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process Google authentication'
      };
    }
  }

  /**
   * Detect if the user is on a mobile device
   */
  private isMobileDevice(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           (window.innerWidth <= 768 && 'ontouchstart' in window);
  }

  /**
   * Main sign-in method - Mobile-optimized with popup fallback
   */
  public async signIn(): Promise<AuthResult> {
    try {
      if (!this.clientId) {
        return {
          success: false,
          error: 'Google Client ID not configured'
        };
      }

      await this.initialize();

      if (!window.google?.accounts?.id) {
        return {
          success: false,
          error: 'Google Identity Services not available'
        };
      }

      const isMobile = this.isMobileDevice();
      console.log(`🔍 Device type: ${isMobile ? 'Mobile' : 'Desktop'}`);

      if (isMobile) {
        // For mobile devices, use a more direct approach with better popup handling
        return this.signInWithMobileOptimizedPopup();
      } else {
        // For desktop, use the standard GIS popup
        return this.signInWithGISPopup();
      }

    } catch (error) {
      console.error('❌ Google sign-in error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Google sign-in failed'
      };
    }
  }

  /**
   * Mobile-optimized sign-in with better mobile handling
   */
  private async signInWithMobileOptimizedPopup(): Promise<AuthResult> {
    return new Promise<AuthResult>((resolve) => {
      try {
        // Initialize Google Identity Services with mobile-friendly settings
        window.google!.accounts.id.initialize({
          client_id: this.clientId,
          callback: async (response) => {
            try {
              if (!response.credential) {
                resolve({
                  success: false,
                  error: 'No credential received from Google'
                });
                return;
              }

              const userInfo = this.parseJWT(response.credential);
              const result = await this.processGoogleAuth(userInfo);
              resolve(result);

            } catch (error) {
              console.error('❌ Error in Google callback:', error);
              resolve({
                success: false,
                error: 'Failed to process Google authentication'
              });
            }
          },
          auto_select: false,
          cancel_on_tap_outside: false, // Don't cancel on tap outside for mobile
          use_fedcm_for_prompt: true // Use FedCM if available for better mobile experience
        });

        // For mobile, create and click a temporary button to trigger the flow
        const tempDiv = document.createElement('div');
        tempDiv.style.position = 'fixed';
        tempDiv.style.top = '-1000px';
        tempDiv.style.left = '-1000px';
        tempDiv.style.width = '1px';
        tempDiv.style.height = '1px';
        document.body.appendChild(tempDiv);

        // Render the button with mobile-optimized settings
        window.google!.accounts.id.renderButton(tempDiv, {
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
          width: 300,
          click_listener: () => {
            console.log('🔘 Google button clicked on mobile');
          }
        });

        // Remove the temporary div after a short delay
        setTimeout(() => {
          if (tempDiv.parentNode) {
            document.body.removeChild(tempDiv);
          }
        }, 100);

        // Show the Google sign-in prompt with mobile-optimized settings
        window.google!.accounts.id.prompt((notification) => {
          console.log('🔍 Google prompt notification on mobile:', notification.getMomentType());
          
          if (notification.isNotDisplayed()) {
            console.log('🔄 Prompt not displayed on mobile, trying alternative method...');
            // Try to trigger with a direct popup approach
            this.fallbackToDirectPopup().then(resolve);
          } else if (notification.isSkippedMoment()) {
            resolve({
              success: false,
              error: 'Google sign-in was cancelled'
            });
          }
        });

      } catch (error) {
        console.error('❌ Error in mobile Google sign-in:', error);
        // Try the direct popup fallback
        this.fallbackToDirectPopup().then(resolve);
      }
    });
  }

  /**
   * Desktop GIS popup method
   */
  private async signInWithGISPopup(): Promise<AuthResult> {
    return new Promise<AuthResult>((resolve) => {
      try {
        window.google!.accounts.id.initialize({
          client_id: this.clientId,
          callback: async (response) => {
            try {
              if (!response.credential) {
                resolve({
                  success: false,
                  error: 'No credential received from Google'
                });
                return;
              }

              const userInfo = this.parseJWT(response.credential);
              const result = await this.processGoogleAuth(userInfo);
              resolve(result);

            } catch (error) {
              console.error('❌ Error in Google callback:', error);
              resolve({
                success: false,
                error: 'Failed to process Google authentication'
              });
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true
        });

        // Show the Google sign-in prompt
        window.google!.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            resolve({
              success: false,
              error: 'Google sign-in was cancelled'
            });
          }
        });

      } catch (error) {
        console.error('❌ Error initializing Google sign-in:', error);
        resolve({
          success: false,
          error: 'Failed to initialize Google sign-in'
        });
      }
    });
  }

  /**
   * Fallback method for mobile devices when GIS popup fails
   * Uses a direct popup window approach
   */
  private async fallbackToDirectPopup(): Promise<AuthResult> {
    console.log('🔄 Using direct popup fallback for mobile authentication');
    
    const redirectUri = `${window.location.origin}${window.location.pathname}`;
    const scope = 'openid profile email';
    const responseType = 'token id_token';
    const state = Math.random().toString(36).substring(2, 15);
    const nonce = Math.random().toString(36).substring(2, 15);
    
    // Store state in sessionStorage for verification
    sessionStorage.setItem('google_auth_state', state);
    sessionStorage.setItem('google_auth_nonce', nonce);
    
    const googleAuthUrl = `https://accounts.google.com/oauth/authorize?` +
      `client_id=${encodeURIComponent(this.clientId)}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=${encodeURIComponent(scope)}&` +
      `response_type=${responseType}&` +
      `state=${state}&` +
      `nonce=${nonce}&` +
      `prompt=select_account`;

    // For mobile, make the popup fullscreen on small devices
    const isMobile = this.isMobileDevice();
    let popupWidth, popupHeight, left, top;

    if (isMobile && window.innerWidth < 600) {
      // On small mobile screens, use most of the screen
      popupWidth = window.screen.availWidth;
      popupHeight = window.screen.availHeight;
      left = 0;
      top = 0;
    } else {
      // On larger screens or desktop, use a centered popup
      popupWidth = Math.min(window.innerWidth - 40, 500);
      popupHeight = Math.min(window.innerHeight - 40, 600);
      left = (window.screen.availWidth - popupWidth) / 2;
      top = (window.screen.availHeight - popupHeight) / 2;
    }

    const popupFeatures = [
      `width=${popupWidth}`,
      `height=${popupHeight}`,
      `left=${left}`,
      `top=${top}`,
      'scrollbars=yes',
      'resizable=yes',
      'status=yes',
      'toolbar=no',
      'menubar=no',
      'location=yes'
    ].join(',');

    const popup = window.open(
      googleAuthUrl,
      'google_auth_mobile',
      popupFeatures
    );

    return new Promise<AuthResult>((resolve) => {
      if (!popup) {
        resolve({
          success: false,
          error: 'Failed to open Google authentication popup. Please allow popups for this site.'
        });
        return;
      }

      // Check if popup was closed
      const checkClosed = setInterval(() => {
        try {
          if (popup.closed) {
            clearInterval(checkClosed);
            resolve({
              success: false,
              error: 'Google sign-in was cancelled'
            });
            return;
          }

          // Check for successful authentication by looking at the URL
          if (popup.location && popup.location.hash) {
            const hash = popup.location.hash;
            if (hash.includes('id_token=')) {
              clearInterval(checkClosed);
              this.handlePopupSuccess(hash).then(result => {
                popup.close();
                resolve(result);
              }).catch(error => {
                popup.close();
                resolve({
                  success: false,
                  error: error.message || 'Failed to process authentication'
                });
              });
            }
          }
        } catch (e) {
          // Cross-origin error, this is expected and normal
          // We'll rely on the postMessage or polling
        }
      }, 1000);

      // Timeout after 5 minutes
      setTimeout(() => {
        clearInterval(checkClosed);
        if (popup && !popup.closed) {
          popup.close();
        }
        resolve({
          success: false,
          error: 'Google sign-in timed out'
        });
      }, 300000);
    });
  }

  /**
   * Handle successful popup authentication
   */
  private async handlePopupSuccess(hash: string): Promise<AuthResult> {
    try {
      const params = new URLSearchParams(hash.substring(1));
      const idToken = params.get('id_token');
      const state = params.get('state');
      
      // Verify state
      const storedState = sessionStorage.getItem('google_auth_state');
      if (state !== storedState) {
        throw new Error('Invalid state parameter');
      }
      
      if (!idToken) {
        throw new Error('No ID token received');
      }

      const userInfo = this.parseJWT(idToken);
      return await this.processGoogleAuth(userInfo);

    } catch (error) {
      console.error('❌ Error handling popup success:', error);
      throw error;
    }
  }

  /**
   * Complete user registration with role selection using backend API
   */
  public async completeRegistration(userData: any, selectedRole: string): Promise<AuthResult> {
    try {
      console.log('🌐 Completing Google registration for:', userData.email);
      
      const registrationData = {
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: selectedRole,
        googleId: userData.googleId,
        profilePicture: userData.profilePicture || userData.avatar,
        provider: 'google',
        isEmailVerified: userData.isEmailVerified || true,
        platform: 'job-portal'
      };

      const response = await apiPost('/auth/google/complete-registration', registrationData);
      
      console.log('🔍 Google registration response:', response);
      console.log('🔍 Google registration response structure keys:', Object.keys(response));
      
      // The response from apiPost is already the JSON data from the backend
      if (response.success && response.data) {
        localStorage.setItem('token', response.data.token);
        if (response.data.user) {
          localStorage.setItem('user', JSON.stringify(response.data.user));
        }
        
        // Welcome email is sent automatically by the backend
        console.log('✅ Google registration completed:', response.data.user?.email);

        return {
          success: true,
          user: response.data.user,
          token: response.data.token,
          requiresRoleSelection: false
        };
      }

    } catch (error) {
      console.error('❌ Error completing Google registration:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to complete registration'
      };
    }
  }

  /**
   * Sign out user
   */
  public signOut(): void {
    try {
      // Clear local storage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Disable auto-select for next sign-in
      if (window.google?.accounts?.id) {
        window.google.accounts.id.disableAutoSelect();
      }

      console.log('✅ Google sign-out completed');
    } catch (error) {
      console.error('❌ Error during sign-out:', error);
    }
  }
}

// Export singleton instance
export const googleAuthService = new GoogleAuthService();
export default googleAuthService;