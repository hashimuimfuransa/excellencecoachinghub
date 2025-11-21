import { centralAIManager, AIGenerationOptions } from './centralAIManager';
import { jsonrepair } from 'jsonrepair';
import { GeneratedPsychometricTest } from '../models/GeneratedPsychometricTest';

export class AIService {
  private aiManager = centralAIManager;

  constructor() {
    console.log('🤖 AI Service initialized with Central AI Manager');
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
  }): Promise<{
    questions: Array<{
      question: string;
      options: string[];
      correctAnswer: number;
      explanation: string;
      category: string;
    }>;
  }> {
    try {
      const { jobTitle, jobDescription, industry, experienceLevel, skills, questionCount, testLevel, timeLimit, userId, jobId, categories } = params;
      
      // Fetch previous questions for this user and job to avoid duplicates
      let previousQuestions: string[] = [];
      try {
        previousQuestions = await GeneratedPsychometricTest.getPreviousQuestionsByUser(jobId, userId);
        console.log(`🔍 Found ${previousQuestions.length} previous questions for user ${userId} and job ${jobId}`);
      } catch (error) {
        console.warn('Warning: Could not fetch previous questions:', error);
        // Continue with empty array if fetch fails
        previousQuestions = [];
      }
      
      // Optimize for faster processing: reduce question count and use smaller chunks
      const maxQuestionCount = Math.min(20, questionCount); // Limit to 20 questions maximum for faster processing
      const chunkSize = 10;
      let allQuestions: any[] = [];
      
      // Use only two chunks maximum for faster processing
      const totalChunks = Math.min(2, Math.ceil(maxQuestionCount / chunkSize));
      
      // Create promises for simultaneous chunk processing
      const chunkPromises: Promise<any[]>[] = [];
      
      // Generate chunk promises
      for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        // Calculate how many questions to generate in this chunk
        const questionsInThisChunk = Math.min(chunkSize, maxQuestionCount - (chunkIndex * chunkSize));
        
        // Create a promise for this chunk
        const chunkPromise = this.generateSingleChunk({
          jobTitle,
          jobDescription,
          industry,
          experienceLevel,
          skills,
          testLevel,
          timeLimit,
          questionCount: maxQuestionCount,
          categories,
          questionsInThisChunk,
          chunkIndex,
          totalChunks,
          previousQuestions: [...previousQuestions, ...allQuestions.map(q => q.question)]
        });
        
        chunkPromises.push(chunkPromise);
      }
      
      // Process all chunks simultaneously
      try {
        const chunkResults = await Promise.all(chunkPromises);
        
        // Combine results from all chunks
        for (const chunkQuestions of chunkResults) {
          allQuestions.push(...chunkQuestions);
        }
        
        console.log(`✅ Successfully processed ${chunkResults.length} chunks simultaneously with ${allQuestions.length} total questions`);
      } catch (error) {
        console.error('❌ Error processing chunks simultaneously:', error);
        throw error;
      }
      
      // Process the chunked questions
      console.log('🤖 Processing chunked psychometric test response');
      
      // Validate and clean up the generated questions
      let processedQuestions = [...allQuestions]; // Create a copy to avoid modifying the constant
      if (processedQuestions.length > 0) {
        // Validate each question for completeness and quality
        processedQuestions = processedQuestions.map((question: any, index: number) => {
          // Handle different question field names from AI
          let questionText = '';
          if (question.question && typeof question.question === 'string') {
            questionText = question.question;
          } else if (question.question_text && typeof question.question_text === 'string') {
            questionText = question.question_text;
          } else {
            console.warn(`⚠️ Question ${index + 1} has invalid question text, using fallback`);
            questionText = `${testLevel} level question ${index + 1} for ${jobTitle} position`;
          }
          
          // Update the question object to use the standard field name
          question.question = questionText;

          // Validate options - handle both array and object formats
          let optionsArray: string[] = [];
          if (!question.options) {
            console.warn(`⚠️ Question ${index + 1} has no options, using fallback`);
            optionsArray = ["Option A", "Option B", "Option C", "Option D"];
          } else if (Array.isArray(question.options)) {
            // Handle array format
            if (question.options.length < 2) {
              console.warn(`⚠️ Question ${index + 1} has insufficient options, using fallback`);
              optionsArray = ["Option A", "Option B", "Option C", "Option D"];
            } else {
              // Ensure all options are strings and not empty
              optionsArray = question.options.map((option: any, optIndex: number) => {
                if (!option || typeof option !== 'string' || option.trim().length === 0) {
                  return `Option ${String.fromCharCode(65 + optIndex)}`;
                }
                return option.trim();
              });
            }
          } else if (typeof question.options === 'object') {
            // Handle object format (e.g., {"A": "Option text", "B": "Option text"})
            const optionKeys = Object.keys(question.options);
            if (optionKeys.length < 2) {
              console.warn(`⚠️ Question ${index + 1} has insufficient options in object format, using fallback`);
              optionsArray = ["Option A", "Option B", "Option C", "Option D"];
            } else {
              optionsArray = optionKeys.map(key => {
                const optionValue = question.options[key];
                if (!optionValue || typeof optionValue !== 'string' || optionValue.trim().length === 0) {
                  return `Option ${key}`;
                }
                return optionValue.trim();
              });
            }
          } else {
            console.warn(`⚠️ Question ${index + 1} has invalid options format, using fallback`);
            optionsArray = ["Option A", "Option B", "Option C", "Option D"];
          }
          
          question.options = optionsArray;

          // Validate correct answer - handle both number and letter formats
          let correctAnswerIndex: number = 0;
          if (typeof question.correctAnswer === 'number') {
            // Handle numeric format
            if (question.correctAnswer >= 0 && question.correctAnswer < question.options.length) {
              correctAnswerIndex = question.correctAnswer;
            } else {
              console.warn(`⚠️ Question ${index + 1} has out-of-range numeric correctAnswer, defaulting to 0`);
              correctAnswerIndex = 0;
            }
          } else if (typeof question.correctAnswer === 'string') {
            // Handle letter format (e.g., "A", "B", "C", "D")
            const letterAnswer = question.correctAnswer.toUpperCase().trim();
            const letterToIndex: Record<string, number> = { 'A': 0, 'B': 1, 'C': 2, 'D': 3, 'E': 4 };
            if (letterToIndex[letterAnswer] !== undefined && letterToIndex[letterAnswer] < question.options.length) {
              correctAnswerIndex = letterToIndex[letterAnswer];
            } else {
              console.warn(`⚠️ Question ${index + 1} has invalid letter correctAnswer "${letterAnswer}", defaulting to 0`);
              correctAnswerIndex = 0;
            }
          } else {
            console.warn(`⚠️ Question ${index + 1} has invalid correctAnswer type, defaulting to 0`);
            correctAnswerIndex = 0;
          }
          
          question.correctAnswer = correctAnswerIndex;

          // Validate explanation
          if (!question.explanation || typeof question.explanation !== 'string' || question.explanation.trim().length === 0) {
            console.warn(`⚠️ Question ${index + 1} has invalid explanation, using fallback`);
            question.explanation = "This is the correct answer for this question.";
          }

          // Clean up category values with comprehensive normalization
          let category: string = 'cognitive'; // Default category
          if (question.category && typeof question.category === 'string') {
            category = question.category.toLowerCase().trim().replace(/\s+/g, '_');
            
            // Allow all categories - no validation needed
            console.log(`🔄 Category mapping: "${question.category}" → "${category}"`);
          } else {
            console.log(`⚠️ Question ${index + 1} missing or invalid category, using default: ${category}`);
          }
          
          return {
            question: question.question.trim(),
            options: question.options,
            correctAnswer: question.correctAnswer,
            explanation: question.explanation.trim(),
            category: category
          };
        });

        // Filter out any completely invalid questions
        processedQuestions = processedQuestions.filter((question: any) => 
          question.question && 
          question.options && 
          Array.isArray(question.options) && 
          question.options.length >= 2 &&
          typeof question.correctAnswer === 'number' &&
          question.explanation
        );
        
        // Ensure exact question count
        if (processedQuestions.length > maxQuestionCount) {
          console.log(`⚠️ AI generated ${processedQuestions.length} valid questions, trimming to ${maxQuestionCount}`);
          processedQuestions = processedQuestions.slice(0, maxQuestionCount);
        } else if (processedQuestions.length < maxQuestionCount) {
          console.log(`⚠️ AI generated ${processedQuestions.length} valid questions, padding to ${maxQuestionCount}`);
          // Add high-quality fallback questions to reach the target count
          const needed = maxQuestionCount - processedQuestions.length;
          
          for (let i = 0; i < needed; i++) {
            const questionNum = processedQuestions.length + 1;
            const category = 'cognitive';
            
            processedQuestions.push({
              question: `As a ${jobTitle} professional in the ${industry} industry, how would you approach a ${testLevel} level challenge that requires ${category.replace(/_/g, ' ')}?`,
              options: [
                "Take a systematic and analytical approach",
                "Rely on past experience only",
                "Avoid the challenge if possible",
                "Ask others to handle it instead"
              ],
              correctAnswer: 0,
              explanation: "A systematic and analytical approach demonstrates the professional skills required for this role.",
              category: category
            });
          }
        }
        
        console.log(`🎉 Final test generation complete with ${processedQuestions.length} questions`);
        
        return {
          questions: processedQuestions
        };
      } else {
        // If no questions were generated, provide fallback questions
        console.warn('⚠️ No valid questions generated, providing fallback questions');
        const fallbackQuestions = this.generateFallbackQuestions({
          jobTitle,
          industry,
          questionCount: Math.min(20, questionCount), // Limit fallback questions to 20 for faster processing
          testLevel,
          categories
        });
        
        return {
          questions: fallbackQuestions
        };
      }
    } catch (error) {
      console.error('❌ Error in AI service:', error);
      throw error;
    }
  }

  private async generateSingleChunk(params: {
    jobTitle: string;
    jobDescription: string;
    industry: string;
    experienceLevel: string;
    skills: string[];
    testLevel: string;
    timeLimit: number;
    questionCount: number;
    categories: string[];
    questionsInThisChunk: number;
    chunkIndex: number;
    totalChunks: number;
    previousQuestions: string[];
  }): Promise<any[]> {
    const {
      jobTitle,
      jobDescription,
      industry,
      experienceLevel,
      skills,
      testLevel,
      timeLimit,
      questionCount,
      categories,
      questionsInThisChunk,
      chunkIndex,
      totalChunks,
      previousQuestions
    } = params;

    console.log(`🎓 Generating chunk ${chunkIndex + 1}/${totalChunks} with ${questionsInThisChunk} questions`);
    
    const chunkPrompt = `You are an expert psychometric test designer. Create a psychometric test only for the role of ${jobTitle}. Do not include technical or job-knowledge questions. The test should only measure psychological and cognitive traits relevant to the role.

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
- Total Questions: EXACTLY ${questionsInThisChunk} questions (this is critical)
- Test Level: ${testLevel}
- Time Allocation: ${Math.ceil(questionsInThisChunk * (timeLimit / questionCount))} minutes (${timeLimit / questionCount} minutes per question)

**CRITICAL Guidelines:**
1. Create exactly ${questionsInThisChunk} unique, numbered questions (Q1, Q2, Q3, etc.)
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

Requirements:
- Each question must have exactly 4 options
- Only ONE correct answer per question
- Clear, professional language appropriate for ${experienceLevel} level
- Questions must be directly relevant to ${jobTitle} role in ${industry}
- Provide detailed explanations for correct answers

Generate all ${questionsInThisChunk} questions now in valid JSON format with a "questions" array:`;

    // Use the enhanced AI manager with built-in retry logic
    let text: string;
    try {
      console.log(`🎓 Generating psychometric test chunk ${chunkIndex + 1}/${totalChunks}`);
      text = await this.aiManager.generateContent(chunkPrompt, {
        retries: 2, // Reduced retries for faster processing
        timeout: 20000, // Reduced timeout for faster processing
        priority: 'high',
        temperature: 0.3
      });
      
      console.log(`🤖 Raw psychometric test response received for chunk ${chunkIndex + 1}`);
      
      // Parse the chunk response
      const chunkResult = this.extractJsonFromResponse(text);
      
      // Extract questions from the chunk
      let chunkQuestions: any[] = [];
      
      // Handle different possible structures from AI
      if (chunkResult.questions && Array.isArray(chunkResult.questions)) {
        chunkQuestions = chunkResult.questions;
      } else if (chunkResult.data && chunkResult.data.questions && Array.isArray(chunkResult.data.questions)) {
        chunkQuestions = chunkResult.data.questions;
      } else if (Array.isArray(chunkResult)) {
        chunkQuestions = chunkResult;
      }
      
      if (chunkQuestions.length > 0) {
        console.log(`✅ Successfully generated ${chunkQuestions.length} questions from chunk ${chunkIndex + 1}`);
        return chunkQuestions;
      } else {
        console.warn(`⚠️ No questions found in chunk ${chunkIndex + 1} response`);
        return [];
      }
    } catch (chunkError: any) {
      console.error(`🎓 AI service failed for chunk ${chunkIndex + 1}:`, chunkError.message);
      return [];
    }
  }

  private generateFallbackQuestions(params: {
    jobTitle: string;
    industry: string;
    questionCount: number;
    testLevel: string;
    categories: string[];
  }): any[] {
    const { jobTitle, industry, questionCount, testLevel, categories } = params;

    console.warn('⚠️ Generating fallback questions');

    const fallbackQuestions = [];

    for (let i = 0; i < questionCount; i++) {
      const questionNum = i + 1;
      const category = categories[i % categories.length] || 'cognitive';
      
      const fallbackQuestion = {
        question: `As a ${jobTitle} professional in the ${industry} industry, how would you approach a ${testLevel} level challenge that requires ${category.replace(/_/g, ' ')}?`,
        options: [
          "Take a systematic and analytical approach",
          "Rely on past experience only",
          "Avoid the challenge if possible",
          "Ask others to handle it instead"
        ],
        correctAnswer: 0,
        explanation: "A systematic and analytical approach demonstrates the professional skills required for this role.",
        category: category
      };
      
      fallbackQuestions.push(fallbackQuestion);
    }

    return fallbackQuestions;
  }

  /**
   * Helper function to extract JSON from AI responses
   */
  private extractJsonFromResponse(text: string): any {
    let jsonText = text.trim();
    
    console.log('🔍 Raw AI response length:', jsonText.length);
    console.log('🔍 Raw AI response (first 1000 chars):', jsonText.substring(0, 1000));
    
    // Check if the response is actually JSON or just plain text
    if (!jsonText.startsWith('{') && !jsonText.startsWith('[')) {
      console.error('❌ AI response does not start with JSON object or array');
      // Try to find JSON anywhere in the response
      const jsonStart = jsonText.indexOf('{');
      const jsonArrayStart = jsonText.indexOf('[');
      
      if (jsonStart !== -1 && (jsonArrayStart === -1 || jsonStart < jsonArrayStart)) {
        // Found object start first
        const jsonEnd = jsonText.lastIndexOf('}');
        if (jsonEnd !== -1 && jsonEnd > jsonStart) {
          jsonText = jsonText.substring(jsonStart, jsonEnd + 1);
        }
      } else if (jsonArrayStart !== -1) {
        // Found array start first
        const jsonEnd = jsonText.lastIndexOf(']');
        if (jsonEnd !== -1 && jsonEnd > jsonArrayStart) {
          jsonText = jsonText.substring(jsonArrayStart, jsonEnd + 1);
        }
      } else {
        console.error('❌ No JSON object or array found in AI response');
        throw new Error('AI response does not contain valid JSON');
      }
    }
    
    // Remove markdown code blocks more aggressively
    jsonText = jsonText.replace(/^```json\s*/i, '').replace(/\s*```$/i, '');
    jsonText = jsonText.replace(/^```\s*/i, '').replace(/\s*```$/i, '');
    
    // Handle cases where the AI response might be wrapped in other text
    // Look for the first { and last } to extract the JSON object
    const firstBrace = jsonText.indexOf('{');
    const lastBrace = jsonText.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      jsonText = jsonText.substring(firstBrace, lastBrace + 1);
    } else {
      // If we can't find a JSON object, try to find a JSON array
      const firstBracket = jsonText.indexOf('[');
      const lastBracket = jsonText.lastIndexOf(']');
      
      if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
        jsonText = jsonText.substring(firstBracket, lastBracket + 1);
      }
    }
    
    // More aggressive cleanup for common AI response issues
    // First, let's check if we have unbalanced braces which might indicate truncation
    const openBraces = (jsonText.match(/{/g) || []).length;
    const closeBraces = (jsonText.match(/}/g) || []).length;
    const openBrackets = (jsonText.match(/\[/g) || []).length;
    const closeBrackets = (jsonText.match(/\]/g) || []).length;
    
    console.log(`🔧 Brace count - Open: ${openBraces}, Close: ${closeBraces}, Bracket count - Open: ${openBrackets}, Close: ${closeBrackets}`);
    
    // If we have unbalanced braces/brackets, this might be a truncated response
    if ((openBraces !== closeBraces) || (openBrackets !== closeBrackets)) {
      console.warn('⚠️ Unbalanced braces/brackets detected - possible truncated response');
      
      // Try to find the last complete object/array
      if (jsonText.endsWith('}') || jsonText.endsWith(']')) {
        // Already ends with a closing brace/bracket
        console.log('✅ Response already ends with closing brace/bracket');
      } else {
        // Try to truncate at the last complete object
        const lastCompleteObject = jsonText.lastIndexOf('},');
        const lastCompleteArrayItem = jsonText.lastIndexOf('],');
        
        if (lastCompleteObject !== -1 || lastCompleteArrayItem !== -1) {
          const truncateAt = Math.max(lastCompleteObject, lastCompleteArrayItem) + 1;
          jsonText = jsonText.substring(0, truncateAt) + (jsonText.includes('}') ? '}' : ']');
          console.log('🔧 Truncated response at last complete item');
        }
      }
    }
    
    // Clean up common JSON issues
    jsonText = jsonText
      .replace(/,\s*}/g, '}')  // Remove trailing commas before }
      .replace(/,\s*]/g, ']')  // Remove trailing commas before ]
      .replace(/\r\n/g, '\\n')  // Normalize line endings
      .replace(/\r/g, '\\n')
      .replace(/\n/g, '\\n')     // Replace newlines with escaped newlines
      .replace(/\t/g, ' ')        // Replace tabs with spaces
      .replace(/\s+/g, ' ')       // Normalize whitespace
      .trim();
    
    // Additional cleanup for common AI response issues
    jsonText = jsonText.replace(/\\'/g, "'");  // Unescape single quotes
    jsonText = jsonText.replace(/\\"/g, '"'); // Unescape double quotes
    
    // Handle escaped unicode characters
    jsonText = jsonText.replace(/\\u([0-9a-fA-F]{4})/g, (match, hex) => {
      try {
        return String.fromCharCode(parseInt(hex, 16));
      } catch (e) {
        return match;
      }
    });
    
    // Remove any invisible/control characters that might cause issues
    jsonText = jsonText.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '');
    
    // Additional cleanup for control characters that might cause JSON parsing issues
    jsonText = jsonText.replace(/[\x00-\x1F]/g, function (match) {
      const charCode = match.charCodeAt(0);
      // Allow common whitespace characters (tab, newline, carriage return)
      if (charCode === 9 || charCode === 10 || charCode === 13) {
        return match;
      }
      // Replace other control characters with space
      return ' ';
    });
    
    // Fix escaped characters that might cause issues
    jsonText = jsonText.replace(/\\n/g, '\n');  // Fix escaped newlines
    jsonText = jsonText.replace(/\\r/g, '\r');  // Fix escaped carriage returns
    jsonText = jsonText.replace(/\\t/g, '\t');  // Fix escaped tabs
    jsonText = jsonText.replace(/\\"/g, '"');  // Fix escaped quotes
    jsonText = jsonText.replace(/\\\\/g, '\\');  // Fix double escaped backslashes
    
    console.log('🔧 Cleaned JSON text length:', jsonText.length);
    console.log('🔧 Cleaned JSON text (first 500 chars):', jsonText.substring(0, 500));
    
    // Validate JSON structure before parsing
    if (jsonText.length === 0) {
      throw new Error('Empty JSON response after cleaning');
    }
    
    // Additional debugging - check the first few characters
    console.log('🔍 First 10 chars of cleaned JSON:', JSON.stringify(jsonText.substring(0, 10)));
    console.log('🔍 Char codes of first 10 chars:', [...jsonText.substring(0, 10)].map((c, i) => `${i}:${c.charCodeAt(0)}`).join(','));
    
    // Check if the string actually starts with { or [
    if (jsonText.charAt(0) !== '{' && jsonText.charAt(0) !== '[') {
      console.error('❌ JSON does not start with { or [');
      console.error('First char code:', jsonText.charAt(0).charCodeAt(0));
    }
    
    // Special fix for escaped characters at the beginning
    if (jsonText.startsWith('{\\')) {
      console.log('🔧 Fixing escaped characters at beginning of JSON');
      jsonText = jsonText.replace('{\\n', '{\n').replace('{\\r', '{\r').replace('{\\t', '{\t');
    }
    
    // More comprehensive fix for escaped characters throughout the JSON
    jsonText = jsonText.replace(/\\n/g, '\n');
    jsonText = jsonText.replace(/\\r/g, '\r');
    jsonText = jsonText.replace(/\\t/g, '\t');
    jsonText = jsonText.replace(/\\"/g, '\"');
    jsonText = jsonText.replace(/\\\\/g, '\\');
    
    try {
      // Try to parse the JSON
      const parsed = JSON.parse(jsonText);
      console.log('✅ Successfully parsed JSON');
      return parsed;
    } catch (error) {
      console.error('❌ Failed to parse JSON from AI response:', error);
      
      // Handle truncated JSON responses
      if (jsonText.length > 0) {
        // Check if JSON ends with incomplete content
        const trimmedJson = jsonText.trim();
        if (trimmedJson.endsWith(',') || trimmedJson.endsWith(':') || trimmedJson.endsWith('{') || trimmedJson.endsWith('[') || (trimmedJson.endsWith('"') && !trimmedJson.endsWith('"}'))) {
          console.log('🔧 Detected potentially truncated JSON, attempting repair');
          
          // Try to repair truncated JSON
          let repairedJson = jsonText;
          
          // Remove trailing commas or incomplete elements
          repairedJson = repairedJson.replace(/[,:\s]+$/, '');
          
          // Count opening and closing braces/brackets
          const openBraces = (repairedJson.match(/{/g) || []).length;
          const closeBraces = (repairedJson.match(/}/g) || []).length;
          const openBrackets = (repairedJson.match(/\[/g) || []).length;
          const closeBrackets = (repairedJson.match(/\]/g) || []).length;
          
          // Add missing closing braces/brackets
          for (let i = closeBraces; i < openBraces; i++) {
            repairedJson += '}';
          }
          for (let i = closeBrackets; i < openBrackets; i++) {
            repairedJson += ']';
          }
          
          try {
            console.log('🔧 Trying to parse repaired truncated JSON');
            return JSON.parse(repairedJson);
          } catch (repairError) {
            console.error('❌ Truncated JSON repair failed:', repairError);
          }
        }
      }
      
      // Special handling for the specific error we're seeing
      if (error instanceof SyntaxError && (error.message.includes('Expected property name or \'}\'') || error.message.includes('Bad control character in string literal') || error.message.includes("Expected ',' or ']'"))) {
        console.log('🔧 Trying special handling for truncated JSON or control character issues');
        
        // Handle bad control characters specifically
        if (error.message.includes('Bad control character in string literal')) {
          console.log('🔧 Detected bad control characters, attempting deep clean');
          
          // Deep clean of control characters in strings
          let deepCleanedJson = jsonText.replace(/([^\\])\\([bfnrtv\'"])|\\\\/g, '$1$2');
          
          // Remove any remaining control characters in a more targeted way
          deepCleanedJson = deepCleanedJson.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, function(match) {
            const charCode = match.charCodeAt(0);
            // Preserve legitimate escape sequences and whitespace
            if (charCode === 9 || charCode === 10 || charCode === 13) {
              return match;
            }
            return ' ';
          });
          
          try {
            console.log('🔧 Trying to parse deeply cleaned JSON');
            return JSON.parse(deepCleanedJson);
          } catch (deepCleanError) {
            console.error('❌ Deep clean approach also failed:', deepCleanError);
          }
        }
        
        // Try to find the last complete object
        const lastCompleteObject = jsonText.lastIndexOf('},');
        const lastCompleteArrayItem = jsonText.lastIndexOf('],');
        
        if (lastCompleteObject !== -1 || lastCompleteArrayItem !== -1) {
          const truncateAt = Math.max(lastCompleteObject, lastCompleteArrayItem) + 1;
          const truncatedJson = jsonText.substring(0, truncateAt) + (jsonText.includes('}') ? '}' : ']');
          
          console.log('🔧 Trying to parse truncated JSON length:', truncatedJson.length);
          console.log('🔧 Trying to parse truncated JSON:', truncatedJson.substring(0, 200));
          
          try {
            return JSON.parse(truncatedJson);
          } catch (truncationError) {
            console.error('❌ Truncation approach also failed:', truncationError);
          }
        }
        
        // Handle unbalanced braces/brackets by adding missing closing brackets
        const openBraces = (jsonText.match(/{/g) || []).length;
        const closeBraces = (jsonText.match(/}/g) || []).length;
        const openBrackets = (jsonText.match(/\[/g) || []).length;
        const closeBrackets = (jsonText.match(/\]/g) || []).length;
        
        console.log(`🔧 Brace count - Open: ${openBraces}, Close: ${closeBraces}`);
        console.log(`🔧 Bracket count - Open: ${openBrackets}, Close: ${closeBrackets}`);
        
        // If we have unbalanced braces/brackets, try to balance them
        if (openBraces > closeBraces || openBrackets > closeBrackets) {
          console.log('🔧 Detected unbalanced braces/brackets, attempting to balance');
          let balancedJson = jsonText;
          
          // Add missing closing braces
          for (let i = closeBraces; i < openBraces; i++) {
            balancedJson += '}';
          }
          
          // Add missing closing brackets
          for (let i = closeBrackets; i < openBrackets; i++) {
            balancedJson += ']';
          }
          
          console.log('🔧 Trying to parse balanced JSON length:', balancedJson.length);
          console.log('🔧 Trying to parse balanced JSON:', balancedJson.substring(0, 200));
          
          try {
            return JSON.parse(balancedJson);
          } catch (balanceError) {
            console.error('❌ Balancing approach also failed:', balanceError);
          }
        }
        
        // Handle truncated arrays specifically
        if (error.message.includes("Expected ',' or ']'")) {
          console.log('🔧 Detected truncated array, attempting repair');
          
          // Try to fix truncated arrays by closing them properly
          let repairedJson = jsonText;
          
          // If the JSON ends with a comma or incomplete element, try to close the array properly
          if (repairedJson.endsWith(',') || repairedJson.endsWith(':') || repairedJson.endsWith('"')) {
            // Try to find the last opening bracket
            const lastOpenBracket = repairedJson.lastIndexOf('[');
            const lastOpenBrace = repairedJson.lastIndexOf('{');
            
            // Close the appropriate container
            if (lastOpenBracket > lastOpenBrace) {
              // Last container was an array, close it
              repairedJson = repairedJson.replace(/,$/, '').trim() + ']';
            } else if (lastOpenBrace > -1) {
              // Last container was an object, close it
              repairedJson = repairedJson.replace(/,$/, '').trim() + '}';
            }
          }
          
          // Ensure all arrays and objects are properly closed
          const stack = [];
          let repaired = '';
          for (let i = 0; i < repairedJson.length; i++) {
            const char = repairedJson[i];
            repaired += char;
            
            if (char === '{' || char === '[') {
              stack.push(char);
            } else if (char === '}' || char === ']') {
              if (stack.length > 0) {
                stack.pop();
              }
            }
          }
          
          // Close any unclosed containers
          while (stack.length > 0) {
            const last = stack.pop();
            if (last === '{') {
              repaired += '}';
            } else if (last === '[') {
              repaired += ']';
            }
          }
          
          console.log('🔧 Trying to parse array-repaired JSON length:', repaired.length);
          console.log('🔧 Trying to parse array-repaired JSON:', repaired.substring(0, 200));
          
          try {
            return JSON.parse(repaired);
          } catch (arrayRepairError) {
            console.error('❌ Array repair approach also failed:', arrayRepairError);
          }
        }
      }
      
      // Try alternative parsing approaches
      try {
        // Sometimes AI adds extra text before/after JSON, try to find and extract just the JSON part
        const jsonMatch = jsonText.match(/\{[^{]*(?:\{[^{]*\}[^{]*)*\}/s) || jsonText.match(/\[[^\[]*(?:\[[^\[]*\][^\[]*)*\]/s);
        if (jsonMatch) {
          const extractedJson = jsonMatch[0]
            .replace(/,\s*}/g, '}')
            .replace(/,\s*]/g, ']')
            .replace(/\s+/g, ' ')
            .trim();
          
          console.log('🔧 Trying to parse extracted JSON length:', extractedJson.length);
          console.log('🔧 Trying to parse extracted JSON:', extractedJson.substring(0, 200));
          console.log('🔍 First 10 chars of extracted JSON:', JSON.stringify(extractedJson.substring(0, 10)));
          return JSON.parse(extractedJson);
        }
      } catch (secondaryError) {
        console.error('❌ Secondary parsing also failed:', secondaryError);
      }
      
      // As a last resort, try to fix common JSON issues
      try {
        // Try to fix unescaped quotes inside strings
        let fixedJson = jsonText.replace(/([^\\])"([^:]*(?:[,:\}\]])[^\"]*)"/g, '$1\"$2\"');
        
        // Try to fix missing quotes around keys
        fixedJson = fixedJson.replace(/([\{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');
        
        console.log('🔧 Trying to parse fixed JSON length:', fixedJson.length);
        console.log('🔧 Trying to parse fixed JSON:', fixedJson.substring(0, 200));
        console.log('🔍 First 10 chars of fixed JSON:', JSON.stringify(fixedJson.substring(0, 10)));
        return JSON.parse(fixedJson);
      } catch (fixError) {
        console.error('❌ JSON fixing also failed:', fixError);
      }
      
      // Try using jsonrepair as a final solution
      try {
        console.log('🔧 Trying jsonrepair library to fix JSON');
        // Log more details about the JSON to help debug jsonrepair issues
        console.log('🔧 JSON length before repair:', jsonText.length);
        console.log('🔧 First 50 chars before repair:', JSON.stringify(jsonText.substring(0, 50)));
        const repairedJson = jsonrepair(jsonText);
        console.log('🔧 JSON repaired successfully');
        console.log('🔧 Repaired JSON length:', repairedJson.length);
        console.log('🔧 Repaired JSON (first 200 chars):', JSON.stringify(repairedJson.substring(0, 200)));
        return JSON.parse(repairedJson);
      } catch (repairError) {
        console.error('❌ JSON repair also failed:', repairError);
        // Log the problematic JSON for debugging
        console.error('❌ Problematic JSON (first 100 chars):', JSON.stringify(jsonText.substring(0, 100)));
      }
      
      // If all else fails, log the full response for debugging
      console.error('❌ All JSON parsing attempts failed. Full response:');
      console.error('Full response length:', jsonText.length);
      console.error('First 5000 chars:', jsonText.substring(0, Math.min(5000, jsonText.length)));
      
      throw new Error(`Failed to parse AI response. Original error: ${error instanceof Error ? error.message : 'Unknown parsing error'}`);
    }
}
}

export const aiService = new AIService();