import { Request, Response } from 'express';
import { Assignment, AssignmentSubmission, IAssignment, IAssignmentSubmission } from '../models/Assignment';
import { Course } from '../models/Course';
import { User } from '../models/User';
import { uploadDocumentToCloudinary, deleteDocumentFromCloudinary } from '../config/cloudinary';
import { aiService } from '../services/aiService';
import { uploadFile } from '../utils/fileUpload';
import DocumentParser from '../utils/documentParser';
import mongoose from 'mongoose';

interface AuthRequest extends Request {
  user?: {
    _id: string;
    role: string;
    email: string;
  };
}

// Intelligent question organization algorithm
function organizeQuestionsIntelligently(questions: any[]): any[] {
  console.log('🧠 Applying intelligent question organization...');
  
  // Define difficulty and type priorities
  const difficultyOrder = { 'easy': 1, 'medium': 2, 'hard': 3 };
  const typeOrder = { 
    'multiple_choice': 1, 
    'numerical': 2, 
    'true_false': 3, 
    'short_answer': 4, 
    'essay': 5 
  };

  // Group questions by section/topic
  const questionsBySection = questions.reduce((acc, question) => {
    const section = question.section || 'general';
    if (!acc[section]) {
      acc[section] = [];
    }
    acc[section].push(question);
    return acc;
  }, {} as Record<string, any[]>);

  // Organize each section
  const organizedSections = Object.keys(questionsBySection).map(section => {
    const sectionQuestions = questionsBySection[section];
    
    // Sort within section: difficulty first, then type variety
    const sortedQuestions = sectionQuestions.sort((a, b) => {
      const diffDiff = difficultyOrder[a.difficulty as keyof typeof difficultyOrder] - 
                      difficultyOrder[b.difficulty as keyof typeof difficultyOrder];
      if (diffDiff !== 0) return diffDiff;
      
      return typeOrder[a.type as keyof typeof typeOrder] - 
             typeOrder[b.type as keyof typeof typeOrder];
    });

    return { section, questions: sortedQuestions };
  });

  // Sort sections by importance (general first, then alphabetical)
  organizedSections.sort((a, b) => {
    if (a.section === 'general') return -1;
    if (b.section === 'general') return 1;
    return a.section.localeCompare(b.section);
  });

  // Flatten back to array with better distribution
  const finalQuestions = organizedSections.flatMap(({ questions }) => 
    distributeQuestionTypes(questions)
  );

  console.log(`✅ Questions organized: ${finalQuestions.length} questions across ${organizedSections.length} sections`);
  return finalQuestions;
}

// Distribute question types for optimal learning
function distributeQuestionTypes(questions: any[]): any[] {
  if (questions.length <= 3) return questions;

  const typeGroups = questions.reduce((acc, q) => {
    if (!acc[q.type]) acc[q.type] = [];
    acc[q.type].push(q);
    return acc;
  }, {} as Record<string, any[]>);

  // Interleave different types for variety
  const distributed: any[] = [];
  const types = Object.keys(typeGroups);
  let maxLength = Math.max(...Object.values(typeGroups).map(arr => arr.length));

  for (let i = 0; i < maxLength; i++) {
    for (const type of types) {
      if (typeGroups[type][i]) {
        distributed.push(typeGroups[type][i]);
      }
    }
  }

  return distributed;
}

// Direct AI question extraction function (bypasses queue for synchronous processing)
async function extractQuestionsDirectly(
  documentText: string,
  assessmentType: 'quiz' | 'assignment' | 'exam' | 'project' | 'homework' = 'assignment'
): Promise<Array<{
  question: string;
  type: 'multiple_choice' | 'multiple_choice_multiple' | 'true_false' | 'short_answer' | 'essay' | 'fill_in_blank' | 'numerical' | 'matching';
  options?: string[];
  correctAnswer?: string | string[];
  points: number;
  aiExtracted: boolean;
  section?: string;
  sectionTitle?: string;
  leftItems?: string[];
  rightItems?: string[];
  matchingPairs?: Array<{ left: string; right: string; }>;
}>> {
  console.log('🚀 Direct AI processing (no queue) - Processing text length:', documentText.length);
  
  // Truncate document text if too long for faster processing
  const maxTextLength = 8000;
  const truncatedText = documentText.length > maxTextLength 
    ? documentText.substring(0, maxTextLength) + '\n\n[Document truncated for processing...]'
    : documentText;

  const prompt = `Analyze and extract questions from this ${assessmentType} document with intelligent organization. Return JSON array only:

Document:
${truncatedText}

Required JSON format:
[{"question":"text","type":"multiple_choice|true_false|short_answer|essay|numerical","options":["A","B","C","D"],"correctAnswer":"A","points":10,"aiExtracted":true,"section":"concept_name","difficulty":"easy|medium|hard","topic":"subject_area"}]

Advanced Organization Rules:
1. QUESTION TYPES (prioritize in this order):
   - multiple_choice: For factual recall and concept understanding (4 options)
   - numerical: For mathematical calculations and formulas
   - short_answer: For definitions and brief explanations  
   - essay: For analysis, synthesis, and critical thinking
   - true_false: For concept verification (use sparingly)

2. INTELLIGENT POINT ALLOCATION:
   - Multiple choice: 5-10 points
   - Numerical: 8-15 points (based on complexity)
   - Short answer: 10-15 points
   - Essay: 15-25 points
   - True/false: 3-5 points

3. CONTENT ORGANIZATION:
   - Group questions by logical sections/topics
   - Start with easier concepts, progress to harder ones
   - Mix question types for comprehensive assessment
   - Extract section titles from headers/subtitles

4. MATHEMATICAL CONTENT:
   - Create numerical questions for formulas and calculations
   - Include units and proper mathematical notation
   - Provide step-by-step solution hints in explanations

5. QUALITY STANDARDS:
   - Create 8-20 questions total (optimal learning assessment)
   - Ensure questions are clear and unambiguous
   - Include plausible distractors in multiple choice
   - Cover all major topics in the document

6. DIFFICULTY PROGRESSION:
   - 40% easy (basic recall)
   - 40% medium (application/comprehension)
   - 20% hard (analysis/synthesis)`;

  try {
    // Direct call to AI model (same as aiService but without queue)
    const result = await aiService.model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('🤖 Direct AI response received, parsing JSON...');
    
    // Parse and clean the JSON response
    let cleanedText = text.trim();
    
    // Remove any markdown formatting
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/```json\n?/, '').replace(/\n?```/, '');
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/```\n?/, '').replace(/\n?```/, '');
    }
    
    // Try to find JSON array in the response
    const jsonMatch = cleanedText.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      cleanedText = jsonMatch[0];
    }
    
    const extractedQuestions = JSON.parse(cleanedText);
    console.log(`✅ Direct AI extraction completed: ${extractedQuestions.length} questions`);
    
    // Validate, normalize, and intelligently organize questions
    const normalizedQuestions = extractedQuestions
      .filter((q: any) => q.question && q.question.trim().length > 0)
      .map((q: any) => ({
        question: q.question.trim(),
        type: q.type || 'short_answer',
        options: q.options || undefined,
        correctAnswer: q.correctAnswer || undefined,
        points: typeof q.points === 'number' ? q.points : 10,
        aiExtracted: true,
        section: q.section || 'general',
        sectionTitle: q.sectionTitle || q.section || 'General Questions',
        topic: q.topic || 'general',
        difficulty: q.difficulty || 'medium',
        leftItems: q.leftItems || undefined,
        rightItems: q.rightItems || undefined,
        matchingPairs: q.matchingPairs || undefined
      }));

    // Apply intelligent organization
    return organizeQuestionsIntelligently(normalizedQuestions);
      
  } catch (error: any) {
    console.error('❌ Direct AI extraction failed:', error);
    throw new Error(`AI processing failed: ${error.message}`);
  }
}

// Create assignment
export const createAssignment = async (req: AuthRequest, res: Response) => {
  try {
    const {
      title,
      description,
      instructions,
      courseId,
      dueDate,
      maxPoints,
      submissionType,
      allowedFileTypes,
      maxFileSize,
      isRequired
    } = req.body;

    // Validate required fields
    if (!title || !description || !instructions || !courseId || !dueDate || !maxPoints) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    // Verify course exists and user is the instructor
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }
    
    if (course.instructor.toString() !== req.user?._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to create assignments for this course'
      });
    }

    // Validate due date
    const dueDateObj = new Date(dueDate);
    if (isNaN(dueDateObj.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid due date format'
      });
    }
    
    // Allow due dates in the past for now (can be changed later)
    // if (dueDateObj <= new Date()) {
    //   return res.status(400).json({
    //     success: false,
    //     error: 'Due date must be in the future'
    //   });
    // }

    // Create assignment
    console.log('📝 Creating assignment with data:', {
      title,
      courseId,
      instructor: req.user._id,
      dueDate: dueDateObj
    });

    const assignment = new Assignment({
      title,
      description,
      instructions,
      course: courseId,
      instructor: req.user._id,
      dueDate: dueDateObj,
      maxPoints,
      submissionType: submissionType || 'both',
      allowedFileTypes: allowedFileTypes || ['pdf', 'doc', 'docx'],
      maxFileSize: maxFileSize || 10,
      isRequired: isRequired !== undefined ? isRequired : true,
      status: 'published'
    });

    await assignment.save();
    await assignment.populate('instructor', 'firstName lastName email');
    
    console.log('✅ Assignment saved successfully:', {
      id: assignment._id,
      title: assignment.title,
      course: assignment.course,
      instructor: assignment.instructor,
      status: assignment.status
    });

    res.status(201).json({
      success: true,
      data: assignment,
      message: 'Assignment created successfully'
    });
  } catch (error: any) {
    console.error('Error creating assignment:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create assignment'
    });
  }
};

