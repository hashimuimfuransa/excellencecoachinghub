import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
  recipient: mongoose.Types.ObjectId;
  type: 'connection_accepted' | 'connection_request' | 'message' | 'job_match' | 'event_reminder';
  title: string;
  message: string;
  data?: {
    userId?: mongoose.Types.ObjectId;
    userName?: string;
    userProfilePicture?: string;
    chatId?: mongoose.Types.ObjectId;
    jobId?: mongoose.Types.ObjectId;
    eventId?: mongoose.Types.ObjectId;
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
    enum: ['connection_accepted', 'connection_request', 'message', 'job_match', 'event_reminder'],
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
    eventId: { type: Schema.Types.ObjectId }
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