import mongoose, { Document, Schema } from 'mongoose';

// Post interface
export interface IPost extends Document {
  author: mongoose.Types.ObjectId;
  content: string;
  type: 'text' | 'achievement' | 'question' | 'announcement';
  postType: 'text' | 'job_post' | 'event' | 'training' | 'company_update';
  tags: string[];
  media: {
    type: 'image' | 'video';
    url: string;
    thumbnail?: string;
  }[];
  attachments: {
    type: 'image' | 'video' | 'document';
    url: string;
    name: string;
    size?: number;
  }[];
  likes: mongoose.Types.ObjectId[];
  comments: mongoose.Types.ObjectId[];
  bookmarks: mongoose.Types.ObjectId[];
  shares: number;
  sharesCount: number;
  likesCount: number;
  commentsCount: number;
  visibility: 'public' | 'private' | 'connections';
  relatedJob?: mongoose.Types.ObjectId;
  relatedEvent?: mongoose.Types.ObjectId;
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
  postType: {
    type: String,
    enum: ['text', 'job_post', 'event', 'training', 'company_update'],
    default: 'text'
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  media: [{
    type: {
      type: String,
      enum: ['image', 'video'],
      required: true
    },
    url: {
      type: String,
      required: true
    },
    thumbnail: {
      type: String
    }
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
  bookmarks: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  shares: {
    type: Number,
    default: 0
  },
  sharesCount: {
    type: Number,
    default: 0
  },
  likesCount: {
    type: Number,
    default: 0
  },
  commentsCount: {
    type: Number,
    default: 0
  },
  visibility: {
    type: String,
    enum: ['public', 'private', 'connections'],
    default: 'public'
  },
  relatedJob: {
    type: Schema.Types.ObjectId,
    ref: 'Job'
  },
  relatedEvent: {
    type: Schema.Types.ObjectId,
    ref: 'Event'
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
postSchema.index({ postType: 1 });
postSchema.index({ visibility: 1 });
postSchema.index({ createdAt: -1 });

// Virtual for like count
postSchema.virtual('likeCount').get(function() {
  return this.likes.length;
});

// Virtual for comment count
postSchema.virtual('commentCount').get(function() {
  return this.comments.length;
});

// Static methods
postSchema.statics.findPostsForFeed = async function(userId: string, limit: number = 20, skip: number = 0) {
  try {
    const posts = await this.find({
      $or: [
        { visibility: 'public' },
        { author: userId }
      ]
    })
    .populate('author', 'firstName lastName profilePicture company jobTitle')
    .populate('relatedJob', 'title company location jobType salary applicationDeadline')
    .populate('relatedEvent', 'title date location eventType')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

    return posts;
  } catch (error) {
    console.error('Error in findPostsForFeed:', error);
    throw error;
  }
};

postSchema.statics.findPostsByAuthor = async function(authorId: string) {
  try {
    const posts = await this.find({ author: authorId })
      .populate('author', 'firstName lastName profilePicture company jobTitle')
      .populate('relatedJob', 'title company location jobType salary applicationDeadline')
      .populate('relatedEvent', 'title date location eventType')
      .sort({ createdAt: -1 });

    return posts;
  } catch (error) {
    console.error('Error in findPostsByAuthor:', error);
    throw error;
  }
};

// Ensure virtual fields are serialized
postSchema.set('toJSON', { virtuals: true });
postSchema.set('toObject', { virtuals: true });

export const Post = mongoose.model<IPost>('Post', postSchema);