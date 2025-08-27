import { Router } from 'express';
import { JobScrapingController } from '../controllers/jobScrapingController';
import { auth } from '../middleware/auth';
import { authorizeRoles } from '../middleware/roleAuth';

const router = Router();

/**
 * @route   POST /api/job-scraping/scrape
 * @desc    Manually trigger job scraping (super admin only)
 * @access  Private - Super Admin
 */
router.post(
  '/scrape',
  auth,
  authorizeRoles(['super_admin']),
  JobScrapingController.scrapeJobs
);

/**
 * @route   GET /api/job-scraping/stats
 * @desc    Get job scraping statistics
 * @access  Private - Admin
 */
router.get(
  '/stats',
  auth,
  authorizeRoles(['super_admin', 'admin']),
  JobScrapingController.getScrapingStats
);

/**
 * @route   GET /api/job-scraping/external-jobs
 * @desc    Get external jobs with pagination
 * @access  Private - Admin
 */
router.get(
  '/external-jobs',
  auth,
  authorizeRoles(['super_admin', 'admin']),
  JobScrapingController.getExternalJobs
);

/**
 * @route   DELETE /api/job-scraping/external-jobs/:jobId
 * @desc    Delete an external job
 * @access  Private - Super Admin
 */
router.delete(
  '/external-jobs/:jobId',
  auth,
  authorizeRoles(['super_admin']),
  JobScrapingController.deleteExternalJob
);

/**
 * @route   PATCH /api/job-scraping/external-jobs/:jobId/status
 * @desc    Update external job status
 * @access  Private - Admin
 */
router.patch(
  '/external-jobs/:jobId/status',
  auth,
  authorizeRoles(['super_admin', 'admin']),
  JobScrapingController.updateExternalJobStatus
);

/**
 * @route   GET /api/job-scraping/test-connection
 * @desc    Test connection to job scraping source
 * @access  Private - Admin
 */
router.get(
  '/test-connection',
  auth,
  authorizeRoles(['super_admin', 'admin']),
  JobScrapingController.testConnection
);

export default router;