// Update assignment
export const updateAssignment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Find assignment
    const assignment = await Assignment.findById(id);
    if (!assignment) {
      return res.status(404).json({
        success: false,
        error: 'Assignment not found'
      });
    }

    // Check authorization
    if (assignment.instructor.toString() !== req.user?._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this assignment'
      });
    }

    // Validate due date if provided
    if (updateData.dueDate) {
      const dueDateObj = new Date(updateData.dueDate);
      if (dueDateObj <= new Date()) {
        return res.status(400).json({
          success: false,
          error: 'Due date must be in the future'
        });
      }
      updateData.dueDate = dueDateObj;
    }

    // Update assignment
    const updatedAssignment = await Assignment.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('instructor', 'firstName lastName email');

    res.json({
      success: true,
      data: updatedAssignment,
      message: 'Assignment updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating assignment:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update assignment'
    });
  }
};

// Delete assignment
export const deleteAssignment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Find assignment
    const assignment = await Assignment.findById(id);
    if (!assignment) {
      return res.status(404).json({
        success: false,
        error: 'Assignment not found'
      });
    }

    // Check authorization
    if (assignment.instructor.toString() !== req.user?._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this assignment'
      });
    }

    // Delete all submissions for this assignment
    const submissions = await AssignmentSubmission.find({ assignment: id });
    for (const submission of submissions) {
      // Delete attachments from Cloudinary
      for (const attachment of submission.attachments) {
        await deleteDocumentFromCloudinary(attachment.fileUrl);
      }
    }
    await AssignmentSubmission.deleteMany({ assignment: id });

    // Delete assignment
    await Assignment.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Assignment deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting assignment:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete assignment'
    });
  }
};

// Get assignments for a course
export const getCourseAssignments = async (req: AuthRequest, res: Response) => {
  try {
    const { courseId } = req.params;
    const { status } = req.query;

    // Verify course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }

    // Build query
    const query: any = { course: courseId };
    if (status) {
      query.status = status;
    }

    // Debug instructor comparison
    console.log('🔍 Instructor comparison:', {
      courseInstructor: course.instructor.toString(),
      currentUser: req.user?._id,
      isInstructor: course.instructor.toString() === req.user?._id
    });

    // If user is not the instructor, only show published assignments
    if (course.instructor.toString() !== req.user?._id) {
      console.log('⚠️ User is not instructor, filtering to published only');
      query.status = 'published';
    } else {
      console.log('✅ User is instructor, showing all assignments');
    }

    console.log('🔍 Final query:', query);

    const assignments = await Assignment.find(query)
      .populate('instructor', 'firstName lastName email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        assignments,
        count: assignments.length
      }
    });
  } catch (error: any) {
    console.error('Error fetching course assignments:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch assignments'
    });
  }
};

// Get assignment by ID
export const getAssignmentById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const assignment = await Assignment.findById(id)
      .populate('instructor', 'firstName lastName email')
      .populate('course', 'title description');

    if (!assignment) {
      return res.status(404).json({
        success: false,
        error: 'Assignment not found'
      });
    }

    // Add debug information for TakeExam component
    console.log(`📋 Assignment ${id} requested - Debug info:`, {
      hasQuestions: assignment.hasQuestions,
      questionsCount: assignment.extractedQuestions?.length || 0,
      extractedQuestionsCount: assignment.extractedQuestions?.length || 0,
      aiProcessingStatus: assignment.aiProcessingStatus,
      aiExtractionStatus: assignment.aiExtractionStatus,
      hasAssignmentDocument: !!assignment.assignmentDocument,
      documentFileName: assignment.assignmentDocument?.originalName
    });

    res.json({
      success: true,
      data: assignment
    });
  } catch (error: any) {
    console.error('Error fetching assignment:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch assignment'
    });
  }
};

// Submit assignment
export const submitAssignment = async (req: AuthRequest, res: Response) => {
  try {
    const { assignmentId } = req.params;
    const { submissionText, attachments, sections, isDraft = false, autoSubmit = false } = req.body;

    console.log('Assignment submission request:', {
      assignmentId,
      userId: req.user?._id,
      hasSubmissionText: !!submissionText,
      hasSections: !!sections,
      sectionsCount: sections?.length || 0,
      isDraft,
      autoSubmit
    });

    // Validate user
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    // Handle school-homework special case
    let assignment: any = null;
    const isSchoolHomework = assignmentId === 'school-homework';
    
    if (!isSchoolHomework) {
      // Find assignment
      assignment = await Assignment.findById(assignmentId);
      if (!assignment) {
        return res.status(404).json({
          success: false,
          error: 'Assignment not found'
        });
      }

      // Check if assignment is published
      if (assignment.status !== 'published') {
        return res.status(400).json({
          success: false,
          error: 'Assignment is not available for submission'
        });
      }
    }

    // Check if already submitted (only for final submission)
    const existingSubmission = await AssignmentSubmission.findOne({
      assignment: isSchoolHomework ? 'school-homework' : assignmentId,
      student: req.user._id
    });

    if (existingSubmission && existingSubmission.status === 'submitted' && !isDraft && !autoSubmit && !isSchoolHomework) {
      return res.status(400).json({
        success: false,
        error: 'Assignment already submitted'
      });
    }

    // Check time limit for auto-submit
    const now = new Date();
    const isOverdue = assignment ? now > assignment.dueDate : false;
    
    // Validate submission if not a draft and not auto-submit
    if (!isDraft && !autoSubmit && !isSchoolHomework) {
      if (assignment.submissionType === 'text') {
        const hasTextSubmission = submissionText && submissionText.trim().length > 0;
        const hasSectionContent = sections && sections.length > 0 && sections.some(s => s.content && s.content.trim().length > 0);
        
        if (!hasTextSubmission && !hasSectionContent) {
          return res.status(400).json({
            success: false,
            error: 'Text submission is required. Please add content to at least one section or the general response area.'
          });
        }
      }

      if (assignment.submissionType === 'file' && (!attachments || attachments.length === 0)) {
        return res.status(400).json({
          success: false,
          error: 'File submission is required'
        });
      }
    }

    // Create or update submission
    let submission;
    if (existingSubmission) {
      // Update existing submission
      submission = existingSubmission;
      submission.submissionText = submissionText || submission.submissionText;
      submission.attachments = attachments || submission.attachments;
      submission.sections = sections || submission.sections;
      submission.status = isDraft ? 'draft' : 'submitted';
      submission.submittedAt = isDraft ? submission.submittedAt : new Date();
      submission.isLate = isDraft ? submission.isLate : isOverdue;
      submission.autoSubmitted = autoSubmit;
    } else {
      // Create new submission
      submission = new AssignmentSubmission({
        assignment: assignmentId,
        student: req.user._id,
        submissionText: submissionText || '',
        attachments: attachments || [],
        sections: sections || [],
        submittedAt: isDraft ? undefined : new Date(),
        isLate: isDraft ? false : isOverdue,
        status: isDraft ? 'draft' : 'submitted',
        autoSubmitted: autoSubmit
      });
    }

    await submission.save();
    await submission.populate('student', 'firstName lastName email');

    // Trigger AI grading for submitted assignments (not for school homework)
    if (!isDraft && !isSchoolHomework && submission.status === 'submitted') {
      try {
        await triggerAIGrading(submission, assignment);
      } catch (aiError) {
        console.error('AI grading failed:', aiError);
        // Don't fail the submission if AI grading fails
      }
    }

    res.status(isDraft ? 200 : 201).json({
      success: true,
      data: submission,
      message: isDraft ? 'Assignment draft saved successfully' : 
               autoSubmit ? 'Assignment auto-submitted successfully' :
               'Assignment submitted successfully'
    });
  } catch (error: any) {
    console.error('Error submitting assignment:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to submit assignment'
    });
  }
};

// Trigger AI grading for assignment submission
const triggerAIGrading = async (submission: any, assignment: any) => {
  try {
    // Import AI grading service
    const { aiService } = await import('../services/aiService');
    
    const aiResult = await aiService.gradeAssignmentSubmission({
      assignmentTitle: assignment.title,
      assignmentInstructions: assignment.instructions,
      submissionText: submission.submissionText,
      sections: submission.sections,
      maxPoints: assignment.maxPoints
    });

    // Update submission with AI grade
    submission.aiGrade = {
      score: aiResult.score,
      feedback: aiResult.feedback,
      confidence: aiResult.confidence,
      gradedAt: new Date()
    };
    submission.grade = aiResult.score; // Set preliminary grade
    submission.feedback = aiResult.feedback;
    
    await submission.save();
  } catch (error) {
    console.error('AI grading error:', error);
    throw error;
  }
};

