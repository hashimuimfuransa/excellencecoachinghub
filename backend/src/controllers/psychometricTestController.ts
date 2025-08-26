import { Request, Response } from 'express';
import { PsychometricTest, PsychometricTestResult, Job, JobApplication, GeneratedPsychometricTest, TestPurchase, TestSession } from '@/models';
import { UserRole, PsychometricTestType } from '../../../shared/types';
import { AuthRequest } from '@/middleware/auth';
import { aiService } from '@/services/aiService';

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

    // Check for existing test results and sessions
    let existingSession: any = null;
    let attemptNumber = 1;
    
    if (!isGeneratedTest) {
      // Look for an active session first
      existingSession = await TestSession.findActiveSession(userId, testId, jobId);
      
      if (!existingSession) {
        // Count existing attempts for this user/test/job combination
        const existingResults = await PsychometricTestResult.find({
          user: userId,
          test: testId,
          job: jobId
        }).sort({ attempt: -1 });

        if (existingResults.length > 0) {
          attemptNumber = existingResults[0].attempt + 1;
          console.log(`User ${userId} taking attempt #${attemptNumber} for test ${testId} on job ${jobId}`);
        }
      }
    } else if (isGeneratedTest && jobId) {
      // For generated tests, count existing attempts
      const existingResults = await PsychometricTestResult.find({
        user: userId,
        job: jobId,
        'testMetadata.testId': testId
      }).sort({ attempt: -1 });

      if (existingResults.length > 0) {
        attemptNumber = existingResults[0].attempt + 1;
        console.log(`User ${userId} taking attempt #${attemptNumber} for generated test ${testId} on job ${jobId}. Previous attempts: ${existingResults.length}`);
      }
    }

    // Calculate scores and get AI analysis for generated tests
    let scores: Record<string, number>;
    let overallScore: number;
    let interpretation: string;
    let recommendations: string[];
    let detailedAnalysis: any = {};

    // Try AI grading for all tests first, then fallback to traditional scoring
    try {
      console.log('Starting AI grading for test:', test.title);
      console.log('Number of answers:', Object.keys(answers).length);
      console.log('Test questions:', test.questions?.length || 0);
      console.log('Answer keys:', Object.keys(answers));
      console.log('Question IDs:', test.questions?.map((q: any) => q.id || q._id).slice(0, 5));
      console.log('Sample answers:', Object.entries(answers).slice(0, 3));
      
      const aiGrading = await aiService.gradePsychometricTest({
        test,
        answers,
        userId,
        jobId
      });
      
      console.log('AI grading successful:', {
        overallScore: aiGrading.overallScore,
        grade: aiGrading.grade,
        hasDetailedAnalysis: !!aiGrading.detailedAnalysis
      });
      
      scores = { ...aiGrading.scores, ...aiGrading.categoryScores };
      overallScore = aiGrading.overallScore;
      interpretation = aiGrading.interpretation;
      recommendations = aiGrading.recommendations;
      detailedAnalysis = {
        ...aiGrading.detailedAnalysis,
        grade: aiGrading.grade,
        percentile: aiGrading.percentile,
        categoryScores: aiGrading.categoryScores
      };
      
      console.log('Final detailed analysis:', detailedAnalysis);
      
    } catch (aiError) {
      console.error('AI grading failed, using fallback:', aiError);
      console.error('Error details:', aiError.message);
      
      // Fallback to traditional scoring
      scores = calculatePsychometricScores(test, answers);
      overallScore = Object.values(scores).length > 0 
        ? Object.values(scores).reduce((sum, score) => sum + score, 0) / Object.keys(scores).length
        : 75; // Default score if no scores calculated
      
      const testType = mapTestTypeToPsychometricType(test.type);
      interpretation = generateInterpretation(testType, scores, overallScore);
      recommendations = generateRecommendations(testType, scores);
      
      // Add fallback detailed analysis
      detailedAnalysis = {
        grade: calculateGradeFromScore(overallScore),
        percentile: Math.round(overallScore * 0.8),
        categoryScores: scores,
        strengths: ['Good problem-solving approach', 'Shows analytical thinking'],
        developmentAreas: ['Consider additional practice in weak areas'],
        industryBenchmark: 'Average',
        jobFitScore: overallScore,
        confidenceLevel: 0.7
      };
      
      console.log('Fallback scoring complete:', { overallScore, scores });
    }

    // Helper function to calculate grade
    const calculateGradeFromScore = (score: number): string => {
      if (score >= 90) return 'A+';
      if (score >= 85) return 'A';
      if (score >= 80) return 'A-';
      if (score >= 75) return 'B+';
      if (score >= 70) return 'B';
      if (score >= 65) return 'B-';
      if (score >= 60) return 'C+';
      if (score >= 55) return 'C';
      if (score >= 50) return 'C-';
      if (score >= 45) return 'D+';
      if (score >= 40) return 'D';
      return 'F';
    };

    // For generated tests, store additional metadata
    const resultData: any = {
      user: userId,
      job: jobId,
      answers,
      scores,
      overallScore,
      interpretation,
      recommendations,
      timeSpent: timeSpent || test.timeLimit,
      detailedAnalysis: isGeneratedTest ? detailedAnalysis : {},
      grade: detailedAnalysis?.grade || calculateGradeFromScore(overallScore),
      attempt: attemptNumber
    };

    // Only add test reference for non-generated tests
    if (!isGeneratedTest) {
      resultData.test = testId;
    }

    // Add metadata for dynamically generated tests
    if (isGeneratedTest) {
      resultData.testMetadata = {
        testId: testId,
        title: test.title,
        type: test.type,
        categories: test.categories,
        difficulty: test.difficulty,
        isGenerated: true,
        jobSpecific: test.jobSpecific || true
      };
    }

    // Complete the test session if one exists
    if (existingSession) {
      await TestSession.completeSession(existingSession.sessionId, answers);
    }

    // Create test result with better error handling
    console.log('Attempting to save result with data:', {
      userId: resultData.user,
      jobId: resultData.job,
      testId: isGeneratedTest ? resultData.testMetadata?.testId : resultData.test,
      overallScore: resultData.overallScore,
      grade: resultData.grade,
      attempt: resultData.attempt,
      isGenerated: isGeneratedTest
    });

    const result = new PsychometricTestResult(resultData);
    
    try {
      await result.save();
      console.log('Test result saved successfully with ID:', result._id);
    } catch (saveError: any) {
      console.error('Error saving test result:', saveError);
      
      // If it's a duplicate key error for retakes, try to update existing result instead
      if (saveError.code === 11000) {
        console.log('Duplicate key error detected, attempting to update existing result...');
        
        const query: any = {
          user: userId,
          job: jobId
        };
        
        if (!isGeneratedTest) {
          query.test = testId;
        } else {
          query['testMetadata.testId'] = testId;
        }
        
        // Find and update the existing result
        const updatedResult = await PsychometricTestResult.findOneAndUpdate(
          query,
          {
            ...resultData,
            updatedAt: new Date()
          },
          { 
            new: true, 
            upsert: false,
            sort: { createdAt: -1 } // Get the most recent one
          }
        );
        
        if (updatedResult) {
          console.log('Successfully updated existing result:', updatedResult._id);
          result._id = updatedResult._id;
          Object.assign(result, updatedResult);
        } else {
          // If no existing result found, create a new one with attempt number
          const newAttempt = Math.random().toString(36).substring(2, 8);
          resultData.attempt = `${attemptNumber}-${newAttempt}`;
          console.log('Creating new result with unique attempt:', resultData.attempt);
          
          const newResult = new PsychometricTestResult(resultData);
          await newResult.save();
          result._id = newResult._id;
          Object.assign(result, newResult);
        }
      } else {
        throw saveError;
      }
    }

    // If this is for a job application, update the application
    if (jobId) {
      const application = await JobApplication.findOne({
        job: jobId,
        applicant: userId
      });

      if (application) {
        application.psychometricTestResults.push(result._id);
        await application.save();
      }
    }

    // Populate the result based on whether it's a generated test or not
    let populatedResult;
    if (isGeneratedTest) {
      populatedResult = await PsychometricTestResult.findById(result._id)
        .populate('job', 'title company');
      
      // Add test info manually for generated tests
      populatedResult = {
        ...populatedResult.toObject(),
        test: {
          title: test.title,
          type: test.type,
          description: test.description
        }
      };
    } else {
      populatedResult = await PsychometricTestResult.findById(result._id)
        .populate('test', 'title type description')
        .populate('job', 'title company');
    }

    res.status(201).json({
      success: true,
      data: populatedResult,
      message: 'Psychometric test completed successfully'
    });
  } catch (error: any) {
    console.error('Error in takePsychometricTest:', error);
    res.status(400).json({
      success: false,
      error: 'Failed to submit psychometric test',
      message: error.message
    });
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

    // Enhance results with question details for answer analysis
    const enhancedResults = await Promise.all(results.map(async (result) => {
      const resultObj = result.toObject();
      
      try {
        // Get test questions based on test type
        let testQuestions = [];
        
        if (result.test) {
          // Regular test - get from database
          const test = await PsychometricTest.findById(result.test);
          if (test) {
            testQuestions = test.questions || [];
          }
        } else if (result.testMetadata?.testId) {
          // Generated test - try to get from GeneratedPsychometricTest
          const storedTest = await GeneratedPsychometricTest.findActiveByTestId(result.testMetadata.testId);
          if (storedTest) {
            testQuestions = storedTest.questions || [];
          }
        }

        // Create question analysis
        const questionAnalysis = testQuestions.map((question: any) => {
          const questionId = question.id || question._id?.toString();
          const userAnswer = result.answers[questionId];
          
          let isCorrect = false;
          let correctAnswer = null;
          
          // Determine correct answer based on question type
          if (question.type === 'multiple_choice' && question.correctAnswer !== undefined) {
            correctAnswer = question.correctAnswer;
            isCorrect = userAnswer === correctAnswer;
          } else if (question.type === 'true_false' && question.correctAnswer !== undefined) {
            correctAnswer = question.correctAnswer;
            isCorrect = userAnswer === correctAnswer;
          } else if (question.options && question.correctOption !== undefined) {
            correctAnswer = question.correctOption;
            isCorrect = userAnswer === correctAnswer;
          } else if (question.scoring) {
            // For personality/behavioral questions, check if answer is in high-scoring range
            const score = question.scoring[userAnswer];
            isCorrect = score && score >= 3; // Consider 3+ as "good" answer
          }

          return {
            questionId,
            question: question.text || question.question,
            userAnswer,
            correctAnswer,
            isCorrect,
            questionType: question.type,
            category: question.category,
            options: question.options,
            explanation: question.explanation
          };
        });

        // Add question analysis to result
        return {
          ...resultObj,
          questionAnalysis: questionAnalysis.length > 0 ? questionAnalysis : null,
          questionsCorrect: questionAnalysis.filter(q => q.isCorrect).length,
          questionsIncorrect: questionAnalysis.filter(q => !q.isCorrect).length,
          totalQuestions: questionAnalysis.length
        };
      } catch (error) {
        console.error(`Error enhancing result ${result._id}:`, error);
        return resultObj;
      }
    }));

    // Set headers to prevent caching
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'ETag': `"${Date.now()}-${results.length}"`
    });

    res.status(200).json({
      success: true,
      data: enhancedResults,
      timestamp: new Date().toISOString(),
      count: enhancedResults.length
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch test results',
      message: error.message
    });
  }
};

