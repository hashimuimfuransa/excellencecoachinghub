import express from 'express';
import multer from 'multer';
import { protect } from '../middleware/auth';
import { uploadDocumentToCloudinary, uploadToCloudinary } from '../config/cloudinary';
import { User } from '../models/User';
import { profileCompletionService } from '../services/profileCompletionService';

const router = express.Router();

// Configure multer for document uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow document types
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'image/jpeg',
      'image/png',
      'image/jpg'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, DOC, DOCX, TXT, JPG, and PNG files are allowed!'));
    }
  },
});

// @desc    Upload CV/Resume/Portfolio files
// @route   POST /api/upload/documents
// @access  Private
router.post('/documents', protect, upload.array('files', 10), async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const files = req.files as Express.Multer.File[];
    
    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No files uploaded'
      });
    }

    const uploadPromises = files.map(async (file) => {
      const folder = `excellence-coaching-hub/documents/${userId}`;
      const result = await uploadDocumentToCloudinary(
        file.buffer,
        userId,
        file.originalname,
        folder
      );
      
      return {
        originalName: file.originalname,
        url: result.url,
        publicId: result.publicId,
        size: result.size,
        type: file.mimetype
      };
    });

    const uploadedFiles = await Promise.all(uploadPromises);

    // Update user profile with portfolio files
    const user = await User.findById(userId);
    let completionResult = null;
    
    if (user) {
      const existingPortfolioFiles = user.portfolioFiles || [];
      const newPortfolioFiles = uploadedFiles.map(file => file.url);
      
      const updatedUser = await User.findByIdAndUpdate(userId, {
        portfolioFiles: [...existingPortfolioFiles, ...newPortfolioFiles],
        lastProfileUpdate: new Date().toISOString()
      }, { new: true });

      // Calculate and update profile completion
      if (updatedUser) {
        completionResult = await profileCompletionService.updateProfileCompletion(updatedUser);
      }
    }

    res.status(200).json({
      success: true,
      data: {
        files: uploadedFiles,
        profileCompletion: completionResult
      },
      message: 'Documents uploaded successfully and profile updated'
    });
  } catch (error: any) {
    console.error('Document upload error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to upload documents'
    });
  }
});

// @desc    Upload single CV file
// @route   POST /api/upload/cv
// @access  Private
router.post('/cv', protect, upload.single('cv'), async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({
        success: false,
        error: 'No CV file uploaded'
      });
    }

    const folder = `excellence-coaching-hub/documents/${userId}/cv`;
    const result = await uploadDocumentToCloudinary(
      file.buffer,
      userId,
      file.originalname,
      folder
    );

    // Update user profile with CV URL
    const updatedUser = await User.findByIdAndUpdate(userId, {
      cvFile: result.url,
      resume: result.url, // Also update the general resume field
      lastProfileUpdate: new Date().toISOString()
    }, { new: true });

    // Calculate and update profile completion
    let completionResult = null;
    if (updatedUser) {
      completionResult = await profileCompletionService.updateProfileCompletion(updatedUser);
    }

    res.status(200).json({
      success: true,
      data: {
        cv: {
          originalName: file.originalname,
          url: result.url,
          publicId: result.publicId,
          size: result.size,
          type: file.mimetype
        },
        profileCompletion: completionResult
      },
      message: 'CV uploaded successfully and profile updated'
    });
  } catch (error: any) {
    console.error('CV upload error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to upload CV'
    });
  }
});

// @desc    Upload single resume file
// @route   POST /api/upload/resume
// @access  Private
router.post('/resume', protect, upload.single('resume'), async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({
        success: false,
        error: 'No resume file uploaded'
      });
    }

    const folder = `excellence-coaching-hub/documents/${userId}/resume`;
    const result = await uploadDocumentToCloudinary(
      file.buffer,
      userId,
      file.originalname,
      folder
    );

    // Update user profile with resume URL
    const updatedUser = await User.findByIdAndUpdate(userId, {
      resumeFile: result.url,
      resume: result.url, // Also update the general resume field
      lastProfileUpdate: new Date().toISOString()
    }, { new: true });

    // Calculate and update profile completion
    let completionResult = null;
    if (updatedUser) {
      completionResult = await profileCompletionService.updateProfileCompletion(updatedUser);
    }

    res.status(200).json({
      success: true,
      data: {
        resume: {
          originalName: file.originalname,
          url: result.url,
          publicId: result.publicId,
          size: result.size,
          type: file.mimetype
        },
        profileCompletion: completionResult
      },
      message: 'Resume uploaded successfully and profile updated'
    });
  } catch (error: any) {
    console.error('Resume upload error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to upload resume'
    });
  }
});

// @desc    Upload profile picture
// @route   POST /api/upload/profile-picture
// @access  Private
router.post('/profile-picture', protect, upload.single('profilePicture'), async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({
        success: false,
        error: 'No profile picture uploaded'
      });
    }

    // Check if it's an image file
    if (!file.mimetype.startsWith('image/')) {
      return res.status(400).json({
        success: false,
        error: 'Only image files are allowed for profile pictures'
      });
    }

    const folder = `excellence-coaching-hub/avatars`;
    const result = await uploadToCloudinary(
      file.buffer,
      userId,
      folder
    );

    // Update user profile with profile picture URL
    const updatedUser = await User.findByIdAndUpdate(userId, {
      profilePicture: result.url,
      avatar: result.url, // Also update the general avatar field
      lastProfileUpdate: new Date().toISOString()
    }, { new: true });

    // Calculate and update profile completion
    let completionResult = null;
    if (updatedUser) {
      completionResult = await profileCompletionService.updateProfileCompletion(updatedUser);
    }

    res.status(200).json({
      success: true,
      data: {
        profilePicture: {
          url: result.url,
          publicId: result.publicId
        },
        profileCompletion: completionResult
      },
      message: 'Profile picture uploaded successfully and profile updated'
    });
  } catch (error: any) {
    console.error('Profile picture upload error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to upload profile picture'
    });
  }
});

// @desc    Get profile completion status
// @route   GET /api/upload/profile-completion
// @access  Private
router.get('/profile-completion', protect, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const completionResult = profileCompletionService.calculateProfileCompletion(user);
    const nextSteps = profileCompletionService.getNextSteps(completionResult);

    res.status(200).json({
      success: true,
      data: {
        ...completionResult,
        nextSteps
      }
    });
  } catch (error: any) {
    console.error('Profile completion check error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get profile completion status'
    });
  }
});

export default router;