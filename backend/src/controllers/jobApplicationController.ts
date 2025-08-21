import { Request, Response } from 'express';
import { JobApplication, Job, User, PsychometricTestResult, AIInterview } from '@/models';
import { ApplicationStatus, UserRole } from '../../../shared/types';
import { AuthRequest } from '@/middleware/auth';

// Apply for a job
export const applyForJob = async (req: AuthRequest, res: Response) => {
  try {
    const { jobId } = req.params;
    const { resume, coverLetter } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    // Check if job exists and is active
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    if (job.status !== 'active') {
      return res.status(400).json({
        success: false,
        error: 'This job is not accepting applications'
      });
    }

    // Check if application deadline has passed
    if (job.applicationDeadline && job.applicationDeadline < new Date()) {
      return res.status(400).json({
        success: false,
        error: 'Application deadline has passed'
      });
    }

    // Check if user has already applied
    const existingApplication = await JobApplication.findOne({
      job: jobId,
      applicant: userId
    });

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        error: 'You have already applied for this job'
      });
    }

    // Create application
    const application = new JobApplication({
      job: jobId,
      applicant: userId,
      resume,
      coverLetter,
      status: ApplicationStatus.APPLIED
    });

    await application.save();

    // Update job applications count
    job.applicationsCount += 1;
    await job.save();

    const populatedApplication = await JobApplication.findById(application._id)
      .populate('job', 'title company location')
      .populate('applicant', 'firstName lastName email');

    res.status(201).json({
      success: true,
      data: populatedApplication,
      message: 'Application submitted successfully'
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: 'Failed to submit application',
      message: error.message
    });
  }
};

// Get user's applications
export const getUserApplications = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const applications = await JobApplication.findByApplicant(userId);

    res.status(200).json({
      success: true,
      data: applications
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch applications',
      message: error.message
    });
  }
};

// Get applications for a job (Employer only)
export const getJobApplications = async (req: AuthRequest, res: Response) => {
  try {
    const { jobId } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId || userRole !== UserRole.EMPLOYER) {
      return res.status(403).json({
        success: false,
        error: 'Only employers can view job applications'
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

    if (job.employer.toString() !== userId) {
      return res.status(403).json({
        success: false,
        error: 'You can only view applications for your own jobs'
      });
    }

    const applications = await JobApplication.findByJob(jobId);

    res.status(200).json({
      success: true,
      data: applications
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch job applications',
      message: error.message
    });
  }
};

// Get qualified applicants for a job (Employer only)
export const getQualifiedApplicants = async (req: AuthRequest, res: Response) => {
  try {
    const { jobId } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId || userRole !== UserRole.EMPLOYER) {
      return res.status(403).json({
        success: false,
        error: 'Only employers can view qualified applicants'
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

    if (job.employer.toString() !== userId) {
      return res.status(403).json({
        success: false,
        error: 'You can only view applicants for your own jobs'
      });
    }

    const qualifiedApplicants = await JobApplication.findQualifiedApplicants(jobId);

    res.status(200).json({
      success: true,
      data: qualifiedApplicants
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch qualified applicants',
      message: error.message
    });
  }
};

// Update application status (Employer only)
export const updateApplicationStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { applicationId } = req.params;
    const { status, notes } = req.body;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId || userRole !== UserRole.EMPLOYER) {
      return res.status(403).json({
        success: false,
        error: 'Only employers can update application status'
      });
    }

    const application = await JobApplication.findById(applicationId)
      .populate('job', 'employer title company');

    if (!application) {
      return res.status(404).json({
        success: false,
        error: 'Application not found'
      });
    }

    // Verify the job belongs to the employer
    if (application.job.employer.toString() !== userId) {
      return res.status(403).json({
        success: false,
        error: 'You can only update applications for your own jobs'
      });
    }

    // Validate status
    if (!Object.values(ApplicationStatus).includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid application status'
      });
    }

    application.status = status;
    if (notes) application.notes = notes;
    await application.save();

    const updatedApplication = await JobApplication.findById(applicationId)
      .populate('job', 'title company location')
      .populate('applicant', 'firstName lastName email')
      .populate('psychometricTestResults')
      .populate('interviewResults')
      .populate('certificates');

    res.status(200).json({
      success: true,
      data: updatedApplication,
      message: 'Application status updated successfully'
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: 'Failed to update application status',
      message: error.message
    });
  }
};

// Withdraw application
export const withdrawApplication = async (req: AuthRequest, res: Response) => {
  try {
    const { applicationId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const application = await JobApplication.findById(applicationId);
    if (!application) {
      return res.status(404).json({
        success: false,
        error: 'Application not found'
      });
    }

    // Verify the application belongs to the user
    if (application.applicant.toString() !== userId) {
      return res.status(403).json({
        success: false,
        error: 'You can only withdraw your own applications'
      });
    }

    // Check if application can be withdrawn
    if ([ApplicationStatus.OFFERED, ApplicationStatus.REJECTED].includes(application.status)) {
      return res.status(400).json({
        success: false,
        error: 'Cannot withdraw application at this stage'
      });
    }

    application.status = ApplicationStatus.WITHDRAWN;
    await application.save();

    // Update job applications count
    const job = await Job.findById(application.job);
    if (job && job.applicationsCount > 0) {
      job.applicationsCount -= 1;
      await job.save();
    }

    res.status(200).json({
      success: true,
      message: 'Application withdrawn successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to withdraw application',
      message: error.message
    });
  }
};

// Get application details
export const getApplicationDetails = async (req: AuthRequest, res: Response) => {
  try {
    const { applicationId } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const application = await JobApplication.findById(applicationId)
      .populate('job', 'title company location employer')
      .populate('applicant', 'firstName lastName email avatar')
      .populate('psychometricTestResults')
      .populate('interviewResults')
      .populate('certificates');

    if (!application) {
      return res.status(404).json({
        success: false,
        error: 'Application not found'
      });
    }

    // Check permissions
    const canView = application.applicant._id.toString() === userId ||
                   (userRole === UserRole.EMPLOYER && application.job.employer.toString() === userId) ||
                   userRole === UserRole.SUPER_ADMIN;

    if (!canView) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to view this application'
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

// Get all applications for employer
export const getEmployerApplications = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId || userRole !== UserRole.EMPLOYER) {
      return res.status(403).json({
        success: false,
        error: 'Only employers can access this endpoint'
      });
    }

    const applications = await JobApplication.findByEmployer(userId);

    res.status(200).json({
      success: true,
      data: applications
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch employer applications',
      message: error.message
    });
  }
};