import mongoose, { Schema, Document, Model } from 'mongoose';

// UserBadge document interface
export interface IUserBadgeDocument extends Document {
  user: mongoose.Types.ObjectId;
  badge: mongoose.Types.ObjectId;
  earnedAt: Date;
  progress?: Record<string, any>;
  isVisible: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// UserBadge model interface
export interface IUserBadgeModel extends Model<IUserBadgeDocument> {
  findByUser(userId: string): Promise<IUserBadgeDocument[]>;
  findByBadge(badgeId: string): Promise<IUserBadgeDocument[]>;
  hasUserEarnedBadge(userId: string, badgeId: string): Promise<boolean>;
}

// UserBadge schema
const userBadgeSchema = new Schema<IUserBadgeDocument>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User reference is required']
  },
  badge: {
    type: Schema.Types.ObjectId,
    ref: 'Badge',
    required: [true, 'Badge reference is required']
  },
  earnedAt: {
    type: Date,
    default: Date.now
  },
  progress: {
    type: Schema.Types.Mixed,
    default: {}
  },
  isVisible: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound index to ensure a user can only earn a badge once
userBadgeSchema.index({ user: 1, badge: 1 }, { unique: true });

// Indexes for performance
userBadgeSchema.index({ user: 1 });
userBadgeSchema.index({ badge: 1 });
userBadgeSchema.index({ earnedAt: -1 });

// Static method to find badges by user
userBadgeSchema.statics.findByUser = function(userId: string): Promise<IUserBadgeDocument[]> {
  return this.find({ user: userId, isVisible: true })
    .populate('badge')
    .sort({ earnedAt: -1 });
};

// Static method to find users by badge
userBadgeSchema.statics.findByBadge = function(badgeId: string): Promise<IUserBadgeDocument[]> {
  return this.find({ badge: badgeId })
    .populate('user')
    .sort({ earnedAt: -1 });
};

// Static method to check if user has earned a badge
userBadgeSchema.statics.hasUserEarnedBadge = function(userId: string, badgeId: string): Promise<boolean> {
  return this.exists({ user: userId, badge: badgeId }).then(result => !!result);
};

// Create and export the model
export const UserBadge = mongoose.model<IUserBadgeDocument, IUserBadgeModel>('UserBadge', userBadgeSchema);