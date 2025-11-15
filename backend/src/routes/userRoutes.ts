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
  getUserStatsById,
  bulkUpdateUsers,
  resetUserPassword,
  getTeacherStats,
  getAllTeachers,
  getTeacherDetails,
  getCurrentProfile,
  getUserProfile,
  updateProfile,
  changePassword,
  uploadAvatar,
  getPrivacySettings,
  updatePrivacySettings
} from '../controllers/userController';
import { protect } from '../middleware/auth';
import { requireAdmin } from '../middleware/roleAuth';
import { validateRequest } from '../middleware/validateRequest';
import { uploadAvatar as multerUpload } from '../config/cloudinary';
import { User } from '../models/User';

const router = Router();

// Public routes (no authentication required)
router.get('/unsubscribe-job-emails/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Update user to disable email notifications
    const user = await User.findByIdAndUpdate(
      userId,
      { emailNotifications: false },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Send a simple HTML response
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Unsubscribed - ExJobNet</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; text-align: center; }
          .container { background-color: #f8f9fa; padding: 40px; border-radius: 10px; }
          .success { color: #28a745; font-size: 24px; margin-bottom: 20px; }
          .message { color: #666; font-size: 16px; line-height: 1.6; }
          .button { display: inline-block; background-color: #1976d2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="success">✅ Successfully Unsubscribed</div>
          <div class="message">
            <p>You have been unsubscribed from job recommendation emails.</p>
            <p>You can re-enable email notifications anytime by logging into your account and updating your preferences.</p>
          </div>
          <a href="${process.env.JOB_PORTAL_URL || 'https://exjobnet.com'}" class="button">Return to ExJobNet</a>
        </div>
      </body>
      </html>
    `;

    res.send(html);
  } catch (error) {
    console.error('Error unsubscribing user from job emails:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// All routes below require authentication
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

// @desc    Search users
// @route   GET /api/users/search
// @access  Private
router.get('/search', async (req, res) => {
  try {
    const { q: query, page = 1, limit = 20 } = req.query;
    
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }

    const searchQuery = query.trim();
    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 20;
    const skip = (pageNum - 1) * limitNum;

    // Search users by name, email, company, job title, skills, location
    const users = await User.find({
      $and: [
        { _id: { $ne: req.user?._id } }, // Exclude current user
        {
          $or: [
            { firstName: { $regex: searchQuery, $options: 'i' } },
            { lastName: { $regex: searchQuery, $options: 'i' } },
            { email: { $regex: searchQuery, $options: 'i' } },
            { company: { $regex: searchQuery, $options: 'i' } },
            { jobTitle: { $regex: searchQuery, $options: 'i' } },
            { location: { $regex: searchQuery, $options: 'i' } },
            { skills: { $regex: searchQuery, $options: 'i' } },
            { bio: { $regex: searchQuery, $options: 'i' } }
          ]
        }
      ]
    })
    .select('firstName lastName email profilePicture company jobTitle location skills bio createdAt')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);

    // Get total count for pagination
    const total = await User.countDocuments({
      $and: [
        { _id: { $ne: req.user?._id } },
        {
          $or: [
            { firstName: { $regex: searchQuery, $options: 'i' } },
            { lastName: { $regex: searchQuery, $options: 'i' } },
            { email: { $regex: searchQuery, $options: 'i' } },
            { company: { $regex: searchQuery, $options: 'i' } },
            { jobTitle: { $regex: searchQuery, $options: 'i' } },
            { location: { $regex: searchQuery, $options: 'i' } },
            { skills: { $regex: searchQuery, $options: 'i' } },
            { bio: { $regex: searchQuery, $options: 'i' } }
          ]
        }
      ]
    });

    res.status(200).json({
      success: true,
      data: users,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search users'
    });
  }
});

// Profile routes (authenticated users can access their own profile)
router.get('/profile', getCurrentProfile);
router.put('/profile', updateProfileValidation, validateRequest, updateProfile);
router.put('/change-password', changePasswordValidation, validateRequest, changePassword);
router.post('/upload-avatar', multerUpload.single('avatar'), uploadAvatar);

// Profile routes with user ID parameter (for viewing other users in social network)
router.get('/:id/profile', getUserProfile);
router.put('/:id/profile', updateProfileValidation, validateRequest, updateProfile);
router.post('/:id/profile-picture', multerUpload.single('profilePicture'), uploadAvatar);

// Individual user stats and privacy settings routes
router.get('/:id/stats', getUserStatsById);
router.get('/:id/privacy-settings', getPrivacySettings);
router.put('/:id/privacy-settings', updatePrivacySettings);

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
