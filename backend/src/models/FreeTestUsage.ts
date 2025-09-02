import mongoose, { Document, Schema } from 'mongoose';

interface IFreeTestUsage extends Document {
  userId: mongoose.Types.ObjectId;
  testType: 'psychometric' | 'smart_test';
  testId: string;
  usedAt: Date;
  permanentLock: boolean; // Always true - for emphasis
  createdAt: Date;
  updatedAt: Date;
}

const freeTestUsageSchema = new Schema<IFreeTestUsage>({
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  testType: { 
    type: String, 
    required: true,
    enum: ['psychometric', 'smart_test']
  },
  testId: { 
    type: String, 
    required: true 
  },
  usedAt: { 
    type: Date, 
    required: true,
    default: Date.now
  },
  permanentLock: { 
    type: Boolean, 
    required: true,
    default: true,
    immutable: true // This field cannot be changed once set
  }
}, {
  timestamps: true
});

// Compound unique index to ensure one free test per user per test type
freeTestUsageSchema.index({ userId: 1, testType: 1 }, { unique: true });

// Additional indexes for performance
freeTestUsageSchema.index({ userId: 1 });
freeTestUsageSchema.index({ testType: 1 });

export const FreeTestUsage = mongoose.model<IFreeTestUsage>('FreeTestUsage', freeTestUsageSchema);
export type { IFreeTestUsage };