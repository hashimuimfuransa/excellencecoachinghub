import express from 'express';
import { auth } from '../middleware/auth';
import {
  getInternships,
  getInternshipsForStudent,
  getCuratedInternships,
  getInternshipById,
  createInternship,
  updateInternship,
  deleteInternship,
  getInternshipsByEmployer,
  getInternshipCategories
} from '../controllers/internshipController';

const router = express.Router();

// Public routes
router.get('/', getInternships);
router.get('/categories', getInternshipCategories);
router.get('/curated', getCuratedInternships);

// Protected routes - must come BEFORE the /:id route to avoid conflicts
router.use(auth); // All routes below require authentication

router.get('/student/available', getInternshipsForStudent);
router.get('/employer/my-internships', getInternshipsByEmployer);

// Routes with parameters - these should come AFTER specific routes
router.get('/:id', getInternshipById);
router.post('/', createInternship);
router.put('/:id', updateInternship);
router.delete('/:id', deleteInternship);

export default router;