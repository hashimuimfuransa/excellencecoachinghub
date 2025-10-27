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
  students: string[];
  content?: Array<{
    _id: string;
    type: 'video' | 'document' | 'quiz' | 'assignment';
    title: string;
    description?: string;
    url?: string;
    duration?: number;
    order: number;
  }>;
  // New fields for better discoverability
  careerGoal?: string;
  experienceLevel?: string;
  timeCommitment?: string;
  learningStyle?: string;
  specificInterests?: string[];
  learningCategories?: string[];
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
  learningCategories?: string[];
  level?: string;
}

export interface UpdateCourseData {
  title?: string;
  description?: string;
  category?: string;
  level?: 'Beginner' | 'Intermediate' | 'Advanced';
  price?: number;
  duration?: number;
  isActive?: boolean;
  prerequisites?: string[];
  learningObjectives?: string[];
  tags?: string[];
  // New fields for better discoverability
  careerGoal?: string;
  experienceLevel?: string;
  timeCommitment?: string;
  learningStyle?: string;
  specificInterests?: string[];
  learningCategories?: string[];
}

export interface CourseActionData {
  feedback?: string;
  price?: number;
}

export const courseService = {
  // Cache for course data
  _cache: new Map<string, { data: any; timestamp: number }>(),
  _cacheTimeout: 30000, // 30 seconds cache

  // Helper method to get cached data or fetch new
  _getCachedOrFetch: async <T>(key: string, fetchFn: () => Promise<T>): Promise<T> => {
    const cached = courseService._cache.get(key);
    const now = Date.now();
    
    if (cached && (now - cached.timestamp) < courseService._cacheTimeout) {
      return cached.data;
    }
    
    const data = await fetchFn();
    courseService._cache.set(key, { data, timestamp: now });
    return data;
  },

  // Clear cache
  clearCache: () => {
    courseService._cache.clear();
  },
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
    const cacheKey = `courses-${JSON.stringify(filters)}`;
    
    return courseService._getCachedOrFetch(cacheKey, async () => {
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
    });
  },

  // Get course by ID
  getCourseById: async (id: string): Promise<ICourse> => {
    const response = await apiService.get<{ course: ICourse }>(`/courses/${id}`);
    
    if (response.success && response.data) {
      return response.data.course;
    }
    
    throw new Error(response.error || 'Failed to fetch course');
  },

  // Get course by ID for admin access (with fallback methods)
  getCourseByIdForAdmin: async (id: string): Promise<ICourse> => {
    try {
      // First try the regular endpoint
      return await courseService.getCourseById(id);
    } catch (regularError) {
      console.warn('Regular course access failed for admin, trying alternative methods:', regularError);
      
      try {
        // Try to get course from admin course list
        const coursesResponse = await courseService.getAllCourses({
          page: 1,
          limit: 1000
        });
        
        const foundCourse = coursesResponse.courses.find(c => c._id === id);
        
        if (foundCourse) {
          return foundCourse;
        }
        
        // If not found in list, try public endpoint as last resort
        return await courseService.getPublicCourseById(id);
      } catch (fallbackError) {
        console.error('All course access methods failed:', fallbackError);
        throw new Error('Unable to access course details. This course may not exist or you may not have proper admin permissions.');
      }
    }
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
    // New fields for better discoverability
    careerGoal?: string;
    experienceLevel?: string;
    timeCommitment?: string;
    learningStyle?: string;
    specificInterests?: string[];
    learningCategories?: string[];
  }): Promise<ICourse> => {
    const response = await apiService.post<{ course: ICourse }>('/courses', courseData);

    if (response.success && response.data) {
      return response.data.course;
    }

    throw new Error(response.error || 'Failed to create course');
  },

  // Get teacher's courses (for authenticated teachers)
  getTeacherCourses: async (filters: CourseFilters = {}): Promise<CourseListResponse> => {
    const cacheKey = `teacher-courses-${JSON.stringify(filters)}`;
    
    return courseService._getCachedOrFetch(cacheKey, async () => {
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
    });
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
  },

  // Get enrolled students for a course (teachers only)
  getCourseEnrolledStudents: async (courseId: string, page: number = 1, limit: number = 50): Promise<{
    course: {
      _id: string;
      title: string;
      instructor: {
        _id: string;
        firstName: string;
        lastName: string;
        email: string;
      };
    };
    students: Array<{
      _id: string;
      firstName: string;
      lastName: string;
      email: string;
      enrolledAt: string;
      enrollmentType: 'notes' | 'live_sessions' | 'both';
      paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
      progress: {
        totalProgress: number;
        lastAccessedAt?: string;
        completedLessons: number;
        completedAssignments: number;
      };
      accessPermissions: {
        canAccessNotes: boolean;
        canAccessLiveSessions: boolean;
        canDownloadMaterials: boolean;
        canSubmitAssignments: boolean;
      };
    }>;
    pagination: {
      currentPage: number;
      totalPages: number;
      totalStudents: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  }> => {
    const response = await apiService.get<{
      course: {
        _id: string;
        title: string;
        instructor: {
          _id: string;
          firstName: string;
          lastName: string;
          email: string;
        };
      };
      students: Array<{
        _id: string;
        firstName: string;
        lastName: string;
        email: string;
        enrolledAt: string;
        enrollmentType: 'notes' | 'live_sessions' | 'both';
        paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
        progress: {
          totalProgress: number;
          lastAccessedAt?: string;
          completedLessons: number;
          completedAssignments: number;
        };
        accessPermissions: {
          canAccessNotes: boolean;
          canAccessLiveSessions: boolean;
          canDownloadMaterials: boolean;
          canSubmitAssignments: boolean;
        };
      }>;
      pagination: {
        currentPage: number;
        totalPages: number;
        totalStudents: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
      };
    }>(`/courses/${courseId}/enrolled-students?page=${page}&limit=${limit}`);

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error || 'Failed to fetch enrolled students');
  },

  // Get teacher dashboard statistics
  getTeacherDashboardStats: async (): Promise<{
    overview: {
      totalCourses: number;
      activeCourses: number;
      pendingCourses: number;
      rejectedCourses: number;
      totalStudents: number;
      totalEnrollments: number;
      liveSessionsCount: number;
      averageCompletionRate: number;
      completedCourses: number;
      recentEnrollments: number;
      totalEarnings: number;
    };
    recentActivity: Array<{
      type: string;
      message: string;
      timestamp: string;
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
    }>;
    courses: Array<{
      _id: string;
      title: string;
      status: string;
      enrollmentCount: number;
      createdAt: string;
    }>;
  }> => {
    const response = await apiService.get<{
      overview: {
        totalCourses: number;
        activeCourses: number;
        pendingCourses: number;
        rejectedCourses: number;
        totalStudents: number;
        totalEnrollments: number;
        liveSessionsCount: number;
        averageCompletionRate: number;
        completedCourses: number;
        recentEnrollments: number;
        totalEarnings: number;
      };
      recentActivity: Array<{
        type: string;
        message: string;
        timestamp: string;
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
      }>;
      courses: Array<{
        _id: string;
        title: string;
        status: string;
        enrollmentCount: number;
        createdAt: string;
      }>;
    }>('/courses/teacher/dashboard-stats');

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error || 'Failed to fetch teacher dashboard statistics');
  }
};
