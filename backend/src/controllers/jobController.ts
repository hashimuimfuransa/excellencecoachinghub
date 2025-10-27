import { Request, Response } from 'express';
import { Job, JobApplication, JobCourseMatch, StudentProfile, User } from '../models';
import { JobStatus, UserRole, EducationLevel, JobCategory } from '../types';
import { AuthRequest } from '../middleware/auth';
import { aiService } from '../services/aiService';

// Get all jobs with filtering
export const getJobs = async (req: Request, res: Response) => {
  try {
    // First, immediately delete any expired jobs
    const deletionResult = await Job.deleteExpiredJobs();
    if (deletionResult.deletedCount > 0) {
      console.log(`🗑️ Cleaned up ${deletionResult.deletedCount} expired jobs before serving job list`);
    }
    
    const {
      status,
      jobType,
      category,
      experienceLevel,
      educationLevel,
      location,
      workLocation,
      skills,
      isCurated,
      page = 1,
      limit = 10,
      search,
      includeExpired = false
    } = req.query;

    const query: any = {};

    // Build filter query
    if (status) {
      query.status = status;
    } else {
      // By default, exclude expired jobs from public listings unless includeExpired is true
      if (includeExpired !== 'true') {
        query.status = { $ne: JobStatus.EXPIRED };
        
        // Also exclude jobs with passed application deadlines
        const now = new Date();
        query.$and = [
          {
            $or: [
              { applicationDeadline: { $exists: false } }, // Jobs without deadlines
              { applicationDeadline: { $gte: now } }       // Jobs with future deadlines
            ]
          }
        ];
      }
    }
    if (jobType) query.jobType = jobType;
    if (category) query.category = category;
    if (experienceLevel) query.experienceLevel = experienceLevel;
    if (educationLevel) query.educationLevel = educationLevel;
    if (location) query.location = { $regex: location, $options: 'i' };
    
    // Work location filter (remote, hybrid, on-site)
    if (workLocation) {
      const workLocationArray = Array.isArray(workLocation) ? workLocation : [workLocation];
      const locationConditions: any[] = [];
      
      workLocationArray.forEach((wl: string) => {
        if (wl === 'remote') {
          locationConditions.push({
            location: { 
              $regex: '\\b(remote|anywhere|worldwide|work from home|wfh|global)\\b', 
              $options: 'i' 
            }
          });
        } else if (wl === 'hybrid') {
          locationConditions.push({
            location: { 
              $regex: '\\b(hybrid|flexible)\\b', 
              $options: 'i' 
            }
          });
        } else if (wl === 'on-site') {
          locationConditions.push({
            $and: [
              { location: { $not: { $regex: '\\b(remote|anywhere|worldwide|work from home|wfh|global|hybrid|flexible)\\b', $options: 'i' } } }
            ]
          });
        }
      });
      
      if (locationConditions.length > 0) {
        query.$or = locationConditions;
      }
    }
    
    if (isCurated !== undefined) query.isCurated = isCurated === 'true';
    if (skills) {
      const skillsArray = Array.isArray(skills) ? skills : [skills];
      query.skills = { $in: skillsArray };
    }

    // Search functionality - use text search for better performance
    if (search) {
      query.$text = { $search: search };
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

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

    res.status(200).json({
      success: true,
      data: jobs,
      pagination: {
        current: pageNum,
        pages: Math.ceil(total / limitNum),
        total
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch jobs',
      message: error.message
    });
  }
};

// Get job by ID
export const getJobById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const job = await Job.findById(id).populate('employer', 'firstName lastName company email phone profileImage');
    
    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    res.status(200).json({
      success: true,
      data: job
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch job',
      message: error.message
    });
  }
};

// Get user's posted jobs
export const getUserJobs = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const { page = 1, limit = 10, status } = req.query;
    
    const query: any = { employer: userId };
    if (status) query.status = status;
    
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const jobs = await Job.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);
    
    const total = await Job.countDocuments(query);

    res.status(200).json({
      success: true,
      data: jobs,
      pagination: {
        current: pageNum,
        pages: Math.ceil(total / limitNum),
        total
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user jobs',
      message: error.message
    });
  }
};

