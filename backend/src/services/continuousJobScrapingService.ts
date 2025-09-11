import cron from 'node-cron';
import { JobScrapingService } from './jobScrapingService';
import { Job } from '../models/Job';

/**
 * Continuous Job Scraping Service
 * Runs job scraping automatically in background with intelligent scheduling
 */
export class ContinuousJobScrapingService {
  private static isInitialized = false;
  private static isScrapingInProgress = false;
  private static frequentCheckJob: cron.ScheduledTask | null = null;
  private static hourlyCheckJob: cron.ScheduledTask | null = null;
  private static dailyMaintenanceJob: cron.ScheduledTask | null = null;
  private static lastSuccessfulScrape: Date | null = null;
  private static consecutiveFailures = 0;
  private static readonly MAX_CONSECUTIVE_FAILURES = 3;
  private static readonly MIN_JOBS_THRESHOLD = 5; // Trigger scraping if less than this many new jobs today
  private static readonly CHECK_INTERVAL_MINUTES = 15; // Check every 15 minutes

  /**
   * Initialize continuous job scraping
   */
  static init(): void {
    if (this.isInitialized) {
      console.log('⚠️ Continuous job scraping already initialized');
      return;
    }

    console.log('🚀 Initializing continuous job scraping service...');
    
    // Check every 15 minutes for new jobs
    this.startFrequentChecks();
    
    // Hourly maintenance check
    this.startHourlyChecks();
    
    // Daily maintenance and stats
    this.startDailyMaintenance();

    // Initial scraping run after 30 seconds
    setTimeout(() => {
      this.performIntelligentScraping('initial');
    }, 30000);

    this.isInitialized = true;
    console.log('✅ Continuous job scraping service initialized');
  }

  /**
   * Start frequent checks (every 15 minutes)
   */
  private static startFrequentChecks(): void {
    this.frequentCheckJob = cron.schedule(`*/${this.CHECK_INTERVAL_MINUTES} * * * *`, async () => {
      await this.performIntelligentScraping('frequent');
    }, {
      scheduled: true,
      timezone: 'Africa/Kigali'
    });
    console.log(`📅 Frequent job checks started (every ${this.CHECK_INTERVAL_MINUTES} minutes)`);
  }

  /**
   * Start hourly checks (more comprehensive)
   */
  private static startHourlyChecks(): void {
    // Run at 15 minutes past every hour
    this.hourlyCheckJob = cron.schedule('15 * * * *', async () => {
      await this.performIntelligentScraping('hourly');
    }, {
      scheduled: true,
      timezone: 'Africa/Kigali'
    });
    console.log('🕐 Hourly job checks started (at 15 minutes past each hour)');
  }

  /**
   * Start daily maintenance
   */
  private static startDailyMaintenance(): void {
    // Run at 3:30 AM daily for cleanup and stats
    this.dailyMaintenanceJob = cron.schedule('30 3 * * *', async () => {
      await this.performDailyMaintenance();
    }, {
      scheduled: true,
      timezone: 'Africa/Kigali'
    });
    console.log('🧹 Daily maintenance scheduled (3:30 AM)');
  }

