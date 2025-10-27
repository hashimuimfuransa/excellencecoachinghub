import { ExamQuestion } from './examExtractionService';

export class ExamValidationService {
  private static instance: ExamValidationService;

  private constructor() {}

  public static getInstance(): ExamValidationService {
    if (!ExamValidationService.instance) {
      ExamValidationService.instance = new ExamValidationService();
    }
    return ExamValidationService.instance;
  }

  /**
   * Validate and clean extracted questions
   */
  validateQuestions(questions: any[], title: string): ExamQuestion[] {
    console.log(`🔍 Validating ${questions.length} extracted questions...`);
    
    const validatedQuestions: ExamQuestion[] = [];
    let validCount = 0;

    questions.forEach((q, index) => {
      try {
        const validated = this.validateSingleQuestion(q, index + 1, title);
        if (validated) {
          validatedQuestions.push(validated);
          validCount++;
        }
      } catch (error) {
        console.warn(`⚠️ Skipping invalid question ${index + 1}:`, error);
      }
    });

    console.log(`✅ Validation complete: ${validCount}/${questions.length} questions passed`);
    return validatedQuestions;
  }

  /**
   * Validate a single question
   */
  private validateSingleQuestion(q: any, index: number, title: string): ExamQuestion | null {
    // Validate required fields
    if (!q.question || typeof q.question !== 'string' || q.question.length < 10) {
      throw new Error('Invalid or missing question text');
    }

    const cleanQuestion = q.question.trim();
    if (!cleanQuestion.includes('?')) {
      throw new Error('Question must end with question mark');
    }

    // Validate question type
    const questionType = this.validateQuestionType(q.type);
    
    // Validate options for multiple choice
    const options = this.validateOptions(q.options, questionType);
    
    // Validate correct answer
    const correctAnswer = this.validateCorrectAnswer(q.correctAnswer, questionType, options);
    
    // Validate points
    const points = this.validatePoints(q.points);

    return {
      id: index.toString(),
      type: questionType,
      question: cleanQuestion,
      options: options,
      correctAnswer: correctAnswer,
      points: points,
      order: index,
      explanation: this.validateExplanation(q.explanation, index, title)
    };
  }

  /**
   * Validate question type
   */
  private validateQuestionType(type: any): 'multiple_choice' | 'true_false' | 'short_answer' | 'essay' {
    const validTypes = ['multiple_choice', 'true_false', 'short_answer', 'essay'];
    
    if (typeof type === 'string' && validTypes.includes(type)) {
      return type as any;
    }
    
    return 'short_answer'; // Default fallback
  }

  /**
   * Validate options for multiple choice questions
   */
  private validateOptions(options: any, questionType: string): string[] {
    if (questionType !== 'multiple_choice') {
      return [];
    }

    if (Array.isArray(options) && options.length >= 2) {
      return options
        .map((opt: any) => String(opt).trim())
        .filter((opt: string) => opt.length > 0);
    }

    // Create default options if none provided
    return ['Option A', 'Option B', 'Option C', 'Option D'];
  }

  /**
   * Validate correct answer
   */
  private validateCorrectAnswer(answer: any, questionType: string, options: string[]): string {
    if (questionType === 'multiple_choice') {
      if (options.includes(answer)) {
        return answer;
      }
      return options[0] || 'Option A'; // Default to first option or fallback
    }

    if (questionType === 'true_false') {
      if (answer === 'true' || answer === 'false') {
        return answer;
      }
      return 'true'; // Default
    }

    return answer || 'Student should provide a detailed answer';
  }

  /**
   * Validate points
   */
  private validatePoints(points: any): number {
    const numPoints = Number(points);
    if (isNaN(numPoints) || numPoints < 1) {
      return 10; // Default points
    }
    return Math.min(Math.max(numPoints, 1), 100); // Clamp between 1-100
  }

  /**
   * Validate explanation
   */
  private validateExplanation(explanation: any, index: number, title: string): string {
    if (typeof explanation === 'string' && explanation.length > 0) {
      return explanation;
    }
    return `Question ${index} from ${title}`;
  }

  /**
   * Get validation statistics
   */
  getValidationStats(questions: ExamQuestion[]): {
    totalQuestions: number;
    questionTypes: Record<string, number>;
    totalPoints: number;
    averagePoints: number;
  } {
    const questionTypes: Record<string, number> = {};
    let totalPoints = 0;

    questions.forEach(q => {
      questionTypes[q.type] = (questionTypes[q.type] || 0) + 1;
      totalPoints += q.points;
    });

    return {
      totalQuestions: questions.length,
      questionTypes,
      totalPoints,
      averagePoints: questions.length > 0 ? Math.round(totalPoints / questions.length) : 0
    };
  }
}

export default ExamValidationService;
