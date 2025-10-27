import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITestPurchaseDocument extends Document {
  user: mongoose.Types.ObjectId;
  testLevel: string; // 'easy', 'intermediate', 'hard'
  levelName: string;
  transactionId: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  purchasedAt: Date;
  expiresAt: Date;
  features: {
    questionCount: number;
    timeLimit: number;
    attempts: number;
    validityDays: number;
    detailedReports: boolean;
  };
  attemptsUsed: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITestPurchaseModel extends Model<ITestPurchaseDocument> {
  findUserActivePurchases(userId: string): Promise<ITestPurchaseDocument[]>;
  hasActiveAccess(userId: string, levelId: string): Promise<{ hasAccess: boolean; purchase?: ITestPurchaseDocument }>;
  incrementAttempt(purchaseId: string): Promise<ITestPurchaseDocument | null>;
}

const testPurchaseSchema = new Schema<ITestPurchaseDocument>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  testLevel: {
    type: String,
    enum: ['easy', 'intermediate', 'hard'],
    required: [true, 'Test level is required']
  },
  levelName: {
    type: String,
    required: [true, 'Level name is required']
  },
  transactionId: {
    type: String,
    required: [true, 'Transaction ID is required'],
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
    default: 'RWF'
  },
  paymentMethod: {
    type: String,
    required: [true, 'Payment method is required']
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  purchasedAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    required: [true, 'Expiration date is required']
  },
  features: {
    questionCount: {
      type: Number,
      required: true
    },
    timeLimit: {
      type: Number,
      required: true
    },
    attempts: {
      type: Number,
      required: true
    },
    validityDays: {
      type: Number,
      required: true
    },
    detailedReports: {
      type: Boolean,
      default: false
    }
  },
  attemptsUsed: {
    type: Number,
    default: 0,
    min: [0, 'Attempts used cannot be negative']
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
testPurchaseSchema.index({ user: 1 });
testPurchaseSchema.index({ testLevel: 1 });
testPurchaseSchema.index({ status: 1 });
testPurchaseSchema.index({ transactionId: 1 });
testPurchaseSchema.index({ expiresAt: 1 });
testPurchaseSchema.index({ user: 1, status: 1 });
testPurchaseSchema.index({ user: 1, testLevel: 1 });

// Virtuals
testPurchaseSchema.virtual('remainingAttempts').get(function(this: ITestPurchaseDocument) {
  return Math.max(0, this.features.attempts - this.attemptsUsed);
});

testPurchaseSchema.virtual('isExpired').get(function(this: ITestPurchaseDocument) {
  return new Date() > this.expiresAt;
});

testPurchaseSchema.virtual('isActive').get(function(this: ITestPurchaseDocument) {
  return this.status === 'completed' && !this.isExpired && this.remainingAttempts > 0;
});

// Static methods
testPurchaseSchema.statics.findUserActivePurchases = function(userId: string): Promise<ITestPurchaseDocument[]> {
  return this.find({ 
    user: userId, 
    status: 'completed',
    expiresAt: { $gt: new Date() }
  }).sort({ purchasedAt: -1 });
};

testPurchaseSchema.statics.hasActiveAccess = async function(
  userId: string, 
  levelId: string
): Promise<{ hasAccess: boolean; purchase?: ITestPurchaseDocument }> {
  const purchase = await this.findOne({
    user: userId,
    testLevel: levelId,
    status: 'completed',
    expiresAt: { $gt: new Date() }
  }).sort({ purchasedAt: -1 });

  if (!purchase) {
    return {
      hasAccess: false
    };
  }

  // Check if user has remaining attempts
  if (purchase.attemptsUsed >= purchase.features.attempts) {
    return {
      hasAccess: false,
      purchase
    };
  }

  return {
    hasAccess: true,
    purchase
  };
};

testPurchaseSchema.statics.incrementAttempt = function(purchaseId: string): Promise<ITestPurchaseDocument | null> {
  return this.findByIdAndUpdate(
    purchaseId,
    { $inc: { attemptsUsed: 1 } },
    { new: true }
  );
};

// Pre-save middleware
testPurchaseSchema.pre('save', function(next) {
  // Ensure attemptsUsed doesn't exceed maxAttempts
  if (this.attemptsUsed > this.features.attempts) {
    this.attemptsUsed = this.features.attempts;
  }
  next();
});

export const TestPurchase = mongoose.model<ITestPurchaseDocument, ITestPurchaseModel>('TestPurchase', testPurchaseSchema);