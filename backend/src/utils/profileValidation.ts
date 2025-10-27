import { IUserDocument } from '../models/User';

export interface ProfileValidationResult {
  completionPercentage: number;
  status: 'incomplete' | 'basic' | 'complete' | 'comprehensive';
  missingFields: string[];
  recommendations: string[];
  canAccessFeatures: {
    psychometricTests: boolean;
    aiInterviews: boolean;
    premiumJobs: boolean;
  };
}

/**
 * Validates user profile and calculates completion percentage
 */
export const validateProfile = (user: IUserDocument): ProfileValidationResult => {
  const missingFields: string[] = [];
  const recommendations: string[] = [];
  let score = 0;
  const maxScore = 100;

  // Basic Information (30% weight)
  const basicFields = {
    'firstName': user.firstName ? 5 : 0,
    'lastName': user.lastName ? 5 : 0,
    'email': user.email ? 5 : 0,
    'phone': user.phone ? 5 : 0,
    'location': user.location ? 5 : 0,
    'bio': user.bio ? 5 : 0
  };

  Object.entries(basicFields).forEach(([field, points]) => {
    score += points;
    if (points === 0) {
      missingFields.push(field);
    }
  });

  // Professional Information (25% weight)
  if (user.jobTitle) {
    score += 5;
  } else {
    missingFields.push('jobTitle');
  }

  if (user.summary) {
    score += 5;
  } else {
    missingFields.push('summary');
  }

  if (user.skills && user.skills.length >= 3) {
    score += 10;
  } else {
    missingFields.push('skills');
    recommendations.push('Add at least 3 relevant skills to improve job matching');
  }

  if (user.experienceLevel) {
    score += 5;
  } else {
    missingFields.push('experienceLevel');
  }

  // Experience (20% weight)
  if (user.experience && user.experience.length > 0) {
    score += 15;
    
    // Bonus for detailed experience
    const hasDetailedExperience = user.experience.some(exp => 
      exp.description && exp.responsibilities && exp.responsibilities.length > 0
    );
    if (hasDetailedExperience) {
      score += 5;
    }
  } else {
    missingFields.push('experience');
    recommendations.push('Add your work experience to showcase your background');
  }

  // Education (10% weight)
  if (user.education && user.education.length > 0) {
    score += 10;
  } else {
    missingFields.push('education');
    recommendations.push('Add your educational background');
  }

  // Resume/CV (10% weight)
  if (user.resume || user.cvFile) {
    score += 10;
  } else {
    missingFields.push('resume');
    recommendations.push('Upload your resume/CV for better visibility to employers');
  }

  // Profile Picture (5% weight)
  if (user.profilePicture) {
    score += 5;
  } else {
    missingFields.push('profilePicture');
    recommendations.push('Add a professional profile picture to increase profile views');
  }

  // Calculate completion percentage
  const completionPercentage = Math.min(Math.round(score), 100);

  // Determine status
  let status: ProfileValidationResult['status'];
  if (completionPercentage < 30) {
    status = 'incomplete';
  } else if (completionPercentage < 60) {
    status = 'basic';
  } else if (completionPercentage < 90) {
    status = 'complete';
  } else {
    status = 'comprehensive';
  }

  // Determine feature access
  const canAccessFeatures = {
    psychometricTests: completionPercentage >= 40,
    aiInterviews: completionPercentage >= 60,
    premiumJobs: completionPercentage >= 80
  };

  // Add general recommendations based on completion percentage
  if (completionPercentage < 50) {
    recommendations.push('Complete basic profile information to apply for jobs');
  }
  if (completionPercentage < 80) {
    recommendations.push('Add detailed work experience to attract more employers');
  }
  if (!user.socialLinks?.linkedin) {
    recommendations.push('Connect your LinkedIn profile for better credibility');
  }

  return {
    completionPercentage,
    status,
    missingFields,
    recommendations,
    canAccessFeatures
  };
};

/**
 * Check if user profile meets minimum requirements for job applications
 */
export const canApplyForJobs = (user: IUserDocument): boolean => {
  const validation = validateProfile(user);
  return validation.completionPercentage >= 50;
};

/**
 * Get next steps for profile completion
 */
export const getNextSteps = (user: IUserDocument): string[] => {
  const validation = validateProfile(user);
  const nextSteps: string[] = [];
  
  if (validation.completionPercentage < 40) {
    nextSteps.push('Complete basic information (name, email, phone, location)');
    nextSteps.push('Add a professional job title and bio');
  }
  
  if (validation.completionPercentage < 80) {
    nextSteps.push('Upload your resume');
    nextSteps.push('Add your education background');
    nextSteps.push('List your key skills (at least 3)');
    nextSteps.push('Set your job preferences');
  }
  
  if (validation.completionPercentage < 90) {
    nextSteps.push('Add detailed work experience');
    nextSteps.push('Include technical skills with proficiency levels');
    nextSteps.push('Add language proficiencies');
    nextSteps.push('Connect your LinkedIn profile');
  }

  return nextSteps;
};

/**
 * Calculate profile strength score for job applications
 */
export const calculateProfileStrength = (user: IUserDocument): {
  score: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
} => {
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
  if (user.resume || user.cvFile) {
    strengths.push('Resume uploaded');
  }
  if (user.socialLinks?.linkedin) {
    strengths.push('LinkedIn profile connected');
  }
  if (user.certifications && user.certifications.length > 0) {
    strengths.push('Professional certifications added');
  }

  // Check weaknesses and provide suggestions
  if (!user.experience || user.experience.length === 0) {
    weaknesses.push('No work experience added');
    suggestions.push('Add your work experience to showcase your background');
  }
  if (!user.resume && !user.cvFile) {
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
  if (!user.summary) {
    weaknesses.push('No professional summary');
    suggestions.push('Add a professional summary to highlight your value');
  }

  return {
    score: validation.completionPercentage,
    strengths,
    weaknesses,
    suggestions
  };
};