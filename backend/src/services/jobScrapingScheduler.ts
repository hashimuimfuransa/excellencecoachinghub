import cron from 'node-cron';
import { JobScrapingService } from './jobScrapingService';
import InternshipRwScrapingService from './internshipRwScrapingService';
import { OptimizedJobScrapingService } from './optimizedJobScrapingService';

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

    // Run every hour (on the hour) for comprehensive job monitoring
    // Cron format: second minute hour day month dayOfWeek
    // '0 0 * * * *' = At the start of every hour
    this.cronJob = cron.schedule('0 0 * * * *', async () => {
      await this.runScrapingTask();
    }, {
      scheduled: true,
      timezone: 'Africa/Kigali' // Rwanda timezone
    });

    // Also schedule internship.rw specific scraping every 2 hours
    const internshipJob = cron.schedule('0 30 */2 * * *', async () => {
      console.log('🇷🇼 Starting internship.rw specific scraping...');
      await this.runInternshipRwScrapingTask();
    }, {
      scheduled: true,
      timezone: 'Africa/Kigali'
    });

    console.log('✅ Job scraping scheduler started - will run every hour (Rwanda time)');
    console.log('✅ Internship.rw scraping scheduled every 2 hours at :30 minutes');
    
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
   * Run internship.rw scraping manually
   */
  static async runInternshipRwManually(): Promise<{
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

    const startTime = new Date();
    
    try {
      const result = await InternshipRwScrapingService.scrapeInternshipOpportunities();
      const savedCount = await InternshipRwScrapingService.saveScrapedJobs(result.jobs);
      
      const duration = Date.now() - startTime.getTime();
      
      return {
        success: true,
        message: `Successfully processed ${result.jobs.length} jobs from internship.rw (${savedCount} saved)`,
        data: {
          jobsFound: result.jobs.length,
          jobsSaved: savedCount,
          employerRequests: result.employerRequests.length,
          errors: result.errors.length,
          duration: `${duration}ms`
        }
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        message: `Internship.rw scraping failed: ${errorMessage}`,
        data: { error: errorMessage }
      };
    }
  }

  /**
   * Internal method to run the actual scraping task with source rotation
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
    let totalProcessedJobs = 0;
    const allErrors: string[] = [];
    
    try {
      console.log('🚀 Starting scheduled job scraping rotation...');
      
      // Phase 1: Run standard job scraping (UN Jobs and other sources with 10 job limit)
      console.log('📊 Phase 1: Standard job sources (UN Jobs with rotation)...');
      try {
        const standardResult = await OptimizedJobScrapingService.scrapeAndProcessJobs();
        
        totalProcessedJobs += standardResult.processedJobs;
        if (standardResult.errors && standardResult.errors.length > 0) {
          allErrors.push(...standardResult.errors);
        }
        
        console.log(`✅ Standard sources phase: ${standardResult.processedJobs} jobs processed`);
      } catch (error) {
        const errorMsg = `UN Jobs scraping failed: ${error instanceof Error ? error.message : String(error)}`;
        console.error(`❌ ${errorMsg}`);
        allErrors.push(errorMsg);
      }
      
      // Phase 2: Run internship.rw scraping with rotation
      console.log('📊 Phase 2: Rwanda internship.rw scraping...');
      try {
        const internshipResult = await InternshipRwScrapingService.scrapeInternshipOpportunities();
        
        // Save internship jobs
        const savedCount = await InternshipRwScrapingService.saveScrapedJobs(internshipResult.jobs);
        totalProcessedJobs += savedCount;
        
        if (internshipResult.errors) {
          allErrors.push(...internshipResult.errors);
        }
        
        console.log(`✅ Internship.rw phase: ${internshipResult.jobs.length} jobs found, ${savedCount} saved`);
        
        if (internshipResult.employerRequests.length > 0) {
          console.log(`💼 Found ${internshipResult.employerRequests.length} employer requests`);
        }
      } catch (error) {
        const errorMsg = `Internship.rw scraping failed: ${error instanceof Error ? error.message : String(error)}`;
        console.error(`❌ ${errorMsg}`);
        allErrors.push(errorMsg);
      }
      
      // Phase 3: Run other sources rotation (if we have capacity)
      if (totalProcessedJobs < 15) {
        console.log('📊 Phase 3: Other job sources (top-up)...');
        try {
          const remainingCapacity = 15 - totalProcessedJobs;
          const otherResult = await JobScrapingService.scrapeAndProcessJobs();
          
          // Limit the additional jobs to remaining capacity
          const additionalJobs = Math.min(otherResult.processedJobs, remainingCapacity);
          totalProcessedJobs += additionalJobs;
          
          if (otherResult.errors) {
            allErrors.push(...otherResult.errors);
          }
          
          console.log(`✅ Other sources phase: ${additionalJobs} additional jobs processed`);
        } catch (error) {
          const errorMsg = `Other sources scraping failed: ${error instanceof Error ? error.message : String(error)}`;
          console.error(`❌ ${errorMsg}`);
          allErrors.push(errorMsg);
        }
      }
      
      this.lastRunTime = new Date();
      const duration = Date.now() - startTime.getTime();
      
      console.log(`✅ Scheduled job scraping rotation completed in ${duration}ms`);
      console.log(`📊 Total Results: ${totalProcessedJobs} jobs processed, ${allErrors.length} errors`);
      
      if (allErrors.length > 0) {
        console.log(`❌ Errors during scraping (${allErrors.length}):`, allErrors.slice(0, 5));
      }

      return {
        success: true,
        processedJobs: totalProcessedJobs,
        errors: allErrors
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Scheduled job scraping failed:', errorMessage);
      
      return {
        success: false,
        processedJobs: totalProcessedJobs,
        errors: [...allErrors, errorMessage]
      };
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Internal method to run internship.rw specific scraping
   */
  private static async runInternshipRwScrapingTask(): Promise<void> {
    if (this.isRunning) {
      console.log('⚠️ Job scraping is already running, skipping internship.rw execution');
      return;
    }

    const startTime = new Date();
    
    try {
      console.log('🇷🇼 Starting internship.rw scraping...');
      
      const result = await InternshipRwScrapingService.scrapeInternshipOpportunities();
      
      // Save the scraped jobs
      const savedCount = await InternshipRwScrapingService.saveScrapedJobs(result.jobs);
      
      const duration = Date.now() - startTime.getTime();
      
      console.log(`✅ Internship.rw scraping completed in ${duration}ms`);
      console.log(`📊 Results: ${result.jobs.length} jobs found, ${savedCount} saved, ${result.employerRequests.length} employer requests, ${result.errors.length} errors`);
      
      if (result.errors.length > 0) {
        console.log('❌ Internship.rw scraping errors:', result.errors.slice(0, 5)); // Show first 5 errors
      }

      if (result.employerRequests.length > 0) {
        console.log(`💼 Found ${result.employerRequests.length} employer job requests`);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Internship.rw scraping failed:', errorMessage);
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