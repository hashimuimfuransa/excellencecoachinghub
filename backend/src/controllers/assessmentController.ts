import { Request, Response, NextFunction } from 'express';
import { Assessment, IAssessmentDocument, QuestionType, AssessmentType } from '../models/Assessment';
import { AssessmentSubmission, IAssessmentSubmissionDocument, SubmissionStatus } from '../models/AssessmentSubmission';
import { Course } from '../models/Course';
import { User } from '../models/User';
import { validationResult } from 'express-validator';
import { aiService } from '../services/aiService';
import { uploadFile } from '../utils/fileUpload';
import DocumentParser from '../utils/documentParser';

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
        firstName: string;
        lastName: string;
      };
    }
  }
}

// Create a new assessment (Teacher only)
export const createAssessment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
      return;
    }

    const teacherId = req.user?.id;
    const {
      title,
      description,
      courseId,
      course,
      type,
      questions,
      timeLimit,
      attempts,
      dueDate,
      availableFrom,
      availableUntil,
      instructions,
      allowLateSubmission,
      lateSubmissionPenalty,
      randomizeQuestions,
      randomizeOptions,
      showResultsImmediately,
      showCorrectAnswers,
      requireProctoring,
      passingScore,
      gradingRubric,
      attachments,
      totalPoints
    } = req.body;

    // Handle both courseId and course fields
    const finalCourseId = courseId || course;

    // Verify course exists and teacher has access
    const courseDoc = await Course.findById(finalCourseId);
    if (!courseDoc) {
      res.status(404).json({
        success: false,
        error: 'Course not found'
      });
      return;
    }

    if (courseDoc.instructor.toString() !== teacherId) {
      res.status(403).json({
        success: false,
        error: 'You do not have permission to create assessments for this course'
      });
      return;
    }

    // Handle document upload and extraction
    let extractedQuestions: any[] = [];
    let documentUrl: string | undefined;
    let documentType: string | undefined;

    if (req.file) {
      try {
        // Upload document to cloud storage
        const uploadResult = await uploadFile(req.file, 'assessments');
        documentUrl = uploadResult.url;
        documentType = req.file.mimetype.includes('pdf') ? 'pdf' : 
                      req.file.mimetype.includes('word') ? 'docx' : 'txt';

        // Parse document content
        const parseResult = await DocumentParser.parseDocument(
          req.file.buffer,
          req.file.mimetype,
          req.file.originalname
        );

        // Validate document
        const validation = DocumentParser.validateDocument(parseResult);
        if (!validation.isValid) {
          res.status(400).json({
            success: false,
            error: 'Invalid document',
            details: validation.errors
          });
          return;
        }

        // Extract questions using AI
        const cleanedText = DocumentParser.cleanText(parseResult.text);
        extractedQuestions = await aiService.extractQuestionsFromDocument(cleanedText, type as any);

        // Add unique IDs to extracted questions
        extractedQuestions = extractedQuestions.map((q, index) => ({
          ...q,
          id: `extracted_${Date.now()}_${index}`
        }));

      } catch (error) {
        console.error('Document processing error:', error);
        res.status(400).json({
          success: false,
          error: 'Failed to process uploaded document',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
        return;
      }
    }

    // Merge extracted questions with provided questions
    const allQuestions = [...(questions || []), ...extractedQuestions];
    
    // Calculate total points if not provided
    const calculatedTotalPoints = totalPoints || 
      allQuestions.reduce((sum, q) => sum + (q.points || 10), 0) || 
      100; // Default to 100 if no questions

    // Create assessment
    const assessment = new Assessment({
      title,
      description,
      course: finalCourseId,
      instructor: teacherId,
      type,
      questions: allQuestions,
      timeLimit,
      attempts: attempts || 1,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      availableFrom: availableFrom ? new Date(availableFrom) : undefined,
      availableUntil: availableUntil ? new Date(availableUntil) : undefined,
      instructions,
      allowLateSubmission: allowLateSubmission || false,
      lateSubmissionPenalty,
      randomizeQuestions: randomizeQuestions || false,
      randomizeOptions: randomizeOptions || false,
      showResultsImmediately: showResultsImmediately !== false,
      showCorrectAnswers: showCorrectAnswers !== false,
      requireProctoring: requireProctoring || false,
      passingScore: passingScore || 70,
      totalPoints: calculatedTotalPoints,
      gradingRubric,
      attachments: attachments || [],
      // Add document fields if document was uploaded
      ...(documentUrl && { documentUrl }),
      ...(documentType && { documentType }),
      ...(extractedQuestions.length > 0 && { extractedQuestions })
    });

    await assessment.save();

    // Populate response
    await assessment.populate('course', 'title');
    await assessment.populate('instructor', 'firstName lastName');

    res.status(201).json({
      success: true,
      data: { 
        assessment,
        extractedQuestions: extractedQuestions.length,
        documentProcessed: !!req.file
      },
      message: `Assessment created successfully${extractedQuestions.length > 0 ? ` with ${extractedQuestions.length} questions extracted from document` : ''}`
    });
  } catch (error) {
    next(error);
  }
};

