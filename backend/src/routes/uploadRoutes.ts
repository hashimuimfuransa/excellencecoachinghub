import express from 'express';
import { uploadMaterial, uploadMedia, deleteMaterial, uploadSingle } from '../controllers/uploadController';
import { uploadExam } from '../controllers/uploadExamController';
import { auth } from '../middleware/auth';
import { requireRole } from '../middleware/requireRole';
import { uploadDocument } from '../controllers/documentProcessorController';
import multer from 'multer';

const router = express.Router();

// Upload material file - reorder middleware to handle file upload before auth
router.post('/material', uploadSingle, auth, requireRole(['teacher', 'admin']), uploadMaterial);

// Upload media file (images and videos) - reorder middleware to handle file upload before auth
router.post('/media', uploadSingle, auth, requireRole(['teacher', 'admin']), uploadMedia);

// Delete material file
router.delete('/material/:publicId', auth, requireRole(['teacher', 'admin']), deleteMaterial);

// Upload exam file for assignments and assessments
router.post('/exam', uploadDocument.single('file'), auth, requireRole(['teacher', 'admin']), uploadExam);



export default router;