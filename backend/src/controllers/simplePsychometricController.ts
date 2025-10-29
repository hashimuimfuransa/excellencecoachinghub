import { Request, Response } from 'express';
import { PsychometricTestResult, Job, TestPurchase, TestSession } from '../models';
import { GeneratedPsychometricTest } from '../models/GeneratedPsychometricTest';
import PaymentRequest from '../models/PaymentRequest';
import { AuthRequest } from '../middleware/auth';
import { aiService } from '../services/aiService';
import { validateObjectIdParam } from '../utils/validation';
import mongoose from 'mongoose';

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

const sanitizeCategoryIds = (rawCategories: unknown): string[] => {
  if (!Array.isArray(rawCategories)) {
    return DEFAULT_CATEGORY_IDS;
  }

  const sanitized = rawCategories
    .map((value) => {
      if (typeof value !== 'string') {
        return null;
      }
      const normalized = value.toLowerCase().trim().replace(/\s+/g, '_');
      if (PSYCHOMETRIC_CATEGORY_DEFINITIONS[normalized]) {
        return normalized;
      }
      return null;
    })
    .filter((value): value is string => Boolean(value));

  if (sanitized.length === 0) {
    return DEFAULT_CATEGORY_IDS;
  }

  return Array.from(new Set(sanitized));
};

const normalizeQuestionText = (question: any): string | null => {
  if (!question || typeof question.question !== 'string') {
    return null;
  }
  const normalized = question.question.toLowerCase().replace(/\s+/g, ' ').trim();
  if (!normalized) {
    return null;
  }
  return normalized;
};

const addUniqueQuestions = (questions: any[], seen: Set<string>, store: any[]): void => {
  if (!Array.isArray(questions)) {
    return;
  }
  for (const question of questions) {
    const key = normalizeQuestionText(question);
    if (!key || seen.has(key)) {
      continue;
    }
    seen.add(key);
    store.push(question);
  }
};

/**
 * @desc Generate psychometric test based on job and user's purchased level
 * @route POST /api/psychometric-tests/generate-test
 * @access Private
 */
