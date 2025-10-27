import { apiService } from './apiService';

// Enhanced Assessment interfaces
export interface IEnhancedAssessment {
  _id: string;
  title: string;
  description?: string;
  courseId: string;
  teacherId: string;
  type: 'quiz' | 'assignment' | 'final';
  status: 'draft' | 'published' | 'archived';
  documentUrl?: string;
  documentType?: 'pdf' | 'docx' | 'txt';
  extractedQuestions?: IExtractedQuestion[];
  scheduledDate?: string;
  duration?: number; // in minutes
  dueDate?: string;
  requireProctoring?: boolean;
  requireCamera?: boolean;
  requireScreenShare?: boolean;
  aiCheatingDetection?: boolean;
  totalPoints: number;
  passingScore?: number;
  autoGrade?: boolean;
  teacherReviewRequired?: boolean;
  isRequired?: boolean;
  requiredForCompletion?: boolean;
  totalSubmissions?: number;
  averageScore?: number;
  passRate?: number;
  createdAt: string;
  updatedAt: string;
}

export interface IExtractedQuestion {
  question: string;
  type: 'multiple_choice' | 'multiple_choice_multiple' | 'true_false' | 'short_answer' | 'essay' | 'fill_in_blank' | 'numerical' | 'matching';
  options?: string[];
  correctAnswer?: string | string[];
  points: number;
  aiExtracted: boolean;
  section?: string; // Section A, B, C, etc.
  sectionTitle?: string; // Section title/description
  matchingPairs?: Array<{
    left: string;
    right: string;
  }>;
  leftItems?: string[]; // For matching questions
  rightItems?: string[]; // For matching questions
}

export interface IAssessmentSubmission {
  _id: string;
  assessmentId: string;
  studentId: string;
  courseId: string;
  answers: Array<{
    questionIndex: number;
    answer: string;
  }>;
  submittedAt?: string;
  startedAt: string;
  completedAt?: string;
  timeSpent: number; // in seconds
  status: 'draft' | 'submitted' | 'ai_graded' | 'teacher_reviewed' | 'finalized';
  score?: number;
  totalPoints?: number;
  percentage?: number;
  grade?: string;
  aiFeedback?: string;
  teacherFeedback?: string;
  isLate: boolean;
  latePenaltyApplied?: number;
  aiGraded: boolean;
  teacherReviewed: boolean;
  finalized: boolean;
}

export interface ICertificate {
  _id: string;
  studentId: string;
  courseId: string;
  teacherId: string;
  assessmentId: string;
  certificateNumber: string;
  issueDate: string;
  expiryDate?: string;
  grade: string;
  score: number;
  totalPoints: number;
  earnedPoints: number;
  completionDate: string;
  sessionsAttended: number;
  totalSessions: number;
  assessmentsCompleted: number;
  totalAssessments: number;
  status: 'pending' | 'issued' | 'expired' | 'revoked';
  isVerified: boolean;
  verificationCode: string;
  pdfUrl?: string;
  pdfGeneratedAt?: string;
  issuedBy: string;
  notes?: string;
}

export interface IAssessmentStatistics {
  assessmentId: string;
  totalSubmissions: number;
  averageScore: number;
  passRate: number;
  highestScore: number;
  lowestScore: number;
  medianScore: number;
  gradeDistribution: {
    A: number;
    B: number;
    C: number;
    D: number;
    F: number;
  };
  questionAnalysis: Array<{
    questionIndex: number;
    correctAnswers: number;
    averagePoints: number;
    difficulty: 'easy' | 'medium' | 'hard';
  }>;
}

export interface IUploadDocumentResponse {
  success: boolean;
  message: string;
  assessmentId: string;
  extractedQuestions?: IExtractedQuestion[];
  documentUrl: string;
}

export interface IGradeSubmissionResponse {
  success: boolean;
  message: string;
  submissionId: string;
  score: number;
  totalPoints: number;
  percentage: number;
  grade: string;
  aiFeedback: string;
  requiresTeacherReview: boolean;
}

export interface IGenerateCertificateResponse {
  success: boolean;
  message: string;
  certificateId: string;
  certificateNumber: string;
  pdfUrl?: string;
}

