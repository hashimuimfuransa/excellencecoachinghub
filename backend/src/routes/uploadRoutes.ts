import express from 'express';
import multer from 'multer';
import { protect } from '../middleware/auth';
import { uploadDocumentToCloudinary, uploadToCloudinary } from '../config/cloudinary';
import { User } from '../models/User';
import { profileCompletionService } from '../services/profileCompletionService';

// Middleware to ensure proper response headers and prevent empty responses
const ensureResponseHeaders = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  // Set response headers to prevent caching and ensure proper content type
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Override the end method to ensure we never send empty responses
  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: BufferEncoding | (() => void), callback?: () => void) {
    // If no chunk is provided or chunk is empty, send error
    if (!chunk || (typeof chunk === 'string' && chunk.trim() === '')) {
      console.error('⚠️ Attempted to send empty response - preventing this');
      
      if (!res.headersSent) {
        return originalEnd.call(this, JSON.stringify({
          success: false,
          error: 'Internal server error - empty response detected'
        }), encoding as BufferEncoding, callback as (() => void));
      }
    }
    
    return originalEnd.call(this, chunk, encoding as BufferEncoding, callback as (() => void));
  };
  
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

// @desc    Upload single CV file
// @route   POST /api/upload/cv
// @access  Private
router.post('/cv', protect, ensureResponseHeaders, upload.single('cv'), async (req, res) => {
  let uploadResult = null;
  let userUpdated = false;
  
  try {
    const userId = (req as any).user.id;
    const file = req.file;
    
    console.log('📂 CV upload request for user:', userId);
    console.log('📄 File details:', { 
      originalName: file?.originalname, 
      mimetype: file?.mimetype, 
      size: file?.size 
    });
    
    if (!file) {
      console.error('❌ No CV file provided in request');
      return res.status(400).json({
        success: false,
        error: 'No CV file uploaded'
      });
    }

    console.log('☁️ Starting Cloudinary upload...');
    const folder = `excellence-coaching-hub/documents/${userId}/cv`;
    
    // Upload to Cloudinary with timeout protection
    uploadResult = await Promise.race([
      uploadDocumentToCloudinary(file.buffer, userId, file.originalname, folder),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Upload timeout')), 120000) // 2 minutes
      )
    ]) as { url: string; publicId: string; size: number };
    
    console.log('✅ Cloudinary upload successful:', uploadResult.url);

    // Update user profile with CV URL - separate try-catch
    console.log('📝 Updating user profile...');
    try {
      const updatedUser = await User.findByIdAndUpdate(userId, {
        cvFile: uploadResult.url,
        resume: uploadResult.url, // Also update the general resume field
        lastProfileUpdate: new Date().toISOString()
      }, { new: true });
      
      if (!updatedUser) {
        throw new Error('User not found during profile update');
      }
      
      userUpdated = true;
      console.log('✅ User profile updated successfully');
      
      // Try profile completion calculation - with error isolation
      let completionResult = null;
      try {
        console.log('📊 Calculating profile completion...');
        completionResult = await profileCompletionService.updateProfileCompletion(updatedUser);
        console.log('✅ Profile completion calculated successfully');
      } catch (completionError: any) {
        console.error('⚠️ Profile completion calculation failed (non-critical):', completionError.message);
        // Don't fail the entire request if profile completion fails
        completionResult = {
          percentage: 0,
          status: 'incomplete',
          message: 'Profile completion calculation temporarily unavailable'
        };
      }
      
      // Always send a successful response if we got this far
      const responseData = {
        success: true,
        data: {
          cv: {
            originalName: file.originalname,
            url: uploadResult.url,
            publicId: uploadResult.publicId,
            size: uploadResult.size,
            type: file.mimetype
          },
          profileCompletion: completionResult
        },
        message: 'CV uploaded successfully and profile updated'
      };
      
      console.log('🚀 Sending success response:', JSON.stringify(responseData, null, 2));
      res.status(200).json(responseData);
      
    } catch (profileError: any) {
      console.error('❌ Profile update failed:', profileError);
      
      // Even if profile update fails, the file was uploaded successfully
      // Let the user know and suggest they refresh
      return res.status(200).json({
        success: true,
        data: {
          cv: {
            originalName: file.originalname,
            url: uploadResult.url,
            publicId: uploadResult.publicId,
            size: uploadResult.size,
            type: file.mimetype
          },
          profileCompletion: null
        },
        message: 'CV uploaded successfully, but profile update encountered an issue. Please refresh your page.',
        warning: 'Profile may need manual refresh to reflect changes'
      });
    }
    
  } catch (error: any) {
    console.error('❌ CV upload error:', error);
    console.error('❌ Error stack:', error.stack);
    
    // Determine the appropriate error response
    let errorMessage = 'Failed to upload CV';
    let statusCode = 500;
    
    if (error.message?.includes('timeout')) {
      errorMessage = 'Upload timed out. Please try again with a smaller file or check your connection.';
      statusCode = 408;
    } else if (error.message?.includes('file type') || error.message?.includes('file size')) {
      errorMessage = error.message;
      statusCode = 400;
    } else if (error.message?.includes('Cloudinary')) {
      errorMessage = 'File storage service temporarily unavailable. Please try again later.';
    }
    
    const errorResponse = {
      success: false,
      error: errorMessage,
      details: {
        uploadCompleted: !!uploadResult,
        profileUpdated: userUpdated,
        originalError: error.message
      }
    };
    
    console.log('💥 Sending error response:', JSON.stringify(errorResponse, null, 2));
    res.status(statusCode).json(errorResponse);
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