import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';

// Auto-grade submission
const autoGradeSubmission = async (homework: any, submission: any) => {
  let totalScore = 0;
  let earnedPoints = 0;

  const answers = submission.extractedAnswers || [];
  const questions = homework.extractedQuestions || homework.interactiveElements || [];

  for (let i = 0; i < questions.length; i++) {
    const question = questions[i];
    if (!question) continue;
    
    const answer = answers.find((a: any) => a.questionIndex === i);
    if (!answer) continue;
    
    totalScore += question.points || 0;

    // Grade multiple-choice questions
    if (question.type === 'multiple-choice') {
      if (answer.answer === question.correctAnswer) {
        earnedPoints += question.points || 0;
      }
    }
    // Grade matching questions
    else if (question.type === 'matching') {
      let correctMatches = 0;
      const totalMatches = Object.keys(question.correctMatches || {}).length;
      
      // Handle matching question answers
      if (answer.answer && typeof answer.answer === 'object' && answer.answer.matches) {
        Object.entries(answer.answer.matches).forEach(([leftItem, rightItem]) => {
          if (question.correctMatches?.[leftItem] === rightItem) {
            correctMatches++;
          }
        });
        
        if (totalMatches > 0) {
          const matchPercentage = correctMatches / totalMatches;
          earnedPoints += Math.round((question.points || 0) * matchPercentage);
        }
      }
    }
    // Grade short-answer questions (simple check)
    else if (question.type === 'short-answer') {
      if (answer.answer && typeof answer.answer === 'string') {
        // Simple check - in a real app, this would use AI or more sophisticated matching
        if (answer.answer.trim().length > 0) {
          earnedPoints += question.points || 0;
        }
      }
    }
  }

  return totalScore > 0 ? Math.round((earnedPoints / totalScore) * 100) : 0;
};

// Create homework
export const createHomework = asyncHandler(async (req: Request, res: Response) => {
  try {
    // In a real app, this would save to a database
    // For now, we'll just return the data as if it was saved
    const homeworkData = {
      id: 'hw_' + Date.now(),
      ...req.body,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    res.status(201).json({
      success: true,
      data: homeworkData,
      message: 'Homework created successfully'
    });
  } catch (error: any) {
    console.error('Error creating homework:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create homework'
    });
  }
});

// Get all homework
export const getAllHomework = asyncHandler(async (req: Request, res: Response) => {
  try {
    // In a real app, this would fetch from a database
    // For now, we'll return mock data
    const mockHomework = [
      {
        id: 'hw1',
        title: 'Interactive Matching Exercise',
        description: 'Match animals with their habitats',
        level: 'p1',
        language: 'english',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        maxPoints: 10,
        status: 'published',
        extractedQuestions: [
          {
            id: 1,
            type: 'matching',
            question: 'Match the animals with their habitats',
            leftItems: ['Bird', 'Fish', 'Bear'],
            rightItems: ['Nest', 'Ocean', 'Forest'],
            leftItemImages: ['', '', ''],
            rightItemImages: ['', '', ''],
            correctMatches: {
              'Bird': 'Nest',
              'Fish': 'Ocean',
              'Bear': 'Forest'
            },
            points: 10
          }
        ]
      }
    ];

    res.status(200).json({
      success: true,
      data: mockHomework,
      count: mockHomework.length
    });
  } catch (error: any) {
    console.error('Error fetching homework:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch homework'
    });
  }
});

// Get homework by ID
export const getHomeworkById = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // In a real app, this would fetch from a database
    // For now, we'll return mock data
    const mockHomework = {
      id,
      title: 'Interactive Matching Exercise',
      description: 'Match animals with their habitats',
      level: 'p1',
      language: 'english',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      maxPoints: 10,
      status: 'published',
      extractedQuestions: [
        {
          id: 1,
          type: 'matching',
          question: 'Match the animals with their habitats',
          leftItems: ['Bird', 'Fish', 'Bear'],
          rightItems: ['Nest', 'Ocean', 'Forest'],
          leftItemImages: [
            'https://example.com/bird.jpg',
            'https://example.com/fish.jpg',
            'https://example.com/bear.jpg'
          ],
          rightItemImages: [
            'https://example.com/nest.jpg',
            'https://example.com/ocean.jpg',
            'https://example.com/forest.jpg'
          ],
          correctMatches: {
            'Bird': 'Nest',
            'Fish': 'Ocean',
            'Bear': 'Forest'
          },
          points: 10
        }
      ]
    };

    res.status(200).json({
      success: true,
      data: mockHomework
    });
  } catch (error: any) {
    console.error('Error fetching homework:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch homework'
    });
  }
});

