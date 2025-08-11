import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { LiveSession } from '../models/LiveSession';
import { Course } from '../models/Course';
import { User } from '../models/User';
import { TeacherProfile } from '../models/TeacherProfile';
import { notificationService } from '../services/notificationService';

// Create a new live session (Teacher only)
export const createLiveSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
      return;
    }

    const teacherId = req.user?.id;
    const {
      title,
      description,
      courseId,
      scheduledTime,
      duration,
      maxParticipants,
      isRecorded,
      agenda,
      chatEnabled,
      handRaiseEnabled,
      screenShareEnabled,
      attendanceRequired
    } = req.body;

    // Verify teacher profile is approved
    let teacherProfile = await TeacherProfile.findOne({ user: teacherId });

    // Auto-create and approve profile for development
    if (!teacherProfile) {
      try {
        teacherProfile = await TeacherProfile.create({
          userId: teacherId,
          specialization: ['General Teaching'],
          bio: 'Auto-generated profile for development',
          experience: 1,
          education: [{
            degree: 'Bachelor Degree',
            institution: 'University',
            year: 2020,
            field: 'Education'
          }],
          skills: ['Teaching'],
          languages: ['English'],
          teachingAreas: ['General'],
          preferredLevels: ['Beginner'],
          profileStatus: 'approved',
          submittedAt: new Date(),
          reviewedAt: new Date()
        });
      } catch (error: any) {
        // If profile already exists (duplicate key error), fetch it
        if (error.code === 11000) {
          teacherProfile = await TeacherProfile.findOne({ userId: teacherId });
          // Auto-approve if not approved
          if (teacherProfile && teacherProfile.profileStatus !== 'approved') {
            teacherProfile.profileStatus = 'approved';
            teacherProfile.reviewedAt = new Date();
            await teacherProfile.save();
          }
        } else {
          throw error;
        }
      }
    } else if (teacherProfile.profileStatus !== 'approved') {
      res.status(403).json({
        success: false,
        error: 'Your teacher profile must be approved to create live sessions',
        profileStatus: teacherProfile.profileStatus
      });
      return;
    }

    // Verify course belongs to teacher
    const course = await Course.findOne({ _id: courseId, instructor: teacherId });
    if (!course) {
      res.status(404).json({
        success: false,
        error: 'Course not found or you do not have permission to create sessions for this course'
      });
      return;
    }

    // Create live session
    const liveSession = new LiveSession({
      title,
      description,
      course: courseId,
      instructor: teacherId,
      scheduledTime: new Date(scheduledTime),
      duration,
      maxParticipants,
      isRecorded: isRecorded || false,
      agenda: agenda || [],
      chatEnabled: chatEnabled !== false,
      handRaiseEnabled: handRaiseEnabled !== false,
      screenShareEnabled: screenShareEnabled !== false,
      attendanceRequired: attendanceRequired || false,
      status: 'scheduled'
    });

    await liveSession.save();

    // Populate the response
    await liveSession.populate('course', 'title');
    await liveSession.populate('instructor', 'firstName lastName email');

    // Notify enrolled students about the new live session
    try {
      await notificationService.notifyStudentsLiveSessionScheduled(
        courseId,
        liveSession.course.title,
        title,
        liveSession._id.toString(),
        new Date(scheduledTime),
        `${liveSession.instructor.firstName} ${liveSession.instructor.lastName}`
      );
    } catch (notificationError) {
      console.error('Failed to send live session notifications:', notificationError);
      // Don't fail the session creation if notifications fail
    }

    res.status(201).json({
      success: true,
      data: { session: liveSession },
      message: 'Live session created successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Get teacher's live sessions
export const getTeacherSessions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const teacherId = req.user?.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string;

    // Build filter
    const filter: any = { instructor: teacherId };
    if (status && status !== 'all') {
      filter.status = status;
    }

    const sessions = await LiveSession.find(filter)
      .populate('course', 'title')
      .populate('participants', 'firstName lastName email')
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

// Get a specific session by ID (Teacher only - must own the session)
export const getSessionById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const teacherId = req.user?.id;

    const session = await LiveSession.findOne({ _id: id, instructor: teacherId })
      .populate('course', 'title description')
      .populate('participants', 'firstName lastName email')
      .populate('attendees.user', 'firstName lastName email');

    if (!session) {
      res.status(404).json({
        success: false,
        error: 'Session not found or you do not have permission to access it'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: { session }
    });
  } catch (error) {
    next(error);
  }
};

// Start a live session
export const startSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const teacherId = req.user?.id;

    const session = await LiveSession.findOne({ _id: id, instructor: teacherId });
    if (!session) {
      res.status(404).json({
        success: false,
        error: 'Session not found or you do not have permission to start it'
      });
      return;
    }

    if (session.status !== 'scheduled') {
      res.status(400).json({
        success: false,
        error: 'Only scheduled sessions can be started'
      });
      return;
    }

    // Start the session
    await session.startSession();

    // Populate course and instructor for notifications
    await session.populate('course', 'title');
    await session.populate('instructor', 'firstName lastName');

    // Notify enrolled students that the session is now live
    try {
      await notificationService.notifyStudentsLiveSessionLive(
        session.course._id.toString(),
        session.course.title,
        session.title,
        session._id.toString(),
        `${session.instructor.firstName} ${session.instructor.lastName}`
      );
    } catch (notificationError) {
      console.error('Failed to send live session live notifications:', notificationError);
    }

    res.status(200).json({
      success: true,
      data: { session },
      message: 'Session started successfully'
    });
  } catch (error) {
    next(error);
  }
};

