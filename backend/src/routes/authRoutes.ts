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
import { UserRole } from '../types';

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
  body('identifier')
    .notEmpty()
    .withMessage('Email or phone number is required')
    .custom((value: string) => {
      // Check if it's a valid email or phone number
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
      
      if (!emailRegex.test(value) && !phoneRegex.test(value)) {
        throw new Error('Please provide a valid email or phone number');
      }
      return true;
    }),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 0, max: 50 })
    .withMessage('Last name must be between 0 and 50 characters'),
  body('role')
    .optional()
    .isIn(['admin', 'teacher', 'student', 'professional', 'employer', 'parent'])
    .withMessage('Role must be admin, teacher, student, professional, employer, or parent'),
  body('platform')
    .optional()
    .isIn(['homepage', 'job-portal', 'elearning'])
    .withMessage('Platform must be homepage, job-portal, or elearning')
];

const loginValidation = [
  body('identifier')
    .notEmpty()
    .withMessage('Email or phone number is required')
    .custom((value: string) => {
      // Check if it's a valid email or phone number
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
      
      if (!emailRegex.test(value) && !phoneRegex.test(value)) {
        throw new Error('Please provide a valid email or phone number');
      }
      return true;
    }),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

const forgotPasswordValidation = [
  body('email')
    .optional() // Make email optional
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('identifier')
    .optional() // Add identifier field as alternative
    .custom((value: string) => {
      // Check if it's a valid email or phone number
      if (value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
        
        if (!emailRegex.test(value) && !phoneRegex.test(value)) {
          throw new Error('Please provide a valid email or phone number');
        }
      }
      return true;
    })
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
    .isIn(Object.values(UserRole) as string[])
    .withMessage('Role must be a valid user role'),
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