// Get test results for a job (Employer only)
export const getJobTestResults = async (req: AuthRequest, res: Response) => {
  try {
    const { jobId } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId || userRole !== UserRole.EMPLOYER) {
      return res.status(403).json({
        success: false,
        error: 'Only employers can view job test results'
      });
    }

    // Verify the job belongs to the employer
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
        error: 'You can only view test results for your own jobs'
      });
    }

    const results = await PsychometricTestResult.findByJob(jobId);

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

// Generate job-specific psychometric test using AI
// Generate job-specific test with direct parameters
export const generateJobSpecificTestDirect = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const {
      jobTitle,
      jobDescription,
      requiredSkills,
      experienceLevel,
      industry,
      testType = 'comprehensive',
      questionCount = 20,
      timeLimit = 30
    } = req.body;

    // Validate required fields
    if (!jobTitle || !jobDescription || !requiredSkills || !industry) {
      return res.status(400).json({ 
        error: 'Missing required fields: jobTitle, jobDescription, requiredSkills, industry' 
      });
    }

    console.log(`Generating AI psychometric test for: ${jobTitle} (${industry})`);
    console.log(`Parameters: ${questionCount} questions, ${timeLimit} minutes, ${testType} type`);

    // Generate the test using AI service
    const testData = await aiService.generateJobSpecificPsychometricTest({
      jobTitle,
      jobDescription,
      requiredSkills: Array.isArray(requiredSkills) ? requiredSkills : [requiredSkills],
      experienceLevel: experienceLevel || 'mid-level',
      industry,
      testType,
      questionCount,
      timeLimit,
      userId: req.user.id
    });

    console.log(`✅ Generated test with ${testData.test.questions.length} questions`);

    res.status(201).json({
      success: true,
      message: 'Job-specific psychometric test generated successfully',
      data: testData
    });

  } catch (error) {
    console.error('Error in generateJobSpecificTestDirect:', error);
    res.status(500).json({ 
      error: 'Failed to generate job-specific test',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const generateJobSpecificTest = async (req: AuthRequest, res: Response) => {
  try {
    const { jobId } = req.params;
    const { 
      testType = 'comprehensive',
      questionCount = 20,
      timeLimit = 30
    } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
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

    if (job.status !== 'active') {
      return res.status(400).json({
        success: false,
        error: 'Job is not active'
      });
    }

    // Check if user already has a generated test for this job
    const existingTest = await GeneratedPsychometricTest.findByJobAndUser(jobId, userId);
    if (existingTest) {
      return res.status(200).json({
        success: true,
        data: {
          testId: existingTest.testId,
          test: {
            title: existingTest.title,
            description: existingTest.description,
            type: existingTest.type,
            timeLimit: existingTest.timeLimit,
            industry: existingTest.industry,
            jobRole: existingTest.jobRole,
            jobSpecific: existingTest.jobSpecific,
            difficulty: existingTest.difficulty,
            categories: existingTest.categories,
            questions: existingTest.questions,
            generatedAt: existingTest.generatedAt,
            generatedFor: existingTest.userId
          }
        },
        message: 'Existing test found for this job'
      });
    }

    // Check if user has already taken a test for this job recently
    const recentResult = await PsychometricTestResult.findOne({
      user: userId,
      job: jobId,
      createdAt: {
        $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Within last 24 hours
      }
    });

    if (recentResult) {
      return res.status(400).json({
        success: false,
        error: 'You have already taken a test for this job recently. Please wait 24 hours before taking another test.'
      });
    }

    // Generate AI test
    try {
      const testData = await aiService.generateJobSpecificPsychometricTest({
        jobTitle: job.title,
        jobDescription: job.description,
        requiredSkills: job.skills || [],
        experienceLevel: job.experienceLevel,
        industry: job.industry || 'General',
        testType,
        questionCount,
        timeLimit,
        userId
      });

      // Store the generated test for reuse
      const generatedTest = new GeneratedPsychometricTest({
        testId: testData.testId,
        jobId: jobId,
        userId: userId,
        title: testData.test.title,
        description: testData.test.description,
        type: testData.test.type,
        questions: testData.test.questions,
        timeLimit: testData.test.timeLimit,
        industry: testData.test.industry,
        jobRole: testData.test.jobRole,
        difficulty: testData.test.difficulty,
        categories: testData.test.categories,
        jobSpecific: testData.test.jobSpecific,
        metadata: {
          jobTitle: job.title,
          jobDescription: job.description,
          requiredSkills: job.skills || [],
          experienceLevel: job.experienceLevel
        }
      });

      await generatedTest.save();

      res.status(200).json({
        success: true,
        data: testData,
        message: 'Job-specific psychometric test generated and saved successfully'
      });
    } catch (aiError: any) {
      console.error('AI test generation failed:', aiError);
      res.status(500).json({
        success: false,
        error: 'Failed to generate psychometric test',
        message: 'Our AI service is currently unavailable. Please try again later.'
      });
    }

  } catch (error: any) {
    console.error('Error in generateJobSpecificTest:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate job-specific test',
      message: error.message
    });
  }
};

// Get generated psychometric test by ID
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

    const generatedTest = await GeneratedPsychometricTest.findActiveByTestId(testId);
    if (!generatedTest) {
      return res.status(404).json({
        success: false,
        error: 'Generated test not found or expired'
      });
    }

    // Check if the user has access to this test (either the creator or taking it for the same job)
    if (generatedTest.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        error: 'You do not have access to this test'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        testId: generatedTest.testId,
        test: {
          title: generatedTest.title,
          description: generatedTest.description,
          type: generatedTest.type,
          timeLimit: generatedTest.timeLimit,
          industry: generatedTest.industry,
          jobRole: generatedTest.jobRole,
          jobSpecific: generatedTest.jobSpecific,
          difficulty: generatedTest.difficulty,
          categories: generatedTest.categories,
          questions: generatedTest.questions,
          generatedAt: generatedTest.generatedAt,
          generatedFor: generatedTest.userId
        }
      }
    });
  } catch (error: any) {
    console.error('Error in getGeneratedTest:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve generated test',
      message: error.message
    });
  }
};

