import emailjs from '@emailjs/browser';

// EmailJS configuration - Uses same config as homepage for consistency
const EMAILJS_CONFIG = {
  SERVICE_ID: 'service_vtor3y8', // Your EmailJS service ID
  VERIFICATION_TEMPLATE_ID: 'template_sikm5se', // Your EmailJS template ID for email verification
  PASSWORD_RESET_TEMPLATE_ID: 'template_9apzq9s', // Your EmailJS template ID for password reset
  WELCOME_TEMPLATE_ID: 'template_sikm5se', // Your EmailJS template ID for welcome email
  PUBLIC_KEY: 'VLY7_POWX21gRHMof' // Your EmailJS public key
};

// Initialize EmailJS
export const initEmailJS = () => {
  emailjs.init(EMAILJS_CONFIG.PUBLIC_KEY);
  console.log('📧 Job Portal EmailJS initialized with config:', {
    SERVICE_ID: EMAILJS_CONFIG.SERVICE_ID,
    VERIFICATION_TEMPLATE_ID: EMAILJS_CONFIG.VERIFICATION_TEMPLATE_ID,
    PASSWORD_RESET_TEMPLATE_ID: EMAILJS_CONFIG.PASSWORD_RESET_TEMPLATE_ID,
    WELCOME_TEMPLATE_ID: EMAILJS_CONFIG.WELCOME_TEMPLATE_ID,
    PUBLIC_KEY: EMAILJS_CONFIG.PUBLIC_KEY.substring(0, 8) + '...' // Only show first 8 chars for security
  });
};

// Send password reset email
export const sendPasswordResetEmail = async (
  userEmail: string,
  userName: string,
  resetToken: string
): Promise<boolean> => {
  try {
    // Parameters that match your EmailJS template
    const resetUrl = `${window.location.origin}/reset-password?token=${resetToken}`;

    const templateParams = {
      // Template variables (what your template expects)
      to_name: userName,
      reset_url: resetUrl,
      link: resetUrl,  // Alternative parameter name
      from_name: 'Excellence Coaching Hub - Job Portal',

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
      message: `Hi ${userName}!\n\nYou requested a password reset for your Excellence Coaching Hub Job Portal account. Click the link below to reset your password:\n\n${resetUrl}\n\nThis link will expire in 10 minutes for security reasons.\n\nIf you didn't request this, please ignore this email.\n\nBest regards,\nExcellence Coaching Hub Team`,
      subject: 'Password Reset - Excellence Coaching Hub Job Portal'
    };

    // Check if EmailJS is properly configured
    if (EMAILJS_CONFIG.PUBLIC_KEY === 'YOUR_EMAILJS_PUBLIC_KEY') {
      // Fallback to console logging
      console.log('🔐 PASSWORD RESET EMAIL (Demo Mode)');
      console.log('=========================================================');
      console.log(`To: ${userEmail}`);
      console.log(`Name: ${userName}`);
      console.log(`Reset Token: ${resetToken}`);
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
    console.log(`Reset URL: ${window.location.origin}/reset-password?token=${resetToken}`);
    console.log('=================================');
    return false;
  }
};

// Send welcome email after successful registration
export const sendWelcomeEmail = async (
  userEmail: string,
  userName: string,
  userRole: string = 'user'
): Promise<boolean> => {
  try {
    const templateParams = {
      to_name: userName,
      user_role: userRole,
      dashboard_url: `${window.location.origin}/dashboard`,
      jobs_url: `${window.location.origin}/jobs`,
      from_name: 'Excellence Coaching Hub - Job Portal',

      // EmailJS service configuration (recipient email)
      to_email: userEmail,
      user_email: userEmail,
      email: userEmail,
      email_id: userEmail,
      reply_to: userEmail,
      recipient: userEmail,
      send_to: userEmail,

      message: `Welcome to Excellence Coaching Hub Job Portal, ${userName}!\n\nYour account has been successfully created. You can now access your dashboard and start exploring job opportunities.\n\n🚀 Dashboard: ${window.location.origin}/dashboard\n💼 Browse Jobs: ${window.location.origin}/jobs\n\nWe're excited to help you find your dream job!\n\nBest regards,\nExcellence Coaching Hub Team`,
      subject: 'Welcome to Excellence Coaching Hub Job Portal! 🎉'
    };

    // Check if EmailJS is properly configured
    if (EMAILJS_CONFIG.PUBLIC_KEY === 'YOUR_EMAILJS_PUBLIC_KEY') {
      // Fallback to console logging
      console.log('🎉 WELCOME EMAIL (Demo Mode)');
      console.log('=========================================================');
      console.log(`To: ${userEmail}`);
      console.log(`Name: ${userName}`);
      console.log(`Role: ${userRole}`);
      console.log(`Dashboard URL: ${window.location.origin}/dashboard`);
      console.log(`Jobs URL: ${window.location.origin}/jobs`);
      console.log('=========================================================');
      console.log('💡 To send real emails, configure EmailJS credentials in emailjsService.ts');
      return true;
    }

    // Send real email using EmailJS
    console.log('📧 Sending welcome email to:', userEmail);
    console.log('📧 Using welcome template:', EMAILJS_CONFIG.WELCOME_TEMPLATE_ID);

    const result = await emailjs.send(
      EMAILJS_CONFIG.SERVICE_ID,
      EMAILJS_CONFIG.WELCOME_TEMPLATE_ID,
      templateParams,
      EMAILJS_CONFIG.PUBLIC_KEY
    );

    if (result.status === 200) {
      console.log('✅ Welcome email sent successfully to:', userEmail);
      return true;
    } else {
      console.error('❌ Failed to send welcome email, status:', result.status);
      console.error('❌ EmailJS response:', result);
      return false;
    }
  } catch (error: any) {
    console.error('❌ Failed to send welcome email:', error);
    console.error('❌ Error details:', error.text || error.message || error);
    
    // Fallback to console logging
    console.log('🎉 WELCOME EMAIL (Fallback)');
    console.log('=================================');
    console.log(`To: ${userEmail}`);
    console.log(`Welcome to Excellence Coaching Hub Job Portal, ${userName}!`);
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
    console.log('🧪 Testing Job Portal EmailJS connection...');

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
      from_name: 'Excellence Coaching Hub - Job Portal',
      message: 'This is a test email from Excellence Coaching Hub Job Portal.',
      subject: 'Test Email - Job Portal'
    };

    console.log('📧 Sending test email with params:', testParams);

    const result = await emailjs.send(
      EMAILJS_CONFIG.SERVICE_ID,
      EMAILJS_CONFIG.VERIFICATION_TEMPLATE_ID,
      testParams,
      EMAILJS_CONFIG.PUBLIC_KEY
    );

    if (result.status === 200) {
      console.log('✅ Test email sent successfully from Job Portal!');
      return true;
    } else {
      console.error('❌ Test email failed, status:', result.status);
      return false;
    }
  } catch (error: any) {
    console.error('❌ Job Portal EmailJS test failed:', error);
    console.error('❌ Error details:', error.text || error.message || error);
    return false;
  }
};

const jobPortalEmailjsService = {
  initEmailJS,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  isValidEmail,
  generateVerificationCode,
  testEmailJSConnection
};

export default jobPortalEmailjsService;