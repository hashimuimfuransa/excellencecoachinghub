import { GoogleGenerativeAI } from '@google/generative-ai';
import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { Assignment, AssignmentSubmission } from '../models';

// Initialize Google Generative AI with API key from environment variables
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const geminiModel = genAI.getGenerativeModel({ model: "gemini-pro" });

// Simple AI grading function for text questions using Gemini
const simpleAIGrading = async (userAnswer: string, correctAnswer: string, points: number) => {
  // If exact match, give full points
  if (userAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim()) {
    return points;
  }
  
  try {
    // Use Gemini AI to evaluate the similarity of answers
    const prompt = `
    Compare these two answers and determine if they are semantically equivalent:
    
    Teacher's correct answer: "${correctAnswer}"
    Student's answer: "${userAnswer}"
    
    Consider variations in wording, grammar, and structure, but focus on whether the meaning is the same.
    
    Respond with only one word: "MATCH" if they are equivalent, or "NO_MATCH" if they are not.
    `;
    
    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim().toUpperCase();
    
    // If Gemini determines they match, give full points
    if (text === 'MATCH') {
      return points;
    }
    
    // If no match, give 0 points
    return 0;
  } catch (error) {
    console.error('Error using Gemini AI for grading:', error);
    // Fallback to simple word matching
    const userWords = userAnswer.toLowerCase().split(/\s+/);
    const correctWords = correctAnswer.toLowerCase().split(/\s+/);
    const matchingWords = userWords.filter(word => correctWords.includes(word)).length;
    const similarity = matchingWords / Math.max(userWords.length, correctWords.length);
    return Math.max(0, Math.round(points * similarity));
  }
};

// Auto-grade submission
const autoGradeSubmission = async (homework: any, submission: any) => {
  let totalScore = 0;
  let earnedPoints = 0;

  const answers = submission.extractedAnswers || [];
  const questions = homework.extractedQuestions || homework.interactiveElements || [];

  console.log(`Auto-grading submission: ${answers.length} answers, ${questions.length} questions`);

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
      console.log(`Question ${i} (multiple-choice): ${answer.answer === question.correctAnswer ? 'Correct' : 'Incorrect'}`);
    }
    // Grade matching questions
    else if (question.type === 'matching') {
      let correctMatches = 0;
      const totalMatches = Object.keys(question.correctMatches || {}).length;
      
      console.log(`Matching question ${i}: correctMatches=${JSON.stringify(question.correctMatches)}, studentAnswer=${JSON.stringify(answer.answer)}`);
      
      // Handle matching question answers - improved logic to handle indexed IDs
      if (answer.answer && typeof answer.answer === 'object' && answer.answer.matches) {
        // Map indexed IDs to actual text values
        const leftItems = question.leftItems || [];
        const rightItems = question.rightItems || [];
        
        // Compare each student match with the correct matches
        Object.entries(answer.answer.matches).forEach(([leftId, rightId]) => {
          // Extract indices from IDs (e.g., "left-0" -> 0)
          const leftIndex = leftId.startsWith('left-') ? parseInt(leftId.split('-')[1]) : -1;
          const rightIndex = rightId.startsWith('right-') ? parseInt(rightId.split('-')[1]) : -1;
          
          // Get actual text values
          const leftItemText = leftIndex >= 0 && leftIndex < leftItems.length ? leftItems[leftIndex] : leftId;
          const rightItemText = rightIndex >= 0 && rightIndex < rightItems.length ? rightItems[rightIndex] : rightId;
          
          // Check if this match exists in the correct matches
          if (question.correctMatches && question.correctMatches[leftItemText] === rightItemText) {
            correctMatches++;
            console.log(`  Match correct: ${leftItemText} -> ${rightItemText}`);
          } else {
            console.log(`  Match incorrect: ${leftItemText} -> ${rightItemText}, expected: ${question.correctMatches?.[leftItemText]}`);
          }
        });
        
        // Calculate points based on correct matches
        if (totalMatches > 0) {
          const matchPercentage = correctMatches / totalMatches;
          earnedPoints += Math.round((question.points || 0) * matchPercentage);
          console.log(`  Matching points: ${correctMatches}/${totalMatches} = ${matchPercentage}, earned: ${Math.round((question.points || 0) * matchPercentage)}`);
        }
      } else {
        console.log(`  Invalid matching answer format: ${JSON.stringify(answer.answer)}`);
      }
    }
    // Grade short-answer/text questions with AI grading
    else if (question.type === 'short-answer' || question.type === 'text') {
      if (answer.answer && typeof answer.answer === 'string' && question.correctAnswer) {
        // Use AI grading for text questions
        const pointsEarned = await simpleAIGrading(answer.answer, question.correctAnswer, question.points || 0);
        earnedPoints += pointsEarned;
        console.log(`Question ${i} (short-answer): Earned ${pointsEarned} points`);
      } else if (answer.answer && typeof answer.answer === 'string') {
        // If no correct answer provided, give full points for any response
        if (answer.answer.trim().length > 0) {
          earnedPoints += question.points || 0;
          console.log(`Question ${i} (short-answer): Full points for response`);
        }
      }
    }
    // Grade true-false questions
    else if (question.type === 'true-false') {
      if (answer.answer === question.correctAnswer) {
        earnedPoints += question.points || 0;
        console.log(`Question ${i} (true-false): ${answer.answer === question.correctAnswer ? 'Correct' : 'Incorrect'}`);
      }
    }
    // Grade fill-in-blank questions
    else if (question.type === 'fill-in-blank') {
      const correctAnswers = Array.isArray(question.correctAnswer) ? question.correctAnswer : [question.correctAnswer];
      const userAnswer = answer.answer?.toLowerCase().trim();
      
      if (userAnswer && correctAnswers.some((correct: string) => 
        question.caseSensitive ? correct === userAnswer : correct.toLowerCase() === userAnswer
      )) {
        earnedPoints += question.points || 0;
        console.log(`Question ${i} (fill-in-blank): Correct`);
      } else {
        console.log(`Question ${i} (fill-in-blank): Incorrect`);
      }
    }
    // Grade ordering questions
    else if (question.type === 'ordering') {
      const correctOrder = Array.isArray(question.correctAnswer) ? question.correctAnswer : [];
      const userOrder = Array.isArray(answer.answer) ? answer.answer : [];
      
      if (userOrder.length === correctOrder.length) {
        let correctPositions = 0;
        for (let j = 0; j < correctOrder.length; j++) {
          if (userOrder[j] === correctOrder[j]) {
            correctPositions++;
          }
        }
        
        const positionPercentage = correctPositions / correctOrder.length;
        earnedPoints += Math.round((question.points || 0) * positionPercentage);
        console.log(`Question ${i} (ordering): ${correctPositions}/${correctOrder.length} correct`);
      }
    }
  }

  const finalGrade = totalScore > 0 ? Math.round((earnedPoints / totalScore) * 100) : 0;
  console.log(`Auto-grade calculation: earnedPoints=${earnedPoints}, totalScore=${totalScore}, finalGrade=${finalGrade}`);
  return finalGrade;
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

