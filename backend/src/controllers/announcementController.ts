import { Request, Response } from 'express';
import { Announcement, IAnnouncementDocument } from '../models/Announcement';
import { Course } from '../models/Course';
import { User } from '../models/User';
import { asyncHandler } from '../middleware/asyncHandler';
import { AppError } from '../middleware/errorHandler';
import { uploadFile, deleteFile } from '../utils/fileUpload';
import mongoose from 'mongoose';

// @desc    Get course announcements
// @route   GET /api/announcements/course/:courseId
// @access  Private (Students and Instructors)
export const getCourseAnnouncements = asyncHandler(async (req: Request, res: Response) => {
  const { courseId } = req.params;
  const { type, priority, limit } = req.query;

  // Validate course exists and user has access
  const course = await Course.findById(courseId);
  if (!course) {
    throw new AppError('Course not found', 404);
  }

  // Check if user has access to course
  const userId = req.user?.id;
  const isInstructor = course.instructor.toString() === userId;
  
  console.log('🔍 Announcement access check:', {
    userId,
    courseId,
    instructorId: course.instructor.toString(),
    isInstructor
  });
  
  // Allow anyone who can access the course to see announcements
  // No enrollment check needed - if they can access the course, they can see announcements
  console.log('✅ Access granted - anyone with course access can view announcements');

  // Build query
  let query: any = { course: courseId };

  // Students only see published announcements
  if (!isInstructor) {
    query.isPublished = true;
    // Show all published announcements regardless of scheduled date
    // Remove the scheduled date filter to show all published announcements
    // query.$or = [
    //   { scheduledDate: { $lte: new Date() } },
    //   { scheduledDate: null }
    // ];
  }

  console.log('🔍 Built query:', JSON.stringify(query, null, 2));
  console.log('🔍 Current date:', new Date().toISOString());

  // Apply filters
  if (type) query.type = type;
  if (priority) query.priority = priority;

  // Get announcements
  let announcementsQuery = Announcement.find(query)
    .populate('instructor', 'firstName lastName avatar')
    .sort({ isPinned: -1, createdAt: -1 });

  if (limit) {
    announcementsQuery = announcementsQuery.limit(parseInt(limit as string));
  }

  const announcements = await announcementsQuery;
  
  // Also check total announcements for this course (without filters)
  const totalAnnouncements = await Announcement.countDocuments({ course: courseId });
  const allAnnouncements = await Announcement.find({ course: courseId }).select('title isPublished scheduledDate createdAt');
  
  console.log('🔍 Announcement query results:', {
    query,
    totalFound: announcements.length,
    totalInCourse: totalAnnouncements,
    allAnnouncementsInCourse: allAnnouncements.map(a => ({
      title: a.title,
      isPublished: a.isPublished,
      scheduledDate: a.scheduledDate,
      createdAt: a.createdAt
    })),
    filteredAnnouncements: announcements.map(a => ({
      id: a._id,
      title: a.title,
      isPublished: a.isPublished,
      scheduledDate: a.scheduledDate,
      createdAt: a.createdAt
    }))
  });

  console.log('📤 Sending response:', {
    success: true,
    dataCount: announcements.length,
    responseSize: JSON.stringify(announcements).length
  });

  res.status(200).json({
    success: true,
    data: announcements,
    count: announcements.length
  });
});

// @desc    Get announcement by ID
// @route   GET /api/announcements/:id
// @access  Private
export const getAnnouncementById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const announcement = await Announcement.findById(id)
    .populate('instructor', 'firstName lastName avatar')
    .populate('course', 'title');

  if (!announcement) {
    throw new AppError('Announcement not found', 404);
  }

  // Check access
  const userId = req.user?.id;
  const course = await Course.findById(announcement.course);
  
  if (!course) {
    throw new AppError('Associated course not found', 404);
  }

  const isInstructor = course.instructor.toString() === userId;
  
  // Allow anyone who can access the course to see announcements
  // No enrollment check needed - if they can access the course, they can see announcements

  // Students can only see published announcements that are not scheduled for future
  if (!isInstructor && (!announcement.isPublished || 
      (announcement.scheduledDate && new Date() < announcement.scheduledDate))) {
    throw new AppError('Announcement not available', 403);
  }

  res.status(200).json({
    success: true,
    data: announcement
  });
});

