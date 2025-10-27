import { Request, Response } from 'express';
import { SmartTest, SmartTestResult, Job } from '../models';
import { AuthRequest } from '../middleware/auth';
import { aiService } from '../services/aiService';
import { fileParsingService } from '../services/fileParsingService';
import mongoose from 'mongoose';

// In-memory session store for admin test sessions
const adminTestSessions = new Map<string, {
  sessionId: string;
  testId: string;
  userId: string;
  questions: any[];
  startTime: Date;
  timeLimit: number;
  isAdminTest: boolean;
}>();

// Session cleanup function to prevent memory leaks
const cleanupExpiredSessions = () => {
  const now = new Date();
  const expiredSessions: string[] = [];
  
  for (const [sessionId, sessionData] of adminTestSessions.entries()) {
    // Calculate session expiry time (timeLimit + 1 hour buffer)
    const sessionExpiryTime = new Date(sessionData.startTime.getTime() + (sessionData.timeLimit + 60) * 60 * 1000);
    
    if (now > sessionExpiryTime) {
      expiredSessions.push(sessionId);
    }
  }
  
  // Remove expired sessions
  expiredSessions.forEach(sessionId => {
    adminTestSessions.delete(sessionId);
    console.log(`🧹 Cleaned up expired session: ${sessionId}`);
  });
  
  if (expiredSessions.length > 0) {
    console.log(`🧹 Cleaned up ${expiredSessions.length} expired sessions`);
  }
};

