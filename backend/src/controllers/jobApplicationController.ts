import { Request, Response } from 'express';
import { JobApplication, Job, User, PsychometricTestResult, AIInterview, Notification } from '@/models';
import { ApplicationStatus } from '@/types/job';
import { UserRole } from '../../../shared/types';
import { AuthRequest } from '@/middleware/auth';
import { validateProfile } from '../utils/profileValidation';
import { sendJobApplicationEmail } from '../services/sendGridService';

// Apply for a job
export const applyForJob = async (req: AuthRequest, res: Response) => {
  try {
    const { jobId } = req.params;
    const { resume, coverLetter, sendProfileToEmployer } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    // Get full user profile
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check profile completion
    const profileValidation = validateProfile(user);
    
    // Determine minimum profile completion based on job type and application method
    let minimumCompletion = 40; // Basic applications to internal jobs
    if (sendProfileToEmployer) {
      minimumCompletion = 60; // External applications with profile sharing
    }
    
    // Check if profile meets minimum requirements
    if (profileValidation.completionPercentage < minimumCompletion) {
      return res.status(400).json({
        success: false,
        error: 'Profile not complete enough for application',
        details: {
          completionPercentage: profileValidation.completionPercentage,
          minimumRequired: minimumCompletion,
          missingFields: profileValidation.missingFields,
          suggestion: sendProfileToEmployer 
            ? 'Please complete your profile with at least 60% completion before sending to external employers.'
            : 'Please complete your profile with at least basic information before applying.'
        }
      });
    }

    // Check if job exists and is active
    const job = await Job.findById(jobId).populate('employer', 'firstName lastName email company');
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

    // Use user's resume if none provided in request
    const finalResume = resume || user.resume;
    
    if (!finalResume) {
      return res.status(400).json({
        success: false,
        error: 'Resume is required. Please update your profile with a resume or provide one with your application.',
        details: {
          suggestion: 'Go to your profile settings to add a resume, or include a resume with your application.'
        }
      });
    }

    // Create application
    const application = new JobApplication({
      job: jobId,
      applicant: userId,
      resume: finalResume,
      coverLetter,
      status: ApplicationStatus.APPLIED
    });

    await application.save();

    // Update job applications count
    job.applicationsCount += 1;
    await job.save();

    // Create notification for employer (only for internal jobs)
    if (!job.isExternalJob && job.employer) {
      try {
        await Notification.create({
          recipient: job.employer._id,
          type: 'application_received',
          title: 'New Job Application',
          message: `${user.firstName} ${user.lastName} has applied for your job "${job.title}"`,
          data: {
            applicationId: application._id,
            jobId: job._id,
            jobTitle: job.title,
            applicantName: `${user.firstName} ${user.lastName}`,
            applicantEmail: user.email,
            userId: user._id,
            url: `/app/employer/candidates`
          }
        });
        console.log(`Notification created for employer ${job.employer._id} about application from ${user.firstName} ${user.lastName}`);
      } catch (notificationError) {
        console.error('Failed to create notification:', notificationError);
        // Don't fail the application process if notification fails
      }
    }

    // Prepare email information for frontend EmailJS handling
    let employerEmail: string | null = null;
    let emailMessage = '';

    // For internal jobs (created by employers), don't send emails - the application goes directly to employer's dashboard
    if (!job.isExternalJob) {
      emailMessage = 'Application submitted successfully! The employer will see your application in their dashboard.';
      console.log(`Internal job application created for job: ${job.title}`);
    } else if (sendProfileToEmployer) {
      // External jobs - handle email sending
      // Priority 1: Contact info email from job posting
      if (job.contactInfo?.email) {
        employerEmail = job.contactInfo.email;
      }
      // Priority 2: Employer's email
      else if (job.employer?.email) {
        employerEmail = job.employer.email;
      }

      if (employerEmail) {
        emailMessage = 'Application submitted. Email will be sent to employer via frontend service.';
        console.log(`External job - Employer email available: ${employerEmail}`);
      } else {
        emailMessage = 'Application submitted successfully! However, no employer email was provided for this job posting. Please use alternative contact methods or look for contact information in the job description.';
      }
    }

    const populatedApplication = await JobApplication.findById(application._id)
      .populate('job', 'title company location')
      .populate('applicant', 'firstName lastName email');

    // Send job application confirmation email using SendGrid
    try {
      await sendJobApplicationEmail(
        user.email,
        user.firstName || user.name || 'Job Seeker',
        job.title,
        job.company,
        'manual' // This is a manual application
      );
      console.log(`✅ Job application confirmation email sent to: ${user.email}`);
    } catch (emailError: any) {
      console.error(`❌ Failed to send job application confirmation email to ${user.email}:`, emailError.message);
      // Don't fail the application if email fails - it's not critical
    }

    res.status(201).json({
      success: true,
      data: populatedApplication,
      message: emailMessage || 'Application submitted successfully',
      emailData: !job.isExternalJob ? {
        // Internal job - no email needed
        shouldSendEmail: false,
        reason: 'Internal job - application sent to employer dashboard'
      } : (sendProfileToEmployer && employerEmail ? {
        // External job with email
        shouldSendEmail: true,
        employerEmail: employerEmail,
        jobData: {
          title: job.title,
          company: job.company,
          location: job.location
        },
        candidateData: {
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          phone: user.phone,
          location: user.location,
          jobTitle: user.jobTitle,
          skills: user.skills || [],
          summary: user.summary,
          experience: user.experience || [],
          education: user.education || [],
          resume: user.resume,
          cvFile: user.cvFile,
          profileCompletion: profileValidation.completionPercentage
        }
      } : {
        // External job without email
        shouldSendEmail: false,
        reason: employerEmail ? 'Email not requested' : 'No employer email available'
      })
    });
  } catch (error: any) {
    console.error('Error in applyForJob:', error);
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

    // Create notification for applicant about status update
    try {
      const applicant = await User.findById(application.applicant);
      if (applicant) {
        let notificationMessage = '';
        switch (status) {
          case ApplicationStatus.SHORTLISTED:
            notificationMessage = `Great news! You've been shortlisted for "${application.job.title}" at ${application.job.company}`;
            break;
          case ApplicationStatus.INTERVIEW_SCHEDULED:
            notificationMessage = `Interview scheduled for "${application.job.title}" at ${application.job.company}`;
            break;
          case ApplicationStatus.INTERVIEWED:
            notificationMessage = `Thank you for interviewing for "${application.job.title}" at ${application.job.company}`;
            break;
          case ApplicationStatus.OFFERED:
            notificationMessage = `Congratulations! You have an offer for "${application.job.title}" at ${application.job.company}`;
            break;
          case ApplicationStatus.REJECTED:
            notificationMessage = `Update on your application for "${application.job.title}" at ${application.job.company}`;
            break;
          default:
            notificationMessage = `Your application status for "${application.job.title}" has been updated`;
        }

        await Notification.create({
          recipient: application.applicant,
          type: 'application_status_update',
          title: 'Application Status Update',
          message: notificationMessage,
          data: {
            applicationId: application._id,
            jobId: application.job._id,
            jobTitle: application.job.title,
            status: status,
            url: `/app/applications`
          }
        });
      }
    } catch (notificationError) {
      console.error('Failed to create status update notification:', notificationError);
      // Don't fail the update process if notification fails
    }

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