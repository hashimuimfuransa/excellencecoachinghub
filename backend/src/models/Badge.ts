import mongoose, { Schema, Document, Model } from 'mongoose';
import { BadgeType } from '../../../shared/types';

// Badge document interface
export interface IBadgeDocument extends Document {
  name: string;
  description: string;
  type: BadgeType;
  icon: string;
  criteria: Record<string, any>;
  points: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;

  // Instance methods
  checkCriteria(userProgress: any): boolean;
}

// Badge model interface
export interface IBadgeModel extends Model<IBadgeDocument> {
  findByType(type: BadgeType): Promise<IBadgeDocument[]>;
  findActive(): Promise<IBadgeDocument[]>;
  findByRarity(rarity: string): Promise<IBadgeDocument[]>;
}

// Badge schema
const badgeSchema = new Schema<IBadgeDocument>({
  name: {
    type: String,
    required: [true, 'Badge name is required'],
    trim: true,
    maxlength: [100, 'Badge name cannot exceed 100 characters'],
    unique: true
  },
  description: {
    type: String,
    required: [true, 'Badge description is required'],
    trim: true,
    maxlength: [500, 'Badge description cannot exceed 500 characters']
  },
  type: {
    type: String,
    enum: Object.values(BadgeType),
    required: [true, 'Badge type is required']
  },
  icon: {
    type: String,
    required: [true, 'Badge icon is required']
  },
  criteria: {
    type: Schema.Types.Mixed,
    required: [true, 'Badge criteria is required'],
    default: {}
  },
  points: {
    type: Number,
    required: [true, 'Badge points are required'],
    min: [1, 'Badge points must be at least 1'],
    max: [1000, 'Badge points cannot exceed 1000']
  },
  rarity: {
    type: String,
    enum: ['common', 'uncommon', 'rare', 'epic', 'legendary'],
    default: 'common'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator reference is required']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance (name index is already created by unique: true in schema)
badgeSchema.index({ type: 1 });
badgeSchema.index({ isActive: 1 });
badgeSchema.index({ rarity: 1 });
badgeSchema.index({ points: -1 });

// Instance method to check criteria
badgeSchema.methods.checkCriteria = function(userProgress: any): boolean {
  // This will be implemented with specific logic for each badge type
  // For now, return false as placeholder
  return false;
};

// Static method to find badges by type
badgeSchema.statics.findByType = function(type: BadgeType): Promise<IBadgeDocument[]> {
  return this.find({ type, isActive: true }).sort({ points: 1 });
};

// Static method to find active badges
badgeSchema.statics.findActive = function(): Promise<IBadgeDocument[]> {
  return this.find({ isActive: true }).sort({ rarity: 1, points: 1 });
};

// Static method to find badges by rarity
badgeSchema.statics.findByRarity = function(rarity: string): Promise<IBadgeDocument[]> {
  return this.find({ rarity, isActive: true }).sort({ points: 1 });
};

// Create and export the model
export const Badge = mongoose.model<IBadgeDocument, IBadgeModel>('Badge', badgeSchema);
