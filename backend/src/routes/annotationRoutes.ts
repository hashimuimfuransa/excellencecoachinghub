import { Router } from 'express';
import { body } from 'express-validator';
import {
  saveAnnotation,
  getAnnotations,
  deleteAnnotation,
  updateAnnotation
} from '../controllers/annotationController';
import { protect } from '../middleware/auth';
import { validateRequest } from '../middleware/validateRequest';

const router = Router();

// Apply authentication to all annotation routes
router.use(protect);

// Validation middleware
const annotationValidation = [
  body('documentId').notEmpty().withMessage('Document ID is required'),
  body('materialId').notEmpty().withMessage('Material ID is required'),
  body('weekId').notEmpty().withMessage('Week ID is required'),
  body('annotation').isObject().withMessage('Annotation data is required'),
  validateRequest
];

const updateAnnotationValidation = [
  body('annotation').isObject().withMessage('Annotation data is required'),
  validateRequest
];

// Routes
router.post('/', annotationValidation, saveAnnotation);
router.get('/:documentId', getAnnotations);
router.put('/:annotationId', updateAnnotationValidation, updateAnnotation);
router.delete('/:annotationId', deleteAnnotation);

export default router;
