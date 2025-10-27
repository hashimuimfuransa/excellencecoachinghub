import axios, { AxiosResponse } from 'axios';

/**
 * SendGrid Email Service
 * Replaces EmailJS with SendGrid's REST API for server-side email sending
 */

/**
 * Get production URLs with robust fallback logic
 */
function getProductionUrl(type: 'backend' | 'frontend'): string {
  // Check if we're running on Render (production)
  const isRender = process.env.RENDER === 'true' || process.env.NODE_ENV === 'production';
  
  if (type === 'backend') {
    // Backend URL priority: environment variable > production default > localhost
    return process.env.BACKEND_URL || 
           (isRender ? 'https://ech-w16g.onrender.com' : 'http://localhost:5000');
  } else {
    // Frontend URL priority: environment variable > production default > localhost
    return process.env.JOB_PORTAL_URL || 
           (isRender ? 'https://exjobnet.com' : 'http://localhost:3000');
  }
}

interface SendEmailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
}

interface SendGridPersonalization {
  to: Array<{ email: string; name?: string }>;
}

interface SendGridContent {
  type: 'text/plain' | 'text/html';
  value: string;
}

interface SendGridEmailPayload {
  personalizations: SendGridPersonalization[];
  from: { email: string; name?: string };
  subject: string;
  content: SendGridContent[];
  tracking_settings?: {
    click_tracking?: { enable: boolean; enable_text: boolean };
    open_tracking?: { enable: boolean; substitution_tag?: string };
    subscription_tracking?: { enable: boolean };
  };
  categories?: string[];
}

// Get unsubscribe link for emails
const getUnsubscribeLink = (email: string): string => {
  const baseUrl = process.env.BACKEND_URL || 'http://localhost:5000';
  // Create a simple unsubscribe token (in production, use proper JWT)
  const unsubscribeToken = Buffer.from(email).toString('base64');
  return `${baseUrl}/api/email/unsubscribe?token=${unsubscribeToken}`;
};

// Add unsubscribe button to HTML content
const addUnsubscribeButton = (html: string, email: string): string => {
  const unsubscribeLink = getUnsubscribeLink(email);
  const unsubscribeHtml = `
    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
      <a href="${unsubscribeLink}" 
         style="color: #666; font-size: 12px; text-decoration: underline;">
        Unsubscribe from these emails
      </a>
    </div>
  `;
  
  // Insert before closing div or body tag, or at the end if neither found
  if (html.includes('</div>')) {
    return html.replace(/<\/div>([^<]*?)$/, unsubscribeHtml + '</div>$1');
  } else if (html.includes('</body>')) {
    return html.replace('</body>', unsubscribeHtml + '</body>');
  } else {
    return html + unsubscribeHtml;
  }
};

