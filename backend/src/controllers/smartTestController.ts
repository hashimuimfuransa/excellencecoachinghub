import { Request, Response } from 'express';
import { SmartTest, SmartTestResult, Job } from '../models';
import { AuthRequest } from '../middleware/auth';
import { aiService } from '../services/aiService';
import { fileParsingService } from '../services/fileParsingService';
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

    // Check if user already has an active smart test for this job with same type
    const testType = req.body.testType || 'free';
    const existingTest = await SmartTest.findOne({
      userId,
      jobId,
      difficulty,
      testType,
      isActive: true
    });

    if (existingTest) {
      console.log(`⚠️ Found existing ${testType} test for job ${jobId} with difficulty ${difficulty}`);
      return res.status(200).json({
        success: true,
        data: existingTest,
        message: `Smart test already exists for this job and difficulty level (${testType})`
      });
    }

    console.log(`✅ No existing ${testType} test found for job ${jobId} - proceeding with generation`);

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
      difficulty,
      testType
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
      testType, // Use the testType variable we defined earlier
      isActive: true
    });

    console.log('✅ Smart test created successfully:', {
      id: smartTest._id,
      testId: smartTest.testId,
      testType: smartTest.testType,
      userId: smartTest.userId,
      jobId: smartTest.jobId
    });

    console.log(`✅ Smart test generated for ${job.title} - ${testData.questions.length} questions - Type: ${smartTest.testType}`);

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
 * @desc Generate a free smart test (one-time only per user)
 * @route POST /api/smart-tests/generate-free
 * @access Private
 */
export const generateFreeSmartTest = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    console.log(`🔒 Checking free test eligibility for user: ${userId}`);

    // Import FreeTestUsage model for permanent tracking
    const { FreeTestUsage } = await import('../models/FreeTestUsage');

    // Check if user has already used their free smart test (PERMANENT CHECK)
    const existingFreeTestUsage = await FreeTestUsage.findOne({
      userId,
      testType: 'smart_test'
    });

    if (existingFreeTestUsage) {
      console.log(`❌ User ${userId} has already used their free smart test - PERMANENTLY LOCKED`);
      console.log(`   Used at: ${existingFreeTestUsage.usedAt}`);
      console.log(`   Test ID: ${existingFreeTestUsage.testId}`);
      
      return res.status(400).json({
        success: false,
        error: 'You have already used your one-time free smart test. This limitation is PERMANENT and cannot be reset. Please upgrade to premium for more tests.',
        code: 'FREE_TEST_ALREADY_USED',
        data: { 
          hasUsedFreeTest: true,
          permanentlyLocked: true,
          permanentLockDate: existingFreeTestUsage.usedAt,
          freeTestId: existingFreeTestUsage.testId,
          usedAt: existingFreeTestUsage.createdAt
        }
      });
    }

    console.log(`✅ User ${userId} is eligible for free test - generating now`);

    // Add testType: 'free' to the request
    req.body.testType = 'free';

    // Store original response methods to intercept success
    const originalJson = res.json.bind(res);
    let testGenerated = false;
    
    // Override res.json to capture successful test generation
    res.json = function(data: any) {
      if (data?.success && data?.data?._id) {
        testGenerated = true;
        const testId = data.data.testId || data.data._id;
        
        // Record the free test usage permanently (non-blocking)
        FreeTestUsage.create({
          userId,
          testType: 'smart_test',
          testId,
          usedAt: new Date(),
          permanentLock: true
        }).then(() => {
          console.log(`🔒 PERMANENTLY LOCKED: Free smart test usage recorded for user ${userId} with testId: ${testId}`);
        }).catch((trackingError) => {
          console.error('Error tracking free test usage (test was generated but tracking failed):', trackingError);
        });
      }
      return originalJson(data);
    };

    // Call the regular generate function with the free test flag
    return generateSmartTest(req, res);
  } catch (error: any) {
    console.error('Error generating free smart test:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate free smart test'
    });
  }
};

