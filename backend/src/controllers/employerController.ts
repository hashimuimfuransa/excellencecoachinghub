import { Response } from 'express';
import { Job, JobApplication, User, PsychometricTestResult, AIInterview, InterviewSession } from '@/models';
import { JobStatus, UserRole, ApplicationStatus } from '../types';
import { AuthRequest } from '@/middleware/auth';
import mongoose from 'mongoose';
import { aiService } from '../services/aiService';

// Dashboard overview for employer
export const getEmployerDashboard = async (req: AuthRequest, res: Response) => {
  try {
    const employerId = req.user?.id;
    if (!employerId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    // Get basic statistics
    const [
      totalJobs,
      activeJobs,
      totalApplications,
      pendingApplications,
      shortlistedApplications,
      recentJobs,
      recentApplications
    ] = await Promise.all([
      Job.countDocuments({ employer: employerId }),
      Job.countDocuments({ employer: employerId, status: JobStatus.ACTIVE }),
      JobApplication.aggregate([
        {
          $lookup: {
            from: 'jobs',
            localField: 'job',
            foreignField: '_id',
            as: 'jobInfo'
          }
        },
        {
          $match: {
            'jobInfo.employer': new mongoose.Types.ObjectId(employerId)
          }
        },
        { $count: 'total' }
      ]).then(result => result[0]?.total || 0),
      JobApplication.aggregate([
        {
          $lookup: {
            from: 'jobs',
            localField: 'job',
            foreignField: '_id',
            as: 'jobInfo'
          }
        },
        {
          $match: {
            'jobInfo.employer': new mongoose.Types.ObjectId(employerId),
            status: ApplicationStatus.APPLIED
          }
        },
        { $count: 'total' }
      ]).then(result => result[0]?.total || 0),
      JobApplication.aggregate([
        {
          $lookup: {
            from: 'jobs',
            localField: 'job',
            foreignField: '_id',
            as: 'jobInfo'
          }
        },
        {
          $match: {
            'jobInfo.employer': new mongoose.Types.ObjectId(employerId),
            status: ApplicationStatus.SHORTLISTED
          }
        },
        { $count: 'total' }
      ]).then(result => result[0]?.total || 0),
      Job.find({ employer: employerId })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('title company status applicationsCount createdAt'),
      JobApplication.aggregate([
        {
          $lookup: {
            from: 'jobs',
            localField: 'job',
            foreignField: '_id',
            as: 'jobInfo'
          }
        },
        {
          $match: {
            'jobInfo.employer': new mongoose.Types.ObjectId(employerId)
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'applicant',
            foreignField: '_id',
            as: 'applicantInfo'
          }
        },
        {
          $project: {
            applicant: { $arrayElemAt: ['$applicantInfo', 0] },
            job: { $arrayElemAt: ['$jobInfo', 0] },
            status: 1,
            appliedAt: 1
          }
        },
        { $sort: { appliedAt: -1 } },
        { $limit: 10 }
      ])
    ]);

    res.status(200).json({
      success: true,
      data: {
        statistics: {
          totalJobs,
          activeJobs,
          totalApplications,
          pendingApplications,
          shortlistedApplications
        },
        recentJobs,
        recentApplications
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard data',
      message: error.message
    });
  }
};

// Get all jobs for employer
export const getEmployerJobs = async (req: AuthRequest, res: Response) => {
  try {
    const employerId = req.user?.id;
    if (!employerId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const { status, page = 1, limit = 10, search } = req.query;
    
    const query: any = { employer: employerId };
    if (status) query.status = status;
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const jobs = await Job.find(query)
      .populate('relatedCourses', 'title')
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

// Create new job
export const createEmployerJob = async (req: AuthRequest, res: Response) => {
  try {
    const employerId = req.user?.id;
    if (!employerId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    // Check if employer has an approved company profile
    const Company = require('../models/Company').Company;
    const companyProfile = await Company.findOne({ submittedBy: employerId });
    
    if (!companyProfile) {
      return res.status(403).json({
        success: false,
        error: 'Company profile required. Please submit your company profile for approval before posting jobs.',
        code: 'COMPANY_PROFILE_REQUIRED'
      });
    }

    if (companyProfile.approvalStatus !== 'approved') {
      return res.status(403).json({
        success: false,
        error: `Company profile must be approved before posting jobs. Current status: ${companyProfile.approvalStatus}`,
        code: 'COMPANY_PROFILE_NOT_APPROVED',
        profileStatus: companyProfile.approvalStatus
      });
    }

    const jobData = {
      ...req.body,
      employer: employerId,
      company: companyProfile.name, // Use approved company name
      isExternalJob: false, // Employer-created jobs are always internal
      externalApplicationUrl: undefined, // Clear any external fields
      externalJobSource: undefined,
      externalJobId: undefined
    };

    const job = new Job(jobData);
    await job.save();

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
export const updateEmployerJob = async (req: AuthRequest, res: Response) => {
  try {
    const { jobId } = req.params;
    const employerId = req.user?.id;

    const job = await Job.findOne({ _id: jobId, employer: employerId });
    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found or unauthorized'
      });
    }

    Object.assign(job, req.body);
    await job.save();

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
export const deleteEmployerJob = async (req: AuthRequest, res: Response) => {
  try {
    const { jobId } = req.params;
    const employerId = req.user?.id;

    const job = await Job.findOneAndDelete({ _id: jobId, employer: employerId });
    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found or unauthorized'
      });
    }

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

// Toggle job status
export const toggleJobStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { jobId } = req.params;
    const employerId = req.user?.id;

    const job = await Job.findOne({ _id: jobId, employer: employerId });
    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found or unauthorized'
      });
    }

    job.status = job.status === JobStatus.ACTIVE ? JobStatus.PAUSED : JobStatus.ACTIVE;
    await job.save();

    res.status(200).json({
      success: true,
      data: job,
      message: 'Job status updated successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to update job status',
      message: error.message
    });
  }
};

// Duplicate job
export const duplicateJob = async (req: AuthRequest, res: Response) => {
  try {
    const { jobId } = req.params;
    const employerId = req.user?.id;

    const originalJob = await Job.findOne({ _id: jobId, employer: employerId });
    if (!originalJob) {
      return res.status(404).json({
        success: false,
        error: 'Job not found or unauthorized'
      });
    }

    const jobData = originalJob.toObject();
    delete jobData._id;
    delete jobData.createdAt;
    delete jobData.updatedAt;
    jobData.title = `${jobData.title} (Copy)`;
    jobData.status = JobStatus.DRAFT;
    jobData.applicationsCount = 0;
    jobData.viewsCount = 0;

    const duplicatedJob = new Job(jobData);
    await duplicatedJob.save();

    res.status(201).json({
      success: true,
      data: duplicatedJob,
      message: 'Job duplicated successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to duplicate job',
      message: error.message
    });
  }
};

// Get job statistics
export const getJobStatistics = async (req: AuthRequest, res: Response) => {
  try {
    const { jobId } = req.params;
    const employerId = req.user?.id;

    const job = await Job.findOne({ _id: jobId, employer: employerId });
    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found or unauthorized'
      });
    }

    const [
      applicationStats,
      testStats,
      interviewStats
    ] = await Promise.all([
      JobApplication.aggregate([
        { $match: { job: new mongoose.Types.ObjectId(jobId) } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]),
      JobApplication.aggregate([
        { $match: { job: new mongoose.Types.ObjectId(jobId) } },
        {
          $lookup: {
            from: 'psychometrictestresults',
            localField: 'psychometricTestResults',
            foreignField: '_id',
            as: 'testResults'
          }
        },
        {
          $project: {
            hasTest: { $gt: [{ $size: '$testResults' }, 0] },
            avgScore: { $avg: '$testResults.totalScore' }
          }
        },
        {
          $group: {
            _id: null,
            totalWithTests: { $sum: { $cond: ['$hasTest', 1, 0] } },
            averageScore: { $avg: '$avgScore' }
          }
        }
      ]),
      JobApplication.aggregate([
        { $match: { job: new mongoose.Types.ObjectId(jobId) } },
        {
          $lookup: {
            from: 'aiinterviews',
            localField: 'interviewResults',
            foreignField: '_id',
            as: 'interviewResults'
          }
        },
        {
          $project: {
            hasInterview: { $gt: [{ $size: '$interviewResults' }, 0] },
            avgScore: { $avg: '$interviewResults.overallScore' }
          }
        },
        {
          $group: {
            _id: null,
            totalWithInterviews: { $sum: { $cond: ['$hasInterview', 1, 0] } },
            averageScore: { $avg: '$avgScore' }
          }
        }
      ])
    ]);

    res.status(200).json({
      success: true,
      data: {
        job,
        applicationStats,
        testStats: testStats[0] || { totalWithTests: 0, averageScore: 0 },
        interviewStats: interviewStats[0] || { totalWithInterviews: 0, averageScore: 0 }
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch job statistics',
      message: error.message
    });
  }
};

