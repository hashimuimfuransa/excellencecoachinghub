import api from './api';

export interface InternshipFormData {
  title: string;
  description: string;
  company: string;
  department: string;
  location: string;
  numberOfPositions: number;
  applicationProcedure: string;
  internshipPeriod: {
    startDate: string;
    endDate: string;
    duration: string;
  };
  isPaid: boolean;
  stipend?: {
    amount: number;
    currency: string;
    frequency: string;
  };
  expectedStartDate: string;
  expectedEndDate: string;
  experienceLevel: string;
  educationLevel: string;
  skills: string[];
  requirements: string[];
  responsibilities: string[];
  benefits: string[];
  learningObjectives: string[];
  mentorshipProvided: boolean;
  certificateProvided: boolean;
  applicationDeadline?: string;
  psychometricTestRequired: boolean;
  psychometricTests: string[];
  workArrangement: string;
  contactInfo?: {
    email?: string;
    phone?: string;
    website?: string;
    address?: string;
    contactPerson?: string;
    applicationInstructions?: string;
  };
}

class InternshipService {
  // Create a new internship
  async createInternship(internshipData: InternshipFormData) {
    const response = await api.post('/internships', internshipData);
    return response.data;
  }

  // Get all internships with filters
  async getInternships(params: {
    page?: number;
    limit?: number;
    status?: string;
    experienceLevel?: string;
    educationLevel?: string;
    location?: string;
    workArrangement?: string;
    skills?: string[];
    isPaid?: boolean;
    isCurated?: boolean;
    department?: string;
    search?: string;
  } = {}) {
    const response = await api.get('/internships', { params });
    return response.data;
  }

  // Get internship by ID
  async getInternshipById(id: string) {
    const response = await api.get(`/internships/${id}`);
    return response.data;
  }

  // Get internships by employer
  async getMyInternships(params: {
    page?: number;
    limit?: number;
    status?: string;
  } = {}) {
    const response = await api.get('/internships/employer/my-internships', { params });
    return response.data;
  }

  // Update internship
  async updateInternship(id: string, internshipData: Partial<InternshipFormData>) {
    const response = await api.put(`/internships/${id}`, internshipData);
    return response.data;
  }

  // Delete internship
  async deleteInternship(id: string) {
    try {
      console.log('Attempting to delete internship with ID:', id);
      const response = await api.delete(`/internships/${id}`);
      console.log('Delete response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Delete internship error:', error);
      console.error('Error response:', error.response?.data);
      throw error;
    }
  }

  // Get curated internships
  async getCuratedInternships(params: {
    page?: number;
    limit?: number;
  } = {}) {
    const response = await api.get('/internships/curated', { params });
    return response.data;
  }

  // Get internships for students
  async getInternshipsForStudent(params: {
    page?: number;
    limit?: number;
    experienceLevel?: string;
    educationLevel?: string;
    skills?: string[];
    location?: string;
    isPaid?: boolean;
    workArrangement?: string;
    department?: string;
  } = {}) {
    const response = await api.get('/internships/student/available', { params });
    return response.data;
  }

  // Get internship categories
  async getInternshipCategories() {
    const response = await api.get('/internships/categories');
    return response.data;
  }

  // Apply for internship (using existing job application system)
  async applyForInternship(internshipId: string, applicationData: {
    coverLetter?: string;
    resumeUrl?: string;
    portfolioUrl?: string;
    linkedInUrl?: string;
    githubUrl?: string;
    additionalInfo?: string;
  }) {
    const response = await api.post(`/job-applications/${internshipId}/apply`, {
      ...applicationData,
      jobType: 'internship'
    });
    return response.data;
  }
}

export const internshipService = new InternshipService();