/**
 * @desc Generate a premium smart test (requires payment)
 * @route POST /api/smart-tests/generate-premium
 * @access Private
 */
export const generatePremiumSmartTest = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { jobId } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    if (!jobId) {
      return res.status(400).json({
        success: false,
        error: 'Job ID is required'
      });
    }

    console.log(`🔐 Checking payment approval for premium smart test - User: ${userId}, Job: ${jobId}`);

    // Import PaymentRequest model at the top of the function to avoid circular dependencies
    const PaymentRequest = (await import('../models/PaymentRequest')).default;

    // Check if user has approved payment request for this job and smart test
    const approvedPaymentRequest = await PaymentRequest.findOne({
      userId,
      jobId,
      testType: 'smart_test',
      status: 'approved'
    });

    if (!approvedPaymentRequest) {
      console.log(`❌ No approved payment request found for user ${userId} and job ${jobId}`);
      return res.status(402).json({
        success: false,
        error: 'Payment approval required for premium smart test. Please submit a payment request first.',
        code: 'PAYMENT_APPROVAL_REQUIRED',
        data: {
          requiresPayment: true,
          jobId,
          testType: 'smart_test',
          message: 'You need to submit and get approval for a payment request before generating a premium smart test.'
        }
      });
    }

    // Check if this payment request has already been used for a test
    const existingTest = await SmartTest.findOne({
      userId,
      jobId,
      testType: 'premium'
    });

    if (existingTest) {
      console.log(`⚠️ Premium smart test already exists for this job - User: ${userId}, Job: ${jobId}`);
      return res.status(400).json({
        success: false,
        error: 'You have already generated a premium smart test for this job.',
        code: 'TEST_ALREADY_EXISTS',
        data: {
          existingTestId: existingTest.testId,
          testCreatedAt: existingTest.createdAt
        }
      });
    }

    console.log(`✅ Payment approved - generating premium smart test for user ${userId}`);

    // Add testType: 'premium' to the request
    req.body.testType = 'premium';

    // Mark the payment request as completed
    approvedPaymentRequest.status = 'completed';
    approvedPaymentRequest.completedAt = new Date();
    await approvedPaymentRequest.save();

    // Call the regular generate function with the premium test flag
    return generateSmartTest(req, res);
  } catch (error: any) {
    console.error('Error generating premium smart test:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate premium smart test'
    });
  }
};

/**
 * @desc Debug endpoint to check all user tests in database
 * @route GET /api/smart-tests/debug-user-tests
 * @access Private
 */
export const debugUserTests = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    console.log(`🐛 DEBUG: Fetching ALL tests for user: ${userId}`);

    // Get all tests (including inactive)
    const allTests = await SmartTest.find({ userId })
      .populate('jobId', 'title company industry location')
      .sort({ createdAt: -1 });

    console.log(`🐛 DEBUG: Found ${allTests.length} total tests for user ${userId}`);

    const testDetails = allTests.map(test => ({
      id: test._id,
      testId: test.testId,
      testType: test.testType,
      title: test.title,
      isActive: test.isActive,
      createdAt: test.createdAt,
      jobTitle: test.jobTitle,
      company: test.company
    }));

    console.log(`🐛 DEBUG: Test details:`, testDetails);

    res.status(200).json({
      success: true,
      data: {
        allTests: testDetails,
        totalCount: allTests.length,
        activeCount: allTests.filter(t => t.isActive).length,
        premiumCount: allTests.filter(t => t.testType === 'premium').length,
        freeCount: allTests.filter(t => t.testType === 'free').length
      }
    });

  } catch (error) {
    console.error('Error in debug endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Debug endpoint failed'
    });
  }
};

/**
 * @desc Check if user has used their free test
 * @route GET /api/smart-tests/free-test-status
 * @access Private
 */
