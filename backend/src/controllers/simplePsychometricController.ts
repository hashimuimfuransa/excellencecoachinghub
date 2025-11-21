import { Request, Response } from 'express';
import { Job } from '../models/Job';
import { GeneratedPsychometricTest } from '../models/GeneratedPsychometricTest';
import { TestSession } from '../models/TestSession';
import { PsychometricTestResult } from '../models/PsychometricTestResult';
import { AuthRequest } from '../middleware/auth';
import mongoose from 'mongoose';
import axios from 'axios';

const PSYCHOMETRIC_CATEGORY_DEFINITIONS: Record<string, { label: string }> = {
  time_management: { label: 'Time Management' },
  teamwork: { label: 'Teamwork & Collaboration' },
  communication: { label: 'Communication' },
  decision_making: { label: 'Decision Making' },
  problem_solving: { label: 'Problem Solving' },
  leadership: { label: 'Leadership' },
  conflict_resolution: { label: 'Conflict Resolution' },
  adaptability: { label: 'Adaptability' },
  creativity: { label: 'Creativity' },
  critical_thinking: { label: 'Critical Thinking' },
  emotional_intelligence: { label: 'Emotional Intelligence' },
  stress_management: { label: 'Stress Management' }
};

const DEFAULT_CATEGORY_IDS = ['time_management', 'teamwork', 'communication', 'decision_making'];

// Helper function to calculate percentile (simplified implementation)
const calculatePercentile = (score: number): number => {
  // This is a simplified implementation
  // In a real system, this would be based on actual distribution data
  return Math.min(99, Math.max(1, Math.round(score)));
};

const sanitizeCategoryIds = (rawCategories: unknown): string[] => {
  if (!Array.isArray(rawCategories)) {
    return DEFAULT_CATEGORY_IDS;
  }
  
  // Filter valid categories
  return rawCategories.filter(category => 
    typeof category === 'string' && 
    category.trim().length > 0 && 
    PSYCHOMETRIC_CATEGORY_DEFINITIONS.hasOwnProperty(category)
  );
};

/**
 * Create a simple prompt for psychometric test generation
 */
const createSimplePrompt = (params: {
  jobTitle: string;
  jobDescription: string;
  categories: string[];
  questionCount: number;
  testLevel: string;
}): string => {
  const { jobTitle, jobDescription, categories, questionCount, testLevel } = params;
  
  return `You are an expert psychometric test designer. Create a simple psychometric test for the role of ${jobTitle}.
  
Job Description: ${jobDescription}

Test Level: ${testLevel}
Number of Questions: ${questionCount}
Focus Areas: ${categories.join(', ')}

Create exactly ${questionCount} multiple-choice questions that assess psychological traits and cognitive abilities relevant to this role. Each question should have 5 options and one correct answer.

Return ONLY a valid JSON object with this exact structure:
{
  "title": "Psychometric Assessment for ${jobTitle}",
  "description": "AI-generated psychometric test for ${jobTitle} position",
  "timeLimit": ${questionCount},
  "categories": [${categories.map(c => `"${c}"`).join(', ')}],
  "questions": [
    {
      "question": "The question text here",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4", "Option 5"],
      "correctAnswer": 2,
      "explanation": "Explanation of why this is the best answer",
      "category": "${categories[0] || 'general'}"
    }
  ]
}`;
};

/**
 * Create a prompt for AI grading
 */
