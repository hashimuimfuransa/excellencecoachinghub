import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITestPurchaseDocument extends Document {
  user: string;
  test: string;
  job?: string;
  paymentIntentId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  purchasedAt: Date;
  expiresAt?: Date;
  maxAttempts: number;
  attemptsUsed: number;
  metadata?: Record<string, any>;
}

export interface ITestPurchaseModel extends Model<ITestPurchaseDocument> {
  findUserPurchaseForTest(userId: string, testId: string, jobId?: string): Promise<ITestPurchaseDocument | null>;
  hasValidPurchase(userId: string, testId: string, jobId?: string): Promise<boolean>;
  canTakeTest(userId: string, testId: string, jobId?: string): Promise<{ canTake: boolean; purchase?: ITestPurchaseDocument; reason?: string }>;
  incrementAttemptCount(purchaseId: string): Promise<ITestPurchaseDocument>;
}

const testPurchaseSchema = new Schema<ITestPurchaseDocument>({
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
  paymentIntentId: {
    type: String,
    required: [true, 'Payment intent ID is required'],
    unique: true
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount cannot be negative']
  },
  currency: {
    type: String,
    required: [true, 'Currency is required'],
    uppercase: true,
    default: 'USD'
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    required: [true, 'Status is required'],
    default: 'pending'
  },
  purchasedAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    // Default to 30 days from purchase
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  },
  maxAttempts: {
    type: Number,
    required: [true, 'Max attempts is required'],
    min: [1, 'Must allow at least 1 attempt'],
    default: 3
  },
  attemptsUsed: {
    type: Number,
    required: [true, 'Attempts used is required'],
    min: [0, 'Attempts used cannot be negative'],
    default: 0
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
testPurchaseSchema.index({ user: 1 });
testPurchaseSchema.index({ test: 1 });
testPurchaseSchema.index({ job: 1 });
testPurchaseSchema.index({ status: 1 });
testPurchaseSchema.index({ paymentIntentId: 1 });
testPurchaseSchema.index({ purchasedAt: -1 });
testPurchaseSchema.index({ expiresAt: 1 });

// Compound indexes
testPurchaseSchema.index({ user: 1, test: 1, job: 1 });
testPurchaseSchema.index({ user: 1, status: 1 });
testPurchaseSchema.index({ status: 1, expiresAt: 1 });

// Unique constraint to prevent duplicate purchases for same user, test, and job
testPurchaseSchema.index({ user: 1, test: 1, job: 1, paymentIntentId: 1 }, { 
  unique: true 
});

// Virtual for remaining attempts
testPurchaseSchema.virtual('remainingAttempts').get(function(this: ITestPurchaseDocument) {
  return Math.max(0, this.maxAttempts - this.attemptsUsed);
});

// Virtual for is expired
testPurchaseSchema.virtual('isExpired').get(function(this: ITestPurchaseDocument) {
  return this.expiresAt ? new Date() > this.expiresAt : false;
});

// Virtual for is valid
testPurchaseSchema.virtual('isValid').get(function(this: ITestPurchaseDocument) {
  return this.status === 'completed' && 
         this.attemptsUsed < this.maxAttempts && 
         (!this.expiresAt || new Date() <= this.expiresAt);
});

// Static methods
testPurchaseSchema.statics.findUserPurchaseForTest = function(
  userId: string, 
  testId: string, 
  jobId?: string
): Promise<ITestPurchaseDocument | null> {
  const query: any = { user: userId, test: testId, status: 'completed' };
  if (jobId) query.job = jobId;
  
  return this.findOne(query)
    .populate('test', 'title type')
    .populate('job', 'title company')
    .sort({ purchasedAt: -1 });
};

testPurchaseSchema.statics.hasValidPurchase = async function(
  userId: string, 
  testId: string, 
  jobId?: string
): Promise<boolean> {
  const purchase = await this.findUserPurchaseForTest(userId, testId, jobId);
  if (!purchase) return false;
  
  // Check if purchase is still valid
  const isValid = purchase.status === 'completed' && 
                  purchase.attemptsUsed < purchase.maxAttempts && 
                  (!purchase.expiresAt || new Date() <= purchase.expiresAt);
  
  return isValid;
};

testPurchaseSchema.statics.canTakeTest = async function(
  userId: string, 
  testId: string, 
  jobId?: string
): Promise<{ canTake: boolean; purchase?: ITestPurchaseDocument; reason?: string }> {
  const purchase = await this.findUserPurchaseForTest(userId, testId, jobId);
  
  if (!purchase) {
    return { 
      canTake: false, 
      reason: 'No valid purchase found for this test' 
    };
  }
  
  if (purchase.status !== 'completed') {
    return { 
      canTake: false, 
      purchase,
      reason: `Payment status is ${purchase.status}` 
    };
  }
  
  if (purchase.attemptsUsed >= purchase.maxAttempts) {
    return { 
      canTake: false, 
      purchase,
      reason: 'Maximum attempts exceeded' 
    };
  }
  
  if (purchase.expiresAt && new Date() > purchase.expiresAt) {
    return { 
      canTake: false, 
      purchase,
      reason: 'Test purchase has expired' 
    };
  }
  
  return { 
    canTake: true, 
    purchase 
  };
};

testPurchaseSchema.statics.incrementAttemptCount = function(
  purchaseId: string
): Promise<ITestPurchaseDocument> {
  return this.findByIdAndUpdate(
    purchaseId,
    { $inc: { attemptsUsed: 1 } },
    { new: true, runValidators: true }
  );
};

export const TestPurchase = mongoose.model<ITestPurchaseDocument, ITestPurchaseModel>('TestPurchase', testPurchaseSchema);