  /**
   * Perform intelligent scraping based on current conditions
   */
  private static async performIntelligentScraping(trigger: 'initial' | 'frequent' | 'hourly' | 'manual'): Promise<void> {
    if (this.isScrapingInProgress) {
      console.log(`⏳ Job scraping already in progress, skipping ${trigger} trigger`);
      return;
    }

    try {
      // Check if scraping is needed
      const shouldScrape = await this.shouldTriggerScraping(trigger);
      
      if (!shouldScrape.should) {
        console.log(`✅ Scraping not needed (${trigger}): ${shouldScrape.reason}`);
        return;
      }

      console.log(`🚀 Starting intelligent job scraping (${trigger}): ${shouldScrape.reason}`);
      this.isScrapingInProgress = true;

      const result = await JobScrapingService.scrapeAndProcessJobs();
      
      if (result.success) {
        this.lastSuccessfulScrape = new Date();
        this.consecutiveFailures = 0;
        
        console.log(`✅ ${trigger.toUpperCase()} scraping completed successfully`);
        console.log(`📊 Results: ${result.processedJobs} jobs processed, ${result.errors.length} errors`);
        
        // If we got good results, check if we should do another round
        if (result.processedJobs >= 10 && trigger !== 'frequent') {
          console.log('🔄 Good results, scheduling follow-up scraping in 5 minutes');
          setTimeout(() => {
            this.performIntelligentScraping('manual');
          }, 5 * 60 * 1000); // 5 minutes
        }
      } else {
        this.consecutiveFailures++;
        console.log(`❌ ${trigger.toUpperCase()} scraping failed (${this.consecutiveFailures}/${this.MAX_CONSECUTIVE_FAILURES} failures)`);
        
        if (this.consecutiveFailures >= this.MAX_CONSECUTIVE_FAILURES) {
          console.log('⚠️ Too many consecutive failures, reducing scraping frequency temporarily');
        }
      }
    } catch (error) {
      this.consecutiveFailures++;
      console.error(`❌ Error during ${trigger} scraping:`, error);
    } finally {
      this.isScrapingInProgress = false;
    }
  }

  /**
   * Check if scraping should be triggered
   */
  private static async shouldTriggerScraping(trigger: string): Promise<{should: boolean, reason: string}> {
    try {
      // Don't scrape if too many consecutive failures
      if (this.consecutiveFailures >= this.MAX_CONSECUTIVE_FAILURES) {
        return { should: false, reason: `Too many consecutive failures (${this.consecutiveFailures})` };
      }

      // Get today's job statistics
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayJobs = await Job.countDocuments({
        isExternalJob: true,
        createdAt: { $gte: today }
      });

      const recentJobs = await Job.countDocuments({
        isExternalJob: true,
        createdAt: { $gte: new Date(Date.now() - 2 * 60 * 60 * 1000) } // Last 2 hours
      });

      // Different logic for different triggers
      switch (trigger) {
        case 'initial':
          return { should: true, reason: 'Initial server startup scraping' };
          
        case 'frequent':
          // For frequent checks, only scrape if very few jobs today
          if (todayJobs < this.MIN_JOBS_THRESHOLD) {
            return { should: true, reason: `Low job count today (${todayJobs} < ${this.MIN_JOBS_THRESHOLD})` };
          }
          
          // Or if no recent jobs in last 2 hours during business hours
          const hour = new Date().getHours();
          if (hour >= 8 && hour <= 18 && recentJobs === 0) {
            return { should: true, reason: 'No jobs in last 2 hours during business hours' };
          }
          
          return { should: false, reason: `Sufficient jobs today (${todayJobs}) and recent activity (${recentJobs})` };
          
        case 'hourly':
          // More aggressive hourly scraping
          if (todayJobs < 20) {
            return { should: true, reason: `Hourly check: jobs today (${todayJobs}) below target (20)` };
          }
          
          return { should: false, reason: `Hourly check: sufficient jobs today (${todayJobs})` };
          
        case 'manual':
          return { should: true, reason: 'Manual trigger' };
          
        default:
          return { should: false, reason: 'Unknown trigger type' };
      }
      
    } catch (error) {
      console.error('Error checking scraping conditions:', error);
      return { should: false, reason: 'Error checking conditions' };
    }
  }

