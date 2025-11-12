import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';

// Mock data for interactive homework
const interactiveHomeworkData = [
  {
    id: '1',
    title: 'Math Quiz',
    description: 'Solve the following math problems',
    questions: [
      {
        id: 1,
        type: 'multiple-choice',
        question: 'What is 2 + 2?',
        options: ['3', '4', '5', '6'],
        correctAnswer: 1
      },
      {
        id: 2,
        type: 'text',
        question: 'What is the square root of 16?',
        correctAnswer: '4'
      }
    ],
    courseId: 'course1',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 1 week from now
  },
  {
    id: '2',
    title: 'Science Experiment',
    description: 'Describe the water cycle',
    questions: [
      {
        id: 1,
        type: 'long-text',
        question: 'Explain the process of evaporation in the water cycle',
        correctAnswer: 'Evaporation is the process where water changes from liquid to gas'
      }
    ],
    courseId: 'course2',
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 2 weeks from now
  }
];

// Get interactive homework by ID
export const getInteractiveHomework = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const homework = interactiveHomeworkData.find(hw => hw.id === id);
  
  if (!homework) {
    return res.status(404).json({
      success: false,
      message: 'Interactive homework not found'
    });
  }
  
  res.status(200).json({
    success: true,
    data: homework
  });
});

// Submit interactive homework
export const submitInteractiveHomework = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { answers } = req.body;
  
  const homework = interactiveHomeworkData.find(hw => hw.id === id);
  
  if (!homework) {
    return res.status(404).json({
      success: false,
      message: 'Interactive homework not found'
    });
  }
  
  // Simple grading logic (in a real app, this would be more complex)
  let score = 0;
  let totalQuestions = homework.questions.length;
  
  homework.questions.forEach((question, index) => {
    const userAnswer = answers[index];
    if (question.type === 'multiple-choice') {
      if (userAnswer === question.correctAnswer) {
        score++;
      }
    } else if (question.type === 'text' || question.type === 'long-text') {
      // For text answers, we'll do a simple check (in reality, this would use AI grading)
      if (userAnswer && 
          typeof userAnswer === 'string' && 
          typeof question.correctAnswer === 'string' &&
          userAnswer.toLowerCase().includes(question.correctAnswer.toLowerCase())) {
        score++;
      }
    }
  });
  
  const percentage = Math.round((score / totalQuestions) * 100);
  
  res.status(200).json({
    success: true,
    data: {
      homeworkId: id,
      score,
      totalQuestions,
      percentage,
      feedback: percentage >= 80 
        ? 'Great job! You have a good understanding of the material.' 
        : percentage >= 60 
          ? 'Good effort. Review the material to improve your understanding.' 
          : 'Please review the material and try again.'
    }
  });
});

// Get student-created homework
export const getStudentCreatedHomework = asyncHandler(async (req: Request, res: Response) => {
  // In a real app, this would fetch homework created by the student
  const studentHomework = [
    {
      id: 'student1',
      title: 'My Math Homework',
      description: 'Problems I created for practice',
      courseId: 'course1',
      createdAt: new Date(),
      isPublic: true
    }
  ];
  
  res.status(200).json({
    success: true,
    data: studentHomework
  });
});