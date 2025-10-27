import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITestRequestDocument extends Document {
  user: string;
  job: string;
  requestType: 'psychometric_test' | 'interview' | 'both';
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  
  // Test generation details
  psychometricTest?: {
    testId: string;
    generatedAt: Date;
    isGenerated: boolean;
  };
  
  interview?: {
    interviewId: string;
    generatedAt: Date;
    isGenerated: boolean;
  };
  
  // Admin approval details
  approvedBy?: string;
  approvedAt?: Date;
  rejectedBy?: string;
  rejectedAt?: Date;
  rejectionReason?: string;
  
  // User completion tracking
  completedAt?: Date;
  testResults?: {
    psychometricScore?: number;
    interviewScore?: number;
    overallPerformance?: string;
  };
  
  // Request details
  title?: string;
  description?: string;
  specifications?: {
    interviewType?: string;
    duration?: number;
    questionCount?: number;
    difficulty?: string;
    focusAreas?: string[];
  };
  
  // Metadata
  requestedAt: Date;
  expiresAt?: Date;
  priority: 'normal' | 'high' | 'urgent';
  notes?: string;
}

export interface ITestRequestModel extends Model<ITestRequestDocument> {
  findPendingRequests(): Promise<ITestRequestDocument[]>;
  findByUser(userId: string): Promise<ITestRequestDocument[]>;
  findByJob(jobId: string): Promise<ITestRequestDocument[]>;
  findApprovedForUser(userId: string): Promise<ITestRequestDocument[]>;
}

const testRequestSchema = new Schema<ITestRequestDocument>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required'],
    index: true
  },
  job: {
    type: Schema.Types.ObjectId,
    ref: 'Job',
    required: [true, 'Job is required'],
    index: true
  },
  requestType: {
    type: String,
    enum: ['psychometric_test', 'interview', 'both'],
    required: [true, 'Request type is required']
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'completed'],
    default: 'pending',
    index: true
  },
  
  // Test generation details
  psychometricTest: {
    testId: {
      type: String,
      trim: true
    },
    generatedAt: Date,
    isGenerated: {
      type: Boolean,
      default: false
    }
  },
  
  interview: {
    interviewId: {
      type: String,
      trim: true
    },
    generatedAt: Date,
    isGenerated: {
      type: Boolean,
      default: false
    }
  },
  
  // Admin approval details
  approvedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,
  rejectedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  rejectedAt: Date,
  rejectionReason: {
    type: String,
    trim: true,
    maxlength: [500, 'Rejection reason cannot exceed 500 characters']
  },
  
  // User completion tracking
  completedAt: Date,
  testResults: {
    psychometricScore: {
      type: Number,
      min: 0,
      max: 100
    },
    interviewScore: {
      type: Number,
      min: 0,
      max: 100
    },
    overallPerformance: {
      type: String,
      enum: ['Excellent', 'Very Good', 'Good', 'Average', 'Below Average']
    }
  },
  
  // Request details
  title: {
    type: String,
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  specifications: {
    interviewType: {
      type: String,
      trim: true
    },
    duration: {
      type: Number,
      min: [5, 'Duration must be at least 5 minutes'],
      max: [180, 'Duration cannot exceed 180 minutes']
    },
    questionCount: {
      type: Number,
      min: [1, 'Must have at least 1 question'],
      max: [50, 'Cannot exceed 50 questions']
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium'
    },
    focusAreas: [{
      type: String,
      trim: true
    }]
  },
  
  // Metadata
  requestedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  expiresAt: {
    type: Date
  },
  priority: {
    type: String,
    enum: ['normal', 'high', 'urgent'],
    default: 'normal'
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
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
testRequestSchema.index({ user: 1, job: 1 });
testRequestSchema.index({ status: 1, requestedAt: -1 });
testRequestSchema.index({ requestType: 1, status: 1 });
testRequestSchema.index({ approvedAt: -1 });
testRequestSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Virtual for request age
testRequestSchema.virtual('requestAge').get(function(this: ITestRequestDocument) {
  return Date.now() - this.requestedAt.getTime();
});

// Virtual for is expired
testRequestSchema.virtual('isExpired').get(function(this: ITestRequestDocument) {
  return this.expiresAt ? new Date() > this.expiresAt : false;
});

// Static methods
testRequestSchema.statics.findPendingRequests = function(): Promise<ITestRequestDocument[]> {
  return this.find({ status: 'pending' })
    .populate('user', 'firstName lastName email')
    .populate('job', 'title company')
    .sort({ priority: -1, requestedAt: -1 });
};

testRequestSchema.statics.findByUser = function(userId: string): Promise<ITestRequestDocument[]> {
  return this.find({ user: userId })
    .populate('job', 'title company')
    .sort({ requestedAt: -1 });
};

testRequestSchema.statics.findByJob = function(jobId: string): Promise<ITestRequestDocument[]> {
  return this.find({ job: jobId })
    .populate('user', 'firstName lastName email')
    .sort({ requestedAt: -1 });
};

testRequestSchema.statics.findApprovedForUser = function(userId: string): Promise<ITestRequestDocument[]> {
  return this.find({ 
    user: userId, 
    status: 'approved',
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: { $gt: new Date() } }
    ]
  })
    .populate('job', 'title company')
    .sort({ approvedAt: -1 });
};

// Pre-save middleware to set expiration
testRequestSchema.pre('save', function(this: ITestRequestDocument, next) {
  if (this.status === 'approved' && !this.expiresAt) {
    // Set expiration to 7 days from approval
    this.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  }
  next();
});

export const TestRequest = mongoose.model<ITestRequestDocument, ITestRequestModel>('TestRequest', testRequestSchema);