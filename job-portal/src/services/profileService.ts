import { User, ProfileValidationResult } from '../types/user';
import { validateProfile } from '../utils/profileValidation';
import { userService } from './userService';

class ProfileService {
  /**
   * Validate user profile and return detailed results
   */
  async validateUserProfile(user: User): Promise<ProfileValidationResult> {
    return validateProfile(user);
  }

  /**
   * Update user profile with comprehensive data
   */
  async updateComprehensiveProfile(userId: string, profileData: Partial<User>): Promise<User> {
    try {
      // Add profile completion calculation
      const updatedProfile = await userService.updateProfile(userId, {
        ...profileData,
        lastProfileUpdate: new Date().toISOString()
      });

      // Recalculate profile completion
      const validation = validateProfile(updatedProfile);
      
      // Update profile completion data
      const finalProfile = await userService.updateProfile(userId, {
        profileCompletion: {
          percentage: validation.completionPercentage,
          status: validation.status,
          missingFields: validation.missingFields,
          lastUpdated: new Date().toISOString()
        }
      });

      return finalProfile;
    } catch (error) {
      console.error('Error updating comprehensive profile:', error);
      throw error;
    }
  }

  /**
   * Check if user can access a specific feature
   */
  async checkFeatureAccess(user: User, feature: 'psychometricTests' | 'aiInterviews' | 'premiumJobs'): Promise<boolean> {
    const validation = validateProfile(user);
    return validation.canAccessFeatures[feature];
  }

  /**
   * Get profile completion recommendations
   */
  async getProfileRecommendations(user: User): Promise<string[]> {
    const validation = validateProfile(user);
    return validation.recommendations;
  }

  /**
   * Get next steps for profile completion
   */
  async getNextSteps(user: User): Promise<string[]> {
    const validation = validateProfile(user);
    
    const nextSteps: string[] = [];
    
    if (validation.completionPercentage < 40) {
      nextSteps.push('Complete basic information (name, email, phone, location)');
      nextSteps.push('Add a professional job title and bio');
    }
    
    if (validation.completionPercentage < 80) {
      nextSteps.push('Upload your resume');
      nextSteps.push('Add your education background');
      nextSteps.push('List your key skills');
      nextSteps.push('Set your job preferences');
    }
    
    if (validation.completionPercentage < 90) {
      nextSteps.push('Add detailed work experience');
      nextSteps.push('Include technical skills with proficiency levels');
      nextSteps.push('Add language proficiencies');
      nextSteps.push('Connect your LinkedIn profile');
    }

    return nextSteps;
  }

  /**
   * Calculate profile strength score
   */
  async calculateProfileStrength(user: User): Promise<{
    score: number;
    strengths: string[];
    weaknesses: string[];
    suggestions: string[];
  }> {
    const validation = validateProfile(user);
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const suggestions: string[] = [];

    // Check strengths
    if (user.experience && user.experience.length > 0) {
      strengths.push('Has work experience');
    }
    if (user.education && user.education.length > 0) {
      strengths.push('Education background provided');
    }
    if (user.skills && user.skills.length >= 5) {
      strengths.push('Good skill coverage');
    }
    if (user.resume) {
      strengths.push('Resume uploaded');
    }
    if (user.socialLinks?.linkedin) {
      strengths.push('LinkedIn profile connected');
    }

    // Check weaknesses
    if (!user.experience || user.experience.length === 0) {
      weaknesses.push('No work experience added');
      suggestions.push('Add your work experience to showcase your background');
    }
    if (!user.resume) {
      weaknesses.push('No resume uploaded');
      suggestions.push('Upload your resume to attract employers');
    }
    if (!user.skills || user.skills.length < 3) {
      weaknesses.push('Limited skills listed');
      suggestions.push('Add more skills to improve job matching');
    }
    if (!user.socialLinks?.linkedin) {
      weaknesses.push('No LinkedIn profile');
      suggestions.push('Connect your LinkedIn profile for credibility');
    }

    return {
      score: validation.completionPercentage,
      strengths,
      weaknesses,
      suggestions
    };
  }

