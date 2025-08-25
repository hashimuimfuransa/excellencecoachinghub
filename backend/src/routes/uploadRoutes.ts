import express from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { protect } from '../middleware/auth';
import { uploadDocumentToCloudinary, uploadToCloudinary } from '../config/cloudinary';
import { User } from '../models/User';
import { profileCompletionService } from '../services/profileCompletionService';

// Simple middleware to set response headers
const setResponseHeaders = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
};

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

// Test endpoint to debug empty responses
router.post('/cv-test', protect, (req, res) => {
  console.log('🧪 CV test endpoint hit');
  try {
    res.status(200).json({
      success: true,
      message: 'Test endpoint working',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Test endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Test failed'
    });
  }
});

// Minimal CV upload that stores file locally (temporary solution)
router.post('/cv-simple', protect, upload.single('cv'), (req, res) => {
  console.log('🔧 Simple CV upload endpoint hit');
  
  try {
    const userId = (req as any).user.id;
    const file = req.file;
    
    console.log('User ID:', userId);
    console.log('File received:', !!file);
    
    if (!file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    console.log('File details:', {
      name: file.originalname,
      size: file.size,
      mimetype: file.mimetype
    });

    // For now, just return success without actually storing
    // This will help us identify if the issue is with Cloudinary or response handling
    const mockUrl = `https://temp-storage.com/cv/${userId}/${file.originalname}`;
    
    res.status(200).json({
      success: true,
      data: {
        url: mockUrl,
        originalName: file.originalname,
        size: file.size
      },
      message: 'File received successfully (test mode)'
    });
    
  } catch (error: any) {
    console.error('Simple upload error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Simple upload failed'
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
    
    console.log('📤 CV upload request for user:', userId);
    
    if (!file) {
      console.log('❌ No file provided');
      return res.status(400).json({
        success: false,
        error: 'No CV file uploaded'
      });
    }

    console.log('📄 File details:', { 
      name: file.originalname, 
      size: file.size, 
      type: file.mimetype 
    });

    // Upload to Cloudinary
    console.log('☁️ Starting Cloudinary upload...');
    const folder = `excellence-coaching-hub/documents/${userId}/cv`;
    const uploadResult = await uploadDocumentToCloudinary(
      file.buffer, 
      userId, 
      file.originalname, 
      folder
    );
    
    console.log('✅ Cloudinary upload completed:', uploadResult.url);

    // Update user profile
    console.log('💾 Updating user profile...');
    await User.findByIdAndUpdate(userId, {
      cvFile: uploadResult.url,
      resume: uploadResult.url,
      lastProfileUpdate: new Date().toISOString()
    }, { new: true });
    
    console.log('✅ User profile updated');

    // Send response
    const response = {
      success: true,
      data: {
        url: uploadResult.url,
        originalName: file.originalname,
        size: uploadResult.size || file.size
      },
      message: 'CV uploaded successfully'
    };
    
    console.log('📤 Sending success response');
    res.status(200).json(response);

  } catch (error: any) {
    console.error('❌ CV upload error:', error);
    
    if (!res.headersSent) {
      let errorMessage = 'Failed to upload CV. Please try again.';
      
      if (error.message?.includes('Cloudinary')) {
        errorMessage = 'File upload service temporarily unavailable. Please try again.';
      } else if (error.message?.includes('timeout')) {
        errorMessage = 'Upload timed out. Please try with a smaller file.';
      }
      
      res.status(500).json({
        success: false,
        error: errorMessage
      });
    }
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