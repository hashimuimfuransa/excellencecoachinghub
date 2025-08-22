import { Response } from 'express';
import { Job, JobApplication, User, PsychometricTestResult, AIInterview, InterviewSession } from '@/models';
import { JobStatus, UserRole, ApplicationStatus } from '../types';
import { AuthRequest } from '@/middleware/auth';
import mongoose from 'mongoose';

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

    const jobData = {
      ...req.body,
      employer: employerId
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
      .populate('applicant', 'firstName lastName email avatar phone location')
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

    application.status = ApplicationStatus.SHORTLISTED;
    await application.save();

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

    application.status = ApplicationStatus.REJECTED;
    if (reason) {
      application.notes = application.notes ? 
        `${application.notes}\n\nRejection reason: ${reason}` : 
        `Rejection reason: ${reason}`;
    }
    await application.save();

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

// Search candidates
export const searchCandidates = async (req: AuthRequest, res: Response) => {
  try {
    const employerId = req.user?.id;
    const { q, skills, location, experience } = req.query;

    let matchCondition: any = {};
    
    if (q) {
      matchCondition.$or = [
        { 'candidate.firstName': { $regex: q, $options: 'i' } },
        { 'candidate.lastName': { $regex: q, $options: 'i' } },
        { 'candidate.email': { $regex: q, $options: 'i' } }
      ];
    }

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
        $match: {
          'jobInfo.employer': new mongoose.Types.ObjectId(employerId)
        }
      },
      {
        $group: {
          _id: '$applicant',
          applications: { $push: '$$ROOT' }
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
      }
    ];

    if (Object.keys(matchCondition).length > 0) {
      pipeline.push({ $match: matchCondition });
    }

    const candidates = await JobApplication.aggregate(pipeline);

    res.status(200).json({
      success: true,
      data: candidates
    });
  } catch (error: any) {
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