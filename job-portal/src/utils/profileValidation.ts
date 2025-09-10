import { User, ProfileCompletionStatus, ProfileValidationResult, ProfileCompletionRequirements } from '../types/user';

// Define profile completion requirements
export const PROFILE_COMPLETION_REQUIREMENTS: ProfileCompletionRequirements = {
  basic: {
    fields: [
      'firstName',
      'lastName', 
      'email',
      'phone',
      'location',
      'jobTitle',
      'bio'
    ],
    weight: 30
  },
  intermediate: {
    fields: [
      'dateOfBirth',
      'employmentStatus',
      'experienceLevel',
      'skills',
      'education',
      'resume',
      'expectedSalary',
      'jobPreferences.preferredJobTypes',
      'jobPreferences.preferredLocations'
    ],
    weight: 40
  },
  complete: {
    fields: [
      'summary',
      'experience',
      'technicalSkills',
      'languages',
      'certifications',
      'socialLinks.linkedin',
      'jobPreferences.remoteWork',
      'jobPreferences.willingToRelocate',
      'jobPreferences.preferredIndustries',
      'address.city',
      'address.country'
    ],
    weight: 30
  }
};

// Required fields for accessing premium features
export const FEATURE_ACCESS_REQUIREMENTS = {
  psychometricTests: {
    requiredFields: [
      'firstName', 'lastName', 'email', 'phone', 'dateOfBirth',
      'education', 'experienceLevel', 'skills'
    ],
    minimumCompletion: 60
  },
  aiInterviews: {
    requiredFields: [
      'firstName', 'lastName', 'email', 'phone', 'jobTitle',
      'experience', 'skills', 'resume'
    ],
    minimumCompletion: 70
  },
  premiumJobs: {
    requiredFields: [
      'firstName', 'lastName', 'email', 'phone', 'location',
      'jobTitle', 'experience', 'education', 'skills', 'resume',
      'expectedSalary', 'jobPreferences'
    ],
    minimumCompletion: 85
  }
};

/**
 * Check if a field has a meaningful value
 */
function hasValue(value: any): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'number') return value > 0;
  if (typeof value === 'boolean') return true; // Boolean values are considered meaningful if set
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') {
    return Object.keys(value).some(key => hasValue(value[key]));
  }
  return Boolean(value);
}

/**
 * Get nested field value from user object
 */
function getNestedValue(obj: any, path: string): any {
  // Handle special cases for fields that might have different names
  if (path === 'resume') {
    // Check multiple possible resume field names
    return obj.resume || obj.cvFile;
  }
  
  if (path === 'skills') {
    // Ensure we get the skills array
    return obj.skills;
  }
  
  if (path.startsWith('jobPreferences.')) {
    const subPath = path.replace('jobPreferences.', '');
    if (!obj.jobPreferences) return undefined;
    
    // Handle different naming conventions for job preferences
    if (subPath === 'preferredJobTypes') {
      return obj.jobPreferences.preferredJobTypes || obj.jobPreferences.jobTypes;
    }
    if (subPath === 'preferredLocations') {
      return obj.jobPreferences.preferredLocations || obj.jobPreferences.locations;
    }
    if (subPath === 'preferredIndustries') {
      return obj.jobPreferences.preferredIndustries || obj.jobPreferences.industries;
    }
    
    return obj.jobPreferences[subPath];
  }
  
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined;
  }, obj);
}

/**
 * Calculate profile completion percentage and status
 */
