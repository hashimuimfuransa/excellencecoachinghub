import { Request, Response } from 'express';
import { PsychometricTest, PsychometricTestResult, Job, JobApplication, GeneratedPsychometricTest, TestPurchase, TestSession } from '@/models';
import { UserRole, PsychometricTestType } from '../../../shared/types';
import { AuthRequest } from '@/middleware/auth';
import { aiService } from '@/services/aiService';
import mongoose from 'mongoose';

// Get all psychometric tests
export const getPsychometricTests = async (req: Request, res: Response) => {
  try {
    const { type, industry, jobRole, page = 1, limit = 10 } = req.query;

    let query: any = { isActive: true };

    if (type) query.type = type;
    if (industry) query.industry = { $regex: industry, $options: 'i' };
    if (jobRole) query.jobRole = { $regex: jobRole, $options: 'i' };

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const tests = await PsychometricTest.find(query)
      .populate('createdBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await PsychometricTest.countDocuments(query);

    res.status(200).json({
      success: true,
      data: tests,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch psychometric tests',
      message: error.message
    });
  }
};

// Get single psychometric test
export const getPsychometricTestById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const test = await PsychometricTest.findById(id)
      .populate('createdBy', 'firstName lastName');

    if (!test) {
      return res.status(404).json({
        success: false,
        error: 'Psychometric test not found'
      });
    }

    if (!test.isActive) {
      return res.status(400).json({
        success: false,
        error: 'This test is not currently available'
      });
    }

    res.status(200).json({
      success: true,
      data: test
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch psychometric test',
      message: error.message
    });
  }
};

// Create psychometric test (Super Admin only)
export const createPsychometricTest = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId || userRole !== UserRole.SUPER_ADMIN) {
      return res.status(403).json({
        success: false,
        error: 'Only super admins can create psychometric tests'
      });
    }

    const testData = {
      ...req.body,
      createdBy: userId
    };

    const test = new PsychometricTest(testData);
    await test.save();

    const populatedTest = await PsychometricTest.findById(test._id)
      .populate('createdBy', 'firstName lastName');

    res.status(201).json({
      success: true,
      data: populatedTest,
      message: 'Psychometric test created successfully'
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: 'Failed to create psychometric test',
      message: error.message
    });
  }
};

// Update psychometric test (Super Admin only)
export const updatePsychometricTest = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId || userRole !== UserRole.SUPER_ADMIN) {
      return res.status(403).json({
        success: false,
        error: 'Only super admins can update psychometric tests'
      });
    }

    const test = await PsychometricTest.findById(id);
    if (!test) {
      return res.status(404).json({
        success: false,
        error: 'Psychometric test not found'
      });
    }

    const updatedTest = await PsychometricTest.findByIdAndUpdate(
      id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).populate('createdBy', 'firstName lastName');

    res.status(200).json({
      success: true,
      data: updatedTest,
      message: 'Psychometric test updated successfully'
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: 'Failed to update psychometric test',
      message: error.message
    });
  }
};

// Delete psychometric test (Super Admin only)
export const deletePsychometricTest = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId || userRole !== UserRole.SUPER_ADMIN) {
      return res.status(403).json({
        success: false,
        error: 'Only super admins can delete psychometric tests'
      });
    }

    const test = await PsychometricTest.findById(id);
    if (!test) {
      return res.status(404).json({
        success: false,
        error: 'Psychometric test not found'
      });
    }

    // Soft delete by setting isActive to false
    test.isActive = false;
    await test.save();

    res.status(200).json({
      success: true,
      message: 'Psychometric test deleted successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to delete psychometric test',
      message: error.message
    });
  }
};

