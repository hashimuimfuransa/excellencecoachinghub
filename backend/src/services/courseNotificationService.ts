import { sendEmail } from './sendGridService';

export interface CourseNotificationData {
  teacherName: string;
  teacherEmail: string;
  courseTitle: string;
  courseId: string;
  adminName?: string;
  adminFeedback?: string;
}

export class CourseNotificationService {
  // Send course approval notification email
  static async sendCourseApprovalNotification(data: CourseNotificationData): Promise<void> {
    try {
      const subject = '🎉 Your Course Has Been Approved! - Excellence Coaching Hub';
      
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <div style="font-size: 48px; margin-bottom: 20px;">🎉</div>
            <h1 style="margin: 0; font-size: 28px;">Congratulations, ${data.teacherName}!</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9; font-size: 18px;">Your course has been approved</p>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Course Approved: "${data.courseTitle}"</h2>
            <p style="color: #555; font-size: 16px; line-height: 1.6;">We're excited to inform you that your course has been reviewed and <strong>approved</strong> by our admin team. Your course is now live and available for students to enroll!</p>
            
            <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #4caf50;">
              <h3 style="color: #2e7d32; margin-top: 0;">🚀 What happens next?</h3>
              <ul style="color: #333; margin: 0; padding-left: 20px;">
                <li>Your course is now visible to students</li>
                <li>Students can enroll and start learning</li>
                <li>You can track student progress and engagement</li>
                <li>You'll receive notifications about new enrollments</li>
                <li>You can start earning from course enrollments</li>
              </ul>
            </div>

            ${data.adminFeedback ? `
              <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #2196f3;">
                <h3 style="color: #1565c0; margin-top: 0;">💬 Admin Feedback:</h3>
                <p style="margin: 0; color: #333; font-style: italic;">"${data.adminFeedback}"</p>
              </div>
            ` : ''}

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3001'}/dashboard/teacher/courses" 
                 style="background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: bold; font-size: 16px;">
                🚀 Manage My Courses
              </a>
            </div>

            <div style="background: #fff3e0; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #ff9800;">
              <h3 style="color: #ef6c00; margin-top: 0;">💡 Course Success Tips</h3>
              <ul style="color: #333; margin: 0; padding-left: 20px;">
                <li>Engage with your students through discussions and Q&A</li>
                <li>Update course content regularly to keep it fresh</li>
                <li>Respond to student questions promptly</li>
                <li>Monitor student progress and provide feedback</li>
                <li>Promote your course through social media and networks</li>
              </ul>
            </div>

            <p style="color: #555; font-size: 16px;">If you have any questions about managing your course or need assistance, please don't hesitate to contact our support team.</p>
            
            <p style="color: #333; font-weight: bold;">Best regards,<br>The Excellence Coaching Hub Team</p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; color: #666; font-size: 14px;">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>© ${new Date().getFullYear()} Excellence Coaching Hub. All rights reserved.</p>
          </div>
        </div>
      `;

      const textContent = `Congratulations ${data.teacherName}! Your course "${data.courseTitle}" has been approved and is now live for students to enroll. You can manage your course at ${process.env.FRONTEND_URL || 'http://localhost:3001'}/dashboard/teacher/courses.${data.adminFeedback ? ` Admin Feedback: ${data.adminFeedback}` : ''}`;

      await sendEmail({
        to: data.teacherEmail,
        subject,
        text: textContent,
        html: htmlContent
      });

      console.log(`✅ Course approval notification sent via SendGrid to ${data.teacherEmail}`);
    } catch (error) {
      console.error('❌ Failed to send course approval notification:', error);
      throw error;
    }
  }

  // Send course rejection notification email
  static async sendCourseRejectionNotification(data: CourseNotificationData): Promise<void> {
    try {
      const subject = '📋 Course Review Update - Excellence Coaching Hub';
      
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <div style="font-size: 48px; margin-bottom: 20px;">📋</div>
            <h1 style="margin: 0; font-size: 28px;">Course Review Update</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9; font-size: 18px;">Action required for your course</p>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Hello ${data.teacherName},</h2>
            <p style="color: #555; font-size: 16px; line-height: 1.6;">Thank you for submitting your course "${data.courseTitle}" to Excellence Coaching Hub. After careful review, we need you to make some updates before we can approve your course.</p>
            
            ${data.adminFeedback ? `
              <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; margin: 25px 0;">
                <h3 style="color: #856404; margin-top: 0;">📝 Required Updates:</h3>
                <p style="margin: 0; color: #856404; font-weight: bold;">${data.adminFeedback}</p>
              </div>
            ` : ''}

            <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #4caf50;">
              <h3 style="color: #2e7d32; margin-top: 0;">📋 Next Steps:</h3>
              <ol style="color: #333; margin: 0; padding-left: 20px;">
                <li>Log in to your teacher dashboard</li>
                <li>Navigate to your course management</li>
                <li>Make the required updates based on feedback</li>
                <li>Resubmit your course for review</li>
              </ol>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3001'}/dashboard/teacher/courses" 
                 style="background: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: bold; font-size: 16px;">
                🔧 Update My Course
              </a>
            </div>

            <div style="background: #fff3e0; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #ff9800;">
              <h3 style="color: #ef6c00; margin-top: 0;">💡 Course Improvement Tips</h3>
              <ul style="color: #333; margin: 0; padding-left: 20px;">
                <li>Ensure course content is comprehensive and well-structured</li>
                <li>Add clear learning objectives and outcomes</li>
                <li>Include practical examples and exercises</li>
                <li>Provide detailed course descriptions</li>
                <li>Add relevant course materials and resources</li>
              </ul>
            </div>

            <p style="color: #555; font-size: 16px;">We appreciate your patience and look forward to having your course live on our platform once it meets our quality standards.</p>
            
            <p style="color: #555; font-size: 16px;">If you have any questions about the required updates, please contact our support team.</p>
            
            <p style="color: #333; font-weight: bold;">Best regards,<br>The Excellence Coaching Hub Team</p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; color: #666; font-size: 14px;">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>© ${new Date().getFullYear()} Excellence Coaching Hub. All rights reserved.</p>
          </div>
        </div>
      `;

      const textContent = `Hello ${data.teacherName}, thank you for submitting your course "${data.courseTitle}". After review, we need you to make some updates before approval.${data.adminFeedback ? ` Required updates: ${data.adminFeedback}` : ''} Please log in and update your course at ${process.env.FRONTEND_URL || 'http://localhost:3001'}/dashboard/teacher/courses`;

      await sendEmail({
        to: data.teacherEmail,
        subject,
        text: textContent,
        html: htmlContent
      });

      console.log(`✅ Course rejection notification sent via SendGrid to ${data.teacherEmail}`);
    } catch (error) {
      console.error('❌ Failed to send course rejection notification:', error);
      throw error;
    }
  }
}