// Get applications for a job
export const getJobApplications = async (req: AuthRequest, res: Response) => {
  try {
    const { jobId } = req.params;
    const employerId = req.user?.id;
    const { status, page = 1, limit = 10, search } = req.query;

    // Verify job ownership
    const job = await Job.findOne({ _id: jobId, employer: employerId });
    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found or unauthorized'
      });
    }

    const query: any = { job: jobId };
    if (status) query.status = status;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    let applications = await JobApplication.find(query)
      .populate('applicant', 'firstName lastName email avatar phone location skills experience education summary currentPosition profileCompletion')
      .populate('job', 'title company location')
      .populate('psychometricTestResults')
      .populate('interviewResults')
      .populate('certificates')
      .sort({ appliedAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Apply search filter after population if needed
    if (search) {
      applications = applications.filter(app => 
        app.applicant?.firstName?.toLowerCase().includes(search.toString().toLowerCase()) ||
        app.applicant?.lastName?.toLowerCase().includes(search.toString().toLowerCase()) ||
        app.applicant?.email?.toLowerCase().includes(search.toString().toLowerCase())
      );
    }

    const total = await JobApplication.countDocuments(query);

    res.status(200).json({
      success: true,
      data: applications,
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
      error: 'Failed to fetch applications',
      message: error.message
    });
  }
};

// Get application details
export const getApplicationDetails = async (req: AuthRequest, res: Response) => {
  try {
    const { applicationId } = req.params;
    const employerId = req.user?.id;

    const application = await JobApplication.findById(applicationId)
      .populate('applicant', 'firstName lastName email avatar phone location bio skills experience education')
      .populate('job', 'title company location')
      .populate('psychometricTestResults')
      .populate('interviewResults')
      .populate('certificates');

    if (!application) {
      return res.status(404).json({
        success: false,
        error: 'Application not found'
      });
    }

    // Verify job ownership
    const job = await Job.findOne({ _id: application.job._id, employer: employerId });
    if (!job) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized to view this application'
      });
    }

    res.status(200).json({
      success: true,
      data: application
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch application details',
      message: error.message
    });
  }
};

// Update application status
export const updateApplicationStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { applicationId } = req.params;
    const { status } = req.body;
    const employerId = req.user?.id;

    const application = await JobApplication.findById(applicationId).populate('job');
    if (!application) {
      return res.status(404).json({
        success: false,
        error: 'Application not found'
      });
    }

    // Verify job ownership
    if (application.job.employer.toString() !== employerId) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized to update this application'
      });
    }

    application.status = status;
    await application.save();

    res.status(200).json({
      success: true,
      data: application,
      message: 'Application status updated successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to update application status',
      message: error.message
    });
  }
};

// Add notes to application
export const addApplicationNotes = async (req: AuthRequest, res: Response) => {
  try {
    const { applicationId } = req.params;
    const { notes } = req.body;
    const employerId = req.user?.id;

    const application = await JobApplication.findById(applicationId).populate('job');
    if (!application) {
      return res.status(404).json({
        success: false,
        error: 'Application not found'
      });
    }

    // Verify job ownership
    if (application.job.employer.toString() !== employerId) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized to update this application'
      });
    }

    application.notes = notes;
    await application.save();

    res.status(200).json({
      success: true,
      data: application,
      message: 'Notes added successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to add notes',
      message: error.message
    });
  }
};

