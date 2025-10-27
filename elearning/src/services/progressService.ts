import { apiService } from './api';

export interface IProgressData {
  progress: number;
  completedLessons: string[];
  isCompleted: boolean;
  totalPoints: number;
}

export interface IUserProgress {
  _id: string;
  user: string;
  course: {
    _id: string;
    title: string;
    thumbnail?: string;
  };
  completedLessons: string[];
  completedQuizzes: string[];
  totalTimeSpent: number;
  progressPercentage: number;
  lastAccessed: Date;
  badges: any[];
  totalPoints: number;
  streakDays: number;
  lastActivityDate: Date;
  enrollmentDate: Date;
  completionDate?: Date;
  isCompleted: boolean;
  certificateIssued: boolean;
  certificateUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserStats {
  totalCourses: number;
  completedCourses: number;
  totalPoints: number;
  totalTimeSpent: number;
  averageProgress: number;
  maxStreak: number;
}

export const progressService = {
  // Mark content as completed
  markContentCompleted: async (courseId: string, contentId: string): Promise<IProgressData> => {
    const response = await apiService.post<IProgressData>(`/progress/courses/${courseId}/content/${contentId}/complete`);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.error || 'Failed to mark content as completed');
  },

  // Remove content completion (undo)
  removeContentCompletion: async (courseId: string, contentId: string): Promise<IProgressData> => {
    const response = await apiService.delete<IProgressData>(`/progress/courses/${courseId}/content/${contentId}/complete`);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.error || 'Failed to remove content completion');
  },

  // Get progress for a specific course
  getCourseProgress: async (courseId: string): Promise<IUserProgress> => {
    const response = await apiService.get<IUserProgress>(`/progress/courses/${courseId}/progress`);
    
    if (response.success && response.data) {
      return {
        ...response.data,
        lastAccessed: new Date(response.data.lastAccessed),
        lastActivityDate: new Date(response.data.lastActivityDate),
        enrollmentDate: new Date(response.data.enrollmentDate),
        completionDate: response.data.completionDate ? new Date(response.data.completionDate) : undefined,
        createdAt: new Date(response.data.createdAt),
        updatedAt: new Date(response.data.updatedAt)
      };
    }
    
    throw new Error(response.error || 'Failed to get course progress');
  },

  // Get all user progress
  getUserProgress: async (): Promise<IUserProgress[]> => {
    const response = await apiService.get<IUserProgress[]>('/progress/my-progress');
    
    if (response.success && response.data) {
      return response.data.map(progress => ({
        ...progress,
        lastAccessed: new Date(progress.lastAccessed),
        lastActivityDate: new Date(progress.lastActivityDate),
        enrollmentDate: new Date(progress.enrollmentDate),
        completionDate: progress.completionDate ? new Date(progress.completionDate) : undefined,
        createdAt: new Date(progress.createdAt),
        updatedAt: new Date(progress.updatedAt)
      }));
    }
    
    throw new Error(response.error || 'Failed to get user progress');
  },

  // Get user statistics
  getUserStats: async (): Promise<IUserStats> => {
    const response = await apiService.get<IUserStats>('/progress/my-stats');
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.error || 'Failed to get user statistics');
  },

  // Get progress quietly (without throwing errors)
  getCourseProgressQuietly: async (courseId: string): Promise<IUserProgress | null> => {
    try {
      return await progressService.getCourseProgress(courseId);
    } catch (error) {
      console.warn('Failed to get course progress:', error);
      return null;
    }
  },

  // Check if section is completed
  isSectionCompleted: async (courseId: string, sectionId: string): Promise<boolean> => {
    try {
      const progress = await progressService.getCourseProgress(courseId);
      return progress?.completedLessons?.includes(sectionId) || false;
    } catch (error) {
      console.warn('Failed to check section completion:', error);
      return false;
    }
  },

  // Mark section as completed
  markSectionCompleted: async (courseId: string, sectionId: string, readTime?: number): Promise<IProgressData> => {
    try {
      // Use the existing markContentCompleted method
      return await progressService.markContentCompleted(courseId, sectionId);
    } catch (error: any) {
      console.error('Failed to mark section as completed:', error);
      throw new Error(error.message || 'Failed to mark section as completed');
    }
  },

  // Update reading progress
  updateReadingProgress: async (sectionId: string, isCompleted: boolean): Promise<void> => {
    try {
      // For now, we'll use a simple approach - you can enhance this later
      console.log(`Updating reading progress for section ${sectionId}: ${isCompleted ? 'completed' : 'in progress'}`);
      // This could be enhanced to call a specific API endpoint for reading progress
    } catch (error: any) {
      console.error('Failed to update reading progress:', error);
      throw new Error(error.message || 'Failed to update reading progress');
    }
  }
};
