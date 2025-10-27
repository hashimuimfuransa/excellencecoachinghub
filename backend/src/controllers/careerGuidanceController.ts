import { Request, Response } from 'express';
import { CareerGuidanceService, ICareerAssessment, ICareerAssessmentResult } from '@/services/careerGuidanceService';
import CareerAssessmentModel from '@/models/CareerAssessment';
import { User } from '@/models/User';
import { AuthRequest } from '@/types/auth';

const careerGuidanceService = new CareerGuidanceService();

// Generate Career Discovery Assessment
export const generateCareerDiscoveryAssessment = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ 
        success: false, 
        message: 'User authentication required' 
      });
    }

    const assessment = await careerGuidanceService.generateCareerDiscoveryTest(req.user.id);
    
    // Save assessment to database
    const savedAssessment = await new CareerAssessmentModel(assessment).save();

    res.status(201).json({
      success: true,
      message: 'Career discovery assessment generated successfully',
      data: {
        assessmentId: savedAssessment._id,
        title: savedAssessment.title,
        description: savedAssessment.description,
        questionsCount: savedAssessment.questions.length,
        estimatedDuration: '25-30 minutes',
        assessmentType: savedAssessment.assessmentType
      }
    });
  } catch (error) {
    console.error('Error generating career discovery assessment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate career discovery assessment',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Generate Job Readiness Assessment
export const generateJobReadinessAssessment = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ 
        success: false, 
        message: 'User authentication required' 
      });
    }

    const { targetJob } = req.body;
    const assessment = await careerGuidanceService.generateJobReadinessTest(req.user.id, targetJob);
    
    // Save assessment to database
    const savedAssessment = await new CareerAssessmentModel(assessment).save();

    res.status(201).json({
      success: true,
      message: 'Job readiness assessment generated successfully',
      data: {
        assessmentId: savedAssessment._id,
        title: savedAssessment.title,
        description: savedAssessment.description,
        questionsCount: savedAssessment.questions.length,
        estimatedDuration: '20-25 minutes',
        assessmentType: savedAssessment.assessmentType,
        targetJob
      }
    });
  } catch (error) {
    console.error('Error generating job readiness assessment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate job readiness assessment',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Submit Career Assessment Answers
export const submitCareerAssessment = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ 
        success: false, 
        message: 'User authentication required' 
      });
    }

    const { assessmentId } = req.params;
    const { answers } = req.body;

    // Find the assessment
    const assessment = await CareerAssessmentModel.findById(assessmentId);
    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found'
      });
    }

    // Check if user owns the assessment
    if (assessment.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to submit this assessment'
      });
    }

    // Analyze the assessment results
    const results = await careerGuidanceService.analyzeCareerAssessment(
      req.user.id,
      assessmentId,
      answers
    );

    // Update assessment with results
    await assessment.markCompleted(results, answers);

    res.status(200).json({
      success: true,
      message: 'Assessment submitted and analyzed successfully',
      data: {
        assessmentId,
        results,
        completedAt: new Date(),
        nextSteps: results.aiInsights.nextSteps
      }
    });
  } catch (error) {
    console.error('Error submitting career assessment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit career assessment',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get User's Career Assessments
export const getCareerAssessments = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ 
        success: false, 
        message: 'User authentication required' 
      });
    }

    const assessments = await CareerAssessmentModel.findByUserId(req.user.id);

    res.status(200).json({
      success: true,
      message: 'Career assessments retrieved successfully',
      data: {
        assessments: assessments.map(assessment => ({
          id: assessment._id,
          title: assessment.title,
          description: assessment.description,
          type: assessment.assessmentType,
          isCompleted: assessment.isCompleted,
          completedAt: assessment.completedAt,
          createdAt: assessment.createdAt,
          progress: assessment.getProgress()
        })),
        total: assessments.length,
        completed: assessments.filter(a => a.isCompleted).length
      }
    });
  } catch (error) {
    console.error('Error getting career assessments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve career assessments',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get Specific Career Assessment
export const getCareerAssessmentById = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ 
        success: false, 
        message: 'User authentication required' 
      });
    }

    const { assessmentId } = req.params;
    const assessment = await CareerAssessmentModel.findById(assessmentId);

    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found'
      });
    }

    // Check if user owns the assessment
    if (assessment.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this assessment'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Assessment retrieved successfully',
      data: {
        id: assessment._id,
        title: assessment.title,
        description: assessment.description,
        type: assessment.assessmentType,
        questions: assessment.questions,
        isCompleted: assessment.isCompleted,
        progress: assessment.getProgress(),
        createdAt: assessment.createdAt,
        answers: assessment.answers || {}
      }
    });
  } catch (error) {
    console.error('Error getting career assessment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve career assessment',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get Career Assessment Results
export const getCareerAssessmentResults = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ 
        success: false, 
        message: 'User authentication required' 
      });
    }

    const { assessmentId } = req.params;
    const assessment = await CareerAssessmentModel.findById(assessmentId);

    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found'
      });
    }

    // Check if user owns the assessment
    if (assessment.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access these results'
      });
    }

    if (!assessment.isCompleted || !assessment.results) {
      return res.status(400).json({
        success: false,
        message: 'Assessment has not been completed yet'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Assessment results retrieved successfully',
      data: {
        assessmentInfo: {
          id: assessment._id,
          title: assessment.title,
          type: assessment.assessmentType,
          completedAt: assessment.completedAt
        },
        results: assessment.results
      }
    });
  } catch (error) {
    console.error('Error getting assessment results:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve assessment results',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get Personalized Career Guidance
export const getPersonalizedGuidance = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ 
        success: false, 
        message: 'User authentication required' 
      });
    }

    const guidance = await careerGuidanceService.getPersonalizedGuidance(req.user.id);

    res.status(200).json({
      success: true,
      message: 'Personalized guidance retrieved successfully',
      data: guidance
    });
  } catch (error) {
    console.error('Error getting personalized guidance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve personalized guidance',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// AI Career Mentor Chat Response
export const getChatMentorResponse = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ 
        success: false, 
        message: 'User authentication required' 
      });
    }

    const { message, conversationHistory = [] } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    const mentorResponse = await careerGuidanceService.getCareerMentorResponse(
      req.user.id,
      message,
      conversationHistory
    );

    res.status(200).json({
      success: true,
      message: 'Career mentor response generated successfully',
      data: {
        response: mentorResponse,
        timestamp: new Date(),
        conversationId: `${req.user.id}_${Date.now()}`
      }
    });
  } catch (error) {
    console.error('Error getting career mentor response:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get career mentor response',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get Success Stories
export const getSuccessStories = async (req: AuthRequest, res: Response) => {
  try {
    const { careerField, limit } = req.query;
    const stories = await careerGuidanceService.getSuccessStories(careerField as string);
    
    const limitedStories = limit ? stories.slice(0, parseInt(limit as string)) : stories;

    res.status(200).json({
      success: true,
      message: 'Success stories retrieved successfully',
      data: {
        stories: limitedStories,
        total: stories.length
      }
    });
  } catch (error) {
    console.error('Error getting success stories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve success stories',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Placeholder implementations for other endpoints
export const getCareerProfile = async (req: AuthRequest, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Feature coming soon',
    data: null
  });
};

export const updateCareerProfile = async (req: AuthRequest, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Feature coming soon',
    data: null
  });
};

export const getCareerInsights = async (req: AuthRequest, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Feature coming soon',
    data: null
  });
};

export const getCareerRoadmap = async (req: AuthRequest, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Feature coming soon',
    data: null
  });
};

export const getSkillGapAnalysis = async (req: AuthRequest, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Feature coming soon',
    data: null
  });
};

export const getJobMatching = async (req: AuthRequest, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Feature coming soon',
    data: null
  });
};

export const getCourseRecommendations = async (req: AuthRequest, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Feature coming soon',
    data: null
  });
};

export const trackProgress = async (req: AuthRequest, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Feature coming soon',
    data: null
  });
};

export const generateCareerReport = async (req: AuthRequest, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Feature coming soon',
    data: null
  });
};

export const downloadCareerCertificate = async (req: AuthRequest, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Feature coming soon',
    data: null
  });
};