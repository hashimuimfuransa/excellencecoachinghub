import { Router } from 'express';
import { JobRecommendationEmailService } from '../services/jobRecommendationEmailService';
import { protect } from '../middleware/auth';
import { requireAdmin } from '../middleware/roleAuth';

const router = Router();

// Admin routes for managing job recommendation emails
router.use(protect);
router.use(requireAdmin);

/**
 * Get job recommendation email scheduler status
 */
router.get('/status', async (req, res) => {
  try {
    const status = JobRecommendationEmailService.getStatus();
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Error getting job recommendation email status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get scheduler status',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Start the job recommendation email scheduler
 */
router.post('/start', async (req, res) => {
  try {
    JobRecommendationEmailService.start();
    const status = JobRecommendationEmailService.getStatus();
    res.json({
      success: true,
      message: 'Job recommendation email scheduler started successfully',
      data: status
    });
  } catch (error) {
    console.error('Error starting job recommendation email scheduler:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start scheduler',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Stop the job recommendation email scheduler
 */
router.post('/stop', async (req, res) => {
  try {
    JobRecommendationEmailService.stop();
    const status = JobRecommendationEmailService.getStatus();
    res.json({
      success: true,
      message: 'Job recommendation email scheduler stopped successfully',
      data: status
    });
  } catch (error) {
    console.error('Error stopping job recommendation email scheduler:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to stop scheduler',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Manually run job recommendation emails (for testing)
 */
router.post('/run', async (req, res) => {
  try {
    console.log('🚀 Manually running job recommendation email process...');
    const result = await JobRecommendationEmailService.runManually();
    
    res.json({
      success: result.success,
      message: result.message,
      data: result.data
    });
  } catch (error) {
    console.error('Error manually running job recommendation emails:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to run job recommendation emails',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;