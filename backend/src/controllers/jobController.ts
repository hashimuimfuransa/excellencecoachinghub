import { Request, Response } from 'express';
import { Job, JobApplication, JobCourseMatch, StudentProfile } from '@/models';
import { JobStatus, UserRole, EducationLevel } from '../types';
import { AuthRequest } from '@/middleware/auth';

// Get all jobs with filtering
export const getJobs = async (req: Request, res: Response) => {
  try {
    const {
      status,
      jobType,
      experienceLevel,
      educationLevel,
      location,
      skills,
      isCurated,
      page = 1,
      limit = 10,
      search
    } = req.query;

    const query: any = {};

    // Build filter query
    if (status) query.status = status;
    if (jobType) query.jobType = jobType;
    if (experienceLevel) query.experienceLevel = experienceLevel;
    if (educationLevel) query.educationLevel = educationLevel;
    if (location) query.location = { $regex: location, $options: 'i' };
    if (isCurated !== undefined) query.isCurated = isCurated === 'true';
    if (skills) {
      const skillsArray = Array.isArray(skills) ? skills : [skills];
      query.skills = { $in: skillsArray };
    }

    // Search functionality
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } }
      ];
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const jobs = await Job.find(query)
      .populate('employer', 'firstName lastName company')
      .populate('relatedCourses', 'title description category')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Job.countDocuments(query);

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
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch jobs',
      message: error.message
    });
  }
};

// Get jobs for students (filtered by education level)
export const getJobsForStudent = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    // Get student profile to check education level
    const studentProfile = await StudentProfile.findOne({ user: userId });
    if (!studentProfile) {
      return res.status(404).json({
        success: false,
        error: 'Student profile not found. Please complete your profile first.'
      });
    }

    // Check if student is eligible for jobs (high school or above)
    if (!studentProfile.isEligibleForJobs) {
      return res.status(403).json({
        success: false,
        error: 'You must have at least a high school education to view jobs.'
      });
    }

    const { page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Get jobs suitable for student's education level
    const jobs = await Job.findJobsByEducationLevel(studentProfile.educationLevel);

    // Filter jobs related to completed courses
    const relatedJobs = await Job.find({
      status: JobStatus.ACTIVE,
      relatedCourses: { $in: studentProfile.completedCourses }
    }).populate('employer', 'firstName lastName company')
      .populate('relatedCourses', 'title description category');

    // Combine and deduplicate
    const allJobs = [...jobs, ...relatedJobs];
    const uniqueJobs = allJobs.filter((job, index, self) => 
      index === self.findIndex(j => j._id.toString() === job._id.toString())
    );

    // Apply pagination
    const paginatedJobs = uniqueJobs.slice(skip, skip + limitNum);

    res.status(200).json({
      success: true,
      data: paginatedJobs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: uniqueJobs.length,
        pages: Math.ceil(uniqueJobs.length / limitNum)
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

// Get curated jobs
export const getCuratedJobs = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const jobs = await Job.findCuratedJobs();
    const paginatedJobs = jobs.slice(skip, skip + limitNum);

    res.status(200).json({
      success: true,
      data: paginatedJobs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: jobs.length,
        pages: Math.ceil(jobs.length / limitNum)
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

// Get single job by ID
export const getJobById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const job = await Job.findById(id)
      .populate('employer', 'firstName lastName company email')
      .populate('relatedCourses', 'title description category level')
      .populate('psychometricTests', 'title description type');

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    // Increment views count
    job.viewsCount += 1;
    await job.save();

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

// Create new job (Employer or Super Admin)
export const createJob = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId || !userRole) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    if (userRole !== UserRole.EMPLOYER && userRole !== UserRole.SUPER_ADMIN) {
      return res.status(403).json({
        success: false,
        error: 'Only employers and super admins can create jobs'
      });
    }

    const jobData = {
      ...req.body,
      employer: userId,
      isCurated: userRole === UserRole.SUPER_ADMIN,
      curatedBy: userRole === UserRole.SUPER_ADMIN ? userId : undefined
    };

    const job = new Job(jobData);
    await job.save();

    const populatedJob = await Job.findById(job._id)
      .populate('employer', 'firstName lastName company')
      .populate('relatedCourses', 'title description category');

    res.status(201).json({
      success: true,
      data: populatedJob,
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
    const userRole = req.user?.role;

    if (!userId || !userRole) {
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

    // Check permissions
    const canUpdate = userRole === UserRole.SUPER_ADMIN || 
                     (userRole === UserRole.EMPLOYER && job.employer.toString() === userId);

    if (!canUpdate) {
      return res.status(403).json({
        success: false,
        error: 'You can only update your own jobs'
      });
    }

    const updatedJob = await Job.findByIdAndUpdate(
      id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).populate('employer', 'firstName lastName company')
     .populate('relatedCourses', 'title description category');

    res.status(200).json({
      success: true,
      data: updatedJob,
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
    const userRole = req.user?.role;

    if (!userId || !userRole) {
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

    // Check permissions
    const canDelete = userRole === UserRole.SUPER_ADMIN || 
                     (userRole === UserRole.EMPLOYER && job.employer.toString() === userId);

    if (!canDelete) {
      return res.status(403).json({
        success: false,
        error: 'You can only delete your own jobs'
      });
    }

    await Job.findByIdAndDelete(id);

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

// Get jobs by employer
export const getJobsByEmployer = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId || userRole !== UserRole.EMPLOYER) {
      return res.status(403).json({
        success: false,
        error: 'Only employers can access this endpoint'
      });
    }

    const jobs = await Job.findJobsByEmployer(userId);

    res.status(200).json({
      success: true,
      data: jobs
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

    const matches = await JobCourseMatch.findByJob(id);

    res.status(200).json({
      success: true,
      data: matches
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recommended courses',
      message: error.message
    });
  }
};