import { apiService } from './api';

// Teacher Profile interfaces
export interface IEducation {
  degree: string;
  institution: string;
  year: number;
  field?: string;
  diploma?: {
    filename: string;
    originalName: string;
    url: string;
    uploadedAt: string;
  };
  certificate?: {
    filename: string;
    originalName: string;
    url: string;
    uploadedAt: string;
  };
}

export interface ICertification {
  name: string;
  issuer: string;
  issueDate: string;
  expiryDate?: string;
  credentialId?: string;
}

export interface IDocument {
  type: 'resume' | 'cv' | 'certificate' | 'id' | 'degree' | 'other';
  filename: string;
  originalName: string;
  url: string;
  uploadedAt: string;
}

export interface IAvailability {
  timezone: string;
  schedule: {
    day: string;
    startTime: string;
    endTime: string;
  }[];
}

export interface ISocialLinks {
  linkedin?: string;
  github?: string;
  portfolio?: string;
  website?: string;
}

export interface IAddress {
  province?: string;
  district?: string;
  sector?: string;
  cell?: string;
  village?: string;
  country?: string;
}

export interface ITeacherProfile {
  _id: string;
  userId: string | {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  
  // Personal Information
  phone?: string;
  dateOfBirth?: string;
  profilePicture?: string;
  nationalId?: string;
  address?: IAddress;
  
  // Professional Information
  specialization: string[];
  bio?: string;
  experience: number;
  education: IEducation[];
  
  // Certifications and Skills
  certifications: ICertification[];
  skills: string[];
  languages: string[];
  
  // Teaching Information
  teachingAreas: string[];
  preferredLevels: ('Beginner' | 'Intermediate' | 'Advanced')[];
  hourlyRate?: number;
  paymentType?: 'per_hour' | 'per_month';
  monthlyRate?: number;
  availability?: IAvailability;
  
  // Documents
  documents: IDocument[];
  cvDocument?: {
    filename: string;
    originalName: string;
    url: string;
    uploadedAt: string;
  };
  
  // Social Links
  socialLinks?: ISocialLinks;
  
  // Profile Status
  profileStatus: 'incomplete' | 'pending' | 'approved' | 'rejected';
  submittedAt?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  adminFeedback?: string;
  rejectionReason?: string;
  
  // Statistics
  totalStudents: number;
  activeCourses: number;
  totalCourses: number;
  averageRating: number;
  totalEarnings: number;
  
  createdAt: string;
  updatedAt: string;
}

export interface ITeacherProfileListResponse {
  profiles: ITeacherProfile[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalProfiles: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface ITeacherProfileStats {
  totalProfiles: number;
  pendingProfiles: number;
  approvedProfiles: number;
  rejectedProfiles: number;
  incompleteProfiles: number;
  recentSubmissions: ITeacherProfile[];
}

export interface ITeacherProfileFilters {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  userId?: string;
}

export interface IUpdateTeacherProfileData {
  phone?: string;
  dateOfBirth?: string;
  profilePicture?: string;
  nationalId?: string;
  address?: IAddress;
  specialization?: string[];
  bio?: string;
  experience?: number;
  education?: IEducation[];
  certifications?: ICertification[];
  skills?: string[];
  languages?: string[];
  teachingAreas?: string[];
  preferredLevels?: ('Beginner' | 'Intermediate' | 'Advanced')[];
  hourlyRate?: number;
  paymentType?: 'per_hour' | 'per_month';
  monthlyRate?: number;
  availability?: IAvailability;
  socialLinks?: ISocialLinks;
}

export interface IProfileActionData {
  feedback?: string;
  reason?: string;
}

export const teacherProfileService = {
  // Get my teacher profile (for logged-in teacher)
  getMyProfile: async (): Promise<ITeacherProfile> => {
    try {
      console.log('🚀🚀🚀 GET MY PROFILE CALLED FROM teacherProfileService 🚀🚀🚀');
      console.log('🔍 Frontend: Making API call to /teacher-profiles/my-profile');
      const response = await apiService.get<{ profile: ITeacherProfile }>('/teacher-profiles/my-profile');
      console.log('🔍 Frontend: API response received:', response);
      console.log('🔍 Frontend: Response success:', response.success);
      console.log('🔍 Frontend: Response data:', response.data);
      console.log('🔍 Frontend: Response data keys:', response.data ? Object.keys(response.data) : 'No data');
      console.log('🔍 Frontend: Profile object:', response.data?.profile);
      console.log('🔍 Frontend: Profile keys:', response.data?.profile ? Object.keys(response.data.profile) : 'No profile');
      console.log('🔍 Frontend: Profile status:', response.data?.profile?.profileStatus);
      
      if (response.success && response.data) {
        console.log('✅ Frontend: Profile data extracted successfully:', response.data.profile);
        console.log('✅ Frontend: Profile status extracted:', response.data.profile.profileStatus);
        return response.data.profile;
      }
      
      console.error('❌ Frontend: Invalid response format:', response);
      throw new Error(response.error || 'Failed to fetch teacher profile');
    } catch (error: any) {
      console.error('❌ Frontend: Error in getMyProfile:', error);
      console.error('❌ Frontend: Error message:', error.message);
      console.error('❌ Frontend: Error stack:', error.stack);
      throw error;
    }
  },

  // Update my teacher profile
  updateMyProfile: async (profileData: IUpdateTeacherProfileData): Promise<ITeacherProfile> => {
    const response = await apiService.put<{ profile: ITeacherProfile }>('/teacher-profiles/my-profile', profileData);
    
    if (response.success && response.data) {
      return response.data.profile;
    }
    
    throw new Error(response.error || 'Failed to update teacher profile');
  },

  // Submit profile for approval
  submitForApproval: async (): Promise<ITeacherProfile> => {
    const response = await apiService.post<{ profile: ITeacherProfile }>('/teacher-profiles/submit-for-approval');
    
    if (response.success && response.data) {
      return response.data.profile;
    }
    
    throw new Error(response.error || 'Failed to submit profile for approval');
  },

  // Get all teacher profiles (Admin only)
  getAllProfiles: async (filters: ITeacherProfileFilters = {}): Promise<ITeacherProfileListResponse> => {
    const queryParams = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    const response = await apiService.get<ITeacherProfileListResponse>(
      `/teacher-profiles?${queryParams.toString()}`
    );
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.error || 'Failed to fetch teacher profiles');
  },

  // Get teacher profile by ID (Admin only)
  getProfileById: async (id: string): Promise<ITeacherProfile> => {
    const response = await apiService.get<{ profile: ITeacherProfile }>(`/teacher-profiles/${id}`);
    
    if (response.success && response.data) {
      return response.data.profile;
    }
    
    throw new Error(response.error || 'Failed to fetch teacher profile');
  },

  // Approve teacher profile (Admin only)
  approveProfile: async (id: string, data: IProfileActionData = {}): Promise<ITeacherProfile> => {
    const response = await apiService.put<{ profile: ITeacherProfile }>(`/teacher-profiles/${id}/approve`, data);
    
    if (response.success && response.data) {
      return response.data.profile;
    }
    
    throw new Error(response.error || 'Failed to approve teacher profile');
  },

  // Reject teacher profile (Admin only)
  rejectProfile: async (id: string, data: IProfileActionData): Promise<ITeacherProfile> => {
    const response = await apiService.put<{ profile: ITeacherProfile }>(`/teacher-profiles/${id}/reject`, data);
    
    if (response.success && response.data) {
      return response.data.profile;
    }
    
    throw new Error(response.error || 'Failed to reject teacher profile');
  },

  // Get teacher profile statistics (Admin only)
  getProfileStats: async (): Promise<ITeacherProfileStats> => {
    const response = await apiService.get<ITeacherProfileStats>('/teacher-profiles/stats');
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.error || 'Failed to fetch teacher profile statistics');
  },

