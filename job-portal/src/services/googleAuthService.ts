/**
 * Modern Google OAuth Authentication Service
 * Clean, reliable implementation using Google Identity Services
 */

import config from '../config/env';

// Types
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
  user?: any;
  token?: string;
  requiresRoleSelection?: boolean;
  userData?: any;
  error?: string;
}

export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  avatar?: string;
  isActive: boolean;
  authProvider: 'google' | 'local';
  registrationCompleted: boolean;
  createdAt: string;
  updatedAt: string;
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
      if (document.querySelector('script[src*="accounts.google.com/gsi/client"]')) {
        if (window.google?.accounts?.id) {
          resolve();
        } else {
          // Script exists but not loaded yet, wait a bit
          setTimeout(() => {
            if (window.google?.accounts?.id) {
              resolve();
            } else {
              reject(new Error('Google script loaded but services not available'));
            }
          }, 1000);
        }
        return;
      }

      // Create and load script
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        // Wait for Google services to be available
        const checkGoogle = () => {
          if (window.google?.accounts?.id) {
            resolve();
          } else {
            setTimeout(checkGoogle, 100);
          }
        };
        checkGoogle();
      };
      
      script.onerror = () => {
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
   * Check if user exists in storage
   */
  private findExistingUser(email: string): User | null {
    try {
      const users = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
      return users.find((user: User) => 
        user.email === email && 
        user.authProvider === 'google'
      ) || null;
    } catch (error) {
      console.error('❌ Error checking existing user:', error);
      return null;
    }
  }

  /**
   * Save user to storage
   */
  private saveUser(user: User): void {
    try {
      const users = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
      const existingIndex = users.findIndex((u: User) => u.email === user.email);
      
      if (existingIndex >= 0) {
        users[existingIndex] = { ...users[existingIndex], ...user };
      } else {
        users.push(user);
      }
      
      localStorage.setItem('registeredUsers', JSON.stringify(users));
    } catch (error) {
      console.error('❌ Error saving user:', error);
      throw new Error('Failed to save user data');
    }
  }

  /**
   * Generate authentication token
   */
  private generateToken(userId: string): string {
    return `google_${userId}_${Date.now()}`;
  }

  /**
   * Store authentication session
   */
  private storeAuthSession(user: User, token: string): void {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  }

  /**
   * Process Google authentication response
   */
  private async processGoogleAuth(googleUserInfo: GoogleUserInfo): Promise<AuthResult> {
    try {
      // Check if user already exists
      const existingUser = this.findExistingUser(googleUserInfo.email);
      
      if (existingUser && existingUser.registrationCompleted) {
        // Existing user - log them in
        const token = this.generateToken(existingUser._id);
        this.storeAuthSession(existingUser, token);
        
        console.log('✅ Existing Google user logged in:', existingUser.email);
        
        return {
          success: true,
          user: existingUser,
          token,
          requiresRoleSelection: false
        };
      }
      
      // New user - prepare data for role selection
      const newUserData = {
        _id: `google_${googleUserInfo.sub}_${Date.now()}`,
        firstName: googleUserInfo.given_name || googleUserInfo.name.split(' ')[0] || 'User',
        lastName: googleUserInfo.family_name || googleUserInfo.name.split(' ').slice(1).join(' ') || '',
        email: googleUserInfo.email,
        role: 'job_seeker', // Default role
        avatar: googleUserInfo.picture,
        isActive: true,
        authProvider: 'google' as const,
        registrationCompleted: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      return {
        success: true,
        requiresRoleSelection: true,
        userData: newUserData
      };
      
    } catch (error) {
      console.error('❌ Error processing Google auth:', error);
      return {
        success: false,
        error: 'Failed to process Google authentication'
      };
    }
  }

  /**
   * Main sign-in method
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

    } catch (error) {
      console.error('❌ Google sign-in error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Google sign-in failed'
      };
    }
  }

  /**
   * Complete user registration with role selection
   */
  public async completeRegistration(userData: any, selectedRole: string): Promise<AuthResult> {
    try {
      const completeUser: User = {
        ...userData,
        role: selectedRole,
        registrationCompleted: true,
        updatedAt: new Date().toISOString()
      };

      // Save user to storage
      this.saveUser(completeUser);

      // Generate token and store session
      const token = this.generateToken(completeUser._id);
      this.storeAuthSession(completeUser, token);

      console.log('✅ Google registration completed:', completeUser.email);

      return {
        success: true,
        user: completeUser,
        token,
        requiresRoleSelection: false
      };

    } catch (error) {
      console.error('❌ Error completing Google registration:', error);
      return {
        success: false,
        error: 'Failed to complete registration'
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