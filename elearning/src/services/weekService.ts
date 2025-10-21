import api from './api';

export interface WeekMaterial {
  _id: string;
  title: string;
  description: string;
  type: 'document' | 'video' | 'audio' | 'link' | 'quiz' | 'structured_notes' | 'exam';
  url?: string;
  filePath?: string;
  order: number;
  estimatedDuration: number;
  isRequired: boolean;
  isPublished: boolean;
  // Exam-specific fields
  examType?: 'quiz' | 'general_exam';
  examSettings?: {
    timeLimit?: number; // in minutes
    totalMarks?: number;
    passingScore?: number;
    attempts?: number;
    instructions?: string;
    isTimed?: boolean;
    allowReview?: boolean;
  };
  content?: {
    extractedText?: string;
    structuredNotes?: {
      title: string;
      summary: string;
      keyPoints: string[];
      sections: {
        title: string;
        content: string;
        keyPoints: string[];
        order: number;
      }[];
      metadata: {
        totalSections: number;
        estimatedReadingTime: number;
        difficulty: 'beginner' | 'intermediate' | 'advanced';
        topics: string[];
      };
    };
    // Exam-specific content
    examContent?: {
      questions?: Array<{
        id: string;
        type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay';
        question: string;
        options?: string[];
        correctAnswer?: string;
        points: number;
        order: number;
      }>;
      totalQuestions?: number;
      examStructure?: {
        sections: Array<{
          title: string;
          questionCount: number;
          points: number;
          order: number;
        }>;
      };
    };
    originalFileName?: string;
    fileSize?: number;
    mimeType?: string;
    processedAt?: string;
    processingTime?: number;
  };
}

export interface Week {
  _id: string;
  courseId: string;
  title: string;
  description: string;
  weekNumber: number;
  startDate: string;
  endDate: string;
  materials: WeekMaterial[];
  assessment?: {
    _id: string;
    title: string;
    description: string;
    points: number;
  };
  assignment?: {
    _id: string;
    title: string;
    description: string;
    points: number;
  };
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StudentProgress {
  _id: string;
  studentId: string;
  courseId: string;
  weekId: string;
  materialId: string;
  completedAt: string;
  timeSpent: number;
  score?: number;
  status: 'not_started' | 'in_progress' | 'completed' | 'failed';
}

export interface WeekProgress {
  _id: string;
  studentId: string;
  courseId: string;
  weekId: string;
  materialsCompleted: number;
  totalMaterials: number;
  assessmentCompleted: boolean;
  assignmentCompleted: boolean;
  weekCompleted: boolean;
  completedAt?: string;
  progressPercentage: number;
}

class WeekService {
  // Get all weeks for a course
  async getCourseWeeks(courseId: string): Promise<Week[]> {
    const response = await api.get(`/weeks/courses/${courseId}/weeks`);
    return response.data.data;
  }

  // Get a specific week
  async getWeek(weekId: string): Promise<Week> {
    const response = await api.get(`/weeks/weeks/${weekId}`);
    return response.data.data;
  }

  // Create a new week
  async createWeek(courseId: string, weekData: Partial<Week>): Promise<Week> {
    const response = await api.post(`/weeks/courses/${courseId}/weeks`, weekData);
    return response.data.data;
  }

  // Update a week
  async updateWeek(weekId: string, weekData: Partial<Week>): Promise<Week> {
    const response = await api.put(`/weeks/weeks/${weekId}`, weekData);
    return response.data.data;
  }

  // Delete a week
  async deleteWeek(weekId: string): Promise<void> {
    await api.delete(`/weeks/weeks/${weekId}`);
  }

  // Add material to a week
  async addWeekMaterial(weekId: string, materialData: Partial<WeekMaterial>): Promise<WeekMaterial> {
    const response = await api.post(`/weeks/weeks/${weekId}/materials`, materialData);
    return response.data.data;
  }

  // Update week material
  async updateWeekMaterial(weekId: string, materialId: string, materialData: Partial<WeekMaterial>): Promise<WeekMaterial> {
    const response = await api.put(`/weeks/weeks/${weekId}/materials/${materialId}`, materialData);
    return response.data.data;
  }

  // Delete week material
  async deleteWeekMaterial(weekId: string, materialId: string): Promise<void> {
    await api.delete(`/weeks/weeks/${weekId}/materials/${materialId}`);
  }

  // Publish/Unpublish a week
  async toggleWeekPublish(weekId: string, isPublished: boolean): Promise<Week> {
    const response = await api.put(`/weeks/weeks/${weekId}/publish`, { isPublished });
    return response.data.data;
  }
}

class ProgressService {
  // Mark material as completed
  async markMaterialCompleted(weekId: string, materialId: string, timeSpent?: number, score?: number): Promise<StudentProgress> {
    const response = await api.post(`/progress/weeks/${weekId}/materials/${materialId}/complete`, {
      timeSpent,
      score
    });
    return response.data.data;
  }

  // Get student progress for a course
  async getStudentCourseProgress(courseId: string): Promise<{
    weekProgresses: WeekProgress[];
    materialProgresses: StudentProgress[];
  }> {
    const response = await api.get(`/progress/courses/${courseId}/progress`);
    return response.data.data;
  }

  // Get student progress for a specific week
  async getStudentWeekProgress(weekId: string): Promise<{
    weekProgress: WeekProgress;
    materialProgresses: StudentProgress[];
    week: Week;
  }> {
    const response = await api.get(`/progress/weeks/${weekId}/progress`);
    return response.data.data;
  }

  // Mark assessment as completed
  async markAssessmentCompleted(weekId: string, score: number): Promise<WeekProgress> {
    const response = await api.post(`/progress/weeks/${weekId}/assessment/complete`, { score });
    return response.data.data;
  }

  // Mark assignment as completed
  async markAssignmentCompleted(weekId: string): Promise<WeekProgress> {
    const response = await api.post(`/progress/weeks/${weekId}/assignment/complete`);
    return response.data.data;
  }
}

export const weekService = new WeekService();
export const progressService = new ProgressService();
