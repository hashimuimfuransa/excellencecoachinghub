import { CentralAIManager } from './centralAIManager';

export interface ExamQuestion {
  id: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay';
  question: string;
  options: string[];
  correctAnswer: string;
  points: number;
  order: number;
  explanation: string;
}

export class ExamExtractionService {
  private static instance: ExamExtractionService;
  private aiManager: any;

  private constructor() {
    try {
      this.aiManager = CentralAIManager.getInstance();
    } catch (error) {
      console.warn('AI Manager not available, using fallback extraction');
      this.aiManager = null;
    }
  }

  public static getInstance(): ExamExtractionService {
    if (!ExamExtractionService.instance) {
      ExamExtractionService.instance = new ExamExtractionService();
    }
    return ExamExtractionService.instance;
  }

  /**
   * Extract questions from document text using AI and pattern matching
   */
  async extractQuestions(text: string, title: string, examType: string): Promise<ExamQuestion[]> {
    console.log('🔍 Starting exam question extraction...');

    // Try AI extraction first
    if (this.aiManager && text.length > 0) {
      try {
        const aiQuestions = await this.extractWithAI(text, title, examType);
        if (aiQuestions.length > 0) {
          console.log(`✅ AI extracted ${aiQuestions.length} questions`);
          return aiQuestions;
        }
      } catch (error) {
        console.warn('⚠️ AI extraction failed, using pattern matching:', error);
      }
    }

    // Fallback to pattern matching
    console.log('🔄 Using pattern matching extraction...');
    return this.extractWithPatternMatching(text, title, examType);
  }

  /**
   * Extract questions using Gemini AI
   */
  private async extractWithAI(text: string, title: string, examType: string): Promise<ExamQuestion[]> {
    console.log('🤖 Starting AI extraction for exam:', title);
    console.log('📄 Document text length:', text.length);
    
    const prompt = `
EXAM QUESTION EXTRACTION TASK

You are an expert exam question extractor. Your ONLY job is to find and extract exam questions from this document.

EXAM INFORMATION:
- Title: ${title}
- Type: ${examType}
- Document Length: ${text.length} characters

DOCUMENT CONTENT:
${text.substring(0, 10000)}${text.length > 10000 ? '\n\n[Document continues...]' : ''}

EXTRACTION RULES:
1. Find ALL questions that end with "?" 
2. Extract multiple choice questions with their options (A, B, C, D)
3. Extract true/false questions
4. Extract short answer and essay questions
5. Determine the correct answer for each question

WHAT TO EXTRACT:
✅ "What is the capital of France?" (EXAM QUESTION)
✅ "Which of the following is correct?" (EXAM QUESTION)
✅ "True or False: Paris is in France." (EXAM QUESTION)
✅ "Explain the process of photosynthesis." (EXAM QUESTION)

WHAT TO IGNORE:
❌ "Introduction to Computer Science" (SECTION HEADER)
❌ "Chapter 1: Basic Concepts" (SECTION HEADER)
❌ "The CPU is the brain of the computer." (EXPLANATORY TEXT)
❌ "Table of Contents" (NOT A QUESTION)

OUTPUT FORMAT:
Return ONLY a JSON array of questions. Each question must have:
- id: question number as string
- type: "multiple_choice", "true_false", "short_answer", or "essay"
- question: the clean question text (without options)
- options: array of options (for multiple choice only)
- correctAnswer: the correct answer
- points: points for this question (default 10)
- order: question order number
- explanation: brief explanation

MULTIPLE CHOICE PARSING:
For questions like "Which of the following is an asset? a) Loan from bank b) Furniture c) Salaries d) Rent expense"
- Extract the question: "Which of the following is an asset?"
- Extract options: ["Loan from bank", "Furniture", "Salaries", "Rent expense"]
- Determine correct answer from context

EXAMPLE OUTPUT:
[
  {
    "id": "1",
    "type": "multiple_choice",
    "question": "Which of the following is an asset?",
    "options": ["Loan from bank", "Furniture", "Salaries", "Rent expense"],
    "correctAnswer": "Furniture",
    "points": 10,
    "order": 1,
    "explanation": "Assets are resources owned by the business."
  }
]

IMPORTANT: Return ONLY the JSON array. No other text. If no questions found, return empty array [].
    `;

    console.log('📤 Sending request to AI with enhanced prompt...');
    const result = await this.aiManager.generateContent(prompt, {
      temperature: 0.1,
      maxTokens: 4000,
      retries: 3
    });

    console.log('📥 AI Response received:', result ? result.substring(0, 200) + '...' : 'No response');

    if (!result) {
      throw new Error('No AI response received');
    }

    // Clean and parse AI response
    const cleanedResult = result.trim();
    console.log('🔍 Parsing AI response...');

    // Try multiple methods to extract JSON
    let questions = null;
    
    // Method 1: Look for JSON array
    const jsonArrayMatch = cleanedResult.match(/\[[\s\S]*\]/);
    if (jsonArrayMatch) {
      try {
        questions = JSON.parse(jsonArrayMatch[0]);
        console.log('✅ Successfully parsed JSON array');
      } catch (parseError) {
        console.warn('⚠️ Failed to parse JSON array:', parseError);
      }
    }

    // Method 2: Look for JSON object with questions property
    if (!questions) {
      const jsonObjectMatch = cleanedResult.match(/\{[\s\S]*\}/);
      if (jsonObjectMatch) {
        try {
          const parsed = JSON.parse(jsonObjectMatch[0]);
          if (parsed.questions && Array.isArray(parsed.questions)) {
            questions = parsed.questions;
            console.log('✅ Successfully parsed questions from JSON object');
          }
        } catch (parseError) {
          console.warn('⚠️ Failed to parse JSON object:', parseError);
        }
      }
    }

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      console.log('❌ No valid questions found in AI response');
      throw new Error('No questions found in AI response');
    }