// Run cleanup every 30 minutes
setInterval(cleanupExpiredSessions, 30 * 60 * 1000);

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

    console.log(`📝 Submitting test with testId: ${testId}, userId: ${userId}`);

    // Try to find the test by testId first (regular user tests)
    let smartTest = await SmartTest.findOne({ testId, userId, isActive: true });

    // If not found, try to find by MongoDB _id (admin tests)
    if (!smartTest && mongoose.Types.ObjectId.isValid(testId)) {
      smartTest = await SmartTest.findOne({ _id: testId, isActive: true });
      console.log(`🔍 Looking for admin test with _id: ${testId}`, smartTest ? '✅ Found' : '❌ Not found');
    }

    if (!smartTest) {
      console.error(`❌ Smart test not found for testId: ${testId}, userId: ${userId}`);
      return res.status(404).json({
        success: false,
        error: 'Smart test not found or inactive'
      });
    }

    console.log(`📝 Found test: ${smartTest.title} (${smartTest.isAdminTest ? 'Admin Test' : 'User Test'})`);
    console.log('📝 Received answers object:', answers);
    console.log('📝 Answer keys:', Object.keys(answers));

    // Debug session information
    console.log('📝 Submission sessionId:', sessionId);
    console.log('📝 Available sessions in memory:', Array.from(adminTestSessions.keys()));
    
    // Check if this is an admin test session by looking for session data
    let sessionData = adminTestSessions.get(sessionId);
    let questionsToGrade = smartTest.questions;
    let isAdminTestSession = false;

    // First check in-memory session data
    if (sessionData && sessionData.isAdminTest) {
      console.log(`📝 Found admin test session data in memory: ${sessionData.questions.length} questions to grade`);
      questionsToGrade = sessionData.questions;
      isAdminTestSession = true;
    } else {
      // If not in memory, check for session pattern and try to recover from backup
      const answerKeys = Object.keys(answers);
      const hasSessionPattern = answerKeys.some(key => key.startsWith('session_q'));
      
      if (hasSessionPattern) {
        console.log('🔄 Session data not found in memory but session_q pattern detected - treating as admin test session');
        isAdminTestSession = true;
        
        // Try to recover question selection from backup stored in test document
        const backupKey = `sessionData_${sessionId}`;
        console.log(`🔍 Looking for backup data with key: ${backupKey}`);
        
        // Get fresh test document to check for backup data
        const testWithBackup = await SmartTest.findById(smartTest._id);
        const testObject = testWithBackup?.toObject();
        const backupData = testObject ? (testObject as any)[backupKey] : null;
        
        console.log('🔍 Available backup keys:', testWithBackup ? Object.keys(testWithBackup.toObject()).filter(k => k.startsWith('sessionData_')) : []);
        console.log('🔍 Backup data found:', !!backupData);
        
        if (backupData && (backupData.selectedQuestions || backupData.selectedQuestionIds)) {
          console.log('🔄 Found backup session data');
          
          // Try to use full question data first (preferred method)
          if (backupData.selectedQuestions && Array.isArray(backupData.selectedQuestions)) {
            questionsToGrade = backupData.selectedQuestions;
            console.log(`📝 Successfully recovered ${questionsToGrade.length} questions from full backup data`);
          }
          // Fallback to reconstructing from IDs
          else if (backupData.selectedQuestionIds && Array.isArray(backupData.selectedQuestionIds)) {
            console.log('🔄 Reconstructing questions from stored IDs');
            const selectedQuestionIds = backupData.selectedQuestionIds;
            
            questionsToGrade = selectedQuestionIds.map((id: string) => {
              const question = smartTest.questions.find((q: any) => q.id === id);
              if (!question) {
                console.error(`⚠️ Could not find question with ID: ${id}`);
                return null;
              }
              return question;
            }).filter((q: any) => q !== null);
            
            console.log(`📝 Successfully reconstructed ${questionsToGrade.length} questions from backup IDs`);
          }
          
          // Restore session data to memory if it was stored in backup
          if (backupData.sessionData && !adminTestSessions.has(sessionId)) {
            adminTestSessions.set(sessionId, backupData.sessionData);
            console.log('🔄 Restored session data to memory from backup');
          }
          
          // Clean up the backup data after successful recovery
          try {
            await SmartTest.findByIdAndUpdate(smartTest._id, {
              $unset: { [backupKey]: 1 }
            });
            console.log('🧹 Cleaned up backup session data after successful recovery');
          } catch (cleanupError) {
            console.error('⚠️ Failed to cleanup backup data:', cleanupError);
          }
        } else {
          // Last resort fallback - use first N questions
          const sessionQuestionCount = answerKeys.length;
          questionsToGrade = smartTest.questions.slice(0, sessionQuestionCount);
          console.log(`📝 Fallback: Will grade first ${questionsToGrade.length} questions (no backup found)`);
          console.log(`⚠️ WARNING: Session and backup data lost. Grading against first ${sessionQuestionCount} questions as fallback.`);
        }
      } else {
        console.log('📝 Using regular test questions for grading (not an admin session)');
      }
    }

    // Ensure we have questions to grade against
    if (!questionsToGrade || questionsToGrade.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Test has no questions available for grading'
      });
    }

    // Calculate score and detailed results with enhanced AI analysis
    let correctAnswers = 0;
    const detailedResults = questionsToGrade.map((question, index) => {
      // For admin test sessions, answers use session_q{index+1} format
      // For regular tests, use the original question.id
      let questionKey = question.id;
      
      if (isAdminTestSession) {
        questionKey = `session_q${index + 1}`;
      }
      
      const userAnswer = answers[questionKey];
      
      if (index === 0) {
        console.log(`📝 Question matching - Index: ${index}, Original ID: ${question.id}, Using key: ${questionKey}, isAdminTestSession: ${isAdminTestSession}`);
      }
      
      // Handle unanswered questions - more robust checking
      let hasAnswer = false;
      let displayAnswer = 'Not answered';
      
      if (userAnswer !== undefined && userAnswer !== null) {
        // Check if it's an empty string or array
        if (Array.isArray(userAnswer)) {
          hasAnswer = userAnswer.length > 0;
          displayAnswer = hasAnswer ? userAnswer.join(', ') : 'Not answered';
        } else if (typeof userAnswer === 'string') {
          hasAnswer = userAnswer.trim() !== '';
          displayAnswer = hasAnswer ? userAnswer.trim() : 'Not answered';
        } else if (typeof userAnswer === 'number') {
          hasAnswer = true;
          // For multiple choice questions, convert option index to option text
          if (question.options && Array.isArray(question.options) && userAnswer >= 0 && userAnswer < question.options.length) {
            displayAnswer = question.options[userAnswer];
          } else {
            displayAnswer = userAnswer.toString();
          }
        } else if (typeof userAnswer === 'boolean') {
          hasAnswer = true;
          displayAnswer = userAnswer.toString();
        } else {
          hasAnswer = true;
          displayAnswer = String(userAnswer);
        }
      }
      
      // Compare answers more intelligently
      let isCorrect = false;
      if (hasAnswer) {
        // For multiple choice questions, compare the selected option text with correct answer
        if (typeof userAnswer === 'number' && question.options && Array.isArray(question.options)) {
          // Convert option index to option text for comparison
          const selectedOption = question.options[userAnswer];
          const correctAnswer = question.correctAnswer;
          isCorrect = selectedOption === correctAnswer;
        } else {
          // For text/other answer types, normalize and compare
          const normalizedUserAnswer = typeof userAnswer === 'string' ? userAnswer.trim() : userAnswer;
          const normalizedCorrectAnswer = typeof question.correctAnswer === 'string' ? question.correctAnswer.trim() : question.correctAnswer;
          
          // Use loose equality for numeric comparisons
          if (typeof normalizedUserAnswer === 'number' && typeof normalizedCorrectAnswer === 'number') {
            isCorrect = normalizedUserAnswer === normalizedCorrectAnswer;
          } else {
            isCorrect = JSON.stringify(normalizedUserAnswer) === JSON.stringify(normalizedCorrectAnswer);
          }
        }
      }
      
      if (isCorrect) correctAnswers++;

      if (index < 3) {
        console.log(`Question ${index + 1}: ${hasAnswer ? 'Answered' : 'Unanswered'} - ${isCorrect ? 'Correct' : 'Incorrect'} - UserRaw: ${JSON.stringify(userAnswer)} - User: "${displayAnswer}" vs Correct: "${question.correctAnswer}" - Type: ${typeof userAnswer} - HasOptions: ${question.options ? question.options.length : 0}`);
      }

      return {
        questionId: question.id || `question_${index}`,
        question: question.question || 'Question text not available',
        userAnswer: displayAnswer,
        correctAnswer: question.correctAnswer || 'No correct answer provided',
        isCorrect,
        explanation: question.explanation || 'No explanation provided',
        category: question.category || 'General',
        difficulty: question.difficulty || 'medium',
        points: question.points || 1
      };
    });

    const totalQuestions = questionsToGrade.length;
    const incorrectAnswers = totalQuestions - correctAnswers;
    const score = correctAnswers;
    const percentageScore = Math.round((correctAnswers / totalQuestions) * 100);
    const timeInMinutes = Math.round(timeSpent / 60);

    console.log(`📊 Test Results: ${correctAnswers}/${totalQuestions} correct (${percentageScore}%)`);

    // Generate enhanced AI-powered feedback with detailed analysis
    let aiAnalysis = '';
    let feedback = '';
    
    try {
      console.log('🤖 Generating AI analysis for test results...');
      
      // Prepare data for AI analysis
      const testData = {
        jobTitle: smartTest.jobTitle || 'Professional Position',
        company: smartTest.company || 'Professional Organization',
        industry: smartTest.industry || 'General',
        difficulty: smartTest.difficulty || 'intermediate',
        totalQuestions: totalQuestions,
        correctAnswers,
        incorrectAnswers,
        percentageScore,
        timeSpent: timeInMinutes,
        skillsRequired: smartTest.skillsRequired || [],
        categoricalBreakdown: {}
      };

      // Calculate performance by category
      detailedResults.forEach(result => {
        const category = result.category || 'General';
        if (!testData.categoricalBreakdown[category]) {
          testData.categoricalBreakdown[category] = { correct: 0, total: 0 };
        }
        testData.categoricalBreakdown[category].total++;
        if (result.isCorrect) {
          testData.categoricalBreakdown[category].correct++;
        }
      });

      const aiPrompt = `
Analyze this professional test performance and provide comprehensive feedback:

TEST DETAILS:
- Position: ${testData.jobTitle}
- Company: ${testData.company}
- Industry: ${testData.industry}
- Difficulty Level: ${testData.difficulty}
- Required Skills: ${testData.skillsRequired.join(', ')}

PERFORMANCE METRICS:
- Score: ${testData.correctAnswers}/${testData.totalQuestions} (${testData.percentageScore}%)
- Time Taken: ${testData.timeSpent} minutes
- Category Breakdown: ${JSON.stringify(testData.categoricalBreakdown, null, 2)}

QUESTION ANALYSIS:
${detailedResults.map((result, index) => `
${index + 1}. ${result.question}
   - User Answer: ${result.userAnswer}
   - Correct Answer: ${result.correctAnswer}
   - Result: ${result.isCorrect ? '✅ CORRECT' : '❌ INCORRECT'}
   - Category: ${result.category}
`).join('')}

Provide a detailed analysis including:
1. Overall Performance Assessment (Professional/Good/Needs Improvement)
2. Strengths demonstrated
3. Areas for improvement 
4. Specific skill gaps identified
5. Recommendations for career development
6. Industry-specific insights
7. Competitiveness assessment for the role
8. Next steps and action plan

Format as structured JSON:
{
  "overallRating": "Excellent/Good/Fair/Needs Improvement",
  "scoreInterpretation": "detailed explanation of what this score means",
  "strengths": ["strength 1", "strength 2", ...],
  "weaknesses": ["area 1", "area 2", ...],
  "skillGaps": ["gap 1", "gap 2", ...],
  "recommendations": ["recommendation 1", "recommendation 2", ...],
  "careerReadiness": "assessment of readiness for this role",
  "competitiveAnalysis": "how candidate compares to others",
  "nextSteps": ["action 1", "action 2", ...],
  "studyPlan": "suggested areas to focus learning on"
}

Return only valid JSON without code blocks.
`;

      aiAnalysis = await aiService.generateContent(aiPrompt);
      
      // Parse AI response
      try {
        // Clean the AI response by removing markdown code blocks
        let cleanedAnalysis = aiAnalysis.trim();
        
        // Remove markdown code blocks if present
        if (cleanedAnalysis.startsWith('```json')) {
          cleanedAnalysis = cleanedAnalysis.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (cleanedAnalysis.startsWith('```')) {
          cleanedAnalysis = cleanedAnalysis.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }
        
        // Remove any backticks at the beginning or end
        cleanedAnalysis = cleanedAnalysis.replace(/^`+|`+$/g, '').trim();
        
        console.log('🧹 Cleaned AI response for parsing:', cleanedAnalysis.substring(0, 100) + '...');
        
        const analysisData = JSON.parse(cleanedAnalysis);
        
        // Validate required fields
        if (!analysisData.overallRating || !analysisData.scoreInterpretation) {
          throw new Error('Invalid AI analysis structure - missing required fields');
        }
        
        // Create human-readable feedback from AI analysis
        feedback = `
🎯 OVERALL PERFORMANCE: ${analysisData.overallRating}

📊 Score Analysis: ${analysisData.scoreInterpretation}

💪 Your Strengths:
${(analysisData.strengths || []).map(strength => `• ${strength}`).join('\n')}

📈 Areas for Improvement:
${(analysisData.weaknesses || []).map(weakness => `• ${weakness}`).join('\n')}

🎯 Skill Development Focus:
${(analysisData.skillGaps || []).map(gap => `• ${gap}`).join('\n')}

💼 Career Readiness: ${analysisData.careerReadiness || 'Analysis not available'}

🏆 Competitive Position: ${analysisData.competitiveAnalysis || 'Analysis not available'}

📋 Recommended Next Steps:
${(analysisData.nextSteps || []).map(step => `• ${step}`).join('\n')}

📚 Study Plan: ${analysisData.studyPlan || 'Study plan not available'}

🎯 Professional Recommendations:
${(analysisData.recommendations || []).map(rec => `• ${rec}`).join('\n')}
        `.trim();

        console.log('✅ AI analysis parsed and formatted successfully');
        
      } catch (parseError) {
        console.error('Failed to parse AI analysis:', parseError);
        console.error('Raw AI response:', aiAnalysis.substring(0, 500) + '...');
        aiAnalysis = aiAnalysis; // Keep raw AI response
        feedback = generateSmartTestFeedback(percentageScore, detailedResults, smartTest.jobTitle);
      }

    } catch (aiError) {
      console.error('AI analysis failed:', aiError);
      // Fallback to basic feedback
      feedback = generateSmartTestFeedback(percentageScore, detailedResults, smartTest.jobTitle);
      aiAnalysis = 'AI analysis temporarily unavailable';
    }

    // Save result with enhanced data
    const resultData = {
      testId: smartTest.isAdminTest ? smartTest._id : testId, // Use correct ID format
      userId,
      jobId: smartTest.jobId,
      answers,
      score,
      percentageScore,
      correctAnswers,
      incorrectAnswers,
      timeSpent: timeSpent,
      timeSpentMinutes: timeInMinutes,
      isCompleted: true,
      detailedResults,
      feedback,
      aiAnalysis: aiAnalysis || 'AI analysis not available',
      testTitle: smartTest.title,
      jobTitle: smartTest.jobTitle,
      company: smartTest.company,
      industry: smartTest.industry,
      difficulty: smartTest.difficulty,
      isAdminTest: smartTest.isAdminTest || false,
      skillsRequired: smartTest.skillsRequired,
      completedAt: new Date()
    };

    console.log('💾 Saving test result:', {
      testId: resultData.testId,
      userId,
      score: `${correctAnswers}/${totalQuestions}`,
      percentage: `${percentageScore}%`,
      isAdminTest: isAdminTestSession || smartTest.isAdminTest
    });

    const testResult = await SmartTestResult.create(resultData);

    // Clean up session data after successful submission
    if (sessionData) {
      adminTestSessions.delete(sessionId);
      console.log(`🗑️ Cleaned up session: ${sessionId}`);
    }

    // Prepare enhanced response with detailed analysis
    const responseData = {
      ...testResult.toObject(),
      analysis: {
        performance: {
          totalQuestions: totalQuestions,
          correctAnswers,
          incorrectAnswers,
          percentageScore,
          timeSpentMinutes: timeInMinutes,
          averageTimePerQuestion: Math.round(timeInMinutes / smartTest.questions.length * 10) / 10
        },
        categoricalBreakdown: {},
        questionDetails: detailedResults,
        recommendations: aiAnalysis ? 'Included in AI analysis' : 'Basic feedback provided'
      }
    };

    // Calculate categorical performance
    detailedResults.forEach(result => {
      const category = result.category || 'General';
      if (!responseData.analysis.categoricalBreakdown[category]) {
        responseData.analysis.categoricalBreakdown[category] = { correct: 0, total: 0, percentage: 0 };
      }
      responseData.analysis.categoricalBreakdown[category].total++;
      if (result.isCorrect) {
        responseData.analysis.categoricalBreakdown[category].correct++;
      }
    });

    // Calculate percentages for categories
    Object.keys(responseData.analysis.categoricalBreakdown).forEach(category => {
      const cat = responseData.analysis.categoricalBreakdown[category];
      cat.percentage = Math.round((cat.correct / cat.total) * 100);
    });

    console.log('✅ Test result saved successfully');

    res.status(201).json({
      success: true,
      data: responseData,
      message: 'Smart test submitted and analyzed successfully',
      meta: {
        testType: smartTest.isAdminTest ? 'Admin Test' : 'User Test',
        aiAnalysisAvailable: !!aiAnalysis && aiAnalysis !== 'AI analysis temporarily unavailable',
        processingTime: `${Date.now() - Date.now()} ms`
      }
    });

  } catch (error) {
    console.error('Error submitting smart test:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit smart test'
    });
  }
};

