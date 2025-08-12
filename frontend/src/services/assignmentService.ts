import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface Assignment {
  _id: string;
  title: string;
  description: string;
  instructions: string;
  course: string;
  instructor: string;
  dueDate: Date;
  maxPoints: number;
  submissionType: 'file' | 'text' | 'both';
  allowedFileTypes: string[];
  maxFileSize: number;
  isRequired: boolean;
  status: 'draft' | 'published' | 'closed';
  createdAt: Date;
  updatedAt: Date;
}

export interface AssignmentSubmission {
  _id: string;
  assignment: string;
  student: string;
  submissionText?: string;
  attachments: Array<{
    filename: string;
    originalName: string;
    fileUrl: string;
    fileSize: number;
    uploadedAt: Date;
  }>;
  submittedAt: Date;
  isLate: boolean;
  status: 'submitted' | 'graded' | 'returned';
  grade?: number;
  feedback?: string;
  gradedAt?: Date;
  gradedBy?: string;
}

export interface SubmissionData {
  assignmentId: string;
  submissionText?: string;
  attachments: Array<{
    filename: string;
    originalName: string;
    fileUrl: string;
    fileSize: number;
  }>;
}

export interface CreateAssignmentData {
  title: string;
  description: string;
  instructions: string;
  courseId: string;
  dueDate: string;
  maxPoints: number;
  submissionType: 'file' | 'text' | 'both';
  allowedFileTypes: string[];
  maxFileSize: number;
  isRequired: boolean;
}

class AssignmentService {
  // Create assignment
  async createAssignment(assignmentData: CreateAssignmentData): Promise<Assignment> {
    try {
      const response = await api.post('/assignments', assignmentData);
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to create assignment:', error);
      throw new Error(error.response?.data?.message || 'Failed to create assignment');
    }
  }

  // Update assignment
  async updateAssignment(assignmentId: string, assignmentData: Partial<CreateAssignmentData>): Promise<Assignment> {
    try {
      const response = await api.put(`/assignments/${assignmentId}`, assignmentData);
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to update assignment:', error);
      throw new Error(error.response?.data?.message || 'Failed to update assignment');
    }
  }

  // Delete assignment
  async deleteAssignment(assignmentId: string): Promise<void> {
    try {
      await api.delete(`/assignments/${assignmentId}`);
    } catch (error: any) {
      console.error('Failed to delete assignment:', error);
      throw new Error(error.response?.data?.message || 'Failed to delete assignment');
    }
  }

  // Get course assignments
  async getCourseAssignments(courseId: string): Promise<Assignment[]> {
    try {
      const response = await api.get(`/assignments/course/${courseId}`);
      // Ensure we always return an array
      const assignments = response.data?.data?.assignments || response.data?.data || [];
      return Array.isArray(assignments) ? assignments : [];
    } catch (error: any) {
      console.error('Failed to fetch course assignments:', error);
      // Return empty array on error instead of throwing
      return [];
    }
  }

  // Get assignment by ID
  async getAssignmentById(assignmentId: string): Promise<Assignment> {
    try {
      const response = await api.get(`/assignments/${assignmentId}`);
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to fetch assignment:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch assignment');
    }
  }

  // Get student submissions for a course
  async getStudentSubmissions(courseId: string): Promise<AssignmentSubmission[]> {
    try {
      const response = await api.get(`/assignments/course/${courseId}/submissions`);
      // Ensure we always return an array
      const submissions = response.data?.data || [];
      return Array.isArray(submissions) ? submissions : [];
    } catch (error: any) {
      console.error('Failed to fetch student submissions:', error);
      // Return empty array on error instead of throwing
      return [];
    }
  }