// Update homework
export const updateHomework = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Find assignment by ID
    const homework = await Assignment.findById(id);
    
    if (!homework) {
      return res.status(404).json({
        success: false,
        message: 'Homework not found'
      });
    }
    
    // Check if user is the instructor of this homework
    if (homework.instructor.toString() !== (req as any).user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this homework'
      });
    }
    
    // Update assignment in database
    const updatedHomework = await Assignment.findByIdAndUpdate(
      id,
      {
        ...req.body,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: updatedHomework,
      message: 'Homework updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating homework:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update homework'
    });
  }
});

// Get all homework
export const getAllHomework = asyncHandler(async (req: Request, res: Response) => {
  try {
    // Get query parameters for filtering
    const { level, language } = req.query;
    
    // Build query object
    const query: any = { status: 'published' };
    
    // Add level filter if provided
    if (level && level !== '') {
      query.level = level;
    }
    
    // Add language filter if provided
    if (language && language !== '') {
      query.language = language;
    }
    
    // Fetch published assignments from database with filters
    const homework = await Assignment.find(query)
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
    const submissionData: any = {
      assignment: homeworkId,
      student: (req as any).user._id, // Assuming user is attached to request
      extractedAnswers: answers,
      isDraft: isDraft || false,
      submittedAt: isDraft ? undefined : new Date(),
      status: isDraft ? 'draft' : 'submitted'
    };
    
    // Auto-grade submission if not a draft and auto-grading is enabled
    if (!isDraft && assignment.autoGrading) {
      const autoGrade = await autoGradeSubmission(assignment, { extractedAnswers: answers });
      submissionData.autoGrade = autoGrade;
      submissionData.gradedAt = new Date();
      submissionData.status = 'graded';
      console.log(`Auto-graded submission: autoGrade=${autoGrade}`);
    }
    
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
    
    console.log(`Saved submission: ${JSON.stringify(submission)}`);

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

// Get homework submission details by submission ID
export const getHomeworkSubmissionById = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { submissionId } = req.params;
    
    // Fetch submission from database with populated assignment and student details
    const submission = await AssignmentSubmission.findById(submissionId)
      .populate('assignment', 'title extractedQuestions')
      .populate('student', 'firstName lastName email');
    
    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }
    
    // Check permissions - only the student who submitted or the teacher can view
    const userId = (req as any).user._id;
    const userRole = (req as any).user.role;
    
    const isStudentOwner = userRole === 'student' && submission.student._id.toString() === userId;
    const isTeacher = userRole === 'teacher' && submission.assignment.instructor.toString() === userId;
    
    if (!isStudentOwner && !isTeacher) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this submission'
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
    
    if (level && level !== '') {
      query.level = level;
    }
    
    if (language && language !== '') {
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