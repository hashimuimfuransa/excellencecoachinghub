import express from 'express';
import {
  getCourseMaterials,
  addCourseMaterial,
  updateCourseMaterial,
  deleteCourseMaterial,
  reorderCourseMaterials,
  upload
} from '../controllers/courseMaterialsController';
import { protect } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Get course materials
router.get('/:courseId/materials', getCourseMaterials);

// Add course material (with file upload)
router.post('/:courseId/materials', upload.single('file'), addCourseMaterial);

// Update course material (with optional file upload)
router.put('/:courseId/materials/:materialId', upload.single('file'), updateCourseMaterial);

// Delete course material
router.delete('/:courseId/materials/:materialId', deleteCourseMaterial);

// Reorder course materials
router.put('/:courseId/materials/reorder', reorderCourseMaterials);

export default router;