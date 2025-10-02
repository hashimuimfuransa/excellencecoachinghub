import { apiService } from './apiService';

export interface DetailedFeedback {
  questionId: string;
  isCorrect?: boolean;
  pointsEarned?: number;
  feedback?: string;
}

export interface StudentGrade {
  _id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  courseId: string;
  courseName: string;
  assessmentId?: string;
  assessmentTitle?: string;
  assignmentId?: string;
  assignmentTitle?: string;
  score: number;
  maxScore: number;
  percentage: number;
  grade: string;
  submittedAt: Date;
  gradedAt?: Date;
  feedback?: string;
  timeSpent: number;
  attempts: number;
  status: 'submitted' | 'graded' | 'pending' | 'late';
  type: 'assessment' | 'assignment';
  // AI feedback fields
  aiGraded?: boolean;
  correctAnswers?: number;
  incorrectAnswers?: number;
  totalQuestions?: number;
  detailedFeedback?: DetailedFeedback[];
}

export interface LeaderboardEntry {
  rank: number;
  studentId: string;
  studentName: string;
  studentEmail: string;
  avatar?: string;
  totalScore: number;
  averageScore: number;
  completedAssessments: number;
  completedAssignments: number;
  totalPoints: number;
  badges: string[];
  streak: number;
  improvement: number; // percentage change from last period
  courseId?: string;
  courseName?: string;
}

export interface CourseStats {
  totalAssessments: number;
  completedAssessments: number;
  totalAssignments: number;
  completedAssignments: number;
  averageGrade: number;
  currentRank: number;
  totalStudents: number;
  improvementTrend: 'up' | 'down' | 'stable';
  strongSubjects: string[];
  improvementAreas: string[];
}

export interface GradesFilter {
  courseId?: string;
  type?: 'assessment' | 'assignment' | 'all';
  timeFilter?: 'week' | 'month' | 'semester' | 'all';
  status?: 'submitted' | 'graded' | 'pending' | 'late' | 'all';
}

export interface LeaderboardFilter {
  courseId?: string;
  assessmentId?: string;
  assignmentId?: string;
  type?: 'assessment' | 'assignment' | 'overall';
  timeFilter?: 'week' | 'month' | 'semester' | 'all';
  limit?: number;
}

class GradesService {
  private baseUrl = '/grades';

  // Student grades methods
  async getStudentGrades(filters: GradesFilter = {}): Promise<StudentGrade[]> {
    try {
      const params = new URLSearchParams();
      if (filters.courseId) params.append('courseId', filters.courseId);
      if (filters.type && filters.type !== 'all') params.append('type', filters.type);
      if (filters.timeFilter && filters.timeFilter !== 'all') params.append('timeFilter', filters.timeFilter);
      if (filters.status && filters.status !== 'all') params.append('status', filters.status);

      const response = await apiService.get<{ grades: StudentGrade[] }>(`${this.baseUrl}/student?${params.toString()}`);
      return response?.data?.grades || [];
    } catch (error) {
      console.error('Failed to fetch student grades:', error);
      return [];
    }
  }

  async getStudentGradesByCourse(courseId: string): Promise<StudentGrade[]> {
    try {
      const response = await apiService.get<{ grades: StudentGrade[] }>(`${this.baseUrl}/student/course/${courseId}`);
      return response?.data?.grades || [];
    } catch (error) {
      console.error('Failed to fetch student grades by course:', error);
      throw error;
    }
  }

  async getCourseStats(courseId?: string): Promise<CourseStats> {
    try {
      const url = courseId ? `${this.baseUrl}/stats/course/${courseId}` : `${this.baseUrl}/stats`;
      const response = await apiService.get<{ stats: any }>(url);
      return response?.data?.stats || {
        totalAssessments: 0,
        completedAssessments: 0,
        totalAssignments: 0,
        completedAssignments: 0,
        averageGrade: 0,
        currentRank: 1,
        totalStudents: 1,
        improvementTrend: 'stable' as const,
        strongSubjects: [],
        improvementAreas: []
      };
    } catch (error) {
      console.error('Failed to fetch course stats:', error);
      return {
        totalAssessments: 0,
        completedAssessments: 0,
        totalAssignments: 0,
        completedAssignments: 0,
        averageGrade: 0,
        currentRank: 1,
        totalStudents: 1,
        improvementTrend: 'stable' as const,
        strongSubjects: [],
        improvementAreas: []
      };
    }
  }

