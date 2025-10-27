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
  console.log('🔍 shouldShowProfileCompletionPopup called with user:', user);
  
  if (!user) {
    console.log('❌ No user provided');
    return false;
  }
  
  const check = checkProfileCompletion(user);
  console.log('📊 Profile completion check:', check);
  
  // Show popup if completion is less than 80% - ALWAYS show for incomplete profiles
  const shouldShow = check.completionPercentage < 80;
  console.log('📈 Completion percentage:', check.completionPercentage, 'Should show (need 80%+):', shouldShow);
  
  // REMOVED: 24-hour dismissal logic - popup should show every time for incomplete profiles
  // This ensures users are always reminded to complete their profile when visiting network page
  
  console.log('✅ Final result - should show popup:', shouldShow);
  return shouldShow;
};

/**
 * Check if user has a CV and should show CV builder popup
 */
export const shouldShowCVBuilderPopup = (user: User | null): boolean => {
  console.log('🔍 shouldShowCVBuilderPopup called with user:', user);
  
  if (!user) {
    console.log('❌ No user provided');
    return false;
  }
  
  // Check if user has CV file
  const hasCV = user.cvFile && user.cvFile.trim() !== '';
  console.log('📄 User has CV:', hasCV, 'CV file:', user.cvFile);
  
  // REMOVED: 48-hour dismissal logic - popup should show every time for users without CV
  // This ensures users are always reminded to build their CV when visiting profile edit page
  
  // Show CV popup if no CV exists - removed profile completion requirement
  // Users should be encouraged to build CV regardless of profile completion level
  const profileCheck = checkProfileCompletion(user);
  const shouldShow = !hasCV; // Show CV popup for any user without a CV file
  
  console.log('📊 CV Builder check results:', {
    hasCV,
    profileCompletion: profileCheck.completionPercentage,
    shouldShow,
    reason: hasCV ? 'User already has CV' : 'User needs CV'
  });
  
  console.log('✅ Final result - should show CV popup:', shouldShow);
  return shouldShow;
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
    'resume',
    'expectedSalary',
    'jobPreferences',
  ];

  const missingFields: string[] = [];
  let completedFields = 0;
  let totalScore = 0;
  const totalFields = requiredFields.length;
  
  // Define field weights (matching validateProfileSimple)
  const fieldWeights: { [key: string]: number } = {
    firstName: 10,
    lastName: 10,
    email: 10,
    phone: 10,
    location: 10,
    jobTitle: 5,
    bio: 5,
    skills: 10,
    experience: 5,
    education: 5,
    profilePicture: 2,
    linkedinUrl: 2,
    githubUrl: 2,
    portfolioUrl: 2,
    certifications: 2,
    languages: 2,
    projects: 2,
    resume: 10,
    expectedSalary: 5,
    jobPreferences: 5,
  };

  // Check required fields
  requiredFields.forEach(field => {
    const value = user[field as keyof User];
    const weight = fieldWeights[field] || 5;
    
    if (!value || (Array.isArray(value) && value.length === 0) || (typeof value === 'string' && value.trim() === '')) {
      missingFields.push(field);
    } else {
      completedFields++;
      totalScore += weight;
    }
  });

  // Check optional fields for bonus completion
  optionalFields.forEach(field => {
    const value = user[field as keyof User];
    const weight = fieldWeights[field] || 2;
    if (value && (!Array.isArray(value) || value.length > 0) && (typeof value !== 'string' || value.trim() !== '')) {
      totalScore += weight;
    }
  });

  const completionPercentage = Math.min(100, Math.round(totalScore));

  let status: ProfileCompletionStatus;
  if (completionPercentage < 30) {
    status = ProfileCompletionStatus.INCOMPLETE;
  } else if (completionPercentage < 50) {
    status = ProfileCompletionStatus.BASIC;
  } else if (completionPercentage < 80) {
    status = ProfileCompletionStatus.INTERMEDIATE;
  } else {
    status = ProfileCompletionStatus.COMPLETE;
  }

  return {
    isComplete: completionPercentage >= 90,
    completionPercentage,
    status,
    missingFields,
    shouldShowPopup: completionPercentage < 80, // Updated to 80% threshold to match profile page
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
