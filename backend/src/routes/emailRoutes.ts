import { Router, Request, Response } from 'express';
import { 
  sendEmail, 
  sendWelcomeEmail, 
  sendPasswordResetEmail, 
  sendJobRecommendationEmail,
  sendJobApplicationEmail,
  testSendGridConfig 
} from '../services/sendGridService';
import { User, EmailTracker, EmailType } from '../models';

const router = Router();

/**
 * POST /api/send-email - General email sending endpoint
 * Accepts { email, name } and sends welcome email
 * This replaces the EmailJS functionality
 */
router.post('/send-email', async (req: Request, res: Response) => {
  try {
    const { email, name, platform = 'homepage', platformUrl = '' } = req.body;

    if (!email || !name) {
      return res.status(400).json({
        error: 'Email and name are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Invalid email format'
      });
    }

    // Send welcome email using SendGrid with platform info
    await sendWelcomeEmail(email, name, platform, platformUrl);

    console.log(`✅ Welcome email sent successfully to: ${email} for ${platform} platform`);

    res.status(200).json({
      message: 'Email sent'
    });

  } catch (error: any) {
    console.error('❌ Error sending email:', error);
    res.status(500).json({
      error: error.message || 'Failed to send email'
    });
  }
});

/**
 * POST /api/email/welcome - Send welcome email
 */
router.post('/welcome', async (req: Request, res: Response) => {
  try {
    const { email, name, platform = 'homepage', platformUrl = '' } = req.body;

    if (!email || !name) {
      return res.status(400).json({
        error: 'Email and name are required'
      });
    }

    await sendWelcomeEmail(email, name, platform, platformUrl);

    res.status(200).json({
      message: 'Welcome email sent successfully'
    });

  } catch (error: any) {
    console.error('❌ Error sending welcome email:', error);
    res.status(500).json({
      error: error.message || 'Failed to send welcome email'
    });
  }
});

/**
 * POST /api/email/password-reset - Send password reset email
 */
router.post('/password-reset', async (req: Request, res: Response) => {
  try {
    const { email, name, resetUrl } = req.body;

    if (!email || !name || !resetUrl) {
      return res.status(400).json({
        error: 'Email, name, and resetUrl are required'
      });
    }

    await sendPasswordResetEmail(email, name, resetUrl);

    res.status(200).json({
      message: 'Password reset email sent successfully'
    });

  } catch (error: any) {
    console.error('❌ Error sending password reset email:', error);
    res.status(500).json({
      error: error.message || 'Failed to send password reset email'
    });
  }
});

/**
 * POST /api/email/job-recommendations - Send job recommendation email
 */
router.post('/job-recommendations', async (req: Request, res: Response) => {
  try {
    const { email, name, jobs, confirmUrl, rejectUrl, userId } = req.body;

    if (!email || !name || !jobs || !Array.isArray(jobs)) {
      return res.status(400).json({
        error: 'Email, name, and jobs array are required'
      });
    }

    // If userId provided, check if we can send email (prevents duplicates)
    if (userId) {
      const canSendEmail = await EmailTracker.canSendEmail(userId, EmailType.JOB_RECOMMENDATIONS);
      
      if (!canSendEmail) {
        return res.status(429).json({
          error: 'Job recommendation email already sent recently for this user (weekly frequency)'
        });
      }
    }

    await sendJobRecommendationEmail(email, name, jobs, confirmUrl, rejectUrl);

    // Record email sent if userId provided
    if (userId) {
      await EmailTracker.recordEmailSent(
        userId, 
        EmailType.JOB_RECOMMENDATIONS,
        {
          jobCount: jobs.length,
          reason: 'manual_api_call',
          frequency: 'weekly'
        }
      );
    }

    res.status(200).json({
      message: 'Job recommendation email sent successfully'
    });

  } catch (error: any) {
    console.error('❌ Error sending job recommendation email:', error);
    res.status(500).json({
      error: error.message || 'Failed to send job recommendation email'
    });
  }
});

/**
 * POST /api/email/job-application - Send job application confirmation
 */