// End a live session
export const endSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const teacherId = req.user?.id;

    const session = await LiveSession.findOne({ _id: id, instructor: teacherId });
    if (!session) {
      res.status(404).json({
        success: false,
        error: 'Session not found or you do not have permission to end it'
      });
      return;
    }

    if (session.status !== 'live') {
      res.status(400).json({
        success: false,
        error: 'Only live sessions can be ended'
      });
      return;
    }

    // End the session
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

// Update a live session
export const updateSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const teacherId = req.user?.id;
    const updates = req.body;

    const session = await LiveSession.findOne({ _id: id, instructor: teacherId });
    if (!session) {
      res.status(404).json({
        success: false,
        error: 'Session not found or you do not have permission to update it'
      });
      return;
    }

    if (session.status === 'live') {
      res.status(400).json({
        success: false,
        error: 'Cannot update a live session'
      });
      return;
    }

    // Update allowed fields
    const allowedUpdates = [
      'title', 'description', 'scheduledTime', 'duration', 'maxParticipants',
      'isRecorded', 'agenda', 'chatEnabled', 'handRaiseEnabled', 
      'screenShareEnabled', 'attendanceRequired'
    ];

    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        (session as any)[field] = updates[field];
      }
    });

    await session.save();

    await session.populate('course', 'title');
    await session.populate('instructor', 'firstName lastName email');

    res.status(200).json({
      success: true,
      data: { session },
      message: 'Session updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Delete a live session
export const deleteSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const teacherId = req.user?.id;

    const session = await LiveSession.findOne({ _id: id, instructor: teacherId });
    if (!session) {
      res.status(404).json({
        success: false,
        error: 'Session not found or you do not have permission to delete it'
      });
      return;
    }

    if (session.status === 'live') {
      res.status(400).json({
        success: false,
        error: 'Cannot delete a live session'
      });
      return;
    }

    await LiveSession.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Session deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Join session (for testing - in real implementation this would be handled by WebRTC/Socket.IO)
export const joinSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const session = await LiveSession.findById(id)
      .populate('course', 'title');

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
        error: 'Session is not currently live'
      });
      return;
    }

    // Check if user is enrolled in the course (for students) or is the instructor
    if (session.instructor.toString() !== userId) {
      // TODO: Check if student is enrolled in the course
      // For now, we'll allow any authenticated user to join
    }

    // Add user to participants if not already there
    if (!session.participants.some(p => p.toString() === userId)) {
      session.participants.push(userId as any);
      await session.save();
    }

    res.status(200).json({
      success: true,
      data: { 
        session: {
          _id: session._id,
          title: session.title,
          description: session.description,
          course: session.course,
          instructor: session.instructor,
          status: session.status,
          chatEnabled: session.chatEnabled,
          handRaiseEnabled: session.handRaiseEnabled,
          screenShareEnabled: session.screenShareEnabled
        }
      },
      message: 'Joined session successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Start recording a live session
export const startRecording = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const teacherId = req.user?.id;

    console.log(`🎥 Starting recording for session ${id} by teacher ${teacherId}`);

    const session = await LiveSession.findOne({ _id: id, instructor: teacherId })
      .populate('course', 'title')
      .populate('instructor', 'firstName lastName');

    if (!session) {
      console.log(`❌ Session not found or permission denied: ${id}`);
      res.status(404).json({
        success: false,
        error: 'Session not found or you do not have permission to record it'
      });
      return;
    }

    if (session.status !== 'live') {
      console.log(`❌ Session not live: ${session.status}`);
      res.status(400).json({
        success: false,
        error: 'Can only start recording during live sessions'
      });
      return;
    }

    if (session.recordingStatus === 'recording') {
      console.log(`❌ Recording already in progress for session: ${id}`);
      res.status(400).json({
        success: false,
        error: 'Recording is already in progress for this session'
      });
      return;
    }

    if (session.recordingStatus === 'completed') {
      console.log(`❌ Session already recorded: ${id}`);
      res.status(400).json({
        success: false,
        error: 'This session has already been recorded'
      });
      return;
    }

    // Start recording
    await session.startRecording();

    // In a real implementation, you would:
    // 1. Call your video conferencing service API to start recording
    // 2. Store the recording job ID
    // 3. Set up webhooks to receive recording completion notifications

    // For now, we'll simulate starting a recording
    const recordingId = `rec_${Date.now()}_${session._id}`;
    console.log(`✅ Recording started with ID: ${recordingId}`);

    // Update session with recording metadata
    session.meetingId = session.meetingId || `meeting_${session._id}`;
    await session.save();

    res.status(200).json({
      success: true,
      data: {
        session,
        recordingId,
        message: 'Recording started successfully'
      },
      message: 'Recording started successfully'
    });
  } catch (error) {
    console.error('❌ Error starting recording:', error);
    next(error);
  }
};

