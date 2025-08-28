import mongoose, { Document, Schema } from 'mongoose';

interface ISmartTestDetailedResult {
  questionId: string;
  question: string;
  userAnswer: any;
  correctAnswer: any;
  isCorrect: boolean;
  explanation: string;
  category: string;
}

interface ISmartTestFeedback {
  overall: string;
  strengths: string[];
  improvements: string[];
  recommendations: string[];
}

interface ISmartTestResult extends Document {
  testId: string;
  userId: mongoose.Types.ObjectId;
  jobId: mongoose.Types.ObjectId;
  answers: Record<string, any>;
  score: number;
  percentageScore: number;
  correctAnswers: number;
  incorrectAnswers: number;
  timeSpent: number; // in seconds
  isCompleted: boolean;
  detailedResults: ISmartTestDetailedResult[];
  feedback: ISmartTestFeedback;
  createdAt: Date;
  completedAt?: Date;
}

const smartTestDetailedResultSchema = new Schema<ISmartTestDetailedResult>({
  questionId: { type: String, required: true },
  question: { type: String, required: true },
  userAnswer: { type: Schema.Types.Mixed, required: true },
  correctAnswer: { type: Schema.Types.Mixed, required: true },
  isCorrect: { type: Boolean, required: true },
  explanation: { type: String, required: true },
  category: { type: String, required: true }
});

const smartTestFeedbackSchema = new Schema<ISmartTestFeedback>({
  overall: { type: String, required: true },
  strengths: [{ type: String }],
  improvements: [{ type: String }],
  recommendations: [{ type: String }]
});

const smartTestResultSchema = new Schema<ISmartTestResult>({
  testId: { type: String, required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  jobId: { type: Schema.Types.ObjectId, ref: 'Job', required: true },
  answers: { type: Schema.Types.Mixed, required: true },
  score: { type: Number, required: true },
  percentageScore: { type: Number, required: true },
  correctAnswers: { type: Number, required: true },
  incorrectAnswers: { type: Number, required: true },
  timeSpent: { type: Number, required: true },
  isCompleted: { type: Boolean, default: false },
  detailedResults: [smartTestDetailedResultSchema],
  feedback: smartTestFeedbackSchema,
  completedAt: { type: Date }
}, {
  timestamps: true
});

// Indexes for better query performance
smartTestResultSchema.index({ userId: 1, createdAt: -1 });
smartTestResultSchema.index({ testId: 1, userId: 1 });
smartTestResultSchema.index({ jobId: 1, userId: 1 });
smartTestResultSchema.index({ isCompleted: 1 });

export const SmartTestResult = mongoose.model<ISmartTestResult>('SmartTestResult', smartTestResultSchema);
export type { ISmartTestResult, ISmartTestDetailedResult, ISmartTestFeedback };