// Submit homework
export const submitHomework = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { homeworkId } = req.params;
    const { answers, isDraft } = req.body;
    
    // In a real app, this would save to a database
    // For now, we'll just return mock data
    const mockSubmission = {
      id: 'sub_' + Date.now(),
      homeworkId,
      studentId: 'student123',
      answers,
      isDraft: isDraft || false,
      submittedAt: new Date(),
      graded: false,
      score: null
    };

    res.status(201).json({
      success: true,
      data: mockSubmission,
      message: 'Homework submitted successfully'
    });
  } catch (error: any) {
    console.error('Error submitting homework:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to submit homework'
    });
  }
});

// Get student homework submission
export const getStudentHomeworkSubmission = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { homeworkId } = req.params;
    
    // In a real app, this would fetch from a database
    // For now, we'll return mock data
    const mockSubmission = {
      id: 'sub123',
      homeworkId,
      studentId: 'student123',
      answers: [],
      isDraft: false,
      submittedAt: new Date(),
      graded: false,
      score: null
    };

    res.status(200).json({
      success: true,
      data: mockSubmission
    });
  } catch (error: any) {
    console.error('Error fetching submission:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch submission'
    });
  }
});

// Get homework submissions (for teachers)
export const getHomeworkSubmissions = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { homeworkId } = req.params;
    
    // In a real app, this would fetch from a database
    // For now, we'll return mock data
    const mockSubmissions = [
      {
        id: 'sub123',
        homeworkId,
        studentId: 'student123',
        studentName: 'John Doe',
        answers: [],
        isDraft: false,
        submittedAt: new Date(),
        graded: false,
        score: null
      }
    ];

    res.status(200).json({
      success: true,
      data: mockSubmissions,
      count: mockSubmissions.length
    });
  } catch (error: any) {
    console.error('Error fetching submissions:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch submissions'
    });
  }
});

// Grade homework submission
export const gradeHomeworkSubmission = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { submissionId } = req.params;
    const { grade, feedback } = req.body;
    
    // In a real app, this would update the database
    // For now, we'll just return mock data
    const mockSubmission = {
      id: submissionId,
      homeworkId: 'hw123',
      studentId: 'student123',
      answers: [],
      isDraft: false,
      submittedAt: new Date(),
      graded: true,
      score: grade,
      feedback
    };

    res.status(200).json({
      success: true,
      data: mockSubmission,
      message: 'Submission graded successfully'
    });
  } catch (error: any) {
    console.error('Error grading submission:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to grade submission'
    });
  }
});

// Delete homework
export const deleteHomework = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // In a real app, this would delete from a database
    res.status(200).json({
      success: true,
      message: 'Homework deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting homework:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete homework'
    });
  }
});

// Get course homework
export const getCourseHomework = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { courseId } = req.params;
    const { level, language } = req.query;
    
    // In a real app, this would fetch from a database
    // For now, we'll return mock data
    const mockHomework = [
      {
        id: 'hw1',
        title: 'Interactive Matching Exercise',
        description: 'Match animals with their habitats',
        level: level || 'p1',
        language: language || 'english',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        maxPoints: 10,
        status: 'published',
        courseId,
        extractedQuestions: [
          {
            id: 1,
            type: 'matching',
            question: 'Match the animals with their habitats',
            leftItems: ['Bird', 'Fish', 'Bear'],
            rightItems: ['Nest', 'Ocean', 'Forest'],
            leftItemImages: ['', '', ''],
            rightItemImages: ['', '', ''],
            correctMatches: {
              'Bird': 'Nest',
              'Fish': 'Ocean',
              'Bear': 'Forest'
            },
            points: 10
          }
        ]
      }
    ];

    res.status(200).json({
      success: true,
      data: mockHomework,
      count: mockHomework.length
    });
  } catch (error: any) {
    console.error('Error fetching course homework:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch course homework'
    });
  }
});