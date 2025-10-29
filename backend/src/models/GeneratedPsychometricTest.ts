import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IGeneratedPsychometricTestDocument extends Document {
  testId: string;
  jobId: string;
  userId: string;
  title: string;
  description: string;
  type: string;
  questions: Array<{
    id: string;
    number: number;
    question: string;
    type: string;
    options?: string[];
    scaleRange?: { min: number; max: number; labels: string[] };
    matchingPairs?: { columnA: string[]; columnB: string[] };
    correctAnswer?: string | number;
    correctMatches?: Record<string, string>;
    traits: string[];
    weight: number;
    explanation?: string;
  }>;
  timeLimit: number;
  industry: string;
  jobRole: string;
  difficulty: string;
  categories: string[];
  jobSpecific: boolean;
  generatedAt: Date;
  expiresAt: Date;
  isActive: boolean;
  metadata: {
    jobTitle: string;
    jobDescription: string;
    requiredSkills: string[];
    experienceLevel: string;
    selectedCategories?: string[];
  };
}

export interface IGeneratedPsychometricTestModel extends Model<IGeneratedPsychometricTestDocument> {
  findByJobAndUser(jobId: string, userId: string): Promise<IGeneratedPsychometricTestDocument | null>;
  findActiveByTestId(testId: string): Promise<IGeneratedPsychometricTestDocument | null>;
  cleanupExpired(): Promise<void>;
  getPreviousQuestionsByUser(jobId: string, userId: string): Promise<string[]>;
}

const generatedTestQuestionSchema = new Schema({
  id: {
    type: String,
    required: true
  },
  number: {
    type: Number,
    required: true
  },
  question: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['multiple_choice', 'scale', 'true_false', 'scenario', 'matching', 'likert_scale'],
    required: true
  },
  options: [{
    type: String,
    trim: true
  }],
  scaleRange: {
    min: { type: Number, default: 1 },
    max: { type: Number, default: 5 },
    labels: [{ type: String, trim: true }]
  },
  matchingPairs: {
    columnA: [{ type: String, trim: true }],
    columnB: [{ type: String, trim: true }]
  },
  correctAnswer: Schema.Types.Mixed,
  correctMatches: {
    type: Map,
    of: String
  },
  traits: [{
    type: String,
    trim: true
  }],
  weight: {
    type: Number,
    default: 1,
    min: 0.1,
    max: 10
  },
  explanation: {
    type: String,
    trim: true
  }
}, { _id: false });

const generatedPsychometricTestSchema = new Schema<IGeneratedPsychometricTestDocument>({
  testId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  jobId: {
    type: Schema.Types.ObjectId,
    ref: 'Job',
    required: true,
    index: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
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
  type: {
    type: String,
    required: true,
    enum: ['personality', 'cognitive', 'aptitude', 'skills', 'behavioral', 'comprehensive']
  },
  questions: {
    type: [generatedTestQuestionSchema],
    required: true,
    validate: {
      validator: function(questions: any[]) {
        return questions && questions.length > 0;
      },
      message: 'Test must have at least one question'
    }
  },
  timeLimit: {
    type: Number,
    required: true,
    min: 5,
    max: 180
  },
  industry: {
    type: String,
    trim: true
  },
  jobRole: {
    type: String,
    trim: true
  },
  difficulty: {
    type: String,
    enum: ['easy', 'moderate', 'hard'],
    default: 'moderate'
  },
  categories: [{
    type: String,
    trim: true
  }],
  jobSpecific: {
    type: Boolean,
    default: true
  },
  generatedAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    default: function() {
      // Expire after 30 days
      return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    },
    index: { expireAfterSeconds: 0 }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  metadata: {
    jobTitle: { type: String, required: true },
    jobDescription: { type: String, required: true },
    requiredSkills: [{ type: String }],
    experienceLevel: { type: String, required: true },
    selectedCategories: [{ type: String }]
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

// Compound indexes
generatedPsychometricTestSchema.index({ jobId: 1, userId: 1 });
generatedPsychometricTestSchema.index({ testId: 1, isActive: 1 });
generatedPsychometricTestSchema.index({ expiresAt: 1 });

// Static methods
generatedPsychometricTestSchema.statics.findByJobAndUser = function(
  jobId: string, 
  userId: string
): Promise<IGeneratedPsychometricTestDocument | null> {
  return this.findOne({ 
    jobId, 
    userId, 
    isActive: true,
    expiresAt: { $gt: new Date() }
  });
};

generatedPsychometricTestSchema.statics.findActiveByTestId = function(
  testId: string
): Promise<IGeneratedPsychometricTestDocument | null> {
  return this.findOne({ 
    testId, 
    isActive: true,
    expiresAt: { $gt: new Date() }
  }).populate('jobId', 'title company status');
};

generatedPsychometricTestSchema.statics.cleanupExpired = function(): Promise<void> {
  return this.deleteMany({ 
    expiresAt: { $lt: new Date() } 
  });
};

generatedPsychometricTestSchema.statics.getPreviousQuestionsByUser = async function(
  jobId: string, 
  userId: string
): Promise<string[]> {
  const previousTests = await this.find({ 
    jobId, 
    userId, 
    isActive: true,
    expiresAt: { $gt: new Date() }
  }).select('questions.question').lean();

  const allQuestions: string[] = [];
  previousTests.forEach(test => {
    if (test.questions) {
      test.questions.forEach(q => {
        if (q.question) {
          allQuestions.push(q.question);
        }
      });
    }
  });

  return allQuestions;
};

export const GeneratedPsychometricTest = mongoose.model<IGeneratedPsychometricTestDocument, IGeneratedPsychometricTestModel>(
  'GeneratedPsychometricTest', 
  generatedPsychometricTestSchema
);