import { apiService } from './api';

// Teacher Profile interfaces
export interface IEducation {
  degree: string;
  institution: string;
  year: number;
  field?: string;
}

export interface ICertification {
  name: string;
  issuer: string;
  issueDate: string;
  expiryDate?: string;
  credentialId?: string;
}

export interface IDocument {
  type: 'resume' | 'certificate' | 'id' | 'degree' | 'other';
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
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
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
  availability?: IAvailability;
  
  // Documents
  documents: IDocument[];
  
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
}

export interface IUpdateTeacherProfileData {
  phone?: string;
  dateOfBirth?: string;
  profilePicture?: string;
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
    const response = await apiService.get<{ profile: ITeacherProfile }>('/teacher-profiles/my-profile');
    
    if (response.success && response.data) {
      return response.data.profile;
    }
    
    throw new Error(response.error || 'Failed to fetch teacher profile');
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
  }
};