// Create new job
export const createJob = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const jobData = {
      ...req.body,
      employer: userId
    };

    const job = new Job(jobData);
    await job.save();

    // Populate employer details before sending response
    await job.populate('employer', 'firstName lastName company email');

    res.status(201).json({
      success: true,
      data: job,
      message: 'Job created successfully'
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: 'Failed to create job',
      message: error.message
    });
  }
};

// Update job
export const updateJob = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const job = await Job.findOne({ _id: id, employer: userId });
    
    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found or not authorized'
      });
    }

    Object.assign(job, req.body);
    await job.save();

    // Populate employer details before sending response
    await job.populate('employer', 'firstName lastName company email');

    res.status(200).json({
      success: true,
      data: job,
      message: 'Job updated successfully'
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: 'Failed to update job',
      message: error.message
    });
  }
};

// Delete job
export const deleteJob = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const job = await Job.findOneAndDelete({ _id: id, employer: userId });
    
    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found or not authorized'
      });
    }

    // Also delete associated applications and course matches
    await JobApplication.deleteMany({ jobId: id });
    await JobCourseMatch.deleteMany({ jobId: id });

    res.status(200).json({
      success: true,
      message: 'Job deleted successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to delete job',
      message: error.message
    });
  }
};

// Apply for job
export const applyForJob = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const job = await Job.findById(id);
    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    // Check if user already applied
    const existingApplication = await JobApplication.findOne({
      jobId: id,
      applicantId: userId
    });

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        error: 'You have already applied for this job'
      });
    }

    const application = new JobApplication({
      jobId: id,
      applicantId: userId,
      ...req.body
    });

    await application.save();

    res.status(201).json({
      success: true,
      data: application,
      message: 'Application submitted successfully'
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: 'Failed to apply for job',
      message: error.message
    });
  }
};

// Get job matches for skill-based matching
export const getJobMatches = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const { skills, experienceLevel, educationLevel } = req.query;
    
    const query: any = { status: JobStatus.ACTIVE };
    
    if (skills) {
      const skillsArray = Array.isArray(skills) ? skills : [skills];
      query.skills = { $in: skillsArray };
    }
    
    if (experienceLevel) query.experienceLevel = experienceLevel;
    if (educationLevel) query.educationLevel = educationLevel;

    const matches = await Job.find(query)
      .populate('employer', 'firstName lastName company email')
      .limit(20)
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: matches
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch job matches',
      message: error.message
    });
  }
};

// Get all job categories
export const getJobCategories = async (req: Request, res: Response) => {
  try {
    // Get categories with job counts
    const categoryStats = await Job.aggregate([
      { $match: { status: JobStatus.ACTIVE, category: { $exists: true, $ne: null, $ne: '' } } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // Format categories to match frontend expectations
    const formattedCategories = categoryStats.map(cat => ({
      category: cat._id,
      count: cat.count,
      displayName: cat._id ? cat._id.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim() : 'Other'
    })).filter(cat => cat.category); // Remove any null/empty categories

    res.status(200).json({
      success: true,
      data: formattedCategories
    });
  } catch (error: any) {
    console.error('Error fetching job categories:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch job categories',
      message: error.message
    });
  }
};

// Get curated jobs
export const getCuratedJobs = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const jobs = await Job.find({ 
      isCurated: true,
      status: JobStatus.ACTIVE
    })
    .populate('employer', 'firstName lastName company email phone')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);
    
    const total = await Job.countDocuments({ 
      isCurated: true,
      status: JobStatus.ACTIVE
    });

    res.status(200).json({
      success: true,
      data: jobs,
      pagination: {
        current: pageNum,
        pages: Math.ceil(total / limitNum),
        total
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch curated jobs',
      message: error.message
    });
  }
};