export const generatePsychometricTest = async (req: AuthRequest, res: Response) => {
  try {
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

    // Define level features - Easy: 20, Intermediate: 30, Hard: 40 questions  
    // Time limit = 1 minute per question
    const levelFeatures = {
      easy: { questionCount: 20, timeLimit: 20 },
      intermediate: { questionCount: 30, timeLimit: 30 },
      hard: { questionCount: 40, timeLimit: 40 }
    };

    const features = levelFeatures[levelId as keyof typeof levelFeatures] || levelFeatures.easy;
    const { questionCount, timeLimit } = features;

    // Check if user is requesting a free test (easy level) and has already completed one
    if (levelId === 'easy') {
      const existingResults = await PsychometricTestResult.find({ user: userId });
      
      if (existingResults.length > 0) {
        console.log('❌ User already completed tests, cannot take another free test:', {
          userId,
          completedTestsCount: existingResults.length,
          testDetails: existingResults.map(r => ({
            jobId: r.job,
            completedAt: r.completedAt,
            score: r.overallScore
          }))
        });
        
        return res.status(403).json({
          success: false,
          error: 'FREE_TEST_ALREADY_USED',
          message: 'You have already used your one-time free test. Please request premium assessment approval to take more tests.',
          completedTestsCount: existingResults.length
        });
      }
    }

    const generationPayload = {
      jobTitle: job.title,
      jobDescription: job.description,
      industry: job.industry,
      experienceLevel: job.experienceLevel,
      skills: job.skills && Array.isArray(job.skills) ? job.skills : [],
      testLevel: levelId,
      timeLimit,
      userId: userId,
      jobId: jobId,
      categories: selectedCategories
    };

    const initialData = await aiService.generatePsychometricTest({
      ...generationPayload,
      questionCount
    });

    if (!initialData.questions || !Array.isArray(initialData.questions)) {
      return res.status(500).json({
        success: false,
        error: 'Failed to generate test questions - invalid structure'
      });
    }

    const desiredQuestionCount = questionCount;
    const seenQuestions = new Set<string>();
    const uniqueQuestions: any[] = [];
    addUniqueQuestions(initialData.questions, seenQuestions, uniqueQuestions);

    let uniquenessAttempts = 0;
    const maxUniquenessAttempts = 2;

    while (uniqueQuestions.length < desiredQuestionCount && uniquenessAttempts < maxUniquenessAttempts) {
      uniquenessAttempts++;
      const remaining = desiredQuestionCount - uniqueQuestions.length;
      const additionalData = await aiService.generatePsychometricTest({
        ...generationPayload,
        questionCount: Math.max(remaining, desiredQuestionCount)
      });
      addUniqueQuestions(additionalData.questions, seenQuestions, uniqueQuestions);
    }

    if (uniqueQuestions.length < desiredQuestionCount) {
      return res.status(500).json({
        success: false,
        error: 'Failed to generate sufficient unique questions'
      });
    }

    const finalQuestions = uniqueQuestions.slice(0, desiredQuestionCount);

    console.log('✅ Successfully generated', finalQuestions.length, 'unique questions for', job.title);

    try {
      const generatedTestId = `gen_test_${userId}_${jobId}_${Date.now()}`;
      
      await GeneratedPsychometricTest.create({
        testId: generatedTestId,
        jobId: jobId,
        userId: userId,
        title: `Psychometric Assessment for ${job.title}`,
        description: `AI-generated psychometric test for ${job.title} position`,
        type: 'comprehensive',
        questions: finalQuestions.map((q, index) => ({
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
        industry: job.industry,
        jobRole: job.title,
        difficulty: levelId === 'intermediate' ? 'moderate' : (levelId === 'advanced' ? 'hard' : 'easy'),
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
      
      console.log('✅ Generated test saved to database with ID:', generatedTestId);
      console.log('🎯 Selected categories persisted:', selectedCategories);
    } catch (saveError) {
      console.warn('⚠️ Warning: Could not save generated test to database:', saveError);
    }

    let testSession;
    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount < maxRetries) {
      try {
        testSession = await TestSession.create({
          user: userId,
          job: jobId,
          testLevel: levelId,
          purchase: null,
          questions: finalQuestions,
          timeLimit: timeLimit,
          status: 'ready',
          generatedAt: new Date()
        });
        break;
      } catch (dbError: any) {
        retryCount++;
        console.log(`🔄 MongoDB retry ${retryCount}/${maxRetries} for test session creation`);
        
        if (retryCount >= maxRetries) {
          console.error('Failed to create test session after retries:', dbError);
          throw dbError;
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    if (!testSession) {
      return res.status(500).json({
        success: false,
        error: 'Failed to create test session after multiple attempts'
      });
    }

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

  } catch (error: any) {
    console.error('Error generating psychometric test:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate psychometric test'
    });
  }
};

/**
 * @desc Start a psychometric test session
 * @route GET /api/psychometric-tests/start/:sessionId
 * @access Private
 */
export const startPsychometricTest = async (req: AuthRequest, res: Response) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user?.id;

    // Validate sessionId
    if (!validateObjectIdParam(sessionId, res, 'session ID')) {
      return;
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    // Get test session
    const testSession = await TestSession.findOne({
      _id: sessionId,
      user: userId,
      status: 'ready'
    }).populate('job', 'title company industry experienceLevel');

    if (!testSession) {
      return res.status(404).json({
        success: false,
        error: 'Test session not found or already started'
      });
    }

    // Update session status and start time
    testSession.status = 'in_progress';
    testSession.startedAt = new Date();
    await testSession.save();

    // Increment attempt in purchase (only if purchase exists - for simple tests it's null)
    if (testSession.purchase) {
      await TestPurchase.incrementAttempt(testSession.purchase.toString());
    }

    // Return questions without correct answers
    const questionsForUser = testSession.questions.map((q: any, index: number) => ({
      id: index,
      question: q.question,
      options: q.options,
      category: q.category
    }));

    res.status(200).json({
      success: true,
      data: {
        sessionId: testSession._id,
        questions: questionsForUser,
        timeLimit: testSession.timeLimit,
        startedAt: testSession.startedAt,
        job: testSession.job
      },
      message: 'Test started successfully!'
    });

  } catch (error: any) {
    console.error('Error starting psychometric test:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start test'
    });
  }
};

/**
 * @desc Get psychometric test session details
 * @route GET /api/psychometric-tests/session/:sessionId
 * @access Private
 */
export const getPsychometricTestSession = async (req: AuthRequest, res: Response) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user?.id;

    // Validate sessionId
    if (!validateObjectIdParam(sessionId, res, 'session ID')) {
      return;
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    // Get test session (can be ready or in_progress)
    const testSession = await TestSession.findOne({
      _id: sessionId,
      user: userId,
      status: { $in: ['ready', 'in_progress'] }
    }).populate('job', 'title company industry experienceLevel');

    if (!testSession) {
      return res.status(404).json({
        success: false,
        error: 'Test session not found or access denied'
      });
    }

    // Return questions without correct answers
    const questionsForUser = testSession.questions.map((q: any, index: number) => ({
      id: index,
      question: q.question,
      options: q.options,
      category: q.category
    }));

    res.status(200).json({
      success: true,
      data: {
        sessionId: testSession._id,
        questions: questionsForUser,
        timeLimit: testSession.timeLimit,
        startedAt: testSession.startedAt || testSession.createdAt,
        job: testSession.job
      },
      message: 'Test session retrieved successfully!'
    });

  } catch (error: any) {
    console.error('❌ Error getting psychometric test session:', error);
    
    // Return error details for debugging
    res.status(500).json({
      success: false,
      error: 'Failed to get test session',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * @desc Submit psychometric test answers
 * @route POST /api/psychometric-tests/submit/:sessionId
 * @access Private
 */
export const submitPsychometricTest = async (req: AuthRequest, res: Response) => {
  try {
    console.log('🚀 Starting test submission for session:', req.params.sessionId);
    const { sessionId } = req.params;
    const { answers } = req.body;
    const userId = req.user?.id;

    console.log('📊 Submission data:', {
      sessionId,
      userId,
      answersLength: answers?.length,
      answersType: typeof answers,
      requestBody: req.body
    });

    // Validate sessionId
    if (!validateObjectIdParam(sessionId, res, 'session ID')) {
      return;
    }

    if (!userId) {
      console.error('❌ User not authenticated');
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    if (!answers || !Array.isArray(answers)) {
      console.error('❌ Invalid answers format:', answers);
      return res.status(400).json({
        success: false,
        error: 'Answers must be provided as an array'
      });
    }

    // Get test session (allow both in_progress and completed)
    const testSession = await TestSession.findOne({
      _id: sessionId,
      user: userId
    }).populate('job').populate('purchase');

    if (!testSession) {
      return res.status(404).json({
        success: false,
        error: 'Test session not found'
      });
    }

    // Allow submission for both 'in_progress' and 'completed' tests
    // This allows users to resubmit and get their answers properly graded
    if (testSession.status !== 'in_progress' && testSession.status !== 'completed') {
      return res.status(400).json({
        success: false,
        error: `Test session is not available for submission (status: ${testSession.status})`
      });
    }

    // Calculate score
    let correctAnswers = 0;
    const detailedResults = testSession.questions.map((question: any, index: number) => {
      const userAnswer = answers[index];
      const isCorrect = userAnswer === question.correctAnswer;
      if (isCorrect) correctAnswers++;

      return {
        question: question.question,
        userAnswer: userAnswer,
        correctAnswer: question.correctAnswer,
        isCorrect,
        category: question.category,
        explanation: question.explanation
      };
    });

    const scorePercentage = Math.round((correctAnswers / testSession.questions.length) * 100);

    // Update test session
    testSession.status = 'completed';
    testSession.completedAt = new Date();
    testSession.score = scorePercentage;
    testSession.answers = answers;
    await testSession.save();

    // Check if purchase exists and has detailed reports feature
    const hasDetailedResults = testSession.purchase && 
      (testSession.purchase as any).features && 
      (testSession.purchase as any).features.detailedReports;

    // Calculate time spent (in minutes)
    const timeSpentMinutes = testSession.startedAt 
      ? Math.round((new Date().getTime() - testSession.startedAt.getTime()) / (1000 * 60))
      : testSession.timeLimit || 30; // Default to test time limit if no start time

    // Safely extract job information
    const jobInfo = testSession.job as any;
    const jobTitle = jobInfo?.title || 'Unknown Position';
    const jobId = jobInfo?._id || testSession.job;

    // Validate job information before proceeding
    if (!jobId) {
      console.error('❌ Missing job ID in test session');
      return res.status(500).json({
        success: false,
        error: 'Invalid test session - missing job information',
        message: 'Test session is corrupted and cannot be processed'
      });
    }

    // Generate category scores and interpretation
    const categoryScores = calculateCategoryScores(detailedResults);
    const interpretation = generateInterpretation(scorePercentage, categoryScores, jobTitle);
    const recommendations = generateRecommendations(scorePercentage, jobTitle);

    // Create or update test result record - match the PsychometricTestResult model schema
    const resultData = {
      user: userId,
      job: jobId,
      answers: answers, // Array of user's selected answers
      scores: categoryScores, // Category-wise scores object
      overallScore: scorePercentage, // Direct field, not nested
      interpretation: interpretation, // Required field
      recommendations: recommendations, // Array of recommendation strings
      completedAt: new Date(),
      timeSpent: Math.max(1, timeSpentMinutes), // Ensure minimum 1 minute
      attempt: 1, // Default attempt number
      testMetadata: {
        testId: testSession._id.toString(),
        title: `Psychometric Assessment for ${(testSession.job as any).title}`,
        type: 'job-specific',
        categories: Object.keys(categoryScores),
        difficulty: testSession.testLevel,
        isGenerated: true,
        jobSpecific: true
      },
      // Always store detailed analysis including question breakdown
      detailedAnalysis: {
        detailedResults: detailedResults,
        categoryBreakdown: categoryScores,
        testLevel: testSession.testLevel,
        totalQuestions: testSession.questions.length,
        correctAnswers: correctAnswers,
        // Store the complete questions with answers for later retrieval
        questionAnalysis: detailedResults.map((result, index) => ({
          question: result.question,
          userAnswer: result.userAnswer,
          correctAnswer: result.correctAnswer,
          isCorrect: result.isCorrect,
          category: result.category,
          explanation: result.explanation,
          options: testSession.questions[index].options
        })),
        // Store failed and correct questions for easy access
        failedQuestions: detailedResults.filter(r => !r.isCorrect).map(r => {
          const questionIndex = detailedResults.indexOf(r);
          return {
            question: r.question,
            yourAnswer: r.userAnswer !== null && r.userAnswer !== undefined ? testSession.questions[questionIndex].options[r.userAnswer] : 'Not answered',
            correctAnswer: testSession.questions[questionIndex].options[r.correctAnswer],
            correctAnswerIndex: r.correctAnswer,
            explanation: r.explanation,
            category: r.category
          };
        }),
        correctQuestions: detailedResults.filter(r => r.isCorrect).map(r => {
          const questionIndex = detailedResults.indexOf(r);
          return {
            question: r.question,
            options: testSession.questions[questionIndex].options,
            correctAnswer: r.correctAnswer,
            explanation: r.explanation,
            category: r.category,
            isCorrect: r.isCorrect
          };
        })
      }
    };

    // Check if a result already exists for this test session
    let testResult = await PsychometricTestResult.findOne({
      user: userId,
      'testMetadata.testId': testSession._id.toString(),
      job: jobId
    });

    if (testResult) {
      // Update existing result with new answers and scores
      Object.assign(testResult, resultData);
      await testResult.save();
    } else {
      // Create new result
      testResult = await PsychometricTestResult.create(resultData);
    }

    // Mark the payment request as completed when test is finished
    try {
      const paymentRequest = await PaymentRequest.findOneAndUpdate(
        {
          userId: userId,
          jobId: jobId,
          status: 'approved'
        },
        {
          status: 'completed',
          completedAt: new Date()
        }
      );
      
      if (paymentRequest) {
        console.log('✅ Payment request marked as completed for user:', userId, 'job:', jobId);
      } else {
        console.log('ℹ️ No approved payment request found to complete for user:', userId, 'job:', jobId);
      }
    } catch (paymentError) {
      console.error('❌ Error updating payment request status:', paymentError);
      // Don't fail the test submission if payment status update fails
    }

    const isResubmission = testSession.status === 'completed';
    
    // Create a more compact response to avoid JSON truncation issues
    const responseData = {
      success: true,
      data: {
        resultId: testResult._id,
        score: scorePercentage,
        totalQuestions: testSession.questions.length,
        correctAnswers: correctAnswers,
        incorrectAnswers: testSession.questions.length - correctAnswers,
        timeSpent: testResult.timeSpent,
        interpretation: testResult.interpretation,
        categoryScores: testResult.scores,
        hasDetailedResults: hasDetailedResults,
        recommendations: testResult.recommendations,
        grade: scorePercentage >= 90 ? 'Excellent' : scorePercentage >= 75 ? 'Good' : scorePercentage >= 60 ? 'Average' : 'Needs Improvement',
        percentile: Math.round(scorePercentage * 0.85), // Rough percentile estimate
        // Simplified question details - removed large arrays that might cause JSON issues
        summary: {
          correctCount: detailedResults.filter(r => r.isCorrect).length,
          incorrectCount: detailedResults.filter(r => !r.isCorrect).length,
          categories: Object.keys(testResult.scores || {})
        }
      },
      message: isResubmission ? 'Test resubmitted and graded successfully!' : 'Test completed successfully!'
    };

    console.log('✅ Sending response with data size:', JSON.stringify(responseData).length, 'bytes');
    console.log('✅ Response structure valid:', {
      success: responseData.success,
      dataKeys: Object.keys(responseData.data),
      message: responseData.message
    });
    
    // Set headers explicitly to ensure proper JSON response
    res.set({
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-cache',
      'X-Content-Type-Options': 'nosniff'
    });
    
    // Validate JSON before sending
    try {
      const jsonString = JSON.stringify(responseData);
      console.log('✅ JSON validation successful, size:', jsonString.length);
      
      res.status(200).json(responseData);
    } catch (jsonError) {
      console.error('❌ JSON serialization error:', jsonError);
      res.status(500).json({
        success: false,
        error: 'Failed to serialize response',
        message: 'Internal server error occurred while preparing response'
      });
    }

  } catch (error: any) {
    console.error('❌ Error submitting psychometric test:', error);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Error details:', {
      message: error.message,
      name: error.name,
      code: error.code
    });

    // Ensure we always send a proper JSON response
    if (!res.headersSent) {
      const errorResponse = {
        success: false,
        error: 'Failed to submit test',
        message: error.message || 'An unexpected error occurred during test submission',
        timestamp: new Date().toISOString()
      };
      
      console.log('📤 Sending error response:', errorResponse);
      
      // Set headers explicitly for error responses too
      res.set({
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-cache',
        'X-Content-Type-Options': 'nosniff'
      });
      
      res.status(500).json(errorResponse);
    } else {
      console.error('❌ Headers already sent, cannot send error response');
    }
  }
};

/**
 * @desc Get user's test results
 * @route GET /api/psychometric-tests/my-results
 * @access Private
 */
export const getUserTestResults = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const results = await PsychometricTestResult.find({ user: userId })
      .populate('job', 'title company industry')
      .populate('testSession', 'testLevel')
      .sort({ completedAt: -1 });

    // Transform results to include question analysis from detailedAnalysis
    const transformedResults = results.map(result => {
      const resultObj = result.toObject();
      
      // Extract question analysis data from detailedAnalysis if it exists
      if (result.detailedAnalysis) {
        const analysis = result.detailedAnalysis as any;
        
        // Add question analysis fields to the result object
        if (analysis.questionAnalysis) {
          resultObj.questionAnalysis = analysis.questionAnalysis;
        }
        
        if (analysis.failedQuestions) {
          resultObj.failedQuestions = analysis.failedQuestions;
        }
        
        if (analysis.correctQuestions) {
          resultObj.correctQuestions = analysis.correctQuestions;
        }
        
        // Add question counts
        if (analysis.totalQuestions && analysis.correctAnswers !== undefined) {
          resultObj.totalQuestions = analysis.totalQuestions;
          resultObj.questionsCorrect = analysis.correctAnswers;
          resultObj.questionsIncorrect = analysis.totalQuestions - analysis.correctAnswers;
          resultObj.answersCount = analysis.totalQuestions;
        }
        
        // Add detailed results for backward compatibility
        if (analysis.detailedResults) {
          resultObj.detailedResults = analysis.detailedResults;
        }
      }
      
      return resultObj;
    });

    res.status(200).json({
      success: true,
      data: transformedResults,
      message: 'Test results retrieved successfully'
    });

  } catch (error: any) {
    console.error('Error fetching test results:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch test results'
    });
  }
};

/**
 * @desc Get detailed test result
 * @route GET /api/psychometric-tests/result/:resultId
 * @access Private
 */
export const getDetailedTestResult = async (req: AuthRequest, res: Response) => {
  try {
    const { resultId } = req.params;
    const userId = req.user?.id;

    // Validate resultId
    if (!validateObjectIdParam(resultId, res, 'result ID')) {
      return;
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const result = await PsychometricTestResult.findOne({
      _id: resultId,
      user: userId
    }).populate('job').populate('test');

    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Test result not found'
      });
    }

    // Get the original test session to reconstruct detailed analysis
    const testSession = await TestSession.findOne({
      _id: result.testMetadata.testId,
      user: userId
    });

    let enhancedResult = result.toObject();

    // If we have the test session, provide enhanced question-by-question analysis
    if (testSession && testSession.questions && result.answers) {
      const detailedAnalysis = testSession.questions.map((question: any, index: number) => {
        const userAnswer = result.answers[index];
        const isCorrect = userAnswer === question.correctAnswer;
        
        return {
          questionNumber: index + 1,
          question: question.question,
          options: question.options,
          userAnswer: userAnswer !== null && userAnswer !== undefined ? question.options[userAnswer] : 'Not answered',
          userAnswerIndex: userAnswer,
          correctAnswer: question.options[question.correctAnswer],
          correctAnswerIndex: question.correctAnswer,
          isCorrect,
          explanation: question.explanation,
          category: question.category
        };
      });

      enhancedResult.questionByQuestionAnalysis = detailedAnalysis;
      enhancedResult.correctQuestions = detailedAnalysis.filter(q => q.isCorrect);
      enhancedResult.failedQuestions = detailedAnalysis.filter(q => !q.isCorrect);
      enhancedResult.grade = result.overallScore >= 90 ? 'Excellent' : 
                             result.overallScore >= 75 ? 'Good' : 
                             result.overallScore >= 60 ? 'Average' : 'Needs Improvement';
      enhancedResult.percentile = Math.round(result.overallScore * 0.85);
    }

    res.status(200).json({
      success: true,
      data: enhancedResult,
      message: 'Detailed test result retrieved successfully'
    });

  } catch (error: any) {
    console.error('Error fetching detailed test result:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch detailed test result'
    });
  }
};

