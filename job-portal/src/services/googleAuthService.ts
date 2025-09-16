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
   * Detect if user is on mobile device
   */
  private isMobileDevice(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           (window.innerWidth <= 768 && 'ontouchstart' in window);
  }

  /**
   * Check if popups are likely blocked
   */
  private async testPopupSupport(): Promise<boolean> {
    try {
      const popup = window.open('', '_blank', 'width=1,height=1');
      if (popup) {
        popup.close();
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
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
   * Sign in with Google using mobile-aware approach
   */
  public async signIn(): Promise<AuthResult> {
    try {
      if (!this.clientId) {
        console.error('❌ Google Client ID not configured');
        return {
          success: false,
          error: 'Google Client ID not configured'
        };
      }

      console.log('🔄 Initializing Google sign-in...');
      await this.initialize();

      if (!window.google?.accounts?.id) {
        console.error('❌ Google Identity Services not available after initialization');
        return {
          success: false,
          error: 'Google Identity Services not available'
        };
      }

      const isMobile = this.isMobileDevice();
      const popupSupported = await this.testPopupSupport();
      
      console.log('📱 Device info:', { 
        isMobile, 
        popupSupported, 
        userAgent: navigator.userAgent.substring(0, 50) + '...' 
      });

      console.log('✅ Google services ready, starting sign-in flow');

      return new Promise<AuthResult>((resolve, reject) => {
        let resolved = false;
        
        const resolveOnce = (result: AuthResult) => {
          if (!resolved) {
            resolved = true;
            resolve(result);
          }
        };

        // Set a timeout to handle cases where Google doesn't respond
        const timeout = setTimeout(() => {
          resolveOnce({
            success: false,
            error: 'Google sign-in timeout. Please try again.'
          });
        }, 30000); // 30 seconds timeout

        try {
          // Mobile-specific configuration
          const googleConfig = {
            client_id: this.clientId,
            callback: async (response: any) => {
              clearTimeout(timeout);
              try {
                console.log('📨 Received Google response');
                
                if (!response.credential) {
                  console.error('❌ No credential in Google response');
                  resolveOnce({
                    success: false,
                    error: 'No credential received from Google'
                  });
                  return;
                }

                const userInfo = this.parseJWT(response.credential);
                console.log('👤 Parsed Google user info:', userInfo.email);
                
                const result = await this.processGoogleAuth(userInfo);
                resolveOnce(result);

              } catch (error) {
                console.error('❌ Error in Google callback:', error);
                resolveOnce({
                  success: false,
                  error: 'Failed to process Google authentication'
                });
              }
            },
            auto_select: false,
            cancel_on_tap_outside: isMobile ? false : true, // Mobile users might accidentally tap outside
            use_fedcm_for_prompt: isMobile && popupSupported, // Use FedCM on mobile if popups work
            ux_mode: isMobile ? 'redirect' : 'popup', // Use redirect on mobile for better UX
            redirect_uri: isMobile ? window.location.origin + window.location.pathname : undefined
          };

          window.google!.accounts.id.initialize(googleConfig);

          console.log('🚀 Prompting Google sign-in...');
          
          // Mobile-specific handling
          if (isMobile) {
            console.log('📱 Mobile detected - using mobile-optimized flow');
            
            // For mobile, provide additional guidance
            if (!popupSupported) {
              console.warn('⚠️ Popup support limited on mobile, providing instructions');
              resolveOnce({
                success: false,
                error: 'Mobile popup blocking detected. Please:\n1. Tap "Allow" when prompted\n2. Enable popups for this site in browser settings\n3. Try using the Google button below if available'
              });
              return;
            }
          }
          
          // Show the Google sign-in prompt with better error handling
          window.google!.accounts.id.prompt((notification) => {
            console.log('📢 Google prompt notification:', {
              isDisplayed: notification.isDisplayed?.(),
              isNotDisplayed: notification.isNotDisplayed?.(),
              isSkippedMoment: notification.isSkippedMoment?.(),
              getDismissedReason: notification.getDismissedReason?.(),
              getNotDisplayedReason: notification.getNotDisplayedReason?.(),
              getSkippedReason: notification.getSkippedReason?.(),
              isMobile
            });
            
            // Handle various scenarios with mobile-specific messages
            if (notification.isNotDisplayed?.()) {
              const reason = notification.getNotDisplayedReason?.();
              console.warn('⚠️ Google prompt not displayed:', reason);
              
              const errorMessage = isMobile 
                ? 'Google sign-in popup was blocked on mobile. Please:\n1. Enable popups in your browser settings\n2. Try tapping the Google button instead\n3. Use a different browser if issues persist'
                : 'Google sign-in popup was blocked or not displayed. Please ensure popups are allowed and try again.';
              
              // Give mobile users more time to react
              const delay = isMobile ? 5000 : 2000;
              setTimeout(() => {
                if (!resolved) {
                  resolveOnce({
                    success: false,
                    error: errorMessage
                  });
                }
              }, delay);
            } 
            else if (notification.isSkippedMoment?.()) {
              const reason = notification.getSkippedReason?.();
              console.warn('⚠️ Google prompt skipped:', reason);
              
              const errorMessage = isMobile
                ? 'Google sign-in was skipped on mobile. Please try tapping the Google sign-in button or refresh the page.'
                : 'Google sign-in was not completed. Please try again.';
              
              // Give mobile users more time
              const delay = isMobile ? 3000 : 2000;
              setTimeout(() => {
                if (!resolved) {
                  resolveOnce({
                    success: false,
                    error: errorMessage
                  });
                }
              }, delay);
            }
            // If displayed, let it run normally
          });

        } catch (error) {
          clearTimeout(timeout);
          console.error('❌ Error initializing Google sign-in:', error);
          resolveOnce({
            success: false,
            error: 'Failed to initialize Google sign-in'
          });
        }
      });

    } catch (error) {
      console.error('❌ Google sign-in error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Google sign-in failed'
      };
    }
  }

  /**
   * Mobile-optimized sign-in that completely avoids popups
   * Uses redirect flow and direct button rendering for mobile devices
   */
  public async signInMobile(): Promise<AuthResult> {
    const isMobile = this.isMobileDevice();
    
    if (!isMobile) {
      // If not mobile, use regular sign-in
      return this.signIn();
    }

    try {
      console.log('📱 Starting mobile-optimized Google sign-in (no popups)...');
      
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

      // Use redirect-based flow for mobile to completely avoid popups
      return this.signInWithRedirect();
      
    } catch (error) {
      console.error('❌ Mobile sign-in error:', error);
      return {
        success: false,
        error: 'Mobile sign-in failed. Please try refreshing the page.'
      };
    }
  }

  /**
   * Sign in using redirect flow (no popups) - ideal for mobile
   */
  private async signInWithRedirect(): Promise<AuthResult> {
    return new Promise<AuthResult>((resolve) => {
      let resolved = false;
      
      const resolveOnce = (result: AuthResult) => {
        if (!resolved) {
          resolved = true;
          resolve(result);
        }
      };

      // Set a timeout for redirect flow
      const timeout = setTimeout(() => {
        resolveOnce({
          success: false,
          error: 'Google sign-in timeout. Please try again.'
        });
      }, 60000); // 60 seconds for redirect flow

      try {
        // Configure for redirect-based authentication
        window.google!.accounts.id.initialize({
          client_id: this.clientId,
          callback: async (response) => {
            clearTimeout(timeout);
            try {
              console.log('📨 Received Google response (redirect flow)');
              
              if (!response.credential) {
                resolveOnce({
                  success: false,
                  error: 'No credential received from Google'
                });
                return;
              }

              const userInfo = this.parseJWT(response.credential);
              console.log('👤 Parsed Google user info:', userInfo.email);
              
              const result = await this.processGoogleAuth(userInfo);
              resolveOnce(result);

            } catch (error) {
              console.error('❌ Error in Google redirect callback:', error);
              resolveOnce({
                success: false,
                error: 'Failed to process Google authentication'
              });
            }
          },
          auto_select: false,
          cancel_on_tap_outside: false,
          use_fedcm_for_prompt: true, // Use FedCM which works better on mobile
          ux_mode: 'redirect' // Force redirect mode
        });

        // Instead of using prompt() which creates popups, create a direct OAuth URL
        console.log('🔄 Creating Google OAuth redirect URL...');
        
        const state = Math.random().toString(36).substring(2);
        const nonce = Math.random().toString(36).substring(2);
        
        // Store state for verification when user returns
        localStorage.setItem('google_oauth_state', state);
        localStorage.setItem('google_oauth_nonce', nonce);
        localStorage.setItem('google_oauth_redirect_url', window.location.href);
        
        const redirectUri = encodeURIComponent(window.location.origin + window.location.pathname);
        const scope = encodeURIComponent('openid email profile');
        
        const googleAuthUrl = `https://accounts.google.com/oauth/authorize?` +
          `client_id=${encodeURIComponent(this.clientId)}&` +
          `redirect_uri=${redirectUri}&` +
          `response_type=code&` +
          `scope=${scope}&` +
          `state=${state}&` +
          `nonce=${nonce}&` +
          `access_type=online&` +
          `include_granted_scopes=true`;

        console.log('🚀 Redirecting to Google OAuth (mobile-friendly)...');
        
        // Give a short delay to let any UI updates complete
        setTimeout(() => {
          window.location.href = googleAuthUrl;
        }, 500);
        
        // Don't resolve here - the page will redirect and come back
        
      } catch (error) {
        clearTimeout(timeout);
        console.error('❌ Error setting up Google redirect:', error);
        resolveOnce({
          success: false,
          error: 'Failed to set up Google authentication redirect'
        });
      }
    });
  }

  /**
   * Handle OAuth redirect callback (when user returns from Google)
   */
  public async handleOAuthCallback(): Promise<AuthResult | null> {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');
      const storedState = localStorage.getItem('google_oauth_state');
      
      if (!code) {
        return null; // Not an OAuth callback
      }
      
      if (!state || state !== storedState) {
        throw new Error('Invalid OAuth state parameter');
      }
      
      console.log('🔄 Processing OAuth callback with code...');
      
      // Exchange code for tokens via backend
      const response = await apiPost('/auth/google/callback', {
        code,
        redirectUri: window.location.origin + window.location.pathname,
        platform: 'job-portal'
      });
      
      if (response.success && response.data) {
        // Clean up OAuth state
        localStorage.removeItem('google_oauth_state');
        localStorage.removeItem('google_oauth_nonce');
        localStorage.removeItem('google_oauth_redirect_url');
        
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
      
      throw new Error('Invalid OAuth callback response');
      
    } catch (error) {
      console.error('❌ OAuth callback error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'OAuth callback failed'
      };
    }
  }

  /**
   * Simple mobile sign-in using Google's renderButton (no popups, no redirects)
   * Creates a native Google button that handles authentication in-place
   */
  public async createMobileButton(containerElement: HTMLElement): Promise<AuthResult> {
    try {
      if (!this.clientId) {
        throw new Error('Google Client ID not configured');
      }

      await this.initialize();

      if (!window.google?.accounts?.id) {
        throw new Error('Google Identity Services not available');
      }

      console.log('📱 Creating mobile-friendly Google button...');

      return new Promise<AuthResult>((resolve) => {
        let resolved = false;
        
        const resolveOnce = (result: AuthResult) => {
          if (!resolved) {
            resolved = true;
            resolve(result);
          }
        };

        // Clear any existing content
        containerElement.innerHTML = '';

        try {
          // Initialize Google Identity with button-specific config
          window.google!.accounts.id.initialize({
            client_id: this.clientId,
            callback: async (response) => {
              try {
                console.log('📱 Mobile button callback received');
                
                if (!response.credential) {
                  resolveOnce({
                    success: false,
                    error: 'No credential received from Google'
                  });
                  return;
                }

                const userInfo = this.parseJWT(response.credential);
                const result = await this.processGoogleAuth(userInfo);
                resolveOnce(result);

              } catch (error) {
                console.error('❌ Mobile button callback error:', error);
                resolveOnce({
                  success: false,
                  error: 'Failed to process Google authentication'
                });
              }
            }
          });

          // Render the Google button directly
          window.google!.accounts.id.renderButton(containerElement, {
            theme: 'outline',
            size: 'large',
            type: 'standard',
            shape: 'rectangular',
            text: 'continue_with',
            logo_alignment: 'left',
            width: '100%'
          });

          console.log('✅ Mobile Google button rendered successfully');

        } catch (error) {
          console.error('❌ Error creating mobile button:', error);
          resolveOnce({
            success: false,
            error: 'Failed to create Google sign-in button'
          });
        }
      });
      
    } catch (error) {
      console.error('❌ Mobile button setup error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Mobile button setup failed'
      };
    }
  }

  /**
   * Guide user through enabling popups for their specific browser/mobile device
   */
  public getMobilePopupInstructions(): string {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (userAgent.includes('chrome')) {
      return `📱 Chrome Mobile - Enable Popups:
1. Tap menu (⋮) → Settings
2. Tap "Site Settings"
3. Tap "Pop-ups and redirects"
4. Toggle to "Allowed"
5. Return here and try again`;
    }
    
    if (userAgent.includes('safari')) {
      return `📱 Safari Mobile - Enable Popups:
1. Go to Settings app on your device
2. Scroll down to Safari
3. Tap "Block Pop-ups" to turn OFF
4. Return to this page and try again`;
    }
    
    if (userAgent.includes('firefox')) {
      return `📱 Firefox Mobile - Enable Popups:
1. Tap menu (⋮) → Settings
2. Tap "Site Settings"
3. Find this site in the list
4. Tap "Permissions"
5. Set Pop-ups to "Allow"`;
    }
    
    if (userAgent.includes('edge')) {
      return `📱 Edge Mobile - Enable Popups:
1. Tap menu (⋯) → Settings
2. Tap "Site permissions"
3. Tap "Pop-ups and redirects"
4. Toggle to "Allow"
5. Return and try again`;
    }
    
    return `📱 Enable Popups on Mobile:
1. Open your browser settings
2. Find "Site Settings" or "Permissions"
3. Look for "Pop-ups" or "Pop-ups and redirects"
4. Set to "Allow" for this site
5. Return here and try Google sign-in again`;
  }

  /**
   * Alternative sign-in method using renderButton (fallback)
   * Creates a Google sign-in button that can be clicked
   */
  public async signInWithButton(buttonElement: HTMLElement): Promise<AuthResult> {
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

      return new Promise<AuthResult>((resolve) => {
        let resolved = false;
        
        const resolveOnce = (result: AuthResult) => {
          if (!resolved) {
            resolved = true;
            resolve(result);
          }
        };

        // Set a timeout
        const timeout = setTimeout(() => {
          resolveOnce({
            success: false,
            error: 'Google sign-in timeout. Please try again.'
          });
        }, 60000); // 60 seconds for button method

        try {
          window.google!.accounts.id.initialize({
            client_id: this.clientId,
            callback: async (response) => {
              clearTimeout(timeout);
              try {
                if (!response.credential) {
                  resolveOnce({
                    success: false,
                    error: 'No credential received from Google'
                  });
                  return;
                }

                const userInfo = this.parseJWT(response.credential);
                const result = await this.processGoogleAuth(userInfo);
                resolveOnce(result);

              } catch (error) {
                console.error('❌ Error in Google button callback:', error);
                resolveOnce({
                  success: false,
                  error: 'Failed to process Google authentication'
                });
              }
            },
            auto_select: false,
            cancel_on_tap_outside: false
          });

          // Render the Google button
          window.google!.accounts.id.renderButton(buttonElement, {
            theme: 'outline',
            size: 'large',
            text: 'continue_with',
            shape: 'rectangular',
            logo_alignment: 'left',
            width: '100%'
          });

          console.log('✅ Google sign-in button rendered');
          
          // Don't auto-resolve, wait for user to click the button
          
        } catch (error) {
          clearTimeout(timeout);
          console.error('❌ Error rendering Google sign-in button:', error);
          resolveOnce({
            success: false,
            error: 'Failed to render Google sign-in button'
          });
        }
      });

    } catch (error) {
      console.error('❌ Google button sign-in error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Google sign-in failed'
      };
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