/**
 * Modern Google OAuth Authentication Service
 * Clean, reliable implementation using Google Identity Services
 * Integrates with the same backend API as local authentication
 */

import config from '../config/env';
import { apiPost, handleApiResponse } from './api';

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
      
      const result = handleApiResponse(response);
      console.log('🔍 Google auth result:', result);
      
      if (result.data) {
        if (result.data.requiresRoleSelection) {
          // New user needs role selection
          return {
            success: true,
            requiresRoleSelection: true,
            userData: result.data.googleUserData
          };
        } else {
          // Existing user - they should be logged in via sendTokenResponse
          // The result should contain user and token
          if (result.user && result.token) {
            localStorage.setItem('token', result.token);
            localStorage.setItem('user', JSON.stringify(result.user));
            
            console.log('✅ Existing Google user logged in:', result.user.email);
            
            return {
              success: true,
              user: result.user,
              token: result.token,
              requiresRoleSelection: false
            };
          }
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
      const authData = handleApiResponse(response);
      
      // Store token and user data (same as local auth)
      localStorage.setItem('token', authData.token);
      if (authData.user) {
        localStorage.setItem('user', JSON.stringify(authData.user));
      }
      
      // Welcome email is sent automatically by the backend
      console.log('✅ Google registration completed:', authData.user?.email);

      return {
        success: true,
        user: authData.user,
        token: authData.token,
        requiresRoleSelection: false
      };

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