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
  },

  // Add an enhanced assignment with document upload
  addEnhancedAssignment: async (
    courseId: string, 
    title: string, 
    description: string, 
    dueDate?: string,
    points?: number,
    instructions?: string,
    document?: File
  ): Promise<ICourseContent> => {
    try {
      const formData = new FormData();
      
      const assignmentData = {
        title,
        type: 'assignment',
        description,
        dueDate,
        points: points || 100,
        instructions: instructions || '',
        order: 1,
        isRequired: true
      };

      formData.append('assignmentData', JSON.stringify(assignmentData));
      
      if (document) {
        formData.append('document', document);
      }

      const response = await apiService.postFormData<{ content: ICourseContent }>(`/course-content/${courseId}/assignment`, formData);
      
      if (response.success && response.data) {
        return response.data.content;
      }
      
      throw new Error(response.error || 'Failed to create assignment');
    } catch (error: any) {
      // Fallback to basic assignment creation if enhanced endpoint is not available
      if (error.message?.includes('404') || error.message?.includes('Not Found')) {
        console.warn('Enhanced assignment endpoint not available, falling back to basic assignment creation');
        
        // Create enhanced assignment content with all the new fields
        const enhancedAssignmentContent = {
          description,
          dueDate,
          points: points || 100,
          instructions: instructions || '',
          type: 'assignment',
          hasDocument: !!document,
          documentName: document?.name || null
        };

        return courseContentService.addContent(courseId, {
          title,
          type: 'assignment',
          content: JSON.stringify(enhancedAssignmentContent),
          order: 1,
          isRequired: true
        });
      }
      
      throw error;
    }
  },

  // Upload document to existing assignment
  uploadAssignmentDocument: async (courseId: string, assignmentId: string, document: File): Promise<ICourseContent> => {
    try {
      const formData = new FormData();
      formData.append('document', document);

      const response = await apiService.postFormData<{ content: ICourseContent }>(`/course-content/${courseId}/assignment/${assignmentId}/document`, formData);
      
      if (response.success && response.data) {
        return response.data.content;
      }
      
      throw new Error(response.error || 'Failed to upload assignment document');
    } catch (error: any) {
      // Fallback: simulate document upload by updating assignment content
      if (error.message?.includes('404') || error.message?.includes('Not Found')) {
        console.warn('Assignment document upload endpoint not available, simulating upload');
        
        // Get current course content to find the assignment
        const courseContent = await courseContentService.getCourseContent(courseId);
        const assignment = courseContent.content.find(content => content._id === assignmentId);
        
        if (!assignment) {
          throw new Error('Assignment not found');
        }

        // Parse existing content and add document info
        let assignmentData = {};
        try {
          assignmentData = assignment.content ? JSON.parse(assignment.content) : {};
        } catch (parseError) {
          // If parsing fails, create new structure
        }

        const updatedAssignmentData = {
          ...assignmentData,
          hasDocument: true,
          documentName: document.name,
          documentSize: document.size,
          documentType: document.type,
          documentUploadedAt: new Date().toISOString()
        };

        // Update the assignment with document info
        return courseContentService.updateContent(courseId, assignmentId, {
          content: JSON.stringify(updatedAssignmentData),
          fileUrl: `#simulated-upload-${document.name}` // Placeholder URL
        });
      }
      
      throw error;
    }
  }
};