class EnhancedAssessmentService {
  // Get all assessments for a student
  async getStudentAssessments(filters?: {
    courseId?: string;
    type?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    assessments: IEnhancedAssessment[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
    };
  }> {
    const response = await apiService.get('/enhanced-assessments/student', { params: filters });
    return response.data;
  }

  // Get assessment by ID
  async getAssessmentById(assessmentId: string): Promise<IEnhancedAssessment> {
    const response = await apiService.get(`/enhanced-assessments/${assessmentId}`);
    return response.data;
  }

  // Get course assessments
  async getCourseAssessments(courseId: string): Promise<IEnhancedAssessment[]> {
    const response = await apiService.get(`/enhanced-assessments/course/${courseId}`);
    return response.data;
  }

  // Submit assessment for grading
  async submitAssessmentForGrading(assessmentId: string, submission: {
    answers: Array<{ questionIndex: number; answer: string }>;
    timeSpent: number;
  }): Promise<IGradeSubmissionResponse> {
    const response = await apiService.post(`/enhanced-assessments/${assessmentId}/submit`, submission);
    return response.data;
  }

  // Get assessment statistics (for teachers)
  async getAssessmentStatistics(assessmentId: string): Promise<IAssessmentStatistics> {
    const response = await apiService.get(`/enhanced-assessments/${assessmentId}/statistics`);
    return response.data;
  }

  // Get student submissions
  async getStudentSubmissions(assessmentId?: string): Promise<IAssessmentSubmission[]> {
    const params = assessmentId ? { assessmentId } : {};
    const response = await apiService.get('/enhanced-assessments/submissions', { params });
    return response.data;
  }

  // Get submission by ID
  async getSubmissionById(submissionId: string): Promise<IAssessmentSubmission> {
    const response = await apiService.get(`/enhanced-assessments/submissions/${submissionId}`);
    return response.data;
  }

  // Generate certificate for student
  async generateCertificate(courseId: string, studentId: string): Promise<IGenerateCertificateResponse> {
    const response = await apiService.post(`/enhanced-assessments/course/${courseId}/student/${studentId}/certificate`);
    return response.data;
  }

  // Get student certificates
  async getStudentCertificates(): Promise<ICertificate[]> {
    const response = await apiService.get('/enhanced-assessments/certificates');
    return response.data;
  }

  // Get certificate by ID
  async getCertificateById(certificateId: string): Promise<ICertificate> {
    const response = await apiService.get(`/enhanced-assessments/certificates/${certificateId}`);
    return response.data;
  }

  // Verify certificate
  async verifyCertificate(verificationCode: string): Promise<{
    success: boolean;
    certificate?: ICertificate;
    message: string;
  }> {
    const response = await apiService.get(`/enhanced-assessments/certificates/verify/${verificationCode}`);
    return response.data;
  }

  // Download certificate PDF
  async downloadCertificatePDF(certificateId: string): Promise<Blob> {
    const response = await apiService.get(`/enhanced-assessments/certificates/${certificateId}/pdf`, {
      responseType: 'blob'
    });
    return response.data;
  }

  // Get student progress for a course
  async getCourseProgress(courseId: string): Promise<{
    courseId: string;
    sessionsAttended: number;
    totalSessions: number;
    assessmentsCompleted: number;
    totalAssessments: number;
    averageScore: number;
    progressPercentage: number;
    isEligibleForCertificate: boolean;
  }> {
    const response = await apiService.get(`/enhanced-assessments/course/${courseId}/progress`);
    return response.data;
  }

  // Get comprehensive student progress for a course
  async getStudentCourseProgress(courseId: string, studentId?: string): Promise<{
    courseId: string;
    courseTitle: string;
    studentId: string;
    progress: {
      overall: number;
      assessments: {
        total: number;
        completed: number;
        averageScore: number;
        submissions: any[];
      };
      sessions: {
        total: number;
        attended: number;
        attendanceRate: number;
        records: any[];
      };
      requirements: {
        requiredAssessments: number;
        requiredSessions: number;
        minimumProgress: number;
        isEligibleForCertificate: boolean;
      };
      userProgress: any;
    };
  }> {
    const url = studentId 
      ? `/enhanced-assessments/course/${courseId}/progress/${studentId}`
      : `/enhanced-assessments/course/${courseId}/progress`;
    
    const response = await apiService.get(url);
    return response.data;
  }

  // Update student progress when assessment is completed
  async updateStudentProgress(assessmentId: string, score: number, timeSpent: number): Promise<{
    pointsEarned: number;
    totalPoints: number;
    progressPercentage: number;
    isCompleted: boolean;
  }> {
    const response = await apiService.post(`/enhanced-assessments/assessment/${assessmentId}/progress`, {
      score,
      timeSpent
    });
    return response.data;
  }

  // Get teacher's course progress overview
  async getTeacherCourseProgress(courseId: string): Promise<{
    courseId: string;
    courseTitle: string;
    overview: {
      totalStudents: number;
      completedStudents: number;
      completionRate: number;
      averageProgress: number;
      averageAttendance: number;
    };
    studentProgress: any[];
    assessmentStats: any[];
    attendanceStats: any[];
  }> {
    const response = await apiService.get(`/enhanced-assessments/course/${courseId}/teacher-progress`);
    return response.data;
  }

  // Get admin progress overview
  async getAdminProgressOverview(): Promise<{
    overview: {
      totalStudents: number;
      totalTeachers: number;
      totalCourses: number;
      totalEnrollments: number;
      completedCourses: number;
      completionRate: number;
      averageProgress: number;
      totalTimeSpent: number;
      totalPoints: number;
    };
    topCourses: any[];
    topStudents: any[];
  }> {
    const response = await apiService.get('/enhanced-assessments/admin/progress-overview');
    return response.data;
  }

  // Get upcoming assessments
  async getUpcomingAssessments(): Promise<IEnhancedAssessment[]> {
    const response = await apiService.get('/enhanced-assessments/upcoming');
    return response.data;
  }

  // Get overdue assessments
  async getOverdueAssessments(): Promise<IEnhancedAssessment[]> {
    const response = await apiService.get('/enhanced-assessments/overdue');
    return response.data;
  }

  // Get assessment results
  async getAssessmentResults(assessmentId: string): Promise<{
    assessment: IEnhancedAssessment;
    submission?: IAssessmentSubmission;
    score?: number;
    totalPoints?: number;
    percentage?: number;
    grade?: string;
    feedback?: string;
    isPassed: boolean;
  }> {
    const response = await apiService.get(`/enhanced-assessments/${assessmentId}/results`);
    return response.data;
  }
}

export const enhancedAssessmentService = new EnhancedAssessmentService();
export default enhancedAssessmentService;
