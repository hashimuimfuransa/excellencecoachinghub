import mongoose, { Schema, Document, Model } from 'mongoose';

// Live session document interface
export interface ILiveSessionDocument extends Document {
  title: string;
  description?: string;
  course: mongoose.Types.ObjectId;
  instructor: mongoose.Types.ObjectId;
  scheduledTime: Date;
  duration: number; // in minutes
  actualStartTime?: Date;
  actualEndTime?: Date;
  meetingUrl?: string;
  meetingId?: string;
  streamProvider?: 'internal' | 'youtube';
  youtubeEmbedUrl?: string | null;
  // 100ms specific fields
  hmsRoomId?: string;
  hmsRecordingId?: string;
  hmsTemplateId?: string;
  participants: mongoose.Types.ObjectId[];
  maxParticipants?: number;
  isRecorded: boolean;
  recordingStatus?: 'not_started' | 'recording' | 'completed' | 'failed';
  recordingUrl?: string;
  recordingSize?: number; // in bytes
  // Additional recording metadata
  recordingMetadata?: {
    startTime?: Date;
    endTime?: Date;
    duration?: number; // in seconds
    fileFormat?: string;
    resolution?: string;
    bitrate?: number;
  };
  status: 'scheduled' | 'live' | 'ended' | 'cancelled';
  startingSoonNotificationSent?: boolean;
  agenda?: string[];
  materials?: string[]; // file URLs
  chatEnabled: boolean;
  handRaiseEnabled: boolean;
  screenShareEnabled: boolean;
  attendanceRequired: boolean;
  zoomFallbackLink?: string;
  attendees: {
    user: mongoose.Types.ObjectId;
    joinTime?: Date;
    leaveTime?: Date;
    duration?: number; // in minutes
    participated: boolean;
  }[];
  createdAt: Date;
  updatedAt: Date;

  // Instance methods
  addParticipant(userId: string): Promise<ILiveSessionDocument>;
  removeParticipant(userId: string): Promise<ILiveSessionDocument>;
  startSession(): Promise<ILiveSessionDocument>;
  endSession(): Promise<ILiveSessionDocument>;
  startRecording(): Promise<ILiveSessionDocument>;
  stopRecording(recordingUrl?: string, recordingSize?: number): Promise<ILiveSessionDocument>;
  recordAttendance(userId: string, joinTime: Date, leaveTime?: Date): Promise<ILiveSessionDocument>;
  isParticipant(userId: string): boolean;
  getAttendanceRate(): number;
  addRecordingToCourseContent(): Promise<void>;
}

// Live session model interface
export interface ILiveSessionModel extends Model<ILiveSessionDocument> {
  findByCourse(courseId: string): Promise<ILiveSessionDocument[]>;
  findByInstructor(instructorId: string): Promise<ILiveSessionDocument[]>;
  findByStatus(status: string): Promise<ILiveSessionDocument[]>;
  findUpcoming(limit?: number): Promise<ILiveSessionDocument[]>;
  findByParticipant(userId: string): Promise<ILiveSessionDocument[]>;
  findLiveSessions(): Promise<ILiveSessionDocument[]>;
}

// Attendee schema
const attendeeSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  joinTime: {
    type: Date,
    default: null
  },
  leaveTime: {
    type: Date,
    default: null
  },
  duration: {
    type: Number,
    default: 0,
    min: [0, 'Duration cannot be negative']
  },
  participated: {
    type: Boolean,
    default: false
  }
}, { _id: false });

