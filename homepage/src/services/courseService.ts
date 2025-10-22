import { apiService } from './api';

export interface Course {
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
  price: number;
  duration: number;
  enrollmentCount: number;
  rating: number;
  ratingCount: number;
  tags: string[];
  thumbnail?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CourseListResponse {
  courses: Course[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCourses: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface CourseFilters {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  level?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const courseService = {
  // Get trending courses (most enrolled courses)
  getTrendingCourses: async (limit: number = 6): Promise<Course[]> => {
    try {
      const response = await apiService.get<CourseListResponse>(
        `/courses/public?limit=${limit}&sortBy=enrollmentCount&sortOrder=desc`
      );
      
      if (response.success && response.data) {
        return response.data.courses;
      }
      
      throw new Error(response.error || 'Failed to fetch trending courses');
    } catch (error) {
      console.error('Error fetching trending courses:', error);
      throw error;
    }
  },

  // Get public courses with filters
  getPublicCourses: async (filters: CourseFilters = {}): Promise<CourseListResponse> => {
    try {
      const queryParams = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
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
    } catch (error) {
      console.error('Error fetching public courses:', error);
      throw error;
    }
  },

  // Get course by ID
  getCourseById: async (courseId: string): Promise<Course> => {
    try {
      const response = await apiService.get<Course>(`/courses/public/${courseId}`);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.error || 'Failed to fetch course');
    } catch (error) {
      console.error('Error fetching course:', error);
      throw error;
    }
  }
};
