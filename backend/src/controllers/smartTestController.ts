import { Request, Response } from 'express';
import { SmartTest, SmartTestResult, Job } from '../models';
import { AuthRequest } from '../middleware/auth';
import { aiService } from '../services/aiService';
import mongoose from 'mongoose';

/**
 * @desc Generate a smart test for job preparation
 * @route POST /api/smart-tests/generate
 * @access Private
 */
export const generateSmartTest = async (req: AuthRequest, res: Response) => {
  try {
    console.log('📝 Generating smart test - Request body:', req.body);
    const { jobId, difficulty, questionCount } = req.body;
    const userId = req.user?.id;
    console.log('📝 User ID:', userId);

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    // Validate input
    console.log('📝 Validating jobId:', jobId, 'isValid:', mongoose.Types.ObjectId.isValid(jobId));
    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      console.error('❌ Invalid job ID format:', jobId);
      return res.status(400).json({
        success: false,
        error: 'Invalid job ID format'
      });
    }

    const validDifficulties = ['basic', 'intermediate', 'advanced'];
    console.log('📝 Validating difficulty:', difficulty, 'isValid:', validDifficulties.includes(difficulty));
    if (!validDifficulties.includes(difficulty)) {
      console.error('❌ Invalid difficulty level:', difficulty, 'Valid options:', validDifficulties);
      return res.status(400).json({
        success: false,
        error: `Invalid difficulty level. Must be one of: ${validDifficulties.join(', ')}`
      });
    }

    console.log('📝 Validating questionCount:', questionCount, 'type:', typeof questionCount);
    if (!questionCount || questionCount < 5 || questionCount > 50) {
      console.error('❌ Invalid question count:', questionCount);
      return res.status(400).json({
        success: false,
        error: 'Question count must be between 5 and 50'
      });
    }

    // Get job details
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    // Check if user already has an active smart test for this job
    const existingTest = await SmartTest.findOne({
      userId,
      jobId,
      difficulty,
      isActive: true
    });

    if (existingTest) {
      return res.status(200).json({
        success: true,
        data: existingTest,
        message: 'Smart test already exists for this job and difficulty level'
      });
    }

    // Generate test using AI service
    const prompt = `Create a job preparation test for the role of ${job.title} at ${job.company}. The test should simulate the type of questions an applicant may encounter in real pre-employment or screening tests for this role.

Guidelines:
- Number of questions: ${questionCount}
- Question types: Multiple-choice, case study, coding challenge, situational question, technical questions (depending on the role)
- Difficulty: ${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
- Industry: ${job.industry || 'General'}
- Experience Level: ${job.experienceLevel || 'General'}
- Required Skills: ${job.skills?.join(', ') || 'General skills'}

Make it job-specific and include:
1. Technical knowledge relevant to the role
2. Functional skills required for the position
3. Industry-related knowledge
4. Situational judgment questions
5. Problem-solving scenarios

For each question provide:
- Clear question text
- Type of question (see types below)
- Multiple choice options (ONLY for multiple_choice and situational questions)
- Correct answer (index for MC, sample answer for text questions)
- Detailed explanation of why the answer is correct
- Category (technical, behavioral, industry-specific, etc.)

Question Types:
- multiple_choice: Traditional MC questions with 4 options (requires "options" array)
- situational: Scenario-based MC questions with 4 options (requires "options" array)  
- technical: Open-ended technical questions requiring written answers (NO options array)
- case_study: Complex scenario questions requiring detailed written responses (NO options array)
- coding_challenge: Programming questions requiring code solutions (NO options array)

Return the response in JSON format with the following structure:
{
  "questions": [
    {
      "id": "q1",
      "question": "Question text here",
      "type": "multiple_choice|situational|technical|case_study|coding_challenge",
      "options": ["Option A", "Option B", "Option C", "Option D"], // ONLY for multiple_choice and situational types
      "correctAnswer": 0, // Index for MC/situational, sample answer text for others
      "explanation": "Detailed explanation",
      "category": "technical|behavioral|industry|problem_solving"
    }
  ]
}`;

    console.log('🤖 Generating test using AI service...');
    const testData = await aiService.generateJobPreparationTest(prompt, {
      jobTitle: job.title,
      company: job.company,
      industry: job.industry,
      difficulty,
      questionCount
    });

    console.log('🤖 AI service response:', {
      hasQuestions: !!testData.questions,
      isArray: Array.isArray(testData.questions),
      questionCount: testData.questions?.length
    });

    if (!testData.questions || !Array.isArray(testData.questions)) {
      console.error('❌ Invalid AI service response structure:', testData);
      return res.status(500).json({
        success: false,
        error: 'Failed to generate test questions - invalid structure'
      });
    }

    if (testData.questions.length === 0) {
      console.error('❌ No questions generated by AI service');
      return res.status(500).json({
        success: false,
        error: 'Failed to generate test questions - no questions returned'
      });
    }

    // Create smart test
    const testId = `smart_${userId}_${jobId}_${Date.now()}`;
    const timeLimit = Math.max(questionCount * 1.5, 15); // 1.5 minutes per question, minimum 15 minutes

    // Log question types for debugging
    const questionTypes = testData.questions.map((q: any, i: number) => ({ 
      index: i, 
      originalType: q.type, 
      mappedType: q.type === 'multiple-choice' ? 'multiple_choice' : q.type 
    }));
    console.log('📝 Question types mapping:', questionTypes);

    console.log('📝 Creating smart test with data:', {
      testId,
      jobId,
      userId,
      questionsCount: testData.questions.length,
      timeLimit,
      difficulty
    });

    const smartTest = await SmartTest.create({
      testId,
      title: `Job Preparation Test: ${job.title}`,
      description: `Smart test to prepare for ${job.title} position at ${job.company}`,
      jobId,
      jobTitle: job.title,
      company: job.company,
      userId,
      questions: testData.questions.map((q: any, index: number) => {
        // Map question type to valid enum values
        let questionType = q.type || 'multiple_choice';
        if (questionType === 'multiple-choice') questionType = 'multiple_choice';
        if (questionType === 'case-study') questionType = 'case_study';
        if (questionType === 'coding-challenge') questionType = 'coding_challenge';
        
        // Validate question type
        const validTypes = ['multiple_choice', 'case_study', 'coding_challenge', 'situational', 'technical'];
        if (!validTypes.includes(questionType)) {
          questionType = 'multiple_choice'; // fallback to default
        }
        
        return {
          id: q.id || `q${index + 1}`,
          question: q.question,
          type: questionType,
          options: q.options || [],
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          category: q.category || 'general',
          difficulty
        };
      }),
      timeLimit,
      difficulty,
      questionCount: testData.questions.length,
      industry: job.industry,
      jobRole: job.title,
      skillsRequired: job.skills || [],
      isActive: true
    });

    console.log('✅ Smart test created successfully:', smartTest._id);

    console.log(`✅ Smart test generated for ${job.title} - ${testData.questions.length} questions`);

    res.status(201).json({
      success: true,
      data: smartTest,
      message: 'Smart test generated successfully'
    });

  } catch (error: any) {
    console.error('❌ Error generating smart test:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Failed to generate smart test';
    let statusCode = 500;
    
    if (error.name === 'ValidationError') {
      errorMessage = 'Invalid test data: ' + error.message;
      statusCode = 400;
    } else if (error.code === 11000) {
      errorMessage = 'A test with this configuration already exists';
      statusCode = 409;
    } else if (error.message?.includes('AI service')) {
      errorMessage = 'AI service temporarily unavailable. Please try again later.';
      statusCode = 503;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    res.status(statusCode).json({
      success: false,
      error: errorMessage
    });
  }
};

/**
 * @desc Get user's smart tests
 * @route GET /api/smart-tests/user
 * @access Private
 */
export const getUserSmartTests = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const smartTests = await SmartTest.find({ userId, isActive: true })
      .populate('jobId', 'title company industry location')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: smartTests
    });

  } catch (error) {
    console.error('Error fetching user smart tests:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch smart tests'
    });
  }
};