// Get user's smart test results
export const getUserSmartTestResults = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }
    const results = await SmartTestResult.find({ userId })
      .populate('jobId', 'title company industry')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: results });
  } catch (error) {
    console.error('Error fetching smart test results:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch smart test results' });
  }
};

// Get a specific smart test result by ID
export const getSmartTestResultById = async (req: AuthRequest, res: Response) => {
  try {
    const { resultId } = req.params;
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }
    if (!resultId || !mongoose.Types.ObjectId.isValid(resultId)) {
      return res.status(400).json({ success: false, error: 'Invalid result ID format' });
    }
    const result = await SmartTestResult.findOne({ _id: resultId, userId })
      .populate('jobId', 'title company industry');
    if (!result) {
      return res.status(404).json({ success: false, error: 'Smart test result not found' });
    }
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error('Error fetching smart test result by ID:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch smart test result' });
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

    let selectedQuestions = [];
    let isGeneratedFromNotes = false;

    // Check if test has structured questions (from uploaded exams) or needs generation from notes
    if (test.questions && test.questions.length > 0) {
      console.log(`📝 Found ${test.questions.length} existing questions - selecting from uploaded exam`);
      
      // Case 1: Uploaded exam with structured questions - AI selects the best 20
      selectedQuestions = [...test.questions];

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
    } else if (test.uploadedFileName || test.description) {
      console.log('📄 No structured questions found - attempting to generate from uploaded document notes');
      
      // Case 2: Document notes uploaded - AI generates questions from the content
      try {
        const contentToAnalyze = test.description || test.title || test.jobTitle;
        
        console.log(`🤖 Generating ${questionCount} questions from content using AI...`);
        
        // Use AI service to generate questions from the content
        const aiPrompt = `
Generate ${questionCount} professional exam questions based on the following job position and content:

Job Title: ${test.jobTitle}
Company: ${test.company || 'Not specified'}
Industry: ${test.industry || 'Not specified'}
Skills Required: ${test.skillsRequired?.join(', ') || 'Not specified'}
Content Description: ${contentToAnalyze}

Please generate questions that cover:
1. Technical skills relevant to the job
2. Industry knowledge and best practices
3. Problem-solving scenarios
4. Professional competencies

Format each question as a JSON object with:
- id: unique identifier
- question: the question text
- type: "multiple_choice"
- options: array of 4 options (A, B, C, D)
- correctAnswer: the correct option
- explanation: brief explanation of the correct answer
- category: relevant skill category
- difficulty: "${test.difficulty || 'intermediate'}"

Return ONLY a JSON array of questions, no additional text.
`;

        const aiResponse = await aiService.generateContent(aiPrompt);
        
        // Parse AI response and extract questions
        let generatedQuestions = [];
        try {
          // Clean the response and extract JSON array
          const cleanResponse = aiResponse.trim().replace(/```json\n?|\n?```/g, '');
          generatedQuestions = JSON.parse(cleanResponse);
          
          if (!Array.isArray(generatedQuestions)) {
            throw new Error('AI response is not an array');
          }
          
          // Validate and standardize question structure
          selectedQuestions = generatedQuestions.map((q, index) => ({
            id: q.id || `ai_generated_${index + 1}`,
            question: q.question || 'Generated question',
            type: q.type || 'multiple_choice',
            options: Array.isArray(q.options) ? q.options : ['Option A', 'Option B', 'Option C', 'Option D'],
            correctAnswer: q.correctAnswer || q.options?.[0] || 'A',
            explanation: q.explanation || 'AI generated explanation',
            category: q.category || 'General',
            difficulty: q.difficulty || test.difficulty || 'intermediate',
            points: 1
          })).slice(0, questionCount);
          
          isGeneratedFromNotes = true;
          console.log(`✅ Successfully generated ${selectedQuestions.length} questions from document content`);
          
        } catch (parseError) {
          console.error('Failed to parse AI-generated questions:', parseError);
          throw new Error('Failed to generate questions from document content');
        }
        
      } catch (aiError) {
        console.error('AI generation failed:', aiError);
        return res.status(400).json({
          success: false,
          error: 'Unable to generate questions from the uploaded content. Please ensure the test has structured questions or detailed content.'
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        error: 'Test has no questions or content available. Please contact administrator to upload exam questions or study materials.'
      });
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

    // Store session data in memory (in production, use Redis or database)
    adminTestSessions.set(sessionId, sessionData);
    console.log(`💾 Stored admin test session: ${sessionId} with ${selectedQuestions.length} questions`);

    // BACKUP: Store both question IDs and full question data in the test document for recovery
    try {
      const selectedQuestionIds = selectedQuestions.map(q => q.id);
      await SmartTest.findByIdAndUpdate(testId, {
        $set: {
          [`sessionData_${sessionId}`]: {
            selectedQuestionIds,
            selectedQuestions, // Store full question data as additional backup
            sessionData: sessionData, // Store complete session data
            createdAt: new Date()
          }
        }
      });
      console.log(`💾 Backup: Stored complete session data in test document for session ${sessionId}`);
    } catch (backupError) {
      console.error('⚠️ Failed to backup session data:', backupError);
      // Don't fail the request if backup fails, but log it
      console.error('Backup error details:', backupError);
    }

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
        randomized: randomize,
        // Include the selected question IDs for recovery
        selectedQuestionIds: selectedQuestions.map(q => q.id)
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