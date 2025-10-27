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
  getProfileStats,
  uploadCV,
  uploadProfilePicture,
  uploadDiploma,
  uploadCertificate,
  submitProfile,
  downloadDocument
} from '../controllers/teacherProfileController';
import { protect } from '../middleware/auth';
import { authorizeRoles, requireAdmin } from '../middleware/roleAuth';
import { validateRequest } from '../middleware/validateRequest';
import { uploadDocument } from '../config/cloudinary';
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
    .custom((value) => {
      if (!value) return true;
      // Accept both ISO strings and other date formats
      const date = new Date(value);
      return !isNaN(date.getTime());
    })
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
    .custom((value) => {
      if (value === undefined || value === null || value === '') return true;
      const numValue = Number(value);
      return !isNaN(numValue) && numValue >= 0;
    })
    .withMessage('Experience must be a valid number'),
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
    .custom((value) => {
      if (!value) return true;
      const numValue = Number(value);
      return !isNaN(numValue) && numValue >= 1950 && numValue <= new Date().getFullYear() + 10;
    })
    .withMessage('Year must be a valid number between 1950 and current year + 10'),
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
    .custom((value) => {
      if (value === undefined || value === null || value === '') return true;
      const numValue = Number(value);
      return !isNaN(numValue) && numValue >= 0;
    })
    .withMessage('Hourly rate must be a valid number'),
  body('nationalId')
    .optional({ checkFalsy: true })
    .trim()
    .custom((value) => {
      if (!value) return true; // Allow empty values
      return /^\d{16}$/.test(value);
    })
    .withMessage('National ID must be 16 digits'),
  body('paymentType')
    .optional()
    .isIn(['per_hour', 'per_month'])
    .withMessage('Payment type must be per_hour or per_month'),
  body('monthlyRate')
    .optional()
    .custom((value) => {
      if (value === undefined || value === null || value === '') return true;
      const numValue = Number(value);
      return !isNaN(numValue) && numValue >= 0;
    })
    .withMessage('Monthly rate must be a valid number'),
  body('address.province')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Province cannot exceed 100 characters'),
  body('address.district')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('District cannot exceed 100 characters'),
  body('address.sector')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Sector cannot exceed 100 characters'),
  body('address.cell')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Cell cannot exceed 100 characters'),
  body('address.village')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Village cannot exceed 100 characters'),
  body('address.country')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Country cannot exceed 100 characters'),
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
router.post('/upload-cv', authorizeRoles([UserRole.TEACHER]), uploadDocument.single('cv'), uploadCV);
router.post('/upload-profile-picture', authorizeRoles([UserRole.TEACHER]), uploadDocument.single('profilePicture'), uploadProfilePicture);
router.post('/upload-diploma', authorizeRoles([UserRole.TEACHER]), uploadDocument.single('diploma'), uploadDiploma);
router.post('/upload-certificate', authorizeRoles([UserRole.TEACHER]), uploadDocument.single('certificate'), uploadCertificate);
router.post('/submit', authorizeRoles([UserRole.TEACHER]), submitProfile);
router.post('/submit-for-approval', authorizeRoles([UserRole.TEACHER]), submitForApproval);

// Admin routes (for admins to manage all teacher profiles)
router.get('/', requireAdmin, getAllProfiles);
router.get('/stats', requireAdmin, getProfileStats);
router.get('/:id', requireAdmin, getProfileById);
router.get('/:profileId/download/:documentType', requireAdmin, downloadDocument);
router.put('/:id/approve', requireAdmin, approveProfileValidation, validateRequest, approveProfile);
router.put('/:id/reject', requireAdmin, rejectProfileValidation, validateRequest, rejectProfile);

export default router;
