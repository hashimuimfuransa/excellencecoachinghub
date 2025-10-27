import { Request, Response, NextFunction } from 'express';
import { aiService } from '../services/aiService';
import { Course } from '../models/Course';
import { CourseNotes } from '../models/CourseNotes';
import { Assessment } from '../models/Assessment';

// Chat with AI assistant
export const chatWithAI = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { question, context, courseId } = req.body;
    const studentId = req.user?.id;

    if (!question || question.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: 'Question is required'
      });
      return;
    }

    // Build context if courseId is provided
    let enhancedContext = context || '';
    
    if (courseId) {
      // Check if student is enrolled
      const course = await Course.findOne({ 
        _id: courseId, 
        enrolledStudents: studentId 
      });
      
      if (course) {
        enhancedContext += `\nCourse Context: Student is enrolled in "${course.title}" - ${course.description}`;
        
        // Add recent course notes context if available
        const recentNotes = await CourseNotes.findOne({
          course: courseId,
          isPublished: true
        }).sort({ chapter: -1 });
        
        if (recentNotes) {
          enhancedContext += `\nRecent Course Material: ${recentNotes.title}`;
        }
      }
    }

    // Get AI response
    const response = await aiService.generateContent(`${question}\n\nContext: ${enhancedContext}`);

    res.status(200).json({
      success: true,
      data: {
        question,
        response,
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error('AI Assistant error:', error);
    res.status(500).json({
      success: false,
      error: 'AI Assistant is currently unavailable. Please try again later.'
    });
  }
};

// Get study suggestions based on student progress
export const getStudySuggestions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { courseId } = req.params;
    const studentId = req.user?.id;

    // Check if student is enrolled
    const course = await Course.findOne({ 
      _id: courseId, 
      enrolledStudents: studentId 
    });
    
    if (!course) {
      res.status(403).json({
        success: false,
        error: 'You are not enrolled in this course'
      });
      return;
    }

    // Get student's progress and performance data
    const ReadingProgress = require('../models/ReadingProgress').ReadingProgress;
    const AssessmentSubmission = require('../models/AssessmentSubmission').AssessmentSubmission;

    const [readingProgress, assessmentSubmissions] = await Promise.all([
      ReadingProgress.find({ student: studentId, course: courseId })
        .populate('courseNotes', 'title chapter'),
      AssessmentSubmission.find({ student: studentId, course: courseId })
        .populate('assessment', 'title type')
        .sort({ submittedAt: -1 })
        .limit(5)
    ]);

    // Build context for AI suggestions
    const completedChapters = readingProgress.filter(p => p.isCompleted).length;
    const totalChapters = await CourseNotes.countDocuments({ course: courseId, isPublished: true });
    const averageScore = assessmentSubmissions.length > 0 
      ? assessmentSubmissions.reduce((sum, sub) => sum + (sub.percentage || 0), 0) / assessmentSubmissions.length
      : 0;

    const context = `
      Student Progress Summary:
      - Course: ${course.title}
      - Completed Chapters: ${completedChapters}/${totalChapters}
      - Average Assessment Score: ${averageScore.toFixed(1)}%
      - Recent Assessment Performance: ${assessmentSubmissions.slice(0, 3).map(sub => 
        `${sub.assessment.title}: ${sub.percentage || 0}%`
      ).join(', ')}
      
      Provide personalized study suggestions to help improve performance and progress.
    `;

    const suggestions = await aiService.generateContent(
      `Based on my progress, what study suggestions do you have for me?\n\nContext: ${context}`
    );

    res.status(200).json({
      success: true,
      data: {
        suggestions,
        progressSummary: {
          completedChapters,
          totalChapters,
          averageScore: Math.round(averageScore),
          progressPercentage: totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Explain a concept or topic
export const explainConcept = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { concept, courseId, difficulty = 'beginner' } = req.body;
    const studentId = req.user?.id;

    if (!concept || concept.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: 'Concept is required'
      });
      return;
    }

    // Build context if courseId is provided
    let context = `Difficulty level: ${difficulty}`;
    
    if (courseId) {
      const course = await Course.findOne({ 
        _id: courseId, 
        enrolledStudents: studentId 
      });
      
      if (course) {
        context += `\nCourse Context: ${course.title} - ${course.description}`;
      }
    }

    const explanation = await aiService.generateContent(
      `Please explain the concept: ${concept}\n\nContext: ${context}`
    );

    res.status(200).json({
      success: true,
      data: {
        concept,
        explanation,
        difficulty,
        timestamp: new Date()
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get help with homework/assignment (without giving direct answers)
export const getHomeworkHelp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { question, assessmentId, questionType } = req.body;
    const studentId = req.user?.id;

    if (!question || question.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: 'Question is required'
      });
      return;
    }

    let context = 'This is a homework/assignment help request. Provide guidance and hints without giving direct answers.';
    
    if (assessmentId) {
      const assessment = await Assessment.findById(assessmentId);
      if (assessment) {
        context += `\nAssessment: ${assessment.title} (${assessment.type})`;
      }
    }

    if (questionType) {
      context += `\nQuestion Type: ${questionType}`;
    }

    const help = await aiService.generateContent(`${question}\n\nContext: ${context}`);

    res.status(200).json({
      success: true,
      data: {
        question,
        help,
        disclaimer: 'This is guidance to help you learn. Make sure to work through the problem yourself!',
        timestamp: new Date()
      }
    });
  } catch (error) {
    next(error);
  }
};

// Generate practice questions for a topic
export const generatePracticeQuestions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { topic, courseId, difficulty = 'medium', count = 5 } = req.body;
    const studentId = req.user?.id;

    if (!topic || topic.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: 'Topic is required'
      });
      return;
    }

    // Build context
    let context = `Generate ${count} practice questions about: ${topic}`;
    
    if (courseId) {
      const course = await Course.findOne({ 
        _id: courseId, 
        enrolledStudents: studentId 
      });
      
      if (course) {
        context += `\nCourse Context: ${course.title}`;
      }
    }

    const practiceQuestions = await aiService.generateContent(
      `Generate ${count} practice questions about: ${topic}\n\nContext: ${context}\n\nDifficulty: ${difficulty}\n\nPlease provide the questions in a structured format with question text, multiple choice options, and correct answers.`
    );

    res.status(200).json({
      success: true,
      data: {
        topic,
        difficulty,
        questions: practiceQuestions,
        note: 'These are practice questions to help you study. They are not part of any graded assessment.'
      }
    });
  } catch (error) {
    next(error);
  }
};

// Check if AI assistant is available
export const checkAIAvailability = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const isAvailable = await aiService.isAvailable();
    
    res.status(200).json({
      success: true,
      data: {
        available: isAvailable,
        message: isAvailable 
          ? 'AI Assistant is ready to help!' 
          : 'AI Assistant is currently unavailable. Please try again later.'
      }
    });
  } catch (error) {
    res.status(200).json({
      success: true,
      data: {
        available: false,
        message: 'AI Assistant is currently unavailable.'
      }
    });
  }
};

export default {
  chatWithAI,
  getStudySuggestions,
  explainConcept,
  getHomeworkHelp,
  generatePracticeQuestions,
  checkAIAvailability
};
