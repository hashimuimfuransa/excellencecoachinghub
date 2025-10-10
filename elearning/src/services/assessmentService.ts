import { apiService } from './apiService';

// Helper function to get API base URL
const getApiBaseUrl = () => process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Assessment interfaces
export interface IQuestion {
  _id: string;
  id: string;
  type: 'multiple_choice' | 'multiple_choice_multiple' | 'true_false' | 'short_answer' | 'essay' | 'fill_in_blank' | 'numerical' | 'calculation' | 'mathematical';
  question: string;
  options?: string[];
  correctAnswer?: string | string[];
  points: number;
  explanation?: string;
  section?: 'A' | 'B' | 'C';
  difficulty?: 'easy' | 'medium' | 'hard';
  mathEquation?: boolean;
}

export interface IAssessment {
  documentUrl: boolean | undefined;
  _id: string;
  title: string;
  description?: string;
  course: {
    _id: string;
    title: string;
  } | string;
  instructor: {
    _id: string;
    firstName: string;
    lastName: string;
  } | string;
  type: 'quiz' | 'assignment' | 'exam' | 'project' | 'homework';
  status: 'draft' | 'published' | 'archived';
  questions: IQuestion[];
  totalPoints: number;
  totalQuestions: number;
  timeLimit?: number;
  attempts: number;
  dueDate?: string;
  scheduledDate?: Date;
  availableFrom?: string;
  availableUntil?: string;
  instructions?: string;
  isPublished: boolean;
  allowLateSubmission: boolean;
  lateSubmissionPenalty?: number;
  randomizeQuestions: boolean;
  randomizeOptions: boolean;
  showResultsImmediately: boolean;
  showCorrectAnswers: boolean;
  requireProctoring: boolean;
  requireCamera: boolean;
  aiCheatingDetection: boolean;
  proctoringEnabled: boolean;
  isRequired: boolean;
  requiredForCompletion: boolean;
  averageScore: number;
  passRate: number;
  passingScore?: number;
  gradingRubric?: string;
  attachments?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface IAssessmentSubmission {
  _id: string;
  submissionId?: string;
  assessment: IAssessment | string;
  student: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | string;
  course: {
    _id: string;
    title: string;
  };
  answers: IAnswer[];
  submittedAt?: string;
  startedAt: string;
  startTime: Date;
  completedAt?: string;
  endTime?: Date;
  timeSpent: number;
  attemptNumber: number;
  status: 'draft' | 'submitted' | 'graded' | 'returned' | 'in_progress' | 'completed' | 'abandoned';
  score?: number;
  percentage?: number;
  passed: boolean;
  grade?: string;
  feedback?: string;
  isLate: boolean;
  latePenaltyApplied?: number;
  gradedBy?: string;
  gradedAt?: string;
  aiGraded: boolean;
  requiresManualReview: boolean;
  proctoringData?: {
    faceDetections: any[];
    tabSwitches: number;
    suspiciousActivity: any[];
    screenshots: string[];
  };
  createdAt: Date;
}

export interface IAnswer {
  questionId: string;
  answer: string | string[];
  timeSpent?: number;
  isCorrect?: boolean;
  pointsEarned?: number;
  feedback?: string;
}

export interface ICreateQuestionData {
  id: string;
  type: 'multiple_choice' | 'multiple_choice_multiple' | 'true_false' | 'short_answer' | 'essay' | 'fill_in_blank' | 'numerical' | 'calculation' | 'mathematical';
  question: string;
  options?: string[];
  correctAnswer?: string | string[];
  points: number;
  explanation?: string;
  section?: 'A' | 'B' | 'C';
  difficulty?: 'easy' | 'medium' | 'hard';
  mathEquation?: boolean;
}

export interface ICreateAssessmentData {
  title: string;
  description?: string;
  courseId: string;
  type: 'quiz' | 'assignment' | 'exam' | 'project' | 'homework';
  questions: ICreateQuestionData[];
  timeLimit?: number;
  attempts?: number;
  dueDate?: string;
  availableFrom?: string;
  availableUntil?: string;
  instructions?: string;
  isPublished?: boolean;
  allowLateSubmission?: boolean;
  lateSubmissionPenalty?: number;
  randomizeQuestions?: boolean;
  randomizeOptions?: boolean;
  showResultsImmediately?: boolean;
  showCorrectAnswers?: boolean;
  requireProctoring?: boolean;
  passingScore?: number;
  gradingRubric?: string;
  attachments?: string[];
}

export interface AssessmentFilters {
  type?: string;
  courseId?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface AssessmentListResponse {
  assessments: IAssessment[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export interface SubmissionListResponse {
  submissions: IAssessmentSubmission[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

// Assessment service
export const assessmentService = {
  // Teacher methods
  // Create assessment
  createAssessment: async (assessmentData: ICreateAssessmentData, file?: File): Promise<IAssessment> => {
    if (file) {
      // Create FormData for file upload
      const formData = new FormData();
      
      // Add file
      formData.append('document', file);
      
      // Add assessment data
      Object.entries(assessmentData).forEach(([key, value]) => {
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
      const response = await fetch(`${getApiBaseUrl()}/assessments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        return result.data.assessment;
      }
      
      throw new Error(result.error || 'Failed to create assessment');
    } else {
      // Regular JSON request without file
      const response = await apiService.post<{ assessment: IAssessment }>('/assessments', assessmentData);
      
      if (response.success && response.data) {
        return response.data.assessment;
      }
      
      throw new Error(response.error || 'Failed to create assessment');
    }
  },

  // Get all assessments (admin only)
  getAllAssessments: async (filters: AssessmentFilters = {}): Promise<AssessmentListResponse> => {
    const queryParams = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    const response = await apiService.get<AssessmentListResponse>(
      `/assessments/admin?${queryParams.toString()}`
    );
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.error || 'Failed to fetch all assessments');
  },

  // Get teacher's assessments
  getTeacherAssessments: async (filters: AssessmentFilters = {}): Promise<AssessmentListResponse> => {
    const queryParams = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    const response = await apiService.get<AssessmentListResponse>(
      `/assessments/teacher?${queryParams.toString()}`
    );
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.error || 'Failed to fetch assessments');
  },

  // Get assessment by ID
  getAssessmentById: async (id: string): Promise<IAssessment> => {
    const response = await apiService.get<{ assessment: IAssessment }>(`/assessments/${id}`);
    
    if (response.success && response.data) {
      return response.data.assessment;
    }
    
    throw new Error(response.error || 'Failed to fetch assessment');
  },

  // Update assessment
  updateAssessment: async (id: string, updates: Partial<ICreateAssessmentData>): Promise<IAssessment> => {
    const response = await apiService.put<{ assessment: IAssessment }>(`/assessments/${id}`, updates);
    
    if (response.success && response.data) {
      return response.data.assessment;
    }
    
    throw new Error(response.error || 'Failed to update assessment');
  },

  // Add questions from document to existing assessment
  addQuestionsFromDocument: async (id: string, file: File): Promise<IAssessment> => {
    // Create FormData for file upload
    const formData = new FormData();
    formData.append('document', file);

    // Use fetch directly for file upload
    const token = localStorage.getItem('token');
    const response = await fetch(`${getApiBaseUrl()}/assessments/${id}/add-questions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    const result = await response.json();
    
    if (response.ok && result.success) {
      return result.data.assessment;
    }
    
    throw new Error(result.error || 'Failed to add questions from document');
  },

  // Replace questions from document in existing assessment (removes old document-extracted questions)
  replaceQuestionsFromDocument: async (id: string, file: File): Promise<IAssessment> => {
    // Create FormData for file upload
    const formData = new FormData();
    formData.append('document', file);

    // Use fetch directly for file upload
    const token = localStorage.getItem('token');
    const response = await fetch(`${getApiBaseUrl()}/assessments/${id}/replace-questions`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    const result = await response.json();
    
    if (response.ok && result.success) {
      return result.data.assessment;
    }
    
    throw new Error(result.error || 'Failed to replace questions from document');
  },

  // Delete assessment
  deleteAssessment: async (id: string): Promise<void> => {
    const response = await apiService.delete(`/assessments/${id}`);
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to delete assessment');
    }
  },

  // Toggle publish status
  togglePublishAssessment: async (id: string): Promise<IAssessment> => {
    const response = await apiService.patch<{ assessment: IAssessment }>(`/assessments/${id}/publish`);
    
    if (response.success && response.data) {
      return response.data.assessment;
    }
    
    throw new Error(response.error || 'Failed to toggle publish status');
  },

  // Get assessment submissions (Teacher)
  getAssessmentSubmissions: async (assessmentId: string, filters: AssessmentFilters = {}): Promise<SubmissionListResponse> => {
    const queryParams = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    const response = await apiService.get<SubmissionListResponse>(
      `/assessments/${assessmentId}/submissions?${queryParams.toString()}`
    );
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.error || 'Failed to fetch submissions');
  },

  // Grade submission manually
  gradeSubmission: async (submissionId: string, gradingData: {
    answers?: IAnswer[];
    feedback?: string;
    score?: number;
    percentage?: number;
  }): Promise<IAssessmentSubmission> => {
    const response = await apiService.put<{ submission: IAssessmentSubmission }>(
      `/assessments/submissions/${submissionId}/grade`,
      gradingData
    );
    
    if (response.success && response.data) {
      return response.data.submission;
    }
    
    throw new Error(response.error || 'Failed to grade submission');
  },

  // Student methods
  // Get available assessments for student
  getStudentAssessments: async (filters: AssessmentFilters = {}): Promise<AssessmentListResponse> => {
    const queryParams = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    const response = await apiService.get<AssessmentListResponse>(
      `/assessments/student/available?${queryParams.toString()}`
    );
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.error || 'Failed to fetch available assessments');
  },

  // Debug method to check student info
  debugStudentInfo: async (): Promise<any> => {
    const response = await apiService.get<{ debug: any }>('/assessments/debug/student-info');
    
    if (response.success && response.data) {
      return response.data.debug;
    }
    
    throw new Error(response.error || 'Failed to fetch debug info');
  },

  // Start assessment attempt
  startAssessment: async (assessmentId: string): Promise<{
    submission: IAssessmentSubmission;
    assessment: IAssessment;
  }> => {
    const response = await apiService.post<{
      submission: IAssessmentSubmission;
      assessment: IAssessment;
    }>(`/assessments/${assessmentId}/start`);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.error || 'Failed to start assessment');
  },

  // Save assessment progress
  saveAssessmentProgress: async (submissionId: string, data: {
    answers: IAnswer[];
    timeSpent: number;
  }): Promise<void> => {
    const response = await apiService.put(`/assessments/submissions/${submissionId}/save`, data);
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to save progress');
    }
  },

  // Submit assessment
  submitAssessment: async (data: {
    assessmentId: string;
    answers: any[];
    totalTimeSpent: number;
    proctoringData?: any;
    isAutoSubmitted?: boolean;
  }): Promise<IAssessmentSubmission & { submissionId: string }> => {
    const response = await apiService.post<{ submission: IAssessmentSubmission }>(
      `/assessments/${data.assessmentId}/submit`,
      data
    );

    if (response.success && response.data) {
      const submission = response.data.submission;
      return {
        ...submission,
        submissionId: submission.submissionId || submission._id
      };
    }

    throw new Error(response.error || 'Failed to submit assessment');
  },

  // Get student's submissions
  getStudentSubmissions: async (filters: AssessmentFilters = {}): Promise<SubmissionListResponse> => {
    const queryParams = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    const response = await apiService.get<SubmissionListResponse>(
      `/assessments/student/submissions?${queryParams.toString()}`
    );
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.error || 'Failed to fetch submissions');
  },

  // Get submission details
  getSubmissionDetails: async (submissionId: string): Promise<IAssessmentSubmission> => {
    const response = await apiService.get<{ submission: IAssessmentSubmission }>(
      `/assessments/submissions/${submissionId}`
    );
    
    if (response.success && response.data) {
      return response.data.submission;
    }
    
    throw new Error(response.error || 'Failed to fetch submission details');
  },

  // Get course assessments (for student course view)
  getCourseAssessments: async (courseId: string): Promise<IAssessment[]> => {
    try {
      const response = await apiService.get<{ assessments: IAssessment[] }>(`/assessments/course/${courseId}`);
      
      if (response.success && response.data) {
        return response.data.assessments || [];
      }
      
      throw new Error(response.error || 'Failed to fetch course assessments');
    } catch (error: any) {
      console.error('Failed to fetch course assessments:', error);
      return [];
    }
  },

  // Get student attempts for a course
  getStudentAttempts: async (courseId: string): Promise<IAssessmentSubmission[]> => {
    try {
      const response = await apiService.get<{ attempts: IAssessmentSubmission[] }>(`/assessments/course/${courseId}/student-attempts`);
      
      if (response.success && response.data) {
        return response.data.attempts || [];
      }
      
      throw new Error(response.error || 'Failed to fetch student attempts');
    } catch (error: any) {
      console.error('Failed to fetch student attempts:', error);
      return [];
    }
  },

  // Get assessment result
  getAssessmentResult: async (assessmentId: string): Promise<any> => {
    try {
      const response = await apiService.get(`/assessments/${assessmentId}/result`);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.error || 'Failed to get assessment result');
    } catch (error: any) {
      console.error('Failed to get assessment result:', error);
      throw new Error(error.message || 'Failed to get assessment result');
    }
  },

  // Get student's assessment attempts
  getAssessmentAttempts: async (assessmentId: string): Promise<any[]> => {
    try {
      const response = await apiService.get(`/assessments/${assessmentId}/attempts`);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.error || 'Failed to get assessment attempts');
    } catch (error: any) {
      console.error('Failed to get assessment attempts:', error);
      throw new Error(error.message || 'Failed to get assessment attempts');
    }
  },

  // Start assessment attempt
  startAssessmentAttempt: async (assessmentId: string): Promise<any> => {
    try {
      const response = await apiService.post(`/assessments/${assessmentId}/start`, {});
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.error || 'Failed to start assessment attempt');
    } catch (error: any) {
      console.error('Failed to start assessment attempt:', error);
      throw new Error(error.message || 'Failed to start assessment attempt');
    }
  },


  getAssessment: async (assessmentId: string): Promise<{ assessment: IAssessment }> => {
    try {
      const response = await apiService.get<{ assessment: IAssessment }>(`/assessments/${assessmentId}`);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.error || 'Failed to fetch assessment');
    } catch (error: any) {
      console.error('Failed to fetch assessment:', error);
      throw new Error(error.message || 'Failed to fetch assessment');
    }
  },

  // Start assessment attempt
  startAssessment: async (assessmentId: string): Promise<{
    submission: IAssessmentSubmission;
    assessment: IAssessment;
  }> => {
    const response = await apiService.post<{
      submission: IAssessmentSubmission;
      assessment: IAssessment;
    }>(`/assessments/${assessmentId}/start`);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.error || 'Failed to start assessment');
  },

  // Submit assessment
  submitAssessment: async (data: {
    assessmentId: string;
    answers: any[];
    totalTimeSpent: number;
    proctoringData?: any;
    isAutoSubmitted?: boolean;
  }): Promise<IAssessmentSubmission & { submissionId: string }> => {
    const response = await apiService.post<{ submission: IAssessmentSubmission }>(
      `/assessments/${data.assessmentId}/submit`,
      data
    );

    if (response.success && response.data) {
      const submission = response.data.submission;
      return {
        ...submission,
        submissionId: submission.submissionId || submission._id
      };
    }

    throw new Error(response.error || 'Failed to submit assessment');
  }
};
