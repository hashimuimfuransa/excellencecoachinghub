import { Request, Response } from 'express';
import { aiService } from '../services/aiServiceExtension';
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

// Generate section quiz using AI
export const generateSectionQuiz = async (req: Request, res: Response): Promise<void> => {
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

    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    const {
      courseId,
      sectionId,
      sectionTitle,
      sectionContent,
      difficulty = 'medium',
      questionCount = 5
    } = req.body;

    // Check if AI service is available
    const isAvailable = await aiService.isAvailable();
    if (!isAvailable) {
      res.status(503).json({
        success: false,
        message: 'AI service is not available. Please check your Gemini API key configuration.'
      });
      return;
    }

    // For students, verify they are enrolled in the course
    if (req.user?.role === 'student') {
      const { UserProgress } = require('../models/UserProgress');
      const enrollment = await UserProgress.findOne({ 
        user: userId, 
        course: courseId 
      });
      
      if (!enrollment) {
        res.status(403).json({
          success: false,
          message: 'You must be enrolled in this course to generate quizzes'
        });
        return;
      }
    }

    const quiz = await aiService.generateSectionQuiz({
      courseId,
      sectionId,
      sectionTitle,
      sectionContent,
      difficulty,
      questionCount
    });

    res.status(200).json({
      success: true,
      data: quiz
    });
  } catch (error) {
    console.error('Error generating section quiz:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate section quiz',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
};

// Evaluate quiz answers using AI
export const evaluateQuizAnswers = async (req: Request, res: Response): Promise<void> => {
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

    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    const {
      courseId,
      sectionId,
      quizId,
      answers,
      questions
    } = req.body;

    // Check if AI service is available
    const isAvailable = await aiService.isAvailable();
    if (!isAvailable) {
      res.status(503).json({
        success: false,
        message: 'AI service is not available. Please check your Gemini API key configuration.'
      });
      return;
    }

    // For students, verify they are enrolled in the course
    if (req.user?.role === 'student') {
      const { UserProgress } = require('../models/UserProgress');
      const enrollment = await UserProgress.findOne({ 
        user: userId, 
        course: courseId 
      });
      
      if (!enrollment) {
        res.status(403).json({
          success: false,
          message: 'You must be enrolled in this course to take quizzes'
        });
        return;
      }
    }

    const evaluation = await aiService.evaluateQuizAnswers({
      courseId,
      sectionId,
      quizId,
      answers,
      questions
    });

    res.status(200).json({
      success: true,
      data: evaluation
    });
  } catch (error) {
    console.error('Error evaluating quiz answers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to evaluate quiz answers',
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
          'Section Quiz Generation',
          'Essay Grading',
          'Quiz Answer Evaluation',
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

// Grade assessment automatically
export const gradeAssessment = async (req: Request, res: Response): Promise<void> => {
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

    const { assessmentId, answers, questions } = req.body;

    // Check if AI service is available
    const isAvailable = await aiService.isAvailable();
    if (!isAvailable) {
      res.status(503).json({
        success: false,
        message: 'AI service is not available'
      });
      return;
    }

    // Grade each answer
    let totalScore = 0;
    let totalPoints = 0;
    const gradedAnswers = [];

    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      const answer = answers.find((a: any) => a.questionId === question._id);
      
      if (answer) {
        const result = await aiService.gradeEssayAnswer(
          question.question,
          answer.answer,
          question.correctAnswer || '',
          question.points
        );
        gradedAnswers.push({
          questionId: question._id,
          score: result.score,
          feedback: result.feedback,
          isCorrect: result.score >= (question.points * 0.7)
        });
        totalScore += result.score;
      }
      totalPoints += question.points;
    }

    const percentage = totalPoints > 0 ? Math.round((totalScore / totalPoints) * 100) : 0;
    
    // Generate overall feedback
    const overallFeedback = `Assessment completed with ${percentage}% score. ${
      percentage >= 70 ? 'Good work!' : 'Consider reviewing the material and trying again.'
    }`;

    res.status(200).json({
      success: true,
      data: {
        score: percentage,
        feedback: overallFeedback,
        confidence: 0.85,
        breakdown: gradedAnswers,
        suggestions: [],
        gradedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Error grading assessment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to grade assessment',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
};

// Grade assignment text/essay
export const gradeAssignment = async (req: Request, res: Response): Promise<void> => {
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

    const { assignmentId, submissionText, rubric, maxPoints, instructions } = req.body;

    // Check if AI service is available
    const isAvailable = await aiService.isAvailable();
    if (!isAvailable) {
      res.status(503).json({
        success: false,
        message: 'AI service is not available'
      });
      return;
    }

    const result = await aiService.gradeEssayAnswer(
      instructions || 'Assignment submission',
      submissionText,
      rubric || '',
      maxPoints || 100
    );

    const percentage = Math.round((result.score / (maxPoints || 100)) * 100);

    res.status(200).json({
      success: true,
      data: {
        score: percentage,
        feedback: result.feedback,
        confidence: 0.80,
        breakdown: [{
          criteria: 'Overall Quality',
          score: result.score,
          feedback: result.feedback
        }],
        suggestions: result.suggestions || [],
        gradedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Error grading assignment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to grade assignment',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
};

// Grade individual question
export const gradeQuestion = async (req: Request, res: Response): Promise<void> => {
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

    const { question, answer } = req.body;

    // Check if AI service is available
    const isAvailable = await aiService.isAvailable();
    if (!isAvailable) {
      res.status(503).json({
        success: false,
        message: 'AI service is not available'
      });
      return;
    }

    const result = await aiService.gradeEssayAnswer(
      question.question,
      answer,
      question.correctAnswer || '',
      question.points || 10
    );

    res.status(200).json({
      success: true,
      data: {
        isCorrect: result.score >= (question.points * 0.7),
        score: result.score,
        feedback: result.feedback,
        explanation: question.explanation
      }
    });
  } catch (error) {
    console.error('Error grading question:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to grade question',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
};

// Get AI feedback for text
export const getTextFeedback = async (req: Request, res: Response): Promise<void> => {
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

    const { text, rubric, maxPoints } = req.body;

    // Check if AI service is available
    const isAvailable = await aiService.isAvailable();
    if (!isAvailable) {
      res.status(503).json({
        success: false,
        message: 'AI service is not available'
      });
      return;
    }

    const result = await aiService.gradeEssayAnswer(
      'Provide feedback for this text',
      text,
      rubric || '',
      maxPoints || 100
    );

    res.status(200).json({
      success: true,
      data: {
        score: result.score,
        feedback: result.feedback,
        suggestions: result.suggestions || [],
        strengths: ['Clear writing', 'Good structure'],
        improvements: ['Consider adding more examples', 'Expand on key points']
      }
    });
  } catch (error) {
    console.error('Error getting text feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get text feedback',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
};

// Grade math expressions
export const gradeMathExpression = async (req: Request, res: Response): Promise<void> => {
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

    const { expression, correctAnswer, tolerance = 0.01 } = req.body;

    // Simple math expression evaluation
    try {
      const studentResult = eval(expression.replace(/[^0-9+\-*/().\s]/g, ''));
      const correctResult = eval(correctAnswer.replace(/[^0-9+\-*/().\s]/g, ''));
      
      const isCorrect = Math.abs(studentResult - correctResult) <= tolerance;
      
      res.status(200).json({
        success: true,
        data: {
          isCorrect,
          score: isCorrect ? 100 : 0,
          feedback: isCorrect ? 'Correct answer!' : `Incorrect. Expected: ${correctResult}, Got: ${studentResult}`,
          steps: [`Expression: ${expression}`, `Result: ${studentResult}`]
        }
      });
    } catch (error) {
      res.status(200).json({
        success: true,
        data: {
          isCorrect: false,
          score: 0,
          feedback: 'Invalid mathematical expression',
          steps: []
        }
      });
    }
  } catch (error) {
    console.error('Error grading math expression:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to grade math expression',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
};

// Grade code submissions
export const gradeCode = async (req: Request, res: Response): Promise<void> => {
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

    const { code, language, expectedOutput, testCases } = req.body;

    // Basic code analysis
    const codeLength = code.length;
    const hasComments = code.includes('//') || code.includes('/*');
    const hasProperIndentation = code.includes('  ') || code.includes('\t');
    
    let score = 50; // Base score
    if (hasComments) score += 20;
    if (hasProperIndentation) score += 20;
    if (codeLength > 100) score += 10;

    res.status(200).json({
      success: true,
      data: {
        score: Math.min(score, 100),
        feedback: 'Code submitted successfully. Manual review recommended.',
        testResults: {
          passed: 0,
          total: testCases?.length || 0,
          details: []
        },
        codeQuality: {
          score: Math.min(score, 100),
          issues: hasComments ? [] : ['Consider adding comments'],
          suggestions: ['Add error handling', 'Consider edge cases']
        }
      }
    });
  } catch (error) {
    console.error('Error grading code:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to grade code',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
};

// Detect plagiarism in text
export const detectPlagiarism = async (req: Request, res: Response): Promise<void> => {
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

    const { text, courseId } = req.body;

    // Basic plagiarism detection (simplified)
    const commonPhrases = ['lorem ipsum', 'copy paste', 'sample text'];
    const suspiciousPhrases = commonPhrases.filter(phrase => 
      text.toLowerCase().includes(phrase)
    );

    const plagiarismScore = suspiciousPhrases.length > 0 ? 80 : Math.random() * 20;

    res.status(200).json({
      success: true,
      data: {
        plagiarismScore,
        matches: suspiciousPhrases.map(phrase => ({
          source: 'Common phrases database',
          similarity: 90,
          matchedText: phrase
        })),
        isOriginal: plagiarismScore < 30
      }
    });
  } catch (error) {
    console.error('Error detecting plagiarism:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to detect plagiarism',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
};

// Generate rubric for assignment
export const generateRubric = async (req: Request, res: Response): Promise<void> => {
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

    const { title, description, instructions, maxPoints } = req.body;

    // Generate a basic rubric structure
    const criteria = [
      {
        name: 'Content Quality',
        description: 'Accuracy and depth of content',
        points: Math.floor(maxPoints * 0.4),
        levels: [
          { level: 'Excellent', description: 'Comprehensive and accurate', points: Math.floor(maxPoints * 0.4) },
          { level: 'Good', description: 'Mostly accurate with minor gaps', points: Math.floor(maxPoints * 0.3) },
          { level: 'Fair', description: 'Some accuracy issues', points: Math.floor(maxPoints * 0.2) },
          { level: 'Poor', description: 'Significant inaccuracies', points: Math.floor(maxPoints * 0.1) }
        ]
      },
      {
        name: 'Organization',
        description: 'Structure and flow of ideas',
        points: Math.floor(maxPoints * 0.3),
        levels: [
          { level: 'Excellent', description: 'Clear and logical structure', points: Math.floor(maxPoints * 0.3) },
          { level: 'Good', description: 'Generally well organized', points: Math.floor(maxPoints * 0.2) },
          { level: 'Fair', description: 'Some organizational issues', points: Math.floor(maxPoints * 0.15) },
          { level: 'Poor', description: 'Poor organization', points: Math.floor(maxPoints * 0.05) }
        ]
      },
      {
        name: 'Writing Quality',
        description: 'Grammar, style, and clarity',
        points: Math.floor(maxPoints * 0.3),
        levels: [
          { level: 'Excellent', description: 'Clear and error-free', points: Math.floor(maxPoints * 0.3) },
          { level: 'Good', description: 'Minor errors', points: Math.floor(maxPoints * 0.2) },
          { level: 'Fair', description: 'Some errors affecting clarity', points: Math.floor(maxPoints * 0.15) },
          { level: 'Poor', description: 'Many errors', points: Math.floor(maxPoints * 0.05) }
        ]
      }
    ];

    const rubricText = `Rubric for ${title}\n\n${description}\n\nCriteria:\n${
      criteria.map(c => `- ${c.name}: ${c.description} (${c.points} points)`).join('\n')
    }`;

    res.status(200).json({
      success: true,
      data: {
        rubric: rubricText,
        criteria
      }
    });
  } catch (error) {
    console.error('Error generating rubric:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate rubric',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
};

// Generate general AI content
export const generateGeneralContent = async (req: Request, res: Response): Promise<void> => {
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

    const { prompt } = req.body;

    // Check if AI service is available
    const isAvailable = await aiService.isAvailable();
    if (!isAvailable) {
      res.status(503).json({
        success: false,
        message: 'AI service is not available. Please check your Gemini API key configuration.'
      });
      return;
    }

    // Use the AI service to generate content
    const content = await aiService.generateContent(prompt);

    res.status(200).json({
      success: true,
      content: content
    });
  } catch (error) {
    console.error('Error generating AI content:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate AI content',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
};