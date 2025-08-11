import { apiService } from './apiService';

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
  _id: string;
  title: string;
  description?: string;
  course: {
    _id: string;
    title: string;
  };
  instructor: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  type: 'quiz' | 'assignment' | 'exam' | 'project' | 'homework';
  questions: IQuestion[];
  totalPoints: number;
  timeLimit?: number;
  attempts: number;
  dueDate?: string;
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
  proctoringEnabled: boolean;
  passingScore?: number;
  gradingRubric?: string;
  attachments?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface IAssessmentSubmission {
  _id: string;
  submissionId?: string;
  assessment: IAssessment;
  student: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  course: {
    _id: string;
    title: string;
  };
  answers: IAnswer[];
  submittedAt?: string;
  startedAt: string;
  completedAt?: string;
  timeSpent: number;
  attemptNumber: number;
  status: 'draft' | 'submitted' | 'graded' | 'returned';
  score?: number;
  percentage?: number;
  grade?: string;
  feedback?: string;
  isLate: boolean;
  latePenaltyApplied?: number;
  gradedBy?: string;
  gradedAt?: string;
  aiGraded: boolean;
  requiresManualReview: boolean;
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
  createAssessment: async (assessmentData: ICreateAssessmentData): Promise<IAssessment> => {
    const response = await apiService.post<{ assessment: IAssessment }>('/assessments', assessmentData);
    
    if (response.success && response.data) {
      return response.data.assessment;
    }
    
    throw new Error(response.error || 'Failed to create assessment');
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
  }
};