// Helper function to calculate psychometric scores
function calculatePsychometricScores(test: any, answers: Record<string, any>): Record<string, number> {
  const scores: Record<string, number> = {};
  const traitScores: Record<string, { total: number; count: number }> = {};

  test.questions.forEach((question: any) => {
    const answer = answers[question._id.toString()];
    if (answer === undefined) return;

    let questionScore = 0;

    // Calculate score based on question type
    switch (question.type) {
      case 'multiple_choice':
        if (question.correctAnswer && answer === question.correctAnswer) {
          questionScore = 100;
        } else if (question.traits) {
          // For personality tests, score based on answer choice
          questionScore = (answer / (question.options?.length || 4)) * 100;
        }
        break;
      case 'scale':
        const range = question.scaleRange || { min: 1, max: 5 };
        questionScore = ((answer - range.min) / (range.max - range.min)) * 100;
        break;
      case 'text':
      case 'scenario':
        // For text answers, use a simple scoring mechanism
        questionScore = answer && answer.length > 10 ? 75 : 25;
        break;
    }

    // Apply question weight
    questionScore *= question.weight;

    // Distribute score to traits
    if (question.traits && question.traits.length > 0) {
      question.traits.forEach((trait: string) => {
        if (!traitScores[trait]) {
          traitScores[trait] = { total: 0, count: 0 };
        }
        traitScores[trait].total += questionScore;
        traitScores[trait].count += 1;
      });
    } else {
      // If no specific traits, use general score
      if (!traitScores['general']) {
        traitScores['general'] = { total: 0, count: 0 };
      }
      traitScores['general'].total += questionScore;
      traitScores['general'].count += 1;
    }
  });

  // Calculate average scores for each trait
  Object.keys(traitScores).forEach(trait => {
    scores[trait] = traitScores[trait].total / traitScores[trait].count;
  });

  return scores;
}

