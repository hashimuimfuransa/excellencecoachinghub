import { Request, Response } from 'express';
import multer from 'multer';
import { asyncHandler } from '../middleware/asyncHandler';
import { auth } from '../middleware/auth';
import { requireRole } from '../middleware/requireRole';
import DocumentProcessorService from '../services/documentProcessorService';

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit for documents
  },
  fileFilter: (req, file, cb) => {
    // Allow document types that can be processed
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/markdown',
      'application/rtf'
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Document type not supported for processing'), false);
    }
  },
});

// Middleware for single document upload
export const uploadDocument = upload.single('document');

// @desc    Process document and create structured notes
// @route   POST /api/documents/process
// @access  Private (Teacher/Admin)
export const processDocument = asyncHandler(async (req: Request, res: Response) => {
  const { title, description, courseId, weekId } = req.body;

  console.log('📄 Document processing request:', {
    user: req.user?.email,
    fileName: req.file?.originalname,
    fileSize: req.file?.size,
    mimeType: req.file?.mimetype,
    courseId,
    weekId
  });

  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No document uploaded'
    });
  }

  if (!title) {
    return res.status(400).json({
      success: false,
      message: 'Document title is required'
    });
  }

  try {
    const documentProcessor = DocumentProcessorService.getInstance();
    
    // Process the document
    const result = await documentProcessor.processDocument(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: result.error || 'Document processing failed'
      });
    }

    // Create the material object
    const material = {
      title: title,
      description: description || result.structuredNotes?.summary || 'Processed document',
      type: 'structured_notes',
      content: {
        extractedText: result.extractedText,
        structuredNotes: result.structuredNotes,
        originalFileName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        processedAt: new Date().toISOString(),
        processingTime: result.processingTime
      },
      metadata: {
        courseId,
        weekId,
        uploadedBy: req.user?._id,
        uploadDate: new Date().toISOString(),
        isProcessed: true,
        processingStats: {
          textLength: result.extractedText?.length || 0,
          sectionsCount: result.structuredNotes?.sections.length || 0,
          keyPointsCount: result.structuredNotes?.keyPoints.length || 0,
          estimatedReadingTime: result.structuredNotes?.metadata.estimatedReadingTime || 0
        }
      }
    };

    console.log('✅ Document processed successfully:', {
      title: material.title,
      type: material.type,
      sectionsCount: material.content.structuredNotes?.sections.length,
      processingTime: result.processingTime,
      courseId,
      weekId
    });

    res.status(200).json({
      success: true,
      message: 'Document processed successfully',
      data: {
        material,
        processingStats: {
          processingTime: result.processingTime,
          textLength: result.extractedText?.length,
          sectionsCount: result.structuredNotes?.sections.length,
          keyPointsCount: result.structuredNotes?.keyPoints.length
        }
      }
    });

  } catch (error: any) {
    console.error('❌ Document processing error:', {
      message: error.message,
      user: req.user?.email,
      fileName: req.file?.originalname
    });

    res.status(500).json({
      success: false,
      message: 'Document processing failed. Please try again or contact support.'
    });
  }
});

// @desc    Get processing statistics
// @route   GET /api/documents/processing-stats
// @access  Private (Teacher/Admin)
export const getProcessingStats = asyncHandler(async (req: Request, res: Response) => {
  try {
    const documentProcessor = DocumentProcessorService.getInstance();
    const stats = await documentProcessor.getProcessingStats();

    res.status(200).json({
      success: true,
      data: stats
    });

  } catch (error: any) {
    console.error('Error getting processing stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get processing statistics'
    });
  }
});

// @desc    Test document processing (for development)
// @route   POST /api/documents/test-process
// @access  Private (Admin only)
export const testDocumentProcessing = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No document uploaded for testing'
    });
  }

  try {
    const documentProcessor = DocumentProcessorService.getInstance();
    
    const result = await documentProcessor.processDocument(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );

    res.status(200).json({
      success: true,
      message: 'Test processing completed',
      data: {
        success: result.success,
        extractedTextLength: result.extractedText?.length,
        structuredNotes: result.structuredNotes,
        processingTime: result.processingTime,
        error: result.error
      }
    });

  } catch (error: any) {
    console.error('Test processing error:', error);
    res.status(500).json({
      success: false,
      message: 'Test processing failed',
      error: error.message
    });
  }
});