export const checkFreeTestStatus = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    console.log(`🔍 Checking free test status for user: ${userId}`);

    // Import FreeTestUsage model for permanent tracking
    const { FreeTestUsage } = await import('../models/FreeTestUsage');

    // Check if user has already used their free smart test (PERMANENT CHECK)
    const existingFreeTestUsage = await FreeTestUsage.findOne({
      userId,
      testType: 'smart_test'
    });

    const hasUsedFreeTest = !!existingFreeTestUsage;
    const canUseFreeTest = !hasUsedFreeTest;

    console.log(`📊 Free test status for user ${userId}: hasUsed=${hasUsedFreeTest}, canUse=${canUseFreeTest}`);
    
    if (existingFreeTestUsage) {
      console.log(`   🔒 PERMANENTLY LOCKED since: ${existingFreeTestUsage.usedAt}`);
      console.log(`   🏷️ Test ID: ${existingFreeTestUsage.testId}`);
    }

    res.status(200).json({
      success: true,
      data: {
        hasUsedFreeTest,
        canUseFreeTest,
        permanentlyLocked: hasUsedFreeTest, // Once used, permanently locked
        freeTestId: existingFreeTestUsage?.testId || null,
        usedAt: existingFreeTestUsage?.usedAt || null,
        permanentLockDate: existingFreeTestUsage?.usedAt || null,
        message: hasUsedFreeTest 
          ? `You have already used your one-time free smart test on ${existingFreeTestUsage?.usedAt ? new Date(existingFreeTestUsage.usedAt).toLocaleDateString() : 'a previous date'}. This limitation is PERMANENT and cannot be reset.`
          : 'You can generate one free smart test.'
      }
    });
  } catch (error: any) {
    console.error('Error checking free test status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check free test status'
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

    console.log(`📋 Fetching smart tests for user: ${userId}`);

    const smartTests = await SmartTest.find({ userId, isActive: true })
      .populate('jobId', 'title company industry location')
      .sort({ createdAt: -1 });

    console.log(`📋 Found ${smartTests.length} smart tests:`, 
      smartTests.map(test => ({
        id: test._id,
        testId: test.testId,
        testType: test.testType,
        title: test.title,
        createdAt: test.createdAt
      }))
    );

    // Add cache-control headers to prevent caching issues
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

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

/**
 * @desc Get admin uploaded smart tests (for job seekers)
 * @route GET /api/smart-tests/admin
 * @access Private
 */
export const getAdminSmartTests = async (req: AuthRequest, res: Response) => {
  try {
    const smartTests = await SmartTest.find({ 
      isAdminUploaded: true, 
      isActive: true 
    })
      .populate('jobId', 'title company industry location')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: smartTests
    });

  } catch (error) {
    console.error('Error fetching admin smart tests:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch admin smart tests'
    });
  }
};

/**
 * @desc Create admin smart test
 * @route POST /api/smart-tests/admin/create
 * @access Private (Admin only)
 */
export const createAdminSmartTest = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const {
      title,
      description,
      jobTitle,
      company,
      industry,
      questionCount,
      timeLimit,
      difficulty,
      skillsRequired,
      questions
    } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    // Validate required fields
    if (!title || !description || !jobTitle) {
      return res.status(400).json({
        success: false,
        error: 'Title, description, and job title are required'
      });
    }

    // Generate unique test ID
    const testId = `admin_smart_${Date.now()}`;

    // Process questions if provided, otherwise create empty array
    let processedQuestions: any[] = [];
    if (questions && Array.isArray(questions)) {
      processedQuestions = questions.map((q: any, index: number) => ({
        id: q.id || `q${index + 1}`,
        question: q.question,
        type: q.type || 'multiple_choice',
        options: q.options || [],
        correctAnswer: q.correctAnswer,
        explanation: q.explanation || '',
        category: q.category || 'general',
        difficulty: q.difficulty || difficulty || 'basic'
      }));
    }

    // Process skills required
    let processedSkills = [];
    if (skillsRequired) {
      if (Array.isArray(skillsRequired)) {
        processedSkills = skillsRequired;
      } else if (typeof skillsRequired === 'string') {
        processedSkills = skillsRequired.split(',').map((s: string) => s.trim());
      }
    }

    const smartTest = await SmartTest.create({
      testId,
      title,
      description,
      jobTitle,
      company: company || '',
      industry: industry || '',
      userId,
      questions: processedQuestions,
      timeLimit: timeLimit || 30,
      difficulty: difficulty || 'basic',
      questionCount: questionCount || processedQuestions.length,
      jobRole: jobTitle,
      skillsRequired: processedSkills,
      isActive: true,
      isAdminUploaded: true,
      uploadedBy: `${req.user?.firstName} ${req.user?.lastName}`,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    res.status(201).json({
      success: true,
      data: smartTest,
      message: 'Admin smart test created successfully'
    });

  } catch (error: any) {
    console.error('Error creating admin smart test:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create admin smart test'
    });
  }
};

