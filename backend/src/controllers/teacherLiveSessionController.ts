import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { LiveSession } from '../models/LiveSession';
import { Course } from '../models/Course';
import { User } from '../models/User';
import { TeacherProfile } from '../models/TeacherProfile';
import { notificationService } from '../services/notificationService';
import { uploadFile } from '../utils/fileUpload';

const normalizeYoutubeUrls = (url?: string) => {
  if (!url) {
    return { embed: '', watch: '' };
  }
  const trimmed = url.trim();
  const match = trimmed.match(/(?:embed\/|watch\?v=|youtu\.be\/)([\w-]{11})/i);
  if (!match) {
    return { embed: trimmed, watch: trimmed };
  }
  const id = match[1];
  return {
    embed: `https://www.youtube.com/embed/${id}`,
    watch: `https://www.youtube.com/watch?v=${id}`
  };
};

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
      attendanceRequired,
      zoomFallbackLink,
      streamProvider,
      youtubeEmbedUrl
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

    const normalizedStreamProvider: 'internal' | 'youtube' = streamProvider === 'youtube' ? 'youtube' : 'internal';
    const normalizedYoutubeUrls = normalizedStreamProvider === 'youtube' ? normalizeYoutubeUrls(youtubeEmbedUrl) : { embed: '', watch: '' };

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
      zoomFallbackLink: zoomFallbackLink || '',
      status: 'scheduled',
      streamProvider: normalizedStreamProvider,
      youtubeEmbedUrl: normalizedStreamProvider === 'youtube' ? normalizedYoutubeUrls.embed || null : null,
      meetingUrl: normalizedStreamProvider === 'youtube' ? (normalizedYoutubeUrls.watch || normalizedYoutubeUrls.embed || null) : null
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
    const courseId = req.query.courseId as string;

    // Build filter
    const filter: any = { instructor: teacherId };
    if (status && status !== 'all') {
      filter.status = status;
    }
    if (courseId) {
      filter.course = courseId;
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

// Get a specific session by ID (Teacher only - must own the session) - OPTIMIZED
export const getSessionById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const teacherId = req.user?.id;

    console.log(`🔍 Teacher ${teacherId} requesting session ${id}`);

    // Optimized query with lean() and selective field loading
    const session = await LiveSession.findOne({ _id: id, instructor: teacherId })
      .select('title description course scheduledTime duration status actualStartTime actualEndTime meetingId meetingUrl streamProvider youtubeEmbedUrl isRecorded recordingUrl maxParticipants chatEnabled handRaiseEnabled screenShareEnabled attendanceRequired createdAt updatedAt participants attendees')
      .populate('course', 'title description')
      .lean(); // Convert to plain JS object for better performance

    if (!session) {
      console.log(`❌ Session ${id} not found for teacher ${teacherId}`);
      res.status(404).json({
        success: false,
        error: 'Session not found or you do not have permission to access it'
      });
      return;
    }

    console.log(`✅ Session ${id} found for teacher ${teacherId}: ${session.title}`);

    // Load participants and attendees separately for better performance (limit to prevent huge payloads)
    const participantIds = session.participants?.slice(0, 20) || []; // Limit to first 20
    const attendeeUserIds = session.attendees?.slice(0, 20).map((a: any) => a.user) || [];
    
    const [participants, attendeeUsers] = await Promise.all([
      participantIds.length > 0 ? 
        User.find({ _id: { $in: participantIds } }).select('firstName lastName email').lean() : 
        Promise.resolve([]),
      attendeeUserIds.length > 0 ? 
        User.find({ _id: { $in: attendeeUserIds } }).select('firstName lastName email').lean() : 
        Promise.resolve([])
    ]);

    // Map attendee users back to attendees
    const attendees = session.attendees?.slice(0, 20).map((attendee: any) => ({
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
    console.error(`❌ Error getting session ${id}:`, error);
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
      'screenShareEnabled', 'attendanceRequired', 'zoomFallbackLink'
    ];

    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        (session as any)[field] = updates[field];
      }
    });

    let updatedStreamProvider: 'internal' | 'youtube' | undefined;
    if (updates.streamProvider !== undefined) {
      updatedStreamProvider = updates.streamProvider === 'youtube' ? 'youtube' : 'internal';
      session.streamProvider = updatedStreamProvider;
      if (updatedStreamProvider !== 'youtube') {
        session.youtubeEmbedUrl = null;
        if (session.meetingUrl && session.meetingUrl.includes('youtu')) {
          session.meetingUrl = null;
        }
      }
    }

    if (updates.youtubeEmbedUrl !== undefined) {
      const providerForYoutube = updatedStreamProvider ?? session.streamProvider ?? 'internal';
      if (providerForYoutube === 'youtube') {
        const normalizedYoutube = normalizeYoutubeUrls(updates.youtubeEmbedUrl);
        session.youtubeEmbedUrl = normalizedYoutube.embed || null;
        if (normalizedYoutube.watch) {
          session.meetingUrl = normalizedYoutube.watch;
        } else if (normalizedYoutube.embed) {
          session.meetingUrl = normalizedYoutube.embed;
        }
      } else {
        session.youtubeEmbedUrl = null;
      }
    }

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
      session.status = 'cancelled';
      session.actualEndTime = new Date();
      if (session.recordingStatus === 'recording') {
        session.recordingStatus = 'failed';
      }
      await session.save();
    }

    await LiveSession.deleteOne({ _id: id });

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

// Upload video recording for a session (Teacher only)
export const uploadSessionRecording = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const teacherId = req.user?.id;
    const file = req.file;

    if (!file) {
      res.status(400).json({
        success: false,
        error: 'No video file provided'
      });
      return;
    }

    // Validate file type
    const allowedVideoTypes = ['video/mp4', 'video/avi', 'video/quicktime', 'video/webm'];
    if (!allowedVideoTypes.includes(file.mimetype)) {
      res.status(400).json({
        success: false,
        error: 'Invalid file type. Only MP4, AVI, MOV, and WebM files are allowed'
      });
      return;
    }

    const session = await LiveSession.findOne({ _id: id, instructor: teacherId });
    if (!session) {
      res.status(404).json({
        success: false,
        error: 'Session not found or you do not have permission to upload recording'
      });
      return;
    }

    console.log(`📹 Uploading video recording for session: ${session.title}`);

    // Upload video to Cloudinary
    const uploadResult = await uploadFile(file, `live-sessions/${session._id}`);

    // Update session with recording info
    session.recordingUrl = uploadResult.url;
    session.recordingSize = uploadResult.bytes;
    session.recordingStatus = 'completed';
    session.isRecorded = true;

    // Update recording metadata
    session.recordingMetadata = {
      ...session.recordingMetadata,
      fileFormat: uploadResult.format,
      endTime: new Date()
    };

    await session.save();

    // Add recording to course content
    try {
      await session.addRecordingToCourseContent();
    } catch (error) {
      console.error('Failed to add recording to course content:', error);
      // Don't fail the upload if this fails
    }

    console.log(`✅ Video recording uploaded successfully for session: ${session.title}`);

    res.status(200).json({
      success: true,
      data: { 
        session,
        recording: {
          url: uploadResult.url,
          size: uploadResult.bytes,
          format: uploadResult.format
        }
      },
      message: 'Video recording uploaded successfully'
    });
  } catch (error) {
    console.error('❌ Error uploading video recording:', error);
    next(error);
  }
};