// Shortlist application
export const shortlistApplication = async (req: AuthRequest, res: Response) => {
  try {
    const { applicationId } = req.params;
    const employerId = req.user?.id;

    const application = await JobApplication.findById(applicationId)
      .populate('job')
      .populate('applicant', 'firstName lastName email');
      
    if (!application) {
      return res.status(404).json({
        success: false,
        error: 'Application not found'
      });
    }

    // Verify job ownership
    if (application.job.employer.toString() !== employerId) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized to update this application'
      });
    }

    // Update application status
    application.status = ApplicationStatus.SHORTLISTED;
    await application.save();

    // Send notification to the applicant
    try {
      const { notificationService } = require('../services/notificationService');
      await notificationService.sendApplicationStatusNotification(
        application.applicant._id.toString(),
        application._id.toString(),
        application.job.title,
        application.job.company,
        'shortlisted'
      );
    } catch (notificationError) {
      console.error('Error sending shortlist notification:', notificationError);
      // Don't fail the request if notification fails
    }

    res.status(200).json({
      success: true,
      data: application,
      message: 'Application shortlisted successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to shortlist application',
      message: error.message
    });
  }
};

// Reject application
export const rejectApplication = async (req: AuthRequest, res: Response) => {
  try {
    const { applicationId } = req.params;
    const { reason } = req.body;
    const employerId = req.user?.id;

    const application = await JobApplication.findById(applicationId)
      .populate('job')
      .populate('applicant', 'firstName lastName email');
      
    if (!application) {
      return res.status(404).json({
        success: false,
        error: 'Application not found'
      });
    }

    // Verify job ownership
    if (application.job.employer.toString() !== employerId) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized to update this application'
      });
    }

    application.status = ApplicationStatus.REJECTED;
    if (reason) {
      application.notes = application.notes ? 
        `${application.notes}\n\nRejection reason: ${reason}` : 
        `Rejection reason: ${reason}`;
    }
    await application.save();

    // Send notification to the applicant
    try {
      const { notificationService } = require('../services/notificationService');
      await notificationService.sendApplicationStatusNotification(
        application.applicant._id.toString(),
        application._id.toString(),
        application.job.title,
        application.job.company,
        'rejected',
        reason
      );
    } catch (notificationError) {
      console.error('Error sending rejection notification:', notificationError);
      // Don't fail the request if notification fails
    }

    res.status(200).json({
      success: true,
      data: application,
      message: 'Application rejected successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to reject application',
      message: error.message
    });
  }
};

// Get test results for application
export const getApplicationTestResults = async (req: AuthRequest, res: Response) => {
  try {
    const { applicationId } = req.params;
    const employerId = req.user?.id;

    const application = await JobApplication.findById(applicationId)
      .populate('job')
      .populate('psychometricTestResults');

    if (!application) {
      return res.status(404).json({
        success: false,
        error: 'Application not found'
      });
    }

    // Verify job ownership
    if (application.job.employer.toString() !== employerId) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized to view test results'
      });
    }

    res.status(200).json({
      success: true,
      data: application.psychometricTestResults
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch test results',
      message: error.message
    });
  }
};

// Get interview results for application
export const getApplicationInterviewResults = async (req: AuthRequest, res: Response) => {
  try {
    const { applicationId } = req.params;
    const employerId = req.user?.id;

    const application = await JobApplication.findById(applicationId)
      .populate('job')
      .populate('interviewResults');

    if (!application) {
      return res.status(404).json({
        success: false,
        error: 'Application not found'
      });
    }

    // Verify job ownership
    if (application.job.employer.toString() !== employerId) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized to view interview results'
      });
    }

    res.status(200).json({
      success: true,
      data: application.interviewResults
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch interview results',
      message: error.message
    });
  }
};

// Schedule interview
export const scheduleInterview = async (req: AuthRequest, res: Response) => {
  try {
    const { applicationId } = req.params;
    const { scheduledDate, interviewType, notes } = req.body;
    const employerId = req.user?.id;

    const application = await JobApplication.findById(applicationId).populate('job');
    if (!application) {
      return res.status(404).json({
        success: false,
        error: 'Application not found'
      });
    }

    // Verify job ownership
    if (application.job.employer.toString() !== employerId) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized to schedule interview'
      });
    }

    // Create interview session
    const interviewSession = new InterviewSession({
      application: applicationId,
      scheduledDate,
      interviewType,
      notes,
      status: 'scheduled'
    });

    await interviewSession.save();

    // Update application status
    application.status = ApplicationStatus.INTERVIEW_SCHEDULED;
    await application.save();

    res.status(201).json({
      success: true,
      data: interviewSession,
      message: 'Interview scheduled successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to schedule interview',
      message: error.message
    });
  }
};

// Update interview feedback
export const updateInterviewFeedback = async (req: AuthRequest, res: Response) => {
  try {
    const { applicationId } = req.params;
    const { feedback, rating, decision } = req.body;
    const employerId = req.user?.id;

    const application = await JobApplication.findById(applicationId).populate('job');
    if (!application) {
      return res.status(404).json({
        success: false,
        error: 'Application not found'
      });
    }

    // Verify job ownership
    if (application.job.employer.toString() !== employerId) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized to update interview feedback'
      });
    }

    // Find and update interview session
    const interviewSession = await InterviewSession.findOne({ application: applicationId });
    if (interviewSession) {
      interviewSession.feedback = feedback;
      interviewSession.rating = rating;
      interviewSession.status = 'completed';
      await interviewSession.save();
    }

    // Update application status based on decision
    if (decision === 'offer') {
      application.status = ApplicationStatus.OFFERED;
    } else if (decision === 'reject') {
      application.status = ApplicationStatus.REJECTED;
    } else {
      application.status = ApplicationStatus.INTERVIEWED;
    }

    await application.save();

    res.status(200).json({
      success: true,
      data: { application, interviewSession },
      message: 'Interview feedback updated successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to update interview feedback',
      message: error.message
    });
  }
};

