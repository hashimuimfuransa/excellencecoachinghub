import { GoogleGenerativeAI } from '@google/generative-ai';
import mongoose from 'mongoose';
import { GeneratedPsychometricTest } from '../models/GeneratedPsychometricTest';
import { centralAIManager, AIGenerationOptions } from './centralAIManager';

// AI Service for various educational tasks - Now using Central AI Manager
export class AIService {
  private aiManager = centralAIManager;

  constructor() {
    console.log('🎓 AI Service initialized with Central AI Manager');
    
    // Listen to AI manager events for monitoring
    this.aiManager.on('modelUpgraded', (data) => {
      console.log(`🎓 AI Service: Model upgraded from ${data.from} to ${data.to}`);
    });
    
    this.aiManager.on('generationError', (data) => {
      console.warn(`🎓 AI Service: Generation error on attempt ${data.attempt}: ${data.error}`);
    });
  }

  // Helper function to extract JSON from AI responses that might be wrapped in markdown
  private extractJsonFromResponse(text: string): any {
    let jsonText = text.trim();
    
    // Remove markdown code blocks if present
    if (jsonText.startsWith('```json') && jsonText.endsWith('```')) {
      jsonText = jsonText.slice(7, -3).trim();
    } else if (jsonText.startsWith('```') && jsonText.endsWith('```')) {
      jsonText = jsonText.slice(3, -3).trim();
    }
    
    // Find JSON content between first { and last }
    const firstBrace = jsonText.indexOf('{');
    const lastBrace = jsonText.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      jsonText = jsonText.substring(firstBrace, lastBrace + 1);
    }
    
