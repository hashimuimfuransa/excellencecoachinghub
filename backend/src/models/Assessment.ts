import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IAssessmentDocument extends Document {
  title: string;
  description: string;
  course: mongoose.Types.ObjectId;
  instructor: mongoose.Types.ObjectId;
  type: 'quiz' | 'assignment' | 'final';
  status: 'draft' | 'published' | 'archived';
  isPublished: boolean;
  instructions?: string;
  attempts: number;
  timeLimit?: number; // in minutes
  questions: Array<{
    id: string;
    question: string;
    type: 'multiple-choice' | 'multiple_choice' | 'true-false' | 'true_false' | 'short-answer' | 'short_answer' | 'essay' | 'fill_in_blank' | 'numerical' | 'matching' | 'multiple_choice_multiple';
    options?: string[];
    correctAnswer?: string;
    points: number;
    section?: string;
    difficulty?: 'easy' | 'medium' | 'hard';
    mathEquation?: string;
  }>;
  randomizeQuestions: boolean;
  randomizeOptions: boolean;
  showResultsImmediately: boolean;
  showCorrectAnswers: boolean;
  
  // Methods
  isAvailable(): boolean;
  isExpired(): boolean;
  
  // Document upload fields
  documentUrl?: string;
  documentType?: 'pdf' | 'docx' | 'txt';
  extractedQuestions?: Array<{
    question: string;
    type: 'multiple-choice' | 'multiple_choice' | 'true-false' | 'true_false' | 'short-answer' | 'short_answer' | 'essay' | 'fill_in_blank' | 'numerical' | 'matching' | 'multiple_choice_multiple';
    options?: string[];
    correctAnswer?: string;
    points: number;
    section?: string;
    difficulty?: 'easy' | 'medium' | 'hard';
    aiExtracted: boolean;
  }>;
  
  // Attachments (similar to assignments)
  attachments?: Array<{
    filename: string;
    originalName: string;
    fileUrl: string;
    fileSize: number;
    uploadedAt: Date;
  }>;
  
  // Scheduling
  scheduledDate?: Date;
  duration?: number; // in minutes
  dueDate?: Date;
  
  // Proctoring settings
  requireProctoring: boolean;
  requireCamera: boolean;
  requireScreenShare: boolean;
  aiCheatingDetection: boolean;
  
  // Grading settings
  totalPoints: number;
  passingScore: number;
  autoGrade: boolean;
  teacherReviewRequired: boolean;
  
  // Course requirements
  isRequired: boolean;
  requiredForCompletion: boolean;
  
  // Statistics
  totalSubmissions: number;
  averageScore: number;
  passRate: number;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface IAssessmentModel extends Model<IAssessmentDocument> {}

// Export types for use in other files
export type QuestionType = 'multiple-choice' | 'multiple_choice' | 'true-false' | 'true_false' | 'short-answer' | 'short_answer' | 'essay' | 'fill_in_blank' | 'numerical' | 'matching' | 'multiple_choice_multiple';
export type AssessmentType = 'quiz' | 'assignment' | 'final' | 'exam' | 'project' | 'homework';

const assessmentSchema = new Schema<IAssessmentDocument>({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  course: {
    type: Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
    index: true
  },
  instructor: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['quiz', 'assignment', 'final', 'exam', 'project', 'homework'],
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  instructions: {
    type: String,
    trim: true
  },
  attempts: {
    type: Number,
    default: 1,
    min: 1
  },
  timeLimit: {
    type: Number,
    min: 1
  },
  questions: [{
    id: {
      type: String,
      required: true
    },
    question: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['multiple-choice', 'multiple_choice', 'true-false', 'true_false', 'short-answer', 'short_answer', 'essay', 'fill_in_blank', 'numerical', 'matching', 'multiple_choice_multiple'],
      required: true
    },
    options: [String],
    correctAnswer: String,
    points: {
      type: Number,
      required: true,
      min: 0
    },
    section: String,
    mathEquation: String
  }],
  randomizeQuestions: {
    type: Boolean,
    default: false
  },
  randomizeOptions: {
    type: Boolean,
    default: false
  },
  showResultsImmediately: {
    type: Boolean,
    default: true
  },
  showCorrectAnswers: {
    type: Boolean,
    default: true
  },
  
  // Document upload fields
  documentUrl: String,
  documentType: {
    type: String,
    enum: ['pdf', 'docx', 'txt']
  },
  extractedQuestions: [{
    question: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['multiple-choice', 'multiple_choice', 'true-false', 'true_false', 'short-answer', 'short_answer', 'essay', 'fill_in_blank', 'numerical', 'matching', 'multiple_choice_multiple'],
      required: true
    },
    options: [String],
    correctAnswer: String,
    points: {
      type: Number,
      required: true,
      min: 0
    },
    aiExtracted: {
      type: Boolean,
      default: false
    }
  }],
  
  // Attachments
  attachments: [{
    filename: {
      type: String,
      required: true
    },
    originalName: {
      type: String,
      required: true
    },
    fileUrl: {
      type: String,
      required: true
    },
    fileSize: {
      type: Number,
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Scheduling
  scheduledDate: Date,
  duration: {
    type: Number,
    min: 1,
    max: 480 // 8 hours max
  },
  dueDate: Date,
  
  // Proctoring settings
  requireProctoring: {
    type: Boolean,
    default: true
  },
  requireCamera: {
    type: Boolean,
    default: true
  },
  requireScreenShare: {
    type: Boolean,
    default: false
  },
  aiCheatingDetection: {
    type: Boolean,
    default: true
  },
  
  // Grading settings
  totalPoints: {
    type: Number,
    required: true,
    min: 1
  },
  passingScore: {
    type: Number,
    required: true,
    min: 0
  },
  autoGrade: {
    type: Boolean,
    default: true
  },
  teacherReviewRequired: {
    type: Boolean,
    default: false
  },
  
  // Course requirements
  isRequired: {
    type: Boolean,
    default: true
  },
  requiredForCompletion: {
    type: Boolean,
    default: true
  },
  
  // Statistics
  totalSubmissions: {
    type: Number,
    default: 0
  },
  averageScore: {
    type: Number,
    default: 0
  },
  passRate: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
assessmentSchema.index({ course: 1, type: 1 });
assessmentSchema.index({ instructor: 1, status: 1 });
assessmentSchema.index({ scheduledDate: 1 });
assessmentSchema.index({ dueDate: 1 });

// Instance methods
assessmentSchema.methods.isAvailable = function(): boolean {
  const now = new Date();
  
  // Check if published
  if (!this.isPublished || this.status !== 'published') {
    return false;
  }
  
  // Check if scheduled date has passed
  if (this.scheduledDate && this.scheduledDate > now) {
    return false;
  }
  
  // Check if not expired
  if (this.dueDate && this.dueDate < now) {
    return false;
  }
  
  return true;
};

assessmentSchema.methods.isExpired = function(): boolean {
  if (!this.dueDate) return false;
  return new Date() > this.dueDate;
};

// Virtual for calculating pass rate
assessmentSchema.virtual('calculatedPassRate').get(function() {
  if (this.totalSubmissions === 0) return 0;
  return (this.passRate / this.totalSubmissions) * 100;
});

// Pre-save middleware to validate final assessment uniqueness
assessmentSchema.pre('save', async function(next) {
  if (this.type === 'final' && this.isNew) {
    const existingFinal = await mongoose.model('Assessment').findOne({
      course: this.course,
      type: 'final',
      status: { $ne: 'archived' }
    });
    
    if (existingFinal) {
      throw new Error('Only one final assessment allowed per course');
    }
  }
  next();
});

export const Assessment = mongoose.model<IAssessmentDocument, IAssessmentModel>('Assessment', assessmentSchema);
export default Assessment;
