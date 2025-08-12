import { apiService } from './api';

export interface IEnrollment {
  _id: string;
  user: string;
  course: {
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
    status: string;
    thumbnail?: string;
  };
  enrollmentDate: string;
  progress: number;
  isCompleted: boolean;
  lastAccessed: string;
  completionDate?: string;
}

export interface EnrollmentListResponse {
  enrollments: IEnrollment[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalEnrollments: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface EnrollmentFilters {
  page?: number;
  limit?: number;
}

export const enrollmentService = {
  // Enroll in a course
  enrollInCourse: async (courseId: string): Promise<IEnrollment> => {
    const response = await apiService.post<{ enrollment: IEnrollment }>('/enrollments/enroll', {
      courseId
    });
    
    if (response.success && response.data) {
      return response.data.enrollment;
    }
    
    throw new Error(response.error || 'Failed to enroll in course');
  },

  // Unenroll from a course
  unenrollFromCourse: async (courseId: string): Promise<void> => {
    const response = await apiService.delete(`/enrollments/unenroll/${courseId}`);
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to unenroll from course');
    }
  },

  // Get my enrollments
  getMyEnrollments: async (filters: EnrollmentFilters = {}): Promise<EnrollmentListResponse> => {
    const queryParams = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    const response = await apiService.get<EnrollmentListResponse>(
      `/enrollments/my-enrollments?${queryParams.toString()}`
    );
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.error || 'Failed to fetch enrollments');
  },

  // Get enrollment details for a specific course
  getEnrollmentDetails: async (courseId: string): Promise<IEnrollment> => {
    const response = await apiService.get<{ enrollment: IEnrollment }>(`/enrollments/${courseId}`);
    
    if (response.success && response.data) {
      return response.data.enrollment;
    }
    
    throw new Error(response.error || 'Failed to fetch enrollment details');
  },

  // Check if user is enrolled in a course (doesn't trigger logout on 401)
  isEnrolledInCourse: async (courseId: string): Promise<boolean> => {
    try {
      await enrollmentService.getEnrollmentDetails(courseId);
      return true;
    } catch (error) {
      return false;
    }
  },

  // Get enrollment details without triggering automatic logout
  getEnrollmentDetailsQuietly: async (courseId: string): Promise<IEnrollment | null> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return null;
      }

      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/enrollments/${courseId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 401) {
        // User not authenticated, but don't trigger logout
        return null;
      }

      if (response.status === 404) {
        // User not enrolled
        return null;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success && data.data) {
        return data.data.enrollment;
      }

      return null;
    } catch (error) {
      console.warn('Error checking enrollment status:', error);
      return null;
    }
  }
};