import type { AuthResponse } from '../types/auth';

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

// Simple Google OAuth implementation
class SimpleGoogleAuth {
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

  // Initialize Google OAuth with popup
  async signIn(): Promise<AuthResponse> {
    try {
      if (!this.clientId) {
        throw new Error('Google Client ID not configured');
      }

      await this.loadGoogleScript();

      return new Promise((resolve, reject) => {
        // Create a simple OAuth URL for popup
        const scope = 'openid email profile';
        const redirectUri = `${window.location.origin}/auth/google/callback`;
        
        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
          `client_id=${this.clientId}&` +
          `redirect_uri=${encodeURIComponent(redirectUri)}&` +
          `response_type=code&` +
          `scope=${encodeURIComponent(scope)}&` +
          `access_type=offline&` +
          `prompt=consent`;

        // Open popup
        const popup = window.open(
          authUrl,
          'google-signin',
          'width=500,height=600,scrollbars=yes,resizable=yes'
        );

        if (!popup) {
          reject(new Error('Popup blocked. Please allow popups for this site.'));
          return;
        }

        // For development, we'll simulate a successful login after a short delay
        setTimeout(() => {
          popup.close();
          
          // Mock successful authentication
          const mockResponse: AuthResponse = {
            user: {
              _id: 'google_user_' + Date.now(),
              firstName: 'John',
              lastName: 'Doe',
              email: 'john.doe@gmail.com',
              role: 'student',
              isEmailVerified: true,
              profilePicture: 'https://lh3.googleusercontent.com/a/default-user=s96-c',
              createdAt: new Date().toISOString()
            },
            token: 'mock_google_jwt_' + Date.now(),
            refreshToken: 'mock_google_refresh_' + Date.now()
          };

          // Store authentication data
          localStorage.setItem('token', mockResponse.token);
          localStorage.setItem('user', JSON.stringify(mockResponse.user));
          if (mockResponse.refreshToken) {
            localStorage.setItem('refreshToken', mockResponse.refreshToken);
          }

          resolve(mockResponse);
        }, 2000); // Simulate 2 second authentication process

        // Check if popup is closed manually
        const checkClosed = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkClosed);
            reject(new Error('Authentication cancelled by user'));
          }
        }, 1000);
      });

    } catch (error) {
      throw new Error(`Google authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Real Google Identity Services implementation
  async signInWithGSI(): Promise<AuthResponse> {
    try {
      if (!this.clientId) {
        throw new Error('Google Client ID not configured. Please add VITE_GOOGLE_CLIENT_ID to your .env file');
      }

      await this.loadGoogleScript();

      if (!window.google?.accounts?.id) {
        throw new Error('Google Identity Services not available. Please check your internet connection.');
      }

      return new Promise((resolve, reject) => {
        // Initialize Google Identity Services
        window.google.accounts.id.initialize({
          client_id: this.clientId,
          callback: async (response: any) => {
            try {
              console.log('Google credential response:', response);
              
              if (!response.credential) {
                throw new Error('No credential received from Google');
              }

              // Parse the JWT credential to get user info
              const userInfo = this.parseJWT(response.credential);
              console.log('Parsed user info:', userInfo);

              // Create temporary user data for role selection
              const googleUserData = {
                _id: 'google_' + userInfo.sub,
                firstName: userInfo.given_name || userInfo.name?.split(' ')[0] || 'Google',
                lastName: userInfo.family_name || userInfo.name?.split(' ').slice(1).join(' ') || 'User',
                email: userInfo.email,
                isEmailVerified: userInfo.email_verified || true,
                profilePicture: userInfo.picture,
                googleId: userInfo.sub,
                provider: 'google'
              };

              // Check if user already exists (in production, this would be a backend call)
              const existingUser = this.checkExistingUser(googleUserData.email);
              
              if (existingUser && existingUser.registrationCompleted) {
                // User exists and has completed registration
                const authResponse: AuthResponse = {
                  user: existingUser,
                  token: 'google_jwt_' + Date.now(),
                  refreshToken: 'google_refresh_' + Date.now()
                };

                // Store authentication data
                localStorage.setItem('token', authResponse.token);
                localStorage.setItem('user', JSON.stringify(authResponse.user));
                if (authResponse.refreshToken) {
                  localStorage.setItem('refreshToken', authResponse.refreshToken);
                }

                resolve(authResponse);
              } else {
                // New user or incomplete registration - needs role selection
                resolve({
                  user: null,
                  token: '',
                  refreshToken: '',
                  requiresRoleSelection: true,
                  googleUserData: googleUserData
                } as any);
              }
            } catch (error) {
              console.error('Error processing Google credential:', error);
              reject(error);
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true,
          use_fedcm_for_prompt: false // Disable FedCM to avoid CORS issues
        });

        // Try to show the One Tap dialog first
        window.google.accounts.id.prompt((notification: any) => {
          console.log('Google prompt notification:', notification);
          
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            console.log('One Tap not displayed, falling back to popup');
            // Fallback to popup method if One Tap doesn't work
            this.signInWithPopup().then(resolve).catch(reject);
          }
        });

        // Set a timeout in case the prompt doesn't work
        setTimeout(() => {
          console.log('Prompt timeout, trying popup method');
          this.signInWithPopup().then(resolve).catch(reject);
        }, 3000);
      });

    } catch (error) {
      console.error('Google authentication error:', error);
      throw new Error(`Google authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Popup-based Google OAuth flow
  private async signInWithPopup(): Promise<AuthResponse> {
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

            // Create temporary user data for role selection
            const googleUserData = {
              _id: 'google_' + userInfo.id,
              firstName: userInfo.given_name || userInfo.name?.split(' ')[0] || 'Google',
              lastName: userInfo.family_name || userInfo.name?.split(' ').slice(1).join(' ') || 'User',
              email: userInfo.email,
              isEmailVerified: userInfo.verified_email || true,
              profilePicture: userInfo.picture,
              googleId: userInfo.id,
              provider: 'google'
            };

            // Check if user already exists
            const existingUser = this.checkExistingUser(googleUserData.email);
            
            if (existingUser && existingUser.registrationCompleted) {
              // User exists and has completed registration
              const authResponse: AuthResponse = {
                user: existingUser,
                token: 'google_oauth_' + Date.now(),
                refreshToken: 'google_refresh_' + Date.now()
              };

              // Store authentication data
              localStorage.setItem('token', authResponse.token);
              localStorage.setItem('user', JSON.stringify(authResponse.user));
              if (authResponse.refreshToken) {
                localStorage.setItem('refreshToken', authResponse.refreshToken);
              }

              resolve(authResponse);
            } else {
              // New user or incomplete registration - needs role selection
              resolve({
                user: null,
                token: '',
                refreshToken: '',
                requiresRoleSelection: true,
                googleUserData: googleUserData
              } as any);
            }
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

  // Check if user already exists (in production, this would be a backend API call)
  private checkExistingUser(email: string): any {
    try {
      // Get all registered users from localStorage (for development)
      const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
      return registeredUsers.find((user: any) => user.email === email);
    } catch (error) {
      console.error('Error checking existing user:', error);
      return null;
    }
  }

  // Save user to local storage (in production, this would be handled by backend)
  saveUser(userData: any): void {
    try {
      const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
      const existingIndex = registeredUsers.findIndex((user: any) => user.email === userData.email);
      
      if (existingIndex >= 0) {
        // Update existing user
        registeredUsers[existingIndex] = { ...registeredUsers[existingIndex], ...userData };
      } else {
        // Add new user
        registeredUsers.push(userData);
      }
      
      localStorage.setItem('registeredUsers', JSON.stringify(registeredUsers));
    } catch (error) {
      console.error('Error saving user:', error);
    }
  }

  // Parse JWT token (client-side - not recommended for production)
  private parseJWT(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (error) {
      throw new Error('Invalid JWT token');
    }
  }
}

export const simpleGoogleAuth = new SimpleGoogleAuth();