/**
 * @desc Update admin smart test
 * @route PUT /api/smart-tests/admin/:testId
 * @access Private (Admin only)
 */
export const updateAdminSmartTest = async (req: AuthRequest, res: Response) => {
  try {
    const { testId } = req.params;
    const updateData = req.body;

    const smartTest = await SmartTest.findOne({ testId });

    if (!smartTest) {
      return res.status(404).json({
        success: false,
        error: 'Smart test not found'
      });
    }

    // Update the test
    Object.assign(smartTest, updateData);
    await smartTest.save();

    res.status(200).json({
      success: true,
      data: smartTest,
      message: 'Smart test updated successfully'
    });

  } catch (error: any) {
    console.error('Error updating admin smart test:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update admin smart test'
    });
  }
};

/**
 * @desc Delete admin smart test
 * @route DELETE /api/smart-tests/admin/:testId
 * @access Private (Admin only)
 */
export const deleteAdminSmartTest = async (req: AuthRequest, res: Response) => {
  try {
    const { testId } = req.params;

    const smartTest = await SmartTest.findOneAndDelete({ testId });

    if (!smartTest) {
      return res.status(404).json({
        success: false,
        error: 'Smart test not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Smart test deleted successfully'
    });

  } catch (error: any) {
    console.error('Error deleting admin smart test:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete admin smart test'
    });
  }
};

/**
 * @desc Toggle smart test status
 * @route PATCH /api/smart-tests/admin/:testId/status
 * @access Private (Admin only)
 */
export const toggleSmartTestStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { testId } = req.params;
    const { isActive } = req.body;

    const smartTest = await SmartTest.findOneAndUpdate(
      { testId },
      { isActive },
      { new: true }
    );

    if (!smartTest) {
      return res.status(404).json({
        success: false,
        error: 'Smart test not found'
      });
    }

    res.status(200).json({
      success: true,
      data: smartTest,
      message: `Smart test ${isActive ? 'activated' : 'deactivated'} successfully`
    });

  } catch (error: any) {
    console.error('Error toggling smart test status:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update smart test status'
    });
  }
};

/**
 * @desc Upload smart test file
 * @route POST /api/smart-tests/admin/upload
 * @access Private (Admin only)
 */