// Helper function to map test type to PsychometricTestType enum
function mapTestTypeToPsychometricType(testType: string): PsychometricTestType {
  if (!testType) {
    return PsychometricTestType.COGNITIVE; // Default fallback
  }
  
  switch (testType.toLowerCase()) {
    case 'personality':
      return PsychometricTestType.PERSONALITY;
    case 'cognitive':
      return PsychometricTestType.COGNITIVE;
    case 'aptitude':
      return PsychometricTestType.APTITUDE;
    case 'skills':
      return PsychometricTestType.SKILLS;
    case 'behavioral':
      return PsychometricTestType.BEHAVIORAL;
    case 'comprehensive':
    default:
      return PsychometricTestType.COGNITIVE; // Default fallback
  }
}

// Helper function to generate interpretation
function generateInterpretation(type: PsychometricTestType, scores: Record<string, number>, overallScore: number): string {
  const level = overallScore >= 80 ? 'high' : overallScore >= 60 ? 'moderate' : 'low';
  
  switch (type) {
    case PsychometricTestType.PERSONALITY:
      return `Your personality assessment shows ${level} compatibility with the role requirements. Key traits measured include ${Object.keys(scores).join(', ')}.`;
    case PsychometricTestType.COGNITIVE:
      return `Your cognitive abilities assessment indicates ${level} performance in problem-solving and analytical thinking.`;
    case PsychometricTestType.APTITUDE:
      return `Your aptitude test results show ${level} potential for success in the required skill areas.`;
    case PsychometricTestType.SKILLS:
      return `Your skills assessment demonstrates ${level} proficiency in the technical competencies required for this role.`;
    case PsychometricTestType.BEHAVIORAL:
      return `Your behavioral assessment indicates ${level} alignment with the behavioral competencies expected in this position.`;
    default:
      return `Your assessment results show ${level} overall performance with a score of ${overallScore.toFixed(1)}%.`;
  }
}

