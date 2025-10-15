import { Request, Response, NextFunction } from 'express';
import { Assessment } from '../models/Assessment';
import { AssessmentSubmission, SubmissionStatus } from '../models/AssessmentSubmission';
import { Course } from '../models/Course';
import { aiService } from '../services/aiService';
import mongoose from 'mongoose';

// Helper function to organize extracted questions into proper format
function organizeExtractedQuestions(extractedQuestions: any[]): any[] {
  console.log('🔧 Organizing extracted questions...');
  
  // Convert extracted questions to assessment question format
  const organized = extractedQuestions.map((eq, index) => ({
    id: eq.id || `q_${index}`,
    question: eq.question,
    type: eq.type,
    options: eq.options || [],
    correctAnswer: eq.correctAnswer,
    points: eq.points || 10,
    section: eq.section || 'A',
    difficulty: eq.difficulty || 'medium'
  }));

  // Sort by section first, then by difficulty (easy -> medium -> hard)
  organized.sort((a, b) => {
    // First sort by section
    if (a.section !== b.section) {
      return a.section.localeCompare(b.section);
    }
    
    // Then sort by difficulty within section
    const difficultyOrder = { easy: 1, medium: 2, hard: 3 };
    const aOrder = difficultyOrder[a.difficulty as keyof typeof difficultyOrder] || 2;
    const bOrder = difficultyOrder[b.difficulty as keyof typeof difficultyOrder] || 2;
    
    return aOrder - bOrder;
  });

  console.log(`✅ Organized ${organized.length} questions by section and difficulty`);
  organized.forEach((q, index) => {
    console.log(`  ${index + 1}. Section ${q.section} (${q.difficulty}): ${q.question.substring(0, 50)}...`);
  });
  
  return organized;
}

// Get available assessments for student
export const getStudentAssessments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const studentId = req.user?.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const type = req.query.type as string;
    const courseId = req.query.courseId as string;
    const status = req.query.status as string;

    // Get enrolled courses using UserProgress
    const { UserProgress } = await import('../models/UserProgress');
    const enrollments = await UserProgress.find({ user: studentId }).select('course');
    const courseIds = enrollments.map(enrollment => enrollment.course);
    
    console.log('🔍 Student assessments debug:', {
      studentId,
      enrollmentsCount: enrollments.length,
      courseIds: courseIds.map(id => id.toString()),
      status: status,
      requestedStatus: req.query.status
    });

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

    console.log('🔍 Final filter:', filter);

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

    console.log('📊 Assessment query results:', {
      found: assessments.length,
      total,
      assessmentTitles: assessments.map(a => a.title)
    });

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

    // Check if student is enrolled in the course using UserProgress
    const { UserProgress } = await import('../models/UserProgress');
    const enrollment = await UserProgress.findOne({
      user: studentId,
      course: assessment.course._id
    });
    
    console.log('🔍 Enrollment check:', {
      studentId,
      courseId: assessment.course._id,
      enrollment: enrollment ? 'Found' : 'Not found'
    });
    
    if (!enrollment) {
      res.status(403).json({
        success: false,
        error: 'You are not enrolled in this course'
      });
      return;
    }
    
    const course = await Course.findById(assessment.course._id);
    if (!course) {
      res.status(404).json({
        success: false,
        error: 'Course not found'
      });
      return;
    }

    // Check if assessment is available
    console.log('🔍 Assessment availability check:', {
      id: assessment._id,
      title: assessment.title,
      isPublished: assessment.isPublished,
      status: assessment.status,
      scheduledDate: assessment.scheduledDate,
      dueDate: assessment.dueDate,
      isAvailable: assessment.isAvailable()
    });
    
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

    // Prepare questions from either manual questions or AI-extracted questions
    let questions = [];
    
    // If assessment has extractedQuestions from AI, use those and organize them
    if (assessment.extractedQuestions && assessment.extractedQuestions.length > 0) {
      console.log(`📚 Using ${assessment.extractedQuestions.length} AI-extracted questions`);
      
      // Convert extractedQuestions to proper question format and organize them
      questions = organizeExtractedQuestions(assessment.extractedQuestions);
      
    } else if (assessment.questions && assessment.questions.length > 0) {
      console.log(`📚 Using ${assessment.questions.length} manual questions`);
      questions = [...assessment.questions];
    } else {
      console.warn('⚠️ Assessment has no questions available');
      res.status(400).json({
        success: false,
        error: 'Assessment has no questions available'
      });
      return;
    }
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
      difficulty: q.difficulty,
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

    console.log(`🔄 Saving assessment progress for submission: ${submissionId}, student: ${studentId}`);
    console.log(`📝 Progress data - Answers: ${answers?.length}, Time spent: ${timeSpent}`);

    if (!studentId) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
      return;
    }

    if (!submissionId) {
      res.status(400).json({
        success: false,
        error: 'Submission ID is required'
      });
      return;
    }

    const submission = await AssessmentSubmission.findOne({
      _id: submissionId,
      student: studentId,
      status: SubmissionStatus.DRAFT
    });

    if (!submission) {
      console.log(`❌ Submission not found or not in draft status - ID: ${submissionId}, Student: ${studentId}`);
      
      // Check if submission exists but belongs to different student
      const existingSubmission = await AssessmentSubmission.findOne({ _id: submissionId });
      if (existingSubmission) {
        if (existingSubmission.student.toString() !== studentId) {
          res.status(403).json({
            success: false,
            error: 'Access denied - submission belongs to another student'
          });
          return;
        } else if (existingSubmission.status !== SubmissionStatus.DRAFT) {
          res.status(409).json({
            success: false,
            error: `Cannot save progress - submission status is ${existingSubmission.status}`
          });
          return;
        }
      }
      
      res.status(404).json({
        success: false,
        error: 'Assessment submission not found'
      });
      return;
    }

    // Update answers and time spent
    submission.answers = answers || submission.answers || [];
    submission.timeSpent = timeSpent || submission.timeSpent || 0;
    await submission.save();

    console.log(`✅ Assessment progress saved successfully - Submission: ${submissionId}`);

    res.status(200).json({
      success: true,
      message: 'Progress saved successfully',
      data: {
        submissionId: submission._id,
        answersCount: submission.answers?.length || 0,
        timeSpent: submission.timeSpent
      }
    });
  } catch (error: any) {
    console.error('❌ Error saving assessment progress:', error);
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

// Get student's attempts for a specific course
export const getStudentCourseAttempts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { courseId } = req.params;
    const studentId = req.user?.id;

    // Verify course exists and student is enrolled
    const course = await Course.findById(courseId);
    if (!course) {
      res.status(404).json({
        success: false,
        error: 'Course not found'
      });
      return;
    }

    // Check if student is enrolled in the course using UserProgress
    const { UserProgress } = await import('../models/UserProgress');
    const enrollment = await UserProgress.findOne({
      user: studentId,
      course: courseId
    });
    
    if (!enrollment) {
      res.status(403).json({
        success: false,
        error: 'You are not enrolled in this course'
      });
      return;
    }

    // Get all assessment submissions for this student in this course
    const attempts = await AssessmentSubmission.find({ 
      student: studentId,
      course: courseId 
    })
    .populate('assessment', 'title type totalPoints passingScore')
    .populate('course', 'title')
    .sort({ submittedAt: -1 });

    res.status(200).json({
      success: true,
      data: { attempts }
    });
  } catch (error) {
    next(error);
  }
};

