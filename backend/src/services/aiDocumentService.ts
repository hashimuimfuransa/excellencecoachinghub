import { GoogleGenerativeAI } from '@google/generative-ai';
import { asyncHandler } from '../middleware/asyncHandler';
import * as mammoth from 'mammoth';
import * as pdfParse from 'pdf-parse';
import { centralAIManager, AIGenerationOptions } from './centralAIManager';

export interface ExtractedQuestion {
  question: string;
  type: 'multiple_choice' | 'multiple_choice_multiple' | 'true_false' | 'short_answer' | 'essay' | 'fill_in_blank' | 'numerical' | 'matching';
  options?: string[];
  choices?: string[];
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
  private aiManager = centralAIManager;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || '';
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is required but not found in environment variables');
    }
    
    console.log('📄 AI Document Service initialized with Central AI Manager');
    
    // Listen to AI manager events for monitoring
    this.aiManager.on('modelUpgraded', (data) => {
      console.log(`📄 Document Service: Model upgraded from ${data.from} to ${data.to}`);
    });
  }

  // Extract questions from uploaded document
  public async extractQuestionsFromDocument(
    documentContent: string,
    documentType: 'pdf' | 'docx' | 'txt'
  ): Promise<ExtractedQuestion[]> {
    try {
      console.log(`🔍 Starting question extraction from ${documentType.toUpperCase()} document...`);
      console.log(`📄 Document content preview (first 300 chars): ${documentContent.substring(0, 300)}...`);
      
      const prompt = `
        You are an expert at extracting individual questions from educational exam documents. Your task is to parse this document and extract EACH INDIVIDUAL QUESTION separately, not the entire document as one question.

        CRITICAL PARSING INSTRUCTIONS:
        1. NEVER treat the entire document as a single question
        2. Break down multi-part questions into individual questions
        3. Each section header (Section A, Section B, etc.) indicates a new group of questions
        4. Each numbered item (1., 2., 3., Q1, Q2, etc.) is typically a separate question

        QUESTION IDENTIFICATION PATTERNS:
        - Direct questions ending with "?"
        - Numbered items: "1.", "2.", "3.", "Q1)", "Q2)", etc.
        - Section questions: "Section A: 1.", "Section B: 1.", etc.
        - Multiple choice: Question followed by A), B), C), D) options
        - True/False: Questions with T/F or True/False format
        - Fill-in-blanks: Questions with _____ or "Complete the following"
        - Essay prompts: "Explain...", "Discuss...", "Describe...", "Analyze..."

        EXAMPLE PARSING:
        If document contains:
        "Section A: Multiple Choice Questions
        1. What does CPU stand for?
        a) Central Process Unit
        b) Central Processing Unit
        c) Computer Personal Unit
        
        2. Which is an input device?
        a) Monitor
        b) Keyboard
        c) Printer"
        
        Extract as TWO separate questions, not one.

        JSON FORMAT:
        {
          "questions": [
            {
              "question": "What does CPU stand for?",
              "type": "multiple_choice",
              "section": "A",
              "options": ["Central Process Unit", "Central Processing Unit", "Computer Personal Unit"],
              "points": 2,
              "difficulty": "easy"
            },
            {
              "question": "Which is an input device?",
              "type": "multiple_choice", 
              "section": "A",
              "options": ["Monitor", "Keyboard", "Printer"],
              "points": 2,
              "difficulty": "easy"
            }
          ]
        }

        DOCUMENT TO PARSE:
        ${documentContent}

        EXTRACTION RULES:
        1. Extract EACH individual question as a separate JSON object
        2. Include section identifier (A, B, C, etc.) in "section" field
        3. For multiple choice: Extract clean option text without prefixes (a), b), etc.)
        4. Points: Auto-assign based on complexity (2-5 easy, 5-10 medium, 10-20 hard)
        5. Question types: multiple_choice, true_false, short_answer, essay, fill_in_blank, numerical
        6. Clean question text but preserve full meaning
        7. If uncertain about type, use "short_answer"
        8. Return ONLY valid JSON, no extra explanatory text
        9. If no clear questions found, return {"questions": []}
        
        CRITICAL: Each numbered item or distinct question prompt should become a separate question object in the array. Do not combine multiple questions into one.
      `;

      console.log('📄 Sending request to Enhanced AI Manager...');
      const text = await this.aiManager.generateContent(prompt, {
        retries: 3,
        timeout: 60000, // Longer timeout for document processing
        priority: 'high',
        temperature: 0.2 // Lower temperature for more accurate extraction
      });
      
      console.log('📝 Received AI response, parsing...');

      // Clean the response text to extract JSON
      let cleanedText = text.trim();
      
      // Remove markdown code blocks if present
      cleanedText = cleanedText.replace(/```json\s*/g, '').replace(/```\s*/g, '');
      
      // Find JSON object
      const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('❌ No JSON found in AI response:', text);
        throw new Error('AI response does not contain valid JSON');
      }

      let parsed;
      try {
        parsed = JSON.parse(jsonMatch[0]);
      } catch (parseError) {
        console.error('❌ JSON parsing failed:', parseError);
        console.error('Raw response:', text);
        throw new Error('Failed to parse AI response as JSON');
      }

      if (!parsed.questions || !Array.isArray(parsed.questions)) {
        console.error('❌ Invalid response structure:', parsed);
        throw new Error('AI response does not contain questions array');
      }

      const questions: ExtractedQuestion[] = parsed.questions.map((q: any, index: number) => {
        if (!q.question || !q.type) {
          console.warn(`⚠️ Incomplete question at index ${index}:`, q);
        }
        
        // Convert legacy type formats to current format
        let questionType = q.type || 'short_answer';
        if (questionType === 'multiple-choice') questionType = 'multiple_choice';
        if (questionType === 'true-false') questionType = 'true_false';
        if (questionType === 'short-answer') questionType = 'short_answer';
        if (questionType === 'fill-in-blank') questionType = 'fill_in_blank';
        
        // Get options from different possible properties
        const options = q.options || q.choices || [];
        
        // Clean up options - remove prefixes like a), b), A), B), etc.
        const cleanedOptions = options.map((option: string) => {
          if (typeof option === 'string') {
            return option.replace(/^[a-zA-Z]\)?\s*/, '').replace(/^\d+\)?\s*/, '').trim();
          }
          return option;
        });
        
        return {
          question: q.question || `Question ${index + 1}`,
          type: questionType,
          options: cleanedOptions,
          choices: cleanedOptions, // Add both for compatibility
          correctAnswer: q.correctAnswer,
          points: q.points || (q.difficulty === 'easy' ? 5 : q.difficulty === 'hard' ? 15 : 10),
          section: q.section || 'A',
          difficulty: q.difficulty || 'medium',
          aiExtracted: true
        };
      });

      // Debug log the extracted questions
      console.log(`✅ Successfully extracted ${questions.length} questions:`);
      questions.forEach((q, index) => {
        console.log(`  Question ${index + 1}: ${q.type} - ${q.question.substring(0, 50)}...`);
        if (q.options && q.options.length > 0) {
          console.log(`    Options (${q.options.length}): ${q.options.join(', ')}`);
        } else if (q.type === 'multiple_choice' || q.type === 'multiple_choice_multiple') {
          console.warn(`    ⚠️ Multiple choice question without options!`);
        }
      });
      
      return questions;
    } catch (error) {
      console.error('❌ Error extracting questions:', error);
      
      // Provide more specific error messages
      if (error.message?.includes('API key')) {
        throw new Error('Invalid or missing Google AI API key');
      } else if (error.message?.includes('quota')) {
        throw new Error('Google AI API quota exceeded');
      } else if (error.message?.includes('model')) {
        throw new Error('AI model not available or unsupported');
      } else {
        throw new Error(`Failed to extract questions from document: ${error.message}`);
      }
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

      const text = await this.aiManager.generateContent(prompt, {
        retries: 2,
        timeout: 30000,
        priority: 'normal',
        temperature: 0.3
      });

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

      const text = await this.aiManager.generateContent(prompt, {
        retries: 2,
        timeout: 30000,
        priority: 'normal',
        temperature: 0.3
      });

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

  // Process document content
  public async processDocumentContent(
    fileBuffer: Buffer,
    fileType: 'pdf' | 'docx' | 'txt'
  ): Promise<string> {
    try {
      console.log(`📄 Processing ${fileType.toUpperCase()} document...`);
      
      switch (fileType) {
        case 'txt':
          const textContent = fileBuffer.toString('utf-8');
          console.log(`📝 Extracted ${textContent.length} characters from TXT file`);
          return textContent;
          
        case 'docx':
          try {
            const docxResult = await mammoth.extractRawText({ buffer: fileBuffer });
            const docxContent = docxResult.value;
            console.log(`📝 Extracted ${docxContent.length} characters from DOCX file`);
            console.log(`📄 DOCX content preview: ${docxContent.substring(0, 200)}...`);
            
            if (docxResult.messages && docxResult.messages.length > 0) {
              console.warn('⚠️ DOCX processing warnings:', docxResult.messages);
            }
            
            if (!docxContent || docxContent.trim().length === 0) {
              throw new Error('DOCX file appears to be empty or corrupted');
            }
            
            return docxContent;
          } catch (docxError) {
            console.error('❌ DOCX processing failed:', docxError);
            // Try alternative extraction method
            console.log('🔄 Attempting alternative DOCX processing...');
            try {
              const docxResult = await mammoth.extractRawText({ 
                buffer: fileBuffer,
                convertImage: mammoth.images.ignoreAll
              });
              return docxResult.value || 'Failed to extract content from DOCX file';
            } catch (altError) {
              throw new Error(`Failed to process DOCX file: ${docxError.message}`);
            }
          }
          
        case 'pdf':
          const pdfData = await pdfParse(fileBuffer);
          const pdfContent = pdfData.text;
          console.log(`📝 Extracted ${pdfContent.length} characters from PDF file`);
          console.log(`📊 PDF info: ${pdfData.numpages} pages, ${pdfData.numrender} rendered objects`);
          return pdfContent;
          
        default:
          throw new Error(`Unsupported file type: ${fileType}`);
      }
    } catch (error) {
      console.error('❌ Error processing document:', error);
      throw new Error(`Failed to process ${fileType.toUpperCase()} document: ${error.message}`);
    }
  }
}

export default new AIDocumentService();
