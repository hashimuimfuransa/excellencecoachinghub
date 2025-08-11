import { apiService } from './api';

export interface ICourseContent {
  _id?: string;
  title: string;
  type: 'video' | 'document' | 'quiz' | 'assignment' | 'live_session';
  content?: string;
  fileUrl?: string;
  videoUrl?: string;
  duration?: number;
  order: number;
  isRequired: boolean;
  liveSessionId?: string; // Reference to live session for recorded sessions
  createdAt?: string;
  updatedAt?: string;
}

export interface CourseContentResponse {
  content: ICourseContent[];
  courseTitle: string;
  instructor: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export const courseContentService = {
  // Add course content
  addContent: async (courseId: string, contentData: Omit<ICourseContent, '_id' | 'createdAt' | 'updatedAt'>): Promise<ICourseContent> => {
    const response = await apiService.post<{ content: ICourseContent }>(`/course-content/${courseId}/content`, contentData);
    
    if (response.success && response.data) {
      return response.data.content;
    }
    
    throw new Error(response.error || 'Failed to add course content');
  },

  // Get course content
  getCourseContent: async (courseId: string): Promise<CourseContentResponse> => {
    const response = await apiService.get<CourseContentResponse>(`/course-content/${courseId}/content`);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.error || 'Failed to fetch course content');
  },

  // Update course content
  updateContent: async (courseId: string, contentId: string, contentData: Partial<ICourseContent>): Promise<ICourseContent> => {
    const response = await apiService.put<{ content: ICourseContent }>(`/course-content/${courseId}/content/${contentId}`, contentData);
    
    if (response.success && response.data) {
      return response.data.content;
    }
    
    throw new Error(response.error || 'Failed to update course content');
  },

  // Delete course content
  deleteContent: async (courseId: string, contentId: string): Promise<void> => {
    const response = await apiService.delete(`/course-content/${courseId}/content/${contentId}`);
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to delete course content');
    }
  },

  // Reorder course content
  reorderContent: async (courseId: string, contentOrder: string[]): Promise<ICourseContent[]> => {
    const response = await apiService.put<{ content: ICourseContent[] }>(`/course-content/${courseId}/content/reorder`, {
      contentOrder
    });
    
    if (response.success && response.data) {
      return response.data.content;
    }
    
    throw new Error(response.error || 'Failed to reorder course content');
  },

  // Add a note (convenience method)
  addNote: async (courseId: string, title: string, content: string): Promise<ICourseContent> => {
    return courseContentService.addContent(courseId, {
      title,
      type: 'document',
      content,
      order: 1,
      isRequired: false
    });
  },

  // Add an assignment (convenience method)
  addAssignment: async (courseId: string, title: string, description: string, dueDate?: string): Promise<ICourseContent> => {
    const assignmentContent = {
      description,
      dueDate,
      type: 'assignment'
    };

    return courseContentService.addContent(courseId, {
      title,
      type: 'assignment',
      content: JSON.stringify(assignmentContent),
      order: 1,
      isRequired: true
    });
  }
};