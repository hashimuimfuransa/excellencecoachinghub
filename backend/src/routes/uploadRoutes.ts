import express from 'express';
import { uploadMaterial, deleteMaterial, uploadSingle } from '../controllers/uploadController';
import { auth } from '../middleware/auth';
import { requireRole } from '../middleware/requireRole';

const router = express.Router();

// Upload material file - reorder middleware to handle file upload before auth
router.post('/material', uploadSingle, auth, requireRole(['teacher', 'admin']), uploadMaterial);

// Delete material file
router.delete('/material/:publicId', auth, requireRole(['teacher', 'admin']), deleteMaterial);

export default router;