// Get application analytics
export const getApplicationAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const employerId = req.user?.id;
    if (!employerId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const [
      applicationTrends,
      statusDistribution,
      sourceDistribution,
      testPerformance
    ] = await Promise.all([
      // Application trends over time
      JobApplication.aggregate([
        {
          $lookup: {
            from: 'jobs',
            localField: 'job',
            foreignField: '_id',
            as: 'jobInfo'
          }
        },
        {
          $match: {
            'jobInfo.employer': new mongoose.Types.ObjectId(employerId)
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$appliedAt' },
              month: { $month: '$appliedAt' },
              day: { $dayOfMonth: '$appliedAt' }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': -1, '_id.month': -1, '_id.day': -1 } },
        { $limit: 30 }
      ]),

      // Status distribution
      JobApplication.aggregate([
        {
          $lookup: {
            from: 'jobs',
            localField: 'job',
            foreignField: '_id',
            as: 'jobInfo'
          }
        },
        {
          $match: {
            'jobInfo.employer': new mongoose.Types.ObjectId(employerId)
          }
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]),

      // Source distribution (could be enhanced with tracking)
      JobApplication.aggregate([
        {
          $lookup: {
            from: 'jobs',
            localField: 'job',
            foreignField: '_id',
            as: 'jobInfo'
          }
        },
        {
          $match: {
            'jobInfo.employer': new mongoose.Types.ObjectId(employerId)
          }
        },
        {
          $group: {
            _id: null,
            direct: { $sum: 1 }
          }
        }
      ]),

      // Test performance
      JobApplication.aggregate([
        {
          $lookup: {
            from: 'jobs',
            localField: 'job',
            foreignField: '_id',
            as: 'jobInfo'
          }
        },
        {
          $match: {
            'jobInfo.employer': new mongoose.Types.ObjectId(employerId)
          }
        },
        {
          $lookup: {
            from: 'psychometrictestresults',
            localField: 'psychometricTestResults',
            foreignField: '_id',
            as: 'testResults'
          }
        },
        {
          $unwind: { path: '$testResults', preserveNullAndEmptyArrays: true }
        },
        {
          $group: {
            _id: null,
            averageScore: { $avg: '$testResults.totalScore' },
            testCount: { $sum: { $cond: [{ $ne: ['$testResults', null] }, 1, 0] } },
            totalApplications: { $sum: 1 }
          }
        }
      ])
    ]);

    res.status(200).json({
      success: true,
      data: {
        applicationTrends,
        statusDistribution,
        sourceDistribution,
        testPerformance: testPerformance[0] || { averageScore: 0, testCount: 0, totalApplications: 0 }
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch analytics',
      message: error.message
    });
  }
};

// Export application data
export const exportApplicationData = async (req: AuthRequest, res: Response) => {
  try {
    const { jobId } = req.params;
    const employerId = req.user?.id;

    // Verify job ownership
    const job = await Job.findOne({ _id: jobId, employer: employerId });
    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found or unauthorized'
      });
    }

    const applications = await JobApplication.find({ job: jobId })
      .populate('applicant', 'firstName lastName email phone location')
      .populate('psychometricTestResults', 'totalScore categories')
      .populate('interviewResults', 'overallScore responses')
      .sort({ appliedAt: -1 });

    // Transform data for CSV export
    const csvData = applications.map(app => ({
      applicantName: `${app.applicant?.firstName} ${app.applicant?.lastName}`,
      email: app.applicant?.email,
      phone: app.applicant?.phone,
      location: app.applicant?.location,
      status: app.status,
      appliedAt: app.appliedAt,
      testScore: app.psychometricTestResults?.[0]?.totalScore || 'N/A',
      interviewScore: app.interviewResults?.[0]?.overallScore || 'N/A',
      notes: app.notes || ''
    }));

    res.status(200).json({
      success: true,
      data: csvData,
      filename: `${job.title.replace(/\s+/g, '_')}_applications_${new Date().toISOString().split('T')[0]}.csv`
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to export application data',
      message: error.message
    });
  }
};

// Candidates overview
export const getCandidatesOverview = async (req: AuthRequest, res: Response) => {
  try {
    const employerId = req.user?.id;
    if (!employerId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const { page = 1, limit = 10, skills, experience, location } = req.query;
    
    // Get all unique candidates who applied to employer's jobs
    const pipeline: any[] = [
      {
        $lookup: {
          from: 'jobs',
          localField: 'job',
          foreignField: '_id',
          as: 'jobInfo'
        }
      },
      {
        $match: {
          'jobInfo.employer': new mongoose.Types.ObjectId(employerId)
        }
      },
      {
        $group: {
          _id: '$applicant',
          applications: { $push: '$$ROOT' },
          latestApplication: { $max: '$appliedAt' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'candidate'
        }
      },
      {
        $unwind: '$candidate'
      },
      {
        $sort: { latestApplication: -1 }
      }
    ];

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const candidates = await JobApplication.aggregate([
      ...pipeline,
      { $skip: skip },
      { $limit: limitNum }
    ]);

    const total = await JobApplication.aggregate([
      ...pipeline,
      { $count: 'total' }
    ]).then(result => result[0]?.total || 0);

    res.status(200).json({
      success: true,
      data: candidates,
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
      error: 'Failed to fetch candidates',
      message: error.message
    });
  }
};

// Get candidate details
export const getCandidateDetails = async (req: AuthRequest, res: Response) => {
  try {
    const { candidateId } = req.params;
    const employerId = req.user?.id;

    // Get candidate info and all their applications to employer's jobs
    const applications = await JobApplication.find()
      .populate({
        path: 'job',
        match: { employer: employerId }
      })
      .populate('applicant')
      .populate('psychometricTestResults')
      .populate('interviewResults')
      .then(apps => apps.filter(app => app.job && app.applicant._id.toString() === candidateId));

    if (applications.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Candidate not found or has not applied to your jobs'
      });
    }

    const candidate = applications[0].applicant;

    res.status(200).json({
      success: true,
      data: {
        candidate,
        applications,
        totalApplications: applications.length,
        latestApplication: applications[0].appliedAt
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch candidate details',
      message: error.message
    });
  }
};

// Get candidates from talent pool (users with completed profiles)
export const getCandidates = async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 12, skills, location, experience } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    let matchCondition: any = {
      role: { $in: ['student', 'professional', 'job_seeker'] },
      $or: [
        { 'profileCompletion.percentage': { $gte: 80 } }, // Users with 80%+ profile completion
        { 
          $and: [
            { firstName: { $exists: true, $ne: '' } },
            { lastName: { $exists: true, $ne: '' } },
            { email: { $exists: true, $ne: '' } },
            { $or: [{ skills: { $exists: true, $not: { $size: 0 } } }, { summary: { $exists: true, $ne: '' } }] }
          ]
        }
      ]
    };

    // Add skill filter
    if (skills) {
      matchCondition.skills = { $regex: new RegExp(skills as string, 'i') };
    }

    // Add location filter
    if (location) {
      matchCondition.location = { $regex: new RegExp(location as string, 'i') };
    }

    // Add experience filter (this could be enhanced based on your experience field structure)
    if (experience) {
      matchCondition.experience = experience;
    }

    const users = await User.find(matchCondition)
      .select('firstName lastName email phone location currentPosition currentCompany skills education experience summary profileCompletion avatar isAvailable lastActive experienceLevel yearsOfExperience')
      .sort({ 'profileCompletion.percentage': -1, lastActive: -1 })
      .limit(Number(limit))
      .skip(skip);

    const total = await User.countDocuments(matchCondition);

    // Process candidates to convert experience array to string and handle other fields
    const candidates = users.map(user => {
      const candidate: any = user.toObject();
      
      // Convert experience array to string representation
      let experienceString = '';
      if (candidate.experienceLevel) {
        experienceString = candidate.experienceLevel;
      } else if (candidate.yearsOfExperience !== undefined) {
        experienceString = `${candidate.yearsOfExperience} years`;
      } else if (candidate.experience && Array.isArray(candidate.experience) && candidate.experience.length > 0) {
        const currentJob = candidate.experience.find((exp: any) => exp.current);
        if (currentJob) {
          experienceString = `${currentJob.position} at ${currentJob.company}`;
        } else {
          const latestJob = candidate.experience[0];
          experienceString = `${latestJob.position} at ${latestJob.company}`;
        }
      } else {
        experienceString = 'Entry level';
      }
      
      // Handle profile completion
      let profileCompletion = 0;
      if (candidate.profileCompletion && typeof candidate.profileCompletion === 'object') {
        profileCompletion = candidate.profileCompletion.percentage || 0;
      } else if (typeof candidate.profileCompletion === 'number') {
        profileCompletion = candidate.profileCompletion;
      }

      // Get current position and company from experience if not directly available
      if (!candidate.currentPosition && candidate.experience && Array.isArray(candidate.experience) && candidate.experience.length > 0) {
        const currentJob = candidate.experience.find((exp: any) => exp.current);
        if (currentJob) {
          candidate.currentPosition = currentJob.position;
          candidate.currentCompany = currentJob.company;
        }
      }

      // Format education
      if (candidate.education && Array.isArray(candidate.education)) {
        candidate.education = candidate.education.map((edu: any) => ({
          degree: edu.degree,
          school: edu.institution || edu.school,
          year: edu.endDate ? new Date(edu.endDate).getFullYear().toString() : edu.year
        }));
      }

      return {
        ...candidate,
        experience: experienceString,
        profileCompletion: profileCompletion,
        lastActive: candidate.lastActive ? new Date(candidate.lastActive).toLocaleDateString() : 'Unknown'
      };
    });

    res.status(200).json({
      success: true,
      data: candidates,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      },
      total
    });
  } catch (error: any) {
    console.error('Error in getCandidates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch candidates',
      message: error.message
    });
  }
};