const createGradingPrompt = (params: {
  jobTitle: string;
  questions: any[];
  userAnswers: any[];
  timeSpent: number;
}): string => {
  const { jobTitle, questions, userAnswers, timeSpent } = params;
  
  return `You are an expert psychometric test evaluator. Please grade the following psychometric test for the role of ${jobTitle}.

Test Details:
- Total Questions: ${questions.length}
- Time Spent: ${timeSpent} seconds

Please analyze each question and the candidate's answer, then provide:
1. An overall score (0-100)
2. A grade (A+, A, B, C, D, or F)
3. Detailed feedback for each question including explanation of correct answers
4. Strengths and areas for improvement
5. A percentile ranking
6. Category-based scores if applicable

Return ONLY a valid JSON object with this exact structure:
{
  "overallScore": 85,
  "grade": "A",
  "interpretation": "Detailed interpretation of the score",
  "recommendations": ["Recommendation 1", "Recommendation 2"],
  "percentile": 75,
  "categoryScores": {},
  "correctQuestions": [
    {
      "questionNumber": 1,
      "question": "The question text",
      "candidateAnswer": 2,
      "correctAnswer": 2,
      "isCorrect": true,
      "category": "communication",
      "explanation": "Explanation of why this is correct",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4", "Option 5"]
    }
  ],
  "failedQuestions": [
    {
      "questionNumber": 2,
      "question": "The question text",
      "yourAnswer": 1,
      "correctAnswer": 3,
      "explanation": "Explanation of why the correct answer is better",
      "category": "problem_solving"
    }
  ]
}

Questions and Answers:
${questions.map((q: any, index: number) => `
Question ${index + 1}: ${q.question}
Options: ${q.options ? q.options.join(', ') : 'N/A'}
Candidate's Answer: ${userAnswers[index] !== undefined ? userAnswers[index] : 'No answer'}
Correct Answer: ${q.correctAnswer}
Category: ${q.category || 'general'}
`).join('\n')}
`;
};

/**
 * Helper function to get AI grading
 */
const getAIGrading = async (prompt: string): Promise<any> => {
  // Get API key from environment
  const apiKey = process.env.GEMINI_API_KEY || process.env.PSYCHOMETRIC_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('AI service not configured properly - missing API key');
  }

  // Log the prompt being sent (first 1000 characters to avoid too much logging)
  console.log('📝 AI Grading Prompt (first 1000 chars):', prompt.substring(0, 1000) + (prompt.length > 1000 ? '...' : ''));
  
  // Call the Gemini API directly
  console.log(`🎓 Requesting AI grading using direct API call`);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
  
  const payload = {
    contents: [{
      parts: [{
        text: prompt
      }]
    }],
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 8192,
      topP: 0.8,
      topK: 40
    }
  };

  const response = await axios.post(url, payload, {
    timeout: 60000, // 60 seconds
    headers: {
      'Content-Type': 'application/json'
    }
  });

  if (!response.data.candidates || response.data.candidates.length === 0) {
    throw new Error('No valid response from AI service');
  }

  const candidate = response.data.candidates[0];
  if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
    throw new Error('No valid content in AI response');
  }

  const textResponse = candidate.content.parts[0].text;
  console.log('🧠 Raw AI grading response received');

  // Extract JSON from response
  let result;
  try {
    // Try to parse the entire response as JSON
    result = JSON.parse(textResponse);
  } catch (error) {
    // If that fails, try to extract JSON from markdown code blocks
    const jsonMatch = textResponse.match(/```(?:json)?\s*({.*?})\s*```/s);
    if (jsonMatch && jsonMatch[1]) {
      result = JSON.parse(jsonMatch[1]);
    } else {
      // If that fails, try to find JSON-like content
      const jsonStart = textResponse.indexOf('{');
      const jsonEnd = textResponse.lastIndexOf('}') + 1;
      
      if (jsonStart !== -1 && jsonEnd > jsonStart) {
        const jsonString = textResponse.substring(jsonStart, jsonEnd);
        result = JSON.parse(jsonString);
      } else {
        throw new Error(`Could not extract valid JSON from AI response`);
      }
    }
  }

  return result;
};

/**
 * @desc Generate simple psychometric test using direct AI API call
 * @route POST /api/psychometric-tests/generate-test
 * @access Private
 */