// Take psychometric test
export const takePsychometricTest = async (req: AuthRequest, res: Response) => {
  try {
    const { testId } = req.params;
    const { answers, jobId, timeSpent, testData } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    let test: any;
    let isGeneratedTest = false;

    // Check if this is a dynamically generated test (starts with 'job-specific-')
    if (testId.startsWith('job-specific-')) {
      // Try to find stored generated test first
      const storedTest = await GeneratedPsychometricTest.findActiveByTestId(testId);
      if (storedTest) {
        test = {
          title: storedTest.title,
          description: storedTest.description,
          type: storedTest.type,
          questions: storedTest.questions,
          timeLimit: storedTest.timeLimit,
          industry: storedTest.industry,
          jobRole: storedTest.jobRole,
          jobSpecific: storedTest.jobSpecific,
          difficulty: storedTest.difficulty,
          categories: storedTest.categories
        };
        isGeneratedTest = true;
      } else {
        // Fallback to testData if no stored test found
        if (!testData || !testData.test) {
          return res.status(400).json({
            success: false,
            error: 'Test not found. Please generate a new test.'
          });
        }
        test = testData.test;
        isGeneratedTest = true;
      }
    } else {
      // This is a regular test stored in database
      // Check if testId is a valid ObjectId before querying
      if (!mongoose.Types.ObjectId.isValid(testId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid test ID format'
        });
      }
      
      test = await PsychometricTest.findById(testId);
      if (!test) {
        return res.status(404).json({
          success: false,
          error: 'Psychometric test not found'
        });
      }

      if (!test.isActive) {
        return res.status(400).json({
          success: false,
          error: 'This test is not currently available'
        });
      }
    }

    // Check if user has valid access to take this test (payment verification)
    if (!isGeneratedTest) {
      const accessCheck = await TestPurchase.canTakeTest(userId, testId, jobId);
      if (!accessCheck.canTake) {
        return res.status(403).json({
          success: false,
          error: accessCheck.reason || 'You do not have access to this test',
          purchase: accessCheck.purchase,
          requiresPayment: !accessCheck.purchase
        });
      }
      
      // Increment attempt count for the purchase
      if (accessCheck.purchase) {
        await TestPurchase.incrementAttemptCount(accessCheck.purchase._id);
      }
    }

    // Process test results
    let scores: Record<string, number> = {};
    let overallScore = 75; // Default score
    let interpretation = 'Test completed successfully.';
    let recommendations = ['Continue practicing to improve your skills.'];

    try {
      // Try AI grading
      const aiGrading = await aiService.gradePsychometricTest({
        test,
        answers,
        userId,
        jobId
      });
      
      scores = { ...aiGrading.scores, ...aiGrading.categoryScores };
      overallScore = aiGrading.overallScore;
      interpretation = aiGrading.interpretation;
      recommendations = aiGrading.recommendations;
      
    } catch (error) {
      console.error('AI grading failed, using fallback scoring:', error);
      // Fallback scoring could be implemented here
    }

    // Save test result
    const testResult = new PsychometricTestResult({
      user: userId,
      test: !isGeneratedTest ? testId : undefined,
      job: jobId,
      answers,
      scores,
      overallScore,
      interpretation,
      recommendations,
      timeSpent,
      testMetadata: isGeneratedTest ? {
        testId,
        testType: test.type,
        testTitle: test.title,
        testDescription: test.description,
        questions: test.questions
      } : undefined
    });

    console.log('💾 Saving test result to database...');
    await testResult.save();
    console.log('✅ Test result saved successfully, ID:', testResult._id);

    console.log('🔍 Populating test result data...');
    const populatedResult = await PsychometricTestResult.findById(testResult._id)
      .populate('user', 'firstName lastName email')
      .populate('test', 'title type description')
      .populate('job', 'title company');

    if (!populatedResult) {
      console.error('❌ Failed to find populated result for ID:', testResult._id);
      return res.status(500).json({
        success: false,
        error: 'Failed to retrieve saved test result',
        message: 'Test was saved but could not be retrieved'
      });
    }

    console.log('✅ Test result populated successfully, sending response...');
    res.status(200).json({
      success: true,
      data: populatedResult,
      message: 'Test completed successfully'
    });
    console.log('📤 Response sent successfully');

  } catch (error: any) {
    console.error('❌ Error in takePsychometricTest:', error);
    console.error('❌ Error stack:', error.stack);
    
    // Ensure we always send a proper JSON response
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: 'Failed to process test submission',
        message: error.message || 'Unknown error occurred during test submission',
        timestamp: new Date().toISOString()
      });
    } else {
      console.error('❌ Headers already sent, cannot send error response');
    }
  }
};

// Get user's test results
export const getUserTestResults = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const results = await PsychometricTestResult.findByUser(userId);

    res.status(200).json({
      success: true,
      data: results
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch test results',
      message: error.message
    });
  }
};

// Get job test results (for employers)
export const getJobTestResults = async (req: AuthRequest, res: Response) => {
  try {
    const { jobId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    if (job.employer.toString() !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied: Not your job posting'
      });
    }

    const results = await PsychometricTestResult.findJobResults(jobId);

    res.status(200).json({
      success: true,
      data: results
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch job test results',
      message: error.message
    });
  }
};

