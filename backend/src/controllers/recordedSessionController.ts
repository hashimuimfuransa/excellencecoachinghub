import { Request, Response } from 'express';
import { RecordedSession, Course, UserProgress } from '../models';
import { AuthRequest } from '../middleware/auth';
import multer from 'multer';
import { deleteVideoFromCloudinary } from '../config/cloudinary';
import { deleteUploadcareFileByCdnUrl, isUploadcareUrl } from '../services/uploadcareService';

// Configure multer for video uploads with memory storage (for Cloudinary)
const storage = multer.memoryStorage();

const fileFilter = (req: any, file: any, cb: any) => {
  // Accept video files only
  if (file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error('Only video files are allowed!'), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB limit
  }
});

// Get all recorded sessions for a teacher
export const getTeacherRecordedSessions = async (req: AuthRequest, res: Response) => {
  try {
    const teacherId = req.user?._id;
    const { courseId, search, page = 1, limit = 10 } = req.query;

    if (!teacherId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Build query
    const query: any = { teacher: teacherId };
    
    if (courseId) {
      query.course = courseId;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Get total count for pagination
    const total = await RecordedSession.countDocuments(query);

    // Get recorded sessions with pagination
    const recordedSessions = await RecordedSession.find(query)
      .populate('course', 'title description')
      .sort({ uploadDate: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    res.json({
      success: true,
      data: {
        sessions: recordedSessions,
        pagination: {
          current: Number(page),
          pages: Math.ceil(total / Number(limit)),
          total
        }
      }
    });
  } catch (error) {
    console.error('Error fetching recorded sessions:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch recorded sessions' 
    });
  }
};

// Upload a new recorded session
export const uploadRecordedSession = async (req: AuthRequest, res: Response) => {
  try {
    console.log('🎥 uploadRecordedSession function called');
    const teacherId = req.user?._id;
    const { title, description, courseId, videoUrl } = req.body;
    const videoFile = req.file;

    console.log('📋 Request data:', { title, description, courseId, hasFile: !!videoFile });

    if (!teacherId) {
      console.log('❌ No teacher ID found');
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Accept either Uploadcare videoUrl or a direct file (legacy)
    if (!videoUrl && !videoFile) {
      console.log('❌ No video provided');
      return res.status(400).json({ message: 'Video URL is required' });
    }

    if (!title || !courseId) {
      console.log('❌ Missing title or courseId');
      return res.status(400).json({ message: 'Title and course are required' });
    }

    // Verify the course belongs to the teacher
    console.log('🔍 Verifying course ownership...');
    const course = await Course.findOne({
      _id: courseId,
      $or: [
        { teacher: teacherId },
        { instructor: teacherId }
      ]
    });
    if (!course) {
      console.log('❌ Course not found or unauthorized');
      return res.status(404).json({ message: 'Course not found or unauthorized' });
    }

    console.log('✅ Course verified:', course.title);

    let finalVideoUrl = videoUrl as string;
    let videoFileName = videoFile?.originalname || 'uploadcare-video';
    let videoSize = videoFile?.size || 0;
    let durationSeconds = 0;

    if (!finalVideoUrl && videoFile) {
      // Legacy path would upload to Cloudinary, but we are moving to Uploadcare-only.
      // Reject legacy direct uploads to enforce Uploadcare.
      return res.status(400).json({ success: false, message: 'Direct file uploads are disabled. Please upload via Uploadcare widget.' });
    }

    // Format duration from seconds to MM:SS
    const formatDuration = (seconds: number): string => {
      if (!seconds || seconds === 0) return '00:00';
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = Math.floor(seconds % 60);
      return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    // Create recorded session
    const recordedSession = new RecordedSession({
      title,
      description,
      teacher: teacherId,
      course: courseId,
      videoUrl: finalVideoUrl,
      videoFileName,
      videoSize,
      duration: formatDuration(durationSeconds),
      uploadDate: new Date()
    });

    await recordedSession.save();
    console.log('✅ Recorded session saved to database');

    // Populate course data for response
    await recordedSession.populate('course', 'title description');

    res.status(201).json({
      success: true,
      data: recordedSession,
      message: 'Video saved successfully'
    });
  } catch (error) {
    console.error('❌ Error uploading recorded session:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to upload video',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get a specific recorded session
export const getRecordedSession = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const teacherId = req.user?._id;

    if (!teacherId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const recordedSession = await RecordedSession.findOne({
      _id: id,
      teacher: teacherId
    }).populate('course', 'title description');

    if (!recordedSession) {
      return res.status(404).json({ message: 'Recorded session not found' });
    }

    res.json({
      success: true,
      data: recordedSession
    });
  } catch (error) {
    console.error('Error fetching recorded session:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch recorded session' 
    });
  }
};

// Update a recorded session
export const updateRecordedSession = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, courseId, isPublished } = req.body;
    const teacherId = req.user?._id;

    if (!teacherId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // If courseId is provided, verify it belongs to the teacher
    if (courseId) {
      const course = await Course.findOne({ _id: courseId, teacher: teacherId });
      if (!course) {
        return res.status(404).json({ message: 'Course not found or unauthorized' });
      }
    }

    const updateData: any = { title, description, isPublished };
    if (courseId) {
      updateData.course = courseId;
    }

    const recordedSession = await RecordedSession.findOneAndUpdate(
      { _id: id, teacher: teacherId },
      updateData,
      { new: true }
    ).populate('course', 'title description');

    if (!recordedSession) {
      return res.status(404).json({ message: 'Recorded session not found' });
    }

    res.json({
      success: true,
      data: recordedSession,
      message: 'Recorded session updated successfully'
    });
  } catch (error) {
    console.error('Error updating recorded session:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update recorded session' 
    });
  }
};

// Delete a recorded session
export const deleteRecordedSession = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const teacherId = req.user?._id;

    if (!teacherId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const recordedSession = await RecordedSession.findOne({
      _id: id,
      teacher: teacherId
    });

    if (!recordedSession) {
      return res.status(404).json({ message: 'Recorded session not found' });
    }

    // Delete the video from storage
    if (recordedSession.videoUrl) {
      if (isUploadcareUrl(recordedSession.videoUrl)) {
        await deleteUploadcareFileByCdnUrl(recordedSession.videoUrl);
      } else if (recordedSession.videoUrl.includes('cloudinary.com')) {
        await deleteVideoFromCloudinary(recordedSession.videoUrl);
      }
    }

    await RecordedSession.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Recorded session deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting recorded session:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete recorded session' 
    });
  }
};

