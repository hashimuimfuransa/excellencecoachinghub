import express from 'express';
import { auth } from '../middleware/auth';
import {
  getJobs,
  getJobsForStudent,
  getCuratedJobs,
  getJobById,
  createJob,
  updateJob,
  deleteJob,
  getJobsByEmployer,
  getRecommendedCourses,
  getJobCategories,
  getAIMatchedJobs
} from '../controllers/jobController';
import { testAIMatchedJobs } from '../controllers/testJobController';
import { getAIMatchedJobsSimple } from '../controllers/jobControllerSimple';
import { Job } from '../models/Job';
import { asyncHandler } from '../middleware/asyncHandler';

const router = express.Router();

// Public routes
router.get('/', getJobs);
router.get('/categories', getJobCategories);
router.get('/curated', getCuratedJobs);

// @desc    Search jobs
// @route   GET /api/jobs/search
// @access  Public
router.get('/search', asyncHandler(async (req, res) => {
  try {
    const { q: query, page = 1, limit = 20 } = req.query;
    
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }

    const searchQuery = query.trim();
    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 20;
    const skip = (pageNum - 1) * limitNum;

    // Search jobs by title, company, location, description, skills
    const jobs = await Job.find({
      $or: [
        { title: { $regex: searchQuery, $options: 'i' } },
        { company: { $regex: searchQuery, $options: 'i' } },
        { location: { $regex: searchQuery, $options: 'i' } },
        { description: { $regex: searchQuery, $options: 'i' } },
        { skills: { $regex: searchQuery, $options: 'i' } },
        { jobType: { $regex: searchQuery, $options: 'i' } },
        { industry: { $regex: searchQuery, $options: 'i' } }
      ]
    })
    .select('title company location description skills jobType industry salary applicationDeadline createdAt')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);

    // Get total count for pagination
    const total = await Job.countDocuments({
      $or: [
        { title: { $regex: searchQuery, $options: 'i' } },
        { company: { $regex: searchQuery, $options: 'i' } },
        { location: { $regex: searchQuery, $options: 'i' } },
        { description: { $regex: searchQuery, $options: 'i' } },
        { skills: { $regex: searchQuery, $options: 'i' } },
        { jobType: { $regex: searchQuery, $options: 'i' } },
        { industry: { $regex: searchQuery, $options: 'i' } }
      ]
    });

    res.status(200).json({
      success: true,
      data: jobs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error searching jobs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search jobs'
    });
  }
}));

// Protected routes - must come BEFORE the /:id route to avoid conflicts
router.use(auth); // All routes below require authentication

router.get('/student/available', getJobsForStudent);
router.get('/ai-matched-test', testAIMatchedJobs);  // Test endpoint
router.get('/ai-matched', getAIMatchedJobsSimple);  // Simple AI-powered job matching endpoint

// Routes with parameters - these should come AFTER specific routes
router.get('/:id', getJobById);
router.get('/:id/recommended-courses', getRecommendedCourses);
router.get('/employer/my-jobs', getJobsByEmployer);
router.post('/', createJob);
router.put('/:id', updateJob);
router.delete('/:id', deleteJob);

export default router;