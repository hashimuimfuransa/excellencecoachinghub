import { Request, Response } from 'express';
import { Course, ICourseContent } from '../models/Course';
import { asyncHandler } from '../middleware/asyncHandler';
import { UserRole } from '../../../shared/types';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import cloudinary from '../config/cloudinary';

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads/course-materials');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Allow videos, documents, images, and audio files
  const allowedTypes = [
    // Videos
    'video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv', 'video/webm',
    // Documents
    'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain', 'text/csv',
    // Images
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
    // Audio
    'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not supported`));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB limit
  }
});

// @desc    Proxy PDF requests with authentication
// @route   GET /api/materials/pdf-proxy
// @access  Private
export const proxyPDF = asyncHandler(async (req: Request, res: Response) => {
  const { url } = req.query;
  const user = req.user;

  if (!user) {
    res.status(401).json({
      success: false,
      error: 'User not authenticated'
    });
    return;
  }

  if (!url || typeof url !== 'string') {
    res.status(400).json({
      success: false,
      error: 'PDF URL is required'
    });
    return;
  }

  try {
    // Fetch the PDF from the provided URL
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PDF-Proxy/1.0)',
        'Accept': 'application/pdf,application/octet-stream,*/*'
      }
    });

    if (!response.ok) {
      res.status(response.status).json({
        success: false,
        error: `Failed to fetch PDF: ${response.statusText}`
      });
      return;
    }

    // Get the PDF content
    const pdfBuffer = await response.arrayBuffer();
    
    // Set appropriate headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', pdfBuffer.byteLength);
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    
    // Send the PDF
    res.send(Buffer.from(pdfBuffer));

  } catch (error) {
    console.error('Error proxying PDF:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to proxy PDF request'
    });
  }
});

// @desc    Proxy document requests with authentication (for all document types)
// @route   GET /api/documents/proxy
// @access  Private
export const proxyDocument = asyncHandler(async (req: Request, res: Response) => {
  const { url } = req.query;
  const user = req.user;

  if (!user) {
    res.status(401).json({
      success: false,
      error: 'User not authenticated'
    });
    return;
  }

  if (!url || typeof url !== 'string') {
    res.status(400).json({
      success: false,
      error: 'Document URL is required'
    });
    return;
  }

  try {
    console.log('Proxying document request for URL:', url);
    
    // Fetch the document from the provided URL
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Document-Proxy/1.0)',
        'Accept': 'application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain,application/octet-stream,*/*'
      }
    });

    if (!response.ok) {
      console.error('Failed to fetch document:', response.status, response.statusText);
      res.status(response.status).json({
        success: false,
        error: `Failed to fetch document: ${response.statusText}`
      });
      return;
    }

    // Get the document content
    const documentBuffer = await response.arrayBuffer();
    
    // Determine content type from response or URL
    let contentType = response.headers.get('content-type') || 'application/octet-stream';
    
    // If content type is not set, try to determine from URL
    if (contentType === 'application/octet-stream' || !contentType) {
      const urlLower = url.toLowerCase();
      if (urlLower.includes('.pdf')) {
        contentType = 'application/pdf';
      } else if (urlLower.includes('.docx')) {
        contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      } else if (urlLower.includes('.doc')) {
        contentType = 'application/msword';
      } else if (urlLower.includes('.pptx')) {
        contentType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
      } else if (urlLower.includes('.ppt')) {
        contentType = 'application/vnd.ms-powerpoint';
      } else if (urlLower.includes('.xlsx')) {
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      } else if (urlLower.includes('.xls')) {
        contentType = 'application/vnd.ms-excel';
      } else if (urlLower.includes('.txt')) {
        contentType = 'text/plain';
      }
    }
    
    // Set appropriate headers
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', documentBuffer.byteLength);
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    console.log('Successfully proxied document:', {
      url,
      contentType,
      size: documentBuffer.byteLength
    });
    
    // Send the document
    res.send(Buffer.from(documentBuffer));

  } catch (error) {
    console.error('Error proxying document:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to proxy document request'
    });
  }
});

// @desc    Get course materials
// @route   GET /api/courses/:courseId/materials
// @access  Private (Teacher/Student)
export const getCourseMaterials = asyncHandler(async (req: Request, res: Response) => {
  const { courseId } = req.params;
  const user = req.user;

  if (!user) {
    res.status(401).json({
      success: false,
      error: 'User not authenticated'
    });
    return;
  }

  try {
    const course = await Course.findById(courseId);

    if (!course) {
      res.status(404).json({
        success: false,
        error: 'Course not found'
      });
      return;
    }

    // Check if user has access to this course
    const isInstructor = course.instructor.toString() === user._id.toString();
    const isAdmin = user.role === UserRole.ADMIN;

    if (!isInstructor && !isAdmin) {
      // For students, check if they're enrolled
      const { UserProgress } = await import('../models');
      const enrollment = await UserProgress.findOne({
        user: user._id,
        course: courseId
      });

      if (!enrollment) {
        res.status(403).json({
          success: false,
          error: 'Access denied. You must be enrolled in this course.'
        });
        return;
      }
    }

    // Sort materials by order
    const materials = course.content.sort((a, b) => a.order - b.order);

    res.status(200).json({
      success: true,
      data: {
        materials,
        totalMaterials: materials.length,
        courseTitle: course.title
      }
    });

  } catch (error) {
    console.error('Error fetching course materials:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch course materials'
    });
  }
});

