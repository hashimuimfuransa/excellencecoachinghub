import { API_BASE_URL } from '../config';
import { authService } from './authService';

export interface JobApplication {
  _id: string;
  job: string;
  applicant: string;
  resume?: string;
  coverLetter?: string;
  status: 'applied' | 'under_review' | 'shortlisted' | 'interviewed' | 'offered' | 'rejected' | 'withdrawn';
  appliedDate: string;
  notes?: string;
}

export interface ApplyToJobRequest {
  resume?: string;
  coverLetter?: string;
  sendProfileToEmployer?: boolean; // New field for sending profile via email
}

class ApplicationService {
  private async getAuthHeaders() {
    const token = authService.getToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  /**
   * Apply for a job
   */
  async applyForJob(jobId: string, applicationData: ApplyToJobRequest): Promise<JobApplication & {emailData?: any, message?: string}> {
    try {
      const response = await fetch(`${API_BASE_URL}/applications/${jobId}/apply`, {
        method: 'POST',
        headers: await this.getAuthHeaders(),
        body: JSON.stringify(applicationData)
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to submit application');
      }

      return {
        ...data.data,
        emailData: data.emailData,
        message: data.message
      };
    } catch (error) {
      console.error('Error applying for job:', error);
      throw error;
    }
  }

  /**
   * Get user's applications
   */
  async getUserApplications(): Promise<JobApplication[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/applications/my-applications`, {
        headers: await this.getAuthHeaders()
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch applications');
      }

      return data.data;
    } catch (error) {
      console.error('Error fetching user applications:', error);
      throw error;
    }
  }

  /**
   * Withdraw an application
   */
  async withdrawApplication(applicationId: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/applications/${applicationId}/withdraw`, {
        method: 'PUT',
        headers: await this.getAuthHeaders()
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to withdraw application');
      }
    } catch (error) {
      console.error('Error withdrawing application:', error);
      throw error;
    }
  }

  /**
   * Get application details
   */
  async getApplicationDetails(applicationId: string): Promise<JobApplication> {
    try {
      const response = await fetch(`${API_BASE_URL}/applications/${applicationId}`, {
        headers: await this.getAuthHeaders()
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch application details');
      }

      return data.data;
    } catch (error) {
      console.error('Error fetching application details:', error);
      throw error;
    }
  }

  /**
   * Check if user has applied for a specific job
   */
  async hasAppliedForJob(jobId: string): Promise<boolean> {
    try {
      const applications = await this.getUserApplications();
      return applications.some(app => app.job === jobId);
    } catch (error) {
      console.error('Error checking application status:', error);
      return false;
    }
  }
}

export const applicationService = new ApplicationService();