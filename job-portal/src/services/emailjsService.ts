import emailjs from '@emailjs/browser';

// EmailJS configuration - Match with backend .env configuration
const EMAILJS_CONFIG = {
  SERVICE_ID: 'service_vtor3y8', // Your EmailJS service ID from .env
  VERIFICATION_TEMPLATE_ID: 'template_sikm5se', // Your EmailJS template ID for email verification
  PASSWORD_RESET_TEMPLATE_ID: 'template_9apzq9s', // Your EmailJS template ID for password reset
  WELCOME_TEMPLATE_ID: 'template_sikm5se', // Your EmailJS template ID for welcome email
  JOB_APPLICATION_TEMPLATE_ID: 'template_btwevvq', // Your EmailJS template ID for job applications
  JOB_RECOMMENDATION_TEMPLATE_ID: 'template_f0oaoz8', // NEW SIMPLE template for job recommendations
  JOB_RECOMMENDATION_TEMPLATE_ID_OLD: 'template_f0oaoz8', // OLD complex template (backup)
  PUBLIC_KEY: 'VLY7_POWX21gRHMof' // Your EmailJS public key from .env
};

// Daily email tracking with persistent storage
const DAILY_EMAIL_STORAGE_KEY = 'exjobnet_daily_email_tracker';

// Helper functions for persistent daily email tracking
const loadDailyEmailTracker = (): Map<string, string> => {
  try {
    const stored = localStorage.getItem(DAILY_EMAIL_STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      return new Map(Object.entries(data));
    }
  } catch (error) {
    console.warn('Failed to load daily email tracker from localStorage:', error);
  }
  return new Map<string, string>();
};

const saveDailyEmailTracker = (tracker: Map<string, string>): void => {
  try {
    const data = Object.fromEntries(tracker);
    localStorage.setItem(DAILY_EMAIL_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.warn('Failed to save daily email tracker to localStorage:', error);
  }
};

// Clean up old entries (older than 7 days) to prevent storage bloat
const cleanupOldEntries = (tracker: Map<string, string>): void => {
  const today = new Date();
  const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const cutoffDate = sevenDaysAgo.toISOString().split('T')[0];
  
  let cleaned = false;
  for (const [email, dateStr] of tracker.entries()) {
    if (dateStr < cutoffDate) {
      tracker.delete(email);
      cleaned = true;
    }
  }
  
  if (cleaned) {
    saveDailyEmailTracker(tracker);
    console.log('🧹 Cleaned up old daily email tracker entries');
  }
};

// Initialize tracker with persistent storage
const getDailyEmailTracker = (): Map<string, string> => {
  const tracker = loadDailyEmailTracker();
  cleanupOldEntries(tracker);
  return tracker;
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
      from_name: 'ExJobNet - Dynamic Career Platform',

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
      message: `Hi ${userName}!\n\nYou requested a password reset for your ExJobNet account. Click the link below to reset your password:\n\n${resetUrl}\n\nThis link will expire in 10 minutes for security reasons.\n\nIf you didn't request this, please ignore this email.\n\nBest regards,\nExJobNet Team`,
      subject: 'Password Reset - ExJobNet Dynamic Career Platform'
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
      dashboard_url: `${window.location.origin}/app/network`,
      jobs_url: `${window.location.origin}/jobs`,
      from_name: 'ExJobNet - Dynamic Career Platform',

      // EmailJS service configuration (recipient email)
      to_email: userEmail,
      user_email: userEmail,
      email: userEmail,
      email_id: userEmail,
      reply_to: userEmail,
      recipient: userEmail,
      send_to: userEmail,

      message: `Welcome to ExJobNet, ${userName}!\n\nYour account has been successfully created. You can now access your community and start exploring job opportunities on our dynamic career platform.\n\n🚀 Community: ${window.location.origin}/app/network\n💼 Browse Jobs: ${window.location.origin}/jobs\n\nWe're excited to help you find your dream job!\n\nBest regards,\nExJobNet Team`,
      subject: 'Welcome to ExJobNet - Dynamic Career Platform! 🎉'
    };

    // Check if EmailJS is properly configured
    if (EMAILJS_CONFIG.PUBLIC_KEY === 'YOUR_EMAILJS_PUBLIC_KEY') {
      // Fallback to console logging
      console.log('🎉 WELCOME EMAIL (Demo Mode)');
      console.log('=========================================================');
      console.log(`To: ${userEmail}`);
      console.log(`Name: ${userName}`);
      console.log(`Role: ${userRole}`);
      console.log(`Community URL: ${window.location.origin}/app/network`);
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
    console.log(`Welcome to ExJobNet, ${userName}!`);
    console.log('=================================');
    return false;
  }
};

