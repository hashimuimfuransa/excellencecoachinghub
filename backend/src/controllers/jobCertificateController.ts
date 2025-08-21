import { Request, Response } from 'express';
import { JobCertificate, PsychometricTestResult, AIInterview, Job, Course } from '@/models';
import { CertificateType, UserRole } from '../../../shared/types';
import { AuthRequest } from '@/middleware/auth';

// Issue certificate
export const issueCertificate = async (req: AuthRequest, res: Response) => {
  try {
    const {
      userId,
      type,
      title,
      description,
      skills,
      relatedJob,
      relatedCourse,
      psychometricTestResults,
      interviewResults,
      expiresAt
    } = req.body;
    const issuerId = req.user?.id;
    const issuerRole = req.user?.role;

    if (!issuerId || (issuerRole !== UserRole.SUPER_ADMIN && issuerRole !== UserRole.ADMIN)) {
      return res.status(403).json({
        success: false,
        error: 'Only admins can issue certificates'
      });
    }

    // Validate certificate type
    if (!Object.values(CertificateType).includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid certificate type'
      });
    }

    // Create certificate
    const certificate = new JobCertificate({
      user: userId,
      type,
      title,
      description,
      skills: skills || [],
      issuedBy: 'Excellence Coaching Hub',
      relatedJob,
      relatedCourse,
      psychometricTestResults: psychometricTestResults || [],
      interviewResults: interviewResults || [],
      expiresAt
    });

    await certificate.save();

    const populatedCertificate = await JobCertificate.findById(certificate._id)
      .populate('user', 'firstName lastName email')
      .populate('relatedJob', 'title company')
      .populate('relatedCourse', 'title description')
      .populate('psychometricTestResults')
      .populate('interviewResults');

    res.status(201).json({
      success: true,
      data: populatedCertificate,
      message: 'Certificate issued successfully'
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: 'Failed to issue certificate',
      message: error.message
    });
  }
};

// Auto-issue certificate based on completion
export const autoIssueCertificate = async (req: AuthRequest, res: Response) => {
  try {
    const { jobId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    // Check if user has completed required assessments for the job
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    // Check psychometric test completion
    const psychometricResults = await PsychometricTestResult.find({
      user: userId,
      job: jobId
    });

    // Check AI interview completion
    const interviewResults = await AIInterview.find({
      user: userId,
      job: jobId
    });

    // Determine if user qualifies for certificate
    const hasCompletedTests = psychometricResults.length > 0;
    const hasCompletedInterviews = interviewResults.length > 0;
    const averageTestScore = psychometricResults.reduce((sum, result) => sum + result.overallScore, 0) / psychometricResults.length;
    const averageInterviewScore = interviewResults.reduce((sum, result) => sum + result.overallScore, 0) / interviewResults.length;

    if (!hasCompletedTests || !hasCompletedInterviews) {
      return res.status(400).json({
        success: false,
        error: 'Complete all required assessments to earn a certificate'
      });
    }

    if (averageTestScore < 60 || averageInterviewScore < 60) {
      return res.status(400).json({
        success: false,
        error: 'Minimum score of 60% required in both assessments to earn certificate'
      });
    }

    // Check if certificate already exists
    const existingCertificate = await JobCertificate.findOne({
      user: userId,
      relatedJob: jobId,
      type: CertificateType.JOB_PREPARATION
    });

    if (existingCertificate) {
      return res.status(400).json({
        success: false,
        error: 'Certificate already issued for this job preparation'
      });
    }

    // Create certificate
    const certificate = new JobCertificate({
      user: userId,
      type: CertificateType.JOB_PREPARATION,
      title: `Job Preparation Certificate - ${job.title}`,
      description: `Successfully completed job preparation assessments for ${job.title} at ${job.company}`,
      skills: job.skills,
      issuedBy: 'Excellence Coaching Hub',
      relatedJob: jobId,
      psychometricTestResults: psychometricResults.map(r => r._id),
      interviewResults: interviewResults.map(r => r._id)
    });

    await certificate.save();

    const populatedCertificate = await JobCertificate.findById(certificate._id)
      .populate('user', 'firstName lastName email')
      .populate('relatedJob', 'title company')
      .populate('psychometricTestResults')
      .populate('interviewResults');

    res.status(201).json({
      success: true,
      data: populatedCertificate,
      message: 'Certificate earned successfully!'
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: 'Failed to issue certificate',
      message: error.message
    });
  }
};

// Get user certificates
export const getUserCertificates = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const certificates = await JobCertificate.findByUser(userId);

    res.status(200).json({
      success: true,
      data: certificates
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch certificates',
      message: error.message
    });
  }
};