    console.log(`✅ AI extracted ${questions.length} questions successfully`);

    return questions.map((q: any, index: number) => ({
      id: (index + 1).toString(),
      type: q.type || 'short_answer',
      question: q.question || 'Question text not available',
      options: Array.isArray(q.options) ? q.options : [],
      correctAnswer: q.correctAnswer || '',
      points: q.points || 10,
      order: index + 1,
      explanation: q.explanation || ''
    }));
  }

  /**
   * Extract questions using pattern matching
   */
  private extractWithPatternMatching(text: string, title: string, examType: string): ExamQuestion[] {
    console.log('🔍 Starting pattern matching extraction...');
    console.log('📄 Text length for pattern matching:', text.length);
    
    const questions: ExamQuestion[] = [];
    let questionIndex = 1;

    // Clean text - remove section headers and non-question content
    const cleanText = this.cleanDocumentText(text);
    console.log('🧹 Cleaned text length:', cleanText.length);

    // Enhanced question patterns for exam documents
    const patterns = [
      /^\d+\.\s+([^?]+[?])/gm,  // "1. What is...?"
      /^[a-z]\)\s+([^?]+[?])/gm, // "a) What is...?"
      /^[A-Z]\)\s+([^?]+[?])/gm, // "A) What is...?"
      /(What|How|Why|When|Where|Which|Explain|Describe|Define|Calculate|Solve|Find|Determine)[^?]*[?]/gi,
      /(True|False)[\s\S]*?[?]/gi, // True/False questions
      /(Choose|Select|Pick)[^?]*[?]/gi // Choose/Select questions
    ];

    console.log('🔍 Applying question patterns...');
    patterns.forEach((pattern, index) => {
      const matches = cleanText.match(pattern);
      if (matches) {
        console.log(`📝 Pattern ${index + 1} found ${matches.length} matches`);
        matches.forEach(match => {
          const questionText = match
            .replace(/^\d+\.\s+/, '')
            .replace(/^[a-z]\)\s+/, '')
            .replace(/^[A-Z]\)\s+/, '')
            .trim();

          if (this.isValidQuestion(questionText)) {
            const question = this.createQuestionFromText(questionText, questionIndex, title);
            questions.push(question);
            questionIndex++;
            console.log(`✅ Added question ${questionIndex - 1}: ${questionText.substring(0, 50)}...`);
          }
        });
      }
    });

    // If no questions found, create from content
    if (questions.length === 0) {
      console.log('⚠️ No questions found with patterns, creating fallback questions...');
      return this.createFallbackQuestions(title, examType);
    }

    console.log(`✅ Pattern matching extracted ${questions.length} questions`);
    return questions;
  }

  /**
   * Clean document text by removing non-question content
   */
  private cleanDocumentText(text: string): string {
    return text
      .split('\n')
      .filter(line => {
        const trimmed = line.trim();
        return !trimmed.match(/^(Introduction|Chapter|Section|Part|Unit)\s+\d+/i) &&
               !trimmed.match(/^[A-Z\s]{10,}$/i) &&
               trimmed.length > 10;
      })
      .join('\n');
  }

  /**
   * Check if text is a valid question
   */
  private isValidQuestion(text: string): boolean {
    return text.length > 15 && 
           text.includes('?') && 
           !text.match(/^(Introduction|Chapter|Section|Part|Unit)/i) &&
           !text.match(/^[A-Z\s]{10,}$/i);
  }

  /**
   * Create question object from text
   */
  private createQuestionFromText(text: string, index: number, title: string): ExamQuestion {
    const questionType = this.determineQuestionType(text);
    let options: string[] = [];
    let correctAnswer = '';
    
    if (questionType === 'multiple_choice') {
      const parsed = this.parseMultipleChoiceQuestion(text);
      options = parsed.options;
      correctAnswer = parsed.correctAnswer || (options.length > 0 ? options[0] : 'Option A');
    } else if (questionType === 'true_false') {
      correctAnswer = 'true'; // Default, could be improved
    } else {
      correctAnswer = 'Student should provide a detailed answer';
    }
    
    return {
      id: index.toString(),
      type: questionType,
      question: this.cleanQuestionText(text),
      options: options,
      correctAnswer: correctAnswer,
      points: 10,
      order: index,
      explanation: `Question ${index} from ${title}`
    };
  }

  /**
   * Parse multiple choice question to extract options
   */
  private parseMultipleChoiceQuestion(text: string): { options: string[], correctAnswer: string } {
    const options: string[] = [];
    let correctAnswer = '';
    
    // Look for patterns like "a) Option text b) Option text c) Option text d) Option text"
    const optionPatterns = [
      /([a-z]\)\s+[^a-z\)]+?)(?=\s+[a-z]\)|$)/gi,  // a) Option b) Option c) Option d) Option
      /([A-Z]\)\s+[^A-Z\)]+?)(?=\s+[A-Z]\)|$)/gi,  // A) Option B) Option C) Option D) Option
      /(\d+\)\s+[^\d\)]+?)(?=\s+\d+\)|$)/gi        // 1) Option 2) Option 3) Option 4) Option
    ];
    
    for (const pattern of optionPatterns) {
      const matches = text.match(pattern);
      if (matches && matches.length >= 2) {
        options.push(...matches.map(match => match.trim()));
        correctAnswer = matches[0]; // Default to first option
        break;
      }
    }
    
    // If no structured options found, try to extract from inline text
    if (options.length === 0) {
      const inlineOptions = this.extractInlineOptions(text);
      if (inlineOptions.length > 0) {
        options.push(...inlineOptions);
        correctAnswer = inlineOptions[0];
      }
    }
    
    // Fallback to generic options if nothing found
    if (options.length === 0) {
      options.push('Option A', 'Option B', 'Option C', 'Option D');
      correctAnswer = 'Option A';
    }
    
    return { options, correctAnswer };
  }

  /**
   * Extract options from inline text like "Loan from bank b) Furniture c) Salaries d) Rent expense"
   */
  private extractInlineOptions(text: string): string[] {
    const options: string[] = [];
    
    // Look for patterns like "text b) text c) text d) text"
    const inlinePattern = /([^a-z\)]+?)\s+([a-z]\)\s+[^a-z\)]+?)(?:\s+([a-z]\)\s+[^a-z\)]+?))?(?:\s+([a-z]\)\s+[^a-z\)]+?))?(?:\s+([a-z]\)\s+[^a-z\)]+?))?/gi;
    const match = inlinePattern.exec(text);
    
    if (match) {
      // Extract the first part before options
      const firstPart = match[1].trim();
      if (firstPart.length > 0) {
        options.push(firstPart);
      }
      
      // Extract the lettered options
      for (let i = 2; i < match.length; i++) {
        if (match[i] && match[i].trim().length > 0) {
          options.push(match[i].trim());
        }
      }
    }
    
    return options;
  }

  /**
   * Clean question text by removing option markers
   */
  private cleanQuestionText(text: string): string {
    // Remove option markers like "a) ", "b) ", "A) ", "B) ", "1) ", "2) "
    return text
      .replace(/^[a-z]\)\s+/gm, '')
      .replace(/^[A-Z]\)\s+/gm, '')
      .replace(/^\d+\)\s+/gm, '')
      .trim();
  }

  /**
   * Determine question type from text
   */
  private determineQuestionType(text: string): 'multiple_choice' | 'true_false' | 'short_answer' | 'essay' {
    const lowerText = text.toLowerCase();
    
    // Check for true/false questions
    if (lowerText.includes('true') || lowerText.includes('false') || 
        lowerText.includes('t/f') || lowerText.includes('correct') && lowerText.includes('incorrect')) {
      return 'true_false';
    }
    
    // Check for multiple choice questions
    if (lowerText.includes('which') || lowerText.includes('choose') || 
        lowerText.includes('select') || lowerText.includes('pick') ||
        /[a-z]\)\s+/.test(text) || /[A-Z]\)\s+/.test(text) || /\d+\)\s+/.test(text)) {
      return 'multiple_choice';
    }
    
    // Check for essay questions
    if (lowerText.includes('explain') || lowerText.includes('describe') || 
        lowerText.includes('discuss') || lowerText.includes('analyze') ||
        lowerText.includes('compare') || lowerText.includes('evaluate')) {
      return 'essay';
    }
    
    return 'short_answer';
  }

  /**
   * Create fallback questions when no questions are found
   */
  private createFallbackQuestions(title: string, examType: string): ExamQuestion[] {
    console.log(`🔄 Creating fallback questions for ${title} (${examType})`);
    
    const subject = this.extractSubjectFromTitle(title);
    const questions: ExamQuestion[] = [];

    // Create more realistic exam questions based on subject
    const questionTemplates = this.getQuestionTemplates(subject, examType);

    for (let i = 1; i <= 5; i++) {
      const template = questionTemplates[(i - 1) % questionTemplates.length];
      questions.push({
        id: i.toString(),
        type: template.type,
        question: template.question,
        options: template.options,
        correctAnswer: template.correctAnswer,
        points: 10,
        order: i,
        explanation: `Question ${i} based on ${title} - ${subject} exam`
      });
    }

    console.log(`✅ Created ${questions.length} fallback questions for ${title}`);
    return questions;
  }

  private getQuestionTemplates(subject: string, _examType: string): any[] {
    const templates = {
      'ICT': [
        {
          type: 'multiple_choice',
          question: 'What does ICT stand for?',
          options: ['Information and Communication Technology', 'International Computer Technology', 'Internet Communication Tools', 'Integrated Computer Technology'],
          correctAnswer: 'Information and Communication Technology'
        },
        {
          type: 'true_false',
          question: 'HTML is a programming language.',
          options: [],
          correctAnswer: 'false'
        },
        {
          type: 'short_answer',
          question: 'Explain the difference between RAM and ROM.',
          options: [],
          correctAnswer: 'Student should explain RAM is volatile memory and ROM is non-volatile memory'
        }
      ],
      'Mathematics': [
        {
          type: 'multiple_choice',
          question: 'What is 15 + 27?',
          options: ['42', '32', '52', '22'],
          correctAnswer: '42'
        },
        {
          type: 'short_answer',
          question: 'Solve for x: 2x + 5 = 15',
          options: [],
          correctAnswer: 'x = 5'
        }
      ],
      'Science': [
        {
          type: 'multiple_choice',
          question: 'What is the chemical symbol for water?',
          options: ['H2O', 'CO2', 'O2', 'H2'],
          correctAnswer: 'H2O'
        },
        {
          type: 'true_false',
          question: 'The sun is a star.',
          options: [],
          correctAnswer: 'true'
        }
      ]
    };

    return templates[subject as keyof typeof templates] || [
      {
        type: 'short_answer',
        question: `What is the importance of ${subject.toLowerCase()} in education?`,
        options: [],
        correctAnswer: 'Student should provide a detailed explanation'
      }
    ];
  }

  /**
   * Extract subject from exam title
   */
  private extractSubjectFromTitle(title: string): string {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('ict')) return 'ICT';
    if (lowerTitle.includes('math')) return 'Mathematics';
    if (lowerTitle.includes('science')) return 'Science';
    if (lowerTitle.includes('english')) return 'English';
    if (lowerTitle.includes('history')) return 'History';
    if (lowerTitle.includes('computer')) return 'Computer Science';
    return 'General Knowledge';
  }
}

export default ExamExtractionService;