// Increment view count
export const incrementViewCount = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const recordedSession = await RecordedSession.findByIdAndUpdate(
      id,
      { $inc: { views: 1 } },
      { new: true }
    );

    if (!recordedSession) {
      return res.status(404).json({ message: 'Recorded session not found' });
    }

    res.json({
      success: true,
      data: { views: recordedSession.views }
    });
  } catch (error) {
    console.error('Error incrementing view count:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to increment view count' 
    });
  }
};

// Get recorded sessions for students (by course)
export const getRecordedSessionsForStudents = async (req: AuthRequest, res: Response) => {
  try {
    const { courseId } = req.params;
    const studentId = req.user?._id;

    if (!studentId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Verify student is enrolled in the course
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Get published recorded sessions for the course
    const recordedSessions = await RecordedSession.find({
      course: courseId,
      isPublished: true
    })
      .populate('teacher', 'firstName lastName')
      .populate('course', 'title description')
      .sort({ uploadDate: -1 });

    res.json({
      success: true,
      data: recordedSessions
    });
  } catch (error) {
    console.error('Error fetching recorded sessions for students:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch recorded sessions' 
    });
  }
};

// Get all recorded sessions for a student across all enrolled courses
export const getAllRecordedSessionsForStudent = async (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.user?._id;
    const { page = 1, limit = 12, search, courseId } = req.query;

    if (!studentId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Get student's enrolled courses
    const { CourseEnrollment } = await import('../models/CourseEnrollment');
    const enrollments = await CourseEnrollment.find({ student: studentId, isActive: true }).select('course');
    const enrolledCourseIds = enrollments.map((enrollment: any) => enrollment.course);

    if (enrolledCourseIds.length === 0) {
      return res.json({
        success: true,
        data: {
          recordings: [],
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total: 0,
            pages: 0
          }
        }
      });
    }

    // Build query
    const query: any = {
      course: { $in: enrolledCourseIds },
      isPublished: true
    };

    // If specific courseId is provided, filter by it (but still check enrollment)
    if (courseId && enrolledCourseIds.some((id: any) => id.toString() === courseId)) {
      query.course = courseId;
    }

    // Add search functionality
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Get total count for pagination
    const total = await RecordedSession.countDocuments(query);

    // Get recorded sessions with pagination
    const recordings = await RecordedSession.find(query)
      .populate('teacher', 'firstName lastName')
      .populate('course', 'title description thumbnail')
      .sort({ uploadDate: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    // Transform data to match the frontend interface
    const transformedRecordings = recordings
      .filter((recording: any) => recording.course != null && recording.teacher != null)
      .map((recording: any) => ({
        _id: recording._id,
        title: recording.title,
        description: recording.description,
        scheduledTime: recording.uploadDate,
        actualStartTime: recording.uploadDate,
        actualEndTime: recording.uploadDate,
        duration: recording.duration ? parseInt(recording.duration.split(':')[0]) * 60 + parseInt(recording.duration.split(':')[1]) : 0,
        recordingUrl: recording.videoUrl,
        recordingSize: recording.videoSize,
        course: {
          _id: recording.course._id,
          title: recording.course.title,
          description: recording.course.description,
          thumbnail: recording.course.thumbnail
        },
        instructor: {
          _id: recording.teacher._id,
          firstName: recording.teacher.firstName,
          lastName: recording.teacher.lastName
        },
        createdAt: recording.createdAt,
        views: recording.views
      }));

    res.json({
      success: true,
      data: {
        recordings: transformedRecordings,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    console.error('Error fetching all recorded sessions for student:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch recorded sessions' 
    });
  }
};

// Get all recorded sessions for admin (all teacher uploads)
export const getAdminRecordedSessions = async (req: AuthRequest, res: Response) => {
  try {
    const { courseId, search, teacherId, page = 1, limit = 10 } = req.query;

    // Build query
    const query: any = {};
    
    if (courseId) {
      query.course = courseId;
    }

    if (teacherId) {
      query.teacher = teacherId;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Get total count for pagination
    const total = await RecordedSession.countDocuments(query);

    // Get recorded sessions with pagination
    const recordedSessions = await RecordedSession.find(query)
      .populate('course', 'title description thumbnail')
      .populate('teacher', 'firstName lastName')
      .sort({ uploadDate: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    res.json({
      success: true,
      data: {
        sessions: recordedSessions,
        pagination: {
          current: Number(page),
          pages: Math.ceil(total / Number(limit)),
          total
        }
      }
    });
  } catch (error) {
    console.error('Error fetching recorded sessions for admin:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch recorded sessions' 
    });
  }
};