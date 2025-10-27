import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
  recipient: mongoose.Types.ObjectId;
  type: 'connection_accepted' | 'connection_request' | 'message' | 'job_match' | 'job_recommendations' | 'event_reminder' | 'payment_approved' | 'payment_rejected' | 'payment_success' | 'payment_failed' | 'test_request_approved' | 'test_request_rejected' | 'tests_generated' | 'application_received' | 'application_status_update' | 'teacher_profile_approved' | 'teacher_profile_rejected' | 'course_approved' | 'course_rejected';
  title: string;
  message: string;
  data?: {
    userId?: mongoose.Types.ObjectId;
    userName?: string;
    userProfilePicture?: string;
    chatId?: mongoose.Types.ObjectId;
    jobId?: mongoose.Types.ObjectId;
    eventId?: mongoose.Types.ObjectId;
    paymentRequestId?: mongoose.Types.ObjectId;
    testType?: string;
    url?: string;
    applicationId?: mongoose.Types.ObjectId;
    jobTitle?: string;
    applicantName?: string;
    applicantEmail?: string;
    status?: string;
    adminId?: mongoose.Types.ObjectId;
    adminName?: string;
    feedback?: string;
    reason?: string;
    courseId?: mongoose.Types.ObjectId;
    courseTitle?: string;
  };
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>({
  recipient: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['connection_accepted', 'connection_request', 'message', 'job_match', 'job_recommendations', 'event_reminder', 'payment_approved', 'payment_rejected', 'payment_success', 'payment_failed', 'test_request_approved', 'test_request_rejected', 'tests_generated', 'application_received', 'application_status_update', 'teacher_profile_approved', 'teacher_profile_rejected', 'course_approved', 'course_rejected'],
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  data: {
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    userName: { type: String },
    userProfilePicture: { type: String },
    chatId: { type: Schema.Types.ObjectId },
    jobId: { type: Schema.Types.ObjectId },
    eventId: { type: Schema.Types.ObjectId },
    paymentRequestId: { type: Schema.Types.ObjectId },
    testType: { type: String },
    url: { type: String },
    applicationId: { type: Schema.Types.ObjectId },
    jobTitle: { type: String },
    applicantName: { type: String },
    applicantEmail: { type: String },
    status: { type: String },
    adminId: { type: Schema.Types.ObjectId, ref: 'User' },
    adminName: { type: String },
    feedback: { type: String },
    reason: { type: String },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course' },
    courseTitle: { type: String }
  },
  isRead: {
    type: Boolean,
    default: false,
    index: true
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
NotificationSchema.index({ recipient: 1, createdAt: -1 });
NotificationSchema.index({ recipient: 1, isRead: 1 });

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);