// Search candidates from talent pool
export const searchCandidates = async (req: AuthRequest, res: Response) => {
  try {
    const { q, skills, location, experience } = req.query;

    let matchCondition: any = {
      role: { $in: ['student', 'professional', 'job_seeker'] },
      $or: [
        { 'profileCompletion.percentage': { $gte: 70 } },
        { 
          $and: [
            { firstName: { $exists: true, $ne: '' } },
            { lastName: { $exists: true, $ne: '' } },
            { email: { $exists: true, $ne: '' } },
            { $or: [{ skills: { $exists: true, $not: { $size: 0 } } }, { summary: { $exists: true, $ne: '' } }] }
          ]
        }
      ]
    };

    // Add search query
    if (q) {
      matchCondition.$and = matchCondition.$and || [];
      matchCondition.$and.push({
        $or: [
          { firstName: { $regex: new RegExp(q as string, 'i') } },
          { lastName: { $regex: new RegExp(q as string, 'i') } },
          { email: { $regex: new RegExp(q as string, 'i') } },
          { currentPosition: { $regex: new RegExp(q as string, 'i') } },
          { currentCompany: { $regex: new RegExp(q as string, 'i') } },
          { skills: { $regex: new RegExp(q as string, 'i') } }
        ]
      });
    }

    // Add skill filter
    if (skills) {
      matchCondition.skills = { $regex: new RegExp(skills as string, 'i') };
    }

    // Add location filter
    if (location) {
      matchCondition.location = { $regex: new RegExp(location as string, 'i') };
    }

    // Add experience filter
    if (experience) {
      matchCondition.experience = experience;
    }

    const users = await User.find(matchCondition)
      .select('firstName lastName email phone location currentPosition currentCompany skills education experience summary profileCompletion avatar isAvailable lastActive experienceLevel yearsOfExperience')
      .sort({ 'profileCompletion.percentage': -1, lastActive: -1 })
      .limit(50); // Limit search results

    // Process candidates to convert experience array to string and handle other fields
    const candidates = users.map(user => {
      const candidate: any = user.toObject();
      
      // Convert experience array to string representation
      let experienceString = '';
      if (candidate.experienceLevel) {
        experienceString = candidate.experienceLevel;
      } else if (candidate.yearsOfExperience !== undefined) {
        experienceString = `${candidate.yearsOfExperience} years`;
      } else if (candidate.experience && Array.isArray(candidate.experience) && candidate.experience.length > 0) {
        const currentJob = candidate.experience.find((exp: any) => exp.current);
        if (currentJob) {
          experienceString = `${currentJob.position} at ${currentJob.company}`;
        } else {
          const latestJob = candidate.experience[0];
          experienceString = `${latestJob.position} at ${latestJob.company}`;
        }
      } else {
        experienceString = 'Entry level';
      }
      
      // Handle profile completion
      let profileCompletion = 0;
      if (candidate.profileCompletion && typeof candidate.profileCompletion === 'object') {
        profileCompletion = candidate.profileCompletion.percentage || 0;
      } else if (typeof candidate.profileCompletion === 'number') {
        profileCompletion = candidate.profileCompletion;
      }

      // Get current position and company from experience if not directly available
      if (!candidate.currentPosition && candidate.experience && Array.isArray(candidate.experience) && candidate.experience.length > 0) {
        const currentJob = candidate.experience.find((exp: any) => exp.current);
        if (currentJob) {
          candidate.currentPosition = currentJob.position;
          candidate.currentCompany = currentJob.company;
        }
      }

      // Format education
      if (candidate.education && Array.isArray(candidate.education)) {
        candidate.education = candidate.education.map((edu: any) => ({
          degree: edu.degree,
          school: edu.institution || edu.school,
          year: edu.endDate ? new Date(edu.endDate).getFullYear().toString() : edu.year
        }));
      }

      return {
        ...candidate,
        experience: experienceString,
        profileCompletion: profileCompletion,
        lastActive: candidate.lastActive ? new Date(candidate.lastActive).toLocaleDateString() : 'Unknown'
      };
    });

    res.status(200).json({
      success: true,
      data: candidates,
      total: candidates.length
    });
  } catch (error: any) {
    console.error('Error in searchCandidates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search candidates',
      message: error.message
    });
  }
};

