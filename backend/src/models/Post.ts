import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPostDocument extends Document {
  author: string; // User ID
  content: string;
  media?: {
    type: 'image' | 'video';
    url: string;
    thumbnail?: string;
  }[];
  tags: string[];
  postType: 'text' | 'job_post' | 'event' | 'training' | 'company_update';
  relatedJob?: string; // Job ID if this is a job post
  relatedEvent?: string; // Event ID if this is an event post
  relatedCompany?: string; // Company ID if this is a company update
  likes: string[]; // Array of User IDs who liked this post
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  visibility: 'public' | 'connections' | 'private';
  isPinned: boolean;
  isPromoted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPostModel extends Model<IPostDocument> {
  findPostsForFeed(userId: string, limit?: number, skip?: number): Promise<IPostDocument[]>;
  findPostsByAuthor(authorId: string): Promise<IPostDocument[]>;
  findJobPosts(limit?: number, skip?: number): Promise<IPostDocument[]>;
}

const postSchema = new Schema<IPostDocument>({
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Post author is required']
  },
  content: {
    type: String,
    required: [true, 'Post content is required'],
    trim: true,
    maxlength: [5000, 'Post content cannot exceed 5000 characters']
  },
  media: [{
    type: {
      type: String,
      enum: ['image', 'video'],
      required: true
    },
    url: {
      type: String,
      required: true,
      trim: true
    },
    thumbnail: {
      type: String,
      trim: true
    }
  }],
  tags: [{
    type: String,
    trim: true,
    maxlength: [50, 'Tag cannot exceed 50 characters']
  }],
  postType: {
    type: String,
    enum: ['text', 'job_post', 'event', 'training', 'company_update'],
    default: 'text',
    required: true
  },
  relatedJob: {
    type: Schema.Types.ObjectId,
    ref: 'Job',
    required: function(this: IPostDocument) {
      return this.postType === 'job_post';
    }
  },
  relatedEvent: {
    type: Schema.Types.ObjectId,
    ref: 'Event',
    required: function(this: IPostDocument) {
      return this.postType === 'event';
    }
  },
  relatedCompany: {
    type: Schema.Types.ObjectId,
    ref: 'Company',
    required: function(this: IPostDocument) {
      return this.postType === 'company_update';
    }
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
  commentsCount: {
    type: Number,
    default: 0,
    min: 0
  },
  sharesCount: {
    type: Number,
    default: 0,
    min: 0
  },
  visibility: {
    type: String,
    enum: ['public', 'connections', 'private'],
    default: 'public'
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  isPromoted: {
    type: Boolean,
    default: false
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
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ postType: 1, createdAt: -1 });
postSchema.index({ tags: 1 });
postSchema.index({ visibility: 1, createdAt: -1 });
postSchema.index({ isPromoted: 1, createdAt: -1 });
postSchema.index({ relatedJob: 1 });
postSchema.index({ createdAt: -1 }); // For general feed sorting

// Text search index
postSchema.index({ 
  content: 'text', 
  tags: 'text' 
}, {
  weights: {
    content: 10,
    tags: 5
  }
});

// Virtual to check if user liked this post
postSchema.virtual('isLikedBy').get(function(this: IPostDocument) {
  return (userId: string) => this.likes.includes(userId);
});

// Static methods
postSchema.statics.findPostsForFeed = async function(userId: string, limit = 20, skip = 0): Promise<IPostDocument[]> {
  const mongoose = require('mongoose');
  
  // Get user's connections to prioritize their posts
  const connections = await this.model('Connection').find({
    $or: [
      { requester: userId, status: 'accepted' },
      { recipient: userId, status: 'accepted' }
    ]
  });

  const connectedUserIds = connections.map((conn: any) => {
    return conn.requester.toString() === userId ? conn.recipient : conn.requester;
  });

  // Create aggregation pipeline to prioritize connected users' posts
  const pipeline = [
    {
      $match: {
        $or: [
          { visibility: 'public' },
          { author: new mongoose.Types.ObjectId(userId) },
          { 
            visibility: 'connections',
            author: { $in: connectedUserIds.map((id: string) => new mongoose.Types.ObjectId(id)) }
          }
        ]
      }
    },
    {
      $addFields: {
        priorityScore: {
          $cond: [
            { $in: ['$author', connectedUserIds.map((id: string) => new mongoose.Types.ObjectId(id))] },
            3, // Connected users get priority 3
            {
              $cond: [
                { $eq: ['$isPromoted', true] },
                2, // Promoted posts get priority 2
                1  // Regular posts get priority 1
              ]
            }
          ]
        }
      }
    },
    {
      $sort: {
        isPinned: -1,
        priorityScore: -1,
        createdAt: -1
      }
    },
    { $skip: skip },
    { $limit: limit },
    {
      $lookup: {
        from: 'users',
        localField: 'author',
        foreignField: '_id',
        as: 'author',
        pipeline: [
          {
            $project: {
              firstName: 1,
              lastName: 1,
              profilePicture: 1,
              company: 1,
              jobTitle: 1
            }
          }
        ]
      }
    },
    {
      $lookup: {
        from: 'jobs',
        localField: 'relatedJob',
        foreignField: '_id',
        as: 'relatedJob'
      }
    },
    {
      $lookup: {
        from: 'events',
        localField: 'relatedEvent',
        foreignField: '_id',
        as: 'relatedEvent'
      }
    },
    {
      $addFields: {
        author: { $arrayElemAt: ['$author', 0] },
        relatedJob: { $arrayElemAt: ['$relatedJob', 0] },
        relatedEvent: { $arrayElemAt: ['$relatedEvent', 0] }
      }
    }
  ];

  return this.aggregate(pipeline);
};

postSchema.statics.findPostsByAuthor = function(authorId: string): Promise<IPostDocument[]> {
  return this.find({ author: authorId })
    .populate('author', 'firstName lastName profilePicture company jobTitle')
    .populate('relatedJob', 'title company location jobType')
    .sort({ createdAt: -1 });
};

postSchema.statics.findJobPosts = function(limit = 10, skip = 0): Promise<IPostDocument[]> {
  return this.find({ 
    postType: 'job_post',
    visibility: 'public'
  })
  .populate('author', 'firstName lastName profilePicture company jobTitle')
  .populate('relatedJob', 'title company location jobType salary applicationDeadline')
  .sort({ isPromoted: -1, createdAt: -1 })
  .skip(skip)
  .limit(limit);
};

export const Post = mongoose.model<IPostDocument, IPostModel>('Post', postSchema);