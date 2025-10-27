import { v2 as cloudinary } from 'cloudinary';
const multer = require('multer');
import { Request } from 'express';

// Configure Cloudinary with trimmed values
const configureCloudinary = () => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();

  if (!cloudName || !apiKey || !apiSecret) {
    console.log('⚠️ Cloudinary: Environment variables not loaded yet or missing');
    return false;
  }

  console.log('✅ Cloudinary: Configuring with environment variables');
  console.log('Cloud Name:', cloudName);
  console.log('API Key:', apiKey ? `${apiKey.substring(0, 5)}...` : 'NOT SET');
  console.log('API Secret:', apiSecret ? `${apiSecret.substring(0, 5)}...` : 'NOT SET');

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });

  return true;
};

// Initial configuration
const isConfigured = configureCloudinary();
if (!isConfigured) {
  console.warn('⚠️ Cloudinary: Environment variables not loaded yet or missing');
  console.log('☁️ Cloudinary: Not configured (avatar upload disabled)');
}

// Validate Cloudinary configuration
export const validateCloudinaryConfig = (): boolean => {
  // Debug: Log environment variables
  console.log('Environment variables check:');
  console.log('CLOUDINARY_CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME ? 'SET' : 'NOT SET');
  console.log('CLOUDINARY_API_KEY:', process.env.CLOUDINARY_API_KEY ? 'SET' : 'NOT SET');
  console.log('CLOUDINARY_API_SECRET:', process.env.CLOUDINARY_API_SECRET ? 'SET' : 'NOT SET');

  const { cloud_name, api_key, api_secret } = cloudinary.config();

  console.log('Cloudinary config values:');
  console.log('cloud_name:', cloud_name ? 'SET' : 'NOT SET');
  console.log('api_key:', api_key ? 'SET' : 'NOT SET');
  console.log('api_secret:', api_secret ? 'SET' : 'NOT SET');

  const missing = [];
  if (!cloud_name) missing.push('CLOUDINARY_CLOUD_NAME');
  if (!api_key) missing.push('CLOUDINARY_API_KEY');
  if (!api_secret) missing.push('CLOUDINARY_API_SECRET');

  if (missing.length > 0) {
    console.error(`Cloudinary configuration is missing: ${missing.join(', ')}`);
    console.error('Please check your environment variables in .env file');
    console.error('Server may need to be restarted to pick up new environment variables');
    return false;
  }

  console.log('✅ Cloudinary configuration validated successfully');
  return true;
};

// Configure multer with memory storage (we'll upload to Cloudinary manually)
const storage = multer.memoryStorage();

// Configure multer with Cloudinary storage
export const uploadAvatar = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  },
});

