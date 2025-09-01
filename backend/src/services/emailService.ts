import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  template: string;
  data: Record<string, any>;
}

// Email templates
const emailTemplates = {
  welcome: (data: any) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1976d2;">Welcome to Excellence Coaching Hub! 🎉</h2>
      <p>Hi ${data.firstName},</p>
      <p>Thank you for joining Excellence Coaching Hub! We're excited to have you on board and can't wait to help you achieve your goals.</p>
      
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #1976d2; margin-top: 0;">What's Next?</h3>
        <ul style="color: #333;">
          <li><strong>Explore Job Opportunities:</strong> Browse thousands of job listings tailored to your skills</li>
          <li><strong>Take Psychometric Tests:</strong> Assess your abilities and get matched with suitable roles</li>
          <li><strong>Access Learning Resources:</strong> Enhance your skills with our comprehensive e-learning platform</li>
          <li><strong>Build Your Profile:</strong> Complete your profile to get better job recommendations</li>
        </ul>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${data.platformUrl}" 
           style="background-color: #1976d2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 0 10px;">
          Get Started
        </a>
        ${data.platform === 'elearning' ? `
        <a href="${process.env.FRONTEND_URL || 'http://localhost:3001'}" 
           style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 0 10px;">
          Explore E-Learning
        </a>
        ` : ''}
        ${data.platform === 'job-portal' ? `
        <a href="${process.env.ELEARNING_URL || 'http://localhost:3002'}" 
           style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 0 10px;">
          Find Jobs
        </a>
        ` : ''}
      </div>

      <div style="background-color: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0; color: #1565c0;"><strong>💡 Pro Tip:</strong> Complete your profile within 48 hours to unlock premium features and get priority access to job opportunities!</p>
      </div>

      <p>If you have any questions or need assistance, our support team is here to help. Feel free to reach out to us at any time.</p>
      <p>Welcome aboard, and here's to your success!</p>
      
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
      <p style="color: #666; font-size: 12px;">
        Excellence Coaching Hub Team<br>
        Empowering careers, one step at a time<br>
        This is an automated email, please do not reply.
      </p>
    </div>
  `,

  emailVerification: (data: any) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1976d2;">Verify Your Email Address</h2>
      <p>Hi ${data.firstName},</p>
      <p>Thank you for registering with Excellence Coaching Hub. Please verify your email address by clicking the button below:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${data.verificationUrl}" 
           style="background-color: #1976d2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
          Verify Email Address
        </a>
      </div>
      <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
      <p style="word-break: break-all; color: #666;">${data.verificationUrl}</p>
      <p>This verification link will expire in 24 hours.</p>
      <p>If you didn't create an account with us, please ignore this email.</p>
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
      <p style="color: #666; font-size: 12px;">
        Excellence Coaching Hub<br>
        This is an automated email, please do not reply.
      </p>
    </div>
  `,
  
  passwordReset: (data: any) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1976d2;">Password Reset Request</h2>
      <p>Hi ${data.firstName},</p>
      <p>You requested a password reset for your Excellence Coaching Hub account. Click the button below to reset your password:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${data.resetUrl}" 
           style="background-color: #dc004e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
          Reset Password
        </a>
      </div>
      <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
      <p style="word-break: break-all; color: #666;">${data.resetUrl}</p>
      <p><strong>This reset link will expire in 10 minutes for security reasons.</strong></p>
      <p>If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
      <p style="color: #666; font-size: 12px;">
        Excellence Coaching Hub<br>
        This is an automated email, please do not reply.
      </p>
    </div>
  `,

  courseEnrollment: (data: any) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1976d2;">Course Enrollment Confirmation</h2>
      <p>Hi ${data.firstName},</p>
      <p>You have successfully enrolled in the course: <strong>${data.courseTitle}</strong></p>
      <p>You can now access the course materials and start learning!</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${data.courseUrl}" 
           style="background-color: #1976d2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
          Access Course
        </a>
      </div>
      <p>Happy learning!</p>
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
      <p style="color: #666; font-size: 12px;">
        Excellence Coaching Hub<br>
        This is an automated email, please do not reply.
      </p>
    </div>
  `,

  gradeNotification: (data: any) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1976d2;">Grade Posted</h2>
      <p>Hi ${data.firstName},</p>
      <p>Your grade for <strong>${data.quizTitle}</strong> has been posted.</p>
      <div style="background-color: #f5f5f5; padding: 20px; border-radius: 4px; margin: 20px 0;">
        <p><strong>Score:</strong> ${data.score}/${data.maxScore} (${data.percentage}%)</p>
        <p><strong>Status:</strong> ${data.passed ? 'Passed' : 'Failed'}</p>
      </div>
      ${data.feedback ? `<p><strong>Feedback:</strong> ${data.feedback}</p>` : ''}
      <div style="text-align: center; margin: 30px 0;">
        <a href="${data.resultsUrl}" 
           style="background-color: #1976d2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
          View Results
        </a>
      </div>
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
      <p style="color: #666; font-size: 12px;">
        Excellence Coaching Hub<br>
        This is an automated email, please do not reply.
      </p>
    </div>
  `,

  jobApplication: (data: any) => `
    <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; background-color: #f9f9f9; padding: 30px;">
      <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h2 style="color: #1976d2; margin: 0;">🎯 New Job Application Received</h2>
          <p style="color: #666; margin: 10px 0;">Excellence Coaching Hub - Job Portal</p>
        </div>

        <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #1565c0; margin-top: 0;">📋 Job Details</h3>
          <p><strong>Position:</strong> ${data.jobTitle}</p>
          <p><strong>Company:</strong> ${data.company}</p>
          <p><strong>Location:</strong> ${data.location}</p>
          <p><strong>Application Date:</strong> ${new Date().toLocaleDateString()}</p>
        </div>

        <div style="background-color: #f1f8e9; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #2e7d32; margin-top: 0;">👤 Candidate Profile</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div>
              <p><strong>Name:</strong> ${data.candidateName}</p>
              <p><strong>Email:</strong> ${data.candidateEmail}</p>
              <p><strong>Phone:</strong> ${data.candidatePhone || 'Not provided'}</p>
            </div>
            <div>
              <p><strong>Location:</strong> ${data.candidateLocation || 'Not provided'}</p>
              <p><strong>Job Title:</strong> ${data.candidateJobTitle || 'Not specified'}</p>
              <p><strong>Experience:</strong> ${data.candidateExperienceLevel || 'Not specified'}</p>
            </div>
          </div>
        </div>

        ${data.candidateSkills && data.candidateSkills.length > 0 ? `
        <div style="background-color: #fff3e0; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #ef6c00; margin-top: 0;">🛠️ Skills & Expertise</h3>
          <div style="display: flex; flex-wrap: wrap; gap: 8px;">
            ${data.candidateSkills.map((skill: string) => `
              <span style="background-color: #ff9800; color: white; padding: 5px 12px; border-radius: 15px; font-size: 12px; font-weight: 600;">
                ${skill}
              </span>
            `).join('')}
          </div>
        </div>
        ` : ''}

        ${data.candidateSummary ? `
        <div style="background-color: #fce4ec; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #c2185b; margin-top: 0;">📝 Professional Summary</h3>
          <p style="line-height: 1.6; color: #333;">${data.candidateSummary}</p>
        </div>
        ` : ''}

        ${data.candidateEducation && data.candidateEducation.length > 0 ? `
        <div style="background-color: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #388e3c; margin-top: 0;">🎓 Education Background</h3>
          ${data.candidateEducation.map((edu: any) => `
            <div style="margin-bottom: 15px; padding: 15px; background-color: white; border-radius: 6px;">
              <p><strong>${edu.degree || 'Degree'}</strong> ${edu.major ? `in ${edu.major}` : ''}</p>
              <p style="color: #666; margin: 5px 0;">${edu.institution}</p>
              <p style="color: #888; font-size: 14px;">${edu.startDate && edu.endDate ? `${edu.startDate} - ${edu.endDate}` : ''}</p>
            </div>
          `).join('')}
        </div>
        ` : ''}

        ${data.candidateExperience && data.candidateExperience.length > 0 ? `
        <div style="background-color: #e1f5fe; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #0277bd; margin-top: 0;">💼 Work Experience</h3>
          ${data.candidateExperience.map((exp: any) => `
            <div style="margin-bottom: 15px; padding: 15px; background-color: white; border-radius: 6px;">
              <p><strong>${exp.jobTitle || 'Position'}</strong> at <strong>${exp.company}</strong></p>
              <p style="color: #666; margin: 5px 0;">${exp.location || ''}</p>
              <p style="color: #888; font-size: 14px;">${exp.startDate && exp.endDate ? `${exp.startDate} - ${exp.endDate}` : ''}</p>
              ${exp.description ? `<p style="margin-top: 10px; color: #555; font-size: 14px;">${exp.description}</p>` : ''}
            </div>
          `).join('')}
        </div>
        ` : ''}

        <div style="background-color: #fff8e1; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ff9800;">
          <h3 style="color: #f57c00; margin-top: 0;">📊 Profile Completion</h3>
          <div style="background-color: #eeeeee; height: 10px; border-radius: 5px; overflow: hidden;">
            <div style="background-color: ${data.profileCompletion >= 80 ? '#4caf50' : data.profileCompletion >= 60 ? '#ff9800' : '#f44336'}; height: 100%; width: ${data.profileCompletion}%; transition: width 0.3s ease;"></div>
          </div>
          <p style="margin: 10px 0 0 0; font-size: 14px; color: #666;">
            Profile: <strong>${data.profileCompletion}% Complete</strong>
            ${data.profileCompletion < 70 ? ' - <em>Candidate may benefit from completing their profile</em>' : ' - <em>Well-completed profile</em>'}
          </p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <h3 style="color: #1976d2;">⚡ Quick Actions</h3>
          <div style="display: inline-block; margin: 0 10px;">
            <a href="mailto:${data.candidateEmail}" 
               style="background-color: #1976d2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 5px;">
              📧 Contact Candidate
            </a>
          </div>
          <div style="display: inline-block; margin: 0 10px;">
            <a href="${data.candidateProfileUrl || '#'}" 
               style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 5px;">
              👤 View Full Profile
            </a>
          </div>
          ${data.candidateResume ? `
          <div style="display: inline-block; margin: 0 10px;">
            <a href="${data.candidateResume}" 
               style="background-color: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 5px;" 
               download>
              📄 Download Resume
            </a>
          </div>
          ` : ''}
        </div>

        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 6px; text-align: center;">
          <p style="margin: 0; color: #666; font-size: 14px;">
            <strong>📍 Excellence Coaching Hub - Job Portal</strong><br>
            Connecting African talent with global opportunities<br>
            <em>This application was submitted through our AI-powered job matching platform</em>
          </p>
        </div>
        
        <p style="color: #888; font-size: 12px; text-align: center; margin-top: 20px;">
          This is an automated notification. Please do not reply to this email.<br>
          For support, contact us through our platform or visit our help center.
        </p>
      </div>
    </div>
  `
};

// Create transporter - Use Gmail if configured, otherwise Ethereal Email for testing
const createTransporter = async () => {
  // Check if Gmail credentials are properly configured
  const emailHost = process.env['EMAIL_HOST'];
  const emailUser = process.env['EMAIL_USER'];
  const emailPass = process.env['EMAIL_PASS'];

  // Use Gmail if credentials are provided and not placeholder values
  if (emailHost && emailUser && emailPass &&
      emailUser !== 'your-email@gmail.com' &&
      emailPass !== 'your-app-password') {

    console.log('Using Gmail SMTP for email delivery');
    return nodemailer.createTransport({
      host: emailHost,
      port: parseInt(process.env['EMAIL_PORT'] || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: emailUser,
        pass: emailPass
      }
    });
  }

  // Fall back to Ethereal Email for testing
  console.log('Gmail not configured, using Ethereal Email for testing');
  try {
    const testAccount = await nodemailer.createTestAccount();

    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
  } catch (error) {
    console.error('Failed to create test account, falling back to console logging');
    // Fallback: create a transporter that just logs to console
    return nodemailer.createTransport({
      streamTransport: true,
      newline: 'unix',
      buffer: true
    });
  }
};

// Simple console-based email for development
const sendConsoleEmail = (options: EmailOptions): void => {
  console.log('\n=== EMAIL SENT ===');
  console.log(`To: ${options.to}`);
  console.log(`Subject: ${options.subject}`);
  console.log(`Template: ${options.template}`);

  if (options.template === 'emailVerification' && options.data['verificationToken']) {
    console.log(`\n🔐 VERIFICATION CODE: ${options.data['verificationToken']}`);
    console.log(`📧 User: ${options.data['firstName']}`);
    console.log(`🔗 Verification URL: ${options.data['verificationUrl']}`);
  }

  console.log('==================\n');
};

// Send email function
export const sendEmail = async (options: EmailOptions): Promise<void> => {
  try {
    // Try to send via Ethereal Email first
    const transporter = await createTransporter();

    // Get email template
    const template = emailTemplates[options.template as keyof typeof emailTemplates];
    if (!template) {
      throw new Error(`Email template '${options.template}' not found`);
    }

    // Generate HTML content
    const html = template(options.data);

    // Email options
    const fromEmail = process.env['EMAIL_FROM'] || process.env['EMAIL_USER'] || 'noreply@excellencecoaching.com';
    const mailOptions = {
      from: fromEmail,
      to: options.to,
      subject: options.subject,
      html
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);

    // If using Ethereal Email, log the preview URL
    if (info.messageId) {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log('Preview URL: %s', previewUrl);
      }
    }
  } catch (error) {
    console.error('Failed to send email via SMTP, falling back to console logging');
    // Fallback to console logging
    sendConsoleEmail(options);
  }
};

// Send bulk emails
export const sendBulkEmail = async (recipients: string[], options: Omit<EmailOptions, 'to'>): Promise<void> => {
  try {
    const promises = recipients.map(recipient => 
      sendEmail({ ...options, to: recipient })
    );
    
    await Promise.all(promises);
    console.log(`Bulk email sent to ${recipients.length} recipients`);
  } catch (error) {
    console.error('Error sending bulk email:', error);
    throw error;
  }
};

// Send email with HTML content directly
export const sendHtmlEmail = async (options: { to: string; subject: string; html: string }): Promise<void> => {
  try {
    // Try to send via configured transporter
    const transporter = await createTransporter();

    // Email options
    const fromEmail = process.env['EMAIL_FROM'] || process.env['EMAIL_USER'] || 'noreply@excellencecoaching.com';
    const mailOptions = {
      from: fromEmail,
      to: options.to,
      subject: options.subject,
      html: options.html
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log('HTML Email sent successfully:', info.messageId);

    // If using Ethereal Email, log the preview URL
    if (info.messageId) {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log('Preview URL: %s', previewUrl);
      }
    }
  } catch (error) {
    console.error('Failed to send HTML email via SMTP, falling back to console logging');
    // Fallback to console logging
    console.log('\n=== HTML EMAIL SENT ===');
    console.log(`To: ${options.to}`);
    console.log(`Subject: ${options.subject}`);
    console.log(`HTML: ${options.html.substring(0, 200)}...`);
    console.log('========================\n');
  }
};

// Send welcome email to new users
export const sendWelcomeEmail = async (userData: {
  email: string;
  firstName: string;
  platform: 'homepage' | 'job-portal' | 'elearning';
}): Promise<void> => {
  try {
    const platformUrls = {
      homepage: process.env.HOMEPAGE_URL || 'http://localhost:3000',
      'job-portal': process.env.JOB_PORTAL_URL || 'http://localhost:3001',
      elearning: process.env.ELEARNING_URL || 'http://localhost:3002'
    };

    await sendEmail({
      to: userData.email,
      subject: 'Welcome to Excellence Coaching Hub! 🎉',
      template: 'welcome',
      data: {
        firstName: userData.firstName,
        platform: userData.platform,
        platformUrl: platformUrls[userData.platform]
      }
    });

    console.log(`Welcome email sent to ${userData.email} for ${userData.platform} platform`);
  } catch (error) {
    console.error('Error sending welcome email:', error);
    // Don't throw error - welcome email failure shouldn't break registration
  }
};

// Verify email configuration
export const verifyEmailConfig = async (): Promise<boolean> => {
  try {
    const transporter = await createTransporter();
    await transporter.verify();
    console.log('Email configuration verified successfully');
    return true;
  } catch (error) {
    console.error('Email configuration verification failed:', error);
    return false;
  }
};
