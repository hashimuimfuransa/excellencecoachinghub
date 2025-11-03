import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { LiveSession } from '../models/LiveSession';
import { User } from '../models/User';
import { Course } from '../models/Course';
import { UserProgress } from '../models/UserProgress';
import { hmsVideoService } from '../services/hmsVideoService';
import { recordingProcessorService } from '../services/recordingProcessorService';

// Get all live sessions (Admin only)
export const getAllSessions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string;
    const teacherId = req.query.teacherId as string;
    const search = req.query.search as string || '';

    // Build filter
    const filter: any = {};
    if (status && status !== 'all') {
      filter.status = status;
    }
    if (teacherId) {
      filter.instructor = teacherId;
    }

    // Build search query
    let sessions;
    if (search) {
      sessions = await LiveSession.aggregate([
        {
          $lookup: {
            from: 'users',
            localField: 'instructor',
            foreignField: '_id',
            as: 'instructorInfo'
          }
        },
        {
          $lookup: {
            from: 'courses',
            localField: 'course',
            foreignField: '_id',
            as: 'courseInfo'
          }
        },
        {
          $unwind: { path: '$instructorInfo', preserveNullAndEmptyArrays: true }
        },
        {
          $unwind: { path: '$courseInfo', preserveNullAndEmptyArrays: true }
        },
        {
          $match: {
            ...filter,
            $or: [
              { title: { $regex: search, $options: 'i' } },
              { 'instructorInfo.firstName': { $regex: search, $options: 'i' } },
              { 'instructorInfo.lastName': { $regex: search, $options: 'i' } },
              { 'courseInfo.title': { $regex: search, $options: 'i' } }
            ]
          }
        },
        { $sort: { scheduledTime: -1 } },
        { $skip: (page - 1) * limit },
        { $limit: limit }
      ]);
    } else {
      sessions = await LiveSession.find(filter)
        .populate('instructor', 'firstName lastName email')
        .populate('course', 'title')
        .sort({ scheduledTime: -1 })
        .skip((page - 1) * limit)
        .limit(limit);
    }

    const totalSessions = await LiveSession.countDocuments(filter);
    const totalPages = Math.ceil(totalSessions / limit);

    res.status(200).json({
      success: true,
      data: {
        sessions,
        pagination: {
          currentPage: page,
          totalPages,
          totalSessions,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get live session by ID (Admin only)
export const getSessionById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    
    // Optimized query with selective field loading and lean()
    const session = await LiveSession.findById(id)
      .select('title description course instructor scheduledTime duration status actualStartTime actualEndTime meetingId meetingUrl isRecorded recordingUrl maxParticipants chatEnabled handRaiseEnabled screenShareEnabled attendanceRequired createdAt updatedAt participants attendees')
      .populate('instructor', 'firstName lastName email')
      .populate('course', 'title description')
      .lean(); // Convert to plain JS object for better performance

    if (!session) {
      res.status(404).json({
        success: false,
        error: 'Session not found'
      });
      return;
    }

    // Load participants and attendees only if needed (lazy loading)
    const participantIds = session.participants?.slice(0, 10) || []; // Limit to first 10
    const attendeeUserIds = session.attendees?.slice(0, 10).map((a: any) => a.user) || [];
    
    const [participants, attendeeUsers] = await Promise.all([
      participantIds.length > 0 ? 
        User.find({ _id: { $in: participantIds } }).select('firstName lastName email').lean() : 
        Promise.resolve([]),
      attendeeUserIds.length > 0 ? 
        User.find({ _id: { $in: attendeeUserIds } }).select('firstName lastName email').lean() : 
        Promise.resolve([])
    ]);

    // Map attendee users back to attendees
    const attendees = session.attendees?.slice(0, 10).map((attendee: any) => ({
      ...attendee,
      user: attendeeUsers.find((user: any) => user._id.toString() === attendee.user?.toString()) || attendee.user
    })) || [];

    const optimizedSession = {
      ...session,
      participants: participants,
      attendees: attendees
    };

    res.status(200).json({
      success: true,
      data: { session: optimizedSession }
    });
  } catch (error) {
    next(error);
  }
};

// Get sessions by teacher (Admin only)
export const getSessionsByTeacher = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { teacherId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string;

    // Build filter
    const filter: any = { instructor: teacherId };
    if (status && status !== 'all') {
      filter.status = status;
    }

    const sessions = await LiveSession.find(filter)
      .populate('instructor', 'firstName lastName email')
      .populate('course', 'title')
      .sort({ scheduledTime: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const totalSessions = await LiveSession.countDocuments(filter);
    const totalPages = Math.ceil(totalSessions / limit);

    res.status(200).json({
      success: true,
      data: {
        sessions,
        pagination: {
          currentPage: page,
          totalPages,
          totalSessions,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get sessions by course (Available to anyone who can access the course)
export const getSessionsByCourse = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { courseId } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    console.log('🔍 Live session access check:', {
      userId,
      courseId,
      userRole
    });

    // Allow anyone who can access the course to see live sessions
    // No enrollment check needed - if they can access the course, they can see sessions
    console.log('✅ Access granted - anyone with course access can view live sessions');

    // Get all sessions for the course
    const sessions = await LiveSession.find({ course: courseId })
      .populate('instructor', 'firstName lastName email')
      .populate('course', 'title description')
      .sort({ scheduledTime: -1 });

    res.status(200).json({
      success: true,
      data: { sessions }
    });
  } catch (error) {
    next(error);
  }
};

// Get active/live sessions (Admin only)
export const getActiveSessions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const sessions = await LiveSession.find({ status: 'live' })
      .populate('instructor', 'firstName lastName email')
      .populate('course', 'title')
      .populate('participants', 'firstName lastName email')
      .sort({ actualStartTime: -1 });

    res.status(200).json({
      success: true,
      data: { sessions }
    });
  } catch (error) {
    next(error);
  }
};

// Cancel session (Admin only)
export const cancelSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    const session = await LiveSession.findById(id);
    if (!session) {
      res.status(404).json({
        success: false,
        error: 'Session not found'
      });
      return;
    }

    if (session.status === 'ended' || session.status === 'cancelled') {
      res.status(400).json({
        success: false,
        error: 'Cannot cancel a session that has already ended or been cancelled'
      });
      return;
    }

    session.status = 'cancelled';
    // You might want to add a cancellation reason field to the model
    await session.save();

    res.status(200).json({
      success: true,
      data: { session },
      message: 'Session cancelled successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Get session statistics (Admin only)
export const getSessionStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const totalSessions = await LiveSession.countDocuments();
    const activeSessions = await LiveSession.countDocuments({ status: 'live' });
    const scheduledSessions = await LiveSession.countDocuments({ status: 'scheduled' });
    const endedSessions = await LiveSession.countDocuments({ status: 'ended' });
    const cancelledSessions = await LiveSession.countDocuments({ status: 'cancelled' });
    
    // Recording statistics
    const recordedSessions = await LiveSession.countDocuments({ 
      isRecorded: true, 
      recordingStatus: 'completed',
      recordingUrl: { $exists: true, $ne: null }
    });
    const failedRecordings = await LiveSession.countDocuments({ recordingStatus: 'failed' });
    
    // Calculate total storage used
    const storageStats = await LiveSession.aggregate([
      {
        $match: {
          recordingSize: { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: null,
          totalStorageUsed: { $sum: '$recordingSize' }
        }
      }
    ]);
    const totalStorageUsed = storageStats.length > 0 ? storageStats[0].totalStorageUsed : 0;

    // Get sessions by teacher
    const sessionsByTeacher = await LiveSession.aggregate([
      {
        $group: {
          _id: '$instructor',
          sessionCount: { $sum: 1 },
          activeSessions: {
            $sum: { $cond: [{ $eq: ['$status', 'live'] }, 1, 0] }
          },
          scheduledSessions: {
            $sum: { $cond: [{ $eq: ['$status', 'scheduled'] }, 1, 0] }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'teacher'
        }
      },
      {
        $unwind: '$teacher'
      },
      {
        $project: {
          teacherId: '$_id',
          teacherName: { $concat: ['$teacher.firstName', ' ', '$teacher.lastName'] },
          teacherEmail: '$teacher.email',
          sessionCount: 1,
          activeSessions: 1,
          scheduledSessions: 1
        }
      },
      { $sort: { sessionCount: -1 } },
      { $limit: 10 }
    ]);

    // Get recent sessions
    const recentSessions = await LiveSession.find()
      .populate('instructor', 'firstName lastName email')
      .populate('course', 'title')
      .sort({ createdAt: -1 })
      .limit(5);

    // Get upcoming sessions
    const upcomingSessions = await LiveSession.find({
      status: 'scheduled',
      scheduledTime: { $gte: new Date() }
    })
      .populate('instructor', 'firstName lastName email')
      .populate('course', 'title')
      .sort({ scheduledTime: 1 })
      .limit(5);

    res.status(200).json({
      success: true,
      data: {
        totalSessions,
        activeSessions,
        scheduledSessions,
        endedSessions,
        cancelledSessions,
        recordedSessions,
        failedRecordings,
        totalStorageUsed,
        sessionsByTeacher,
        recentSessions,
        upcomingSessions
      }
    });
  } catch (error) {
    next(error);
  }
};

// End session (Teacher/Admin)
export const endSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    console.log('🏁 End session request received:', {
      body: req.body,
      userId: req.user?.id || req.user?._id?.toString()
    });

    const { sessionId, roomId, startTime, endTime, attendance, recordingId, participants } = req.body;
    const userId = req.user?.id || req.user?._id?.toString();

    if (!userId) {
      console.log('❌ No user ID found in request');
      res.status(401).json({
        success: false,
        error: 'User authentication required'
      });
      return;
    }

    // Find session by ID or roomId
    let session;
    if (sessionId) {
      session = await LiveSession.findById(sessionId);
    } else if (roomId) {
      session = await LiveSession.findOne({ meetingId: roomId });
    }

    if (!session) {
      res.status(404).json({
        success: false,
        error: 'Session not found'
      });
      return;
    }

    // Verify user is the instructor or admin
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      });
      return;
    }

    if (user.role !== 'admin' && session.instructor.toString() !== userId) {
      res.status(403).json({
        success: false,
        error: 'You are not authorized to end this session'
      });
      return;
    }

    // Update session with final data
    if (startTime && !session.actualStartTime) {
      session.actualStartTime = new Date(startTime);
    }
    if (endTime) {
      session.actualEndTime = new Date(endTime);
    }

    // Update attendance data
    if (attendance && Array.isArray(attendance)) {
      attendance.forEach((attendanceRecord: any) => {
        const existingAttendee = session.attendees.find(
          (a: any) => a.user.toString() === attendanceRecord.peerId
        );
        
        if (existingAttendee) {
          existingAttendee.duration = Math.floor(attendanceRecord.duration / 60); // Convert to minutes
          existingAttendee.participated = true;
        }
      });
    }

    // Handle recording if there's a recordingId
    if (recordingId && session.recordingStatus === 'recording') {
      try {
        console.log('🎥 Stopping recording for session:', recordingId);
        const finalRoomId = session.meetingId || roomId || `session-${sessionId}`;
        
        // Try to stop the recording
        const recordingResult = await hmsVideoService.stopRecording(finalRoomId, recordingId);
        
        if (recordingResult.recordingUrl) {
          console.log('✅ Recording URL received immediately:', recordingResult.recordingUrl);
          await session.stopRecording(recordingResult.recordingUrl);
        } else {
          console.log('⚠️ No immediate recording URL, starting background processing');
          session.recordingStatus = 'processing';
          
          // Start background processing to wait for recording completion
          recordingProcessorService.startRecordingProcessing(sessionId, recordingId);
        }
      } catch (error) {
        console.error('❌ Error stopping recording:', error);
        
        // If stopping fails, still try background processing
        if (error.message.includes('404') || error.message.includes('not found')) {
          console.log('🔄 Recording not found during stop, starting background processing anyway');
          session.recordingStatus = 'processing';
          recordingProcessorService.startRecordingProcessing(sessionId, recordingId);
        } else {
          session.recordingStatus = 'failed';
        }
      }
    }

    // End the session
    await session.endSession();

    // Also end the HMS room
    try {
      const finalRoomId = session.meetingId || roomId || `session-${sessionId}`;
      if (finalRoomId) {
        await hmsVideoService.endRoom(finalRoomId, 'Session ended by instructor');
        console.log('✅ HMS room ended successfully');
      }
    } catch (error) {
      console.error('❌ Error ending HMS room:', error);
      // Don't fail the response if HMS room ending fails
    }

    res.status(200).json({
      success: true,
      data: { session },
      message: 'Session ended successfully'
    });
  } catch (error) {
    console.error('❌ Error ending session:', error);
    next(error);
  }
};

// Force end session (Admin only)
export const forceEndSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    
    const session = await LiveSession.findById(id);
    if (!session) {
      res.status(404).json({
        success: false,
        error: 'Session not found'
      });
      return;
    }

    if (session.status !== 'live') {
      res.status(400).json({
        success: false,
        error: 'Can only force end live sessions'
      });
      return;
    }

    await session.endSession();

    res.status(200).json({
      success: true,
      data: { session },
      message: 'Session ended successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Get session attendance details (Admin only)
export const getSessionAttendance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    
    const session = await LiveSession.findById(id)
      .populate('attendees.user', 'firstName lastName email')
      .populate('participants', 'firstName lastName email');

    if (!session) {
      res.status(404).json({
        success: false,
        error: 'Session not found'
      });
      return;
    }

    const attendanceRate = session.getAttendanceRate();
    const totalRegistered = session.participants.length;
    const totalAttended = session.attendees.filter(a => a.participated).length;

    res.status(200).json({
      success: true,
      data: {
        session: {
          id: session._id,
          title: session.title,
          scheduledTime: session.scheduledTime,
          duration: session.duration,
          status: session.status
        },
        attendance: {
          totalRegistered,
          totalAttended,
          attendanceRate,
          attendees: session.attendees
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get session recordings (for students and admins)
export const getSessionRecordings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const courseId = req.query.courseId as string;
    const skip = (page - 1) * limit;

    let query: any = {
      status: 'ended',
      isRecorded: true,
      recordingUrl: { $exists: true, $ne: null }
    };

    // If student, only show recordings from courses they're enrolled in
    if (userRole === 'student') {
      const UserProgress = require('../models/UserProgress').UserProgress;
      const enrollments = await UserProgress.find({ user: userId }).select('course');
      const enrolledCourseIds = enrollments.map((enrollment: any) => enrollment.course);
      query.course = { $in: enrolledCourseIds };
    }

    // If courseId is specified, filter by course
    if (courseId) {
      query.course = courseId;
    }

    const recordings = await LiveSession.find(query)
      .populate('course', 'title description thumbnail')
      .populate('instructor', 'firstName lastName')
      .select('title description scheduledTime actualStartTime actualEndTime duration recordingUrl recordingSize course instructor createdAt')
      .sort({ scheduledTime: -1 })
      .skip(skip)
      .limit(limit);

    const total = await LiveSession.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        recordings,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get specific recording details
export const getRecordingById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    const recording = await LiveSession.findOne({
      _id: id,
      status: 'ended',
      isRecorded: true,
      recordingUrl: { $exists: true, $ne: null }
    })
      .populate('course', 'title description thumbnail')
      .populate('instructor', 'firstName lastName email')
      .populate('attendees.user', 'firstName lastName email');

    if (!recording) {
      res.status(404).json({
        success: false,
        error: 'Recording not found'
      });
      return;
    }

    // Check if student has access to this recording
    if (userRole === 'student') {
      const UserProgress = require('../models/UserProgress').UserProgress;
      const enrollment = await UserProgress.findOne({
        user: userId,
        course: recording.course._id
      });

      if (!enrollment) {
        res.status(403).json({
          success: false,
          error: 'You do not have access to this recording'
        });
        return;
      }
    }

    res.status(200).json({
      success: true,
      data: { recording }
    });
  } catch (error) {
    next(error);
  }
};

// Get available sessions for students (show only sessions from enrolled courses)
export const getStudentAvailableSessions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    console.log('🎯 getStudentAvailableSessions called');
    const studentId = req.user?.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string; // Don't default to 'scheduled', show all sessions
    const courseId = req.query.courseId as string; // Optional course filter
    const skip = (page - 1) * limit;

    console.log('🔍 Student session access check:', {
      studentId,
      courseId,
      status,
      page,
      limit
    });

    // First, get all courses the student is enrolled in
    const { CourseEnrollment } = await import('../models/CourseEnrollment');
    const enrollments = await CourseEnrollment.find({ student: studentId, isActive: true })
      .populate('course', '_id title')
      .select('course');

    const enrolledCourseIds = enrollments
      .filter(enrollment => enrollment.course != null)
      .map(enrollment => enrollment.course._id);

    console.log('📚 Student enrolled courses:', {
      totalEnrollments: enrollments.length,
      enrolledCourseIds,
      enrollmentDetails: enrollments
        .filter(e => e.course != null)
        .map(e => ({
          courseId: e.course._id,
          courseTitle: e.course.title
        }))
    });

    // Build filter - only show sessions from enrolled courses
    const filter: any = {
      course: { $in: enrolledCourseIds }
    };

    // If specific courseId is requested, ensure student is enrolled in that course
    if (courseId) {
      const isEnrolledInRequestedCourse = Array.isArray(enrolledCourseIds) && enrolledCourseIds.some((id: any) => id?.toString?.() === courseId);
      if (!isEnrolledInRequestedCourse) {
        res.status(403).json({
          success: false,
          error: 'You are not enrolled in this course'
        });
        return;
      }
      filter.course = courseId;
    }

    if (status && status !== 'all') {
      filter.status = status;
    }

    // Get sessions with course and instructor details
    const sessions = await LiveSession.find(filter)
      .populate('course', 'title description')
      .populate('instructor', 'firstName lastName email')
      .sort({ scheduledTime: -1 }) // Sort by scheduled time (most recent first)
      .skip(skip)
      .limit(limit);

    const totalSessions = await LiveSession.countDocuments(filter);
    const totalPages = Math.ceil(totalSessions / limit);

    console.log('✅ Student sessions loaded:', {
      totalSessions,
      sessionsFound: sessions.length,
      enrolledCourses: enrolledCourseIds.length,
      courseId: courseId || 'all enrolled courses',
      sessions: sessions.map(s => ({
        id: s._id,
        title: s.title,
        courseId: s.course._id,
        courseTitle: s.course.title,
        status: s.status,
        scheduledTime: s.scheduledTime
      }))
    });

    res.status(200).json({
      success: true,
      data: {
        sessions,
        pagination: {
          currentPage: page,
          totalPages,
          totalSessions,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Error fetching student available sessions:', error);
    next(error);
  }
};

// Sync recorded sessions to course content
export const syncRecordedSessionsToCourseContent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { courseId } = req.params;

    // Find all completed recorded sessions for this course
    const recordedSessions = await LiveSession.find({
      course: courseId,
      recordingStatus: 'completed',
      recordingUrl: { $exists: true, $ne: null }
    });

    let addedCount = 0;
    const errors: string[] = [];

    for (const session of recordedSessions) {
      try {
        await session.addRecordingToCourseContent();
        addedCount++;
      } catch (error: any) {
        errors.push(`Failed to add session "${session.title}": ${error.message}`);
      }
    }

    res.status(200).json({
      success: true,
      data: {
        totalRecordedSessions: recordedSessions.length,
        addedToCourseContent: addedCount,
        errors: errors.length > 0 ? errors : undefined
      },
      message: `Successfully synced ${addedCount} recorded sessions to course content`
    });
  } catch (error) {
    next(error);
  }
};

// Join live session (Student)
export const joinLiveSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { sessionId } = req.params;
    const studentId = req.user?.id;

    console.log('joinLiveSession - sessionId:', sessionId);
    console.log('joinLiveSession - studentId:', studentId);
    console.log('joinLiveSession - user:', req.user);

    if (!studentId) {
      console.log('joinLiveSession - No student ID found');
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
      return;
    }

    // Get the session
    console.log('joinLiveSession - Looking for session with ID:', sessionId);
    const session = await LiveSession.findById(sessionId)
      .populate('instructor', 'firstName lastName email')
      .populate('course', 'title description');

    console.log('joinLiveSession - Found session:', session ? { id: session._id, title: session.title, status: session.status } : 'null');

    if (!session) {
      console.log('joinLiveSession - Session not found');
      res.status(404).json({
        success: false,
        error: 'Session not found'
      });
      return;
    }

    // Check if session is live or scheduled
    console.log('joinLiveSession - Session status:', session.status);
    if (session.status !== 'live' && session.status !== 'scheduled') {
      console.log('joinLiveSession - Session not available for joining, status:', session.status);
      res.status(400).json({
        success: false,
        error: `Session is not available for joining. Current status: ${session.status}`
      });
      return;
    }

    // Check if student is enrolled in the course with proper permissions
    const { CourseEnrollment } = await import('../models/CourseEnrollment');
    
    console.log('joinLiveSession - Checking enrollment with courseId:', session.course._id);
    
    const hasAccess = await CourseEnrollment.checkAccess(
      studentId,
      session.course._id.toString(),
      'live_sessions'
    );

    console.log('joinLiveSession - Access check result:', hasAccess);

    if (!hasAccess) {
      console.log('joinLiveSession - Student does not have access to live sessions for this course');
      res.status(403).json({
        success: false,
        error: 'You do not have access to live sessions in this course. Please complete your enrollment and payment.'
      });
      return;
    }

    // Add student to attendees if not already present
    const existingAttendee = session.attendees.find(
      (attendee: any) => attendee.user.toString() === studentId
    );

    if (!existingAttendee) {
      session.attendees.push({
        user: studentId,
        joinedAt: new Date(),
        leftAt: null,
        duration: 0
      });
      await session.save();
    }

    res.status(200).json({
      success: true,
      data: {
        session: {
          _id: session._id,
          title: session.title,
          description: session.description,
          instructor: session.instructor,
          course: session.course,
          scheduledTime: session.scheduledTime,
          duration: session.duration,
          status: session.status,
          meetingUrl: session.meetingUrl,
          chatEnabled: session.chatEnabled,
          recordingEnabled: session.recordingEnabled,
          maxParticipants: session.maxParticipants,
          attendees: session.attendees
        }
      }
    });
  } catch (error) {
    console.error('Error joining live session:', error);
    next(error);
  }
};
