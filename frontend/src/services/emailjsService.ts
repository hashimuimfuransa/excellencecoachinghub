import emailjs from '@emailjs/browser';

// EmailJS configuration - Replace with your actual EmailJS credentials
const EMAILJS_CONFIG = {
  SERVICE_ID: 'service_kcxmoga', // Your EmailJS service ID
  VERIFICATION_TEMPLATE_ID: 'template_sikm5se', // Your EmailJS template ID for email verification
  PASSWORD_RESET_TEMPLATE_ID: 'template_9apzq9s', // Your EmailJS template ID for password reset
  PUBLIC_KEY: 'VLY7_POWX21gRHMof' // Your EmailJS public key
};

// Initialize EmailJS
export const initEmailJS = () => {
  emailjs.init(EMAILJS_CONFIG.PUBLIC_KEY);
  console.log('📧 EmailJS initialized with config:', {
    SERVICE_ID: EMAILJS_CONFIG.SERVICE_ID,
    VERIFICATION_TEMPLATE_ID: EMAILJS_CONFIG.VERIFICATION_TEMPLATE_ID,
    PASSWORD_RESET_TEMPLATE_ID: EMAILJS_CONFIG.PASSWORD_RESET_TEMPLATE_ID,
    PUBLIC_KEY: EMAILJS_CONFIG.PUBLIC_KEY.substring(0, 8) + '...' // Only show first 8 chars for security
  });
};

// Send verification email using EmailJS
export const sendVerificationEmail = async (
  userEmail: string,
  userName: string,
  verificationCode: string
): Promise<boolean> => {
  try {
    // Parameters that match your EmailJS template exactly
    const templateParams = {
      // Template variables (what your template expects)
      to_name: userName,
      verification_url: `${window.location.origin}/verify-email?token=${verificationCode}`,
      from_name: 'Excellence Coaching Hub'
    };

    // Add recipient email with the most common parameter names
    // EmailJS services often expect one of these specific names
    const recipientParams = {
      email_id: userEmail,        // Most common for Gmail service
      to_email: userEmail,        // Standard parameter
      user_email: userEmail,      // Alternative
      email: userEmail,           // Simple version
      reply_to: userEmail,        // Sometimes used
      recipient: userEmail,       // Generic
      send_to: userEmail          // Alternative
    };

    // Combine template and recipient parameters
    const finalParams = { ...templateParams, ...recipientParams };

    // Check if EmailJS is properly configured
    if (EMAILJS_CONFIG.PUBLIC_KEY === 'YOUR_EMAILJS_PUBLIC_KEY') {
      // Fallback to console logging if not configured
      console.log('📧 EMAIL VERIFICATION (Configure EmailJS for real emails)');
      console.log('=========================================================');
      console.log(`To: ${userEmail}`);
      console.log(`Name: ${userName}`);
      console.log(`Verification Code: ${verificationCode}`);
      console.log(`Verification URL: ${finalParams.verification_url}`);
      console.log('=========================================================');
      console.log('💡 To send real emails, configure EmailJS credentials in emailjsService.ts');
      return true;
    }

    // Send real email using EmailJS
    console.log('📧 Sending real email to:', userEmail);
    console.log('📧 Template parameters:', finalParams);
    console.log('📧 EmailJS Config:', {
      SERVICE_ID: EMAILJS_CONFIG.SERVICE_ID,
      TEMPLATE_ID: EMAILJS_CONFIG.VERIFICATION_TEMPLATE_ID,
      PUBLIC_KEY: EMAILJS_CONFIG.PUBLIC_KEY.substring(0, 8) + '...'
    });

    const result = await emailjs.send(
      EMAILJS_CONFIG.SERVICE_ID,
      EMAILJS_CONFIG.VERIFICATION_TEMPLATE_ID,
      finalParams,
      EMAILJS_CONFIG.PUBLIC_KEY
    );

    if (result.status === 200) {
      console.log('✅ Email sent successfully to:', userEmail);
      return true;
    } else {
      console.error('❌ Failed to send email, status:', result.status);
      console.error('❌ EmailJS response:', result);
      return false;
    }
  } catch (error: any) {
    console.error('❌ Failed to send verification email:', error);
    console.error('❌ Error details:', error.text || error.message || error);

    // Check if it's an EmailJS specific error
    if (error.status) {
      console.error('❌ EmailJS Error Status:', error.status);
    }

    // Fallback to console logging
    console.log('📧 EMAIL VERIFICATION (Fallback)');
    console.log('=================================');
    console.log(`To: ${userEmail}`);
    console.log(`Verification URL: ${window.location.origin}/verify-email?token=${verificationCode}`);
    console.log('=================================');
    return false;
  }
};

