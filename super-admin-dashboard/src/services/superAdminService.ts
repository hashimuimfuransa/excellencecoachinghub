import { apiGet, apiPost, apiPut, apiDelete } from './api';
import type { User } from '../types/user';
import type { Job } from '../types/job';
import type { Course } from '../types/course';
import type { PsychometricTest } from '../types/test';
import type { JobApplication, AIInterview, JobCertificate, PaymentRequest } from '../types/common';

// Dashboard Statistics Interface
export interface DashboardStats {
  totalUsers: number;
  totalJobs: number;
  totalApplications: number;
  totalCourses: number;
  totalTests: number;
  totalInterviews: number;
  totalCertificates: number;
  activeUsers: number;
  pendingApplications: number;
  systemHealth: 'excellent' | 'good' | 'warning' | 'critical';
  usersByRole: Record<string, number>;
  jobsByStatus: Record<string, number>;
  applicationsByStatus: Record<string, number>;
  monthlyGrowth: {
    users: number;
    jobs: number;
    applications: number;
  };
}

// System Alert Interface
export interface SystemAlert {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

// Recent Activity Interface
export interface RecentActivity {
  id: string;
  type: 'user_registered' | 'job_posted' | 'application_submitted' | 'certificate_issued' | 'course_created' | 'test_completed';
  title: string;
  description: string;
  timestamp: string;
  userId?: string;
  userName?: string;
  metadata?: Record<string, any>;
}

// Analytics Data Interface
export interface AnalyticsData {
  userGrowth: Array<{ date: string; count: number }>;
  jobPostings: Array<{ date: string; count: number }>;
  applications: Array<{ date: string; count: number }>;
  topEmployers: Array<{ name: string; jobCount: number; applicationCount: number }>;
  popularSkills: Array<{ skill: string; count: number }>;
  geographicDistribution: Array<{ location: string; count: number }>;
  conversionRates: {
    applicationToInterview: number;
    interviewToHire: number;
    courseCompletion: number;
    testCompletion: number;
  };
}

// System Settings Interface
export interface SystemSettings {
  maintenance: {
    enabled: boolean;
    message: string;
    scheduledStart?: string;
    scheduledEnd?: string;
  };
  features: {
    userRegistration: boolean;
    jobPosting: boolean;
    aiInterviews: boolean;
    psychometricTests: boolean;
    certificates: boolean;
  };
  limits: {
    maxJobsPerEmployer: number;
    maxApplicationsPerUser: number;
    maxFileUploadSize: number;
    sessionTimeout: number;
  };
  notifications: {
    emailEnabled: boolean;
    pushEnabled: boolean;
    smsEnabled: boolean;
  };
}

class SuperAdminService {
  // Helper method to extract data from API responses
  private extractApiData(response: any): any {
    console.log('🔍 SuperAdminService: Raw API response:', response);
    
    // If response has a data property, extract it
    if (response && typeof response === 'object') {
      if (response.data !== undefined) {
        console.log('🔍 SuperAdminService: Extracting data property:', response.data);
        return response.data;
      }
      // If response has success property and data
      if (response.success && response.data !== undefined) {
        console.log('🔍 SuperAdminService: Extracting success.data:', response.data);
        return response.data;
      }
      // Return the response as-is if it doesn't have nested data
      console.log('🔍 SuperAdminService: Using response as-is:', response);
      return response;
    }
    
    console.log('🔍 SuperAdminService: Response is not an object, returning as-is:', response);
    return response;
  }

  // Test method to check API response format
  async testApiResponse(): Promise<void> {
    try {
      console.log('🔍 SuperAdminService: Testing API response format...');
      const testResponse = await apiGet('/admin/dashboard/stats');
      console.log('🔍 SuperAdminService: Test response received:', testResponse);
      console.log('🔍 SuperAdminService: Test response type:', typeof testResponse);
      console.log('🔍 SuperAdminService: Test response keys:', Object.keys(testResponse || {}));
    } catch (error) {
      console.log('🔍 SuperAdminService: Test API call failed (expected):', error);
    }
  }

  // Dashboard Data
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      // Try to get real dashboard stats from API
      const response = await apiGet<any>('/admin/dashboard/stats');
      console.log('Dashboard stats response from API:', response);
      
