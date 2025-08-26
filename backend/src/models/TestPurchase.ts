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
  
  // Approval workflow
  approvalStatus: 'not_required' | 'pending_approval' | 'approved' | 'rejected';
  approvalRequestedAt?: Date;
  approvedBy?: string;
  approvedAt?: Date;
  rejectedBy?: string;
  rejectedAt?: Date;
  rejectionReason?: string;
  autoApproval: boolean;
}

export interface ITestPurchaseModel extends Model<ITestPurchaseDocument> {
  findUserPurchaseForTest(userId: string, testId: string, jobId?: string): Promise<ITestPurchaseDocument | null>;
  hasValidPurchase(userId: string, testId: string, jobId?: string): Promise<boolean>;
  canTakeTest(userId: string, testId: string, jobId?: string): Promise<{ canTake: boolean; purchase?: ITestPurchaseDocument; reason?: string }>;
  incrementAttemptCount(purchaseId: string): Promise<ITestPurchaseDocument>;
  findPendingApprovals(): Promise<ITestPurchaseDocument[]>;
  findUserPurchases(userId: string): Promise<ITestPurchaseDocument[]>;
  requestApproval(purchaseId: string): Promise<ITestPurchaseDocument>;
  approveTest(purchaseId: string, approvedBy: string): Promise<ITestPurchaseDocument>;
  rejectTest(purchaseId: string, rejectedBy: string, reason: string): Promise<ITestPurchaseDocument>;
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
  },
  
  // Approval workflow fields
  approvalStatus: {
    type: String,
    enum: ['not_required', 'pending_approval', 'approved', 'rejected'],
    default: 'not_required',
    index: true
  },
  approvalRequestedAt: {
    type: Date,
    index: true
  },
  approvedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date,
    index: true
  },
  rejectedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  rejectedAt: {
    type: Date
  },
  rejectionReason: {
    type: String,
    trim: true,
    maxlength: [500, 'Rejection reason cannot exceed 500 characters']
  },
  autoApproval: {
    type: Boolean,
    default: true,
    index: true
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
testPurchaseSchema.index({ approvalStatus: 1 });
testPurchaseSchema.index({ approvalRequestedAt: -1 });
testPurchaseSchema.index({ approvedAt: -1 });

// Compound indexes
testPurchaseSchema.index({ user: 1, test: 1, job: 1 });
testPurchaseSchema.index({ user: 1, status: 1 });
testPurchaseSchema.index({ status: 1, expiresAt: 1 });
testPurchaseSchema.index({ approvalStatus: 1, approvalRequestedAt: -1 });
testPurchaseSchema.index({ user: 1, approvalStatus: 1 });

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
  const baseValid = this.status === 'completed' && 
                   this.attemptsUsed < this.maxAttempts && 
                   (!this.expiresAt || new Date() <= this.expiresAt);
  
  // If approval is not required or test is approved, it's valid
  if (this.approvalStatus === 'not_required' || this.approvalStatus === 'approved') {
    return baseValid;
  }
  
  // If approval is required but not approved, it's not valid for taking tests
  return false;
});

// Virtual for can request approval
testPurchaseSchema.virtual('canRequestApproval').get(function(this: ITestPurchaseDocument) {
  return this.status === 'completed' && 
         this.approvalStatus === 'not_required' &&
         this.attemptsUsed < this.maxAttempts && 
         (!this.expiresAt || new Date() <= this.expiresAt);
});

// Virtual for approval pending
testPurchaseSchema.virtual('isApprovalPending').get(function(this: ITestPurchaseDocument) {
  return this.approvalStatus === 'pending_approval';
});

// Virtual for approval status display
testPurchaseSchema.virtual('approvalStatusDisplay').get(function(this: ITestPurchaseDocument) {
  switch (this.approvalStatus) {
    case 'not_required':
      return 'Ready to Start';
    case 'pending_approval':
      return 'Pending Approval';
    case 'approved':
      return 'Approved - Ready to Start';
    case 'rejected':
      return 'Rejected';
    default:
      return 'Unknown Status';
  }
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
  
  // Check approval status
  if (purchase.approvalStatus === 'pending_approval') {
    return { 
      canTake: false, 
      purchase,
      reason: 'Test approval is pending from admin' 
    };
  }
  
  if (purchase.approvalStatus === 'rejected') {
    return { 
      canTake: false, 
      purchase,
      reason: purchase.rejectionReason || 'Test has been rejected by admin' 
    };
  }
  
  // Only allow if approval not required or already approved
  if (purchase.approvalStatus !== 'not_required' && purchase.approvalStatus !== 'approved') {
    return { 
      canTake: false, 
      purchase,
      reason: 'Test requires admin approval before starting' 
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

// Find all purchases pending approval
testPurchaseSchema.statics.findPendingApprovals = function(): Promise<ITestPurchaseDocument[]> {
  return this.find({ 
    approvalStatus: 'pending_approval',
    status: 'completed' // Only look at completed purchases
  })
    .populate('user', 'firstName lastName email')
    .populate('test', 'title type description')
    .populate('job', 'title company')
    .sort({ approvalRequestedAt: -1 });
};

// Find all purchases for a user
testPurchaseSchema.statics.findUserPurchases = function(userId: string): Promise<ITestPurchaseDocument[]> {
  return this.find({ 
    user: userId,
    status: 'completed' // Only return completed purchases
  })
    .populate('test', 'title type description timeLimit')
    .populate('job', 'title company')
    .sort({ purchasedAt: -1 });
};

// Request approval for a test
testPurchaseSchema.statics.requestApproval = function(purchaseId: string): Promise<ITestPurchaseDocument> {
  return this.findByIdAndUpdate(
    purchaseId,
    { 
      approvalStatus: 'pending_approval',
      approvalRequestedAt: new Date()
    },
    { new: true, runValidators: true }
  )
    .populate('test', 'title type')
    .populate('job', 'title company');
};

// Approve a test
testPurchaseSchema.statics.approveTest = function(
  purchaseId: string, 
  approvedBy: string
): Promise<ITestPurchaseDocument> {
  return this.findByIdAndUpdate(
    purchaseId,
    { 
      approvalStatus: 'approved',
      approvedBy,
      approvedAt: new Date()
    },
    { new: true, runValidators: true }
  )
    .populate('user', 'firstName lastName email')
    .populate('test', 'title type')
    .populate('job', 'title company');
};

// Reject a test
testPurchaseSchema.statics.rejectTest = function(
  purchaseId: string, 
  rejectedBy: string, 
  reason: string
): Promise<ITestPurchaseDocument> {
  return this.findByIdAndUpdate(
    purchaseId,
    { 
      approvalStatus: 'rejected',
      rejectedBy,
      rejectedAt: new Date(),
      rejectionReason: reason
    },
    { new: true, runValidators: true }
  )
    .populate('user', 'firstName lastName email')
    .populate('test', 'title type')
    .populate('job', 'title company');
};

export const TestPurchase = mongoose.model<ITestPurchaseDocument, ITestPurchaseModel>('TestPurchase', testPurchaseSchema);