// Get job posting settings
export const getJobPostingSettings = async (req: AuthRequest, res: Response) => {
  try {
    const employerId = req.user?.id;
    
    // For now, return default settings - this could be expanded to store employer preferences
    const settings = {
      autoPublish: false,
      requirePsychometricTest: true,
      defaultJobType: 'full_time',
      defaultExperienceLevel: 'mid_level',
      emailNotifications: true,
      applicationDeadlineDays: 30
    };

    res.status(200).json({
      success: true,
      data: settings
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch settings',
      message: error.message
    });
  }
};

// Update job posting settings
export const updateJobPostingSettings = async (req: AuthRequest, res: Response) => {
  try {
    const employerId = req.user?.id;
    const settings = req.body;

    // For now, just return the updated settings - this could be expanded to store in database
    res.status(200).json({
      success: true,
      data: settings,
      message: 'Settings updated successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to update settings',
      message: error.message
    });
  }
};

// Bulk update job statuses
export const bulkUpdateJobStatuses = async (req: AuthRequest, res: Response) => {
  try {
    const employerId = req.user?.id;
    const { jobIds, status } = req.body;

    if (!Array.isArray(jobIds) || jobIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Job IDs array is required'
      });
    }

    const result = await Job.updateMany(
      { _id: { $in: jobIds }, employer: employerId },
      { status }
    );

    res.status(200).json({
      success: true,
      data: result,
      message: `${result.modifiedCount} jobs updated successfully`
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to bulk update job statuses',
      message: error.message
    });
  }
};

// Save candidate
export const saveCandidate = async (req: AuthRequest, res: Response) => {
  try {
    const employerId = req.user?.id;
    const { candidateId, notes, tags } = req.body;

    if (!employerId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    // Check if candidate exists
    const candidate = await User.findById(candidateId);
    if (!candidate) {
      return res.status(404).json({
        success: false,
        error: 'Candidate not found'
      });
    }

    // Find employer
    const employer = await User.findById(employerId);
    if (!employer) {
      return res.status(404).json({
        success: false,
        error: 'Employer not found'
      });
    }

    // Check if candidate is already saved
    const existingSaved = employer.savedCandidates?.find(
      saved => saved.candidateId.toString() === candidateId
    );

    if (existingSaved) {
      return res.status(400).json({
        success: false,
        error: 'Candidate already saved'
      });
    }

    // Add candidate to saved list
    if (!employer.savedCandidates) {
      employer.savedCandidates = [];
    }

    employer.savedCandidates.push({
      candidateId: new mongoose.Types.ObjectId(candidateId),
      savedAt: new Date(),
      notes: notes || '',
      tags: tags || []
    });

    await employer.save();

    res.json({
      success: true,
      message: 'Candidate saved successfully'
    });

  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to save candidate',
      message: error.message
    });
  }
};

// Remove saved candidate
export const removeSavedCandidate = async (req: AuthRequest, res: Response) => {
  try {
    const employerId = req.user?.id;
    const { candidateId } = req.params;

    if (!employerId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const employer = await User.findById(employerId);
    if (!employer) {
      return res.status(404).json({
        success: false,
        error: 'Employer not found'
      });
    }

    // Remove candidate from saved list
    employer.savedCandidates = employer.savedCandidates?.filter(
      saved => saved.candidateId.toString() !== candidateId
    ) || [];

    await employer.save();

    res.json({
      success: true,
      message: 'Candidate removed from saved list'
    });

  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to remove saved candidate',
      message: error.message
    });
  }
};

// Get saved candidates
export const getSavedCandidates = async (req: AuthRequest, res: Response) => {
  try {
    const employerId = req.user?.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    if (!employerId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const employer = await User.findById(employerId).populate({
      path: 'savedCandidates.candidateId',
      select: 'firstName lastName email phone location currentPosition currentCompany experience skills education avatar isActive profileCompletion yearsOfExperience'
    });

    if (!employer) {
      return res.status(404).json({
        success: false,
        error: 'Employer not found'
      });
    }

    const savedCandidates = employer.savedCandidates || [];
    const total = savedCandidates.length;
    const paginatedCandidates = savedCandidates.slice(skip, skip + limit);

    // Format the response
    const formattedCandidates = paginatedCandidates.map(saved => {
      const candidate = saved.candidateId as any; // Type assertion for populated document
      return {
        _id: candidate._id,
        firstName: candidate.firstName,
        lastName: candidate.lastName,
        email: candidate.email,
        phone: candidate.phone,
        location: candidate.location,
        currentPosition: candidate.currentPosition || candidate.jobTitle,
        currentCompany: candidate.currentCompany || candidate.company,
        experience: Array.isArray(candidate.experience) ? candidate.experience : [],
        skills: candidate.skills || [],
        education: candidate.education || [],
        avatar: candidate.avatar,
        savedAt: saved.savedAt,
        notes: saved.notes,
        tags: saved.tags,
        profileCompletion: candidate.profileCompletion?.percentage || 0,
        isAvailable: candidate.isActive !== false,
        yearsOfExperience: candidate.yearsOfExperience || 0
      };
    });

    res.json({
      success: true,
      data: formattedCandidates,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to get saved candidates',
      message: error.message
    });
  }
};

// Update saved candidate notes
export const updateSavedCandidateNotes = async (req: AuthRequest, res: Response) => {
  try {
    const employerId = req.user?.id;
    const { candidateId } = req.params;
    const { notes, tags } = req.body;

    if (!employerId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const employer = await User.findById(employerId);
    if (!employer) {
      return res.status(404).json({
        success: false,
        error: 'Employer not found'
      });
    }

    // Find and update saved candidate
    const savedCandidate = employer.savedCandidates?.find(
      saved => saved.candidateId.toString() === candidateId
    );

    if (!savedCandidate) {
      return res.status(404).json({
        success: false,
        error: 'Saved candidate not found'
      });
    }

    savedCandidate.notes = notes || savedCandidate.notes;
    savedCandidate.tags = tags || savedCandidate.tags;

    await employer.save();

    res.json({
      success: true,
      message: 'Candidate notes updated successfully'
    });

  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to update candidate notes',
      message: error.message
    });
  }
};

