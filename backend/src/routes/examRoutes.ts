import express from 'express';
import multer from 'multer';
import { processExamDocument, getExamProcessingStats } from '../controllers/examProcessorController';
import { auth } from '../middleware/auth';
import { requireRole } from '../middleware/requireRole';
import { UserRole } from '../../../shared/types';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow PDF, DOC, DOCX files
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, DOC, and DOCX files are allowed'));
    }
  }
});

// Process exam document and extract questions
router.post('/process', auth, requireRole([UserRole.TEACHER, UserRole.ADMIN]), upload.single('file'), processExamDocument);

// Get exam processing statistics
router.get('/stats', auth, requireRole([UserRole.ADMIN]), getExamProcessingStats);

export default router;
