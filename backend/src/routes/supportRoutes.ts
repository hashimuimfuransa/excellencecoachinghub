import { Router } from 'express';
import { body } from 'express-validator';
import {
  getAllTickets,
  getAllFeedback,
  updateTicketStatus,
  getSupportStats
} from '../controllers/supportController';
import { protect } from '../middleware/auth';
import { requireAdmin } from '../middleware/roleAuth';
import { validateRequest } from '../middleware/validateRequest';

const router = Router();

// All routes require authentication and admin role
router.use(protect);
router.use(requireAdmin);

// Validation schemas
const updateTicketValidation = [
  body('status')
    .isIn(['open', 'in-progress', 'resolved'])
    .withMessage('Status must be open, in-progress, or resolved'),
  body('response')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Response cannot exceed 2000 characters')
];

// Support routes
router.get('/tickets', getAllTickets);
router.get('/feedback', getAllFeedback);
router.get('/stats', getSupportStats);
router.put('/tickets/:id', updateTicketValidation, validateRequest, updateTicketStatus);

export default router;