// Trigger AI extraction for assignment document
const triggerAIExtraction = async (assignment: any, fileBuffer: Buffer, filename: string) => {
  try {
    console.log('🤖 Starting AI extraction for assignment:', assignment.title);
    
    // Import AI document service
    const { AIDocumentService } = await import('../services/aiDocumentService');
    const aiDocService = new AIDocumentService();
    
    // Extract document content based on file type
    const fileExtension = filename.split('.').pop()?.toLowerCase();
    let documentContent = '';
    
    if (fileExtension === 'pdf') {
      const pdfParse = await import('pdf-parse');
      const pdfData = await pdfParse.default(fileBuffer);
      documentContent = pdfData.text;
    } else if (fileExtension === 'docx') {
      const mammoth = await import('mammoth');
      const result = await mammoth.extractRawText({ buffer: fileBuffer });
      documentContent = result.value;
    } else if (fileExtension === 'txt') {
      documentContent = fileBuffer.toString('utf-8');
    } else {
      throw new Error(`Unsupported file type: ${fileExtension}`);
    }

    // Extract questions using AI
    const extractedQuestions = await aiDocService.extractQuestionsFromDocument(
      documentContent,
      fileExtension as 'pdf' | 'docx' | 'txt'
    );

    // Update assignment with extracted questions
    assignment.extractedQuestions = extractedQuestions;
    assignment.aiExtractionStatus = 'completed';
    assignment.aiProcessingStatus = 'completed';
    assignment.aiExtractionError = undefined;
    assignment.aiProcessingError = undefined;
    assignment.hasQuestions = extractedQuestions && extractedQuestions.length > 0;
    
    // Note: Only using extractedQuestions field as per schema definition
    
    await assignment.save();
    
    console.log('✅ AI extraction completed successfully for assignment:', assignment.title);
  } catch (error: any) {
    console.error('❌ AI extraction failed:', error);
    
    // Update assignment with error status
    assignment.aiExtractionStatus = 'failed';
    assignment.aiExtractionError = error.message;
    await assignment.save();
  }
};

// Upload assignment file (for student submissions)
export const uploadAssignmentFile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    const { assignmentId } = req.params;

    // Handle school-homework special case
    if (assignmentId !== 'school-homework') {
      // Find assignment to validate file constraints
      const assignment = await Assignment.findById(assignmentId);
      if (!assignment) {
        return res.status(404).json({
          success: false,
          error: 'Assignment not found'
        });
      }

      // Check file size
      const fileSizeMB = req.file.size / (1024 * 1024);
      if (fileSizeMB > assignment.maxFileSize) {
        return res.status(400).json({
          success: false,
          error: `File size exceeds maximum allowed size of ${assignment.maxFileSize}MB`
        });
      }

      // Check file type
      const fileExtension = req.file.originalname.split('.').pop()?.toLowerCase();
      if (fileExtension && !assignment.allowedFileTypes.includes(fileExtension)) {
        return res.status(400).json({
          success: false,
          error: `File type .${fileExtension} is not allowed. Allowed types: ${assignment.allowedFileTypes.join(', ')}`
        });
      }
    } else {
      // For school homework, do basic validation only
      const fileSizeMB = req.file.size / (1024 * 1024);
      const maxSize = 50;
      if (fileSizeMB > maxSize) {
        return res.status(400).json({
          success: false,
          error: `File size exceeds maximum allowed size of ${maxSize}MB`
        });
      }
    }

    // Upload to Cloudinary
    const uploadPath = assignmentId === 'school-homework'
      ? `excellence-coaching-hub/school-homework/submissions`
      : `excellence-coaching-hub/assignments/${assignmentId}/submissions`;
    
    const uploadResult = await uploadDocumentToCloudinary(
      req.file.buffer,
      req.user._id,
      req.file.originalname,
      uploadPath
    );

    const fileData = {
      filename: uploadResult.publicId,
      originalName: req.file.originalname,
      fileUrl: uploadResult.url,
      fileSize: uploadResult.size,
      uploadedAt: new Date()
    };

    res.json({
      success: true,
      data: fileData,
      message: 'File uploaded successfully'
    });
  } catch (error: any) {
    console.error('Error uploading assignment file:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to upload file'
    });
  }
};

// Upload assignment document (for instructor - the assignment document itself)
export const uploadAssignmentDocument = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    const { assignmentId } = req.params;

    // Find assignment and verify instructor
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({
        success: false,
        error: 'Assignment not found'
      });
    }

    if (assignment.instructor.toString() !== req.user?._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to upload documents for this assignment'
      });
    }

    // Upload to Cloudinary
    const uploadResult = await uploadDocumentToCloudinary(
      req.file.buffer,
      req.user._id,
      req.file.originalname,
      `excellence-coaching-hub/assignments/${assignmentId}/documents`
    );

    // Update assignment with document info
    assignment.assignmentDocument = {
      filename: uploadResult.publicId,
      originalName: req.file.originalname,
      fileUrl: uploadResult.url,
      fileSize: uploadResult.size,
      uploadedAt: new Date()
    };

    // Set AI extraction status to pending
    assignment.aiExtractionStatus = 'pending';

    await assignment.save();

    // Trigger AI extraction in background
    triggerAIExtraction(assignment, req.file.buffer, req.file.originalname);

    res.json({
      success: true,
      data: assignment,
      message: 'Assignment document uploaded successfully. AI extraction in progress.'
    });
  } catch (error: any) {
    console.error('Error uploading assignment document:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to upload assignment document'
    });
  }
};

// Get extracted questions from assignment
export const getExtractedQuestions = async (req: AuthRequest, res: Response) => {
  try {
    const { assignmentId } = req.params;

    const assignment = await Assignment.findById(assignmentId)
      .populate('instructor', 'firstName lastName email');

    if (!assignment) {
      return res.status(404).json({
        success: false,
        error: 'Assignment not found'
      });
    }

    res.json({
      success: true,
      data: {
        extractedQuestions: assignment.extractedQuestions || [],
        aiExtractionStatus: assignment.aiExtractionStatus,
        aiExtractionError: assignment.aiExtractionError
      }
    });
  } catch (error: any) {
    console.error('Error fetching extracted questions:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch extracted questions'
    });
  }
};

// Submit assignment with extracted questions answers
export const submitExtractedAssignment = async (req: AuthRequest, res: Response) => {
  try {
    const { assignmentId } = req.params;
    const { answers, isDraft = false } = req.body;

    console.log('Extracted assignment submission:', {
      assignmentId,
      userId: req.user?._id,
      answersCount: answers?.length || 0,
      isDraft
    });

    // Validate user
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    // Find assignment
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({
        success: false,
        error: 'Assignment not found'
      });
    }

    // Check if assignment has extracted questions
    if (!assignment.extractedQuestions || assignment.extractedQuestions.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Assignment does not have extracted questions'
      });
    }

    // Check if already submitted
    const existingSubmission = await AssignmentSubmission.findOne({
      assignment: assignmentId,
      student: req.user._id
    });

    if (existingSubmission && existingSubmission.status === 'submitted' && !isDraft) {
      return res.status(400).json({
        success: false,
        error: 'Assignment already submitted'
      });
    }

    // Create or update submission
    let submission;
    if (existingSubmission) {
      submission = existingSubmission;
      submission.extractedAnswers = answers;
      submission.status = isDraft ? 'draft' : 'submitted';
      submission.submittedAt = isDraft ? submission.submittedAt : new Date();
    } else {
      submission = new AssignmentSubmission({
        assignment: assignmentId,
        student: req.user._id,
        extractedAnswers: answers,
        submittedAt: isDraft ? undefined : new Date(),
        status: isDraft ? 'draft' : 'submitted'
      });
    }

    await submission.save();
    await submission.populate('student', 'firstName lastName email');

    // Trigger AI grading for submitted assignments with extracted questions
    if (!isDraft && submission.status === 'submitted') {
      try {
        await triggerExtractedAssignmentGrading(submission, assignment);
      } catch (aiError) {
        console.error('AI grading failed:', aiError);
        // Don't fail the submission if AI grading fails
      }
    }

    res.status(isDraft ? 200 : 201).json({
      success: true,
      data: submission,
      message: isDraft ? 'Assignment draft saved successfully' : 'Assignment submitted successfully'
    });
  } catch (error: any) {
    console.error('Error submitting extracted assignment:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to submit assignment'
    });
  }
};

// Trigger AI grading for extracted assignment submission
const triggerExtractedAssignmentGrading = async (submission: any, assignment: any) => {
  try {
    console.log('🤖 Starting AI grading for extracted assignment submission');
    
    // Import AI document service
    const { AIDocumentService } = await import('../services/aiDocumentService');
    const aiDocService = new AIDocumentService();
    
    // Grade the assignment using extracted questions and answers
    const gradingResult = await aiDocService.gradeAssessment(
      assignment.extractedQuestions,
      submission.extractedAnswers
    );

    // Update submission with AI grade
    submission.aiGrade = {
      score: gradingResult.score,
      feedback: gradingResult.feedback,
      confidence: 0.8, // High confidence for extracted questions
      gradedAt: new Date(),
      detailedGrading: gradingResult.detailedFeedback.map((detail, index) => ({
        questionIndex: index,
        earnedPoints: detail.earnedPoints,
        maxPoints: detail.points,
        feedback: detail.feedback
      }))
    };
    
    submission.grade = gradingResult.score;
    submission.feedback = gradingResult.feedback;
    submission.status = 'graded';
    submission.gradedAt = new Date();
    
    await submission.save();
    
    console.log('✅ AI grading completed for extracted assignment submission');
  } catch (error) {
    console.error('❌ AI grading failed for extracted assignment:', error);
    throw error;
  }
};

