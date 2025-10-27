import { Router } from 'express';
import { body } from 'express-validator';
import {
  register,
  login,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
  testEmail,
  googleAuth,
  googleExchangeCode,
  googleCompleteRegistration,
  updateProfile
} from '../controllers/authController';
import { protect } from '../middleware/auth';
import { validateRequest } from '../middleware/validateRequest';

const router = Router();

// Validation rules
// Custom password validator with detailed missing requirements
const passwordValidator = (value: string) => {
  const missing = [];
  
  if (!/(?=.*[a-z])/.test(value)) {
    missing.push('lowercase letter');
  }
  if (!/(?=.*[A-Z])/.test(value)) {
    missing.push('uppercase letter');
  }
  if (!/(?=.*\d)/.test(value)) {
    missing.push('number');
  }
  
  if (missing.length > 0) {
    throw new Error(`Password is missing: ${missing.join(', ')}`);
  }
  
  return true;
};

const registerValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .custom(passwordValidator),
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('role')
    .optional()
    .isIn(['admin', 'teacher', 'student', 'professional', 'employer'])
    .withMessage('Role must be admin, teacher, student, professional, or employer'),
  body('platform')
    .optional()
    .isIn(['homepage', 'job-portal', 'elearning'])
    .withMessage('Platform must be homepage, job-portal, or elearning')
];

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

const forgotPasswordValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email')
];

const resetPasswordValidation = [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .custom(passwordValidator)
];

const googleRegistrationValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('firstName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name must be between 1 and 50 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name must be between 1 and 50 characters'),
  body('role')
    .isIn(['student', 'teacher', 'admin'])
    .withMessage('Role must be student, teacher, or admin'),
  body('googleId')
    .notEmpty()
    .withMessage('Google ID is required'),
  body('profilePicture')
    .optional()
    .isURL()
    .withMessage('Profile picture must be a valid URL'),
  body('platform')
    .optional()
    .isIn(['homepage', 'job-portal', 'elearning'])
    .withMessage('Platform must be homepage, job-portal, or elearning')
];

// Routes
router.post('/register', registerValidation, validateRequest, register);
router.post('/login', loginValidation, validateRequest, login);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.post('/forgot-password', forgotPasswordValidation, validateRequest, forgotPassword);
router.post('/reset-password', resetPasswordValidation, validateRequest, resetPassword);
router.post('/google', googleAuth); // Main Google OAuth endpoint

router.post('/google/exchange-code', googleExchangeCode); // Validate Google ID token (direct token flow)
router.post('/google/complete-registration', googleRegistrationValidation, validateRequest, googleCompleteRegistration);
router.post('/test-email', testEmail); // Test endpoint for email service
router.post('/update-profile', protect, updateProfile); // Profile update endpoint

export default router;