// Simple email validation
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Daily email limit checking
export const canSendDailyEmail = (email: string): boolean => {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const tracker = getDailyEmailTracker();
  const lastSent = tracker.get(email);
  
  // If never sent before or last sent was not today, allow sending
  if (!lastSent || lastSent !== today) {
    return true;
  }
  
  console.log(`📧 Daily email limit reached for ${email}. Last sent: ${lastSent}`);
  return false;
};

// Mark email as sent today
export const markEmailSentToday = (email: string): void => {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const tracker = getDailyEmailTracker();
  tracker.set(email, today);
  saveDailyEmailTracker(tracker);
  console.log(`📧 Marked email sent today for ${email}: ${today}`);
};

// Get daily email status
export const getDailyEmailStatus = (email: string): { canSend: boolean; lastSent?: string } => {
  const tracker = getDailyEmailTracker();
  const lastSent = tracker.get(email);
  
  return {
    canSend: canSendDailyEmail(email),
    lastSent: lastSent
  };
};

// Clear daily email tracker (useful for testing or manual reset)
export const clearDailyEmailTracker = (): void => {
  try {
    localStorage.removeItem(DAILY_EMAIL_STORAGE_KEY);
    console.log('🧹 Daily email tracker cleared from localStorage');
  } catch (error) {
    console.warn('Failed to clear daily email tracker:', error);
  }
};

// Get all tracked emails and their last sent dates (for debugging)
export const getAllTrackedEmails = (): Record<string, string> => {
  const tracker = getDailyEmailTracker();
  return Object.fromEntries(tracker);
};

// Force reset email tracking for a specific email (useful for testing)
export const resetEmailTracking = (email: string): void => {
  const tracker = getDailyEmailTracker();
  tracker.delete(email);
  saveDailyEmailTracker(tracker);
  console.log(`🔄 Reset email tracking for ${email}`);
};