// Generate job-specific test
export const generateJobSpecificTest = async (req: AuthRequest, res: Response) => {
  try {
    const { jobId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const job = await Job.findById(jobId).populate('employer', 'firstName lastName');
    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    const application = await JobApplication.findOne({
      job: jobId,
      applicant: userId
    });

    if (!application) {
      return res.status(403).json({
        success: false,
        error: 'You must apply for this job first to take the psychometric test'
      });
    }

    const generatedTest = await aiService.generateJobSpecificTest({
      job,
      userId,
      userProfile: req.user
    });

    res.status(200).json({
      success: true,
      data: generatedTest,
      message: 'Job-specific test generated successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to generate job-specific test',
      message: error.message
    });
  }
};

// Generate job-specific test from frontend parameters
export const generateJobSpecificTestFromParams = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const {
      jobTitle,
      jobDescription, 
      requiredSkills,
      experienceLevel,
      industry,
      testType,
      questionCount,
      timeLimit
    } = req.body;

    // Get previous questions for uniqueness check
    const previousQuestions = await GeneratedPsychometricTest.getPreviousQuestionsByUser('', userId);

    // Generate test using AI service
    const generatedTest = await aiService.generateJobSpecificPsychometricTest({
      jobTitle,
      jobDescription,
      requiredSkills,
      experienceLevel, 
      industry,
      testType,
      questionCount,
      timeLimit,
      userId,
      previousQuestions
    });

    // Save generated test to database
    const testDocument = new GeneratedPsychometricTest({
      testId: generatedTest.testId,
      jobId: new mongoose.Types.ObjectId(), // Use a dummy ObjectId since no specific job
      userId: new mongoose.Types.ObjectId(userId),
      title: generatedTest.test.title,
      description: generatedTest.test.description,
      type: generatedTest.test.type,
      questions: generatedTest.test.questions,
      timeLimit: generatedTest.test.timeLimit,
      industry: generatedTest.test.industry,
      jobRole: generatedTest.test.jobRole,
      difficulty: generatedTest.test.difficulty || 'moderate',
      categories: generatedTest.test.categories || [],
      jobSpecific: true,
      metadata: {
        jobTitle,
        jobDescription,
        requiredSkills,
        experienceLevel
      }
    });

    await testDocument.save();

    res.status(200).json({
      success: true,
      data: {
        testId: generatedTest.testId,
        test: generatedTest.test
      },
      message: 'Job-specific test generated successfully'
    });
  } catch (error: any) {
    console.error('Error generating job-specific test:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate job-specific test',
      message: error.message
    });
  }
};

// Generate test questions from purchased package
export const generateQuestionsFromPurchase = async (req: AuthRequest, res: Response) => {
  try {
    const { purchaseId } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    // Verify purchase and access
    const purchase = await TestPurchase.findById(purchaseId)
      .populate('test')
      .populate('user');

    if (!purchase) {
      return res.status(404).json({
        success: false,
        error: 'Purchase not found'
      });
    }

    if (purchase.user._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied to this purchase'
      });
    }

    // Check if user can still take the test
    const accessCheck = await TestPurchase.canTakeTest(userId, purchase.test._id.toString());
    if (!accessCheck.canTake) {
      return res.status(403).json({
        success: false,
        error: accessCheck.reason || 'Cannot access this test'
      });
    }

    // Get test metadata from purchase
    const metadata = purchase.metadata || {};
    const {
      jobTitle,
      jobDescription,
      industry,
      experienceLevel = 'mid-level',
      features
    } = metadata;

    console.log('🎯 Generating questions from purchase:', {
      purchaseId,
      jobTitle,
      questionCount: features?.questionCount,
      timeLimit: features?.timeLimit,
      experienceLevel
    });

    // Generate questions using AI service
    const generatedTest = await aiService.generateJobSpecificPsychometricTest({
      jobTitle,
      jobDescription,
      requiredSkills: [], // Can be extracted from metadata if needed
      experienceLevel,
      industry,
      testType: 'comprehensive',
      questionCount: features?.questionCount || 30,
      timeLimit: features?.timeLimit || 45,
      userId
    });

    // Update the test record with generated questions
    await PsychometricTest.findByIdAndUpdate(
      purchase.test._id,
      { questions: generatedTest.test.questions },
      { new: true }
    );

    res.status(200).json({
      success: true,
      data: {
        test: generatedTest,
        purchase: {
          id: purchase._id,
          remainingAttempts: purchase.maxAttempts - purchase.attemptsUsed,
          expiresAt: purchase.expiresAt
        }
      },
      message: 'Test questions generated successfully'
    });

  } catch (error: any) {
    console.error('Error generating questions from purchase:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate job-specific test',
      message: error.message
    });
  }
};

