import mongoose, { Document, Schema } from 'mongoose';

// Comment interface
export interface IComment extends Document {
  post: mongoose.Types.ObjectId;
  author: mongoose.Types.ObjectId;
  content: string;
  parentComment?: mongoose.Types.ObjectId; // For nested comments/replies
  likes: mongoose.Types.ObjectId[];
  repliesCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Comment schema
const commentSchema = new Schema<IComment>({
  post: {
    type: Schema.Types.ObjectId,
    ref: 'Post',
    required: true
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  parentComment: {
    type: Schema.Types.ObjectId,
    ref: 'Comment',
    default: null
  },
  likes: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  repliesCount: {
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
commentSchema.index({ post: 1, createdAt: -1 });
commentSchema.index({ author: 1 });
commentSchema.index({ parentComment: 1 });

// Virtual for like count
commentSchema.virtual('likeCount').get(function() {
  return this.likes.length;
});

// Virtual for reply count
commentSchema.virtual('replyCount', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'parentComment',
  count: true
});

// Static methods
commentSchema.statics.findByPost = async function(postId: string) {
  try {
    const comments = await this.find({ 
      post: postId, 
      parentComment: { $exists: false } // Only top-level comments
    })
    .populate('author', 'firstName lastName profilePicture')
    .sort({ createdAt: -1 });

    return comments;
  } catch (error) {
    console.error('Error in findByPost:', error);
    throw error;
  }
};

commentSchema.statics.findReplies = async function(parentCommentId: string) {
  try {
    const replies = await this.find({ parentComment: parentCommentId })
      .populate('author', 'firstName lastName profilePicture')
      .sort({ createdAt: 1 }); // Oldest first for replies

    return replies;
  } catch (error) {
    console.error('Error in findReplies:', error);
    throw error;
  }
};

// Ensure virtual fields are serialized
commentSchema.set('toJSON', { virtuals: true });
commentSchema.set('toObject', { virtuals: true });

export const Comment = mongoose.model<IComment>('Comment', commentSchema);