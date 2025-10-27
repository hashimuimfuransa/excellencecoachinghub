import { IUserDocument } from '../models/User';

export interface SimpleProfileCompletionResult {
  percentage: number;
  status: string;
  completedFields: string[];
  missingFields: string[];
  recommendations: string[];
}

export class SimpleProfileCompletionService {
  /**
   * Calculate profile completion with simple, reliable logic
   */
  calculateCompletion(user: IUserDocument | null | undefined): SimpleProfileCompletionResult {
    if (!user) {
      console.warn('calculateCompletion called with no user. Returning 0% completion.');
      return {
        percentage: 0,
        status: 'incomplete',
        completedFields: [],
        missingFields: [
          'First Name', 'Last Name', 'Email', 'Phone Number', 'Location',
          'Job Title', 'Bio/Summary', 'Skills', 'Resume/CV',
          'Work Experience', 'Education', 'Job Preferences', 'Expected Salary'
        ],
        recommendations: ['Please log in and complete your basic profile information']
      };
    }

    console.log('🔍 Simple profile completion calculation for user:', user._id);
    
    const completedFields: string[] = [];
    const missingFields: string[] = [];
    const recommendations: string[] = [];
    
    // Define essential fields with their weights
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
      const hasValue = this.hasFieldValue(user, field.name);
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
    
    const percentage = Math.min(totalScore, 100);
    const status = this.getStatus(percentage);
    
    // Add general recommendations
    if (percentage < 50) {
      recommendations.push('Complete your basic profile information to get started');
    } else if (percentage < 80) {
      recommendations.push('Add more details to improve your profile visibility');
    }
    
    console.log(`📊 Simple completion result: ${percentage}% (${totalScore}/100 points)`);
    console.log(`✅ Completed: ${completedFields.join(', ')}`);
    console.log(`❌ Missing: ${missingFields.join(', ')}`);
    
    return {
      percentage,
      status,
      completedFields,
      missingFields,
      recommendations
    };
  }
  
  /**
   * Check if a field has a meaningful value
   */
  private hasFieldValue(user: IUserDocument, fieldName: string): boolean {
    try {
      switch (fieldName) {
        case 'firstName':
        case 'lastName':
        case 'email':
          return Boolean(user[fieldName] && typeof user[fieldName] === 'string' && user[fieldName].trim().length > 0);
        
        case 'phone':
        case 'location':
        case 'jobTitle':
        case 'bio':
          return Boolean(user[fieldName] && typeof user[fieldName] === 'string' && user[fieldName].trim().length > 0);
        
        case 'expectedSalary':
          return Boolean(user.expectedSalary && typeof user.expectedSalary === 'number' && user.expectedSalary > 0);
        
        case 'skills':
          return Boolean(user.skills && Array.isArray(user.skills) && user.skills.length > 0);
        
        case 'experience':
          return Boolean(user.experience && Array.isArray(user.experience) && user.experience.length > 0);
        
        case 'education':
          return Boolean(user.education && Array.isArray(user.education) && user.education.length > 0);
        
        case 'resume':
          return Boolean(user.resume || user.cvFile || user.resumeFile);
        
        case 'jobPreferences':
          if (!user.jobPreferences) return false;
          const prefs = user.jobPreferences;
          return Boolean(
            (prefs.preferredJobTypes && prefs.preferredJobTypes.length > 0) ||
            (prefs.preferredLocations && prefs.preferredLocations.length > 0) ||
            (prefs.jobTypes && prefs.jobTypes.length > 0) ||
            (prefs.locations && prefs.locations.length > 0) ||
            prefs.remoteWork !== undefined ||
            prefs.willingToRelocate !== undefined
          );
        
        default:
          const value = user[fieldName as keyof IUserDocument];
          return Boolean(value);
      }
    } catch (error) {
      console.error(`Error checking field ${fieldName}:`, error);
      return false;
    }
  }
  
  /**
   * Get completion status based on percentage
   */
  private getStatus(percentage: number): string {
    if (percentage >= 90) return 'complete';
    if (percentage >= 70) return 'good';
    if (percentage >= 50) return 'basic';
    return 'incomplete';
  }
}

export const simpleProfileCompletionService = new SimpleProfileCompletionService();