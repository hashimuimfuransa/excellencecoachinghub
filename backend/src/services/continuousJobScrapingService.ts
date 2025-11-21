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
  private static readonly MIN_JOBS_THRESHOLD = process.env.NODE_ENV === 'production' ? 5 : 3; // Higher threshold for production
  private static readonly CHECK_INTERVAL_MINUTES = process.env.NODE_ENV === 'production' ? 15 : 10; // Less frequent in production

  /**
   * Initialize continuous job scraping
   */
  static init(): void {
    if (this.isInitialized) {
      console.log('⚠️ Continuous job scraping already initialized');
      return;
    }

    console.log(`🚀 Initializing continuous job scraping service (${process.env.NODE_ENV || 'development'} mode)...`);
    
    // Environment-specific configuration
    const isProduction = process.env.NODE_ENV === 'production';
    console.log(`📊 Production mode: ${isProduction}, Threshold: ${this.MIN_JOBS_THRESHOLD}, Interval: ${this.CHECK_INTERVAL_MINUTES}min`);
    
    // Run once daily at 9:00 AM instead of frequent checks
    this.startDailyChecks();
    
    // Keep daily maintenance
    this.startDailyMaintenance();

    // Initial scraping run - longer delay in production for stability
    const initialDelay = isProduction ? 60000 : 30000; // 60s in production, 30s in dev
    setTimeout(() => {
      this.performIntelligentScraping('initial');
    }, initialDelay);

    this.isInitialized = true;
    console.log(`✅ Continuous job scraping service initialized (${isProduction ? 'production' : 'development'} mode) - running once daily`);
  }

  /**
   * Start frequent checks (every 15 minutes)
   */
  private static startFrequentChecks(): void {
    this.frequentCheckJob = cron.schedule(`*/${this.CHECK_INTERVAL_MINUTES} * * * *`, async () => {
      await this.performIntelligentScraping('daily');
    });
    console.log(`📅 Frequent job checks started (every ${this.CHECK_INTERVAL_MINUTES} minutes)`);
  }

  /**
   * Start daily checks (once per day at 9:00 AM)
   */
  private static startDailyChecks(): void {
    // Run once daily at 9:00 AM
    this.frequentCheckJob = cron.schedule('0 9 * * *', async () => {
      await this.performIntelligentScraping('daily');
    });
    console.log('📅 Daily job checks started (9:00 AM daily)');
  }

  /**
   * Start hourly checks (more comprehensive)
   */
  private static startHourlyChecks(): void {
    // Run at 15 minutes past every hour
    this.hourlyCheckJob = cron.schedule('15 * * * *', async () => {
      await this.performIntelligentScraping('daily');
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
    });
    console.log('🧹 Daily maintenance scheduled (3:30 AM)');
  }

  /**
   * Perform intelligent scraping based on current conditions
   */
  private static async performIntelligentScraping(trigger: 'initial' | 'daily' | 'manual'): Promise<void> {
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
        
        // If we got good results, don't schedule another round for daily scraping
        if (result.processedJobs >= 10 && trigger !== 'daily') {
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

      // Different logic for different triggers
      switch (trigger) {
        case 'initial':
          return { should: true, reason: 'Initial server startup scraping' };
          
        case 'daily':
          // For daily checks, scrape if we have fewer than 20 jobs today
          if (todayJobs < 20) {
            return { should: true, reason: `Daily check: jobs today (${todayJobs}) below target (20)` };
          }
          
          return { should: false, reason: `Daily check: sufficient jobs today (${todayJobs})` };
          
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
        totalJobs: stats.totalExternalJobs,
        lastSuccessfulScrape: this.lastSuccessfulScrape
      });
      
      // Force scraping if very low job count
      if (stats.todayJobs < 10) {
        console.log('🔄 Low job count, forcing maintenance scraping');
        await this.performIntelligentScraping('manual');
      }
      
      // In production/hosted mode, check if restart is needed for better performance
      if (process.env.NODE_ENV === 'production') {
        const uptime = process.uptime();
        const uptimeHours = uptime / 3600;
        
        console.log(`📊 Server uptime: ${Math.round(uptimeHours)} hours`);
        
        // If server has been running for more than 20 hours and it's late night (3:30 AM), consider restart
        if (uptimeHours > 20 && stats.todayJobs < 5) {
          console.log('⚠️ Long uptime detected with low job activity. Considering graceful restart for optimization...');
          
          // Trigger a graceful restart signal (for PM2 or similar process managers)
          setTimeout(() => {
            console.log('🔄 Initiating graceful restart for daily optimization...');
            process.kill(process.pid, 'SIGTERM');
          }, 30000); // 30 seconds delay to complete current operations
        }
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
        await this.performIntelligentScraping('daily');
      });

      console.log(`✅ Check interval updated to ${minutes} minutes`);
      return true;
    } catch (error) {
      console.error('❌ Failed to update check interval:', error);
      return false;
    }
  }
}