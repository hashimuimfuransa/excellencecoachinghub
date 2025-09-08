import * as XLSX from 'xlsx';
import * as pdfParse from 'pdf-parse';
import { aiService } from './aiService';

export interface ParsedQuestion {
  id?: string;
  question: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay';
  options?: string[];
  correctAnswer: string | string[];
  explanation?: string;
  category?: string;
  difficulty?: 'basic' | 'intermediate' | 'advanced';
  points?: number;
}

export interface FileParsingResult {
  success: boolean;
  questions: ParsedQuestion[];
  totalQuestions: number;
  errors: string[];
  warnings: string[];
}

class FileParsingService {
  /**
   * Parse uploaded file and extract questions
   */
  async parseFile(file: Express.Multer.File): Promise<FileParsingResult> {
    const result: FileParsingResult = {
      success: false,
      questions: [],
      totalQuestions: 0,
      errors: [],
      warnings: []
    };

    try {
      const fileExtension = this.getFileExtension(file.originalname);
      console.log(`📄 Parsing ${fileExtension} file: ${file.originalname}`);

      switch (fileExtension) {
        case '.json':
          return this.parseJSONFile(file, result);
        case '.csv':
          return this.parseCSVFile(file, result);
        case '.xlsx':
        case '.xls':
          return this.parseExcelFile(file, result);
        case '.pdf':
          return this.parsePDFFile(file, result);
        case '.doc':
        case '.docx':
        case '.txt':
          return this.parseTextFile(file, result);
        default:
          result.errors.push(`Unsupported file format: ${fileExtension}`);
          return result;
      }
    } catch (error: any) {
      console.error('Error parsing file:', error);
      result.errors.push(`Failed to parse file: ${error.message}`);
      return result;
    }
  }

  /**
   * Parse JSON file containing questions
   */
  private parseJSONFile(file: Express.Multer.File, result: FileParsingResult): FileParsingResult {
    try {
      const content = file.buffer.toString('utf8');
      const data = JSON.parse(content);

      // Handle different JSON structures
      let questionsArray: any[] = [];
      
      if (Array.isArray(data)) {
        questionsArray = data;
      } else if (data.questions && Array.isArray(data.questions)) {
        questionsArray = data.questions;
      } else if (data.test && data.test.questions) {
        questionsArray = data.test.questions;
      } else {
        result.errors.push('Invalid JSON structure. Expected array of questions or object with "questions" property.');
        return result;
      }

      // Process each question
      questionsArray.forEach((item, index) => {
        const question = this.processQuestionItem(item, index + 1);
        if (question) {
          result.questions.push(question);
        } else {
          result.warnings.push(`Skipped invalid question at index ${index + 1}`);
        }
      });

      result.success = result.questions.length > 0;
      result.totalQuestions = result.questions.length;

      if (result.totalQuestions === 0) {
        result.errors.push('No valid questions found in the JSON file');
      }

      return result;
    } catch (error: any) {
      result.errors.push(`JSON parsing error: ${error.message}`);
      return result;
    }
  }