// Submit assessment directly (creates submission and submits in one step)
export const submitAssessmentDirect = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id: assessmentId } = req.params;
    const { answers, timeSpent } = req.body;
    const studentId = req.user?.id;

    console.log('🎯 Direct assessment submission:', {
      assessmentId,
      studentId,
      answersCount: answers?.length,
      timeSpent
    });

    // Get assessment with questions
    const assessment = await Assessment.findById(assessmentId)
      .populate('course', 'title instructor');

    if (!assessment) {
      res.status(404).json({
        success: false,
        error: 'Assessment not found'
      });
      return;
    }

    // Check if assessment is published
    console.log('📋 Assessment status check:', {
      isPublished: assessment.isPublished,
      status: assessment.status,
      title: assessment.title
    });
    
    if (!assessment.isPublished || assessment.status !== 'published') {
      console.log('❌ Assessment not available for submission');
      res.status(403).json({
        success: false,
        error: 'Assessment is not available for submission'
      });
      return;
    }

    // Check if student is enrolled in the course
    const { UserProgress } = await import('../models/UserProgress');
    const enrollment = await UserProgress.findOne({
      user: studentId,
      course: assessment.course._id
    });

    console.log('👤 Enrollment check:', {
      studentId,
      courseId: assessment.course._id,
      enrollmentFound: !!enrollment
    });

    if (!enrollment) {
      console.log('❌ Student not enrolled in course');
      res.status(403).json({
        success: false,
        error: 'You are not enrolled in this course'
      });
      return;
    }

    // Check if due date has passed
    console.log('📅 Due date check:', {
      dueDate: assessment.dueDate,
      currentDate: new Date(),
      isPastDue: assessment.dueDate && new Date() > assessment.dueDate
    });
    
    if (assessment.dueDate && new Date() > assessment.dueDate) {
      console.log('❌ Assessment deadline has passed');
      res.status(403).json({
        success: false,
        error: 'Assessment submission deadline has passed'
      });
      return;
    }

    // Check existing attempts
    const existingAttempts = await AssessmentSubmission.countDocuments({
      assessment: assessmentId,
      student: studentId,
      status: { $in: [SubmissionStatus.SUBMITTED, SubmissionStatus.GRADED] }
    });

    console.log('🔄 Attempts check:', {
      maxAttempts: assessment.attempts,
      existingAttempts,
      canSubmit: !assessment.attempts || existingAttempts < assessment.attempts
    });

    if (assessment.attempts && existingAttempts >= assessment.attempts) {
      console.log('❌ Maximum attempts exceeded');
      res.status(403).json({
        success: false,
        error: `Maximum attempts (${assessment.attempts}) exceeded`
      });
      return;
    }

    // Create new submission
    const submission = new AssessmentSubmission({
      assessment: assessmentId,
      student: studentId,
      course: assessment.course._id,
      answers: [], // Will be populated after grading
      timeSpent: timeSpent || 0,
      status: SubmissionStatus.SUBMITTED,
      submittedAt: new Date(),
      attemptNumber: existingAttempts + 1
    });

    // Auto-grade the submission using AI
    console.log('🤖 Starting AI grading process...');
    
    let totalScore = 0;
    let maxScore = 0;
    const gradedAnswers = [];

    for (let i = 0; i < assessment.questions.length; i++) {
      const question = assessment.questions[i];
      const studentAnswer = answers?.find((a: any) => a.questionId === question._id.toString()) || 
                           answers?.[i]; // Fallback to index-based matching

      maxScore += question.points || 1;

      if (!studentAnswer || !studentAnswer.answer || studentAnswer.answer.toString().trim() === '') {
        // No answer provided or empty answer
        gradedAnswers.push({
          questionId: question._id,
          answer: '',
          isCorrect: false,
          pointsEarned: 0,
          feedback: 'No answer provided',
          timeSpent: studentAnswer?.timeSpent || 0
        });
        continue;
      }

      let isCorrect = false;
      let score = 0;
      let feedback = '';

      try {
        if (question.type === 'multiple-choice' || question.type === 'true-false') {
          // Objective questions - direct comparison
          isCorrect = studentAnswer.answer === question.correctAnswer;
          score = isCorrect ? (question.points || 1) : 0;
          feedback = isCorrect ? 'Correct!' : `Incorrect. The correct answer is: ${question.correctAnswer}`;
        } else {
          // Subjective questions - AI grading
          const aiGradingResult = await aiService.gradeAnswer({
            question: question.question,
            correctAnswer: question.correctAnswer || question.explanation || '',
            studentAnswer: studentAnswer.answer || studentAnswer.text || '',
            maxPoints: question.points || 1,
            rubric: question.rubric || ''
          });

          score = aiGradingResult.score;
          feedback = aiGradingResult.feedback;
          isCorrect = score >= (question.points || 1) * 0.7; // 70% threshold for "correct"
        }
      } catch (aiError) {
        console.error('AI grading error:', aiError);
        // Fallback grading
        if (question.type === 'multiple-choice' || question.type === 'true-false') {
          isCorrect = studentAnswer.answer === question.correctAnswer;
          score = isCorrect ? (question.points || 1) : 0;
          feedback = isCorrect ? 'Correct!' : 'Incorrect';
        } else {
          // For subjective questions, give partial credit if answer exists
          score = studentAnswer.answer ? (question.points || 1) * 0.5 : 0;
          feedback = 'Answer submitted - manual review may be required';
          isCorrect = score > 0;
        }
      }

      totalScore += score;
      gradedAnswers.push({
        questionId: question._id,
        answer: studentAnswer.answer || studentAnswer.text || '',
        isCorrect,
        pointsEarned: score,
        feedback,
        timeSpent: studentAnswer.timeSpent || 0
      });
    }

    // Calculate percentage and determine pass/fail
    const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
    const passed = percentage >= (assessment.passingScore || 60);

    // Update submission with grading results
    submission.score = totalScore;
    submission.percentage = percentage;
    submission.status = SubmissionStatus.GRADED;
    submission.gradedAt = new Date();
    submission.gradedBy = null; // AI grading - no specific user
    submission.aiGraded = true;
    submission.answers = gradedAnswers;

    // Generate overall feedback
    let overallFeedback = `You scored ${totalScore}/${maxScore} (${percentage.toFixed(1)}%). `;
    if (passed) {
      overallFeedback += '🎉 Congratulations! You passed this assessment.';
    } else {
      overallFeedback += `You need ${assessment.passingScore || 60}% to pass. Keep studying and try again!`;
    }
    submission.feedback = overallFeedback;

    await submission.save();

    console.log('✅ Assessment graded successfully:', {
      submissionId: submission._id,
      score: `${totalScore}/${maxScore}`,
      percentage: `${percentage.toFixed(1)}%`,
      passed
    });

    // Update user progress
    try {
      const progress = await UserProgress.findOne({
        user: studentId,
        course: assessment.course._id
      });

      if (progress) {
        // Update basic progress fields
        progress.lastAccessed = new Date();
        progress.lastActivityDate = new Date();
        progress.totalTimeSpent += timeSpent || 0;

        // Add points based on score
        if (passed) {
          progress.totalPoints += totalScore;
        }

        // Update streak if this is a new day
        const today = new Date().toDateString();
        const lastActivity = progress.lastActivityDate.toDateString();
        if (today !== lastActivity) {
          progress.streakDays += 1;
        }

        await progress.save();
        console.log('✅ User progress updated successfully');
      } else {
        // Create new progress record if it doesn't exist
        const newProgress = new UserProgress({
          user: studentId,
          course: assessment.course._id,
          completedLessons: [],
          completedQuizzes: [],
          totalTimeSpent: timeSpent || 0,
          progressPercentage: 0,
          lastAccessed: new Date(),
          badges: [],
          totalPoints: passed ? totalScore : 0,
          streakDays: 1,
          lastActivityDate: new Date(),
          enrollmentDate: new Date(),
          isCompleted: false,
          certificateIssued: false
        });
        
        await newProgress.save();
        console.log('✅ New user progress created successfully');
      }
    } catch (progressError) {
      console.error('Error updating user progress:', progressError);
      // Don't fail the submission if progress update fails
    }

    res.status(200).json({
      success: true,
      data: {
        submission: {
          _id: submission._id,
          score: totalScore,
          maxScore: maxScore,
          percentage: percentage,
          passed: passed,
          status: submission.status,
          feedback: submission.feedback,
          submittedAt: submission.submittedAt,
          gradedAt: submission.gradedAt,
          answers: gradedAnswers
        }
      },
      message: `Assessment submitted and graded! Score: ${totalScore}/${maxScore} (${percentage.toFixed(1)}%)`
    });

  } catch (error) {
    console.error('Error in submitAssessmentDirect:', error);
    next(error);
  }
};

