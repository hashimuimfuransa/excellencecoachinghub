import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITestSessionDocument extends Document {
  user: mongoose.Types.ObjectId;
  job: mongoose.Types.ObjectId;
  testLevel: string;
  purchase?: mongoose.Types.ObjectId;
  questions: Array<{
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
    category: string;
  }>;
  answers?: number[];
  timeLimit: number; // in minutes
  status: 'ready' | 'in_progress' | 'completed' | 'expired';
  score?: number;
  generatedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITestSessionModel extends Model<ITestSessionDocument> {
  findUserSessions(userId: string): Promise<ITestSessionDocument[]>;
  expireOldSessions(): Promise<void>;
}

const testSessionSchema = new Schema<ITestSessionDocument>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  job: {
    type: Schema.Types.ObjectId,
    ref: 'Job',
    required: [true, 'Job is required']
  },
  testLevel: {
    type: String,
    enum: ['easy', 'intermediate', 'hard'],
    required: [true, 'Test level is required']
  },
  purchase: {
    type: Schema.Types.ObjectId,
    ref: 'TestPurchase',
    required: false, // Optional for simple/demo tests
    default: null
  },
  questions: [{
    question: {
      type: String,
      required: true
    },
    options: [{
      type: String,
      required: true
    }],
    correctAnswer: {
      type: Number,
      required: true,
      min: 0
      // Removed max constraint to allow for variable number of options
    },
    explanation: {
      type: String,
      required: true
    },
    category: {
      type: String,
      required: true
    }
  }],
  answers: [{
    type: Number,
    min: 0,
    max: 3
  }],
  timeLimit: {
    type: Number,
    required: [true, 'Time limit is required'],
    min: [1, 'Time limit must be at least 1 minute']
  },
  status: {
    type: String,
    enum: ['ready', 'in_progress', 'completed', 'expired'],
    default: 'ready'
  },
  score: {
    type: Number,
    min: 0,
    max: 100
  },
  generatedAt: {
    type: Date,
    default: Date.now
  },
  startedAt: {
    type: Date
  },
  completedAt: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function(_doc, ret: any) {
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes
testSessionSchema.index({ user: 1 });
testSessionSchema.index({ job: 1 });
testSessionSchema.index({ status: 1 });
testSessionSchema.index({ generatedAt: 1 });
testSessionSchema.index({ user: 1, status: 1 });

// Virtuals
testSessionSchema.virtual('duration').get(function(this: ITestSessionDocument) {
  if (this.startedAt && this.completedAt) {
    return Math.round((this.completedAt.getTime() - this.startedAt.getTime()) / 1000 / 60); // in minutes
  }
  return null;
});

testSessionSchema.virtual('isExpired').get(function(this: ITestSessionDocument) {
  if (this.status === 'in_progress' && this.startedAt) {
    const expiryTime = new Date(this.startedAt.getTime() + (this.timeLimit * 60 * 1000));
    return new Date() > expiryTime;
  }
  return false;
});

// Static methods
testSessionSchema.statics.findUserSessions = function(userId: string): Promise<ITestSessionDocument[]> {
  return this.find({ user: userId })
    .populate('job', 'title company industry')
    .populate('purchase', 'testLevel levelName')
    .sort({ generatedAt: -1 });
};

testSessionSchema.statics.expireOldSessions = function(): Promise<void> {
  const expiredCutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
  
  return this.updateMany(
    {
      status: { $in: ['ready', 'in_progress'] },
      generatedAt: { $lt: expiredCutoff }
    },
    { status: 'expired' }
  );
};

// Pre-save middleware
testSessionSchema.pre('save', function(next) {
  // Auto-expire if time limit exceeded
  if (this.status === 'in_progress' && this.startedAt) {
    // Calculate if expired manually since we can't access virtuals in pre-save
    const expiryTime = new Date(this.startedAt.getTime() + (this.timeLimit * 60 * 1000));
    if (new Date() > expiryTime) {
      this.status = 'expired';
    }
  }
  next();
});

export const TestSession = mongoose.model<ITestSessionDocument, ITestSessionModel>('TestSession', testSessionSchema);