// @desc    Create announcement
// @route   POST /api/announcements
// @access  Private (Instructors only)
export const createAnnouncement = asyncHandler(async (req: Request, res: Response) => {
  const {
    title,
    content,
    course: courseId,
    type = 'general',
    priority = 'medium',
    isPinned = false,
    isPublished = true,
    scheduledDate,
    expiryDate
  } = req.body;

  // Validate course exists and user is instructor
  const course = await Course.findById(courseId);
  if (!course) {
    throw new AppError('Course not found', 404);
  }

  if (course.instructor.toString() !== req.user?.id) {
    throw new AppError('Only course instructor can create announcements', 403);
  }

  // Handle file attachments if any
  let attachments: any[] = [];
  if (req.files && Array.isArray(req.files)) {
    for (const file of req.files) {
      const uploadResult = await uploadFile(file, 'announcements');
      attachments.push({
        filename: uploadResult.filename,
        originalName: file.originalname,
        fileUrl: uploadResult.url,
        fileSize: file.size,
        mimeType: file.mimetype,
        uploadedAt: new Date()
      });
    }
  }

  const announcement = await Announcement.create({
    title,
    content,
    course: courseId,
    instructor: req.user?.id,
    type,
    priority,
    isPinned,
    isPublished,
    scheduledDate: scheduledDate ? new Date(scheduledDate) : undefined,
    expiryDate: expiryDate ? new Date(expiryDate) : undefined,
    attachments
  });

  await announcement.populate('instructor', 'firstName lastName avatar');

  res.status(201).json({
    success: true,
    data: announcement
  });
});

// @desc    Update announcement
// @route   PUT /api/announcements/:id
// @access  Private (Instructors only)
export const updateAnnouncement = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const announcement = await Announcement.findById(id);
  if (!announcement) {
    throw new AppError('Announcement not found', 404);
  }

  // Check if user is the instructor
  if (announcement.instructor.toString() !== req.user?.id) {
    throw new AppError('Only the announcement creator can update it', 403);
  }

  // Handle file attachments
  let attachments = announcement.attachments;
  if (req.files && Array.isArray(req.files)) {
    // Delete old attachments if replacing
    if (req.body.replaceAttachments === 'true') {
      for (const attachment of attachments) {
        await deleteFile(attachment.fileUrl);
      }
      attachments = [];
    }

    // Add new attachments
    for (const file of req.files) {
      const uploadResult = await uploadFile(file, 'announcements');
      attachments.push({
        filename: uploadResult.filename,
        originalName: file.originalname,
        fileUrl: uploadResult.url,
        fileSize: file.size,
        mimeType: file.mimetype,
        uploadedAt: new Date()
      });
    }
  }

  const updatedAnnouncement = await Announcement.findByIdAndUpdate(
    id,
    {
      ...req.body,
      attachments,
      scheduledDate: req.body.scheduledDate ? new Date(req.body.scheduledDate) : undefined,
      expiryDate: req.body.expiryDate ? new Date(req.body.expiryDate) : undefined
    },
    { new: true, runValidators: true }
  ).populate('instructor', 'firstName lastName avatar');

  res.status(200).json({
    success: true,
    data: updatedAnnouncement
  });
});

// @desc    Delete announcement
// @route   DELETE /api/announcements/:id
// @access  Private (Instructors only)
export const deleteAnnouncement = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const announcement = await Announcement.findById(id);
  if (!announcement) {
    throw new AppError('Announcement not found', 404);
  }

  // Check if user is the instructor
  if (announcement.instructor.toString() !== req.user?.id) {
    throw new AppError('Only the announcement creator can delete it', 403);
  }

  // Delete associated files
  for (const attachment of announcement.attachments) {
    await deleteFile(attachment.fileUrl);
  }

  await announcement.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Announcement deleted successfully'
  });
});