// Replace assignment document (removes old document and uploads new one)
export const replaceAssignmentDocument = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    const { assignmentId } = req.params;

    // Find assignment and verify instructor
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({
        success: false,
        error: 'Assignment not found'
      });
    }

    if (assignment.instructor.toString() !== req.user?._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to replace documents for this assignment'
      });
    }

    // Check if assignment has submissions
    const hasSubmissions = await AssignmentSubmission.exists({ assignment: assignmentId });
    if (hasSubmissions) {
      return res.status(400).json({
        success: false,
        error: 'Cannot replace assignment document after students have submitted'
      });
    }

    // Delete old document if it exists
    if (assignment.assignmentDocument?.filename) {
      try {
        await deleteDocumentFromCloudinary(assignment.assignmentDocument.filename);
      } catch (deleteError) {
        console.warn('Failed to delete old document:', deleteError);
        // Continue with upload even if deletion fails
      }
    }

    // Upload new document to Cloudinary
    const uploadResult = await uploadDocumentToCloudinary(
      req.file.buffer,
      req.user._id,
      req.file.originalname,
      `excellence-coaching-hub/assignments/${assignmentId}/documents`
    );

    // Update assignment with new document info
    assignment.assignmentDocument = {
      filename: uploadResult.publicId,
      originalName: req.file.originalname,
      fileUrl: uploadResult.url,
      fileSize: uploadResult.size,
      uploadedAt: new Date()
    };

    await assignment.save();

    res.json({
      success: true,
      data: assignment,
      message: 'Assignment document replaced successfully'
    });
  } catch (error: any) {
    console.error('Error replacing assignment document:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to replace assignment document'
    });
  }
};

// Get student submissions for an assignment
export const getAssignmentSubmissions = async (req: AuthRequest, res: Response) => {
  try {
    const { assignmentId } = req.params;

    // Find assignment and verify instructor
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({
        success: false,
        error: 'Assignment not found'
      });
    }

    if (assignment.instructor.toString() !== req.user?._id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to view submissions'
      });
    }

    const submissions = await AssignmentSubmission.find({ assignment: assignmentId })
      .populate('student', 'firstName lastName email')
      .sort({ submittedAt: -1 });

    res.json({
      success: true,
      data: {
        submissions,
        count: submissions.length
      }
    });
  } catch (error: any) {
    console.error('Error fetching assignment submissions:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch submissions'
    });
  }
};

// Get student's own submission
export const getStudentSubmission = async (req: AuthRequest, res: Response) => {
  try {
    const { assignmentId } = req.params;

    const submission = await AssignmentSubmission.findOne({
      assignment: assignmentId,
      student: req.user._id
    }).populate('assignment', 'title dueDate maxPoints');

    if (!submission) {
      return res.status(404).json({
        success: false,
        error: 'No submission found'
      });
    }

    res.json({
      success: true,
      data: submission
    });
  } catch (error: any) {
    console.error('Error fetching student submission:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch submission'
    });
  }
};

// Grade assignment submission
export const gradeSubmission = async (req: AuthRequest, res: Response) => {
  try {
    const { submissionId } = req.params;
    const { grade, feedback } = req.body;

    // Find submission
    const submission = await AssignmentSubmission.findById(submissionId)
      .populate('assignment');

    if (!submission) {
      return res.status(404).json({
        success: false,
        error: 'Submission not found'
      });
    }

    // Check authorization
    const assignment = submission.assignment as IAssignment;
    if (assignment.instructor.toString() !== req.user?._id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to grade this submission'
      });
    }

    // Validate grade
    if (grade < 0 || grade > assignment.maxPoints) {
      return res.status(400).json({
        success: false,
        error: `Grade must be between 0 and ${assignment.maxPoints}`
      });
    }

    // Update submission
    submission.grade = grade;
    submission.feedback = feedback;
    submission.status = 'graded';
    submission.gradedAt = new Date();
    submission.gradedBy = new mongoose.Types.ObjectId(req.user._id);

    await submission.save();
    await submission.populate('student', 'firstName lastName email');

    res.json({
      success: true,
      data: submission,
      message: 'Submission graded successfully'
    });
  } catch (error: any) {
    console.error('Error grading submission:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to grade submission'
    });
  }
};

// Get assignment statistics
export const getAssignmentStats = async (req: AuthRequest, res: Response) => {
  try {
    const { assignmentId } = req.params;

    // Find assignment and verify instructor
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({
        success: false,
        error: 'Assignment not found'
      });
    }

    if (assignment.instructor.toString() !== req.user?._id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to view statistics'
      });
    }

    // Get submission statistics
    const totalSubmissions = await AssignmentSubmission.countDocuments({ assignment: assignmentId });
    const gradedSubmissions = await AssignmentSubmission.countDocuments({ 
      assignment: assignmentId, 
      status: 'graded' 
    });
    const lateSubmissions = await AssignmentSubmission.countDocuments({ 
      assignment: assignmentId, 
      isLate: true 
    });

    // Get grade statistics
    const gradeStats = await AssignmentSubmission.aggregate([
      { $match: { assignment: new mongoose.Types.ObjectId(assignmentId), grade: { $exists: true } } },
      {
        $group: {
          _id: null,
          averageGrade: { $avg: '$grade' },
          highestGrade: { $max: '$grade' },
          lowestGrade: { $min: '$grade' }
        }
      }
    ]);

    const stats = {
      totalSubmissions,
      gradedSubmissions,
      lateSubmissions,
      pendingGrading: totalSubmissions - gradedSubmissions,
      gradeStatistics: gradeStats[0] || {
        averageGrade: 0,
        highestGrade: 0,
        lowestGrade: 0
      }
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    console.error('Error fetching assignment statistics:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch statistics'
    });
  }
};

// Publish/unpublish assignment
export const toggleAssignmentStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { assignmentId } = req.params;

    // Find assignment
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({
        success: false,
        error: 'Assignment not found'
      });
    }

    // Check authorization
    if (assignment.instructor.toString() !== req.user?._id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to modify this assignment'
      });
    }

    // Toggle status
    assignment.status = assignment.status === 'published' ? 'draft' : 'published';
    await assignment.save();

    res.json({
      success: true,
      data: assignment,
      message: `Assignment ${assignment.status === 'published' ? 'published' : 'unpublished'} successfully`
    });
  } catch (error: any) {
    console.error('Error toggling assignment status:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update assignment status'
    });
  }
};

// Save assignment draft
export const saveDraft = async (req: AuthRequest, res: Response) => {
  try {
    const { assignmentId, submissionText, attachments, isDraft = true } = req.body;

    // Find assignment
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({
        success: false,
        error: 'Assignment not found'
      });
    }

    // Find existing submission or create new one
    let submission = await AssignmentSubmission.findOne({
      assignment: assignmentId,
      student: req.user?._id
    });

    if (submission) {
      // Update existing submission
      submission.submissionText = submissionText;
      submission.attachments = attachments || submission.attachments;
      submission.status = isDraft ? 'draft' : 'submitted';
      submission.autoSavedAt = new Date();
      submission.version = (submission.version || 1) + 1;
      
      if (!isDraft) {
        submission.submittedAt = new Date();
        submission.isLate = new Date() > new Date(assignment.dueDate);
      }
    } else {
      // Create new submission
      submission = new AssignmentSubmission({
        assignment: assignmentId,
        student: req.user?._id,
        submissionText,
        attachments: attachments || [],
        status: isDraft ? 'draft' : 'submitted',
        submittedAt: isDraft ? undefined : new Date(),
        isLate: isDraft ? false : new Date() > new Date(assignment.dueDate),
        autoSavedAt: new Date(),
        version: 1
      });
    }

    await submission.save();

    res.json({
      success: true,
      data: submission,
      message: isDraft ? 'Draft saved successfully' : 'Assignment submitted successfully'
    });
  } catch (error: any) {
    console.error('Error saving assignment draft:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to save assignment draft'
    });
  }
};

// Get submission history
export const getSubmissionHistory = async (req: AuthRequest, res: Response) => {
  try {
    const { assignmentId } = req.params;

    // Find all submission versions for this assignment and student
    const submissions = await AssignmentSubmission.find({
      assignment: assignmentId,
      student: req.user?._id
    }).sort({ version: -1 }).limit(10);

    const history = submissions.map(submission => ({
      _id: submission._id,
      version: submission.version,
      submissionText: submission.submissionText,
      attachments: submission.attachments,
      savedAt: submission.autoSavedAt || submission.submittedAt,
      autoSaved: !!submission.autoSavedAt
    }));

    res.json({
      success: true,
      data: history
    });
  } catch (error: any) {
    console.error('Error getting submission history:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get submission history'
    });
  }
};

