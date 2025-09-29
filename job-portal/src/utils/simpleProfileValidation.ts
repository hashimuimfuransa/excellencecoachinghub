import { User } from '../types/user';

export interface SimpleProfileValidationResult {
  isValid: boolean;
  completionPercentage: number;
  status: string;
  missingFields: string[];
  recommendations: string[];
  canAccessFeatures: {
    psychometricTests: boolean;
    aiInterviews: boolean;
    premiumJobs: boolean;
    smartTests: boolean;
  };
  completedSections: {
    [key: string]: boolean;
  };
}

/**
 * Simple profile validation that matches backend logic
 */
export function validateProfileSimple(user: User): SimpleProfileValidationResult {
  // Create safe default result
  const createDefaultResult = (): SimpleProfileValidationResult => ({
    isValid: false,
    completionPercentage: 0,
    status: 'incomplete',
    missingFields: ['Profile validation error'],
    recommendations: ['Please refresh the page and try again'],
    canAccessFeatures: {
      psychometricTests: false,
      aiInterviews: false,
      premiumJobs: false,
      smartTests: false,
    },
    completedSections: {
      basic: false,
      contact: false,
      professional: false,
      skills: false,
      experience: false,
      education: false,
      preferences: false,
      documents: false
    }
  });

  // Early return for invalid user
  if (!user || typeof user !== 'object') {
    console.warn('⚠️ validateProfileSimple called with invalid user');
    return createDefaultResult();
  }

  try {
    console.log('🔍 Simple frontend profile validation for user:', user._id || user.id);
    
    const completedFields: string[] = [];
    const missingFields: string[] = [];
    const recommendations: string[] = [];
    
    // Define essential fields with their weights (matching backend)
    const fields = [
      // Basic Info (50 points total)
      { name: 'firstName', weight: 10, label: 'First Name', required: true },
      { name: 'lastName', weight: 10, label: 'Last Name', required: true },
      { name: 'email', weight: 10, label: 'Email', required: true },
      { name: 'phone', weight: 10, label: 'Phone Number', required: false },
      { name: 'location', weight: 10, label: 'Location', required: false },
      
      // Professional Info (30 points total)
      { name: 'jobTitle', weight: 5, label: 'Job Title', required: false },
      { name: 'bio', weight: 5, label: 'Bio/Summary', required: false },
      { name: 'skills', weight: 10, label: 'Skills', required: false },
      { name: 'resume', weight: 10, label: 'Resume/CV', required: false },
      
      // Additional Info (20 points total)
      { name: 'experience', weight: 5, label: 'Work Experience', required: false },
      { name: 'education', weight: 5, label: 'Education', required: false },
      { name: 'jobPreferences', weight: 5, label: 'Job Preferences', required: false },
      { name: 'expectedSalary', weight: 5, label: 'Expected Salary', required: false }
    ];
    
    let totalScore = 0;
    
    for (const field of fields) {
      try {
        const hasValue = hasFieldValue(user, field.name);
        console.log(`📋 ${field.name}: ${hasValue ? '✅' : '❌'} (${field.weight} points)`);
        
        if (hasValue) {
          completedFields.push(field.name);
          totalScore += field.weight;
        } else {
          missingFields.push(field.label);
          if (field.required) {
            recommendations.push(`Please add your ${field.label.toLowerCase()}`);
          }
        }
      } catch (fieldError) {
        console.warn(`Error processing field ${field.name}:`, fieldError);
        missingFields.push(field.label);
      }
    }
    
    const completionPercentage = Math.min(Math.max(totalScore, 0), 100);
    const status = getStatus(completionPercentage);
    
    // Add general recommendations
    if (completionPercentage < 50) {
      recommendations.push('Complete your basic profile information to get started');
    } else if (completionPercentage < 80) {
      recommendations.push('Add more details to improve your profile visibility');
    }
    
    // Calculate feature access safely
    let psychometricAccess = false;
    let aiInterviewAccess = false;
    let premiumJobAccess = false;
    let smartTestAccess = false;
    
    try {
      psychometricAccess = completionPercentage >= 40;
      aiInterviewAccess = completionPercentage >= 60 && hasFieldValue(user, 'resume');
      premiumJobAccess = completionPercentage >= 80;
      // Smart tests: Exact same as psychometric tests - just 40% completion
      smartTestAccess = completionPercentage >= 40;
      
      console.log(`🔍 Feature access calculation for ${completionPercentage}%:`);
      console.log(`📋 Psychometric tests: ${psychometricAccess}`);
      console.log(`📋 Smart Tests: ${smartTestAccess}`);
    } catch (accessError) {
      console.warn('Error calculating feature access:', accessError);
    }
    
    const canAccessFeatures = {
      psychometricTests: psychometricAccess,
      aiInterviews: aiInterviewAccess,
      premiumJobs: premiumJobAccess,
      smartTests: smartTestAccess
    };
    
    // Calculate completed sections safely
    let basicSection = false;
    let contactSection = false;
    let professionalSection = false;
    let skillsSection = false;
    let experienceSection = false;
    let educationSection = false;
    let preferencesSection = false;
    let documentsSection = false;
    
    try {
      basicSection = hasFieldValue(user, 'firstName') && hasFieldValue(user, 'lastName') && hasFieldValue(user, 'email');
      contactSection = hasFieldValue(user, 'phone') && hasFieldValue(user, 'location');
      professionalSection = hasFieldValue(user, 'jobTitle') && hasFieldValue(user, 'bio');
      skillsSection = hasFieldValue(user, 'skills');
      experienceSection = hasFieldValue(user, 'experience');
      educationSection = hasFieldValue(user, 'education');
      preferencesSection = hasFieldValue(user, 'jobPreferences');
      documentsSection = hasFieldValue(user, 'resume');
    } catch (sectionsError) {
      console.warn('Error calculating completed sections:', sectionsError);
    }
    
    const completedSections = {
      basic: basicSection,
      contact: contactSection,
      professional: professionalSection,
      skills: skillsSection,
      experience: experienceSection,
      education: educationSection,
      preferences: preferencesSection,
      documents: documentsSection
    };
    
    console.log(`📊 Simple frontend completion result: ${completionPercentage}% (${totalScore}/100 points)`);
    console.log(`✅ Completed: ${completedFields.join(', ')}`);
    console.log(`❌ Missing: ${missingFields.join(', ')}`);
    
    return {
      isValid: completionPercentage >= 40,
      completionPercentage,
      status,
      missingFields,
      recommendations,
      canAccessFeatures,
      completedSections
    };

  } catch (error) {
    console.error('❌ Critical error in validateProfileSimple:', error);
    return createDefaultResult();
  }
}