router.post('/job-application', async (req: Request, res: Response) => {
  try {
    const { email, name, jobTitle, company } = req.body;

    if (!email || !name || !jobTitle || !company) {
      return res.status(400).json({
        error: 'Email, name, jobTitle, and company are required'
      });
    }

    await sendJobApplicationEmail(email, name, jobTitle, company);

    res.status(200).json({
      message: 'Job application confirmation email sent successfully'
    });

  } catch (error: any) {
    console.error('❌ Error sending job application email:', error);
    res.status(500).json({
      error: error.message || 'Failed to send job application email'
    });
  }
});

/**
 * GET /api/email/unsubscribe - Handle email unsubscribe
 */
router.get('/unsubscribe', async (req: Request, res: Response) => {
  try {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      return res.status(400).send(`
        <html>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h2>Invalid Unsubscribe Link</h2>
            <p>The unsubscribe link is invalid or expired.</p>
          </body>
        </html>
      `);
    }

    try {
      // Decode the email from the token
      const email = Buffer.from(token, 'base64').toString('utf-8');
      
      // In a real application, you would:
      // 1. Update the user's email preferences in the database
      // 2. Mark them as unsubscribed from marketing emails
      // For now, we'll just log it
      console.log(`📧 User ${email} requested to unsubscribe`);
      
      // TODO: Update user preferences in database
      // await User.updateOne({ email }, { emailNotifications: false });

      res.status(200).send(`
        <html>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h2>Successfully Unsubscribed</h2>
            <p>You have been successfully unsubscribed from email notifications.</p>
            <p>If you change your mind, you can re-enable email notifications in your account settings.</p>
            <a href="${process.env.JOB_PORTAL_URL || 'https://exjobnet.com'}" 
               style="background-color: #1976d2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
              Return to Exjobnet
            </a>
          </body>
        </html>
      `);

    } catch (decodeError) {
      throw new Error('Invalid token format');
    }

  } catch (error: any) {
    console.error('❌ Error handling unsubscribe:', error);
    res.status(400).send(`
      <html>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h2>Error Processing Unsubscribe</h2>
          <p>There was an error processing your unsubscribe request. Please try again or contact support.</p>
        </body>
      </html>
    `);
  }
});

/**
 * GET /api/email/test-config - Test SendGrid configuration
 */
router.get('/test-config', async (req: Request, res: Response) => {
  try {
    const isConfigValid = await testSendGridConfig();

    res.status(200).json({
      success: isConfigValid,
      message: isConfigValid ? 'SendGrid configuration is valid' : 'SendGrid configuration test failed',
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Error testing SendGrid config:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to test SendGrid configuration'
    });
  }
});

/**
 * POST /api/email/custom - Send custom email
 */
router.post('/custom', async (req: Request, res: Response) => {
  try {
    const { to, subject, text, html } = req.body;

    if (!to || !subject || (!text && !html)) {
      return res.status(400).json({
        error: 'to, subject, and either text or html are required'
      });
    }

    // Use text as fallback for html if not provided
    const emailText = text || 'Please enable HTML to view this email.';
    const emailHtml = html || `<p>${text}</p>`;

    await sendEmail({ to, subject, text: emailText, html: emailHtml });

    res.status(200).json({
      message: 'Custom email sent successfully'
    });

  } catch (error: any) {
    console.error('❌ Error sending custom email:', error);
    res.status(500).json({
      error: error.message || 'Failed to send custom email'
    });
  }
});

/**
 * GET /api/email/stats - Get daily email statistics
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const dailyStats = await EmailTracker.getDailyEmailStats();
    
    res.status(200).json({
      success: true,
      data: {
        todayStats: dailyStats,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('❌ Error getting email statistics:', error);
    res.status(500).json({
      error: error.message || 'Failed to get email statistics'
    });
  }
});

/**
 * GET /api/email/user/:userId/status - Check email status for a specific user
 */
router.get('/user/:userId/status', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { emailType = 'job_recommendations' } = req.query;

    const canSend = await EmailTracker.canSendEmail(userId, emailType as EmailType);
    
    // Get last sent information
    const lastSent = await EmailTracker.findOne({
      userId,
      emailType,
      isActive: true
    }).sort({ lastSentAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        canSendEmail: canSend,
        lastSent: lastSent ? {
          date: lastSent.lastSentAt,
          emailsSentToday: lastSent.emailsSentToday,
          metadata: lastSent.metadata
        } : null
      }
    });

  } catch (error: any) {
    console.error('❌ Error checking user email status:', error);
    res.status(500).json({
      error: error.message || 'Failed to check user email status'
    });
  }
});

export default router;