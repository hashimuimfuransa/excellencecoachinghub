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

export interface AssignmentQuestion {
  _id: string;
  question: string;
  type: 'multiple_choice' | 'multiple_choice_multiple' | 'true_false' | 'short_answer' | 'essay' | 'fill_in_blank' | 'numerical' | 'matching';
  options?: string[];
  correctAnswer?: string | string[];
  points: number;
  section?: string;
  sectionTitle?: string;
  leftItems?: string[];
  rightItems?: string[];
  matchingPairs?: Array<{ left: string; right: string; }>;
}

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
  assignmentDocument?: {
    filename: string;
    originalName: string;
    fileUrl: string;
    fileSize: number;
    uploadedAt: Date;
  };
  // Enhanced assignment features
  questions?: AssignmentQuestion[];
  hasQuestions?: boolean;
  autoSubmit?: boolean;
  timeLimit?: number; // in minutes
  extractedQuestions?: AssignmentQuestion[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AssignmentSection {
  id: string;
  title: string;
  content: string;
  type: 'text' | 'essay' | 'code' | 'math';
  completed: boolean;
}

export interface AssignmentSubmission {
  _id: string;
  assignment: string;
  student: string;
  submissionText?: string;
  sections?: AssignmentSection[];
  attachments: Array<{
    filename: string;
    originalName: string;
    fileUrl: string;
    fileSize: number;
    uploadedAt: Date;
  }>;
  submittedAt?: Date;
  isLate: boolean;
  status: 'draft' | 'submitted' | 'graded' | 'returned';
  grade?: number;
  feedback?: string;
  autoSubmitted?: boolean;
  aiGrade?: {
    score: number;
    feedback: string;
    confidence: number;
    gradedAt: Date;
  };
  gradedAt?: Date;
  gradedBy?: string;
  version: number;
  autoSavedAt?: Date;
}

export interface SubmissionData {
  assignmentId: string;
  submissionText?: string;
  sections?: AssignmentSection[];
  attachments?: Array<{
    filename: string;
    originalName: string;
    fileUrl: string;
    fileSize: number;
  }>;
  isDraft?: boolean;
  autoSubmit?: boolean;
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

  // Get all assignments (admin only)
  async getAllAssignments(): Promise<Assignment[]> {
    try {
      const response = await api.get('/assignments/admin/all');
      const assignments = response.data?.data?.assignments || [];
      return Array.isArray(assignments) ? assignments : [];
    } catch (error: any) {
      console.error('Failed to fetch all assignments:', error);
      return [];
    }
  }

  // Get course assignments
  async getCourseAssignments(courseId: string): Promise<Assignment[]> {
    try {
      console.log('🔍 Fetching assignments for course:', courseId);
      console.log('🌐 API Base URL:', api.defaults.baseURL);
      console.log('🔗 Full URL:', `${api.defaults.baseURL}/assignments/course/${courseId}`);
      
      const response = await api.get(`/assignments/course/${courseId}`);
      console.log('✅ Assignment response received:', response.data);

      // Backend returns: { success: true, data: { assignments: [...], count: N } }
      const assignments = response.data?.data?.assignments || [];
      console.log('📋 Extracted assignments:', assignments);
      
      return Array.isArray(assignments) ? assignments : [];
    } catch (error: any) {
      console.error('❌ Failed to fetch course assignments:', error);
      console.error('❌ Error details:', {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        status: error.response?.status
      });
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
        attachments: submissionData.attachments,
        sections: submissionData.sections,
        isDraft: submissionData.isDraft || false,
        autoSubmit: submissionData.autoSubmit || false
      });
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to submit assignment:', error);
      throw new Error(error.response?.data?.message || error.response?.data?.error || 'Failed to submit assignment');
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

  // Upload assignment document (instructor)
  async uploadAssignmentDocument(assignmentId: string, file: File): Promise<Assignment> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post(`/assignments/${assignmentId}/upload-document`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to upload assignment document:', error);
      throw new Error(error.response?.data?.error || 'Failed to upload assignment document');
    }
  }

  // Replace assignment document (instructor) - removes old document and uploads new one
  async replaceAssignmentDocument(assignmentId: string, file: File): Promise<Assignment> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.put(`/assignments/${assignmentId}/replace-document`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to replace assignment document:', error);
      throw new Error(error.response?.data?.error || 'Failed to replace assignment document');
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

  // Get submission history
  async getSubmissionHistory(assignmentId: string): Promise<any[]> {
    try {
      const response = await api.get(`/assignments/${assignmentId}/submission-history`);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch submission history');
    }
  }

  // Update AI grade
  async updateAIGrade(submissionId: string, aiGradeData: {
    score: number;
    feedback: string;
    confidence: number;
    gradedAt?: Date;
  }): Promise<AssignmentSubmission> {
    try {
      const response = await api.post(`/assignments/submissions/${submissionId}/ai-grade`, aiGradeData);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update AI grade');
    }
  }

  // Enhanced Assignment Methods

  // Save assignment draft with questions support
  async saveDraft(draftData: {
    assignmentId: string;
    answers?: Array<{
      questionId: string;
      answer: string;
      timeSpent: number;
      attachments?: File[];
    }>;
    submissionText?: string;
    attachments?: File[];
    isDraft?: boolean;
  }): Promise<AssignmentSubmission> {
    try {
      const response = await api.post('/assignments/save-draft', draftData);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to save draft');
    }
  }

  // Submit assignment with questions support
  async submitAssignmentWithQuestions(submissionData: {
    assignmentId: string;
    answers?: Array<{
      questionId: string;
      answer: string;
      timeSpent: number;
      attachments?: File[];
    }>;
    textResponse?: string;
    attachments?: File[];
    finalSubmission?: boolean;
    isAutoSubmit?: boolean;
  }): Promise<AssignmentSubmission> {
    try {
      const response = await api.post(`/assignments/${submissionData.assignmentId}/submit`, {
        answers: submissionData.answers,
        textResponse: submissionData.textResponse,
        attachments: submissionData.attachments,
        finalSubmission: submissionData.finalSubmission,
        isAutoSubmit: submissionData.isAutoSubmit
      });
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to submit assignment:', error);
      throw new Error(error.response?.data?.message || 'Failed to submit assignment');
    }
  }

  // Create assignment with questions extraction
  async createAssignmentWithQuestions(assignmentData: {
    title: string;
    description: string;
    instructions: string;
    courseId: string;
    dueDate: Date;
    maxPoints: number;
    submissionType: 'file' | 'text' | 'both';
    allowedFileTypes: string[];
    maxFileSize: number;
    isRequired: boolean;
    hasQuestions?: boolean;
    autoSubmit?: boolean;
    timeLimit?: number;
    extractQuestions?: boolean;
  }, file?: File): Promise<Assignment> {
    try {
      const formData = new FormData();
      
      // Add assignment data
      Object.entries(assignmentData).forEach(([key, value]) => {
        if (value !== undefined) {
          formData.append(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
        }
      });

      // Add file if provided
      if (file) {
        formData.append('file', file);
      }

      const response = await api.post('/assignments/create-enhanced', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to create enhanced assignment:', error);
      throw new Error(error.response?.data?.error || 'Failed to create assignment');
    }
  }

  // Get assignment with questions
  async getAssignmentWithQuestions(assignmentId: string): Promise<Assignment> {
    try {
      const response = await api.get(`/assignments/${assignmentId}/enhanced`);
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to fetch enhanced assignment:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch assignment');
    }
  }

  // Get assignment submission with answers
  async getSubmissionWithAnswers(assignmentId: string): Promise<AssignmentSubmission | null> {
    try {
      const response = await api.get(`/assignments/${assignmentId}/submission/enhanced`);
      return response.data.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null; // No submission found
      }
      console.error('Failed to fetch enhanced submission:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch submission');
    }
  }

  // Grade assignment automatically
  async autoGradeAssignment(submissionId: string): Promise<{
    score: number;
    feedback: string;
    gradedAnswers: Array<{
      questionId: string;
      score: number;
      feedback: string;
      isCorrect: boolean;
    }>;
  }> {
    try {
      const response = await api.post(`/assignments/submissions/${submissionId}/auto-grade`);
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to auto-grade assignment:', error);
      throw new Error(error.response?.data?.message || 'Failed to auto-grade assignment');
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

  // AI Extraction Methods

  // Get extracted questions from assignment
  async getExtractedQuestions(assignmentId: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await api.get(`/assignments/${assignmentId}/extracted-questions`);
      return { success: true, data: response.data.data };
    } catch (error: any) {
      console.error('Failed to get extracted questions:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to get extracted questions' 
      };
    }
  }

  // Submit answers to extracted questions
  async submitExtractedAssignment(assignmentId: string, answers: { [questionId: string]: any }): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await api.post(`/assignments/${assignmentId}/submit-extracted`, { answers });
      return { success: true, data: response.data.data };
    } catch (error: any) {
      console.error('Failed to submit extracted assignment:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to submit assignment' 
      };
    }
  }

  // Trigger AI extraction for assignment
  async triggerAIExtraction(assignmentId: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await api.post(`/assignments/${assignmentId}/trigger-extraction`);
      return { success: true, data: response.data.data };
    } catch (error: any) {
      console.error('Failed to trigger AI extraction:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to trigger AI extraction' 
      };
    }
  }

  // Get assignment with extraction status
  async getAssignmentWithExtraction(assignmentId: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await api.get(`/assignments/${assignmentId}/with-extraction`);
      return { success: true, data: response.data.data };
    } catch (error: any) {
      console.error('Failed to get assignment with extraction:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to get assignment' 
      };
    }
  }

  // Submit assignment (enhanced to handle both traditional and extracted)
  async submitAssignmentEnhanced(formData: FormData): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await api.post('/assignments/submit', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return { success: true, data: response.data.data };
    } catch (error: any) {
      console.error('Failed to submit assignment:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to submit assignment' 
      };
    }
  }
}

export const assignmentService = new AssignmentService();
export default assignmentService;