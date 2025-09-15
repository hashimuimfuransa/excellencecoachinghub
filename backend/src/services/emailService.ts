import nodemailer from 'nodemailer';
import { sendEmail as sendGridEmail, sendWelcomeEmail as sendGridWelcomeEmail, sendPasswordResetEmail as sendGridPasswordResetEmail } from './sendGridService';

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
  `,

  employerWelcome: (data: any) => `
    <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; background-color: #f8fafe; padding: 30px;">
      <div style="background-color: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.08);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h2 style="color: #1976d2; margin: 0; font-size: 28px;">🎉 Welcome to Excellence Coaching Hub!</h2>
          <p style="color: #666; margin: 10px 0; font-size: 16px;">Your Employer Account is Ready</p>
        </div>

        <div style="background: linear-gradient(135deg, #1976d2 0%, #42a5f5 100%); padding: 25px; border-radius: 10px; margin: 25px 0; color: white; text-align: center;">
          <h3 style="margin: 0; font-size: 20px;">🏢 Welcome, ${data.firstName}!</h3>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">You're now part of a platform connecting you with top talent across various industries.</p>
        </div>

        <div style="background-color: #e8f5e8; padding: 25px; border-radius: 10px; margin: 25px 0;">
          <h3 style="color: #2e7d32; margin-top: 0; display: flex; align-items: center;">
            🚀 Get Started with These Key Features:
          </h3>
          <div style="display: grid; grid-template-columns: 1fr; gap: 15px;">
            <div style="background-color: white; padding: 15px; border-radius: 8px; border-left: 4px solid #4caf50;">
              <strong style="color: #2e7d32;">📝 Post Job Openings:</strong>
              <p style="margin: 5px 0 0 0; color: #555;">Create detailed job listings to attract qualified candidates from our diverse talent pool.</p>
            </div>
            <div style="background-color: white; padding: 15px; border-radius: 8px; border-left: 4px solid #ff9800;">
              <strong style="color: #f57c00;">🔍 Browse Talent Pool:</strong>
              <p style="margin: 5px 0 0 0; color: #555;">Search through verified profiles of job seekers with skills that match your requirements.</p>
            </div>
            <div style="background-color: white; padding: 15px; border-radius: 8px; border-left: 4px solid #e91e63;">
              <strong style="color: #c2185b;">📊 Manage Applications:</strong>
              <p style="margin: 5px 0 0 0; color: #555;">Review applications, schedule interviews, and track your hiring pipeline efficiently.</p>
            </div>
            <div style="background-color: white; padding: 15px; border-radius: 8px; border-left: 4px solid #9c27b0;">
              <strong style="color: #7b1fa2;">📈 Access Analytics:</strong>
              <p style="margin: 5px 0 0 0; color: #555;">Get insights on your job postings' performance and hiring metrics.</p>
            </div>
          </div>
        </div>

        <div style="background-color: #fff3e0; padding: 25px; border-radius: 10px; margin: 25px 0; border: 2px solid #ffb74d;">
          <h3 style="color: #ef6c00; margin-top: 0;">💡 Pro Tips for Success:</h3>
          <ul style="color: #bf360c; line-height: 1.8; padding-left: 20px;">
            <li><strong>Complete Your Company Profile:</strong> Add company details, logo, and description to attract top candidates</li>
            <li><strong>Write Compelling Job Descriptions:</strong> Clear requirements and attractive benefits get better applicants</li>
            <li><strong>Use Our Matching System:</strong> Our AI helps match your job postings with suitable candidates</li>
            <li><strong>Respond Promptly:</strong> Quick responses to applications improve your employer brand</li>
          </ul>
        </div>

        <div style="text-align: center; margin: 35px 0;">
          <h3 style="color: #1976d2; margin-bottom: 20px;">🎯 Quick Actions</h3>
          <div style="display: inline-block; margin: 0 10px;">
            <a href="${data.platformUrl}/app/jobs/create" 
               style="background: linear-gradient(135deg, #1976d2 0%, #42a5f5 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 5px; font-weight: bold; box-shadow: 0 3px 10px rgba(25, 118, 210, 0.3);">
              📝 Post Your First Job
            </a>
          </div>
          <div style="display: inline-block; margin: 0 10px;">
            <a href="${data.platformUrl}/app/employer/company-profile" 
               style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 5px; font-weight: bold; box-shadow: 0 3px 10px rgba(40, 167, 69, 0.3);">
              🏢 Setup Company Profile
            </a>
          </div>
          <div style="display: inline-block; margin: 0 10px;">
            <a href="${data.platformUrl}/app/employer/talent-pool" 
               style="background: linear-gradient(135deg, #dc3545 0%, #fd7e14 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 5px; font-weight: bold; box-shadow: 0 3px 10px rgba(220, 53, 69, 0.3);">
              🔍 Browse Talent Pool
            </a>
          </div>
        </div>

        <div style="background: linear-gradient(135deg, #6c757d 0%, #495057 100%); padding: 25px; border-radius: 10px; margin: 25px 0; color: white; text-align: center;">
          <h3 style="margin: 0 0 10px 0;">📞 Need Help Getting Started?</h3>
          <p style="margin: 0; opacity: 0.9;">Our support team is ready to help you maximize your hiring success. Contact us anytime!</p>
          <div style="margin-top: 15px;">
            <a href="mailto:support@excellencecoachinghub.com" 
               style="background-color: rgba(255,255,255,0.2); color: white; padding: 8px 20px; text-decoration: none; border-radius: 20px; display: inline-block; margin: 0 5px; border: 1px solid rgba(255,255,255,0.3);">
              📧 Email Support
            </a>
            <a href="${data.platformUrl}/app/support" 
               style="background-color: rgba(255,255,255,0.2); color: white; padding: 8px 20px; text-decoration: none; border-radius: 20px; display: inline-block; margin: 0 5px; border: 1px solid rgba(255,255,255,0.3);">
              💬 Live Chat
            </a>
          </div>
        </div>

        <div style="text-align: center; margin: 30px 0; padding: 20px; background-color: #f1f8ff; border-radius: 8px;">
          <p style="margin: 0; color: #1565c0; font-size: 14px; font-weight: 500;">
            🌟 <strong>Tip:</strong> Complete your profile within 48 hours to get featured in our recommended employers list and attract premium candidates!
          </p>
        </div>

        <hr style="margin: 30px 0; border: none; border-top: 2px solid #e3f2fd;">
        <div style="text-align: center;">
          <p style="color: #666; font-size: 14px; margin: 0;">
            <strong>Excellence Coaching Hub Team</strong><br>
            🚀 Connecting exceptional talent with outstanding opportunities<br>
            <em>This is an automated email, please do not reply.</em>
          </p>
        </div>
      </div>
    </div>
  `,

  jobRecommendation: (data: any) => `
    <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; background-color: #f8f9fa; padding: 20px;">
      <div style="background-color: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
        
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 30px; padding: 25px; background: linear-gradient(135deg, #1976d2 0%, #42a5f5 100%); border-radius: 10px; color: white;">
          <h1 style="margin: 0 0 10px 0; font-size: 28px; font-weight: bold;">🎯 New Job Recommendations</h1>
          <p style="margin: 0; font-size: 18px; opacity: 0.9;">We found ${data.totalJobs} job${data.totalJobs > 1 ? 's' : ''} that match your skills!</p>
        </div>

        <!-- Greeting -->
        <div style="margin-bottom: 25px;">
          <p style="font-size: 16px; color: #333; margin: 0;">Hi ${data.firstName},</p>
          <p style="font-size: 16px; color: #555; line-height: 1.6; margin: 10px 0 0 0;">
            Great news! Our AI matching system has found ${data.totalJobs} new job opportunity${data.totalJobs > 1 ? 'ies' : ''} that match your profile and skills. These positions were just posted and could be perfect for your next career move.
          </p>
        </div>

        <!-- Job Recommendations -->
        <div style="margin: 30px 0;">
          <h2 style="color: #1976d2; margin: 0 0 20px 0; font-size: 22px;">📋 Your Personalized Job Matches</h2>
          
          ${data.recommendations.map((job: any, index: number) => `
            <div style="background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%); border: 2px solid #e3f2fd; border-radius: 12px; padding: 25px; margin: 20px 0; position: relative; overflow: hidden;">
              
              <!-- Match Badge -->
              <div style="position: absolute; top: 15px; right: 15px; background: ${job.matchPercentage >= 80 ? 'linear-gradient(135deg, #4caf50, #66bb6a)' : job.matchPercentage >= 60 ? 'linear-gradient(135deg, #ff9800, #ffb74d)' : 'linear-gradient(135deg, #2196f3, #42a5f5)'}; color: white; padding: 8px 15px; border-radius: 20px; font-weight: bold; font-size: 14px; box-shadow: 0 2px 8px rgba(0,0,0,0.15);">
                ${job.matchPercentage}% Match
              </div>

              <!-- Job Title and Company -->
              <div style="margin-bottom: 15px; padding-right: 120px;">
                <h3 style="color: #1976d2; margin: 0 0 8px 0; font-size: 20px; font-weight: bold; line-height: 1.3;">
                  ${job.title}
                </h3>
                <p style="color: #666; margin: 0; font-size: 16px; font-weight: 600;">
                  🏢 ${job.company}
                </p>
              </div>

              <!-- Job Details Grid -->
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0;">
                <div>
                  <div style="margin-bottom: 12px;">
                    <span style="color: #666; font-size: 14px; font-weight: 600;">📍 Location:</span>
                    <p style="margin: 2px 0 0 0; color: #333; font-size: 15px;">${job.location || 'Not specified'}</p>
                  </div>
                  <div style="margin-bottom: 12px;">
                    <span style="color: #666; font-size: 14px; font-weight: 600;">💼 Job Type:</span>
                    <p style="margin: 2px 0 0 0; color: #333; font-size: 15px;">${job.jobType || 'Not specified'}</p>
                  </div>
                </div>
                <div>
                  ${job.salary && job.salary.min ? `
                  <div style="margin-bottom: 12px;">
                    <span style="color: #666; font-size: 14px; font-weight: 600;">💰 Salary:</span>
                    <p style="margin: 2px 0 0 0; color: #333; font-size: 15px; font-weight: 600; color: #2e7d32;">
                      ${job.salary.currency || '$'} ${job.salary.min.toLocaleString()}${job.salary.max ? ' - ' + job.salary.max.toLocaleString() : '+'}
                    </p>
                  </div>
                  ` : ''}
                </div>
              </div>

              <!-- Skills Match -->
              ${job.skills && job.skills.length > 0 ? `
              <div style="margin: 20px 0;">
                <span style="color: #666; font-size: 14px; font-weight: 600; margin-bottom: 8px; display: block;">🛠️ Required Skills:</span>
                <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                  ${job.skills.slice(0, 8).map((skill: string) => `
                    <span style="background: linear-gradient(135deg, #e3f2fd, #bbdefb); color: #1565c0; padding: 6px 12px; border-radius: 20px; font-size: 13px; font-weight: 500; border: 1px solid #90caf9;">
                      ${skill}
                    </span>
                  `).join('')}
                  ${job.skills.length > 8 ? `<span style="color: #666; font-size: 13px; align-self: center;">+${job.skills.length - 8} more</span>` : ''}
                </div>
              </div>
              ` : ''}

              <!-- Action Button -->
              <div style="text-align: center; margin: 25px 0 10px 0;">
                <a href="${data.jobPortalUrl}/jobs/${job.jobId}" 
                   style="background: linear-gradient(135deg, #1976d2, #42a5f5); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 15px; display: inline-block; box-shadow: 0 3px 15px rgba(25, 118, 210, 0.3); transition: all 0.3s ease;">
                  📝 View Job & Apply
                </a>
              </div>
            </div>
          `).join('')}
        </div>

        <!-- Call to Action -->
        <div style="background: linear-gradient(135deg, #e8f5e8, #f1f8f1); padding: 25px; border-radius: 12px; margin: 30px 0; text-align: center; border-left: 5px solid #4caf50;">
          <h3 style="color: #2e7d32; margin: 0 0 15px 0;">⚡ Don't Miss Out!</h3>
          <p style="color: #1b5e20; margin: 0 0 20px 0; font-size: 16px; line-height: 1.5;">
            These are fresh job postings from the last 24 hours. The early bird gets the worm - apply soon to increase your chances!
          </p>
          <a href="${data.jobPortalUrl}/jobs?recommended=true" 
             style="background: linear-gradient(135deg, #4caf50, #66bb6a); color: white; padding: 15px 35px; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);">
            🔍 Browse All New Jobs
          </a>
        </div>

        <!-- Tips Section -->
        <div style="background-color: #fff3e0; padding: 25px; border-radius: 12px; margin: 25px 0; border-left: 5px solid #ff9800;">
          <h3 style="color: #ef6c00; margin: 0 0 15px 0;">💡 Tips to Improve Your Job Matches</h3>
          <ul style="color: #bf360c; line-height: 1.8; padding-left: 20px; margin: 0;">
            <li><strong>Update Your Skills:</strong> Add new technologies and tools you've learned</li>
            <li><strong>Complete Your Profile:</strong> A complete profile gets better job matches</li>
            <li><strong>Add Recent Experience:</strong> Keep your work history up to date</li>
            <li><strong>Set Job Preferences:</strong> Specify your preferred job types and locations</li>
          </ul>
        </div>

        <!-- Additional Actions -->
        <div style="text-align: center; margin: 30px 0; padding: 25px; background-color: #f5f5f5; border-radius: 10px;">
          <h3 style="color: #333; margin: 0 0 20px 0;">🚀 More Ways to Advance Your Career</h3>
          <div style="display: inline-block; margin: 0 10px;">
            <a href="${data.jobPortalUrl}/profile" 
               style="background-color: #28a745; color: white; padding: 12px 20px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block; margin: 5px;">
              👤 Update Profile
            </a>
          </div>
          <div style="display: inline-block; margin: 0 10px;">
            <a href="${data.jobPortalUrl}/ai-interviews" 
               style="background-color: #dc3545; color: white; padding: 12px 20px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block; margin: 5px;">
              🤖 Practice Interviews
            </a>
          </div>
          <div style="display: inline-block; margin: 0 10px;">
            <a href="${data.jobPortalUrl}/courses" 
               style="background-color: #6f42c1; color: white; padding: 12px 20px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block; margin: 5px;">
              📚 Take Courses
            </a>
          </div>
        </div>

        <!-- Footer -->
        <hr style="margin: 30px 0; border: none; border-top: 2px solid #e3f2fd;">
        <div style="text-align: center;">
          <p style="color: #666; font-size: 14px; margin: 0 0 15px 0; line-height: 1.6;">
            <strong>ExJobNet - Excellence Coaching Hub</strong><br>
            🌟 Connecting exceptional talent with outstanding opportunities across Africa<br>
            <em>You're receiving this because you have email notifications enabled.</em>
          </p>
          
          <div style="margin: 15px 0;">
            <a href="${data.unsubscribeUrl}" 
               style="color: #999; font-size: 12px; text-decoration: underline;">
              Unsubscribe from job recommendation emails
            </a>
          </div>
          
          <p style="color: #999; font-size: 12px; margin: 10px 0 0 0;">
            This is an automated email, please do not reply directly.<br>
            For support, visit our help center or contact us through the platform.
          </p>
        </div>
      </div>
    </div>
  `,

  jobRecommendations: (data: any) => `
    <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; background-color: #f8f9fa;">
      <div style="background-color: white; padding: 0; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); overflow: hidden;">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #1976d2 0%, #42a5f5 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 300;">
            🎯 New Job Matches Found!
          </h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">
            Hi ${data.firstName}, we found ${data.totalJobs} job${data.totalJobs > 1 ? 's' : ''} that match your profile
          </p>
        </div>

        <!-- Content -->
        <div style="padding: 30px;">
          
          <!-- Stats Section -->
          <div style="background: linear-gradient(135deg, #e3f2fd 0%, #f1f8e9 100%); padding: 25px; border-radius: 12px; margin-bottom: 30px; text-align: center;">
            <div style="display: inline-block; margin: 0 20px;">
              <div style="font-size: 32px; font-weight: bold; color: #1976d2;">${data.totalJobs}</div>
              <div style="color: #666; font-size: 14px;">New Match${data.totalJobs > 1 ? 'es' : ''}</div>
            </div>
            <div style="display: inline-block; margin: 0 20px;">
              <div style="font-size: 24px; color: #4caf50;">📊</div>
              <div style="color: #666; font-size: 14px;">AI-Matched</div>
            </div>
            <div style="display: inline-block; margin: 0 20px;">
              <div style="font-size: 24px; color: #ff9800;">⚡</div>
              <div style="color: #666; font-size: 14px;">Fresh Jobs</div>
            </div>
          </div>

          <!-- Job Recommendations -->
          ${data.jobs ? data.jobs.map((job: any, index: number) => `
            <div style="border: 2px solid #e3f2fd; border-radius: 12px; padding: 20px; margin-bottom: 20px; background: white; position: relative; transition: all 0.3s ease;">
              
              <!-- Match Badge -->
              <div style="position: absolute; top: -1px; right: 15px; background: ${job.matchColor || '#4caf50'}; color: white; padding: 5px 12px; border-radius: 0 0 8px 8px; font-size: 12px; font-weight: bold;">
                ${job.matchPercentage}% Match
              </div>

              <!-- Job Header -->
              <div style="margin-bottom: 15px; padding-top: 10px;">
                <h3 style="margin: 0 0 8px 0; color: #1976d2; font-size: 20px; font-weight: 600;">
                  ${job.title}
                </h3>
                <div style="display: flex; flex-wrap: wrap; gap: 15px; color: #666; font-size: 14px; align-items: center;">
                  <span style="font-weight: 600; color: #333;">🏢 ${job.company}</span>
                  <span>📍 ${job.location}</span>
                  <span>💼 ${job.jobType}</span>
                  ${job.salary && job.salary !== 'Not specified' ? `<span>💰 ${job.salary}</span>` : ''}
                </div>
              </div>

              <!-- Skills -->
              ${job.skills && job.skills.length > 0 ? `
                <div style="margin: 15px 0;">
                  <div style="font-size: 13px; color: #666; margin-bottom: 8px; font-weight: 600;">🛠️ Required Skills:</div>
                  <div style="display: flex; flex-wrap: wrap; gap: 6px;">
                    ${job.skills.slice(0, 5).map((skill: string) => `
                      <span style="background: linear-gradient(135deg, #e3f2fd, #f3e5f5); color: #1976d2; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 500;">
                        ${skill}
                      </span>
                    `).join('')}
                    ${job.skills.length > 5 ? `<span style="color: #999; font-size: 12px; padding: 4px 8px;">+${job.skills.length - 5} more</span>` : ''}
                  </div>
                </div>
              ` : ''}

              <!-- Apply Button -->
              <div style="margin-top: 20px; text-align: center;">
                <a href="${job.jobUrl}" 
                   style="background: linear-gradient(135deg, #1976d2, #42a5f5); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: 600; font-size: 14px; transition: all 0.3s ease;">
                  🚀 Apply Now
                </a>
              </div>

            </div>
          `).join('') : ''}

          <!-- Browse More Jobs -->
          <div style="text-align: center; margin: 40px 0; padding: 30px; background: linear-gradient(135deg, #f8f9fa, #e8f5e8); border-radius: 12px;">
            <h3 style="color: #333; margin: 0 0 15px 0;">Ready to Explore More Opportunities? 🚀</h3>
            <p style="color: #666; margin: 0 0 20px 0; line-height: 1.6;">
              Don't miss out on other great opportunities! Browse our complete job listings and discover your next career move.
            </p>
            <div style="display: flex; justify-content: center; gap: 15px; flex-wrap: wrap;">
              <a href="${data.jobPortalUrl}/jobs" 
                 style="background: linear-gradient(135deg, #4caf50, #66bb6a); color: white; padding: 14px 25px; text-decoration: none; border-radius: 25px; font-weight: 600; display: inline-block;">
                🔍 Browse All Jobs
              </a>
              <a href="${data.jobPortalUrl}/profile" 
                 style="background: white; color: #1976d2; padding: 14px 25px; text-decoration: none; border-radius: 25px; font-weight: 600; border: 2px solid #1976d2; display: inline-block;">
                ⚙️ Update Profile
              </a>
            </div>
          </div>

          <!-- Tips Section -->
          <div style="background: linear-gradient(135deg, #fff3e0, #f1f8e9); padding: 25px; border-radius: 12px; margin: 30px 0;">
            <h4 style="color: #ef6c00; margin: 0 0 15px 0; display: flex; align-items: center;">
              💡 Tips to Improve Your Job Matches
            </h4>
            <ul style="color: #666; margin: 0; padding: 0; list-style: none;">
              <li style="margin: 8px 0; padding: 5px 0; border-bottom: 1px solid rgba(0,0,0,0.1);">
                ✅ Keep your skills and experience up to date
              </li>
              <li style="margin: 8px 0; padding: 5px 0; border-bottom: 1px solid rgba(0,0,0,0.1);">
                ✅ Add a professional summary to your profile
              </li>
              <li style="margin: 8px 0; padding: 5px 0; border-bottom: 1px solid rgba(0,0,0,0.1);">
                ✅ Upload your latest CV or resume
              </li>
              <li style="margin: 8px 0; padding: 5px 0;">
                ✅ Set your job preferences and location accurately
              </li>
            </ul>
          </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #f8f9fa; padding: 25px; text-align: center; border-top: 3px solid #e3f2fd;">
          <p style="color: #666; font-size: 14px; margin: 0 0 15px 0; line-height: 1.6;">
            <strong>ExJobNet - Excellence Coaching Hub</strong><br>
            🌟 AI-powered job matching for exceptional careers<br>
            <em>You're receiving this because you have job recommendation emails enabled.</em>
          </p>
          
          <div style="margin: 15px 0;">
            <a href="${data.unsubscribeUrl}" 
               style="color: #999; font-size: 12px; text-decoration: underline;">
              Unsubscribe from job recommendation emails
            </a>
          </div>
          
          <p style="color: #999; font-size: 12px; margin: 10px 0 0 0;">
            This is an automated email, please do not reply directly.<br>
            For support, contact us through the platform.
          </p>
        </div>
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

// Send email function (now using SendGrid by default, fallback to SMTP)
export const sendEmail = async (options: EmailOptions): Promise<void> => {
  try {
    // Get email template
    const template = emailTemplates[options.template as keyof typeof emailTemplates];
    if (!template) {
      throw new Error(`Email template '${options.template}' not found`);
    }

    // Generate HTML content
    const html = template(options.data);

    // Create text version from HTML (simple fallback)
    const text = html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

    // Try SendGrid first if configured
    if (process.env.SENDGRID_API_KEY) {
      console.log('Using SendGrid for email delivery');
      await sendGridEmail({ 
        to: options.to, 
        subject: options.subject, 
        text, 
        html 
      });
      console.log('Email sent successfully via SendGrid');
      return;
    }

    // Fallback to SMTP (original Nodemailer logic)
    console.log('SendGrid not configured, falling back to SMTP');
    const transporter = await createTransporter();

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
    console.log('Email sent successfully via SMTP:', info.messageId);

    // If using Ethereal Email, log the preview URL
    if (info.messageId) {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log('Preview URL: %s', previewUrl);
      }
    }
  } catch (error) {
    console.error('Failed to send email via SendGrid/SMTP, falling back to console logging');
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

// Send welcome email to new users (now uses SendGrid by default)
export const sendWelcomeEmail = async (userData: {
  email: string;
  firstName: string;
  platform?: 'homepage' | 'job-portal' | 'elearning';
}): Promise<void> => {
  try {
    // If SendGrid is configured, use the optimized SendGrid service
    if (process.env.SENDGRID_API_KEY) {
      await sendGridWelcomeEmail(userData.email, userData.firstName);
      console.log(`Welcome email sent via SendGrid to ${userData.email}`);
      return;
    }

    // Fallback to original template-based system
    const platformUrls = {
      homepage: process.env.HOMEPAGE_URL || 'http://localhost:3000',
      'job-portal': process.env.JOB_PORTAL_URL || 'http://localhost:3001',
      elearning: process.env.ELEARNING_URL || 'http://localhost:3002'
    };

    const platform = userData.platform || 'job-portal'; // Default to job-portal

    await sendEmail({
      to: userData.email,
      subject: 'Welcome to Excellence Coaching Hub! 🎉',
      template: 'welcome',
      data: {
        firstName: userData.firstName,
        platform: platform,
        platformUrl: platformUrls[platform]
      }
    });

    console.log(`Welcome email sent to ${userData.email} for ${platform} platform`);
  } catch (error) {
    console.error('Error sending welcome email:', error);
    // Don't throw error - welcome email failure shouldn't break registration
  }
};

// Send employer-specific welcome email
export const sendEmployerWelcomeEmail = async (userData: {
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
      subject: 'Welcome to Excellence Coaching Hub - Employer Account Created! 🏢',
      template: 'employerWelcome',
      data: {
        firstName: userData.firstName,
        platform: userData.platform,
        platformUrl: platformUrls[userData.platform]
      }
    });

    console.log(`Employer welcome email sent to ${userData.email} for ${userData.platform} platform`);
  } catch (error) {
    console.error('Error sending employer welcome email:', error);
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