  // Upload CV
  uploadCV: async (formData: FormData): Promise<{ success: boolean; data?: any; error?: string }> => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/teacher-profiles/upload-cv`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();
      return data;
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  // Upload profile picture
  uploadProfilePicture: async (formData: FormData): Promise<{ success: boolean; data?: any; error?: string }> => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/teacher-profiles/upload-profile-picture`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();
      return data;
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  // Upload diploma
  uploadDiploma: async (formData: FormData, educationIndex: number): Promise<{ success: boolean; data?: any; error?: string }> => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/teacher-profiles/upload-diploma`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();
      return data;
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  // Upload certificate
  uploadCertificate: async (formData: FormData, educationIndex: number): Promise<{ success: boolean; data?: any; error?: string }> => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/teacher-profiles/upload-certificate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();
      return data;
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  // Submit profile for review
  submitProfile: async (): Promise<{ success: boolean; data?: any; error?: string }> => {
    try {
      const response = await apiService.post<{ profile: ITeacherProfile }>('/teacher-profiles/submit');
      return response;
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  // Update profile (using the existing method but with better error handling)
  updateProfile: async (profileData: IUpdateTeacherProfileData): Promise<{ success: boolean; data?: any; error?: string }> => {
    try {
      const response = await apiService.put<{ profile: ITeacherProfile }>('/teacher-profiles/my-profile', profileData);
      return response;
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

};
