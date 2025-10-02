import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

interface AIGradeResult {
  score: number;
  feedback: string;
  confidence: number;
  breakdown?: Array<{
    criteria: string;
    score: number;
    feedback: string;
  }>;
  suggestions?: string[];
  gradedAt: Date;
}

interface AssessmentGradeResult extends Omit<AIGradeResult, 'breakdown'> {
  breakdown: Array<{
    questionId: string;
    score: number;
    feedback: string;
    isCorrect: boolean;
  }>;
}

interface QuestionGradeResult {
  isCorrect: boolean;
  score: number;
  feedback: string;
  explanation?: string;
}

interface TextFeedbackResult {
  score: number;
  feedback: string;
  suggestions: string[];
  strengths: string[];
  improvements: string[];
}

interface MathGradeResult {
  isCorrect: boolean;
  score: number;
  feedback: string;
  steps: string[];
}

interface CodeGradeResult {
  score: number;
  feedback: string;
  testResults: {
    passed: number;
    total: number;
    details: Array<{
      test: string;
      passed: boolean;
      expected: any;
      actual: any;
    }>;
  };
  codeQuality: {
    score: number;
    issues: string[];
    suggestions: string[];
  };
}

interface PlagiarismResult {
  plagiarismScore: number;
  matches: Array<{
    source: string;
    similarity: number;
    matchedText: string;
  }>;
  isOriginal: boolean;
}

interface RubricResult {
  rubric: string;
  criteria: Array<{
    name: string;
    description: string;
    points: number;
    levels: Array<{
      level: string;
      description: string;
      points: number;
    }>;
  }>;
}

class AIGradingService {
  // Grade assessment automatically
  async gradeAssessment(data: {
    assessmentId: string;
    answers: Array<{
      questionId: string;
      answer: string;
    }>;
    questions: Array<{
      _id: string;
      question: string;
      correctAnswer?: string;
      points: number;
      type: string;
    }>;
  }): Promise<AssessmentGradeResult> {
    try {
      const response = await api.post('/ai/grade-assessment', data);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to grade assessment');
    }
  }

  // Grade assignment text/essay
  async gradeAssignment(data: {
    assignmentId: string;
    submissionText: string;
    rubric?: string;
    maxPoints: number;
    instructions?: string;
  }): Promise<AIGradeResult> {
    try {
      const response = await api.post('/ai/grade-assignment', data);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to grade assignment');
    }
  }

  // Grade individual question
  async gradeQuestion(data: {
    question: {
      question: string;
      correctAnswer?: string;
      points: number;
      type: string;
      explanation?: string;
    };
    answer: string;
  }): Promise<QuestionGradeResult> {
    try {
      const response = await api.post('/ai/grade-question', data);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to grade question');
    }
  }

  // Get AI feedback for text
  async getTextFeedback(data: {
    text: string;
    rubric?: string;
    maxPoints?: number;
  }): Promise<TextFeedbackResult> {
    try {
      const response = await api.post('/ai/text-feedback', data);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to get text feedback');
    }
  }

  // Grade math expressions
  async gradeMathExpression(data: {
    expression: string;
    correctAnswer: string;
    tolerance?: number;
  }): Promise<MathGradeResult> {
    try {
      const response = await api.post('/ai/grade-math', data);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to grade math expression');
    }
  }

  // Grade code submissions
  async gradeCode(data: {
    code: string;
    language: string;
    expectedOutput?: string;
    testCases?: Array<{
      input: any;
      expectedOutput: any;
      description: string;
    }>;
  }): Promise<CodeGradeResult> {
    try {
      const response = await api.post('/ai/grade-code', data);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to grade code');
    }
  }

  // Detect plagiarism in text
  async detectPlagiarism(data: {
    text: string;
    courseId?: string;
  }): Promise<PlagiarismResult> {
    try {
      const response = await api.post('/ai/detect-plagiarism', data);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to detect plagiarism');
    }
  }

  // Generate rubric for assignment
  async generateRubric(data: {
    title: string;
    description: string;
    instructions?: string;
    maxPoints: number;
  }): Promise<RubricResult> {
    try {
      const response = await api.post('/ai/generate-rubric', data);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to generate rubric');
    }
  }

