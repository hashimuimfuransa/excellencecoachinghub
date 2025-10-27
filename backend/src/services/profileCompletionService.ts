import { IUserDocument } from '../models/User';

export interface ProfileCompletionResult {
  percentage: number;
  status: 'incomplete' | 'basic' | 'good' | 'excellent';
  missingFields: string[];
  recommendations: string[];
  canAccessFeatures: {
    psychometricTests: boolean;
    aiInterviews: boolean;
    premiumJobs: boolean;
  };
}

export class ProfileCompletionService {
  /**
   * Calculate profile completion percentage and status
   */
  calculateProfileCompletion(user: IUserDocument): ProfileCompletionResult {
    console.log('🔍 Starting profile completion calculation for user:', user._id);
    console.log('📋 User data summary:', {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      location: user.location,
      bio: user.bio,
      jobTitle: user.jobTitle,
      experienceLevel: user.experienceLevel,
      skills: user.skills,
      experience: user.experience?.length || 0,
      education: user.education?.length || 0,
      resume: user.resume,
      cvFile: user.cvFile,
      resumeFile: user.resumeFile,
      jobPreferences: user.jobPreferences,
      socialLinks: user.socialLinks,
      dateOfBirth: user.dateOfBirth,
      gender: user.gender,
      nationality: user.nationality,
      expectedSalary: user.expectedSalary
    });

    const completedFields: string[] = [];
    const missingFields: string[] = [];
    const recommendations: string[] = [];

    // Basic Information (30% weight)
    const basicFields = [
      { field: 'firstName', weight: 5, label: 'First Name' },
      { field: 'lastName', weight: 5, label: 'Last Name' },
      { field: 'email', weight: 5, label: 'Email' },
      { field: 'phone', weight: 5, label: 'Phone Number' },
      { field: 'location', weight: 5, label: 'Location' },
      { field: 'bio', weight: 5, label: 'Professional Bio' }
    ];

    // Professional Information (40% weight)
    const professionalFields = [
      { field: 'cvFile', weight: 10, label: 'CV File' },
      { field: 'skills', weight: 8, label: 'Skills (at least 3)' },
      { field: 'experience', weight: 8, label: 'Work Experience' },
      { field: 'education', weight: 6, label: 'Education Background' },
      { field: 'jobTitle', weight: 4, label: 'Job Title' },
      { field: 'experienceLevel', weight: 4, label: 'Experience Level' }
    ];

    // Additional Information (30% weight)
    const additionalFields = [
      { field: 'profilePicture', weight: 3, label: 'Profile Picture' },
      { field: 'summary', weight: 4, label: 'Professional Summary' },
      { field: 'socialLinks', weight: 3, label: 'Social Links' },
      { field: 'jobPreferences', weight: 5, label: 'Job Preferences' },
      { field: 'languages', weight: 3, label: 'Languages' },
      { field: 'certifications', weight: 3, label: 'Certifications' },
      { field: 'dateOfBirth', weight: 2, label: 'Date of Birth' },
      { field: 'gender', weight: 2, label: 'Gender' },
      { field: 'nationality', weight: 2, label: 'Nationality' },
      { field: 'idNumber', weight: 2, label: 'ID Number' },
      { field: 'expectedSalary', weight: 1, label: 'Expected Salary' }
    ];

    let totalScore = 0;
    const maxScore = 100;

    // Check basic fields
    basicFields.forEach(({ field, weight, label }) => {
      if (this.isFieldComplete(user, field)) {
        completedFields.push(field);
        totalScore += weight;
      } else {
        missingFields.push(label);
      }
    });

    // Check professional fields
    professionalFields.forEach(({ field, weight, label }) => {
      if (this.isFieldComplete(user, field)) {
        completedFields.push(field);
        totalScore += weight;
      } else {
        missingFields.push(label);
        if (field === 'resume') {
          recommendations.push('Upload your resume to attract more employers');
        } else if (field === 'skills') {
          if (Array.isArray(user.skills) && user.skills.length > 0 && user.skills.length < 3) {
            recommendations.push('Add more skills (at least 3 total) to improve job matching');
          } else {
            recommendations.push('Add at least 3 skills to improve job matching');
          }
        } else if (field === 'experience') {
          recommendations.push('Add your work experience to showcase your background');
        }
      }
    });

    // Check additional fields
    additionalFields.forEach(({ field, weight, label }) => {
      if (this.isFieldComplete(user, field)) {
        completedFields.push(field);
        totalScore += weight;
      } else {
        missingFields.push(label);
      }
    });

    const percentage = Math.min(totalScore, maxScore);
    const status = this.getCompletionStatus(percentage);
    const canAccessFeatures = this.getFeatureAccess(percentage, user);

    // Add general recommendations based on completion level
    if (percentage < 40) {
      recommendations.unshift('Complete your basic profile information to get started');
    } else if (percentage < 70) {
      recommendations.unshift('Add more professional details to improve your profile visibility');
    } else if (percentage < 90) {
      recommendations.unshift('Complete your profile to unlock all features');
    }

    console.log('📊 Profile completion calculation complete:', {
      percentage,
      status,
      completedFields: completedFields.length,
      missingFields: missingFields.length,
      totalScore,
      maxScore,
      completedFieldsList: completedFields,
      missingFieldsList: missingFields
    });

    return {
      percentage,
      status,
      missingFields,
      recommendations,
      canAccessFeatures
    };
  }