  // Teacher grades methods
  async getTeacherGrades(filters: GradesFilter = {}): Promise<StudentGrade[]> {
    try {
      const params = new URLSearchParams();
      if (filters.courseId) params.append('courseId', filters.courseId);
      if (filters.type && filters.type !== 'all') params.append('type', filters.type);
      if (filters.timeFilter && filters.timeFilter !== 'all') params.append('timeFilter', filters.timeFilter);
      if (filters.status && filters.status !== 'all') params.append('status', filters.status);

      const response = await apiService.get(`${this.baseUrl}/teacher?${params.toString()}`);
      console.log('Teacher grades response:', response);
      
      // Handle different response structures
      if (response && response.data && response.data.grades) {
        return response.data.grades;
      } else {
        console.warn('Unexpected response structure:', response);
        return [];
      }
    } catch (error) {
      console.error('Failed to fetch teacher grades:', error);
      throw error;
    }
  }

  async getTeacherCourseGrades(courseId: string, filters: GradesFilter = {}): Promise<StudentGrade[]> {
    try {
      const params = new URLSearchParams();
      if (filters.type && filters.type !== 'all') params.append('type', filters.type);
      if (filters.timeFilter && filters.timeFilter !== 'all') params.append('timeFilter', filters.timeFilter);
      if (filters.status && filters.status !== 'all') params.append('status', filters.status);

      const response = await apiService.get(`${this.baseUrl}/teacher/course/${courseId}?${params.toString()}`);
      console.log('Teacher course grades response:', response);
      
      // Handle different response structures
      if (response && response.data && response.data.grades) {
        return response.data.grades;
      } else {
        console.warn('Unexpected response structure:', response);
        return [];
      }
    } catch (error) {
      console.error('Failed to fetch teacher course grades:', error);
      throw error;
    }
  }

  async getTeacherAllGrades(filters: GradesFilter = {}): Promise<StudentGrade[]> {
    try {
      const params = new URLSearchParams();
      if (filters.courseId) params.append('courseId', filters.courseId);
      if (filters.type && filters.type !== 'all') params.append('type', filters.type);
      if (filters.timeFilter && filters.timeFilter !== 'all') params.append('timeFilter', filters.timeFilter);
      if (filters.status && filters.status !== 'all') params.append('status', filters.status);

      const response = await apiService.get(`${this.baseUrl}/teacher?${params.toString()}`);
      return response?.data?.grades || [];
    } catch (error) {
      console.error('Failed to fetch teacher grades:', error);
      throw error;
    }
  }

  // Leaderboard methods
  async getLeaderboard(filters: LeaderboardFilter = {}): Promise<LeaderboardEntry[]> {
    try {
      const params = new URLSearchParams();
      if (filters.courseId) params.append('courseId', filters.courseId);
      if (filters.assessmentId) params.append('assessmentId', filters.assessmentId);
      if (filters.assignmentId) params.append('assignmentId', filters.assignmentId);
      if (filters.type && filters.type !== 'overall') params.append('type', filters.type);
      if (filters.timeFilter && filters.timeFilter !== 'all') params.append('timeFilter', filters.timeFilter);
      if (filters.limit) params.append('limit', filters.limit.toString());

      const response = await apiService.get(`${this.baseUrl}/leaderboard?${params.toString()}`);
      console.log('Leaderboard response:', response);
      
      // Handle different response structures
      if (response && response.data && response.data.leaderboard) {
        return response.data.leaderboard;
      } else {
        return [];
      }
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
      return [];
    }
  }

  async getCourseLeaderboard(courseId: string, filters: Omit<LeaderboardFilter, 'courseId'> = {}): Promise<LeaderboardEntry[]> {
    try {
      const params = new URLSearchParams();
      if (filters.assessmentId) params.append('assessmentId', filters.assessmentId);
      if (filters.assignmentId) params.append('assignmentId', filters.assignmentId);
      if (filters.type && filters.type !== 'overall') params.append('type', filters.type);
      if (filters.timeFilter && filters.timeFilter !== 'all') params.append('timeFilter', filters.timeFilter);
      if (filters.limit) params.append('limit', filters.limit.toString());

      const response = await apiService.get(`${this.baseUrl}/leaderboard/course/${courseId}?${params.toString()}`);
      console.log('Course leaderboard response:', response);
      
      // Handle different response structures
      if (response && response.leaderboard) {
        return response.leaderboard;
      } else if (response && response.data && response.data.leaderboard) {
        return response.data.leaderboard;
      } else {
        console.warn('Unexpected response structure:', response);
        return [];
      }
    } catch (error) {
      console.error('Failed to fetch course leaderboard:', error);
      throw error;
    }
  }