// Validate EmailJS configuration
export const validateEmailJSConfig = (): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!EMAILJS_CONFIG.SERVICE_ID || EMAILJS_CONFIG.SERVICE_ID === 'YOUR_SERVICE_ID') {
    errors.push('SERVICE_ID is not configured');
  }
  
  if (!EMAILJS_CONFIG.PUBLIC_KEY || EMAILJS_CONFIG.PUBLIC_KEY === 'YOUR_EMAILJS_PUBLIC_KEY') {
    errors.push('PUBLIC_KEY is not configured');
  }
  
  if (!EMAILJS_CONFIG.JOB_RECOMMENDATION_TEMPLATE_ID || EMAILJS_CONFIG.JOB_RECOMMENDATION_TEMPLATE_ID === 'YOUR_TEMPLATE_ID') {
    errors.push('JOB_RECOMMENDATION_TEMPLATE_ID is not configured');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Retry function for EmailJS sends
const retryEmailSend = async (
  serviceId: string,
  templateId: string,
  templateParams: any,
  publicKey: string,
  maxRetries: number = 3,
  delayMs: number = 2000
): Promise<any> => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`📧 Attempt ${attempt}/${maxRetries} to send email...`);
      const result = await emailjs.send(serviceId, templateId, templateParams, publicKey);
      return result;
    } catch (error: any) {
      lastError = error;
      console.warn(`⚠️ Attempt ${attempt}/${maxRetries} failed:`, error.text || error.message);
      
      // Don't retry on certain errors
      if (error.status === 400 || error.status === 401 || error.status === 403) {
        console.error(`❌ Non-retryable error (${error.status}), aborting retries`);
        throw error;
      }
      
      // Wait before retrying (except on last attempt)
      if (attempt < maxRetries) {
        console.log(`⏳ Waiting ${delayMs}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        delayMs *= 1.5; // Exponential backoff
      }
    }
  }
  
  throw lastError;
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
      from_name: 'ExJobNet - Dynamic Career Platform',
      message: 'This is a test email from ExJobNet Dynamic Career Platform.',
      subject: 'Test Email - ExJobNet'
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

// Send job application email to employer
export const sendJobApplicationEmail = async (
  employerEmail: string,
  candidateData: {
    name: string;
    email: string;
    phone?: string;
    location?: string;
    jobTitle?: string;
    skills?: string[];
    summary?: string;
    experience?: any[];
    education?: any[];
    resume?: string;
    cvFile?: string;
    profileCompletion: number;
  },
  jobData: {
    title: string;
    company: string;
    location: string;
  }
): Promise<boolean> => {
  try {
    const templateParams = {
      // Recipient (EmailJS "To email" should be set to {{to_email}} in the dashboard)
      to_email: employerEmail,
      reply_to: candidateData.email,

      // Job information
      job_title: jobData.title,
      job_company: jobData.company,
      job_location: jobData.location,

      // Candidate information
      candidate_name: candidateData.name,
      candidate_email: candidateData.email,
      candidate_phone: candidateData.phone || 'Not provided',
      candidate_location: candidateData.location || 'Not provided',
      candidate_job_title: candidateData.jobTitle || 'Not specified',

      // Skills as a simple string (template displays {{candidate_skills}})
      candidate_skills: candidateData.skills?.join(', ') || 'No skills listed',

      // Summary
      candidate_summary: candidateData.summary || 'No summary provided',

      // CV/Resume download link
      cv_download_link: candidateData.resume || candidateData.cvFile || '',
      // CV text and hint (avoid handlebars conditionals in template)
      cv_section_text: (candidateData.resume || candidateData.cvFile)
        ? 'CV/Resume available. Use the button below to download.'
        : 'No CV/Resume uploaded. Contact the candidate for their CV.',
      cv_hint_text: (candidateData.resume || candidateData.cvFile)
        ? 'Their CV/Resume is available below.'
        : 'Request their CV/Resume when you contact them.',

      // Professional background counts
      experience_count: candidateData.experience?.length || 0,
      education_count: candidateData.education?.length || 0,

      // Dates
      application_date: new Date().toLocaleDateString(),

      // Optional email meta
      from_name: 'ExJobNet - Dynamic Career Platform',
      subject: `New Job Application: ${candidateData.name} - ${jobData.title}`
    };

    // Check if EmailJS is properly configured
    if (EMAILJS_CONFIG.PUBLIC_KEY === 'YOUR_EMAILJS_PUBLIC_KEY') {
      // Fallback to console logging
      console.log('💼 JOB APPLICATION EMAIL (Demo Mode)');
      console.log('=========================================================');
      console.log(`To: ${employerEmail}`);
      console.log(`From: ${candidateData.name} (${candidateData.email})`);
      console.log(`Job: ${jobData.title} at ${jobData.company}`);

      console.log('=========================================================');
      console.log('💡 To send real emails, configure EmailJS credentials in emailjsService.ts');
      return true;
    }

    // Send real email using EmailJS
    console.log('📧 Sending job application email to employer:', employerEmail);
    console.log('📧 Candidate:', candidateData.name);
    console.log('📧 Job:', jobData.title, 'at', jobData.company);
    console.log('📧 Using template:', EMAILJS_CONFIG.JOB_APPLICATION_TEMPLATE_ID);

    // Sanitize params: coerce to simple strings and remove unsupported types
    const sanitizedParams = Object.fromEntries(
      Object.entries(templateParams).map(([key, value]) => {
        if (value === undefined || value === null) return [key, ''];
        if (Array.isArray(value)) return [key, value.join(', ')];
        if (typeof value === 'boolean') return [key, value ? 'Yes' : 'No'];
        if (typeof value === 'object') return [key, ''];
        return [key, String(value)];
      })
    );

    const result = await emailjs.send(
      EMAILJS_CONFIG.SERVICE_ID,
      EMAILJS_CONFIG.JOB_APPLICATION_TEMPLATE_ID,
      sanitizedParams,
      EMAILJS_CONFIG.PUBLIC_KEY
    );

    if (result.status === 200) {
      console.log('✅ Job application email sent successfully to:', employerEmail);
      return true;
    } else {
      console.error('❌ Failed to send job application email, status:', result.status);
      console.error('❌ EmailJS response:', result);
      return false;
    }
  } catch (error: any) {
    console.error('❌ Failed to send job application email:', error);
    console.error('❌ Error details:', error.text || error.message || error);

    // Check if it's an EmailJS specific error
    if (error.status) {
      console.error('❌ EmailJS Error Status:', error.status);
    }

    // Fallback to console logging
    console.log('💼 JOB APPLICATION EMAIL (Fallback)');
    console.log('=================================');
    console.log(`To: ${employerEmail}`);
    console.log(`From: ${candidateData.name} (${candidateData.email})`);
    console.log(`Job: ${jobData.title} at ${jobData.company}`);
    console.log(`Contact: ${candidateData.email}`);
    console.log('=================================');
    return false;
  }
};

// Send job recommendation emails (batch sending)
export const sendJobRecommendationEmails = async (
  emailRequests: Array<{
    user: {
      id: string;
      email: string;
      firstName: string;
      name?: string;
    };
    recommendations: Array<{
      id: string;
      title: string;
      company: string;
      location: string;
      jobType: string;
      matchPercentage: number;
      salary: string;
      skills: string[];
      jobUrl: string;
      matchColor: string;
    }>;
  }>
): Promise<{
  success: boolean;
  sent: number;
  failed: number;
  errors: Array<{ email: string; error: string }>;
}> => {
  const results = {
    success: true,
    sent: 0,
    failed: 0,
    errors: [] as Array<{ email: string; error: string }>
  };

  console.log(`📬 Processing ${emailRequests.length} job recommendation emails...`);

  // Validate EmailJS configuration first
  const configValidation = validateEmailJSConfig();
  if (!configValidation.isValid) {
    console.error('❌ EmailJS configuration is incomplete:', configValidation.errors);
    results.success = false;
    results.failed = emailRequests.length;
    emailRequests.forEach(request => {
      results.errors.push({
        email: request.user.email,
        error: `EmailJS configuration errors: ${configValidation.errors.join(', ')}`
      });
    });
    return results;
  }

  // Validate email addresses and check daily limits
  for (const emailRequest of emailRequests) {
    if (!isValidEmail(emailRequest.user.email)) {
      console.error(`❌ Invalid email address: ${emailRequest.user.email}`);
      results.failed++;
      results.success = false;
      results.errors.push({
        email: emailRequest.user.email,
        error: 'Invalid email address format'
      });
      continue;
    }

    // Check daily email limit
    if (!canSendDailyEmail(emailRequest.user.email)) {
      console.log(`📧 Skipping ${emailRequest.user.email} - daily email already sent`);
      results.failed++;
      results.success = false;
      results.errors.push({
        email: emailRequest.user.email,
        error: 'Daily email limit reached - one email per day allowed'
      });
      continue;
    }

    try {
      const { user, recommendations } = emailRequest;

      // Validate we have recommendations
      if (!recommendations || recommendations.length === 0) {
        throw new Error('No job recommendations provided');
      }

      // SIMPLE Template parameters - using minimal, safe variables
      // Create a simple job list string
      let jobsText = '';
      const topJobs = recommendations.slice(0, 3); // Only show top 3 jobs
      
      topJobs.forEach((job, index) => {
        jobsText += `${index + 1}. ${job.title} at ${job.company}\n`;
        jobsText += `   Location: ${job.location}\n`;
        jobsText += `   Match: ${Math.round(job.matchPercentage || 0)}%\n\n`;
      });
      
      const templateParams = {
        // Recipient email - MUST match EmailJS template "To Email" field
        to_email: user.email,
        
        // Simple template variables (NO complex conditionals or loops)
        user_name: user.firstName || user.name || 'Job Seeker',
        job_count: recommendations.length.toString(),
        jobs_list: jobsText.trim(),
        platform_name: 'ExJobNet',
        
        // Email metadata
        from_name: 'ExJobNet Job Recommendations',
        message: `Hi ${user.firstName || 'there'}! We found ${recommendations.length} new job opportunities that match your profile. Check them out below:`,
        subject: `${recommendations.length} New Job Matches for You!`
      };

      // Ensure all parameters are clean strings and remove undefined/null values
      const cleanParams: Record<string, string> = {};
      for (const [key, value] of Object.entries(templateParams)) {
        if (value !== undefined && value !== null) {
          cleanParams[key] = String(value).trim().replace(/[\r\n\t]/g, ' ');
        } else {
          cleanParams[key] = '';
        }
      }

      // Log clean parameters for debugging
      console.log(`📧 Sending job recommendations to ${user.email} (${recommendations.length} jobs)`);
      console.log(`📧 Using EmailJS Template ID: ${EMAILJS_CONFIG.JOB_RECOMMENDATION_TEMPLATE_ID}`);
      console.log(`📧 Using EmailJS Service ID: ${EMAILJS_CONFIG.SERVICE_ID}`);
      console.log(`📧 Recipient email validation:`, {
        originalEmail: user.email,
        isValidEmail: isValidEmail(user.email),
        emailLength: user.email?.length || 0
      });
      console.log(`📧 Simple email parameters being sent:`, {
        to_email: cleanParams.to_email,
        user_name: cleanParams.user_name,
        job_count: cleanParams.job_count,
        platform_name: cleanParams.platform_name,
        parameterCount: Object.keys(cleanParams).length
      });

      // Send email with retry mechanism
      const result = await retryEmailSend(
        EMAILJS_CONFIG.SERVICE_ID,
        EMAILJS_CONFIG.JOB_RECOMMENDATION_TEMPLATE_ID,
        cleanParams,
        EMAILJS_CONFIG.PUBLIC_KEY,
        3, // max retries
        1000 // initial delay
      );

      // Check result status
      if (result.status === 200) {
        console.log(`✅ Job recommendation email sent successfully to ${user.email}`);
        
        // Mark as sent today to prevent duplicate emails
        markEmailSentToday(user.email);
        
        results.sent++;
      } else {
        throw new Error(`EmailJS returned status ${result.status}: ${result.text || 'Unknown error'}`);
      }

      // Add delay between emails to avoid rate limits (minimum 500ms)
      if (emailRequests.length > 1) {
        await new Promise(resolve => setTimeout(resolve, 1500)); // 1.5 second delay
      }

    } catch (error: any) {
      console.error(`❌ Failed to send job recommendations to ${emailRequest.user.email}:`, error);
      
      // Extract more detailed error information
      let errorMessage = 'Unknown error';
      if (error.text) {
        errorMessage = error.text;
      } else if (error.message) {
        errorMessage = error.message;
      } else if (error.status) {
        errorMessage = `EmailJS status ${error.status}`;
      }

      // Log full error details for debugging
      console.error(`❌ Full error details:`, {
        message: error.message,
        text: error.text,
        status: error.status,
        name: error.name,
        stack: error.stack
      });

      results.failed++;
      results.success = false;
      results.errors.push({
        email: emailRequest.user.email,
        error: errorMessage
      });
    }
  }

  console.log(`📊 Job recommendation email results: ${results.sent} sent, ${results.failed} failed`);
  
  if (results.errors.length > 0) {
    console.error('❌ Email sending errors:', results.errors);
  }

  return results;
};

/**
 * Test function to verify EmailJS job recommendations with SIMPLE template
 * Uses minimal parameters to avoid template variable corruption
 */
export const testJobRecommendationEmail = async (testEmail: string): Promise<boolean> => {
  try {
    console.log(`🧪 Testing Simple Job Recommendation Email to: ${testEmail}`);
    
    // SIMPLE template parameters that won't cause corruption
    const testParams = {
      // Recipient email - MUST match EmailJS template "To Email" field
      to_email: testEmail,
      
      // Simple variables (no loops or conditionals)
      user_name: 'Test User',
      job_count: '3',
      platform_name: 'ExJobNet',
      
      // Simple job list as plain text
      jobs_list: `1. Senior Software Developer at TechCorp Rwanda
   Location: Kigali, Rwanda  
   Match: 85%

2. Frontend Engineer at Innovation Hub
   Location: Remote
   Match: 72%

3. Full Stack Developer at StartupXYZ
   Location: Nairobi, Kenya
   Match: 68%`,
      
      // Email content
      message: 'Hi Test User! We found 3 new job opportunities that match your profile. Check them out below:',
      from_name: 'ExJobNet Job Recommendations',
      subject: '3 New Job Matches for You!'
    };

    console.log(`🧪 Sending with template-matched parameters:`, testParams);

    const result = await emailjs.send(
      EMAILJS_CONFIG.SERVICE_ID,
      EMAILJS_CONFIG.JOB_RECOMMENDATION_TEMPLATE_ID,
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
    console.error('🧪 Test job recommendation email failed:', error);
    console.error('🧪 Error details:', error.text || error.message || error);
    return false;
  }
};

/**
 * Simple test function to verify the basic email sending works
 * This will help identify if the issue is with the recipient email parameter
 */
export const testBasicEmailSend = async (testEmail: string): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('🧪 Testing basic email send...');
    
    const basicParams = {
      to_email: testEmail,
      email: testEmail, // backup
      firstName: 'Test User',
      totalJobs: '1',
      if_plural_jobs: '',
      job1_title: 'Test Job',
      job1_matchPercentage: '75',
      job1_company: 'Test Company',
      job1_location: 'Test Location',
      job1_jobType: 'Full-time',
      from_name: 'ExJobNet Test'
    };
    
    console.log('📧 Test parameters:', basicParams);
    
    const result = await emailjs.send(
      EMAILJS_CONFIG.SERVICE_ID,
      EMAILJS_CONFIG.JOB_RECOMMENDATION_TEMPLATE_ID,
      basicParams,
      EMAILJS_CONFIG.PUBLIC_KEY
    );
    
    if (result.status === 200) {
      console.log('✅ Basic email test SUCCESS!');
      return { success: true };
    } else {
      return { success: false, error: `Status: ${result.status}` };
    }
    
  } catch (error: any) {
    console.error('❌ Basic email test failed:', error);
    return { 
      success: false, 
      error: error.text || error.message || 'Unknown error' 
    };
  }
};

/**
 * Instructions for fixing EmailJS template configuration
 */
export const getEmailJSConfigInstructions = (): string => {
  return `
🔧 SIMPLE EmailJS Template Setup Instructions:

1. Go to your EmailJS dashboard: https://dashboard.emailjs.com/
2. Create a NEW template with ID: template_simple_jobs
3. Configure the template:
   - To Email: {{to_email}}
   - From Name: {{from_name}}
   - Subject: {{subject}}

4. Template Content (SIMPLE HTML - no complex loops):
   <h2>🎯 Job Recommendations from {{platform_name}}</h2>
   <p>{{message}}</p>
   
   <h3>📋 Your Job Matches ({{job_count}} total):</h3>
   <pre>{{jobs_list}}</pre>
   
   <p>Visit <a href="https://exjobnet.com">ExJobNet</a> to apply!</p>
   <p>Best regards,<br>The ExJobNet Team</p>

5. Save the template and test.

✅ This simple template avoids variable corruption by:
- Using plain text variables (no conditionals like {{#if}})
- No loops ({{#each}})
- Simple string substitution only

Current template ID: ${EMAILJS_CONFIG.JOB_RECOMMENDATION_TEMPLATE_ID}
  `;
};

const jobPortalEmailjsService = {
  initEmailJS,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendJobApplicationEmail,
  sendJobRecommendationEmails,
  testJobRecommendationEmail,
  testBasicEmailSend,
  getEmailJSConfigInstructions,
  isValidEmail,
  validateEmailJSConfig,
  generateVerificationCode,
  testEmailJSConnection,
  // Daily email limit functions
  canSendDailyEmail,
  markEmailSentToday,
  getDailyEmailStatus
};

export default jobPortalEmailjsService;