// Helper functions
function calculateCategoryScores(detailedResults: any[]) {
  if (!Array.isArray(detailedResults) || detailedResults.length === 0) {
    console.warn('⚠️ Empty or invalid detailedResults array');
    return { general: 0 };
  }

  const categories: { [key: string]: { correct: number; total: number } } = {};

  detailedResults.forEach(result => {
    // Safely handle missing category
    const category = result?.category || 'general';
    
    if (!categories[category]) {
      categories[category] = { correct: 0, total: 0 };
    }
    categories[category].total++;
    if (result?.isCorrect === true) {
      categories[category].correct++;
    }
  });

  const categoryScores: { [key: string]: number } = {};
  Object.keys(categories).forEach(category => {
    const categoryData = categories[category];
    if (categoryData && categoryData.total > 0) {
      categoryScores[category] = Math.round(
        (categoryData.correct / categoryData.total) * 100
      );
    } else {
      categoryScores[category] = 0;
    }
  });

  return categoryScores;
}

function generateInterpretation(score: number, categoryScores: { [key: string]: number }, jobTitle: string): string {
  // Safely handle invalid inputs
  const safeScore = typeof score === 'number' && score >= 0 && score <= 100 ? score : 0;
  const safeJobTitle = typeof jobTitle === 'string' && jobTitle.trim() ? jobTitle : 'this position';
  const safeCategoryScores = categoryScores && typeof categoryScores === 'object' ? categoryScores : {};

  let interpretation = `Based on your psychometric assessment for the ${safeJobTitle} position, you scored ${safeScore}% overall. `;

  if (safeScore >= 90) {
    interpretation += "This is an exceptional performance that demonstrates outstanding aptitude for this role. ";
  } else if (safeScore >= 80) {
    interpretation += "This is an excellent performance that shows strong suitability for this position. ";
  } else if (safeScore >= 70) {
    interpretation += "This is a good performance that indicates solid potential for this role. ";
  } else if (safeScore >= 60) {
    interpretation += "This is an average performance with room for improvement in key areas. ";
  } else {
    interpretation += "This performance suggests significant development is needed for this role. ";
  }

  // Add category-specific feedback with error handling
  try {
    const categories = Object.keys(safeCategoryScores);
    if (categories.length > 0) {
      interpretation += "Your performance across different categories shows: ";
      const strengths = categories.filter(cat => safeCategoryScores[cat] && safeCategoryScores[cat] >= 75);
      const improvements = categories.filter(cat => safeCategoryScores[cat] != null && safeCategoryScores[cat] < 60);

      if (strengths.length > 0) {
        interpretation += `strong performance in ${strengths.join(', ')} (${strengths.map(cat => (safeCategoryScores[cat] || 0) + '%').join(', ')}). `;
      }
      
      if (improvements.length > 0) {
        interpretation += `Areas for development include ${improvements.join(', ')} (${improvements.map(cat => (safeCategoryScores[cat] || 0) + '%').join(', ')}). `;
      }
    }
  } catch (error) {
    console.warn('⚠️ Error generating category-specific interpretation:', error);
  }

  interpretation += `This assessment provides insights into your readiness for the ${safeJobTitle} position and highlights areas for professional development.`;
  
  return interpretation;
}