// Send password reset email
export const sendPasswordResetEmail = async (
  userEmail: string,
  userName: string,
  resetCode: string
): Promise<boolean> => {
  try {
    // Parameters that match your EmailJS template
    const resetUrl = `${window.location.origin}/reset-password?token=${resetCode}`;

    const templateParams = {
      // Template variables (what your template expects)
      to_name: userName,
      reset_url: resetUrl,
      link: resetUrl,  // Alternative parameter name
      from_name: 'Excellence Coaching Hub',

      // EmailJS service configuration (recipient email)
      // Try all common parameter names for recipient
      to_email: userEmail,
      user_email: userEmail,
      email: userEmail,
      email_id: userEmail,
      reply_to: userEmail,
      recipient: userEmail,
      send_to: userEmail,

      // Additional parameters for compatibility
      message: `Hi ${userName}!\n\nYou requested a password reset for your Excellence Coaching Hub account. Click the link below to reset your password:\n\n${resetUrl}\n\nThis link will expire in one hour.\n\nIf you didn't request this, please ignore this email.\n\nBest regards,\nExcellence Coaching Hub Team`,
      subject: 'Password Reset - Excellence Coaching Hub'
    };

    // Check if EmailJS is properly configured
    if (EMAILJS_CONFIG.PUBLIC_KEY === 'YOUR_EMAILJS_PUBLIC_KEY') {
      // Fallback to console logging
      console.log('🔐 PASSWORD RESET EMAIL (Demo Mode)');
      console.log('=========================================================');
      console.log(`To: ${userEmail}`);
      console.log(`Name: ${userName}`);
      console.log(`Reset Code: ${resetCode}`);
      console.log(`Reset URL: ${resetUrl}`);
      console.log('=========================================================');
      console.log('💡 To send real emails, configure EmailJS credentials in emailjsService.ts');
      return true;
    }

    // Send real email using EmailJS
    console.log('📧 Sending password reset email to:', userEmail);
    console.log('📧 Using password reset template:', EMAILJS_CONFIG.PASSWORD_RESET_TEMPLATE_ID);
    console.log('📧 Template parameters:', templateParams);

    const result = await emailjs.send(
      EMAILJS_CONFIG.SERVICE_ID,
      EMAILJS_CONFIG.PASSWORD_RESET_TEMPLATE_ID,
      templateParams,
      EMAILJS_CONFIG.PUBLIC_KEY
    );

    if (result.status === 200) {
      console.log('✅ Password reset email sent successfully to:', userEmail);
      return true;
    } else {
      console.error('❌ Failed to send password reset email, status:', result.status);
      console.error('❌ EmailJS response:', result);
      return false;
    }
  } catch (error: any) {
    console.error('❌ Failed to send password reset email:', error);
    console.error('❌ Error details:', error.text || error.message || error);

    // Check if it's an EmailJS specific error
    if (error.status) {
      console.error('❌ EmailJS Error Status:', error.status);
    }

    // Fallback to console logging
    console.log('🔐 PASSWORD RESET EMAIL (Fallback)');
    console.log('=================================');
    console.log(`To: ${userEmail}`);
    console.log(`Reset URL: ${window.location.origin}/reset-password?token=${resetCode}`);
    console.log('=================================');
    return false;
  }
};

// Simple email validation
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Generate a simple verification code
export const generateVerificationCode = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

// Test EmailJS with minimal parameters
export const testEmailJSConnection = async (testEmail: string): Promise<boolean> => {
  try {
    console.log('🧪 Testing EmailJS connection...');

    // Use comprehensive template parameters to ensure compatibility
    const testParams = {
      // Multiple recipient parameter names
      to_email: testEmail,
      to_name: 'Test User',
      user_email: testEmail,
      user_name: 'Test User',
      email: testEmail,
      name: 'Test User',
      recipient_email: testEmail,
      recipient_name: 'Test User',

      // Sender and content
      from_name: 'Excellence Coaching Hub',
      message: 'This is a test email from Excellence Coaching Hub.',
      subject: 'Test Email'
    };

    console.log('📧 Sending test email with params:', testParams);

    const result = await emailjs.send(
      EMAILJS_CONFIG.SERVICE_ID,
      EMAILJS_CONFIG.VERIFICATION_TEMPLATE_ID,
      testParams,
      EMAILJS_CONFIG.PUBLIC_KEY
    );

    if (result.status === 200) {
      console.log('✅ Test email sent successfully!');
      return true;
    } else {
      console.error('❌ Test email failed, status:', result.status);
      return false;
    }
  } catch (error: any) {
    console.error('❌ EmailJS test failed:', error);
    console.error('❌ Error details:', error.text || error.message || error);
    return false;
  }
};

const emailjsService = {
  initEmailJS,
  sendVerificationEmail,
  sendPasswordResetEmail,
  isValidEmail,
  generateVerificationCode,
  testEmailJSConnection
};

export default emailjsService;
