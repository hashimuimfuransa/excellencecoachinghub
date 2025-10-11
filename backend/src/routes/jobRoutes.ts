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

// @desc    Delete expired jobs immediately
// @route   POST /api/jobs/delete-expired
// @access  Public (for cleanup purposes)
router.post('/delete-expired', asyncHandler(async (req, res) => {
  try {
    console.log('🗑️ Manual expired job deletion triggered');
    const result = await Job.deleteExpiredJobs();
    
    res.json({
      success: true,
      message: `Successfully deleted ${result.deletedCount} expired jobs from database`,
      data: {
        deletedCount: result.deletedCount,
        deletedJobs: result.deletedJobs.map(job => ({
          id: job._id,
          title: job.title,
          company: job.company,
          deadline: job.applicationDeadline
        }))
      }
    });
  } catch (error) {
    console.error('❌ Error deleting expired jobs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete expired jobs',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

// @desc    Search jobs
// @route   GET /api/jobs/search
// @access  Public
router.get('/search', asyncHandler(async (req, res) => {
  try {
    // First, immediately delete any expired jobs
    await Job.deleteExpiredJobs();
    
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
    // Exclude expired jobs and jobs with passed deadlines
    const now = new Date();
    const jobs = await Job.find({
      $and: [
        {
          $or: [
            { title: { $regex: searchQuery, $options: 'i' } },
            { company: { $regex: searchQuery, $options: 'i' } },
            { location: { $regex: searchQuery, $options: 'i' } },
            { description: { $regex: searchQuery, $options: 'i' } },
            { skills: { $regex: searchQuery, $options: 'i' } },
            { jobType: { $regex: searchQuery, $options: 'i' } },
            { industry: { $regex: searchQuery, $options: 'i' } }
          ]
        },
        {
          // Exclude expired jobs
          status: { $ne: 'expired' }
        },
        {
          // Exclude jobs with passed deadlines
          $or: [
            { applicationDeadline: { $exists: false } },
            { applicationDeadline: { $gte: now } }
          ]
        }
      ]
    })
    .select('title company location description skills jobType industry salary applicationDeadline createdAt')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);

    // Get total count for pagination
    const total = await Job.countDocuments({
      $and: [
        {
          $or: [
            { title: { $regex: searchQuery, $options: 'i' } },
            { company: { $regex: searchQuery, $options: 'i' } },
            { location: { $regex: searchQuery, $options: 'i' } },
            { description: { $regex: searchQuery, $options: 'i' } },
            { skills: { $regex: searchQuery, $options: 'i' } },
            { jobType: { $regex: searchQuery, $options: 'i' } },
            { industry: { $regex: searchQuery, $options: 'i' } }
          ]
        },
        {
          // Exclude expired jobs
          status: { $ne: 'expired' }
        },
        {
          // Exclude jobs with passed deadlines
          $or: [
            { applicationDeadline: { $exists: false } },
            { applicationDeadline: { $gte: now } }
          ]
        }
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

// Super admin route to get all jobs including expired ones
router.get('/admin/all', asyncHandler(async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      search,
      status,
      showAll = false
    } = req.query;

    const query: any = {};

    // For super admin, don't filter out expired jobs
    if (status && status !== 'all') {
      if (status === 'expired') {
        // Filter for expired jobs by deadline
        const now = new Date();
        query.applicationDeadline = { $exists: true, $lt: now };
      } else {
        query.status = status;
      }
    }

    // Search functionality
    if (search) {
      query.$text = { $search: search };
    }

    const pageNum = parseInt(page as string);
    const limitNum = showAll === 'true' ? 10000 : parseInt(limit as string); // Show all jobs if requested
    const skip = pageNum === 1 && showAll === 'true' ? 0 : (pageNum - 1) * limitNum;

    let jobQuery = Job.find(query)
      .populate('employer', 'firstName lastName company email phone')
      .skip(skip)
      .limit(limitNum);

    // If searching by text, sort by text search score
    if (search) {
      jobQuery = jobQuery.sort({ score: { $meta: 'textScore' } });
    } else {
      // Default sort by creation date
      jobQuery = jobQuery.sort({ createdAt: -1 });
    }

    const jobs = await jobQuery;
    const total = await Job.countDocuments(query);

    // Mark expired jobs in the response
    const now = new Date();
    const jobsWithStatus = jobs.map(job => {
      const jobObj = job.toObject();
      if (jobObj.applicationDeadline && new Date(jobObj.applicationDeadline) < now) {
        jobObj.status = 'expired';
      }
      return jobObj;
    });

    res.status(200).json({
      success: true,
      data: jobsWithStatus,
      pagination: {
        current: pageNum,
        pages: Math.ceil(total / limitNum),
        total
      }
    });
  } catch (error: any) {
    console.error('Error fetching all jobs for admin:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch jobs',
      message: error.message
    });
  }
}));

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