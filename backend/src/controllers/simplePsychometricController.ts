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

// Helper function to calculate grade based on score
const getGrade = (score: number): string => {
  if (score >= 90) return 'A+';
  if (score >= 80) return 'A';
  if (score >= 70) return 'B';
  if (score >= 60) return 'C';
  if (score >= 50) return 'D';
  return 'F';
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

export const getDetailedTestResult = async (req: AuthRequest, res: Response) => {
  try {
    const { resultId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    if (!resultId) {
      return res.status(400).json({
        success: false,
        error: 'Result ID is required'
      });
    }

    // Extract session ID from result ID (format: result_sessionId)
    const sessionId = resultId.replace('result_', '');
    
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Invalid result ID format'
      });
    }

    // Fetch the test session from the database
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
        error: 'Access denied to this test result'
      });
    }

    // Check if test has been completed
    if (testSession.status !== 'completed') {
      return res.status(400).json({
        success: false,
        error: 'Test has not been completed yet'
      });
    }

    // Return the test result details
    res.status(200).json({
      success: true,
      data: {
        resultId: `result_${testSession._id}`,
        sessionId: testSession._id,
        jobId: testSession.job?._id,
        jobTitle: testSession.job ? (testSession.job as any).title : undefined,
        score: (testSession as any).score || 0,
        grade: (testSession as any).grade || 'N/A',
        correctAnswers: (testSession as any).correctAnswers || 0,
        totalQuestions: testSession.questions?.length || 0,
        timeSpent: (testSession as any).timeSpent || 0,
        submittedAt: testSession.completedAt,
        questions: testSession.questions
      },
      message: 'Detailed test result retrieved successfully'
    });
  } catch (error: any) {
    console.error('Error getting detailed test result:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve test result',
      message: error.message
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

    // Calculate score by comparing answers with correct answers
    let correctAnswers = 0;
    const detailedResults = [];

    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      const userAnswer = answers[i];
      const isCorrect = userAnswer === (question as any).correctAnswer;

      if (isCorrect) {
        correctAnswers++;
      }

      detailedResults.push({
        questionId: i,
        userAnswer,
        correctAnswer: (question as any).correctAnswer,
        isCorrect,
        category: (question as any).category
      });
    }

    const score = Math.round((correctAnswers / questions.length) * 100);
    const grade = getGrade(score);

    // Update test session status to completed and store results
    testSession.status = 'completed';
    testSession.completedAt = new Date();
    (testSession as any).timeSpent = timeSpent || 0;
    (testSession as any).score = score;
    (testSession as any).grade = grade;
    (testSession as any).correctAnswers = correctAnswers;
    await testSession.save();

    // In a full implementation, you would save this to a results collection
    // For now, we'll just return the result data

    res.status(200).json({
      success: true,
      data: {
        resultId: `result_${sessionId}`,
        score,
        grade,
        correctAnswers,
        totalQuestions: questions.length,
        timeSpent: timeSpent || 0,
        message: 'Test submitted and graded successfully'
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

export const getUserTestResults = async (req: AuthRequest, res: Response) => {
  res.status(200).json({
    success: true,
    data: [],
    message: 'Test results retrieved successfully'
  });
};