// Update AI grade for submission
export const updateAIGrade = async (req: AuthRequest, res: Response) => {
  try {
    const { submissionId } = req.params;
    const { score, feedback, confidence, gradedAt } = req.body;

    // Find submission
    const submission = await AssignmentSubmission.findById(submissionId);
    if (!submission) {
      return res.status(404).json({
        success: false,
        error: 'Submission not found'
      });
    }

    // Update AI grade
    submission.aiGrade = {
      score,
      feedback,
      confidence,
      gradedAt: gradedAt || new Date()
    };

    await submission.save();

    res.json({
      success: true,
      data: submission,
      message: 'AI grade updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating AI grade:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update AI grade'
    });
  }
};

// AI Question Extraction Methods (like assessments)

// Extract questions from document and add to assignment
export const extractQuestionsFromDocument = async (req: AuthRequest, res: Response) => {
  try {
    const { assignmentId } = req.params;
    const teacherId = req.user?._id;

    const assignment = await Assignment.findOne({ _id: assignmentId, instructor: teacherId });
    if (!assignment) {
      return res.status(404).json({
        success: false,
        error: 'Assignment not found or you do not have permission to modify it'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No document file provided'
      });
    }

    try {
      // Step 1: Fast parallel document processing (upload + parse simultaneously)
      console.log(`🚀 Fast processing document for assignment: ${assignmentId}`);
      const { fastDocumentProcessor } = await import('../services/fastDocumentProcessor');
      
      const processingResult = await fastDocumentProcessor.processDocument(
        req.file.buffer,
        req.file.mimetype,
        req.file.originalname,
        'assignments'
      );

      if (!processingResult.isValid) {
        return res.status(400).json({
          success: false,
          error: 'Invalid document',
          details: processingResult.errors
        });
      }

      console.log(`⚡ Document processed in ${processingResult.processingTime}ms`);

      // Step 2: Save assignment with document immediately (fast)
      assignment.assignmentDocument = {
        filename: req.file.filename || `assignment_${Date.now()}`,
        originalName: req.file.originalname,
        fileUrl: processingResult.documentUrl,
        fileSize: req.file.size,
        uploadedAt: new Date()
      };

      // Mark AI processing as pending
      assignment.aiProcessingStatus = 'pending';
      assignment.documentText = processingResult.documentText; // Store for background processing
      
      await assignment.save();
      console.log(`✅ Assignment document uploaded successfully: ${assignmentId}`);

      // Step 3: Return immediate success response (FAST!)
      res.status(200).json({
        success: true,
        data: { 
          assignment: {
            ...assignment.toObject(),
            documentText: undefined // Don't send full text in response
          },
          extractedQuestions: 0,
          documentProcessed: true,
          aiProcessingStatus: 'pending',
          processingTime: processingResult.processingTime
        },
        message: 'Assignment uploaded successfully! AI question extraction is processing in the background.',
        info: 'Questions will be automatically extracted and added to your assignment. You can refresh the page in a few moments to see the results.',
        performance: {
          uploadTime: `${processingResult.processingTime}ms`,
          status: 'optimized'
        }
      });

      // Step 5: Process AI extraction in background (ASYNC - doesn't block response)
      setImmediate(async () => {
        try {
          console.log(`🤖 Background: Starting AI question extraction for assignment: ${assignmentId}`);
          
          const cleanedText = assignment.documentText;
          if (!cleanedText) {
            console.error('❌ Background: No document text available for AI processing');
            
            // Update assignment status to failed
            const updatedAssignment = await Assignment.findById(assignmentId);
            if (updatedAssignment) {
              updatedAssignment.aiProcessingStatus = 'failed';
              updatedAssignment.aiProcessingError = 'No document text available';
              await updatedAssignment.save();
            }
            return;
          }

          console.log(`📄 Background: Processing ${cleanedText.length} characters of text`);

          // Use the retry service for AI processing
          const extractedQuestions = await aiService.extractQuestionsFromDocument(cleanedText, 'assignment');

          console.log(`🔍 Background: AI extraction returned ${extractedQuestions ? extractedQuestions.length : 0} questions`);

          if (extractedQuestions && extractedQuestions.length > 0) {
            // Add unique IDs to extracted questions
            const questionsWithIds = extractedQuestions.map((q, index) => ({
              ...q,
              id: q.id || `extracted_${Date.now()}_${index}`,
              _id: q._id || `extracted_${Date.now()}_${index}`,
              aiExtracted: true
            }));

            console.log(`🎯 Background: Sample questions:`, questionsWithIds.slice(0, 2).map(q => ({ 
              question: q.question.substring(0, 100), 
              type: q.type, 
              options: q.options?.length || 0 
            })));

            // Update assignment with questions
            const updatedAssignment = await Assignment.findById(assignmentId);
            if (updatedAssignment) {
              // Store questions in both fields for compatibility
              updatedAssignment.questions = [...(updatedAssignment.questions || []), ...questionsWithIds];
              updatedAssignment.extractedQuestions = questionsWithIds;
              updatedAssignment.hasQuestions = true;
              updatedAssignment.aiProcessingStatus = 'completed';
              updatedAssignment.aiExtractionStatus = 'completed';
              updatedAssignment.documentText = undefined; // Clear stored text
              
              // Update maxPoints to match the actual points from extracted questions
              const oldMaxPoints = updatedAssignment.maxPoints;
              const calculatedMaxPoints = questionsWithIds.reduce((sum, q) => sum + (q.points || 10), 0);
              updatedAssignment.maxPoints = calculatedMaxPoints;
              
              console.log(`📊 Background: Updated assignment maxPoints from ${oldMaxPoints} to ${calculatedMaxPoints} based on extracted questions`);
              
              await updatedAssignment.save();
              console.log(`✅ Background: Successfully stored ${questionsWithIds.length} questions for assignment: ${assignmentId}`);
              console.log(`📊 Background: Assignment now has ${updatedAssignment.questions?.length || 0} total questions and ${updatedAssignment.extractedQuestions?.length || 0} extracted questions`);
            }
          } else {
            // No questions found
            console.log(`⚠️ Background: AI extraction returned empty or null result`);
            const updatedAssignment = await Assignment.findById(assignmentId);
            if (updatedAssignment) {
              updatedAssignment.aiProcessingStatus = 'no_questions_found';
              updatedAssignment.aiExtractionStatus = 'failed';
              updatedAssignment.hasQuestions = false;
              updatedAssignment.documentText = undefined; // Clear stored text
              await updatedAssignment.save();
              console.log(`ℹ️ Background: No questions found in document for assignment: ${assignmentId}`);
            }
          }
        } catch (aiError: any) {
          console.error(`❌ Background: AI processing failed for assignment ${assignmentId}:`, aiError);
          console.error(`❌ Background: Error stack:`, aiError.stack);
          
          // Update assignment status to failed
          try {
            const updatedAssignment = await Assignment.findById(assignmentId);
            if (updatedAssignment) {
              updatedAssignment.aiProcessingStatus = 'failed';
              updatedAssignment.aiExtractionStatus = 'failed';
              updatedAssignment.aiProcessingError = aiError.message;
              updatedAssignment.hasQuestions = false;
              updatedAssignment.documentText = undefined; // Clear stored text
              await updatedAssignment.save();
              console.log(`📝 Background: Updated assignment status to failed`);
            }
          } catch (updateError) {
            console.error('❌ Background: Failed to update assignment status:', updateError);
          }
        }
      });

    } catch (error) {
      console.error('Document processing error:', error);
      res.status(400).json({
        success: false,
        error: 'Failed to process uploaded document',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  } catch (error: any) {
    console.error('Error extracting questions from document:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to extract questions from document'
    });
  }
};

// Replace questions from document (removes old extracted questions)
export const replaceQuestionsFromDocument = async (req: AuthRequest, res: Response) => {
  try {
    const { assignmentId } = req.params;
    const teacherId = req.user?._id;

    const assignment = await Assignment.findOne({ _id: assignmentId, instructor: teacherId });
    if (!assignment) {
      return res.status(404).json({
        success: false,
        error: 'Assignment not found or you do not have permission to modify it'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No document file provided'
      });
    }

    try {
      // Upload document to cloud storage
      const uploadResult = await uploadFile(req.file, 'assignments');
      const documentUrl = uploadResult.url;

      // Parse document content
      const parseResult = await DocumentParser.parseDocument(
        req.file.buffer,
        req.file.mimetype,
        req.file.originalname
      );

      // Validate document
      const validation = DocumentParser.validateDocument(parseResult);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          error: 'Invalid document',
          details: validation.errors
        });
      }

      // Extract questions using AI
      const cleanedText = DocumentParser.cleanText(parseResult.text);
      const extractedQuestions = await aiService.extractQuestionsFromDocument(cleanedText, 'assignment');

      // Add unique IDs to extracted questions and normalize question types
      const questionsWithIds = extractedQuestions.map((q, index) => {
        // Normalize question types to match schema enum values (with hyphens)
        const normalizedType = q.type?.replace(/_/g, '-') || 'short-answer';
        const validTypes = ['multiple-choice', 'true-false', 'short-answer', 'essay', 'fill-in-blank', 'matching', 'ordering', 'numerical', 'code'];
        const questionType = validTypes.includes(normalizedType) ? normalizedType as any : 'short-answer';
        
        return {
          ...q,
          // Don't set _id, let MongoDB generate it automatically
          id: `extracted_${Date.now()}_${index}`,
          type: questionType,
          aiExtracted: true
        };
      });
      assignment.hasQuestions = true;
      assignment.extractedQuestions = questionsWithIds;
      assignment.assignmentDocument = {
        filename: req.file.filename || `assignment_${Date.now()}`,
        originalName: req.file.originalname,
        fileUrl: documentUrl,
        fileSize: req.file.size,
        uploadedAt: new Date()
      };

      await assignment.save();

      res.status(200).json({
        success: true,
        data: { 
          assignment,
          extractedQuestions: questionsWithIds.length,
          documentProcessed: true
        },
        message: `Questions replaced successfully! ${questionsWithIds.length} questions extracted from new document.`
      });

    } catch (error) {
      console.error('Document processing error:', error);
      res.status(400).json({
        success: false,
        error: 'Failed to process uploaded document',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  } catch (error: any) {
    console.error('Error replacing questions from document:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to replace questions from document'
    });
  }
};

// Get assignment submissions for grading (like assessments)
export const getAssignmentSubmissionsForGrading = async (req: AuthRequest, res: Response) => {
  try {
    const { assignmentId } = req.params;
    const teacherId = req.user?._id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const assignment = await Assignment.findOne({ _id: assignmentId, instructor: teacherId });
    if (!assignment) {
      return res.status(404).json({
        success: false,
        error: 'Assignment not found or you do not have permission to view submissions'
      });
    }

    const skip = (page - 1) * limit;

    const [submissions, total] = await Promise.all([
      AssignmentSubmission.find({ assignment: assignmentId, status: { $ne: 'draft' } })
        .populate('student', 'firstName lastName email')
        .sort({ submittedAt: -1 })
        .skip(skip)
        .limit(limit),
      AssignmentSubmission.countDocuments({ assignment: assignmentId, status: { $ne: 'draft' } })
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
  } catch (error: any) {
    console.error('Error fetching assignment submissions:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch submissions'
    });
  }
};

// Grade assignment submission manually (like assessments)
export const gradeAssignmentSubmission = async (req: AuthRequest, res: Response) => {
  try {
    const { submissionId } = req.params;
    const teacherId = req.user?._id;
    const { answers, feedback, score, percentage } = req.body;

    const submission = await AssignmentSubmission.findById(submissionId)
      .populate('assignment');

    if (!submission) {
      return res.status(404).json({
        success: false,
        error: 'Submission not found'
      });
    }

    // Verify teacher owns the assignment
    const assignment = submission.assignment as IAssignment;
    if (assignment.instructor.toString() !== teacherId) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to grade this submission'
      });
    }

    // Update answers with grading information if provided
    if (answers && submission.sections) {
      submission.sections = submission.sections.map(section => {
        const gradedAnswer = answers.find((a: any) => a.questionId === section.id);
        if (gradedAnswer) {
          return {
            ...section,
            feedback: gradedAnswer.feedback,
            score: gradedAnswer.score,
            completed: true
          };
        }
        return section;
      });
    }

    // Set overall feedback and score
    if (feedback) submission.feedback = feedback;
    if (score !== undefined) submission.grade = score;
    
    // Calculate percentage if not provided
    if (percentage !== undefined) {
      submission.grade = (percentage / 100) * assignment.maxPoints;
    }

    submission.status = 'graded';
    submission.gradedAt = new Date();
    submission.gradedBy = teacherId;

    await submission.save();

    res.status(200).json({
      success: true,
      data: { submission },
      message: 'Submission graded successfully'
    });
  } catch (error: any) {
    console.error('Error grading assignment submission:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to grade submission'
    });
  }
};