/**
 * @desc Get smart test by ID
 * @route GET /api/smart-tests/:testId
 * @access Private
 */
export const getSmartTestById = async (req: AuthRequest, res: Response) => {
  try {
    const { testId } = req.params;
    const userId = req.user?.id;

    const smartTest = await SmartTest.findOne({ testId, userId, isActive: true })
      .populate('jobId', 'title company industry location');

    if (!smartTest) {
      return res.status(404).json({
        success: false,
        error: 'Smart test not found'
      });
    }

    res.status(200).json({
      success: true,
      data: smartTest
    });

  } catch (error) {
    console.error('Error fetching smart test:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch smart test'
    });
  }
};

/**
 * @desc Start smart test session
 * @route POST /api/smart-tests/:testId/start
 * @access Private
 */
export const startSmartTest = async (req: AuthRequest, res: Response) => {
  try {
    const { testId } = req.params;
    const userId = req.user?.id;

    const smartTest = await SmartTest.findOne({ testId, userId, isActive: true });

    if (!smartTest) {
      return res.status(404).json({
        success: false,
        error: 'Smart test not found'
      });
    }

    // Generate session ID
    const sessionId = `session_${testId}_${Date.now()}`;

    // Return test without correct answers
    const testForUser = {
      ...smartTest.toObject(),
      questions: smartTest.questions.map(q => ({
        id: q.id,
        question: q.question,
        type: q.type,
        options: q.options,
        category: q.category
        // Exclude correctAnswer and explanation
      }))
    };

    res.status(200).json({
      success: true,
      data: {
        sessionId,
        test: testForUser
      }
    });

  } catch (error) {
    console.error('Error starting smart test:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start smart test'
    });
  }
};

