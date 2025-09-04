import { Router } from 'express';
import { body } from 'express-validator';
import {
  getAllUsers,
  getAllJobSeekers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getUserStats,
  bulkUpdateUsers,
  resetUserPassword,
  getTeacherStats,
  getAllTeachers,
  getTeacherDetails,
  getCurrentProfile,
  getUserProfile,
  updateProfile,
  changePassword,
  uploadAvatar
} from '../controllers/userController';
import { protect } from '../middleware/auth';
import { requireAdmin } from '../middleware/roleAuth';
import { validateRequest } from '../middleware/validateRequest';
import { uploadAvatar as multerUpload } from '../config/cloudinary';

const router = Router();

// All routes require authentication
router.use(protect);

// Validation schemas
const createUserValidation = [
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ max: 50 })
    .withMessage('First name cannot exceed 50 characters'),
  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ max: 50 })
    .withMessage('Last name cannot exceed 50 characters'),
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  body('role')
    .optional()
    .isIn(['admin', 'teacher', 'student'])
    .withMessage('Role must be admin, teacher, or student')
];

const updateUserValidation = [
  body('firstName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('First name cannot be empty')
    .isLength({ max: 50 })
    .withMessage('First name cannot exceed 50 characters'),
  body('lastName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Last name cannot be empty')
    .isLength({ max: 50 })
    .withMessage('Last name cannot exceed 50 characters'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('role')
    .optional()
    .isIn(['admin', 'teacher', 'student'])
    .withMessage('Role must be admin, teacher, or student'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
  body('isEmailVerified')
    .optional()
    .isBoolean()
    .withMessage('isEmailVerified must be a boolean')
];

const resetPasswordValidation = [
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
];

// Profile validation schemas
const updateProfileValidation = [
  body('firstName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('First name cannot be empty')
    .isLength({ max: 50 })
    .withMessage('First name cannot exceed 50 characters'),
  body('lastName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Last name cannot be empty')
    .isLength({ max: 50 })
    .withMessage('Last name cannot exceed 50 characters'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('avatar')
    .optional()
    .custom((value) => {
      // Allow null, undefined, or empty string
      if (value === null || value === undefined || value === '') {
        return true;
      }
      // If value is provided, it must be a valid URL
      if (typeof value === 'string' && value.length > 0) {
        const urlRegex = /^https?:\/\/.+/;
        if (!urlRegex.test(value)) {
          throw new Error('Avatar must be a valid URL');
        }
      }
      return true;
    })
];

const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Password confirmation does not match new password');
      }
      return true;
    })
];

// Profile routes (authenticated users can access their own profile)
router.get('/profile', getCurrentProfile);
router.put('/profile', updateProfileValidation, validateRequest, updateProfile);
router.put('/change-password', changePasswordValidation, validateRequest, changePassword);
router.post('/upload-avatar', multerUpload.single('avatar'), uploadAvatar);

// Profile routes with user ID parameter (for viewing other users in social network)
router.get('/:id/profile', getUserProfile);
router.put('/:id/profile', updateProfileValidation, validateRequest, updateProfile);
router.post('/:id/profile-picture', multerUpload.single('profilePicture'), uploadAvatar);

// Debug route to check user data in database (remove in production)
router.get('/debug/user-data', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { User } = await import('../models/User');
    
    // Get user with all fields except sensitive ones
    const userWithAllFields = await User.findById(req.user._id)
      .select('-password -emailVerificationToken -passwordResetToken -loginAttempts -lockUntil');
    
    // Get user with explicit email selection
    const userWithExplicitEmail = await User.findById(req.user._id)
      .select('firstName lastName email phone location');
    
    // Get raw user data
    const rawUser = await User.findById(req.user._id);

    res.json({
      debug: 'User data from database',
      userId: req.user._id,
      userWithAllFields: {
        id: userWithAllFields?._id,
        firstName: userWithAllFields?.firstName,
        lastName: userWithAllFields?.lastName,
        email: userWithAllFields?.email,
        phone: userWithAllFields?.phone,
        hasEmail: !!userWithAllFields?.email,
        emailLength: userWithAllFields?.email ? userWithAllFields.email.length : 0
      },
      userWithExplicitEmail: {
        id: userWithExplicitEmail?._id,
        firstName: userWithExplicitEmail?.firstName,
        lastName: userWithExplicitEmail?.lastName,
        email: userWithExplicitEmail?.email,
        phone: userWithExplicitEmail?.phone,
        hasEmail: !!userWithExplicitEmail?.email,
        emailLength: userWithExplicitEmail?.email ? userWithExplicitEmail.email.length : 0
      },
      rawUser: {
        id: rawUser?._id,
        firstName: rawUser?.firstName,
        lastName: rawUser?.lastName,
        email: rawUser?.email,
        phone: rawUser?.phone,
        hasEmail: !!rawUser?.email,
        emailLength: rawUser?.email ? rawUser.email.length : 0,
        isEmailVerified: rawUser?.isEmailVerified
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Database query failed', details: error.message });
  }
});

// Debug route to check environment variables (remove in production)
router.get('/debug/env', (req, res) => {
  res.json({
    cloudinary_configured: {
      cloud_name: !!process.env.CLOUDINARY_CLOUD_NAME,
      api_key: !!process.env.CLOUDINARY_API_KEY,
      api_secret: !!process.env.CLOUDINARY_API_SECRET,
    },
    values: {
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME ? 'SET' : 'NOT SET',
      api_key: process.env.CLOUDINARY_API_KEY ? 'SET' : 'NOT SET',
      api_secret: process.env.CLOUDINARY_API_SECRET ? 'SET' : 'NOT SET',
    }
  });
});

// Admin-only routes
router.get('/', requireAdmin, getAllUsers);
router.get('/job-seekers', requireAdmin, getAllJobSeekers);
router.get('/stats', requireAdmin, getUserStats);
router.get('/teachers', requireAdmin, getAllTeachers);
router.get('/teacher-stats', requireAdmin, getTeacherStats);
router.post('/', requireAdmin, createUserValidation, validateRequest, createUser);
router.get('/:id', requireAdmin, getUserById);
router.get('/:id/teacher-details', requireAdmin, getTeacherDetails);
router.put('/:id', requireAdmin, updateUserValidation, validateRequest, updateUser);
router.delete('/:id', requireAdmin, deleteUser);
router.put('/:id/reset-password', requireAdmin, resetPasswordValidation, validateRequest, resetUserPassword);
router.put('/bulk-update', requireAdmin, bulkUpdateUsers);

export default router;