export function validateProfile(user: User | null | undefined): ProfileValidationResult {
  // Guard against undefined user to avoid runtime errors
  if (!user) {
    console.warn('validateProfile called without a user. Returning default incomplete result.');
    return {
      isValid: false,
      completionPercentage: 0,
      status: ProfileCompletionStatus.INCOMPLETE,
      missingFields: [],
      recommendations: [],
      canAccessFeatures: {
        psychometricTests: false,
        aiInterviews: false,
        premiumJobs: false
      },
      completedSections: {
        basic: false,
        contact: false,
        personal: false,
        professional: false,
        education: false,
        experience: false,
        skills: false,
        preferences: false,
        documents: false
      }
    };
  }

  console.log('🔍 Frontend profile validation for user:', user._id || user.id);
  console.log('📋 Frontend user data summary:', {
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    location: user.location,
    bio: user.bio,
    jobTitle: user.jobTitle,
    skills: user.skills,
    experience: user.experience?.length || 0,
    education: user.education?.length || 0,
    resume: user.resume,
    cvFile: (user as any).cvFile,
    jobPreferences: user.jobPreferences
  });

  const missingFields: string[] = [];
  const recommendations: string[] = [];
  
  let totalWeight = 0;
  let completedWeight = 0;

  // Check basic fields
  const basicFields = PROFILE_COMPLETION_REQUIREMENTS.basic.fields;
  const basicWeight = PROFILE_COMPLETION_REQUIREMENTS.basic.weight;
  let basicCompleted = 0;

  basicFields.forEach(field => {
    const value = getNestedValue(user, field);
    if (hasValue(value)) {
      basicCompleted++;
    } else {
      missingFields.push(field);
    }
  });

  const basicCompletionRatio = basicCompleted / basicFields.length;
  completedWeight += basicCompletionRatio * basicWeight;
  totalWeight += basicWeight;

  // Check intermediate fields
  const intermediateFields = PROFILE_COMPLETION_REQUIREMENTS.intermediate.fields;
  const intermediateWeight = PROFILE_COMPLETION_REQUIREMENTS.intermediate.weight;
  let intermediateCompleted = 0;

  intermediateFields.forEach(field => {
    const value = getNestedValue(user, field);
    if (hasValue(value)) {
      intermediateCompleted++;
    } else {
      missingFields.push(field);
    }
  });

  const intermediateCompletionRatio = intermediateCompleted / intermediateFields.length;
  completedWeight += intermediateCompletionRatio * intermediateWeight;
  totalWeight += intermediateWeight;

  // Check complete fields
  const completeFields = PROFILE_COMPLETION_REQUIREMENTS.complete.fields;
  const completeWeight = PROFILE_COMPLETION_REQUIREMENTS.complete.weight;
  let completeCompleted = 0;

  completeFields.forEach(field => {
    const value = getNestedValue(user, field);
    if (hasValue(value)) {
      completeCompleted++;
    } else {
      missingFields.push(field);
    }
  });

  const completeCompletionRatio = completeCompleted / completeFields.length;
  completedWeight += completeCompletionRatio * completeWeight;
  totalWeight += completeWeight;

  const completionPercentage = Math.round((completedWeight / totalWeight) * 100);

  // Determine status
  let status: ProfileCompletionStatus;
  if (completionPercentage < 40) {
    status = ProfileCompletionStatus.INCOMPLETE;
  } else if (completionPercentage < 70) {
    status = ProfileCompletionStatus.BASIC;
  } else if (completionPercentage < 90) {
    status = ProfileCompletionStatus.INTERMEDIATE;
  } else {
    status = ProfileCompletionStatus.COMPLETE;
  }

  // Generate recommendations
  if (basicCompletionRatio < 1) {
    recommendations.push('Complete your basic profile information to improve visibility');
  }
  if (!hasValue(user.resume)) {
    recommendations.push('Upload your resume to attract more employers');
  }
  if (!hasValue(user.experience) || (user.experience && user.experience.length === 0)) {
    recommendations.push('Add your work experience to showcase your background');
  }
  if (!hasValue(user.skills)) {
    recommendations.push('Add skills to match with relevant job opportunities');
  } else if (user.skills && user.skills.length < 3) {
    recommendations.push('Add more skills (at least 3 total) to improve job matching');
  }
  if (!hasValue(user.socialLinks?.linkedin)) {
    recommendations.push('Add your LinkedIn profile to build professional credibility');
  }

  // Check feature access
  const canAccessFeatures = {
    psychometricTests: canAccessFeature(user, completionPercentage, 'psychometricTests'),
    aiInterviews: canAccessFeature(user, completionPercentage, 'aiInterviews'),
    premiumJobs: canAccessFeature(user, completionPercentage, 'premiumJobs')
  };

  // Calculate completed sections
  const completedSections = {
    basic: basicCompletionRatio > 0.5,
    contact: hasValue(user.email) && hasValue(user.phone),
    personal: hasValue(user.firstName) && hasValue(user.lastName) && hasValue(user.dateOfBirth),
    professional: hasValue(user.jobTitle) && hasValue(user.experienceLevel),
    education: Boolean(hasValue(user.education) && user.education && user.education.length > 0),
    experience: Boolean(hasValue(user.experience) && user.experience && user.experience.length > 0),
    skills: Boolean(hasValue(user.skills) && user.skills && user.skills.length > 0),
    preferences: hasValue(user.jobPreferences),
    documents: hasValue(user.resume)
  };

  return {
    isValid: completionPercentage >= 40,
    completionPercentage,
    status,
    missingFields,
    recommendations,
    canAccessFeatures,
    completedSections
  };
}

