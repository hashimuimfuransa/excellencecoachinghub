import { UserRole } from '../shared/types';

/**
 * Check if a user role should have access to student/learner features
 * This includes STUDENT, JOB_SEEKER, and PROFESSIONAL roles
 */
export const isLearnerRole = (role?: UserRole): boolean => {
  return role === UserRole.STUDENT || role === UserRole.JOB_SEEKER || role === UserRole.PROFESSIONAL;
};

/**
 * Check if a user role is a student specifically
 */
export const isStudentRole = (role?: UserRole): boolean => {
  return role === UserRole.STUDENT;
};

/**
 * Check if a user role is a job seeker specifically
 */
export const isJobSeekerRole = (role?: UserRole): boolean => {
  return role === UserRole.JOB_SEEKER;
};

/**
 * Check if a user role is a professional specifically
 */
export const isProfessionalRole = (role?: UserRole): boolean => {
  return role === UserRole.PROFESSIONAL;
};

/**
 * Check if a user role is an admin (includes super admin)
 */
export const isAdminRole = (role?: UserRole): boolean => {
  return role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN;
};

/**
 * Check if a user role is a teacher
 */
export const isTeacherRole = (role?: UserRole): boolean => {
  return role === UserRole.TEACHER;
};

/**
 * Get the appropriate dashboard path for a user role
 */
export const getDashboardPath = (role?: UserRole): string => {
  if (isAdminRole(role)) {
    return '/dashboard/admin';
  }
  if (isTeacherRole(role)) {
    return '/dashboard/teacher';
  }
  // Both students and job seekers go to student dashboard
  return '/dashboard/student';
};