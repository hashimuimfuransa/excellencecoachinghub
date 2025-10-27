import { Request, Response } from 'express';
import { JobScrapingWebhookService } from '../services/jobScrapingWebhookService';

/**
 * Controller for job scraping webhook operations
 */
export class JobScrapingWebhookController {
  
  /**
   * Handle job notification webhook
   */
  static async handleJobNotification(req: Request, res: Response): Promise<void> {
    try {
      const payload = req.body;
      const metadata = {
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent')
      };

      console.log(`📡 Job notification webhook received from ${metadata.ip}`);
      console.log('Payload:', JSON.stringify(payload, null, 2));

      const result = await JobScrapingWebhookService.handleJobNotificationWebhook(payload, metadata);
      
      const statusCode = result.success ? 200 : 400;
      res.status(statusCode).json({
        success: result.success,
        message: result.message,
        timestamp: new Date().toISOString(),
        ...result.data
      });
    } catch (error) {
      console.error('Error handling job notification webhook:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Handle external system notifications
   */
  static async handleExternalSystemNotification(req: Request, res: Response): Promise<void> {
    try {
      const payload = req.body;
      const metadata = {
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent')
      };

      console.log(`📡 External system notification received from ${metadata.ip}`);
      console.log('Payload:', JSON.stringify(payload, null, 2));

      const result = await JobScrapingWebhookService.handleExternalSystemNotification(payload, metadata);
      
      const statusCode = result.success ? 200 : 400;
      res.status(statusCode).json({
        success: result.success,
        message: result.message,
        timestamp: new Date().toISOString(),
        ...result.data
      });
    } catch (error) {
      console.error('Error handling external system notification:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get webhook statistics (admin only)
   */
  static async getWebhookStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = JobScrapingWebhookService.getWebhookStats();
      
      res.status(200).json({
        success: true,
        message: 'Webhook statistics retrieved successfully',
        data: {
          ...stats,
          description: {
            totalWebhooks: `${stats.totalWebhooks} total webhook calls in recent window`,
            recentWebhooks: `${stats.recentWebhooks} webhooks in the last ${stats.rateLimitStatus.windowMinutes} minutes`,
            lastTriggerTime: stats.lastTriggerTime 
              ? `Last trigger: ${stats.lastTriggerTime.toLocaleString()}`
              : 'No recent triggers',
            isInCooldown: stats.isInCooldown ? 'Currently in cooldown period' : 'Ready for triggers',
            rateLimit: `${stats.rateLimitStatus.requestsInWindow}/${stats.rateLimitStatus.maxRequests} requests used`
          },
          configuration: {
            rateLimitWindow: stats.rateLimitStatus.windowMinutes + ' minutes',
            maxRequestsPerWindow: stats.rateLimitStatus.maxRequests,
            cooldownPeriodMinutes: 2
          }
        }
      });
    } catch (error) {
      console.error('Error getting webhook stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get webhook statistics',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Clear webhook history (super admin only)
   */
  static async clearWebhookHistory(req: Request, res: Response): Promise<void> {
    try {
      JobScrapingWebhookService.clearWebhookHistory();
      
      res.status(200).json({
        success: true,
        message: 'Webhook history cleared successfully',
        timestamp: new Date().toISOString(),
        clearedBy: 'admin'
      });
    } catch (error) {
      console.error('Error clearing webhook history:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to clear webhook history',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Test webhook endpoint (for testing webhook functionality)
   */
  static async testWebhook(req: Request, res: Response): Promise<void> {
    try {
      const testPayload = {
        source: 'test-source',
        action: 'test_notification',
        jobCount: 3,
        urgency: 'medium' as const,
        secret: req.body.secret
      };

      const metadata = {
        ip: req.ip || req.connection.remoteAddress,
        userAgent: 'Test-Webhook'
      };

      console.log('🧪 Test webhook triggered');

      const result = await JobScrapingWebhookService.handleJobNotificationWebhook(testPayload, metadata);
      
      res.status(200).json({
        success: true,
        message: 'Test webhook completed',
        testResult: result,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error testing webhook:', error);
      res.status(500).json({
        success: false,
        message: 'Test webhook failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Simulate external job board notification
   */
  static async simulateJobBoardNotification(req: Request, res: Response): Promise<void> {
    try {
      const { source = 'simulated-job-board', jobCount = 5, urgency = 'medium' } = req.body;

      const simulatedPayload = {
        source,
        action: 'new_jobs_posted',
        jobCount: parseInt(jobCount as string) || 5,
        urgency: urgency as 'low' | 'medium' | 'high'
      };

      const metadata = {
        ip: req.ip || req.connection.remoteAddress,
        userAgent: 'Simulated-Job-Board'
      };

      console.log(`🎭 Simulating job board notification: ${JSON.stringify(simulatedPayload)}`);

      const result = await JobScrapingWebhookService.handleJobNotificationWebhook(simulatedPayload, metadata);
      
      res.status(200).json({
        success: true,
        message: 'Job board notification simulation completed',
        simulation: {
          payload: simulatedPayload,
          result
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error simulating job board notification:', error);
      res.status(500).json({
        success: false,
        message: 'Job board notification simulation failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}