// Get generated test
export const getGeneratedTest = async (req: AuthRequest, res: Response) => {
  try {
    const { testId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const test = await GeneratedPsychometricTest.findActiveByTestId(testId);
    if (!test) {
      return res.status(404).json({
        success: false,
        error: 'Generated test not found or expired'
      });
    }

    res.status(200).json({
      success: true,
      data: test
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch generated test',
      message: error.message
    });
  }
};

// Purchase test
export const purchaseTest = async (req: AuthRequest, res: Response) => {
  try {
    const { testId, jobId, paymentIntentId, amount, currency } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const test = await PsychometricTest.findById(testId);
    if (!test || !test.isActive) {
      return res.status(404).json({
        success: false,
        error: 'Test not found or not available'
      });
    }

    // Check if user already has a valid purchase for this test
    const existingPurchase = await TestPurchase.findUserPurchaseForTest(userId, testId, jobId);
    if (existingPurchase && existingPurchase.status === 'completed') {
      return res.status(400).json({
        success: false,
        error: 'You already have a purchase for this test',
        data: {
          purchase: existingPurchase
        }
      });
    }

    // Create new purchase - users can access tests immediately after successful payment
    const purchase = new TestPurchase({
      user: userId,
      test: testId,
      job: jobId,
      paymentIntentId,
      amount,
      currency,
      maxAttempts: 3,
      status: 'completed' // In real implementation, this would be 'pending' until payment is confirmed
    });

    await purchase.save();

    // Populate the purchase with related data
    const populatedPurchase = await TestPurchase.findById(purchase._id)
      .populate('test', 'title type description timeLimit')
      .populate('job', 'title company');

    res.status(201).json({
      success: true,
      data: populatedPurchase,
      message: 'Test purchased successfully. You can start the test anytime.'
    });
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'You have already purchased this test'
      });
    }
    
    res.status(400).json({
      success: false,
      error: 'Failed to purchase test',
      message: error.message
    });
  }
};

// Start test session
export const startTestSession = async (req: AuthRequest, res: Response) => {
  try {
    const { testId, jobId } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    // Check if user has access to this test
    const accessCheck = await TestPurchase.canTakeTest(userId, testId, jobId);
    if (!accessCheck.canTake) {
      return res.status(403).json({
        success: false,
        error: accessCheck.reason || 'You do not have access to this test'
      });
    }

    // Check for existing active session
    const existingSession = await TestSession.findActiveSession(userId, testId, jobId);
    if (existingSession) {
      return res.status(200).json({
        success: true,
        data: existingSession,
        message: 'Existing session found'
      });
    }

    // Create new session
    const session = new TestSession({
      user: userId,
      test: testId,
      job: jobId,
      startTime: new Date(),
      isActive: true
    });

    await session.save();

    res.status(201).json({
      success: true,
      data: session,
      message: 'Test session started successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to start test session',
      message: error.message
    });
  }
};

// Get test session
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

    const session = await TestSession.findById(sessionId)
      .populate('user', 'firstName lastName')
      .populate('test', 'title timeLimit')
      .populate('job', 'title company');

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Test session not found'
      });
    }

    if (session.user._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    res.status(200).json({
      success: true,
      data: session
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to get test session',
      message: error.message
    });
  }
};

// Update test session
export const updateTestSession = async (req: AuthRequest, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { currentAnswers, currentQuestionIndex, timeRemaining } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const session = await TestSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Test session not found'
      });
    }

    if (session.user.toString() !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    session.currentAnswers = currentAnswers;
    session.currentQuestionIndex = currentQuestionIndex;
    session.timeRemaining = timeRemaining;
    session.lastActivity = new Date();

    await session.save();

    res.status(200).json({
      success: true,
      data: session,
      message: 'Session updated successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to update test session',
      message: error.message
    });
  }
};

// Check test access
export const checkTestAccess = async (req: AuthRequest, res: Response) => {
  try {
    const { testId } = req.params;
    const { jobId } = req.query;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const accessCheck = await TestPurchase.canTakeTest(userId, testId, jobId as string);

    res.status(200).json({
      success: true,
      data: accessCheck,
      message: 'Test access check completed'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to check test access',
      message: error.message
    });
  }
};

// Get user's test purchases
export const getUserTestPurchases = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const purchases = await TestPurchase.findUserPurchases(userId);

    res.status(200).json({
      success: true,
      data: purchases,
      message: 'User test purchases retrieved successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve test purchases',
      message: error.message
    });
  }
};