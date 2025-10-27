import { apiGet, handlePaginatedResponse } from './api';

// Course interfaces matching backend structure
export interface CourseInstructor {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface Course {
  _id: string;
  title: string;
  description: string;
  instructor: CourseInstructor;
  status: 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'archived';
  thumbnail?: string;
  category: string;
  tags: string[];
  duration: number; // in hours
  level: 'beginner' | 'intermediate' | 'advanced';
  price: number; // Legacy field
  notesPrice: number; // Price for accessing notes/materials
  liveSessionPrice: number; // Price for accessing live sessions
  enrollmentCount: number;
  rating: number;
  ratingCount: number;
  prerequisites: string[];
  learningOutcomes: string[];
  isPublished: boolean;
  publishedAt?: string;
  enrollmentDeadline?: string;
  courseStartDate?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
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

export interface CoursesResponse {
  courses: Course[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCourses: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

class CourseService {
  private baseUrl = '/courses';

  /**
   * Get all public courses (approved courses only)
   */
  async getPublicCourses(filters: CourseFilters = {}): Promise<CoursesResponse> {
    try {
      const params = new URLSearchParams();
      
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.search) params.append('search', filters.search);
      if (filters.category) params.append('category', filters.category);
      if (filters.level) params.append('level', filters.level);
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

      const response = await apiGet<any>(`${this.baseUrl}/public?${params.toString()}`);
      
      // Handle different response structures
      if (response && response.success && response.data) {
        return {
          courses: response.data.courses || [],
          pagination: response.data.pagination || {
            currentPage: 1,
            totalPages: 1,
            totalCourses: 0,
            hasNextPage: false,
            hasPrevPage: false
          }
        };
      } else {
        // If no success field, assume direct data response
        return {
          courses: Array.isArray(response) ? response : [],
          pagination: {
            currentPage: 1,
            totalPages: 1,
            totalCourses: Array.isArray(response) ? response.length : 0,
            hasNextPage: false,
            hasPrevPage: false
          }
        };
      }
    } catch (error: any) {
      console.error('Error in getPublicCourses:', error);
      // Return mock data as fallback
      return this.getMockCourses(filters);
    }
  }

  /**
   * Get course by ID (public endpoint)
   */
  async getPublicCourseById(courseId: string): Promise<Course> {
    const response = await apiGet<any>(`${this.baseUrl}/public/${courseId}`);
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch course');
    }
    return response.data.course;
  }

  /**
   * Get enrolled courses (requires authentication)
   */
  async getEnrolledCourses(filters: CourseFilters = {}): Promise<CoursesResponse> {
    const params = new URLSearchParams();
    
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.search) params.append('search', filters.search);
    if (filters.category) params.append('category', filters.category);
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

    const response = await apiGet<any>(`${this.baseUrl}/enrolled?${params.toString()}`);
    return handlePaginatedResponse(response);
  }

  /**
   * Get course categories (derived from available courses)
   */
  async getCategories(): Promise<string[]> {
    try {
      // Get a sample of courses to extract categories
      const response = await this.getPublicCourses({ limit: 100 });
      if (response && response.courses && Array.isArray(response.courses)) {
        const categories = [...new Set(response.courses.map(course => course.category))];
        return ['All Categories', ...categories.sort()];
      } else {
        throw new Error('Invalid response structure');
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      // Return default categories if API fails
      return [
        'All Categories',
        'Web Development',
        'Data Science',
        'Design',
        'Marketing',
        'Business',
        'Programming',
        'Mobile Development'
      ];
    }
  }

  /**
   * Transform backend course data to frontend format
   */
  transformCourse(backendCourse: Course): Course {
    return {
      ...backendCourse,
      // Ensure instructor name is properly formatted
      instructor: {
        ...backendCourse.instructor,
        name: `${backendCourse.instructor.firstName} ${backendCourse.instructor.lastName}`,
        avatar: '', // Backend doesn't provide avatar yet
        rating: 4.5 // Default instructor rating
      } as any,
      // Calculate effective price (use notesPrice + liveSessionPrice or fallback to legacy price)
      price: backendCourse.notesPrice + backendCourse.liveSessionPrice || backendCourse.price,
      originalPrice: backendCourse.price > 0 ? backendCourse.price * 1.5 : undefined, // Mock original price
      studentsCount: backendCourse.enrollmentCount,
      lessonsCount: Math.floor(backendCourse.duration * 2), // Estimate 2 lessons per hour
      skills: backendCourse.tags, // Use tags as skills
      thumbnail: backendCourse.thumbnail || '', // Provide default empty string
      isPopular: backendCourse.enrollmentCount > 50,
      isBestseller: backendCourse.rating > 4.5 && backendCourse.enrollmentCount > 100,
      isNew: new Date(backendCourse.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Created within last 30 days
      completionRate: Math.floor(Math.random() * 20) + 80, // Mock completion rate 80-100%
      language: 'English', // Default language
      lastUpdated: backendCourse.updatedAt
    } as any;
  }

  /**
   * Get formatted duration string
   */
  formatDuration(hours: number): string {
    if (hours < 1) {
      return `${Math.round(hours * 60)} minutes`;
    } else if (hours === 1) {
      return '1 hour';
    } else if (hours < 24) {
      return `${Math.round(hours)} hours`;
    } else {
      const weeks = Math.floor(hours / (24 * 7));
      return weeks === 1 ? '1 week' : `${weeks} weeks`;
    }
  }

  /**
   * Format level for display
   */
  formatLevel(level: string): string {
    return level.charAt(0).toUpperCase() + level.slice(1);
  }
}

export const courseService = new CourseService();