export const uploadSmartTestFile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const file = req.file;

    console.log('📤 Smart test file upload request received');
    console.log('File details:', file ? {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    } : 'No file provided');

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    if (!file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    // Parse the uploaded file to extract questions
    console.log('📄 Parsing uploaded file...');
    const parseResult = await fileParsingService.parseFile(file);

    if (!parseResult.success || parseResult.questions.length === 0) {
      console.error('❌ File parsing failed:', parseResult.errors);
      return res.status(400).json({
        success: false,
        error: 'Failed to parse file',
        details: {
          errors: parseResult.errors,
          warnings: parseResult.warnings
        }
      });
    }

    console.log(`✅ Successfully parsed ${parseResult.totalQuestions} questions from file`);

    // Validate parsed questions
    const validation = fileParsingService.validateQuestions(parseResult.questions);
    if (validation.invalid.length > 0) {
      console.warn(`⚠️ Found ${validation.invalid.length} invalid questions`);
    }

    if (validation.valid.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid questions found in uploaded file',
        details: {
          invalidQuestions: validation.invalid.map(q => ({ index: q.index, errors: q.errors }))
        }
      });
    }

    // Get additional metadata from request body
    const { 
      title,
      description,
      jobTitle,
      company,
      industry,
      timeLimit,
      difficulty,
      skillsRequired
    } = req.body;

    // Use file name as title if not provided
    const testTitle = title || file.originalname.replace(/\.[^/.]+$/, "").replace(/[_-]/g, ' ');
    const testDescription = description || `Test created from uploaded file: ${file.originalname}`;
    const testJobTitle = jobTitle || 'General Position';

    // Generate unique test ID
    const testId = `admin_upload_${Date.now()}`;

    // Process skills required
    let processedSkills = [];
    if (skillsRequired) {
      if (Array.isArray(skillsRequired)) {
        processedSkills = skillsRequired;
      } else if (typeof skillsRequired === 'string') {
        processedSkills = skillsRequired.split(',').map((s: string) => s.trim()).filter(s => s.length > 0);
      }
    }

    // Create the smart test with parsed questions
    const smartTest = await SmartTest.create({
      testId,
      title: testTitle,
      description: testDescription,
      jobTitle: testJobTitle,
      company: company || '',
      industry: industry || '',
      userId,
      questions: validation.valid,
      timeLimit: timeLimit || 30,
      difficulty: difficulty || 'basic',
      questionCount: validation.valid.length,
      jobRole: testJobTitle,
      skillsRequired: processedSkills,
      isActive: true,
      isAdminUploaded: true,
      uploadedBy: `${req.user?.firstName} ${req.user?.lastName}`,
      uploadedFileName: file.originalname,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log(`✅ Smart test created successfully with ID: ${smartTest._id}`);

    // Include parsing statistics in response
    res.status(201).json({
      success: true,
      data: smartTest,
      message: `Smart test uploaded successfully with ${validation.valid.length} questions`,
      parsingDetails: {
        totalParsed: parseResult.totalQuestions,
        validQuestions: validation.valid.length,
        invalidQuestions: validation.invalid.length,
        warnings: parseResult.warnings,
        fileName: file.originalname
      }
    });

  } catch (error: any) {
    console.error('Error uploading smart test file:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to upload smart test file'
    });
  }
};

