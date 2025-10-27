import { apiService } from './api';
import { IStudentProfile, IAddress, IWorkExperience } from '../shared/types';

// Student Profile Update Data Interface
export interface IUpdateStudentProfileData {
  // Personal Information
  dateOfBirth?: string;
  age?: number;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  phone?: string;
  address?: IAddress;
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
    email?: string;
  };
  
  // Academic Information
  currentEducationLevel?: 'high_school' | 'undergraduate' | 'graduate' | 'postgraduate' | 'other';
  educationLevel?: 'high_school' | 'undergraduate' | 'graduate' | 'postgraduate' | 'other';
  schoolName?: string;
  fieldOfStudy?: string;
  graduationYear?: number;
  gpa?: number;
  academicInterests?: string[];
  jobInterests?: string[];
  
  // Career Information
  careerGoals?: string | string[];
  preferredCareerPath?: string[];
  workExperience?: IWorkExperience[];
  skills?: string[];
  languages?: string[];
  
  // Learning Preferences
  preferredLearningStyle?: 'visual' | 'auditory' | 'kinesthetic' | 'reading_writing';
  studySchedule?: {
    preferredTime: string;
    studyHoursPerWeek: number;
    availableDays: string[];
  };
  learningGoals?: string[];
}

// Student Profile Response Interface
export interface IStudentProfileResponse {
  profile: IStudentProfile;
  completionPercentage: number;
  missingFields: string[];
}

// Student Profile List Response Interface
export interface IStudentProfileListResponse {
  profiles: IStudentProfile[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalProfiles: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

// Student Profile Filters Interface
export interface IStudentProfileFilters {
  page?: number;
  limit?: number;
  search?: string;
  educationLevel?: string;
  graduationYear?: number;
  skills?: string[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Helper function to calculate profile completion
const calculateProfileCompletion = (profile: any): { percentage: number; missingFields: string[] } => {
  // Core required fields
  const coreFields = [
    'age',
    'educationLevel',
    'jobInterests',
    'careerGoals'
  ];
  
  // Additional important fields
  const additionalFields = [
    'dateOfBirth',
    'gender',
    'phone',
    'currentEducationLevel',
    'schoolName',
    'fieldOfStudy',
    'skills',
    'languages'
  ];
  
  const allFields = [...coreFields, ...additionalFields];
  const missingFields: string[] = [];
  let completedFields = 0;
  
  allFields.forEach(field => {
    if (profile[field] && 
        (Array.isArray(profile[field]) ? profile[field].length > 0 : true)) {
      completedFields++;
    } else {
      missingFields.push(field);
    }
  });
  
  const percentage = Math.round((completedFields / allFields.length) * 100);
  
  return { percentage, missingFields };
};

export const studentProfileService = {
  // Get my student profile (for logged-in student)
  getMyProfile: async (): Promise<IStudentProfileResponse> => {
    const response = await apiService.get<{ success: boolean; data: any }>('/profiles/student');
    
    if (response.success && response.data) {
      // Transform the response to match the expected format
      const profile = response.data;
      const completionData = calculateProfileCompletion(profile);
      
      return {
        profile: profile,
        completionPercentage: completionData.percentage,
        missingFields: completionData.missingFields
      };
    }
    
    throw new Error(response.error || 'Failed to fetch student profile');
  },

  // Update my student profile
  updateMyProfile: async (profileData: IUpdateStudentProfileData): Promise<IStudentProfileResponse> => {
    const response = await apiService.put<{ success: boolean; data: any }>('/profiles/student', profileData);
    
    if (response.success && response.data) {
      // Transform the response to match the expected format
      const profile = response.data;
      const completionData = calculateProfileCompletion(profile);
      
      return {
        profile: profile,
        completionPercentage: completionData.percentage,
        missingFields: completionData.missingFields
      };
    }
    
    throw new Error(response.error || 'Failed to update student profile');
  },

  // Create student profile (for new students)
  createProfile: async (profileData: IUpdateStudentProfileData): Promise<IStudentProfileResponse> => {
    const response = await apiService.post<{ success: boolean; data: any }>('/profiles/student', profileData);
    
    if (response.success && response.data) {
      // Transform the response to match the expected format
      const profile = response.data;
      const completionData = calculateProfileCompletion(profile);
      
      return {
        profile: profile,
        completionPercentage: completionData.percentage,
        missingFields: completionData.missingFields
      };
    }
    
    throw new Error(response.error || 'Failed to create student profile');
  },

  // Get profile completion status
  getProfileCompletion: async (): Promise<{
    completionPercentage: number;
    missingFields: string[];
    isComplete: boolean;
  }> => {
    const response = await apiService.get<{
      completionPercentage: number;
      missingFields: string[];
      isComplete: boolean;
    }>('/student-profiles/completion');
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.error || 'Failed to fetch profile completion status');
  },

  // Get all student profiles (Admin only)
  getAllProfiles: async (filters: IStudentProfileFilters = {}): Promise<IStudentProfileListResponse> => {
    const queryParams = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          value.forEach(item => queryParams.append(key, item.toString()));
        } else {
          queryParams.append(key, value.toString());
        }
      }
    });