// @desc    Add course material
// @route   POST /api/courses/:courseId/materials
// @access  Private (Teacher only)
export const addCourseMaterial = asyncHandler(async (req: Request, res: Response) => {
  const { courseId } = req.params;
  const user = req.user;

  if (!user || user.role !== UserRole.TEACHER) {
    res.status(403).json({
      success: false,
      error: 'Access denied. Teacher role required.'
    });
    return;
  }

  try {
    const course = await Course.findById(courseId);

    if (!course) {
      res.status(404).json({
        success: false,
        error: 'Course not found'
      });
      return;
    }

    // Check if user is the instructor
    if (course.instructor.toString() !== user._id.toString()) {
      res.status(403).json({
        success: false,
        error: 'Access denied. You can only add materials to your own courses.'
      });
      return;
    }

    const { title, type, content, duration, isRequired, order } = req.body;
    let fileUrl = null;
    let videoUrl = null;

    // Handle file upload if present
    if (req.file) {
      try {
        // Upload to Cloudinary with public preset
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: `course-materials/${courseId}`,
          resource_type: 'auto', // Automatically detect file type
          public_id: `${uuidv4()}-${Date.now()}`,
          upload_preset: 'upload-public', // Use public upload preset
          use_filename: true,
          unique_filename: true
        });

        if (type === 'video') {
          videoUrl = result.secure_url;
        } else {
          fileUrl = result.secure_url;
        }

        // Delete local file after upload
        fs.unlinkSync(req.file.path);
      } catch (uploadError) {
        console.error('Cloudinary upload error:', uploadError);
        // Clean up local file
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        res.status(500).json({
          success: false,
          error: 'Failed to upload file'
        });
        return;
      }
    }

    // Create new material
    const newMaterial: ICourseContent = {
      title,
      type,
      content: content || null,
      fileUrl,
      videoUrl,
      duration: duration ? parseInt(duration) : undefined,
      order: order ? parseInt(order) : course.content.length + 1,
      isRequired: isRequired === 'true' || isRequired === true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Add material to course
    course.content.push(newMaterial);
    await course.save();

    res.status(201).json({
      success: true,
      data: {
        material: newMaterial,
        message: 'Course material added successfully'
      }
    });

  } catch (error) {
    console.error('Error adding course material:', error);
    
    // Clean up uploaded file if there was an error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      success: false,
      error: 'Failed to add course material'
    });
  }
});

// @desc    Update course material
// @route   PUT /api/courses/:courseId/materials/:materialId
// @access  Private (Teacher only)
export const updateCourseMaterial = asyncHandler(async (req: Request, res: Response) => {
  const { courseId, materialId } = req.params;
  const user = req.user;

  if (!user || user.role !== UserRole.TEACHER) {
    res.status(403).json({
      success: false,
      error: 'Access denied. Teacher role required.'
    });
    return;
  }

  try {
    const course = await Course.findById(courseId);

    if (!course) {
      res.status(404).json({
        success: false,
        error: 'Course not found'
      });
      return;
    }

    // Check if user is the instructor
    if (course.instructor.toString() !== user._id.toString()) {
      res.status(403).json({
        success: false,
        error: 'Access denied. You can only update materials in your own courses.'
      });
      return;
    }

    // Find the material
    const materialIndex = course.content.findIndex(
      material => material._id?.toString() === materialId
    );

    if (materialIndex === -1) {
      res.status(404).json({
        success: false,
        error: 'Material not found'
      });
      return;
    }

    const { title, type, content, duration, isRequired, order } = req.body;
    let fileUrl = course.content[materialIndex].fileUrl;
    let videoUrl = course.content[materialIndex].videoUrl;

    // Handle file upload if present
    if (req.file) {
      try {
        // Delete old file from Cloudinary if exists
        const oldMaterial = course.content[materialIndex];
        if (oldMaterial.fileUrl || oldMaterial.videoUrl) {
          const oldUrl = oldMaterial.fileUrl || oldMaterial.videoUrl;
          const publicId = oldUrl?.split('/').pop()?.split('.')[0];
          if (publicId) {
            await cloudinary.uploader.destroy(`course-materials/${courseId}/${publicId}`);
          }
        }

        // Upload new file to Cloudinary with public preset
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: `course-materials/${courseId}`,
          resource_type: 'auto',
          public_id: `${uuidv4()}-${Date.now()}`,
          upload_preset: 'upload-public', // Use public upload preset
          use_filename: true,
          unique_filename: true
        });

        if (type === 'video') {
          videoUrl = result.secure_url;
          fileUrl = null;
        } else {
          fileUrl = result.secure_url;
          videoUrl = null;
        }

        // Delete local file after upload
        fs.unlinkSync(req.file.path);
      } catch (uploadError) {
        console.error('Cloudinary upload error:', uploadError);
        // Clean up local file
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        res.status(500).json({
          success: false,
          error: 'Failed to upload file'
        });
        return;
      }
    }

    // Update material
    course.content[materialIndex] = {
      ...course.content[materialIndex],
      title: title || course.content[materialIndex].title,
      type: type || course.content[materialIndex].type,
      content: content !== undefined ? content : course.content[materialIndex].content,
      fileUrl,
      videoUrl,
      duration: duration ? parseInt(duration) : course.content[materialIndex].duration,
      order: order ? parseInt(order) : course.content[materialIndex].order,
      isRequired: isRequired !== undefined ? (isRequired === 'true' || isRequired === true) : course.content[materialIndex].isRequired,
      updatedAt: new Date()
    };

    await course.save();

    res.status(200).json({
      success: true,
      data: {
        material: course.content[materialIndex],
        message: 'Course material updated successfully'
      }
    });

  } catch (error) {
    console.error('Error updating course material:', error);
    
    // Clean up uploaded file if there was an error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      success: false,
      error: 'Failed to update course material'
    });
  }
});

