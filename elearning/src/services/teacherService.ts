import { apiService } from './api';
import { IUser } from '../shared/types';

// Teacher-specific interfaces
export interface ITeacher extends IUser {
  specialization?: string;
  rating?: number;
  totalStudents: number;
  activeCourses: number;
  totalCourses: number;
  totalEarnings: number;
  profileStatus?: 'incomplete' | 'pending' | 'approved' | 'rejected';
  courses: Array<{
    _id: string;
    title: string;
    students: number;
    status: string;
  }>;
}

export interface TeacherListResponse {
  teachers: ITeacher[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalTeachers: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface TeacherStats {
  totalTeachers: number;
  activeTeachers: number;
  totalStudentsTaught: number;
  totalActiveCourses: number;
  averageRating: number;
  topPerformers: ITeacher[];
}

export interface TeacherFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'active' | 'inactive';
  specialization?: string;
  profileStatus?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface UpdateTeacherData {
  firstName?: string;
  lastName?: string;
  email?: string;
  specialization?: string;
  isActive?: boolean;
}

export const teacherService = {
  // Get all teachers with filters and pagination
  getAllTeachers: async (filters: TeacherFilters = {}): Promise<TeacherListResponse> => {
    const queryParams = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    const response = await apiService.get<TeacherListResponse>(
      `/users/teachers?${queryParams.toString()}`
    );

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error || 'Failed to fetch teachers');
  },

  // Get teacher by ID with detailed information
  getTeacherById: async (id: string): Promise<ITeacher> => {
    const response = await apiService.get<{ teacher: ITeacher }>(`/users/${id}/teacher-details`);
    
    if (response.success && response.data) {
      return response.data.teacher;
    }
    
    throw new Error(response.error || 'Failed to fetch teacher details');
  },

  updateTeacher: async (id: string, teacherData: UpdateTeacherData): Promise<ITeacher> => {
    const response = await apiService.put<{ user: ITeacher }>(`/users/${id}`, teacherData);
    
    if (response.success && response.data) {
      return response.data.user;
    }
    
    throw new Error(response.error || 'Failed to update teacher');
  },

  deleteTeacher: async (id: string): Promise<void> => {
    const response = await apiService.delete(`/users/${id}`);

    if (!response.success) {
      throw new Error(response.error || 'Failed to delete teacher');
    }
  },

  activateTeacher: async (id: string): Promise<ITeacher> => {
    return teacherService.updateTeacher(id, { isActive: true });
  },

  deactivateTeacher: async (id: string): Promise<ITeacher> => {
    return teacherService.updateTeacher(id, { isActive: false });
  },

  // Get teacher statistics
  getTeacherStats: async (): Promise<TeacherStats> => {
    const response = await apiService.get<TeacherStats>('/users/teacher-stats');
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.error || 'Failed to fetch teacher statistics');
  },

  // Get teacher performance analytics
  getTeacherAnalytics: async (id: string): Promise<any> => {
    const response = await apiService.get(`/users/${id}/analytics`);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.error || 'Failed to fetch teacher analytics');
  },

  // Get teacher courses
  getTeacherCourses: async (id: string): Promise<any[]> => {
    const response = await apiService.get<{ courses: any[] }>(`/users/${id}/courses`);
    
    if (response.success && response.data) {
      return response.data.courses;
    }
    
    throw new Error(response.error || 'Failed to fetch teacher courses');
  }
};
