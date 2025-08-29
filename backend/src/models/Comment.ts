import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICommentDocument extends Document {
  post: string; // Post ID
  author: string; // User ID
  content: string;
  parentComment?: string; // For replies
  likes: string[]; // Array of User IDs who liked this comment
  likesCount: number;
  repliesCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICommentModel extends Model<ICommentDocument> {
  findByPost(postId: string): Promise<ICommentDocument[]>;
  findReplies(commentId: string): Promise<ICommentDocument[]>;
}

const commentSchema = new Schema<ICommentDocument>({
  post: {
    type: Schema.Types.ObjectId,
    ref: 'Post',
    required: [true, 'Post reference is required']
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Comment author is required']
  },
  content: {
    type: String,
    required: [true, 'Comment content is required'],
    trim: true,
    maxlength: [1000, 'Comment cannot exceed 1000 characters']
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
  likesCount: {
    type: Number,
    default: 0,
    min: 0
  },
  repliesCount: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes for performance
commentSchema.index({ post: 1, createdAt: 1 });
commentSchema.index({ author: 1 });
commentSchema.index({ parentComment: 1 });

// Static methods
commentSchema.statics.findByPost = function(postId: string): Promise<ICommentDocument[]> {
  return this.find({ 
    post: postId, 
    parentComment: { $exists: false } 
  })
  .populate('author', 'firstName lastName profilePicture')
  .sort({ createdAt: 1 });
};

commentSchema.statics.findReplies = function(commentId: string): Promise<ICommentDocument[]> {
  return this.find({ parentComment: commentId })
    .populate('author', 'firstName lastName profilePicture')
    .sort({ createdAt: 1 });
};

export const Comment = mongoose.model<ICommentDocument, ICommentModel>('Comment', commentSchema);