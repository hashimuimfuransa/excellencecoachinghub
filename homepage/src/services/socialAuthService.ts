import { simpleGoogleAuth } from './googleAuthSimple';
import type { AuthResponse } from '../types/auth';



class SocialAuthService {
  private googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
  private isGoogleLoaded = false;

  // Initialize Google OAuth
  initializeGoogle(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isGoogleLoaded) {
        resolve();
        return;
      }

      if (!this.googleClientId) {
        reject(new Error('Google Client ID not configured. Please add VITE_GOOGLE_CLIENT_ID to your .env file'));
        return;
      }

      // Load Google Identity Services script
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        if (window.google && window.google.accounts) {
          this.isGoogleLoaded = true;
          resolve();
        } else {
          reject(new Error('Failed to load Google Identity Services'));
        }
      };
      
      script.onerror = () => {
        reject(new Error('Failed to load Google Identity Services script'));
      };
      
      document.head.appendChild(script);
    });
  }



  // Google Sign In using simplified approach
  async signInWithGoogle(): Promise<AuthResponse> {
    try {
      // Use the simple Google auth service
      return await simpleGoogleAuth.signInWithGSI();
    } catch (error: any) {
      throw new Error(`Google sign-in failed: ${error.message || 'Unknown error'}`);
    }
  }
}

export const socialAuthService = new SocialAuthService();