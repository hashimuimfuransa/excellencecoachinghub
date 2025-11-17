import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { Assignment, AssignmentSubmission } from '../models/Assignment';

// Define types for homework questions
interface BaseQuestion {
  id: number;
  type: string;
  question: string;
}

interface MultipleChoiceQuestion extends BaseQuestion {
  type: 'multiple-choice';
  options: string[];
  correctAnswer: number;
}

interface TextQuestion extends BaseQuestion {
  type: 'text' | 'long-text';
  correctAnswer: string;
}

interface MatchingQuestion extends BaseQuestion {
  type: 'matching';
  leftItems: string[];
  rightItems: string[];
  leftItemImages?: string[];
  rightItemImages?: string[];
  correctMatches: Record<string, string>;
}

type HomeworkQuestion = MultipleChoiceQuestion | TextQuestion | MatchingQuestion;

interface Homework {
  id: string;
  title: string;
  description: string;
  questions: HomeworkQuestion[];
  courseId: string;
  dueDate: Date;
}

// Mock data for interactive homework
const interactiveHomeworkData: Homework[] = [
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
  },
  {
    id: '3',
    title: 'Matching Exercise',
    description: 'Match the animals with their habitats',
    questions: [
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
        }
      }
    ],
    courseId: 'course3',
    dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000) // 10 days from now
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

// Save interactive homework progress
export const saveInteractiveHomeworkProgress = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { answers } = req.body;
  
  try {
    // Find the assignment
    const assignment = await Assignment.findById(id);
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Homework not found'
      });
    }
    
    // Check if there's already a submission for this student and assignment
    let submission = await AssignmentSubmission.findOne({
      assignment: id,
      student: (req as any).user._id
    });
    
    // Prepare submission data
    const submissionData: any = {
      assignment: id,
      student: (req as any).user._id,
      extractedAnswers: Object.keys(answers).map(key => ({
        questionIndex: parseInt(key),
        answer: answers[key],
        questionType: assignment.extractedQuestions?.[parseInt(key)]?.type || 'unknown'
      })),
      status: 'draft',
      autoSavedAt: new Date()
    };
    
    if (submission) {
      // Update existing submission
      submission = await AssignmentSubmission.findByIdAndUpdate(
        submission._id,
        submissionData,
        { new: true }
      );
    } else {
      // Create new submission
      submission = new AssignmentSubmission(submissionData);
      await submission.save();
    }
    
    res.status(200).json({
      success: true,
      message: 'Progress saved successfully',
      data: submission
    });
  } catch (error) {
    console.error('Error saving homework progress:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save progress'
    });
  }
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
    } else if (question.type === 'matching') {
      // For matching questions, check each match
      let correctMatches = 0;
      const totalMatches = Object.keys(question.correctMatches || {}).length;
      
      if (userAnswer && typeof userAnswer === 'object') {
        Object.entries(userAnswer).forEach(([leftItem, rightItem]) => {
          if (question.correctMatches?.[leftItem] === rightItem) {
            correctMatches++;
          }
        });
        
        // Award points based on percentage of correct matches
        if (totalMatches > 0) {
          const matchPercentage = correctMatches / totalMatches;
          if (matchPercentage > 0.5) { // At least 50% correct
            score++;
          }
        }
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