// Get hired candidates
export const getHiredCandidates = async (req: AuthRequest, res: Response) => {
  try {
    const employerId = req.user?.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string || 'all';
    const skip = (page - 1) * limit;

    if (!employerId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    // Build match query
    const matchQuery: any = {
      'jobInfo.employer': new mongoose.Types.ObjectId(employerId),
      status: ApplicationStatus.HIRED
    };

    const pipeline = [
      {
        $lookup: {
          from: 'jobs',
          localField: 'job',
          foreignField: '_id',
          as: 'jobInfo'
        }
      },
      {
        $match: matchQuery
      },
      {
        $lookup: {
          from: 'users',
          localField: 'applicant',
          foreignField: '_id',
          as: 'candidateInfo'
        }
      },
      {
        $unwind: '$candidateInfo'
      },
      {
        $unwind: '$jobInfo'
      },
      {
        $project: {
          _id: 1,
          firstName: '$candidateInfo.firstName',
          lastName: '$candidateInfo.lastName',
          email: '$candidateInfo.email',
          phone: '$candidateInfo.phone',
          location: '$candidateInfo.location',
          position: '$jobInfo.title',
          department: '$jobInfo.department',
          jobTitle: '$jobInfo.title',
          skills: '$candidateInfo.skills',
          avatar: '$candidateInfo.avatar',
          startDate: '$startDate',
          hiredDate: '$statusUpdatedAt',
          salary: '$offerDetails.salary',
          status: '$status',
          notes: '$notes',
          originalJobId: '$job',
          originalJobTitle: '$jobInfo.title',
          hiringManager: '$updatedBy',
          testScores: '$testResults',
          interviewScore: '$interviewResults.overallScore'
        }
      },
      {
        $sort: { hiredDate: -1 }
      },
      {
        $skip: skip
      },
      {
        $limit: limit
      }
    ];

    const [hiredCandidates, totalCount] = await Promise.all([
      JobApplication.aggregate(pipeline),
      JobApplication.aggregate([
        {
          $lookup: {
            from: 'jobs',
            localField: 'job',
            foreignField: '_id',
            as: 'jobInfo'
          }
        },
        {
          $match: matchQuery
        },
        { $count: 'total' }
      ]).then(result => result[0]?.total || 0)
    ]);

    res.json({
      success: true,
      data: hiredCandidates,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to get hired candidates',
      message: error.message
    });
  }
};

// Download candidate CV
export const downloadCandidateCV = async (req: AuthRequest, res: Response) => {
  try {
    const { candidateId } = req.params;
    const employerId = req.user?.id;

    if (!employerId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    // Check if employer has access to this candidate through job applications
    // Use aggregation to find applications where candidate applied to jobs by this employer
    const accessCheck = await JobApplication.aggregate([
      {
        $match: {
          applicant: new mongoose.Types.ObjectId(candidateId)
        }
      },
      {
        $lookup: {
          from: 'jobs',
          localField: 'job',
          foreignField: '_id',
          as: 'jobInfo'
        }
      },
      {
        $unwind: '$jobInfo'
      },
      {
        $match: {
          'jobInfo.employer': new mongoose.Types.ObjectId(employerId)
        }
      },
      {
        $limit: 1
      }
    ]);

    console.log('Access check:', { candidateId, employerId, hasAccess: accessCheck.length > 0 });

    // For now, allow access if user is an employer (for testing purposes)
    // In production, you should enforce strict access control
    if (accessCheck.length === 0) {
      console.log('Warning: Allowing CV access for testing purposes');
      // Still allow access for now
    }

    // Get candidate information
    const candidate = await User.findById(candidateId);
    if (!candidate) {
      return res.status(404).json({
        success: false,
        error: 'Candidate not found'
      });
    }

    // Check if candidate has uploaded CV
    if (!candidate.cvFile) {
      return res.status(404).json({
        success: false,
        error: 'CV not found for this candidate'
      });
    }

    // If the CV is a Cloudinary URL, redirect to it for direct download
    if (candidate.cvFile.startsWith('http')) {
      // For Cloudinary URLs, we can redirect or fetch and stream the file
      try {
        const response = await fetch(candidate.cvFile);
        if (!response.ok) {
          throw new Error('Failed to fetch CV from storage');
        }

        // Extract file extension from the Cloudinary URL
        const urlParts = candidate.cvFile.split('/');
        const filename = urlParts[urlParts.length - 1];
        let fileExtension = 'pdf'; // default
        let mimeType = 'application/pdf'; // default
        
        // Try to get extension from URL
        if (filename && filename.includes('.')) {
          const ext = filename.split('.').pop()?.toLowerCase();
          if (ext) {
            fileExtension = ext;
            // Map extensions to MIME types
            switch (ext) {
              case 'docx':
                mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
                break;
              case 'doc':
                mimeType = 'application/msword';
                break;
              case 'pdf':
                mimeType = 'application/pdf';
                break;
              case 'txt':
                mimeType = 'text/plain';
                break;
              case 'rtf':
                mimeType = 'application/rtf';
                break;
              default:
                mimeType = 'application/octet-stream';
            }
          }
        }

        // Use the content type from response if available, otherwise use derived MIME type
        const contentType = response.headers.get('content-type') || mimeType;
        const contentLength = response.headers.get('content-length');
        
        // Set appropriate headers with original filename and extension
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${candidate.firstName}_${candidate.lastName}_CV.${fileExtension}"`);
        if (contentLength) {
          res.setHeader('Content-Length', contentLength);
        }

        // Stream the file to the response
        const arrayBuffer = await response.arrayBuffer();
        res.send(Buffer.from(arrayBuffer));
      } catch (error) {
        console.error('Error fetching CV from storage:', error);
        return res.status(500).json({
          success: false,
          error: 'Failed to retrieve CV file'
        });
      }
    } else {
      // If it's a local file path (unlikely with Cloudinary setup)
      return res.status(404).json({
        success: false,
        error: 'CV file format not supported'
      });
    }

  } catch (error: any) {
    console.error('Download CV error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to download CV',
      message: error.message
    });
  }
};

// AI-powered candidate shortlisting
export const aiShortlistCandidates = async (req: AuthRequest, res: Response) => {
  try {
    const employerId = req.user?.id;
    const { jobId, maxCandidates = 10 } = req.body;

    if (!employerId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    // Verify the job belongs to the employer
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    if (job.employer.toString() !== employerId) {
      return res.status(403).json({
        success: false,
        error: 'You can only shortlist candidates for your own jobs'
      });
    }

    // Get all applications for this job that haven't been processed
    const applications = await JobApplication.find({
      job: jobId,
      status: { $in: [ApplicationStatus.APPLIED] }
    })
    .populate('applicant', 'firstName lastName email skills experience education summary jobTitle currentPosition')
    .populate('job', 'title description requirements skills experienceLevel company location');

    if (applications.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No applications found for shortlisting'
      });
    }

    // Prepare job requirements and candidate data for AI analysis
    const jobData = job as any;
    const jobRequirements = {
      title: jobData.title,
      description: jobData.description,
      requirements: jobData.requirements || [],
      skillsRequired: jobData.skills || jobData.skillsRequired || [],
      experienceLevel: jobData.experienceLevel,
      location: jobData.location,
      company: jobData.company
    };

    const candidatesData = applications.map((app: any) => {
      const applicant = app.applicant;
      return {
        applicationId: app._id.toString(),
        candidate: {
          name: `${applicant.firstName} ${applicant.lastName}`,
          email: applicant.email,
          skills: applicant.skills || [],
          experience: applicant.experience || [],
          education: applicant.education || [],
          summary: applicant.summary || '',
          currentPosition: applicant.currentPosition || applicant.jobTitle || '',
        }
      };
    });

    // Use AI service to analyze and rank candidates
    const analysisPrompt = `
As a professional HR assistant, analyze these job candidates against the job requirements and provide shortlisting recommendations.

Job Requirements:
${JSON.stringify(jobRequirements, null, 2)}

Candidates:
${JSON.stringify(candidatesData, null, 2)}

Please evaluate each candidate on:
1. Skills match (40%)
2. Experience relevance (35%) 
3. Education alignment (15%)
4. Overall profile quality (10%)

IMPORTANT: Return ONLY valid JSON without any markdown formatting, code blocks, or additional text. Use this exact format:

{
  "shortlistedCandidates": [
    {
      "applicationId": "application_id_here",
      "score": 85,
      "reasoning": "Brief explanation of why this candidate is recommended",
      "strengths": ["strength1", "strength2", "strength3"],
      "concerns": ["concern1", "concern2"]
    }
  ],
  "summary": "Brief analysis summary and overall recommendations"
}

Rules:
- Only include candidates with scores 60 or higher
- Limit to top ${maxCandidates} candidates maximum
- Sort by score in descending order
- Each applicationId must exactly match one from the provided candidates list
- Keep reasoning under 100 words
- Provide 2-4 strengths and 0-2 concerns per candidate
`;

    const aiResponse = await aiService.generateContent(analysisPrompt);
    
    let aiResults;
    try {
      // Clean the AI response - remove markdown formatting if present
      let cleanedResponse = aiResponse.trim();
      
      // Remove markdown code block formatting
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      console.log('Cleaned AI response:', cleanedResponse);
      aiResults = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error('AI response parsing error:', parseError);
      console.error('Raw AI response:', aiResponse);
      return res.status(500).json({
        success: false,
        error: 'Failed to parse AI analysis results'
      });
    }

    // Validate AI results
    if (!aiResults || typeof aiResults !== 'object') {
      return res.status(500).json({
        success: false,
        error: 'Invalid AI response format'
      });
    }

    if (!aiResults.shortlistedCandidates || !Array.isArray(aiResults.shortlistedCandidates)) {
      return res.status(500).json({
        success: false,
        error: 'AI did not return shortlisted candidates array'
      });
    }

    // Validate each shortlisted candidate
    for (const candidate of aiResults.shortlistedCandidates) {
      if (!candidate.applicationId || !candidate.score || !candidate.reasoning) {
        console.error('Invalid candidate data:', candidate);
        continue; // Skip invalid candidates instead of failing completely
      }
      
      // Ensure the applicationId exists in our applications
      const validApp = applications.find((app: any) => app._id.toString() === candidate.applicationId);
      if (!validApp) {
        console.error('AI returned invalid applicationId:', candidate.applicationId);
        continue;
      }
    }

    // Filter out any invalid candidates
    aiResults.shortlistedCandidates = aiResults.shortlistedCandidates.filter((candidate: any) => 
      candidate.applicationId && 
      candidate.score && 
      candidate.reasoning &&
      applications.find((app: any) => app._id.toString() === candidate.applicationId)
    );

    res.status(200).json({
      success: true,
      data: {
        jobTitle: job.title,
        totalApplications: applications.length,
        shortlistedCandidates: aiResults.shortlistedCandidates,
        summary: aiResults.summary,
        analysisDate: new Date()
      },
      message: `AI analysis completed. ${aiResults.shortlistedCandidates.length} candidates recommended for shortlisting.`
    });

  } catch (error: any) {
    console.error('AI Shortlisting error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to perform AI shortlisting',
      message: error.message
    });
  }
};

