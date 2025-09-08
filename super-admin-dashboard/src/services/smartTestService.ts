import { apiGet, apiPost, apiPut, apiDelete, handleApiResponse } from './api';

export interface SmartTest {
  _id: string;
  testId: string;
  title: string;
  description: string;
  jobTitle?: string;
  company?: string;
  industry?: string;
  difficulty: 'basic' | 'intermediate' | 'advanced';
  questionCount: number;
  timeLimit?: number;
  questions: Question[];
  isActive: boolean;
  isPublished?: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
  totalAttempts?: number;
  averageScore?: number;
  passRate?: number;
}

export interface Question {
  _id: string;
  question: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer' | 'coding';
  options?: string[];
  correctAnswer: string | string[];
  points?: number;
  difficulty?: string;
}

export interface SmartTestFormData {
  title: string;
  description: string;
  jobTitle?: string;
  company?: string;
  industry?: string;
  difficulty: 'basic' | 'intermediate' | 'advanced';
  timeLimit?: number;
  isActive: boolean;
}

export interface SmartTestStats {
  totalTests: number;
  activeTests: number;
  totalAttempts: number;
  averageScore: number;
}

class SmartTestService {
  private baseUrl = '/smart-tests/admin';

  /**
   * Get all smart tests for admin management
   */
  async getAllTests(): Promise<SmartTest[]> {
    try {
      const response = await apiGet<{data: SmartTest[]}>(`${this.baseUrl}/manage`);
      return handleApiResponse(response) || [];
    } catch (error) {
      console.error('Failed to fetch smart tests:', error);
      throw error;
    }
  }

  /**
   * Create a new smart test
   */
  async createTest(testData: SmartTestFormData): Promise<SmartTest> {
    try {
      const response = await apiPost<{data: SmartTest}>(`${this.baseUrl}/create`, testData);
      return handleApiResponse(response);
    } catch (error) {
      console.error('Failed to create smart test:', error);
      throw error;
    }
  }

  /**
   * Update an existing smart test
   */
  async updateTest(testId: string, testData: SmartTestFormData): Promise<SmartTest> {
    try {
      const response = await apiPut<{data: SmartTest}>(`${this.baseUrl}/${testId}`, testData);
      return handleApiResponse(response);
    } catch (error) {
      console.error('Failed to update smart test:', error);
      throw error;
    }
  }

  /**
   * Delete a smart test
   */
  async deleteTest(testId: string): Promise<void> {
    try {
      await apiDelete(`${this.baseUrl}/${testId}`);
    } catch (error) {
      console.error('Failed to delete smart test:', error);
      throw error;
    }
  }

  /**
   * Toggle test status (active/inactive)
   */
  async toggleTestStatus(testId: string, isActive: boolean): Promise<void> {
    try {
      await apiPut(`${this.baseUrl}/${testId}/status`, { isActive });
    } catch (error) {
      console.error('Failed to toggle test status:', error);
      throw error;
    }
  }

