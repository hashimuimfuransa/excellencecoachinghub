import { apiGet, apiPost, apiPut, handleApiResponse } from './api';

// Define all types locally to avoid import issues
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

enum CertificateType {
  JOB_PREPARATION = 'job_preparation',
  COURSE_COMPLETION = 'course_completion',
  SKILL_VERIFICATION = 'skill_verification',
  SKILL_ASSESSMENT = 'skill_assessment',
  INTERVIEW_READINESS = 'interview_readiness',
  INTERVIEW_EXCELLENCE = 'interview_excellence',
  PSYCHOMETRIC_ACHIEVEMENT = 'psychometric_achievement'
}

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  avatar?: string;
  company?: string;
  jobTitle?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Job {
  _id: string;
  title: string;
  description: string;
  company: string;
  location: string;
  jobType: string;
  experienceLevel: string;
  educationLevel: string;
  skills: string[];
  createdAt: string;
  updatedAt: string;
}

interface Course {
  _id: string;
  title: string;
  description: string;
  category: string;
  level: string;
  duration?: number;
  instructor?: User;
  createdAt: string;
  updatedAt: string;
}

interface JobCertificate {
  _id: string;
  user: User;
  type: CertificateType;
  title: string;
  description: string;
  skills: string[];
  issuedBy: string;
  verificationCode: string;
  isVerified: boolean;
  relatedJob?: Job;
  relatedCourse?: Course;
  issuedAt: string;
  expiresAt?: string;
  createdAt: string;
}

class CertificateService {
  // Issue certificate (Admin only)
  async issueCertificate(certificateData: any): Promise<JobCertificate> {
    const response = await apiPost<ApiResponse<JobCertificate>>('/job-certificates/issue', certificateData);
    return handleApiResponse(response);
  }

  // Auto-issue certificate based on completion
  async autoIssueCertificate(jobId: string): Promise<JobCertificate> {
    const response = await apiPost<ApiResponse<JobCertificate>>(`/job-certificates/auto-issue/${jobId}`, {});
    return handleApiResponse(response);
  }

  // Get user certificates
  async getUserCertificates(): Promise<JobCertificate[]> {
    const response = await apiGet<ApiResponse<JobCertificate[]>>('/job-certificates/my-certificates');
    return handleApiResponse(response);
  }

  // Verify certificate
  async verifyCertificate(verificationCode: string): Promise<JobCertificate> {
    const response = await apiGet<ApiResponse<JobCertificate>>(`/job-certificates/verify/${verificationCode}`);
    return handleApiResponse(response);
  }

  // Get certificates by type
  async getCertificatesByType(type: CertificateType): Promise<JobCertificate[]> {
    const response = await apiGet<ApiResponse<JobCertificate[]>>(`/job-certificates/type/${type}`);
    return handleApiResponse(response);
  }

  // Get valid certificates
  async getValidCertificates(): Promise<JobCertificate[]> {
    const response = await apiGet<ApiResponse<JobCertificate[]>>('/job-certificates/valid');
    return handleApiResponse(response);
  }

  // Update certificate (Admin only)
  async updateCertificate(certificateId: string, updateData: any): Promise<JobCertificate> {
    const response = await apiPut<ApiResponse<JobCertificate>>(`/job-certificates/${certificateId}`, updateData);
    return handleApiResponse(response);
  }

  // Revoke certificate (Admin only)
  async revokeCertificate(certificateId: string): Promise<void> {
    const response = await apiPut<ApiResponse<void>>(`/job-certificates/${certificateId}/revoke`, {});
    handleApiResponse(response);
  }

  // Check if user can earn certificate for a job
  async canEarnCertificate(jobId: string): Promise<{
    canEarn: boolean;
    requirements: {
      psychometricTest: { completed: boolean; score?: number };
      interview: { completed: boolean; score?: number };
    };
    message: string;
  }> {
    try {
      // This would typically be an API call, but for now we'll simulate the logic
      const response = await apiGet<ApiResponse<any>>(`/job-certificates/eligibility/${jobId}`);
      return handleApiResponse(response);
    } catch (error) {
      // If endpoint doesn't exist, return default response
      return {
        canEarn: false,
        requirements: {
          psychometricTest: { completed: false },
          interview: { completed: false }
        },
        message: 'Complete all required assessments to earn a certificate'
      };
    }
  }

