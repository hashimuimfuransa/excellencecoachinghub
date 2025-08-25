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

// TEMPORARY: Basic response test endpoint
router.post('/cv-debug', protect, (req, res) => {
  console.log('🔍 Debug endpoint hit');
  res.status(200).json({
    success: true,
    message: 'Debug endpoint working',
    timestamp: new Date().toISOString()
  });
});

// EMERGENCY: No middleware test - raw response
router.post('/cv-raw', (req, res) => {
  console.log('🆘 Raw POST endpoint hit - no middleware');
  try {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      message: 'Raw POST endpoint working - no auth, no multer',
      timestamp: new Date().toISOString()
    }));
  } catch (error) {
    console.error('Raw POST endpoint error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: false,
      error: 'Raw POST endpoint failed'
    }));
  }
});

// TEST: GET endpoint to bypass POST response body stripping
router.get('/cv-test', (req, res) => {
  console.log('🔍 GET test endpoint hit');
  try {
    res.status(200).json({
      success: true,
      message: 'GET endpoint working - proxy allows GET responses',
      timestamp: new Date().toISOString(),
      userAgent: req.headers['user-agent'],
      host: req.headers.host
    });
  } catch (error) {
    console.error('GET test endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'GET test endpoint failed'
    });
  }
});

// WORKAROUND: Use GET with query params for upload status
router.get('/cv-upload-status/:uploadId', (req, res) => {
  console.log('📊 Upload status check for:', req.params.uploadId);
  try {
    res.status(200).json({
      success: true,
      data: {
        url: 'https://test-url.com/test.pdf',
        originalName: 'test.pdf',
        size: 1024,
        uploadId: req.params.uploadId
      },
      message: 'GET-based upload response working'
    });
  } catch (error) {
    console.error('Upload status error:', error);
    res.status(500).json({
      success: false,
      error: 'Upload status failed'
    });
  }
});

// TEMPORARY: No-auth version to test if auth middleware is the problem
router.post('/cv-no-auth', (req, res) => {
  console.log('🔓 CV upload endpoint hit (no auth)');
  
  try {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      data: {
        url: 'https://test-url.com/test.pdf',
        originalName: 'test.pdf',
        size: 1024
      },
      message: 'No-auth test response working'
    }));
    
    console.log('✅ No-auth test response sent successfully');
    
  } catch (error: any) {
    console.error('❌ No-auth response failed:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: false,
      error: 'No-auth test failed'
    }));
  }
});

// @desc    Upload single CV file (step-by-step debugging)
// @route   POST /api/upload/cv
// @access  Private
router.post('/cv', protect, (req, res) => {
  console.log('🚀 CV upload endpoint hit');
  
  // Force response within 5 seconds to prevent hanging
  const forceResponse = setTimeout(() => {
    if (!res.headersSent) {
      console.error('⏰ FORCE TIMEOUT - Sending emergency response');
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: 'Server processing timeout'
      }));
    }
  }, 5000);

  try {
    // Step 1: Test basic response without file processing
    console.log('📤 Step 1: Basic response test');
    
    // Clear the force timeout
    clearTimeout(forceResponse);
    
    // Use res.writeHead + res.end instead of res.json to bypass any middleware
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      data: {
        url: 'https://test-url.com/test.pdf',
        originalName: 'test.pdf',
        size: 1024
      },
      message: 'Raw HTTP response test - bypassing Express JSON middleware'
    }));
    
    console.log('✅ Raw HTTP test response sent successfully');
    
  } catch (error: any) {
    clearTimeout(forceResponse);
    console.error('❌ Raw HTTP response failed:', error);
    
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: 'Raw HTTP test failed'
      }));
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