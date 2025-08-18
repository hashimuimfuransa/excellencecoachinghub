import { apiService } from './api';
import { IUser } from '../shared/types';

// Student-specific interfaces
export interface IStudent extends IUser {
  totalCourses: number;
  completedCourses: number;
  totalAttendanceDays: number;
  presentDays: number;
  attendanceRate: number;
  averageProgress: number;
  enrollments: IEnrollment[];
  statistics?: IStudentStatistics;
}

export interface IEnrollment {
  courseId: string;
  progressPercentage: number;
  enrollmentDate: string;
  lastAccessed: string;
  isCompleted: boolean;
  course?: {
    _id: string;
    title: string;
    description: string;
    instructor: {
      _id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
    category: string;
    level: string;
    duration: number;
    price: number;
  };
}

export interface IAttendanceRecord {
  _id: string;
  student: string;
  course: {
    _id: string;
    title: string;
  };
  session?: {
    _id: string;
    title: string;
    scheduledTime: string;
  };
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  checkInTime?: string;
  checkOutTime?: string;
  duration?: number;
  location?: string;
  notes?: string;
  markedBy: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  autoMarked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IStudentStatistics {
  totalCourses: number;
  completedCourses: number;
  averageProgress: number;
  totalAttendanceDays: number;
  attendanceRate: number;
  attendanceBreakdown: {
    present?: number;
    absent?: number;
    late?: number;
    excused?: number;
  };
}

export interface ISessionParticipation {
  _id: string;
  title: string;
  scheduledTime: string;
  duration: number;
  status: string;
  course: {
    _id: string;
    title: string;
  };
  instructor: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  studentAttendance?: {
    user: string;
    joinTime?: string;
    leaveTime?: string;
    duration?: number;
    participated: boolean;
  };
}

export interface StudentListResponse {
  students: IStudent[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalStudents: number;
    studentsPerPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface StudentStats {
  totalStudents: number;
  activeStudents: number;
  inactiveStudents: number;
  enrollmentStats: {
    totalEnrollments: number;
    completedCourses: number;
    averageProgress: number;
    totalTimeSpent: number;
  };
  attendanceBreakdown: {
    present?: number;
    absent?: number;
    late?: number;
    excused?: number;
  };
  overallAttendanceRate: number;
  recentEnrollments: any[];
}

export interface StudentFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'active' | 'inactive';
  courseId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface AttendanceFilters {
  startDate?: string;
  endDate?: string;
}

export interface MarkAttendanceData {
  studentId: string;
  courseId: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  notes?: string;
  sessionId?: string;
}

export interface BulkAttendanceData {
  courseId: string;
  date: string;
  attendanceData: {
    studentId: string;
    status: 'present' | 'absent' | 'late' | 'excused';
    notes?: string;
  }[];
}

export interface CourseAttendanceReport {
  studentStats: {
    _id: string;
    studentName: string;
    studentEmail: string;
    totalDays: number;
    attendance: {
      status: string;
      count: number;
    }[];
    attendanceRate: number;
  }[];
  dailyAttendance: {
    date: string;
    totalStudents: number;
    present: number;
    late: number;
    absent: number;
    excused: number;
    attendanceRate: number;
  }[];
}

const studentService = {
  // Get all students with filters
  getAllStudents: async (filters: StudentFilters = {}): Promise<StudentListResponse> => {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await apiService.get<{ students: IStudent[]; pagination: any }>(`/students?${params}`);
    
    if (response.success && response.data) {
      return {
        students: response.data.students,
        pagination: response.data.pagination
      };
    }
    
    throw new Error(response.error || 'Failed to fetch students');
  },

  // Get student details
  getStudentDetails: async (id: string): Promise<{
    student: IStudent;
    enrollments: IEnrollment[];
    attendanceRecords: IAttendanceRecord[];
    sessionParticipation: ISessionParticipation[];
  }> => {
    const response = await apiService.get<{
      student: IStudent;
      enrollments: IEnrollment[];
      attendanceRecords: IAttendanceRecord[];
      sessionParticipation: ISessionParticipation[];
    }>(`/students/${id}`);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.error || 'Failed to fetch student details');
  },

  // Get student course attendance
  getStudentCourseAttendance: async (
    studentId: string, 
    courseId: string, 
    filters: AttendanceFilters = {}
  ): Promise<{
    attendance: IAttendanceRecord[];
    attendanceRate: number;
  }> => {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await apiService.get<{
      attendance: IAttendanceRecord[];
      attendanceRate: number;
    }>(`/students/${studentId}/courses/${courseId}/attendance?${params}`);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.error || 'Failed to fetch student course attendance');
  },

  // Mark attendance
  markAttendance: async (data: MarkAttendanceData): Promise<IAttendanceRecord> => {
    const response = await apiService.post<{ attendance: IAttendanceRecord }>('/students/attendance/mark', data);
    
    if (response.success && response.data) {
      return response.data.attendance;
    }
    
    throw new Error(response.error || 'Failed to mark attendance');
  },

  // Bulk mark attendance
  bulkMarkAttendance: async (data: BulkAttendanceData): Promise<{
    successful: number;
    failed: number;
    results: any[];
    errors: any[];
  }> => {
    const response = await apiService.post<{
      successful: number;
      failed: number;
      results: any[];
      errors: any[];
    }>('/students/attendance/bulk', data);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.error || 'Failed to bulk mark attendance');
  },

  // Get course attendance report
  getCourseAttendanceReport: async (
    courseId: string, 
    filters: AttendanceFilters = {}
  ): Promise<CourseAttendanceReport> => {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await apiService.get<CourseAttendanceReport>(`/students/courses/${courseId}/attendance-report?${params}`);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.error || 'Failed to fetch course attendance report');
  },

  // Get student statistics
  getStudentStats: async (): Promise<StudentStats> => {
    const response = await apiService.get<StudentStats>('/students/stats');
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.error || 'Failed to fetch student statistics');
  },

  // Update student status
  updateStudentStatus: async (id: string, isActive: boolean): Promise<IStudent> => {
    const response = await apiService.put<{ student: IStudent }>(`/students/${id}/status`, { isActive });
    
    if (response.success && response.data) {
      return response.data.student;
    }
    
    throw new Error(response.error || 'Failed to update student status');
  }
};

export { studentService };