  /**
   * Check if a specific field is complete
   */
  private isFieldComplete(user: IUserDocument, field: string): boolean {
    const value = user[field as keyof IUserDocument];
    const result = this.checkFieldValue(user, field);
    console.log(`🔍 Field check: ${field} = ${result ? '✅ Complete' : '❌ Missing'}`);
    console.log(`   Raw value: ${JSON.stringify(value)}`);
    console.log(`   Type: ${typeof value}, Length: ${Array.isArray(value) ? value.length : 'N/A'}`);
    return result;
  }

  /**
   * Internal method to check field value without logging
   */
  private checkFieldValue(user: IUserDocument, field: string): boolean {
    // Helper function to check if a string field has meaningful content
    const hasStringValue = (value: any): boolean => {
      return value && typeof value === 'string' && value.trim().length > 0;
    };

    // Helper function to check if a number field has meaningful content
    const hasNumberValue = (value: any): boolean => {
      return value !== null && value !== undefined && typeof value === 'number' && value > 0;
    };

    // Helper function to check if an array has content
    const hasArrayValue = (value: any): boolean => {
      return Array.isArray(value) && value.length > 0;
    };

    switch (field) {
      case 'firstName':
      case 'lastName':
      case 'email':
        // These are required registration fields, should always be present
        return hasStringValue(user[field as keyof IUserDocument]);
      
      case 'phone':
      case 'location':
      case 'bio':
      case 'summary':
      case 'jobTitle':
      case 'experienceLevel':
      case 'dateOfBirth':
      case 'gender':
      case 'nationality':
      case 'employmentStatus':
      case 'noticePeriod':
      case 'preferredJobType':
      case 'workPreference':
      case 'address':
      case 'industry':
      case 'department':
        return hasStringValue(user[field as keyof IUserDocument]);
      
      case 'profilePicture':
        // Profile picture can be a URL or file path
        return hasStringValue(user.profilePicture);
      
      case 'expectedSalary':
      case 'currentSalary':
      case 'yearsOfExperience':
        return hasNumberValue(user[field as keyof IUserDocument]);
      
      case 'resume':
        // Check all possible resume field variations
        return hasStringValue(user.resume) || hasStringValue(user.cvFile) || hasStringValue(user.resumeFile);
      
      case 'skills':
        // Accept any skills, but give full credit for 3+
        return hasArrayValue(user.skills);
      
      case 'experience':
        return hasArrayValue(user.experience);
      
      case 'education':
        return hasArrayValue(user.education);
      
      case 'certifications':
        return hasArrayValue(user.certifications);
      
      case 'languages':
        return hasArrayValue(user.languages);
      
      case 'socialLinks':
        return Boolean(user.socialLinks && Object.keys(user.socialLinks).some(key => 
          hasStringValue(user.socialLinks![key as keyof typeof user.socialLinks])
        ));
      
      case 'jobPreferences':
        if (!user.jobPreferences) return false;
        
        const prefs = user.jobPreferences;
        return Boolean(
          hasArrayValue(prefs.jobTypes) ||
          hasArrayValue(prefs.preferredJobTypes) ||
          hasArrayValue(prefs.locations) ||
          hasArrayValue(prefs.preferredLocations) ||
          hasArrayValue(prefs.industries) ||
          hasArrayValue(prefs.preferredIndustries) ||
          (prefs.salaryRange && (prefs.salaryRange.min > 0 || prefs.salaryRange.max > 0)) ||
          prefs.remoteWork !== undefined ||
          prefs.willingToRelocate !== undefined ||
          hasStringValue(prefs.experienceLevel)
        );
      
      default:
        // For any other field, try to check if it has a meaningful value
        const value = user[field as keyof IUserDocument];
        if (typeof value === 'string') return hasStringValue(value);
        if (typeof value === 'number') return hasNumberValue(value);
        if (Array.isArray(value)) return hasArrayValue(value);
        if (typeof value === 'boolean') return true; // Boolean fields are considered complete if set
        if (typeof value === 'object' && value !== null) return Object.keys(value).length > 0;
        return Boolean(value);
    }
  }

