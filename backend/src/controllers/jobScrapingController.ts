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
          maxJobsPerDay: 24,
          remainingQuota: Math.max(0, 24 - stats.todayJobs)
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