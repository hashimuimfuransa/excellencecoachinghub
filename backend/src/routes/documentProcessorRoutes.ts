import express from 'express';
import { 
  processDocument, 
  getProcessingStats, 
  testDocumentProcessing,
  uploadDocument,
  extractText,
  processExamDocument
} from '../controllers/documentProcessorController';
import { auth } from '../middleware/auth';
import { requireRole } from '../middleware/requireRole';

const router = express.Router();

// @desc    Process document and create structured notes
// @route   POST /api/documents/process
// @access  Private (Teacher/Admin)
router.post('/process', auth, requireRole(['teacher', 'admin']), uploadDocument.single('file'), processDocument);

// @desc    Process exam document and extract questions
// @route   POST /api/documents/process-exam
// @access  Private (Teacher/Admin)
router.post('/process-exam', auth, requireRole(['teacher', 'admin']), processExamDocument);

// @desc    Get processing statistics
// @route   GET /api/documents/processing-stats
// @access  Private (Teacher/Admin)
router.get('/processing-stats', auth, requireRole(['teacher', 'admin']), getProcessingStats);

// @desc    Test document processing (for development)
// @route   POST /api/documents/test-process
// @access  Private (Admin only)
router.post('/test-process', auth, requireRole(['admin']), uploadDocument.single('file'), testDocumentProcessing);

// @desc    Extract text from document (for past papers)
// @route   POST /api/documents/extract-text
// @access  Private (Super Admin only)
router.post('/extract-text', auth, requireRole(['super_admin']), extractText);

export default router;