// Get submission details for grading
export const getSubmissionDetails = async (req: AuthRequest, res: Response) => {
  try {
    const { submissionId } = req.params;
    const userId = req.user?._id;
    const userRole = req.user?.role;

    const submission = await AssignmentSubmission.findById(submissionId)
      .populate('assignment')
      .populate('student', 'firstName lastName email');

    if (!submission) {
      return res.status(404).json({
        success: false,
        error: 'Submission not found'
      });
    }

    // Check permissions
    const assignment = submission.assignment as IAssignment;
    const isTeacher = userRole === 'teacher' && assignment.instructor.toString() === userId;
    const isStudent = userRole === 'student' && submission.student._id.toString() === userId;

    if (!isTeacher && !isStudent) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to view this submission'
      });
    }

    res.status(200).json({
      success: true,
      data: { submission }
    });
  } catch (error: any) {
    console.error('Error fetching submission details:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch submission details'
    });
  }
};

// Check AI processing status for an assignment
export const checkAIProcessingStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { assignmentId } = req.params;
    const teacherId = req.user?._id;

    const assignment = await Assignment.findOne({ _id: assignmentId, instructor: teacherId });
    if (!assignment) {
      return res.status(404).json({
        success: false,
        error: 'Assignment not found or you do not have permission to view it'
      });
    }

    const status = assignment.aiProcessingStatus || 'not_started';
    const questionsCount = assignment.extractedQuestions?.length || 0;
    const extractedQuestionsCount = assignment.extractedQuestions?.length || 0;

    res.status(200).json({
      success: true,
      data: {
        assignmentId,
        aiProcessingStatus: status,
        questionsCount,
        extractedQuestionsCount,
        hasQuestions: assignment.hasQuestions || false,
        processingError: assignment.aiProcessingError || null,
        lastUpdated: assignment.updatedAt
      }
    });
  } catch (error: any) {
    console.error('Error checking AI processing status:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to check AI processing status'
    });
  }
};

// Retry question extraction for an assignment
export const retryQuestionExtraction = async (req: AuthRequest, res: Response) => {
  try {
    const { assignmentId } = req.params;
    const teacherId = req.user?._id;

    const assignment = await Assignment.findOne({ _id: assignmentId, instructor: teacherId });
    if (!assignment) {
      return res.status(404).json({
        success: false,
        error: 'Assignment not found or you do not have permission to modify it'
      });
    }

    if (!assignment.assignmentDocument?.fileUrl) {
      return res.status(400).json({
        success: false,
        error: 'No document found for this assignment'
      });
    }

    try {
      console.log(`🔄 Starting question extraction retry for assignment: ${assignmentId}`);
      
      // Mark AI processing as pending immediately
      assignment.aiProcessingStatus = 'pending';
      assignment.aiExtractionStatus = 'pending';
      assignment.lastQuestionExtractionAttempt = new Date();
      await assignment.save();

      // Return immediate response
      res.status(200).json({
        success: true,
        message: 'Question extraction is starting. Please refresh the page in a few moments to see the results.',
        data: {
          assignmentId,
          aiProcessingStatus: 'pending',
          aiExtractionStatus: 'pending'
        }
      });

      // Start processing immediately in background
      setImmediate(async () => {
        try {
          console.log(`🤖 Background: Starting AI question extraction retry for assignment: ${assignmentId}`);
          
          let documentText = assignment.documentText;
          
          // If we don't have document text, try to re-parse the document
          if (!documentText && assignment.assignmentDocument?.fileUrl) {
            try {
              console.log(`📄 Re-downloading and parsing document from: ${assignment.assignmentDocument.fileUrl}`);
              
              // Import document parser
              const DocumentParser = (await import('../utils/documentParser')).default;
              
              // Download the document from Cloudinary
              const response = await fetch(assignment.assignmentDocument.fileUrl);
              if (!response.ok) {
                throw new Error(`Failed to download document: ${response.statusText}`);
              }
              
              const buffer = await response.arrayBuffer();
              const fileBuffer = Buffer.from(buffer);
              
              // Parse the document
              const parser = new DocumentParser();
              documentText = await parser.extractTextFromBuffer(fileBuffer, assignment.assignmentDocument.originalName);
              
              console.log(`📄 Re-parsed document, extracted ${documentText.length} characters`);
              
              // Save the document text for future use
              assignment.documentText = documentText;
              await assignment.save();
              
            } catch (parseError) {
              console.error(`❌ Failed to re-parse document:`, parseError);
              
              // Update assignment status to failed
              const updatedAssignment = await Assignment.findById(assignmentId);
              if (updatedAssignment) {
                updatedAssignment.aiProcessingStatus = 'failed';
                updatedAssignment.aiExtractionStatus = 'failed';
                updatedAssignment.aiProcessingError = `Document re-parsing failed: ${parseError.message}`;
                await updatedAssignment.save();
              }
              return;
            }
          }

          if (!documentText || documentText.length === 0) {
            console.error('❌ No document text available for AI processing after retry');
            
            // Update assignment status to failed
            const updatedAssignment = await Assignment.findById(assignmentId);
            if (updatedAssignment) {
              updatedAssignment.aiProcessingStatus = 'failed';
              updatedAssignment.aiExtractionStatus = 'failed';
              updatedAssignment.aiProcessingError = 'No document text available for processing';
              await updatedAssignment.save();
            }
            return;
          }

          console.log(`📄 Processing ${documentText.length} characters of text with AI`);

          // Use the AI service to extract questions
          const extractedQuestions = await aiService.extractQuestionsFromDocument(documentText, 'assignment');

          console.log(`🔍 AI extraction returned ${extractedQuestions ? extractedQuestions.length : 0} questions`);

          if (extractedQuestions && extractedQuestions.length > 0) {
            // Add unique IDs to extracted questions
            const questionsWithIds = extractedQuestions.map((q, index) => ({
              ...q,
              id: q.id || `retry_${Date.now()}_${index}`,
              _id: q._id || `retry_${Date.now()}_${index}`,
              aiExtracted: true
            }));

            console.log(`🎯 Sample questions:`, questionsWithIds.slice(0, 2).map(q => ({ 
              question: q.question.substring(0, 100), 
              type: q.type, 
              options: q.options?.length || 0 
            })));

            // Update assignment with questions
            const updatedAssignment = await Assignment.findById(assignmentId);
            if (updatedAssignment) {
              // Replace existing questions with new extracted questions
              updatedAssignment.questions = questionsWithIds;
              updatedAssignment.extractedQuestions = questionsWithIds;
              updatedAssignment.hasQuestions = true;
              updatedAssignment.aiProcessingStatus = 'completed';
              updatedAssignment.aiExtractionStatus = 'completed';
              updatedAssignment.aiProcessingError = undefined;
              updatedAssignment.documentText = undefined; // Clear stored text
              
              await updatedAssignment.save();
              console.log(`✅ Successfully stored ${questionsWithIds.length} questions for assignment: ${assignmentId}`);
            }
          } else {
            // No questions found
            console.log(`⚠️ AI extraction returned empty or null result`);
            const updatedAssignment = await Assignment.findById(assignmentId);
            if (updatedAssignment) {
              updatedAssignment.aiProcessingStatus = 'no_questions_found';
              updatedAssignment.aiExtractionStatus = 'failed';
              updatedAssignment.aiProcessingError = 'No questions could be extracted from the document';
              updatedAssignment.hasQuestions = false;
              updatedAssignment.documentText = undefined; // Clear stored text
              await updatedAssignment.save();
              console.log(`ℹ️ No questions found in document for assignment: ${assignmentId}`);
            }
          }
        } catch (aiError: any) {
          console.error(`❌ Background AI processing failed for assignment ${assignmentId}:`, aiError);
          
          // Update assignment status to failed
          try {
            const updatedAssignment = await Assignment.findById(assignmentId);
            if (updatedAssignment) {
              updatedAssignment.aiProcessingStatus = 'failed';
              updatedAssignment.aiExtractionStatus = 'failed';
              updatedAssignment.aiProcessingError = aiError.message;
              updatedAssignment.hasQuestions = false;
              updatedAssignment.documentText = undefined; // Clear stored text
              await updatedAssignment.save();
              console.log(`📝 Updated assignment status to failed`);
            }
          } catch (updateError) {
            console.error('❌ Failed to update assignment status:', updateError);
          }
        }
      });

    } catch (error: any) {
      console.error('Error starting question extraction retry:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to start question extraction retry',
        details: error.message
      });
    }
  } catch (error: any) {
    console.error('Error in retry question extraction:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to retry question extraction'
    });
  }
};