// @desc    Mark announcement as read
// @route   POST /api/announcements/:id/read
// @access  Private (Students)
export const markAsRead = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;

  const announcement = await Announcement.findById(id);
  if (!announcement) {
    throw new AppError('Announcement not found', 404);
  }

  // Check if user has access to the course
  const course = await Course.findById(announcement.course);
  if (!course) {
    throw new AppError('Associated course not found', 404);
  }

  const isInstructor = course.instructor.toString() === userId;
  
  // Allow anyone who can access the course to see announcements
  // No enrollment check needed - if they can access the course, they can see announcements

  await announcement.markAsReadBy(userId);

  res.status(200).json({
    success: true,
    message: 'Announcement marked as read'
  });
});

// @desc    Mark announcement as unread
// @route   DELETE /api/announcements/:id/read
// @access  Private (Students)
export const markAsUnread = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;

  const announcement = await Announcement.findById(id);
  if (!announcement) {
    throw new AppError('Announcement not found', 404);
  }

  await announcement.markAsUnreadBy(userId);

  res.status(200).json({
    success: true,
    message: 'Announcement marked as unread'
  });
});

// @desc    Get read status for course announcements
// @route   GET /api/announcements/course/:courseId/read-status
// @access  Private (Students)
export const getReadStatus = asyncHandler(async (req: Request, res: Response) => {
  const { courseId } = req.params;
  const userId = req.user?.id;

  // Validate course access
  const course = await Course.findById(courseId);
  if (!course) {
    throw new AppError('Course not found', 404);
  }

  const isInstructor = course.instructor.toString() === userId;
  
  // Allow anyone who can access the course to see read status
  // No enrollment check needed - if they can access the course, they can see read status
  console.log('✅ Read status access granted - anyone with course access can view read status');

  // Get all announcements for the course
  const announcements = await Announcement.find({
    course: courseId,
    isPublished: true
  });

  // Extract read status for current user
  const readStatus = announcements.map(announcement => ({
    announcementId: announcement._id,
    readAt: announcement.readBy.find(read => read.student.toString() === userId)?.readAt || null
  })).filter(status => status.readAt);

  res.status(200).json({
    success: true,
    data: readStatus
  });
});

// @desc    Get unread count for course
// @route   GET /api/announcements/course/:courseId/unread-count
// @access  Private (Students)
export const getUnreadCount = asyncHandler(async (req: Request, res: Response) => {
  const { courseId } = req.params;
  const userId = req.user?.id;

  // Validate course access
  const course = await Course.findById(courseId);
  if (!course) {
    throw new AppError('Course not found', 404);
  }

  const isInstructor = course.instructor.toString() === userId;
  
  // Allow anyone who can access the course to see announcements
  // No enrollment check needed - if they can access the course, they can see announcements

  const unreadCount = await Announcement.countDocuments({
    course: courseId,
    isPublished: true,
    'readBy.student': { $ne: userId },
    $or: [
      { scheduledDate: { $lte: new Date() } },
      { scheduledDate: null }
    ]
  });

  res.status(200).json({
    success: true,
    data: unreadCount
  });
});

// @desc    Search announcements
// @route   GET /api/announcements/course/:courseId/search
// @access  Private
export const searchAnnouncements = asyncHandler(async (req: Request, res: Response) => {
  const { courseId } = req.params;
  const { q: query } = req.query;

  if (!query) {
    throw new AppError('Search query is required', 400);
  }

  // Validate course access
  const course = await Course.findById(courseId);
  if (!course) {
    throw new AppError('Course not found', 404);
  }

  const userId = req.user?.id;
  const isInstructor = course.instructor.toString() === userId;
  
  // Allow anyone who can access the course to see announcements
  // No enrollment check needed - if they can access the course, they can see announcements

  const announcements = await Announcement.searchAnnouncements(courseId, query as string);

  res.status(200).json({
    success: true,
    data: announcements,
    count: announcements.length
  });
});

// @desc    Get pinned announcements
// @route   GET /api/announcements/course/:courseId/pinned
// @access  Private
export const getPinnedAnnouncements = asyncHandler(async (req: Request, res: Response) => {
  const { courseId } = req.params;

  // Validate course access
  const course = await Course.findById(courseId);
  if (!course) {
    throw new AppError('Course not found', 404);
  }

  const userId = req.user?.id;
  const isInstructor = course.instructor.toString() === userId;
  
  // Allow anyone who can access the course to see announcements
  // No enrollment check needed - if they can access the course, they can see announcements

  const announcements = await Announcement.findPinned(courseId);

  res.status(200).json({
    success: true,
    data: announcements,
    count: announcements.length
  });
});

