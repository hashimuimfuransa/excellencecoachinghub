import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { Assignment, AssignmentSubmission } from '../models';

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
    // Create assignment in database
    const homework = new Assignment({
      ...req.body,
      instructor: (req as any).user._id, // Assuming user is attached to request
      status: 'published'
    });
    
    await homework.save();

    res.status(201).json({
      success: true,
      data: homework,
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
    // Fetch published assignments from database
    const homework = await Assignment.find({ status: 'published' })
      .select('title description level language dueDate maxPoints status extractedQuestions')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: homework,
      count: homework.length
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
    
    // Fetch assignment from database
    const homework = await Assignment.findById(id)
      .select('title description level language dueDate maxPoints status extractedQuestions');
    
    if (!homework) {
      return res.status(404).json({
        success: false,
        message: 'Homework not found'
      });
    }

    res.status(200).json({
      success: true,
      data: homework
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
    
    // Check if assignment exists
    const assignment = await Assignment.findById(homeworkId);
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Homework not found'
      });
    }
    
    // Create or update submission
    const submissionData = {
      assignment: homeworkId,
      student: (req as any).user._id, // Assuming user is attached to request
      extractedAnswers: answers,
      isDraft: isDraft || false,
      submittedAt: isDraft ? undefined : new Date(),
      status: isDraft ? 'draft' : 'submitted'
    };
    
    // Check if submission already exists
    let submission = await AssignmentSubmission.findOne({
      assignment: homeworkId,
      student: (req as any).user._id
    });
    
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

    res.status(201).json({
      success: true,
      data: submission,
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
    
    // Fetch submission from database
    const submission = await AssignmentSubmission.findOne({
      assignment: homeworkId,
      student: (req as any).user._id
    });
    
    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }

    res.status(200).json({
      success: true,
      data: submission
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
    
    // Check if assignment exists
    const assignment = await Assignment.findById(homeworkId);
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Homework not found'
      });
    }
    
    // Fetch submissions from database
    const submissions = await AssignmentSubmission.find({ assignment: homeworkId })
      .populate('student', 'firstName lastName');

    res.status(200).json({
      success: true,
      data: submissions,
      count: submissions.length
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
    
    // Update submission in database
    const submission = await AssignmentSubmission.findByIdAndUpdate(
      submissionId,
      {
        grade,
        feedback,
        gradedAt: new Date(),
        gradedBy: (req as any).user._id, // Assuming user is attached to request
        status: 'graded'
      },
      { new: true }
    );
    
    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }

    res.status(200).json({
      success: true,
      data: submission,
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
    
    // Delete assignment from database
    const assignment = await Assignment.findByIdAndDelete(id);
    
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Homework not found'
      });
    }
    
    // Also delete associated submissions
    await AssignmentSubmission.deleteMany({ assignment: id });

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
    
    // Build query
    const query: any = { 
      status: 'published' 
    };
    
    if (courseId) {
      query.course = courseId;
    }
    
    if (level) {
      query.level = level;
    }
    
    if (language) {
      query.language = language;
    }
    
    // Fetch assignments from database
    const homework = await Assignment.find(query)
      .select('title description level language dueDate maxPoints status extractedQuestions')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: homework,
      count: homework.length
    });
  } catch (error: any) {
    console.error('Error fetching course homework:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch course homework'
    });
  }
});