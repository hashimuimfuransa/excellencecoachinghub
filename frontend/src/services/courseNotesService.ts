import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface CourseNoteSection {
  id: string;
  title: string;
  content: string;
  order: number;
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedReadTime: number;
  keyPoints: string[];
  attachments: Array<{
    filename: string;
    originalName: string;
    fileUrl: string;
    fileSize: number;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CourseNotes {
  _id: string;
  course: string;
  title: string;
  description: string;
  sections: CourseNoteSection[];
  totalSections: number;
  totalReadTime: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface NoteProgress {
  sectionId: string;
  isCompleted: boolean;
  readTime: number;
  completedAt?: Date;
  quizScore?: number;
}

class CourseNotesService {
  // Get course notes
  async getCourseNotes(courseId: string): Promise<any> {
    try {
      console.log('Making API call to:', `/course-notes/course/${courseId}`);
      const response = await api.get(`/course-notes/course/${courseId}`);
      console.log('API response status:', response.status);
      console.log('API response data:', response.data);
      
      // Transform the response to match expected format
      if (response.data.success && response.data.data && response.data.data.courseNotes) {
        const courseNotes = response.data.data.courseNotes;
        
        if (courseNotes.length === 0) {
          return null; // No notes available
        }
        
        // Flatten all sections from all course notes into a single array
        const allSections = courseNotes.flatMap((note: any) => 
          note.sections.map((section: any) => ({
            ...section,
            chapterTitle: note.title,
            chapter: note.chapter,
            noteId: note._id,
            progress: note.progress
          }))
        );
        
        return {
          sections: allSections,
          courseNotes: courseNotes,
          totalChapters: courseNotes.length
        };
      }
      
      return response.data;
    } catch (error: any) {
      console.error('API call failed:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      if (error.response?.status === 404) {
        return null; // No notes found
      }
      if (error.response?.status === 403) {
        throw new Error(error.response?.data?.error || 'You are not enrolled in this course or do not have permission to view these notes');
      }
      throw new Error(error.response?.data?.error || error.response?.data?.message || 'Failed to fetch course notes');
    }
  }

  // Create course notes (Teacher only)
  async createCourseNotes(courseId: string, notesData: any): Promise<any> {
    try {
      const response = await api.post('/course-notes', {
        ...notesData,
        courseId
      });
      return response.data;
    } catch (error: any) {
      console.error('Failed to create course notes:', error);
      throw new Error(error.response?.data?.error || error.response?.data?.message || 'Failed to create course notes');
    }
  }

  // Create course notes from materials (Teacher only)
  async createNotesFromMaterials(courseId: string, materialData: any): Promise<any> {
    try {
      const response = await api.post(`/course-notes/course/${courseId}/from-materials`, materialData);
      return response.data;
    } catch (error: any) {
      console.error('Failed to create notes from materials:', error);
      throw new Error(error.response?.data?.error || error.response?.data?.message || 'Failed to create notes from materials');
    }
  }

  // Get teacher's course notes
  async getTeacherCourseNotes(filters?: any): Promise<any> {
    try {
      const response = await api.get('/course-notes/teacher', { params: filters });
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch teacher course notes:', error);
      throw new Error(error.response?.data?.error || error.response?.data?.message || 'Failed to fetch course notes');
    }
  }

  // Update course notes (Teacher only)
  async updateCourseNotes(notesId: string, notesData: any): Promise<any> {
    try {
      const response = await api.put(`/course-notes/${notesId}`, notesData);
      return response.data;
    } catch (error: any) {
      console.error('Failed to update course notes:', error);
      throw new Error(error.response?.data?.error || error.response?.data?.message || 'Failed to update course notes');
    }
  }

  // Delete course notes (Teacher only)
  async deleteCourseNotes(notesId: string): Promise<void> {
    try {
      await api.delete(`/course-notes/${notesId}`);
    } catch (error: any) {
      console.error('Failed to delete course notes:', error);
      throw new Error(error.response?.data?.error || error.response?.data?.message || 'Failed to delete course notes');
    }
  }

  // Toggle publish status (Teacher only)
  async togglePublishCourseNotes(notesId: string): Promise<any> {
    try {
      const response = await api.patch(`/course-notes/${notesId}/publish`);
      return response.data;
    } catch (error: any) {
      console.error('Failed to toggle publish status:', error);
      throw new Error(error.response?.data?.error || error.response?.data?.message || 'Failed to toggle publish status');
    }
  }

  // Get notes by ID
  async getNotesById(notesId: string): Promise<CourseNotes> {
    try {
      const response = await api.get(`/course-notes/${notesId}`);
      if (response.data.success && response.data.data) {
        return response.data.data.courseNotes || response.data.data;
      }
      throw new Error('Course notes not found');
    } catch (error: any) {
      console.error('Failed to fetch notes:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch notes');
    }
  }

  // Get specific section
  async getNoteSection(notesId: string, sectionId: string): Promise<CourseNoteSection> {
    try {
      const response = await api.get(`/course-notes/${notesId}/sections/${sectionId}`);
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to fetch note section:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch note section');
    }
  }

  // Get reading progress
  async getReadingProgress(courseId: string): Promise<NoteProgress[]> {
    try {
      const response = await api.get(`/course-notes/course/${courseId}/progress`);
      return response.data.data || [];
    } catch (error: any) {
      console.error('Failed to fetch reading progress:', error);
      return [];
    }
  }

  // Update reading progress
  async updateReadingProgress(courseId: string, sectionId: string, readTime: number): Promise<NoteProgress> {
    try {
      const response = await api.post(`/course-notes/course/${courseId}/progress`, {
        sectionId,
        readTime
      });
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to update reading progress:', error);
      throw new Error(error.response?.data?.message || 'Failed to update reading progress');
    }
  }

  // Mark section as completed
  async markSectionCompleted(courseId: string, sectionId: string, readTime: number): Promise<NoteProgress> {
    try {
      const response = await api.post(`/course-notes/course/${courseId}/complete-section`, {
        sectionId,
        readTime
      });
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to mark section as completed:', error);
      throw new Error(error.response?.data?.message || 'Failed to mark section as completed');
    }
  }

  // Get section quiz score
  async updateQuizScore(courseId: string, sectionId: string, score: number): Promise<NoteProgress> {
    try {
      const response = await api.post(`/course-notes/course/${courseId}/quiz-score`, {
        sectionId,
        score
      });
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to update quiz score:', error);
      throw new Error(error.response?.data?.message || 'Failed to update quiz score');
    }
  }

  // Search within notes
  async searchNotes(courseId: string, query: string): Promise<any[]> {
    try {
      const response = await api.get(`/course-notes/course/${courseId}/search`, {
        params: { q: query }
      });
      return response.data.data || [];
    } catch (error: any) {
      console.error('Failed to search notes:', error);
      return [];
    }
  }

  // Get notes statistics
  async getNotesStats(courseId: string): Promise<any> {
    try {
      const response = await api.get(`/course-notes/course/${courseId}/stats`);
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to fetch notes statistics:', error);
      return {
        totalSections: 0,
        completedSections: 0,
        totalReadTime: 0,
        averageReadTime: 0
      };
    }
  }

  // Download note attachment
  async downloadAttachment(fileUrl: string): Promise<Blob> {
    try {
      const response = await api.get(fileUrl, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error: any) {
      console.error('Failed to download attachment:', error);
      throw new Error(error.response?.data?.message || 'Failed to download attachment');
    }
  }

  // Get recommended sections based on progress
  async getRecommendedSections(courseId: string): Promise<CourseNoteSection[]> {
    try {
      const response = await api.get(`/course-notes/course/${courseId}/recommended`);
      return response.data.data || [];
    } catch (error: any) {
      console.error('Failed to fetch recommended sections:', error);
      return [];
    }
  }

  // Get section highlights/bookmarks
  async getSectionHighlights(courseId: string, sectionId: string): Promise<any[]> {
    try {
      const response = await api.get(`/course-notes/course/${courseId}/sections/${sectionId}/highlights`);
      return response.data.data || [];
    } catch (error: any) {
      console.error('Failed to fetch section highlights:', error);
      return [];
    }
  }

  // Add section highlight/bookmark
  async addSectionHighlight(courseId: string, sectionId: string, highlight: any): Promise<any> {
    try {
      const response = await api.post(`/course-notes/course/${courseId}/sections/${sectionId}/highlights`, highlight);
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to add section highlight:', error);
      throw new Error(error.response?.data?.message || 'Failed to add highlight');
    }
  }

  // Remove section highlight/bookmark
  async removeSectionHighlight(courseId: string, sectionId: string, highlightId: string): Promise<void> {
    try {
      await api.delete(`/course-notes/course/${courseId}/sections/${sectionId}/highlights/${highlightId}`);
    } catch (error: any) {
      console.error('Failed to remove section highlight:', error);
      throw new Error(error.response?.data?.message || 'Failed to remove highlight');
    }
  }

  // Get reading analytics
  async getReadingAnalytics(courseId: string): Promise<any> {
    try {
      const response = await api.get(`/course-notes/course/${courseId}/analytics`);
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to fetch reading analytics:', error);
      return {
        totalTimeSpent: 0,
        averageSessionTime: 0,
        completionRate: 0,
        readingStreak: 0
      };
    }
  }

  // Export notes as PDF
  async exportNotesAsPDF(courseId: string): Promise<Blob> {
    try {
      const response = await api.get(`/course-notes/course/${courseId}/export/pdf`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error: any) {
      console.error('Failed to export notes as PDF:', error);
      throw new Error(error.response?.data?.message || 'Failed to export notes');
    }
  }

  // Get offline notes for mobile app
  async getOfflineNotes(courseId: string): Promise<CourseNotes> {
    try {
      const response = await api.get(`/course-notes/course/${courseId}/offline`);
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to fetch offline notes:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch offline notes');
    }
  }
}

export const courseNotesService = new CourseNotesService();
export default courseNotesService;