// Get teacher's assessments
export const getTeacherAssessments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const teacherId = req.user?.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const type = req.query.type as string;
    const courseId = req.query.courseId as string;

    // Build filter
    const filter: any = { instructor: teacherId };
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
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Assessment.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      data: {
        assessments,
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

// Get all assessments (Admin only)
export const getAllAssessments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const type = req.query.type as string;
    const courseId = req.query.courseId as string;
    const status = req.query.status as string;

    // Build filter
    const filter: any = {};
    if (type && type !== 'all') {
      filter.type = type;
    }
    if (courseId) {
      filter.course = courseId;
    }
    if (status && status !== 'all') {
      filter.status = status;
    }

    const skip = (page - 1) * limit;

    const [assessments, total] = await Promise.all([
      Assessment.find(filter)
        .populate('course', 'title')
        .populate('instructor', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Assessment.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      data: {
        assessments,
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

// Get assessment by ID
export const getAssessmentById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    const assessment = await Assessment.findById(id)
      .populate('course', 'title')
      .populate('instructor', 'firstName lastName');

    if (!assessment) {
      res.status(404).json({
        success: false,
        error: 'Assessment not found'
      });
      return;
    }

    // Check permissions
    const instructorId = typeof assessment.instructor === 'object'
      ? assessment.instructor._id.toString()
      : assessment.instructor.toString();

    if (userRole === 'teacher' && instructorId !== userId) {
      res.status(403).json({
        success: false,
        error: 'You do not have permission to view this assessment'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: { assessment }
    });
  } catch (error) {
    next(error);
  }
};

// Update assessment
export const updateAssessment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const teacherId = req.user?.id;
    const updates = req.body;

    const assessment = await Assessment.findOne({ _id: id, instructor: teacherId });
    if (!assessment) {
      res.status(404).json({
        success: false,
        error: 'Assessment not found or you do not have permission to update it'
      });
      return;
    }

    // Check if assessment has submissions
    const hasSubmissions = await AssessmentSubmission.exists({ assessment: id });
    if (hasSubmissions && updates.questions) {
      res.status(400).json({
        success: false,
        error: 'Cannot modify questions after students have submitted'
      });
      return;
    }

    // Update allowed fields
    const allowedUpdates = [
      'title', 'description', 'timeLimit', 'attempts', 'dueDate',
      'availableFrom', 'availableUntil', 'instructions', 'allowLateSubmission',
      'lateSubmissionPenalty', 'randomizeQuestions', 'randomizeOptions',
      'showResultsImmediately', 'showCorrectAnswers', 'requireProctoring',
      'passingScore', 'gradingRubric', 'attachments', 'questions'
    ];

    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        if (field === 'dueDate' || field === 'availableFrom' || field === 'availableUntil') {
          (assessment as any)[field] = updates[field] ? new Date(updates[field]) : undefined;
        } else {
          (assessment as any)[field] = updates[field];
        }
      }
    });

    await assessment.save();

    res.status(200).json({
      success: true,
      data: { assessment },
      message: 'Assessment updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Delete assessment
export const deleteAssessment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const teacherId = req.user?.id;

    const assessment = await Assessment.findOne({ _id: id, instructor: teacherId });
    if (!assessment) {
      res.status(404).json({
        success: false,
        error: 'Assessment not found or you do not have permission to delete it'
      });
      return;
    }

    // Check if assessment has submissions
    const hasSubmissions = await AssessmentSubmission.exists({ assessment: id });
    if (hasSubmissions) {
      res.status(400).json({
        success: false,
        error: 'Cannot delete assessment with existing submissions'
      });
      return;
    }

    await Assessment.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Assessment deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Publish/unpublish assessment
export const togglePublishAssessment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const teacherId = req.user?.id;

    const assessment = await Assessment.findOne({ _id: id, instructor: teacherId });
    if (!assessment) {
      res.status(404).json({
        success: false,
        error: 'Assessment not found or you do not have permission to modify it'
      });
      return;
    }

    assessment.isPublished = !assessment.isPublished;
    assessment.status = assessment.isPublished ? 'published' : 'draft';
    await assessment.save();

    res.status(200).json({
      success: true,
      data: { assessment },
      message: `Assessment ${assessment.isPublished ? 'published' : 'unpublished'} successfully`
    });
  } catch (error) {
    next(error);
  }
};

// Add questions from document to existing assessment
export const addQuestionsFromDocument = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const teacherId = req.user?.id;

    // Find the assessment and verify ownership
    const assessment = await Assessment.findOne({ _id: id, instructor: teacherId });
    if (!assessment) {
      res.status(404).json({
        success: false,
        error: 'Assessment not found or you do not have permission to modify it'
      });
      return;
    }

    // Check if assessment has submissions
    const hasSubmissions = await AssessmentSubmission.exists({ assessment: id });
    if (hasSubmissions) {
      res.status(400).json({
        success: false,
        error: 'Cannot add questions to assessment with existing submissions'
      });
      return;
    }

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    
    if (!files || !files.document || files.document.length === 0) {
      res.status(400).json({
        success: false,
        error: 'No exam document uploaded'
      });
      return;
    }

    const examFile = files.document[0];
    const answerSheetFile = files.answerSheet ? files.answerSheet[0] : null;

    try {
      // Parse exam document content
      const parseResult = await DocumentParser.parseDocument(
        examFile.buffer,
        examFile.mimetype,
        examFile.originalname
      );

      // Parse answer sheet if provided
      let answerSheetContent = '';
      if (answerSheetFile) {
        const answerSheetResult = await DocumentParser.parseDocument(
          answerSheetFile.buffer,
          answerSheetFile.mimetype,
          answerSheetFile.originalname
        );
        answerSheetContent = answerSheetResult.content;
      }

      // Validate document
      const validation = DocumentParser.validateDocument(parseResult);
      if (!validation.isValid) {
        res.status(400).json({
          success: false,
          error: 'Invalid document',
          details: validation.errors
        });
        return;
      }

      // Extract questions using AI
      const cleanedText = DocumentParser.cleanText(parseResult.text);
      const extractedQuestions = await aiService.extractQuestionsFromDocument(
        cleanedText, 
        assessment.type as any,
        answerSheetContent // Pass answer sheet content for reference
      );

      // Add unique IDs to extracted questions
      const questionsWithIds = extractedQuestions.map((q, index) => ({
        ...q,
        id: `extracted_${Date.now()}_${index}`
      }));

      // Add extracted questions to existing questions
      const updatedQuestions = [...assessment.questions, ...questionsWithIds];
      
      // Recalculate total points
      const newTotalPoints = updatedQuestions.reduce((sum, q) => sum + (q.points || 10), 0);

      // Update assessment
      assessment.questions = updatedQuestions;
      assessment.totalPoints = newTotalPoints;
      await assessment.save();

      // Populate response
      await assessment.populate('course', 'title');
      await assessment.populate('instructor', 'firstName lastName');

      res.status(200).json({
        success: true,
        data: { 
          assessment,
          addedQuestions: questionsWithIds.length,
          totalQuestions: updatedQuestions.length
        },
        message: `Successfully added ${questionsWithIds.length} questions from document`
      });

    } catch (error) {
      console.error('Document processing error:', error);
      res.status(400).json({
        success: false,
        error: 'Failed to process uploaded document',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
      return;
    }
  } catch (error) {
    next(error);
  }
};

// Replace questions from document in existing assessment (removes old document-extracted questions)
export const replaceQuestionsFromDocument = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const teacherId = req.user?.id;

    // Find the assessment and verify ownership
    const assessment = await Assessment.findOne({ _id: id, instructor: teacherId });
    if (!assessment) {
      res.status(404).json({
        success: false,
        error: 'Assessment not found or you do not have permission to modify it'
      });
      return;
    }

    // Check if assessment has submissions
    const hasSubmissions = await AssessmentSubmission.exists({ assessment: id });
    if (hasSubmissions) {
      res.status(400).json({
        success: false,
        error: 'Cannot replace questions in assessment with existing submissions'
      });
      return;
    }

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    
    if (!files || !files.document || files.document.length === 0) {
      res.status(400).json({
        success: false,
        error: 'No exam document uploaded'
      });
      return;
    }

    const examFile = files.document[0];
    const answerSheetFile = files.answerSheet ? files.answerSheet[0] : null;

    try {
      // Parse exam document content
      const parseResult = await DocumentParser.parseDocument(
        examFile.buffer,
        examFile.mimetype,
        examFile.originalname
      );

      // Parse answer sheet if provided
      let answerSheetContent = '';
      if (answerSheetFile) {
        const answerSheetResult = await DocumentParser.parseDocument(
          answerSheetFile.buffer,
          answerSheetFile.mimetype,
          answerSheetFile.originalname
        );
        answerSheetContent = answerSheetResult.content;
      }

      // Validate document
      const validation = DocumentParser.validateDocument(parseResult);
      if (!validation.isValid) {
        res.status(400).json({
          success: false,
          error: 'Invalid document',
          details: validation.errors
        });
        return;
      }

      // Extract questions using AI
      const cleanedText = DocumentParser.cleanText(parseResult.text);
      const extractedQuestions = await aiService.extractQuestionsFromDocument(
        cleanedText, 
        assessment.type as any,
        answerSheetContent // Pass answer sheet content for reference
      );

      // Add unique IDs to extracted questions
      const questionsWithIds = extractedQuestions.map((q, index) => ({
        ...q,
        id: `extracted_${Date.now()}_${index}`
      }));

      // Remove old document-extracted questions and keep only manually created ones
      const manualQuestions = assessment.questions.filter(q => !q.id.startsWith('extracted_'));
      
      // Replace with new extracted questions
      const updatedQuestions = [...manualQuestions, ...questionsWithIds];
      
      // Recalculate total points
      const newTotalPoints = updatedQuestions.reduce((sum, q) => sum + (q.points || 10), 0);

      // Update assessment
      assessment.questions = updatedQuestions;
      assessment.totalPoints = newTotalPoints;
      
      // Update document info
      const uploadResult = await uploadFile(examFile, 'assessments');
      assessment.documentUrl = uploadResult.url;
      assessment.documentType = examFile.mimetype.includes('pdf') ? 'pdf' : 
                               examFile.mimetype.includes('word') ? 'docx' : 'txt';
      assessment.extractedQuestions = questionsWithIds;
      
      await assessment.save();

      // Populate response
      await assessment.populate('course', 'title');
      await assessment.populate('instructor', 'firstName lastName');

      res.status(200).json({
        success: true,
        data: { 
          assessment,
          replacedQuestions: questionsWithIds.length,
          totalQuestions: updatedQuestions.length,
          removedOldQuestions: assessment.questions.length - manualQuestions.length
        },
        message: `Successfully replaced document questions with ${questionsWithIds.length} new questions`
      });

    } catch (error) {
      console.error('Document processing error:', error);
      res.status(400).json({
        success: false,
        error: 'Failed to process uploaded document',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
      return;
    }
  } catch (error) {
    next(error);
  }
};

// Get assessment submissions (Teacher only)
export const getAssessmentSubmissions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const teacherId = req.user?.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    // Verify teacher owns the assessment
    const assessment = await Assessment.findOne({ _id: id, instructor: teacherId });
    if (!assessment) {
      res.status(404).json({
        success: false,
        error: 'Assessment not found or you do not have permission to view submissions'
      });
      return;
    }

    const skip = (page - 1) * limit;

    const [submissions, total] = await Promise.all([
      AssessmentSubmission.find({ assessment: id })
        .populate('student', 'firstName lastName email')
        .sort({ submittedAt: -1 })
        .skip(skip)
        .limit(limit),
      AssessmentSubmission.countDocuments({ assessment: id })
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

// Grade assessment submission manually
export const gradeSubmission = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { submissionId } = req.params;
    const teacherId = req.user?.id;
    const { answers, feedback, score, percentage } = req.body;

    const submission = await AssessmentSubmission.findById(submissionId)
      .populate('assessment');

    if (!submission) {
      res.status(404).json({
        success: false,
        error: 'Submission not found'
      });
      return;
    }

    // Verify teacher owns the assessment
    const assessmentInstructorId = typeof submission.assessment.instructor === 'object'
      ? submission.assessment.instructor._id.toString()
      : submission.assessment.instructor.toString();

    if (assessmentInstructorId !== teacherId) {
      res.status(403).json({
        success: false,
        error: 'You do not have permission to grade this submission'
      });
      return;
    }

    // Update answers with grading information
    if (answers) {
      submission.answers = submission.answers.map(answer => {
        const gradedAnswer = answers.find((a: any) => a.questionId === answer.questionId);
        if (gradedAnswer) {
          return {
            ...answer,
            isCorrect: gradedAnswer.isCorrect,
            pointsEarned: gradedAnswer.pointsEarned,
            feedback: gradedAnswer.feedback
          };
        }
        return answer;
      });
    }

    // Set overall feedback and score
    if (feedback) submission.feedback = feedback;
    if (score !== undefined) submission.score = score;
    if (percentage !== undefined) submission.percentage = percentage;

    // Grade the submission
    await submission.gradeSubmission(teacherId, false);

    res.status(200).json({
      success: true,
      data: { submission },
      message: 'Submission graded successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Get assessments for a specific course
export const getCourseAssessments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { courseId } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    // Verify course exists
    const course = await Course.findById(courseId);
    if (!course) {
      res.status(404).json({
        success: false,
        error: 'Course not found'
      });
      return;
    }

    // Build filter based on user role
    let filter: any = { course: courseId };
    
    if (userRole === 'teacher') {
      // Teachers can only see their own assessments
      filter.instructor = userId;
    } else if (userRole === 'student') {
      // Students can only see published assessments
      filter.isPublished = true;
    }

    const assessments = await Assessment.find(filter)
      .populate('course', 'title')
      .populate('instructor', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: { assessments }
    });
  } catch (error) {
    next(error);
  }
};

export default {
  createAssessment,
  getTeacherAssessments,
  getAllAssessments,
  getAssessmentById,
  updateAssessment,
  deleteAssessment,
  togglePublishAssessment,
  getAssessmentSubmissions,
  gradeSubmission,
  getCourseAssessments
};
