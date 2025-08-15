import { sendHtmlEmail } from './emailService';

export interface TeacherNotificationData {
  teacherName: string;
  teacherEmail: string;
  adminName?: string;
  rejectionReason?: string;
  adminFeedback?: string;
}

export class TeacherNotificationService {
  // Send approval notification email
  static async sendApprovalNotification(data: TeacherNotificationData): Promise<void> {
    try {
      const subject = '🎉 Your Teacher Profile Has Been Approved!';
      
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Profile Approved</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .success-icon { font-size: 48px; margin-bottom: 20px; }
            .button { display: inline-block; background: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="success-icon">✅</div>
              <h1>Congratulations, ${data.teacherName}!</h1>
              <p>Your teacher profile has been approved</p>
            </div>
            <div class="content">
              <h2>Welcome to Excellence Coaching Hub!</h2>
              <p>We're excited to inform you that your teacher profile has been reviewed and <strong>approved</strong> by our admin team.</p>
              
              <p>You can now access all teacher features including:</p>
              <ul>
                <li>📚 Create and manage courses</li>
                <li>📝 Create assignments and assessments</li>
                <li>🎥 Host live sessions</li>
                <li>👥 Manage students</li>
                <li>📊 View analytics and reports</li>
                <li>💰 Track your earnings</li>
              </ul>

              ${data.adminFeedback ? `
                <div style="background: #e8f5e8; padding: 15px; border-radius: 5px; margin: 20px 0;">
                  <h3>Admin Feedback:</h3>
                  <p><em>"${data.adminFeedback}"</em></p>
                </div>
              ` : ''}

              <div style="text-align: center;">
                <a href="${process.env.FRONTEND_URL}/dashboard/teacher" class="button">
                  Access Teacher Dashboard
                </a>
              </div>

              <p>If you have any questions or need assistance getting started, please don't hesitate to contact our support team.</p>
              
              <p>Best regards,<br>
              The Excellence Coaching Hub Team</p>
            </div>
            <div class="footer">
              <p>This is an automated message. Please do not reply to this email.</p>
              <p>© ${new Date().getFullYear()} Excellence Coaching Hub. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      await sendHtmlEmail({
        to: data.teacherEmail,
        subject,
        html: htmlContent
      });

      console.log(`✅ Approval notification sent to ${data.teacherEmail}`);
    } catch (error) {
      console.error('❌ Failed to send approval notification:', error);
      throw error;
    }
  }

  // Send rejection notification email
  static async sendRejectionNotification(data: TeacherNotificationData): Promise<void> {
    try {
      const subject = '📋 Teacher Profile Review Update';
      
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Profile Review Update</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .warning-icon { font-size: 48px; margin-bottom: 20px; }
            .button { display: inline-block; background: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .reason-box { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="warning-icon">📋</div>
              <h1>Profile Review Update</h1>
              <p>Action required for your teacher profile</p>
            </div>
            <div class="content">
              <h2>Hello ${data.teacherName},</h2>
              <p>Thank you for submitting your teacher profile to Excellence Coaching Hub. After careful review, we need you to make some updates before we can approve your profile.</p>
              
              ${data.rejectionReason ? `
                <div class="reason-box">
                  <h3>📝 Required Updates:</h3>
                  <p><strong>${data.rejectionReason}</strong></p>
                </div>
              ` : ''}

              ${data.adminFeedback ? `
                <div style="background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0;">
                  <h3>💬 Additional Feedback:</h3>
                  <p><em>"${data.adminFeedback}"</em></p>
                </div>
              ` : ''}

              <h3>Next Steps:</h3>
              <ol>
                <li>Log in to your account</li>
                <li>Navigate to your teacher profile</li>
                <li>Make the required updates</li>
                <li>Resubmit your profile for review</li>
              </ol>

              <div style="text-align: center;">
                <a href="${process.env.FRONTEND_URL}/dashboard/teacher/profile" class="button">
                  Update My Profile
                </a>
              </div>

              <p>We appreciate your patience and look forward to having you as part of our teaching community once your profile meets our requirements.</p>
              
              <p>If you have any questions about the required updates, please contact our support team.</p>
              
              <p>Best regards,<br>
              The Excellence Coaching Hub Team</p>
            </div>
            <div class="footer">
              <p>This is an automated message. Please do not reply to this email.</p>
              <p>© ${new Date().getFullYear()} Excellence Coaching Hub. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      await sendHtmlEmail({
        to: data.teacherEmail,
        subject,
        html: htmlContent
      });

      console.log(`✅ Rejection notification sent to ${data.teacherEmail}`);
    } catch (error) {
      console.error('❌ Failed to send rejection notification:', error);
      throw error;
    }
  }

  // Send profile submission confirmation
  static async sendSubmissionConfirmation(data: TeacherNotificationData): Promise<void> {
    try {
      const subject = '📤 Teacher Profile Submitted for Review';
      
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Profile Submitted</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #74b9ff 0%, #0984e3 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .info-icon { font-size: 48px; margin-bottom: 20px; }
            .timeline { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="info-icon">📤</div>
              <h1>Profile Submitted Successfully!</h1>
              <p>Your teacher profile is now under review</p>
            </div>
            <div class="content">
              <h2>Hello ${data.teacherName},</h2>
              <p>Thank you for submitting your teacher profile to Excellence Coaching Hub! We have received your application and it's now being reviewed by our admin team.</p>
              
              <div class="timeline">
                <h3>📋 Review Process:</h3>
                <ul>
                  <li>✅ <strong>Profile Submitted</strong> - Completed</li>
                  <li>🔄 <strong>Admin Review</strong> - In Progress (1-3 business days)</li>
                  <li>⏳ <strong>Decision Notification</strong> - Pending</li>
                  <li>⏳ <strong>Account Activation</strong> - Pending</li>
                </ul>
              </div>

              <p><strong>What happens next?</strong></p>
              <p>Our admin team will carefully review your profile, including your qualifications, experience, and uploaded documents. You'll receive an email notification once the review is complete.</p>

              <p><strong>Review Timeline:</strong> Typically 1-3 business days</p>

              <p>In the meantime, you can still access your account, but teacher-specific features will be available once your profile is approved.</p>
              
              <p>Thank you for your patience!</p>
              
              <p>Best regards,<br>
              The Excellence Coaching Hub Team</p>
            </div>
            <div class="footer">
              <p>This is an automated message. Please do not reply to this email.</p>
              <p>© ${new Date().getFullYear()} Excellence Coaching Hub. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      await sendHtmlEmail({
        to: data.teacherEmail,
        subject,
        html: htmlContent
      });

      console.log(`✅ Submission confirmation sent to ${data.teacherEmail}`);
    } catch (error) {
      console.error('❌ Failed to send submission confirmation:', error);
      throw error;
    }
  }
}