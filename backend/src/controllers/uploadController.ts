import { Request, Response } from 'express';
import multer from 'multer';
import { asyncHandler } from '../middleware/asyncHandler';
import { auth } from '../middleware/auth';
import { requireRole } from '../middleware/requireRole';

// Try to import cloudinary, but don't fail if it's not installed
let cloudinary: any = null;
try {
  cloudinary = require('cloudinary');
} catch (error) {
  console.warn('Cloudinary package not installed. Using mock upload service.');
}

// Configure Cloudinary if available
if (cloudinary && process.env.CLOUDINARY_CLOUD_NAME) {
  cloudinary.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow common file types
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'video/mp4',
      'video/avi',
      'video/mov',
      'audio/mp3',
      'audio/wav',
      'audio/m4a',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed'), false);
    }
  },
});

// Upload with retry logic for network issues
const uploadWithRetry = async (fileBuffer: Buffer, options: any, maxRetries: number = 3): Promise<any> => {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Upload attempt ${attempt}/${maxRetries}`);
      
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.v2.uploader.upload_stream(
          options,
          (error: { message: any; }, result: unknown) => {
            if (error) {
              console.error(`❌ Upload attempt ${attempt} failed:`, error.message);
              reject(error);
            } else {
              console.log(`✅ Upload attempt ${attempt} successful`);
              resolve(result);
            }
          }
        );
        
        // Handle stream errors
        uploadStream.on('error', (error: { message: any; }) => {
          console.error(`❌ Stream error on attempt ${attempt}:`, error.message);
          reject(error);
        });
        
        uploadStream.end(fileBuffer);
      });
      
      return result;
      
    } catch (error: any) {
      lastError = error;
      
      // Check if it's a network-related error that we should retry
      const isNetworkError = 
        error.code === 'ECONNRESET' ||
        error.code === 'ECONNREFUSED' ||
        error.code === 'ETIMEDOUT' ||
        error.code === 'ENOTFOUND' ||
        error.message?.includes('ECONNRESET') ||
        error.message?.includes('timeout') ||
        error.message?.includes('network');
      
      if (isNetworkError && attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000); // Exponential backoff, max 10s
        console.log(`⏳ Network error, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      // If it's not a network error or we've exhausted retries, throw
      throw error;
    }
  }
  
  throw lastError;
};

// Upload media file (images and videos)
export const uploadMedia = asyncHandler(async (req: Request, res: Response) => {
  const { title, description, type, courseId, weekId } = req.body;

  console.log('📤 Media upload request received:', {
    user: req.user?.email,
    role: req.user?.role,
    fileName: req.file?.originalname,
    fileSize: req.file?.size,
    mimeType: req.file?.mimetype,
    title,
    description,
    type,
    courseId,
    weekId
  });

  if (!req.file) {
    console.error('❌ No file uploaded');
    return res.status(400).json({
      success: false,
      message: 'No file uploaded'
    });
  }

  // Validate media file types
  const allowedMediaTypes = [
    'video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv', 'video/webm', 'video/mkv',
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'image/webp', 'image/svg+xml'
  ];

  if (!allowedMediaTypes.includes(req.file.mimetype)) {
    return res.status(400).json({
      success: false,
      message: `File type ${req.file.mimetype} is not supported. Please upload video or image files.`
    });
  }

  // Validate file size (500MB for media)
  const maxSize = 500 * 1024 * 1024; // 500MB
  if (req.file.size > maxSize) {
    return res.status(400).json({
      success: false,
      message: `File size exceeds maximum allowed size of 500MB`
    });
  }

  try {
    // If Cloudinary is not available, use mock upload
    if (!cloudinary || !process.env.CLOUDINARY_CLOUD_NAME) {
      console.warn('Cloudinary not configured. Using mock upload service.');
      
      // Create a mock response
      const mockResult = {
        public_id: `mock_media_${Date.now()}_${req.file.originalname}`,
        secure_url: `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`,
        format: req.file.mimetype.split('/')[1] || 'unknown',
        resource_type: req.file.mimetype.startsWith('video/') ? 'video' : 'image',
        bytes: req.file.size,
        width: req.file.mimetype.startsWith('image/') ? 1920 : undefined,
        height: req.file.mimetype.startsWith('image/') ? 1080 : undefined,
        duration: req.file.mimetype.startsWith('video/') ? 60 : undefined
      };

      return res.status(200).json({
        success: true,
        data: {
          url: mockResult.secure_url,
          publicId: mockResult.public_id,
          title: title || req.file.originalname,
          description: description || '',
          type: req.file.mimetype.startsWith('video/') ? 'video' : 'image',
          size: req.file.size,
          format: mockResult.format,
          metadata: {
            width: mockResult.width,
            height: mockResult.height,
            duration: mockResult.duration
          }
        }
      });
    }

    // Upload to Cloudinary
    const folder = `course-media/${courseId || 'general'}`;
    const options = {
      folder,
      resource_type: req.file.mimetype.startsWith('video/') ? 'video' : 'image',
      use_filename: true,
      unique_filename: true,
      overwrite: false,
      transformation: req.file.mimetype.startsWith('image/') ? [
        { quality: 'auto:good' },
        { fetch_format: 'auto' }
      ] : [
        { quality: 'auto:good' },
        { format: 'mp4' }
      ]
    };

    console.log('🔄 Uploading to Cloudinary with options:', options);

    const result = await uploadWithRetry(req.file.buffer, options);

    console.log('✅ Media uploaded successfully:', {
      publicId: result.public_id,
      url: result.secure_url,
      format: result.format,
      size: result.bytes
    });

    res.status(200).json({
      success: true,
      data: {
        url: result.secure_url,
        publicId: result.public_id,
        title: title || req.file.originalname,
        description: description || '',
        type: req.file.mimetype.startsWith('video/') ? 'video' : 'image',
        size: result.bytes,
        format: result.format,
        metadata: {
          width: result.width,
          height: result.height,
          duration: result.duration,
          folder: result.folder
        }
      }
    });

  } catch (error: any) {
    console.error('❌ Media upload error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Media upload failed'
    });
  }
});

