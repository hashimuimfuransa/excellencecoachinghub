import mongoose, { Schema, Document, Model } from 'mongoose';
import { NotificationType } from '../../../shared/types';

// Notification document interface
export interface INotificationDocument extends Document {
  recipient: mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  isRead: boolean;
  readAt?: Date;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  expiresAt?: Date;
  actionUrl?: string;
  actionText?: string;
  sender?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;

  // Instance methods
  markAsRead(): Promise<INotificationDocument>;
  isExpired(): boolean;
}

// Notification model interface
export interface INotificationModel extends Model<INotificationDocument> {
  findByRecipient(recipientId: string): Promise<INotificationDocument[]>;
  findUnreadByRecipient(recipientId: string): Promise<INotificationDocument[]>;
  findByType(type: NotificationType): Promise<INotificationDocument[]>;
  markAllAsRead(recipientId: string): Promise<void>;
  deleteExpired(): Promise<void>;
  createNotification(data: Partial<INotificationDocument>): Promise<INotificationDocument>;
}

// Notification schema
const notificationSchema = new Schema<INotificationDocument>({
  recipient: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Recipient is required']
  },
  type: {
    type: String,
    enum: Object.values(NotificationType),
    required: [true, 'Notification type is required']
  },
  title: {
    type: String,
    required: [true, 'Notification title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  message: {
    type: String,
    required: [true, 'Notification message is required'],
    trim: true,
    maxlength: [1000, 'Message cannot exceed 1000 characters']
  },
  data: {
    type: Schema.Types.Mixed,
    default: {}
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date,
    default: null
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  expiresAt: {
    type: Date,
    default: null
  },
  actionUrl: {
    type: String,
    default: null
  },
  actionText: {
    type: String,
    default: null,
    maxlength: [50, 'Action text cannot exceed 50 characters']
  },
  sender: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  category: {
    type: String,
    enum: ['system', 'user', 'course', 'payment', 'security', 'maintenance'],
    default: 'system'
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  actionRequired: {
    type: Boolean,
    default: false
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
notificationSchema.index({ recipient: 1 });
notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ recipient: 1, isArchived: 1 });
notificationSchema.index({ recipient: 1, actionRequired: 1 });
notificationSchema.index({ recipient: 1, category: 1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ priority: 1 });
notificationSchema.index({ category: 1 });
notificationSchema.index({ createdAt: -1 });

// TTL index for automatic deletion of expired notifications (also serves as regular index)
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Instance method to mark as read
notificationSchema.methods.markAsRead = async function(): Promise<INotificationDocument> {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

// Instance method to check if expired
notificationSchema.methods.isExpired = function(): boolean {
  return this.expiresAt ? new Date() > this.expiresAt : false;
};

// Static method to find notifications by recipient
notificationSchema.statics.findByRecipient = function(recipientId: string): Promise<INotificationDocument[]> {
  return this.find({ recipient: recipientId })
    .populate('sender', 'firstName lastName')
    .sort({ createdAt: -1 });
};

// Static method to find unread notifications by recipient
notificationSchema.statics.findUnreadByRecipient = function(recipientId: string): Promise<INotificationDocument[]> {
  return this.find({ recipient: recipientId, isRead: false })
    .populate('sender', 'firstName lastName')
    .sort({ createdAt: -1 });
};

// Static method to find notifications by type
notificationSchema.statics.findByType = function(type: NotificationType): Promise<INotificationDocument[]> {
  return this.find({ type })
    .populate('recipient', 'firstName lastName email')
    .populate('sender', 'firstName lastName')
    .sort({ createdAt: -1 });
};

// Static method to mark all as read for a recipient
notificationSchema.statics.markAllAsRead = async function(recipientId: string): Promise<void> {
  await this.updateMany(
    { recipient: recipientId, isRead: false },
    { isRead: true, readAt: new Date() }
  );
};

// Static method to delete expired notifications
notificationSchema.statics.deleteExpired = async function(): Promise<void> {
  await this.deleteMany({
    expiresAt: { $lt: new Date() }
  });
};

// Static method to create notification with defaults
notificationSchema.statics.createNotification = async function(
  data: Partial<INotificationDocument>
): Promise<INotificationDocument> {
  const notification = new this(data);
  return notification.save();
};

// Create and export the model
export const Notification = mongoose.model<INotificationDocument, INotificationModel>('Notification', notificationSchema);