function generateRecommendations(score: number, jobTitle: string): string[] {
  const recommendations: string[] = [];
  
  // Safely handle invalid inputs
  const safeScore = typeof score === 'number' && score >= 0 && score <= 100 ? score : 0;
  const safeJobTitle = typeof jobTitle === 'string' && jobTitle.trim() ? jobTitle : 'this position';

  try {
    if (safeScore >= 80) {
      recommendations.push(`Excellent performance! You show strong aptitude for the ${safeJobTitle} position.`);
      recommendations.push('Consider applying for senior-level positions in your field.');
    } else if (safeScore >= 60) {
      recommendations.push(`Good performance on the ${safeJobTitle} assessment.`);
      recommendations.push('Focus on developing specific skills mentioned in the job requirements.');
      recommendations.push('Consider taking additional courses to strengthen your knowledge base.');
    } else {
      recommendations.push(`Your performance indicates room for improvement for the ${safeJobTitle} position.`);
      recommendations.push('Consider gaining more experience or education in the required areas.');
      recommendations.push('Practice similar assessments to improve your test-taking skills.');
      recommendations.push('Review the job requirements and focus on developing those specific skills.');
    }
  } catch (error) {
    console.warn('⚠️ Error generating recommendations:', error);
    recommendations.push('Continue practicing and developing your skills.');
    recommendations.push('Consider seeking feedback from mentors or professionals in your field.');
  }

  // Ensure we always return at least one recommendation
  if (recommendations.length === 0) {
    recommendations.push('Keep working on improving your skills and knowledge.');
  }

  return recommendations;
}