  // Get submission by assignment ID
  async getSubmissionByAssignment(assignmentId: string): Promise<AssignmentSubmission | null> {
    try {
      const response = await api.get(`/assignments/${assignmentId}/submission`);
      return response.data.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null; // No submission found
      }
      console.error('Failed to fetch submission:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch submission');
    }
  }

  // Submit assignment
  async submitAssignment(submissionData: SubmissionData): Promise<AssignmentSubmission> {
    try {
      const response = await api.post(`/assignments/${submissionData.assignmentId}/submit`, {
        submissionText: submissionData.submissionText,
        attachments: submissionData.attachments
      });
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to submit assignment:', error);
      throw new Error(error.response?.data?.message || 'Failed to submit assignment');
    }
  }

  // Update assignment submission
  async updateSubmission(assignmentId: string, submissionData: Partial<SubmissionData>): Promise<AssignmentSubmission> {
    try {
      const response = await api.put(`/assignments/${assignmentId}/submission`, submissionData);
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to update submission:', error);
      throw new Error(error.response?.data?.message || 'Failed to update submission');
    }
  }

  // Delete assignment submission
  async deleteSubmission(assignmentId: string): Promise<void> {
    try {
      await api.delete(`/assignments/${assignmentId}/submission`);
    } catch (error: any) {
      console.error('Failed to delete submission:', error);
      throw new Error(error.response?.data?.message || 'Failed to delete submission');
    }
  }

  // Get assignment statistics
  async getAssignmentStats(assignmentId: string): Promise<any> {
    try {
      const response = await api.get(`/assignments/${assignmentId}/stats`);
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to fetch assignment stats:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch assignment statistics');
    }
  }

  // Get assignments by status
  async getAssignmentsByStatus(courseId: string, status: string): Promise<Assignment[]> {
    try {
      const response = await api.get(`/assignments/course/${courseId}`, {
        params: { status }
      });
      return response.data.data || [];
    } catch (error: any) {
      console.error('Failed to fetch assignments by status:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch assignments');
    }
  }

  // Get upcoming assignments
  async getUpcomingAssignments(courseId: string, days: number = 7): Promise<Assignment[]> {
    try {
      const response = await api.get(`/assignments/course/${courseId}/upcoming`, {
        params: { days }
      });
      return response.data.data || [];
    } catch (error: any) {
      console.error('Failed to fetch upcoming assignments:', error);
      return [];
    }
  }

  // Get overdue assignments
  async getOverdueAssignments(courseId: string): Promise<Assignment[]> {
    try {
      const response = await api.get(`/assignments/course/${courseId}/overdue`);
      return response.data.data || [];
    } catch (error: any) {
      console.error('Failed to fetch overdue assignments:', error);
      return [];
    }
  }

  // Check if assignment is submittable
  async isAssignmentSubmittable(assignmentId: string): Promise<boolean> {
    try {
      const response = await api.get(`/assignments/${assignmentId}/submittable`);
      return response.data.data || false;
    } catch (error: any) {
      console.error('Failed to check if assignment is submittable:', error);
      return false;
    }
  }

  // Get assignment submission history
  async getSubmissionHistory(assignmentId: string): Promise<AssignmentSubmission[]> {
    try {
      const response = await api.get(`/assignments/${assignmentId}/submission-history`);
      return response.data.data || [];
    } catch (error: any) {
      console.error('Failed to fetch submission history:', error);
      return [];
    }
  }

  // Download submission attachment
  async downloadSubmissionAttachment(submissionId: string, attachmentId: string): Promise<Blob> {
    try {
      const response = await api.get(`/assignments/submissions/${submissionId}/attachments/${attachmentId}`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error: any) {
      console.error('Failed to download attachment:', error);
      throw new Error(error.response?.data?.message || 'Failed to download attachment');
    }
  }

  // Get assignment rubric
  async getAssignmentRubric(assignmentId: string): Promise<any> {
    try {
      const response = await api.get(`/assignments/${assignmentId}/rubric`);
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to fetch assignment rubric:', error);
      return null;
    }
  }

  // Get peer review assignments
  async getPeerReviewAssignments(courseId: string): Promise<Assignment[]> {
    try {
      const response = await api.get(`/assignments/course/${courseId}/peer-review`);
      return response.data.data || [];
    } catch (error: any) {
      console.error('Failed to fetch peer review assignments:', error);
      return [];
    }
  }
}

export const assignmentService = new AssignmentService();
export default assignmentService;