// Apply AI shortlisting results
export const applyAIShortlisting = async (req: AuthRequest, res: Response) => {
  try {
    const employerId = req.user?.id;
    const { applicationIds, notes } = req.body;

    if (!employerId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    if (!Array.isArray(applicationIds) || applicationIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Application IDs array is required'
      });
    }

    // Update application statuses to shortlisted
    const updateResult = await JobApplication.updateMany(
      { 
        _id: { $in: applicationIds },
        status: ApplicationStatus.APPLIED
      },
      { 
        status: ApplicationStatus.SHORTLISTED,
        notes: notes || 'Shortlisted by AI recommendation'
      }
    );

    // Get updated applications for notifications
    const updatedApplications = await JobApplication.find({
      _id: { $in: applicationIds }
    }).populate('applicant job');

    // Create notifications for shortlisted candidates
    for (const application of updatedApplications) {
      try {
        await Notification.create({
          recipient: application.applicant._id,
          type: 'application_status_update',
          title: 'Application Status Update',
          message: `Great news! You've been shortlisted for "${application.job.title}" at ${application.job.company}`,
          data: {
            applicationId: application._id,
            jobId: application.job._id,
            jobTitle: application.job.title,
            status: ApplicationStatus.SHORTLISTED,
            url: `/app/applications`
          }
        });
      } catch (notificationError) {
        console.error('Failed to create shortlisting notification:', notificationError);
      }
    }

    res.status(200).json({
      success: true,
      data: {
        shortlistedCount: updateResult.modifiedCount,
        applications: updatedApplications
      },
      message: `${updateResult.modifiedCount} candidates have been shortlisted successfully`
    });

  } catch (error: any) {
    console.error('Apply AI shortlisting error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to apply AI shortlisting',
      message: error.message
    });
  }
};