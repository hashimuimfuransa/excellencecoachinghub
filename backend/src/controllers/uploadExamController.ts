import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { Assignment } from '../models/Assignment';
import { Assessment } from '../models/Assessment';
import cloudinary from '../config/cloudinary';
import { DocumentProcessorService } from '../services/documentProcessorService';
import { AppError } from '../middleware/errorHandler';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

export const uploadExam = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { courseId, itemId, type } = req.body;
    const file = req.file;

    if (!file) {
      throw new AppError('No file uploaded', 400);
    }

    if (!courseId || !itemId || !type) {
      throw new AppError('Missing required fields: courseId, itemId, type', 400);
    }

    if (!['assignment', 'assessment'].includes(type)) {
      throw new AppError('Invalid type. Must be "assignment" or "assessment"', 400);
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new AppError('Invalid file type. Only PDF and Word documents are allowed', 400);
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new AppError('File size too large. Maximum size is 10MB', 400);
    }

    console.log(`📤 Uploading exam file for ${type}:`, {
      itemId,
      courseId,
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype
    });

    // Upload file to Cloudinary
    const uploadResult = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader.upload_stream({
        folder: `${type}s/${courseId}`,
        resource_type: 'auto',
        public_id: `${Date.now()}-${file.originalname.split('.')[0]}`
      }, (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }).end(file.buffer);
    });
    
    console.log('✅ File uploaded to Cloudinary:', {
      publicId: uploadResult.public_id,
      url: uploadResult.secure_url
    });

    // Process document to extract questions
    console.log('🔍 Processing document for question extraction...');
    const documentProcessor = DocumentProcessorService.getInstance();
    
    const processedData = await documentProcessor.processDocument(
      file.buffer,
      file.originalname,
      file.mimetype
    );

    console.log('✅ Document processed successfully:', {
      success: processedData.success,
      hasExtractedText: !!processedData.extractedText,
      hasStructuredNotes: !!processedData.structuredNotes
    });

    // Update the assignment or assessment with uploaded file info
    let updatedItem;
    
    if (type === 'assignment') {
      const assignment = await Assignment.findById(itemId);
      if (!assignment) {
        throw new AppError('Assignment not found', 404);
      }

      // Check if user owns this assignment
      if (assignment.instructor.toString() !== req.user?.id) {
        throw new AppError('Not authorized to upload files for this assignment', 403);
      }

      // Update assignment with file info and extracted content
      assignment.assignmentDocument = {
        filename: uploadResult.public_id,
        originalName: file.originalname,
        fileUrl: uploadResult.secure_url,
        fileSize: file.size,
        uploadedAt: new Date()
      };

      // Store extracted content as notes/questions
      if (processedData.success && processedData.extractedText) {
        assignment.hasQuestions = true;
        assignment.aiProcessingStatus = 'completed';
        assignment.extractedQuestions = [{
          question: processedData.extractedText,
          type: 'essay' as const,
          points: 100,
          aiExtracted: true
        }];
      } else {
        assignment.aiProcessingStatus = 'no_questions_found';
      }

      updatedItem = await assignment.save();
      
    } else if (type === 'assessment') {
      const assessment = await Assessment.findById(itemId);
      if (!assessment) {
        throw new AppError('Assessment not found', 404);
      }

      // Check if user owns this assessment
      if (assessment.instructor.toString() !== req.user?.id) {
        throw new AppError('Not authorized to upload files for this assessment', 403);
      }

      // Store extracted content in assessment
      if (processedData.success && processedData.extractedText) {
        // For now, store the extracted content as a single question
        assessment.questions = [{
          id: 'extracted-content',
          type: 'essay',
          question: processedData.extractedText,
          points: 100
        }];
        assessment.totalPoints = 100;
      }

      // Store document info
      assessment.documentUrl = uploadResult.secure_url;
      assessment.attachments = assessment.attachments || [];
      assessment.attachments.push({
        filename: uploadResult.public_id,
        originalName: file.originalname,
        fileUrl: uploadResult.secure_url,
        fileSize: file.size,
        uploadedAt: new Date()
      });

      updatedItem = await assessment.save();
    }

    console.log('✅ Exam upload completed successfully:', {
      type,
      itemId,
      contentExtracted: !!processedData.extractedText,
      fileUrl: uploadResult.secure_url
    });

    res.status(200).json({
      success: true,
      message: 'Exam file uploaded and processed successfully',
      data: {
        itemId: updatedItem._id,
        fileName: file.originalname,
        fileUrl: uploadResult.secure_url,
        fileSize: file.size,
        contentExtracted: !!processedData.extractedText,
        hasQuestions: !!processedData.extractedText,
        uploadedAt: new Date(),
        type: type
      }
    });

  } catch (error: any) {
    console.error('❌ Error uploading exam file:', error);
    
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload exam file'
    });
  }
});
