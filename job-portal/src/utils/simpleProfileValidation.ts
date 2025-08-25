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
  };
  completedSections: {
    [key: string]: boolean;
  };
}

/**
 * Simple profile validation that matches backend logic
 */
export function validateProfileSimple(user: User): SimpleProfileValidationResult {
  if (!user) {
    console.warn('⚠️ validateProfileSimple called with null/undefined user');
    return {
      isValid: false,
      completionPercentage: 0,
      status: 'incomplete',
      missingFields: ['All fields are missing'],
      recommendations: ['Please complete your profile'],
      canAccessFeatures: {
        psychometricTests: false,
        aiInterviews: false,
        premiumJobs: false,
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
    };
  }
  
  console.log('🔍 Simple frontend profile validation for user:', user._id || user.id);
  console.log('📋 User data:', {
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
  
  fields.forEach(field => {
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
  });
  
  const completionPercentage = Math.min(totalScore, 100);
  const status = getStatus(completionPercentage);
  
  // Add general recommendations
  if (completionPercentage < 50) {
    recommendations.push('Complete your basic profile information to get started');
  } else if (completionPercentage < 80) {
    recommendations.push('Add more details to improve your profile visibility');
  }
  
  // Calculate feature access
  const canAccessFeatures = {
    psychometricTests: completionPercentage >= 40,
    aiInterviews: completionPercentage >= 60 && hasFieldValue(user, 'resume'),
    premiumJobs: completionPercentage >= 80
  };
  
  // Calculate completed sections
  const completedSections = {
    basic: hasFieldValue(user, 'firstName') && hasFieldValue(user, 'lastName') && hasFieldValue(user, 'email'),
    contact: hasFieldValue(user, 'phone') && hasFieldValue(user, 'location'),
    professional: hasFieldValue(user, 'jobTitle') && hasFieldValue(user, 'bio'),
    skills: hasFieldValue(user, 'skills'),
    experience: hasFieldValue(user, 'experience'),
    education: hasFieldValue(user, 'education'),
    preferences: hasFieldValue(user, 'jobPreferences'),
    documents: hasFieldValue(user, 'resume')
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
        return (resumeValue !== null && resumeValue !== undefined && resumeValue.trim && resumeValue.trim().length > 0) ||
               (cvFileValue !== null && cvFileValue !== undefined && cvFileValue.trim && cvFileValue.trim().length > 0);
      
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
  if (percentage >= 90) return 'complete';
  if (percentage >= 70) return 'good';
  if (percentage >= 50) return 'basic';
  return 'incomplete';
}