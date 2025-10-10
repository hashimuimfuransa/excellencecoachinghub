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
    extractedQuestions?: any[];
  };
  // Enhanced assignment features
  questions?: AssignmentQuestion[];
  hasQuestions?: boolean;
  autoSubmit?: boolean;
  timeLimit?: number; // in minutes
  extractedQuestions?: any[];
  aiProcessingStatus?: 'not_started' | 'pending' | 'completed' | 'failed' | 'no_questions_found';
  aiExtractionStatus?: 'pending' | 'completed' | 'failed';
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

  // Toggle assignment publish status
  async toggleAssignmentPublish(assignmentId: string, status: 'published' | 'draft'): Promise<Assignment> {
    try {
      const response = await api.patch(`/assignments/${assignmentId}/publish`, { status });
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to toggle assignment publish status:', error);
      throw new Error(error.response?.data?.message || 'Failed to update assignment status');
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

  // Extract questions from document (like assessments)
  async extractQuestionsFromDocument(assignmentId: string, file: File): Promise<Assignment> {
    try {
      const formData = new FormData();
      formData.append('document', file);

      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/assignments/${assignmentId}/extract-questions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        return result.data.assignment;
      }
      
      throw new Error(result.error || 'Failed to extract questions from document');
    } catch (error: any) {
      console.error('Failed to extract questions:', error);
      throw new Error(error.message || 'Failed to extract questions from document');
    }
  }

  // Replace questions from document (like assessments)
  async replaceQuestionsFromDocument(assignmentId: string, file: File): Promise<Assignment> {
    try {
      const formData = new FormData();
      formData.append('document', file);

      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/assignments/${assignmentId}/replace-questions`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        return result.data.assignment;
      }
      
      throw new Error(result.error || 'Failed to replace questions from document');
    } catch (error: any) {
      console.error('Failed to replace questions:', error);
      throw new Error(error.message || 'Failed to replace questions from document');
    }
  }

  // Check AI processing status
  async checkAIProcessingStatus(assignmentId: string): Promise<{
    success: boolean;
    data: {
      assignmentId: string;
      aiProcessingStatus: string;
      questionsCount: number;
      extractedQuestionsCount: number;
      hasQuestions: boolean;
      processingError?: string;
      lastUpdated: string;
    };
  }> {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/assignments/${assignmentId}/ai-status`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        return result;
      }
      
      throw new Error(result.error || 'Failed to check AI processing status');
    } catch (error: any) {
      console.error('Failed to check AI processing status:', error);
      throw new Error(error.message || 'Failed to check AI processing status');
    }
  }

  // Retry question extraction
  async retryQuestionExtraction(assignmentId: string): Promise<{
    success: boolean;
    message: string;
    data: {
      assignmentId: string;
      queueStatus: any;
      estimatedWaitTime: string;
    };
  }> {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/assignments/${assignmentId}/retry-extraction`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        return result;
      }
      
      throw new Error(result.error || 'Failed to retry question extraction');
    } catch (error: any) {
      console.error('Failed to retry question extraction:', error);
      throw new Error(error.message || 'Failed to retry question extraction');
    }
  }

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

  // Synchronous assignment question extraction (like assessments)
  async extractAssignmentQuestionsSync(assignmentId: string, file: File): Promise<Assignment> {
    try {
      const formData = new FormData();
      formData.append('document', file);

      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/assignments/${assignmentId}/extract-sync`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        return result.data.assignment;
      }
      
      throw new Error(result.error || 'Failed to extract questions from document');
    } catch (error: any) {
      console.error('Failed to extract questions synchronously:', error);
      throw new Error(error.message || 'Failed to extract questions from document');
    }
  }

  // Debug AI processing (manual trigger)
  async debugAIProcessing(assignmentId: string): Promise<{
    success: boolean;
    message: string;
    data?: any;
  }> {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/assignments/${assignmentId}/debug-ai`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        return result;
      }
      
      throw new Error(result.error || 'Failed to debug AI processing');
    } catch (error: any) {
      console.error('Failed to debug AI processing:', error);
      throw new Error(error.message || 'Failed to debug AI processing');
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

  // Grading Methods (like assessments)

  // Get assignment submissions for grading
  async getAssignmentSubmissions(assignmentId: string, filters: any = {}): Promise<{
    submissions: AssignmentSubmission[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
    };
  }> {
    try {
      const queryParams = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, String(value));
        }
      });

      const response = await api.get(`/assignments/${assignmentId}/submissions?${queryParams.toString()}`);
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      
      throw new Error(response.data.error || 'Failed to fetch submissions');
    } catch (error: any) {
      console.error('Failed to fetch assignment submissions:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch submissions');
    }
  }

  // Grade submission manually (like assessments)
  async gradeSubmission(submissionId: string, gradingData: {
    answers?: any[];
    feedback?: string;
    score?: number;
    percentage?: number;
  }): Promise<AssignmentSubmission> {
    try {
      const response = await api.put(`/assignments/submissions/${submissionId}/grade`, gradingData);
      
      if (response.data.success && response.data.data) {
        return response.data.data.submission;
      }
      
      throw new Error(response.data.error || 'Failed to grade submission');
    } catch (error: any) {
      console.error('Failed to grade submission:', error);
      throw new Error(error.response?.data?.message || 'Failed to grade submission');
    }
  }

  // Get submission details for grading
  async getSubmissionDetails(submissionId: string): Promise<AssignmentSubmission> {
    try {
      const response = await api.get(`/assignments/submissions/${submissionId}`);
      
      if (response.data.success && response.data.data) {
        return response.data.data.submission;
      }
      
      throw new Error(response.data.error || 'Failed to fetch submission details');
    } catch (error: any) {
      console.error('Failed to fetch submission details:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch submission details');
    }
  }

  // Save assignment progress (auto-save functionality)
  async saveAssignmentProgress(progressData: {
    assignmentId: string;
    extractedAnswers: Array<{
      questionIndex: number;
      answer: string;
      questionType: string;
      timeSpent: number;
      attempts: number;
    }>;
    autoSaved?: boolean;
    status?: string;
  }): Promise<AssignmentSubmission> {
    try {
      const response = await api.post(`/assignments/${progressData.assignmentId}/save-progress`, {
        extractedAnswers: progressData.extractedAnswers,
        autoSaved: progressData.autoSaved || true,
        status: progressData.status || 'draft'
      });
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to save assignment progress:', error);
      throw new Error(error.response?.data?.message || 'Failed to save progress');
    }
  }

  // Submit assignment with extracted answers for AI grading
  async submitAssignmentWithExtractedAnswers(submissionData: {
    assignmentId: string;
    extractedAnswers: Array<{
      questionIndex: number;
      answer: string;
      questionType: string;
      timeSpent: number;
      attempts: number;
      flagged?: boolean;
      submittedAt?: Date;
    }>;
    submissionText?: string;
    finalSubmission?: boolean;
    isAutoSubmit?: boolean;
    timeSpent?: number;
    submittedAt?: Date;
    status?: string;
  }): Promise<AssignmentSubmission> {
    try {
      const response = await api.post(`/assignments/${submissionData.assignmentId}/submit-extracted`, {
        extractedAnswers: submissionData.extractedAnswers,
        submissionText: submissionData.submissionText,
        finalSubmission: submissionData.finalSubmission || true,
        isAutoSubmit: submissionData.isAutoSubmit || false,
        timeSpent: submissionData.timeSpent || 0,
        submittedAt: submissionData.submittedAt || new Date(),
        status: submissionData.status || 'submitted'
      });
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to submit assignment with extracted answers:', error);
      throw new Error(error.response?.data?.message || 'Failed to submit assignment');
    }
  }

  // Get assignment submission (for loading existing progress)
  async getAssignmentSubmission(assignmentId: string): Promise<AssignmentSubmission | null> {
    try {
      const response = await api.get(`/assignments/${assignmentId}/submission`);
      return response.data.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null; // No submission found
      }
      console.error('Failed to fetch assignment submission:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch submission');
    }
  }

  // Create assignment with document upload (like assessments)
  async createAssignmentWithDocument(assignmentData: CreateAssignmentData, file?: File): Promise<Assignment> {
    try {
      if (file) {
        // Create FormData for file upload
        const formData = new FormData();
        
        // Add file
        formData.append('document', file);
        
        // Add assignment data
        Object.entries(assignmentData).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (typeof value === 'object' && !Array.isArray(value)) {
              formData.append(key, JSON.stringify(value));
            } else if (Array.isArray(value)) {
              formData.append(key, JSON.stringify(value));
            } else {
              formData.append(key, value.toString());
            }
          }
        });

        // Use fetch directly for file upload
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/assignments`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        });

        const result = await response.json();
        
        if (response.ok && result.success) {
          return result.data;
        }
        
        throw new Error(result.error || 'Failed to create assignment');
      } else {
        // Regular JSON request without file
        const response = await api.post('/assignments', assignmentData);
        
        if (response.data.success && response.data.data) {
          return response.data.data;
        }
        
        throw new Error(response.data.error || 'Failed to create assignment');
      }
    } catch (error: any) {
      console.error('Failed to create assignment:', error);
      throw new Error(error.message || 'Failed to create assignment');
    }
  }
}

export const assignmentService = new AssignmentService();
export default assignmentService;