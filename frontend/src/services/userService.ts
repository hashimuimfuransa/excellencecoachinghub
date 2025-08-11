import { apiService } from './api';
import { IUser, UserRole } from '../shared/types';

// User management interfaces
export interface UserListResponse {
  users: IUser[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalUsers: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  roleDistribution: {
    admin: number;
    teacher: number;
    student: number;
  };
  emailVerification: {
    verified: number;
    unverified: number;
  };
  recentActivity: {
    newUsersLast30Days: number;
    activeInLastWeek: number;
  };
}

export interface CreateUserData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: UserRole;
  isActive?: boolean;
  isEmailVerified?: boolean;
}

export interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  email?: string;
  avatar?: string;
  currentPassword?: string;
  newPassword?: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface UserFilters {
  page?: number;
  limit?: number;
  search?: string;
  role?: UserRole;
  status?: 'active' | 'inactive';
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface BulkUpdateData {
  userIds: string[];
  updates: {
    isActive?: boolean;
    role?: UserRole;
    isEmailVerified?: boolean;
  };
}

export const userService = {
  // Get all users with filters and pagination
  getAllUsers: async (filters: UserFilters = {}): Promise<UserListResponse> => {
    const queryParams = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    const response = await apiService.get<UserListResponse>(
      `/users?${queryParams.toString()}`
    );
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.error || 'Failed to fetch users');
  },

  // Get user by ID
  getUserById: async (id: string): Promise<IUser> => {
    const response = await apiService.get<{ user: IUser }>(`/users/${id}`);
    
    if (response.success && response.data) {
      return response.data.user;
    }
    
    throw new Error(response.error || 'Failed to fetch user');
  },

  // Create new user
  createUser: async (userData: CreateUserData): Promise<IUser> => {
    const response = await apiService.post<{ user: IUser }>('/users', userData);
    
    if (response.success && response.data) {
      return response.data.user;
    }
    
    throw new Error(response.error || 'Failed to create user');
  },

  // Update user
  updateUser: async (id: string, userData: UpdateUserData): Promise<IUser> => {
    const response = await apiService.put<{ user: IUser }>(`/users/${id}`, userData);
    
    if (response.success && response.data) {
      return response.data.user;
    }
    
    throw new Error(response.error || 'Failed to update user');
  },

  // Delete user (soft delete)
  deleteUser: async (id: string): Promise<void> => {
    const response = await apiService.delete(`/users/${id}`);
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to delete user');
    }
  },

  // Get user statistics
  getUserStats: async (): Promise<UserStats> => {
    const response = await apiService.get<UserStats>('/users/stats');
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.error || 'Failed to fetch user statistics');
  },

  // Bulk update users
  bulkUpdateUsers: async (data: BulkUpdateData): Promise<{ modifiedCount: number; matchedCount: number }> => {
    const response = await apiService.put<{ modifiedCount: number; matchedCount: number }>(
      '/users/bulk-update',
      data
    );
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.error || 'Failed to bulk update users');
  },

  // Reset user password
  resetUserPassword: async (id: string, newPassword: string): Promise<void> => {
    const response = await apiService.put(`/users/${id}/reset-password`, { newPassword });
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to reset user password');
    }
  },

  // Activate user
  activateUser: async (id: string): Promise<IUser> => {
    return userService.updateUser(id, { isActive: true });
  },

  // Deactivate user
  deactivateUser: async (id: string): Promise<IUser> => {
    return userService.updateUser(id, { isActive: false });
  },

  // Change user role
  changeUserRole: async (id: string, role: UserRole): Promise<IUser> => {
    return userService.updateUser(id, { role });
  },

  // Verify user email
  verifyUserEmail: async (id: string): Promise<IUser> => {
    return userService.updateUser(id, { isEmailVerified: true });
  },

  // Unverify user email
  unverifyUserEmail: async (id: string): Promise<IUser> => {
    return userService.updateUser(id, { isEmailVerified: false });
  },

  // Profile-specific methods
  // Get current user profile
  getCurrentProfile: async (): Promise<IUser> => {
    const response = await apiService.get<{ user: IUser }>('/users/profile');

    if (response.success && response.data) {
      return response.data.user;
    }

    throw new Error(response.error || 'Failed to fetch profile');
  },

  // Update current user profile
  updateProfile: async (profileData: UpdateProfileData): Promise<IUser> => {
    const response = await apiService.put<{ user: IUser }>('/users/profile', profileData);

    if (response.success && response.data) {
      return response.data.user;
    }

    throw new Error(response.error || 'Failed to update profile');
  },

  // Change password
  changePassword: async (passwordData: ChangePasswordData): Promise<void> => {
    // Only send currentPassword and newPassword to the API
    const { currentPassword, newPassword } = passwordData;
    const response = await apiService.put('/users/change-password', {
      currentPassword,
      newPassword,
      confirmPassword: newPassword // Backend expects this for validation
    });

    if (!response.success) {
      throw new Error(response.error || 'Failed to change password');
    }
  },

  // Upload avatar
  uploadAvatar: async (file: File): Promise<{ avatarUrl: string; user: IUser }> => {
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await apiService.post<{ avatarUrl: string; user: IUser }>('/users/upload-avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error || 'Failed to upload avatar');
  }
};
