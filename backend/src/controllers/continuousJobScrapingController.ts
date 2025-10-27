import { Request, Response } from 'express';
import { ContinuousJobScrapingService } from '../services/continuousJobScrapingService';

/**
 * Controller for continuous job scraping operations
 */
export class ContinuousJobScrapingController {
  
  /**
   * Get continuous scraping service status
   */
  static async getStatus(req: Request, res: Response): Promise<void> {
    try {
      const status = ContinuousJobScrapingService.getStatus();
      
      res.status(200).json({
        success: true,
        message: 'Continuous scraping service status retrieved successfully',
        data: {
          ...status,
          description: {
            isInitialized: status.isInitialized ? 'Service is running' : 'Service is not initialized',
            isScrapingInProgress: status.isScrapingInProgress ? 'Currently scraping' : 'No scraping in progress',
            lastSuccessfulScrape: status.lastSuccessfulScrape 
              ? `Last successful scrape: ${status.lastSuccessfulScrape.toLocaleString()}`
              : 'No successful scrapes yet',
            consecutiveFailures: status.consecutiveFailures > 0 
              ? `${status.consecutiveFailures} consecutive failures` 
              : 'No recent failures',
            checkInterval: `Checking every ${status.checkInterval} minutes`,
            nextChecks: {
              frequent: status.nextFrequentCheck ? new Date(status.nextFrequentCheck).toLocaleString() : 'Not scheduled',
              hourly: status.nextHourlyCheck ? new Date(status.nextHourlyCheck).toLocaleString() : 'Not scheduled',
              daily: status.nextDailyMaintenance ? new Date(status.nextDailyMaintenance).toLocaleString() : 'Not scheduled'
            }
          }
        }
      });
    } catch (error) {
      console.error('Error getting continuous scraping status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get continuous scraping status',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Manually trigger continuous scraping
   */
  static async triggerScraping(req: Request, res: Response): Promise<void> {
    try {
      console.log('Manual continuous scraping triggered by admin');
      
      const result = await ContinuousJobScrapingService.triggerManualScraping();
      
      if (result.success) {
        res.status(200).json({
          success: true,
          message: result.message,
          data: {
            timestamp: new Date().toISOString(),
            triggeredBy: 'admin',
            ...result.data
          }
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message
        });
      }
    } catch (error) {
      console.error('Error triggering continuous scraping:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to trigger continuous scraping',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Update check interval for continuous scraping
   */
  static async updateInterval(req: Request, res: Response): Promise<void> {
    try {
      const { minutes } = req.body;
      
      if (!minutes || typeof minutes !== 'number') {
        res.status(400).json({
          success: false,
          message: 'Invalid request. Please provide minutes as a number.'
        });
        return;
      }

      if (minutes < 5 || minutes > 120) {
        res.status(400).json({
          success: false,
          message: 'Check interval must be between 5 and 120 minutes.'
        });
        return;
      }

      const success = ContinuousJobScrapingService.updateCheckInterval(minutes);
      
      if (success) {
        res.status(200).json({
          success: true,
          message: `Check interval updated to ${minutes} minutes`,
          data: {
            newInterval: minutes,
            updatedBy: 'admin',
            timestamp: new Date().toISOString()
          }
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to update check interval'
        });
      }
    } catch (error) {
      console.error('Error updating check interval:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update check interval',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Restart continuous scraping service
   */
  static async restartService(req: Request, res: Response): Promise<void> {
    try {
      console.log('Restarting continuous scraping service by admin request');
      
      // Stop the current service
      ContinuousJobScrapingService.stop();
      
      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Reinitialize the service
      ContinuousJobScrapingService.init();
      
      res.status(200).json({
        success: true,
        message: 'Continuous scraping service restarted successfully',
        data: {
          restartedAt: new Date().toISOString(),
          restartedBy: 'admin'
        }
      });
    } catch (error) {
      console.error('Error restarting continuous scraping service:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to restart continuous scraping service',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get detailed scraping analytics
   */
  static async getAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const status = ContinuousJobScrapingService.getStatus();
      
      // Calculate uptime
      const now = new Date();
      let uptimeHours = 0;
      if (status.lastSuccessfulScrape) {
        uptimeHours = Math.round((now.getTime() - status.lastSuccessfulScrape.getTime()) / (1000 * 60 * 60) * 100) / 100;
      }

      // Health status
      let healthStatus = 'healthy';
      if (!status.isInitialized) healthStatus = 'not-initialized';
      else if (status.consecutiveFailures >= 3) healthStatus = 'unhealthy';
      else if (status.consecutiveFailures > 0) healthStatus = 'warning';

      res.status(200).json({
        success: true,
        message: 'Continuous scraping analytics retrieved successfully',
        data: {
          serviceHealth: {
            status: healthStatus,
            isRunning: status.isInitialized,
            consecutiveFailures: status.consecutiveFailures,
            lastSuccessfulScrape: status.lastSuccessfulScrape,
            hoursSinceLastScrape: uptimeHours
          },
          configuration: {
            checkIntervalMinutes: status.checkInterval,
            maxConsecutiveFailures: 3,
            minJobsThreshold: 5
          },
          scheduling: {
            nextFrequentCheck: status.nextFrequentCheck,
            nextHourlyCheck: status.nextHourlyCheck,
            nextDailyMaintenance: status.nextDailyMaintenance
          },
          performance: {
            isCurrentlyRunning: status.isScrapingInProgress,
            averageCheckInterval: status.checkInterval
          }
        }
      });
    } catch (error) {
      console.error('Error getting continuous scraping analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get continuous scraping analytics',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}