// Helper function to generate recommendations
function generateRecommendations(type: PsychometricTestType, scores: Record<string, number>): string[] {
  const recommendations: string[] = [];
  const lowScoreTraits = Object.entries(scores).filter(([_, score]) => score < 60);

  if (lowScoreTraits.length === 0) {
    recommendations.push('Excellent performance across all measured areas. Continue leveraging your strengths.');
  } else {
    lowScoreTraits.forEach(([trait, score]) => {
      recommendations.push(`Consider developing your ${trait} skills through targeted training or practice.`);
    });
  }

  switch (type) {
    case PsychometricTestType.PERSONALITY:
      recommendations.push('Consider taking additional personality development courses to enhance your professional profile.');
      break;
    case PsychometricTestType.COGNITIVE:
      recommendations.push('Practice logical reasoning and problem-solving exercises to improve cognitive performance.');
      break;
    case PsychometricTestType.APTITUDE:
      recommendations.push('Focus on developing the specific aptitudes that align with your career goals.');
      break;
    case PsychometricTestType.SKILLS:
      recommendations.push('Consider additional training in the technical skills relevant to your target roles.');
      break;
    case PsychometricTestType.BEHAVIORAL:
      recommendations.push('Work on developing behavioral competencies through real-world practice and feedback.');
      break;
  }

  return recommendations;
}

