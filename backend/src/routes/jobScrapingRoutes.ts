import { Router } from 'express';
import { JobScrapingController } from '../controllers/jobScrapingController';
import { ContinuousJobScrapingController } from '../controllers/continuousJobScrapingController';
import { JobScrapingWebhookController } from '../controllers/jobScrapingWebhookController';
import { auth } from '../middleware/auth';
import { authorizeRoles } from '../middleware/roleAuth';

const router = Router();

/**
 * @route   GET /api/job-scraping/health
 * @desc    Get scraping services health status
 * @access  Public (for monitoring)
 */
router.get(
  '/health',
  JobScrapingController.getScrapingHealth
);

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
 * @route   POST /api/job-scraping/scrape-optimized
 * @desc    Manually trigger optimized job scraping (production-safe)
 * @access  Public (for hosted environments)
 */
router.post(
  '/scrape-optimized',
  JobScrapingController.scrapeJobsOptimized
);

/**
 * @route   POST /api/job-scraping/webhook-trigger
 * @desc    Webhook endpoint for external systems to trigger scraping
 * @access  Public (with optional secret verification)
 */
router.post(
  '/webhook-trigger',
  JobScrapingController.webhookTriggerScraping
);

/**
 * @route   GET /api/job-scraping/ai-usage
 * @desc    Get AI usage statistics
 * @access  Private - Admin
 */
router.get(
  '/ai-usage',
  auth,
  authorizeRoles(['super_admin', 'admin']),
  JobScrapingController.getAIUsageStats
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
 * @route   DELETE /api/job-scraping/external-jobs/bulk
 * @desc    Bulk delete external jobs by source
 * @access  Private - Admin
 */
router.delete(
  '/external-jobs/bulk',
  auth,
  authorizeRoles(['super_admin', 'admin']),
  JobScrapingController.bulkDeleteExternalJobs
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
 * @route   POST /api/job-scraping/force-quota
 * @desc    Force scraping to meet minimum daily quota
 * @access  Private - Super Admin
 */
router.post(
  '/force-quota',
  auth,
  authorizeRoles(['super_admin']),
  JobScrapingController.forceScrapingToMeetQuota
);

/**
 * @route   GET /api/job-scraping/test-website/:website
 * @desc    Test scraping from specific website
 * @access  Private - Admin
 */
router.get(
  '/test-website/:website',
  auth,
  authorizeRoles(['super_admin', 'admin']),
  JobScrapingController.testWebsiteScraping
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

/**
 * @route   POST /api/job-scraping/internship-rw/scrape
 * @desc    Manually trigger internship.rw scraping
 * @access  Private - Admin
 */
router.post(
  '/internship-rw/scrape',
  auth,
  authorizeRoles(['super_admin', 'admin']),
  JobScrapingController.scrapeInternshipRw
);

/**
 * @route   GET /api/job-scraping/internship-rw/status
 * @desc    Get internship.rw scraping status and statistics
 * @access  Private - Admin
 */
router.get(
  '/internship-rw/status',
  auth,
  authorizeRoles(['super_admin', 'admin']),
  JobScrapingController.getInternshipRwStatus
);

// Continuous Job Scraping Routes

/**
 * @route   GET /api/job-scraping/continuous/status
 * @desc    Get continuous scraping service status
 * @access  Private - Admin
 */
router.get(
  '/continuous/status',
  auth,
  authorizeRoles(['super_admin', 'admin']),
  ContinuousJobScrapingController.getStatus
);

/**
 * @route   POST /api/job-scraping/continuous/trigger
 * @desc    Manually trigger continuous scraping
 * @access  Private - Admin
 */
router.post(
  '/continuous/trigger',
  auth,
  authorizeRoles(['super_admin', 'admin']),
  ContinuousJobScrapingController.triggerScraping
);

/**
 * @route   PUT /api/job-scraping/continuous/interval
 * @desc    Update check interval for continuous scraping
 * @access  Private - Super Admin
 */
router.put(
  '/continuous/interval',
  auth,
  authorizeRoles(['super_admin']),
  ContinuousJobScrapingController.updateInterval
);

/**
 * @route   POST /api/job-scraping/continuous/restart
 * @desc    Restart continuous scraping service
 * @access  Private - Super Admin
 */
router.post(
  '/continuous/restart',
  auth,
  authorizeRoles(['super_admin']),
  ContinuousJobScrapingController.restartService
);

/**
 * @route   GET /api/job-scraping/continuous/analytics
 * @desc    Get detailed continuous scraping analytics
 * @access  Private - Admin
 */
router.get(
  '/continuous/analytics',
  auth,
  authorizeRoles(['super_admin', 'admin']),
  ContinuousJobScrapingController.getAnalytics
);

// Webhook Routes (Public endpoints for external systems)

/**
 * @route   POST /api/job-scraping/webhook/job-notification
 * @desc    Receive job notification webhooks from external systems
 * @access  Public (with optional secret verification)
 */
router.post(
  '/webhook/job-notification',
  JobScrapingWebhookController.handleJobNotification
);

/**
 * @route   POST /api/job-scraping/webhook/external-system
 * @desc    Receive notifications from external systems
 * @access  Public (with optional secret verification)
 */
router.post(
  '/webhook/external-system',
  JobScrapingWebhookController.handleExternalSystemNotification
);

/**
 * @route   GET /api/job-scraping/webhook/stats
 * @desc    Get webhook statistics
 * @access  Private - Admin
 */
router.get(
  '/webhook/stats',
  auth,
  authorizeRoles(['super_admin', 'admin']),
  JobScrapingWebhookController.getWebhookStats
);

/**
 * @route   DELETE /api/job-scraping/webhook/history
 * @desc    Clear webhook history
 * @access  Private - Super Admin
 */
router.delete(
  '/webhook/history',
  auth,
  authorizeRoles(['super_admin']),
  JobScrapingWebhookController.clearWebhookHistory
);

/**
 * @route   POST /api/job-scraping/webhook/test
 * @desc    Test webhook functionality
 * @access  Private - Admin
 */
router.post(
  '/webhook/test',
  auth,
  authorizeRoles(['super_admin', 'admin']),
  JobScrapingWebhookController.testWebhook
);

/**
 * @route   POST /api/job-scraping/webhook/simulate
 * @desc    Simulate job board notification for testing
 * @access  Private - Admin
 */
router.post(
  '/webhook/simulate',
  auth,
  authorizeRoles(['super_admin', 'admin']),
  JobScrapingWebhookController.simulateJobBoardNotification
);

export default router;