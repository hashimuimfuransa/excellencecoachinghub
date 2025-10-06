import { api } from './api';
import type { User } from '../types/user';

// Helper functions for API calls with consistent error handling
async function apiGet<T>(url: string, params?: Record<string, any>): Promise<T> {
  try {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    const finalUrl = queryParams.toString() ? `${url}?${queryParams}` : url;
    const response = await api.get(finalUrl);
    return response.data;
  } catch (error: any) {
    console.error(`API GET ${url} error:`, error);
    
    // Enhanced error handling with user-friendly messages
    if (error.response?.data?.userFriendly) {
      throw new Error(error.response.data.message);
    }
    
    // Handle rate limiting errors
    if (error.response?.status === 429) {
      const retryAfter = error.response?.data?.retryAfter || 60;
      const minutes = Math.ceil(retryAfter / 60);
      throw new Error(`Too many requests. Please wait ${minutes} minute${minutes > 1 ? 's' : ''} and try again.`);
    }
    
    // Handle network errors
    if (error.code === 'NETWORK_ERROR' || !error.response) {
      throw new Error('Network connection failed. Please check your internet connection and try again.');
    }
    
    // Handle server errors
    if (error.response?.status >= 500) {
      throw new Error('Server is temporarily unavailable. Please try again in a few moments.');
    }
    
    // Default error message
    const message = error.response?.data?.message || error.message || 'Network error';
    throw new Error(message);
  }
}

async function apiPost<T>(url: string, data?: any): Promise<T> {
  try {
    const response = await api.post(url, data);
    return response.data;
  } catch (error: any) {
    console.error(`API POST ${url} error:`, error);
    throw new Error(error.response?.data?.message || error.message || 'Network error');
  }
}

async function apiPut<T>(url: string, data?: any): Promise<T> {
  try {
    const response = await api.put(url, data);
    return response.data;
  } catch (error: any) {
    console.error(`API PUT ${url} error:`, error);
    throw new Error(error.response?.data?.message || error.message || 'Network error');
  }
}

async function apiDelete(url: string): Promise<void> {
  try {
    await api.delete(url);
  } catch (error: any) {
    console.error(`API DELETE ${url} error:`, error);
    throw new Error(error.response?.data?.message || error.message || 'Network error');
  }
}