// Upload test content to existing test
export const uploadTestContentToExisting = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { testId } = req.params;
    const file = req.file;

    console.log('📤 Upload test content request received');
    console.log('Test ID:', testId);
    console.log('File details:', file ? {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    } : 'No file provided');

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    if (!testId) {
      return res.status(400).json({
        success: false,
        error: 'Test ID is required'
      });
    }

    if (!file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    // Find the existing test
    const existingTest = await SmartTest.findOne({ _id: testId });
    if (!existingTest) {
      return res.status(404).json({
        success: false,
        error: 'Test not found'
      });
    }

    // Parse the uploaded file to extract questions
    console.log('📄 Parsing uploaded content file...');
    const parseResult = await fileParsingService.parseFile(file);

    if (!parseResult.success || parseResult.questions.length === 0) {
      console.error('❌ File parsing failed:', parseResult.errors);
      return res.status(400).json({
        success: false,
        error: 'Failed to parse file content',
        details: {
          errors: parseResult.errors,
          warnings: parseResult.warnings
        }
      });
    }

    console.log(`✅ Successfully parsed ${parseResult.totalQuestions} questions from content file`);

    // Validate parsed questions
    const validation = fileParsingService.validateQuestions(parseResult.questions);
    if (validation.invalid.length > 0) {
      console.warn(`⚠️ Found ${validation.invalid.length} invalid questions in content file`);
    }

    if (validation.valid.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid questions found in uploaded content file',
        details: {
          invalidQuestions: validation.invalid.map(q => ({ index: q.index, errors: q.errors }))
        }
      });
    }

    // Prepare new questions with updated IDs to avoid conflicts
    const newQuestions = validation.valid.map((q: any, index: number) => ({
      ...q,
      id: `q${existingTest.questions.length + index + 1}`,
      difficulty: q.difficulty || existingTest.difficulty
    }));

    // Update the test with new questions
    existingTest.questions = [...existingTest.questions, ...newQuestions];
    existingTest.questionCount = existingTest.questions.length;
    existingTest.updatedAt = new Date();

    await existingTest.save();

    console.log(`✅ Added ${newQuestions.length} questions to existing test: ${existingTest.title}`);

    res.status(200).json({
      success: true,
      data: existingTest,
      message: `Added ${newQuestions.length} questions to the test`,
      uploadDetails: {
        totalParsed: parseResult.totalQuestions,
        validQuestionsAdded: validation.valid.length,
        invalidQuestions: validation.invalid.length,
        warnings: parseResult.warnings,
        fileName: file.originalname,
        newTotalQuestions: existingTest.questions.length
      }
    });

  } catch (error: any) {
    console.error('Error uploading test content:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to upload test content'
    });
  }
};

// Toggle publish status
export const togglePublishStatus = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { testId } = req.params;
    const { isPublished } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    if (!testId) {
      return res.status(400).json({
        success: false,
        error: 'Test ID is required'
      });
    }

    // Find and update the test
    const test = await SmartTest.findOneAndUpdate(
      { _id: testId },
      { 
        isPublished: isPublished !== undefined ? isPublished : true,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!test) {
      return res.status(404).json({
        success: false,
        error: 'Test not found'
      });
    }

    res.status(200).json({
      success: true,
      data: test,
      message: `Test ${test.isPublished ? 'published' : 'unpublished'} successfully`
    });

  } catch (error: any) {
    console.error('Error toggling publish status:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to toggle publish status'
    });
  }
};

/**
 * @desc Extract questions from admin test using AI (get random 20 questions)
 * @route POST /api/smart-tests/admin/:testId/extract-questions
 * @access Private (Admin)
 */
export const extractQuestionsFromTest = async (req: AuthRequest, res: Response) => {
  try {
    const { testId } = req.params;
    const { questionCount = 20, randomize = true } = req.body;

    if (!testId) {
      return res.status(400).json({
        success: false,
        error: 'Test ID is required'
      });
    }

    // Find the admin test
    const test = await SmartTest.findById(testId);
    if (!test) {
      return res.status(404).json({
        success: false,
        error: 'Test not found'
      });
    }

    // Check if test has questions/content to extract from
    if (!test.questions || test.questions.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Test has no questions available for extraction. Please upload content first.'
      });
    }

    let selectedQuestions = [...test.questions];

    // If randomize is true or we need fewer questions than available, randomize and select
    if (randomize || test.questions.length > questionCount) {
      // Shuffle questions using Fisher-Yates algorithm
      for (let i = selectedQuestions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [selectedQuestions[i], selectedQuestions[j]] = [selectedQuestions[j], selectedQuestions[i]];
      }
      
      // Select the requested number of questions
      selectedQuestions = selectedQuestions.slice(0, Math.min(questionCount, selectedQuestions.length));
    }

    // Reassign question IDs for the extracted set
    const extractedQuestions = selectedQuestions.map((question, index) => ({
      ...question,
      id: `extracted_q${index + 1}`,
      order: index + 1
    }));

    res.status(200).json({
      success: true,
      data: {
        testId: test._id,
        testTitle: test.title,
        extractedQuestions,
        totalAvailable: test.questions.length,
        extracted: extractedQuestions.length,
        randomized: randomize
      },
      message: `Successfully extracted ${extractedQuestions.length} questions from the test`
    });

  } catch (error: any) {
    console.error('Error extracting questions:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to extract questions from test'
    });
  }
};

