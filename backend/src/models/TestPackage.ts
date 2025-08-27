import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITestPackageDocument extends Document {
  name: string;
  description: string;
  level: 'basic' | 'standard' | 'premium' | 'enterprise';
  price: number;
  currency: string;
  features: {
    questionCount: number;
    timeLimit: number;
    attempts: number;
    validityDays: number;
    industrySpecific: boolean;
    detailedReports: boolean;
    comparativeAnalysis: boolean;
    certificateIncluded: boolean;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITestPackageModel extends Model<ITestPackageDocument> {
  findActivePackages(): Promise<ITestPackageDocument[]>;
  findByLevel(level: string): Promise<ITestPackageDocument | null>;
}

const testPackageSchema = new Schema<ITestPackageDocument>({
  name: {
    type: String,
    required: [true, 'Package name is required'],
    trim: true,
    maxlength: [100, 'Package name cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Package description is required'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  level: {
    type: String,
    enum: ['basic', 'standard', 'premium', 'enterprise'],
    required: [true, 'Package level is required']
  },
  price: {
    type: Number,
    required: [true, 'Package price is required'],
    min: [0, 'Price cannot be negative']
  },
  currency: {
    type: String,
    required: [true, 'Currency is required'],
    uppercase: true,
    default: 'RWF'
  },
  features: {
    questionCount: {
      type: Number,
      required: [true, 'Question count is required'],
      min: [10, 'Minimum 10 questions required'],
      max: [200, 'Maximum 200 questions allowed']
    },
    timeLimit: {
      type: Number,
      required: [true, 'Time limit is required'],
      min: [15, 'Minimum 15 minutes required'],
      max: [180, 'Maximum 180 minutes allowed']
    },
    attempts: {
      type: Number,
      required: [true, 'Attempts count is required'],
      min: [1, 'Minimum 1 attempt required'],
      max: [10, 'Maximum 10 attempts allowed']
    },
    validityDays: {
      type: Number,
      required: [true, 'Validity period is required'],
      min: [7, 'Minimum 7 days validity required'],
      max: [365, 'Maximum 365 days validity allowed']
    },
    industrySpecific: {
      type: Boolean,
      default: false
    },
    detailedReports: {
      type: Boolean,
      default: false
    },
    comparativeAnalysis: {
      type: Boolean,
      default: false
    },
    certificateIncluded: {
      type: Boolean,
      default: false
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function(_doc, ret: any) {
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes
testPackageSchema.index({ level: 1 });
testPackageSchema.index({ isActive: 1 });
testPackageSchema.index({ price: 1 });

// Static methods
testPackageSchema.statics.findActivePackages = function(): Promise<ITestPackageDocument[]> {
  return this.find({ isActive: true }).sort({ price: 1 });
};

testPackageSchema.statics.findByLevel = function(level: string): Promise<ITestPackageDocument | null> {
  return this.findOne({ level, isActive: true });
};

export const TestPackage = mongoose.model<ITestPackageDocument, ITestPackageModel>('TestPackage', testPackageSchema);