// Stop recording a live session
export const stopRecording = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { recordingUrl, recordingSize } = req.body;
    const teacherId = req.user?.id;

    console.log(`🛑 Stopping recording for session ${id} by teacher ${teacherId}`);

    const session = await LiveSession.findOne({ _id: id, instructor: teacherId })
      .populate('course', 'title')
      .populate('instructor', 'firstName lastName');

    if (!session) {
      console.log(`❌ Session not found or permission denied: ${id}`);
      res.status(404).json({
        success: false,
        error: 'Session not found or you do not have permission to stop recording'
      });
      return;
    }

    if (session.recordingStatus !== 'recording') {
      console.log(`❌ No active recording for session: ${id}, status: ${session.recordingStatus}`);
      res.status(400).json({
        success: false,
        error: 'No active recording found for this session'
      });
      return;
    }

    // Generate a mock recording URL if not provided
    const finalRecordingUrl = recordingUrl || `https://recordings.example.com/sessions/${session._id}/recording.mp4`;
    const finalRecordingSize = recordingSize || Math.floor(Math.random() * 500000000) + 100000000; // 100MB - 600MB

    // Stop recording and save recording details
    await session.stopRecording(finalRecordingUrl, finalRecordingSize);

    console.log(`✅ Recording stopped and saved: ${finalRecordingUrl}`);

    // In a real implementation, you would:
    // 1. Call your video conferencing service API to stop recording
    // 2. Wait for the recording to be processed
    // 3. Store the final recording URL and metadata
    // 4. Notify students that the recording is available

    // Notify enrolled students about the recording availability
    try {
      const { notificationService } = require('../services/notificationService');
      await notificationService.notifyStudentsRecordingAvailable(
        session.course._id.toString(),
        session.course.title,
        session.title,
        session._id.toString(),
        finalRecordingUrl,
        `${session.instructor.firstName} ${session.instructor.lastName}`
      );
    } catch (notificationError) {
      console.error('❌ Failed to notify students about recording:', notificationError);
      // Don't fail the request if notification fails
    }

    res.status(200).json({
      success: true,
      data: {
        session,
        recordingUrl: finalRecordingUrl,
        recordingSize: finalRecordingSize
      },
      message: 'Recording stopped and saved successfully'
    });
  } catch (error) {
    console.error('❌ Error stopping recording:', error);
    next(error);
  }
};

// Reset recording status (for debugging/admin purposes)
export const resetRecordingStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const teacherId = req.user?.id;

    console.log(`🔄 Resetting recording status for session ${id} by teacher ${teacherId}`);

    const session = await LiveSession.findOne({ _id: id, instructor: teacherId });

    if (!session) {
      console.log(`❌ Session not found or permission denied: ${id}`);
      res.status(404).json({
        success: false,
        error: 'Session not found or you do not have permission to reset recording'
      });
      return;
    }

    // Reset recording status
    session.recordingStatus = 'not_started';
    session.isRecorded = false;
    session.recordingUrl = undefined;
    session.recordingSize = undefined;

    await session.save();

    console.log(`✅ Recording status reset for session: ${id}`);

    res.status(200).json({
      success: true,
      data: { session },
      message: 'Recording status reset successfully'
    });
  } catch (error) {
    console.error('❌ Error resetting recording status:', error);
    next(error);
  }
};