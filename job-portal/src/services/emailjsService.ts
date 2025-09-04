import emailjs from '@emailjs/browser';

// EmailJS configuration - Match with backend .env configuration
const EMAILJS_CONFIG = {
  SERVICE_ID: 'service_vtor3y8', // Your EmailJS service ID from .env
  VERIFICATION_TEMPLATE_ID: 'template_sikm5se', // Your EmailJS template ID for email verification
  PASSWORD_RESET_TEMPLATE_ID: 'template_9apzq9s', // Your EmailJS template ID for password reset
  WELCOME_TEMPLATE_ID: 'template_sikm5se', // Your EmailJS template ID for welcome email
  JOB_APPLICATION_TEMPLATE_ID: 'template_btwevvq', // Your EmailJS template ID for job applications
  JOB_RECOMMENDATION_TEMPLATE_ID: 'template_f0oaoz8', // Your EmailJS template ID for job recommendations - THIS IS THE IMPORTANT ONE!
  PUBLIC_KEY: 'VLY7_POWX21gRHMof' // Your EmailJS public key from .env
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

  for (const emailRequest of emailRequests) {
    try {
      const { user, recommendations } = emailRequest;

      // Template parameters that match your EmailJS template exactly
      const templateParams = {
        // Required by your template
        to_email: user.email,
        to_name: user.firstName || user.name || 'Job Seeker',
        firstName: user.firstName || user.name || 'there',
        totalJobs: recommendations.length.toString(),
        if_plural_jobs: recommendations.length > 1 ? 's' : '',
        
        // Email meta
        from_name: 'ExJobNet Job Portal',
        reply_to: 'noreply@exjobnet.com',
        subject: `${recommendations.length} New Job Match${recommendations.length > 1 ? 'es' : ''} Found`
      };

      // Add job parameters to match your EmailJS template exactly (up to 5 jobs)
      recommendations.slice(0, 5).forEach((job, index) => {
        const num = index + 1;
        
        // Match your template variables exactly
        templateParams[`job${num}_title`] = job.title || '';
        templateParams[`job${num}_matchPercentage`] = job.matchPercentage || 0;
        templateParams[`job${num}_company`] = job.company || '';
        templateParams[`job${num}_location`] = job.location || '';
        templateParams[`job${num}_jobType`] = job.jobType || '';
        templateParams[`job${num}_salary`] = job.salary || ''; // Optional in your template
        templateParams[`job${num}_skills`] = job.skills ? job.skills.join(', ') : ''; // Optional in your template
      });

      // Send email using EmailJS with your template_f0oaoz8
      console.log(`📧 Sending job recommendations to ${user.email} (${recommendations.length} jobs)`);
      console.log(`📧 Using EmailJS Template ID: ${EMAILJS_CONFIG.JOB_RECOMMENDATION_TEMPLATE_ID}`);
      console.log(`📧 Using EmailJS Service ID: ${EMAILJS_CONFIG.SERVICE_ID}`);
      // Ensure all parameters are clean strings
      const cleanParams = {};
      for (const [key, value] of Object.entries(templateParams)) {
        cleanParams[key] = String(value || '').trim();
      }

      console.log(`📧 Clean template parameters:`, {
        to_email: cleanParams.to_email,
        firstName: cleanParams.firstName,
        totalJobs: cleanParams.totalJobs,
        if_plural_jobs: cleanParams.if_plural_jobs,
        job1_title: cleanParams.job1_title || 'No job1',
        job1_matchPercentage: cleanParams.job1_matchPercentage || 'No match%',
        parameterCount: Object.keys(cleanParams).length
      });

      const result = await emailjs.send(
        EMAILJS_CONFIG.SERVICE_ID,
        EMAILJS_CONFIG.JOB_RECOMMENDATION_TEMPLATE_ID,
        cleanParams,
        EMAILJS_CONFIG.PUBLIC_KEY
      );

      if (result.status === 200) {
        console.log(`✅ Job recommendation email sent successfully to ${user.email}`);
        results.sent++;
      } else {
        throw new Error(`EmailJS returned status ${result.status}`);
      }

      // Add small delay between emails to avoid rate limits
      if (emailRequests.length > 1) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
      }

    } catch (error: any) {
      console.error(`❌ Failed to send job recommendations to ${emailRequest.user.email}:`, error);
      results.failed++;
      results.success = false;
      results.errors.push({
        email: emailRequest.user.email,
        error: error?.message || 'Unknown error'
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
 * Test function to verify EmailJS job recommendations with your template_f0oaoz8
 * Uses parameters that match your template exactly
 */
export const testJobRecommendationEmail = async (testEmail: string): Promise<boolean> => {
  try {
    console.log(`🧪 Testing Job Recommendation Email with template_f0oaoz8 to: ${testEmail}`);
    
    // Parameters that match your EmailJS template exactly
    const testParams = {
      // Required by your template
      to_email: testEmail,
      to_name: 'Test User',
      firstName: 'Test User',
      totalJobs: '2',
      if_plural_jobs: 's',
      
      // Email meta
      from_name: 'ExJobNet Job Portal',
      reply_to: 'noreply@exjobnet.com',
      subject: '2 New Job Matches Found',
      
      // Job 1 - matches your template variables exactly
      job1_title: 'Senior Software Developer',
      job1_matchPercentage: 85,
      job1_company: 'TechCorp Rwanda',
      job1_location: 'Kigali, Rwanda',
      job1_jobType: 'Full-time',
      job1_salary: '$60,000 - $80,000',
      job1_skills: 'JavaScript, React, Node.js',
      
      // Job 2 - matches your template variables exactly
      job2_title: 'Frontend Engineer',
      job2_matchPercentage: 72,
      job2_company: 'Innovation Hub',
      job2_location: 'Remote',
      job2_jobType: 'Contract',
      job2_salary: '$45,000',
      job2_skills: 'Vue.js, CSS, HTML'
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

const jobPortalEmailjsService = {
  initEmailJS,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendJobApplicationEmail,
  sendJobRecommendationEmails,
  testJobRecommendationEmail,
  isValidEmail,
  generateVerificationCode,
  testEmailJSConnection
};

export default jobPortalEmailjsService;