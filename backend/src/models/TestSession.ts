import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITestSessionDocument extends Document {
  user: string;
  test: string;
  job?: string;
  purchase?: string;
  sessionId: string;
  status: 'active' | 'paused' | 'completed' | 'expired' | 'abandoned';
  startedAt: Date;
  lastActivityAt: Date;
  expiresAt: Date;
  timeSpent: number; // in seconds
  currentQuestionIndex: number;
  answers: Record<string, any>;
  browserFingerprint?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

export interface ITestSessionModel extends Model<ITestSessionDocument> {
  findActiveSession(userId: string, testId: string, jobId?: string): Promise<ITestSessionDocument | null>;
  createSession(userId: string, testId: string, jobId?: string, purchaseId?: string): Promise<ITestSessionDocument>;
  updateLastActivity(sessionId: string): Promise<ITestSessionDocument | null>;
  pauseSession(sessionId: string): Promise<ITestSessionDocument | null>;
  resumeSession(sessionId: string): Promise<ITestSessionDocument | null>;
  completeSession(sessionId: string, finalAnswers: Record<string, any>): Promise<ITestSessionDocument | null>;
  expireInactiveSessions(): Promise<number>;
}

const testSessionSchema = new Schema<ITestSessionDocument>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  test: {
    type: Schema.Types.ObjectId,
    ref: 'PsychometricTest',
    required: [true, 'Test is required']
  },
  job: {
    type: Schema.Types.ObjectId,
    ref: 'Job',
    required: false
  },
  purchase: {
    type: Schema.Types.ObjectId,
    ref: 'TestPurchase',
    required: false
  },
  sessionId: {
    type: String,
    required: [true, 'Session ID is required'],
    unique: true,
    default: () => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  },
  status: {
    type: String,
    enum: ['active', 'paused', 'completed', 'expired', 'abandoned'],
    required: [true, 'Status is required'],
    default: 'active'
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  lastActivityAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    required: [true, 'Expiration time is required']
  },
  timeSpent: {
    type: Number,
    required: [true, 'Time spent is required'],
    min: [0, 'Time spent cannot be negative'],
    default: 0
  },
  currentQuestionIndex: {
    type: Number,
    required: [true, 'Current question index is required'],
    min: [0, 'Question index cannot be negative'],
    default: 0
  },
  answers: {
    type: Schema.Types.Mixed,
    default: {}
  },
  browserFingerprint: {
    type: String,
    required: false
  },
  ipAddress: {
    type: String,
    required: false
  },
  userAgent: {
    type: String,
    required: false
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
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
testSessionSchema.index({ user: 1 });
testSessionSchema.index({ test: 1 });
testSessionSchema.index({ job: 1 });
testSessionSchema.index({ purchase: 1 });
testSessionSchema.index({ sessionId: 1 });
testSessionSchema.index({ status: 1 });
testSessionSchema.index({ startedAt: -1 });
testSessionSchema.index({ lastActivityAt: -1 });
testSessionSchema.index({ expiresAt: 1 });

// Compound indexes
testSessionSchema.index({ user: 1, test: 1, job: 1, status: 1 });
testSessionSchema.index({ status: 1, expiresAt: 1 });

// Unique constraint to prevent multiple active sessions for same user/test/job
testSessionSchema.index({ user: 1, test: 1, job: 1 }, { 
  unique: true,
  partialFilterExpression: { status: { $in: ['active', 'paused'] } }
});

// Virtual for time remaining
testSessionSchema.virtual('timeRemaining').get(function(this: ITestSessionDocument) {
  const now = new Date();
  const remaining = Math.max(0, this.expiresAt.getTime() - now.getTime());
  return Math.floor(remaining / 1000); // in seconds
});

// Virtual for is expired
testSessionSchema.virtual('isExpired').get(function(this: ITestSessionDocument) {
  return new Date() > this.expiresAt;
});

// Virtual for is active
testSessionSchema.virtual('isActive').get(function(this: ITestSessionDocument) {
  return this.status === 'active' && !this.isExpired;
});

// Pre-save middleware to update lastActivityAt
testSessionSchema.pre('save', function(this: ITestSessionDocument, next) {
  if (this.isModified('answers') || this.isModified('currentQuestionIndex')) {
    this.lastActivityAt = new Date();
  }
  next();
});

// Static methods
testSessionSchema.statics.findActiveSession = function(
  userId: string, 
  testId: string, 
  jobId?: string
): Promise<ITestSessionDocument | null> {
  const query: any = { 
    user: userId, 
    test: testId, 
    status: { $in: ['active', 'paused'] },
    expiresAt: { $gt: new Date() }
  };
  if (jobId) query.job = jobId;
  
  return this.findOne(query)
    .populate('test', 'title type timeLimit')
    .populate('job', 'title company')
    .populate('purchase', 'maxAttempts attemptsUsed remainingAttempts');
};

testSessionSchema.statics.createSession = async function(
  userId: string, 
  testId: string, 
  jobId?: string, 
  purchaseId?: string
): Promise<ITestSessionDocument> {
  // First, check if there's an existing active session and clean it up
  await this.updateMany(
    { 
      user: userId, 
      test: testId, 
      job: jobId,
      status: { $in: ['active', 'paused'] }
    },
    { 
      status: 'abandoned',
      metadata: { 
        ...this.metadata,
        abandonedReason: 'New session started'
      }
    }
  );

  // Get test information to set expiration
  const test = await mongoose.model('PsychometricTest').findById(testId);
  const timeLimit = test?.timeLimit || 60; // Default 60 minutes
  
  const expiresAt = new Date(Date.now() + timeLimit * 60 * 1000);
  
  const session = new this({
    user: userId,
    test: testId,
    job: jobId,
    purchase: purchaseId,
    expiresAt,
    startedAt: new Date(),
    lastActivityAt: new Date()
  });
  
  return await session.save();
};

testSessionSchema.statics.updateLastActivity = function(
  sessionId: string
): Promise<ITestSessionDocument | null> {
  return this.findOneAndUpdate(
    { sessionId, status: { $in: ['active', 'paused'] } },
    { lastActivityAt: new Date() },
    { new: true }
  );
};

testSessionSchema.statics.pauseSession = function(
  sessionId: string
): Promise<ITestSessionDocument | null> {
  return this.findOneAndUpdate(
    { sessionId, status: 'active' },
    { 
      status: 'paused',
      lastActivityAt: new Date()
    },
    { new: true }
  );
};

testSessionSchema.statics.resumeSession = function(
  sessionId: string
): Promise<ITestSessionDocument | null> {
  return this.findOneAndUpdate(
    { sessionId, status: 'paused', expiresAt: { $gt: new Date() } },
    { 
      status: 'active',
      lastActivityAt: new Date()
    },
    { new: true }
  );
};

testSessionSchema.statics.completeSession = function(
  sessionId: string,
  finalAnswers: Record<string, any>
): Promise<ITestSessionDocument | null> {
  const now = new Date();
  return this.findOneAndUpdate(
    { sessionId },
    { 
      status: 'completed',
      answers: finalAnswers,
      lastActivityAt: now,
      metadata: {
        completedAt: now
      }
    },
    { new: true }
  );
};

testSessionSchema.statics.expireInactiveSessions = function(): Promise<number> {
  const now = new Date();
  return this.updateMany(
    { 
      status: { $in: ['active', 'paused'] },
      $or: [
        { expiresAt: { $lt: now } },
        { 
          lastActivityAt: { $lt: new Date(now.getTime() - 2 * 60 * 60 * 1000) } // 2 hours of inactivity
        }
      ]
    },
    { 
      status: 'expired',
      metadata: {
        expiredAt: now,
        expiredReason: 'Time limit exceeded or inactivity'
      }
    }
  ).then(result => result.modifiedCount);
};

export const TestSession = mongoose.model<ITestSessionDocument, ITestSessionModel>('TestSession', testSessionSchema);