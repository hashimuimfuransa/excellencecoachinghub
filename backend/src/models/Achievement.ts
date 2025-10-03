import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAchievementRequirement {
  type: 'lessons_completed' | 'time_spent' | 'quiz_score' | 'streak' | 'points_earned';
  target: number;
  current: number;
  description: string;
}

export interface IAchievement extends Document {
  title: string;
  description: string;
  icon: string;
  category: 'learning' | 'engagement' | 'milestone' | 'special';
  points: number;
  requirements: IAchievementRequirement[];
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserAchievement extends Document {
  userId: mongoose.Types.ObjectId;
  achievementId: mongoose.Types.ObjectId;
  isUnlocked: boolean;
  unlockedAt?: Date;
  progress: number;
  sharedBy?: number;
  likes?: number;
  createdAt: Date;
  updatedAt: Date;
}

// Achievement Schema (Master achievements)
const AchievementSchema = new Schema<IAchievement>({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  icon: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['learning', 'engagement', 'milestone', 'special'],
    required: true
  },
  points: {
    type: Number,
    required: true,
    min: 0
  },
  requirements: [{
    type: {
      type: String,
      enum: ['lessons_completed', 'time_spent', 'quiz_score', 'streak', 'points_earned'],
      required: true
    },
    target: {
      type: Number,
      required: true,
      min: 0
    },
    current: {
      type: Number,
      default: 0,
      min: 0
    },
    description: {
      type: String,
      required: true,
      trim: true
    }
  }],
  rarity: {
    type: String,
    enum: ['common', 'rare', 'epic', 'legendary'],
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// User Achievement Schema (User's progress on achievements)
const UserAchievementSchema = new Schema<IUserAchievement>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  achievementId: {
    type: Schema.Types.ObjectId,
    ref: 'Achievement',
    required: true
  },
  isUnlocked: {
    type: Boolean,
    default: false
  },
  unlockedAt: {
    type: Date
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  sharedBy: {
    type: Number,
    default: 0
  },
  likes: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Compound indexes
UserAchievementSchema.index({ userId: 1, achievementId: 1 }, { unique: true });
UserAchievementSchema.index({ userId: 1, isUnlocked: 1 });
AchievementSchema.index({ category: 1, isActive: 1 });

// Export models
export const Achievement: Model<IAchievement> = mongoose.model<IAchievement>('Achievement', AchievementSchema);
export const UserAchievement: Model<IUserAchievement> = mongoose.model<IUserAchievement>('UserAchievement', UserAchievementSchema);

export default { Achievement, UserAchievement };