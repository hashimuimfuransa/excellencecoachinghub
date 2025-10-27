import { v2 as cloudinary } from 'cloudinary';
import { Request } from 'express';
import multer from 'multer';
import { Readable } from 'stream';

// Configure multer for memory storage
const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit for better media support
    files: 10, // Maximum 10 files
    fieldSize: 25 * 1024 * 1024, // 25MB field size limit
  },
  fileFilter: (req, file, cb) => {
    // Allow common file types
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'video/mp4',
      'video/avi',
      'video/quicktime',
      'audio/mpeg',
      'audio/wav'
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} is not allowed`));
    }
  }
});

// Upload file to Cloudinary
export const uploadFile = async (
  file: Express.Multer.File,
  folder: string = 'announcements'
): Promise<{
  url: string;
  publicId: string;
  resourceType: string;
  format: string;
  bytes: number;
}> => {
  return new Promise((resolve, reject) => {
    console.log(`Uploading file: ${file.originalname}, Size: ${file.size} bytes, Type: ${file.mimetype}`);
    
    const uploadOptions: any = {
      folder,
      use_filename: true,
      unique_filename: true,
    };
    
    // Add video-specific options
    if (file.mimetype.startsWith('video/')) {
      uploadOptions.resource_type = 'video';
      uploadOptions.chunk_size = 6000000; // 6MB chunks for large videos
      uploadOptions.eager_async = true; // Process video asynchronously
      console.log('Video upload options applied');
    } else {
      uploadOptions.resource_type = 'auto';
    }
    
    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          reject(error);
        } else if (result) {
          console.log(`Upload successful: ${result.public_id}`);
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            resourceType: result.resource_type,
            format: result.format,
            bytes: result.bytes,
          });
        } else {
          reject(new Error('Upload failed - no result'));
        }
      }
    );

    // Convert buffer to stream and pipe to Cloudinary
    const bufferStream = new Readable();
    bufferStream.push(file.buffer);
    bufferStream.push(null);
    bufferStream.pipe(uploadStream);
  });
};

// Delete file from Cloudinary
export const deleteFile = async (publicId: string): Promise<void> => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Error deleting file from Cloudinary:', error);
    throw error;
  }
};

// Upload multiple files
export const uploadMultipleFiles = async (
  files: Express.Multer.File[],
  folder: string = 'announcements'
): Promise<Array<{
  url: string;
  publicId: string;
  resourceType: string;
  format: string;
  bytes: number;
  originalName: string;
}>> => {
  console.log(`Starting upload of ${files.length} files`);
  
  const uploadPromises = files.map(async (file, index) => {
    try {
      console.log(`Uploading file ${index + 1}/${files.length}: ${file.originalname}`);
      const result = await uploadFile(file, folder);
      console.log(`File ${index + 1} uploaded successfully: ${result.publicId}`);
      return {
        ...result,
        originalName: file.originalname,
      };
    } catch (error) {
      console.error(`Failed to upload file ${index + 1} (${file.originalname}):`, error);
      throw new Error(`Failed to upload ${file.originalname}: ${error.message}`);
    }
  });

  try {
    const results = await Promise.all(uploadPromises);
    console.log(`All ${files.length} files uploaded successfully`);
    return results;
  } catch (error) {
    console.error('One or more files failed to upload:', error);
    throw error;
  }
};

// Get file info from Cloudinary
export const getFileInfo = async (publicId: string) => {
  try {
    const result = await cloudinary.api.resource(publicId);
    return result;
  } catch (error) {
    console.error('Error getting file info from Cloudinary:', error);
    throw error;
  }
};

// Generate signed URL for private files
export const generateSignedUrl = (publicId: string, options: any = {}) => {
  return cloudinary.url(publicId, {
    sign_url: true,
    type: 'authenticated',
    ...options,
  });
};