    const response = await apiService.get<IStudentProfileListResponse>(
      `/student-profiles?${queryParams.toString()}`
    );
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.error || 'Failed to fetch student profiles');
  },

  // Get student profile by ID (Admin only)
  getProfileById: async (id: string): Promise<IStudentProfile> => {
    const response = await apiService.get<{ profile: IStudentProfile }>(`/student-profiles/${id}`);
    
    if (response.success && response.data) {
      return response.data.profile;
    }
    
    throw new Error(response.error || 'Failed to fetch student profile');
  },

  // Get student profile by user ID
  getProfileByUserId: async (userId: string): Promise<IStudentProfile> => {
    const response = await apiService.get<{ profile: IStudentProfile }>(`/student-profiles/user/${userId}`);
    
    if (response.success && response.data) {
      return response.data.profile;
    }
    
    throw new Error(response.error || 'Failed to fetch student profile');
  },

  // Delete student profile
  deleteProfile: async (): Promise<void> => {
    const response = await apiService.delete('/student-profiles/my-profile');
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to delete student profile');
    }
  },

  // Upload profile picture
  uploadProfilePicture: async (file: File): Promise<{ profilePictureUrl: string }> => {
    const formData = new FormData();
    formData.append('profilePicture', file);

    const response = await apiService.post<{ profilePictureUrl: string }>('/student-profiles/upload-picture', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error || 'Failed to upload profile picture');
  },

  // Get profile statistics
  getProfileStats: async (): Promise<{
    totalProfiles: number;
    completedProfiles: number;
    incompleteProfiles: number;
    averageCompletionPercentage: number;
    educationLevelDistribution: Record<string, number>;
    skillDistribution: Record<string, number>;
  }> => {
    const response = await apiService.get<{
      totalProfiles: number;
      completedProfiles: number;
      incompleteProfiles: number;
      averageCompletionPercentage: number;
      educationLevelDistribution: Record<string, number>;
      skillDistribution: Record<string, number>;
    }>('/student-profiles/stats');
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.error || 'Failed to fetch profile statistics');
  },

  // Calculate age from date of birth
  calculateAge: (dateOfBirth: string): number => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  },

  // Validate profile data
  validateProfileData: (profileData: IUpdateStudentProfileData): {
    isValid: boolean;
    errors: string[];
  } => {
    const errors: string[] = [];

    // Validate date of birth
    if (profileData.dateOfBirth) {
      const birthDate = new Date(profileData.dateOfBirth);
      const today = new Date();
      
      if (birthDate > today) {
        errors.push('Date of birth cannot be in the future');
      }
      
      const age = studentProfileService.calculateAge(profileData.dateOfBirth);
      if (age < 13) {
        errors.push('Age must be at least 13 years old');
      }
      if (age > 100) {
        errors.push('Please enter a valid date of birth');
      }
    }

    // Validate phone number
    if (profileData.phone) {
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
      if (!phoneRegex.test(profileData.phone.replace(/\s/g, ''))) {
        errors.push('Please enter a valid phone number');
      }
    }

    // Validate GPA
    if (profileData.gpa !== undefined) {
      if (profileData.gpa < 0 || profileData.gpa > 4.0) {
        errors.push('GPA must be between 0.0 and 4.0');
      }
    }

    // Validate graduation year
    if (profileData.graduationYear) {
      const currentYear = new Date().getFullYear();
      if (profileData.graduationYear < 1950 || profileData.graduationYear > currentYear + 10) {
        errors.push('Please enter a valid graduation year');
      }
    }

    // Validate study hours
    if (profileData.studySchedule?.studyHoursPerWeek) {
      if (profileData.studySchedule.studyHoursPerWeek < 0 || profileData.studySchedule.studyHoursPerWeek > 168) {
        errors.push('Study hours per week must be between 0 and 168');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
};
