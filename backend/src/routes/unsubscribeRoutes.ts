import { Router } from 'express';
import { Request, Response } from 'express';
import { User } from '../models';
import crypto from 'crypto';

const router = Router();

/**
 * GET /api/unsubscribe/job-recommendations/:token - Unsubscribe from job recommendation emails
 */
router.get('/job-recommendations/:token', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Unsubscribe token is required'
      });
    }

    // Hash the token to match what's stored in the database
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user by unsubscribe token
    const user = await User.findOne({ unsubscribeToken: hashedToken });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Invalid unsubscribe token'
      });
    }

    // Update user to disable job recommendation emails
    user.jobRecommendationEmails = false;
    await user.save();

    // Return success page HTML
    const successHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Unsubscribed Successfully</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: 50px auto;
            padding: 20px;
            background-color: #f5f5f5;
          }
          .container {
            background-color: white;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            text-align: center;
          }
          .success-icon {
            font-size: 48px;
            color: #4caf50;
            margin-bottom: 20px;
          }
          h1 {
            color: #333;
            margin-bottom: 20px;
          }
          p {
            color: #666;
            line-height: 1.6;
            margin-bottom: 20px;
          }
          .info-box {
            background-color: #e8f5e8;
            border: 1px solid #4caf50;
            border-radius: 5px;
            padding: 15px;
            margin: 20px 0;
          }
          .button {
            display: inline-block;
            background-color: #1976d2;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 5px;
            margin-top: 20px;
          }
          .button:hover {
            background-color: #1565c0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="success-icon">✅</div>
          <h1>Successfully Unsubscribed</h1>
          <p>You have been unsubscribed from job recommendation emails.</p>
          
          <div class="info-box">
            <p><strong>What this means:</strong></p>
            <p>• You will no longer receive weekly job recommendation emails</p>
            <p>• You can still browse and apply for jobs manually on our platform</p>
            <p>• You can re-enable these emails anytime in your account settings</p>
          </div>
          
          <p>Thank you for using ExJobNet. We hope you found our job recommendations helpful!</p>
          
          <a href="https://exjobnet.com" class="button">Visit ExJobNet</a>
        </div>
      </body>
      </html>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.send(successHtml);

  } catch (error: any) {
    console.error('❌ Error processing unsubscribe request:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process unsubscribe request'
    });
  }
});

/**
 * POST /api/unsubscribe/resubscribe - Re-enable job recommendation emails
 */
router.post('/resubscribe', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Re-enable job recommendation emails
    user.jobRecommendationEmails = true;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Job recommendation emails have been re-enabled'
    });

  } catch (error: any) {
    console.error('❌ Error processing resubscribe request:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process resubscribe request'
    });
  }
});

export default router;
