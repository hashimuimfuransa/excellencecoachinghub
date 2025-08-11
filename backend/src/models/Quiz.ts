import mongoose, { Schema, Document, Model } from 'mongoose';
import { QuizType } from '../../../shared/types';

// Quiz question interface
export interface IQuizQuestionDocument extends Document {
  question: string;
  type: QuizType;
  options?: string[];
  correctAnswer: string | string[];
  explanation?: string;
  points: number;
  difficulty: 'easy' | 'medium' | 'hard';
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

// Quiz document interface
export interface IQuizDocument extends Document {
  title: string;
  description?: string;
  course: mongoose.Types.ObjectId;
  questions: IQuizQuestionDocument[];
  timeLimit?: number; // in minutes
  attempts: number;
  passingScore: number;
  isProctored: boolean;
  randomizeQuestions: boolean;
  showResults: boolean;
  allowReview: boolean;
  isActive: boolean;
  scheduledStart?: Date;
  scheduledEnd?: Date;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;

  // Instance methods
  addQuestion(question: Omit<IQuizQuestionDocument, '_id' | 'createdAt' | 'updatedAt'>): Promise<IQuizDocument>;
  removeQuestion(questionId: string): Promise<IQuizDocument>;
  updateQuestion(questionId: string, updates: Partial<IQuizQuestionDocument>): Promise<IQuizDocument>;
  calculateMaxScore(): number;
  isAvailable(): boolean;
}

// Quiz model interface
export interface IQuizModel extends Model<IQuizDocument> {
  findByCourse(courseId: string): Promise<IQuizDocument[]>;
  findByCreator(creatorId: string): Promise<IQuizDocument[]>;
  findActive(): Promise<IQuizDocument[]>;
  findProctored(): Promise<IQuizDocument[]>;
}

// Quiz question schema
const quizQuestionSchema = new Schema<IQuizQuestionDocument>({
  question: {
    type: String,
    required: [true, 'Question text is required'],
    trim: true,
    maxlength: [1000, 'Question cannot exceed 1000 characters']
  },
  type: {
    type: String,
    enum: Object.values(QuizType),
    required: [true, 'Question type is required']
  },
  options: [{
    type: String,
    trim: true,
    maxlength: [200, 'Option cannot exceed 200 characters']
  }],
  correctAnswer: {
    type: Schema.Types.Mixed,
    required: [true, 'Correct answer is required']
  },
  explanation: {
    type: String,
    trim: true,
    maxlength: [500, 'Explanation cannot exceed 500 characters']
  },
  points: {
    type: Number,
    required: [true, 'Points are required'],
    min: [1, 'Points must be at least 1'],
    max: [100, 'Points cannot exceed 100']
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    required: [true, 'Difficulty level is required'],
    default: 'medium'
  },
  order: {
    type: Number,
    required: [true, 'Question order is required'],
    min: [0, 'Order cannot be negative']
  }
}, {
  timestamps: true
});

// Quiz schema
const quizSchema = new Schema<IQuizDocument>({
  title: {
    type: String,
    required: [true, 'Quiz title is required'],
    trim: true,
    maxlength: [200, 'Quiz title cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Quiz description cannot exceed 1000 characters']
  },
  course: {
    type: Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Course reference is required']
  },
  questions: [quizQuestionSchema],
  timeLimit: {
    type: Number,
    min: [1, 'Time limit must be at least 1 minute'],
    max: [480, 'Time limit cannot exceed 8 hours (480 minutes)']
  },
  attempts: {
    type: Number,
    required: [true, 'Number of attempts is required'],
    min: [1, 'Must allow at least 1 attempt'],
    max: [10, 'Cannot allow more than 10 attempts'],
    default: 1
  },
  passingScore: {
    type: Number,
    required: [true, 'Passing score is required'],
    min: [0, 'Passing score cannot be negative'],
    max: [100, 'Passing score cannot exceed 100']
  },
  isProctored: {
    type: Boolean,
    default: false
  },
  randomizeQuestions: {
    type: Boolean,
    default: false
  },
  showResults: {
    type: Boolean,
    default: true
  },
  allowReview: {
    type: Boolean,
    default: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  scheduledStart: {
    type: Date,
    default: null
  },
  scheduledEnd: {
    type: Date,
    default: null
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator reference is required']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
quizSchema.index({ course: 1 });
quizSchema.index({ createdBy: 1 });
quizSchema.index({ isActive: 1 });
quizSchema.index({ isProctored: 1 });
quizSchema.index({ scheduledStart: 1 });
quizSchema.index({ scheduledEnd: 1 });
quizSchema.index({ createdAt: -1 });

// Virtual for total questions count
quizSchema.virtual('totalQuestions').get(function(this: IQuizDocument) {
  return this.questions.length;
});

// Virtual for total points
quizSchema.virtual('totalPoints').get(function(this: IQuizDocument) {
  return this.questions.reduce((total, question) => total + question.points, 0);
});

// Validation for scheduled dates
quizSchema.pre<IQuizDocument>('validate', function(next) {
  if (this.scheduledStart && this.scheduledEnd) {
    if (this.scheduledStart >= this.scheduledEnd) {
      next(new Error('Scheduled start time must be before end time'));
      return;
    }
  }
  
  // Validate multiple choice questions have options
  for (const question of this.questions) {
    if (question.type === QuizType.MULTIPLE_CHOICE && (!question.options || question.options.length < 2)) {
      next(new Error('Multiple choice questions must have at least 2 options'));
      return;
    }
  }
  
  next();
});

// Instance method to add question
quizSchema.methods.addQuestion = async function(
  question: Omit<IQuizQuestionDocument, '_id' | 'createdAt' | 'updatedAt'>
): Promise<IQuizDocument> {
  this.questions.push(question as IQuizQuestionDocument);
  return this.save();
};

// Instance method to remove question
quizSchema.methods.removeQuestion = async function(questionId: string): Promise<IQuizDocument> {
  this.questions = this.questions.filter(q => q._id?.toString() !== questionId);
  return this.save();
};

// Instance method to update question
quizSchema.methods.updateQuestion = async function(
  questionId: string, 
  updates: Partial<IQuizQuestionDocument>
): Promise<IQuizDocument> {
  const question = this.questions.id(questionId);
  if (question) {
    Object.assign(question, updates);
  }
  return this.save();
};

// Instance method to calculate maximum score
quizSchema.methods.calculateMaxScore = function(): number {
  return this.questions.reduce((total, question) => total + question.points, 0);
};

// Instance method to check if quiz is available
quizSchema.methods.isAvailable = function(): boolean {
  if (!this.isActive) return false;
  
  const now = new Date();
  
  if (this.scheduledStart && now < this.scheduledStart) return false;
  if (this.scheduledEnd && now > this.scheduledEnd) return false;
  
  return true;
};

// Static method to find quizzes by course
quizSchema.statics.findByCourse = function(courseId: string): Promise<IQuizDocument[]> {
  return this.find({ course: courseId, isActive: true })
    .populate('createdBy', 'firstName lastName')
    .sort({ createdAt: -1 });
};

// Static method to find quizzes by creator
quizSchema.statics.findByCreator = function(creatorId: string): Promise<IQuizDocument[]> {
  return this.find({ createdBy: creatorId })
    .populate('course', 'title')
    .sort({ createdAt: -1 });
};

// Static method to find active quizzes
quizSchema.statics.findActive = function(): Promise<IQuizDocument[]> {
  return this.find({ isActive: true })
    .populate('course', 'title')
    .populate('createdBy', 'firstName lastName');
};

// Static method to find proctored quizzes
quizSchema.statics.findProctored = function(): Promise<IQuizDocument[]> {
  return this.find({ isProctored: true, isActive: true })
    .populate('course', 'title')
    .populate('createdBy', 'firstName lastName');
};

// Create and export the model
export const Quiz = mongoose.model<IQuizDocument, IQuizModel>('Quiz', quizSchema);
