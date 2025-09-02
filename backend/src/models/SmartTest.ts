import mongoose, { Document, Schema } from 'mongoose';

interface ISmartTestQuestion {
  id: string;
  question: string;
  type: 'multiple_choice' | 'case_study' | 'coding_challenge' | 'situational' | 'technical';
  options?: string[];
  correctAnswer: any;
  explanation: string;
  category: string;
  difficulty: 'basic' | 'intermediate' | 'advanced';
}

interface ISmartTest extends Document {
  testId: string;
  title: string;
  description: string;
  jobId?: mongoose.Types.ObjectId;
  jobTitle: string;
  company?: string;
  userId: mongoose.Types.ObjectId;
  questions: ISmartTestQuestion[];
  timeLimit: number; // in minutes
  difficulty: 'basic' | 'intermediate' | 'advanced';
  questionCount: number;
  industry?: string;
  jobRole: string;
  skillsRequired: string[];
  isActive: boolean;
  testType?: 'free' | 'premium';
  isAdminUploaded?: boolean;
  uploadedBy?: string;
  testTakers?: number;
  averageScore?: number;
  createdAt: Date;
  updatedAt: Date;
}

const smartTestQuestionSchema = new Schema<ISmartTestQuestion>({
  id: { type: String, required: true },
  question: { type: String, required: true },
  type: { 
    type: String, 
    required: true,
    enum: ['multiple_choice', 'case_study', 'coding_challenge', 'situational', 'technical']
  },
  options: [{ type: String }],
  correctAnswer: { type: Schema.Types.Mixed, required: true },
  explanation: { type: String, required: true },
  category: { type: String, required: true },
  difficulty: { 
    type: String, 
    required: true,
    enum: ['basic', 'intermediate', 'advanced']
  }
});

const smartTestSchema = new Schema<ISmartTest>({
  testId: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  jobId: { type: Schema.Types.ObjectId, ref: 'Job' },
  jobTitle: { type: String, required: true },
  company: { type: String },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  questions: [smartTestQuestionSchema],
  timeLimit: { type: Number, required: true },
  difficulty: { 
    type: String, 
    required: true,
    enum: ['basic', 'intermediate', 'advanced']
  },
  questionCount: { type: Number, required: true },
  industry: { type: String },
  jobRole: { type: String, required: true },
  skillsRequired: [{ type: String }],
  isActive: { type: Boolean, default: true },
  testType: { 
    type: String, 
    enum: ['free', 'premium'],
    default: 'free'
  },
  isPublished: { type: Boolean, default: false },
  isAdminUploaded: { type: Boolean, default: false },
  uploadedBy: { type: String },
  testTakers: { type: Number, default: 0 },
  averageScore: { type: Number, default: 0 }
}, {
  timestamps: true
});

// Indexes for better query performance
smartTestSchema.index({ userId: 1, createdAt: -1 });
smartTestSchema.index({ jobId: 1, userId: 1 });
smartTestSchema.index({ testId: 1 });
smartTestSchema.index({ isActive: 1 });
smartTestSchema.index({ userId: 1, testType: 1 }); // For free test checking

export const SmartTest = mongoose.model<ISmartTest>('SmartTest', smartTestSchema);
export type { ISmartTest, ISmartTestQuestion };