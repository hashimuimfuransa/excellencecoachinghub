import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import Feedback from '../models/Feedback';
import { User } from '../models/User';
import { LiveSession } from '../models/LiveSession';

// Submit feedback for a live session
export const submitFeedback = asyncHandler(async (req: Request, res: Response) => {
  const { sessionId, roomId, rating, comment, sessionStartTime, sessionEndTime, attendanceDuration } = req.body;
  const studentId = req.user?._id;

  if (!studentId) {
    return res.status(401).json({
      success: false,
      message: 'User not authenticated'
    });
  }

  // Validate required fields
  if (!sessionId || !roomId || !rating || !comment || !sessionStartTime || !sessionEndTime) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields: sessionId, roomId, rating, comment, sessionStartTime, sessionEndTime'
    });
  }

  // Validate rating
  if (rating < 1 || rating > 5) {
    return res.status(400).json({
      success: false,
      message: 'Rating must be between 1 and 5'
    });
  }

  // Check if feedback already exists for this student and session
  const existingFeedback = await Feedback.findOne({
    sessionId,
    studentId
  });

  if (existingFeedback) {
    return res.status(400).json({
      success: false,
      message: 'Feedback already submitted for this session'
    });
  }

  // Find the live session to get teacher information
  const liveSession = await LiveSession.findOne({ sessionId });
  let teacherId = null;
  
  if (liveSession) {
    teacherId = liveSession.teacherId;
  }

  // Create new feedback
  const feedback = new Feedback({
    sessionId,
    roomId,
    studentId,
    teacherId,
    rating,
    comment,
    sessionStartTime: new Date(sessionStartTime),
    sessionEndTime: new Date(sessionEndTime),
    attendanceDuration: attendanceDuration || 0
  });

  await feedback.save();

  res.status(201).json({
    success: true,
    message: 'Feedback submitted successfully',
    data: {
      feedbackId: feedback._id,
      sessionId: feedback.sessionId,
      rating: feedback.rating,
      submittedAt: feedback.createdAt
    }
  });
});

// Get feedback for a specific session (for teachers and admins)
export const getSessionFeedback = asyncHandler(async (req: Request, res: Response) => {
  const { sessionId } = req.params;
  const userRole = req.user?.role;

  if (!sessionId) {
    return res.status(400).json({
      success: false,
      message: 'Session ID is required'
    });
  }

  // Only teachers and admins can view session feedback
  if (userRole !== 'teacher' && userRole !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only teachers and admins can view session feedback.'
    });
  }

  const feedback = await Feedback.find({ sessionId })
    .populate('studentId', 'firstName lastName email')
    .populate('teacherId', 'firstName lastName email')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: {
      sessionId,
      feedbackCount: feedback.length,
      feedback: feedback.map(f => ({
        id: f._id,
        studentName: `${f.studentId.firstName} ${f.studentId.lastName}`,
        studentEmail: f.studentId.email,
        rating: f.rating,
        comment: f.comment,
        attendanceDuration: f.attendanceDuration,
        submittedAt: f.createdAt
      }))
    }
  });
});

// Get feedback for a teacher (for teachers to view their feedback)
export const getTeacherFeedback = asyncHandler(async (req: Request, res: Response) => {
  const teacherId = req.user?._id;
  const userRole = req.user?.role;

  if (!teacherId) {
    return res.status(401).json({
      success: false,
      message: 'User not authenticated'
    });
  }

  if (userRole !== 'teacher') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only teachers can view their feedback.'
    });
  }

  const { page = 1, limit = 10, sessionId } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const query: any = { teacherId };
  if (sessionId) {
    query.sessionId = sessionId;
  }

  const feedback = await Feedback.find(query)
    .populate('studentId', 'firstName lastName email')
    .populate('teacherId', 'firstName lastName email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  const total = await Feedback.countDocuments(query);

  res.status(200).json({
    success: true,
    data: {
      feedback: feedback.map(f => ({
        id: f._id,
        sessionId: f.sessionId,
        roomId: f.roomId,
        studentName: `${f.studentId.firstName} ${f.studentId.lastName}`,
        studentEmail: f.studentId.email,
        rating: f.rating,
        comment: f.comment,
        attendanceDuration: f.attendanceDuration,
        sessionStartTime: f.sessionStartTime,
        sessionEndTime: f.sessionEndTime,
        submittedAt: f.createdAt
      })),
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    }
  });
});

// Get feedback statistics for a teacher
export const getTeacherFeedbackStats = asyncHandler(async (req: Request, res: Response) => {
  const teacherId = req.user?._id;
  const userRole = req.user?.role;

  if (!teacherId) {
    return res.status(401).json({
      success: false,
      message: 'User not authenticated'
    });
  }

  if (userRole !== 'teacher') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only teachers can view their feedback statistics.'
    });
  }

  const { period = '30' } = req.query; // days
  const daysAgo = new Date();
  daysAgo.setDate(daysAgo.getDate() - Number(period));

  const feedback = await Feedback.find({
    teacherId,
    createdAt: { $gte: daysAgo }
  });

  const totalFeedback = feedback.length;
  const averageRating = totalFeedback > 0 
    ? feedback.reduce((sum, f) => sum + f.rating, 0) / totalFeedback 
    : 0;

  const ratingDistribution = {
    1: feedback.filter(f => f.rating === 1).length,
    2: feedback.filter(f => f.rating === 2).length,
    3: feedback.filter(f => f.rating === 3).length,
    4: feedback.filter(f => f.rating === 4).length,
    5: feedback.filter(f => f.rating === 5).length
  };

  res.status(200).json({
    success: true,
    data: {
      period: `${period} days`,
      totalFeedback,
      averageRating: Math.round(averageRating * 100) / 100,
      ratingDistribution,
      recentFeedback: feedback.slice(0, 5).map(f => ({
        id: f._id,
        sessionId: f.sessionId,
        rating: f.rating,
        comment: f.comment.substring(0, 100) + (f.comment.length > 100 ? '...' : ''),
        submittedAt: f.createdAt
      }))
    }
  });
});

// Get all feedback (for admins)
export const getAllFeedback = asyncHandler(async (req: Request, res: Response) => {
  const userRole = req.user?.role;

  if (userRole !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only admins can view all feedback.'
    });
  }

  const { page = 1, limit = 20, teacherId, sessionId } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const query: any = {};
  if (teacherId) query.teacherId = teacherId;
  if (sessionId) query.sessionId = sessionId;

  const feedback = await Feedback.find(query)
    .populate('studentId', 'firstName lastName email')
    .populate('teacherId', 'firstName lastName email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  const total = await Feedback.countDocuments(query);

  res.status(200).json({
    success: true,
    data: {
      feedback: feedback.map(f => ({
        id: f._id,
        sessionId: f.sessionId,
        roomId: f.roomId,
        studentName: `${f.studentId.firstName} ${f.studentId.lastName}`,
        studentEmail: f.studentId.email,
        teacherName: f.teacherId ? `${f.teacherId.firstName} ${f.teacherId.lastName}` : 'Unknown',
        teacherEmail: f.teacherId?.email || 'Unknown',
        rating: f.rating,
        comment: f.comment,
        attendanceDuration: f.attendanceDuration,
        sessionStartTime: f.sessionStartTime,
        sessionEndTime: f.sessionEndTime,
        submittedAt: f.createdAt
      })),
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    }
  });
});