export const generatePsychometricTest = async (req: AuthRequest, res: Response) => {
  try {
    console.log('🧠 Simple AI Generation attempt - Request received');
    const { jobId, levelId, categories: rawCategories } = req.body;

    const selectedCategories = sanitizeCategoryIds(rawCategories);
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    // Validate jobId and get job details
    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid job ID format'
      });
    }

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    // Define simple level features - Easy: 5, Intermediate: 10, Hard: 15 questions  
    const levelFeatures = {
      easy: { questionCount: 5, timeLimit: 5 },
      intermediate: { questionCount: 10, timeLimit: 10 },
      hard: { questionCount: 15, timeLimit: 15 }
    };

    const features = levelFeatures[levelId as keyof typeof levelFeatures] || levelFeatures.easy;
    const { questionCount, timeLimit } = features;

    // Create the prompt for the AI
    const prompt = createSimplePrompt({
      jobTitle: job.title,
      jobDescription: job.description,
      categories: selectedCategories,
      questionCount,
      testLevel: levelId
    });

    // Get API key from environment
    const apiKey = process.env.GEMINI_API_KEY || process.env.PSYCHOMETRIC_GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: 'AI service not configured properly - missing API key'
      });
    }

    // Call the Gemini API directly
    console.log(`🎓 Generating psychometric test using direct AI API call`);
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    
    const payload = {
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 8192,
        topP: 0.8,
        topK: 40
      }
    };

    const response = await axios.post(url, payload, {
      timeout: 60000, // Increased from 30000ms to 60000ms (60 seconds)
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.data.candidates || response.data.candidates.length === 0) {
      throw new Error('No valid response from AI service');
    }

    const candidate = response.data.candidates[0];
    if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
      throw new Error('No valid content in AI response');
    }

    const textResponse = candidate.content.parts[0].text;
    console.log('🧠 Raw psychometric test response received');

    // Extract JSON from response
    let result;
    try {
      // Try to parse the entire response as JSON
      result = JSON.parse(textResponse);
    } catch (error) {
      // If that fails, try to extract JSON from markdown code blocks
      const jsonMatch = textResponse.match(/```(?:json)?\s*({.*?})\s*```/s);
      if (jsonMatch && jsonMatch[1]) {
        result = JSON.parse(jsonMatch[1]);
      } else {
        // If that fails, try to find JSON-like content
        const jsonStart = textResponse.indexOf('{');
        const jsonEnd = textResponse.lastIndexOf('}') + 1;
        
        if (jsonStart !== -1 && jsonEnd > jsonStart) {
          const jsonString = textResponse.substring(jsonStart, jsonEnd);
          result = JSON.parse(jsonString);
        } else {
          throw new Error(`Could not extract valid JSON from AI response`);
        }
      }
    }

    // Validate that we received valid questions
    if (!result.questions || !Array.isArray(result.questions) || result.questions.length === 0) {
      return res.status(500).json({
        success: false,
        error: 'Failed to generate test questions - invalid structure'
      });
    }

    // Limit to the requested question count
    const finalQuestions = result.questions.slice(0, questionCount);

    console.log('✅ Successfully generated', finalQuestions.length, 'questions for', job.title);

    try {
      const generatedTestId = `simple_test_${userId}_${jobId}_${Date.now()}`;
      
      await GeneratedPsychometricTest.create({
        testId: generatedTestId,
        jobId: jobId,
        userId: userId,
        title: result.title || `Psychometric Assessment for ${job.title}`,
        description: result.description || `AI-generated psychometric test for ${job.title} position`,
        type: 'comprehensive',
        questions: finalQuestions.map((q: any, index: number) => ({
          id: `q${index + 1}`,
          number: index + 1,
          question: q.question,
          type: 'multiple_choice',
          options: q.options,
          correctAnswer: q.correctAnswer,
          traits: q.category ? [q.category] : ['general'],
          weight: 1,
          explanation: q.explanation
        })),
        timeLimit: timeLimit,
        industry: job.category || 'general',
        jobRole: job.title,
        difficulty: levelId === 'intermediate' ? 'moderate' : (levelId === 'hard' ? 'hard' : 'easy'),
        categories: selectedCategories,
        jobSpecific: true,
        metadata: {
          jobTitle: job.title,
          jobDescription: job.description,
          requiredSkills: job.skills && Array.isArray(job.skills) ? job.skills : [],
          experienceLevel: job.experienceLevel,
          selectedCategories
        }
      });

      // Create test session
      const testSession = await TestSession.create({
        user: userId,
        job: jobId,
        testLevel: levelId,
        purchase: null,
        questions: finalQuestions,
        timeLimit: timeLimit,
        status: 'ready',
        generatedAt: new Date()
      });

      console.log('✅ Test session created successfully:', testSession._id);

      res.status(201).json({
        success: true,
        data: {
          testSessionId: testSession._id,
          jobTitle: job.title,
          testLevel: levelId,
          questionCount: finalQuestions.length,
          timeLimit: timeLimit,
          instructions: `You have ${timeLimit} minutes to complete ${finalQuestions.length} questions. Each question has only one correct answer. Good luck!`
        },
        message: 'Psychometric test generated successfully!'
      });

    } catch (saveError: any) {
      console.error('Error saving test:', saveError);
      return res.status(500).json({
        success: false,
        error: 'Failed to save generated test'
      });
    }

  } catch (error: any) {
    console.error('Error generating psychometric test:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to generate psychometric test',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Start a psychometric test session
export const startPsychometricTest = async (req: AuthRequest, res: Response) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Session ID is required'
      });
    }

    // For now, return a simple success response
    // In a full implementation, this would create/start an actual test session
    res.status(200).json({
      success: true,
      data: {
        sessionId,
        message: 'Test session started successfully'
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to start test session',
      message: error.message
    });
  }
};