  /**
   * Perform daily maintenance tasks
   */
  private static async performDailyMaintenance(): Promise<void> {
    console.log('🧹 Starting daily maintenance...');
    
    try {
      // Reset failure counter
      this.consecutiveFailures = 0;
      
      // Get and log statistics
      const stats = await JobScrapingService.getScrapingStats();
      console.log('📊 Daily Stats:', {
        todayJobs: stats.todayJobs,
        totalJobs: stats.totalJobs,
        lastSuccessfulScrape: this.lastSuccessfulScrape
      });
      
      // Force scraping if very low job count
      if (stats.todayJobs < 10) {
        console.log('🔄 Low job count, forcing maintenance scraping');
        await this.performIntelligentScraping('manual');
      }
      
      console.log('✅ Daily maintenance completed');
    } catch (error) {
      console.error('❌ Error during daily maintenance:', error);
    }
  }

  /**
   * Manually trigger scraping
   */
  static async triggerManualScraping(): Promise<{success: boolean, message: string, data?: any}> {
    try {
      if (this.isScrapingInProgress) {
        return {
          success: false,
          message: 'Scraping already in progress'
        };
      }

      await this.performIntelligentScraping('manual');
      
      return {
        success: true,
        message: 'Manual scraping triggered successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: `Manual scraping failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get service status
   */
  static getStatus(): {
    isInitialized: boolean;
    isScrapingInProgress: boolean;
    lastSuccessfulScrape: Date | null;
    consecutiveFailures: number;
    checkInterval: number;
    nextFrequentCheck: string | null;
    nextHourlyCheck: string | null;
    nextDailyMaintenance: string | null;
  } {
    let nextFrequentCheck: string | null = null;
    let nextHourlyCheck: string | null = null;
    let nextDailyMaintenance: string | null = null;

    try {
      if (this.frequentCheckJob) {
        const nextDate = this.frequentCheckJob.nextDate();
        nextFrequentCheck = nextDate ? nextDate.toISO() : null;
      }
      
      if (this.hourlyCheckJob) {
        const nextDate = this.hourlyCheckJob.nextDate();
        nextHourlyCheck = nextDate ? nextDate.toISO() : null;
      }
      
      if (this.dailyMaintenanceJob) {
        const nextDate = this.dailyMaintenanceJob.nextDate();
        nextDailyMaintenance = nextDate ? nextDate.toISO() : null;
      }
    } catch (error) {
      console.error('Error getting next run times:', error);
    }

    return {
      isInitialized: this.isInitialized,
      isScrapingInProgress: this.isScrapingInProgress,
      lastSuccessfulScrape: this.lastSuccessfulScrape,
      consecutiveFailures: this.consecutiveFailures,
      checkInterval: this.CHECK_INTERVAL_MINUTES,
      nextFrequentCheck,
      nextHourlyCheck,
      nextDailyMaintenance
    };
  }

  /**
   * Stop all scheduled tasks
   */
  static stop(): void {
    if (this.frequentCheckJob) {
      this.frequentCheckJob.destroy();
      this.frequentCheckJob = null;
    }
    
    if (this.hourlyCheckJob) {
      this.hourlyCheckJob.destroy();
      this.hourlyCheckJob = null;
    }
    
    if (this.dailyMaintenanceJob) {
      this.dailyMaintenanceJob.destroy();
      this.dailyMaintenanceJob = null;
    }

    this.isInitialized = false;
    console.log('🛑 Continuous job scraping service stopped');
  }

  /**
   * Update check interval
   */
  static updateCheckInterval(minutes: number): boolean {
    if (minutes < 5 || minutes > 120) {
      console.error('❌ Invalid check interval. Must be between 5 and 120 minutes');
      return false;
    }

    try {
      // Stop current frequent checks
      if (this.frequentCheckJob) {
        this.frequentCheckJob.destroy();
      }

      // Start with new interval
      this.frequentCheckJob = cron.schedule(`*/${minutes} * * * *`, async () => {
        await this.performIntelligentScraping('frequent');
      }, {
        scheduled: true,
        timezone: 'Africa/Kigali'
      });

      console.log(`✅ Check interval updated to ${minutes} minutes`);
      return true;
    } catch (error) {
      console.error('❌ Failed to update check interval:', error);
      return false;
    }
  }
}