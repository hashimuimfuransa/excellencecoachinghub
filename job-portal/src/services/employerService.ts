const API_BASE_URL = import.meta.env.VITE_API_URL;

class EmployerService {
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  }

  // Dashboard
  async getDashboard() {
    const response = await fetch(`${API_BASE_URL}/employer/dashboard`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch dashboard data');
    }

    return response.json();
  }

  // Jobs Management
  async getJobs(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  } = {}) {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.search) searchParams.append('search', params.search);
    if (params.status && params.status !== 'all') searchParams.append('status', params.status);

    const response = await fetch(`${API_BASE_URL}/employer/jobs?${searchParams}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch jobs');
    }

    return response.json();
  }

  async createJob(jobData: any) {
    const response = await fetch(`${API_BASE_URL}/employer/jobs`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(jobData),
    });

    if (!response.ok) {
      throw new Error('Failed to create job');
    }

    return response.json();
  }

  async updateJob(jobId: string, jobData: any) {
    const response = await fetch(`${API_BASE_URL}/employer/jobs/${jobId}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(jobData),
    });

    if (!response.ok) {
      throw new Error('Failed to update job');
    }

    return response.json();
  }

  async deleteJob(jobId: string) {
    const response = await fetch(`${API_BASE_URL}/employer/jobs/${jobId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to delete job');
    }

    return response.json();
  }

  // Internships Management
  async getInternships(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  } = {}) {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.search) searchParams.append('search', params.search);
    if (params.status && params.status !== 'all') searchParams.append('status', params.status);

    const response = await fetch(`${API_BASE_URL}/internships/employer/my-internships?${searchParams}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch internships');
    }

    return response.json();
  }

  async createInternship(internshipData: any) {
    const response = await fetch(`${API_BASE_URL}/internships`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(internshipData),
    });

    if (!response.ok) {
      throw new Error('Failed to create internship');
    }

    return response.json();
  }

  async updateInternship(internshipId: string, internshipData: any) {
    const response = await fetch(`${API_BASE_URL}/internships/${internshipId}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(internshipData),
    });

    if (!response.ok) {
      throw new Error('Failed to update internship');
    }

    return response.json();
  }

  async deleteInternship(internshipId: string) {
    const response = await fetch(`${API_BASE_URL}/internships/${internshipId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to delete internship');
    }

    return response.json();
  }

  async getInternshipApplications(internshipId: string, params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  } = {}) {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.search) searchParams.append('search', params.search);
    if (params.status && params.status !== 'all') searchParams.append('status', params.status);

    const response = await fetch(`${API_BASE_URL}/internships/${internshipId}/applications?${searchParams}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch internship applications');
    }

    return response.json();
  }

  async toggleJobStatus(jobId: string) {
    const response = await fetch(`${API_BASE_URL}/employer/jobs/${jobId}/toggle-status`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to toggle job status');
    }

    return response.json();
  }

  async duplicateJob(jobId: string) {
    const response = await fetch(`${API_BASE_URL}/employer/jobs/${jobId}/duplicate`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to duplicate job');
    }

    return response.json();
  }

  async getJobStatistics(jobId: string) {
    const response = await fetch(`${API_BASE_URL}/employer/jobs/${jobId}/statistics`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch job statistics');
    }

    return response.json();
  }

  async bulkUpdateJobStatuses(jobIds: string[], status: string) {
    const response = await fetch(`${API_BASE_URL}/employer/jobs/bulk-update-status`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ jobIds, status }),
    });

    if (!response.ok) {
      throw new Error('Failed to bulk update job statuses');
    }

    return response.json();
  }

  // Applications Management
  async getJobApplications(jobId: string, params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  } = {}) {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.search) searchParams.append('search', params.search);
    if (params.status && params.status !== 'all') searchParams.append('status', params.status);

    const response = await fetch(`${API_BASE_URL}/employer/jobs/${jobId}/applications?${searchParams}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch job applications');
    }

    return response.json();
  }

  // Get applications for both jobs and internships
  async getAllApplications(postingId: string, postingType: 'job' | 'internship', params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  } = {}) {
    if (postingType === 'internship') {
      return this.getInternshipApplications(postingId, params);
    } else {
      return this.getJobApplications(postingId, params);
    }
  }

  async getApplicationDetails(applicationId: string) {
    const response = await fetch(`${API_BASE_URL}/employer/applications/${applicationId}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch application details');
    }

    return response.json();
  }

  async updateApplicationStatus(applicationId: string, status: string) {
    const response = await fetch(`${API_BASE_URL}/employer/applications/${applicationId}/status`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      throw new Error('Failed to update application status');
    }

    return response.json();
  }

  async addApplicationNotes(applicationId: string, notes: string) {
    const response = await fetch(`${API_BASE_URL}/employer/applications/${applicationId}/notes`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ notes }),
    });

    if (!response.ok) {
      throw new Error('Failed to add application notes');
    }

    return response.json();
  }

  async shortlistApplication(applicationId: string) {
    const response = await fetch(`${API_BASE_URL}/employer/applications/${applicationId}/shortlist`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to shortlist application');
    }

    return response.json();
  }

  async rejectApplication(applicationId: string, reason?: string) {
    const response = await fetch(`${API_BASE_URL}/employer/applications/${applicationId}/reject`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ reason }),
    });

    if (!response.ok) {
      throw new Error('Failed to reject application');
    }

    return response.json();
  }

  // Test and Interview Results
  async getApplicationTestResults(applicationId: string) {
    const response = await fetch(`${API_BASE_URL}/employer/applications/${applicationId}/test-results`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch test results');
    }

    return response.json();
  }

  async getApplicationInterviewResults(applicationId: string) {
    const response = await fetch(`${API_BASE_URL}/employer/applications/${applicationId}/interview-results`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch interview results');
    }

    return response.json();
  }

  async scheduleInterview(applicationId: string, interviewData: {
    scheduledDate: string;
    interviewType: string;
    notes?: string;
  }) {
    const response = await fetch(`${API_BASE_URL}/employer/applications/${applicationId}/schedule-interview`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(interviewData),
    });

    if (!response.ok) {
      throw new Error('Failed to schedule interview');
    }

    return response.json();
  }

  async updateInterviewFeedback(applicationId: string, feedbackData: {
    feedback: string;
    rating: number;
    decision: string;
  }) {
    const response = await fetch(`${API_BASE_URL}/employer/applications/${applicationId}/interview-feedback`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(feedbackData),
    });

    if (!response.ok) {
      throw new Error('Failed to update interview feedback');
    }

    return response.json();
  }

  // Analytics
  async getAnalytics() {
    const response = await fetch(`${API_BASE_URL}/employer/analytics`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch analytics');
    }

    return response.json();
  }

  async exportApplicationData(jobId: string) {
    const response = await fetch(`${API_BASE_URL}/employer/applications/export/${jobId}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to export application data');
    }

    return response.json();
  }

  // Candidates Management
  async getCandidates(params: {
    page?: number;
    limit?: number;
    skills?: string;
    location?: string;
    experience?: string;
  } = {}) {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.skills) searchParams.append('skills', params.skills);
    if (params.location) searchParams.append('location', params.location);
    if (params.experience) searchParams.append('experience', params.experience);

    const response = await fetch(`${API_BASE_URL}/employer/candidates?${searchParams}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch candidates');
    }

    return response.json();
  }

  async getCandidateDetails(candidateId: string) {
    const response = await fetch(`${API_BASE_URL}/employer/candidates/${candidateId}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch candidate details');
    }

    return response.json();
  }

  async searchCandidates(params: {
    q?: string;
    skills?: string;
    location?: string;
    experience?: string;
  } = {}) {
    const searchParams = new URLSearchParams();
    if (params.q) searchParams.append('q', params.q);
    if (params.skills) searchParams.append('skills', params.skills);
    if (params.location) searchParams.append('location', params.location);
    if (params.experience) searchParams.append('experience', params.experience);

    const response = await fetch(`${API_BASE_URL}/employer/candidates/search?${searchParams}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to search candidates');
    }

    return response.json();
  }

  // Settings
  async getJobPostingSettings() {
    const response = await fetch(`${API_BASE_URL}/employer/settings/job-posting`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch job posting settings');
    }

    return response.json();
  }

  async updateJobPostingSettings(settings: any) {
    const response = await fetch(`${API_BASE_URL}/employer/settings/job-posting`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(settings),
    });

    if (!response.ok) {
      throw new Error('Failed to update job posting settings');
    }

    return response.json();
  }

  // Company Profile Management
  async getCompanyProfile() {
    const response = await fetch(`${API_BASE_URL}/employer/company-profile`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch company profile');
    }

    return response.json();
  }

  async updateCompanyProfile(profileData: any) {
    const response = await fetch(`${API_BASE_URL}/employer/company-profile`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(profileData),
    });

    if (!response.ok) {
      throw new Error('Failed to update company profile');
    }

    return response.json();
  }

  async submitCompanyProfileForApproval() {
    const response = await fetch(`${API_BASE_URL}/employer/company-profile/submit`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to submit company profile for approval');
    }

    return response.json();
  }

  async uploadCompanyDocument(formData: FormData) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/employer/company-profile/upload-document`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload document');
    }

    return response.json();
  }

  async deleteCompanyDocument(documentId: string) {
    const response = await fetch(`${API_BASE_URL}/employer/company-profile/documents/${documentId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to delete document');
    }

    return response.json();
  }

  // Talent Pool and Candidate Management
  async getTalentPool(params: {
    page?: number;
    limit?: number;
    skills?: string;
    location?: string;
    experience?: string;
    availability?: string;
  } = {}) {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.skills) searchParams.append('skills', params.skills);
    if (params.location) searchParams.append('location', params.location);
    if (params.experience) searchParams.append('experience', params.experience);
    if (params.availability) searchParams.append('availability', params.availability);

    const response = await fetch(`${API_BASE_URL}/employer/talent-pool?${searchParams}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch talent pool');
    }

    return response.json();
  }

  async saveCandidate(candidateId: string) {
    const response = await fetch(`${API_BASE_URL}/employer/saved-candidates`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ candidateId }),
    });

    if (!response.ok) {
      throw new Error('Failed to save candidate');
    }

    return response.json();
  }

  async unsaveCandidate(candidateId: string) {
    const response = await fetch(`${API_BASE_URL}/employer/saved-candidates/${candidateId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to unsave candidate');
    }

    return response.json();
  }

  async getSavedCandidates(params: {
    page?: number;
    limit?: number;
  } = {}) {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());

    const response = await fetch(`${API_BASE_URL}/employer/saved-candidates?${searchParams}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch saved candidates');
    }

    return response.json();
  }

  async downloadCandidateCV(candidateId: string): Promise<{ blob: Blob; filename: string; contentType: string }> {
    const response = await fetch(`${API_BASE_URL}/employer/candidates/${candidateId}/cv`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to download CV');
    }

    const blob = await response.blob();
    const contentType = response.headers.get('content-type') || 'application/pdf';
    
    // Determine file extension based on content type
    let fileExtension = 'pdf'; // default
    if (contentType.includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document')) {
      fileExtension = 'docx';
    } else if (contentType.includes('application/msword')) {
      fileExtension = 'doc';
    } else if (contentType.includes('application/pdf')) {
      fileExtension = 'pdf';
    } else if (contentType.includes('text/plain')) {
      fileExtension = 'txt';
    } else if (contentType.includes('application/rtf')) {
      fileExtension = 'rtf';
    }

    // Try to get filename from Content-Disposition header
    const contentDisposition = response.headers.get('content-disposition');
    let filename = `CV.${fileExtension}`;
    
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1].replace(/['"]/g, '');
      }
    }

    return { blob, filename, contentType };
  }

  async updateCandidateNotes(candidateId: string, notes: string) {
    const response = await fetch(`${API_BASE_URL}/employer/candidates/${candidateId}/notes`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ notes }),
    });

    if (!response.ok) {
      throw new Error('Failed to update candidate notes');
    }

    return response.json();
  }

  async getHiredCandidates(params: {
    page?: number;
    limit?: number;
    status?: string;
  } = {}) {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.status && params.status !== 'all') searchParams.append('status', params.status);

    const response = await fetch(`${API_BASE_URL}/employer/hired-candidates?${searchParams}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch hired candidates');
    }

    return response.json();
  }

  // Interview Management
  async getInterviews(params: {
    page?: number;
    limit?: number;
    status?: string;
  } = {}) {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.status && params.status !== 'all') searchParams.append('status', params.status);

    const response = await fetch(`${API_BASE_URL}/employer/interviews?${searchParams}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch interviews');
    }

    return response.json();
  }

  async scheduleNewInterview(interviewData: {
    candidateId: string;
    jobId: string;
    scheduledDate: string;
    interviewType: string;
    duration: number;
    interviewer: string;
    notes?: string;
    meetingLink?: string;
    location?: string;
  }) {
    const response = await fetch(`${API_BASE_URL}/employer/interviews/schedule`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(interviewData),
    });

    if (!response.ok) {
      throw new Error('Failed to schedule interview');
    }

    return response.json();
  }

  async updateInterviewStatus(interviewId: string, status: string) {
    const response = await fetch(`${API_BASE_URL}/employer/interviews/${interviewId}/status`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      throw new Error('Failed to update interview status');
    }

    return response.json();
  }

  async submitInterviewFeedback(interviewId: string, feedbackData: {
    rating: number;
    technicalSkills: number;
    communication: number;
    culturalFit: number;
    experience: number;
    comments: string;
    recommendation: string;
  }) {
    const response = await fetch(`${API_BASE_URL}/employer/interviews/${interviewId}/feedback`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(feedbackData),
    });

    if (!response.ok) {
      throw new Error('Failed to submit interview feedback');
    }

    return response.json();
  }

  // Contact Management
  async contactCandidate(candidateId: string, messageData: {
    subject: string;
    message: string;
  }) {
    const response = await fetch(`${API_BASE_URL}/employer/candidates/${candidateId}/contact`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(messageData),
    });

    if (!response.ok) {
      throw new Error('Failed to contact candidate');
    }

    return response.json();
  }



  async getJobById(jobId: string) {
    const response = await fetch(`${API_BASE_URL}/employer/jobs/${jobId}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch job');
    }

    return response.json();
  }

  async publishJob(jobId: string) {
    const response = await fetch(`${API_BASE_URL}/employer/jobs/${jobId}/publish`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to publish job');
    }

    return response.json();
  }

  async pauseJob(jobId: string) {
    const response = await fetch(`${API_BASE_URL}/employer/jobs/${jobId}/pause`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to pause job');
    }

    return response.json();
  }

  async closeJob(jobId: string) {
    const response = await fetch(`${API_BASE_URL}/employer/jobs/${jobId}/close`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to close job');
    }

    return response.json();
  }

  // Analytics for specific job
  async getJobAnalytics(jobId: string) {
    const response = await fetch(`${API_BASE_URL}/employer/jobs/${jobId}/analytics`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch job analytics');
    }

    return response.json();
  }

  // Get available psychometric tests
  async getPsychometricTests() {
    const response = await fetch(`${API_BASE_URL}/employer/psychometric-tests`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch psychometric tests');
    }

    return response.json();
  }

  // AI Shortlisting
  async aiShortlistCandidates(data: { jobId: string; maxCandidates?: number; postingType?: 'job' | 'internship' }) {
    const response = await fetch(`${API_BASE_URL}/employer/ai-shortlist`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to perform AI shortlisting');
    }

    return response.json();
  }

  async applyAIShortlisting(data: { applicationIds: string[]; notes?: string }) {
    const response = await fetch(`${API_BASE_URL}/employer/ai-shortlist/apply`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to apply AI shortlisting');
    }

    return response.json();
  }


}

export const employerService = new EmployerService();
export default employerService;