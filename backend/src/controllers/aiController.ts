import { Request, Response } from 'express';
import { aiService } from '../services/aiService';
import { validationResult } from 'express-validator';

// Generate quiz questions using AI
export const generateQuizQuestions = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
      return;
    }

    const { courseContent, questionCount = 5, difficulty = 'medium' } = req.body;

    // Check if AI service is available
    const isAvailable = await aiService.isAvailable();
    if (!isAvailable) {
      res.status(503).json({
        success: false,
        message: 'AI service is not available. Please check your Gemini API key configuration.'
      });
      return;
    }

    const questions = await aiService.generateQuizQuestions(
      courseContent,
      questionCount,
      difficulty
    );

    res.status(200).json({
      success: true,
      data: {
        questions,
        count: questions.length
      }
    });
  } catch (error) {
    console.error('Error generating quiz questions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate quiz questions',
      error: process.env['NODE_ENV'] === 'development' ? (error as Error).message : undefined
    });
  }
};

// Grade essay answer using AI
export const gradeEssayAnswer = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
      return;
    }

    const { question, studentAnswer, modelAnswer, maxPoints = 10 } = req.body;

    // Check if AI service is available
    const isAvailable = await aiService.isAvailable();
    if (!isAvailable) {
      res.status(503).json({
        success: false,
        message: 'AI service is not available. Please check your Gemini API key configuration.'
      });
      return;
    }

    const gradingResult = await aiService.gradeEssayAnswer(
      question,
      studentAnswer,
      modelAnswer,
      maxPoints
    );

    res.status(200).json({
      success: true,
      data: gradingResult
    });
  } catch (error) {
    console.error('Error grading essay answer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to grade essay answer',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
};

// Generate learning recommendations using AI
export const generateLearningRecommendations = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    const userProfile = req.body;

    // Check if AI service is available
    const isAvailable = await aiService.isAvailable();
    if (!isAvailable) {
      res.status(503).json({
        success: false,
        message: 'AI service is not available. Please check your Gemini API key configuration.'
      });
      return;
    }

    const recommendations = await aiService.generateLearningRecommendations(userProfile);

    res.status(200).json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    console.error('Error generating learning recommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate learning recommendations',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
};

// Analyze student performance using AI
export const analyzeStudentPerformance = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    const performanceData = req.body;

    // Check if AI service is available
    const isAvailable = await aiService.isAvailable();
    if (!isAvailable) {
      res.status(503).json({
        success: false,
        message: 'AI service is not available. Please check your Gemini API key configuration.'
      });
      return;
    }

    const analysis = await aiService.analyzeStudentPerformance(performanceData);

    res.status(200).json({
      success: true,
      data: analysis
    });
  } catch (error) {
    console.error('Error analyzing student performance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze student performance',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
};

// Generate course content using AI
export const generateCourseContent = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
      return;
    }

    const { topic, targetAudience, duration, learningObjectives } = req.body;

    // Check if AI service is available
    const isAvailable = await aiService.isAvailable();
    if (!isAvailable) {
      res.status(503).json({
        success: false,
        message: 'AI service is not available. Please check your Gemini API key configuration.'
      });
      return;
    }

    const courseContent = await aiService.generateCourseContent(
      topic,
      targetAudience,
      duration,
      learningObjectives
    );

    res.status(200).json({
      success: true,
      data: courseContent
    });
  } catch (error) {
    console.error('Error generating course content:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate course content',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
};

// Check AI service status
export const getAIServiceStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const isAvailable = await aiService.isAvailable();
    
    res.status(200).json({
      success: true,
      data: {
        available: isAvailable,
        service: 'Gemini AI',
        features: [
          'Quiz Question Generation',
          'Essay Grading',
          'Learning Recommendations',
          'Performance Analysis',
          'Course Content Generation'
        ]
      }
    });
  } catch (error) {
    console.error('Error checking AI service status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check AI service status',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
};
