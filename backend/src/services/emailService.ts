import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  template: string;
  data: Record<string, any>;
}

// Email templates
const emailTemplates = {
  emailVerification: (data: any) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1976d2;">Welcome to Excellence Coaching Hub!</h2>
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