// Verify certificate
export const verifyCertificate = async (req: Request, res: Response) => {
  try {
    const { verificationCode } = req.params;

    const certificate = await JobCertificate.findByVerificationCode(verificationCode);

    if (!certificate) {
      return res.status(404).json({
        success: false,
        error: 'Certificate not found'
      });
    }

    if (!certificate.isValid) {
      return res.status(400).json({
        success: false,
        error: 'Certificate is not valid or has expired'
      });
    }

    res.status(200).json({
      success: true,
      data: certificate,
      message: 'Certificate verified successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to verify certificate',
      message: error.message
    });
  }
};

// Get certificates by type
export const getCertificatesByType = async (req: Request, res: Response) => {
  try {
    const { type } = req.params;

    if (!Object.values(CertificateType).includes(type as CertificateType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid certificate type'
      });
    }

    const certificates = await JobCertificate.findByType(type as CertificateType);

    res.status(200).json({
      success: true,
      data: certificates
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch certificates',
      message: error.message
    });
  }
};

// Get valid certificates
export const getValidCertificates = async (req: Request, res: Response) => {
  try {
    const certificates = await JobCertificate.findValidCertificates();

    res.status(200).json({
      success: true,
      data: certificates
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch valid certificates',
      message: error.message
    });
  }
};

// Update certificate (Admin only)
export const updateCertificate = async (req: AuthRequest, res: Response) => {
  try {
    const { certificateId } = req.params;
    const { isVerified, expiresAt } = req.body;
    const userRole = req.user?.role;

    if (userRole !== UserRole.SUPER_ADMIN && userRole !== UserRole.ADMIN) {
      return res.status(403).json({
        success: false,
        error: 'Only admins can update certificates'
      });
    }

    const certificate = await JobCertificate.findById(certificateId);
    if (!certificate) {
      return res.status(404).json({
        success: false,
        error: 'Certificate not found'
      });
    }

    if (isVerified !== undefined) certificate.isVerified = isVerified;
    if (expiresAt !== undefined) certificate.expiresAt = expiresAt;

    await certificate.save();

    const updatedCertificate = await JobCertificate.findById(certificateId)
      .populate('user', 'firstName lastName email')
      .populate('relatedJob', 'title company')
      .populate('relatedCourse', 'title description');

    res.status(200).json({
      success: true,
      data: updatedCertificate,
      message: 'Certificate updated successfully'
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: 'Failed to update certificate',
      message: error.message
    });
  }
};

// Revoke certificate (Admin only)
export const revokeCertificate = async (req: AuthRequest, res: Response) => {
  try {
    const { certificateId } = req.params;
    const userRole = req.user?.role;

    if (userRole !== UserRole.SUPER_ADMIN && userRole !== UserRole.ADMIN) {
      return res.status(403).json({
        success: false,
        error: 'Only admins can revoke certificates'
      });
    }

    const certificate = await JobCertificate.findById(certificateId);
    if (!certificate) {
      return res.status(404).json({
        success: false,
        error: 'Certificate not found'
      });
    }

    certificate.isVerified = false;
    await certificate.save();

    res.status(200).json({
      success: true,
      message: 'Certificate revoked successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to revoke certificate',
      message: error.message
    });
  }
};