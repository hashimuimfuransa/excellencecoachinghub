import { Request, Response } from 'express';
import { PsychometricTestResult, Job, TestPurchase, TestSession } from '../models';
import { AuthRequest } from '../middleware/auth';
import { aiService } from '../services/aiService';
import mongoose from 'mongoose';

/**
 * @desc Generate psychometric test based on job and user's purchased level
 * @route POST /api/psychometric-tests/generate-test
 * @access Private
 */
export const generatePsychometricTest = async (req: AuthRequest, res: Response) => {
  try {
    const { jobId, levelId } = req.body;
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

    // Generate test using AI service with proper JSON parsing
    const testData = await aiService.generatePsychometricTest({
      jobTitle: job.title,
      jobDescription: job.description,
      industry: job.industry,
      experienceLevel: job.experienceLevel,
      skills: job.skills && Array.isArray(job.skills) ? job.skills : [],
      questionCount,
      testLevel: levelId,
      timeLimit
    });

    // Validate the structure
    if (!testData.questions || !Array.isArray(testData.questions)) {
      return res.status(500).json({
        success: false,
        error: 'Failed to generate test questions - invalid structure'
      });
    }

    console.log('✅ Successfully generated', testData.questions.length, 'questions for', job.title);

    // Create test session (simple version - no purchase required)
    // Use retry logic for MongoDB operations after long AI generation
    let testSession;
    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount < maxRetries) {
      try {
        testSession = await TestSession.create({
          user: userId,
          job: jobId,
          testLevel: levelId,
          purchase: null, // No purchase required for simple tests
          questions: testData.questions,
          timeLimit: timeLimit,
          status: 'ready',
          generatedAt: new Date()
        });
        break; // Success, exit retry loop
      } catch (dbError: any) {
        retryCount++;
        console.log(`🔄 MongoDB retry ${retryCount}/${maxRetries} for test session creation`);
        
        if (retryCount >= maxRetries) {
          console.error('Failed to create test session after retries:', dbError);
          throw dbError;
        }
        
        // Wait a bit before retrying
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
        questionCount: testData.questions.length,
        timeLimit: timeLimit,
        instructions: `You have ${timeLimit} minutes to complete ${testData.questions.length} questions. Each question has only one correct answer. Good luck!`
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
 * @desc Submit psychometric test answers
 * @route POST /api/psychometric-tests/submit/:sessionId
 * @access Private
 */
export const submitPsychometricTest = async (req: AuthRequest, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { answers } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
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

    // Create or update test result record
    const resultData = {
      user: userId,
      job: testSession.job._id,
      testSession: testSession._id,
      testLevel: testSession.testLevel,
      score: scorePercentage,
      totalQuestions: testSession.questions.length,
      correctAnswers: correctAnswers,
      completedAt: new Date(),
      results: {
        overallScore: scorePercentage,
        categoryScores: calculateCategoryScores(detailedResults),
        detailedResults: hasDetailedResults ? detailedResults : null,
        recommendations: generateRecommendations(scorePercentage, (testSession.job as any).title)
      }
    };

    // Check if a result already exists for this test session
    let testResult = await PsychometricTestResult.findOne({
      testSession: testSession._id
    });

    if (testResult) {
      // Update existing result with new answers and scores
      Object.assign(testResult, resultData);
      await testResult.save();
    } else {
      // Create new result
      testResult = await PsychometricTestResult.create(resultData);
    }

    const isResubmission = testSession.status === 'completed';
    
    res.status(200).json({
      success: true,
      data: {
        resultId: testResult._id,
        score: scorePercentage,
        totalQuestions: testSession.questions.length,
        correctAnswers: correctAnswers,
        hasDetailedResults: hasDetailedResults,
        recommendations: testResult.results.recommendations
      },
      message: isResubmission ? 'Test resubmitted and graded successfully!' : 'Test completed successfully!'
    });

  } catch (error: any) {
    console.error('Error submitting psychometric test:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit test'
    });
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

    res.status(200).json({
      success: true,
      data: results,
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

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const result = await PsychometricTestResult.findOne({
      _id: resultId,
      user: userId
    }).populate('job').populate('testSession');

    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Test result not found'
      });
    }

    res.status(200).json({
      success: true,
      data: result,
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
  const categories: { [key: string]: { correct: number; total: number } } = {};

  detailedResults.forEach(result => {
    if (!categories[result.category]) {
      categories[result.category] = { correct: 0, total: 0 };
    }
    categories[result.category].total++;
    if (result.isCorrect) {
      categories[result.category].correct++;
    }
  });

  const categoryScores: { [key: string]: number } = {};
  Object.keys(categories).forEach(category => {
    categoryScores[category] = Math.round(
      (categories[category].correct / categories[category].total) * 100
    );
  });

  return categoryScores;
}

function generateRecommendations(score: number, jobTitle: string): string[] {
  const recommendations: string[] = [];

  if (score >= 80) {
    recommendations.push(`Excellent performance! You show strong aptitude for the ${jobTitle} position.`);
    recommendations.push('Consider applying for senior-level positions in your field.');
  } else if (score >= 60) {
    recommendations.push(`Good performance on the ${jobTitle} assessment.`);
    recommendations.push('Focus on developing specific skills mentioned in the job requirements.');
    recommendations.push('Consider taking additional courses to strengthen your knowledge base.');
  } else {
    recommendations.push(`Your performance indicates room for improvement for the ${jobTitle} position.`);
    recommendations.push('Consider gaining more experience or education in the required areas.');
    recommendations.push('Practice similar assessments to improve your test-taking skills.');
    recommendations.push('Review the job requirements and focus on developing those specific skills.');
  }

  return recommendations;
}