  /**
   * Parse CSV file containing questions
   */
  private parseCSVFile(file: Express.Multer.File, result: FileParsingResult): FileParsingResult {
    try {
      const content = file.buffer.toString('utf8');
      const workbook = XLSX.read(content, { type: 'string' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);

      // Process each row as a question
      data.forEach((row: any, index) => {
        const question = this.processQuestionItem(row, index + 1);
        if (question) {
          result.questions.push(question);
        } else {
          result.warnings.push(`Skipped invalid question at row ${index + 2}`); // +2 because of header row
        }
      });

      result.success = result.questions.length > 0;
      result.totalQuestions = result.questions.length;

      if (result.totalQuestions === 0) {
        result.errors.push('No valid questions found in the CSV file');
      }

      return result;
    } catch (error: any) {
      result.errors.push(`CSV parsing error: ${error.message}`);
      return result;
    }
  }

  /**
   * Parse Excel file containing questions
   */
  private parseExcelFile(file: Express.Multer.File, result: FileParsingResult): FileParsingResult {
    try {
      const workbook = XLSX.read(file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);

      // Process each row as a question
      data.forEach((row: any, index) => {
        const question = this.processQuestionItem(row, index + 1);
        if (question) {
          result.questions.push(question);
        } else {
          result.warnings.push(`Skipped invalid question at row ${index + 2}`); // +2 because of header row
        }
      });

      result.success = result.questions.length > 0;
      result.totalQuestions = result.questions.length;

      if (result.totalQuestions === 0) {
        result.errors.push('No valid questions found in the Excel file');
      }

      return result;
    } catch (error: any) {
      result.errors.push(`Excel parsing error: ${error.message}`);
      return result;
    }
  }

  /**
   * Parse PDF file using AI to extract questions
   */
  private async parsePDFFile(file: Express.Multer.File, result: FileParsingResult): Promise<FileParsingResult> {
    try {
      console.log('📄 Parsing PDF file...');
      const pdfData = await pdfParse(file.buffer);
      const text = pdfData.text;

      if (!text || text.trim().length === 0) {
        result.errors.push('No text content found in PDF file');
        return result;
      }

      console.log('🤖 Using AI to extract questions from PDF content...');
      
      // Use AI to extract questions from PDF text
      const aiResult = await this.extractQuestionsWithAI(text);
      
      if (aiResult.success) {
        result.questions = aiResult.questions;
        result.success = true;
        result.totalQuestions = aiResult.questions.length;
      } else {
        result.errors.push('AI failed to extract questions from PDF');
        result.errors.push(...aiResult.errors);
      }

      return result;
    } catch (error: any) {
      console.error('Error parsing PDF:', error);
      result.errors.push(`PDF parsing error: ${error.message}`);
      return result;
    }
  }

  /**
   * Parse text file using AI to extract questions
   */
  private async parseTextFile(file: Express.Multer.File, result: FileParsingResult): Promise<FileParsingResult> {
    try {
      const content = file.buffer.toString('utf8');

      if (!content || content.trim().length === 0) {
        result.errors.push('No content found in text file');
        return result;
      }

      console.log('🤖 Using AI to extract questions from text content...');
      
      // Use AI to extract questions from text content
      const aiResult = await this.extractQuestionsWithAI(content);
      
      if (aiResult.success) {
        result.questions = aiResult.questions;
        result.success = true;
        result.totalQuestions = aiResult.questions.length;
      } else {
        result.errors.push('AI failed to extract questions from text file');
        result.errors.push(...aiResult.errors);
      }

      return result;
    } catch (error: any) {
      result.errors.push(`Text file parsing error: ${error.message}`);
      return result;
    }
  }

  /**
   * Use AI to extract questions from unstructured text
   */
  private async extractQuestionsWithAI(text: string): Promise<FileParsingResult> {
    const result: FileParsingResult = {
      success: false,
      questions: [],
      totalQuestions: 0,
      errors: [],
      warnings: []
    };

    try {
      const prompt = `Please extract all questions from the following text and format them as a JSON array. Each question should include:
- question: The question text
- type: One of "multiple_choice", "true_false", "short_answer", or "essay"
- options: Array of options (for multiple choice questions)
- correctAnswer: The correct answer
- explanation: Brief explanation (if available)
- difficulty: "basic", "intermediate", or "advanced"

Text to parse:
${text}

Please respond with only valid JSON in this format:
[
  {
    "question": "What is...?",
    "type": "multiple_choice",
    "options": ["A", "B", "C", "D"],
    "correctAnswer": "A",
    "explanation": "Because...",
    "difficulty": "basic"
  }
]`;

      const aiResponse = await aiService.generateText(prompt);
      
      if (aiResponse && aiResponse.trim()) {
        try {
          // Clean the AI response to extract JSON
          let jsonStr = aiResponse.trim();
          
          // Remove markdown code blocks if present
          jsonStr = jsonStr.replace(/```json\s*/, '').replace(/```\s*$/, '');
          
          // Try to find JSON array in the response
          const jsonMatch = jsonStr.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            jsonStr = jsonMatch[0];
          }

          const questions = JSON.parse(jsonStr);
          
          if (Array.isArray(questions)) {
            questions.forEach((q, index) => {
              const processedQuestion = this.processQuestionItem(q, index + 1);
              if (processedQuestion) {
                result.questions.push(processedQuestion);
              } else {
                result.warnings.push(`AI extracted invalid question at index ${index + 1}`);
              }
            });

            result.success = result.questions.length > 0;
            result.totalQuestions = result.questions.length;
          } else {
            result.errors.push('AI response is not a valid array of questions');
          }
        } catch (parseError: any) {
          console.error('Error parsing AI response:', parseError);
          result.errors.push(`Failed to parse AI response: ${parseError.message}`);
        }
      } else {
        result.errors.push('AI service returned empty response');
      }

    } catch (error: any) {
      console.error('AI extraction error:', error);
      result.errors.push(`AI service error: ${error.message}`);
    }

    return result;
  }

  /**
   * Process and validate individual question item
   */
  private processQuestionItem(item: any, index: number): ParsedQuestion | null {
    try {
      // Extract question text with various field name variations
      const questionText = item.question || item.Question || item.q || item.text || item.questionText;
      
      if (!questionText || typeof questionText !== 'string' || questionText.trim().length === 0) {
        return null;
      }

      // Extract question type
      const type = this.determineQuestionType(item);

      // Extract options for multiple choice questions
      let options: string[] = [];
      if (type === 'multiple_choice') {
        options = this.extractOptions(item);
        if (options.length === 0) {
          // If no options provided for multiple choice, try to detect from the question text
          options = this.extractOptionsFromText(questionText);
        }
      }

      // Extract correct answer
      const correctAnswer = item.correctAnswer || item.answer || item.correct || item.solution;
      if (!correctAnswer) {
        return null;
      }

      // Extract other fields
      const explanation = item.explanation || item.explain || item.rationale || '';
      const category = item.category || item.topic || item.subject || 'general';
      const difficulty = this.normalizeDifficulty(item.difficulty || item.level) || 'basic';
      const points = parseInt(item.points || item.score || '1') || 1;

      return {
        id: `q${index}`,
        question: questionText.trim(),
        type,
        options: options.length > 0 ? options : undefined,
        correctAnswer,
        explanation: explanation || undefined,
        category: category || undefined,
        difficulty,
        points
      };

    } catch (error) {
      console.error(`Error processing question item at index ${index}:`, error);
      return null;
    }
  }