// Core SendGrid email function
export const sendEmail = async ({ to, subject, text, html }: SendEmailOptions): Promise<void> => {
  const apiKey = process.env.SENDGRID_API_KEY;
  
  if (!apiKey) {
    throw new Error('SENDGRID_API_KEY is not configured in environment variables');
  }

  const fromEmail = process.env.EMAIL_FROM || 'info@excellencecoachinghub.com';
  const fromName = 'Excellence Coaching Hub';

  // Add unsubscribe button to HTML content
  const htmlWithUnsubscribe = addUnsubscribeButton(html, to);

  const payload: SendGridEmailPayload = {
    personalizations: [
      {
        to: [{ email: to }]
      }
    ],
    from: {
      email: fromEmail,
      name: fromName
    },
    subject,
    content: [
      {
        type: 'text/plain',
        value: text
      },
      {
        type: 'text/html',
        value: htmlWithUnsubscribe
      }
    ],
    // Enable tracking for webhook events
    tracking_settings: {
      click_tracking: {
        enable: true,
        enable_text: true
      },
      open_tracking: {
        enable: true
      },
      subscription_tracking: {
        enable: true
      }
    },
    // Add categories for better event tracking
    categories: ['transactional', 'excellencecoaching']
  };

  try {
    const response: AxiosResponse = await axios.post(
      'https://api.sendgrid.com/v3/mail/send',
      payload,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.status === 202) {
      console.log('✅ Email sent successfully via SendGrid to:', to);
    } else {
      console.error('❌ Unexpected SendGrid response status:', response.status);
      throw new Error(`SendGrid returned status ${response.status}`);
    }
  } catch (error: any) {
    const errorMessage = error.response?.data?.errors?.[0]?.message || error.message;
    console.error('❌ Failed to send email via SendGrid:', error.response?.data || error.message);
    
    // In development mode, log the email content instead of crashing
    if (process.env.NODE_ENV === 'development') {
      console.log('📧 [DEV MODE] Email would have been sent:');
      console.log('  To:', to);
      console.log('  Subject:', subject);
      console.log('  From:', fromEmail);
      console.log('  Error:', errorMessage);
      
      // Check if it's a sender identity error
      if (errorMessage.includes('Sender Identity') || errorMessage.includes('verified')) {
        console.log('');
        console.log('⚠️  SENDGRID SETUP REQUIRED:');
        console.log('   1. Go to: https://app.sendgrid.com/settings/sender_auth');
        console.log('   2. Verify your sender email:', fromEmail);
        console.log('   3. Or add EMAIL_FROM=your-verified-email@domain.com to .env');
        console.log('');
        
        // Don't throw error in development - just log it
        return;
      }
    }
    
    throw new Error(`SendGrid email send failed: ${errorMessage}`);
  }
};