// Enhanced upload function with retry mechanism and better error handling
const uploadWithRetry = async (
  fileBuffer: Buffer,
  options: any,
  retries: number = 2
): Promise<any> => {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      console.log(`📤 Upload attempt ${attempt + 1}/${retries + 1}`);
      
      return await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Upload timeout - connection took too long'));
        }, 35 * 60 * 1000); // 35 minutes timeout per attempt

        cloudinary.uploader.upload_stream(
          options,
          (error, result) => {
            clearTimeout(timeout);
            
            if (error) {
              console.error(`❌ Upload attempt ${attempt + 1} failed:`, {
                message: error.message,
                http_code: error.http_code,
                name: error.name
              });
              reject(error);
            } else if (result) {
              console.log(`✅ Upload attempt ${attempt + 1} successful:`, result.public_id);
              resolve(result);
            } else {
              reject(new Error('No result from Cloudinary upload'));
            }
          }
        ).end(fileBuffer);
      });

    } catch (error: any) {
      console.warn(`⚠️ Upload attempt ${attempt + 1} failed:`, error.message);
      
      // Don't retry on certain errors
      if (error.message?.includes('Invalid image file') || 
          error.message?.includes('File too large') ||
          error.http_code === 400) {
        throw error;
      }
      
      // If this was the last attempt, throw the error
      if (attempt === retries) {
        throw new Error(`Upload failed after ${retries + 1} attempts. Last error: ${error.message}`);
      }
      
      // Wait before retrying (exponential backoff)
      const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
      console.log(`⏳ Waiting ${delay}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

// Upload media (images/videos) to Cloudinary with enhanced error handling
export const uploadMediaToCloudinary = async (
  fileBuffer: Buffer,
  userId: string,
  originalName: string,
  folder: string = 'excellence-coaching-hub/media',
  mimeType: string
): Promise<{ url: string; publicId: string; size: number; duration?: number }> => {
  try {
    // Reconfigure Cloudinary in case environment variables were loaded after initial config
    configureCloudinary();

    // Validate Cloudinary configuration before upload
    if (!validateCloudinaryConfig()) {
      throw new Error('Cloudinary is not properly configured. Please restart the server after updating environment variables.');
    }

    const timestamp = Date.now();
    const fileName = originalName.replace(/\.[^/.]+$/, "").substring(0, 50); // Limit filename length
    const isVideo = mimeType.startsWith('video/');
    const isAudio = mimeType.startsWith('audio/');
    const mediaType = isVideo ? 'video' : isAudio ? 'audio' : 'image';
    const publicId = `${folder}/${mediaType}_${userId}_${fileName}_${timestamp}`;

    console.log(`🎬 Starting Cloudinary ${mediaType} upload for user:`, userId);
    console.log('📁 File name:', originalName);
    console.log('📂 Folder:', folder);
    console.log('🆔 Public ID:', publicId);
    console.log('📦 File size:', `${(fileBuffer.length / (1024 * 1024)).toFixed(2)} MB`);

    const uploadOptions: any = {
      public_id: publicId,
      folder: folder,
      resource_type: isVideo ? 'video' : isAudio ? 'video' : 'image', // Audio files use 'video' resource_type in Cloudinary
      chunk_size: 2000000, // 2MB chunks for faster uploads
      timeout: 60000, // 60 second timeout
      // Remove upload_preset to use signed uploads with API credentials
      use_filename: true,
      unique_filename: true
    };

    if (isVideo) {
      uploadOptions.transformation = [
        {
          quality: 'auto:low', // Reduced quality for faster upload
          format: 'mp4',
          // Limit video dimensions to reduce file size
          width: 1280,
          height: 720,
          crop: 'limit'
        }
      ];
      uploadOptions.allowed_formats = ['mp4', 'mov', 'avi', 'mkv', 'webm', 'ogg'];
    } else if (isAudio) {
      uploadOptions.transformation = [
        {
          quality: 'auto:good',
          format: 'mp3',
          audio_codec: 'mp3',
          audio_frequency: 44100,
          audio_bitrate: '128k'
        }
      ];
      uploadOptions.allowed_formats = ['mp3', 'wav', 'ogg', 'webm', 'mp4', 'm4a'];
    } else {
      uploadOptions.transformation = [
        {
          quality: 'auto:good',
          format: 'auto',
          fetch_format: 'auto',
          // Limit image dimensions to reduce file size
          width: 1920,
          height: 1080,
          crop: 'limit'
        }
      ];
      uploadOptions.allowed_formats = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    }

    const result = await uploadWithRetry(fileBuffer, uploadOptions, 2);
    
    console.log(`✅ Cloudinary ${mediaType} upload successful!`);
    console.log('🔗 Media URL:', result.secure_url);
    if ((isVideo || isAudio) && result.duration) {
      console.log('⏱️ Duration:', `${result.duration}s`);
    }
    console.log('📏 Size:', `${(result.bytes / (1024 * 1024)).toFixed(2)} MB`);
    
    const response: any = {
      url: result.secure_url,
      publicId: result.public_id,
      size: result.bytes || 0,
    };
    
    if ((isVideo || isAudio) && result.duration) {
      response.duration = result.duration;
    }
    
    return response;

  } catch (error: any) {
    console.error('💥 Error in uploadMediaToCloudinary:', {
      message: error.message,
      stack: error.stack?.substring(0, 500),
      userId,
      fileName: originalName
    });
    
    // Provide more specific error messages
    if (error.message?.includes('ECONNRESET')) {
      throw new Error('Upload failed due to network connection issue. Please check your internet connection and try again.');
    } else if (error.message?.includes('timeout')) {
      throw new Error('Upload timed out. The file may be too large or your connection is slow. Please try a smaller file.');
    } else if (error.message?.includes('File too large')) {
      throw new Error('File is too large. Please compress the file and try again.');
    } else {
      throw new Error(`Upload failed: ${error.message}`);
    }
  }
};

// Upload file buffer to Cloudinary (legacy function for avatars)
export const uploadToCloudinary = async (
  fileBuffer: Buffer,
  userId: string,
  originalName?: string,
  folder: string = 'excellence-coaching-hub/avatars'
): Promise<{ url: string; publicId: string; size?: number }> => {
  try {
    // Reconfigure Cloudinary in case environment variables were loaded after initial config
    configureCloudinary();

    // Validate Cloudinary configuration before upload
    if (!validateCloudinaryConfig()) {
      throw new Error('Cloudinary is not properly configured. Please restart the server after updating environment variables.');
    }

    const timestamp = Date.now();
    const publicId = `${folder}/avatar_${userId}_${timestamp}`;

    console.log('Starting Cloudinary upload for user:', userId);

    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          public_id: publicId,
          folder: folder,
          // Remove upload_preset to use signed uploads with API credentials
          use_filename: true,
          unique_filename: true,
          transformation: [
            {
              width: 400,
              height: 400,
              crop: 'fill',
              gravity: 'face',
              quality: 'auto:good',
              format: 'webp'
            }
          ],
          allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            console.error('Error details:', {
              message: error.message,
              http_code: error.http_code,
              name: error.name
            });
            reject(new Error(`Cloudinary upload failed: ${error.message}`));
          } else if (result) {
            console.log('✅ Cloudinary upload successful:', result.public_id);
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
            });
          } else {
            reject(new Error('No result from Cloudinary upload'));
          }
        }
      ).end(fileBuffer);
    });
  } catch (error) {
    console.error('Error in uploadToCloudinary:', error);
    throw error instanceof Error ? error : new Error('Failed to upload image');
  }
};

// Helper function to delete old avatar from Cloudinary
export const deleteOldAvatar = async (avatarUrl: string): Promise<void> => {
  try {
    if (!avatarUrl || !avatarUrl.includes('cloudinary.com')) {
      return; // Not a Cloudinary URL, skip deletion
    }

    // Extract public_id from Cloudinary URL
    const urlParts = avatarUrl.split('/');
    const fileWithExtension = urlParts[urlParts.length - 1];
    const publicId = `excellence-coaching-hub/avatars/${fileWithExtension.split('.')[0]}`;

    await cloudinary.uploader.destroy(publicId);
    console.log(`Old avatar deleted: ${publicId}`);
  } catch (error) {
    console.error('Error deleting old avatar:', error);
    // Don't throw error, as this is not critical
  }
};

// Helper function to get optimized avatar URL
export const getOptimizedAvatarUrl = (publicId: string, options?: {
  width?: number;
  height?: number;
  quality?: string;
}): string => {
  const { width = 400, height = 400, quality = 'auto:good' } = options || {};
  
  return cloudinary.url(publicId, {
    width,
    height,
    crop: 'fill',
    gravity: 'face',
    quality,
    format: 'webp',
    secure: true,
  });
};

// Helper function to upload base64 image (for future use)
export const uploadBase64Image = async (
  base64Data: string,
  userId: string,
  folder: string = 'excellence-coaching-hub/avatars'
): Promise<{ url: string; publicId: string }> => {
  try {
    const timestamp = Date.now();
    const publicId = `${folder}/avatar_${userId}_${timestamp}`;

    const result = await cloudinary.uploader.upload(base64Data, {
      public_id: publicId,
      transformation: [
        {
          width: 400,
          height: 400,
          crop: 'fill',
          gravity: 'face',
          quality: 'auto:good',
          format: 'webp'
        }
      ],
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (error) {
    console.error('Error uploading base64 image to Cloudinary:', error);
    throw new Error('Failed to upload image');
  }
};

// Upload video to Cloudinary
export const uploadVideoToCloudinary = async (
  fileBuffer: Buffer,
  userId: string,
  originalName: string,
  folder: string = 'excellence-coaching-hub/videos'
): Promise<{ url: string; publicId: string; duration: number; size: number }> => {
  try {
    // Reconfigure Cloudinary in case environment variables were loaded after initial config
    configureCloudinary();

    // Validate Cloudinary configuration before upload
    if (!validateCloudinaryConfig()) {
      throw new Error('Cloudinary is not properly configured. Please restart the server after updating environment variables.');
    }

    const timestamp = Date.now();
    const fileName = originalName.replace(/\.[^/.]+$/, ""); // Remove extension
    const publicId = `video_${userId}_${fileName}_${timestamp}`;

    console.log('Starting Cloudinary video upload for user:', userId);

    console.log('Folder:', folder);
    console.log('Public ID:', publicId);

    const options: any = {
      public_id: publicId,
      folder: folder,
      resource_type: 'video',
      use_filename: true,
      unique_filename: true,
      transformation: [
        {
          quality: 'auto:good',
          format: 'mp4'
        }
      ],
      allowed_formats: ['mp4', 'mov', 'avi', 'mkv', 'webm'],
      chunk_size: 4_000_000, // 4MB chunks to reduce request count
      timeout: 35 * 60 * 1000 // 35 minutes per attempt
    };

    const result = await uploadWithRetry(fileBuffer, options, 2);

    return {
      url: result.secure_url,
      publicId: result.public_id,
      duration: result.duration || 0,
      size: result.bytes || 0,
    };
  } catch (error) {
    console.error('Error in uploadVideoToCloudinary:', error);
    throw error instanceof Error ? error : new Error('Failed to upload video');
  }
};

// Helper function to delete video from Cloudinary
export const deleteVideoFromCloudinary = async (videoUrl: string): Promise<void> => {
  try {
    if (!videoUrl || !videoUrl.includes('cloudinary.com')) {
      return; // Not a Cloudinary URL, skip deletion
    }

    // Extract public_id from Cloudinary URL
    // URL format: https://res.cloudinary.com/cloud_name/video/upload/v123456/folder/file.mp4
    const urlParts = videoUrl.split('/');
    const uploadIndex = urlParts.findIndex(part => part === 'upload');
    
    if (uploadIndex === -1 || uploadIndex + 2 >= urlParts.length) {
      console.error('Invalid Cloudinary URL format:', videoUrl);
      return;
    }

    // Get everything after the version number
    const pathParts = urlParts.slice(uploadIndex + 2); // Skip 'upload' and version
    const publicId = pathParts.join('/').replace(/\.[^/.]+$/, ''); // Remove extension

    console.log('Deleting video from Cloudinary with public_id:', publicId);
    await cloudinary.uploader.destroy(publicId, { resource_type: 'video' });
    console.log(`Video deleted from Cloudinary: ${publicId}`);
  } catch (error) {
    console.error('Error deleting video from Cloudinary:', error);
    // Don't throw error, as this is not critical
  }
};

// Upload document to Cloudinary
export const uploadDocumentToCloudinary = async (
  fileBuffer: Buffer,
  userId: string,
  originalName: string,
  folder: string = 'excellence-coaching-hub/documents'
): Promise<{ url: string; publicId: string; size: number }> => {
  try {
    // Reconfigure Cloudinary in case environment variables were loaded after initial config
    configureCloudinary();

    // Validate Cloudinary configuration before upload
    if (!validateCloudinaryConfig()) {
      throw new Error('Cloudinary is not properly configured. Please restart the server after updating environment variables.');
    }

    const timestamp = Date.now();
    // Sanitize filename: remove extension, special characters, and normalize
    const fileName = (originalName || 'unnamed_document')
      .replace(/\.[^/.]+$/, "") // Remove extension
      .replace(/[^a-zA-Z0-9\s-_]/g, "") // Remove special characters
      .replace(/\s+/g, "_") // Replace spaces with underscores
      .substring(0, 50); // Limit length
    const publicId = `document_${userId}_${fileName}_${timestamp}`;

    console.log('Starting Cloudinary document upload for user:', userId);
    console.log('Original file name:', originalName);
    console.log('Folder:', folder);
    console.log('Public ID:', publicId);

    return new Promise((resolve, reject) => {
      // Detect file type to set appropriate resource type
      const isPDF = originalName.toLowerCase().endsWith('.pdf');
      const isWord = originalName.toLowerCase().match(/\.(doc|docx)$/i);
      const isImage = originalName.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/i);
      
      const resourceType = isPDF || isWord ? 'raw' : isImage ? 'image' : 'auto';
      
      console.log(`📄 Document upload details:`, {
        filename: originalName,
        resourceType,
        isPDF,
        isWord,
        isImage
      });
      
      // First try with appropriate resource type
      cloudinary.uploader.upload_stream(
        {
          public_id: publicId,
          folder: folder,
          resource_type: resourceType,
          use_filename: true,
          unique_filename: true,
        },
        (error, result) => {
          if (error) {
            console.error('First attempt failed, trying with auto resource type:', error.message);
            
            // Fallback: try with 'auto' resource type
            cloudinary.uploader.upload_stream(
              {
                public_id: publicId + '_auto',
                folder: folder,
                resource_type: 'auto',
                use_filename: true,
                unique_filename: true,
              },
              (error2, result2) => {
                if (error2) {
                  console.error('Second attempt also failed:', error2.message);
                  
                  // Final fallback: try as raw
                  cloudinary.uploader.upload_stream(
                    {
                      public_id: publicId + '_raw',
                      folder: folder,
                      resource_type: 'raw',
                      use_filename: true,
                      unique_filename: true,
                    },
                    (error3, result3) => {
                      if (error3) {
                        console.error('All upload attempts failed');
                        reject(new Error(`Cloudinary document upload failed: ${error.message}`));
                      } else if (result3) {
                        console.log('✅ Cloudinary document upload successful (raw fallback):', result3.public_id);
                        console.log('📄 URL:', result3.secure_url);
                        resolve({
                          url: result3.secure_url,
                          publicId: result3.public_id,
                          size: result3.bytes || 0,
                        });
                      } else {
                        reject(new Error('No result from Cloudinary document upload'));
                      }
                    }
                  ).end(fileBuffer);
                } else if (result2) {
                  console.log('✅ Cloudinary document upload successful (auto):', result2.public_id);
                  console.log('📄 URL:', result2.secure_url);
                  resolve({
                    url: result2.secure_url,
                    publicId: result2.public_id,
                    size: result2.bytes || 0,
                  });
                } else {
                  reject(new Error('No result from Cloudinary document upload'));
                }
              }
            ).end(fileBuffer);
          } else if (result) {
            console.log('✅ Cloudinary document upload successful:', result.public_id);
            console.log('📄 Resource type used:', resourceType);
            console.log('📄 Full URL:', result.secure_url);
            console.log('📄 Size:', result.bytes);
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
              size: result.bytes || 0,
            });
          } else {
            reject(new Error('No result from Cloudinary document upload'));
          }
        }
      ).end(fileBuffer);
    });
  } catch (error) {
    console.error('Error in uploadDocumentToCloudinary:', error);
    throw error instanceof Error ? error : new Error('Failed to upload document');
  }
};

// Helper function to generate a proper Cloudinary URL for document download
export const getDocumentDownloadUrl = (publicId: string, originalName: string): string => {
  try {
    // Detect file type to set appropriate resource type
    const isPDF = originalName.toLowerCase().endsWith('.pdf');
    const isWord = originalName.toLowerCase().match(/\.(doc|docx)$/i);
    const isImage = originalName.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/i);
    
    const resourceType = isPDF || isWord ? 'raw' : isImage ? 'image' : 'auto';
    
    // Generate URL using Cloudinary's url builder for proper formatting
    const url = cloudinary.url(publicId, {
      secure: true,
      resource_type: resourceType,
      type: 'upload',
      fetch_format: 'auto',
      fl_attachment: true, // Force download
    });
    
    console.log(`📄 Generated download URL for ${originalName}:`, url);
    return url;
  } catch (error) {
    console.error('Error generating download URL:', error);
    // Fallback to basic secure_url format
    return `https://res.cloudinary.com/${cloudinary.config().cloud_name}/raw/upload/${publicId}`;
  }
};

