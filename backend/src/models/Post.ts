import mongoose, { Document, Schema } from 'mongoose';

// Post interface
export interface IPost extends Document {
  author: mongoose.Types.ObjectId;
  content: string;
  type: 'text' | 'achievement' | 'question' | 'announcement';
  tags: string[];
  attachments: {
    type: 'image' | 'video' | 'document';
    url: string;
    name: string;
    size?: number;
  }[];
  likes: mongoose.Types.ObjectId[];
  comments: mongoose.Types.ObjectId[];
  shares: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Post schema
const postSchema = new Schema<IPost>({
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  type: {
    type: String,
    enum: ['text', 'achievement', 'question', 'announcement'],
    default: 'text'
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  attachments: [{
    type: {
      type: String,
      enum: ['image', 'video', 'document'],
      required: true
    },
    url: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    size: {
      type: Number
    }
  }],
  likes: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [{
    type: Schema.Types.ObjectId,
    ref: 'Comment'
  }],
  shares: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ tags: 1 });
postSchema.index({ type: 1 });
postSchema.index({ createdAt: -1 });

// Virtual for like count
postSchema.virtual('likeCount').get(function() {
  return this.likes.length;
});

// Virtual for comment count
postSchema.virtual('commentCount').get(function() {
  return this.comments.length;
});

// Ensure virtual fields are serialized
postSchema.set('toJSON', { virtuals: true });
postSchema.set('toObject', { virtuals: true });

export const Post = mongoose.model<IPost>('Post', postSchema);