  /**
   * Get completion status based on percentage
   */
  private getCompletionStatus(percentage: number): 'incomplete' | 'basic' | 'good' | 'excellent' {
    if (percentage >= 90) return 'excellent';
    if (percentage >= 70) return 'good';
    if (percentage >= 40) return 'basic';
    return 'incomplete';
  }

  /**
   * Determine feature access based on profile completion
   */
  private getFeatureAccess(percentage: number, user: IUserDocument): {
    psychometricTests: boolean;
    aiInterviews: boolean;
    premiumJobs: boolean;
  } {
    const hasResume = Boolean(user.resume || user.cvFile || user.resumeFile);
    const hasBasicInfo = percentage >= 40;
    const hasGoodProfile = percentage >= 70;

    return {
      psychometricTests: hasBasicInfo,
      aiInterviews: hasResume && hasBasicInfo,
      premiumJobs: hasGoodProfile && hasResume
    };
  }

  /**
   * Update user profile completion data
   */
  async updateProfileCompletion(user: IUserDocument): Promise<ProfileCompletionResult> {
    const completionResult = this.calculateProfileCompletion(user);
    
    // Update the user's profile completion data
    user.profileCompletion = {
      percentage: completionResult.percentage,
      status: completionResult.status,
      missingFields: completionResult.missingFields,
      lastUpdated: new Date().toISOString()
    };
    
    user.lastProfileUpdate = new Date().toISOString();
    
    await user.save();
    
    return completionResult;
  }

  /**
   * Get next steps for profile completion
   */
  getNextSteps(completionResult: ProfileCompletionResult): string[] {
    const { percentage, missingFields } = completionResult;
    const nextSteps: string[] = [];

    if (percentage < 40) {
      nextSteps.push('Complete basic information (name, email, phone, location)');
      nextSteps.push('Add a professional bio');
    }

    if (percentage < 70) {
      if (missingFields.includes('Resume/CV')) {
        nextSteps.push('Upload your resume or CV');
      }
      if (missingFields.includes('Skills (at least 3)')) {
        nextSteps.push('Add at least 3 professional skills');
      }
      if (missingFields.includes('Work Experience')) {
        nextSteps.push('Add your work experience');
      }
    }

    if (percentage < 90) {
      if (missingFields.includes('Profile Picture')) {
        nextSteps.push('Upload a professional profile picture');
      }
      if (missingFields.includes('Professional Summary')) {
        nextSteps.push('Write a compelling professional summary');
      }
      if (missingFields.includes('Social Links')) {
        nextSteps.push('Add your LinkedIn or portfolio links');
      }
    }

    return nextSteps;
  }
}

export const profileCompletionService = new ProfileCompletionService();