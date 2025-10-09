import express from 'express';
import { 
  processDocument, 
  getProcessingStats, 
  testDocumentProcessing,
  uploadDocument 
} from '../controllers/documentProcessorController';
import { auth } from '../middleware/auth';
import { requireRole } from '../middleware/requireRole';

const router = express.Router();

// @desc    Process document and create structured notes
// @route   POST /api/documents/process
// @access  Private (Teacher/Admin)
router.post('/process', auth, requireRole(['teacher', 'admin']), uploadDocument, processDocument);

// @desc    Get processing statistics
// @route   GET /api/documents/processing-stats
// @access  Private (Teacher/Admin)
router.get('/processing-stats', auth, requireRole(['teacher', 'admin']), getProcessingStats);

// @desc    Test document processing (for development)
// @route   POST /api/documents/test-process
// @access  Private (Admin only)
router.post('/test-process', auth, requireRole(['admin']), uploadDocument, testDocumentProcessing);

export default router;
