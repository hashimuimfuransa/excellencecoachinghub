import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IPastPaperDocument extends Document {
  title: string;
  description: string;
  subject: string;
  level: 'O-Level' | 'A-Level' | 'University' | 'Professional' | 'General';
  year: number;
  examBoard?: string; // e.g., Cambridge, Edexcel, etc.
  duration: number; // in minutes
  totalMarks: number;
  questions: Array<{
    id: string;
    question: string;
    type: 'multiple-choice' | 'multiple_choice' | 'true-false' | 'true_false' | 'short-answer' | 'short_answer' | 'essay' | 'fill_in_blank' | 'numerical' | 'matching' | 'multiple_choice_multiple';
    options?: string[];
    correctAnswer?: string;
    points: number;
    section?: string;
    difficulty?: 'easy' | 'medium' | 'hard';
    explanation?: string; // Explanation for the correct answer
    topic?: string; // Subject topic this question covers
  }>;
  
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
    explanation?: string;
    topic?: string;
    aiExtracted: boolean;
  }>;
  
  // Metadata
  tags: string[];
  isPublished: boolean;
  publishedAt?: Date;
  createdBy: mongoose.Types.ObjectId; // Super admin who created it
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  
  // Statistics
  totalAttempts: number;
  averageScore: number;
  passRate: number;
  difficultyRating: number; // 1-5 scale based on user feedback
  
  // Settings
  allowMultipleAttempts: boolean;
  showResultsImmediately: boolean;
  showCorrectAnswers: boolean;
  showExplanations: boolean;
  randomizeQuestions: boolean;
  randomizeOptions: boolean;
  
  // Time limits
  timeLimit?: number; // in minutes, if different from duration
  
  // Feedback settings
  provideFeedback: boolean;
  feedbackType: 'immediate' | 'after_completion' | 'both';
  
  createdAt: Date;
  updatedAt: Date;

  // Instance methods
  isAvailable(): boolean;
  calculateDifficultyRating(): Promise<number>;
  getQuestionCount(): number;
  getSections(): string[];
}

export interface IPastPaperModel extends Model<IPastPaperDocument> {
  findBySubject(subject: string): Promise<IPastPaperDocument[]>;
  findByLevel(level: string): Promise<IPastPaperDocument[]>;
  findByYear(year: number): Promise<IPastPaperDocument[]>;
  findByExamBoard(examBoard: string): Promise<IPastPaperDocument[]>;
  searchPastPapers(query: string): Promise<IPastPaperDocument[]>;
  getPublishedPastPapers(): Promise<IPastPaperDocument[]>;
  getPopularPastPapers(limit?: number): Promise<IPastPaperDocument[]>;
  getRecentPastPapers(limit?: number): Promise<IPastPaperDocument[]>;
}