  /**
   * Get profile visibility score
   */
  async getProfileVisibility(user: User): Promise<{
    score: number;
    factors: {
      name: string;
      impact: 'high' | 'medium' | 'low';
      status: 'complete' | 'incomplete';
      description: string;
    }[];
  }> {
    const factors = [
      {
        name: 'Profile Picture',
        impact: 'medium' as const,
        status: user.profilePicture ? 'complete' as const : 'incomplete' as const,
        description: 'A professional photo increases profile views by 40%'
      },
      {
        name: 'Professional Summary',
        impact: 'high' as const,
        status: user.summary ? 'complete' as const : 'incomplete' as const,
        description: 'A compelling summary is crucial for first impressions'
      },
      {
        name: 'Work Experience',
        impact: 'high' as const,
        status: (user.experience && user.experience.length > 0) ? 'complete' as const : 'incomplete' as const,
        description: 'Detailed experience helps employers understand your background'
      },
      {
        name: 'Skills',
        impact: 'high' as const,
        status: (user.skills && user.skills.length >= 5) ? 'complete' as const : 'incomplete' as const,
        description: 'Skills are used for job matching algorithms'
      },
      {
        name: 'Education',
        impact: 'medium' as const,
        status: (user.education && user.education.length > 0) ? 'complete' as const : 'incomplete' as const,
        description: 'Education background adds credibility'
      },
      {
        name: 'Resume',
        impact: 'high' as const,
        status: user.resume ? 'complete' as const : 'incomplete' as const,
        description: 'Resume is essential for job applications'
      }
    ];

    const completedFactors = factors.filter(f => f.status === 'complete');
    const highImpactCompleted = completedFactors.filter(f => f.impact === 'high').length;
    const mediumImpactCompleted = completedFactors.filter(f => f.impact === 'medium').length;
    
    const score = Math.round(
      (highImpactCompleted * 20) + (mediumImpactCompleted * 10) + 
      (completedFactors.filter(f => f.impact === 'low').length * 5)
    );

    return {
      score: Math.min(score, 100),
      factors
    };
  }

  /**
   * Get profile completion status for different user types
   */
  async getProfileCompletionStatus(): Promise<{
    student: {
      exists: boolean;
      completionPercentage: number;
    };
    jobSeeker: {
      exists: boolean;
      completionPercentage: number;
    };
  }> {
    try {
      // Get current user from userService
      const currentUser = await userService.getCurrentUser();
      
      if (!currentUser) {
        return {
          student: { exists: false, completionPercentage: 0 },
          jobSeeker: { exists: false, completionPercentage: 0 }
        };
      }

      const validation = validateProfile(currentUser);
      const completionPercentage = validation.completionPercentage;

      // Determine user type based on profile data
      const isStudent = currentUser.userType === 'student' || 
                       (currentUser.education && currentUser.education.length > 0 && 
                        (!currentUser.experience || currentUser.experience.length === 0));

      return {
        student: {
          exists: isStudent,
          completionPercentage: isStudent ? completionPercentage : 0
        },
        jobSeeker: {
          exists: !isStudent,
          completionPercentage: !isStudent ? completionPercentage : 0
        }
      };
    } catch (error) {
      console.error('Error getting profile completion status:', error);
      return {
        student: { exists: false, completionPercentage: 0 },
        jobSeeker: { exists: false, completionPercentage: 0 }
      };
    }
  }

  /**
   * Get current user profile
   */
  async getCurrentUserProfile(): Promise<User> {
    try {
      const currentUser = await userService.getCurrentUser();
      if (!currentUser) {
        throw new Error('No user found');
      }
      return currentUser;
    } catch (error) {
      console.error('Error getting current user profile:', error);
      throw error;
    }
  }

  /**
   * Get job seeker profile
   */
  async getJobSeekerProfile(): Promise<User> {
    try {
      const currentUser = await userService.getCurrentUser();
      if (!currentUser) {
        throw new Error('No user found');
      }
      return currentUser;
    } catch (error) {
      console.error('Error getting job seeker profile:', error);
      throw error;
    }
  }
}

export const profileService = new ProfileService();