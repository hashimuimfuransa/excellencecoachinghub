import mongoose, { Schema, Document, Model } from 'mongoose';
import { PsychometricTestType } from '../types';

export interface IPsychometricQuestionDocument {
  _id: string;
  question: string;
  type: 'multiple_choice' | 'scale' | 'text' | 'scenario';
  options?: string[];
  scaleRange?: { min: number; max: number; labels: string[] };
  correctAnswer?: string | number;
  traits?: string[];
  weight: number;
}

export interface IPsychometricTestDocument extends Document {
  title: string;
  description: string;
  type: PsychometricTestType;
  questions: IPsychometricQuestionDocument[];
  timeLimit: number;
  industry?: string;
  jobRole?: string;
  createdBy: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPsychometricTestModel extends Model<IPsychometricTestDocument> {
  findActiveTests(): Promise<IPsychometricTestDocument[]>;
  findByType(type: PsychometricTestType): Promise<IPsychometricTestDocument[]>;
  findByIndustry(industry: string): Promise<IPsychometricTestDocument[]>;
  findByJobRole(jobRole: string): Promise<IPsychometricTestDocument[]>;
}

const psychometricQuestionSchema = new Schema({
  question: {
    type: String,
    required: [true, 'Question text is required'],
    trim: true,
    maxlength: [1000, 'Question cannot exceed 1000 characters']
  },
  type: {
    type: String,
    enum: ['multiple_choice', 'scale', 'text', 'scenario'],
    required: [true, 'Question type is required']
  },
  options: [{
    type: String,
    trim: true,
    maxlength: [200, 'Option cannot exceed 200 characters']
  }],
  scaleRange: {
    min: {
      type: Number,
      default: 1
    },
    max: {
      type: Number,
      default: 5
    },
    labels: [{
      type: String,
      trim: true,
      maxlength: [50, 'Scale label cannot exceed 50 characters']
    }]
  },
  correctAnswer: Schema.Types.Mixed,
  traits: [{
    type: String,
    trim: true,
    maxlength: [100, 'Trait name cannot exceed 100 characters']
  }],
  weight: {
    type: Number,
    required: [true, 'Question weight is required'],
    min: [0.1, 'Weight must be at least 0.1'],
    max: [10, 'Weight cannot exceed 10'],
    default: 1
  }
}, { _id: true });

const psychometricTestSchema = new Schema<IPsychometricTestDocument>({
  title: {
    type: String,
    required: [true, 'Test title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Test description is required'],
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  type: {
    type: String,
    enum: PsychometricTestType ? Object.values(PsychometricTestType) : ['personality', 'cognitive', 'aptitude', 'skills', 'behavioral'],
    required: [true, 'Test type is required']
  },
  questions: {
    type: [psychometricQuestionSchema],
    required: [true, 'Questions are required'],
    validate: {
      validator: function(questions: IPsychometricQuestionDocument[]) {
        return questions && questions.length > 0;
      },
      message: 'Test must have at least one question'
    }
  },
  timeLimit: {
    type: Number,
    required: [true, 'Time limit is required'],
    min: [5, 'Time limit must be at least 5 minutes'],
    max: [180, 'Time limit cannot exceed 180 minutes']
  },
  industry: {
    type: String,
    trim: true,
    maxlength: [100, 'Industry cannot exceed 100 characters']
  },
  jobRole: {
    type: String,
    trim: true,
    maxlength: [100, 'Job role cannot exceed 100 characters']
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator is required']
  },
  isActive: {
    type: Boolean,
    default: true
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
psychometricTestSchema.index({ type: 1 });
psychometricTestSchema.index({ isActive: 1 });
psychometricTestSchema.index({ industry: 1 });
psychometricTestSchema.index({ jobRole: 1 });
psychometricTestSchema.index({ createdBy: 1 });
psychometricTestSchema.index({ createdAt: -1 });

// Compound indexes
psychometricTestSchema.index({ type: 1, isActive: 1 });
psychometricTestSchema.index({ industry: 1, isActive: 1 });

// Virtual for question count
psychometricTestSchema.virtual('questionCount').get(function(this: IPsychometricTestDocument) {
  return this.questions ? this.questions.length : 0;
});

// Static methods
psychometricTestSchema.statics.findActiveTests = function(): Promise<IPsychometricTestDocument[]> {
  return this.find({ isActive: true })
    .populate('createdBy', 'firstName lastName')
    .sort({ createdAt: -1 });
};

psychometricTestSchema.statics.findByType = function(type: PsychometricTestType): Promise<IPsychometricTestDocument[]> {
  return this.find({ type, isActive: true })
    .populate('createdBy', 'firstName lastName')
    .sort({ createdAt: -1 });
};

psychometricTestSchema.statics.findByIndustry = function(industry: string): Promise<IPsychometricTestDocument[]> {
  return this.find({ 
    industry: new RegExp(industry, 'i'), 
    isActive: true 
  })
    .populate('createdBy', 'firstName lastName')
    .sort({ createdAt: -1 });
};

psychometricTestSchema.statics.findByJobRole = function(jobRole: string): Promise<IPsychometricTestDocument[]> {
  return this.find({ 
    jobRole: new RegExp(jobRole, 'i'), 
    isActive: true 
  })
    .populate('createdBy', 'firstName lastName')
    .sort({ createdAt: -1 });
};

export const PsychometricTest = mongoose.model<IPsychometricTestDocument, IPsychometricTestModel>('PsychometricTest', psychometricTestSchema);