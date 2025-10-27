import * as XLSX from 'xlsx';
import * as pdfParse from 'pdf-parse';
import { aiService } from './aiService';
import { DocumentParser } from '../utils/documentParser';

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
      let content: string;
      
      // Handle different file types properly
      if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
          file.originalname.toLowerCase().endsWith('.docx')) {
        console.log('📄 Parsing .docx file:', file.originalname);
        // Use DocumentParser for .docx files
        const parseResult = await DocumentParser.parseDocument(file.buffer, file.mimetype, file.originalname);
        content = DocumentParser.cleanText(parseResult.text);
        
        // Try structured extraction first
        const structuredQuestions = DocumentParser.extractStructuredQuestions(content);
        if (structuredQuestions.length > 0) {
          console.log(`✅ Found ${structuredQuestions.length} structured questions in .docx file`);
          result.questions = structuredQuestions.map((q, index) => ({
            id: `q${index + 1}`,
            question: q.question,
            type: q.type === 'multiple-choice' ? 'multiple_choice' : 'short_answer' as any,
            options: q.options || [],
            correctAnswer: q.answer || (q.options && q.options.length > 0 ? q.options[0] : ''),
            explanation: '',
            category: 'general',
            difficulty: 'intermediate' as any,
            points: 1
          }));
          
          result.success = true;
          result.totalQuestions = result.questions.length;
          return result;
        }
      } else {
        // Handle plain text files
        content = file.buffer.toString('utf8');
      }

      if (!content || content.trim().length === 0) {
        result.errors.push('No content found in file');
        return result;
      }

      console.log(`🤖 Using AI to extract questions from ${file.originalname} content...`);
      console.log(`📄 Content length: ${content.length} characters`);
      
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
      console.error('❌ Text file parsing error:', error);
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
      console.log('🤖 Using AI to extract questions from text content...');
      
      // Limit text size to avoid overwhelming AI
      const limitedText = text.length > 8000 ? text.substring(0, 8000) + '...' : text;
      
      const prompt = `You are an expert question parser. Analyze the following text and extract ALL questions, converting them into a standardized JSON format.

IMPORTANT INSTRUCTIONS:
1. Find ALL questions in the text (look for: question marks (?), numbered lists (1., 2., etc.), lettered items (a), b), etc.), or any text that appears to be a question)
2. For each question found:
   - Extract the complete question text
   - Determine question type: "multiple_choice", "true_false", "short_answer", or "essay"
   - If there are multiple choice options (A, B, C, D or 1, 2, 3, 4), extract them
   - If there's an indicated correct answer, include it
   - Provide a brief explanation if one exists in the text
   - Set difficulty as "basic", "intermediate", or "advanced" based on complexity
   - Set category as "general" unless a specific subject is clear

3. CRITICAL: Return ONLY a valid JSON array. No markdown backticks, no extra text, no explanations.

EXAMPLE OUTPUT FORMAT:
[
  {
    "question": "What is the capital of France?",
    "type": "multiple_choice",
    "options": ["London", "Berlin", "Paris", "Madrid"],
    "correctAnswer": "Paris",
    "explanation": "Paris is the capital and largest city of France",
    "difficulty": "basic",
    "category": "geography"
  },
  {
    "question": "Describe the process of photosynthesis.",
    "type": "short_answer",
    "options": [],
    "correctAnswer": "Process by which plants convert light energy into chemical energy",
    "explanation": "Expected answer should include light, chlorophyll, CO2, water, glucose, and oxygen",
    "difficulty": "intermediate",
    "category": "biology"
  }
]

If no questions are found, return an empty array: []

TEXT TO ANALYZE:
${limitedText}

JSON ARRAY:`;

      // Use improved AI generation with better error handling
      const aiResponse = await aiService.generateContent(prompt, {
        retries: 3,
        timeout: 60000, // Longer timeout for complex parsing
        priority: 'high',
        temperature: 0.2 // Lower temperature for more structured responses
      });
      console.log(`📄 AI response length: ${aiResponse?.length || 0} characters`);
      
      if (aiResponse && aiResponse.trim()) {
        try {
          // Enhanced JSON extraction with multiple strategies
          let jsonStr = aiResponse.trim();
          
          // Strategy 1: Remove markdown code blocks
          jsonStr = jsonStr.replace(/```json\s*/g, '').replace(/```\s*$/g, '');
          jsonStr = jsonStr.replace(/```\s*/g, '').replace(/```$/g, '');
          
          // Strategy 2: Find JSON array boundaries
          const arrayStart = jsonStr.indexOf('[');
          const arrayEnd = jsonStr.lastIndexOf(']');
          
          if (arrayStart !== -1 && arrayEnd !== -1 && arrayEnd > arrayStart) {
            jsonStr = jsonStr.substring(arrayStart, arrayEnd + 1);
          }
          
          // Strategy 3: Clean up common JSON issues
          jsonStr = jsonStr
            .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas
            .replace(/([}\]])(\s*)([{])/g, '$1,$2$3') // Add missing commas between objects
            .replace(/\n\s*\n/g, '\n') // Remove double newlines
            .trim();

          console.log(`🔍 Attempting to parse JSON of length: ${jsonStr.length}`);
          const questions = JSON.parse(jsonStr);
          
          if (Array.isArray(questions)) {
            console.log(`✅ Successfully parsed ${questions.length} questions from AI response`);
            
            let processedCount = 0;
            questions.forEach((q, index) => {
              const processedQuestion = this.processQuestionItem(q, index + 1);
              if (processedQuestion) {
                result.questions.push(processedQuestion);
                processedCount++;
              } else {
                result.warnings.push(`Invalid question structure at index ${index + 1}`);
              }
            });

            result.success = result.questions.length > 0;
            result.totalQuestions = result.questions.length;
            console.log(`🎯 Processed ${processedCount} valid questions out of ${questions.length} extracted`);
          } else {
            console.error('❌ AI response is not a valid array');
            result.errors.push('AI response is not a valid array of questions');
          }
          
        } catch (parseError: any) {
          console.error('❌ JSON parsing failed:', parseError.message);
          
          // Fallback: Try to extract individual question objects
          try {
            console.log('🔄 Attempting fallback extraction...');
            const fallbackQuestions = this.extractQuestionsWithRegex(aiResponse);
            if (fallbackQuestions.length > 0) {
              result.questions = fallbackQuestions;
              result.success = true;
              result.totalQuestions = fallbackQuestions.length;
              result.warnings.push('Used fallback extraction method due to JSON parsing issues');
              console.log(`✅ Fallback extracted ${fallbackQuestions.length} questions`);
            } else {
              result.errors.push(`Failed to parse AI response: ${parseError.message}`);
            }
          } catch (fallbackError) {
            result.errors.push(`JSON parsing failed and fallback extraction failed: ${parseError.message}`);
          }
        }
      } else {
        console.error('❌ AI service returned empty response');
        result.errors.push('AI service returned empty response');
      }

    } catch (error: any) {
      console.error('❌ AI extraction error:', error);
      result.errors.push(`AI service error: ${error.message}`);
      
      // Try pattern-based extraction as final fallback
      try {
        console.log('🔄 Attempting pattern-based fallback extraction...');
        const patternQuestions = this.extractQuestionsWithPattern(text);
        if (patternQuestions.length > 0) {
          result.questions = patternQuestions;
          result.success = true;
          result.totalQuestions = patternQuestions.length;
          result.warnings.push('Used pattern-based extraction due to AI service unavailability');
          console.log(`✅ Pattern-based extraction found ${patternQuestions.length} questions`);
        }
      } catch (patternError) {
        console.error('❌ Pattern-based fallback also failed:', patternError);
      }
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

  /**
   * Fallback method to extract questions using regex patterns
   */
  private extractQuestionsWithRegex(text: string): ParsedQuestion[] {
    const questions: ParsedQuestion[] = [];
    
    try {
      // Pattern to match question objects in text
      const questionPattern = /"question":\s*"([^"]+)"/g;
      const optionsPattern = /"options":\s*\[([^\]]+)\]/g;
      const answerPattern = /"correctAnswer":\s*"([^"]+)"/g;
      
      const questionMatches = [...text.matchAll(questionPattern)];
      const optionMatches = [...text.matchAll(optionsPattern)];
      const answerMatches = [...text.matchAll(answerPattern)];
      
      const minLength = Math.min(questionMatches.length, answerMatches.length);
      
      for (let i = 0; i < minLength; i++) {
        const question = questionMatches[i][1];
        const answer = answerMatches[i][1];
        let options: string[] = [];
        
        if (i < optionMatches.length) {
          const optionsText = optionMatches[i][1];
          options = optionsText.split(',').map(opt => 
            opt.replace(/"/g, '').trim()
          ).filter(opt => opt.length > 0);
        }
        
        questions.push({
          id: `fallback_q${i + 1}`,
          question: question.trim(),
          type: options.length > 0 ? 'multiple_choice' : 'short_answer',
          options: options.length > 0 ? options : undefined,
          correctAnswer: answer.trim(),
          explanation: 'Extracted using fallback method',
          difficulty: 'intermediate'
        });
      }
    } catch (error) {
      console.error('Regex extraction error:', error);
    }
    
    return questions;
  }

  /**
   * Pattern-based extraction for when AI is completely unavailable
   */
  private extractQuestionsWithPattern(text: string): ParsedQuestion[] {
    const questions: ParsedQuestion[] = [];
    
    try {
      // Look for numbered questions or questions with question marks
      const lines = text.split('\n');
      let currentQuestion = '';
      let options: string[] = [];
      let answer = '';
      let questionIndex = 1;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Detect question patterns
        if (line.match(/^\d+[\.\)]\s*/) || line.includes('?')) {
          // Save previous question if exists
          if (currentQuestion) {
            questions.push({
              id: `pattern_q${questionIndex}`,
              question: currentQuestion.trim(),
              type: options.length > 0 ? 'multiple_choice' : 'short_answer',
              options: options.length > 0 ? options : undefined,
              correctAnswer: answer || options[0] || 'Not specified',
              explanation: 'Extracted using pattern matching',
              difficulty: 'intermediate'
            });
            questionIndex++;
          }
          
          // Start new question
          currentQuestion = line.replace(/^\d+[\.\)]\s*/, '');
          options = [];
          answer = '';
        }
        // Detect options (A, B, C, D or a, b, c, d)
        else if (line.match(/^[A-Da-d][\.\)]\s*/)) {
          const optionText = line.replace(/^[A-Da-d][\.\)]\s*/, '');
          options.push(optionText);
        }
        // Detect answer patterns
        else if (line.toLowerCase().includes('answer') || line.toLowerCase().includes('correct')) {
          answer = line;
        }
        // Continue question text
        else if (currentQuestion && line.length > 0 && !line.match(/^[A-Da-d][\.\)]/)) {
          currentQuestion += ' ' + line;
        }
      }
      
      // Don't forget the last question
      if (currentQuestion) {
        questions.push({
          id: `pattern_q${questionIndex}`,
          question: currentQuestion.trim(),
          type: options.length > 0 ? 'multiple_choice' : 'short_answer',
          options: options.length > 0 ? options : undefined,
          correctAnswer: answer || options[0] || 'Not specified',
          explanation: 'Extracted using pattern matching',
          difficulty: 'intermediate'
        });
      }
      
    } catch (error) {
      console.error('Pattern extraction error:', error);
    }
    
    return questions;
  }
}

export const fileParsingService = new FileParsingService();
export default fileParsingService;