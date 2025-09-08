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
  jobId?: mongoose.Types.ObjectId; // Make optional for admin tests
  answers: Record<string, any>;
  score: number;
  percentageScore: number;
  correctAnswers: number;
  incorrectAnswers: number;
  timeSpent: number; // in seconds
  timeSpentMinutes?: number; // in minutes for convenience
  isCompleted: boolean;
  detailedResults: ISmartTestDetailedResult[];
  feedback: ISmartTestFeedback | string; // Allow both structured and string feedback
  aiAnalysis?: string; // AI-powered detailed analysis
  testTitle?: string;
  jobTitle?: string;
  company?: string;
  industry?: string;
  difficulty?: string;
  isAdminTest?: boolean;
  skillsRequired?: string[];
  createdAt: Date;
  completedAt?: Date;
}

const smartTestDetailedResultSchema = new Schema<ISmartTestDetailedResult>({
  questionId: { type: String, required: true },
  question: { type: String, required: true },
  userAnswer: { type: Schema.Types.Mixed, required: false, default: 'Not answered' },
  correctAnswer: { type: Schema.Types.Mixed, required: false, default: 'No correct answer provided' },
  isCorrect: { type: Boolean, required: true, default: false },
  explanation: { type: String, required: false, default: 'No explanation provided' },
  category: { type: String, required: false, default: 'General' }
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
  jobId: { type: Schema.Types.ObjectId, ref: 'Job', required: false }, // Optional for admin tests
  answers: { type: Schema.Types.Mixed, required: true },
  score: { type: Number, required: true },
  percentageScore: { type: Number, required: true },
  correctAnswers: { type: Number, required: true },
  incorrectAnswers: { type: Number, required: true },
  timeSpent: { type: Number, required: true },
  timeSpentMinutes: { type: Number, required: false },
  isCompleted: { type: Boolean, default: false },
  detailedResults: [smartTestDetailedResultSchema],
  feedback: { type: Schema.Types.Mixed, required: true }, // Allow both structured and string feedback
  aiAnalysis: { type: String, required: false }, // AI analysis
  testTitle: { type: String, required: false },
  jobTitle: { type: String, required: false },
  company: { type: String, required: false },
  industry: { type: String, required: false },
  difficulty: { type: String, required: false },
  isAdminTest: { type: Boolean, default: false },
  skillsRequired: [{ type: String }],
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