// @desc    Delete course material
// @route   DELETE /api/courses/:courseId/materials/:materialId
// @access  Private (Teacher only)
export const deleteCourseMaterial = asyncHandler(async (req: Request, res: Response) => {
  const { courseId, materialId } = req.params;
  const user = req.user;

  if (!user || user.role !== UserRole.TEACHER) {
    res.status(403).json({
      success: false,
      error: 'Access denied. Teacher role required.'
    });
    return;
  }

  try {
    const course = await Course.findById(courseId);

    if (!course) {
      res.status(404).json({
        success: false,
        error: 'Course not found'
      });
      return;
    }

    // Check if user is the instructor
    if (course.instructor.toString() !== user._id.toString()) {
      res.status(403).json({
        success: false,
        error: 'Access denied. You can only delete materials from your own courses.'
      });
      return;
    }

    // Find the material
    const materialIndex = course.content.findIndex(
      material => material._id?.toString() === materialId
    );

    if (materialIndex === -1) {
      res.status(404).json({
        success: false,
        error: 'Material not found'
      });
      return;
    }

    // Delete file from Cloudinary if exists
    const material = course.content[materialIndex];
    if (material.fileUrl || material.videoUrl) {
      try {
        const fileUrl = material.fileUrl || material.videoUrl;
        const publicId = fileUrl?.split('/').pop()?.split('.')[0];
        if (publicId) {
          await cloudinary.uploader.destroy(`course-materials/${courseId}/${publicId}`);
        }
      } catch (deleteError) {
        console.error('Error deleting file from Cloudinary:', deleteError);
        // Continue with material deletion even if file deletion fails
      }
    }

    // Remove material from course
    course.content.splice(materialIndex, 1);
    await course.save();

    res.status(200).json({
      success: true,
      message: 'Course material deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting course material:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete course material'
    });
  }
});

// @desc    Reorder course materials
// @route   PUT /api/courses/:courseId/materials/reorder
// @access  Private (Teacher only)
export const reorderCourseMaterials = asyncHandler(async (req: Request, res: Response) => {
  const { courseId } = req.params;
  const { materialOrders } = req.body; // Array of { materialId, order }
  const user = req.user;

  if (!user || user.role !== UserRole.TEACHER) {
    res.status(403).json({
      success: false,
      error: 'Access denied. Teacher role required.'
    });
    return;
  }

  try {
    const course = await Course.findById(courseId);

    if (!course) {
      res.status(404).json({
        success: false,
        error: 'Course not found'
      });
      return;
    }

    // Check if user is the instructor
    if (course.instructor.toString() !== user._id.toString()) {
      res.status(403).json({
        success: false,
        error: 'Access denied. You can only reorder materials in your own courses.'
      });
      return;
    }

    // Update material orders
    materialOrders.forEach((orderUpdate: { materialId: string; order: number }) => {
      const materialIndex = course.content.findIndex(
        material => material._id?.toString() === orderUpdate.materialId
      );
      
      if (materialIndex !== -1) {
        course.content[materialIndex].order = orderUpdate.order;
        course.content[materialIndex].updatedAt = new Date();
      }
    });

    await course.save();

    // Sort materials by order for response
    const sortedMaterials = course.content.sort((a, b) => a.order - b.order);

    res.status(200).json({
      success: true,
      data: {
        materials: sortedMaterials,
        message: 'Course materials reordered successfully'
      }
    });

  } catch (error) {
    console.error('Error reordering course materials:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reorder course materials'
    });
  }
});