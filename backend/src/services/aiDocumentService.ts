import { GoogleGenerativeAI } from '@google/generative-ai';
import { asyncHandler } from '../middleware/asyncHandler';

export interface ExtractedQuestion {
  question: string;
  type: 'multiple-choice' | 'true-false' | 'short-answer' | 'essay';
  options?: string[];
  correctAnswer?: string;
  points: number;
  aiExtracted: boolean;
}

export interface GradingResult {
  score: number;
  totalPoints: number;
  earnedPoints: number;
  grade: string;
  feedback: string;
  detailedFeedback: Array<{
    question: string;
    studentAnswer: string;
    correctAnswer?: string;
    points: number;
    earnedPoints: number;
    feedback: string;
  }>;
}

export class AIDocumentService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
  }

  // Extract questions from uploaded document
  public async extractQuestionsFromDocument(
    documentContent: string,
    documentType: 'pdf' | 'docx' | 'txt'
  ): Promise<ExtractedQuestion[]> {
    try {
      const prompt = `
        Analyze the following ${documentType.toUpperCase()} document content and extract all questions.
        Return the questions in JSON format with the following structure:
        {
          "questions": [
            {
              "question": "The question text",
              "type": "multiple-choice|true-false|short-answer|essay",
              "options": ["option1", "option2", "option3", "option4"] (only for multiple-choice),
              "correctAnswer": "The correct answer",
              "points": 10
            }
          ]
        }

        Document content:
        ${documentContent}

        Rules:
        1. Identify question types based on format and content
        2. For multiple-choice, extract all options
        3. For true-false, use "true" or "false" as correct answer
        4. Assign reasonable points (5-20) based on question complexity
        5. For essay questions, don't provide correctAnswer
        6. Ensure all questions are properly formatted and complete
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Parse JSON response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Failed to parse AI response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      const questions: ExtractedQuestion[] = parsed.questions.map((q: any) => ({
        question: q.question,
        type: q.type,
        options: q.options || [],
        correctAnswer: q.correctAnswer,
        points: q.points || 10,
        aiExtracted: true
      }));

      return questions;
    } catch (error) {
      console.error('❌ Error extracting questions:', error);
      throw new Error('Failed to extract questions from document');
    }
  }

  // Grade assessment submission
  public async gradeAssessment(
    questions: ExtractedQuestion[],
    studentAnswers: Array<{
      questionIndex: number;
      answer: string;
    }>
  ): Promise<GradingResult> {
    try {
      let totalPoints = 0;
      let earnedPoints = 0;
      const detailedFeedback: GradingResult['detailedFeedback'] = [];

      for (let i = 0; i < questions.length; i++) {
        const question = questions[i];
        const studentAnswer = studentAnswers.find(sa => sa.questionIndex === i);
        
        if (!studentAnswer) {
          detailedFeedback.push({
            question: question.question,
            studentAnswer: 'No answer provided',
            correctAnswer: question.correctAnswer,
            points: question.points,
            earnedPoints: 0,
            feedback: 'No answer provided'
          });
          totalPoints += question.points;
          continue;
        }

        const gradeResult = await this.gradeQuestion(question, studentAnswer.answer);
        
        detailedFeedback.push({
          question: question.question,
          studentAnswer: studentAnswer.answer,
          correctAnswer: question.correctAnswer,
          points: question.points,
          earnedPoints: gradeResult.earnedPoints,
          feedback: gradeResult.feedback
        });

        totalPoints += question.points;
        earnedPoints += gradeResult.earnedPoints;
      }

      const score = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;
      const grade = this.calculateGrade(score);

      return {
        score: Math.round(score * 100) / 100,
        totalPoints,
        earnedPoints,
        grade,
        feedback: this.generateOverallFeedback(score),
        detailedFeedback
      };
    } catch (error) {
      console.error('❌ Error grading assessment:', error);
      throw new Error('Failed to grade assessment');
    }
  }

  // Grade individual question
  private async gradeQuestion(
    question: ExtractedQuestion,
    studentAnswer: string
  ): Promise<{ earnedPoints: number; feedback: string }> {
    try {
      switch (question.type) {
        case 'multiple-choice':
        case 'true-false':
          return this.gradeObjectiveQuestion(question, studentAnswer);
        
        case 'short-answer':
          return await this.gradeShortAnswer(question, studentAnswer);
        
        case 'essay':
          return await this.gradeEssay(question, studentAnswer);
        
        default:
          return { earnedPoints: 0, feedback: 'Unknown question type' };
      }
    } catch (error) {
      console.error('❌ Error grading question:', error);
      return { earnedPoints: 0, feedback: 'Error grading question' };
    }
  }

  // Grade objective questions (multiple-choice, true-false)
  private gradeObjectiveQuestion(
    question: ExtractedQuestion,
    studentAnswer: string
  ): { earnedPoints: number; feedback: string } {
    const isCorrect = studentAnswer.toLowerCase().trim() === 
      (question.correctAnswer || '').toLowerCase().trim();

    return {
      earnedPoints: isCorrect ? question.points : 0,
      feedback: isCorrect 
        ? 'Correct answer!' 
        : `Incorrect. The correct answer is: ${question.correctAnswer}`
    };
  }

  // Grade short answer questions
  private async gradeShortAnswer(
    question: ExtractedQuestion,
    studentAnswer: string
  ): Promise<{ earnedPoints: number; feedback: string }> {
    try {
      const prompt = `
        Grade the following short answer question:
        
        Question: ${question.question}
        Correct Answer: ${question.correctAnswer || 'Not provided'}
        Student Answer: ${studentAnswer}
        Maximum Points: ${question.points}
        
        Evaluate the student's answer and provide:
        1. Points earned (0 to ${question.points})
        2. Brief feedback explaining the grade
        
        Return in JSON format:
        {
          "points": number,
          "feedback": "string"
        }
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Failed to parse AI grading response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      return {
        earnedPoints: Math.min(parsed.points, question.points),
        feedback: parsed.feedback
      };
    } catch (error) {
      console.error('❌ Error grading short answer:', error);
      return { earnedPoints: 0, feedback: 'Error grading short answer' };
    }
  }

  // Grade essay questions
  private async gradeEssay(
    question: ExtractedQuestion,
    studentAnswer: string
  ): Promise<{ earnedPoints: number; feedback: string }> {
    try {
      const prompt = `
        Grade the following essay question:
        
        Question: ${question.question}
        Student Answer: ${studentAnswer}
        Maximum Points: ${question.points}
        
        Evaluate the essay based on:
        - Content relevance and accuracy
        - Clarity and organization
        - Grammar and spelling
        - Depth of analysis
        
        Return in JSON format:
        {
          "points": number,
          "feedback": "Detailed feedback explaining the grade"
        }
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Failed to parse AI grading response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      return {
        earnedPoints: Math.min(parsed.points, question.points),
        feedback: parsed.feedback
      };
    } catch (error) {
      console.error('❌ Error grading essay:', error);
      return { earnedPoints: 0, feedback: 'Error grading essay' };
    }
  }

  // Calculate letter grade
  private calculateGrade(score: number): string {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  // Generate overall feedback
  private generateOverallFeedback(score: number): string {
    if (score >= 90) return 'Excellent work! You have demonstrated mastery of the material.';
    if (score >= 80) return 'Good work! You have a solid understanding of the material.';
    if (score >= 70) return 'Satisfactory work. Consider reviewing areas of difficulty.';
    if (score >= 60) return 'You need improvement. Please review the material and retake if possible.';
    return 'You need significant improvement. Please review the material thoroughly.';
  }

  // Process document content (placeholder for actual document processing)
  public async processDocumentContent(
    fileBuffer: Buffer,
    fileType: 'pdf' | 'docx' | 'txt'
  ): Promise<string> {
    try {
      // This is a placeholder - you'll need to implement actual document processing
      // For PDF: use pdf-parse or similar
      // For DOCX: use mammoth or similar
      // For TXT: convert buffer to string
      
      if (fileType === 'txt') {
        return fileBuffer.toString('utf-8');
      }
      
      // For now, return a placeholder
      return 'Document content placeholder - implement actual processing';
    } catch (error) {
      console.error('❌ Error processing document:', error);
      throw new Error('Failed to process document');
    }
  }
}

export default new AIDocumentService();