    // Clean up common JSON formatting issues
    jsonText = jsonText
      .replace(/,\s*}/g, '}')  // Remove trailing commas before closing braces
      .replace(/,\s*]/g, ']')  // Remove trailing commas before closing brackets
      .replace(/\n\s*\n/g, '\n')  // Remove double newlines
      .replace(/\r/g, '')  // Remove carriage returns
      .trim();
    
    try {
      return JSON.parse(jsonText);
    } catch (error) {
      console.error('Failed to parse JSON from AI response:', error);
      console.error('Raw response length:', text.length);
      console.error('Processed JSON text length:', jsonText.length);
      console.error('First 500 chars of processed text:', jsonText.substring(0, 500));
      console.error('Last 500 chars of processed text:', jsonText.substring(jsonText.length - 500));
      
      // Try multiple recovery strategies
      try {
        // Strategy 1: Extract just the questions array
        const questionsMatch = jsonText.match(/"questions":\s*(\[[\s\S]*?\])/);
        if (questionsMatch && questionsMatch[1]) {
          // Try to fix common JSON issues in the questions array
          let questionsStr = questionsMatch[1];
          questionsStr = questionsStr.replace(/,(\s*[}\]])/g, '$1'); // Remove trailing commas
          questionsStr = questionsStr.replace(/([}\]])(\s*)([{])/g, '$1,$2$3'); // Add missing commas between objects
          
          const questionsArray = JSON.parse(questionsStr);
          console.log('✅ Recovered questions array from partial JSON');
          return { questions: questionsArray };
        }
      } catch (recoveryError) {
        console.error('Questions array recovery failed:', recoveryError);
      }
      
      // Strategy 2: Try to extract individual question objects
      try {
        const questionObjects = [];
        const questionMatches = jsonText.match(/\{\s*"question":\s*"[^"]*"[\s\S]*?\}/g);
        if (questionMatches && questionMatches.length > 0) {
          for (const questionMatch of questionMatches) {
            try {
              const cleanMatch = questionMatch.replace(/,(\s*})/g, '$1');
              const questionObj = JSON.parse(cleanMatch);
              if (questionObj.question && questionObj.options && Array.isArray(questionObj.options)) {
                questionObjects.push(questionObj);
              }
            } catch (objError) {
              console.warn('Failed to parse individual question object:', objError);
            }
          }
          
          if (questionObjects.length > 0) {
            console.log(`✅ Recovered ${questionObjects.length} individual questions from malformed JSON`);
            return { questions: questionObjects };
          }
        }
      } catch (individualRecoveryError) {
        console.error('Individual question recovery failed:', individualRecoveryError);
      }
      
      throw new Error(`Failed to parse AI response: ${error instanceof Error ? error.message : 'Unknown parsing error'}`);
    }
  }

  // General content generation method - Now using Central AI Manager
  async generateContent(prompt: string, options?: AIGenerationOptions): Promise<string> {
    try {
      return await this.aiManager.generateContent(prompt, {
        retries: 3,
        timeout: 30000,
        priority: 'normal',
        ...options
      });
    } catch (error) {
      console.error('🎓 Error generating content with AI:', error);
      throw error;
    }
  }

  // Legacy method alias for backward compatibility
  async generateText(prompt: string, options?: AIGenerationOptions): Promise<string> {
    console.log('🔄 Using legacy generateText method, redirecting to generateContent');
    return this.generateContent(prompt, options);
  }

  // Check if AI service is available
  async isAvailable(): Promise<boolean> {
    return await this.aiManager.isAvailable();
  }

  // Get current AI model information
  getCurrentModel() {
    return this.aiManager.getCurrentModel();
  }

  // Get AI service statistics
  getServiceStats() {
    return this.aiManager.getModelStats();
  }

  // Generate psychometric test questions with proper JSON parsing
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
      const { jobTitle, jobDescription, industry, experienceLevel, skills, questionCount, testLevel, timeLimit, userId, jobId } = params;
      
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
      
      const prompt = `You are an expert psychometric test designer. Create a psychometric test only for the role of ${jobTitle}. Do not include technical or job-knowledge questions. The test should only measure psychological and cognitive traits relevant to the role.

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

Assessment Areas (distribute questions evenly):
1. COGNITIVE ABILITIES (25% of questions) - logical reasoning, analytical thinking, pattern recognition
2. PERSONALITY TRAITS (25% of questions) - behavior patterns, work style preferences, team dynamics
3. PROBLEM-SOLVING (25% of questions) - creative solutions, critical thinking, decision-making
4. SITUATIONAL JUDGMENT (25% of questions) - workplace scenarios, ethical decisions, conflict resolution

Requirements:
- Each question must have exactly 4 options
- Only ONE correct answer per question
- Clear, professional language appropriate for ${experienceLevel} level
- Questions must be directly relevant to ${jobTitle} role in ${industry}
- Provide detailed explanations for correct answers
- Provide answer key + explanations where applicable
- Provide a simple scoring guide for interpretation

CRITICAL OUTPUT FORMAT - Return ONLY this JSON structure (no markdown, no extra text, ensure proper JSON formatting):
{
  "questions": [
    {
      "question": "Complete question text here",
      "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
      "correctAnswer": 0,
      "explanation": "Detailed explanation of why this answer is correct",
      "category": "cognitive"
    }
  ]
}

MANDATORY CATEGORY VALUES (use only these):
- "cognitive" (logical reasoning, analytical thinking)
- "personality" (behavior assessment, work preferences)  
- "problem-solving" (creative solutions, critical thinking)
- "situational" (workplace scenarios, judgment calls)

QUALITY STANDARDS:
- Questions must be complete and professionally written
- Options must be realistic and relevant
- Explanations must be educational and clear
- No truncated or incomplete content
- Test the full range of psychological traits needed for ${jobTitle}

Generate all ${questionCount} questions now:`;

      // Use the enhanced AI manager with built-in retry logic
      let text: string;
      try {
        console.log(`🎓 Generating psychometric test using enhanced AI manager`);
        text = await this.aiManager.generateContent(prompt, {
          retries: 3,
          timeout: 45000, // Longer timeout for complex generation
          priority: 'high', // High priority for test generation
          temperature: 0.3 // Lower temperature for more consistent results
        });
      } catch (aiError: any) {
        console.error('🎓 AI service failed, using fallback questions:', aiError.message);
        // Use fallback questions when AI service is unavailable
        return this.generateFallbackQuestions(params);
      }
      
      console.log('🤖 Raw psychometric test response:', text.substring(0, 200) + '...');
      
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
            if (!question.options || !Array.isArray(question.options) || question.options.length !== 4) {
              console.warn(`⚠️ Question ${index + 1} has invalid options, using fallback`);
              question.options = ["Option A", "Option B", "Option C", "Option D"];
            } else {
              // Ensure all options are strings and not empty
              question.options = question.options.map((option: any, optIndex: number) => {
                if (!option || typeof option !== 'string' || option.trim().length === 0) {
                  return `Option ${String.fromCharCode(65 + optIndex)}`;
                }
                return option.trim();
              });
            }

            // Validate correct answer
            if (typeof question.correctAnswer !== 'number' || 
                question.correctAnswer < 0 || 
                question.correctAnswer >= 4) {
              console.warn(`⚠️ Question ${index + 1} has invalid correctAnswer, defaulting to 0`);
              question.correctAnswer = 0;
            }

            // Validate explanation
            if (!question.explanation || typeof question.explanation !== 'string' || question.explanation.trim().length === 0) {
              console.warn(`⚠️ Question ${index + 1} has invalid explanation, using fallback`);
              question.explanation = "This is the correct answer for this question.";
            }

            // Clean up category values with comprehensive normalization
            let category = question.category;
            if (typeof category === 'string') {
              category = category.toLowerCase().trim();
              
              // Remove common variations and normalize to valid enum values
              if (category === 'problemsolving' || 
                  category === 'problem_solving' || 
                  category.includes('problem') || 
                  category.includes('solving')) {
                category = 'problem-solving';
              } else if (category.includes('situational') || 
                         category.includes('judgment') || 
                         category.includes('scenario')) {
                category = 'situational';
              } else if (category.includes('personality') || 
                         category.includes('behavior') || 
                         category.includes('trait')) {
                category = 'personality';
              } else if (category.includes('cognitive') || 
                         category.includes('logical') || 
                         category.includes('analytical') ||
                         category.includes('reasoning')) {
                category = 'cognitive';
              } else {
                // Default fallback
                console.warn(`⚠️ Unknown category "${question.category}" for question ${index + 1}, defaulting to cognitive`);
                category = 'cognitive';
              }
              
              console.log(`🔄 Category mapping: "${question.category}" → "${category}"`);
            } else {
              category = 'cognitive';
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
          result.questions = result.questions.filter((question: any) => 
            question.question && 
            question.options && 
            Array.isArray(question.options) && 
            question.options.length === 4
          );
          
          // Ensure exact question count
          if (result.questions.length > questionCount) {
            console.log(`⚠️ AI generated ${result.questions.length} valid questions, trimming to ${questionCount}`);
            result.questions = result.questions.slice(0, questionCount);
          } else if (result.questions.length < questionCount) {
            console.log(`⚠️ AI generated ${result.questions.length} valid questions, padding to ${questionCount}`);
            // Add high-quality fallback questions to reach the target count
            const needed = questionCount - result.questions.length;
            const categories = ['cognitive', 'personality', 'problem-solving', 'situational'];
            
            for (let i = 0; i < needed; i++) {
              const questionNum = result.questions.length + 1;
              const category = categories[i % categories.length];
              
              result.questions.push({
                question: `As a ${jobTitle} professional in the ${industry} industry, how would you approach a ${testLevel} level challenge that requires ${category} skills?`,
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
          
          console.log(`✅ Final validated question count: ${result.questions.length} (target: ${questionCount})`);
          
          // Final quality check
          const hasIncompleteQuestions = result.questions.some((q: any) => 
            !q.question || 
            !q.options || 
            q.options.length !== 4 || 
            typeof q.correctAnswer !== 'number' ||
            !q.explanation ||
            !q.category
          );
          
          if (hasIncompleteQuestions) {
            console.error('⚠️ Some questions are still incomplete after validation');
          } else {
            console.log('✅ All questions passed validation');
          }
        }
        
        return result;
      } catch (parseError) {
        console.error('Failed to parse psychometric test response:', parseError);
        
        // Use the better fallback system instead of placeholder questions
        console.log('⚠️ Using fallback questions due to AI parsing error');
        return this.generateFallbackQuestions(params);
      }
    } catch (error) {
      console.error('Error generating psychometric test:', error);
      throw new Error('Failed to generate psychometric test');
    }
  }

  // Generate job preparation test (separate from psychometric tests)
  async generateJobPreparationTest(prompt: string, params: {
    jobTitle: string;
    company: string;
    industry?: string;
    difficulty: string;
    questionCount: number;
  }): Promise<{ questions: Array<{ 
    id: string; 
    question: string; 
    type: string; 
    options: string[]; 
    correctAnswer: number; 
    explanation: string; 
    category: string; 
  }> }> {
    try {
      console.log(`🎯 Generating job preparation test for ${params.jobTitle} at ${params.company}`);
      
      let textResponse = await this.aiManager.generateContent(prompt, {
        retries: 3,
        timeout: 45000,
        priority: 'high',
        temperature: 0.3
      });

      // Clean and parse the response
      textResponse = textResponse.replace(/```json\s*|\s*```/g, '').trim();
      
      try {
        const parsedResponse = JSON.parse(textResponse);
        
        if (!parsedResponse.questions || !Array.isArray(parsedResponse.questions)) {
          throw new Error('Invalid response structure');
        }

        // Validate and format questions
        const formattedQuestions = parsedResponse.questions.map((q: any, index: number) => ({
          id: q.id || `q${index + 1}`,
          question: q.question,
          type: q.type || 'multiple_choice',
          options: Array.isArray(q.options) ? q.options : [],
          correctAnswer: typeof q.correctAnswer === 'number' ? q.correctAnswer : 0,
          explanation: q.explanation || 'Explanation not provided',
          category: q.category || 'general'
        }));

        return { questions: formattedQuestions };
        
      } catch (parseError) {
        console.error('Failed to parse job preparation test response:', parseError);
        
        // Generate fallback questions for job preparation
        return this.generateJobPreparationFallback(params);
      }
    } catch (error) {
      console.error('Error generating job preparation test:', error);
      return this.generateJobPreparationFallback(params);
    }
  }

  // Generate fallback questions for job preparation tests
  private generateJobPreparationFallback(params: {
    jobTitle: string;
    company: string;
    industry?: string;
    difficulty: string;
    questionCount: number;
  }): { questions: Array<{ 
    id: string; 
    question: string; 
    type: string; 
    options: string[]; 
    correctAnswer: number; 
    explanation: string; 
    category: string; 
  }> } {
    
    const { jobTitle, company, industry, difficulty, questionCount } = params;
    
    console.log(`🔄 Generating ${questionCount} fallback job preparation questions for ${jobTitle}`);
    
    const fallbackQuestions = [
      {
        id: 'q1',
        question: `What is the most important skill for a ${jobTitle} position?`,
        type: 'multiple_choice',
        options: [
          'Technical expertise in relevant tools and technologies',
          'Strong communication and teamwork abilities',
          'Problem-solving and analytical thinking',
          'Time management and organizational skills'
        ],
        correctAnswer: 2,
        explanation: 'Problem-solving and analytical thinking are fundamental skills that enable success in most professional roles.',
        category: 'general_skills'
      },
      {
        id: 'q2',
        question: `When working on a project as a ${jobTitle}, how would you handle competing deadlines?`,
        type: 'multiple_choice',
        options: [
          'Work overtime to meet all deadlines',
          'Prioritize based on business impact and communicate with stakeholders',
          'Complete tasks in the order they were assigned',
          'Ask colleagues to help with some tasks'
        ],
        correctAnswer: 1,
        explanation: 'Prioritizing based on business impact and maintaining clear communication ensures optimal resource allocation.',
        category: 'situational'
      },
      {
        id: 'q3',
        question: `What would you do if you disagreed with your manager's approach to a project?`,
        type: 'multiple_choice',
        options: [
          'Follow their instructions without question',
          'Express your concerns respectfully and suggest alternatives',
          'Discuss the issue with other team members first',
          'Implement your own approach instead'
        ],
        correctAnswer: 1,
        explanation: 'Professional communication about concerns shows initiative while respecting hierarchy.',
        category: 'behavioral'
      },
      {
        id: 'q4',
        question: `How do you stay current with industry trends in ${industry || 'your field'}?`,
        type: 'multiple_choice',
        options: [
          'Read industry publications and attend conferences',
          'Take online courses and certifications',
          'Network with industry professionals',
          'All of the above'
        ],
        correctAnswer: 3,
        explanation: 'A combination of learning methods ensures comprehensive knowledge of industry developments.',
        category: 'professional_development'
      },
      {
        id: 'q5',
        question: `Describe your approach to handling a difficult customer or client.`,
        type: 'multiple_choice',
        options: [
          'Listen actively, empathize, and work toward a solution',
          'Transfer them to your supervisor immediately',
          'Explain company policies and stick to them strictly',
          'Try to end the conversation quickly'
        ],
        correctAnswer: 0,
        explanation: 'Active listening and empathy are key to resolving difficult customer situations effectively.',
        category: 'customer_service'
      }
    ];

    // Adjust number of questions to match requested count
    const questions = [];
    for (let i = 0; i < Math.min(questionCount, 20); i++) {
      const baseQuestion = fallbackQuestions[i % fallbackQuestions.length];
      if (baseQuestion) {
        questions.push({
          ...baseQuestion,
          id: `q${i + 1}`,
          question: baseQuestion.question.replace(/\$\{jobTitle\}/g, jobTitle)
        });
      }
    }

    return { questions };
  }

  // Generate fallback questions when AI service is unavailable
  private generateFallbackQuestions(params: {
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
  }): { questions: Array<{ question: string; options: string[]; correctAnswer: number; explanation: string; category: string; }> } {
    const { jobTitle, industry, experienceLevel, questionCount, testLevel } = params;
    
    console.log(`🔄 Generating ${questionCount} fallback questions for ${jobTitle}`);
    
    // Predefined question templates based on job characteristics
    const questionTemplates = {
      cognitive: [
        {
          question: `In your role as a ${jobTitle}, you encounter a complex problem that requires breaking down into smaller parts. What is your best approach?`,
          options: [
            "Analyze each component systematically and prioritize based on impact",
            "Work on the easiest parts first to build momentum",
            "Tackle the most difficult aspect first to get it out of the way",
            "Ask for help immediately without attempting to understand the problem"
          ],
          correctAnswer: 0,
          explanation: "Systematic analysis and impact-based prioritization demonstrate strong analytical thinking skills essential for professional roles."
        },
        {
          question: `When processing information for decision-making in a ${industry} context, which approach would be most effective?`,
          options: [
            "Gather all available data, analyze patterns, and consider multiple perspectives",
            "Make quick decisions based on initial impressions",
            "Always follow established procedures without deviation",
            "Rely primarily on colleague opinions and consensus"
          ],
          correctAnswer: 0,
          explanation: "Comprehensive data analysis and considering multiple perspectives shows cognitive flexibility and analytical depth."
        }
      ],
      personality: [
        {
          question: `In a team setting as a ${jobTitle}, how do you typically handle disagreements with colleagues?`,
          options: [
            "Listen actively to understand different viewpoints and work toward consensus",
            "Stand firm on your position until others agree",
            "Avoid confrontation and go along with the majority",
            "Escalate the disagreement to management immediately"
          ],
          correctAnswer: 0,
          explanation: "Active listening and consensus-building demonstrate strong interpersonal skills and emotional intelligence."
        }
      ],
      'problem-solving': [
        {
          question: `You're facing an unexpected challenge in your ${jobTitle} role that requires creative thinking. What's your approach?`,
          options: [
            "Research similar situations, brainstorm multiple solutions, and test the most promising ones",
            "Apply the first solution that comes to mind",
            "Wait for the problem to resolve itself",
            "Immediately ask someone else to solve it"
          ],
          correctAnswer: 0,
          explanation: "Research, brainstorming, and systematic testing demonstrate comprehensive problem-solving methodology."
        }
      ],
      situational: [
        {
          question: `As a ${jobTitle} in the ${industry} industry, you're given a tight deadline for an important project. How do you proceed?`,
          options: [
            "Assess the scope, prioritize key deliverables, and communicate realistic timelines",
            "Work overtime without considering quality implications",
            "Accept the deadline without question and hope for the best",
            "Immediately declare the deadline impossible"
          ],
          correctAnswer: 0,
          explanation: "Strategic assessment, prioritization, and clear communication demonstrate professional project management skills."
        }
      ]
    };

    const categories = Object.keys(questionTemplates) as Array<keyof typeof questionTemplates>;
    const questions: Array<{ question: string; options: string[]; correctAnswer: number; explanation: string; category: string; }> = [];
    
    // Generate questions evenly across categories
    for (let i = 0; i < questionCount; i++) {
      const categoryIndex = i % categories.length;
      const category = categories[categoryIndex];
      if (category && questionTemplates[category]) {
        const templates = questionTemplates[category];
        const template = templates[Math.floor(Math.random() * templates.length)];
        
        questions.push({
          question: template.question,
          options: template.options,
          correctAnswer: template.correctAnswer,
          explanation: template.explanation,
          category: category as string
        });
      }
    }
    
    return { questions };
  }

  // Grade psychometric test responses
  async gradePsychometricTest(params: {
    test: any;
    answers: Record<string, any>;
    userId: string;
    jobId?: string;
  }): Promise<{
    scores: Record<string, number>;
    categoryScores: Record<string, number>;
    overallScore: number;
    grade: string;
    percentile: number;
    questionByQuestionAnalysis: any[];
    failedQuestions: any[];
    interpretation: string;
    recommendations: string[];
    detailedAnalysis: any;
  }> {
    try {
      const { test, answers, userId, jobId } = params;

      const prompt = `
        You are a professional psychometric assessment expert. Grade this psychometric test and provide comprehensive, detailed feedback in JSON format.

        **Test Details:**
        - Title: ${test.title}
        - Type: ${test.type} 
        - Questions Answered: ${Object.keys(answers).length}/${test.questions.length}

        **Questions & Answers Analysis:**
        ${test.questions.map((q: any, index: number) => {
          const answer = answers[q._id] || answers[q.id] || 'Not answered';
          const answerText = typeof answer === 'object' ? JSON.stringify(answer) : answer;
          const correctAnswer = q.correctAnswer || 'See explanation';
          return `
        Q${index + 1}: ${q.question}
        ${q.options ? `Options: ${q.options.join(', ')}` : ''}
        Candidate's Answer: ${answerText}
        Correct/Best Answer: ${correctAnswer}
        Explanation: ${q.explanation || 'Measures ' + (q.traits ? q.traits.join(', ') : 'psychological traits')}
        Question Type: ${q.type}
        Traits Measured: ${q.traits ? q.traits.join(', ') : 'general assessment'}
        `;
        }).join('\n')}

        **Grading Instructions:**
        1. Provide detailed analysis for EACH question showing what they answered vs. what they should have answered
        2. Explain WHY each incorrect answer is suboptimal and what the better choice demonstrates
        3. Analyze their psychological profile based on response patterns
        4. Calculate realistic scores on a 0-100 scale for each competency area
        5. Provide specific development recommendations based on weak areas identified
        6. Show overall psychometric fitness for the role

        **Required JSON Response Format:**
        {
          "overallScore": 78,
          "grade": "B+",
          "percentile": 65,
          "scores": {
            "cognitiveAbility": 80,
            "problemSolving": 75,
            "leadership": 78,
            "teamwork": 82,
            "stressManagement": 70,
            "adaptability": 85,
            "integrity": 90,
            "attentionToDetail": 72
          },
          "categoryScores": {
            "cognitive": 77,
            "personality": 79,
            "behavioral": 76,
            "situationalJudgment": 73
          },
          "questionByQuestionAnalysis": [
            {
              "questionNumber": 1,
              "question": "When facing a complex problem at work...",
              "candidateAnswer": "Take immediate action based on initial assessment",
              "correctAnswer": "Break it down into smaller, manageable tasks",
              "isCorrect": false,
              "pointsEarned": 0,
              "maxPoints": 2,
              "analysis": "Your answer suggests impulsiveness. The better approach demonstrates systematic problem-solving skills essential for this role.",
              "traitImpact": "Shows lower analytical thinking and planning abilities"
            }
          ],
          "failedQuestions": [
            {
              "questionNumber": 1,
              "question": "When facing a complex problem at work...",
              "yourAnswer": "Take immediate action based on initial assessment",
              "correctAnswer": "Break it down into smaller, manageable tasks",
              "explanation": "This approach shows impulsiveness rather than systematic thinking. The better answer demonstrates structured problem-solving and analytical skills crucial for the role.",
              "category": "Problem Solving"
            }
          ],
          "interpretation": "Comprehensive assessment showing specific strengths and clear development areas. Detailed analysis of each response pattern reveals psychological profile.",
          "recommendations": [
            "Develop systematic problem-solving skills through structured methodologies",
            "Practice situational judgment scenarios to improve decision-making",
            "Focus on building patience and analytical thinking before taking action"
          ],
          "detailedAnalysis": {
            "strengths": [
              "Shows strong interpersonal skills",
              "Good communication preferences",
              "Demonstrates collaborative tendencies"
            ],
            "criticalWeaknesses": [
              "Impulsive decision-making patterns detected",
              "Needs improvement in systematic thinking approach",
              "Strategic planning abilities require development"
            ],
            "psychometricProfile": {
              "personalityType": "Action-oriented with collaborative tendencies",
              "workStyle": "Prefers quick decisions but values team input",
              "stressCoping": "May struggle with complex problem-solving under pressure"
            },
            "roleReadiness": {
              "currentFit": "Moderate - requires development in key areas",
              "recommendedActions": "Complete problem-solving training before role placement",
              "timeframe": "3-6 months of targeted development recommended"
            },
            "benchmarkComparison": {
              "industryAverage": "Below average in analytical thinking, above average in teamwork",
              "roleRequirements": "70% match - needs improvement in cognitive areas"
            }
          }
        }

        Provide ONLY the JSON response, no additional text.
      `;

      console.log('Sending prompt to AI model...');
      const text = await this.aiManager.generateContent(prompt, {
        retries: 3,
        timeout: 45000,
        priority: 'high',
        temperature: 0.3
      });
      
      console.log('AI response received, length:', text?.length || 0);
      console.log('Raw AI response (first 500 chars):', text?.substring(0, 500));

      try {
        const gradingResult = this.extractJsonFromResponse(text);
        console.log('Successfully parsed AI grading result');
        
        // Validate and ensure proper structure
        return {
          scores: gradingResult.scores || {},
          categoryScores: gradingResult.categoryScores || {},
          overallScore: Math.min(Math.max(gradingResult.overallScore || 0, 0), 100),
          grade: gradingResult.grade || 'N/A',
          percentile: gradingResult.percentile || 0,
          questionByQuestionAnalysis: gradingResult.questionByQuestionAnalysis || [],
          failedQuestions: gradingResult.failedQuestions || [],
          interpretation: gradingResult.interpretation || 'Assessment completed',
          recommendations: gradingResult.recommendations || [],
          detailedAnalysis: gradingResult.detailedAnalysis || {
            strengths: [],
            criticalWeaknesses: [],
            psychometricProfile: {},
            roleReadiness: {},
            benchmarkComparison: {}
          }
        };
      } catch (parseError) {
        console.error('Failed to parse AI grading response:', parseError);
        console.error('Raw response:', text);
        
        // Return fallback result
        return {
          scores: {},
          categoryScores: {},
          overallScore: 0,
          grade: 'Unable to Grade',
          percentile: 0,
          questionByQuestionAnalysis: [],
          failedQuestions: [],
          interpretation: 'Unable to process grading due to AI response parsing error',
          recommendations: ['Please retake the assessment'],
          detailedAnalysis: {
            strengths: [],
            criticalWeaknesses: ['Assessment could not be properly evaluated'],
            psychometricProfile: {},
            roleReadiness: { currentFit: 'Unable to determine' },
            benchmarkComparison: {}
          }
        };
      }
    } catch (error) {
      console.error('Error grading psychometric test with AI:', error);
      throw error;
    }
  }

  /**
   * Categorize job opportunity based on title and description
   */
  async categorizeJob(title: string, description: string): Promise<string> {
    try {
      const prompt = `
        Analyze the following job opportunity and categorize it into one of these categories:

        Categories:
        1. "jobs" - Regular employment positions (full-time, part-time, contract, freelance)
        2. "tenders" - Government or private sector procurement opportunities, contracts, bidding processes
        3. "trainings" - Professional development, workshops, courses, skill-building programs, certifications
        4. "internships" - Student placements, entry-level positions, graduate programs, apprenticeships
        5. "scholarships" - Educational funding, grants, study abroad programs, academic awards
        6. "access_to_finance" - Business loans, grants, funding opportunities, investment programs, microfinance

        Job Title: ${title}
        Job Description: ${description.substring(0, 1000)}

        Rules:
        - If it mentions "tender", "bid", "procurement", "contract award", "RFP", "proposal" -> "tenders"
        - If it mentions "training", "course", "workshop", "certification", "skill development" -> "trainings"  
        - If it mentions "intern", "graduate program", "entry level", "student placement" -> "internships"
        - If it mentions "scholarship", "grant", "study abroad", "educational funding" -> "scholarships"
        - If it mentions "loan", "funding", "investment", "finance", "grant", "microfinance" -> "access_to_finance"
        - Otherwise, regular employment positions -> "jobs"

        Return only the category name in lowercase, no additional text or explanation.
      `;

      const response = await this.aiManager.generateContent(prompt, {
        retries: 2,
        timeout: 15000,
        priority: 'normal'
      });
      const category = response.trim().toLowerCase();

      // Validate the category
      const validCategories = ['jobs', 'tenders', 'trainings', 'internships', 'scholarships', 'access_to_finance'];
      
      if (validCategories.includes(category)) {
        return category;
      }

      // Default fallback
      console.log(`Invalid category returned: ${category}, defaulting to 'jobs'`);
      return 'jobs';

    } catch (error) {
      console.error('Error categorizing job with AI:', error);
      return 'jobs'; // Default category on error
    }
  }
}

// Export a singleton instance
export const aiService = new AIService();