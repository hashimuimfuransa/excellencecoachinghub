import { psychometricAIEngine } from './psychometricAIEngine';
import { GeneratedPsychometricTest } from '../models/GeneratedPsychometricTest';

export interface PsychometricTestQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  category: string;
  traits?: string[];
  weight?: number;
}

export interface GeneratedPsychometricTestStructure {
  questions: PsychometricTestQuestion[];
  title: string;
  description: string;
  timeLimit: number;
  categories: string[];
}

export class PsychometricTestGenerator {
  private aiEngine = psychometricAIEngine;

  constructor() {
    console.log('🧠 Psychometric Test Generator initialized with dedicated AI engine');
  }

  async generatePsychometricTest(params: {
    jobTitle: string;
    jobDescription: string;
    industry: string;
    experienceLevel: string;
    skills: string[];
    questionCount: number;
    testLevel: string;
    timeLimit: number;
    userId: string;
    jobId: string;
    categories: string[];
  }): Promise<GeneratedPsychometricTestStructure> {
    try {
      const { 
        jobTitle, 
        jobDescription, 
        industry, 
        experienceLevel, 
        skills, 
        questionCount, 
        testLevel, 
        timeLimit, 
        userId, 
        jobId, 
        categories 
      } = params;
      
      // Fetch previous questions for this user and job to avoid duplicates
      let previousQuestions: string[] = [];
      try {
        previousQuestions = await GeneratedPsychometricTest.getPreviousQuestionsByUser(jobId, userId);
        console.log(`🔍 Found ${previousQuestions.length} previous questions for user ${userId} and job ${jobId}`);
      } catch (error) {
        console.warn('Warning: Could not fetch previous questions for psychometric test:', error);
        // Continue with empty array if fetch fails
        previousQuestions = [];
      }
      
      const prompt = this.createGenerationPrompt({
        jobTitle,
        jobDescription,
        industry,
        experienceLevel,
        skills,
        questionCount,
        testLevel,
        timeLimit,
        categories,
        previousQuestions
      });
      
      // Use the psychometric AI engine with built-in retry logic
      let text: string;
      try {
        console.log(`🎓 Generating psychometric test using dedicated AI engine`);
        text = await this.aiEngine.generatePsychometricContent(prompt, {
          retries: 3,
          timeout: 45000, // Longer timeout for complex generation
          priority: 'high', // High priority for test generation
          temperature: 0.3 // Lower temperature for more consistent results
        });
      } catch (aiError: any) {
        console.error('🎓 Psychometric AI engine failed, using fallback questions:', aiError.message);
        // Use fallback questions when AI engine is unavailable
        return this.generateFallbackQuestions(params);
      }
      
      console.log('🧠 Raw psychometric test response received');
      
      try {
        const result = this.extractJsonFromResponse(text);
        
        // Validate and clean up the generated questions
        if (result.questions && Array.isArray(result.questions)) {
          // Validate each question for completeness and quality
          result.questions = result.questions.map((question: any, index: number) => {
            // Validate question structure
            if (!question.question || typeof question.question !== 'string' || question.question.trim().length === 0) {
              console.warn(`⚠️ Question ${index + 1} has invalid question text, using fallback`);
              question.question = `${testLevel} level question ${index + 1} for ${jobTitle} position`;
            }
            
            // Validate options
            if (!question.options || !Array.isArray(question.options) || question.options.length < 2) {
              console.warn(`⚠️ Question ${index + 1} has invalid options, using fallback`);
              question.options = [
                "Strongly Agree",
                "Agree",
                "Neutral",
                "Disagree",
                "Strongly Disagree"
              ];
            }
            
            // Validate correct answer
            if (typeof question.correctAnswer !== 'number' || 
                question.correctAnswer < 0 || 
                question.correctAnswer >= question.options.length) {
              console.warn(`⚠️ Question ${index + 1} has invalid correct answer, using default`);
              question.correctAnswer = Math.floor(question.options.length / 2); // Middle option
            }
            
            // Validate explanation
            if (!question.explanation || typeof question.explanation !== 'string' || question.explanation.trim().length === 0) {
              console.warn(`⚠️ Question ${index + 1} has invalid explanation, using fallback`);
              question.explanation = `This question assesses ${question.category || 'general'} skills for the ${jobTitle} position.`;
            }
            
            // Validate category
            if (!question.category || typeof question.category !== 'string' || question.category.trim().length === 0) {
              console.warn(`⚠️ Question ${index + 1} has invalid category, using default`);
              question.category = categories && categories.length > 0 ? categories[0] : 'general';
            }
            
            // Set default weight if not provided
            if (typeof question.weight !== 'number' || question.weight <= 0) {
              question.weight = 1;
            }
            
            return question;
          });
          
          // Check for incomplete questions
          const hasIncompleteQuestions = result.questions.some((q: any) => 
            !q.question ||
            !Array.isArray(q.options) ||
            q.options.length < 2 ||
            typeof q.correctAnswer !== 'number' ||
            !q.explanation ||
            !q.category
          );
          
          if (hasIncompleteQuestions) {
            console.error('⚠️ Some questions are still incomplete after validation');
          } else {
            console.log('✅ All questions passed validation');
          }
        } else {
          console.error('⚠️ No valid questions array found in AI response');
          throw new Error('Invalid response structure - no questions array');
        }
        
        return result;
      } catch (parseError) {
        console.error('Failed to parse psychometric test response:', parseError);
        
        // Use the better fallback system instead of placeholder questions
        console.log('⚠️ Using fallback questions due to AI parsing error');
        return this.generateFallbackQuestions(params);
      }
    } catch (error: any) {
      console.error('Error generating psychometric test:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      // Preserve the original error code if it exists
      if (error.code) {
        throw error;
      }
      
      throw new Error('Failed to generate psychometric test');
    }
  }

  /**
   * Helper function to extract JSON from AI responses
   */
  private extractJsonFromResponse(text: string): GeneratedPsychometricTestStructure {
    // First try to parse the entire response as JSON
    try {
      return JSON.parse(text);
    } catch (error) {
      // If that fails, try to extract JSON from markdown code blocks
      const jsonMatch = text.match(/```(?:json)?\s*({.*?})\s*```/s);
      if (jsonMatch && jsonMatch[1]) {
        try {
          return JSON.parse(jsonMatch[1]);
        } catch (innerError) {
          console.error('Failed to parse JSON from code block:', innerError);
        }
      }
      
      // If that fails, try to find JSON-like content
      const jsonStart = text.indexOf('{');
      const jsonEnd = text.lastIndexOf('}') + 1;
      
      if (jsonStart !== -1 && jsonEnd > jsonStart) {
        const jsonString = text.substring(jsonStart, jsonEnd);
        try {
          return JSON.parse(jsonString);
        } catch (innerError) {
          console.error('Failed to parse extracted JSON:', innerError);
        }
      }
      
      // If all else fails, throw an error
      throw new Error(`Could not extract valid JSON from AI response: ${text.substring(0, 200)}...`);
    }
  }

  /**
   * Create the generation prompt for psychometric tests
   */
  private createGenerationPrompt(params: {
    jobTitle: string;
    jobDescription: string;
    industry: string;
    experienceLevel: string;
    skills: string[];
    questionCount: number;
    testLevel: string;
    timeLimit: number;
    categories: string[];
    previousQuestions: string[];
  }): string {
    const {
      jobTitle,
      jobDescription,
      industry,
      experienceLevel,
      skills,
      questionCount,
      testLevel,
      timeLimit,
      categories,
      previousQuestions
    } = params;
    
    return `You are an expert psychometric test designer. Create a psychometric test only for the role of ${jobTitle}. Do not include technical or job-knowledge questions. The test should only measure psychological and cognitive traits relevant to the role.

**Focus areas:**
- Cognitive ability (numerical, verbal, abstract reasoning)
- Problem-solving and logical thinking
- Personality traits (teamwork, leadership, adaptability, integrity, attention to detail, stress tolerance, etc.)
- Situational judgment and workplace behavior

Job Context:
- Job Description: ${jobDescription}
- Industry: ${industry}
- Experience Level: ${experienceLevel}
- Required Skills: ${skills.length > 0 ? skills.join(', ') : 'General skills for the position'}

Test Specifications:
- Total Questions: EXACTLY ${questionCount} questions (this is critical)
- Test Level: ${testLevel}
- Time Allocation: ${timeLimit} minutes (1 minute per question)

**CRITICAL Guidelines:**
1. Create exactly ${questionCount} unique, numbered questions (Q1, Q2, Q3, etc.)
2. Question types: multiple-choice reasoning, situational judgment, personality inventory
3. Exclude ALL technical/job-specific knowledge questions (e.g., coding, accounting, finance, industry facts)
4. ONLY measure psychological and cognitive traits
5. Ensure NO DUPLICATE questions or similar questions - each must be completely unique
${previousQuestions.length > 0 ? `6. CRITICAL: Avoid generating questions similar to these previously used questions for this user:
   ${previousQuestions.slice(0, 20).map((q, i) => `- "${q}"`).join('\n   ')}
   ${previousQuestions.length > 20 ? `   ... and ${previousQuestions.length - 20} more questions` : ''}
   Generate completely different questions that test the same competencies but with different wording, scenarios, and approaches.` : ''}
7. PRIMARY FOCUS AREAS: Only generate questions aligned with these psychometric focus areas selected by the user:
${categories.map((category, index) => `   ${index + 1}. ${category.replace(/_/g, ' ')}`).join('\n')}
   Do not include any questions outside of these selected categories.

Assessment Areas (distribute questions evenly across the selected focus areas):
${categories.map((category, index) => `${index + 1}. ${category.replace(/_/g, ' ').toUpperCase()}`).join('\n')}

**Response Format:**
Return a valid JSON object with this exact structure:
{
  "title": "Psychometric Assessment for ${jobTitle}",
  "description": "AI-generated psychometric test for ${jobTitle} position measuring cognitive abilities and personality traits",
  "timeLimit": ${timeLimit},
  "categories": [${categories.map(c => `"${c}"`).join(', ')}],
  "questions": [
    {
      "question": "The question text here",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4", "Option 5"],
      "correctAnswer": 2,
      "explanation": "Explanation of why this is the best answer",
      "category": "${categories[0] || 'general'}",
      "traits": ["trait1", "trait2"],
      "weight": 1
    }
    // ... ${questionCount - 1} more questions
  ]
}

**IMPORTANT:**
- Return ONLY valid JSON without any additional text, markdown, or explanations
- Ensure all ${questionCount} questions are included
- Make sure each question is unique and tests different aspects
- Use appropriate difficulty level for ${testLevel} (${testLevel === 'easy' ? 'fundamental concepts' : testLevel === 'intermediate' ? 'applied understanding' : 'advanced reasoning'})
- Questions should be relevant to the ${jobTitle} role
- Distribute questions evenly across the selected categories: ${categories.join(', ')}
- Each question must have exactly one correct answer
- The correctAnswer field should be a zero-based index (0 for first option, 1 for second, etc.)
- Include relevant personality traits for each question
- All fields are required in each question object
`;
  }

  /**
   * Generate fallback questions when AI engine is unavailable
   */
  private generateFallbackQuestions(params: {
    jobTitle: string;
    questionCount: number;
    testLevel: string;
    categories: string[];
  }): GeneratedPsychometricTestStructure {
    const { jobTitle, questionCount, testLevel, categories } = params;
    
    console.log('⚠️ Generating fallback questions due to AI engine unavailability');
    
    const questions: PsychometricTestQuestion[] = [];
    let category: string = 'cognitive';
    if (categories && categories.length > 0 && categories[0]) {
      category = categories[0];
    }
    
    for (let i = 0; i < questionCount; i++) {
      questions.push({
        question: `${testLevel} level psychometric question ${i + 1} for ${jobTitle} position`,
        options: [
          "Strongly Agree",
          "Agree",
          "Neutral",
          "Disagree",
          "Strongly Disagree"
        ],
        correctAnswer: 2, // Neutral as default
        explanation: `This is a fallback ${category} question for the ${jobTitle} position at ${testLevel} level.`,
        category: category,
        traits: [category],
        weight: 1
      });
    }
    
    return {
      questions,
      title: `Fallback Psychometric Assessment for ${jobTitle}`,
      description: `Fallback psychometric test for ${jobTitle} position when AI generation is unavailable`,
      timeLimit: questionCount, // 1 minute per question
      categories: categories.length > 0 ? categories : ['cognitive']
    };
  }

  /**
   * Check if the psychometric AI engine is available
   */
  public async isAvailable(): Promise<boolean> {
    try {
      return await this.aiEngine.testModelAvailability();
    } catch (error) {
      console.error('❌ Psychometric test generator availability check failed:', error);
      return false;
    }
  }

  /**
   * Get system status for the psychometric test generator
   */
  public getSystemStatus(): any {
    return this.aiEngine.getSystemStatus();
  }
}

export const psychometricTestGenerator = new PsychometricTestGenerator();