// Debug endpoint to manually trigger AI processing
// Extract questions from assignment document (like assessment) - synchronous processing
export const extractAssignmentQuestions = async (req: AuthRequest, res: Response) => {
  try {
    const { assignmentId } = req.params;
    const teacherId = req.user?._id;

    if (!teacherId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // Find assignment
    const assignment = await Assignment.findOne({ _id: assignmentId, instructor: teacherId });
    if (!assignment) {
      return res.status(404).json({
        success: false,
        error: 'Assignment not found or you do not have permission to modify it'
      });
    }

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No document file provided'
      });
    }

    try {
      console.log(`📄 Processing assignment document for extraction: ${req.file.originalname}`);
      
      // Parse document content using DocumentParser static methods (same as assessments)
      const parseResult = await DocumentParser.parseDocument(
        req.file.buffer,
        req.file.mimetype,
        req.file.originalname
      );

      // Validate document
      const validation = DocumentParser.validateDocument(parseResult);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          error: 'Invalid document',
          details: validation.errors
        });
      }

      if (!parseResult.text || parseResult.text.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Could not extract text from document'
        });
      }

      console.log(`📄 Document parsed successfully, text length: ${parseResult.text.length}`);

      // Clean text for AI processing (same as assessments)
      const cleanedText = DocumentParser.cleanText(parseResult.text);
      console.log(`🤖 Starting DIRECT AI extraction for assignment (bypassing queue)...`);
      
      // Direct AI call without queue system (for synchronous processing)
      const extractedQuestions = await extractQuestionsDirectly(cleanedText, 'assignment');
      
      if (!extractedQuestions || extractedQuestions.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No questions could be extracted from the document'
        });
      }

      console.log(`🎯 AI extracted ${extractedQuestions.length} questions`);

      // Add unique IDs to extracted questions and normalize question types
      const questionsWithIds = extractedQuestions.map((q, index) => {
        // Normalize question types to match schema enum values (with hyphens)
        const normalizedType = q.type?.replace(/_/g, '-') || 'short-answer';
        const validTypes = ['multiple-choice', 'true-false', 'short-answer', 'essay', 'fill-in-blank', 'matching', 'ordering', 'numerical', 'code'];
        const questionType = validTypes.includes(normalizedType) ? normalizedType as any : 'short-answer';
        
        return {
          ...q,
          // Don't set _id, let MongoDB generate it automatically
          id: `extracted_${Date.now()}_${index}`,
          type: questionType,
          aiExtracted: true
        };
      });

      // Upload document to cloud storage
      const uploadResult = await uploadDocumentToCloudinary(req.file.buffer, teacherId, req.file.originalname);

      // Update assignment with document and questions
      assignment.assignmentDocument = {
        filename: uploadResult.publicId,
        originalName: req.file.originalname,
        fileUrl: uploadResult.url,
        fileSize: req.file.size,
        uploadedAt: new Date()
      };

      // Replace existing questions with extracted ones
      assignment.extractedQuestions = questionsWithIds;
      assignment.hasQuestions = true;
      assignment.aiProcessingStatus = 'completed';
      assignment.aiExtractionStatus = 'completed';
      
      // Update maxPoints to match the actual points from extracted questions
      const oldMaxPoints = assignment.maxPoints;
      const calculatedMaxPoints = questionsWithIds.reduce((sum, q) => sum + (q.points || 10), 0);
      assignment.maxPoints = calculatedMaxPoints;
      
      console.log(`📊 Updated assignment maxPoints from ${oldMaxPoints} to ${calculatedMaxPoints} based on extracted questions`);
      
      // Clear error fields and document text
      assignment.set('aiProcessingError', undefined);
      assignment.set('documentText', undefined);

      await assignment.save();

      console.log(`✅ Assignment updated with ${questionsWithIds.length} extracted questions`);

      res.status(200).json({
        success: true,
        message: `Successfully extracted ${questionsWithIds.length} questions from document`,
        data: {
          assignment,
          extractedQuestions: questionsWithIds.length,
          documentProcessed: true,
          questions: questionsWithIds.slice(0, 5) // Preview first 5 questions
        }
      });

    } catch (error: any) {
      console.error('Document processing error:', error);
      
      // Update assignment to failed status
      assignment.aiProcessingStatus = 'failed';
      assignment.aiExtractionStatus = 'failed';
      assignment.aiProcessingError = error.message;
      assignment.hasQuestions = false;
      await assignment.save();

      res.status(500).json({
        success: false,
        error: 'Failed to process document and extract questions',
        details: error.message
      });
    }

  } catch (error: any) {
    console.error('Error in extractAssignmentQuestions:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to extract assignment questions'
    });
  }
};

export const debugAIProcessing = async (req: AuthRequest, res: Response) => {
  try {
    const { assignmentId } = req.params;
    
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({
        success: false,
        error: 'Assignment not found'
      });
    }

    console.log(`🐞 Manual Debug: Assignment ${assignmentId}`);
    console.log('Document Text Length:', assignment.documentText?.length || 0);
    console.log('AI Processing Status:', assignment.aiProcessingStatus);
    console.log('Has Document:', !!assignment.assignmentDocument);
    
    if (assignment.documentText && assignment.documentText.length > 0) {
      console.log('Document Text Preview:', assignment.documentText.substring(0, 200) + '...');
      
      try {
        // Try manual AI extraction
        console.log('🤖 Attempting manual AI extraction...');
        const extractedQuestions = await aiService.extractQuestionsFromDocument(assignment.documentText, 'assignment');
        
        console.log('🎯 Manual extraction result:', {
          questionsCount: extractedQuestions?.length || 0,
          sampleQuestion: extractedQuestions?.[0] ? {
            question: extractedQuestions[0].question.substring(0, 100),
            type: extractedQuestions[0].type
          } : null
        });

        if (extractedQuestions && extractedQuestions.length > 0) {
          // Update assignment with extracted questions
          const questionsWithIds = extractedQuestions.map((q, index) => ({
            ...q,
            // Don't set _id, let MongoDB generate it automatically
            id: q.id || `manual_debug_${Date.now()}_${index}`,
            // Normalize question types to match schema enum values (with hyphens)
            type: q.type?.replace(/_/g, '-') || 'short-answer',
            aiExtracted: true
          }));

          assignment.extractedQuestions = questionsWithIds;
          assignment.hasQuestions = true;
          assignment.aiProcessingStatus = 'completed';
          assignment.aiExtractionStatus = 'completed';
          assignment.documentText = undefined; // Clear stored text
          
          await assignment.save();
          
          res.json({
            success: true,
            message: 'Manual AI processing completed successfully!',
            data: {
              questionsExtracted: questionsWithIds.length,
              assignment: {
                ...assignment.toObject(),
                documentText: undefined
              }
            }
          });
        } else {
          res.json({
            success: false,
            message: 'No questions could be extracted from the document'
          });
        }
      } catch (aiError: any) {
        console.error('❌ Manual AI extraction failed:', aiError);
        res.status(500).json({
          success: false,
          error: 'AI extraction failed',
          details: aiError.message
        });
      }
    } else {
      res.json({
        success: false,
        message: 'No document text available for processing'
      });
    }
  } catch (error: any) {
    console.error('Debug processing error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Debug processing failed'
    });
  }
};