// Helper function to delete document from Cloudinary
export const deleteDocumentFromCloudinary = async (documentUrl: string): Promise<void> => {
  try {
    if (!documentUrl || !documentUrl.includes('cloudinary.com')) {
      return; // Not a Cloudinary URL, skip deletion
    }

    // Extract public_id from Cloudinary URL
    // URL format: https://res.cloudinary.com/cloud_name/image/upload/v123456/folder/file.pdf
    const urlParts = documentUrl.split('/');
    const uploadIndex = urlParts.findIndex(part => part === 'upload');
    
    if (uploadIndex === -1 || uploadIndex + 2 >= urlParts.length) {
      console.error('Invalid Cloudinary URL format:', documentUrl);
      return;
    }

    // Get everything after the version number
    const pathParts = urlParts.slice(uploadIndex + 2); // Skip 'upload' and version
    const publicId = pathParts.join('/').replace(/\.[^/.]+$/, ''); // Remove extension

    console.log('Deleting document from Cloudinary with public_id:', publicId);
    await cloudinary.uploader.destroy(publicId);
    console.log(`Document deleted from Cloudinary: ${publicId}`);
  } catch (error) {
    console.error('Error deleting document from Cloudinary:', error);
    // Don't throw error, as this is not critical
  }
};

// Configure multer for document uploads
export const uploadDocument = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit for documents
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'application/zip',
      'application/x-rar-compressed'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, Word documents, text files, images, and archives are allowed!'));
    }
  },
});

// Configure multer for smart test file uploads
export const uploadSmartTestFile = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for smart test files
  },
  fileFilter: (req, file, cb) => {
    // Check file type for smart test uploads
    const allowedTypes = [
      'application/json',
      'text/csv',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    
    const allowedExtensions = ['.json', '.csv', '.xlsx', '.xls', '.pdf', '.doc', '.docx', '.txt'];
    
    // Check both mimetype and file extension
    const fileName = file.originalname.toLowerCase();
    const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));
    const hasValidMimeType = allowedTypes.includes(file.mimetype);
    
    if (hasValidMimeType || hasValidExtension) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JSON, CSV, XLSX, PDF, DOC, DOCX, and TXT files are allowed for smart test uploads!'));
    }
  },
});

export default cloudinary;
