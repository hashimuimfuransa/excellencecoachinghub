import { apiService } from './api';

export interface EmailRequest {
  email: string;
  name: string;
}

export interface WelcomeEmailRequest extends EmailRequest {
  role?: string;
}

export interface PasswordResetEmailRequest extends EmailRequest {
  resetUrl: string;
}

export const emailService = {
  /**
   * Send welcome email to new user
   */
  sendWelcomeEmail: async (email: string, name: string, role?: string): Promise<void> => {
    try {
      const response = await apiService.post('/email/welcome', {
        email,
        name
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to send welcome email');
      }

      console.log('✅ Welcome email sent successfully via backend API');
    } catch (error: any) {
      console.error('❌ Failed to send welcome email:', error);
      throw new Error(error.message || 'Failed to send welcome email');
    }
  },

  /**
   * Send password reset email
   */
  sendPasswordResetEmail: async (email: string, name: string, resetUrl: string): Promise<void> => {
    try {
      const response = await apiService.post('/email/password-reset', {
        email,
        name,
        resetUrl
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to send password reset email');
      }

      console.log('✅ Password reset email sent successfully via backend API');
    } catch (error: any) {
      console.error('❌ Failed to send password reset email:', error);
      throw new Error(error.message || 'Failed to send password reset email');
    }
  },

  /**
   * Send custom email
   */
  sendCustomEmail: async (
    to: string, 
    subject: string, 
    text?: string, 
    html?: string
  ): Promise<void> => {
    try {
      const response = await apiService.post('/email/custom', {
        to,
        subject,
        text,
        html
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to send email');
      }

      console.log('✅ Custom email sent successfully via backend API');
    } catch (error: any) {
      console.error('❌ Failed to send custom email:', error);
      throw new Error(error.message || 'Failed to send custom email');
    }
  },

  /**
   * Test email configuration
   */
  testEmailConfig: async (): Promise<boolean> => {
    try {
      const response = await apiService.get('/email/test-config');
      return response.success || false;
    } catch (error: any) {
      console.error('❌ Failed to test email configuration:', error);
      return false;
    }
  }
};