// Live session schema
const liveSessionSchema = new Schema<ILiveSessionDocument>({
  title: {
    type: String,
    required: [true, 'Session title is required'],
    trim: true,
    maxlength: [200, 'Session title cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Session description cannot exceed 1000 characters']
  },
  course: {
    type: Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Course reference is required']
  },
  instructor: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Instructor reference is required']
  },
  scheduledTime: {
    type: Date,
    required: [true, 'Scheduled time is required']
  },
  duration: {
    type: Number,
    required: [true, 'Session duration is required'],
    min: [15, 'Session duration must be at least 15 minutes'],
    max: [480, 'Session duration cannot exceed 8 hours (480 minutes)']
  },
  actualStartTime: {
    type: Date,
    default: null
  },
  actualEndTime: {
    type: Date,
    default: null
  },
  meetingUrl: {
    type: String,
    default: null
  },
  meetingId: {
    type: String,
    default: null
  },
  streamProvider: {
    type: String,
    enum: ['internal', 'youtube'],
    default: 'internal'
  },
  youtubeEmbedUrl: {
    type: String,
    default: null
  },
  // 100ms specific fields
  hmsRoomId: {
    type: String,
    default: null
  },
  hmsRecordingId: {
    type: String,
    default: null
  },
  hmsTemplateId: {
    type: String,
    default: null
  },
  participants: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  maxParticipants: {
    type: Number,
    min: [1, 'Maximum participants must be at least 1'],
    max: [1000, 'Maximum participants cannot exceed 1000']
  },
  isRecorded: {
    type: Boolean,
    default: false
  },
  recordingStatus: {
    type: String,
    enum: ['not_started', 'recording', 'completed', 'failed'],
    default: 'not_started'
  },
  recordingUrl: {
    type: String,
    default: null
  },
  recordingSize: {
    type: Number,
    default: null,
    min: [0, 'Recording size cannot be negative']
  },
  // Additional recording metadata
  recordingMetadata: {
    startTime: {
      type: Date,
      default: null
    },
    endTime: {
      type: Date,
      default: null
    },
    duration: {
      type: Number,
      default: null,
      min: [0, 'Recording duration cannot be negative']
    },
    fileFormat: {
      type: String,
      default: null
    },
    resolution: {
      type: String,
      default: null
    },
    bitrate: {
      type: Number,
      default: null,
      min: [0, 'Bitrate cannot be negative']
    }
  },
  status: {
    type: String,
    enum: ['scheduled', 'live', 'ended', 'cancelled'],
    default: 'scheduled'
  },
  startingSoonNotificationSent: {
    type: Boolean,
    default: false
  },
  agenda: [{
    type: String,
    trim: true,
    maxlength: [200, 'Agenda item cannot exceed 200 characters']
  }],
  materials: [{
    type: String
  }],
  chatEnabled: {
    type: Boolean,
    default: true
  },
  handRaiseEnabled: {
    type: Boolean,
    default: true
  },
  screenShareEnabled: {
    type: Boolean,
    default: true
  },
  attendanceRequired: {
    type: Boolean,
    default: false
  },
  zoomFallbackLink: {
    type: String,
    trim: true,
    validate: {
      validator: function(v: string) {
        if (!v) return true; // Optional field
        return /^https?:\/\/.+/.test(v);
      },
      message: 'Zoom fallback link must be a valid URL'
    }
  },
  attendees: [attendeeSchema]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
liveSessionSchema.index({ course: 1 });
liveSessionSchema.index({ instructor: 1 });
liveSessionSchema.index({ status: 1 });
liveSessionSchema.index({ scheduledTime: 1 });
liveSessionSchema.index({ participants: 1 });
liveSessionSchema.index({ createdAt: -1 });

// Virtual for actual duration
liveSessionSchema.virtual('actualDuration').get(function(this: ILiveSessionDocument) {
  if (this.actualStartTime && this.actualEndTime) {
    return Math.round((this.actualEndTime.getTime() - this.actualStartTime.getTime()) / (1000 * 60));
  }
  return 0;
});

// Virtual for participant count
liveSessionSchema.virtual('participantCount').get(function(this: ILiveSessionDocument) {
  return this.participants.length;
});

// Virtual for attendance count
liveSessionSchema.virtual('attendanceCount').get(function(this: ILiveSessionDocument) {
  return this.attendees.filter(attendee => attendee.participated).length;
});

// Validation for scheduled time
liveSessionSchema.pre<ILiveSessionDocument>('validate', function(next) {
  // Only validate scheduled time for new documents or when scheduledTime is being modified
  if (this.isNew || this.isModified('scheduledTime')) {
    if (this.scheduledTime <= new Date()) {
      next(new Error('Scheduled time must be in the future'));
      return;
    }
  }
  
  if (this.maxParticipants && this.participants.length > this.maxParticipants) {
    next(new Error('Number of participants exceeds maximum allowed'));
    return;
  }
  
  next();
});

// Instance method to add participant
liveSessionSchema.methods.addParticipant = async function(userId: string): Promise<ILiveSessionDocument> {
  const userObjectId = new mongoose.Types.ObjectId(userId);
  
  if (!this.participants.some(id => id.equals(userObjectId))) {
    if (this.maxParticipants && this.participants.length >= this.maxParticipants) {
      throw new Error('Session is full');
    }
    
    this.participants.push(userObjectId);
  }
  
  return this.save();
};

// Instance method to remove participant
liveSessionSchema.methods.removeParticipant = async function(userId: string): Promise<ILiveSessionDocument> {
  const userObjectId = new mongoose.Types.ObjectId(userId);
  this.participants = this.participants.filter(id => !id.equals(userObjectId));
  return this.save();
};

// Instance method to start session
liveSessionSchema.methods.startSession = async function(): Promise<ILiveSessionDocument> {
  this.status = 'live';
  this.actualStartTime = new Date();
  return this.save();
};

// Instance method to end session
liveSessionSchema.methods.endSession = async function(): Promise<ILiveSessionDocument> {
  this.status = 'ended';
  this.actualEndTime = new Date();
  return this.save();
};

// Instance method to start recording
liveSessionSchema.methods.startRecording = async function(): Promise<ILiveSessionDocument> {
  if (this.status !== 'live') {
    throw new Error('Can only start recording during live sessions');
  }

  if (this.recordingStatus === 'recording') {
    throw new Error('Recording is already in progress');
  }

  if (this.recordingStatus === 'completed') {
    throw new Error('This session has already been recorded');
  }

  // In a real implementation, this would integrate with a recording service
  // For now, we'll just mark that recording has started
  this.recordingStatus = 'recording';
  this.isRecorded = true; // Keep this for backward compatibility
  return this.save();
};

// Instance method to stop recording and save recording URL
liveSessionSchema.methods.stopRecording = async function(recordingUrl?: string, recordingSize?: number): Promise<ILiveSessionDocument> {
  if (this.recordingStatus !== 'recording') {
    throw new Error('No active recording to stop');
  }

  // Mark recording as completed
  this.recordingStatus = 'completed';

  if (recordingUrl) {
    this.recordingUrl = recordingUrl;
  }

  if (recordingSize) {
    this.recordingSize = recordingSize;
  }

  const savedSession = await this.save();

  // Automatically add recording as course content
  if (recordingUrl && this.course) {
    try {
      await this.addRecordingToCourseContent();
    } catch (error) {
      console.error('Failed to add recording to course content:', error);
      // Don't throw error here to avoid breaking the recording save
    }
  }

  return savedSession;
};

// Instance method to add recording to course content
liveSessionSchema.methods.addRecordingToCourseContent = async function(): Promise<void> {
  if (!this.recordingUrl || this.recordingStatus !== 'completed') {
    throw new Error('Recording not available or not completed');
  }

  // Import Course model here to avoid circular dependency
  const { Course } = require('./Course');

  const course = await Course.findById(this.course);
  if (!course) {
    throw new Error('Course not found');
  }

  // Check if this recording is already added to course content
  const existingContent = course.content.find((content: any) =>
    content.type === 'live_session' &&
    content.liveSessionId &&
    content.liveSessionId.toString() === this._id.toString()
  );

  if (existingContent) {
    console.log('Recording already added to course content');
    return;
  }

  // Calculate duration in minutes (default to session duration or 60 minutes)
  const sessionDuration = this.actualEndTime && this.actualStartTime
    ? Math.ceil((this.actualEndTime.getTime() - this.actualStartTime.getTime()) / (1000 * 60))
    : this.duration || 60;

  // Add recording as course content
  const newContent = {
    title: `${this.title} (Recorded Session)`,
    type: 'live_session',
    content: this.description || `Recorded live session: ${this.title}`,
    videoUrl: this.recordingUrl,
    duration: sessionDuration,
    order: course.content.length + 1,
    isRequired: false,
    liveSessionId: this._id,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  course.content.push(newContent);
  await course.save();

  console.log(`Added recording "${this.title}" to course "${course.title}" content`);
};

// Instance method to record attendance
liveSessionSchema.methods.recordAttendance = async function(
  userId: string, 
  joinTime: Date, 
  leaveTime?: Date
): Promise<ILiveSessionDocument> {
  const userObjectId = new mongoose.Types.ObjectId(userId);
  const existingAttendee = this.attendees.find(attendee => attendee.user.equals(userObjectId));
  
  if (existingAttendee) {
    if (leaveTime) {
      existingAttendee.leaveTime = leaveTime;
      existingAttendee.duration = Math.round((leaveTime.getTime() - existingAttendee.joinTime!.getTime()) / (1000 * 60));
      existingAttendee.participated = true;
    }
  } else {
    this.attendees.push({
      user: userObjectId,
      joinTime,
      leaveTime,
      duration: leaveTime ? Math.round((leaveTime.getTime() - joinTime.getTime()) / (1000 * 60)) : 0,
      participated: !!leaveTime
    });
  }
  
  return this.save();
};

// Instance method to check if user is participant
liveSessionSchema.methods.isParticipant = function(userId: string): boolean {
  const userObjectId = new mongoose.Types.ObjectId(userId);
  return this.participants.some(id => id.equals(userObjectId));
};

// Instance method to get attendance rate
liveSessionSchema.methods.getAttendanceRate = function(): number {
  if (this.participants.length === 0) return 0;
  const attendedCount = this.attendees.filter(attendee => attendee.participated).length;
  return (attendedCount / this.participants.length) * 100;
};

// Static method to find sessions by course
liveSessionSchema.statics.findByCourse = function(courseId: string): Promise<ILiveSessionDocument[]> {
  return this.find({ course: courseId })
    .populate('instructor', 'firstName lastName')
    .sort({ scheduledTime: 1 });
};

// Static method to find sessions by instructor
liveSessionSchema.statics.findByInstructor = function(instructorId: string): Promise<ILiveSessionDocument[]> {
  return this.find({ instructor: instructorId })
    .populate('course', 'title')
    .sort({ scheduledTime: -1 });
};

// Static method to find sessions by status
liveSessionSchema.statics.findByStatus = function(status: string): Promise<ILiveSessionDocument[]> {
  return this.find({ status })
    .populate('course', 'title')
    .populate('instructor', 'firstName lastName')
    .sort({ scheduledTime: 1 });
};

// Static method to find upcoming sessions
liveSessionSchema.statics.findUpcoming = function(limit: number = 10): Promise<ILiveSessionDocument[]> {
  return this.find({ 
    status: 'scheduled',
    scheduledTime: { $gte: new Date() }
  })
    .populate('course', 'title')
    .populate('instructor', 'firstName lastName')
    .sort({ scheduledTime: 1 })
    .limit(limit);
};

// Static method to find sessions by participant
liveSessionSchema.statics.findByParticipant = function(userId: string): Promise<ILiveSessionDocument[]> {
  return this.find({ participants: userId })
    .populate('course', 'title')
    .populate('instructor', 'firstName lastName')
    .sort({ scheduledTime: -1 });
};

// Static method to find live sessions
liveSessionSchema.statics.findLiveSessions = function(): Promise<ILiveSessionDocument[]> {
  return this.find({ status: 'live' })
    .populate('course', 'title')
    .populate('instructor', 'firstName lastName')
    .sort({ actualStartTime: -1 });
};

// Create and export the model
export const LiveSession = mongoose.model<ILiveSessionDocument, ILiveSessionModel>('LiveSession', liveSessionSchema);
