import { apiService } from './api';
import { IUser } from '../shared/types';

// Analytics interfaces
export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  activeInLastWeek: number;
  totalCourses: number;
  activeCourses: number;
  pendingApprovals: number;
  totalQuizzes: number;
  activeQuizzes: number;
  systemHealth: number;
}

export interface RoleDistribution {
  admin: number;
  teacher: number;
  student: number;
}

export interface DashboardAnalytics {
  stats: DashboardStats;
  roleDistribution: RoleDistribution;
}

export interface UserGrowthData {
  month: string;
  count: number;
}

export interface UserActivityData {
  date: string;
  activeUsers: number;
}

export interface EmailVerificationData {
  verified: number;
  unverified: number;
}

export interface UserAnalytics {
  userGrowth: UserGrowthData[];
  userActivity: UserActivityData[];
  emailVerification: EmailVerificationData;
  recentUsers: IUser[];
}

export interface CourseAnalytics {
  totalCourses: number;
  activeCourses: number;
  pendingCourses: number;
  approvedCourses: number;
  rejectedCourses: number;
  coursesByCategory: Array<{ _id: string; count: number }>;
  recentCourses: Array<{
    title: string;
    instructor: string;
    category: string;
    status: string;
    createdAt: string;
  }>;
}

export interface PerformanceAnalytics {
  systemHealth: number;
  serverUptime: number;
  memoryUsage: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
    arrayBuffers: number;
  };
  responseTime: {
    average: number;
    p95: number;
    p99: number;
  };
  errorRate: number;
  activeConnections: number;
  databaseConnections: number;
}

export interface SystemAlert {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  message: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high';
  actionUrl?: string;
  actionText?: string;
  actionRequired?: boolean;
}

export interface PendingApproval {
  id: string;
  type: 'teacher' | 'course';
  name: string;
  subject?: string;
  instructor?: string;
  submittedDate: string;
  status: 'pending' | 'approved' | 'rejected';
}

export const analyticsService = {
  // Get dashboard analytics
  getDashboardAnalytics: async (): Promise<DashboardAnalytics> => {
    const response = await apiService.get<DashboardAnalytics>('/analytics/dashboard');
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.error || 'Failed to fetch dashboard analytics');
  },

  // Get recent users
  getRecentUsers: async (limit: number = 10): Promise<IUser[]> => {
    const response = await apiService.get<{ recentUsers: IUser[] }>(
      `/analytics/recent-users?limit=${limit}`
    );
    
    if (response.success && response.data) {
      return response.data.recentUsers;
    }
    
    throw new Error(response.error || 'Failed to fetch recent users');
  },

  // Get user analytics
  getUserAnalytics: async (): Promise<UserAnalytics> => {
    const response = await apiService.get<UserAnalytics>('/analytics/users');
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.error || 'Failed to fetch user analytics');
  },

  // Get course analytics
  getCourseAnalytics: async (): Promise<CourseAnalytics> => {
    const response = await apiService.get<CourseAnalytics>('/analytics/courses');
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.error || 'Failed to fetch course analytics');
  },

  // Get performance analytics
  getPerformanceAnalytics: async (): Promise<PerformanceAnalytics> => {
    const response = await apiService.get<PerformanceAnalytics>('/analytics/performance');
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.error || 'Failed to fetch performance analytics');
  },

  // Get system alerts
  getSystemAlerts: async (): Promise<SystemAlert[]> => {
    const response = await apiService.get<{ alerts: SystemAlert[] }>('/analytics/alerts');

    if (response.success && response.data) {
      return response.data.alerts;
    }

    throw new Error(response.error || 'Failed to fetch system alerts');
  },

  // Get pending approvals
  getPendingApprovals: async (): Promise<PendingApproval[]> => {
    const response = await apiService.get<{ approvals: PendingApproval[] }>('/analytics/pending-approvals');

    if (response.success && response.data) {
      return response.data.approvals;
    }

    throw new Error(response.error || 'Failed to fetch pending approvals');
  }
};
