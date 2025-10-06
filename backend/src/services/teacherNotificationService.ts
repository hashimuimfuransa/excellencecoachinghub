import { sendEmail } from './sendGridService';

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
      const subject = '🎉 Your Teacher Profile Has Been Approved! - Excellence Coaching Hub';
      
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <div style="font-size: 48px; margin-bottom: 20px;">✅</div>
            <h1 style="margin: 0; font-size: 28px;">Congratulations, ${data.teacherName}!</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9; font-size: 18px;">Your teacher profile has been approved</p>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Welcome to Excellence Coaching Hub!</h2>
            <p style="color: #555; font-size: 16px; line-height: 1.6;">We're excited to inform you that your teacher profile has been reviewed and <strong>approved</strong> by our admin team.</p>
            
            <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #4caf50;">
              <h3 style="color: #2e7d32; margin-top: 0;">🚀 You can now access all teacher features:</h3>
              <ul style="color: #333; margin: 0; padding-left: 20px;">
                <li>📚 Create and manage courses</li>
                <li>📝 Create assignments and assessments</li>
                <li>🎥 Host live sessions</li>
                <li>👥 Manage students</li>
                <li>📊 View analytics and reports</li>
                <li>💰 Track your earnings</li>
              </ul>
            </div>

            ${data.adminFeedback ? `
              <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #2196f3;">
                <h3 style="color: #1565c0; margin-top: 0;">💬 Admin Feedback:</h3>
                <p style="margin: 0; color: #333; font-style: italic;">"${data.adminFeedback}"</p>
              </div>
            ` : ''}

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3001'}/dashboard/teacher" 
                 style="background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: bold; font-size: 16px;">
                🚀 Access Teacher Dashboard
              </a>
            </div>

            <div style="background: #fff3e0; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #ff9800;">
              <h3 style="color: #ef6c00; margin-top: 0;">💡 Getting Started Tips</h3>
              <ul style="color: #333; margin: 0; padding-left: 20px;">
                <li>Complete your teacher profile to increase student trust</li>
                <li>Create your first course to start earning</li>
                <li>Set up your payment preferences</li>
                <li>Join our teacher community for support</li>
              </ul>
            </div>

            <p style="color: #555; font-size: 16px;">If you have any questions or need assistance getting started, please don't hesitate to contact our support team.</p>
            
            <p style="color: #333; font-weight: bold;">Best regards,<br>The Excellence Coaching Hub Team</p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; color: #666; font-size: 14px;">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>© ${new Date().getFullYear()} Excellence Coaching Hub. All rights reserved.</p>
          </div>
        </div>
      `;

      const textContent = `Congratulations ${data.teacherName}! Your teacher profile has been approved. You can now access all teacher features including creating courses, managing students, hosting live sessions, and more. Visit ${process.env.FRONTEND_URL || 'http://localhost:3001'}/dashboard/teacher to get started.`;

      await sendEmail({
        to: data.teacherEmail,
        subject,
        text: textContent,
        html: htmlContent
      });

      console.log(`✅ Approval notification sent via SendGrid to ${data.teacherEmail}`);
    } catch (error) {
      console.error('❌ Failed to send approval notification:', error);
      throw error;
    }
  }

  // Send rejection notification email
  static async sendRejectionNotification(data: TeacherNotificationData): Promise<void> {
    try {
      const subject = '📋 Teacher Profile Review Update - Excellence Coaching Hub';
      
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <div style="font-size: 48px; margin-bottom: 20px;">📋</div>
            <h1 style="margin: 0; font-size: 28px;">Profile Review Update</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9; font-size: 18px;">Action required for your teacher profile</p>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Hello ${data.teacherName},</h2>
            <p style="color: #555; font-size: 16px; line-height: 1.6;">Thank you for submitting your teacher profile to Excellence Coaching Hub. After careful review, we need you to make some updates before we can approve your profile.</p>
            
            ${data.rejectionReason ? `
              <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; margin: 25px 0;">
                <h3 style="color: #856404; margin-top: 0;">📝 Required Updates:</h3>
                <p style="margin: 0; color: #856404; font-weight: bold;">${data.rejectionReason}</p>
              </div>
            ` : ''}

            ${data.adminFeedback ? `
              <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #2196f3;">
                <h3 style="color: #1565c0; margin-top: 0;">💬 Additional Feedback:</h3>
                <p style="margin: 0; color: #333; font-style: italic;">"${data.adminFeedback}"</p>
              </div>
            ` : ''}

            <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #4caf50;">
              <h3 style="color: #2e7d32; margin-top: 0;">📋 Next Steps:</h3>
              <ol style="color: #333; margin: 0; padding-left: 20px;">
                <li>Log in to your account</li>
                <li>Navigate to your teacher profile</li>
                <li>Make the required updates</li>
                <li>Resubmit your profile for review</li>
              </ol>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3001'}/dashboard/teacher/profile" 
                 style="background: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: bold; font-size: 16px;">
                🔧 Update My Profile
              </a>
            </div>

            <div style="background: #fff3e0; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #ff9800;">
              <h3 style="color: #ef6c00; margin-top: 0;">💡 Profile Improvement Tips</h3>
              <ul style="color: #333; margin: 0; padding-left: 20px;">
                <li>Ensure all required fields are completed</li>
                <li>Upload high-quality profile picture and CV</li>
                <li>Provide detailed teaching experience</li>
                <li>Include relevant certifications and qualifications</li>
              </ul>
            </div>

            <p style="color: #555; font-size: 16px;">We appreciate your patience and look forward to having you as part of our teaching community once your profile meets our requirements.</p>
            
            <p style="color: #555; font-size: 16px;">If you have any questions about the required updates, please contact our support team.</p>
            
            <p style="color: #333; font-weight: bold;">Best regards,<br>The Excellence Coaching Hub Team</p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; color: #666; font-size: 14px;">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>© ${new Date().getFullYear()} Excellence Coaching Hub. All rights reserved.</p>
          </div>
        </div>
      `;

      const textContent = `Hello ${data.teacherName}, thank you for submitting your teacher profile. After review, we need you to make some updates before approval.${data.rejectionReason ? ` Required updates: ${data.rejectionReason}` : ''}${data.adminFeedback ? ` Additional feedback: ${data.adminFeedback}` : ''} Please log in and update your profile at ${process.env.FRONTEND_URL || 'http://localhost:3001'}/dashboard/teacher/profile`;

      await sendEmail({
        to: data.teacherEmail,
        subject,
        text: textContent,
        html: htmlContent
      });

      console.log(`✅ Rejection notification sent via SendGrid to ${data.teacherEmail}`);
    } catch (error) {
      console.error('❌ Failed to send rejection notification:', error);
      throw error;
    }
  }

  // Send profile submission confirmation
  static async sendSubmissionConfirmation(data: TeacherNotificationData): Promise<void> {
    try {
      const subject = '📤 Teacher Profile Submitted for Review - Excellence Coaching Hub';
      
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #74b9ff 0%, #0984e3 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <div style="font-size: 48px; margin-bottom: 20px;">📤</div>
            <h1 style="margin: 0; font-size: 28px;">Profile Submitted Successfully!</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9; font-size: 18px;">Your teacher profile is now under review</p>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Hello ${data.teacherName},</h2>
            <p style="color: #555; font-size: 16px; line-height: 1.6;">Thank you for submitting your teacher profile to Excellence Coaching Hub! We have received your application and it's now being reviewed by our admin team.</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 25px 0; border: 1px solid #e0e0e0;">
              <h3 style="color: #1976d2; margin-top: 0;">📋 Review Process:</h3>
              <ul style="color: #333; margin: 0; padding-left: 20px;">
                <li>✅ <strong>Profile Submitted</strong> - Completed</li>
                <li>🔄 <strong>Admin Review</strong> - In Progress (1-3 business days)</li>
                <li>⏳ <strong>Decision Notification</strong> - Pending</li>
                <li>⏳ <strong>Account Activation</strong> - Pending</li>
              </ul>
            </div>

            <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #4caf50;">
              <h3 style="color: #2e7d32; margin-top: 0;">📅 What happens next?</h3>
              <p style="margin: 0 0 10px 0; color: #333;">Our admin team will carefully review your profile, including your qualifications, experience, and uploaded documents. You'll receive an email notification once the review is complete.</p>
              <p style="margin: 0; color: #333; font-weight: bold;">Review Timeline: Typically 1-3 business days</p>
            </div>

            <div style="background: #fff3e0; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #ff9800;">
              <h3 style="color: #ef6c00; margin-top: 0;">💡 While You Wait</h3>
              <ul style="color: #333; margin: 0; padding-left: 20px;">
                <li>Explore our platform and familiarize yourself with features</li>
                <li>Prepare additional materials if needed</li>
                <li>Check your email regularly for updates</li>
                <li>Ensure your contact information is up to date</li>
              </ul>
            </div>

            <p style="color: #555; font-size: 16px;">In the meantime, you can still access your account, but teacher-specific features will be available once your profile is approved.</p>
            
            <p style="color: #555; font-size: 16px;">Thank you for your patience!</p>
            
            <p style="color: #333; font-weight: bold;">Best regards,<br>The Excellence Coaching Hub Team</p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; color: #666; font-size: 14px;">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>© ${new Date().getFullYear()} Excellence Coaching Hub. All rights reserved.</p>
          </div>
        </div>
      `;

      const textContent = `Hello ${data.teacherName}, thank you for submitting your teacher profile to Excellence Coaching Hub! We have received your application and it's now being reviewed by our admin team. Review typically takes 1-3 business days. You'll receive an email notification once the review is complete.`;

      await sendEmail({
        to: data.teacherEmail,
        subject,
        text: textContent,
        html: htmlContent
      });

      console.log(`✅ Submission confirmation sent via SendGrid to ${data.teacherEmail}`);
    } catch (error) {
      console.error('❌ Failed to send submission confirmation:', error);
      throw error;
    }
  }
}