  // Check AI service status
  async getServiceStatus(): Promise<{
    available: boolean;
    service: string;
    features: string[];
  }> {
    try {
      const response = await api.get('/ai/status');
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to check AI service status');
    }
  }

  // Batch grade multiple submissions
  async batchGradeSubmissions(data: {
    submissions: Array<{
      submissionId: string;
      submissionText: string;
      assignmentId: string;
    }>;
    rubric?: string;
    maxPoints: number;
  }): Promise<Array<{
    submissionId: string;
    result: AIGradeResult;
  }>> {
    try {
      const results = [];
      
      for (const submission of data.submissions) {
        try {
          const result = await this.gradeAssignment({
            assignmentId: submission.assignmentId,
            submissionText: submission.submissionText,
            rubric: data.rubric,
            maxPoints: data.maxPoints
          });
          
          results.push({
            submissionId: submission.submissionId,
            result
          });
        } catch (error) {
          console.error(`Failed to grade submission ${submission.submissionId}:`, error);
          // Continue with other submissions
        }
      }
      
      return results;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to batch grade submissions');
    }
  }

  // Get grading analytics
  async getGradingAnalytics(courseId: string): Promise<{
    totalGraded: number;
    averageScore: number;
    averageConfidence: number;
    gradingTrends: Array<{
      date: string;
      count: number;
      averageScore: number;
    }>;
    commonFeedback: string[];
  }> {
    try {
      const response = await api.get(`/ai/grading-analytics/${courseId}`);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to get grading analytics');
    }
  }

  // Validate answer format for different question types
  validateAnswerFormat(questionType: string, answer: string): {
    isValid: boolean;
    error?: string;
    formattedAnswer?: string;
  } {
    switch (questionType.toLowerCase()) {
      case 'math':
      case 'mathematical':
        // Basic math expression validation
        const mathPattern = /^[0-9+\-*/().\s=<>≤≥√∞π]+$/;
        if (!mathPattern.test(answer)) {
          return {
            isValid: false,
            error: 'Answer contains invalid mathematical characters'
          };
        }
        return {
          isValid: true,
          formattedAnswer: answer.trim()
        };

      case 'code':
      case 'programming':
        // Basic code validation
        if (answer.trim().length < 10) {
          return {
            isValid: false,
            error: 'Code answer seems too short'
          };
        }
        return {
          isValid: true,
          formattedAnswer: answer.trim()
        };

      case 'essay':
      case 'text':
        // Text validation
        if (answer.trim().length < 50) {
          return {
            isValid: false,
            error: 'Essay answer should be at least 50 characters long'
          };
        }
        return {
          isValid: true,
          formattedAnswer: answer.trim()
        };

      case 'multiple_choice':
      case 'true_false':
        // Choice validation
        if (!answer.trim()) {
          return {
            isValid: false,
            error: 'Please select an answer'
          };
        }
        return {
          isValid: true,
          formattedAnswer: answer.trim()
        };

      default:
        return {
          isValid: true,
          formattedAnswer: answer.trim()
        };
    }
  }

  // Format score for display
  formatScore(score: number, maxPoints: number = 100): string {
    const percentage = Math.round((score / maxPoints) * 100);
    return `${percentage}% (${score}/${maxPoints})`;
  }

  // Get confidence level description
  getConfidenceDescription(confidence: number): string {
    if (confidence >= 0.9) return 'Very High';
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.7) return 'Moderate';
    if (confidence >= 0.6) return 'Low';
    return 'Very Low';
  }

  // Get grade letter from percentage
  getGradeLetter(percentage: number): string {
    if (percentage >= 97) return 'A+';
    if (percentage >= 93) return 'A';
    if (percentage >= 90) return 'A-';
    if (percentage >= 87) return 'B+';
    if (percentage >= 83) return 'B';
    if (percentage >= 80) return 'B-';
    if (percentage >= 77) return 'C+';
    if (percentage >= 73) return 'C';
    if (percentage >= 70) return 'C-';
    if (percentage >= 67) return 'D+';
    if (percentage >= 63) return 'D';
    if (percentage >= 60) return 'D-';
    return 'F';
  }
}

export const aiGradingService = new AIGradingService();
export default aiGradingService;