// Purchase a test
export const purchaseTest = async (req: AuthRequest, res: Response) => {
  try {
    const { testId } = req.params;
    const { 
      jobId, 
      paymentIntentId, 
      amount, 
      currency = 'USD', 
      maxAttempts = 3,
      requiresApproval = false // New field to indicate if approval is needed
    } = req.body;
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
          purchase: existingPurchase,
          canRequestApproval: existingPurchase.canRequestApproval,
          approvalStatus: existingPurchase.approvalStatus,
          approvalStatusDisplay: existingPurchase.approvalStatusDisplay
        }
      });
    }

    // Determine approval workflow settings
    const approvalStatus = requiresApproval ? 'not_required' : 'not_required'; // Default to not required
    const autoApproval = !requiresApproval;

    // Create new purchase
    const purchase = new TestPurchase({
      user: userId,
      test: testId,
      job: jobId,
      paymentIntentId,
      amount,
      currency,
      maxAttempts,
      status: 'completed', // In real implementation, this would be 'pending' until payment is confirmed
      approvalStatus,
      autoApproval
    });

    await purchase.save();

    // Populate the purchase with related data
    const populatedPurchase = await TestPurchase.findById(purchase._id)
      .populate('test', 'title type description timeLimit')
      .populate('job', 'title company');

    res.status(201).json({
      success: true,
      data: populatedPurchase,
      message: `Test purchased successfully${requiresApproval ? '. You can request approval to start the test.' : '. You can start the test anytime.'}`
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

// Start a test session
export const startTestSession = async (req: AuthRequest, res: Response) => {
  try {
    const { testId } = req.params;
    const { jobId } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    // Check if user has a valid purchase for this test
    const accessCheck = await TestPurchase.canTakeTest(userId, testId, jobId);
    if (!accessCheck.canTake) {
      return res.status(403).json({
        success: false,
        error: accessCheck.reason || 'You do not have access to this test',
        purchase: accessCheck.purchase
      });
    }

    // Check if there's already an active session
    const existingSession = await TestSession.findActiveSession(userId, testId, jobId);
    if (existingSession) {
      return res.status(200).json({
        success: true,
        data: existingSession,
        message: 'Resuming existing test session'
      });
    }

    // Create new session
    const session = await TestSession.createSession(userId, testId, jobId, accessCheck.purchase?._id);
    
    // Get test details for the session
    const populatedSession = await TestSession.findById(session._id)
      .populate('test', 'title type questions timeLimit')
      .populate('job', 'title company')
      .populate('purchase', 'maxAttempts attemptsUsed remainingAttempts');

    res.status(201).json({
      success: true,
      data: populatedSession,
      message: 'Test session started successfully'
    });
  } catch (error: any) {
    res.status(400).json({
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

    const session = await TestSession.findOne({ sessionId, user: userId })
      .populate('test', 'title type questions timeLimit')
      .populate('job', 'title company')
      .populate('purchase', 'maxAttempts attemptsUsed remainingAttempts');

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Test session not found'
      });
    }

    // Update last activity
    await TestSession.updateLastActivity(sessionId);

    res.status(200).json({
      success: true,
      data: session
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve test session',
      message: error.message
    });
  }
};

// Update test session (save progress)
export const updateTestSession = async (req: AuthRequest, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { answers, currentQuestionIndex, timeSpent } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const session = await TestSession.findOne({ 
      sessionId, 
      user: userId,
      status: { $in: ['active', 'paused'] }
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Active test session not found'
      });
    }

    if (session.isExpired) {
      session.status = 'expired';
      await session.save();
      
      return res.status(400).json({
        success: false,
        error: 'Test session has expired'
      });
    }

    // Update session progress
    if (answers) session.answers = { ...session.answers, ...answers };
    if (typeof currentQuestionIndex === 'number') session.currentQuestionIndex = currentQuestionIndex;
    if (typeof timeSpent === 'number') session.timeSpent = timeSpent;

    session.lastActivityAt = new Date();
    await session.save();

    res.status(200).json({
      success: true,
      data: session,
      message: 'Test session updated successfully'
    });
  } catch (error: any) {
    res.status(400).json({
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

    // Check if user has a valid purchase for this test
    const accessCheck = await TestPurchase.canTakeTest(userId, testId, jobId as string);
    
    // Check for existing session
    const existingSession = await TestSession.findActiveSession(userId, testId, jobId as string);
    
    // Check for existing completed results
    const existingResults = await PsychometricTestResult.find({
      user: userId,
      $or: [
        { test: testId },
        { 'testMetadata.testId': testId }
      ],
      ...(jobId ? { job: jobId } : {})
    }).sort({ completedAt: -1 }).limit(5);

    res.status(200).json({
      success: true,
      data: {
        canTakeTest: accessCheck.canTake,
        reason: accessCheck.reason,
        purchase: accessCheck.purchase,
        existingSession,
        existingResults,
        hasActivePurchase: !!accessCheck.purchase,
        remainingAttempts: accessCheck.purchase?.remainingAttempts || 0
      }
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

// Request approval for a test
export const requestTestApproval = async (req: AuthRequest, res: Response) => {
  try {
    const { purchaseId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    // Verify the purchase belongs to the user
    const purchase = await TestPurchase.findById(purchaseId).populate('user test job');
    if (!purchase) {
      return res.status(404).json({
        success: false,
        error: 'Test purchase not found'
      });
    }

    if (purchase.user._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied: This purchase does not belong to you'
      });
    }

    if (!purchase.canRequestApproval) {
      return res.status(400).json({
        success: false,
        error: 'Cannot request approval for this test',
        data: {
          approvalStatus: purchase.approvalStatus,
          approvalStatusDisplay: purchase.approvalStatusDisplay
        }
      });
    }

    // Request approval
    const updatedPurchase = await TestPurchase.requestApproval(purchaseId);

    res.status(200).json({
      success: true,
      data: updatedPurchase,
      message: 'Test approval requested successfully. You will be notified when an admin reviews your request.'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to request test approval',
      message: error.message
    });
  }
};

// Get pending test approvals (Admin only)
export const getPendingTestApprovals = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    
    if (!user || user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied: Super admin access required'
      });
    }

    const pendingApprovals = await TestPurchase.findPendingApprovals();

    res.status(200).json({
      success: true,
      data: pendingApprovals,
      count: pendingApprovals.length,
      message: 'Pending test approvals retrieved successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve pending approvals',
      message: error.message
    });
  }
};

