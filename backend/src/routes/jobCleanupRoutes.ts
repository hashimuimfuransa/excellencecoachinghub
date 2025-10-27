import { Router, Request, Response } from 'express';
import { jobCleanupScheduler } from '../services/jobCleanupScheduler';
import { auth, authorize } from '../middleware/auth';
import { UserRole } from '../types';

const router = Router();

/**
 * @route   GET /api/admin/job-cleanup/stats
 * @desc    Get job cleanup statistics and configuration
 * @access  Admin only
 */
router.get('/stats', 
  auth,
  authorize([UserRole.SUPER_ADMIN, UserRole.ADMIN]),
  async (req: Request, res: Response) => {
    try {
      const stats = await jobCleanupScheduler.getCleanupStats();
      
      res.json({
        success: true,
        data: stats,
        message: 'Job cleanup statistics retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting job cleanup stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get job cleanup statistics',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * @route   POST /api/admin/job-cleanup/trigger
 * @desc    Manually trigger job cleanup process
 * @access  Super Admin only
 */
router.post('/trigger',
  auth,
  authorize([UserRole.SUPER_ADMIN]),
  async (req: Request, res: Response) => {
    try {
      console.log(`🔧 Job cleanup manually triggered by user: ${req.user?.id}`);
      
      // Run cleanup in background to avoid request timeout
      jobCleanupScheduler.triggerCleanup().catch(error => {
        console.error('❌ Manual job cleanup failed:', error);
      });

      res.json({
        success: true,
        message: 'Job cleanup process initiated. Check server logs for progress.'
      });
    } catch (error) {
      console.error('Error triggering job cleanup:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to trigger job cleanup',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * @route   POST /api/admin/job-cleanup/check-expired
 * @desc    Manually trigger expired job check
 * @access  Super Admin only
 */
router.post('/check-expired',
  auth,
  authorize([UserRole.SUPER_ADMIN]),
  async (req: Request, res: Response) => {
    try {
      console.log(`🔧 Expired job check manually triggered by user: ${req.user?.id}`);
      
      // Run expired check in background
      jobCleanupScheduler.triggerExpiredCheck().catch(error => {
        console.error('❌ Manual expired job check failed:', error);
      });

      res.json({
        success: true,
        message: 'Expired job check initiated. Check server logs for progress.'
      });
    } catch (error) {
      console.error('Error triggering expired job check:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to trigger expired job check',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * @route   GET /api/admin/job-cleanup/schedule-info
 * @desc    Get detailed schedule information
 * @access  Admin only
 */
router.get('/schedule-info',
  auth,
  authorize([UserRole.SUPER_ADMIN, UserRole.ADMIN]),
  async (req: Request, res: Response) => {
    try {
      const stats = await jobCleanupScheduler.getCleanupStats();
      
      const scheduleInfo = {
        isRunning: stats.isRunning,
        nextCleanup: stats.nextCleanup,
        nextExpiredCheck: stats.nextExpiredCheck,
        cleanupSchedule: stats.config.CLEANUP_SCHEDULE,
        expiredCheckSchedule: stats.config.EXPIRED_CHECK_SCHEDULE,
        retentionPolicy: {
          expiredJobDays: stats.config.EXPIRED_JOB_RETENTION_DAYS,
          closedJobDays: stats.config.CLOSED_JOB_RETENTION_DAYS
        },
        currentCounts: {
          expiredJobs: stats.expiredJobs,
          closedJobs: stats.closedJobs,
          totalJobs: stats.totalJobs
        }
      };

      res.json({
        success: true,
        data: scheduleInfo,
        message: 'Schedule information retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting schedule info:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get schedule information',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

export default router;