// Save assignment progress (auto-save functionality)
export const saveAssignmentProgress = async (req: AuthRequest, res: Response) => {
  try {
    const { assignmentId } = req.params;
    const { extractedAnswers, autoSaved = true, status = 'draft' } = req.body;
    const studentId = req.user?._id;

    if (!studentId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    console.log('💾 Saving assignment progress:', {
      assignmentId,
      studentId,
      answersCount: extractedAnswers?.length || 0,
      autoSaved,
      status
    });

    // Find the assignment
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({
        success: false,
        error: 'Assignment not found'
      });
    }

    // Find existing submission or create new one
    let submission = await AssignmentSubmission.findOne({
      assignment: assignmentId,
      student: studentId
    });

    if (!submission) {
      // Create new submission
      submission = new AssignmentSubmission({
        assignment: assignmentId,
        student: studentId,
        extractedAnswers: extractedAnswers || [],
        status: status,
        autoSavedAt: new Date(),
        version: 1
      });
    } else {
      // Update existing submission
      submission.extractedAnswers = extractedAnswers || [];
      submission.status = status;
      submission.autoSavedAt = new Date();
      submission.version = (submission.version || 0) + 1;
    }

    await submission.save();

    console.log('✅ Assignment progress saved successfully');

    res.json({
      success: true,
      message: autoSaved ? 'Progress auto-saved' : 'Progress saved',
      data: submission
    });

  } catch (error: any) {
    console.error('❌ Error saving assignment progress:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to save progress'
    });
  }
};

// Submit assignment with extracted answers for AI grading
export const submitAssignmentWithExtractedAnswers = async (req: AuthRequest, res: Response) => {
  try {
    const { assignmentId } = req.params;
    const {
      extractedAnswers,
      submissionText,
      finalSubmission = true,
      isAutoSubmit = false,
      timeSpent = 0,
      submittedAt,
      status = 'submitted'
    } = req.body;
    const studentId = req.user?._id;

    if (!studentId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    console.log('📤 Submitting assignment with extracted answers:', {
      assignmentId,
      studentId,
      answersCount: extractedAnswers?.length || 0,
      finalSubmission,
      isAutoSubmit,
      timeSpent
    });

    // Validate that we have answers
    if (!extractedAnswers || extractedAnswers.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No answers provided for submission'
      });
    }

    // Find the assignment
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({
        success: false,
        error: 'Assignment not found'
      });
    }

    // Check if assignment is still open for submissions
    if (assignment.status !== 'published') {
      return res.status(400).json({
        success: false,
        error: 'Assignment is not open for submissions'
      });
    }

    // Check due date (allow some grace period for auto-submit)
    const now = new Date();
    const dueDate = new Date(assignment.dueDate);
    const gracePeriod = 5 * 60 * 1000; // 5 minutes grace period
    
    if (now > dueDate && !isAutoSubmit) {
      return res.status(400).json({
        success: false,
        error: 'Assignment submission deadline has passed'
      });
    }

    if (now > new Date(dueDate.getTime() + gracePeriod) && isAutoSubmit) {
      return res.status(400).json({
        success: false,
        error: 'Assignment submission deadline has passed (even with grace period)'
      });
    }

    // Find existing submission or create new one
    let submission = await AssignmentSubmission.findOne({
      assignment: assignmentId,
      student: studentId
    });

    if (submission && submission.status === 'submitted') {
      return res.status(400).json({
        success: false,
        error: 'Assignment has already been submitted'
      });
    }

    const submissionData = {
      assignment: assignmentId,
      student: studentId,
      extractedAnswers: extractedAnswers,
      submissionText: submissionText || `Assignment completed with ${extractedAnswers.length} questions answered`,
      submittedAt: submittedAt ? new Date(submittedAt) : new Date(),
      isLate: now > dueDate,
      status: status,
      autoSubmitted: isAutoSubmit,
      timeSpent: timeSpent,
      version: submission ? (submission.version || 0) + 1 : 1
    };

    if (!submission) {
      // Create new submission
      submission = new AssignmentSubmission(submissionData);
    } else {
      // Update existing submission
      Object.assign(submission, submissionData);
    }

    await submission.save();

    // Trigger AI grading if the assignment has questions
    if (assignment.hasQuestions && (assignment.questions?.length > 0 || assignment.extractedQuestions?.length > 0)) {
      try {
        console.log('📝 Triggering grading for submission:', submission._id);
        
        // Get the questions for grading context
        const questions = assignment.extractedQuestions || assignment.questions || [];
        
        // Calculate actual max points from questions
        const actualMaxPoints = questions.reduce((sum, q) => sum + (q.points || 10), 0);
        
        // Prepare grading data for the new AI method
        const gradingData = {
          assignmentTitle: assignment.title,
          assignmentInstructions: assignment.instructions,
          questions: questions.map(q => ({
            question: q.question,
            type: q.type,
            options: q.options || [],
            correctAnswer: q.correctAnswer,
            points: q.points || 10
          })),
          answers: extractedAnswers,
          maxPoints: actualMaxPoints
        };

        console.log('📊 Grading data prepared:', {
          title: gradingData.assignmentTitle,
          questionsCount: gradingData.questions.length,
          answersCount: gradingData.answers.length,
          maxPoints: gradingData.maxPoints,
          actualMaxPoints: actualMaxPoints,
          assignmentMaxPoints: assignment.maxPoints,
          sampleQuestion: gradingData.questions[0]?.question?.substring(0, 100),
          sampleAnswer: gradingData.answers[0]?.answer?.substring(0, 100)
        });

        // Call AI grading service (async - don't wait for completion)
        aiService.gradeExtractedAssignment(gradingData).then(async (gradingResult) => {
          try {
            console.log('✅ Grading completed for submission:', submission._id);
            console.log('📊 Grading result:', {
              score: gradingResult.score,
              maxPoints: gradingData.maxPoints,
              percentage: Math.round((gradingResult.score / gradingData.maxPoints) * 100),
              confidence: gradingResult.confidence
            });

            // Update submission with AI grade
            const updatedSubmission = await AssignmentSubmission.findById(submission._id);
            if (updatedSubmission) {
              updatedSubmission.aiGrade = {
                score: gradingResult.score,
                feedback: gradingResult.feedback,
                confidence: gradingResult.confidence,
                gradedAt: new Date(),
                detailedGrading: gradingResult.detailedGrading
              };
              updatedSubmission.grade = gradingResult.score;
              updatedSubmission.status = 'graded';
              updatedSubmission.gradedAt = new Date();
              
              await updatedSubmission.save();
              console.log('💾 Submission updated with grade');
            }
          } catch (updateError: any) {
            console.error('❌ Failed to update submission with grade:', updateError);
          }
        }).catch((gradingError) => {
          console.error('❌ Grading failed for submission:', submission._id, gradingError);
        });

      } catch (gradingError: any) {
        console.error('❌ Error triggering grading:', gradingError);
        // Don't fail the submission if grading fails
      }
    }

    console.log('✅ Assignment submitted successfully for grading');

    res.json({
      success: true,
      message: isAutoSubmit 
        ? 'Assignment auto-submitted successfully and sent for grading' 
        : 'Assignment submitted successfully and sent for grading',
      data: {
        submission,
        gradingTriggered: assignment.hasQuestions
      }
    });

  } catch (error: any) {
    console.error('❌ Error submitting assignment:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to submit assignment'
    });
  }
};

// Get school homework submissions by course
export const getCourseSchoolHomeworkSubmissions = async (req: AuthRequest, res: Response) => {
  try {
    const { courseId } = req.params;

    // Get all school homework submissions for the course
    const submissions = await AssignmentSubmission.find({
      assignment: 'school-homework'
    })
    .populate('student', 'firstName lastName email _id')
    .sort({ submittedAt: -1 });

    res.json({
      success: true,
      data: submissions
    });
  } catch (error: any) {
    console.error('Error fetching school homework submissions:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch school homework submissions'
    });
  }
};