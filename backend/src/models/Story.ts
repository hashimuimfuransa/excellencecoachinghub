import { Schema, model, Document, Types } from 'mongoose';

export interface IStory extends Document {
  _id: Types.ObjectId;
  type: 'achievement' | 'milestone' | 'inspiration' | 'announcement';
  title: string;
  content: string;
  media?: {
    type: 'image' | 'video';
    url: string;
    thumbnail?: string;
  };
  tags: string[];
  author: Types.ObjectId;
  visibility: 'public' | 'connections' | 'private';
  createdAt: Date;
  expiresAt?: Date; // Optional - only set when story is deactivated
  isActive: boolean; // New field to track story status
  viewers: Types.ObjectId[];
  likes: Types.ObjectId[];
  shares: number;
}

const storySchema = new Schema<IStory>({
  type: {
    type: String,
    enum: ['achievement', 'milestone', 'inspiration', 'announcement'],
    required: true,
    default: 'announcement'
  },
  title: {
    type: String,
    required: true,
    maxlength: 200
  },
  content: {
    type: String,
    required: true,
    maxlength: 1000
  },
  media: {
    type: {
      type: String,
      enum: ['image', 'video']
    },
    url: {
      type: String
    },
    thumbnail: {
      type: String
    }
  },
  tags: [{
    type: String,
    maxlength: 50
  }],
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  visibility: {
    type: String,
    enum: ['public', 'connections', 'private'],
    default: 'connections'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  viewers: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  likes: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  shares: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Methods for finding stories
storySchema.statics.findActiveStories = function(userId: string, visibility: 'public' | 'connections' | 'all' = 'all') {
  // Convert string userId to ObjectId for proper comparison
  const mongoose = require('mongoose');
  const userObjectId = new mongoose.Types.ObjectId(userId);
  
  // Build query step by step to avoid circular references
  let query: any = {
    isActive: true
  };

  if (visibility === 'public') {
    query.visibility = 'public';
  } else if (visibility === 'connections') {
    // Create a new query object to avoid circular reference
    query = {
      isActive: true,
      $or: [
        { visibility: 'public' },
        { visibility: 'connections' }, // Would need connection logic here
        { author: userObjectId } // Always include own stories
      ]
    };
  }
  // If 'all', don't add visibility filter (admin view)

  return this.find(query)
    .populate('author', 'firstName lastName profilePicture')
    .sort({ createdAt: -1 });
};

storySchema.statics.findUserStories = function(userId: string) {
  console.log('📚 Story Model - findUserStories called with userId:', userId);
  
  // Convert string userId to ObjectId for proper comparison
  const mongoose = require('mongoose');
  const userObjectId = new mongoose.Types.ObjectId(userId);
  
  // Query for user's stories - don't filter by expiration for user's own stories
  // Users should be able to see their own stories regardless of expiration
  const query = {
    author: userObjectId
  };
  console.log('📚 Story Model - Query with ObjectId:', query);
  
  return this.find(query)
    .populate('author', 'firstName lastName profilePicture company jobTitle')
    .sort({ createdAt: -1 });
};

export const Story = model<IStory>('Story', storySchema);