// Approve a test (Admin only)
export const approveTest = async (req: AuthRequest, res: Response) => {
  try {
    const { purchaseId } = req.params;
    const user = req.user;

    if (!user || user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied: Super admin access required'
      });
    }

    const purchase = await TestPurchase.findById(purchaseId);
    if (!purchase) {
      return res.status(404).json({
        success: false,
        error: 'Test purchase not found'
      });
    }

    if (purchase.approvalStatus !== 'pending_approval') {
      return res.status(400).json({
        success: false,
        error: 'Test is not pending approval',
        data: { approvalStatus: purchase.approvalStatus }
      });
    }

    const approvedPurchase = await TestPurchase.approveTest(purchaseId, user.id);

    res.status(200).json({
      success: true,
      data: approvedPurchase,
      message: 'Test approved successfully. The user can now take the test.'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to approve test',
      message: error.message
    });
  }
};

// Reject a test (Admin only)
export const rejectTest = async (req: AuthRequest, res: Response) => {
  try {
    const { purchaseId } = req.params;
    const { reason } = req.body;
    const user = req.user;

    if (!user || user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied: Super admin access required'
      });
    }

    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Rejection reason is required'
      });
    }

    const purchase = await TestPurchase.findById(purchaseId);
    if (!purchase) {
      return res.status(404).json({
        success: false,
        error: 'Test purchase not found'
      });
    }

    if (purchase.approvalStatus !== 'pending_approval') {
      return res.status(400).json({
        success: false,
        error: 'Test is not pending approval',
        data: { approvalStatus: purchase.approvalStatus }
      });
    }

    const rejectedPurchase = await TestPurchase.rejectTest(purchaseId, user.id, reason.trim());

    res.status(200).json({
      success: true,
      data: rejectedPurchase,
      message: 'Test rejected successfully. The user has been notified.'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to reject test',
      message: error.message
    });
  }
};