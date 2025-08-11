import { apiService } from './api';
import { CourseStatus } from '../shared/types';

// Course management interfaces
export interface CourseListResponse {
  courses: ICourse[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCourses: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface ICourse {
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
  level: 'beginner' | 'intermediate' | 'advanced';
  status: CourseStatus;
  price: number;
  duration: number;
  enrolledStudents: string[];
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
  rejectedAt?: string;
  approvedBy?: string;
  rejectedBy?: string;
  adminFeedback?: string;
  moderators?: string[];
  isActive: boolean;
  isPublished: boolean;
  enrollmentCount: number;
  rating: number;
  ratingCount: number;
  tags: string[];
  prerequisites: string[];
  learningOutcomes: string[];
  thumbnail?: string;
}

export interface CourseStats {
  totalCourses: number;
  activeCourses: number;
  approvedCourses: number;
  pendingCourses: number;
  rejectedCourses: number;
  coursesByCategory: Array<{ _id: string; count: number }>;
  recentCourses: ICourse[];
  totalEnrollments: number;
}

export interface CourseFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  category?: string;
  instructor?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface UpdateCourseData {
  title?: string;
  description?: string;
  category?: string;
  level?: 'Beginner' | 'Intermediate' | 'Advanced';
  price?: number;
  duration?: number;
  isActive?: boolean;
}

export interface CourseActionData {
  feedback?: string;
}

export const courseService = {
  // Get public courses (approved courses for students)
  getPublicCourses: async (filters: CourseFilters = {}): Promise<CourseListResponse> => {
    const queryParams = new URLSearchParams();
    
    // Always filter for approved courses only
    const publicFilters = { ...filters, status: 'approved' };
    
    Object.entries(publicFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    const response = await apiService.get<CourseListResponse>(
      `/courses/public?${queryParams.toString()}`
    );
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.error || 'Failed to fetch public courses');
  },

  // Get public course by ID (for students)
  getPublicCourseById: async (id: string): Promise<ICourse> => {
    const response = await apiService.get<{ course: ICourse }>(`/courses/public/${id}`);
    
    if (response.success && response.data) {
      return response.data.course;
    }
    
    throw new Error(response.error || 'Failed to fetch course');
  },

  // Get all courses with filters and pagination
  getAllCourses: async (filters: CourseFilters = {}): Promise<CourseListResponse> => {
    const queryParams = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    const response = await apiService.get<CourseListResponse>(
      `/courses?${queryParams.toString()}`
    );
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.error || 'Failed to fetch courses');
  },

  // Get course by ID
  getCourseById: async (id: string): Promise<ICourse> => {
    const response = await apiService.get<{ course: ICourse }>(`/courses/${id}`);
    
    if (response.success && response.data) {
      return response.data.course;
    }
    
    throw new Error(response.error || 'Failed to fetch course');
  },

  // Update course
  updateCourse: async (id: string, courseData: UpdateCourseData): Promise<ICourse> => {
    const response = await apiService.put<{ course: ICourse }>(`/courses/${id}`, courseData);
    
    if (response.success && response.data) {
      return response.data.course;
    }
    
    throw new Error(response.error || 'Failed to update course');
  },

  // Delete course
  deleteCourse: async (id: string): Promise<void> => {
    const response = await apiService.delete(`/courses/${id}`);
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to delete course');
    }
  },

  // Approve course
  approveCourse: async (id: string, data: CourseActionData = {}): Promise<ICourse> => {
    const response = await apiService.put<{ course: ICourse }>(`/courses/${id}/approve`, data);
    
    if (response.success && response.data) {
      return response.data.course;
    }
    
    throw new Error(response.error || 'Failed to approve course');
  },

  // Reject course
  rejectCourse: async (id: string, data: CourseActionData): Promise<ICourse> => {
    const response = await apiService.put<{ course: ICourse }>(`/courses/${id}/reject`, data);
    
    if (response.success && response.data) {
      return response.data.course;
    }
    
    throw new Error(response.error || 'Failed to reject course');
  },

  // Assign moderator to course
  assignModerator: async (id: string, moderatorId: string): Promise<ICourse> => {
    const response = await apiService.put<{ course: ICourse }>(`/courses/${id}/assign-moderator`, {
      moderatorId
    });
    
    if (response.success && response.data) {
      return response.data.course;
    }
    
    throw new Error(response.error || 'Failed to assign moderator');
  },

  // Get course statistics
  getCourseStats: async (): Promise<CourseStats> => {
    const response = await apiService.get<CourseStats>('/courses/stats');

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error || 'Failed to fetch course statistics');
  },

  // Create course (teachers only)
  createCourse: async (courseData: {
    title: string;
    description: string;
    category: string;
    level: 'Beginner' | 'Intermediate' | 'Advanced';
    price: number;
    duration: number;
    prerequisites?: string[];
    learningObjectives?: string[];
    tags?: string[];
  }): Promise<ICourse> => {
    const response = await apiService.post<{ course: ICourse }>('/courses', courseData);

    if (response.success && response.data) {
      return response.data.course;
    }

    throw new Error(response.error || 'Failed to create course');
  },

  // Get teacher's courses (for authenticated teachers)
  getTeacherCourses: async (filters: CourseFilters = {}): Promise<CourseListResponse> => {
    const queryParams = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    const response = await apiService.get<CourseListResponse>(
      `/courses?${queryParams.toString()}`
    );

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error || 'Failed to fetch teacher courses');
  },

  // Get enrolled courses for student
  getEnrolledCourses: async (filters: CourseFilters = {}): Promise<CourseListResponse> => {
    const queryParams = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    const response = await apiService.get<CourseListResponse>(
      `/courses/enrolled?${queryParams.toString()}`
    );

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error || 'Failed to fetch enrolled courses');
  }
};