// Submit psychometric test answers
export const submitPsychometricTest = async (req: AuthRequest, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { answers, timeSpent } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Session ID is required'
      });
    }

    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({
        success: false,
        error: 'Answers array is required'
      });
    }

    // Fetch the actual test session from the database
    const testSession = await TestSession.findById(sessionId).populate('job');
    
    if (!testSession) {
      return res.status(404).json({
        success: false,
        error: 'Test session not found'
      });
    }

    // Check if the session belongs to the requesting user
    if (testSession.user.toString() !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied to this test session'
      });
    }

    // Check if test has already been submitted
    if (testSession.status === 'completed') {
      return res.status(400).json({
        success: false,
        error: 'Test has already been submitted'
      });
    }

    // Get the questions from the test session
    const questions = testSession.questions;

    // Validate answers array length
    if (answers.length !== questions.length) {
      return res.status(400).json({
        success: false,
        error: `Expected ${questions.length} answers, but received ${answers.length}`
      });
    }

    // Ensure timeSpent is at least 1 minute (60 seconds) to pass validation
    const validatedTimeSpent = timeSpent && timeSpent > 0 ? timeSpent : 60;

    // Use AI to grade the test - this will wait for the AI to finish processing
    console.log('🤖 Initiating AI grading for psychometric test');
    const jobTitle = (testSession as any).job?.title || 'Job';
    
    // Log the questions and answers being sent to AI
    console.log('📝 Questions and Answers being sent to AI:', {
      questionCount: questions.length,
      answerCount: answers.length,
      questions: questions.map((q: any, index: number) => ({
        questionNumber: index + 1,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        userAnswer: answers[index],
        category: q.category
      })),
      timeSpent: validatedTimeSpent
    });
    
    const gradingPrompt = createGradingPrompt({
      jobTitle,
      questions,
      userAnswers: answers,
      timeSpent: validatedTimeSpent
    });

    // This will wait for the AI grading to complete
    const aiGradingResult = await getAIGrading(gradingPrompt);
    console.log('✅ AI grading completed successfully');
    console.log('📝 AI Grading Result:', JSON.stringify(aiGradingResult, null, 2));
    
    // Log specific fields to debug
    console.log('📝 AI Grading Result Fields:', {
      overallScore: aiGradingResult.overallScore,
      grade: aiGradingResult.grade,
      correctQuestionsLength: aiGradingResult.correctQuestions?.length,
      failedQuestionsLength: aiGradingResult.failedQuestions?.length,
      hasCorrectQuestions: !!aiGradingResult.correctQuestions,
      hasFailedQuestions: !!aiGradingResult.failedQuestions
    });
    
    // Ensure we have valid data from AI
    const validAiGradingResult = {
      overallScore: aiGradingResult.overallScore || 0,
      grade: aiGradingResult.grade || 'F',
      interpretation: aiGradingResult.interpretation || 'No interpretation provided',
      recommendations: Array.isArray(aiGradingResult.recommendations) ? aiGradingResult.recommendations : [],
      percentile: aiGradingResult.percentile || 0,
      categoryScores: aiGradingResult.categoryScores || {},
      correctQuestions: Array.isArray(aiGradingResult.correctQuestions) ? aiGradingResult.correctQuestions : [],
      failedQuestions: Array.isArray(aiGradingResult.failedQuestions) ? aiGradingResult.failedQuestions : []
    };
    
    // Make sure the total questions count matches the original test
    const totalQuestionsInTest = questions.length;
    const gradedQuestionsCount = validAiGradingResult.correctQuestions.length + validAiGradingResult.failedQuestions.length;
    
    console.log('📝 Question count validation:', {
      totalInTest: totalQuestionsInTest,
      gradedCount: gradedQuestionsCount,
      mismatch: totalQuestionsInTest !== gradedQuestionsCount
    });
    
    // If there's a mismatch, we might need to adjust (this could happen if AI doesn't grade all questions)
    if (totalQuestionsInTest !== gradedQuestionsCount) {
      console.log('⚠️ Question count mismatch detected, using test question count as total');
    }
    
    console.log('📝 Validated AI Grading Result:', {
      overallScore: validAiGradingResult.overallScore,
      grade: validAiGradingResult.grade,
      correctQuestionsLength: validAiGradingResult.correctQuestions.length,
      failedQuestionsLength: validAiGradingResult.failedQuestions.length
    });

    // Update test session status to completed and store results
    testSession.status = 'completed';
    testSession.completedAt = new Date();
    (testSession as any).timeSpent = validatedTimeSpent;
    (testSession as any).score = validAiGradingResult.overallScore;
    (testSession as any).grade = validAiGradingResult.grade;
    (testSession as any).correctAnswers = validAiGradingResult.correctQuestions.length;
    await testSession.save();

    // Save results to database
    const resultId = new mongoose.Types.ObjectId();
    console.log('📝 Creating new psychometric test result with ID:', resultId.toString());
    
    const testResult = new PsychometricTestResult({
      _id: resultId,
      user: userId,
      job: testSession.job,
      answers: answers.reduce((acc, answer, index) => {
        acc[`question_${index}`] = answer;
        return acc;
      }, {} as Record<string, any>),
      scores: { overall: validAiGradingResult.overallScore },
      overallScore: validAiGradingResult.overallScore,
      interpretation: validAiGradingResult.interpretation,
      recommendations: validAiGradingResult.recommendations,
      completedAt: new Date(),
      timeSpent: validatedTimeSpent,
      grade: validAiGradingResult.grade,
      percentile: validAiGradingResult.percentile,
      categoryScores: validAiGradingResult.categoryScores,
      failedQuestions: validAiGradingResult.failedQuestions,
      correctQuestions: validAiGradingResult.correctQuestions,
      testMetadata: {
        testId: sessionId,
        title: `Psychometric Test for ${jobTitle}`,
        type: 'simple',
        categories: [...new Set(questions.map((q: any) => q.category))],
        difficulty: testSession.testLevel,
        isGenerated: true,
        jobSpecific: true,
        questions: questions
      }
    });
    
    console.log('📝 Creating test result with data:', {
      overallScore: validAiGradingResult.overallScore,
      grade: validAiGradingResult.grade,
      correctQuestionsLength: validAiGradingResult.correctQuestions.length,
      failedQuestionsLength: validAiGradingResult.failedQuestions.length,
      timeSpent: validatedTimeSpent
    });
    
    // Verify that the data contains grades before saving
    console.log('📝 Verifying AI grades before database save:', {
      hasOverallScore: validAiGradingResult.overallScore !== undefined,
      hasGrade: validAiGradingResult.grade !== undefined,
      overallScore: validAiGradingResult.overallScore,
      grade: validAiGradingResult.grade
    });

    await testResult.save();
    console.log('✅ Psychometric test result saved successfully with ID:', (testResult._id as mongoose.Types.ObjectId).toString());

    // Use the actual saved ID from the database
    const rawResultId = (testResult._id as mongoose.Types.ObjectId).toString();
    const formattedResultId = `result_${rawResultId}`;
    
    console.log('📝 Sending psychometric test result response with IDs:', {
      resultId: formattedResultId,
      rawResultId: rawResultId,
      id: rawResultId,
      _id: rawResultId
    });

    res.status(200).json({
      success: true,
      data: {
        resultId: formattedResultId,
        rawResultId: rawResultId,
        id: rawResultId, // Additional field for frontend compatibility
        _id: rawResultId, // Additional field for frontend compatibility
        score: validAiGradingResult.overallScore,
        grade: validAiGradingResult.grade,
        correctAnswers: validAiGradingResult.correctQuestions.length,
        incorrectAnswers: validAiGradingResult.failedQuestions.length,
        totalQuestions: totalQuestionsInTest, // Use original test count to ensure consistency
        timeSpent: validatedTimeSpent,
        categoryScores: validAiGradingResult.categoryScores,
        interpretation: validAiGradingResult.interpretation,
        recommendations: validAiGradingResult.recommendations,
        percentile: validAiGradingResult.percentile,
        hasDetailedResults: true,
        message: 'Test submitted and graded successfully by AI'
      }
    });
  } catch (error: any) {
    console.error('Error submitting test:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit test',
      message: error.message
    });
  }
};