// Welcome email template with platform-specific services
export const sendWelcomeEmail = async (
  email: string, 
  name: string, 
  platform: string = 'homepage',
  platformUrl: string = ''
): Promise<void> => {
  const subject = 'Welcome to Excellence Coaching Hub! 🎉';
  
  // Generate HTML using the same template logic from emailService
  const getWelcomeHTML = (platform: string) => {
    // Determine platform-specific services
    const getServicesSection = (platform: string) => {
      switch (platform) {
        case 'elearning':
          return `
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #1976d2; margin-top: 0;">🎓 E-Learning Platform Services</h3>
              <ul style="color: #333; margin: 0; padding-left: 20px;">
                <li><strong>Interactive Courses:</strong> Access comprehensive courses across various subjects with multimedia content</li>
                <li><strong>AI-Powered Learning Assistant:</strong> Get instant help and personalized learning recommendations</li>
                <li><strong>Live Virtual Classes:</strong> Join real-time sessions with expert instructors and peers</li>
                <li><strong>Smart Assessments:</strong> Take AI-graded quizzes and exams with instant feedback</li>
                <li><strong>Progress Tracking:</strong> Monitor your learning journey with detailed analytics</li>
                <li><strong>Digital Certificates:</strong> Earn blockchain-verified certificates upon course completion</li>
                <li><strong>Study Groups:</strong> Collaborate with fellow learners in virtual study rooms</li>
                <li><strong>Mobile Learning:</strong> Learn anywhere with our responsive mobile platform</li>
              </ul>
            </div>
          `;
        case 'job-portal':
          return `
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #1976d2; margin-top: 0;">💼 ExJobNet Platform Services</h3>
              <ul style="color: #333; margin: 0; padding-left: 20px;">
                <li><strong>Smart Job Matching:</strong> AI-powered job recommendations based on your skills and preferences</li>
                <li><strong>AI Interview Coaching:</strong> Practice with our AI interviewer and get real-time feedback</li>
                <li><strong>Psychometric Testing:</strong> Comprehensive personality and skills assessments</li>
                <li><strong>Career Guidance:</strong> Personalized career counseling and development planning</li>
                <li><strong>Professional Networking:</strong> Connect with industry professionals and mentors</li>
                <li><strong>Digital Portfolio Builder:</strong> Create compelling professional profiles and portfolios</li>
                <li><strong>Employer Dashboard:</strong> For recruiters - access advanced talent acquisition tools</li>
                <li><strong>Blockchain Certificates:</strong> Secure, verifiable digital credentials</li>
              </ul>
            </div>
          `;
        case 'homepage':
        default:
          return `
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #1976d2; margin-top: 0;">🌟 Complete Excellence Coaching Hub Services</h3>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                <div>
                  <h4 style="color: #1976d2; margin: 10px 0 5px 0; font-size: 14px;">🎓 Academic Coaching</h4>
                  <ul style="color: #333; margin: 0; padding-left: 15px; font-size: 13px;">
                    <li>High School Academic Support</li>
                    <li>University Exam Preparation</li>
                    <li>Study Skills & Time Management</li>
                  </ul>
                </div>
                <div>
                  <h4 style="color: #ff5722; margin: 10px 0 5px 0; font-size: 14px;">💼 Career Services</h4>
                  <ul style="color: #333; margin: 0; padding-left: 15px; font-size: 13px;">
                    <li>AI-Powered Job Matching</li>
                    <li>Interview Preparation</li>
                    <li>Career Guidance & Mentorship</li>
                  </ul>
                </div>
                <div>
                  <h4 style="color: #3f51b5; margin: 10px 0 5px 0; font-size: 14px;">💻 Technology Training</h4>
                  <ul style="color: #333; margin: 0; padding-left: 15px; font-size: 13px;">
                    <li>Software Development</li>
                    <li>Web & Mobile Development</li>
                    <li>Cloud Computing & DevOps</li>
                  </ul>
                </div>
                <div>
                  <h4 style="color: #4caf50; margin: 10px 0 5px 0; font-size: 14px;">📊 Business & Analytics</h4>
                  <ul style="color: #333; margin: 0; padding-left: 15px; font-size: 13px;">
                    <li>Data Analytics & Visualization</li>
                    <li>Business Management</li>
                    <li>Entrepreneurship Training</li>
                  </ul>
                </div>
              </div>
            </div>
          `;
      }
    };

    return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1976d2;">Welcome to Excellence Coaching Hub! 🎉</h2>
      <p>Hi ${name},</p>
      <p>Thank you for joining Excellence Coaching Hub! We're excited to have you on board and can't wait to help you achieve your goals with our comprehensive career development platform.</p>
      
      ${getServicesSection(platform)}

      <div style="background-color: #e8f5e9; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #2e7d32; margin-top: 0;">🚀 Your Next Steps</h3>
        <ol style="color: #333; margin: 0; padding-left: 20px;">
          <li><strong>Complete Your Profile:</strong> Add your skills, experience, and career goals</li>
          <li><strong>Explore Our Platforms:</strong> Discover job opportunities and learning resources</li>
          <li><strong>Take Assessments:</strong> Get matched with suitable opportunities through our AI tools</li>
          <li><strong>Start Learning:</strong> Enroll in courses that advance your career</li>
          <li><strong>Network & Connect:</strong> Build professional relationships with industry experts</li>
        </ol>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${platformUrl || '#'}" 
           style="background-color: #1976d2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 5px;">
          🚀 Get Started Now
        </a>
        ${platform === 'elearning' ? `
        <a href="${getProductionUrl('frontend')}" 
           style="background-color: #ff5722; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 5px;">
          💼 Find Jobs
        </a>
        ` : ''}
        ${platform === 'job-portal' ? `
        <a href="${process.env.FRONTEND_URL || 'http://localhost:3001'}" 
           style="background-color: #3f51b5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 5px;">
          🎓 Start Learning
        </a>
        ` : ''}
        ${platform === 'homepage' ? `
        <a href="${getProductionUrl('frontend')}" 
           style="background-color: #ff5722; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 5px;">
          💼 Job Portal
        </a>
        <a href="${process.env.FRONTEND_URL || 'http://localhost:3001'}" 
           style="background-color: #3f51b5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 5px;">
          🎓 E-Learning
        </a>
        ` : ''}
      </div>

      <div style="background-color: #fff3e0; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ff9800;">
        <p style="margin: 0; color: #ef6c00;"><strong>🎯 Pro Tips for Success:</strong></p>
        <ul style="color: #333; margin: 10px 0 0 0; padding-left: 20px; font-size: 14px;">
          <li>Complete your profile within 48 hours for priority access to opportunities</li>
          <li>Take our psychometric tests to get matched with your ideal career path</li>
          <li>Join our professional networking community to connect with mentors</li>
          <li>Enable notifications to stay updated on new job postings and courses</li>
        </ul>
      </div>

      <div style="background-color: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <h4 style="color: #1565c0; margin-top: 0;">📞 Need Help Getting Started?</h4>
        <p style="margin: 5px 0; color: #333; font-size: 14px;">Our support team is here to help you make the most of our platform:</p>
        <ul style="color: #333; margin: 5px 0; padding-left: 20px; font-size: 14px;">
          <li>📧 Email: info@excellencecoachinghub.com</li>
          <li>💬 Live Chat: Available 24/7 on our platform</li>
          <li>📚 Help Center: Comprehensive guides and tutorials</li>
        </ul>
      </div>

      <p>We're committed to empowering your career journey and helping you achieve excellence in your chosen field. Welcome to a community of ambitious professionals and learners!</p>
      <p style="font-weight: bold; color: #1976d2;">Here's to your success and bright future! 🌟</p>
      
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
      <p style="color: #666; font-size: 12px;">
        Excellence Coaching Hub Team<br>
        Empowering careers, one step at a time 🚀<br>
        Africa's Leading Career Development Platform<br>
        This is an automated email, please do not reply.
      </p>
    </div>
    `;
  };

  const html = getWelcomeHTML(platform);
  const text = `Hi ${name}, welcome to Excellence Coaching Hub! We're excited to have you on board.`;

  await sendEmail({ to: email, subject, text, html });
};

// Password reset email template
export const sendPasswordResetEmail = async (email: string, name: string, resetUrl: string): Promise<void> => {
  const subject = 'Password Reset - Exjobnet';
  const text = `Hi ${name}, click the following link to reset your password: ${resetUrl}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1976d2;">Password Reset Request</h2>
      <p>Hi <strong>${name}</strong>,</p>
      <p>You requested a password reset for your Exjobnet account. Click the button below to reset your password:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" 
           style="background-color: #dc004e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
          Reset Password
        </a>
      </div>
      <p>If the button doesn't work, copy and paste this link: ${resetUrl}</p>
      <p><strong>This link will expire in 10 minutes for security reasons.</strong></p>
      <p>If you didn't request this, please ignore this email.</p>
    </div>
  `;

  await sendEmail({ to: email, subject, text, html });
};

// Job recommendation email template
export const sendJobRecommendationEmail = async (
  email: string, 
  name: string, 
  jobs: any[], 
  confirmUrl?: string, 
  rejectUrl?: string,
  unsubscribeToken?: string
): Promise<void> => {
  const subject = 'New Job Recommendations from Exjobnet! 🎯';
  const text = `Hi ${name}, we found ${jobs.length} new job opportunities that match your profile through Exjobnet!`;
  
  // Get robust production URLs - prioritize production domains
  const baseUrl = getProductionUrl('frontend');
  const backendUrl = getProductionUrl('backend');
  
  const jobListHtml = jobs.map((job, index) => `
    <div style="border: 1px solid #ddd; padding: 15px; margin: 10px 0; border-radius: 8px; background-color: white;">
      <h3 style="color: #1976d2; margin: 0 0 10px 0;">${job.title}</h3>
      <p style="margin: 5px 0;"><strong>Company:</strong> ${job.company}</p>
      <p style="margin: 5px 0;"><strong>Location:</strong> ${job.location}</p>
      <p style="margin: 5px 0;"><strong>Match:</strong> <span style="color: ${job.matchColor}; font-weight: bold;">${job.matchPercentage}%</span></p>
      ${job.salary ? `<p style="margin: 5px 0;"><strong>Salary:</strong> ${job.salary}</p>` : ''}
      <div style="margin-top: 15px;">
        <a href="${job.jobUrl}" 
           style="background-color: #1976d2; color: white; padding: 10px 20px; text-decoration: none; border-radius: 25px; display: inline-block; font-size: 14px;">
          🔍 View Job Details
        </a>
      </div>
    </div>
  `).join('');

  const autoApplySection = confirmUrl && rejectUrl ? `
    <div style="background-color: #f0f8ff; padding: 25px; margin: 25px 0; border-radius: 8px; text-align: center; border: 2px solid #1976d2;">
      <h3 style="color: #1976d2; margin: 0 0 15px 0;">🚀 Automatic Apply Option</h3>
      <p style="margin: 0 0 20px 0; color: #333;">Want us to automatically apply to all these jobs with your current profile? This saves time and ensures you don't miss opportunities!</p>
      <div style="margin-top: 20px;">
        <a href="${confirmUrl}" 
           style="background-color: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; margin: 0 10px; display: inline-block; font-weight: bold; font-size: 16px;">
          ✅ Apply to All Jobs
        </a>
        <a href="${rejectUrl}" 
           style="background-color: #6c757d; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; margin: 0 10px; display: inline-block; font-size: 16px;">
          👤 I'll Apply Manually
        </a>
      </div>
      <p style="margin: 20px 0 0 0; color: #666; font-size: 14px;">
        Note: Some jobs may require manual application if they don't support automatic applications.
      </p>
    </div>
  ` : '';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #1976d2, #42a5f5); color: white; padding: 25px; text-align: center; border-radius: 8px 8px 0 0;">
        <img src="${baseUrl}/exjobnetlogo.png" alt="Exjobnet" style="height: 40px; margin-bottom: 10px;" />
        <h1 style="margin: 10px 0; font-size: 26px;">New Job Recommendations! 🎯</h1>
        <p style="margin: 0; opacity: 0.9; font-size: 16px;">From Exjobnet - Your Job Search Partner</p>
      </div>
      
      <div style="padding: 30px; background-color: #f8f9fa;">
        <h2 style="color: #1976d2; margin-top: 0;">Hi ${name}!</h2>
        <p style="color: #333; font-size: 16px; margin-bottom: 25px;">We found <strong>${jobs.length}</strong> new job opportunities that match your profile and skills. These jobs were specially selected based on your career interests and experience.</p>
        
        <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #1976d2;">
          <h3 style="color: #1565c0; margin: 0 0 10px 0;">📊 Personalized Matches</h3>
          <p style="margin: 0; color: #1565c0;">Each job is ranked by how well it matches your skills, experience, and career preferences. Higher percentages indicate better fits!</p>
        </div>
        
        ${jobListHtml}
        
        ${autoApplySection}
        
        <div style="text-align: center; margin: 30px 0;">
          <h3 style="color: #333;">Enhance Your Job Search</h3>
          <div style="margin: 20px 0;">
            <a href="${baseUrl}/profile" 
               style="background-color: #17a2b8; color: white; padding: 12px 20px; text-decoration: none; border-radius: 25px; margin: 0 10px; display: inline-block;">
              👤 Update My Profile
            </a>
            <a href="${baseUrl}/jobs" 
               style="background-color: #1976d2; color: white; padding: 12px 20px; text-decoration: none; border-radius: 25px; margin: 0 10px; display: inline-block;">
              🔍 Browse All Jobs
            </a>
          </div>
        </div>
        
        <div style="background-color: #d4edda; border-left: 4px solid #28a745; padding: 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
          <h3 style="color: #155724; margin: 0 0 10px 0;">💡 Pro Tips for Success</h3>
          <ul style="color: #155724; margin: 0; padding-left: 20px;">
            <li>Apply early - employers often review applications as they come in</li>
            <li>Customize your application for each position when possible</li>
            <li>Keep your profile updated to receive better matches</li>
            <li>Set up job alerts for specific industries or roles you're interested in</li>
          </ul>
        </div>
      </div>
      
      <div style="background: linear-gradient(135deg, #1976d2, #42a5f5); color: white; padding: 20px; text-align: center; border-radius: 0 0 8px 8px;">
        <h3 style="margin: 0 0 10px 0; font-size: 18px;">Exjobnet</h3>
        <p style="margin: 0; opacity: 0.9; font-size: 14px;">Connecting talent with opportunity across East Africa</p>
        <p style="margin: 10px 0 0 0; opacity: 0.8; font-size: 12px;">We send personalized job recommendations weekly to help advance your career</p>
        ${unsubscribeToken ? `
          <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.2);">
            <p style="margin: 0; font-size: 12px; opacity: 0.8;">
              Don't want to receive these emails? 
              <a href="${backendUrl}/api/unsubscribe/job-recommendations/${unsubscribeToken}" 
                 style="color: #fff; text-decoration: underline;">Unsubscribe here</a>
            </p>
          </div>
        ` : ''}
      </div>
    </div>
  `;

  await sendEmail({ to: email, subject, text, html });
};

// Job application confirmation email with preparation services
export const sendJobApplicationEmail = async (
  email: string, 
  name: string, 
  jobTitle: string, 
  company: string,
  applicationMethod?: 'manual' | 'auto',
  failedJobs?: Array<{title: string; company: string; sourceUrl?: string}>
): Promise<void> => {
  const subject = `Application Confirmed: ${jobTitle} at ${company} - From Exjobnet`;
  
  // Get robust production URLs - prioritize production domains
  const baseUrl = getProductionUrl('frontend');
  const backendUrl = getProductionUrl('backend');

  const text = `Hi ${name}, your application for ${jobTitle} at ${company} has been successfully submitted through Exjobnet.`;

  // Preparation services section
  const preparationServicesHtml = `
    <div style="background-color: #f0f8ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #1976d2;">
      <h3 style="color: #1976d2; margin: 0 0 15px 0;">🎯 Boost Your Interview Chances!</h3>
      <p style="margin: 0 0 15px 0; color: #333;">We're here to help you prepare for potential interviews and stand out from other candidates:</p>
      
      <div style="display: flex; flex-wrap: wrap; gap: 10px; margin: 15px 0;">
        <a href="${baseUrl}/interview-prep" 
           style="background-color: #1976d2; color: white; padding: 8px 16px; text-decoration: none; border-radius: 20px; font-size: 14px; display: inline-block;">
          🎤 Interview Practice
        </a>
        <a href="${baseUrl}/courses" 
           style="background-color: #28a745; color: white; padding: 8px 16px; text-decoration: none; border-radius: 20px; font-size: 14px; display: inline-block;">
          📚 Skill Enhancement Courses
        </a>
        <a href="${baseUrl}/cv-builder" 
           style="background-color: #17a2b8; color: white; padding: 8px 16px; text-decoration: none; border-radius: 20px; font-size: 14px; display: inline-block;">
          📝 CV Builder & Tips
        </a>
        <a href="${baseUrl}/career-guidance" 
           style="background-color: #6c757d; color: white; padding: 8px 16px; text-decoration: none; border-radius: 20px; font-size: 14px; display: inline-block;">
          🧭 Career Guidance
        </a>
      </div>
      
      <p style="margin: 15px 0 0 0; color: #666; font-size: 14px;">
        💡 <strong>Pro Tip:</strong> Companies are 3x more likely to interview candidates who demonstrate continuous learning!
      </p>
    </div>
  `;

  // Failed jobs section (for automatic apply emails)
  const failedJobsHtml = failedJobs && failedJobs.length > 0 ? `
    <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
      <h3 style="color: #856404; margin: 0 0 15px 0;">⚠️ Some Jobs Require Manual Application</h3>
      <p style="margin: 0 0 15px 0; color: #856404;">
        These jobs didn't provide automatic application procedures, so we couldn't apply automatically:
      </p>
      
      ${failedJobs.map(job => `
        <div style="background-color: white; padding: 15px; margin: 10px 0; border-radius: 5px; border: 1px solid #ffeeba;">
          <h4 style="margin: 0 0 5px 0; color: #856404;">${job.title} at ${job.company}</h4>
          <p style="margin: 5px 0; color: #856404; font-size: 14px;">
            You'll need to apply manually for this position.
          </p>
          ${job.sourceUrl ? `
            <a href="${job.sourceUrl}" 
               style="background-color: #ffc107; color: #856404; padding: 6px 12px; text-decoration: none; border-radius: 15px; font-size: 13px; display: inline-block; margin-top: 8px;">
              🔗 View Job & Apply Manually
            </a>
          ` : ''}
        </div>
      `).join('')}
      
      <p style="margin: 15px 0 0 0; color: #856404; font-size: 14px;">
        💡 <strong>Tip:</strong> Manual applications often allow you to personalize your approach better!
      </p>
    </div>
  ` : '';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #1976d2, #42a5f5); color: white; padding: 25px; text-align: center; border-radius: 8px 8px 0 0;">
        <img src="${baseUrl}/exjobnetlogo.png" alt="Exjobnet" style="height: 40px; margin-bottom: 10px;" />
        <h1 style="margin: 10px 0; font-size: 24px;">Application Submitted Successfully! ✅</h1>
        <p style="margin: 0; opacity: 0.9; font-size: 16px;">From Exjobnet - Your Career Growth Partner</p>
      </div>
      
      <div style="padding: 30px; background-color: white;">
        <h2 style="color: #1976d2; margin-top: 0;">Great news, ${name}!</h2>
        <p>Your ${applicationMethod === 'auto' ? 'automatic ' : ''}application for <strong>${jobTitle}</strong> at <strong>${company}</strong> has been successfully submitted through Exjobnet.</p>
        
        <div style="background-color: #e8f5e8; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4caf50;">
          <p style="margin: 0; color: #2e7d32;"><strong>What happens next?</strong></p>
          <ul style="color: #333; margin: 10px 0;">
            <li>The employer will review your application</li>
            <li>You'll be notified if you're selected for an interview</li>
            <li>Keep checking your email and <a href="${baseUrl}/applications" style="color: #1976d2;">Exjobnet dashboard</a> for updates</li>
            <li>Track all your applications in one place</li>
          </ul>
        </div>
        
        ${preparationServicesHtml}
        
        ${failedJobsHtml}
        
        <div style="text-align: center; margin: 30px 0;">
          <h3 style="color: #333;">Continue Your Job Search</h3>
          <div style="margin: 20px 0;">
            <a href="${baseUrl}/jobs" 
               style="background-color: #1976d2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 25px; margin: 0 10px; display: inline-block;">
              🔍 Browse More Jobs
            </a>
            <a href="${baseUrl}/applications" 
               style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 25px; margin: 0 10px; display: inline-block;">
              📋 View My Applications
            </a>
          </div>
        </div>
        
        <div style="background-color: #f8f9fa; border-radius: 5px; padding: 15px; margin: 20px 0;">
          <p style="margin: 0; color: #6c757d; text-align: center; font-size: 14px;">
            <strong>Remember:</strong> Keep your profile updated to receive better job matches and increase your chances of success!
          </p>
        </div>
      </div>
      
      <div style="background: linear-gradient(135deg, #1976d2, #42a5f5); color: white; padding: 20px; text-align: center; border-radius: 0 0 8px 8px;">
        <h3 style="margin: 0 0 10px 0; font-size: 18px;">Exjobnet</h3>
        <p style="margin: 0; opacity: 0.9; font-size: 14px;">Connecting talent with opportunity across East Africa</p>
        <p style="margin: 10px 0 0 0; opacity: 0.8; font-size: 12px;">We'll continue sending you personalized job recommendations</p>
      </div>
    </div>
  `;

  await sendEmail({ to: email, subject, text, html });
};

// Test SendGrid configuration
export const testSendGridConfig = async (): Promise<boolean> => {
  try {
    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey) {
      console.error('❌ SENDGRID_API_KEY is not configured');
      return false;
    }

    // Test with a simple email to the configured FROM address
    const testEmail = process.env.EMAIL_FROM || 'noreply@excellencecoaching.com';
    
    await sendWelcomeEmail(testEmail, 'Test User', 'homepage', 'https://excellencecoachinghub.com');
    console.log('✅ SendGrid configuration test successful');
    return true;
  } catch (error: any) {
    console.error('❌ SendGrid configuration test failed:', error.message);
    return false;
  }
};

// Export the main function and utility functions
export {
  SendEmailOptions,
  SendGridEmailPayload,
  getUnsubscribeLink,
  addUnsubscribeButton
};