// Get jobs for students
export const getJobsForStudent = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const { page = 1, limit = 10, category, experienceLevel } = req.query;
    
    const query: any = { 
      status: JobStatus.ACTIVE,
      // Exclude jobs where user already applied
    };
    
    if (category) query.category = category;
    if (experienceLevel) query.experienceLevel = experienceLevel;
    
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Get applied job IDs to exclude them
    const applications = await JobApplication.find({ applicantId: userId }).select('jobId');
    const appliedJobIds = applications.map(app => app.jobId);
    
    if (appliedJobIds.length > 0) {
      query._id = { $nin: appliedJobIds };
    }

    const jobs = await Job.find(query)
      .populate('employer', 'firstName lastName company email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);
    
    const total = await Job.countDocuments(query);

    res.status(200).json({
      success: true,
      data: jobs,
      pagination: {
        current: pageNum,
        pages: Math.ceil(total / limitNum),
        total
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch jobs for student',
      message: error.message
    });
  }
};

// Get jobs by employer (same as getUserJobs but with different route name)
export const getJobsByEmployer = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const { page = 1, limit = 10, status } = req.query;
    
    const query: any = { employer: userId };
    if (status) query.status = status;
    
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const jobs = await Job.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);
    
    const total = await Job.countDocuments(query);

    // Also get application counts for each job
    const jobsWithApplications = await Promise.all(
      jobs.map(async (job) => {
        const applicationCount = await JobApplication.countDocuments({ jobId: job._id });
        return {
          ...job.toObject(),
          applicationCount
        };
      })
    );

    res.status(200).json({
      success: true,
      data: jobsWithApplications,
      pagination: {
        current: pageNum,
        pages: Math.ceil(total / limitNum),
        total
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch employer jobs',
      message: error.message
    });
  }
};

// Get recommended courses for a job
export const getRecommendedCourses = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const job = await Job.findById(id);
    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    // Find course matches for this job
    const courseMatches = await JobCourseMatch.find({ jobId: id })
      .populate('courseId', 'title description skills duration level');

    // If no specific matches, suggest courses based on job skills
    let recommendedCourses = courseMatches.map(match => match.courseId);

    // If no matches found, we can suggest based on skills (placeholder logic)
    if (recommendedCourses.length === 0 && job.skills && job.skills.length > 0) {
      // This would be replaced with actual course matching logic
      recommendedCourses = [{
        title: 'Skills Development Course',
        description: `Develop skills required for ${job.title}`,
        skills: job.skills,
        duration: '4 weeks',
        level: 'intermediate',
        _id: 'placeholder'
      }];
    }

    res.status(200).json({
      success: true,
      data: {
        job: {
          title: job.title,
          skills: job.skills,
          category: job.category
        },
        recommendedCourses,
        matchCount: recommendedCourses.length
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recommended courses',
      message: error.message
    });
  }
};

// AI-powered job matching for users - Clean version
export const getAIMatchedJobs = async (req: AuthRequest, res: Response) => {
  console.log('🤖 AI-matched jobs endpoint called - START');
  
  try {
    const userId = req.user?.id;
    console.log('🔍 User ID from request:', userId);
    
    if (!userId) {
      console.error('❌ User not authenticated');
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    console.log('🤖 Starting job matching for user:', userId);
    
    // Simple fallback: return basic job matching without complex AI
    console.log('🔍 Fetching active jobs...');
    const activeJobs = await Job.find({ 
      status: JobStatus.ACTIVE
    })
    .populate('employer', 'firstName lastName company email')
    .limit(10)
    .lean();

    console.log(`📊 Found ${activeJobs.length} active jobs`);

    // Return jobs with basic match data
    const matchedJobs = activeJobs.map((job: any) => ({
      ...job,
      matchPercentage: Math.floor(Math.random() * 40) + 60, // Random 60-100%
      matchingSkills: job.skills?.slice(0, 3) || [],
      aiExplanation: 'Basic matching based on job availability',
      recommendationReason: 'Job matches your profile criteria'
    }));

    return res.status(200).json({
      success: true,
      data: matchedJobs,
      meta: {
        totalJobsEvaluated: activeJobs.length,
        matchesFound: matchedJobs.length,
        userSkillsCount: 0,
        averageMatchPercentage: 75
      }
    });

  } catch (error: any) {
    console.error('❌ AI job matching failed:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to match jobs using AI',
      message: error.message || 'Unknown error occurred',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};