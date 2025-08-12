import { Request, Response, NextFunction } from 'express';
import { Assessment } from '../models/Assessment';
import { AssessmentSubmission, SubmissionStatus } from '../models/AssessmentSubmission';
import { Course } from '../models/Course';
import { aiService } from '../services/aiService';
import mongoose from 'mongoose';

// Get available assessments for student
export const getStudentAssessments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const studentId = req.user?.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const type = req.query.type as string;
    const courseId = req.query.courseId as string;
    const status = req.query.status as string;

    // Get enrolled courses
    const enrolledCourses = await Course.find({ enrolledStudents: studentId }).select('_id');
    const courseIds = enrolledCourses.map(course => course._id);

    // Build filter
    const filter: any = { 
      course: { $in: courseIds }
    };
    
    // Handle status parameter
    if (status) {
      if (status === 'published' || status === 'available') {
        filter.isPublished = true;
        filter.status = 'published';
      } else if (status === 'draft') {
        filter.status = 'draft';
      } else if (status === 'archived') {
        filter.status = 'archived';
      }
    } else {
      // Default to published assessments
      filter.isPublished = true;
      filter.status = 'published';
    }
    
    if (type && type !== 'all') {
      filter.type = type;
    }
    if (courseId) {
      filter.course = courseId;
    }

    const skip = (page - 1) * limit;

    const [assessments, total] = await Promise.all([
      Assessment.find(filter)
        .populate('course', 'title')
        .populate('instructor', 'firstName lastName')
        .sort({ dueDate: 1 })
        .skip(skip)
        .limit(limit),
      Assessment.countDocuments(filter)
    ]);

    // Get submission status for each assessment
    const assessmentsWithStatus = await Promise.all(
      assessments.map(async (assessment) => {
        const submissions = await AssessmentSubmission.find({
          student: studentId,
          assessment: assessment._id
        }).sort({ attemptNumber: -1 });

        const latestSubmission = submissions[0];
        const attemptsUsed = submissions.filter(s => s.status !== SubmissionStatus.DRAFT).length;

        return {
          ...assessment.toObject(),
          submissionStatus: latestSubmission?.status || 'not_started',
          attemptsUsed,
          attemptsRemaining: assessment.attempts - attemptsUsed,
          latestScore: latestSubmission?.percentage,
          canAttempt: attemptsUsed < assessment.attempts && assessment.isAvailable(),
          isExpired: assessment.isExpired(),
          isAvailable: assessment.isAvailable()
        };
      })
    );

    res.status(200).json({
      success: true,
      data: {
        assessments: assessmentsWithStatus,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Start assessment attempt
export const startAssessment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const studentId = req.user?.id;

    const assessment = await Assessment.findById(id).populate('course');
    if (!assessment) {
      res.status(404).json({
        success: false,
        error: 'Assessment not found'
      });
      return;
    }

    // Check if student is enrolled in the course
    const course = await Course.findOne({ 
      _id: assessment.course._id, 
      enrolledStudents: studentId 
    });
    if (!course) {
      res.status(403).json({
        success: false,
        error: 'You are not enrolled in this course'
      });
      return;
    }

    // Check if assessment is available
    if (!assessment.isAvailable()) {
      res.status(400).json({
        success: false,
        error: 'Assessment is not currently available'
      });
      return;
    }

    // Check attempts
    const existingAttempts = await AssessmentSubmission.countDocuments({
      student: studentId,
      assessment: id,
      status: { $in: [SubmissionStatus.SUBMITTED, SubmissionStatus.GRADED] }
    });

    if (existingAttempts >= assessment.attempts) {
      res.status(400).json({
        success: false,
        error: 'Maximum attempts reached'
      });
      return;
    }

    // Check for existing draft
    let submission = await AssessmentSubmission.findOne({
      student: studentId,
      assessment: id,
      status: SubmissionStatus.DRAFT
    });

    if (!submission) {
      // Create new submission
      submission = new AssessmentSubmission({
        assessment: id,
        student: studentId,
        course: assessment.course._id,
        attemptNumber: existingAttempts + 1,
        answers: [],
        startedAt: new Date()
      });
      await submission.save();
    }

    // Prepare questions (randomize if needed)
    let questions = [...assessment.questions];
    if (assessment.randomizeQuestions) {
      questions = questions.sort(() => Math.random() - 0.5);
    }

    if (assessment.randomizeOptions) {
      questions = questions.map(q => ({
        ...q,
        options: q.options ? [...q.options].sort(() => Math.random() - 0.5) : q.options
      }));
    }

    // Remove correct answers from questions sent to student
    const studentQuestions = questions.map(q => ({
      id: q.id,
      type: q.type,
      question: q.question,
      options: q.options,
      points: q.points,
      section: q.section,
      mathEquation: q.mathEquation
    }));

    res.status(200).json({
      success: true,
      data: {
        submission: {
          _id: submission._id,
          attemptNumber: submission.attemptNumber,
          startedAt: submission.startedAt,
          timeSpent: submission.timeSpent
        },
        assessment: {
          _id: assessment._id,
          title: assessment.title,
          description: assessment.description,
          instructions: assessment.instructions,
          timeLimit: assessment.timeLimit,
          totalPoints: assessment.totalPoints,
          questions: studentQuestions
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Save assessment progress
export const saveAssessmentProgress = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { submissionId } = req.params;
    const { answers, timeSpent } = req.body;
    const studentId = req.user?.id;

    const submission = await AssessmentSubmission.findOne({
      _id: submissionId,
      student: studentId,
      status: SubmissionStatus.DRAFT
    });

    if (!submission) {
      res.status(404).json({
        success: false,
        error: 'Submission not found or already submitted'
      });
      return;
    }

    // Update answers and time spent
    submission.answers = answers;
    submission.timeSpent = timeSpent || 0;
    await submission.save();

    res.status(200).json({
      success: true,
      message: 'Progress saved successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Submit assessment
export const submitAssessment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { submissionId } = req.params;
    const { answers, timeSpent } = req.body;
    const studentId = req.user?.id;

    const submission = await AssessmentSubmission.findOne({
      _id: submissionId,
      student: studentId,
      status: SubmissionStatus.DRAFT
    }).populate('assessment');

    if (!submission) {
      res.status(404).json({
        success: false,
        error: 'Submission not found or already submitted'
      });
      return;
    }

    // Update final answers and time
    submission.answers = answers;
    submission.timeSpent = timeSpent || 0;

    // Submit the assessment
    await submission.submit();

    // Auto-grade objective questions using AI
    try {
      await aiService.gradeAssessment(submission._id.toString());
    } catch (gradeError) {
      console.error('Auto-grading failed:', gradeError);
      // Continue even if auto-grading fails
    }

    // Reload submission with updated data
    await submission.populate('assessment', 'title showResultsImmediately showCorrectAnswers');

    res.status(200).json({
      success: true,
      data: { submission },
      message: 'Assessment submitted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Get student's submissions
export const getStudentSubmissions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const studentId = req.user?.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string;

    const filter: any = { student: studentId };
    if (status && status !== 'all') {
      filter.status = status;
    }

    const skip = (page - 1) * limit;

    const [submissions, total] = await Promise.all([
      AssessmentSubmission.find(filter)
        .populate('assessment', 'title type totalPoints')
        .populate('course', 'title')
        .sort({ submittedAt: -1 })
        .skip(skip)
        .limit(limit),
      AssessmentSubmission.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      data: {
        submissions,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get submission details
export const getSubmissionDetails = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { submissionId } = req.params;
    const studentId = req.user?.id;

    const submission = await AssessmentSubmission.findOne({
      _id: submissionId,
      student: studentId
    })
    .populate('assessment')
    .populate('course', 'title');

    if (!submission) {
      res.status(404).json({
        success: false,
        error: 'Submission not found'
      });
      return;
    }

    // Only show correct answers if assessment allows it and submission is graded
    let questionsWithAnswers = submission.assessment.questions;
    if (!submission.assessment.showCorrectAnswers || submission.status !== SubmissionStatus.GRADED) {
      questionsWithAnswers = questionsWithAnswers.map(q => ({
        ...q,
        correctAnswer: undefined,
        explanation: undefined
      }));
    }

    res.status(200).json({
      success: true,
      data: {
        submission: {
          ...submission.toObject(),
          assessment: {
            ...submission.assessment.toObject(),
            questions: questionsWithAnswers
          }
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getStudentAssessments,
  startAssessment,
  saveAssessmentProgress,
  submitAssessment,
  getStudentSubmissions,
  getSubmissionDetails
};