      // Use the helper method to extract the actual data
      const stats = this.extractApiData(response);
      console.log('Dashboard stats loaded from API:', stats);
      return stats;
    } catch (error) {
      console.warn('Failed to fetch dashboard stats from API, calculating from available data:', error);
      
      try {
        // If main API fails, try to calculate stats from individual endpoints
        const [usersResponse, jobsResponse, applicationsResponse] = await Promise.allSettled([
          this.getAllUsers({ page: 1, limit: 1 }),
          this.getAllJobs({ page: 1, limit: 1 }),
          this.getAllApplications({ page: 1, limit: 1 })
        ]);

        const totalUsers = usersResponse.status === 'fulfilled' ? usersResponse.value.total : 0;
        const totalJobs = jobsResponse.status === 'fulfilled' ? jobsResponse.value.total : 0;
        const totalApplications = applicationsResponse.status === 'fulfilled' ? applicationsResponse.value.total : 0;

        // Calculate other stats based on available data
        const activeUsers = Math.floor(totalUsers * 0.3); // Estimate 30% active
        const pendingApplications = Math.floor(totalApplications * 0.15); // Estimate 15% pending

        return {
          totalUsers,
          totalJobs,
          totalApplications,
          totalCourses: Math.floor(totalJobs * 0.2), // Estimate
          totalTests: Math.floor(totalUsers * 0.1), // Estimate
          totalInterviews: Math.floor(totalApplications * 0.2), // Estimate
          totalCertificates: Math.floor(totalUsers * 0.05), // Estimate
          activeUsers,
          pendingApplications,
          systemHealth: totalUsers > 1000 ? 'good' : 'warning',
          usersByRole: {
            'job_seeker': Math.floor(totalUsers * 0.6),
            'employer': Math.floor(totalUsers * 0.2),
            'teacher': Math.floor(totalUsers * 0.1),
            'student': Math.floor(totalUsers * 0.08),
            'admin': Math.floor(totalUsers * 0.02)
          },
          jobsByStatus: {
            'active': Math.floor(totalJobs * 0.65),
            'closed': Math.floor(totalJobs * 0.25),
            'draft': Math.floor(totalJobs * 0.1)
          },
          applicationsByStatus: {
            'pending': Math.floor(totalApplications * 0.3),
            'reviewed': Math.floor(totalApplications * 0.4),
            'accepted': Math.floor(totalApplications * 0.15),
            'rejected': Math.floor(totalApplications * 0.15)
          },
          monthlyGrowth: {
            users: Math.floor(totalUsers * 0.08), // 8% monthly growth estimate
            jobs: Math.floor(totalJobs * 0.12), // 12% monthly growth estimate
            applications: Math.floor(totalApplications * 0.15) // 15% monthly growth estimate
          }
        };
      } catch (innerError) {
        console.warn('Failed to calculate stats from individual endpoints, using fallback:', innerError);
        // Final fallback to static data
        return {
          totalUsers: 15420,
          totalJobs: 2847,
          totalApplications: 8932,
          totalCourses: 456,
          totalTests: 234,
          totalInterviews: 1876,
          totalCertificates: 3421,
          activeUsers: 1247,
          pendingApplications: 156,
          systemHealth: 'good',
          usersByRole: {
            'job_seeker': 8934,
            'employer': 2847,
            'teacher': 1456,
            'student': 2034,
            'admin': 149
          },
          jobsByStatus: {
            'active': 1847,
            'closed': 756,
            'draft': 244
          },
          applicationsByStatus: {
            'pending': 2847,
            'reviewed': 3456,
            'accepted': 1234,
            'rejected': 1395
          },
          monthlyGrowth: {
            users: 1247,
            jobs: 234,
            applications: 1876
          }
        };
      }
    }
  }

  async getSystemAlerts(): Promise<SystemAlert[]> {
    try {
      console.log('🔍 SuperAdminService: Attempting to fetch system alerts from database API...');
      const response = await apiGet<any>('/admin/system/alerts');
      console.log('✅ SuperAdminService: Successfully loaded system alerts from database:', response);
      return this.extractApiData(response);
    } catch (error) {
      console.warn('❌ SuperAdminService: Database API not available for system alerts, using fallback data:', error);
      console.log('🏗️  SuperAdminService: This indicates the backend system alerts endpoint is not implemented');
      return [
        {
          id: '1',
          type: 'warning',
          title: 'High Server Load',
          message: 'Server CPU usage is at 85%. Consider scaling resources.',
          timestamp: new Date().toISOString(),
          isRead: false,
          priority: 'high'
        },
        {
          id: '2',
          type: 'info',
          title: 'Scheduled Maintenance',
          message: 'System maintenance scheduled for tomorrow at 2 AM UTC.',
          timestamp: new Date().toISOString(),
          isRead: false,
          priority: 'medium'
        }
      ];
    }
  }

  async getRecentActivity(limit: number = 10): Promise<RecentActivity[]> {
    try {
      console.log('🔍 SuperAdminService: Attempting to fetch recent activity from database API...');
      const response = await apiGet<any>(`/admin/activity/recent?limit=${limit}`);
      console.log('✅ SuperAdminService: Successfully loaded recent activity from database:', response);
      return this.extractApiData(response);
    } catch (error) {
      console.warn('❌ SuperAdminService: Database API not available for recent activity, using fallback data:', error);
      console.log('🏗️  SuperAdminService: This indicates the backend activity endpoint is not implemented');
      return [
        {
          id: '1',
          type: 'user_registered',
          title: 'New user registered',
          description: 'John Doe joined as Job Seeker',
          timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
          userId: '1',
          userName: 'John Doe'
        },
        {
          id: '2',
          type: 'job_posted',
          title: 'Job posted',
          description: 'Senior Developer position at TechCorp',
          timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          userId: '2',
          userName: 'Jane Smith'
        },
        {
          id: '3',
          type: 'certificate_issued',
          title: 'Certificate issued',
          description: 'React Development Certificate',
          timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
          userId: '3',
          userName: 'Mike Johnson'
        }
      ];
    }
  }

  async markAlertAsRead(alertId: string): Promise<void> {
    return apiPut(`/admin/system/alerts/${alertId}/read`);
  }

  // User Management
  async getAllUsers(params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{
    success: any;
    data: any;
    users: User[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      console.log('🔍 SuperAdminService: Attempting to fetch users from database API...');
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.search) queryParams.append('search', params.search);
      if (params?.role) queryParams.append('role', params.role);
      if (params?.status) queryParams.append('status', params.status);
      if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

      const result = await apiGet(`/admin/users?${queryParams.toString()}`);
      console.log('✅ SuperAdminService: Successfully loaded users from database:', result);
      return this.extractApiData(result);
    } catch (error) {
      console.warn('❌ SuperAdminService: Database API not available for users, using fallback data:', error);
      console.log('🏗️  SuperAdminService: This indicates the backend API is not running or users endpoint is not implemented');
      // Return fallback mock data
      const mockUsers: User[] = [
        {
          _id: '1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          role: 'job_seeker' as any,
          avatar: '',
          isActive: true,
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-20T15:30:00Z'
        },
        {
          _id: '2',
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane.smith@company.com',
          role: 'employer' as any,
          avatar: '',
          company: 'TechCorp Inc.',
          jobTitle: 'HR Manager',
          isActive: true,
          createdAt: '2024-01-10T09:00:00Z',
          updatedAt: '2024-01-19T14:20:00Z'
        },
        {
          _id: '3',
          firstName: 'Dr. Sarah',
          lastName: 'Johnson',
          email: 'sarah.johnson@university.edu',
          role: 'teacher' as any,
          avatar: '',
          isActive: true,
          createdAt: '2024-01-05T11:00:00Z',
          updatedAt: '2024-01-18T16:45:00Z'
        },
        {
          _id: '4',
          firstName: 'Mike',
          lastName: 'Wilson',
          email: 'mike.wilson@student.edu',
          role: 'student' as any,
          avatar: '',
          isActive: false,
          createdAt: '2024-01-12T13:00:00Z',
          updatedAt: '2024-01-17T12:10:00Z'
        },
        {
          _id: '5',
          firstName: 'Admin',
          lastName: 'User',
          email: 'admin@platform.com',
          role: 'admin' as any,
          avatar: '',
          isActive: true,
          createdAt: '2024-01-01T08:00:00Z',
          updatedAt: '2024-01-20T10:00:00Z'
        }
      ];

      const limit = params?.limit || 10;
      const page = params?.page || 1;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;

      return {
        users: mockUsers.slice(startIndex, endIndex),
        total: mockUsers.length,
        page: page,
        totalPages: Math.ceil(mockUsers.length / limit)
      };
    }
  }

  async getUserById(userId: string): Promise<User> {
    try {
      // Prefer the dedicated user profile endpoint to get full profile like Job Portal
      const response = await apiGet<any>(`/users/${userId}/profile`);
      const data = this.extractApiData(response);
      // Backend returns { success, data: { user, profileCompletion } }
      if (data?.user) return { ...data.user, profileCompletion: data.profileCompletion };
      // In case API is already unwrapped
      if (data?.profileCompletion || data?.firstName) return data;
      return data;
    } catch (error) {
      console.warn('Fallback to admin user endpoint for getUserById due to error:', error);
      const response = await apiGet<any>(`/admin/users/${userId}`);
      return this.extractApiData(response);
    }
  }

  async createUser(userData: Partial<User>): Promise<User> {
    try {
      const response = await apiPost<any>('/admin/users', userData);
      return this.extractApiData(response);
    } catch (error) {
      console.error('Failed to create user:', error);
      throw error;
    }
  }

  async updateUser(userId: string, userData: Partial<User>): Promise<User> {
    try {
      const response = await apiPut<any>(`/admin/users/${userId}`, userData);
      return this.extractApiData(response);
    } catch (error) {
      console.error('Failed to update user:', error);
      throw error;
    }
  }

  async deleteUser(userId: string): Promise<void> {
    return apiDelete(`/admin/users/${userId}`);
  }

  async suspendUser(userId: string, reason?: string): Promise<void> {
    return apiPut(`/admin/users/${userId}/suspend`, { reason });
  }

  async activateUser(userId: string): Promise<void> {
    return apiPut(`/admin/users/${userId}/activate`);
  }

  async impersonateUser(userId: string): Promise<{ token: string; user: User }> {
    try {
      const response = await apiPost<any>(`/admin/users/${userId}/impersonate`);
      return this.extractApiData(response);
    } catch (error) {
      console.error('Failed to impersonate user:', error);
      throw error;
    }
  }

  async bulkUserAction(userIds: string[], action: 'activate' | 'suspend' | 'delete', reason?: string): Promise<void> {
    return apiPost('/admin/users/bulk-action', { userIds, action, reason });
  }

  async getUserStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    newUsersThisMonth: number;
    suspendedUsers: number;
    usersByRole: Record<string, number>;
  }> {
    try {
      const response = await apiGet('/admin/users/stats');
      return this.extractApiData(response);
    } catch (error) {
      console.warn('Failed to fetch user stats, using fallback mock data:', error);
      console.log('🏗️  SuperAdminService: This indicates the backend user stats endpoint is not implemented');
      return {
        totalUsers: 1247,
        activeUsers: 1156,
        newUsersThisMonth: 89,
        suspendedUsers: 14,
        usersByRole: {
          'admin': 3,
          'employer': 245,
          'job_seeker': 999
        }
      };
    }
  }

  async getCourseStats(): Promise<{
    totalCourses: number;
    activeCourses: number;
    draftCourses: number;
    totalEnrollments: number;
    completionRate: number;
    averageRating: number;
    topInstructors: Array<{
      instructor: string;
      courses: number;
      students: number;
      rating: number;
    }>;
    topCategories: Array<{
      category: string;
      courses: number;
      enrollments: number;
    }>;
  }> {
    try {
      const response = await apiGet('/admin/courses/stats');
      return this.extractApiData(response);
    } catch (error) {
      console.warn('Failed to fetch course stats, using fallback:', error);
      return {
        totalCourses: 0,
        activeCourses: 0,
        draftCourses: 0,
        totalEnrollments: 0,
        completionRate: 0,
        averageRating: 0,
        topInstructors: [],
        topCategories: []
      };
    }
  }

  // Job Management
  async getAllJobs(params?: {
    page?: number;
    limit?: number;
    search?: string;
    searchType?: string;
    status?: string;
    employerId?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{
    success: any;
    data: any;
    jobs: Job[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      console.log('🔍 SuperAdminService: Attempting to fetch jobs from database API...');
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.search) queryParams.append('search', params.search);
      if (params?.searchType) queryParams.append('searchType', params.searchType);
      // For super admin, don't filter by status to see all jobs including expired ones
      // if (params?.status) queryParams.append('status', params.status);
      if (params?.employerId) queryParams.append('employerId', params.employerId);
      if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

      const result = await apiGet(`/jobs/admin/all?${queryParams.toString()}`);
      console.log('✅ SuperAdminService: Successfully loaded jobs from database:', result);
      
      // Handle the specific response format from /jobs/admin/all endpoint
      if (result && result.success && result.data && result.pagination) {
        return {
          jobs: result.data,
          total: result.pagination.total,
          page: result.pagination.current,
          totalPages: result.pagination.pages
        };
      }
      
      return this.extractApiData(result);
    } catch (error) {
      console.warn('❌ SuperAdminService: Database API not available for jobs, using fallback data:', error);
      console.log('🏗️  SuperAdminService: This indicates the backend jobs endpoint is not implemented');
      
      // Return fallback mock data
      const mockJobs: Job[] = [
        {
          _id: '1',
          title: 'Senior Frontend Developer',
          description: 'We are looking for an experienced Frontend Developer...',
          company: 'TechCorp Inc.',
          location: 'San Francisco, CA',
          type: 'full-time',
          salary: { min: 120000, max: 150000, currency: 'USD' },
          requirements: ['React', 'TypeScript', 'Node.js'],
          benefits: ['Health Insurance', '401k', 'Remote Work'],
          status: 'active',
          postedBy: '2',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          featured: true,
          applicationCount: 45,
          viewCount: 230
        },
        {
          _id: '2',
          title: 'Data Scientist',
          description: 'Join our data team to build machine learning models...',
          company: 'DataTech Solutions',
          location: 'New York, NY',
          type: 'full-time',
          salary: { min: 130000, max: 170000, currency: 'USD' },
          requirements: ['Python', 'Machine Learning', 'SQL'],
          benefits: ['Health Insurance', 'Stock Options', 'Flexible Hours'],
          status: 'active',
          postedBy: '3',
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          featured: false,
          applicationCount: 32,
          viewCount: 180
        },
        {
          _id: '3',
          title: 'Backend Engineer',
          description: 'Looking for a skilled backend engineer to join our team...',
          company: 'TechCorp Inc.',
          location: 'Austin, TX',
          type: 'full-time',
          salary: { min: 110000, max: 140000, currency: 'USD' },
          requirements: ['Node.js', 'MongoDB', 'Express'],
          benefits: ['Health Insurance', 'Remote Work', 'Learning Budget'],
          status: 'active',
          postedBy: '2',
          createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
          featured: false,
          applicationCount: 28,
          viewCount: 145
        },
        {
          _id: '4',
          title: 'Product Manager',
          description: 'Seeking an experienced product manager to lead our initiatives...',
          company: 'InnovateHub',
          location: 'Seattle, WA',
          type: 'full-time',
          salary: { min: 140000, max: 180000, currency: 'USD' },
          requirements: ['Product Management', 'Agile', 'Analytics'],
          benefits: ['Health Insurance', 'Stock Options', 'Unlimited PTO'],
          status: 'pending',
          postedBy: '4',
          createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
          featured: true,
          applicationCount: 52,
          viewCount: 280
        },
        {
          _id: '5',
          title: 'DevOps Engineer',
          description: 'Join our infrastructure team to build scalable systems...',
          company: 'CloudFirst Technologies',
          location: 'Denver, CO',
          type: 'contract',
          salary: { min: 100000, max: 130000, currency: 'USD' },
          requirements: ['AWS', 'Docker', 'Kubernetes'],
          benefits: ['Health Insurance', 'Flexible Schedule'],
          status: 'active',
          postedBy: '5',
          createdAt: new Date(Date.now() - 96 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 96 * 60 * 60 * 1000).toISOString(),
          featured: false,
          applicationCount: 19,
          viewCount: 92
        }
      ];

      // Apply search filtering to mock data
      let filteredJobs = mockJobs;
      
      if (params?.search) {
        const searchTerm = params.search.toLowerCase();
        const searchType = params.searchType || 'job';
        
        filteredJobs = mockJobs.filter(job => {
          if (searchType === 'company') {
            return job.company.toLowerCase().includes(searchTerm);
          } else if (searchType === 'job') {
            return job.title.toLowerCase().includes(searchTerm) ||
                   job.description.toLowerCase().includes(searchTerm);
          } else {
            // 'other' - search in all fields
            return job.title.toLowerCase().includes(searchTerm) ||
                   job.description.toLowerCase().includes(searchTerm) ||
                   job.company.toLowerCase().includes(searchTerm) ||
                   job.location.toLowerCase().includes(searchTerm);
          }
        });
      }
      
      // Apply status filtering
      if (params?.status) {
        filteredJobs = filteredJobs.filter(job => job.status === params.status);
      }

      const limit = params?.limit || 10;
      const page = params?.page || 1;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;

      return {
        jobs: filteredJobs.slice(startIndex, endIndex),
        total: filteredJobs.length,
        page: page,
        totalPages: Math.ceil(filteredJobs.length / limit)
      };
    }
  }

  async approveJob(jobId: string): Promise<void> {
    return apiPut(`/admin/jobs/${jobId}/approve`);
  }

  async rejectJob(jobId: string, reason: string): Promise<void> {
    return apiPut(`/admin/jobs/${jobId}/reject`, { reason });
  }

  async featureJob(jobId: string): Promise<void> {
    return apiPut(`/admin/jobs/${jobId}/feature`);
  }

  async unfeatureJob(jobId: string): Promise<void> {
    return apiPut(`/admin/jobs/${jobId}/unfeature`);
  }

  async createJob(jobData: Partial<Job>): Promise<Job> {
    try {
      console.log('🔍 SuperAdminService: Creating new job via API...');
      const response = await apiPost<any>('/admin/jobs', jobData);
      const result = this.extractApiData(response);
      console.log('✅ SuperAdminService: Successfully created job:', result);
      return result;
    } catch (error) {
      console.error('❌ SuperAdminService: Failed to create job:', error);
      throw error;
    }
  }

  async updateJob(jobId: string, jobData: Partial<Job>): Promise<Job> {
    try {
      console.log('🔍 SuperAdminService: Updating job via API...');
      const response = await apiPut<any>(`/admin/jobs/${jobId}`, jobData);
      const result = this.extractApiData(response);
      console.log('✅ SuperAdminService: Successfully updated job:', result);
      return result;
    } catch (error) {
      console.error('❌ SuperAdminService: Failed to update job:', error);
      throw error;
    }
  }

  async deleteJob(jobId: string): Promise<void> {
    try {
      console.log('🔍 SuperAdminService: Deleting job via API...');
      await apiDelete(`/admin/jobs/${jobId}`);
      console.log('✅ SuperAdminService: Successfully deleted job');
    } catch (error) {
      console.error('❌ SuperAdminService: Failed to delete job:', error);
      throw error;
    }
  }

  async bulkJobAction(jobIds: string[], action: 'activate' | 'pause' | 'archive' | 'delete'): Promise<void> {
    try {
      console.log('🔍 SuperAdminService: Performing bulk job action via API...');
      console.log(`📊 Action: ${action}, Job IDs: ${jobIds.length} jobs`);
      
      const response = await apiPost('/admin/jobs/bulk-action', { jobIds, action });
      console.log('✅ SuperAdminService: Successfully performed bulk job action');
      
      return response;
    } catch (error) {
      console.error('❌ SuperAdminService: Failed to perform bulk job action:', error);
      throw error;
    }
  }

  async getJobStats(): Promise<{
    totalJobs: number;
    activeJobs: number;
    draftJobs: number;
    expiredJobs: number;
    totalApplications: number;
    averageApplicationsPerJob: number;
    topEmployers: Array<{
      company: string;
      jobs: number;
      applications: number;
    }>;
  }> {
    try {
      console.log('🔍 SuperAdminService: Loading job stats...');
      const response = await apiGet('/admin/jobs/stats');
      const result = this.extractApiData(response);
      console.log('✅ SuperAdminService: Successfully loaded job stats:', result);
      return result;
    } catch (error) {
      console.warn('Failed to fetch job stats, using fallback mock data:', error);
      console.log('🏗️  SuperAdminService: This indicates the backend job stats endpoint is not implemented');
      return {
        totalJobs: 2847,
        activeJobs: 1923,
        draftJobs: 456,
        expiredJobs: 468,
        totalApplications: 8932,
        averageApplicationsPerJob: 3.1,
        topEmployers: [
          { company: 'TechCorp Inc.', jobs: 45, applications: 892 },
          { company: 'Innovation Labs', jobs: 38, applications: 756 },
          { company: 'Digital Solutions', jobs: 32, applications: 634 },
          { company: 'StartupXYZ', jobs: 28, applications: 523 },
          { company: 'Enterprise Co.', jobs: 24, applications: 445 }
        ]
      };
    }
  }

  async deleteExpiredJobs(): Promise<{
    deletedCount: number;
    deletedJobs: Array<{
      id: string;
      title: string;
      company: string;
      deadline: string;
    }>;
  }> {
    try {
      console.log('🔍 SuperAdminService: Deleting expired jobs via API...');
      const response = await apiPost<any>('/jobs/delete-expired');
      const result = this.extractApiData(response);
      console.log('✅ SuperAdminService: Successfully deleted expired jobs:', result);
      return result;
    } catch (error) {
      console.error('❌ SuperAdminService: Failed to delete expired jobs:', error);
      throw error;
    }
  }

  async getApplicationStats(): Promise<{
    totalApplications: number;
    pendingApplications: number;
    reviewedApplications: number;
    acceptedApplications: number;
    rejectedApplications: number;
    shortlistedApplications: number;
    recentApplications: number;
    statusDistribution: Array<{
      _id: string;
      count: number;
    }>;
    topJobsByApplications: Array<{
      jobTitle: string;
      company: string;
      applications: number;
    }>;
  }> {
    try {
      console.log('🔍 SuperAdminService: Loading application stats...');
      const response = await apiGet('/admin/applications/stats');
      const result = this.extractApiData(response);
      console.log('✅ SuperAdminService: Successfully loaded application stats:', result);
      return result;
    } catch (error) {
      console.warn('Failed to fetch application stats, using fallback calculation:', error);
      console.log('🏗️  SuperAdminService: This indicates the backend application stats endpoint may not be working');
      
      // Try to calculate from existing data
      try {
        const applicationsResponse = await this.getAllApplications({ page: 1, limit: 1 });
        const totalApplications = applicationsResponse.total || 0;
        
        return {
          totalApplications,
          pendingApplications: Math.floor(totalApplications * 0.3),
          reviewedApplications: Math.floor(totalApplications * 0.4),
          acceptedApplications: Math.floor(totalApplications * 0.15),
          rejectedApplications: Math.floor(totalApplications * 0.15),
          shortlistedApplications: Math.floor(totalApplications * 0.1),
          recentApplications: Math.floor(totalApplications * 0.2),
          statusDistribution: [
            { _id: 'pending', count: Math.floor(totalApplications * 0.3) },
            { _id: 'reviewed', count: Math.floor(totalApplications * 0.4) },
            { _id: 'accepted', count: Math.floor(totalApplications * 0.15) },
            { _id: 'rejected', count: Math.floor(totalApplications * 0.15) }
          ],
          topJobsByApplications: [
            { jobTitle: 'Senior Frontend Developer', company: 'TechCorp Inc.', applications: 45 },
            { jobTitle: 'Backend Engineer', company: 'Innovation Labs', applications: 38 },
            { jobTitle: 'Full Stack Developer', company: 'Digital Solutions', applications: 32 }
          ]
        };
      } catch (fallbackError) {
        console.error('Failed to calculate application stats fallback:', fallbackError);
        return {
          totalApplications: 0,
          pendingApplications: 0,
          reviewedApplications: 0,
          acceptedApplications: 0,
          rejectedApplications: 0,
          shortlistedApplications: 0,
          recentApplications: 0,
          statusDistribution: [],
          topJobsByApplications: []
        };
      }
    }
  }

  // Course Management
  async getAllCourses(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    category?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{
    courses: Course[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      console.log('🔍 SuperAdminService: Attempting to fetch courses from database API...');
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.search) queryParams.append('search', params.search);
      if (params?.status) queryParams.append('status', params.status);
      if (params?.category) queryParams.append('category', params.category);
      if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

      const result = await apiGet(`/admin/courses?${queryParams.toString()}`);
      console.log('✅ SuperAdminService: Successfully loaded courses from database:', result);
      return this.extractApiData(result);
    } catch (error) {
      console.warn('❌ SuperAdminService: Database API not available for courses, using empty result:', error);
      console.log('🏗️  SuperAdminService: This indicates the backend courses endpoint is not implemented');
      // Return empty result since courses are optional
      return {
        courses: [],
        total: 0,
        page: params?.page || 1,
        totalPages: 0
      };
    }
  }

  async deleteCourse(courseId: string): Promise<void> {
    return apiDelete(`/admin/courses/${courseId}`);
  }

  // Test Management
  async getAllTests(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    type?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{
    tests: PsychometricTest[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      console.log('🔍 SuperAdminService: Attempting to fetch tests from database API...');
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.search) queryParams.append('search', params.search);
      if (params?.status) queryParams.append('status', params.status);
      if (params?.type) queryParams.append('type', params.type);
      if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

      const result = await apiGet(`/admin/tests?${queryParams.toString()}`);
      console.log('✅ SuperAdminService: Successfully loaded tests from database:', result);
      return this.extractApiData(result);
    } catch (error) {
      console.warn('❌ SuperAdminService: Database API not available for tests, using empty result:', error);
      console.log('🏗️  SuperAdminService: This indicates the backend tests endpoint is not implemented');
      // Return empty result since tests are optional
      return {
        tests: [],
        total: 0,
        page: params?.page || 1,
        totalPages: 0
      };
    }
  }

  async deleteTest(testId: string): Promise<void> {
    return apiDelete(`/admin/tests/${testId}`);
  }

  // Certificate Management
  async getAllCertificates(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    type?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{
    certificates: JobCertificate[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      console.log('🔍 SuperAdminService: Attempting to fetch certificates from database API...');
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.search) queryParams.append('search', params.search);
      if (params?.status) queryParams.append('status', params.status);
      if (params?.type) queryParams.append('type', params.type);
      if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

      const result = await apiGet(`/admin/certificates?${queryParams.toString()}`);
      console.log('✅ SuperAdminService: Successfully loaded certificates from database:', result);
      return this.extractApiData(result);
    } catch (error) {
      console.warn('❌ SuperAdminService: Database API not available for certificates, using empty result:', error);
      console.log('🏗️  SuperAdminService: This indicates the backend certificates endpoint is not implemented');
      // Return empty result since certificates are optional
      return {
        certificates: [],
        total: 0,
        page: params?.page || 1,
        totalPages: 0
      };
    }
  }

  async deleteCertificate(certificateId: string): Promise<void> {
    return apiDelete(`/admin/certificates/${certificateId}`);
  }

  // System Settings
  async getSystemSettings(): Promise<SystemSettings> {
    try {
      const response = await apiGet<any>('/admin/system/settings');
      return this.extractApiData(response);
    } catch (error) {
      console.warn('System settings API not available, using fallback');
      // Return fallback settings
      return {
        maintenance: {
          enabled: false,
          message: 'System under maintenance. Please try again later.',
          scheduledStart: '',
          scheduledEnd: ''
        },
        features: {
          userRegistration: true,
          jobPosting: true,
          aiInterviews: true,
          psychometricTests: true,
          certificates: true
        },
        limits: {
          maxJobsPerEmployer: 50,
          maxApplicationsPerUser: 100,
          maxFileUploadSize: 10,
          sessionTimeout: 30
        },
        notifications: {
          emailEnabled: true,
          pushEnabled: true,
          smsEnabled: false
        }
      };
    }
  }

  async updateSystemSettings(settings: SystemSettings): Promise<SystemSettings> {
    try {
      const response = await apiPut<any>('/admin/system/settings', settings);
      return this.extractApiData(response);
    } catch (error) {
      console.error('Failed to update system settings:', error);
      throw error;
    }
  }

  async resetSystemSettings(): Promise<SystemSettings> {
    try {
      const response = await apiPost<any>('/admin/system/settings/reset');
      return this.extractApiData(response);
    } catch (error) {
      console.error('Failed to reset system settings:', error);
      throw error;
    }
  }

  // Application Management
  async getAllApplications(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    jobId?: string;
    applicantId?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{
    data: any;
    success: any;
    applications: JobApplication[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      console.log('🔍 SuperAdminService: Attempting to fetch applications from database API...');
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.search) queryParams.append('search', params.search);
      if (params?.status) queryParams.append('status', params.status);
      if (params?.jobId) queryParams.append('jobId', params.jobId);
      if (params?.applicantId) queryParams.append('applicantId', params.applicantId);
      if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

      const result = await apiGet(`/admin/applications?${queryParams.toString()}`);
      console.log('✅ SuperAdminService: Successfully loaded applications from database:', result);
      return this.extractApiData(result);
    } catch (error) {
      console.warn('❌ SuperAdminService: Database API not available for applications, using fallback data:', error);
      console.log('🏗️  SuperAdminService: This indicates the backend applications endpoint is not implemented');
      
      // Return fallback mock data
      const mockApplications: JobApplication[] = [
        {
          _id: '1',
          jobId: '1',
          jobTitle: 'Senior Frontend Developer',
          applicantId: '1',
          applicantName: 'John Doe',
          applicantEmail: 'john.doe@example.com',
          status: 'pending',
          submittedAt: new Date().toISOString(),
          resume: 'john_doe_resume.pdf',
          coverLetter: 'I am very interested in this position...',
          score: 85,
          notes: []
        },
        {
          _id: '2',
          jobId: '2',
          jobTitle: 'Data Scientist',
          applicantId: '3',
          applicantName: 'Mike Wilson',
          applicantEmail: 'mike.wilson@example.com',
          status: 'reviewed',
          submittedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          resume: 'mike_wilson_resume.pdf',
          coverLetter: 'My background in machine learning...',
          score: 92,
          notes: ['Strong technical background', 'Good communication skills']
        }
      ];

      const limit = params?.limit || 10;
      const page = params?.page || 1;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;

      return {
        applications: mockApplications.slice(startIndex, endIndex),
        total: mockApplications.length,
        page: page,
        totalPages: Math.ceil(mockApplications.length / limit)
      };
    }
  }

  // Course Management
  async getAllCourses(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    teacherId?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{
    courses: Course[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      console.log('🔍 SuperAdminService: Attempting to fetch courses from database API...');
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.search) queryParams.append('search', params.search);
      if (params?.status) queryParams.append('status', params.status);
      if (params?.teacherId) queryParams.append('teacherId', params.teacherId);
      if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

      const result = await apiGet(`/admin/courses?${queryParams.toString()}`);
      console.log('✅ SuperAdminService: Successfully loaded courses from database:', result);
      return this.extractApiData(result);
    } catch (error) {
      console.warn('❌ SuperAdminService: Database API not available for courses, using empty result:', error);
      console.log('🏗️  SuperAdminService: This indicates the backend courses endpoint is not implemented');
      // Return empty result since courses are optional
      return {
        courses: [],
        total: 0,
        page: params?.page || 1,
        totalPages: 0
      };
    }
  }

  async approveCourse(courseId: string): Promise<void> {
    return apiPut(`/admin/courses/${courseId}/approve`);
  }

  async rejectCourse(courseId: string, reason: string): Promise<void> {
    return apiPut(`/admin/courses/${courseId}/reject`, { reason });
  }

  // Test Management
  async getAllTests(params?: {
    page?: number;
    limit?: number;
    search?: string;
    type?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{
    tests: PsychometricTest[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      console.log('🔍 SuperAdminService: Attempting to fetch tests from database API...');
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.search) queryParams.append('search', params.search);
      if (params?.type) queryParams.append('type', params.type);
      if (params?.status) queryParams.append('status', params.status);
      if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

      const result = await apiGet(`/admin/tests?${queryParams.toString()}`);
      console.log('✅ SuperAdminService: Successfully loaded tests from database:', result);
      return this.extractApiData(result);
    } catch (error) {
      console.warn('❌ SuperAdminService: Database API not available for tests, using empty result:', error);
      console.log('🏗️  SuperAdminService: This indicates the backend tests endpoint is not implemented');
      // Return empty result since tests are optional
      return {
        tests: [],
        total: 0,
        page: params?.page || 1,
        totalPages: 0
      };
    }
  }

  async createTest(testData: Partial<PsychometricTest>): Promise<PsychometricTest> {
    try {
      const response = await apiPost<any>('/admin/tests', testData);
      return this.extractApiData(response);
    } catch (error) {
      console.error('Failed to create test:', error);
      throw error;
    }
  }

  async updateTest(testId: string, testData: Partial<PsychometricTest>): Promise<PsychometricTest> {
    try {
      const response = await apiPut<any>(`/admin/tests/${testId}`, testData);
      return this.extractApiData(response);
    } catch (error) {
      console.error('Failed to update test:', error);
      throw error;
    }
  }

  async deleteTest(testId: string): Promise<void> {
    return apiDelete(`/admin/tests/${testId}`);
  }

  async getTestStats(): Promise<{
    totalTests: number;
    activeTests: number;
    draftTests: number;
    totalAttempts: number;
    averageScore: number;
    passRate: number;
    topPerformingTests: Array<{
      testTitle: string;
      attempts: number;
      averageScore: number;
      passRate: number;
    }>;
  }> {
    try {
      console.log('🔍 SuperAdminService: Loading test stats...');
      const response = await apiGet('/admin/tests/stats');
      const result = this.extractApiData(response);
      console.log('✅ SuperAdminService: Successfully loaded test stats:', result);
      return result;
    } catch (error) {
      console.warn('Failed to fetch test stats, using fallback mock data:', error);
      console.log('🏗️  SuperAdminService: This indicates the backend test stats endpoint is not implemented');
      return {
        totalTests: 234,
        activeTests: 187,
        draftTests: 47,
        totalAttempts: 15642,
        averageScore: 78.5,
        passRate: 73.2,
        topPerformingTests: [
          { testTitle: 'JavaScript Fundamentals', attempts: 1245, averageScore: 82.3, passRate: 76.8 },
          { testTitle: 'Python Basics', attempts: 987, averageScore: 79.6, passRate: 74.1 },
          { testTitle: 'Data Structures', attempts: 834, averageScore: 75.2, passRate: 68.9 },
          { testTitle: 'Algorithm Design', attempts: 723, averageScore: 73.8, passRate: 65.4 },
          { testTitle: 'Database Management', attempts: 645, averageScore: 77.1, passRate: 71.3 }
        ]
      };
    }
  }

  // Interview Management
  async getAllInterviews(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    jobId?: string;
    candidateId?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{
    interviews: AIInterview[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.jobId) queryParams.append('jobId', params.jobId);
    if (params?.candidateId) queryParams.append('candidateId', params.candidateId);
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    try {
      console.log('🔍 SuperAdminService: Attempting to fetch interviews from database API...');
      const result = await apiGet(`/admin/interviews?${queryParams.toString()}`);
      console.log('✅ SuperAdminService: Successfully loaded interviews from database:', result);
      return this.extractApiData(result);
    } catch (error) {
      console.warn('❌ SuperAdminService: Database API not available for interviews, using empty result:', error);
      console.log('🏗️  SuperAdminService: This indicates the backend interviews endpoint is not implemented');
      // Return empty result since interviews are optional
      return {
        interviews: [],
        total: 0,
        page: params?.page || 1,
        totalPages: 0
      };
    }
  }

  // Certificate Management (duplicate method removed - using the one above)

  async issueCertificate(certificateData: {
    userId: string;
    type: string;
    title: string;
    description?: string;
    metadata?: Record<string, any>;
  }): Promise<JobCertificate> {
    try {
      const response = await apiPost<any>('/admin/certificates', certificateData);
      return this.extractApiData(response);
    } catch (error) {
      console.error('Failed to issue certificate:', error);
      throw error;
    }
  }

  async revokeCertificate(certificateId: string, reason: string): Promise<void> {
    return apiPut(`/admin/certificates/${certificateId}/revoke`, { reason });
  }

  // Analytics
  async getAnalyticsData(timeRange: '7d' | '30d' | '90d' | '1y' = '30d'): Promise<AnalyticsData> {
    try {
      const response = await apiGet<any>(`/admin/analytics?timeRange=${timeRange}`);
      return this.extractApiData(response);
    } catch (error) {
      console.warn('Failed to fetch analytics data from API, using fallback data:', error);
      // Return fallback analytics data
      const now = new Date();
      const dates = Array.from({ length: 30 }, (_, i) => {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        return date.toISOString().split('T')[0];
      }).reverse();

      return {
        userGrowth: dates.map((date, i) => ({ date, count: 100 + i * 5 + Math.floor(Math.random() * 20) })),
        jobPostings: dates.map((date, i) => ({ date, count: 20 + i * 2 + Math.floor(Math.random() * 10) })),
        applications: dates.map((date, i) => ({ date, count: 80 + i * 3 + Math.floor(Math.random() * 15) })),
        topEmployers: [
          { name: 'TechCorp Inc.', jobCount: 45, applicationCount: 324 },
          { name: 'Digital Solutions Ltd.', jobCount: 38, applicationCount: 287 },
          { name: 'Innovation Labs', jobCount: 32, applicationCount: 245 },
          { name: 'Future Systems', jobCount: 28, applicationCount: 198 },
          { name: 'Cloud Tech', jobCount: 25, applicationCount: 176 }
        ],
        popularSkills: [
          { skill: 'JavaScript', count: 1247 },
          { skill: 'Python', count: 1156 },
          { skill: 'React', count: 987 },
          { skill: 'Node.js', count: 876 },
          { skill: 'AWS', count: 745 },
          { skill: 'TypeScript', count: 654 },
          { skill: 'Docker', count: 543 },
          { skill: 'SQL', count: 487 }
        ],
        geographicDistribution: [
          { location: 'New York', count: 2847 },
          { location: 'California', count: 2456 },
          { location: 'Texas', count: 1876 },
          { location: 'Florida', count: 1654 },
          { location: 'Illinois', count: 1432 },
          { location: 'Washington', count: 1234 }
        ],
        conversionRates: {
          applicationToInterview: 0.35,
          interviewToHire: 0.28,
          courseCompletion: 0.72,
          testCompletion: 0.85
        }
      };
    }
  }

  async exportData(type: 'users' | 'jobs' | 'applications' | 'courses' | 'tests' | 'certificates', format: 'csv' | 'xlsx' = 'csv'): Promise<Blob> {
    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/admin/export/${type}?format=${format}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Export failed');
    }
    
    return response.blob();
  }

  // System Management (duplicate methods removed - using the ones above)

  async createBackup(): Promise<{ backupId: string; downloadUrl: string }> {
    try {
      const response = await apiPost<any>('/admin/system/backup');
      return this.extractApiData(response);
    } catch (error) {
      console.error('Failed to create backup:', error);
      throw error;
    }
  }

  async getBackupHistory(): Promise<Array<{
    id: string;
    createdAt: string;
    size: number;
    status: 'completed' | 'failed' | 'in_progress';
    downloadUrl?: string;
  }>> {
    try {
      const response = await apiGet<any>('/admin/system/backups');
      return this.extractApiData(response);
    } catch (error) {
      console.error('Failed to get backup history:', error);
      throw error;
    }
  }

  async restoreBackup(backupId: string): Promise<void> {
    return apiPost(`/admin/system/backups/${backupId}/restore`);
  }

  async getSystemHealth(): Promise<{
    status: 'excellent' | 'good' | 'warning' | 'critical';
    services: Record<string, {
      status: 'healthy' | 'degraded' | 'down';
      responseTime?: number;
      lastCheck: string;
    }>;
    metrics: {
      cpuUsage: number;
      memoryUsage: number;
      diskUsage: number;
      activeConnections: number;
    };
  }> {
    try {
      const response = await apiGet<any>('/admin/system/health');
      return this.extractApiData(response);
    } catch (error) {
      console.error('Failed to get system health:', error);
      throw error;
    }
  }

  async clearCache(type?: 'all' | 'users' | 'jobs' | 'courses'): Promise<void> {
    return apiPost('/admin/system/cache/clear', { type });
  }

  async sendSystemNotification(notification: {
    title: string;
    message: string;
    type: 'info' | 'warning' | 'error' | 'success';
    targetUsers?: string[];
    targetRoles?: string[];
  }): Promise<void> {
    return apiPost('/admin/system/notifications', notification);
  }

  // Payment Request Management
  async getPaymentRequests(status?: string, page: number = 1, limit: number = 20): Promise<{
    data: PaymentRequest[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });
      
      if (status) {
        params.append('status', status);
      }

      const response = await apiGet<any>(`/payment-requests?${params}`);
      return this.extractApiData(response);
    } catch (error) {
      console.error('Failed to get payment requests:', error);
      throw error;
    }
  }

  async approvePaymentRequest(requestId: string, approvalData?: {
    adminNotes?: string;
    paymentAmount?: number;
    paymentMethod?: string;
  }): Promise<PaymentRequest> {
    try {
      const response = await apiPut<any>(`/payment-requests/${requestId}/status`, {
        status: 'approved',
        ...approvalData
      });
      return this.extractApiData(response);
    } catch (error) {
      console.error('Failed to approve payment request:', error);
      throw error;
    }
  }

  async rejectPaymentRequest(requestId: string, adminNotes?: string): Promise<PaymentRequest> {
    try {
      const response = await apiPut<any>(`/payment-requests/${requestId}/status`, {
        status: 'rejected',
        adminNotes
      });
      return this.extractApiData(response);
    } catch (error) {
      console.error('Failed to reject payment request:', error);
      throw error;
    }
  }

  async getPendingPaymentRequestsCount(): Promise<number> {
    try {
      const response = await apiGet<any>('/payment-requests/pending-count');
      return this.extractApiData(response);
    } catch (error) {
      console.error('Failed to get pending payment requests count:', error);
      return 0;
    }
  }

  // Company Profile Approval Management
  async getCompanyProfiles(endpoint: string): Promise<{
    success: boolean;
    data: {
      profiles: any[];
      total: number;
      page: number;
      totalPages: number;
    };
  }> {
    try {
      const response = await apiGet<any>(`/admin${endpoint}`);
      return response;
    } catch (error) {
      console.error('Failed to fetch company profiles:', error);
      throw error;
    }
  }

  async getCompanyProfile(profileId: string): Promise<{
    success: boolean;
    data: any;
  }> {
    try {
      const response = await apiGet<any>(`/admin/company-profiles/${profileId}`);
      return response;
    } catch (error) {
      console.error('Failed to fetch company profile:', error);
      throw error;
    }
  }

  async approveCompanyProfile(profileId: string, approvalNotes?: string): Promise<{
    success: boolean;
    data: any;
    message: string;
  }> {
    try {
      const response = await apiPost<any>(`/admin/company-profiles/${profileId}/approve`, {
        approvalNotes
      });
      return response;
    } catch (error) {
      console.error('Failed to approve company profile:', error);
      throw error;
    }
  }

  async rejectCompanyProfile(profileId: string, rejectionReason: string): Promise<{
    success: boolean;
    data: any;
    message: string;
  }> {
    try {
      const response = await apiPost<any>(`/admin/company-profiles/${profileId}/reject`, {
        rejectionReason
      });
      return response;
    } catch (error) {
      console.error('Failed to reject company profile:', error);
      throw error;
    }
  }

  async getCompanyProfileStats(): Promise<{
    success: boolean;
    data: {
      totalProfiles: number;
      pendingProfiles: number;
      approvedProfiles: number;
      rejectedProfiles: number;
      approvalRate: number;
      monthlySubmissions: any[];
    };
  }> {
    try {
      const response = await apiGet<any>('/admin/company-profiles/stats');
      return response;
    } catch (error) {
      console.error('Failed to fetch company profile stats:', error);
      throw error;
    }
  }

  // Past Papers Management
  async getPastPapers(filters: {
    page?: number;
    limit?: number;
    search?: string;
    status?: boolean;
    subject?: string;
    level?: string;
    year?: number;
    examBoard?: string;
  } = {}): Promise<{
    success: boolean;
    data: {
      pastPapers: any[];
      pagination: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
        itemsPerPage: number;
      };
    };
  }> {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
      const response = await apiGet<any>(`/admin/past-papers?${params}`);
      return response;
    } catch (error) {
      console.error('Failed to fetch past papers:', error);
      throw error;
    }
  }

  async createPastPaper(data: any): Promise<{ success: boolean; data: any }> {
    try {
      const response = await apiPost<any>('/admin/past-papers', data);
      return response;
    } catch (error) {
      console.error('Failed to create past paper:', error);
      throw error;
    }
  }

  async updatePastPaper(id: string, data: any): Promise<{ success: boolean; data: any }> {
    try {
      const response = await apiPut<any>(`/admin/past-papers/${id}`, data);
      return response;
    } catch (error) {
      console.error('Failed to update past paper:', error);
      throw error;
    }
  }

  async deletePastPaper(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiDelete<any>(`/admin/past-papers/${id}`);
      return response;
    } catch (error) {
      console.error('Failed to delete past paper:', error);
      throw error;
    }
  }

  async publishPastPaper(id: string): Promise<{ success: boolean; data: any }> {
    try {
      const response = await apiPost<any>(`/admin/past-papers/${id}/publish`);
      return response;
    } catch (error) {
      console.error('Failed to publish past paper:', error);
      throw error;
    }
  }

  async unpublishPastPaper(id: string): Promise<{ success: boolean; data: any }> {
    try {
      const response = await apiPost<any>(`/admin/past-papers/${id}/unpublish`);
      return response;
    } catch (error) {
      console.error('Failed to unpublish past paper:', error);
      throw error;
    }
  }

  async getPastPaperStatistics(id: string): Promise<{
    success: boolean;
    data: {
      pastPaper: any;
      statistics: {
        totalAttempts: number;
        averageScore: number;
        passRate: number;
        attemptsByMonth: Record<string, number>;
        scoreRanges: Record<string, number>;
        topicPerformance: Record<string, any>;
      };
    };
  }> {
    try {
      const response = await apiGet<any>(`/admin/past-papers/${id}/statistics`);
      return response;
    } catch (error) {
      console.error('Failed to fetch past paper statistics:', error);
      throw error;
    }
  }

  async getPastPaperAttempts(id: string, filters: {
    page?: number;
    limit?: number;
    status?: string;
  } = {}): Promise<{
    success: boolean;
    data: {
      attempts: any[];
      pagination: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
        itemsPerPage: number;
      };
    };
  }> {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
      const response = await apiGet<any>(`/admin/past-papers/${id}/attempts?${params}`);
      return response;
    } catch (error) {
      console.error('Failed to fetch past paper attempts:', error);
      throw error;
    }
  }

  async getOverallStatistics(): Promise<{
    success: boolean;
    data: {
      overview: {
        totalPastPapers: number;
        publishedPastPapers: number;
        totalAttempts: number;
        totalStudents: number;
      };
      pastPapersBySubject: Array<{ _id: string; count: number }>;
      pastPapersByLevel: Array<{ _id: string; count: number }>;
      attemptsByMonth: Array<{ _id: { year: number; month: number }; count: number }>;
      averageScoresBySubject: Array<{ _id: string; averageScore: number; totalAttempts: number }>;
    };
  }> {
    try {
      const response = await apiGet<any>('/admin/past-papers/statistics/overall');
      return response;
    } catch (error) {
      console.error('Failed to fetch overall statistics:', error);
      throw error;
    }
  }

  async extractTextFromDocument(data: {
    fileData: string;
    fileName: string;
    mimeType: string;
  }): Promise<{
    success: boolean;
    extractedText?: string;
    processingTime?: number;
    error?: string;
  }> {
    try {
      const response = await apiPost<any>('/documents/extract-text', data);
      return response;
    } catch (error) {
      console.error('Failed to extract text from document:', error);
      throw error;
    }
  }

  async generateAIContent(prompt: string): Promise<{
    success: boolean;
    content?: string;
    error?: string;
  }> {
    try {
      const response = await apiPost<any>('/ai/generate-content', { prompt });
      return response;
    } catch (error) {
      console.error('Failed to generate AI content:', error);
      throw error;
    }
  }
}

export const superAdminService = new SuperAdminService();
export default superAdminService;