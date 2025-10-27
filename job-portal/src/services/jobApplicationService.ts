import { apiGet, apiPost, apiPut, handleApiResponse } from './api';

// Define all types locally to avoid import issues
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface ApplicationFilters {
  status?: string;
  jobId?: string;
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
  salary?: {
    min: number;
    max: number;
    currency: string;
  };
  benefits: string[];
  requirements: string[];
  responsibilities: string[];
  applicationDeadline?: string;
  status: string;
  employer: User;
  applicationsCount: number;
  viewsCount: number;
  createdAt: string;
  updatedAt: string;
}

interface JobApplication {
  _id: string;
  job: Job;
  applicant: User;
  resume: string;
  coverLetter?: string;
  status: string;
  notes?: string;
  appliedAt: string;
  updatedAt: string;
}

interface JobApplicationForm {
  resume: string;
  coverLetter?: string;
}

class JobApplicationService {
  // Apply for a job
  async applyForJob(jobId: string, applicationData: JobApplicationForm): Promise<JobApplication> {
    const response = await apiPost<ApiResponse<JobApplication>>(`/job-applications/${jobId}/apply`, applicationData);
    return handleApiResponse(response);
  }

  // Get user's applications
  async getUserApplications(): Promise<JobApplication[]> {
    const response = await apiGet<ApiResponse<JobApplication[]>>('/job-applications/my-applications');
    return handleApiResponse(response);
  }

  // Get applications for a job (Employer only)
  async getJobApplications(jobId: string): Promise<JobApplication[]> {
    const response = await apiGet<ApiResponse<JobApplication[]>>(`/job-applications/job/${jobId}`);
    return handleApiResponse(response);
  }

  // Get qualified applicants for a job (Employer only)
  async getQualifiedApplicants(jobId: string): Promise<JobApplication[]> {
    const response = await apiGet<ApiResponse<JobApplication[]>>(`/job-applications/job/${jobId}/qualified`);
    return handleApiResponse(response);
  }

  // Update application status (Employer only)
  async updateApplicationStatus(applicationId: string, status: string, notes?: string): Promise<JobApplication> {
    const response = await apiPut<ApiResponse<JobApplication>>(`/job-applications/${applicationId}/status`, {
      status,
      notes
    });
    return handleApiResponse(response);
  }

  // Withdraw application
  async withdrawApplication(applicationId: string): Promise<void> {
    const response = await apiPut<ApiResponse<void>>(`/job-applications/${applicationId}/withdraw`, {});
    handleApiResponse(response);
  }

  // Get application details
  async getApplicationDetails(applicationId: string): Promise<JobApplication> {
    const response = await apiGet<ApiResponse<JobApplication>>(`/job-applications/${applicationId}`);
    return handleApiResponse(response);
  }

  // Get all applications for employer
  async getEmployerApplications(): Promise<JobApplication[]> {
    const response = await apiGet<ApiResponse<JobApplication[]>>('/job-applications/employer/all');
    return handleApiResponse(response);
  }

  // Get application statistics
  async getApplicationStats(): Promise<any> {
    const response = await apiGet<ApiResponse<any>>('/job-applications/stats');
    return handleApiResponse(response);
  }

  // Check if user has applied for a job
  async hasAppliedForJob(jobId: string): Promise<boolean> {
    try {
      const applications = await this.getUserApplications();
      return applications.some(app => app.job._id === jobId);
    } catch (error) {
      console.error('Error checking application status:', error);
      return false;
    }
  }

  // Get application by job ID
  async getApplicationByJobId(jobId: string): Promise<JobApplication | null> {
    try {
      const applications = await this.getUserApplications();
      return applications.find(app => app.job._id === jobId) || null;
    } catch (error) {
      console.error('Error getting application by job ID:', error);
      return null;
    }
  }

  // Filter applications
  async filterApplications(filters: ApplicationFilters): Promise<JobApplication[]> {
    const applications = await this.getUserApplications();
    
    let filtered = applications;

    if (filters.status) {
      filtered = filtered.filter(app => app.status === filters.status);
    }

    if (filters.jobId) {
      filtered = filtered.filter(app => app.job._id === filters.jobId);
    }

    return filtered;
  }

  // Get recent applications
  async getRecentApplications(limit = 5): Promise<JobApplication[]> {
    const applications = await this.getUserApplications();
    return applications
      .sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime())
      .slice(0, limit);
  }

  // Get applications by status
  async getApplicationsByStatus(status: string): Promise<JobApplication[]> {
    const applications = await this.getUserApplications();
    return applications.filter(app => app.status === status);
  }
}

export const jobApplicationService = new JobApplicationService();
export default jobApplicationService;