const pastPaperSchema = new Schema<IPastPaperDocument>({
  title: {
    type: String,
    required: [true, 'Past paper title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true,
    maxlength: [100, 'Subject cannot exceed 100 characters']
  },
  level: {
    type: String,
    enum: ['O-Level', 'A-Level', 'University', 'Professional', 'General'],
    required: [true, 'Level is required']
  },
  year: {
    type: Number,
    required: [true, 'Year is required'],
    min: [1900, 'Year must be after 1900'],
    max: [new Date().getFullYear() + 1, 'Year cannot be in the future']
  },
  examBoard: {
    type: String,
    trim: true,
    maxlength: [100, 'Exam board cannot exceed 100 characters']
  },
  duration: {
    type: Number,
    required: [true, 'Duration is required'],
    min: [1, 'Duration must be at least 1 minute'],
    max: [480, 'Duration cannot exceed 8 hours']
  },
  totalMarks: {
    type: Number,
    required: [true, 'Total marks is required'],
    min: [1, 'Total marks must be at least 1']
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
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard']
    },
    explanation: String,
    topic: String
  }],
  
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
    section: String,
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard']
    },
    explanation: String,
    topic: String,
    aiExtracted: {
      type: Boolean,
      default: false
    }
  }],
  
  // Metadata
  tags: [{
    type: String,
    trim: true,
    maxlength: [50, 'Tag cannot exceed 50 characters']
  }],
  isPublished: {
    type: Boolean,
    default: false
  },
  publishedAt: {
    type: Date,
    default: null
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Created by is required']
  },
  approvedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  approvedAt: {
    type: Date,
    default: null
  },
  
  // Statistics
  totalAttempts: {
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
  },
  difficultyRating: {
    type: Number,
    default: 0,
    min: 1,
    max: 5
  },
  
  // Settings
  allowMultipleAttempts: {
    type: Boolean,
    default: true
  },
  showResultsImmediately: {
    type: Boolean,
    default: true
  },
  showCorrectAnswers: {
    type: Boolean,
    default: true
  },
  showExplanations: {
    type: Boolean,
    default: true
  },
  randomizeQuestions: {
    type: Boolean,
    default: false
  },
  randomizeOptions: {
    type: Boolean,
    default: false
  },
  
  // Time limits
  timeLimit: {
    type: Number,
    min: 1,
    max: 480
  },
  
  // Feedback settings
  provideFeedback: {
    type: Boolean,
    default: true
  },
  feedbackType: {
    type: String,
    enum: ['immediate', 'after_completion', 'both'],
    default: 'immediate'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for efficient queries
pastPaperSchema.index({ subject: 1, level: 1 });
pastPaperSchema.index({ year: -1 });
pastPaperSchema.index({ examBoard: 1 });
pastPaperSchema.index({ isPublished: 1 });
pastPaperSchema.index({ tags: 1 });
pastPaperSchema.index({ totalAttempts: -1 });
pastPaperSchema.index({ averageScore: -1 });
pastPaperSchema.index({ difficultyRating: 1 });
pastPaperSchema.index({ createdBy: 1 });
pastPaperSchema.index({ publishedAt: -1 });

// Text index for search
pastPaperSchema.index({
  title: 'text',
  description: 'text',
  subject: 'text',
  tags: 'text'
});

// Instance methods
pastPaperSchema.methods.isAvailable = function(): boolean {
  return this.isPublished && this.questions.length > 0;
};

pastPaperSchema.methods.calculateDifficultyRating = async function(): Promise<number> {
  // This would calculate based on user feedback and performance data
  // For now, return the current rating
  return this.difficultyRating;
};

pastPaperSchema.methods.getQuestionCount = function(): number {
  return this.questions.length;
};

pastPaperSchema.methods.getSections = function(): string[] {
  const sections = new Set<string>();
  this.questions.forEach(question => {
    if (question.section) {
      sections.add(question.section);
    }
  });
  return Array.from(sections);
};

// Static methods
pastPaperSchema.statics.findBySubject = function(subject: string): Promise<IPastPaperDocument[]> {
  return this.find({ subject, isPublished: true })
    .populate('createdBy', 'firstName lastName')
    .sort({ year: -1, publishedAt: -1 });
};

pastPaperSchema.statics.findByLevel = function(level: string): Promise<IPastPaperDocument[]> {
  return this.find({ level, isPublished: true })
    .populate('createdBy', 'firstName lastName')
    .sort({ year: -1, publishedAt: -1 });
};

pastPaperSchema.statics.findByYear = function(year: number): Promise<IPastPaperDocument[]> {
  return this.find({ year, isPublished: true })
    .populate('createdBy', 'firstName lastName')
    .sort({ publishedAt: -1 });
};

pastPaperSchema.statics.findByExamBoard = function(examBoard: string): Promise<IPastPaperDocument[]> {
  return this.find({ examBoard, isPublished: true })
    .populate('createdBy', 'firstName lastName')
    .sort({ year: -1, publishedAt: -1 });
};

pastPaperSchema.statics.searchPastPapers = function(query: string): Promise<IPastPaperDocument[]> {
  return this.find({
    $text: { $search: query },
    isPublished: true
  })
    .populate('createdBy', 'firstName lastName')
    .sort({ score: { $meta: 'textScore' }, publishedAt: -1 });
};

pastPaperSchema.statics.getPublishedPastPapers = function(): Promise<IPastPaperDocument[]> {
  return this.find({ isPublished: true })
    .populate('createdBy', 'firstName lastName')
    .sort({ publishedAt: -1 });
};

pastPaperSchema.statics.getPopularPastPapers = function(limit: number = 10): Promise<IPastPaperDocument[]> {
  return this.find({ isPublished: true })
    .populate('createdBy', 'firstName lastName')
    .sort({ totalAttempts: -1, averageScore: -1 })
    .limit(limit);
};

pastPaperSchema.statics.getRecentPastPapers = function(limit: number = 10): Promise<IPastPaperDocument[]> {
  return this.find({ isPublished: true })
    .populate('createdBy', 'firstName lastName')
    .sort({ publishedAt: -1 })
    .limit(limit);
};

// Pre-save middleware
pastPaperSchema.pre('save', function(next) {
  if (this.isPublished && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  next();
});

export const PastPaper = mongoose.model<IPastPaperDocument, IPastPaperModel>('PastPaper', pastPaperSchema);
export default PastPaper;