/**
 * @desc Start admin test session with AI extracted questions
 * @route POST /api/smart-tests/admin/:testId/start-admin-test
 * @access Private
 */
export const startAdminTest = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { testId } = req.params;
    const { questionCount = 20, randomize = true } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    // Find the admin test
    const test = await SmartTest.findById(testId);
    if (!test) {
      return res.status(404).json({
        success: false,
        error: 'Test not found'
      });
    }

    // Check if test is active
    if (!test.isActive) {
      return res.status(400).json({
        success: false,
        error: 'Test is currently inactive'
      });
    }

    // Check if test has questions
    if (!test.questions || test.questions.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Test has no questions available. Please contact administrator.'
      });
    }

    let selectedQuestions = [...test.questions];

    // Always randomize for admin tests to ensure different questions each time
    if (randomize && test.questions.length > questionCount) {
      // Shuffle questions using Fisher-Yates algorithm for fair randomization
      for (let i = selectedQuestions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [selectedQuestions[i], selectedQuestions[j]] = [selectedQuestions[j], selectedQuestions[i]];
      }
      
      // Select the requested number of questions
      selectedQuestions = selectedQuestions.slice(0, questionCount);
    } else if (test.questions.length <= questionCount) {
      // If we have fewer questions than requested, randomize order but use all
      if (randomize) {
        for (let i = selectedQuestions.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [selectedQuestions[i], selectedQuestions[j]] = [selectedQuestions[j], selectedQuestions[i]];
        }
      }
    }

    // Create a clean question set for the test session (without correct answers)
    const testQuestions = selectedQuestions.map((question, index) => {
      const cleanQuestion = {
        id: `session_q${index + 1}`,
        question: question.question,
        type: question.type,
        options: question.options || [],
        category: question.category || 'General',
        difficulty: question.difficulty || test.difficulty,
        points: question.points || 1
      };

      // Remove correct answer from question data sent to frontend
      return cleanQuestion;
    });

    // Generate a unique session ID
    const sessionId = `admin_session_${Date.now()}_${Math.random().toString(36).substring(2)}`;

    // Store the session data with correct answers (for later validation)
    // This could be stored in Redis or a session collection for better scalability
    const sessionData = {
      sessionId,
      testId: test._id,
      userId,
      questions: selectedQuestions, // Keep the full questions with answers
      startTime: new Date(),
      timeLimit: test.timeLimit || 60,
      isAdminTest: true
    };

    // For now, we'll return the session data directly
    // In production, consider using Redis or a dedicated session store
    
    res.status(200).json({
      success: true,
      data: {
        sessionId,
        test: {
          _id: test._id,
          testId: test.testId,
          title: test.title,
          description: test.description,
          jobTitle: test.jobTitle,
          company: test.company,
          industry: test.industry,
          timeLimit: test.timeLimit || 60,
          difficulty: test.difficulty,
          questionCount: testQuestions.length,
          isAdminTest: true
        },
        questions: testQuestions,
        timeLimit: test.timeLimit || 60,
        totalQuestions: testQuestions.length,
        randomized: randomize
      },
      message: 'Admin test session started successfully'
    });

  } catch (error: any) {
    console.error('Error starting admin test:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to start admin test session'
    });
  }
};

export {
  getUserSmartTests,
  getSmartTestById,
  startSmartTest,
  submitSmartTest,
  getUserSmartTestResults,
  getAdminSmartTests,
  createAdminSmartTest,
  updateAdminSmartTest,
  deleteAdminSmartTest,
  toggleSmartTestStatus,
  uploadSmartTestFile,
  uploadTestContentToExisting,
  togglePublishStatus,
  extractQuestionsFromTest,
  startAdminTest
};