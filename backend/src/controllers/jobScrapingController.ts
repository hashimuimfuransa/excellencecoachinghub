import { Request, Response } from 'express';
import { JobScrapingService } from '../services/jobScrapingService';
import { Job } from '../models/Job';

/**
 * Controller for job scraping operations
 */
export class JobScrapingController {
  
  /**
   * Manually trigger job scraping (admin only)
   */
  static async scrapeJobs(req: Request, res: Response): Promise<void> {
    try {
      console.log('Manual job scraping triggered by admin');
      
      const result = await JobScrapingService.scrapeAndProcessJobs();
      
      res.status(200).json({
        success: result.success,
        message: `Job scraping completed. Processed ${result.processedJobs} jobs.`,
        data: {
          processedJobs: result.processedJobs,
          errors: result.errors,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error in manual job scraping:', error);
      res.status(500).json({
        success: false,
        message: 'Job scraping failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get AI usage statistics
   */
  static async getAIUsageStats(req: Request, res: Response): Promise<void> {
    try {
      // Access private static properties through reflection
      const aiRequestCount = (JobScrapingService as any).aiRequestCount || 0;
      const maxRequests = (JobScrapingService as any).MAX_AI_REQUESTS_PER_DAY || 40;
      const lastResetDate = (JobScrapingService as any).lastResetDate || new Date().toDateString();
      
      res.status(200).json({
        success: true,
        data: {
          aiRequestsUsed: aiRequestCount,
          aiRequestsLimit: maxRequests,
          aiRequestsRemaining: Math.max(0, maxRequests - aiRequestCount),
          lastResetDate: lastResetDate,
          canUseAI: aiRequestCount < maxRequests,
          nextResetDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toDateString()
        }
      });
    } catch (error) {
      console.error('Error getting AI usage stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get AI usage statistics',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get job scraping statistics
   */
  static async getScrapingStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await JobScrapingService.getScrapingStats();
      
      // Get recent external jobs
      const recentJobs = await Job.find({
        isExternalJob: true,
        externalJobSource: 'jobinrwanda'
      })
      .select('title company location createdAt externalApplicationUrl')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

      res.status(200).json({
        success: true,
        data: {
          stats,
          recentJobs,
          maxJobsPerDay: 30,
          minJobsPerDay: 20,
          remainingQuota: Math.max(0, 30 - stats.todayJobs),
          meetsMinimum: stats.todayJobs >= 20
        }
      });
    } catch (error) {
      console.error('Error getting scraping stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get scraping statistics',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get external jobs with pagination
   */
  static async getExternalJobs(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const source = req.query.source as string;
      
      const skip = (page - 1) * limit;
      
      // Build filter
      const filter: any = { isExternalJob: true };
      if (source) {
        filter.externalJobSource = source;
      }

      // Get jobs
      const [jobs, total] = await Promise.all([
        Job.find(filter)
          .select('-__v -updatedAt')
          .populate('employer', 'firstName lastName company')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Job.countDocuments(filter)
      ]);

      const totalPages = Math.ceil(total / limit);

      res.status(200).json({
        success: true,
        data: {
          jobs,
          pagination: {
            currentPage: page,
            totalPages,
            totalJobs: total,
            jobsPerPage: limit,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1
          }
        }
      });
    } catch (error) {
      console.error('Error getting external jobs:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get external jobs',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Delete an external job (admin only)
   */
  static async deleteExternalJob(req: Request, res: Response): Promise<void> {
    try {
      const { jobId } = req.params;
      
      const job = await Job.findById(jobId);
      if (!job) {
        res.status(404).json({
          success: false,
          message: 'Job not found'
        });
        return;
      }

      if (!job.isExternalJob) {
        res.status(400).json({
          success: false,
          message: 'This is not an external job'
        });
        return;
      }

      await Job.findByIdAndDelete(jobId);

      res.status(200).json({
        success: true,
        message: 'External job deleted successfully',
        data: {
          deletedJob: {
            id: job._id,
            title: job.title,
            company: job.company
          }
        }
      });
    } catch (error) {
      console.error('Error deleting external job:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete external job',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Bulk delete external jobs by source and external ID (admin only)
   */
  static async bulkDeleteExternalJobs(req: Request, res: Response): Promise<void> {
    try {
      const { externalJobSource, externalJobId } = req.body;
      
      if (!externalJobSource) {
        res.status(400).json({
          success: false,
          message: 'External job source is required'
        });
        return;
      }
      
      const query: any = {
        isExternalJob: true,
        externalJobSource
      };
      
      if (externalJobId) {
        query.externalJobId = externalJobId;
      }
      
      const deletedJobs = await Job.deleteMany(query);
      
      res.status(200).json({
        success: true,
        message: `Successfully deleted ${deletedJobs.deletedCount} external jobs`,
        data: {
          deletedCount: deletedJobs.deletedCount,
          source: externalJobSource,
          externalJobId: externalJobId || 'all'
        }
      });
    } catch (error) {
      console.error('Error bulk deleting external jobs:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to bulk delete external jobs',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Update external job status (admin only)
   */
  static async updateExternalJobStatus(req: Request, res: Response): Promise<void> {
    try {
      const { jobId } = req.params;
      const { status } = req.body;

      if (!['active', 'paused', 'closed'].includes(status)) {
        res.status(400).json({
          success: false,
          message: 'Invalid status. Must be: active, paused, or closed'
        });
        return;
      }

      const job = await Job.findById(jobId);
      if (!job) {
        res.status(404).json({
          success: false,
          message: 'Job not found'
        });
        return;
      }

      if (!job.isExternalJob) {
        res.status(400).json({
          success: false,
          message: 'This is not an external job'
        });
        return;
      }

      job.status = status as any;
      await job.save();

      res.status(200).json({
        success: true,
        message: 'Job status updated successfully',
        data: {
          id: job._id,
          title: job.title,
          status: job.status
        }
      });
    } catch (error) {
      console.error('Error updating external job status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update job status',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Force scraping to meet minimum quota (admin only)
   */
  static async forceScrapingToMeetQuota(req: Request, res: Response): Promise<void> {
    try {
      console.log('Force scraping to meet quota triggered by admin');
      
      const stats = await JobScrapingService.getScrapingStats();
      
      if (stats.todayJobs >= 20) {
        res.status(200).json({
          success: true,
          message: `Daily quota already met with ${stats.todayJobs} jobs`,
          data: { todayJobs: stats.todayJobs, minimumRequired: 20 }
        });
        return;
      }
      
      const result = await JobScrapingService.scrapeAndProcessJobs();
      
      res.status(200).json({
        success: result.success,
        message: `Force scraping completed. Processed ${result.processedJobs} additional jobs.`,
        data: {
          processedJobs: result.processedJobs,
          totalTodayJobs: stats.todayJobs + result.processedJobs,
          errors: result.errors,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error in force scraping:', error);
      res.status(500).json({
        success: false,
        message: 'Force scraping failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Test scraping from specific website
   */
  static async testWebsiteScraping(req: Request, res: Response): Promise<void> {
    try {
      const { website } = req.params;
      
      console.log(`Testing scraping from specific website: ${website}`);
      
      // Get the website configuration
      const sources = [
        {
          name: 'jobinrwanda',
          baseUrl: 'https://www.jobinrwanda.com',
          paths: ['/jobs', '/job', '/vacancies', '/opportunities', ''],
          selectors: [
            'a[href*="/job/"]',
            'a[href*="/jobs/"]', 
            'a[href*="/node/"]',
            '.views-row a[href*="/node/"]',
            '.job-item a',
            '.job-listing a',
            '.job-card a',
            '.view-content a[href*="/node/"]',
            'h2 a[href*="/node/"]',
            'h3 a[href*="/node/"]',
            '.field-content a[href*="/node/"]',
            '.view-jobs a',
            '.job-title a',
            '.node-title a'
          ]
        },
        {
          name: 'workingnomads',
          baseUrl: 'https://www.workingnomads.com',
          paths: ['/jobs', '/remote-jobs', '/latest-jobs', '/job-board'],
          selectors: [
            'a[href*="/jobs/"]',
            'a[href*="/job-"]',
            '.job-item a',
            '.job-listing a',
            '.job-title a',
            '.entry-title a',
            'h2 a',
            'h3 a'
          ]
        },
        {
          name: 'mucuruzi',
          baseUrl: 'https://mucuruzi.com',
          paths: ['/all-jobs/', '/jobs/', '/vacancies/', '/category/jobs/', '/'],
          selectors: [
            'a[href*="/job-"]',
            'a[href*="/jobs/"]',
            'a[href*="/vacancy"]',
            '.job-item a',
            '.job-listing a',
            '.job-title a',
            '.post-title a',
            'h2 a',
            'h3 a',
            '.entry-title a'
          ]
        }
      ];
      
      const targetSource = sources.find(s => s.name === website);
      if (!targetSource) {
        res.status(400).json({
          success: false,
          message: `Website '${website}' not found. Available: ${sources.map(s => s.name).join(', ')}`
        });
        return;
      }
      
      // Test URL scraping from this specific source
      const urls = await JobScrapingService['scrapeJobUrlsFromSource'](targetSource, 10);
      
      res.status(200).json({
        success: true,
        data: {
          website: website,
          foundUrls: urls,
          count: urls.length,
          timestamp: new Date().toISOString()
        },
        message: `Found ${urls.length} job URLs from ${website}`
      });
    } catch (error) {
      console.error('Error testing website scraping:', error);
      res.status(500).json({
        success: false,
        message: 'Website scraping test failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Test connection to job scraping source
   */
  static async testConnection(req: Request, res: Response): Promise<void> {
    try {
      const testResult = await JobScrapingService.testScrapingConnection();

      res.status(testResult.success ? 200 : 500).json({
        success: testResult.success,
        message: testResult.success 
          ? `Connection test successful. ${testResult.workingUrls.length} URLs working.` 
          : 'All connection tests failed',
        data: {
          workingUrls: testResult.workingUrls,
          failedUrls: testResult.failedUrls,
          details: testResult.details,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Connection test failed:', error);
      res.status(500).json({
        success: false,
        message: 'Connection test failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }
}