/**
 * @desc Submit smart test answers
 * @route POST /api/smart-tests/:testId/submit
 * @access Private
 */
export const submitSmartTest = async (req: AuthRequest, res: Response) => {
  try {
    const { testId } = req.params;
    const { sessionId, answers, timeSpent } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const smartTest = await SmartTest.findOne({ testId, userId, isActive: true });

    if (!smartTest) {
      return res.status(404).json({
        success: false,
        error: 'Smart test not found'
      });
    }

    // Calculate score and detailed results
    let correctAnswers = 0;
    const detailedResults = smartTest.questions.map(question => {
      const userAnswer = answers[question.id];
      const isCorrect = JSON.stringify(userAnswer) === JSON.stringify(question.correctAnswer);
      
      if (isCorrect) correctAnswers++;

      return {
        questionId: question.id,
        question: question.question,
        userAnswer,
        correctAnswer: question.correctAnswer,
        isCorrect,
        explanation: question.explanation,
        category: question.category
      };
    });

    const incorrectAnswers = smartTest.questions.length - correctAnswers;
    const score = correctAnswers;
    const percentageScore = Math.round((correctAnswers / smartTest.questions.length) * 100);

    // Generate feedback
    const feedback = generateSmartTestFeedback(percentageScore, detailedResults, smartTest.jobTitle);

    // Save result
    const testResult = await SmartTestResult.create({
      testId,
      userId,
      jobId: smartTest.jobId,
      answers,
      score,
      percentageScore,
      correctAnswers,
      incorrectAnswers,
      timeSpent,
      isCompleted: true,
      detailedResults,
      feedback,
      completedAt: new Date()
    });

    res.status(201).json({
      success: true,
      data: testResult,
      message: 'Smart test submitted successfully'
    });

  } catch (error) {
    console.error('Error submitting smart test:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit smart test'
    });
  }
};

/**
 * @desc Get user's smart test results
 * @route GET /api/smart-tests/results
 * @access Private
 */
export const getUserSmartTestResults = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const results = await SmartTestResult.find({ userId })
      .populate('jobId', 'title company industry')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: results
    });

  } catch (error) {
    console.error('Error fetching smart test results:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch smart test results'
    });
  }
};

// Helper function to generate feedback
function generateSmartTestFeedback(percentageScore: number, detailedResults: any[], jobTitle: string) {
  const categoryScores: Record<string, { correct: number; total: number }> = {};
  
  // Calculate category-wise performance
  detailedResults.forEach(result => {
    if (!categoryScores[result.category]) {
      categoryScores[result.category] = { correct: 0, total: 0 };
    }
    categoryScores[result.category].total++;
    if (result.isCorrect) {
      categoryScores[result.category].correct++;
    }
  });

  let overall = '';
  const strengths: string[] = [];
  const improvements: string[] = [];
  const recommendations: string[] = [];

  // Overall performance
  if (percentageScore >= 85) {
    overall = `Excellent performance! You're well-prepared for ${jobTitle} position interviews and assessments.`;
  } else if (percentageScore >= 70) {
    overall = `Good performance! You have a solid foundation for the ${jobTitle} position, with some areas for improvement.`;
  } else if (percentageScore >= 55) {
    overall = `Fair performance. You have basic knowledge but need more preparation for the ${jobTitle} position.`;
  } else {
    overall = `Your performance indicates significant preparation is needed for the ${jobTitle} position.`;
  }

  // Identify strengths and improvements by category
  Object.entries(categoryScores).forEach(([category, scores]) => {
    const categoryPercentage = (scores.correct / scores.total) * 100;
    
    if (categoryPercentage >= 80) {
      strengths.push(`Strong performance in ${category} questions`);
    } else if (categoryPercentage <= 50) {
      improvements.push(`Need improvement in ${category} skills`);
    }
  });

  // Generate recommendations
  if (percentageScore < 70) {
    recommendations.push(`Study more about ${jobTitle} specific skills and requirements`);
    recommendations.push('Practice similar questions to improve your performance');
  }

  if (improvements.length > 0) {
    recommendations.push('Focus on your weaker areas identified in the results');
  }

  recommendations.push('Review the explanations for incorrect answers to learn from mistakes');
  recommendations.push(`Research common interview questions for ${jobTitle} positions`);

  return {
    overall,
    strengths,
    improvements,
    recommendations
  };
}

export {
  getUserSmartTests,
  getSmartTestById,
  startSmartTest,
  submitSmartTest,
  getUserSmartTestResults
};