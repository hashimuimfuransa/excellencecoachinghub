import mongoose, { Schema, Document } from 'mongoose';

export interface IGroupMember extends Document {
  userId: mongoose.Types.ObjectId;
  role: 'admin' | 'moderator' | 'member';
  joinedAt: Date;
  lastSeen?: Date;
}

export interface IGroup extends Document {
  name: string;
  description: string;
  category: string;
  avatar?: string;
  cover_image?: string;
  members: {
    userId: mongoose.Types.ObjectId;
    role: 'admin' | 'moderator' | 'member';
    joinedAt: Date;
    lastSeen?: Date;
  }[];
  maxMembers?: number;
  isPrivate: boolean;
  isActive: boolean;
  joinCode?: string;
  tags: string[];
  rules: string[];
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  lastActivity?: Date;
  unreadCount?: { [userId: string]: number };
}

const groupMemberSchema = new Schema<IGroupMember>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'moderator', 'member'],
    default: 'member'
  },
  joinedAt: {
    type: Date,
    default: Date.now
  },
  lastSeen: {
    type: Date
  }
}, { _id: false });

const groupSchema = new Schema<IGroup>({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  category: {
    type: String,
    required: true,
    enum: [
      'Programming', 'Design', 'Business', 'Science', 'Engineering', 
      'Health', 'Arts', 'Education', 'Technology', 'Other'
    ]
  },
  avatar: {
    type: String
  },
  cover_image: {
    type: String
  },
  members: [groupMemberSchema],
  maxMembers: {
    type: Number,
    default: 500,
    min: 5,
    max: 2000
  },
  isPrivate: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  joinCode: {
    type: String,
    sparse: true,
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  rules: [{
    type: String,
    trim: true,
    maxlength: 500
  }],
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  unreadCount: {
    type: Map,
    of: Number,
    default: {}
  }
});

// Indexes
groupSchema.index({ name: 'text', description: 'text', tags: 'text' });
groupSchema.index({ category: 1 });
groupSchema.index({ 'members.userId': 1 });
groupSchema.index({ createdBy: 1 });
groupSchema.index({ createdAt: -1 });
groupSchema.index({ lastActivity: -1 });
groupSchema.index({ joinCode: 1 }, { unique: true, partialFilterExpression: { joinCode: { $exists: true } } });

// Virtual for member count
groupSchema.virtual('memberCount').get(function() {
  return this.members.length;
});

// Ensure virtual fields are serialized
groupSchema.set('toJSON', { virtuals: true });

// Pre-save hook to update timestamp
groupSchema.pre('save', function(next) {
  this.updatedAt = new Date();

  // Generate joinCode if not present (for public join-by-link)
  if (!this.joinCode && this.isActive) {
    const crypto = require('crypto');
    this.joinCode = crypto.randomBytes(16).toString('hex');
  }

  next();
});

export const Group = mongoose.model<IGroup>('Group', groupSchema);
