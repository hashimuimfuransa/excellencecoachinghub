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
  expiresAt: Date;
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

// Auto-expire stories after 24 hours
storySchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 }); // 24 hours

// Set expiresAt when creating a story
storySchema.pre('save', function(next) {
  if (this.isNew && !this.expiresAt) {
    this.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
  }
  next();
});

// Methods for finding stories
storySchema.statics.findActiveStories = function(userId: string, visibility: 'public' | 'connections' | 'all' = 'all') {
  const query: any = {
    expiresAt: { $gt: new Date() } // Only active stories
  };

  if (visibility === 'public') {
    query.visibility = 'public';
  } else if (visibility === 'connections') {
    query.$or = [
      { visibility: 'public' },
      { visibility: 'connections' }, // Would need connection logic here
      { author: userId } // Always include own stories
    ];
  }
  // If 'all', don't add visibility filter (admin view)

  return this.find(query)
    .populate('author', 'firstName lastName profilePicture')
    .sort({ createdAt: -1 });
};

storySchema.statics.findUserStories = function(userId: string) {
  return this.find({
    author: userId,
    expiresAt: { $gt: new Date() }
  })
    .populate('author', 'firstName lastName profilePicture')
    .sort({ createdAt: -1 });
};

export const Story = model<IStory>('Story', storySchema);