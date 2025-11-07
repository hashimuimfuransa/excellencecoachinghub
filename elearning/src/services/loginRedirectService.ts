import { enrollmentService, IEnrollment } from './enrollmentService';
import { UserRole } from '../shared/types';
import { isLearnerRole } from '../utils/roleUtils';

export interface LoginRedirectOptions {
  userRole: UserRole;
  interests?: any;
  from?: string;
}

export const loginRedirectService = {
  /**
   * Determines the appropriate redirect path after login based on user role and enrollments
   */
  getRedirectPath: async (options: LoginRedirectOptions): Promise<string> => {
    const { userRole, interests, from } = options;
    
    console.log('🔍 LoginRedirectService - Getting redirect path for:', { userRole, interests, from });

    // For non-learner users, use existing logic
    if (!isLearnerRole(userRole)) {
      console.log('🔍 Non-learner user, redirecting to dashboard');
      return from || '/dashboard';
    }

    // For learners (students and job seekers), check if they have any active enrollments
    try {
      console.log('🔍 Checking learner enrollments...');
      const enrollmentsResponse = await enrollmentService.getMyEnrollments({ limit: 10 });
      const activeEnrollments = enrollmentsResponse.enrollments.filter(
        enrollment => enrollment.isActive && enrollment.paymentStatus === 'completed'
      );

      console.log('🔍 Active enrollments found:', activeEnrollments.length);

      // If learner has active enrollments, redirect to the Unified Learning Page of the first course
      if (activeEnrollments.length > 0) {
        // Sort by lastAccessedAt to get the most recently accessed course, or use the first one
        const sortedEnrollments = activeEnrollments.sort((a, b) => {
          const aDate = a.progress?.lastAccessedAt || a.enrolledAt;
          const bDate = b.progress?.lastAccessedAt || b.enrolledAt;
          return new Date(bDate).getTime() - new Date(aDate).getTime();
        });

        const courseId = sortedEnrollments[0].course._id;
        const unifiedLearningPath = `/course/${courseId}/learn`;
        console.log('🔍 Redirecting to Unified Learning Page:', unifiedLearningPath);
        return unifiedLearningPath;
      }

      // If interests were provided, redirect to courses with interests
      if (interests) {
        const interestsParam = encodeURIComponent(JSON.stringify(interests));
        const coursesPath = `/dashboard/student/courses?tab=discover&interests=${interestsParam}`;
        console.log('🔍 Redirecting to courses with interests:', coursesPath);
        return coursesPath;
      }

      // Default redirect for learners without enrollments
      const defaultPath = from || '/dashboard/student/courses';
      console.log('🔍 Default redirect for learners:', defaultPath);
      return defaultPath;
    } catch (error) {
      console.warn('🔍 Error checking enrollments for redirect:', error);
      
      // Fallback to existing logic if enrollment check fails
      if (interests) {
        const interestsParam = encodeURIComponent(JSON.stringify(interests));
        const fallbackPath = `/dashboard/student/courses?tab=discover&interests=${interestsParam}`;
        console.log('🔍 Fallback redirect with interests:', fallbackPath);
        return fallbackPath;
      }
      
      const fallbackPath = from || '/dashboard/student/courses';
      console.log('🔍 Fallback redirect:', fallbackPath);
      return fallbackPath;
    }
  },

  /**
   * Gets the most recently accessed course hub for a student
   */
  getMostRecentCourseHub: async (): Promise<string | null> => {
    try {
      const enrollmentsResponse = await enrollmentService.getMyEnrollments({ limit: 10 });
      const activeEnrollments = enrollmentsResponse.enrollments.filter(
        enrollment => enrollment.isActive && enrollment.paymentStatus === 'completed'
      );

      if (activeEnrollments.length === 0) {
        return null;
      }

      // Sort by lastAccessedAt or enrolledAt to find the most recent
      const sortedEnrollments = activeEnrollments.sort((a, b) => {
        const aDate = a.progress?.lastAccessedAt || a.enrolledAt;
        const bDate = b.progress?.lastAccessedAt || b.enrolledAt;
        return new Date(bDate).getTime() - new Date(aDate).getTime();
      });

      return `/course/${sortedEnrollments[0].course._id}/learn`;
    } catch (error) {
      console.warn('Error getting most recent course hub:', error);
      return null;
    }
  },

  /**
   * Checks if a student should be redirected to a course hub instead of dashboard
   */
  shouldRedirectToCourseHub: async (): Promise<boolean> => {
    try {
      const enrollmentsResponse = await enrollmentService.getMyEnrollments({ limit: 1 });
      const activeEnrollments = enrollmentsResponse.enrollments.filter(
        enrollment => enrollment.isActive && enrollment.paymentStatus === 'completed'
      );
      
      return activeEnrollments.length > 0;
    } catch (error) {
      console.warn('Error checking if should redirect to course hub:', error);
      return false;
    }
  }
};