  /**
   * Determine question type from item data
   */
  private determineQuestionType(item: any): 'multiple_choice' | 'true_false' | 'short_answer' | 'essay' {
    const type = item.type || item.questionType || item.qType;
    
    if (type) {
      const normalizedType = type.toLowerCase().replace(/[_\s-]/g, '_');
      if (['multiple_choice', 'multichoice', 'mc'].includes(normalizedType)) {
        return 'multiple_choice';
      }
      if (['true_false', 'truefalse', 'tf', 'boolean'].includes(normalizedType)) {
        return 'true_false';
      }
      if (['short_answer', 'shortanswer', 'sa', 'short'].includes(normalizedType)) {
        return 'short_answer';
      }
      if (['essay', 'long_answer', 'longanswer'].includes(normalizedType)) {
        return 'essay';
      }
    }

    // Try to detect from options or answer
    if (this.extractOptions(item).length > 0) {
      return 'multiple_choice';
    }

    const answer = (item.correctAnswer || item.answer || '').toString().toLowerCase();
    if (['true', 'false', 'yes', 'no'].includes(answer)) {
      return 'true_false';
    }

    // Default to multiple choice
    return 'multiple_choice';
  }

  /**
   * Extract options from item data
   */
  private extractOptions(item: any): string[] {
    const options: string[] = [];

    // Check for options array
    if (item.options && Array.isArray(item.options)) {
      return item.options.filter(opt => opt && typeof opt === 'string').map(opt => opt.trim());
    }

    // Check for individual option fields (A, B, C, D or option1, option2, etc.)
    const optionKeys = ['A', 'B', 'C', 'D', 'E', 'option1', 'option2', 'option3', 'option4', 'option5'];
    for (const key of optionKeys) {
      if (item[key] && typeof item[key] === 'string') {
        options.push(item[key].trim());
      }
    }

    return options;
  }

  /**
   * Extract options from question text (for cases where options are embedded in the question)
   */
  private extractOptionsFromText(questionText: string): string[] {
    const options: string[] = [];
    
    // Pattern to match options like "A) option" or "1. option" or "a. option"
    const optionPattern = /([A-E][\)\.]\s*|[1-5][\)\.]\s*|[a-e][\)\.]\s*)([^\n\r]+)/gi;
    let match;
    
    while ((match = optionPattern.exec(questionText)) !== null) {
      if (match[2] && match[2].trim()) {
        options.push(match[2].trim());
      }
    }

    return options;
  }

  /**
   * Normalize difficulty level
   */
  private normalizeDifficulty(difficulty: any): 'basic' | 'intermediate' | 'advanced' | null {
    if (!difficulty) return null;
    
    const normalized = difficulty.toString().toLowerCase();
    
    if (['basic', 'easy', 'beginner', '1'].includes(normalized)) {
      return 'basic';
    }
    if (['intermediate', 'medium', 'moderate', '2'].includes(normalized)) {
      return 'intermediate';
    }
    if (['advanced', 'hard', 'difficult', 'expert', '3'].includes(normalized)) {
      return 'advanced';
    }
    
    return 'basic';
  }

  /**
   * Get file extension from filename
   */
  private getFileExtension(filename: string): string {
    const lastDot = filename.lastIndexOf('.');
    return lastDot >= 0 ? filename.substring(lastDot).toLowerCase() : '';
  }

  /**
   * Validate parsed questions
   */
  validateQuestions(questions: ParsedQuestion[]): { valid: ParsedQuestion[]; invalid: any[] } {
    const valid: ParsedQuestion[] = [];
    const invalid: any[] = [];

    questions.forEach((q, index) => {
      const errors: string[] = [];

      // Validate required fields
      if (!q.question || q.question.trim().length === 0) {
        errors.push('Question text is required');
      }

      if (!q.correctAnswer) {
        errors.push('Correct answer is required');
      }

      // Validate multiple choice questions
      if (q.type === 'multiple_choice') {
        if (!q.options || q.options.length < 2) {
          errors.push('Multiple choice questions must have at least 2 options');
        }
      }

      if (errors.length === 0) {
        valid.push(q);
      } else {
        invalid.push({ ...q, index, errors });
      }
    });

    return { valid, invalid };
  }
}

export const fileParsingService = new FileParsingService();
export default fileParsingService;