// Get test session details
export const getTestSession = async (req: AuthRequest, res: Response) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Session ID is required'
      });
    }

    // Fetch the actual test session from the database
    const testSession = await TestSession.findById(sessionId).populate('job');
    
    if (!testSession) {
      return res.status(404).json({
        success: false,
        error: 'Test session not found'
      });
    }

    // Check if the session belongs to the requesting user
    if (testSession.user.toString() !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied to this test session'
      });
    }

    // Return the actual test session details
    res.status(200).json({
      success: true,
      data: {
        sessionId: testSession._id,
        questions: testSession.questions,
        timeLimit: testSession.timeLimit,
        startedAt: testSession.startedAt || new Date().toISOString(),
        job: testSession.job
      }
    });
  } catch (error: any) {
    console.error('Error getting test session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get test session',
      message: error.message
    });
  }
};

// Get detailed test result by ID
export const getDetailedTestResult = async (req: AuthRequest, res: Response) => {
  try {
    const { resultId } = req.params;
    const userId = req.user?.id;

    console.log('📝 Fetching detailed test result with parameter:', { resultId, userId });

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    if (!resultId || resultId === 'undefined') {
      console.log('❌ Invalid result ID provided:', resultId);
      return res.status(400).json({
        success: false,
        error: 'Result ID is required'
      });
    }

    // Handle the case where resultId is already in the format "result_xxx"
    let sessionId = resultId;
    if (resultId.startsWith('result_')) {
      sessionId = resultId.replace('result_', '');
      console.log('📝 Converted formatted result ID to raw ID:', { original: resultId, converted: sessionId });
    }
    
    console.log('📝 Extracted session ID for database query:', sessionId);
    
    // Log all recent test results for this user to help with debugging
    const recentResults = await PsychometricTestResult.find({ user: userId })
      .sort({ completedAt: -1 })
      .limit(5);
    
    console.log('📝 Recent test results for user (last 5):', recentResults.map(r => ({
      id: (r._id as mongoose.Types.ObjectId).toString(),
      completedAt: r.completedAt,
      overallScore: r.overallScore,
      grade: r.grade
    })));
    
    // Check if the requested result ID matches any recent result
    const matchingResult = recentResults.find(r => (r._id as mongoose.Types.ObjectId).toString() === sessionId);
    if (!matchingResult) {
      console.log('⚠️ Warning: Requested result ID does not match any recent results for this user');
    }
    
    // Handle temporary IDs (format: temp-*) - these are not valid MongoDB ObjectIds
    if (sessionId && sessionId.startsWith('temp-')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid result ID: Temporary IDs cannot be used to fetch detailed results'
      });
    }

    // Validate ObjectId format
    if (!/^[0-9a-fA-F]{24}$/.test(sessionId)) {
      console.log('❌ Invalid ObjectId format:', sessionId);
      return res.status(400).json({
        success: false,
        error: 'Invalid result ID format: Must be a valid MongoDB ObjectId'
      });
    }

    // Fetch the test result from database
    const testResult = await PsychometricTestResult.findById(sessionId);
    
    if (!testResult) {
      console.log('❌ Test result not found in database for ID:', sessionId);
      return res.status(404).json({
        success: false,
        error: 'Test result not found'
      });
    }

    console.log('✅ Test result found in database:', {
      id: (testResult._id as mongoose.Types.ObjectId).toString(),
      user: testResult.user.toString(),
      overallScore: testResult.overallScore,
      grade: testResult.grade,
      correctQuestionsLength: testResult.correctQuestions?.length,
      failedQuestionsLength: testResult.failedQuestions?.length,
      timeSpent: testResult.timeSpent
    });
    
    // Verify that the retrieved data contains grades
    console.log('📝 Verifying database grades after retrieval:', {
      hasOverallScore: testResult.overallScore !== undefined,
      hasGrade: testResult.grade !== undefined,
      overallScore: testResult.overallScore,
      grade: testResult.grade
    });
    
    // Check if this might be an incomplete result
    const isCompleteResult = testResult.overallScore !== undefined && 
                            testResult.grade !== undefined && 
                            ((testResult.correctQuestions?.length ?? 0) > 0 || (testResult.failedQuestions?.length ?? 0) > 0);
    
    if (!isCompleteResult) {
      console.log('⚠️ Warning: This appears to be an incomplete test result');
    }

    // Check if the result belongs to the requesting user
    if (testResult.user.toString() !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied to this test result'
      });
    }

    // Format the response to match the frontend expectations
    const rawResultId = (testResult._id as mongoose.Types.ObjectId).toString();
    const correctQuestionsCount = testResult.correctQuestions?.length || 0;
    const failedQuestionsCount = testResult.failedQuestions?.length || 0;
    const totalQuestionsCount = correctQuestionsCount + failedQuestionsCount;
    
    // Ensure we have valid data from database, with special handling for incomplete results
    const overallScore = testResult.overallScore !== undefined ? testResult.overallScore : 0;
    const grade = testResult.grade || (isCompleteResult ? 'F' : 'Incomplete'); // Different default for incomplete results
    
    console.log('📝 Calculating question counts for response:', {
      correct: correctQuestionsCount,
      failed: failedQuestionsCount,
      total: totalQuestionsCount
    });
    
    const formattedResult = {
      resultId: `result_${rawResultId}`,
      rawResultId: rawResultId,
      id: rawResultId, // Additional field for frontend compatibility
      _id: rawResultId, // Additional field for frontend compatibility
      score: overallScore,
      grade: grade,
      correctAnswers: correctQuestionsCount,
      incorrectAnswers: failedQuestionsCount,
      totalQuestions: totalQuestionsCount,
      timeSpent: testResult.timeSpent,
      categoryScores: testResult.categoryScores || {},
      interpretation: testResult.interpretation,
      recommendations: testResult.recommendations || [],
      percentile: testResult.percentile,
      hasDetailedResults: isCompleteResult, // Only true for complete results
      correctQuestions: testResult.correctQuestions || [],
      failedQuestions: testResult.failedQuestions || [],
      completedAt: testResult.completedAt
    };

    console.log('📝 Sending detailed test result response with IDs:', {
      resultId: formattedResult.resultId,
      rawResultId: formattedResult.rawResultId,
      id: formattedResult.id,
      _id: formattedResult._id
    });

    res.status(200).json({
      success: true,
      data: formattedResult,
      message: 'Test result retrieved successfully'
    });
  } catch (error: any) {
    console.error('Error getting detailed test result:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get test result',
      message: error.message
    });
  }
};