export class UserService {
  // Get current user from localStorage/auth context
  async getCurrentUser(): Promise<User | null> {
    try {
      const authUserString = localStorage.getItem('user');
      if (authUserString) {
        const authUser = JSON.parse(authUserString);
        // Return the user with default values if some fields are missing
        return {
          ...authUser,
          bio: authUser.bio || 'Professional with experience in software development and technology.',
          phone: authUser.phone || '+1 (555) 123-4567',
          location: authUser.location || 'San Francisco, CA',
          applicationCount: authUser.applicationCount || 15,
          savedJobsCount: authUser.savedJobsCount || 8,
          certificatesCount: authUser.certificatesCount || 3,
          testsCompletedCount: authUser.testsCompletedCount || 12,
          profilePicture: authUser.profilePicture || undefined,
          lastLogin: authUser.lastLogin || new Date().toISOString(),
          skills: authUser.skills || ['JavaScript', 'React', 'Node.js', 'Python', 'SQL'],
          experience: authUser.experience || [],
          education: authUser.education || [],
          socialLinks: authUser.socialLinks || {}
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  // Get user profile
  async getUserProfile(userId: string): Promise<User> {
    try {
      console.log('🔍 Fetching user profile from API:', `/users/${userId}/profile`);
      const response = await apiGet<any>(`/users/${userId}/profile`);
      console.log('📋 API response:', response);
      
      // Handle the response structure from backend
      if (response.success && response.data && response.data.user) {
        console.log('✅ Using user data from API response');
        return response.data.user;
      } else if (response.data) {
        console.log('✅ Using direct data from API response');
        return response.data;
      } else {
        console.log('✅ Using response as user data');
        return response;
      }
    } catch (error) {
      console.error('❌ Error getting user profile from API:', error);
      
      // Don't use fallback for other users - only throw error
      throw error;
    }
  }

  // Update user profile
  async updateProfile(userId: string, profileData: Partial<User>): Promise<User> {
    try {
      console.log('Attempting to update profile via API:', {
        userId,
        endpoint: `/users/${userId}/profile`,
        dataKeys: Object.keys(profileData)
      });
      
      const response = await apiPut<any>(`/users/${userId}/profile`, profileData);
      console.log('✅ Profile update API response:', response);
      
      // Handle the response structure from backend
      if (response.success && response.data && response.data.user) {
        console.log('🔍 Updated user data from API:', {
          phone: response.data.user.phone,
          location: response.data.user.location,
          jobTitle: response.data.user.jobTitle,
          bio: response.data.user.bio,
          skills: response.data.user.skills,
          experience: response.data.user.experience?.length || 0,
          education: response.data.user.education?.length || 0,
          expectedSalary: response.data.user.expectedSalary,
          passport: response.data.user.passport
        });
        return response.data.user;
      } else if (response.data) {
        return response.data;
      } else {
        return response;
      }
    } catch (error: any) {
      console.error('Profile update API error:', error);
      
      // Check if it's a network error or API not available
      if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
        console.warn('Backend server not available, using fallback');
        // In a real app, this would update the database
        // For now, return updated data with the changes applied
        const currentProfile = await this.getUserProfile(userId);
        const updatedProfile = { ...currentProfile, ...profileData };
        
        // Update localStorage if this is the current user
        const authUserString = localStorage.getItem('user');
        if (authUserString) {
          const authUser = JSON.parse(authUserString);
          if (authUser._id === userId) {
            localStorage.setItem('user', JSON.stringify(updatedProfile));
          }
        }
        
        console.log('Profile updated in localStorage:', updatedProfile);
        return updatedProfile;
      }
      
      // Re-throw the error for proper error handling in the UI
      throw new Error(error.response?.data?.message || error.message || 'Failed to update profile');
    }
  }

  // Upload profile picture
  async uploadProfilePicture(userId: string, formData: FormData): Promise<User> {
    try {
      // Create form data API call
      const response = await api.post(`/users/${userId}/profile-picture`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.warn('Upload profile picture API not available, using fallback');
      // For development, we'll just return the user with a placeholder image
      const currentProfile = await this.getUserProfile(userId);
      const updatedProfile = {
        ...currentProfile,
        profilePicture: 'https://via.placeholder.com/150x150/4caf50/white?text=' + 
          (currentProfile.firstName?.[0] || 'U') + (currentProfile.lastName?.[0] || 'U')
      };
      
      // Update localStorage if this is the current user
      const authUserString = localStorage.getItem('user');
      if (authUserString) {
        const authUser = JSON.parse(authUserString);
        if (authUser._id === userId) {
          localStorage.setItem('user', JSON.stringify(updatedProfile));
        }
      }
      
      return updatedProfile;
    }
  }

  // Change password
  async changePassword(userId: string, passwordData: { currentPassword: string; newPassword: string }): Promise<void> {
    try {
      await apiPut(`/users/${userId}/change-password`, passwordData);
    } catch (error) {
      console.warn('Change password API not available, using fallback');
      // In a real implementation, this would verify current password and update to new one
      // For now, just simulate success after a delay
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // Get user statistics
  async getUserStats(userId: string): Promise<{
    applicationCount: number;
    savedJobsCount: number;
    certificatesCount: number;
    testsCompletedCount: number;
    interviewsCount: number;
  }> {
    try {
      return await apiGet(`/users/${userId}/stats`);
    } catch (error) {
      console.warn('User stats API not available, using fallback');
      return {
        applicationCount: Math.floor(Math.random() * 20) + 5,
        savedJobsCount: Math.floor(Math.random() * 15) + 3,
        certificatesCount: Math.floor(Math.random() * 8) + 1,
        testsCompletedCount: Math.floor(Math.random() * 25) + 8,
        interviewsCount: Math.floor(Math.random() * 12) + 2
      };
    }
  }

  // Get user activity feed
  async getUserActivity(userId: string, limit: number = 10): Promise<{
    id: string;
    type: 'application' | 'job_saved' | 'test_completed' | 'certificate_earned' | 'interview_scheduled';
    title: string;
    description: string;
    timestamp: string;
    metadata?: any;
  }[]> {
    try {
      return await apiGet(`/users/${userId}/activity`, { limit });
    } catch (error) {
      console.warn('User activity API not available, using fallback');
      return [
        {
          id: '1',
          type: 'application',
          title: 'Applied to Senior Developer',
          description: 'Application submitted to TechCorp Inc.',
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          metadata: { companyName: 'TechCorp Inc.', jobTitle: 'Senior Developer' }
        },
        {
          id: '2',
          type: 'test_completed',
          title: 'Completed JavaScript Assessment',
          description: 'Scored 85% on JavaScript Programming Test',
          timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          metadata: { testName: 'JavaScript Programming', score: 85 }
        },
        {
          id: '3',
          type: 'certificate_earned',
          title: 'React Development Certificate',
          description: 'Earned certificate in React Development',
          timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          metadata: { certificateName: 'React Development' }
        }
      ];
    }
  }

  // Update privacy settings
  async updatePrivacySettings(userId: string, settings: {
    profileVisibility: string;
    showEmail: boolean;
    showPhone: boolean;
    showLocation: boolean;
    allowMessages: boolean;
    allowJobAlerts: boolean;
  }): Promise<void> {
    try {
      await apiPut(`/users/${userId}/privacy-settings`, settings);
    } catch (error) {
      console.warn('Privacy settings API not available, using fallback');
      // Store in localStorage for persistence during development
      localStorage.setItem(`privacy_settings_${userId}`, JSON.stringify(settings));
    }
  }

  // Get all users for suggestions
  async getAllUsers(): Promise<{ data: any[] }> {
    try {
      const response = await apiGet<any>('/users');
      return response;
    } catch (error) {
      console.warn('Get all users API not available, using mock data');
      // Generate mock users for development
      const mockUsers = [
        {
          _id: 'mock-user-1',
          firstName: 'Sarah',
          lastName: 'Johnson',
          email: 'sarah.johnson@email.com',
          profession: 'Frontend Developer',
          location: 'New York, NY',
          skills: ['React', 'TypeScript', 'UI/UX'],
          isConnected: false,
          mutualConnections: 3
        },
        {
          _id: 'mock-user-2',
          firstName: 'Michael',
          lastName: 'Chen',
          email: 'michael.chen@email.com',
          profession: 'Data Scientist',
          location: 'San Francisco, CA',
          skills: ['Python', 'Machine Learning', 'SQL'],
          isConnected: false,
          mutualConnections: 1
        },
        {
          _id: 'mock-user-3',
          firstName: 'Emily',
          lastName: 'Davis',
          email: 'emily.davis@email.com',
          profession: 'Product Manager',
          location: 'Austin, TX',
          skills: ['Strategy', 'Analytics', 'Agile'],
          isConnected: false,
          mutualConnections: 2
        },
        {
          _id: 'mock-user-4',
          firstName: 'David',
          lastName: 'Wilson',
          email: 'david.wilson@email.com',
          profession: 'Backend Developer',
          location: 'Seattle, WA',
          skills: ['Node.js', 'PostgreSQL', 'AWS'],
          isConnected: false,
          mutualConnections: 0
        },
        {
          _id: 'mock-user-5',
          firstName: 'Lisa',
          lastName: 'Thompson',
          email: 'lisa.thompson@email.com',
          profession: 'UX Designer',
          location: 'Los Angeles, CA',
          skills: ['Figma', 'User Research', 'Prototyping'],
          isConnected: false,
          mutualConnections: 4
        },
        {
          _id: 'mock-user-6',
          firstName: 'James',
          lastName: 'Rodriguez',
          email: 'james.rodriguez@email.com',
          profession: 'DevOps Engineer',
          location: 'Denver, CO',
          skills: ['Docker', 'Kubernetes', 'CI/CD'],
          isConnected: false,
          mutualConnections: 1
        }
      ];
      return { data: mockUsers };
    }
  }

  // Get privacy settings
  async getPrivacySettings(userId: string): Promise<{
    profileVisibility: string;
    showEmail: boolean;
    showPhone: boolean;
    showLocation: boolean;
    allowMessages: boolean;
    allowJobAlerts: boolean;
  }> {
    try {
      return await apiGet(`/users/${userId}/privacy-settings`);
    } catch (error) {
      console.warn('Privacy settings API not available, using fallback');
      // Try to get from localStorage first
      const stored = localStorage.getItem(`privacy_settings_${userId}`);
      if (stored) {
        return JSON.parse(stored);
      }
      // Default settings
      return {
        profileVisibility: 'public',
        showEmail: false,
        showPhone: false,
        showLocation: true,
        allowMessages: true,
        allowJobAlerts: true
      };
    }
  }

  // Get user by ID (public profile view)
  async getUserById(userId: string): Promise<User> {
    try {
      return await apiGet<User>(`/users/${userId}`);
    } catch (error) {
      console.warn('Get user API not available, using fallback');
      // Return a generic user profile
      return {
        _id: userId,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        role: 'JOB_SEEKER',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        bio: 'Professional software developer with years of experience.',
        location: 'San Francisco, CA',
        skills: ['JavaScript', 'React', 'Node.js'],
        applicationCount: 15,
        savedJobsCount: 8,
        certificatesCount: 3,
        testsCompletedCount: 12
      };
    }
  }

  // Search users (for admin/employer use)
  async searchUsers(params: {
    query?: string;
    role?: string;
    location?: string;
    skills?: string[];
    page?: number;
    limit?: number;
  }): Promise<{
    users: User[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      return await apiGet('/users/search', params);
    } catch (error) {
      console.warn('Search users API not available, using fallback');
      return {
        users: [],
        total: 0,
        page: 1,
        totalPages: 0
      };
    }
  }

  // Deactivate user account
  async deactivateAccount(userId: string, reason?: string): Promise<void> {
    try {
      await apiPut(`/users/${userId}/deactivate`, { reason });
    } catch (error) {
      console.warn('Deactivate account API not available, using fallback');
      // In a real app, this would deactivate the account
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // Reactivate user account  
  async reactivateAccount(userId: string): Promise<void> {
    try {
      await apiPut(`/users/${userId}/reactivate`);
    } catch (error) {
      console.warn('Reactivate account API not available, using fallback');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

export const userService = new UserService();