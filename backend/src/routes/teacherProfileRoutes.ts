import { Router } from 'express';
import { body } from 'express-validator';
import {
  getMyProfile,
  updateProfile,
  submitForApproval,
  getAllProfiles,
  getProfileById,
  approveProfile,
  rejectProfile,
  getProfileStats
} from '../controllers/teacherProfileController';
import { protect } from '../middleware/auth';
import { authorizeRoles, requireAdmin } from '../middleware/roleAuth';
import { validateRequest } from '../middleware/validateRequest';
import { UserRole } from '../../../shared/types';

const router = Router();

// All routes require authentication
router.use(protect);

// Validation schemas
const updateProfileValidation = [
  body('profilePicture')
    .optional()
    .isString()
    .withMessage('Profile picture must be a string'),
  body('phone')
    .optional({ checkFalsy: true })
    .trim()
    .custom((value) => {
      if (!value) return true; // Allow empty values
      return /^\+?[\d\s\-\(\)]+$/.test(value);
    })
    .withMessage('Please provide a valid phone number'),
  body('dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Date of birth must be a valid date'),
  body('specialization')
    .optional()
    .isArray()
    .withMessage('Specialization must be an array'),
  body('specialization.*')
    .optional({ checkFalsy: true })
    .trim()
    .notEmpty()
    .withMessage('Each specialization must not be empty'),
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Bio cannot exceed 2000 characters'),
  body('experience')
    .optional()
    .isNumeric()
    .withMessage('Experience must be a number')
    .isInt({ min: 0 })
    .withMessage('Experience cannot be negative'),
  body('education')
    .optional()
    .isArray()
    .withMessage('Education must be an array'),
  body('education.*.degree')
    .optional({ checkFalsy: true })
    .trim()
    .notEmpty()
    .withMessage('Degree is required'),
  body('education.*.institution')
    .optional({ checkFalsy: true })
    .trim()
    .notEmpty()
    .withMessage('Institution is required'),
  body('education.*.year')
    .optional({ checkFalsy: true })
    .isNumeric()
    .withMessage('Year must be a number')
    .isInt({ min: 1950, max: new Date().getFullYear() + 10 })
    .withMessage('Year must be between 1950 and current year + 10'),
  body('skills')
    .optional()
    .isArray()
    .withMessage('Skills must be an array'),
  body('languages')
    .optional()
    .isArray()
    .withMessage('Languages must be an array'),
  body('teachingAreas')
    .optional()
    .isArray()
    .withMessage('Teaching areas must be an array'),
  body('teachingAreas.*')
    .optional({ checkFalsy: true })
    .trim()
    .notEmpty()
    .withMessage('Each teaching area must not be empty'),
  body('preferredLevels')
    .optional()
    .isArray()
    .withMessage('Preferred levels must be an array'),
  body('preferredLevels.*')
    .optional()
    .isIn(['Beginner', 'Intermediate', 'Advanced'])
    .withMessage('Each preferred level must be Beginner, Intermediate, or Advanced'),
  body('hourlyRate')
    .optional()
    .isNumeric()
    .withMessage('Hourly rate must be a number')
    .isFloat({ min: 0 })
    .withMessage('Hourly rate cannot be negative'),
  body('address.street')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Street address cannot exceed 200 characters'),
  body('address.city')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('City cannot exceed 100 characters'),
  body('address.state')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('State cannot exceed 100 characters'),
  body('address.country')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Country cannot exceed 100 characters'),
  body('address.zipCode')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('ZIP code cannot exceed 20 characters'),
  body('socialLinks.linkedin')
    .optional({ checkFalsy: true })
    .custom((value) => {
      if (!value) return true;
      return /^https?:\/\/.+/.test(value) || /^linkedin\.com\//.test(value);
    })
    .withMessage('LinkedIn must be a valid URL'),
  body('socialLinks.github')
    .optional({ checkFalsy: true })
    .custom((value) => {
      if (!value) return true;
      return /^https?:\/\/.+/.test(value) || /^github\.com\//.test(value);
    })
    .withMessage('GitHub must be a valid URL'),
  body('socialLinks.portfolio')
    .optional({ checkFalsy: true })
    .custom((value) => {
      if (!value) return true;
      return /^https?:\/\/.+/.test(value);
    })
    .withMessage('Portfolio must be a valid URL'),
  body('socialLinks.website')
    .optional({ checkFalsy: true })
    .custom((value) => {
      if (!value) return true;
      return /^https?:\/\/.+/.test(value);
    })
    .withMessage('Website must be a valid URL')
];

const approveProfileValidation = [
  body('feedback')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Feedback cannot exceed 1000 characters')
];

const rejectProfileValidation = [
  body('reason')
    .trim()
    .notEmpty()
    .withMessage('Rejection reason is required')
    .isLength({ max: 500 })
    .withMessage('Rejection reason cannot exceed 500 characters'),
  body('feedback')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Feedback cannot exceed 1000 characters')
];

// Teacher routes (for teachers to manage their own profile)
router.get('/my-profile', authorizeRoles([UserRole.TEACHER]), getMyProfile);
router.put('/my-profile', authorizeRoles([UserRole.TEACHER]), updateProfileValidation, validateRequest, updateProfile);
router.post('/submit-for-approval', authorizeRoles([UserRole.TEACHER]), submitForApproval);

// Admin routes (for admins to manage all teacher profiles)
router.get('/', requireAdmin, getAllProfiles);
router.get('/stats', requireAdmin, getProfileStats);
router.get('/:id', requireAdmin, getProfileById);
router.put('/:id/approve', requireAdmin, approveProfileValidation, validateRequest, approveProfile);
router.put('/:id/reject', requireAdmin, rejectProfileValidation, validateRequest, rejectProfile);

export default router;