/**
 * Check if a field has a meaningful value (matching backend logic)
 */
function hasFieldValue(user: User, fieldName: string): boolean {
  if (!user || typeof user !== 'object') {
    console.warn(`hasFieldValue called with invalid user object for field ${fieldName}`);
    return false;
  }

  try {
    switch (fieldName) {
      case 'firstName':
      case 'lastName':
      case 'email':
        const basicValue = user[fieldName];
        return basicValue !== null && basicValue !== undefined && typeof basicValue === 'string' && basicValue.trim().length > 0;
      
      case 'phone':
      case 'location':
      case 'jobTitle':
      case 'bio':
        const stringValue = user[fieldName as keyof User];
        return stringValue !== null && stringValue !== undefined && typeof stringValue === 'string' && stringValue.trim().length > 0;
      
      case 'expectedSalary':
        const salaryValue = user.expectedSalary;
        return salaryValue !== null && salaryValue !== undefined && typeof salaryValue === 'number' && !isNaN(salaryValue) && salaryValue > 0;
      
      case 'skills':
        const skillsValue = user.skills;
        return skillsValue !== null && skillsValue !== undefined && Array.isArray(skillsValue) && skillsValue.length > 0;
      
      case 'experience':
        const expValue = user.experience;
        return expValue !== null && expValue !== undefined && Array.isArray(expValue) && expValue.length > 0;
      
      case 'education':
        const eduValue = user.education;
        return eduValue !== null && eduValue !== undefined && Array.isArray(eduValue) && eduValue.length > 0;
      
      case 'resume':
        const resumeValue = user.resume;
        const cvFileValue = (user as any).cvFile;
        return (resumeValue !== null && resumeValue !== undefined && typeof resumeValue === 'string' && resumeValue.trim().length > 0) ||
               (cvFileValue !== null && cvFileValue !== undefined && typeof cvFileValue === 'string' && cvFileValue.trim().length > 0);
      
      case 'jobPreferences':
        const prefs = user.jobPreferences;
        if (!prefs || typeof prefs !== 'object') return false;
        
        try {
          return Boolean(
            (prefs.preferredJobTypes && Array.isArray(prefs.preferredJobTypes) && prefs.preferredJobTypes.length > 0) ||
            (prefs.preferredLocations && Array.isArray(prefs.preferredLocations) && prefs.preferredLocations.length > 0) ||
            ((prefs as any).jobTypes && Array.isArray((prefs as any).jobTypes) && (prefs as any).jobTypes.length > 0) ||
            ((prefs as any).locations && Array.isArray((prefs as any).locations) && (prefs as any).locations.length > 0) ||
            (prefs.remoteWork !== undefined && prefs.remoteWork !== null) ||
            (prefs.willingToRelocate !== undefined && prefs.willingToRelocate !== null)
          );
        } catch (prefsError) {
          console.warn(`Error checking jobPreferences:`, prefsError);
          return false;
        }
      
      default:
        try {
          const value = user[fieldName as keyof User];
          return value !== null && value !== undefined && Boolean(value);
        } catch (defaultError) {
          console.warn(`Error checking default field ${fieldName}:`, defaultError);
          return false;
        }
    }
  } catch (error) {
    console.error(`Error checking field ${fieldName}:`, error);
    return false;
  }
}

/**
 * Get completion status based on percentage
 */
function getStatus(percentage: number): string {
  try {
    const safePercentage = Math.max(0, Math.min(100, percentage || 0));
    
    if (safePercentage >= 90) return 'complete';
    if (safePercentage >= 70) return 'good';
    if (safePercentage >= 50) return 'basic';
    return 'incomplete';
  } catch (error) {
    console.warn('Error in getStatus:', error);
    return 'incomplete';
  }
}