// Get assessment result for a student
export const getAssessmentResult = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id: assessmentId } = req.params;
    const studentId = req.user?.id;

    if (!studentId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    // Find the most recent submission for this assessment by this student
    const submission = await AssessmentSubmission.findOne({
      assessment: assessmentId,
      student: studentId,
      status: { $in: ['submitted', 'graded'] } // Include both submitted and graded submissions
    })
    .populate('assessment', 'title type totalPoints passingScore timeLimit')
    .sort({ submittedAt: -1 }); // Get the most recent submission

    if (!submission) {
      res.status(404).json({
        success: false,
        message: 'No completed assessment submission found'
      });
      return;
    }

    // Calculate results
    const totalScore = submission.answers.reduce((sum, answer) => sum + (answer.pointsEarned || 0), 0);
    const maxScore = submission.assessment.totalPoints || submission.answers.reduce((sum, answer) => sum + (answer.pointsEarned || 0), 0);
    const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
    const passed = percentage >= (submission.assessment.passingScore || 60);

    res.status(200).json({
      success: true,
      data: {
        assessment: {
          _id: submission.assessment._id,
          title: submission.assessment.title,
          type: submission.assessment.type,
          totalPoints: submission.assessment.totalPoints,
          passingScore: submission.assessment.passingScore,
          timeLimit: submission.assessment.timeLimit
        },
        result: {
          submissionId: submission._id,
          score: totalScore,
          maxScore: maxScore,
          percentage: Math.round(percentage * 10) / 10, // Round to 1 decimal place
          passed: passed,
          status: submission.status,
          submittedAt: submission.submittedAt,
          gradedAt: submission.gradedAt,
          gradedBy: submission.gradedBy,
          feedback: submission.feedback,
          timeSpent: submission.timeSpent,
          answers: submission.answers.map(answer => ({
            questionId: answer.questionId,
            answer: answer.answer,
            isCorrect: answer.isCorrect,
            pointsEarned: answer.pointsEarned,
            feedback: answer.feedback,
            timeSpent: answer.timeSpent
          }))
        }
      }
    });

  } catch (error) {
    console.error('Error in getAssessmentResult:', error);
    next(error);
  }
};

export default {
  getStudentAssessments,
  startAssessment,
  saveAssessmentProgress,
  submitAssessment,
  submitAssessmentDirect,
  getStudentSubmissions,
  getSubmissionDetails,
  getStudentCourseAttempts,
  getAssessmentResult
};
