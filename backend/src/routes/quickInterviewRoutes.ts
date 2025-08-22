import { Router } from 'express';
import { 
  storeQuickInterviewResults,
  getMyQuickInterviewResults,
  getQuickInterviewStats
} from '@/controllers/quickInterviewController';
import { auth } from '@/middleware/auth';

const router = Router();

// All quick interview routes require authentication
router.use(auth);

/**
 * @route POST /api/quick-interviews/:sessionId/results
 * @desc Store quick interview results in database
 * @access Private (Job Seekers only)
 */
router.post('/:sessionId/results', storeQuickInterviewResults);

/**
 * @route GET /api/quick-interviews/my-results
 * @desc Get user's quick interview results
 * @access Private (Job Seekers only)
 */
router.get('/my-results', getMyQuickInterviewResults);

/**
 * @route GET /api/quick-interviews/stats
 * @desc Get user's quick interview statistics
 * @access Private (Job Seekers only)
 */
router.get('/stats', getQuickInterviewStats);

/**
 * @route POST /api/quick-interviews/create
 * @desc Create a new interview session (compatibility endpoint)
 * @access Private (Job Seekers only)
 */
router.post('/create', async (req, res) => {
  try {
    // Create mock session for quick interviews
    const sessionId = `session_${Date.now()}`;
    const session = {
      id: sessionId,
      status: 'ready',
      jobTitle: req.body.jobTitle || 'Interview Session',
      jobId: req.body.jobId,
      createdAt: new Date()
    };
    
    res.json({ 
      success: true, 
      data: session 
    });
  } catch (error) {
    console.error('Error creating quick interview session:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create interview session' 
    });
  }
});

/**
 * @route POST /api/quick-interviews/:sessionId/start
 * @desc Start an interview session (compatibility endpoint)
 * @access Private (Job Seekers only)
 */
router.post('/:sessionId/start', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    // Mock session start
    const session = {
      id: sessionId,
      status: 'active',
      startedAt: new Date()
    };
    
    res.json({ 
      success: true, 
      data: session 
    });
  } catch (error) {
    console.error('Error starting quick interview session:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to start interview session' 
    });
  }
});

export default router;