export const getUserTestResults = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    
    console.log('📝 Fetching user test results for user ID:', userId);

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }
    
    // Fetch user's test results from database, sorted by completedAt (newest first)
    const testResults = await PsychometricTestResult.find({ user: userId })
      .sort({ completedAt: -1 }); // -1 for descending (newest first)
    
    console.log('✅ Found', testResults.length, 'test results for user, sorted by date (newest first)');
    
    // Log the IDs and dates of all results found
    testResults.forEach((result, index) => {
      console.log(`📝 Result ${index + 1}: ID=${(result._id as mongoose.Types.ObjectId).toString()}, CompletedAt=${result.completedAt}`);
    });
    
    const formattedResults = testResults.map(result => {
      console.log('📝 Processing result in user results:', {
        id: (result._id as mongoose.Types.ObjectId).toString(),
        overallScore: result.overallScore,
        grade: result.grade,
        correctQuestionsLength: result.correctQuestions?.length,
        failedQuestionsLength: result.failedQuestions?.length
      });
      
      // Verify that the retrieved data contains grades
      console.log('📝 Verifying database grades for user result:', {
        id: (result._id as mongoose.Types.ObjectId).toString(),
        hasOverallScore: result.overallScore !== undefined,
        hasGrade: result.grade !== undefined,
        overallScore: result.overallScore,
        grade: result.grade
      });
      
      const rawResultId = (result._id as mongoose.Types.ObjectId).toString();
      const correctQuestionsCount = result.correctQuestions?.length || 0;
      const failedQuestionsCount = result.failedQuestions?.length || 0;
      const totalQuestionsCount = correctQuestionsCount + failedQuestionsCount;
      
      // Ensure we have valid data from database
      const overallScore = result.overallScore || 0;
      const grade = result.grade || 'F'; // Default to 'F' if no grade
      
      return {
        resultId: `result_${rawResultId}`,
        rawResultId: rawResultId,
        id: rawResultId, // Additional field for frontend compatibility
        _id: rawResultId, // Additional field for frontend compatibility
        score: overallScore,
        grade: grade,
        correctAnswers: correctQuestionsCount,
        incorrectAnswers: failedQuestionsCount,
        totalQuestions: totalQuestionsCount,
        timeSpent: result.timeSpent,
        categoryScores: result.categoryScores || {},
        interpretation: result.interpretation,
        recommendations: result.recommendations || [],
        percentile: result.percentile,
        hasDetailedResults: true,
        completedAt: result.completedAt
      };
    });
    
    console.log('📝 Sending user test results response with', formattedResults.length, 'results');
    
    // Also log the IDs of all results being sent to help with debugging
    console.log('📝 All result IDs being sent:', formattedResults.map(r => r.id));

    res.status(200).json({
      success: true,
      data: formattedResults,
      message: 'Test results retrieved successfully'
    });
  } catch (error: any) {
    console.error('Error getting user test results:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get test results',
      message: error.message
    });
  }
};