  async getAssessmentLeaderboard(assessmentId: string, filters: Omit<LeaderboardFilter, 'assessmentId'> = {}): Promise<LeaderboardEntry[]> {
    try {
      const params = new URLSearchParams();
      if (filters.courseId) params.append('courseId', filters.courseId);
      if (filters.limit) params.append('limit', filters.limit.toString());

      const response = await apiService.get(`${this.baseUrl}/leaderboard/assessment/${assessmentId}?${params.toString()}`);
      return response?.data?.leaderboard || [];
    } catch (error) {
      console.error('Failed to fetch assessment leaderboard:', error);
      throw error;
    }
  }

  async getAssignmentLeaderboard(assignmentId: string, filters: Omit<LeaderboardFilter, 'assignmentId'> = {}): Promise<LeaderboardEntry[]> {
    try {
      const params = new URLSearchParams();
      if (filters.courseId) params.append('courseId', filters.courseId);
      if (filters.limit) params.append('limit', filters.limit.toString());

      const response = await apiService.get(`${this.baseUrl}/leaderboard/assignment/${assignmentId}?${params.toString()}`);
      return response?.data?.leaderboard || [];
    } catch (error) {
      console.error('Failed to fetch assignment leaderboard:', error);
      throw error;
    }
  }

  // Admin methods
  async getAdminLeaderboard(filters: LeaderboardFilter = {}): Promise<LeaderboardEntry[]> {
    try {
      const params = new URLSearchParams();
      if (filters.courseId) params.append('courseId', filters.courseId);
      if (filters.assessmentId) params.append('assessmentId', filters.assessmentId);
      if (filters.assignmentId) params.append('assignmentId', filters.assignmentId);
      if (filters.type && filters.type !== 'overall') params.append('type', filters.type);
      if (filters.timeFilter && filters.timeFilter !== 'all') params.append('timeFilter', filters.timeFilter);
      if (filters.limit) params.append('limit', filters.limit.toString());

      const response = await apiService.get<{ leaderboard: any[] }>(`${this.baseUrl}/admin/leaderboard?${params.toString()}`);
      return response?.data?.leaderboard || [];
    } catch (error) {
      console.error('Failed to fetch admin leaderboard:', error);
      throw error;
    }
  }

  async getAdminGrades(filters: GradesFilter = {}): Promise<StudentGrade[]> {
    try {
      const params = new URLSearchParams();
      if (filters.courseId) params.append('courseId', filters.courseId);
      if (filters.type && filters.type !== 'all') params.append('type', filters.type);
      if (filters.timeFilter && filters.timeFilter !== 'all') params.append('timeFilter', filters.timeFilter);
      if (filters.status && filters.status !== 'all') params.append('status', filters.status);

      const response = await apiService.get<{ grades: any[] }>(`${this.baseUrl}/admin?${params.toString()}`);
      return response?.data?.grades || [];
    } catch (error) {
      console.error('Failed to fetch admin grades:', error);
      throw error;
    }
  }

  // Utility methods
  getGradeColor(percentage: number): 'success' | 'info' | 'warning' | 'error' {
    if (percentage >= 90) return 'success';
    if (percentage >= 80) return 'info';
    if (percentage >= 70) return 'warning';
    return 'error';
  }

  getGradeLetter(percentage: number): string {
    if (percentage >= 97) return 'A+';
    if (percentage >= 93) return 'A';
    if (percentage >= 90) return 'A-';
    if (percentage >= 87) return 'B+';
    if (percentage >= 83) return 'B';
    if (percentage >= 80) return 'B-';
    if (percentage >= 77) return 'C+';
    if (percentage >= 73) return 'C';
    if (percentage >= 70) return 'C-';
    if (percentage >= 67) return 'D+';
    if (percentage >= 63) return 'D';
    if (percentage >= 60) return 'D-';
    return 'F';
  }

  getRankDisplay(rank: number) {
    switch (rank) {
      case 1:
        return { icon: '🏆', color: 'gold', label: '1st Place' };
      case 2:
        return { icon: '🥈', color: 'silver', label: '2nd Place' };
      case 3:
        return { icon: '🥉', color: '#CD7F32', label: '3rd Place' };
      default:
        return { icon: '👤', color: 'text.secondary', label: `${rank}th Place` };
    }
  }


}

export const gradesService = new GradesService();