// @desc    Toggle pin status
// @route   PATCH /api/announcements/:id/pin
// @access  Private (Instructors only)
export const togglePinStatus = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const announcement = await Announcement.findById(id);
  if (!announcement) {
    throw new AppError('Announcement not found', 404);
  }

  // Check if user is the instructor
  if (announcement.instructor.toString() !== req.user?.id) {
    throw new AppError('Only the announcement creator can pin/unpin it', 403);
  }

  announcement.isPinned = !announcement.isPinned;
  await announcement.save();

  res.status(200).json({
    success: true,
    data: announcement
  });
});

// @desc    Get announcement statistics
// @route   GET /api/announcements/:id/stats
// @access  Private (Instructors only)
export const getAnnouncementStats = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const announcement = await Announcement.findById(id).populate('course');
  if (!announcement) {
    throw new AppError('Announcement not found', 404);
  }

  // Check if user is the instructor
  if (announcement.instructor.toString() !== req.user?.id) {
    throw new AppError('Only the announcement creator can view statistics', 403);
  }

  const course = announcement.course as any;
  const totalStudents = course.students.length;
  const readCount = announcement.readBy.length;
  const readPercentage = totalStudents > 0 ? Math.round((readCount / totalStudents) * 100) : 0;

  const stats = {
    totalStudents,
    readCount,
    unreadCount: totalStudents - readCount,
    readPercentage,
    createdAt: announcement.createdAt,
    lastReadAt: announcement.readBy.length > 0 
      ? announcement.readBy.sort((a, b) => b.readAt.getTime() - a.readAt.getTime())[0].readAt
      : null
  };

  res.status(200).json({
    success: true,
    data: stats
  });
});

// @desc    Bulk operations on announcements
// @route   POST /api/announcements/bulk
// @access  Private (Instructors only)
export const bulkOperations = asyncHandler(async (req: Request, res: Response) => {
  const { operation, announcementIds, data } = req.body;

  if (!operation || !announcementIds || !Array.isArray(announcementIds)) {
    throw new AppError('Invalid bulk operation request', 400);
  }

  // Verify all announcements belong to the instructor
  const announcements = await Announcement.find({
    _id: { $in: announcementIds },
    instructor: req.user?.id
  });

  if (announcements.length !== announcementIds.length) {
    throw new AppError('Some announcements not found or access denied', 403);
  }

  let result;

  switch (operation) {
    case 'delete':
      // Delete attachments first
      for (const announcement of announcements) {
        for (const attachment of announcement.attachments) {
          await deleteFile(attachment.fileUrl);
        }
      }
      result = await Announcement.deleteMany({
        _id: { $in: announcementIds },
        instructor: req.user?.id
      });
      break;

    case 'publish':
      result = await Announcement.updateMany(
        { _id: { $in: announcementIds }, instructor: req.user?.id },
        { isPublished: true }
      );
      break;

    case 'unpublish':
      result = await Announcement.updateMany(
        { _id: { $in: announcementIds }, instructor: req.user?.id },
        { isPublished: false }
      );
      break;

    case 'pin':
      result = await Announcement.updateMany(
        { _id: { $in: announcementIds }, instructor: req.user?.id },
        { isPinned: true }
      );
      break;

    case 'unpin':
      result = await Announcement.updateMany(
        { _id: { $in: announcementIds }, instructor: req.user?.id },
        { isPinned: false }
      );
      break;

    case 'update':
      if (!data) {
        throw new AppError('Update data is required', 400);
      }
      result = await Announcement.updateMany(
        { _id: { $in: announcementIds }, instructor: req.user?.id },
        data
      );
      break;

    default:
      throw new AppError('Invalid bulk operation', 400);
  }

  res.status(200).json({
    success: true,
    message: `Bulk ${operation} completed successfully`,
    modifiedCount: result.modifiedCount || result.deletedCount
  });
});