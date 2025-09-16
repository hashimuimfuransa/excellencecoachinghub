// New Simple Google Authentication Service
// Works exactly like local login - creates proper auth tokens and user sessions

import config from '../config/env';

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

export interface GoogleUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  profilePicture?: string;
  role: 'job_seeker' | 'employer' | 'hr_consultant';
  isEmailVerified: boolean;
  authProvider: 'google';
  registrationCompleted: boolean;
  createdAt: string;
}

export interface GoogleAuthResult {
  success: boolean;
  user?: GoogleUser;
  token?: string;
  requiresRoleSelection?: boolean;
  error?: string;
}

class NewGoogleAuthService {
  private clientId: string;
  private isScriptLoaded = false;

  constructor() {
    this.clientId = config.googleClientId;
  }

  // Load Google Identity Services script
  private async loadGoogleScript(): Promise<void> {
    if (this.isScriptLoaded && window.google) {
      return;
    }

    return new Promise((resolve, reject) => {
      const existingScript = document.querySelector('script[src*="accounts.google.com/gsi/client"]');
      if (existingScript) {
        this.isScriptLoaded = true;
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        this.isScriptLoaded = true;
        resolve();
      };
      
      script.onerror = () => {
        reject(new Error('Failed to load Google Identity Services'));
      };
      
      document.head.appendChild(script);
    });
  }

  // Parse JWT token to get user info
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
      throw new Error('Invalid Google token');
    }
  }

  // Check if user exists in localStorage
  private findExistingUser(email: string): GoogleUser | null {
    try {
      const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
      return registeredUsers.find((user: any) => user.email === email && user.authProvider === 'google') || null;
    } catch (error) {
      console.error('Error checking existing user:', error);
      return null;
    }
  }

  // Save user to localStorage
  private saveUser(user: GoogleUser): void {
    try {
      const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
      const existingIndex = registeredUsers.findIndex((u: any) => u.email === user.email);
      
      if (existingIndex >= 0) {
        registeredUsers[existingIndex] = user;
      } else {
        registeredUsers.push(user);
      }
      
      localStorage.setItem('registeredUsers', JSON.stringify(registeredUsers));
    } catch (error) {
      console.error('Error saving user:', error);
    }
  }

  // Generate authentication token (simple approach for localStorage system)
  private generateToken(userId: string): string {
    const timestamp = Date.now();
    return `google_${userId}_${timestamp}`;
  }

  // Complete Google login process
  private async processGoogleLogin(googleData: any): Promise<GoogleAuthResult> {
    try {
      const userData = {
        firstName: googleData.given_name || googleData.name?.split(' ')[0] || 'Google',
        lastName: googleData.family_name || googleData.name?.split(' ').slice(1).join(' ') || 'User',
        email: googleData.email,
        profilePicture: googleData.picture,
        isEmailVerified: googleData.email_verified || true,
        googleId: googleData.sub || googleData.id
      };

      // Check if user already exists
      const existingUser = this.findExistingUser(userData.email);
      
      if (existingUser && existingUser.registrationCompleted) {
        // User exists and completed - log them in directly
        const token = this.generateToken(existingUser._id);
        
        // Store authentication data
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(existingUser));
        
        console.log('✅ Google user logged in:', existingUser.email);
        
        return {
          success: true,
          user: existingUser,
          token: token,
          requiresRoleSelection: false
        };
      }

      // New user or incomplete registration - return data for role selection
      return {
        success: true,
        requiresRoleSelection: true,
        user: {
          _id: `google_${userData.googleId}_${Date.now()}`,
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          profilePicture: userData.profilePicture,
          role: 'job_seeker', // Default role, will be updated after selection
          isEmailVerified: userData.isEmailVerified,
          authProvider: 'google',
          registrationCompleted: false,
          createdAt: new Date().toISOString()
        } as GoogleUser
      };

    } catch (error) {
      console.error('Error processing Google login:', error);
      return {
        success: false,
        error: 'Failed to process Google authentication'
      };
    }
  }

  // Main Google login method - simple and reliable
  async login(): Promise<GoogleAuthResult> {
    try {
      if (!this.clientId) {
        return {
          success: false,
          error: 'Google Client ID not configured'
        };
      }

      await this.loadGoogleScript();

      if (!window.google?.accounts?.id) {
        return {
          success: false,
          error: 'Google services not available'
        };
      }

      return new Promise((resolve) => {
        window.google.accounts.id.initialize({
          client_id: this.clientId,
          callback: async (response: any) => {
            try {
              if (!response.credential) {
                resolve({
                  success: false,
                  error: 'No credential received from Google'
                });
                return;
              }

              // Parse JWT to get user info
              const userInfo = this.parseJWT(response.credential);
              console.log('Google user info:', userInfo);

              // Process login
              const result = await this.processGoogleLogin(userInfo);
              resolve(result);

            } catch (error) {
              console.error('Error processing Google credential:', error);
              resolve({
                success: false,
                error: 'Failed to process Google login'
              });
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true,
          use_fedcm_for_prompt: false
        });

        // Show login prompt
        window.google.accounts.id.prompt((notification: any) => {
          console.log('Google prompt notification:', notification);
          
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            resolve({
              success: false,
              error: 'Google login was cancelled or not displayed'
            });
          }
        });
      });

    } catch (error) {
      console.error('Google login error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Google login failed'
      };
    }
  }

  // Complete registration with role selection
  async completeRegistration(userData: GoogleUser, role: string): Promise<GoogleAuthResult> {
    try {
      // Update user with selected role
      const completeUser: GoogleUser = {
        ...userData,
        role: role as 'job_seeker' | 'employer' | 'hr_consultant',
        registrationCompleted: true,
        createdAt: new Date().toISOString()
      };

      // Save user
      this.saveUser(completeUser);

      // Generate token and store authentication data
      const token = this.generateToken(completeUser._id);
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(completeUser));

      console.log('✅ Google registration completed:', completeUser.email);

      return {
        success: true,
        user: completeUser,
        token: token,
        requiresRoleSelection: false
      };

    } catch (error) {
      console.error('Error completing Google registration:', error);
      return {
        success: false,
        error: 'Failed to complete registration'
      };
    }
  }
}

// Export singleton instance
export const newGoogleAuth = new NewGoogleAuthService();
export default newGoogleAuth;