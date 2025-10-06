import { User, ProfileCompletionStatus } from '../types/user';

export interface ProfileCompletionCheck {
  isComplete: boolean;
  completionPercentage: number;
  status: ProfileCompletionStatus;
  missingFields: string[];
  shouldShowPopup: boolean;
}

/**
 * Check if user profile is complete enough to show completion popup
 * Returns true if profile is incomplete and should show popup
 */
export const shouldShowProfileCompletionPopup = (user: User | null): boolean => {
  if (!user) return false;
  
  const check = checkProfileCompletion(user);
  
  // Show popup if completion is less than 60% and user hasn't dismissed it recently
  const shouldShow = check.completionPercentage < 60;
  
  // Check if user has dismissed the popup recently (within 24 hours)
  const dismissedKey = `profile_completion_dismissed_${user._id}`;
  const dismissedTime = localStorage.getItem(dismissedKey);
  
  if (dismissedTime) {
    const dismissedDate = new Date(dismissedTime);
    const now = new Date();
    const hoursSinceDismissed = (now.getTime() - dismissedDate.getTime()) / (1000 * 60 * 60);
    
    // Don't show popup if dismissed within last 24 hours
    if (hoursSinceDismissed < 24) {
      return false;
    }
  }
  
  return shouldShow;
};

/**
 * Check if user has a CV and should show CV builder popup
 */
export const shouldShowCVBuilderPopup = (user: User | null): boolean => {
  if (!user) return false;
  
  // Check if user has CV file
  const hasCV = user.cvFile && user.cvFile.trim() !== '';
  
  // Check if user has dismissed CV popup recently
  const dismissedKey = `cv_builder_dismissed_${user._id}`;
  const dismissedTime = localStorage.getItem(dismissedKey);
  
  if (dismissedTime) {
    const dismissedDate = new Date(dismissedTime);
    const now = new Date();
    const hoursSinceDismissed = (now.getTime() - dismissedDate.getTime()) / (1000 * 60 * 60);
    
    // Don't show popup if dismissed within last 48 hours
    if (hoursSinceDismissed < 48) {
      return false;
    }
  }
  
  // Show CV popup if no CV exists and profile is reasonably complete (at least 30%)
  const profileCheck = checkProfileCompletion(user);
  return !hasCV && profileCheck.completionPercentage >= 30;
};

/**
 * Check profile completion status
 */
export const checkProfileCompletion = (user: User): ProfileCompletionCheck => {
  const requiredFields = [
    'firstName',
    'lastName',
    'email',
    'phone',
    'location',
    'jobTitle',
    'company',
    'bio',
    'skills',
    'experience',
    'education',
  ];

  const optionalFields = [
    'profilePicture',
    'linkedinUrl',
    'githubUrl',
    'portfolioUrl',
    'certifications',
    'languages',
    'projects',
  ];

  const missingFields: string[] = [];
  let completedFields = 0;
  const totalFields = requiredFields.length;

  // Check required fields
  requiredFields.forEach(field => {
    const value = user[field as keyof User];
    if (!value || (Array.isArray(value) && value.length === 0) || (typeof value === 'string' && value.trim() === '')) {
      missingFields.push(field);
    } else {
      completedFields++;
    }
  });

  // Check optional fields for bonus completion
  optionalFields.forEach(field => {
    const value = user[field as keyof User];
    if (value && (!Array.isArray(value) || value.length > 0) && (typeof value !== 'string' || value.trim() !== '')) {
      completedFields += 0.5; // Half point for optional fields
    }
  });

  const completionPercentage = Math.min(100, Math.round((completedFields / (totalFields + optionalFields.length * 0.5)) * 100));

  let status: ProfileCompletionStatus;
  if (completionPercentage < 30) {
    status = ProfileCompletionStatus.INCOMPLETE;
  } else if (completionPercentage < 60) {
    status = ProfileCompletionStatus.BASIC;
  } else if (completionPercentage < 90) {
    status = ProfileCompletionStatus.INTERMEDIATE;
  } else {
    status = ProfileCompletionStatus.COMPLETE;
  }

  return {
    isComplete: completionPercentage >= 90,
    completionPercentage,
    status,
    missingFields,
    shouldShowPopup: completionPercentage < 60,
  };
};

/**
 * Mark profile completion popup as dismissed
 */
export const markProfileCompletionDismissed = (userId: string): void => {
  const key = `profile_completion_dismissed_${userId}`;
  localStorage.setItem(key, new Date().toISOString());
};

/**
 * Mark CV builder popup as dismissed
 */
export const markCVBuilderDismissed = (userId: string): void => {
  const key = `cv_builder_dismissed_${userId}`;
  localStorage.setItem(key, new Date().toISOString());
};
