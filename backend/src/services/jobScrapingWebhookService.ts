import { ContinuousJobScrapingService } from './continuousJobScrapingService';

/**
 * Job Scraping Webhook Service
 * Handles external notifications for immediate job scraping triggers
 */
export class JobScrapingWebhookService {
  private static readonly WEBHOOK_SECRET = process.env.JOB_WEBHOOK_SECRET || 'default-webhook-secret';
  private static readonly RATE_LIMIT_WINDOW = 5 * 60 * 1000; // 5 minutes
  private static readonly MAX_WEBHOOKS_PER_WINDOW = 10;
  private static readonly COOLDOWN_PERIOD = 2 * 60 * 1000; // 2 minutes between triggers
  
  private static webhookHistory: Array<{timestamp: Date, source: string, ip?: string}> = [];
  private static lastTriggerTime: Date | null = null;

  /**
   * Process incoming webhook for new job notifications
   */
  static async handleJobNotificationWebhook(payload: {
    source: string;
    action: string;
    jobCount?: number;
    urgency?: 'low' | 'medium' | 'high';
    secret?: string;
  }, metadata: {
    ip?: string;
    userAgent?: string;
  }): Promise<{success: boolean; message: string; data?: any}> {
    
    try {
      // Validate webhook secret if provided
      if (payload.secret && payload.secret !== this.WEBHOOK_SECRET) {
        console.log(`⚠️ Invalid webhook secret from ${metadata.ip}`);
        return {
          success: false,
          message: 'Invalid webhook secret'
        };
      }

      // Check rate limiting
      const rateLimitResult = this.checkRateLimit(payload.source, metadata.ip);
      if (!rateLimitResult.allowed) {
        console.log(`🚫 Webhook rate limited: ${rateLimitResult.reason}`);
        return {
          success: false,
          message: rateLimitResult.reason
        };
      }

      // Check cooldown period
      if (this.isInCooldownPeriod()) {
        console.log('⏳ Webhook triggered during cooldown period, queuing for later');
        return {
          success: true,
          message: 'Webhook received during cooldown, scraping will resume shortly',
          data: { queued: true }
        };
      }

      // Log the webhook
      this.logWebhookCall(payload.source, metadata.ip);

      // Determine if immediate scraping is needed
      const shouldTrigger = this.shouldTriggerImmediateScraping(payload);
      
      if (shouldTrigger.should) {
        console.log(`🚀 Webhook triggering immediate job scraping: ${shouldTrigger.reason}`);
        
        const scrapingResult = await ContinuousJobScrapingService.triggerManualScraping();
        this.lastTriggerTime = new Date();
        
        return {
          success: true,
          message: `Webhook processed and scraping triggered: ${shouldTrigger.reason}`,
          data: {
            triggered: true,
            source: payload.source,
            urgency: payload.urgency || 'medium',
            scrapingResult: scrapingResult.success
          }
        };
      } else {
        console.log(`✅ Webhook processed but scraping not needed: ${shouldTrigger.reason}`);
        return {
          success: true,
          message: `Webhook processed: ${shouldTrigger.reason}`,
          data: {
            triggered: false,
            reason: shouldTrigger.reason
          }
        };
      }
    } catch (error) {
      console.error('❌ Error handling job notification webhook:', error);
      return {
        success: false,
        message: 'Internal error processing webhook',
        data: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }

  /**
   * Handle external system notifications (like RSS feeds, API changes, etc.)
   */
  static async handleExternalSystemNotification(payload: {
    system: string;
    type: 'new_jobs' | 'system_update' | 'maintenance_complete';
    data?: any;
  }, metadata: {
    ip?: string;
    userAgent?: string;
  }): Promise<{success: boolean; message: string; data?: any}> {
    
    console.log(`📡 External system notification from ${payload.system}: ${payload.type}`);
    
    try {
      switch (payload.type) {
        case 'new_jobs':
          return await this.handleJobNotificationWebhook({
            source: payload.system,
            action: 'new_jobs_available',
            jobCount: payload.data?.count,
            urgency: payload.data?.urgency || 'medium'
          }, metadata);
          
        case 'system_update':
          // System updated, might need to re-scrape
          console.log(`🔄 ${payload.system} system updated, triggering validation scraping`);
          const result = await ContinuousJobScrapingService.triggerManualScraping();
          
          return {
            success: true,
            message: `System update notification processed, scraping ${result.success ? 'triggered' : 'failed'}`,
            data: { 
              triggered: result.success,
              system: payload.system 
            }
          };
          
        case 'maintenance_complete':
          // Maintenance complete, good time to scrape
          console.log(`✅ ${payload.system} maintenance complete, triggering catch-up scraping`);
          setTimeout(() => {
            ContinuousJobScrapingService.triggerManualScraping();
          }, 5000); // Wait 5 seconds
          
          return {
            success: true,
            message: 'Maintenance complete notification processed, catch-up scraping scheduled',
            data: { scheduledDelay: 5000 }
          };
          
        default:
          return {
            success: true,
            message: 'Notification type not handled',
            data: { type: payload.type }
          };
      }
    } catch (error) {
      console.error('❌ Error handling external system notification:', error);
      return {
        success: false,
        message: 'Error processing external system notification'
      };
    }
  }

  /**
   * Check if request is within rate limits
   */
  private static checkRateLimit(source: string, ip?: string): {allowed: boolean; reason?: string} {
    const now = new Date();
    const windowStart = new Date(now.getTime() - this.RATE_LIMIT_WINDOW);
    
    // Clean old entries
    this.webhookHistory = this.webhookHistory.filter(entry => entry.timestamp > windowStart);
    
    // Check total requests in window
    const requestsInWindow = this.webhookHistory.length;
    if (requestsInWindow >= this.MAX_WEBHOOKS_PER_WINDOW) {
      return {
        allowed: false,
        reason: `Rate limit exceeded: ${requestsInWindow} requests in last 5 minutes`
      };
    }
    
    // Check requests from same source
    const sourceRequests = this.webhookHistory.filter(entry => entry.source === source).length;
    if (sourceRequests >= 5) {
      return {
        allowed: false,
        reason: `Source rate limit exceeded: ${sourceRequests} requests from ${source} in last 5 minutes`
      };
    }
    
    // Check requests from same IP if provided
    if (ip) {
      const ipRequests = this.webhookHistory.filter(entry => entry.ip === ip).length;
      if (ipRequests >= 3) {
        return {
          allowed: false,
          reason: `IP rate limit exceeded: ${ipRequests} requests from ${ip} in last 5 minutes`
        };
      }
    }
    
    return { allowed: true };
  }

  /**
   * Check if we're in a cooldown period
   */
  private static isInCooldownPeriod(): boolean {
    if (!this.lastTriggerTime) return false;
    
    const now = new Date();
    const timeSinceLastTrigger = now.getTime() - this.lastTriggerTime.getTime();
    
    return timeSinceLastTrigger < this.COOLDOWN_PERIOD;
  }

  /**
   * Determine if immediate scraping should be triggered
   */
  private static shouldTriggerImmediateScraping(payload: {
    source: string;
    action: string;
    jobCount?: number;
    urgency?: 'low' | 'medium' | 'high';
  }): {should: boolean; reason: string} {
    
    // Always trigger for high urgency
    if (payload.urgency === 'high') {
      return { should: true, reason: 'High urgency notification' };
    }
    
    // Trigger if significant number of jobs
    if (payload.jobCount && payload.jobCount >= 5) {
      return { should: true, reason: `${payload.jobCount} new jobs available` };
    }
    
    // Trigger during business hours for medium urgency
    const hour = new Date().getHours();
    if (payload.urgency === 'medium' && hour >= 8 && hour <= 18) {
      return { should: true, reason: 'Medium urgency during business hours' };
    }
    
    // Don't trigger for low urgency or outside business hours
    if (payload.urgency === 'low' || (hour < 8 || hour > 18)) {
      return { 
        should: false, 
        reason: payload.urgency === 'low' ? 'Low urgency notification' : 'Outside business hours' 
      };
    }
    
    // Default: trigger for unknown urgency during business hours
    if (hour >= 8 && hour <= 18) {
      return { should: true, reason: 'New job notification during business hours' };
    }
    
    return { should: false, reason: 'Outside business hours' };
  }

  /**
   * Log webhook call
   */
  private static logWebhookCall(source: string, ip?: string): void {
    this.webhookHistory.push({
      timestamp: new Date(),
      source,
      ip
    });
    
    console.log(`📡 Webhook logged: ${source} from ${ip || 'unknown IP'}`);
  }

  /**
   * Get webhook statistics
   */
  static getWebhookStats(): {
    totalWebhooks: number;
    recentWebhooks: number;
    lastTriggerTime: Date | null;
    isInCooldown: boolean;
    rateLimitStatus: {
      requestsInWindow: number;
      maxRequests: number;
      windowMinutes: number;
    };
    sourceBreakdown: Array<{source: string; count: number}>;
  } {
    const now = new Date();
    const windowStart = new Date(now.getTime() - this.RATE_LIMIT_WINDOW);
    
    // Clean old entries for accurate count
    this.webhookHistory = this.webhookHistory.filter(entry => entry.timestamp > windowStart);
    
    // Group by source
    const sourceBreakdown = this.webhookHistory.reduce((acc, entry) => {
      const existing = acc.find(item => item.source === entry.source);
      if (existing) {
        existing.count++;
      } else {
        acc.push({ source: entry.source, count: 1 });
      }
      return acc;
    }, [] as Array<{source: string; count: number}>);
    
    return {
      totalWebhooks: this.webhookHistory.length,
      recentWebhooks: this.webhookHistory.length,
      lastTriggerTime: this.lastTriggerTime,
      isInCooldown: this.isInCooldownPeriod(),
      rateLimitStatus: {
        requestsInWindow: this.webhookHistory.length,
        maxRequests: this.MAX_WEBHOOKS_PER_WINDOW,
        windowMinutes: this.RATE_LIMIT_WINDOW / (60 * 1000)
      },
      sourceBreakdown
    };
  }

  /**
   * Clear webhook history (admin function)
   */
  static clearWebhookHistory(): void {
    this.webhookHistory = [];
    this.lastTriggerTime = null;
    console.log('🧹 Webhook history cleared');
  }
}