// Upload material file
export const uploadMaterial = asyncHandler(async (req: Request, res: Response) => {
  const { folder = 'course-materials' } = req.body;

  console.log('📤 Upload request received:', {
    user: req.user?.email,
    role: req.user?.role,
    fileName: req.file?.originalname,
    fileSize: req.file?.size,
    mimeType: req.file?.mimetype
  });

  if (!req.file) {
    console.error('❌ No file uploaded');
    return res.status(400).json({
      success: false,
      message: 'No file uploaded'
    });
  }

  try {
    // If Cloudinary is not available, use mock upload
    if (!cloudinary || !process.env.CLOUDINARY_CLOUD_NAME) {
      console.warn('Cloudinary not configured. Using mock upload service.');
      
      // Create a mock response
      const mockResult = {
        public_id: `mock_${Date.now()}_${req.file.originalname}`,
        secure_url: `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`,
        format: req.file.mimetype.split('/')[1] || 'unknown',
        resource_type: req.file.mimetype.startsWith('image/') ? 'image' : 
                     req.file.mimetype.startsWith('video/') ? 'video' : 
                     req.file.mimetype.startsWith('audio/') ? 'video' : 'raw',
        bytes: req.file.size,
        width: req.file.mimetype.startsWith('image/') ? 800 : undefined,
        height: req.file.mimetype.startsWith('image/') ? 600 : undefined,
      };

      return res.status(200).json({
        success: true,
        data: mockResult
      });
    }

    // Upload to Cloudinary with retry logic for network issues
    const result = await uploadWithRetry(req.file.buffer, {
      folder: req.user ? `${folder}/${req.user._id}` : folder,
      resource_type: 'auto',
      use_filename: true,
      unique_filename: true,
      // Add timeout and chunk size for better reliability
      timeout: 60000, // 60 seconds timeout
      chunk_size: 2000000, // 2MB chunks
    });

    res.status(200).json({
      success: true,
      data: {
        public_id: result.public_id,
        secure_url: result.secure_url,
        format: result.format,
        resource_type: result.resource_type,
        bytes: result.bytes,
        width: result.width,
        height: result.height,
      }
    });
  } catch (error: any) {
    console.error('❌ Upload error:', {
      message: error.message,
      code: error.code,
      http_code: error.http_code,
      name: error.name,
      user: req.user?.email,
      fileName: req.file?.originalname
    });
    
    // Handle network-related errors
    if (error.code === 'ECONNRESET' || error.message?.includes('ECONNRESET')) {
      return res.status(503).json({
        success: false,
        message: 'Network connection was reset during upload. Please try again.'
      });
    }
    
    if (error.code === 'ETIMEDOUT' || error.message?.includes('timeout')) {
      return res.status(408).json({
        success: false,
        message: 'Upload timed out. Please try again with a smaller file or check your connection.'
      });
    }
    
    if (error.code === 'ECONNREFUSED' || error.message?.includes('ECONNREFUSED')) {
      return res.status(503).json({
        success: false,
        message: 'Unable to connect to upload service. Please try again later.'
      });
    }
    
    // Handle specific Cloudinary errors
    if (error.http_code === 401) {
      return res.status(401).json({
        success: false,
        message: 'Cloudinary authentication failed. Please check your Cloudinary configuration.'
      });
    }
    
    if (error.http_code === 403) {
      return res.status(403).json({
        success: false,
        message: 'Cloudinary access denied. Please check your upload permissions.'
      });
    }
    
    if (error.http_code === 400) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file or upload parameters. Please check your file and try again.'
      });
    }
    
    // Generic error response
    res.status(500).json({
      success: false,
      message: 'Upload failed. Please try again or contact support if the problem persists.'
    });
  }
});

// Delete material file
export const deleteMaterial = asyncHandler(async (req: Request, res: Response) => {
  const { publicId } = req.params;

  try {
    // If Cloudinary is not available, mock delete
    if (!cloudinary || !process.env.CLOUDINARY_CLOUD_NAME) {
      console.warn('Cloudinary not configured. Mock delete operation.');
      return res.status(200).json({
        success: true,
        message: 'File deleted successfully (mock)'
      });
    }

    const result = await cloudinary.v2.uploader.destroy(publicId);
    
    if (result.result === 'ok') {
      res.status(200).json({
        success: true,
        message: 'File deleted successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }
  } catch (error: any) {
    console.error('Delete error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Delete failed'
    });
  }
});

// Middleware for single file upload
export const uploadSingle = upload.single('file');