  // Get certificate statistics
  async getCertificateStatistics(): Promise<{
    totalCertificates: number;
    certificatesByType: Record<CertificateType, number>;
    recentCertificates: JobCertificate[];
    expiringCertificates: JobCertificate[];
  }> {
    const certificates = await this.getUserCertificates();
    
    const stats = {
      totalCertificates: certificates.length,
      certificatesByType: {} as Record<CertificateType, number>,
      recentCertificates: certificates
        .sort((a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime())
        .slice(0, 5),
      expiringCertificates: certificates
        .filter(cert => cert.expiresAt && new Date(cert.expiresAt) > new Date())
        .sort((a, b) => new Date(a.expiresAt!).getTime() - new Date(b.expiresAt!).getTime())
        .slice(0, 5)
    };

    // Count certificates by type
    Object.values(CertificateType).forEach(type => {
      stats.certificatesByType[type] = certificates.filter(cert => cert.type === type).length;
    });

    return stats;
  }

  // Check if certificate is valid
  isCertificateValid(certificate: JobCertificate): boolean {
    if (!certificate.isVerified) return false;
    if (certificate.expiresAt && new Date(certificate.expiresAt) < new Date()) return false;
    return true;
  }

  // Get certificate by verification code
  async getCertificateByVerificationCode(verificationCode: string): Promise<JobCertificate | null> {
    try {
      return await this.verifyCertificate(verificationCode);
    } catch (error) {
      return null;
    }
  }

  // Download certificate (would typically generate PDF)
  async downloadCertificate(certificateId: string): Promise<Blob> {
    try {
      const response = await apiGet(`/job-certificates/${certificateId}/download`, {}, {
        responseType: 'blob'
      });
      return response;
    } catch (error) {
      throw new Error('Failed to download certificate');
    }
  }

  // Share certificate
  generateShareableLink(certificate: JobCertificate): string {
    const baseUrl = window.location.origin;
    return `${baseUrl}/certificates/verify/${certificate.verificationCode}`;
  }

  // Get certificates for a specific job
  async getCertificatesForJob(jobId: string): Promise<JobCertificate[]> {
    const certificates = await this.getUserCertificates();
    return certificates.filter(cert => cert.relatedJob?._id === jobId);
  }

  // Get certificates for a specific course
  async getCertificatesForCourse(courseId: string): Promise<JobCertificate[]> {
    const certificates = await this.getUserCertificates();
    return certificates.filter(cert => cert.relatedCourse?._id === courseId);
  }

  // Get certificate types with descriptions
  getCertificateTypes(): { value: CertificateType; label: string; description: string }[] {
    return [
      {
        value: CertificateType.COURSE_COMPLETION,
        label: 'Course Completion',
        description: 'Awarded upon successful completion of a course'
      },
      {
        value: CertificateType.SKILL_ASSESSMENT,
        label: 'Skill Assessment',
        description: 'Awarded for demonstrating proficiency in specific skills'
      },
      {
        value: CertificateType.JOB_PREPARATION,
        label: 'Job Preparation',
        description: 'Awarded for completing job preparation activities'
      },
      {
        value: CertificateType.INTERVIEW_EXCELLENCE,
        label: 'Interview Excellence',
        description: 'Awarded for outstanding performance in AI interviews'
      },
      {
        value: CertificateType.PSYCHOMETRIC_ACHIEVEMENT,
        label: 'Psychometric Achievement',
        description: 'Awarded for high scores in psychometric assessments'
      }
    ];
  }

  // Format certificate for display
  formatCertificateForDisplay(certificate: JobCertificate): {
    title: string;
    description: string;
    issuedDate: string;
    expiryDate?: string;
    status: 'valid' | 'expired' | 'revoked';
    skills: string[];
  } {
    const isValid = this.isCertificateValid(certificate);
    const isExpired = certificate.expiresAt && new Date(certificate.expiresAt) < new Date();
    
    return {
      title: certificate.title,
      description: certificate.description,
      issuedDate: new Date(certificate.issuedAt).toLocaleDateString(),
      expiryDate: certificate.expiresAt ? new Date(certificate.expiresAt).toLocaleDateString() : undefined,
      status: !certificate.isVerified ? 'revoked' : isExpired ? 'expired' : 'valid',
      skills: certificate.skills
    };
  }
}

export const certificateService = new CertificateService();
export default certificateService;