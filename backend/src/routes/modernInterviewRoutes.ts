import express from 'express';
import { auth } from '../middleware/auth';
import { Job } from '../models/Job';
import {
  getJobRoles,
  createInterviewSession,
  startInterviewSession,
  submitInterviewResponse,
  completeInterviewSession,
  getInterviewHistory,
  getInterviewResults
} from '../controllers/modernInterviewController';

const router = express.Router();

// Apply authentication per route as needed (removed global auth)

/**
 * GET /api/modern-interviews/job-roles
 * Get available job roles for interviews
 */
router.get('/job-roles', auth, getJobRoles);

/**
 * POST /api/modern-interviews/interviews/create
 * Create a new interview session
 * Body: { jobId: string, jobTitle: string, duration?: number }
 */
router.post('/interviews/create', auth, createInterviewSession);

/**
 * POST /api/modern-interviews/interviews/:sessionId/start
 * Start an interview session
 */
router.post('/interviews/:sessionId/start', auth, startInterviewSession);

/**
 * POST /api/modern-interviews/interviews/:sessionId/responses
 * Submit an interview response
 * Body: { questionId: string, question: string, answer: string, timestamp: string, duration?: number, confidence?: number }
 */
router.post('/interviews/:sessionId/responses', auth, submitInterviewResponse);

/**
 * POST /api/modern-interviews/interviews/:sessionId/complete
 * Complete interview session and get results
 * Body: { responses: InterviewResponse[] }
 */
router.post('/interviews/:sessionId/complete', auth, completeInterviewSession);

/**
 * GET /api/modern-interviews/interviews/history
 * Get user's interview history
 */
router.get('/interviews/history', auth, getInterviewHistory);

/**
 * GET /api/modern-interviews/interviews/:sessionId/results
 * Get interview results for a specific session
 */
router.get('/interviews/:sessionId/results', auth, getInterviewResults);

/**
 * GET /api/modern-interviews/interviews/jobs/for-interviews
 * Get real job postings for interview practice
 */
router.get('/interviews/jobs/for-interviews', auth, async (req, res) => {
  try {
    // Fetch real jobs from database - active jobs only, limit to 20 for interviews
    const jobs = await Job.find({
      status: 'active',
      $or: [
        { applicationDeadline: { $gt: new Date() } },
        { applicationDeadline: { $exists: false } }
      ]
    })
    .select('title description requirements skills experienceLevel company location salaryMin salaryMax category createdAt')
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

    // Transform jobs for interview service
    const interviewJobs = jobs.map(job => ({
      _id: job._id,
      title: job.title,
      category: job.category || 'General',
      experienceLevel: job.experienceLevel || 'mid',
      requiredSkills: job.skills || job.requirements || [],
      description: job.description || `Interview practice for ${job.title}`,
      company: job.company,
      location: job.location,
      salary: job.salaryMin && job.salaryMax 
        ? `$${job.salaryMin.toLocaleString()} - $${job.salaryMax.toLocaleString()}`
        : undefined
    }));

    // If no real jobs available, return some mock data for interviews
    if (interviewJobs.length === 0) {
      const mockJobs = [
        {
          _id: 'mock-job-1',
          title: 'Software Engineer',
          category: 'Technology',
          experienceLevel: 'mid',
          requiredSkills: ['JavaScript', 'React', 'Node.js', 'SQL'],
          description: 'Full-stack development role with modern technologies',
          company: 'Tech Company',
          location: 'Remote',
          salary: '$80,000 - $120,000'
        },
        {
          _id: 'mock-job-2',
          title: 'Product Manager',
          category: 'Product',
          experienceLevel: 'mid',
          requiredSkills: ['Product Strategy', 'Analytics', 'User Research', 'Agile'],
          description: 'Lead product development and strategy',
          company: 'Product Company',
          location: 'San Francisco, CA',
          salary: '$100,000 - $140,000'
        }
      ];
      return res.json(mockJobs);
    }

    res.json(interviewJobs);
  } catch (error) {
    console.error('Error getting jobs for interviews:', error);
    res.status(500).json({ 
      message: 'Failed to get jobs for interviews',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/interviews/free-status
 * Get user's free interview status
 */
router.get('/interviews/free-status', async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Check if user has used their free interview
    // For now, return mock data - in production this would check interview history
    const mockStatus = {
      hasUsedFree: false,
      remainingFreeTests: 1,
      canUseFree: true
    };

    res.json(mockStatus);
  } catch (error) {
    console.error('Error getting free interview status:', error);
    res.status(500).json({ message: 'Failed to get free interview status' });
  }
});

export default router;