/**
 * Check if user can access a specific feature
 */
function canAccessFeature(user: User, completionPercentage: number, feature: keyof typeof FEATURE_ACCESS_REQUIREMENTS): boolean {
  const requirements = FEATURE_ACCESS_REQUIREMENTS[feature];
  
  // Check minimum completion percentage
  if (completionPercentage < requirements.minimumCompletion) {
    return false;
  }

  // Check required fields
  return requirements.requiredFields.every(field => {
    const value = getNestedValue(user, field);
    return hasValue(value);
  });
}

/**
 * Get user-friendly field names for display
 */
export function getFieldDisplayName(field: string): string {
  const fieldNames: Record<string, string> = {
    'firstName': 'First Name',
    'lastName': 'Last Name',
    'email': 'Email Address',
    'phone': 'Phone Number',
    'location': 'Location',
    'jobTitle': 'Job Title',
    'bio': 'Bio/About Me',
    'dateOfBirth': 'Date of Birth',
    'employmentStatus': 'Employment Status',
    'experienceLevel': 'Experience Level',
    'skills': 'Skills',
    'education': 'Education',
    'resume': 'Resume',
    'expectedSalary': 'Expected Salary',
    'jobPreferences.preferredJobTypes': 'Preferred Job Types',
    'jobPreferences.preferredLocations': 'Preferred Locations',
    'summary': 'Professional Summary',
    'experience': 'Work Experience',
    'technicalSkills': 'Technical Skills',
    'languages': 'Languages',
    'certifications': 'Certifications',
    'socialLinks.linkedin': 'LinkedIn Profile',
    'jobPreferences.remoteWork': 'Remote Work Preference',
    'jobPreferences.willingToRelocate': 'Relocation Preference',
    'jobPreferences.preferredIndustries': 'Preferred Industries',
    'address.city': 'City',
    'address.country': 'Country'
  };

  return fieldNames[field] || field;
}

/**
 * Get completion status color
 */
export function getCompletionStatusColor(status: ProfileCompletionStatus): string {
  switch (status) {
    case ProfileCompletionStatus.INCOMPLETE:
      return '#f44336'; // Red
    case ProfileCompletionStatus.BASIC:
      return '#ff9800'; // Orange
    case ProfileCompletionStatus.INTERMEDIATE:
      return '#2196f3'; // Blue
    case ProfileCompletionStatus.COMPLETE:
      return '#4caf50'; // Green
    default:
      return '#757575'; // Grey
  }
}

/**
 * Get next steps for profile completion
 */
export function getNextSteps(validationResult: ProfileValidationResult): string[] {
  const { status, canAccessFeatures } = validationResult;
  const nextSteps: string[] = [];

  if (status === ProfileCompletionStatus.INCOMPLETE) {
    nextSteps.push('Complete basic information (name, email, phone, location)');
    nextSteps.push('Add a professional job title and bio');
  }

  if (status === ProfileCompletionStatus.BASIC) {
    nextSteps.push('Upload your resume');
    nextSteps.push('Add your education background');
    nextSteps.push('List your key skills');
    nextSteps.push('Set your job preferences');
  }

  if (status === ProfileCompletionStatus.INTERMEDIATE) {
    nextSteps.push('Add detailed work experience');
    nextSteps.push('Include technical skills with proficiency levels');
    nextSteps.push('Add language proficiencies');
    nextSteps.push('Connect your LinkedIn profile');
  }

  // Feature-specific recommendations
  if (!canAccessFeatures.psychometricTests) {
    nextSteps.push('Complete profile to access psychometric tests');
  }
  if (!canAccessFeatures.aiInterviews) {
    nextSteps.push('Add work experience and upload resume to access AI interviews');
  }
  if (!canAccessFeatures.premiumJobs) {
    nextSteps.push('Complete all profile sections to access premium job opportunities');
  }

  return nextSteps;
}