import mongoose, { Document, Schema } from 'mongoose';

/**
 * Email Tracker Model
 * Tracks when different types of emails were last sent to each user
 * This ensures emails are sent according to their intended frequency
 */

export enum EmailType {
  JOB_RECOMMENDATIONS = 'job_recommendations',
  WEEKLY_DIGEST = 'weekly_digest',
  MONTHLY_REPORT = 'monthly_report',
  PASSWORD_RESET = 'password_reset',
  WELCOME = 'welcome'
}

export interface IEmailTracker extends Document {
  userId: mongoose.Types.ObjectId;
  emailType: EmailType;
  lastSentAt: Date;
  emailsSentToday: number;
  lastResetDate: Date;
  frequency: 'daily' | 'weekly' | 'monthly' | 'once' | 'as_needed';
  maxPerDay: number;
  isActive: boolean;
  metadata?: {
    jobCount?: number;
    campaignId?: string;
    reason?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const EmailTrackerSchema = new Schema<IEmailTracker>({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  emailType: {
    type: String,
    enum: Object.values(EmailType),
    required: true
  },
  lastSentAt: {
    type: Date,
    required: true,
    default: Date.now
  },
  emailsSentToday: {
    type: Number,
    default: 1,
    min: 0
  },
  lastResetDate: {
    type: Date,
    default: Date.now
  },
  frequency: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'once', 'as_needed'],
    default: 'daily'
  },
  maxPerDay: {
    type: Number,
    default: 1,
    min: 1
  },
  isActive: {
    type: Boolean,
    default: true
  },
  metadata: {
    jobCount: { type: Number },
    campaignId: { type: String },
    reason: { type: String }
  }
}, {
  timestamps: true
});

// Compound index for efficient lookups
EmailTrackerSchema.index({ userId: 1, emailType: 1 }, { unique: true });
EmailTrackerSchema.index({ lastSentAt: 1 });
EmailTrackerSchema.index({ emailType: 1, isActive: 1 });

// Static methods
EmailTrackerSchema.statics.canSendEmail = async function(
  userId: mongoose.Types.ObjectId, 
  emailType: EmailType
): Promise<boolean> {
  try {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const tracker = await this.findOne({ userId, emailType, isActive: true });
    
    // If no tracker exists, email can be sent
    if (!tracker) {
      return true;
    }
    
    // Reset daily counter if it's a new day
    if (tracker.lastResetDate < startOfDay) {
      tracker.emailsSentToday = 0;
      tracker.lastResetDate = startOfDay;
      await tracker.save();
    }
    
    // Check frequency rules
    switch (tracker.frequency) {
      case 'daily':
        // For daily emails, check if we've exceeded max per day
        return tracker.emailsSentToday < tracker.maxPerDay;
        
      case 'weekly':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return tracker.lastSentAt < weekAgo;
        
      case 'monthly':
        const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        return tracker.lastSentAt < monthAgo;
        
      case 'once':
        return false; // Once means never again
        
      case 'as_needed':
        return true; // No restrictions
        
      default:
        return true;
    }
  } catch (error) {
    console.error('Error checking email send permission:', error);
    return false; // Fail safe - don't send if there's an error
  }
};

EmailTrackerSchema.statics.recordEmailSent = async function(
  userId: mongoose.Types.ObjectId, 
  emailType: EmailType,
  metadata?: any
): Promise<void> {
  try {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    await this.findOneAndUpdate(
      { userId, emailType },
      {
        $set: {
          lastSentAt: now,
          lastResetDate: startOfDay,
          isActive: true,
          ...(metadata && { metadata }),
          // Set frequency from metadata if provided (for job recommendations weekly frequency)
          frequency: metadata?.frequency || 'daily'
        },
        $inc: { emailsSentToday: 1 }
      },
      { 
        upsert: true, 
        new: true,
        setDefaultsOnInsert: true
      }
    );
    
    console.log(`📧 Email tracker updated for user ${userId}, type: ${emailType}`);
  } catch (error) {
    console.error('Error recording email sent:', error);
  }
};

EmailTrackerSchema.statics.getDailyEmailStats = async function(): Promise<any> {
  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    const stats = await this.aggregate([
      {
        $match: {
          lastSentAt: { $gte: startOfDay },
          isActive: true
        }
      },
      {
        $group: {
          _id: '$emailType',
          count: { $sum: '$emailsSentToday' },
          uniqueUsers: { $addToSet: '$userId' }
        }
      },
      {
        $project: {
          emailType: '$_id',
          emailsSent: '$count',
          uniqueUsers: { $size: '$uniqueUsers' }
        }
      }
    ]);
    
    return stats;
  } catch (error) {
    console.error('Error getting daily email stats:', error);
    return [];
  }
};

export default mongoose.model<IEmailTracker>('EmailTracker', EmailTrackerSchema);