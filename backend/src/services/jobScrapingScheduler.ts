import cron from 'node-cron';
import { JobScrapingService } from './jobScrapingService';

/**
 * Job Scraping Scheduler
 * Manages automated job scraping from external sources
 */
export class JobScrapingScheduler {
  private static isRunning = false;
  private static lastRunTime: Date | null = null;
  private static cronJob: cron.ScheduledTask | null = null;

  /**
   * Start the job scraping scheduler
   */
  static start(): void {
    if (this.cronJob) {
      console.log('⚠️ Job scraping scheduler is already running');
      return;
    }

    // Run every day at 2:00 AM (local server time)
    // Cron format: second minute hour day month dayOfWeek
    // '0 0 2 * * *' = At 2:00 AM every day
    this.cronJob = cron.schedule('0 0 2 * * *', async () => {
      await this.runScrapingTask();
    }, {
      scheduled: true,
      timezone: 'Africa/Kigali' // Rwanda timezone
    });

    // Also schedule a backup run at 8:00 AM if minimum jobs not met
    const backupJob = cron.schedule('0 0 8 * * *', async () => {
      const stats = await JobScrapingService.getScrapingStats();
      if (stats.todayJobs < 20) {
        console.log(`🔄 Backup scraping triggered - only ${stats.todayJobs} jobs today`);
        await this.runScrapingTask();
      } else {
        console.log(`✅ Backup scraping skipped - ${stats.todayJobs} jobs already processed today`);
      }
    }, {
      scheduled: true,
      timezone: 'Africa/Kigali'
    });

    console.log('✅ Job scraping scheduler started - will run daily at 2:00 AM (Rwanda time)');
    
    // Also run immediately if it's the first time (for testing)
    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 Running initial job scraping in development mode...');
      setTimeout(() => {
        this.runScrapingTask();
      }, 5000); // Wait 5 seconds after server start
    }
  }

  /**
   * Stop the job scraping scheduler
   */
  static stop(): void {
    if (this.cronJob) {
      this.cronJob.destroy();
      this.cronJob = null;
      console.log('🛑 Job scraping scheduler stopped');
    }
  }

  /**
   * Run the scraping task manually
   */
  static async runManually(): Promise<{
    success: boolean;
    message: string;
    data?: any;
  }> {
    if (this.isRunning) {
      return {
        success: false,
        message: 'Job scraping is already running. Please wait for it to complete.'
      };
    }

    const result = await this.runScrapingTask();
    return {
      success: result.success,
      message: result.success 
        ? `Successfully processed ${result.processedJobs} jobs`
        : `Scraping failed with ${result.errors.length} errors`,
      data: result
    };
  }

  /**
   * Internal method to run the actual scraping task
   */
  private static async runScrapingTask(): Promise<{
    success: boolean;
    processedJobs: number;
    errors: string[];
  }> {
    if (this.isRunning) {
      console.log('⚠️ Job scraping is already running, skipping this execution');
      return {
        success: false,
        processedJobs: 0,
        errors: ['Scraping already in progress']
      };
    }

    this.isRunning = true;
    const startTime = new Date();
    
    try {
      console.log('🚀 Starting scheduled job scraping...');
      
      const result = await JobScrapingService.scrapeAndProcessJobs();
      
      this.lastRunTime = new Date();
      const duration = Date.now() - startTime.getTime();
      
      console.log(`✅ Scheduled job scraping completed in ${duration}ms`);
      console.log(`📊 Results: ${result.processedJobs} jobs processed, ${result.errors.length} errors`);
      
      if (result.errors.length > 0) {
        console.log('❌ Errors during scraping:', result.errors);
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Scheduled job scraping failed:', errorMessage);
      
      return {
        success: false,
        processedJobs: 0,
        errors: [errorMessage]
      };
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Get scheduler status
   */
  static getStatus(): {
    isRunning: boolean;
    isScheduled: boolean;
    lastRunTime: Date | null;
    nextRunTime: string | null;
    timezone: string;
  } {
    let nextRunTime: string | null = null;
    
    if (this.cronJob) {
      try {
        // Get next scheduled time
        const nextDate = this.cronJob.nextDate();
        nextRunTime = nextDate ? nextDate.toISO() : null;
      } catch (error) {
        console.error('Error getting next run time:', error);
      }
    }

    return {
      isRunning: this.isRunning,
      isScheduled: this.cronJob !== null,
      lastRunTime: this.lastRunTime,
      nextRunTime,
      timezone: 'Africa/Kigali'
    };
  }

  /**
   * Update schedule (stop current and start new)
   */
  static updateSchedule(cronExpression: string): boolean {
    try {
      this.stop();
      
      this.cronJob = cron.schedule(cronExpression, async () => {
        await this.runScrapingTask();
      }, {
        scheduled: true,
        timezone: 'Africa/Kigali'
      });

      console.log(`✅ Job scraping schedule updated to: ${cronExpression}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to update schedule:', error);
      return false;
    }
  }

  /**
   * Validate cron expression
   */
  static validateCronExpression(expression: string): boolean {
    try {
      return cron.validate(expression);
    } catch (error) {
      return false;
    }
  }
}