  /**
   * Upload test file with optional metadata
   */
  async uploadTestFile(file: File, metadata?: {
    title?: string;
    description?: string;
    jobTitle?: string;
    company?: string;
    industry?: string;
    timeLimit?: number;
    difficulty?: string;
    skillsRequired?: string[];
  }): Promise<SmartTest> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      // Add optional metadata
      if (metadata) {
        if (metadata.title) formData.append('title', metadata.title);
        if (metadata.description) formData.append('description', metadata.description);
        if (metadata.jobTitle) formData.append('jobTitle', metadata.jobTitle);
        if (metadata.company) formData.append('company', metadata.company);
        if (metadata.industry) formData.append('industry', metadata.industry);
        if (metadata.timeLimit) formData.append('timeLimit', metadata.timeLimit.toString());
        if (metadata.difficulty) formData.append('difficulty', metadata.difficulty);
        if (metadata.skillsRequired) formData.append('skillsRequired', metadata.skillsRequired.join(','));
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/smart-tests/admin/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || 'Upload failed');
      }

      const result = await response.json();
      return handleApiResponse(result);
    } catch (error) {
      console.error('Failed to upload test file:', error);
      throw error;
    }
  }

  /**
   * Get test statistics
   */
  async getTestStats(tests: SmartTest[]): Promise<SmartTestStats> {
    const totalTests = tests.length;
    const activeTests = tests.filter(test => test.isActive).length;
    const totalAttempts = tests.reduce((sum, test) => sum + (test.totalAttempts || 0), 0);
    const averageScore = totalTests > 0 
      ? tests.reduce((sum, test) => sum + (test.averageScore || 0), 0) / totalTests
      : 0;

    return {
      totalTests,
      activeTests,
      totalAttempts,
      averageScore
    };
  }

  /**
   * Get test by ID
   */
  async getTestById(testId: string): Promise<SmartTest> {
    try {
      const response = await apiGet<{data: SmartTest}>(`/smart-tests/${testId}`);
      return handleApiResponse(response);
    } catch (error) {
      console.error('Failed to fetch test details:', error);
      throw error;
    }
  }

  /**
   * Get test results for a specific test
   */
  async getTestResults(testId: string): Promise<any[]> {
    try {
      const response = await apiGet<{data: any[]}>(`${this.baseUrl}/${testId}/results`);
      return handleApiResponse(response) || [];
    } catch (error) {
      console.error('Failed to fetch test results:', error);
      throw error;
    }
  }

  /**
   * Upload test content (questions) to existing test
   */
  async uploadTestContent(testId: string, file: File): Promise<SmartTest> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/smart-tests/admin/${testId}/upload-content`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || 'Content upload failed');
      }

      const result = await response.json();
      return handleApiResponse(result);
    } catch (error) {
      console.error('Failed to upload test content:', error);
      throw error;
    }
  }

  /**
   * Extract questions from test using AI (get random 20 questions)
   */
  async extractQuestionsFromTest(testId: string, questionCount: number = 20): Promise<any> {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/smart-tests/admin/${testId}/extract-questions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ questionCount, randomize: true })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || 'Failed to extract questions');
      }

      const result = await response.json();
      return handleApiResponse(result);
    } catch (error) {
      console.error('Failed to extract questions:', error);
      throw error;
    }
  }

  /**
   * Start admin test session with extracted questions
   */
  async startAdminTest(testId: string, questionCount: number = 20): Promise<any> {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/smart-tests/admin/${testId}/start-admin-test`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ questionCount, randomize: true })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || 'Failed to start admin test');
      }

      const result = await response.json();
      return handleApiResponse(result);
    } catch (error) {
      console.error('Failed to start admin test:', error);
      throw error;
    }
  }

  /**
   * Toggle publish status of a test
   */
  async togglePublishStatus(testId: string, isPublished: boolean): Promise<void> {
    try {
      await apiPut(`${this.baseUrl}/${testId}/publish`, { isPublished });
    } catch (error) {
      console.error('Failed to toggle publish status:', error);
      throw error;
    }
  }

  /**
   * Batch operations for multiple tests
   */
  async batchUpdateStatus(testIds: string[], isActive: boolean): Promise<void> {
    try {
      await apiPut(`${this.baseUrl}/batch/status`, { testIds, isActive });
    } catch (error) {
      console.error('Failed to batch update test status:', error);
      throw error;
    }
  }

  async batchDelete(testIds: string[]): Promise<void> {
    try {
      await apiDelete(`${this.baseUrl}/batch/delete`, { data: { testIds } });
    } catch (error) {
      console.error('Failed to batch delete tests:', error);
      throw error;
    }
  }

  /**
   * Validate test data before submission
   */
  validateTestData(testData: SmartTestFormData): string[] {
    const errors: string[] = [];

    if (!testData.title.trim()) {
      errors.push('Test title is required');
    }

    if (!testData.description.trim()) {
      errors.push('Test description is required');
    }

    if (testData.timeLimit && testData.timeLimit < 1) {
      errors.push('Time limit must be at least 1 minute');
    }

    if (!['basic', 'intermediate', 'advanced'].includes(testData.difficulty)) {
      errors.push('Invalid difficulty level');
    }

    return errors;
  }

  /**
   * Format test data for display
   */
  formatTestForDisplay(test: SmartTest): any {
    return {
      ...test,
      difficultyLabel: test.difficulty.charAt(0).toUpperCase() + test.difficulty.slice(1),
      createdAtFormatted: new Date(test.createdAt).toLocaleDateString(),
      updatedAtFormatted: new Date(test.updatedAt).toLocaleDateString(),
      statusLabel: test.isActive ? 'Active' : 'Inactive',
      performanceText: `${test.totalAttempts || 0} attempts • ${(test.averageScore || 0).toFixed(1)}% avg`
    };
  }
}

const smartTestService = new SmartTestService();
export { SmartTest, SmartTestFormData, SmartTestStats, Question, smartTestService };
export default smartTestService;