// Google OAuth types
declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          prompt: (callback?: (notification: any) => void) => void;
          renderButton: (element: HTMLElement, config: any) => void;
          disableAutoSelect: () => void;
        };
        oauth2: {
          initTokenClient: (config: any) => {
            requestAccessToken: (options?: any) => void;
          };
        };
      };
    };
  }
}

export interface GoogleAuthResponse {
  success: boolean;
  userData?: {
    firstName: string;
    lastName: string;
    email: string;
    profilePicture?: string;
    googleId: string;
    isEmailVerified: boolean;
  };
  requiresRoleSelection?: boolean;
  error?: string;
}

// Simple Google OAuth implementation for Job Portal
class GoogleAuthService {
  private clientId: string;
  private isLoaded = false;

  constructor() {
    this.clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
  }

  // Load Google Identity Services
  private loadGoogleScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isLoaded && window.google) {
        resolve();
        return;
      }

      // Check if script already exists
      const existingScript = document.querySelector('script[src*="accounts.google.com/gsi/client"]');
      if (existingScript) {
        existingScript.addEventListener('load', () => {
          this.isLoaded = true;
          resolve();
        });
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        this.isLoaded = true;
        resolve();
      };
      
      script.onerror = () => {
        reject(new Error('Failed to load Google Identity Services'));
      };
      
      document.head.appendChild(script);
    });
  }

  // Main Google authentication method
  async authenticate(): Promise<GoogleAuthResponse> {
    try {
      if (!this.clientId) {
        return {
          success: false,
          error: 'Google Client ID not configured. Please contact support.'
        };
      }

      await this.loadGoogleScript();

      if (!window.google?.accounts?.id) {
        return {
          success: false,
          error: 'Google services are not available. Please try again later.'
        };
      }

      return new Promise((resolve) => {
        // Initialize Google Identity Services
        window.google.accounts.id.initialize({
          client_id: this.clientId,
          callback: async (response: any) => {
            try {
              console.log('Google credential response:', response);
              
              if (!response.credential) {
                resolve({
                  success: false,
                  error: 'No credential received from Google'
                });
                return;
              }

              // Parse the JWT credential to get user info
              const userInfo = this.parseJWT(response.credential);
              console.log('Parsed user info:', userInfo);

              // Create user data
              const googleUserData = {
                firstName: userInfo.given_name || userInfo.name?.split(' ')[0] || 'Google',
                lastName: userInfo.family_name || userInfo.name?.split(' ').slice(1).join(' ') || 'User',
                email: userInfo.email,
                isEmailVerified: userInfo.email_verified || true,
                profilePicture: userInfo.picture,
                googleId: userInfo.sub
              };

              resolve({
                success: true,
                userData: googleUserData,
                requiresRoleSelection: true
              });
            } catch (error) {
              console.error('Error processing Google credential:', error);
              resolve({
                success: false,
                error: 'Failed to process Google authentication'
              });
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true,
          use_fedcm_for_prompt: false
        });

        // Try to show the One Tap dialog first
        window.google.accounts.id.prompt((notification: any) => {
          console.log('Google prompt notification:', notification);
          
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            console.log('One Tap not displayed, falling back to popup');
            // Fallback to popup method if One Tap doesn't work
            this.signInWithPopup().then(resolve).catch((error) => {
              resolve({
                success: false,
                error: error.message || 'Google authentication failed'
              });
            });
          }
        });

        // Set a timeout in case the prompt doesn't work
        setTimeout(() => {
          console.log('Prompt timeout, trying popup method');
          this.signInWithPopup().then(resolve).catch((error) => {
            resolve({
              success: false,
              error: error.message || 'Google authentication timeout'
            });
          });
        }, 3000);
      });

    } catch (error) {
      console.error('Google authentication error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // Popup-based Google OAuth flow
  private async signInWithPopup(): Promise<GoogleAuthResponse> {
    return new Promise((resolve, reject) => {
      if (!window.google?.accounts?.oauth2) {
        reject(new Error('Google OAuth2 not available'));
        return;
      }

      // Create OAuth2 token client
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: this.clientId,
        scope: 'openid email profile',
        callback: async (response: any) => {
          console.log('OAuth2 token response:', response);
          
          if (response.error) {
            reject(new Error(response.error_description || response.error));
            return;
          }

          try {
            // Get user info using the access token
            const userInfo = await this.fetchUserInfo(response.access_token);
            console.log('Fetched user info:', userInfo);

            // Create user data
            const googleUserData = {
              firstName: userInfo.given_name || userInfo.name?.split(' ')[0] || 'Google',
              lastName: userInfo.family_name || userInfo.name?.split(' ').slice(1).join(' ') || 'User',
              email: userInfo.email,
              isEmailVerified: userInfo.verified_email || true,
              profilePicture: userInfo.picture,
              googleId: userInfo.id
            };

            resolve({
              success: true,
              userData: googleUserData,
              requiresRoleSelection: true
            });
          } catch (error) {
            console.error('Error fetching user info:', error);
            reject(error);
          }
        }
      });

      // Request access token (this will open popup)
      tokenClient.requestAccessToken({ prompt: 'consent' });
    });
  }

  // Fetch user info from Google API
  private async fetchUserInfo(accessToken: string): Promise<any> {
    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch user info: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching user info from Google API:', error);
      throw new Error('Failed to retrieve user information from Google');
    }
  }

  // Parse JWT token to extract user information
  private parseJWT(token: string): any {
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
      console.error('Error parsing JWT:', error);
      throw new Error('Failed to parse authentication token');
    }
  }
}

// Export singleton instance
export const googleAuthService = new GoogleAuthService();
export default googleAuthService;