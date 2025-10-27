import mongoose, { Schema, Document } from 'mongoose';

export interface IPaymentRequest extends Document {
  userId: string;
  userEmail: string;
  userName: string;
  jobId: string;
  jobTitle: string;
  company: string;
  testType: string;
  questionCount: number;
  estimatedDuration: number;
  requestedAt: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  adminNotes?: string;
  approvedAt?: string;
  approvedBy?: string;
  completedAt?: Date;
  paymentAmount?: number;
  paymentMethod?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentRequestSchema: Schema = new Schema(
  {
    userId: {
      type: String,
      required: true,
      ref: 'User'
    },
    userEmail: {
      type: String,
      required: true
    },
    userName: {
      type: String,
      required: true
    },
    jobId: {
      type: String,
      required: true,
      ref: 'Job'
    },
    jobTitle: {
      type: String,
      required: true
    },
    company: {
      type: String,
      required: true
    },
    testType: {
      type: String,
      required: true,
      default: 'Premium Psychometric Assessment'
    },
    questionCount: {
      type: Number,
      required: true,
      default: 40
    },
    estimatedDuration: {
      type: Number,
      required: true,
      default: 60
    },
    requestedAt: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'completed'],
      default: 'pending'
    },
    adminNotes: {
      type: String
    },
    approvedAt: {
      type: String
    },
    approvedBy: {
      type: String,
      ref: 'User'
    },
    completedAt: {
      type: Date
    },
    paymentAmount: {
      type: Number
    },
    paymentMethod: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

// Indexes for better query performance
PaymentRequestSchema.index({ userId: 1, status: 1 });
PaymentRequestSchema.index({ jobId: 1 });
PaymentRequestSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model<IPaymentRequest>('PaymentRequest', PaymentRequestSchema);